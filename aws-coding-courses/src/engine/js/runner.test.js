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

describe('presigned URLs for S3', () => {
  const PHOTOS = { aws: { s3: { 'study-photos': { 'uploads/ana/old.jpg': { size: 1200, contentType: 'image/jpeg', modified: '2026-11-20T18:02:11Z' } } } } };
  const SIGN = `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' });
export const put = (input, options) => getSignedUrl(s3, new PutObjectCommand({ Bucket: 'study-photos', ...input }), options);
export const get = (key, options) => getSignedUrl(s3, new GetObjectCommand({ Bucket: 'study-photos', Key: key }), options);
export const plain = (input) => getSignedUrl(new S3Client({}), new PutObjectCommand({ Bucket: 'study-photos', ...input }));
`;

  it('signs a URL shaped like the real SDK\'s, without calling AWS', async () => {
    const res = await run(SIGN, {
      scenario: PHOTOS,
      probe: `const url = await mod.put({ Key: 'uploads/ana/a b (1).jpg', ContentType: 'image/jpeg', ContentLength: 48211, Metadata: { Shot: 'whiteboard' } }, { expiresIn: 300, signableHeaders: new Set(['content-type']) });
const bare = await mod.put({ Key: 'k.jpg', ContentType: 'image/jpeg' });
const upper = await mod.put({ Key: 'k.jpg', ContentType: 'image/jpeg' }, { signableHeaders: new Set(['Content-Type']) });
const errors = [];
for (const bad of [() => mod.put({ Key: 'k' }, { expiresIn: 604801 }), () => mod.put({}), () => mod.put({ Key: 'k' }, { signableHeaders: ['content-type'] })]) {
  try { await bad(); errors.push(null); } catch (e) { errors.push(e.message); }
}
return { url, bare, upper, defaults: await mod.plain({ Key: 'k.jpg' }), get: await mod.get('k.jpg'), errors, calls: practice.aws().calls.length, presigned: practice.aws().presigned[0] };`,
    });
    expect(res.error).toBeNull();
    const { url, bare, upper, defaults, get, errors, calls, presigned } = res.probe.value;
    const [address, query] = url.split('?');
    expect(address).toBe('https://study-photos.s3.us-east-1.amazonaws.com/uploads/ana/a%20b%20%281%29.jpg');
    expect(query.split('&').map((p) => p.split('=')[0])).toEqual([
      'X-Amz-Algorithm', 'X-Amz-Content-Sha256', 'X-Amz-Credential', 'X-Amz-Date', 'X-Amz-Expires', 'X-Amz-Security-Token', 'X-Amz-Signature',
      'X-Amz-SignedHeaders', 'x-amz-meta-shot', 'x-id',
    ]);
    const params = new URL(url).searchParams;
    expect(params.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(params.get('X-Amz-Expires')).toBe('300');
    expect(params.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(params.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(params.get('X-Amz-Date')).toMatch(/^\d{8}T\d{6}Z$/);
    expect(params.get('x-id')).toBe('PutObject');
    // Like the real presigner: 15 minutes by default, and Content-Type is only signed when asked for (in lower case)
    expect(new URL(bare).searchParams.get('X-Amz-Expires')).toBe('900');
    expect(new URL(bare).searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    expect(new URL(upper).searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    // A client with default settings adds the SDK's checksum parameters
    expect(new URL(defaults).searchParams.get('x-amz-checksum-crc32')).toBe('AAAAAA==');
    expect(new URL(defaults).searchParams.get('x-amz-sdk-checksum-algorithm')).toBe('CRC32');
    expect(new URL(get).searchParams.get('x-id')).toBe('GetObject');
    expect(errors[0]).toMatch(/less than one week/);
    expect(errors[1]).toBe('No value provided for input HTTP label: Key.');
    expect(errors[2]).toBe('signableHeaders.has is not a function');
    expect(calls).toBe(0);
    expect(presigned).toMatchObject({ command: 'PutObjectCommand', key: 'uploads/ana/a b (1).jpg', expiresIn: 300, signedHeaders: ['content-length', 'content-type', 'host'] });
  });

  it('lets a PUT to the URL store the object, only as it was signed', async () => {
    const res = await run(SIGN, {
      scenario: PHOTOS,
      probe: `const sign = () => mod.put({ Key: 'uploads/ana/new.jpg', ContentType: 'image/jpeg', ContentLength: 2000 }, { expiresIn: 300, signableHeaders: new Set(['content-type']) });
const send = async (url, init) => { const r = await practice.fetch(url, init); const text = await r.text(); return [r.status, (text.match(/<Code>(.*?)<\\/Code>/) || [])[1] || text, r.headers.get('content-type')]; };
const out = {};
const url = await sign();
out.wrongType = await send(url, { method: 'PUT', headers: { 'Content-Type': 'text/html' }, body: new Uint8Array(2000) });
out.wrongSize = await send(url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(2001) });
out.wrongMethod = await send(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(2000) });
out.otherKey = await send(url.replace('new.jpg', 'old.jpg'), { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(2000) });
out.unsigned = await send(url.split('?')[0], { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(2000) });
out.before = Object.keys(practice.aws().s3['study-photos']);
out.good = await send(url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(2000) });
out.blob = await send(await sign(), { method: 'PUT', body: new Blob([new Uint8Array(2000)], { type: 'image/jpeg' }) });
out.expired = await send(await mod.put({ Key: 'uploads/ana/late.jpg' }, { expiresIn: 0 }), { method: 'PUT', body: 'x' });
const text = await mod.put({ Key: 'notes/hello.txt' });
out.text = await send(text, { method: 'PUT', body: 'héllo' });
out.read = await send(await mod.get('notes/hello.txt', { expiresIn: 60 }));
out.missing = await send(await mod.get('notes/nope.txt'));
out.nowhere = await practice.fetch('https://another-bucket.s3.us-east-1.amazonaws.com/a.jpg').then(() => 'answered', (e) => e.message);
out.log = practice.webLog.filter((e) => e.method === 'PUT').slice(-3).map((e) => [e.bodySize, e.sent['content-type'], e.result]);
return out;`,
    });
    expect(res.error).toBeNull();
    const out = res.probe.value;
    expect(out.wrongType).toEqual([403, 'SignatureDoesNotMatch', 'application/xml']);
    expect(out.wrongSize.slice(0, 2)).toEqual([403, 'SignatureDoesNotMatch']);
    expect(out.wrongMethod.slice(0, 2)).toEqual([403, 'SignatureDoesNotMatch']);
    expect(out.otherKey.slice(0, 2)).toEqual([403, 'SignatureDoesNotMatch']);
    expect(out.unsigned.slice(0, 2)).toEqual([403, 'AccessDenied']);
    expect(out.before).toEqual(['uploads/ana/old.jpg']);
    expect(out.good).toEqual([200, '', null]);
    expect(out.blob[0]).toBe(200); // a Blob's own type is the Content-Type a browser sends
    expect(out.expired.slice(0, 2)).toEqual([403, 'AccessDenied']);
    expect(out.text[0]).toBe(200);
    expect(out.read).toEqual([200, 'héllo', 'text/plain;charset=UTF-8']);
    expect(out.missing.slice(0, 2)).toEqual([404, 'NoSuchKey']);
    expect(out.nowhere).toBe('answered'); // S3 answers for every bucket name: see the next test
    expect(out.log).toEqual([[2000, 'image/jpeg', 200], [1, 'text/plain;charset=UTF-8', 403], [6, 'text/plain;charset=UTF-8', 200]]);
    expect(res.aws.s3['study-photos']['uploads/ana/new.jpg']).toMatchObject({ size: 2000, contentType: 'image/jpeg' });
    expect(res.aws.s3['study-photos']['notes/hello.txt']).toMatchObject({ size: 6, text: 'héllo' });
    expect(res.aws.s3['study-photos']['uploads/ana/late.jpg']).toBeUndefined();
    expect(res.aws.calls).toEqual([]);
  });

  it('refuses what the real presigner refuses, and signs the odd cases the same way', async () => {
    const res = await run(`${SIGN}
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
export const raw = getSignedUrl;
export const things = { s3, dynamo: new DynamoDBClient({}), list: new ListObjectsV2Command({ Bucket: 'study-photos' }), head: new HeadObjectCommand({ Bucket: 'study-photos', Key: 'k.jpg' }), noBucket: new PutObjectCommand({ Key: 'k' }) };`, {
      scenario: PHOTOS,
      probe: `const { s3, dynamo, list, head, noBucket } = mod.things;
const errors = {};
const refuse = async (name, fn) => { try { await fn(); errors[name] = null; } catch (e) { errors[name] = e.name + ': ' + e.message; } };
await refuse('otherClient', () => mod.raw(dynamo, head));
await refuse('noClient', () => mod.raw(undefined, head));
await refuse('plainInput', () => mod.raw(s3, { Bucket: 'study-photos', Key: 'k' }));
await refuse('list', () => mod.raw(s3, list));
await refuse('noBucket', () => mod.raw(s3, noBucket));
const param = (url, name) => new URL(url).searchParams.get(name);
return {
  errors,
  week: param(await mod.put({ Key: 'k' }, { expiresIn: 604800 }), 'X-Amz-Expires'),
  text: param(await mod.put({ Key: 'k' }, { expiresIn: '300' }), 'X-Amz-Expires'),
  zero: param(await mod.put({ Key: 'k' }, { expiresIn: 0 }), 'X-Amz-Expires'),
  emptyLength: param(await mod.put({ Key: 'k', ContentLength: 0 }), 'X-Amz-SignedHeaders'),
  noTypeToSign: param(await mod.put({ Key: 'k' }, { signableHeaders: new Set(['content-type']) }), 'X-Amz-SignedHeaders'),
  climbs: (await mod.put({ Key: 'uploads/carla/../ben/x.png' })).split('?')[0],
  headId: param(await mod.raw(s3, head), 'x-id'),
  getMode: param(await mod.get('k.jpg'), 'x-amz-checksum-mode'),
};`,
    });
    expect(res.error).toBeNull();
    const out = res.probe.value;
    expect(out.errors.otherClient).toMatch(/needs an S3Client first/);
    expect(out.errors.noClient).toMatch(/needs an S3Client first/);
    expect(out.errors.plainInput).toMatch(/needs an S3 command second/);
    expect(out.errors.list).toMatch(/can presign PutObjectCommand, GetObjectCommand, HeadObjectCommand and DeleteObjectCommand, not ListObjectsV2Command/);
    expect(out.errors.noBucket).toBe('Error: No value provided for input HTTP label: Bucket.');
    // As SDK 3.1179.0 does: a week is allowed, text counts as a number, 0 is signed (and expired at once)
    expect([out.week, out.text, out.zero]).toEqual(['604800', '300', '0']);
    expect(out.emptyLength).toBe('content-length;host');
    expect(out.noTypeToSign).toBe('host'); // nothing to sign when the command has no ContentType
    expect(out.climbs).toBe('https://study-photos.s3.us-east-1.amazonaws.com/uploads/ben/x.png');
    expect(out.headId).toBeNull(); // the SDK adds x-id for every operation except HeadObject
    expect(out.getMode).toBe('ENABLED');
  });

  it('answers the other requests the way S3 does: HEAD, DELETE, a second auth, buckets that are not yours', async () => {
    const res = await run(`${SIGN}
import { HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
export const sign = (Command, input, options) => getSignedUrl(s3, new Command({ Bucket: 'study-photos', ...input }), options);
export const other = (Bucket) => getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: 'a.jpg' }));
export const read = async (Key) => { const got = await s3.send(new GetObjectCommand({ Bucket: 'study-photos', Key })); return [got.ContentType, got.ContentLength, got.Metadata, await got.Body.transformToString()]; };
export { HeadObjectCommand, DeleteObjectCommand, PutObjectCommand, GetObjectCommand };`, {
      scenario: { aws: { ...PHOTOS.aws, s3Denied: ['someone-elses-bucket'] } },
      probe: `const send = async (url, init) => { const r = await practice.fetch(url, init); const text = await r.text(); return [r.status, (text.match(/<Code>(.*?)<\\/Code>/) || [])[1] || text, (text.match(/<Message>(.*?)<\\/Message>/) || [])[1] || '']; };
const out = {};
const OLD = { Key: 'uploads/ana/old.jpg' };
const head = await practice.fetch(await mod.sign(mod.HeadObjectCommand, OLD), { method: 'HEAD' });
out.head = [head.status, await head.text(), head.headers.get('content-length'), head.headers.get('content-type'), /GMT$/.test(head.headers.get('last-modified')), /^"/.test(head.headers.get('etag'))];
const missing = await practice.fetch(await mod.sign(mod.HeadObjectCommand, { Key: 'nope.jpg' }), { method: 'HEAD' });
out.headMissing = [missing.status, await missing.text()];
out.headUrlForGet = await send(await mod.sign(mod.HeadObjectCommand, OLD));
out.getUrlForPut = await send(await mod.sign(mod.GetObjectCommand, OLD), { method: 'PUT', body: 'x' });
out.twoAuths = await send(await mod.sign(mod.PutObjectCommand, { Key: 'auth.jpg' }), { method: 'PUT', headers: { Authorization: 'Bearer eyJ.token' }, body: 'x' });
out.afterTwoAuths = Object.keys(practice.aws().s3['study-photos']);
out.negative = await send(await mod.sign(mod.PutObjectCommand, { Key: 'k' }, { expiresIn: -5 }), { method: 'PUT', body: 'x' });
const odd = 'uploads/a+b &c/ñ ü?.jpg';
const oddUrl = await mod.sign(mod.PutObjectCommand, { Key: odd, Metadata: { Shot: 'whiteboard' } });
out.odd = await send(new URL(oddUrl).toString(), { method: 'PUT', body: 'one' });
out.again = await send(oddUrl, { method: 'PUT', body: 'second' }); // not single-use: the second upload replaces the first
out.sdkReads = await mod.read(odd);
out.bodyThroughJson = await practice.fetch(oddUrl, { method: 'PUT', body: 'x' }).then((r) => r.json()).catch((e) => e.name + ': ' + e.message);
const del = await mod.sign(mod.DeleteObjectCommand, OLD);
out.deleted = [await send(del, { method: 'DELETE' }), await send(del, { method: 'DELETE' }), 'uploads/ana/old.jpg' in practice.aws().s3['study-photos']];
out.noSuchBucket = await send(await mod.other('no-such-bucket-anywhere'), { method: 'PUT', body: 'x' });
out.notYours = await send(await mod.other('someone-elses-bucket'), { method: 'PUT', body: 'x' });
out.website = await practice.fetch('https://study-photos.s3-website-us-east-1.amazonaws.com/index.html').then(() => 'answered', (e) => e.message);
return out;`,
    });
    expect(res.error).toBeNull();
    const out = res.probe.value;
    expect(out.head).toEqual([200, '', '1200', 'image/jpeg', true, true]);
    expect(out.headMissing).toEqual([404, '']); // no body on an answer to HEAD, errors included
    expect(out.headUrlForGet.slice(0, 2)).toEqual([403, 'SignatureDoesNotMatch']);
    expect(out.getUrlForPut.slice(0, 2)).toEqual([403, 'SignatureDoesNotMatch']);
    expect(out.twoAuths).toEqual([400, 'InvalidArgument', 'Only one auth mechanism allowed; only the X-Amz-Algorithm query parameter, Signature query string parameter or the Authorization header should be specified']);
    expect(out.afterTwoAuths).toEqual(['uploads/ana/old.jpg']);
    expect(out.negative).toEqual([400, 'AuthorizationQueryParametersError', 'X-Amz-Expires must be non-negative']);
    expect(out.odd[0]).toBe(200);
    expect(out.again[0]).toBe(200);
    expect(out.sdkReads).toEqual(['text/plain;charset=UTF-8', 6, { shot: 'whiteboard' }, 'second']);
    expect(out.bodyThroughJson).toBe('SyntaxError: Unexpected end of JSON input'); // a successful PUT has an empty body
    expect(out.deleted).toEqual([[204, '', ''], [204, '', ''], false]);
    expect(out.noSuchBucket).toEqual([404, 'NoSuchBucket', 'The specified bucket does not exist']);
    expect(out.notYours).toEqual([403, 'AccessDenied', 'Access Denied']);
    expect(out.website).toBe('Failed to fetch'); // a website endpoint is not a bucket's API address
  });

  it('answers an address from the request with respond, per method', async () => {
    const res = await run(`const api = 'https://api.example.com/uploads';
const ask = async (init) => { const r = await fetch(api, init); return [r.status, await r.json()]; };
console.log(JSON.stringify(await ask({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size: 5 }) })));
console.log(JSON.stringify(await ask({ method: 'POST', body: JSON.stringify({ size: 500 }) })));
console.log(JSON.stringify(await ask()));
console.log(JSON.stringify(await ask()));`, {
      scenario: {
        web: {
          'POST https://api.example.com/uploads': { respond: "return request.json.size > 100 ? { status: 400, json: { message: 'Too big' } } : { json: { type: request.headers['content-type'], listed: s3.list('study-photos', 'uploads/').length } };" },
          'GET https://api.example.com/uploads': { sequence: [{ json: { n: 1 } }, { json: { n: 2 } }] },
        },
        ...PHOTOS,
      },
    });
    expect(res.stdout).toBe('[200,{"type":"application/json","listed":1}]\n[400,{"message":"Too big"}]\n[200,{"n":1}]\n[200,{"n":2}]\n');
  });

  it('knows the presigner\'s types in TypeScript', async () => {
    const res = await run(`import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' });
const url: string = await getSignedUrl(s3, new PutObjectCommand({ Bucket: 'study-photos', Key: 'a.jpg', ContentType: 'image/jpeg', ContentLength: 10 }), { expiresIn: 300, signableHeaders: new Set(['content-type']) });
console.log(new URL(url).searchParams.get('X-Amz-Expires'));
await getSignedUrl(s3, new PutObjectCommand({ Bucket: 'study-photos', Key: 'a.jpg' }), { expires: 300 });`, { path: 'index.ts', scenario: PHOTOS });
    expect(res.diagnostics.map((d) => d.code)).toEqual([2561]); // 'expires' does not exist… did you mean 'expiresIn'?
    expect(res.stdout).toBe('300\n');
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
