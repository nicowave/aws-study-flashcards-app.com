// StudyHub API Lambda (HTTP API v2 payload). Replaces the apps' direct
// Firestore reads/writes. Every route except /v1/health sits behind the Cognito
// JWT authorizer; the user is the `uid` claim added by the pre-token trigger.
//   GET    /v1/health
//   GET    /v1/me                    profile + all progress + entitlements
//   PATCH  /v1/me                    { displayName?, avatar? }
//   DELETE /v1/me                    delete data + the Cognito user
//   GET    /v1/progress/{certId}
//   PUT    /v1/progress/{certId}     body = the game's stats object
//
// Items (PK = USER#<uid>): PROFILE, PROGRESS#<certId>, ENTITLEMENTS, BILLING,
// PURCHASE#<plan>. EMAIL#<email>/UID links sign-ins to a uid.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const TABLE_NAME = process.env.TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const cognito = new CognitoIdentityProviderClient({});

const CERT_IDS = new Set([
  'cloud-practitioner',
  'ai-practitioner',
  'solutions-architect-associate',
  'developer-associate',
  // Coding courses keep their progress the same way
  'bash-for-aws',
  'python-for-aws',
  'javascript-for-aws',
  'typescript-for-aws',
]);
const MAX_PROGRESS_BYTES = 16 * 1024;
const MAX_PROFILE_BYTES = 256 * 1024; // avatar images are small JPEG data URLs
const AVATAR_TYPES = new Set(['initials', 'emoji', 'pattern', 'image']);

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const claimsOf = (event) => event.requestContext?.authorizer?.jwt?.claims || {};
const uidOf = (claims) => claims.uid || claims.sub;
const isGoogle = (claims) =>
  /^google_/i.test(String(claims['cognito:username'] || '')) || String(claims.identities || '').includes('Google');

const parseBody = (event, maxBytes) => {
  if (!event.body || event.body.length > maxBytes) return { error: 'Body missing or too large' };
  try {
    const value = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { error: 'Body must be an object' };
    return { value };
  } catch {
    return { error: 'Invalid JSON' };
  }
};

// Same style as the apps' old Google sign-up names, e.g. "CloudLearner_7a3f"
const randomUsername = () => {
  const adjectives = ['Cloud', 'AWS', 'Nimbus', 'Cyber', 'Data', 'Sage', 'Tech', 'Nova', 'Flux', 'Arch'];
  const nouns = ['Learner', 'Builder', 'Pioneer', 'Explorer', 'Wizard', 'Ninja', 'Coder', 'Ace', 'Pro', 'Hero'];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${pick(adjectives)}${pick(nouns)}_${hex}`;
};

const emptyStats = () => ({
  totalXp: 0,
  level: 1,
  totalAnswered: 0,
  totalCorrect: 0,
  maxStreak: 0,
  sessionsCompleted: 0,
});

const allItems = async (uid) => {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': `USER#${uid}` },
        ExclusiveStartKey,
      })
    );
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

