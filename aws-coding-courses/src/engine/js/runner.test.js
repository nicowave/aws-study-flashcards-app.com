// The server-side JavaScript runner and the pretend AWS SDK behave like
// Node.js and the real SDK v3 they stand in for.
import { describe, it, expect, beforeAll } from 'vitest';
import { nodeRunner, prepareFiles } from './nodeJs';

let r;
beforeAll(() => { r = nodeRunner(); });

const run = async (code, { scenario = {}, path = 'index.mjs', invoke, probe, extra = {} } = {}) => {
  await r.reset({ scenario });
  const prepared = await prepareFiles({ [path]: code, ...extra });
  return { ...(await r.run({ path, files: prepared.files, lineMaps: prepared.lineMaps, invoke, probe })), diagnostics: prepared.diagnostics };
};

describe('running modules', () => {
  it('prints like Node, imports other files, and waits for timers', async () => {
    const res = await run(`import { double } from './math.mjs';
console.log('hi', double(21), { a: [1, 'x'] });
setTimeout(() => console.error('later'), 30);`, { extra: { 'math.mjs': 'export const double = (n) => n * 2;' } });
    expect(res.error).toBeNull();
    expect(res.stdout).toBe("hi 42 { a: [ 1, 'x' ] }\n");
    expect(res.stderr).toBe('later\n');
  });

  it('names the learner file and line in errors, with a tip', async () => {
    const res = await run('const card = undefined;\n\nconsole.log(card.front);');
    expect(res.error).toMatchObject({ type: 'TypeError', line: 3, file: 'index.mjs' });
    expect(res.stderr).toContain('index.mjs:3');
    expect(res.transcript.some((c) => c.stream === 'tip')).toBe(true);
  });

  it('explains packages it does not have', async () => {
    const res = await run("import axios from 'axios';");
    expect(res.error.message).toContain("Cannot find package 'axios'");
  });

  it('gives process.env from the scenario and a pretend fetch', async () => {
    const res = await run(`const r = await fetch('https://status.example.com/api.json');
console.log(process.env.TABLE, r.status, (await r.json()).ok);
try { await fetch('https://nowhere.example.org'); } catch (e) { console.log(e.name, e.message); }
try { await fetch('https://slow.example.com', { signal: AbortSignal.timeout(50) }); } catch (e) { console.log(e.name); }`, {
      scenario: { env: { TABLE: 'Progress' }, web: { 'https://status.example.com/api.json': { json: { ok: true } }, 'https://slow.example.com': { hang: true } } },
    });
    expect(res.stdout).toBe('Progress 200 true\nTypeError Failed to fetch\nTimeoutError\n');
    expect(res.web.log).toHaveLength(3);
  });
});

describe('Lambda invocations', () => {
  it('calls the exported handler with the event and prints the response', async () => {
    const res = await run(`export const handler = async (event, context) => {
  console.log('path', event.rawPath, context.getRemainingTimeInMillis() > 0);
  return { statusCode: 200, body: JSON.stringify({ hello: event.queryStringParameters.name }) };
};`, { invoke: { event: { rawPath: '/hello', queryStringParameters: { name: 'Dana' } }, timeout: 10 } });
    expect(res.invoke.response).toEqual({ statusCode: 200, body: '{"hello":"Dana"}' });
    expect(res.transcript[0].text).toMatch(/^START RequestId/);
    expect(res.stdout).toBe('path /hello true\n');
  });

  it('reports a missing handler and a timeout the way Lambda does', async () => {
    let res = await run('export const handlr = async () => 1;', { invoke: { event: {} } });
    expect(res.invoke.error.type).toBe('Runtime.HandlerNotFound');
    res = await run('export const handler = () => new Promise(() => {});', { invoke: { event: {}, timeout: 0.2 } });
    expect(res.invoke.error.type).toBe('Sandbox.Timedout');
  });

  it('runs a probe with the module and a practice helper', async () => {
    const res = await run('export const add = (a, b) => a + b;', { probe: 'return [mod.add(2, 3), practice.apiEvent({ method: "POST", path: "/x", body: { a: 1 } }).requestContext.http.method];' });
    expect(res.probe).toEqual({ value: [5, 'POST'] });
  });
});

const TABLES = {
  aws: {
    dynamodb: { Progress: { key: ['userId', 'deck'], items: [{ userId: 'u1', deck: 'storage', score: 3 }] } },
    s3: { assets: Object.fromEntries(Array.from({ length: 1205 }, (_, n) => [`img/${String(n).padStart(4, '0')}.png`, 'x'])) },
    ses: { verified: ['team@example.com'] },
    cloudfront: { distributions: ['E2EXAMPLE'] },
  },
};

