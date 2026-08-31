// StudyHub API Lambda — Phase 1 skeleton.
// Routes (HTTP API v2 payload):
//   GET /v1/health                    public
//   GET /v1/me                        JWT-authorized
//   GET /v1/progress/{certId}         JWT-authorized
//   PUT /v1/progress/{certId}         JWT-authorized
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const CERT_IDS = new Set(['cloud-practitioner', 'ai-practitioner']);
const MAX_PROGRESS_BYTES = 16 * 1024;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const claimsOf = (event) => event.requestContext?.authorizer?.jwt?.claims || {};

exports.handler = async (event) => {
  const routeKey = event.routeKey;
  try {
    switch (routeKey) {
      case 'GET /v1/health':
        return json(200, { ok: true, service: 'study-hub-api', phase: 1 });

      case 'GET /v1/me': {
        const claims = claimsOf(event);
        const sub = claims.sub;
        if (!sub) return json(401, { error: 'Unauthorized' });

        const [profile, entitlements] = await Promise.all([
          ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${sub}`, SK: 'PROFILE' } })),
          ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${sub}`, SK: 'ENTITLEMENTS' } })),
        ]);
        return json(200, {
          sub,
          email: claims.email || null,
          profile: profile.Item || null,
          entitlements: entitlements.Item?.certs || [],
        });
      }

      case 'GET /v1/progress/{certId}': {
        const sub = claimsOf(event).sub;
        const certId = event.pathParameters?.certId;
        if (!sub) return json(401, { error: 'Unauthorized' });
        if (!CERT_IDS.has(certId)) return json(404, { error: 'Unknown certification' });

        const result = await ddb.send(
          new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${sub}`, SK: `PROGRESS#${certId}` } })
        );
        return json(200, { certId, progress: result.Item?.stats || null });
      }

      case 'PUT /v1/progress/{certId}': {
        const sub = claimsOf(event).sub;
        const certId = event.pathParameters?.certId;
        if (!sub) return json(401, { error: 'Unauthorized' });
        if (!CERT_IDS.has(certId)) return json(404, { error: 'Unknown certification' });
        if (!event.body || event.body.length > MAX_PROGRESS_BYTES) {
          return json(400, { error: 'Body missing or too large' });
        }

        let stats;
        try {
          stats = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);
        } catch {
          return json(400, { error: 'Invalid JSON' });
        }
        if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) {
          return json(400, { error: 'Progress must be an object' });
        }

        await ddb.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${sub}`,
              SK: `PROGRESS#${certId}`,
              certId,
              stats,
              updatedAt: new Date().toISOString(),
            },
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
