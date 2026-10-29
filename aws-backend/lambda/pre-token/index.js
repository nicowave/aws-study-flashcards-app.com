// Cognito pre-token-generation trigger. Runs on every sign-in and token refresh.
//
// 1. Resolves the app user ID ("uid"). Accounts copied from Firebase keep their
//    Firebase uid, so progress and purchases carry over. The copy script writes
//    the links: GOOGLE#<Google account ID> for Google sign-ins (Firebase stored
//    no email for those) and EMAIL#<email> for password accounts. Otherwise the
//    first verified sign-in with an email claims it for its own sub, so a Google
//    sign-in and a password account with the same email share data.
// 2. Adds the entitlement claims the apps read, same names as the old Firebase
//    custom claims: plan ('pro' = all-access) and certs ('cert-a,cert-b').
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Google's permanent account ID, from the federated identity (or the
// "google_<id>" username Cognito gives federated users).
const googleIdOf = (event) => {
  try {
    const identities = JSON.parse(event.request?.userAttributes?.identities || '[]');
    const google = identities.find((i) => i.providerName === 'Google');
    if (google?.userId) return String(google.userId);
  } catch {
    // fall through to the username
  }
  return (event.userName || '').match(/^google_(.+)$/i)?.[1] || null;
};

async function resolveUid(event) {
  const attrs = event.request?.userAttributes || {};
  const sub = attrs.sub;
  const googleId = googleIdOf(event);
  if (googleId) {
    const link = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `GOOGLE#${googleId}`, SK: 'UID' } }));
    if (link.Item?.uid) return link.Item.uid;
  }

  const email = (attrs.email || '').trim().toLowerCase();
  // Google only signs in people who own the address.
  const verified = attrs.email_verified === 'true' || !!googleId;
  if (!email || !verified) return sub;

  const key = { PK: `EMAIL#${email}`, SK: 'UID' };
  const existing = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key }));
  if (existing.Item?.uid) return existing.Item.uid;

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...key, uid: sub, source: 'cognito', createdAt: new Date().toISOString() },
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );
    return sub;
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') throw err;
    // Another sign-in claimed the email at the same moment; use its uid.
    const winner = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key, ConsistentRead: true }));
    return winner.Item?.uid || sub;
  }
}

exports.handler = async (event) => {
  const sub = event.request?.userAttributes?.sub;
  let uid = sub;
  const claims = {};

  try {
    uid = await resolveUid(event);
    const ent = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${uid}`, SK: 'ENTITLEMENTS' } })
    );
    if (ent.Item?.allAccess) claims.plan = 'pro';
    const certs = Array.isArray(ent.Item?.certs) ? ent.Item.certs : [];
    if (certs.length) claims.certs = certs.join(',');
  } catch (err) {
    // Fail open (no paid claims) rather than blocking sign-in
    console.error('[pre-token] Lookup failed:', err);
  }

  claims.uid = uid;
  event.response = { claimsOverrideDetails: { claimsToAddOrOverride: claims } };
  return event;
};