describe('pretend AWS SDK v3', () => {
  it('stores and reads items with the document client, with conditions and updates', async () => {
    const res = await run(`import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
await db.send(new PutCommand({ TableName: 'Progress', Item: { userId: 'u1', deck: 'compute', score: 1.5 } }));
try {
  await db.send(new PutCommand({ TableName: 'Progress', Item: { userId: 'u1', deck: 'storage', score: 0 }, ConditionExpression: 'attribute_not_exists(userId)' }));
} catch (e) { console.log(e.name, e.$metadata.httpStatusCode); }
const up = await db.send(new UpdateCommand({ TableName: 'Progress', Key: { userId: 'u1', deck: 'storage' }, UpdateExpression: 'SET score = score + :one, #s = :s', ExpressionAttributeNames: { '#s': 'seen' }, ExpressionAttributeValues: { ':one': 1, ':s': true }, ReturnValues: 'ALL_NEW' }));
console.log(up.Attributes.score, up.Attributes.seen);
const q = await db.send(new QueryCommand({ TableName: 'Progress', KeyConditionExpression: 'userId = :u AND begins_with(deck, :d)', ExpressionAttributeValues: { ':u': 'u1', ':d': 'st' } }));
console.log(q.Count, (await db.send(new GetCommand({ TableName: 'Progress', Key: { userId: 'zz', deck: 'x' } }))).Item);
try { await db.send(new PutCommand({ TableName: 'Nope', Item: { userId: 'a', deck: 'b' } })); } catch (e) { console.log(e.name); }
try { await new DynamoDBClient({}).send(new PutCommand({ TableName: 'Progress', Item: {} })); } catch (e) { console.log(e.constructor.name); }`, { scenario: TABLES });
    expect(res.error).toBeNull();
    expect(res.stdout).toBe('ConditionalCheckFailedException 400\n4 true\n1 undefined\nResourceNotFoundException\nTypeError\n');
    expect(res.aws.dynamodb.Progress).toHaveLength(2);
  });

  it('lists S3 in pages of 1000, and the paginator follows them', async () => {
    const res = await run(`import { S3Client, ListObjectsV2Command, GetObjectCommand, paginateListObjectsV2, NoSuchKey } from '@aws-sdk/client-s3';
const s3 = new S3Client({});
const first = await s3.send(new ListObjectsV2Command({ Bucket: 'assets' }));
let n = 0;
for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket: 'assets' })) n += page.Contents?.length ?? 0;
console.log(first.Contents.length, first.IsTruncated, n);
const obj = await s3.send(new GetObjectCommand({ Bucket: 'assets', Key: 'img/0001.png' }));
console.log(await obj.Body.transformToString());
try { await s3.send(new GetObjectCommand({ Bucket: 'assets', Key: 'nope' })); } catch (e) { console.log(e instanceof NoSuchKey, e.name); }`, { scenario: TABLES });
    expect(res.stdout).toBe('1000 true 1205\nx\ntrue NoSuchKey\n');
  });

  it('sends email only from verified addresses (the SES sandbox)', async () => {
    const res = await run(`import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
const ses = new SESv2Client({});
const mail = (from, to) => new SendEmailCommand({ FromEmailAddress: from, Destination: { ToAddresses: [to] }, Content: { Simple: { Subject: { Data: 'Hi' }, Body: { Text: { Data: 'Hello' } } } } });
await ses.send(mail('team@example.com', 'team@example.com'));
try { await ses.send(mail('me@gmail.com', 'team@example.com')); } catch (e) { console.log(e.name, e.message.includes('me@gmail.com')); }`, { scenario: TABLES });
    expect(res.stdout).toBe('MessageRejected true\n');
    expect(res.aws.ses.sent).toHaveLength(1);
  });

  it('creates CloudFront invalidations and checks quantities', async () => {
    const res = await run(`import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
const cf = new CloudFrontClient({});
const out = await cf.send(new CreateInvalidationCommand({ DistributionId: 'E2EXAMPLE', InvalidationBatch: { CallerReference: 'x', Paths: { Quantity: 1, Items: ['/*'] } } }));
console.log(out.Invalidation.Status, out.$metadata.httpStatusCode);
try { await cf.send(new CreateInvalidationCommand({ DistributionId: 'E2EXAMPLE', InvalidationBatch: { CallerReference: 'y', Paths: { Quantity: 2, Items: ['/*'] } } })); } catch (e) { console.log(e.name); }`, { scenario: TABLES });
    expect(res.stdout).toBe('InProgress 201\nInconsistentQuantities\n');
  });
});

