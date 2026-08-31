// Cognito pre-token-generation trigger.
// Injects the user's paid entitlements (from DynamoDB) into every issued
// JWT as a comma-separated `entitlements` claim — the AWS analog of
// Firebase custom claims. The Stripe webhook (Phase 3) writes the
// ENTITLEMENTS item; clients and the API trust only this claim.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  const sub = event.request?.userAttributes?.sub || event.userName;
  let certs = [];

  try {
    const result = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${sub}`, SK: 'ENTITLEMENTS' } })
    );
    certs = Array.isArray(result.Item?.certs) ? result.Item.certs : [];
  } catch (err) {
    // Fail open with no entitlements rather than blocking sign-in
    console.error('[pre-token] Entitlement lookup failed:', err);
  }

  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        entitlements: certs.join(','),
      },
    },
  };
  return event;
};
