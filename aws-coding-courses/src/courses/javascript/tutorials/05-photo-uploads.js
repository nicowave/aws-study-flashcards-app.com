// Tutorial 5: photos uploaded straight from the browser to Amazon S3 with
// presigned URLs. The page asks the API for permission, a Lambda function
// checks the request, picks the object key and signs a URL that allows one
// PUT of one type and size for five minutes, and the browser sends the file
// to S3 itself. Same sign-in as Tutorial 4 (Cognito, HTTP API, JWT authorizer).

const REGION = 'us-east-1';
const POOL_ID = 'us-east-1_Tr4ckEr42';
const CLIENT_ID = '5q7ms2a9tnk8examplec1ient';
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`;
const API = 'https://abc123.execute-api.us-east-1.amazonaws.com';
const BUCKET = 'study-photos-111122223333';
const BUCKET_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
const ANA = 'f81a2c3e-7b54-4d0a-9c61-3e5d2b8a1f07';
const BEN = '2c9e4b71-0d3f-4a86-b5e2-9a17c6d40e58';
const MAX_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Pretend sign-in tokens, built like Tutorial 4's: real JWT shape, made-up signatures
// ---------------------------------------------------------------------------

const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const HEADER = b64url({ kid: 'kTnXq3vLexample0AbCdEf1x2y3z=', alg: 'RS256' });
const SIGNATURE = 'Qm9ndXMtc2lnbmF0dXJlLW9ubHktZm9yLXByYWN0aWNl_x-Y2VfcGxlYXNlX2RvbnRfdHJ1c3RfbWU';
const ISSUED = 1795860000; // a fixed moment, so the tokens look the same every time
const jwt = (claims) => `${HEADER}.${b64url(claims)}.${SIGNATURE}`;
const ANA_ID_TOKEN = jwt({
  sub: ANA, email_verified: true, iss: ISSUER, 'cognito:username': 'ana', aud: CLIENT_ID, token_use: 'id',
  auth_time: ISSUED, exp: ISSUED + 3600, iat: ISSUED, jti: 'idtok-photos', email: 'ana@example.com',
});
const ANA_ACCESS_TOKEN = jwt({
  sub: ANA, iss: ISSUER, client_id: CLIENT_ID, token_use: 'access', scope: 'aws.cognito.signin.user.admin',
  auth_time: ISSUED, exp: ISSUED + 3600, iat: ISSUED, jti: 'acctok-photos', username: 'ana',
});

// ---------------------------------------------------------------------------
// What the practice bucket holds when a step opens
// ---------------------------------------------------------------------------

const ANA_OLD = `uploads/${ANA}/0b6f9d52-3c1a-4e7b-9f08-5a2d6c41e7b3.jpg`;
const ANA_NEWER = `uploads/${ANA}/7c1e44a0-92bd-4f36-8a5e-d0b3f1c2a964.png`;
const BEN_PHOTO = `uploads/${BEN}/e41b7a9c-58d2-4c03-b6f1-2a9e0d7c5b18.jpg`;
const STORED = {
  [ANA_OLD]: { size: 1843200, contentType: 'image/jpeg', modified: '2026-11-18T19:12:40.000Z' },
  [ANA_NEWER]: { size: 512300, contentType: 'image/png', modified: '2026-11-21T08:05:13.000Z' },
  [BEN_PHOTO]: { size: 2764800, contentType: 'image/jpeg', modified: '2026-11-20T21:40:02.000Z' },
};

// ---------------------------------------------------------------------------
// Step: choose a photo, and check it in the browser
// ---------------------------------------------------------------------------

const PICK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Photo notes</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Photo notes</h1>
    <label for="photo">Add a photo of your notes (JPEG, PNG or WebP, up to 5 MB)</label>
    <input id="photo" type="file" accept="image/jpeg,image/png,image/webp">
    <img id="preview" alt="The photo you chose" hidden>
    <p id="status" role="status"></p>
    <button id="upload" type="button" disabled>Upload</button>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const PHOTO_CSS = `body { font-family: system-ui, sans-serif; margin: 2rem; color: #1d2733; }
/* hidden must win: a display rule below (form, #preview) would show the element again */
[hidden] { display: none !important; }
main { max-width: 30rem; }
form { display: grid; gap: 0.7rem; }
label { display: grid; gap: 0.3rem; font-size: 0.9rem; }
input { padding: 0.45rem; font: inherit; }
button { padding: 0.45rem 1rem; margin-right: 0.4rem; font: inherit; }
button:disabled { opacity: 0.5; }
#preview { display: block; max-width: 12rem; max-height: 9rem; margin: 0.6rem 0; border-radius: 6px; }
#status { min-height: 1.2em; }
#status.ok { color: #1f7a3a; }
#status.error, #message { color: #b3261e; }
#uploads li { margin: 0.3rem 0; }`;

const PHOTO_HELPERS = `// $('#photo') is short for document.querySelector('#photo')
const $ = (sel) => document.querySelector(sel);

function showStatus(text, kind = '') {
  $('#status').textContent = text;
  $('#status').className = kind; // '', 'ok' or 'error' (see style.css)
}

// 2100000 -> '2.0 MB', 48211 -> '47 KB'
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return \`\${(bytes / (1024 * 1024)).toFixed(1)} MB\`;
  return \`\${Math.max(1, Math.round(bytes / 1024))} KB\`;
}

// Show the chosen photo, or hide the preview with showPreview(null). The
// address only works on this page: the file hasn't left the computer.
function showPreview(file) {
  const img = $('#preview');
  if (img.src) URL.revokeObjectURL(img.src); // let go of the photo shown before
  if (file) img.src = URL.createObjectURL(file);
  else img.removeAttribute('src');
  img.hidden = !file;
}`;

const CHECK_FILE = `// What's wrong with this file, in words for the person, or null when it's fine
function checkFile(file) {
  if (!file) return 'Choose a photo first.';
  if (!TYPES.includes(file.type)) return 'Photos must be JPEG, PNG or WebP.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_BYTES) return \`That photo is \${formatSize(file.size)}. The limit is 5 MB.\`;
  return null;
}`;

const ON_CHANGE = `$('#photo').addEventListener('change', () => {
  const file = $('#photo').files[0]; // undefined when nothing is chosen
  const problem = checkFile(file);
  if (problem) {
    showStatus(problem, 'error');
    showPreview(null);
    $('#upload').disabled = true;
    return;
  }
  showStatus(\`\${file.name} · \${formatSize(file.size)}\`);
  showPreview(file);
  $('#upload').disabled = false;
});`;

const PICK_HEAD = `// app.js: let someone choose a photo, and check it before anything is sent.
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, counted in bytes

${PHOTO_HELPERS}
`;

export const PICK_STARTER = `${PICK_HEAD}
// What's wrong with this file, in words for the person, or null when it's fine
function checkFile(file) {
  // TODO 1: no file at all:            'Choose a photo first.'
  // TODO 2: file.type isn't in TYPES:  'Photos must be JPEG, PNG or WebP.'
  // TODO 3: file.size is 0:            'That file is empty.'
  // TODO 4: file.size over MAX_BYTES:  \`That photo is \${formatSize(file.size)}. The limit is 5 MB.\`
  return null;
}

$('#photo').addEventListener('change', () => {
  const file = $('#photo').files[0]; // undefined when nothing is chosen
  // TODO 5: const problem = checkFile(file);
  //   a problem: showStatus(problem, 'error'), showPreview(null), Upload button off
  //   no problem: showStatus with the file's name and formatSize(file.size),
  //               showPreview(file), Upload button on ($('#upload').disabled = false)
});
`;

export const PICK_SOLUTION = `${PICK_HEAD}
${CHECK_FILE}

${ON_CHANGE}`;

const PICK_PROBE = `const state = () => ({
  text: practice.text('#status') || '',
  kind: practice.$('#status').className,
  off: practice.$('#upload').disabled,
  preview: !practice.$('#preview').hidden,
});
const out = {};
const choose = async (name, file) => { await practice.chooseFile('#photo', file); out[name] = state(); };
await choose('good', { name: 'whiteboard.jpg', type: 'image/jpeg', size: 2100000 });
await choose('pdf', { name: 'slides.pdf', type: 'application/pdf', size: 300000 });
await choose('big', { name: 'holiday.png', type: 'image/png', size: ${MAX_BYTES} + 1 });
await choose('limit', { name: 'exactly.webp', type: 'image/webp', size: ${MAX_BYTES} });
await choose('empty', { name: 'empty.jpg', type: 'image/jpeg', size: 0 });
await choose('again', { name: 'notes.jpg', type: 'image/jpeg', size: 48211 });
await choose('noExtension', { name: 'scan', type: 'image/png', size: 300000 });
await choose('none');
out.errors = practice.errors.map((e) => e.message || e.text || '');
return out;`;

const checkPick = ({ probe, probeError }) => {
  if (probeError || !probe) return null;
  const { good, pdf, big, limit, empty, again, noExtension, none } = probe;
  if (probe.errors.length) {
    return /reading '(type|size|name)'|undefined/.test(probe.errors.join(' '))
      ? 'The page crashed when the selection was emptied (some browsers do that when the file dialog is canceled). Then there is no file, and $(\'#photo\').files[0] is undefined. Deal with "no file" before reading its type or size.'
      : null;
  }
  if (good.off) return 'A 2 MB JPEG is a fine photo, but the Upload button stays off. In the change listener, switch it on when checkFile finds no problem.';
  if (/error/.test(good.kind)) return 'A good photo is shown as an error. Only use the \'error\' kind when checkFile returns a problem.';
  if (!/whiteboard\.jpg/.test(good.text) || !/\d/.test(good.text.replace('whiteboard.jpg', ''))) return 'For a good photo, show which file was chosen: its name and formatSize(file.size).';
  if (!pdf.off) return 'A PDF was chosen after a good photo, and the Upload button is still on. checkFile should refuse any file.type that isn\'t in TYPES, and the listener should switch the button off when there\'s a problem.';
  if (!pdf.text || pdf.text === good.text) return 'A PDF is refused, but the person isn\'t told why. Show the problem with showStatus(problem, \'error\').';
  if (!/error/.test(pdf.kind)) return 'Show a problem in the \'error\' kind, so it turns red: showStatus(problem, \'error\').';
  if (!big.off) return 'A photo one byte over 5 MB got through. Compare file.size with MAX_BYTES.';
  if (limit.off) return 'A photo of exactly 5 MB is allowed: refuse sizes over MAX_BYTES (>), not the limit itself.';
  if (!empty.off) return 'An empty file (0 bytes) got through. Nobody means to upload that: refuse it.';
  if (again.off || /error/.test(again.kind)) return 'After a refused file, choosing a good one should clear the error and switch the button on again.';
  if (noExtension.off) return 'A PNG whose name has no extension ("scan") was refused. Decide by file.type, which is what TYPES lists, not by the letters in the file\'s name.';
  if (!none.off) return 'The check emptied the selection (some browsers do that when the file dialog is canceled). There is no file any more, but the Upload button is still on. checkFile(undefined) should report a problem.';
  if (!good.preview || pdf.preview || none.preview) return 'Show the preview for a good photo with showPreview(file), and hide it again with showPreview(null) when there\'s a problem.';
  return true;
};

// ---------------------------------------------------------------------------
// Step: the rules the server applies
// ---------------------------------------------------------------------------

const RULES_HEAD = `// upload-rules.mjs: what may be uploaded, and where it goes.
// The browser asks. This file decides.
import { randomUUID } from 'node:crypto';

// The types we accept, and the file extension each one gets
export const TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
`;

const RULES_FUNCTIONS = `// What's wrong with a request to upload, in words for the person, or null.
// input is whatever the request's body held: { contentType, size }, or anything at all.
export function checkUpload(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return 'Send a JSON object';
  if (!TYPES.has(input.contentType)) return 'Photos must be JPEG, PNG or WebP.';
  if (!Number.isInteger(input.size) || input.size < 1) return 'size must be the file\\'s size in bytes';
  if (input.size > MAX_BYTES) return 'A photo can be at most 5 MB.';
  return null;
}

// Where this user's next photo goes: uploads/<userId>/<random ID>.<extension>
export function objectKey(userId, contentType) {
  return \`uploads/\${userId}/\${randomUUID()}.\${TYPES.get(contentType)}\`;
}`;

const RULES_TRY = `
// Try it: press Run, or call the functions in the console below
console.log(checkUpload({ contentType: 'image/jpeg', size: 2100000 }));
console.log(checkUpload({ contentType: 'text/html', size: 300 }));
console.log(objectKey('${ANA}', 'image/png'));
`;

export const RULES_STARTER = `${RULES_HEAD}
// What's wrong with a request to upload, in words for the person, or null.
// input is whatever the request's body held: { contentType, size }, or anything at all.
export function checkUpload(input) {
  // TODO 1: input must be an object (not null, not a list): 'Send a JSON object'
  // TODO 2: input.contentType must be one of TYPES: TYPES.has(...)
  // TODO 3: input.size must be a whole number (Number.isInteger), at least 1
  // TODO 4: and at most MAX_BYTES
  return null;
}

// Where this user's next photo goes: uploads/<userId>/<random ID>.<extension>
export function objectKey(userId, contentType) {
  // TODO 5: randomUUID() gives a new random ID each time; TYPES.get(contentType) is the extension
}
${RULES_TRY}`;

export const RULES_SOLUTION = `${RULES_HEAD}
${RULES_FUNCTIONS}
${RULES_TRY}`;

const RULES_FILE = `${RULES_HEAD}
${RULES_FUNCTIONS}
`;
const rulesFile = { path: 'upload-rules.mjs', starter: RULES_FILE, hidden: true };

const RULES_PROBE = `if (typeof mod.checkUpload !== 'function') return { missing: 'checkUpload' };
if (typeof mod.objectKey !== 'function') return { missing: 'objectKey' };
const good = { contentType: 'image/jpeg', size: 2100000 };
const cases = {
  good,
  smallest: { contentType: 'image/png', size: 1 },
  limit: { contentType: 'image/webp', size: ${MAX_BYTES} },
  html: { contentType: 'text/html', size: 300 },
  svg: { contentType: 'image/svg+xml', size: 300 },
  noType: { size: 300 },
  typeList: { contentType: ['image/jpeg'], size: 300 },
  builtIn: { contentType: 'toString', size: 300 },
  tooBig: { ...good, size: ${MAX_BYTES} + 1 },
  zero: { ...good, size: 0 },
  negative: { ...good, size: -5 },
  sizeAsText: { ...good, size: '2100000' },
  fraction: { ...good, size: 1000.5 },
  noSize: { contentType: 'image/jpeg' },
  nothing: null,
  list: [],
  text: 'image/jpeg',
};
const verdicts = {};
for (const [name, input] of Object.entries(cases)) {
  try { const v = mod.checkUpload(input); verdicts[name] = v === null || v === undefined ? 'ok' : typeof v === 'string' && v.trim() ? 'refused' : 'odd'; }
  catch (e) { verdicts[name] = 'threw ' + e.name + ': ' + e.message; }
}
const keys = {};
try {
  keys.png = mod.objectKey('user-123', 'image/png');
  keys.again = mod.objectKey('user-123', 'image/png');
  keys.jpg = mod.objectKey('user-9', 'image/jpeg');
  keys.webp = mod.objectKey('user-9', 'image/webp');
} catch (e) { keys.threw = e.name + ': ' + e.message; }
return { verdicts, keys };`;

const RULES_WHY = {
  html: 'a web page (text/html)', svg: 'an SVG (image/svg+xml isn\'t on the list)', noType: 'no contentType at all', typeList: 'a list instead of a type',
  builtIn: 'the "type" toString', tooBig: 'a file one byte over 5 MB', zero: 'a size of 0', negative: 'a size of -5', sizeAsText: 'the size as text ("2100000")',
  fraction: 'a size of 1000.5', noSize: 'no size at all', nothing: 'no input at all (null)', list: 'a list', text: 'text instead of an object',
};

const checkRules = ({ result, probe, probeError }) => {
  if (result.error || probeError || !probe) return null;
  if (probe.missing) return `upload-rules.mjs needs to export ${probe.missing} (keep the word export in front of the function).`;
  const { verdicts, keys } = probe;
  const threw = Object.entries(verdicts).find(([, v]) => v.startsWith('threw'));
  if (threw) return `checkUpload crashed on ${RULES_WHY[threw[0]] || 'a good request'} (${threw[1].slice(6)}). It should return a problem in words, never throw.`;
  for (const [name, label] of [['good', 'A 2 MB JPEG'], ['smallest', 'A 1-byte PNG'], ['limit', 'A WebP of exactly 5 MB']]) {
    if (verdicts[name] !== 'ok') return `${label} was refused, but it's allowed. checkUpload should return null for it.`;
  }
  const bad = Object.keys(RULES_WHY);
  const passed = bad.filter((k) => verdicts[k] === 'ok');
  // An untouched checkUpload gets no nagging, unless objectKey is already done
  if (passed.length === bad.length) return typeof keys.png === 'string' ? 'objectKey returns a key. Now checkUpload: it still says yes to everything, even to no input at all. Start with TODO 1.' : null;
  if (passed.length) return `These still get through checkUpload: ${passed.map((k) => RULES_WHY[k]).join(', ')}.`;
  if (bad.some((k) => verdicts[k] !== 'refused')) return 'Every refusal should be a sentence the person can read, like "Photos must be JPEG, PNG or WebP."';
  if (keys.threw) return `objectKey crashed: ${keys.threw}.`;
  if (typeof keys.png !== 'string') return 'Now objectKey: it returns nothing yet. Build uploads/<the user\'s ID>/<a random ID>.<the extension for that type>.';
  if (!keys.png.startsWith('uploads/user-123/')) return `The key should start with uploads/ and the user's ID, then a slash. For user-123 it was: ${keys.png.slice(0, 60)}`;
  if (!keys.png.endsWith('.png') || !keys.jpg.endsWith('.jpg') || !keys.webp.endsWith('.webp')) return 'The key should end with the extension for its type (.jpg, .png or .webp): look it up with TYPES.get(contentType).';
  if (keys.png === keys.again) return 'Two calls gave the same key, so a second photo would replace the first. Put a randomUUID() in the key.';
  if (!/^uploads\/user-123\/[A-Za-z0-9_-]{8,}\.png$/.test(keys.png)) return 'Between the user\'s ID and the extension, the key should have one random ID and nothing else: no extra slashes, no file name.';
  return true;
};

// ---------------------------------------------------------------------------
// Steps: the API's Lambda function
// ---------------------------------------------------------------------------

const API_HEAD = `// index.mjs: the photo API. One Lambda function, two routes:
//   POST /uploads   -> permission to upload one photo: a presigned URL
//   GET  /uploads   -> this user's photos
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { checkUpload, objectKey } from './upload-rules.mjs'; // the rules from "The server decides"

// WHEN_REQUIRED: don't add the SDK's own checksum (a code worked out from
// the data being sent) to the URL. A URL is signed before there is any data:
// the browser sends the photo later.
const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' });
const BUCKET = process.env.BUCKET_NAME;
const EXPIRES = 300; // seconds: five minutes to start the upload

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  // As in Tutorial 4: API Gateway's JWT authorizer checked the token, and the
  // user is whoever the token says, never an ID from the request.
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return reply(401, { message: 'Sign in first' });

  switch (event.routeKey) {`;

const POST_ROUTE = `    case 'POST /uploads': {
      const body = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body;
      return startUpload(userId, body);
    }`;

const NOT_FOUND = `    default:
      return reply(404, { message: \`No route \${event.routeKey}\` });
  }
};`;

const START_UPLOAD_HEAD = `
async function startUpload(userId, rawBody) {
  let input;
  try {
    input = JSON.parse(rawBody ?? '');
  } catch {
    return reply(400, { message: 'The body must be JSON' });
  }
  const problem = checkUpload(input);
  if (problem) return reply(400, { message: problem });
`;

const START_UPLOAD = `${START_UPLOAD_HEAD}
  // We choose where it goes. Nothing in the request can change that.
  const key = objectKey(userId, input.contentType);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });
  const url = await getSignedUrl(s3, command, {
    expiresIn: EXPIRES,
    signableHeaders: new Set(['content-type']),
  });
  return reply(200, { url, key, expiresIn: EXPIRES });
}`;

export const SIGN_STARTER = `${API_HEAD}
${POST_ROUTE}
    // (next step: GET /uploads)
${NOT_FOUND}
${START_UPLOAD_HEAD}
  // TODO 1: const key = objectKey(userId, input.contentType);
  // TODO 2: a PutObjectCommand for BUCKET and that key, with
  //         ContentType: input.contentType and ContentLength: input.size
  // TODO 3: const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES,
  //         signableHeaders: new Set(['content-type']) });
  // TODO 4: reply 200 with { url, key, expiresIn: EXPIRES }
  return reply(500, { message: 'Not finished yet' });
}
`;

export const SIGN_SOLUTION = `${API_HEAD}
${POST_ROUTE}
    // (next step: GET /uploads)
${NOT_FOUND}
${START_UPLOAD}`;

const GET_ROUTE = `    case 'GET /uploads':
      return listUploads(userId);`;

export const LIST_STARTER = `${API_HEAD}
${POST_ROUTE}
${GET_ROUTE}
${NOT_FOUND}

async function listUploads(userId) {
  // TODO 1: send a ListObjectsV2Command for BUCKET with
  //         Prefix: \`uploads/\${userId}/\` (mind the last slash)
  // TODO 2: the answer's Contents is a list of { Key, Size, LastModified },
  //         or missing when nothing matched. Put the newest first.
  // TODO 3: reply 200 { uploads: [{ key, size, uploadedAt }] }
  return reply(200, { uploads: [] });
}
${START_UPLOAD}
`;

export const LIST_SOLUTION = `${API_HEAD}
${POST_ROUTE}
${GET_ROUTE}
${NOT_FOUND}

async function listUploads(userId) {
  const { Contents = [] } = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: \`uploads/\${userId}/\`,
  }));
  const uploads = Contents
    .sort((a, b) => b.LastModified - a.LastModified) // newest first
    .map(({ Key, Size, LastModified }) => ({ key: Key, size: Size, uploadedAt: LastModified.toISOString() }));
  return reply(200, { uploads });
}
${START_UPLOAD}`;

// API Gateway events, like the HTTP API sends after its JWT authorizer checked the token
const apiEvent = ({ method, body, sub }) => {
  const event = {
    version: '2.0',
    routeKey: `${method} /uploads`,
    rawPath: '/uploads',
    rawQueryString: '',
    headers: { authorization: 'Bearer eyJraWQiOi...', 'content-type': 'application/json', host: 'abc123.execute-api.us-east-1.amazonaws.com', origin: 'https://www.example.com' },
    requestContext: {
      accountId: '111122223333', apiId: 'abc123', domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
      http: { method, path: '/uploads', protocol: 'HTTP/1.1', sourceIp: '203.0.113.20', userAgent: 'Mozilla/5.0' },
      requestId: 'JKJaXmPLvHcESHA=', routeKey: `${method} /uploads`, stage: '$default', timeEpoch: ISSUED * 1000 + 60000,
      authorizer: {
        jwt: {
          claims: { sub, iss: ISSUER, client_id: CLIENT_ID, token_use: 'access', scope: 'aws.cognito.signin.user.admin', username: 'ana', exp: String(ISSUED + 3600) },
          scopes: null,
        },
      },
    },
    isBase64Encoded: false,
  };
  if (body !== undefined) event.body = JSON.stringify(body);
  return event;
};

const POST_EVENT = apiEvent({ method: 'POST', body: { contentType: 'image/jpeg', size: 2100000 }, sub: ANA });
const GET_EVENT = apiEvent({ method: 'GET', sub: ANA });

// The probes call the handler the way API Gateway would, as different people
const PROBE_HELPERS = `const BUCKET = '${BUCKET}';
const ana = { sub: '${ANA}', token_use: 'access', client_id: '${CLIENT_ID}' };
const ben = { sub: '${BEN}', token_use: 'access', client_id: '${CLIENT_ID}' };
const call = async (method, body, claims = ana) => {
  let res;
  try { res = await mod.handler(practice.apiEvent({ method, path: '/uploads', routeKey: method + ' /uploads', body, claims: claims || undefined }), practice.context()); }
  catch (e) { return { status: 'crash', body: null, error: e.name + ': ' + e.message }; }
  let parsed = null;
  try { parsed = JSON.parse(res.body); } catch { /* not JSON */ }
  return { status: res && res.statusCode, body: parsed };
};`;

const SIGN_PROBE = `${PROBE_HELPERS}
const put = async (url, type, size) => {
  try { return (await practice.fetch(url, { method: 'PUT', headers: { 'Content-Type': type }, body: new Uint8Array(size) })).status; }
  catch (e) { return 'no answer'; }
};
const parts = (url) => {
  try {
    const u = new URL(url);
    return { host: u.host, path: decodeURIComponent(u.pathname), expires: Number(u.searchParams.get('X-Amz-Expires')), operation: u.searchParams.get('x-id') };
  } catch { return null; }
};
const out = {};
const first = await call('POST', { contentType: 'image/jpeg', size: 2000 });
out.first = { status: first.status, error: first.error || null, key: first.body?.key ?? null, url: parts(first.body?.url) };
if (!out.first.url) return out;
const url = first.body.url;
// The uploads below are only in the bucket while the check runs
const objects = practice.state.s3[BUCKET] || {};
const before = new Set(Object.keys(objects));
try {
// What can this URL be used for? An attacker tries first, then the page.
out.html = await put(url, 'text/html', 2000);
out.bigger = await put(url, 'image/jpeg', 2000000);
out.honest = await put(url, 'image/jpeg', 2000);
const landed = (practice.aws().s3[BUCKET] || {})[first.body.key];
out.landed = landed ? { size: landed.size, type: landed.contentType } : null;
// Carla asks for a PNG, and tries to choose where it goes
const carla = await call('POST', { contentType: 'image/png', size: 500, key: 'uploads/${BEN}/mine-now.png', userId: '${BEN}', fileName: '../${BEN}/mine-now.png' }, { sub: 'carla-0001', token_use: 'access' });
out.carla = { status: carla.status, key: carla.body?.key ?? null, path: parts(carla.body?.url)?.path ?? null, png: carla.body?.url ? await put(carla.body.url, 'image/png', 500) : null };
const second = await call('POST', { contentType: 'image/jpeg', size: 2000 });
out.sameKey = !!first.body?.key && second.body?.key === first.body.key;
out.refused = {
  html: (await call('POST', { contentType: 'text/html', size: 300 })).status,
  tooBig: (await call('POST', { contentType: 'image/jpeg', size: ${MAX_BYTES} + 1 })).status,
  notJson: (await call('POST', '{"contentType": oops')).status,
  nobody: (await call('POST', { contentType: 'image/jpeg', size: 2000 }, null)).status,
};
} finally { for (const k of Object.keys(objects)) if (!before.has(k)) delete objects[k]; }
return out;`;

const checkSign = ({ invoke, probe, probeError, files }) => {
  if (invoke?.error && /signableHeaders/.test(invoke.error.message || '')) return 'signableHeaders must be a Set, not a list: new Set([\'content-type\']).';
  if (!invoke || invoke.error) return null;
  let sample = null;
  try { sample = JSON.parse(invoke.response?.body); } catch { return null; }
  if (sample?.url && typeof sample.url === 'object') return 'The url in the answer is empty: getSignedUrl returns a Promise. Put await in front of it.';
  if (typeof sample?.url !== 'string') return 'The answer has no url yet. Sign one with getSignedUrl, and reply 200 with { url, key, expiresIn }.';
  if (probeError || !probe) return null;
  const { first, carla, refused } = probe;
  if (first.status === 'crash') return `The handler crashed on a good request: ${first.error}.`;
  if (!first.url) return 'The url in the answer isn\'t a web address. Return what getSignedUrl gave you (after await).';
  if (first.url.host !== `${BUCKET}.s3.${REGION}.amazonaws.com`) return `The URL points at ${first.url.host}. Sign it for the bucket in BUCKET.`;
  if (first.url.operation === 'GetObject') return 'That URL allows a download (it was signed from a GetObjectCommand). An upload needs a PutObjectCommand.';
  if (!new RegExp(`^/uploads/${ANA}/[^/]+\\.jpg$`).test(first.url.path)) return 'The key in the URL should come from objectKey(userId, input.contentType): uploads/<the token\'s user>/<random ID>.jpg.';
  if (first.url.expires === 900) return 'This URL works for 900 seconds: the SDK\'s default, 15 minutes. Pass expiresIn: EXPIRES to getSignedUrl.';
  if (!(first.url.expires > 0 && first.url.expires <= 300)) return `This URL works for ${first.url.expires} seconds. Five minutes (EXPIRES) is plenty to start an upload, and little time for a leaked URL to be useful.`;
  const named = /signableHeaders\s*:\s*new Set\(\s*\[\s*['"`]([^'"`]+)['"`]/.exec(files?.['index.mjs'] || '');
  if (probe.html === 200 && named && named[1] !== 'content-type' && named[1].toLowerCase() === 'content-type') {
    return `The check sent a web page to your URL with Content-Type: text/html, and S3 stored it. signableHeaders has '${named[1]}', but the SDK only knows header names in lower case: new Set(['content-type']).`;
  }
  if (probe.html === 200) return 'The check sent a web page to your URL with Content-Type: text/html, and S3 stored it. Put ContentType in the command, and pass signableHeaders: new Set([\'content-type\']) so the signature covers it.';
  if (probe.bigger === 200) return 'The check sent 2 MB to a URL that was requested for 2,000 bytes, and S3 stored it. Put ContentLength: input.size in the command, so the size is part of the signature.';
  if (probe.honest !== 200) return `An honest upload, of the type and size that were asked for, got ${probe.honest} from S3. Sign exactly what the request asked for: ContentType: input.contentType, ContentLength: input.size.`;
  if (first.status !== 200) return `The URL is right, but the answer's status is ${first.status}. Reply 200.`;
  if (!carla.path || carla.png !== 200) return 'Another user (Carla) asked to upload a 500-byte PNG and couldn\'t. Take the type and size from each request: nothing fixed in the code.';
  if (!String(carla.path).startsWith('/uploads/carla-0001/')) return 'Carla\'s request named a key under Ben\'s ID, and got a URL for it. The key must come from objectKey(userId, …), with the userId from the token.';
  if (probe.sameKey) return 'Two requests got the same key, so the second photo would replace the first. objectKey() gives a new one each time.';
  if (first.key !== first.url.path.slice(1)) return 'Send the key back too, the same one the URL is for: reply(200, { url, key, expiresIn: EXPIRES }).';
  if (refused.html !== 400 || refused.tooBig !== 400 || refused.notJson !== 400) return 'Keep the checks at the top of startUpload: a web page, a file over 5 MB and a broken body should each get a 400, and no URL.';
  if (refused.nobody !== 401) return 'A request without a signed-in user should still get 401.';
  return true;
};

const LIST_PROBE = `${PROBE_HELPERS}
const keysOf = (r) => (Array.isArray(r.body?.uploads) ? r.body.uploads.map((u) => u.key) : null);
const out = {};
const forBen = await call('GET', undefined, ben);
out.ben = { status: forBen.status, keys: keysOf(forBen) };
const forCarla = await call('GET', undefined, { sub: 'carla-0001', token_use: 'access' });
out.carla = { status: forCarla.status, error: forCarla.error || null, keys: keysOf(forCarla) };
out.usedList = practice.aws().calls.some((c) => c.command === 'ListObjectsV2Command');
out.unknownRoute = (await call('DELETE', undefined, ana)).status;
out.post = (await call('POST', { contentType: 'image/png', size: 900 })).status;
// Two users whose IDs start the same way. Their photos are only in the bucket for this one question.
const objects = practice.state.s3[BUCKET];
const photo = (size, when) => ({ data: new Uint8Array(size), type: 'image/jpeg', meta: {}, modified: new Date(when), etag: '"practice"', sized: true });
// user-1's keys are not in the order they were uploaded: b is the newest, c the oldest.
const extra = {
  'uploads/user-1/a.jpg': photo(100, '2026-11-22T10:00:00Z'),
  'uploads/user-1/b.jpg': photo(150, '2026-11-24T10:00:00Z'),
  'uploads/user-1/c.jpg': photo(120, '2026-11-20T10:00:00Z'),
  'uploads/user-12/d.jpg': photo(200, '2026-11-23T10:00:00Z'),
};
Object.assign(objects, extra);
try {
  out.user1 = keysOf(await call('GET', undefined, { sub: 'user-1', token_use: 'access' }));
  const lists = practice.aws().calls.filter((c) => c.command === 'ListObjectsV2Command');
  out.lastPrefix = lists.length ? lists[lists.length - 1].input?.Prefix ?? null : null;
} finally { for (const k of Object.keys(extra)) delete objects[k]; }
return out;`;

const checkList = ({ invoke, probe, probeError, aws }) => {
  if (!invoke || invoke.error) return null;
  let body = null;
  try { body = JSON.parse(invoke.response?.body); } catch { return null; }
  const uploads = body?.uploads;
  if (!Array.isArray(uploads)) return 'Reply with { uploads: [...] }: a list, even when it\'s empty.';
  if (!uploads.length) {
    return (aws?.calls || []).some((c) => c.command === 'ListObjectsV2Command')
      ? 'The command was sent, but the list in the answer is still empty. s3.send() returns a Promise: put await in front of it, and take Contents (capital C) out of what it gives you.'
      : 'The list is empty, but Ana has two photos in the bucket. Ask S3 for the objects under her prefix with a ListObjectsV2Command.';
  }
  const keys = uploads.map((u) => u?.key);
  if (keys.includes(BEN_PHOTO)) return 'Ana can see Ben\'s photo! List only the keys that start with this user\'s own prefix: Prefix: `uploads/${userId}/`.';
  if (keys.length !== 2 || !keys.includes(ANA_OLD) || !keys.includes(ANA_NEWER)) return 'Ana has two photos in the bucket. Each upload in the answer needs its key: { key, size, uploadedAt }.';
  if (keys[0] !== ANA_NEWER) return 'Both photos are there. Now put the newest first: sort by LastModified, largest (latest) first.';
  const newest = uploads[0];
  if (newest.size !== 512300) return 'Each upload needs its size in bytes, from Size.';
  if (typeof newest.uploadedAt !== 'string' || new Date(newest.uploadedAt).getTime() !== Date.parse('2026-11-21T08:05:13.000Z')) return 'Each upload needs uploadedAt: when it arrived, from LastModified, as text (LastModified.toISOString()).';
  if (invoke.response.statusCode !== 200) return 'Reply 200 with the uploads.';
  if (probeError || !probe) return null;
  if (!probe.usedList) return 'Ask S3 which objects exist with a ListObjectsV2Command.';
  if (probe.ben.status !== 200 || probe.ben.keys?.length !== 1 || probe.ben.keys[0] !== BEN_PHOTO) return 'Signed in as Ben, the list should show Ben\'s one photo, and only that.';
  if (probe.carla.status === 'crash') return `Carla has no photos yet, and for her the function crashed: ${probe.carla.error}. When nothing matches, the answer has no Contents at all: give it a default, like const { Contents = [] } = …`;
  if (probe.carla.status !== 200 || !probe.carla.keys || probe.carla.keys.length) return 'Someone without photos should get 200 and an empty list: { uploads: [] }.';
  if (!probe.user1) return 'Signed in as user-1, the answer had no uploads list.';
  if (probe.user1.some((k) => String(k).startsWith('uploads/user-12/'))) return 'Signed in as user-1, the list also shows a photo of user-12: the prefix uploads/user-1 fits both. End the prefix with a slash.';
  const names = probe.user1.map((k) => String(k).split('/').pop());
  if (names.join() !== 'b.jpg,a.jpg,c.jpg') {
    return names.length === 3
      ? `user-1 uploaded c.jpg first, then a.jpg, then b.jpg, so newest first is b, a, c. The list came out as ${names.map((n) => n[0]).join(', ')}. Sort by LastModified itself: the order of the keys says nothing about the dates.`
      : 'Signed in as user-1, who has three photos, the list should show those three and nothing else.';
  }
  if (probe.lastPrefix !== 'uploads/user-1/') return 'The answer is right, but the function asked S3 for more than this user\'s photos and picked them out in JavaScript. S3 returns at most 1,000 keys per request, so in a busy bucket most photos would never show up. Let S3 do the filtering: Prefix: `uploads/${userId}/`.';
  if (probe.unknownRoute !== 404) return 'Keep the default case: other routes get a 404.';
  if (probe.post !== 200) return 'POST /uploads stopped working: keep its case in the switch.';
  return true;
};

// ---------------------------------------------------------------------------
// Step: the whole page
// ---------------------------------------------------------------------------

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Photo notes</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Photo notes</h1>
    <!-- The email and password are filled in for practice only: delete both
         value="…" attributes before this page goes anywhere real -->
    <form id="sign-in">
      <label>Email <input id="email" type="email" autocomplete="username" required value="ana@example.com"></label>
      <label>Password <input id="password" type="password" autocomplete="current-password" required value="practice-Passw0rd!"></label>
      <button>Sign in</button>
      <p id="message" role="status"></p>
    </form>
    <section id="notes" hidden>
      <p id="who"></p>
      <label for="photo">Add a photo of your notes (JPEG, PNG or WebP, up to 5 MB)</label>
      <input id="photo" type="file" accept="image/jpeg,image/png,image/webp">
      <img id="preview" alt="The photo you chose" hidden>
      <p id="status" role="status"></p>
      <button id="upload" type="button" disabled>Upload</button>
      <h2 id="count"></h2>
      <ul id="uploads"></ul>
      <button id="sign-out" type="button">Sign out</button>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const APP_TOP = `// app.js: photo notes. Sign in, choose a photo, send it straight to Amazon S3.
const REGION = '${REGION}';
const CLIENT_ID = '${CLIENT_ID}';
const API = '${API}';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, counted in bytes

let session = null; // the tokens from Cognito, kept in memory only (Tutorial 4)
`;

const APP_REST = `
// --- Everything from here on is ready-made -----------------------------------

${PHOTO_HELPERS}

${CHECK_FILE}

// --- Signing in, exactly as in Tutorial 4 -----------------------------------

async function signIn(email, password) {
  const res = await fetch(\`https://cognito-idp.\${REGION}.amazonaws.com/\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Sign-in failed');
  return data.AuthenticationResult; // { IdToken, AccessToken, RefreshToken, ExpiresIn }
}

function readClaims(token) {
  return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
}

function showSignIn(message = '') {
  session = null;
  $('#notes').hidden = true;
  $('#sign-in').hidden = false;
  $('#message').textContent = message;
}

// --- The list of photos -------------------------------------------------------

async function loadUploads() {
  const res = await fetch(\`\${API}/uploads\`, {
    headers: { Authorization: \`Bearer \${session.AccessToken}\` },
  });
  if (res.status === 401) {
    showSignIn('Your session expired. Sign in again.');
    return;
  }
  const { uploads = [] } = await res.json();
  $('#count').textContent = uploads.length === 1 ? '1 photo' : \`\${uploads.length} photos\`;
  $('#uploads').replaceChildren(...uploads.map((u) => {
    const li = document.createElement('li');
    const kind = u.key.split('.').pop().toUpperCase();
    li.textContent = \`\${new Date(u.uploadedAt).toLocaleString()} · \${formatSize(u.size)} · \${kind}\`;
    return li;
  }));
}
`;

const APP_TAIL = `
// --- Wiring it together ---------------------------------------------------------

${ON_CHANGE}

$('#upload').addEventListener('click', async () => {
  const file = $('#photo').files[0];
  const problem = checkFile(file);
  if (problem) {
    showStatus(problem, 'error');
    return;
  }
  $('#upload').disabled = true;
  try {
    await uploadPhoto(file);
    showStatus('Uploaded.', 'ok');
    $('#photo').value = ''; // ready for the next photo
    showPreview(null);
    await loadUploads();
  } catch (err) {
    // fetch throws a TypeError when nobody answered: no connection, or the
    // browser stopped the request because S3's CORS rules don't allow this site
    showStatus(err instanceof TypeError ? "We couldn't reach the server. Check your connection and try again." : err.message, 'error');
    $('#upload').disabled = false;
  }
});

$('#sign-in').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#message').textContent = 'Signing in…';
  try {
    session = await signIn($('#email').value, $('#password').value);
    $('#who').textContent = \`Signed in as \${readClaims(session.IdToken).email}\`;
    $('#sign-in').hidden = true;
    $('#notes').hidden = false;
    $('#message').textContent = '';
    await loadUploads();
  } catch (err) {
    showSignIn(err.message);
  }
});

$('#sign-out').addEventListener('click', () => showSignIn('Signed out.'));
`;

export const APP_STARTER = `${APP_TOP}
// --- The upload: your part ----------------------------------------------------

// Sends one photo. Throws an Error (with a message for the person) if it fails.
async function uploadPhoto(file) {
  showStatus('Asking for permission…');
  // TODO 1: POST to \`\${API}/uploads\` with the access token (Authorization:
  //         \`Bearer \${session.AccessToken}\`), as JSON: { contentType: file.type, size: file.size }
  // TODO 2: read the answer with .json(). If the answer isn't ok, throw
  //         new Error(<the message the API sent>). Otherwise it holds { url, key }.

  showStatus(\`Uploading \${file.name}…\`);
  // TODO 3: PUT the file itself to that url: method 'PUT',
  //         headers { 'Content-Type': file.type }, body: file
  // TODO 4: if S3's answer isn't ok, throw new Error('Amazon S3 refused the upload. Try again.')
}
${APP_REST}${APP_TAIL}`;

export const APP_SOLUTION = `${APP_TOP}
// --- The upload: your part ----------------------------------------------------

// Sends one photo. Throws an Error (with a message for the person) if it fails.
async function uploadPhoto(file) {
  // 1. Ask our API for permission: a URL that allows this one upload
  showStatus('Asking for permission…');
  const asked = await fetch(\`\${API}/uploads\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${session.AccessToken}\`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const permission = await asked.json();
  if (!asked.ok) throw new Error(permission.message || 'The upload was refused.');

  // 2. Send the file itself to Amazon S3. No token: the URL is the permission.
  showStatus(\`Uploading \${file.name}…\`);
  const sent = await fetch(permission.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!sent.ok) throw new Error('Amazon S3 refused the upload. Try again.');
}
${APP_REST}${APP_TAIL}`;

// The pretend back end the practice page talks to: the same decisions as the
// function from the last steps, for whoever holds Ana's access token.
const API_GUARD = `if (request.headers.authorization !== 'Bearer ${ANA_ACCESS_TOKEN}') return { status: 401, json: { message: 'Unauthorized' } };`;
const PAGE_SCENARIO = {
  web: {
    [`https://cognito-idp.${REGION}.amazonaws.com`]: {
      status: 200,
      ms: 300,
      json: { AuthenticationResult: { AccessToken: ANA_ACCESS_TOKEN, ExpiresIn: 3600, IdToken: ANA_ID_TOKEN, RefreshToken: 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.practice-refresh-token', TokenType: 'Bearer' }, ChallengeParameters: {} },
    },
    [`POST ${API}/uploads`]: {
      ms: 300,
      respond: `${API_GUARD}
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const input = request.json;
if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 400, json: { message: 'The body must be JSON' } };
if (!Object.prototype.hasOwnProperty.call(TYPES, input.contentType)) return { status: 400, json: { message: 'Photos must be JPEG, PNG or WebP.' } };
if (!Number.isInteger(input.size) || input.size < 1) return { status: 400, json: { message: "size must be the file's size in bytes" } };
if (input.size > ${MAX_BYTES}) return { status: 400, json: { message: 'A photo can be at most 5 MB.' } };
const id = 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
const key = 'uploads/${ANA}/' + id + '.' + TYPES[input.contentType];
const url = s3.presign({ method: 'PUT', bucket: '${BUCKET}', key, contentType: input.contentType, contentLength: input.size, expiresIn: 300 });
return { status: 200, json: { url, key, expiresIn: 300 } };`,
    },
    [`GET ${API}/uploads`]: {
      ms: 250,
      respond: `${API_GUARD}
const uploads = s3.list('${BUCKET}', 'uploads/${ANA}/')
  .sort((a, b) => (a.modified < b.modified ? 1 : -1))
  .map((o) => ({ key: o.key, size: o.size, uploadedAt: o.modified }));
return { status: 200, json: { uploads } };`,
    },
    [BUCKET_URL]: { s3: STORED },
  },
};

const PAGE_PROBE = `const BUCKET = '${BUCKET}';
const rows = () => practice.all('#uploads li').length;
const status = () => ({ text: practice.text('#status') || '', kind: practice.$('#status').className });
const settled = (ms) => practice.until(() => /ok|error/.test(practice.$('#status').className), ms);
const out = {};
await practice.type('#email', 'ana@example.com');
await practice.type('#password', 'practice-Passw0rd!');
await practice.submit('#sign-in');
await practice.until(() => rows() > 0, 3000);
out.before = rows();
if (practice.$('#notes').hidden || !out.before) return out;

// 1. An honest upload
await practice.chooseFile('#photo', { name: 'whiteboard.jpg', type: 'image/jpeg', size: 2100000 });
await practice.click('#upload');
await settled(4000);
await practice.until(() => rows() > out.before, 1500);
await practice.wait(150); // anything still on its way has landed
const toApi = practice.fetchLog.find((e) => e.method === 'POST' && e.url.endsWith('/uploads'));
const toS3 = practice.fetchLog.filter((e) => e.url.includes('.s3.'));
let asked = null;
try { asked = toApi && toApi.body ? JSON.parse(toApi.body) : null; } catch (e) { asked = 'not json'; }
out.ask = toApi ? { auth: toApi.sent.authorization || null, body: asked, result: toApi.result } : null;
const sent = toS3[toS3.length - 1];
out.put = sent ? {
  method: sent.method, size: sent.bodySize, type: sent.sent['content-type'] || null, auth: 'authorization' in sent.sent,
  signed: sent.url.includes('X-Amz-Signature='), result: sent.result, tries: toS3.length,
} : null;
const stored = practice.s3()[BUCKET] || {};
out.stored = Object.keys(stored).filter((k) => stored[k].size === 2100000).map((k) => [k.startsWith('uploads/${ANA}/'), stored[k].contentType]);
out.after = rows();
out.done = status();

// 2. The API says no, for a reason the page can't know
const pretend = practice.fetch;
const answer = (code, body, type) => ({ ok: code >= 200 && code < 300, status: code, headers: { get: () => type }, json: async () => JSON.parse(body), text: async () => body });
let s3Calls = 0;
window.fetch = async (url, init = {}) => {
  if (String(url).includes('.s3.')) s3Calls += 1;
  if (String(init.method).toUpperCase() === 'POST' && String(url).endsWith('/uploads')) return answer(400, '{"message":"You have 50 photos already. Delete one first."}', 'application/json');
  return pretend(url, init);
};
await practice.chooseFile('#photo', { name: 'more.png', type: 'image/png', size: 400000 });
await practice.click('#upload');
await settled(2000);
out.refused = { ...status(), s3Calls, rows: rows() };

// 3. S3 says no: the URL ran out before the upload started
s3Calls = 0;
window.fetch = async (url, init = {}) => {
  if (String(url).includes('.s3.')) {
    s3Calls += 1;
    return answer(403, '<?xml version="1.0" encoding="UTF-8"?>\\n<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>', 'application/xml');
  }
  return pretend(url, init);
};
await practice.chooseFile('#photo', { name: 'late.webp', type: 'image/webp', size: 900000 });
await practice.click('#upload');
await settled(2000);
out.expired = { ...status(), s3Calls, rows: rows() };
window.fetch = pretend;
out.errors = practice.errors.map((e) => e.message || '');
return out;`;

const checkPage = ({ probe, probeError }) => {
  if (probeError || !probe || !probe.before) return null;
  const { ask, put, done, refused, expired } = probe;
  if (!ask) return 'Pressing Upload doesn\'t ask the API for permission yet. In uploadPhoto, POST to `${API}/uploads`.';
  if (ask.auth === `Bearer ${ANA_ID_TOKEN}`) return 'That\'s the ID token. An API gets the access token: session.AccessToken.';
  if (ask.auth === ANA_ACCESS_TOKEN) return 'The access token went out on its own. The API expects the word Bearer and a space in front of it: Authorization: `Bearer ${session.AccessToken}`.';
  if (ask.auth !== `Bearer ${ANA_ACCESS_TOKEN}`) return 'The request for permission went out without the access token, so the real API would answer 401. Add Authorization: `Bearer ${session.AccessToken}`.';
  if (!ask.body || ask.body === 'not json' || ask.body.contentType !== 'image/jpeg' || ask.body.size !== 2100000) {
    return 'Tell the API what you want to send, as JSON: body: JSON.stringify({ contentType: file.type, size: file.size }).';
  }
  if (!put) return 'The API answered with a presigned URL, but nothing was sent to it. Wait for the first answer (await the fetch, then its .json()), and PUT the file to the url it holds.';
  if (put.auth) return 'The upload sent your Authorization header to S3. Leave it out: the URL itself is the permission, and your token is for your own API only.';
  if (!put.signed) return 'Use the whole URL the API sent, with everything after the question mark: the signature is in there.';
  if (put.method !== 'PUT') return `The file went to S3 with ${put.method}. The URL was signed for one method: method: 'PUT'.`;
  if (put.size !== 2100000) return 'The body of the PUT should be the file itself: body: file. Not JSON and not FormData: S3 stores the bytes exactly as they arrive.';
  if (put.type !== 'image/jpeg') return `S3 was told the Content-Type is "${put.type}", but the URL was signed for the file's own type. Send headers: { 'Content-Type': file.type }.`;
  if (put.result !== 200) return `S3 answered ${put.result} to the upload. Send exactly what you asked permission for: this file, with its own type.`;
  if (!probe.stored.length) return null;
  if (/error/.test(done.kind) && /JSON/.test(done.text)) {
    return 'The photo reached S3, and then the page showed an error. S3 answers a successful PUT with an empty body, so there is nothing for .json() to read. Don\'t read the body of S3\'s answer: look at ok.';
  }
  if (/error/.test(done.kind)) return `The photo reached S3 (it answered 200), but the page showed an error: "${done.text.slice(0, 120)}". Is there an await in front of both fetch calls? Without it you hold a Promise, not the answer, and its ok is undefined.`;
  if (!/ok/.test(done.kind) || probe.after !== probe.before + 1) {
    return 'The photo reached S3, but the page didn\'t wait for it: the list was reloaded too early. Put await in front of both fetch calls in uploadPhoto.';
  }
  if (refused.s3Calls) return 'The API refused (a 400), but the page still tried to PUT to S3. When the answer isn\'t ok, throw an Error and stop.';
  if (!/50 photos/.test(refused.text)) return 'When the API says no, show the reason it sent: throw new Error(<the message in its JSON answer>). The check\'s API said "You have 50 photos already."';
  if (!expired.s3Calls) return null;
  if (/ok/.test(expired.kind) || /uploaded/i.test(expired.text)) return 'S3 answered 403 (the URL had expired), and the page still said "Uploaded." fetch doesn\'t throw for a 403: look at the answer\'s ok, and throw an Error when it\'s false.';
  if (/[<>]|Unexpected token|not valid JSON/i.test(expired.text)) return 'S3 answers errors in XML, not JSON, so don\'t call .json() on its answer. Look at ok, and show a message of your own.';
  if (!/error/.test(expired.kind) || !expired.text) return 'When S3 refuses the upload, tell the person: throw new Error(\'Amazon S3 refused the upload. Try again.\').';
  if (probe.errors.length) return null;
  return true;
};

// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'photo-uploads',
  number: 5,
  title: 'Photo uploads without a server',
  situation: 'The study tracker from Tutorial 4 is in use, and people keep asking for one thing: a place for photos of their handwritten notes and whiteboard sketches. A photo is a few megabytes, too much to push through your API\'s Lambda function, and nobody wants to rent a server only to receive files. So the browser will send each photo straight to Amazon S3, with a presigned URL: a web address your function signs, good for one upload, of one kind and size, for five minutes.',
  level: 'Advanced',
  hours: 6,
  free: false,
  skills: ['file inputs', 'File objects', 'client-side checks', 'fetch with PUT', 'error states', 'server-side decisions', 'CORS'],
  aws: ['Amazon S3', 'presigned URLs', 'AWS Lambda', 'API Gateway HTTP API', 'Amazon Cognito', 'IAM'],
  overview: 'You\'ll build the page that lets someone choose a photo and checks it on the spot, then the Lambda function that checks again, decides where the photo goes, and signs a URL that allows exactly that upload and nothing else. The browser then sends the file to Amazon S3 itself, and a second route lists each person\'s own photos. Along the way you\'ll learn why the browser never gets AWS keys, why the server chooses the key and the content type, and what CORS on a bucket is for. The Build step deploys it all with the AWS command line.',
  steps: [
    {
      id: 'why-direct',
      kind: 'read',
      title: 'Why the photo doesn\'t go through your API',
      minutes: 10,
      body: `The obvious way to add photos is the one you already know: the page sends the file to your API, like the contact form sent its message, and the Lambda function stores it. For a photo, three things go wrong.

1. **It doesn't fit.** A Lambda function accepts at most **6 MB** per request. A file isn't text, so API Gateway hands it to your function base64-encoded (the \`isBase64Encoded\` case from the contact form), which makes it a third bigger. A 4.5 MB photo from a phone is already at the limit.
2. **It's slow, and can time out.** An HTTP API waits at most **30 seconds** for your function. A phone on a weak connection needs longer than that for one photo.
3. **You pay for a relay.** Lambda bills for every millisecond your function runs, and here it would spend them passing bytes from one side to the other.

Two shortcuts look tempting. Both are worse.

- **Put AWS keys in the page**, so the browser can talk to storage itself. As with the contact form: anyone who opens the page can read its JavaScript, so the keys are public within a day.
- **Let anyone write to the storage.** Then anyone on the internet can fill it with whatever they like, and you pay for it.

### Amazon S3, in four words

**Amazon S3** (Simple Storage Service) is where AWS keeps files. Four words cover it:

| Word | Means |
|---|---|
| **Bucket** | A container for files, with a name nobody else in the world has, like \`study-photos-111122223333\`. |
| **Object** | One stored file, with a little information about it (its size, its content type). |
| **Key** | The object's name inside the bucket, like \`uploads/f81a2c3e/0b6f9d52.jpg\`. The slashes make it look like folders; to S3 it's one long name. |
| **Private** | The starting point: a new bucket refuses everyone except its owner's account. Keep it that way. |

### The way out: a presigned URL

A **presigned URL** is an ordinary web address (a URL) for one object, with a **signature** added by someone who is allowed to touch that object: a code that proves who made the address, and that nobody changed it since. Whoever holds the address may do the one thing it was signed for (here: upload this object) until it expires. No AWS account, no keys.

Think of leaving a coat at a theater. The attendant picks a hook and hands you a numbered ticket. The ticket works for that one hook, tonight. It says nothing about who's holding it, and it opens nothing else.

So the photo makes three trips, and only the small ones go through your code:

\`\`\`text
 1. Browser ──POST /uploads { contentType, size } + access token──▶ API Gateway ──▶ Lambda
                                                 checks the request, picks the key, signs a URL
 2. Browser ◀──{ url, key }────────────────────────────────────────────────────────── Lambda

 3. Browser ──PUT <the photo itself> to the presigned URL──▶ Amazon S3
                              S3 checks the signature and the expiry, then stores the object
\`\`\`

**PUT** is the web's method for "store what I'm sending at this address", the way POST is for "here's something to process".

Your function never sees the photo. It answers a small question ("may I upload a 2 MB JPEG?") in a few milliseconds. S3 receives the megabytes.

### What you'll build

1. The page: choose a photo, with checks before anything is sent.
2. The function: check again, decide where it goes, sign the URL.
3. A route that lists each person's own photos.
4. The upload from the page, with every answer handled.`,
    },
    {
      id: 'choose-photo',
      kind: 'try',
      runtime: 'web',
      title: 'Choose a photo, and check it first',
      minutes: 25,
      body: `A page gets files through one element:

\`\`\`text
<input id="photo" type="file" accept="image/jpeg,image/png,image/webp">
\`\`\`

\`accept\` tells the file dialog which kinds to offer. When the person picks a file, the input fires a **\`change\`** event, and its **\`files\`** property holds what they chose: a list, because an input can allow several. \`files[0]\` is a **\`File\`** object with three things you need:

| Property | Example | Means |
|---|---|---|
| \`file.name\` | \`'whiteboard.jpg'\` | The name on the person's computer. |
| \`file.size\` | \`2100000\` | The size in **bytes**. 1 KB is 1,024 bytes, 1 MB is 1,024 KB. |
| \`file.type\` | \`'image/jpeg'\` | The **content type** (also called MIME type): a label for the kind of data, like \`image/png\` or \`text/html\`. |

Reading these doesn't read the file: the page knows *about* it without loading it.

### Why check in the browser

Because the answer is instant. Without it, someone on a phone waits two minutes for a 40 MB video to upload, only to be told photos can be 5 MB.

Two honest limits, though:

- \`accept\` is a suggestion. The dialog has an "All files" option.
- \`file.type\` is a guess from the file's **extension**, the letters after the last dot in its name. The browser doesn't look inside the file. Rename \`virus.exe\` to \`cat.jpg\` and the browser says \`image/jpeg\`. For an extension it doesn't know, the type is empty: \`''\`.

So these checks are a courtesy to honest people, exactly like \`required\` on the contact form. The checks that count happen on the server, in a later step.

### Three states, not one

A page that takes a file is always in one of three states, and each should look different:

| State | Message | Upload button |
|---|---|---|
| Nothing chosen | (none) | off |
| A problem | what's wrong, in red | off |
| Ready | the file's name and size | on |

The preview below is live: choose a real photo from your computer to try your code. Nothing is sent anywhere. \`showPreview(file)\` shows the picture with \`URL.createObjectURL(file)\`, which gives the page a temporary address for a file that's still on the person's device.`,
      task: 'Finish `checkFile(file)` so it returns what\'s wrong (no file, a type that isn\'t in `TYPES`, an empty file, or more than `MAX_BYTES`) or `null`, and finish the `change` listener: a problem is shown as an error with the button off; a good photo shows its name and size, its preview, and switches the button on.',
      hint: 'In checkFile: `if (!file) return \'Choose a photo first.\';` then `if (!TYPES.includes(file.type)) return \'Photos must be JPEG, PNG or WebP.\';` then the two size checks. In the listener: `const problem = checkFile(file); if (problem) { showStatus(problem, \'error\'); showPreview(null); $(\'#upload\').disabled = true; return; }` and after it the three lines for a good photo.',
      solution: PICK_SOLUTION,
      files: [
        { path: 'app.js', starter: PICK_STARTER },
        { path: 'index.html', starter: PICK_HTML },
        { path: 'style.css', starter: PHOTO_CSS },
      ],
      scenario: {},
      probe: PICK_PROBE,
      check: checkPick,
      success: 'Three clear states, and nobody waits for an upload that was never going to work. The check tried a PDF, a file one byte too big, an empty one, and no file at all. Remember what these checks are, though: a courtesy. Anyone can skip your page.',
    },
    {
      id: 'presigned-url',
      kind: 'read',
      runtime: 'node',
      title: 'A presigned URL, taken apart',
      minutes: 15,
      body: `Before the function, look at the thing it will make. The console below runs like Node.js, with a pretend AWS account that has an empty bucket. Press **Run** on each box.

The AWS SDK has a small package for this, \`@aws-sdk/s3-request-presigner\`. You describe the request you want to allow as a **command**, here a \`PutObjectCommand\` (S3's name for "store this object"), and \`getSignedUrl\` turns it into an address:

\`\`\`js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' });
const command = new PutObjectCommand({ Bucket: '${BUCKET}', Key: 'uploads/test.jpg' });
const url = await getSignedUrl(s3, command, { expiresIn: 300 });
url
\`\`\`

A long address. Before the \`?\` it's the bucket, the Region and the key: one object. Everything after is the permission. \`new URL(url)\` takes an address apart, and its \`searchParams\` are the \`name=value\` pairs after the \`?\`. \`Object.fromEntries\`, which you used on the contact form's fields, turns them into one object:

\`\`\`js
Object.fromEntries(new URL(url).searchParams)
\`\`\`

One thing to know before you read them: an AWS access key has two halves. The **key ID** says whose key it is, and may be seen. The **secret key** never leaves its owner, and is what signs.

| Part | Means |
|---|---|
| \`X-Amz-Expires\` | How many seconds it works: \`300\`, from \`expiresIn\`. Leave that out and the SDK gives 900 (15 minutes). The most it accepts is a week. |
| \`X-Amz-Date\` | When it was signed. The clock starts here. |
| \`X-Amz-Credential\` | Whose permission it borrows: the key ID (not the secret key), the date, the Region and the service. |
| \`X-Amz-Security-Token\` | Only there when the keys are temporary, like the ones a Lambda function gets from its role. |
| \`X-Amz-SignedHeaders\` | Which request headers the signature covers. So far only \`host\`. |
| \`X-Amz-Signature\` | The proof: a code worked out from everything above, the object's key, and the method (PUT), using the secret key. |

The other three never change: \`X-Amz-Algorithm\` names the signing method, \`X-Amz-Content-Sha256: UNSIGNED-PAYLOAD\` says the body itself isn't part of the signature, and \`x-id\` is the SDK's label for the operation.

Two things to notice. **No call to AWS was made**: signing is arithmetic that happens inside your function. And the secret key isn't in the URL, only its result.

### Use it

Anyone holding the address can upload, with no AWS account and no token:

\`\`\`js
const res = await fetch(url, { method: 'PUT', body: 'pretend this is a photo' });
res.status
\`\`\`

Now try to use it for a different object:

\`\`\`js
const other = await fetch(url.replace('test.jpg', 'someone-else.jpg'), { method: 'PUT', body: 'sneaky' });
[other.status, await other.text()]
\`\`\`

\`403\`, \`SignatureDoesNotMatch\`. When a request arrives, S3 works the signature out again from the request it actually got, and compares. Change the key, the method or anything else that was signed, and the two no longer match. Without the signature there's nothing at all: the bucket is private.

\`\`\`js
(await fetch(url.split('?')[0], { method: 'PUT', body: 'no ticket' })).status
\`\`\`

### Lock in the type and the size

So far the URL allows *any* content of *any* size at that key. Put the content type and the length in the command, and ask for the content type to be signed. The option for that, \`signableHeaders\`, takes a **\`Set\`**: a collection in which each value appears only once. \`new Set(['content-type'])\` makes one from a list.

\`\`\`js
const strict = await getSignedUrl(s3, new PutObjectCommand({ Bucket: '${BUCKET}', Key: 'uploads/strict.jpg', ContentType: 'image/jpeg', ContentLength: 23 }), { expiresIn: 300, signableHeaders: new Set(['content-type']) });
new URL(strict).searchParams.get('X-Amz-SignedHeaders')
\`\`\`

Now the signature covers three headers. A request that says it's a web page is refused:

\`\`\`js
(await fetch(strict, { method: 'PUT', headers: { 'Content-Type': 'text/html' }, body: '<p>not a photo at all</p>' })).status
\`\`\`

And the one that was described goes through (the text is exactly 23 bytes):

\`\`\`js
(await fetch(strict, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: 'pretend this is a photo' })).status
\`\`\`

> **\`signableHeaders\` matters.** Without it, the SDK leaves Content-Type out of the signature even when the command has a \`ContentType\`, and the uploader could send any type they like. Write the name in lower case: \`'content-type'\`. The length needs no such help: the SDK signs it whenever the command has a \`ContentLength\`.

### Three facts to keep

- **A presigned URL is a bearer token**, like the access token you send after the word \`Bearer\`: it works for whoever holds it. They can use it as often as they like, until it expires. Treat it like a password with a short life: never log it, never put it in an email.
- **It borrows the signer's permission.** If your function isn't allowed to store that object, neither is the URL.
- **\`requestChecksumCalculation: 'WHEN_REQUIRED'\`**, in the client above: since version 3.729 the SDK adds a **checksum** to every upload: a short code worked out from the data, so S3 can tell whether it arrived undamaged. A URL is signed before there is any data, so it would carry the checksum of an empty file. This setting leaves it out.`,
      scenario: { aws: { s3: { [BUCKET]: {} } } },
    },
    {
      id: 'server-decides',
      kind: 'try',
      runtime: 'node',
      title: 'The server decides: what, how big, and where',
      minutes: 25,
      body: `The page will ask "may I upload this?" with two facts: \`{ contentType, size }\`. As with the contact form, **anyone can send that request without your page**, so the function checks everything again, and then makes three decisions that it never leaves to the browser.

### 1. What: a short list of types

S3 stores the content type it's given, and hands it back to every browser that later opens the object. If someone could upload a file as \`text/html\`, then wherever you later show "their photo", browsers would get a web page instead, scripts included. So there's a list of allowed types, and everything else is refused.

The list is a **\`Map\`**: pairs of a key and a value, with \`has(key)\` and \`get(key)\`.

\`\`\`js
const types = new Map([['image/jpeg', 'jpg'], ['image/png', 'png']]);
[types.has('image/png'), types.get('image/png'), types.has('text/html')]
\`\`\`

Why not a plain object? Because every object comes with built-in names:

\`\`\`js
const plain = { 'image/jpeg': 'jpg' };
[typeof plain['toString'], types.has('toString')]
\`\`\`

With the plain object, a request for the "type" \`toString\` would find something. A Map only has what you put in.

### 2. How big: a number you can trust

The size must be a whole number of bytes, at least 1, at most 5 MB. \`Number.isInteger\` refuses text, fractions and missing values with one test:

\`\`\`js
[Number.isInteger(2100000), Number.isInteger('2100000'), Number.isInteger(1000.5), Number.isInteger(undefined)]
\`\`\`

### 3. Where: the server names the object

Never build the key from a file name the browser sent. A name can contain \`../\` to climb out of a folder, or characters that need special handling in S3. Two people both have an \`IMG_0001.jpg\`, and storing an object under a key that exists **replaces** the old one. And a name can carry someone else's user ID, to get into their folder.

So the key is made of three parts the server controls:

\`\`\`text
uploads/<the user's ID, from the token>/<a random ID>.<the extension for the type>
\`\`\`

The random part is a **UUID** (universally unique identifier): 36 characters that won't repeat in practice.

\`\`\`js
import { randomUUID } from 'node:crypto';
[randomUUID(), randomUUID()]
\`\`\``,
      task: 'Finish `checkUpload(input)` so it returns a problem (in words) for anything that isn\'t an object with an allowed `contentType` and a whole-number `size` from 1 to `MAX_BYTES`, and `null` otherwise. Finish `objectKey(userId, contentType)` so each call returns a new key: `uploads/<userId>/<random ID>.<extension>`.',
      hint: 'checkUpload: `if (typeof input !== \'object\' || input === null || Array.isArray(input)) return \'Send a JSON object\';` then `if (!TYPES.has(input.contentType)) return \'Photos must be JPEG, PNG or WebP.\';` then `if (!Number.isInteger(input.size) || input.size < 1) return ...;` and `if (input.size > MAX_BYTES) return ...;`. objectKey is one template literal with `userId`, `randomUUID()` and `TYPES.get(contentType)`.',
      solution: RULES_SOLUTION,
      files: [{ path: 'upload-rules.mjs', starter: RULES_STARTER, runLabel: 'Run upload-rules.mjs' }],
      scenario: {},
      probe: RULES_PROBE,
      check: checkRules,
      success: 'Seventeen kinds of request, and each gets a clear yes or no. Notice what objectKey doesn\'t take: a file name. The browser has no say in where its photo goes.',
    },
    {
      id: 'sign-upload',
      kind: 'try',
      runtime: 'node',
      title: 'Sign the upload',
      minutes: 30,
      body: `Now the function behind \`POST /uploads\`. Its skeleton is the one from the study tracker: the user comes from the token's \`sub\` claim, one \`switch\` picks the route, and \`reply\` builds the answer. \`startUpload\` already parses the body and runs your \`checkUpload\`. What's left is the signing.

Each thing you put in the command or the options is a lock on the URL:

| You write | The URL then allows |
|---|---|
| \`Key: key\` | only that object: nobody else's, and no name the browser chose |
| \`ContentType: input.contentType\` + \`signableHeaders\` | only that content type |
| \`ContentLength: input.size\` | only a body of exactly that many bytes |
| \`expiresIn: EXPIRES\` | only the next five minutes |

**Why five minutes?** The clock only has to cover the time until the upload *starts*: S3 checks the expiry when the request arrives, and an upload that's already running is allowed to finish. A short life means that a URL that leaks, from a log file or a shared screen, is useless almost at once.

The function sends back \`{ url, key, expiresIn }\`. The \`key\` isn't needed for the upload (it's inside the URL), but the page can use it to refer to the photo later.

**Test with the sample event** runs the function as API Gateway would, for Ana asking to upload a 2 MB JPEG. Look at the URL in the answer. Then the check uses the URL the way an attacker would, before using it honestly.`,
      task: 'Finish `startUpload`: pick the key with `objectKey`, build a `PutObjectCommand` for `BUCKET` with that key, the request\'s content type and its size, sign it for `EXPIRES` seconds with the content type among the signed headers, and reply 200 with `{ url, key, expiresIn }`.',
      hint: '`const key = objectKey(userId, input.contentType);` then `const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: input.contentType, ContentLength: input.size });` then `const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES, signableHeaders: new Set([\'content-type\']) });` and `return reply(200, { url, key, expiresIn: EXPIRES });`',
      solution: SIGN_SOLUTION,
      files: [{ path: 'index.mjs', starter: SIGN_STARTER, invoke: { event: POST_EVENT, timeout: 10 } }, rulesFile],
      scenario: { env: { BUCKET_NAME: BUCKET }, aws: { s3: { [BUCKET]: {} } } },
      probe: SIGN_PROBE,
      check: checkSign,
      success: 'That URL does one thing. The check tried to use it for a web page and for a file a thousand times bigger: S3 refused both with 403, and then stored the honest upload. A request that named a key in someone else\'s folder got a URL for its own.',
    },
    {
      id: 'list-uploads',
      kind: 'try',
      runtime: 'node',
      title: 'List one person\'s photos, and only theirs',
      minutes: 20,
      body: `The second route, \`GET /uploads\`, answers "which photos are mine?". The practice bucket now holds two of Ana's photos and one of Ben's.

Remember that a key is one long name. S3 can list the keys that **start with** some text, a **prefix**, and that is what keeps people apart: every key starts with \`uploads/<userId>/\`, so one person's photos are the keys with that prefix.

\`\`\`text
await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: \`uploads/\${userId}/\` }));
\`\`\`

The answer has a \`Contents\` list, one entry per object:

\`\`\`text
{ Key: 'uploads/f81a…/7c1e….png', Size: 512300, LastModified: 2026-11-21T08:05:13.000Z, … }
\`\`\`

Four things to get right:

- **The last slash in the prefix.** \`uploads/user-1\` also fits \`uploads/user-12/…\`. \`uploads/user-1/\` doesn't.
- **Nothing found means no \`Contents\` at all**, not an empty list. Give it a default when you take it apart: \`const { Contents = [] } = …\`.
- **S3 lists keys in alphabetical order**, and our keys are random IDs, so the order says nothing about time. Sort the list yourself. \`sort\` takes a function that compares two entries: when it returns a negative number the first one goes in front, and when it returns a positive number the second one does.
- **\`LastModified\` is a \`Date\`.** Subtracting two dates gives the milliseconds between them, so \`y.LastModified - x.LastModified\` is positive when \`y\` is newer, and puts the newest first:

\`\`\`js
const photos = [{ Key: 'a', LastModified: new Date('2026-11-18') }, { Key: 'b', LastModified: new Date('2026-11-21') }];
photos.sort((x, y) => y.LastModified - x.LastModified).map((p) => p.Key)
\`\`\`

> One request returns at most 1,000 objects. When there are more, the answer has \`IsTruncated: true\` and a \`NextContinuationToken\` to ask for the next page. Fine to ignore for a person's photos; essential for a whole bucket.

The page gets \`{ key, size, uploadedAt }\` for each photo. To *show* a stored photo you'd add one more field: a presigned URL made from a \`GetObjectCommand\`, good for a minute or two. Same idea, other direction.`,
      task: 'Finish `listUploads(userId)`: list the objects under this user\'s own prefix, newest first, and reply 200 with `{ uploads: [{ key, size, uploadedAt }] }`. Someone without photos gets an empty list.',
      hint: 'Send the command and take the list out of the answer, with a default: ``const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `uploads/${userId}/` }));`` Then sort and reshape it: `Contents.sort((a, b) => b.LastModified - a.LastModified).map(({ Key, Size, LastModified }) => ({ key: Key, size: Size, uploadedAt: LastModified.toISOString() }))`.',
      solution: LIST_SOLUTION,
      files: [{ path: 'index.mjs', starter: LIST_STARTER, invoke: { event: GET_EVENT, timeout: 10 } }, rulesFile],
      scenario: { env: { BUCKET_NAME: BUCKET }, aws: { s3: { [BUCKET]: STORED } } },
      probe: LIST_PROBE,
      check: checkList,
      success: 'Each person gets their own photos, newest first, and a newcomer gets an empty list instead of a crash. The check also signed in as user-1 next to a user-12: the slash at the end of the prefix kept them apart, and three photos uploaded out of key order still came out newest first.',
    },
    {
      id: 'upload-from-page',
      kind: 'try',
      runtime: 'web',
      title: 'The page: ask, upload, show',
      minutes: 35,
      body: `Everything comes together in \`app.js\`. Below your part it has the sign-in from Tutorial 4, your \`checkFile\` from the *Choose a photo* step, a \`loadUploads()\` that fills the list, and the button's click listener, which calls **\`uploadPhoto(file)\`** and shows "Uploaded." or the error it throws. You write \`uploadPhoto\`, at the top of the file: two requests, to two different places.

### Request 1: ask your API

A POST with JSON, like the contact form, plus the access token, like the study tracker:

\`\`\`text
fetch(\`\${API}/uploads\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${session.AccessToken}\`, 'content-type': 'application/json' },
  body: JSON.stringify({ contentType: file.type, size: file.size }),
})
\`\`\`

The answer is JSON either way: \`{ url, key, expiresIn }\`, or \`{ message }\` with a 400 when the API says no. The page's own checks should make a 400 rare, but the API can have reasons the page doesn't know.

### Request 2: send the file to S3

\`\`\`text
fetch(permission.url, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
})
\`\`\`

Four details, and each one is a way this request fails in real life:

- **\`method: 'PUT'\`.** The URL was signed for PUT. Any other method: 403.
- **\`body: file\`.** The \`File\` object itself. Not \`JSON.stringify\`, not a \`FormData\`: S3 stores the bytes exactly as they arrive.
- **\`Content-Type\` must be the type you asked for**, because it's signed. (The browser adds \`Content-Length\` by itself, from the file. That's the other signed header, so the file must be the one you described.)
- **No \`Authorization\` header.** The URL is the permission. Your token is for your API, and S3 has no use for it. S3 even refuses a request that carries both, with a 400.

### Reading S3's answer

A successful PUT answers **200 with an empty body**. A refusal answers 403 with **XML**, an older text format with tags in angle brackets, not JSON:

\`\`\`text
<Error><Code>AccessDenied</Code><Message>Request has expired</Message>…</Error>
\`\`\`

So don't call \`.json()\` on it. Look at \`ok\`, and tell the person in your own words. And as always, \`fetch\` doesn't throw for a 403: an upload that was refused looks exactly like one that worked, unless you check.

Sign in below (the form is filled in for the practice user), choose a photo from your computer, and press **Upload**. The practice API and the practice bucket behave like the real ones: the photo goes nowhere, but the list grows.`,
      task: 'Write `uploadPhoto(file)`: ask the API for permission (POST, access token, `{ contentType, size }` as JSON) and throw an Error with the API\'s message if it refuses; then PUT the file itself to the `url` it sent, with the file\'s type as Content-Type, and throw an Error if S3\'s answer isn\'t ok.',
      hint: 'First request: ``const asked = await fetch(`${API}/uploads`, { method: \'POST\', headers: { Authorization: `Bearer ${session.AccessToken}`, \'content-type\': \'application/json\' }, body: JSON.stringify({ contentType: file.type, size: file.size }) });`` Then `const permission = await asked.json(); if (!asked.ok) throw new Error(permission.message);` Second request: `const sent = await fetch(permission.url, { method: \'PUT\', headers: { \'Content-Type\': file.type }, body: file }); if (!sent.ok) throw new Error(\'Amazon S3 refused the upload. Try again.\');`',
      solution: APP_SOLUTION,
      files: [
        { path: 'app.js', starter: APP_STARTER },
        { path: 'index.html', starter: PAGE_HTML },
        { path: 'style.css', starter: PHOTO_CSS },
      ],
      scenario: PAGE_SCENARIO,
      probe: PAGE_PROBE,
      check: checkPage,
      success: 'A photo went from the page to S3 without touching your function, and landed under the signed-in user\'s own prefix. The check also made the API say no, and let a URL expire: both times the page told the person what happened instead of saying "Uploaded."',
    },
    {
      id: 'locks',
      kind: 'read',
      title: 'CORS, permissions, and what a URL can\'t check',
      minutes: 12,
      body: `The practice bucket accepted the page's upload. A real one needs three settings first, and it's worth knowing what your design does and doesn't promise.

### CORS on the bucket

The page lives at one address and the bucket at another, so the browser applies the same-origin policy from the contact form. Before a PUT to another origin it sends a **preflight**: an \`OPTIONS\` request asking "may pages from \`https://www.example.com\` send PUT with a content-type header?". S3 answers from the bucket's **CORS configuration**, a list of rules:

\`\`\`text
[
  {
    "AllowedOrigins": ["https://www.example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3000
  }
]
\`\`\`

No matching rule, and the browser never sends the photo. \`fetch\` throws a \`TypeError\`, the page shows "couldn't reach the server", and the browser's console has the real reason: *blocked by CORS policy*. It's the most common first failure of an upload page, and the fix is in the bucket, not in your JavaScript.

> **CORS isn't the lock.** Only browsers ask the bucket first: \`curl\` sends its request without asking. CORS only decides which *websites* may use a presigned URL from a browser. The signature is what protects the bucket.

### The bucket stays private

Every new bucket has **Block Public Access** switched on. Leave it on. Nothing in this design needs a public bucket: uploads come in through signed URLs, and anything without a signature gets 403.

### The function's role sets the limit

A presigned URL borrows the permission of whoever signed it. So the function's role decides the most any URL can ever do, and it gets exactly two permissions:

\`\`\`text
{ "Effect": "Allow", "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::study-photos-111122223333/uploads/*" },
{ "Effect": "Allow", "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::study-photos-111122223333",
  "Condition": { "StringLike": { "s3:prefix": "uploads/*" } } }
\`\`\`

Storing objects under \`uploads/\`, and listing that prefix. (\`arn:aws:s3:::…\` is an **ARN**, an Amazon Resource Name: the full name of a thing in AWS. Listing is a permission on the bucket, so the prefix goes in a condition.) Even a bug in your key-building code can't write anywhere else, and no URL can delete or read anything.

### Five locks on one URL

| Lock | Where | What it stops |
|---|---|---|
| Sign-in | the API's JWT authorizer | strangers getting a URL at all |
| The server picks the key | \`objectKey\` | writing over, or into, someone else's photos |
| Signed content type | \`ContentType\` + \`signableHeaders\` | a web page stored as a "photo" |
| Signed size | \`ContentLength\`, after the 5 MB check | a huge file, and its bill |
| Short life | \`expiresIn: 300\` | a leaked URL being useful |

### What a presigned URL can't do

- **It can't look inside the file.** A text file sent with \`Content-Type: image/jpeg\` and the right size passes every lock. When other people will see the uploads, check them after they arrive: S3 can call a Lambda function for every new object, which can inspect the file, resize it, or delete it.
- **It isn't single-use.** Until it expires it can be used again, and each use replaces the object at that key.
- **It can't say "up to 5 MB".** A presigned PUT signs one exact length, which is why the page sends the size first. (S3's other upload method, a presigned POST form, takes a size range instead.)`,
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: Developer Associate',
      minutes: 8,
      body: `Presigned URLs come up often in the AWS Certified Developer – Associate exam. The points to know:

- **Whose permission?** A presigned URL carries the permissions of the IAM principal (the user or role) that signed it. If the signer can't do the operation, the URL can't either. "Give temporary access to one private object without changing the bucket policy" → presigned URL.
- **How long?** As long as you say, up to 7 days with the AWS CLI or SDKs (the S3 console offers 1 minute to 12 hours). But a URL signed with **temporary credentials**, like a Lambda function's role, stops working when those credentials expire, even if its own time isn't up. "The URL expires earlier than configured" → look at the credentials that signed it.
- **Presigned URL vs. identity pool.** A presigned URL allows one request that your server approved. A Cognito **identity pool** gives the app temporary AWS credentials of its own, to make many requests under an IAM role. Both keep long-lived keys out of the app.
- **403 SignatureDoesNotMatch** on a presigned URL: something that was signed differs from what was sent. The classic: the URL was made with a content type, and the upload didn't send the same \`Content-Type\` header.
- **CORS** for browser uploads is configured **on the bucket**. To let page scripts read a response header such as \`ETag\` (S3's fingerprint of the stored object), list it under \`ExposeHeaders\`.
- **Limits that push you to direct uploads.** Lambda: 6 MB per request and per response when it's called synchronously (the caller waits for the answer, as API Gateway does). API Gateway: 10 MB per request. HTTP API: at most 30 seconds for the function to answer.
- **Big files.** One PUT stores up to 5 GB. From about 100 MB, use **multipart upload**: up to 10,000 parts of 5 MB to 5 GB each (the last can be smaller), uploaded separately and retried one by one. That makes the largest object about 50 TB. Older study material says 5 TB, which was the limit until December 2025.
- **Listing.** \`ListObjectsV2\` returns at most 1,000 keys per request, and needs \`s3:ListBucket\`, a permission on the bucket, not on objects.
- **CloudFront signed URLs are a different thing.** Amazon CloudFront is AWS's content delivery network. Its signed URLs protect content delivered through a CloudFront distribution, and are signed with a key pair you register in a trusted key group, not with IAM credentials.
- **Who used the URL?** S3 server access logs and AWS CloudTrail (the service that records what happens in your account) data events record requests made with presigned URLs. They name the signer, not the person who used the URL.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'Why doesn\'t the page upload photos with AWS access keys of its own?', options: ['Browsers can\'t send requests to Amazon S3', 'Anyone who opens the page can read its JavaScript, keys included', 'Access keys only work inside Lambda', 'It would be slower than a presigned URL'], answer: 1, explain: 'Whatever ships in a page is public. A presigned URL gives the browser one approved request instead of keys.' },
        { q: 'The page asks to upload `../../someone-else/cat.jpg`. Where does a well-built function store the photo?', options: ['At that key, because the user asked for it', 'Under a key the function builds from the token\'s user ID and a random ID', 'Nowhere: file names with dots are refused by S3', 'In a bucket named after the file'], answer: 1, explain: 'The server names the object. The browser\'s file name never becomes part of the key, so it can\'t climb into someone else\'s prefix or replace an existing photo.' },
        { q: 'A URL was signed with `ContentType: \'image/png\'` among the signed headers. The browser PUTs the file with `Content-Type: image/jpeg`. What does S3 answer?', options: ['200, and stores it as PNG', '200, and stores it as JPEG', '403 SignatureDoesNotMatch', '415 Unsupported Media Type'], answer: 2, explain: 'S3 works the signature out again from the request it received. A signed header with another value gives another signature, so the request is refused.' },
        { q: 'Your code does `const sent = await fetch(url, { method: \'PUT\', body: file });` and then shows "Uploaded." The URL had expired. What does the person see?', options: ['An error, because fetch throws on a 403', '"Uploaded.", although nothing was stored', 'A sign-in form', 'A CORS error'], answer: 1, explain: 'fetch only throws when there\'s no answer at all. A 403 is an answer: check `sent.ok`.' },
        { q: 'The upload works with curl, but from your page the browser reports "blocked by CORS policy". What do you change?', options: ['The bucket\'s CORS configuration: allow your site\'s origin, PUT and the content-type header', 'The expiry of the presigned URL', 'The Lambda function\'s timeout', 'Block Public Access: switch it off'], answer: 0, explain: 'The browser asks the bucket first (the preflight). The bucket\'s CORS rules must allow the page\'s origin, the method and the headers it sends. curl never asks.' },
        { q: 'What does a presigned PUT URL with a signed type and size still not guarantee?', options: ['That the upload goes to the chosen key', 'That the file really is an image', 'That the body has the signed length', 'That it stops working after it expires'], answer: 1, explain: 'S3 checks the signature, not the content. A file can carry the label image/jpeg and be anything. Inspect uploads after they arrive if it matters.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'js5-presigned', front: 'What is a presigned URL?', back: 'A web address for one S3 object with a signature in it. Whoever holds it may do the one signed operation until it expires, with the signer\'s permissions.', tags: ['s3'], difficulty: 'easy' },
        { id: 'js5-file', front: 'The three properties of a `File` you check before uploading', back: '`file.name`, `file.size` (bytes) and `file.type` (the content type, guessed from the extension)', tags: ['files'], difficulty: 'easy' },
        { id: 'js5-sign', front: 'Sign a URL that allows one upload for five minutes', back: '`await getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType, ContentLength }), { expiresIn: 300, signableHeaders: new Set([\'content-type\']) })`', hint: '@aws-sdk/s3-request-presigner', tags: ['s3', 'sdk'], difficulty: 'hard' },
        { id: 'js5-put', front: 'Send a file to a presigned URL with fetch', back: '`fetch(url, { method: \'PUT\', headers: { \'Content-Type\': file.type }, body: file })`: no Authorization header, and check `ok`', tags: ['fetch'], difficulty: 'medium' },
        { id: 'js5-key', front: 'Who chooses the object key for an upload, and from what?', back: 'The server: a prefix with the user ID from the verified token, plus a random ID. Never the file name the browser sent.', tags: ['security'], difficulty: 'medium' },
        { id: 'js5-mismatch', front: 'S3 answers 403 `SignatureDoesNotMatch` to an upload. Why?', back: 'Something that was signed differs from what was sent: the method, the key, or a signed header such as Content-Type.', tags: ['s3'], difficulty: 'medium' },
        { id: 'js5-prefix', front: 'List one user\'s objects in a shared bucket', back: '``new ListObjectsV2Command({ Bucket, Prefix: `uploads/${userId}/` })``: with the last slash, and `Contents` is missing when nothing matches', tags: ['s3', 'sdk'], difficulty: 'medium' },
        { id: 'js5-cors', front: 'What does CORS on a bucket do for uploads, and what doesn\'t it do?', back: 'It lets pages from the listed origins send the PUT from a browser. It doesn\'t protect the bucket: the signature does.', tags: ['cors'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 75,
      body: `Deploy photo notes on your own AWS account with the AWS command line: a private bucket with CORS, a user pool, the function with its narrow role, and the API. Then upload a real photo, first with curl and then from your page.

**Before you start:** the AWS command line signed in with the admin sign-in from *Start here* (these steps create things in S3, Cognito, IAM, Lambda and API Gateway, and that sign-in is allowed to), Node.js 22 or newer with \`npm\` (\`node --version\`; install it from [nodejs.org](https://nodejs.org) if it's missing), and \`zip\`. On Ubuntu or the Windows Subsystem for Linux: \`sudo apt install -y zip\`.

1. **A folder, and your settings.**

\`\`\`sh
mkdir -p ~/aws-study-projects/javascript/photo-uploads && cd ~/aws-study-projects/javascript/photo-uploads
REGION=$(aws configure get region)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
BUCKET=study-photos-$ACCOUNT
SITE=http://localhost:8000
echo "$ACCOUNT $REGION $BUCKET"
\`\`\`

If the region comes out empty, set it yourself: \`REGION=us-east-1\` (or your region). **These variables only live in this terminal window.** In a new one, run these commands again.

Now save two files from the practice steps in this folder: \`index.mjs\` from *List one person's photos*, and \`upload-rules.mjs\` from *The server decides*. Delete the three \`console.log\` lines at the end of \`upload-rules.mjs\`: they were for trying things out, and would run every time your function starts.

2. **The bucket.** Bucket names are shared by all of AWS, which is why yours ends in your account number. (Since 2026 S3 can also reserve names for your account alone, in an *account regional namespace*. The shared kind still works everywhere, and it's what you'll see in most guides.) Outside \`us-east-1\`, S3 wants the Region stated twice:

\`\`\`sh
if [ "$REGION" = us-east-1 ]; then
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
else
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \\
    --create-bucket-configuration LocationConstraint="$REGION"
fi
aws s3api get-public-access-block --bucket "$BUCKET"
\`\`\`

The second command shows Block Public Access: four settings, all \`true\`, without you doing anything.

3. **CORS on the bucket**, for the page you'll serve on your own computer:

\`\`\`sh
cat > bucket-cors.json <<EOF
{"CORSRules":[{"AllowedOrigins":["$SITE"],"AllowedMethods":["PUT"],"AllowedHeaders":["content-type"],"MaxAgeSeconds":3000}]}
EOF
aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration file://bucket-cors.json
\`\`\`

4. **The user pool, its app client, and a test user**, as in Tutorial 4. Pick a test password with upper and lower case, a number and a symbol.

\`\`\`sh
POOL_ID=$(aws cognito-idp create-user-pool --pool-name photo-uploads-users \\
  --username-attributes email --auto-verified-attributes email \\
  --query UserPool.Id --output text)

CLIENT_ID=$(aws cognito-idp create-user-pool-client --user-pool-id "$POOL_ID" \\
  --client-name photo-uploads-web --no-generate-secret \\
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \\
  --query UserPoolClient.ClientId --output text)
echo "$POOL_ID $CLIENT_ID"

aws cognito-idp admin-create-user --user-pool-id "$POOL_ID" --username you@example.com \\
  --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true \\
  --message-action SUPPRESS > /dev/null
aws cognito-idp admin-set-user-password --user-pool-id "$POOL_ID" --username you@example.com \\
  --password 'Practice-Passw0rd!' --permanent
\`\`\`

5. **The function's role**: write its logs, store objects under \`uploads/\`, list that prefix. Nothing else.

\`\`\`sh
cat > trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > photos.json <<EOF
{"Version":"2012-10-17","Statement":[
  {"Effect":"Allow","Action":"s3:PutObject","Resource":"arn:aws:s3:::$BUCKET/uploads/*"},
  {"Effect":"Allow","Action":"s3:ListBucket","Resource":"arn:aws:s3:::$BUCKET","Condition":{"StringLike":{"s3:prefix":"uploads/*"}}}
]}
EOF
ROLE_ARN=$(aws iam create-role --role-name photo-uploads-api \\
  --assume-role-policy-document file://trust.json --query Role.Arn --output text)
aws iam attach-role-policy --role-name photo-uploads-api \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy --role-name photo-uploads-api \\
  --policy-name study-photos-uploads --policy-document file://photos.json
\`\`\`

6. **The function, with the SDK packages it uses.** AWS recommends putting the SDK clients you need in the package instead of relying on the copy inside Lambda, so the zip holds your two files and \`node_modules\`. A new role takes a few seconds before Lambda can use it. That is what \`sleep 10\` waits for.

\`\`\`sh
npm init -y > /dev/null
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
zip -qr function.zip index.mjs upload-rules.mjs package.json node_modules
sleep 10
FUNCTION_ARN=$(aws lambda create-function --function-name photo-uploads-api \\
  --runtime nodejs22.x --handler index.handler --role "$ROLE_ARN" \\
  --zip-file fileb://function.zip --timeout 10 \\
  --environment "Variables={BUCKET_NAME=$BUCKET}" \\
  --query FunctionArn --output text)
\`\`\`

If it says the role "cannot be assumed by Lambda", wait 10 seconds and run the last command again.

7. **The API, its JWT authorizer, and the two routes.** The API has CORS settings of its own: your page calls it from another origin too.

\`\`\`sh
cat > api-cors.json <<EOF
{"AllowOrigins":["$SITE"],"AllowMethods":["GET","POST"],"AllowHeaders":["authorization","content-type"]}
EOF
API_ID=$(aws apigatewayv2 create-api --name photo-uploads --protocol-type HTTP \\
  --cors-configuration file://api-cors.json --query ApiId --output text)

AUTHORIZER_ID=$(aws apigatewayv2 create-authorizer --api-id "$API_ID" --name cognito \\
  --authorizer-type JWT --identity-source '$request.header.Authorization' \\
  --jwt-configuration Audience=$CLIENT_ID,Issuer=https://cognito-idp.$REGION.amazonaws.com/$POOL_ID \\
  --query AuthorizerId --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration --api-id "$API_ID" \\
  --integration-type AWS_PROXY --integration-uri "$FUNCTION_ARN" \\
  --payload-format-version 2.0 --query IntegrationId --output text)

for ROUTE in 'POST /uploads' 'GET /uploads'; do
  aws apigatewayv2 create-route --api-id "$API_ID" --route-key "$ROUTE" \\
    --target "integrations/$INTEGRATION_ID" \\
    --authorization-type JWT --authorizer-id "$AUTHORIZER_ID" \\
    --authorization-scopes aws.cognito.signin.user.admin > /dev/null
done

aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy > /dev/null
aws lambda add-permission --function-name photo-uploads-api --statement-id apigateway-invoke \\
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \\
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT:$API_ID/*" > /dev/null
API=https://$API_ID.execute-api.$REGION.amazonaws.com
echo "$API"
\`\`\`

8. **Ask for a URL with curl.** First without a token (API Gateway answers 401 itself), then signed in. Set \`PHOTO\` to a real JPEG on your computer, under 5 MB:

\`\`\`sh
curl -i -X POST "$API/uploads"

TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id "$CLIENT_ID" \\
  --auth-parameters USERNAME=you@example.com,PASSWORD='Practice-Passw0rd!' \\
  --query AuthenticationResult.AccessToken --output text)

PHOTO=~/Pictures/notes.jpg
SIZE=$(wc -c < "$PHOTO" | tr -d ' ')
ANSWER=$(curl -s -X POST "$API/uploads" -H "Authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' -d "{\\"contentType\\":\\"image/jpeg\\",\\"size\\":$SIZE}")
echo "$ANSWER"
UPLOAD_URL=$(echo "$ANSWER" | node -pe 'JSON.parse(require("fs").readFileSync(0, "utf8")).url')
\`\`\`

If the answer isn't a URL, \`aws logs tail /aws/lambda/photo-uploads-api --since 10m\` shows the function's log.

9. **Use the URL.** As a cheat first, then honestly. Always put the URL in quotes: it's full of \`&\`.

\`\`\`sh
curl -i -X PUT -T "$PHOTO" -H 'Content-Type: text/html' "$UPLOAD_URL"
curl -i -X PUT -T "$PHOTO" -H 'Content-Type: image/jpeg' "$UPLOAD_URL"
curl -s "$API/uploads" -H "Authorization: Bearer $TOKEN"
aws s3 ls "s3://$BUCKET/uploads/" --recursive
\`\`\`

The first answers \`403\` with \`SignatureDoesNotMatch\`, the second \`200\`, and then your photo is in the list and in the bucket. Wait five minutes and run the second command again: \`403\`, \`Request has expired\`.

10. **Ask the bucket what a browser would ask.** This is the preflight, by hand:

\`\`\`sh
curl -i -X OPTIONS "https://$BUCKET.s3.$REGION.amazonaws.com/uploads/any.jpg" \\
  -H "Origin: $SITE" -H 'Access-Control-Request-Method: PUT' \\
  -H 'Access-Control-Request-Headers: content-type'
\`\`\`

\`200\`, with an \`Access-Control-Allow-Origin\` header. Change the origin to \`https://example.org\` and it's \`403\`: that site's pages couldn't upload here.

11. **The page.** Copy \`app.js\`, \`index.html\` and \`style.css\` from the last practice step into the folder. In \`app.js\`, set \`REGION\`, \`CLIENT_ID\` and \`API\` to your values (\`echo "$REGION $CLIENT_ID $API"\`). In \`index.html\`, delete the two \`value="…"\` attributes of the sign-in form. Serve the folder and open http://localhost:8000:

\`\`\`sh
python3 -m http.server 8000
\`\`\`

Sign in with your test user, choose a photo and upload it. Open the browser's developer tools on the Network tab and do it again: you'll see the POST to your API, the preflight to S3, and the PUT with status 200. Press Ctrl+C in the terminal to stop the server when you're done.

12. **Push to GitHub**, without \`node_modules\` and the zip: put both names in a \`.gitignore\` file. Nothing in the code is secret: the client ID, the API address and the bucket name are visible to anyone using the page. The password is: never commit it.

**Cost:** practically nothing. S3 Standard storage costs about $0.023 per GB a month in US East (N. Virginia), so a handful of photos is a fraction of a cent, and requests are billed per thousand. Cognito, Lambda and the HTTP API cost the same as in Tutorial 4: nothing, or a few cents.

**Clean up** when you're done. In a new terminal, run step 1 first, then:

\`\`\`sh
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='photo-uploads'].ApiId" --output text)
POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='photo-uploads-users'].Id" --output text)
echo "$API_ID $POOL_ID"
\`\`\`

\`\`\`sh
aws apigatewayv2 delete-api --api-id "$API_ID"
aws lambda delete-function --function-name photo-uploads-api
aws iam delete-role-policy --role-name photo-uploads-api --policy-name study-photos-uploads
aws iam detach-role-policy --role-name photo-uploads-api \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name photo-uploads-api
aws cognito-idp delete-user-pool --user-pool-id "$POOL_ID"
aws logs delete-log-group --log-group-name /aws/lambda/photo-uploads-api
aws s3 rm "s3://$BUCKET" --recursive
aws s3api delete-bucket --bucket "$BUCKET"
\`\`\`

A bucket must be empty before it can be deleted, which is why \`aws s3 rm\` comes first.`,
      checklist: [
        '`get-public-access-block` shows four settings, all true',
        '`curl -X POST "$API/uploads"` without a token gets a 401 from API Gateway',
        'A PUT with the wrong Content-Type got 403 SignatureDoesNotMatch, and the right one got 200',
        'My photo shows up in `GET /uploads` and in `aws s3 ls`',
        'The preflight from my site\'s origin got 200, and from another origin 403',
        'My page signs in, uploads a photo and lists it',
        'It\'s on GitHub, without node_modules, the zip or a password',
        'I cleaned up (or kept it, knowing what it costs)',
      ],
    },
  ],
};

export default tutorial;