describe('the console', () => {
  it('keeps variables between lines, awaits, and sees the last run\'s exports', async () => {
    await r.reset({ scenario: TABLES });
    await r.run({ path: 'index.mjs', files: { 'index.mjs': 'export const greet = (n) => `hi ${n}`;' } });
    let res = await r.cell({ source: 'const x = 40' });
    res = await r.cell({ source: 'x + 2' });
    expect(res.stdout).toBe('42\n');
    res = await r.cell({ source: "greet('Dana')" });
    expect(res.stdout).toBe("'hi Dana'\n");
    res = await r.cell({ source: "import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';\n(await new STSClient({}).send(new GetCallerIdentityCommand({}))).Account" });
    expect(res.stdout).toBe("'111122223333'\n");
    res = await r.cell({ source: 'nope + 1' });
    expect(res.error.type).toBe('ReferenceError');
  });
});

describe('TypeScript', () => {
  it('type-checks in strict mode, still runs, and maps errors to the TypeScript lines', async () => {
    const res = await run(`interface Card { front: string; back: string }

const cards: Card[] = [{ front: 'S3', back: 'Storage' }];
console.log(cards[0].fornt);
const n: number = cards.length;
console.log(n);`, { path: 'app.ts' });
    expect(res.diagnostics).toHaveLength(1);
    expect(res.diagnostics[0]).toMatchObject({ code: 2551, line: 4, file: 'app.ts' });
    expect(res.diagnostics[0].text).toMatch(/^app\.ts\(4,\d+\): error TS2551/);
    expect(res.stdout).toBe('undefined\n1\n');
  });

  it('knows the SDK\'s types, so send() returns typed output', async () => {
    const res = await run(`import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const out = await db.send(new GetCommand({ TableName: process.env.TABLE ?? 'Progress', Key: { userId: 'u1', deck: 'storage' } }));
  const score: number = out.Item?.score ?? 0;
  return { statusCode: 200, body: JSON.stringify({ score, path: event.rawPath }) };
};`, { path: 'index.ts', scenario: TABLES, invoke: { event: { rawPath: '/p' }, timeout: 5 } });
    expect(res.diagnostics).toEqual([]);
    expect(res.invoke.response).toEqual({ statusCode: 200, body: '{"score":3,"path":"/p"}' });
  });

  it('catches wrong SDK input with a type error', async () => {
    const res = await run(`import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({});
const out = await s3.send(new GetObjectCommand({ bucket: 'assets', Key: 'a' }));
console.log(out.Body);`, { path: 'index.ts', scenario: TABLES });
    expect(res.diagnostics.map((d) => d.code)).toContain(2561);
  });

  it('synthesizes a CDK app into a template', async () => {
    const res = await run(`import { App, Stack, StackProps, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
class TrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const table = new dynamodb.Table(this, 'Progress', { partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING }, billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, removalPolicy: RemovalPolicy.DESTROY });
    const fn = new lambda.Function(this, 'Api', { runtime: lambda.Runtime.NODEJS_22_X, handler: 'index.handler', code: lambda.Code.fromAsset('lambda'), timeout: Duration.seconds(10), environment: { TABLE: table.tableName } });
    table.grantReadWriteData(fn);
    new CfnOutput(this, 'TableName', { value: table.tableName });
  }
}
const app = new App();
new TrackerStack(app, 'StudyTracker');
app.synth();`, { path: 'app.ts' });
    expect(res.diagnostics).toEqual([]);
    expect(res.error).toBeNull();
    const t = res.cdk.stacks.StudyTracker;
    const types = Object.values(t.Resources).map((x) => x.Type);
    expect(types).toEqual(expect.arrayContaining(['AWS::DynamoDB::Table', 'AWS::Lambda::Function', 'AWS::IAM::Role', 'AWS::IAM::Policy']));
    expect(t.Outputs.TableName.Value).toEqual({ Ref: expect.stringMatching(/^Progress[0-9A-F]{8}$/) });
    expect(res.transcript.some((c) => c.text.includes('Synthesized stack StudyTracker'))).toBe(true);
  });

  it('turns a wrong CDK prop into a type error', async () => {
    const res = await run(`import { App, Stack } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
const app = new App();
const stack = new Stack(app, 'S');
new Table(stack, 'T', { partitionKey: { name: 'id', type: AttributeType.STRING }, billing: 'cheap' });`, { path: 'app.ts' });
    expect(res.diagnostics.map((d) => d.code)).toContain(2353);
  });
});