// First visit after sign-up: create the profile the old apps created in Firestore.
const createProfile = async (uid, claims) => {
  const google = isGoogle(claims);
  const email = claims.email || '';
  const profile = {
    PK: `USER#${uid}`,
    SK: 'PROFILE',
    email,
    displayName: google ? randomUsername() : claims.name || email.split('@')[0] || randomUsername(),
    createdAt: new Date().toISOString(),
    emailVerified: true,
    authProvider: google ? 'google' : 'password',
    stats: emptyStats(),
    certProgress: {},
  };
  try {
    await ddb.send(
      new PutCommand({ TableName: TABLE_NAME, Item: profile, ConditionExpression: 'attribute_not_exists(PK)' })
    );
    return profile;
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') throw err;
    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${uid}`, SK: 'PROFILE' }, ConsistentRead: true })
    );
    return existing.Item;
  }
};

const stripKeys = ({ PK, SK, ...rest }) => rest;

async function getMe(uid, claims) {
  const items = await allItems(uid);
  let profile = items.find((i) => i.SK === 'PROFILE');
  if (!profile) profile = await createProfile(uid, claims);

  const progress = {};
  for (const item of items) {
    if (item.SK.startsWith('PROGRESS#')) progress[item.certId] = { ...item.stats, certId: item.certId, lastUpdated: item.updatedAt };
  }
  const ent = items.find((i) => i.SK === 'ENTITLEMENTS');
  return {
    uid,
    profile: stripKeys(profile),
    progress,
    entitlements: { allAccess: !!ent?.allAccess, certs: ent?.certs || [] },
  };
}

async function patchMe(uid, claims, body) {
  const sets = [];
  const values = {};
  const names = {};

  if (body.displayName !== undefined) {
    const name = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (name.length < 2 || name.length > 30) return json(400, { error: 'Display name must be 2 to 30 characters' });
    sets.push('#displayName = :displayName');
    names['#displayName'] = 'displayName';
    values[':displayName'] = name;
  }
  if (body.avatar !== undefined) {
    const a = body.avatar;
    if (!a || typeof a !== 'object' || !AVATAR_TYPES.has(a.type)) return json(400, { error: 'Invalid avatar' });
    sets.push('#avatar = :avatar');
    names['#avatar'] = 'avatar';
    values[':avatar'] = { type: a.type, value: a.value ?? null, bgColor: a.bgColor ?? null };
  }
  if (!sets.length) return json(400, { error: 'Nothing to update' });

  // Make sure the profile exists before updating parts of it
  await getMe(uid, claims);
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${uid}`, SK: 'PROFILE' },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
  return json(200, { ok: true });
}

async function deleteMe(uid, claims) {
  const items = await allItems(uid);
  for (let i = 0; i < items.length; i += 25) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: items.slice(i, i + 25).map(({ PK, SK }) => ({ DeleteRequest: { Key: { PK, SK } } })),
        },
      })
    );
  }
  const email = String(claims.email || '').toLowerCase();
  if (email) {
    await ddb
      .send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { PK: `EMAIL#${email}`, SK: 'UID' },
          ConditionExpression: 'uid = :uid',
          ExpressionAttributeValues: { ':uid': uid },
        })
      )
      .catch((err) => {
        if (err.name !== 'ConditionalCheckFailedException') throw err;
      });
  }
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: claims['cognito:username'] }));
  console.log('[api] Deleted account and', items.length, 'items');
  return json(200, { ok: true });
}

exports.handler = async (event) => {
  const routeKey = event.routeKey;
  try {
    if (routeKey === 'GET /v1/health') return json(200, { ok: true, service: 'study-hub-api', phase: 2 });

    const claims = claimsOf(event);
    const uid = uidOf(claims);
    if (!uid) return json(401, { error: 'Unauthorized' });

    switch (routeKey) {
      case 'GET /v1/me':
        return json(200, await getMe(uid, claims));

      case 'PATCH /v1/me': {
        const { value, error } = parseBody(event, MAX_PROFILE_BYTES);
        if (error) return json(400, { error });
        return await patchMe(uid, claims, value);
      }

      case 'DELETE /v1/me':
        return await deleteMe(uid, claims);

      case 'GET /v1/progress/{certId}': {
        const certId = event.pathParameters?.certId;
        if (!CERT_IDS.has(certId)) return json(404, { error: 'Unknown certification' });
        const result = await ddb.send(
          new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${uid}`, SK: `PROGRESS#${certId}` } })
        );
        const item = result.Item;
        return json(200, { certId, progress: item ? { ...item.stats, certId, lastUpdated: item.updatedAt } : null });
      }

      case 'PUT /v1/progress/{certId}': {
        const certId = event.pathParameters?.certId;
        if (!CERT_IDS.has(certId)) return json(404, { error: 'Unknown certification' });
        const { value, error } = parseBody(event, MAX_PROGRESS_BYTES);
        if (error) return json(400, { error });
        const { certId: _c, lastUpdated: _l, ...stats } = value;
        await ddb.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: { PK: `USER#${uid}`, SK: `PROGRESS#${certId}`, certId, stats, updatedAt: new Date().toISOString() },
          })
        );
        return json(200, { ok: true, certId });
      }

      default:
        return json(404, { error: `No handler for ${routeKey}` });
    }
  } catch (err) {
    console.error('[api] Error handling', routeKey, err);
    return json(500, { error: 'Internal error' });
  }
};
