// Tutorial 4: sign-in with Amazon Cognito, and each person's progress saved
// in DynamoDB behind an HTTP API with a JWT authorizer.
//
// Shared with TypeScript tutorial 3, which deploys this same app with the CDK:
// table StudyProgress (userId + deckId, on-demand), env TABLE_NAME, one
// function (index.mjs, export handler) for GET /progress and
// PUT /progress/{deckId}, the user always taken from the token's sub claim.

// ---------------------------------------------------------------------------
// Pretend sign-in tokens: real JWT shape (base64url header.payload.signature),
// with made-up signatures. Built the same way every time.
// ---------------------------------------------------------------------------

const REGION = 'us-east-1';
const POOL_ID = 'us-east-1_Tr4ckEr42';
const CLIENT_ID = '5q7ms2a9tnk8examplec1ient';
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`;
const API = 'https://abc123.execute-api.us-east-1.amazonaws.com';
const ANA = 'f81a2c3e-7b54-4d0a-9c61-3e5d2b8a1f07';
const BEN = '2c9e4b71-0d3f-4a86-b5e2-9a17c6d40e58';

const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const HEADER = b64url({ kid: 'kTnXq3vLexample0AbCdEf1x2y3z=', alg: 'RS256' });
const SIGNATURE = 'Qm9ndXMtc2lnbmF0dXJlLW9ubHktZm9yLXByYWN0aWNl_x-Y2VfcGxlYXNlX2RvbnRfdHJ1c3RfbWU';
const ISSUED = 1793350800; // a fixed moment, so the tokens look the same every time

// The payload of a real token contains "-" or "_" sooner or later; make sure
// this one does, so code that skips the base64url step fails here, not in production.
const jwt = (claims) => {
  for (let n = 0; ; n++) {
    const payload = b64url({ ...claims, jti: `${claims.jti}${n ? `-${n}` : ''}` });
    if (/[-_]/.test(payload)) return `${HEADER}.${payload}.${SIGNATURE}`;
  }
};

const idTokenFor = (sub, email, username) => jwt({
  sub, email_verified: true, iss: ISSUER, 'cognito:username': username, origin_jti: 'b1e8>?a9c', aud: CLIENT_ID,
  event_id: 'e7c4a1d2', token_use: 'id', auth_time: ISSUED, exp: ISSUED + 3600, iat: ISSUED, jti: 'idtok>>?~', email,
});
const accessTokenFor = (sub, username) => jwt({
  sub, iss: ISSUER, client_id: CLIENT_ID, origin_jti: 'b1e8>?a9c', event_id: 'e7c4a1d2', token_use: 'access',
  scope: 'aws.cognito.signin.user.admin', auth_time: ISSUED, exp: ISSUED + 3600, iat: ISSUED, jti: 'acctok>>?~', username,
});

const ANA_ID_TOKEN = idTokenFor(ANA, 'ana@example.com', 'ana');
const ANA_ACCESS_TOKEN = accessTokenFor(ANA, 'ana');
const BEN_ID_TOKEN = idTokenFor(BEN, 'ben@example.com', 'ben');

const SAMPLE_FILE = `// sample.mjs: tokens Cognito gave Ana when they signed in (signatures are made up)
export const idToken = '${ANA_ID_TOKEN}';
export const accessToken = '${ANA_ACCESS_TOKEN}';
export const bensIdToken = '${BEN_ID_TOKEN}';
`;
const sampleFile = { path: 'sample.mjs', starter: SAMPLE_FILE, hidden: true };

// ---------------------------------------------------------------------------
// API Gateway events, like the HTTP API sends after its JWT authorizer
// checked the token (payload format 2.0)
// ---------------------------------------------------------------------------

const apiEvent = ({ method, path, routeKey, pathParameters, body, sub }) => {
  const event = {
    version: '2.0',
    routeKey,
    rawPath: path,
    rawQueryString: '',
    headers: { authorization: 'Bearer eyJraWQiOi...', 'content-type': 'application/json', host: 'abc123.execute-api.us-east-1.amazonaws.com' },
    requestContext: {
      accountId: '111122223333', apiId: 'abc123', domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
      http: { method, path, protocol: 'HTTP/1.1', sourceIp: '203.0.113.20', userAgent: 'Mozilla/5.0' },
      requestId: 'JKJaXmPLvHcESHA=', routeKey, stage: '$default', timeEpoch: ISSUED * 1000 + 60000,
      authorizer: {
        jwt: {
          claims: { sub, iss: ISSUER, client_id: CLIENT_ID, token_use: 'access', scope: 'aws.cognito.signin.user.admin', username: sub === ANA ? 'ana' : 'ben', exp: String(ISSUED + 3600) },
          scopes: null,
        },
      },
    },
    isBase64Encoded: false,
  };
  if (pathParameters) event.pathParameters = pathParameters;
  if (body !== undefined) event.body = JSON.stringify(body);
  return event;
};

const PUT_EVENT = apiEvent({
  method: 'PUT', path: '/progress/aws-basics', routeKey: 'PUT /progress/{deckId}', pathParameters: { deckId: 'aws-basics' },
  body: { index: 3, known: ['s3-1', 'lambda-2'], unknown: ['iam-4'] }, sub: ANA,
});
const GET_EVENT = apiEvent({ method: 'GET', path: '/progress', routeKey: 'GET /progress', sub: ANA });

const SAVED = [
  { userId: ANA, deckId: 'aws-basics', index: 3, known: ['s3-1', 'lambda-2'], unknown: ['iam-4'], updatedAt: '2026-10-29T18:02:11.000Z' },
  { userId: ANA, deckId: 'exam-traps', index: 7, known: ['trap-1', 'trap-3', 'trap-5'], unknown: ['trap-2'], updatedAt: '2026-10-30T07:45:40.000Z' },
  { userId: BEN, deckId: 'aws-basics', index: 12, known: ['s3-1', 's3-2', 'ec2-1', 'iam-1'], unknown: [], updatedAt: '2026-10-30T21:13:05.000Z' },
];
const table = (items) => ({ StudyProgress: { key: ['userId', 'deckId'], types: { userId: 'S', deckId: 'S' }, items } });

// ---------------------------------------------------------------------------
// Step: read a token
// ---------------------------------------------------------------------------

const TOKEN_STARTER = `// token.mjs: read what's inside a sign-in token, without trusting it.
import { idToken } from './sample.mjs';

// The middle part of a JWT, decoded: { sub, email, exp, ... }
export function readClaims(token) {
  // TODO: split the token at the dots and take the middle part (the payload).
  //       base64url uses - and _ where atob() expects + and /: swap them back,
  //       then atob() gives you JSON text, and JSON.parse() an object.
}

// How many seconds the token has left (negative when it has run out).
// claims.exp is in seconds since 1970; Date.now() counts milliseconds.
export function secondsLeft(claims, now = Date.now()) {
  // TODO
}

const claims = readClaims(idToken);
console.log(claims);
console.log('seconds left:', secondsLeft(claims));
`;

const TOKEN_SOLUTION = `// token.mjs: read what's inside a sign-in token, without trusting it.
import { idToken } from './sample.mjs';

// The middle part of a JWT, decoded: { sub, email, exp, ... }
export function readClaims(token) {
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

// How many seconds the token has left (negative when it has run out).
// claims.exp is in seconds since 1970; Date.now() counts milliseconds.
export function secondsLeft(claims, now = Date.now()) {
  return Math.floor(claims.exp - now / 1000);
}

const claims = readClaims(idToken);
console.log(claims);
console.log('seconds left:', secondsLeft(claims));`;

// ---------------------------------------------------------------------------
// Steps: the API's Lambda function
// ---------------------------------------------------------------------------

const API_HEAD = `// index.mjs: the study tracker's API. One Lambda function, two routes:
//   GET /progress            -> this user's saved decks
//   PUT /progress/{deckId}   -> save this user's progress in one deck
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

// Every answer goes back through API Gateway as JSON
const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  // The JWT authorizer already checked the token, and passes its claims on.
  // The user is whoever the token says: never a userId from the request.
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return reply(401, { message: 'Sign in first' });

  switch (event.routeKey) {`;

const PUT_ROUTE = `    case 'PUT /progress/{deckId}':
      return saveProgress(userId, event.pathParameters?.deckId, event.body);`;

const NOT_FOUND = `    default:
      return reply(404, { message: \`No route \${event.routeKey}\` });
  }
};`;

const CHECK_START = `
// A problem with the progress, in plain English, or null when it looks right
function checkProgress(progress) {
  if (typeof progress !== 'object' || progress === null || Array.isArray(progress)) return 'Send a JSON object';
  if (!Number.isInteger(progress.index) || progress.index < 0) return 'index must be a whole number, 0 or more';`;

const CHECK_LISTS = `  for (const list of ['known', 'unknown']) {
    const ids = progress[list];
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) return \`\${list} must be a list of card IDs\`;
    if (ids.length > 1000) return \`\${list} has more than 1,000 cards\`;
  }
  return null;
}`;

const SAVE_SOLUTION_FN = `
async function saveProgress(userId, deckId, rawBody) {
  if (!/^[a-z0-9-]{1,64}$/.test(deckId ?? '')) return reply(400, { message: 'Unknown deck' });

  let progress;
  try {
    progress = JSON.parse(rawBody ?? '');
  } catch {
    return reply(400, { message: 'The body must be JSON' });
  }
  const problem = checkProgress(progress);
  if (problem) return reply(400, { message: problem });

  const { index, known, unknown } = progress; // only the fields we expect
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { userId, deckId, index, known, unknown, updatedAt: new Date().toISOString() },
  }));
  return reply(200, { saved: true, deckId });
}`;

export const SAVE_STARTER = `${API_HEAD}
${PUT_ROUTE}
    // (next step: GET /progress)
${NOT_FOUND}

async function saveProgress(userId, deckId, rawBody) {
  if (!/^[a-z0-9-]{1,64}$/.test(deckId ?? '')) return reply(400, { message: 'Unknown deck' });

  // TODO 1: JSON.parse(rawBody) inside try / catch. Bad JSON: reply 400.
  // TODO 2: const problem = checkProgress(progress); a problem: reply 400 with it.
  // TODO 3: save it: db.send(new PutCommand({ TableName: TABLE, Item: { userId,
  //         deckId, index, known, unknown, updatedAt: new Date().toISOString() } }))
  return reply(200, { saved: false });
}
${CHECK_START}
  // TODO 4: known and unknown must each be a list of strings (card IDs)
  return null;
}
`;

export const SAVE_SOLUTION = `${API_HEAD}
${PUT_ROUTE}
    // (next step: GET /progress)
${NOT_FOUND}
${SAVE_SOLUTION_FN}
${CHECK_START}
${CHECK_LISTS}`;

const GET_ROUTE = `    case 'GET /progress':
      return listProgress(userId);`;

export const LIST_STARTER = `${API_HEAD}
${GET_ROUTE}
${PUT_ROUTE}
${NOT_FOUND}

async function listProgress(userId) {
  // TODO: Query the table for this user's items only:
  //   KeyConditionExpression: 'userId = :u', ExpressionAttributeValues: { ':u': userId }
  // then reply 200 { decks: [...] }, each deck without its userId field.
  return reply(200, { decks: [] });
}
${SAVE_SOLUTION_FN}
${CHECK_START}
${CHECK_LISTS}
`;

export const LIST_SOLUTION = `${API_HEAD}
${GET_ROUTE}
${PUT_ROUTE}
${NOT_FOUND}

async function listProgress(userId) {
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': userId },
  }));
  // Each user's own decks, without repeating their ID back to them
  const decks = Items.map(({ userId: _owner, ...deck }) => deck);
  return reply(200, { decks });
}
${SAVE_SOLUTION_FN}
${CHECK_START}
${CHECK_LISTS}`;

// The probes call the handler the way API Gateway would, as different people
const PROBE_HELPERS = `const ana = { sub: '${ANA}', token_use: 'access', client_id: '${CLIENT_ID}' };
const ben = { sub: '${BEN}', token_use: 'access', client_id: '${CLIENT_ID}' };
const call = async (opts) => {
  let res;
  try { res = await mod.handler(practice.apiEvent(opts), practice.context()); } catch (e) { return { status: 'crash', body: e.name + ': ' + e.message }; }
  let body = null;
  try { body = JSON.parse(res.body); } catch { /* not JSON */ }
  return { status: res.statusCode, body };
};
const put = (deckId, body, claims = ana) => call({ method: 'PUT', path: \`/progress/\${deckId}\`, routeKey: 'PUT /progress/{deckId}', pathParameters: { deckId }, body, claims });
const list = (claims) => call({ method: 'GET', path: '/progress', routeKey: 'GET /progress', claims });`;

const SAVE_PROBE = `${PROBE_HELPERS}
const sneaky = await put('exam-traps', { index: 1, known: [], unknown: [], userId: '${BEN}' }, { sub: 'carla-0001', token_use: 'access' });
const badJson = await put('probe-deck', '{"index": 3, known: [');
const badList = await put('probe-deck', { index: 2, known: 's3-1', unknown: [] });
const badIndex = await put('probe-deck', { index: -1, known: [], unknown: [] });
const noList = await put('probe-deck', { index: 1 });
const nobody = await call({ method: 'PUT', path: '/progress/probe-deck', routeKey: 'PUT /progress/{deckId}', pathParameters: { deckId: 'probe-deck' }, body: { index: 0, known: [], unknown: [] } });
const items = practice.aws().dynamodb.StudyProgress || [];
return {
  sneaky: sneaky.status, badJson: badJson.status, badList: badList.status, badIndex: badIndex.status, noList: noList.status, nobody: nobody.status,
  owners: items.map((i) => i.userId + '/' + i.deckId),
};`;

const LIST_PROBE = `${PROBE_HELPERS}
const forBen = await list(ben);
const unknownRoute = await call({ method: 'DELETE', path: '/progress', routeKey: 'DELETE /progress', claims: ana });
return { ben: forBen.body, benStatus: forBen.status, unknownRoute: unknownRoute.status };`;

// ---------------------------------------------------------------------------
// Step: the page signs in and sends the token
// ---------------------------------------------------------------------------

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Study tracker</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Study tracker</h1>
    <form id="sign-in">
      <label>Email <input id="email" type="email" autocomplete="username" required></label>
      <label>Password <input id="password" type="password" autocomplete="current-password" required></label>
      <button>Sign in</button>
      <p id="message" role="status"></p>
    </form>
    <section id="tracker" hidden>
      <p id="who"></p>
      <ul id="decks"></ul>
      <button id="refresh" type="button">Refresh</button>
      <button id="sign-out" type="button">Sign out</button>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const PAGE_CSS = `body { font-family: system-ui, sans-serif; margin: 2rem; color: #1d2733; }
main { max-width: 30rem; }
form { display: grid; gap: 0.7rem; }
label { display: grid; gap: 0.2rem; font-size: 0.9rem; }
input { padding: 0.45rem; font: inherit; }
button { padding: 0.45rem 1rem; margin-right: 0.4rem; font: inherit; }
#message { color: #a33; min-height: 1.2em; }
#decks li { margin: 0.3rem 0; }`;

const APP_HEAD = `// app.js: sign in with Amazon Cognito, then load your progress from the API.
const REGION = '${REGION}';
const CLIENT_ID = '${CLIENT_ID}';
const API = '${API}';

// Tokens live only in this variable: gone when the tab closes or reloads,
// and out of reach of anything that reads localStorage.
let session = null;

const $ = (sel) => document.querySelector(sel);

// Cognito's sign-in call: one POST with the email and password
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

// What a token says about its owner. Fine for showing a name; the API
// never trusts this: API Gateway checks the signature.
function readClaims(token) {
  return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
}

function showSignIn(message = '') {
  session = null;
  $('#tracker').hidden = true;
  $('#sign-in').hidden = false;
  $('#message').textContent = message;
}

function showDecks(decks) {
  $('#decks').replaceChildren(...decks.map((d) => {
    const li = document.createElement('li');
    li.textContent = \`\${d.deckId}: card \${d.index + 1}, \${d.known.length} known, \${d.unknown.length} to review\`;
    return li;
  }));
}
`;

const APP_TAIL = `
$('#sign-in').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#message').textContent = 'Signing in…';
  try {
    session = await signIn($('#email').value, $('#password').value);
    $('#who').textContent = \`Signed in as \${readClaims(session.IdToken).email}\`;
    $('#sign-in').hidden = true;
    $('#tracker').hidden = false;
    $('#message').textContent = '';
    await loadProgress();
  } catch (err) {
    showSignIn(err.message);
  }
});

$('#refresh').addEventListener('click', loadProgress);
$('#sign-out').addEventListener('click', () => showSignIn('Signed out.'));
`;

export const APP_STARTER = `${APP_HEAD}
async function loadProgress() {
  const res = await fetch(\`\${API}/progress\`, {
    headers: {
      // TODO 1: send the access token: Authorization: \`Bearer \${...}\`
    },
  });
  // TODO 2: a 401 means the token ran out (or was never sent). Call
  //         showSignIn('Your session expired. Sign in again.') and stop.
  const { decks = [] } = await res.json();
  showDecks(decks);
}
${APP_TAIL}`;

export const APP_SOLUTION = `${APP_HEAD}
async function loadProgress() {
  const res = await fetch(\`\${API}/progress\`, {
    headers: { Authorization: \`Bearer \${session.AccessToken}\` },
  });
  if (res.status === 401) {
    showSignIn('Your session expired. Sign in again.');
    return;
  }
  if (!res.ok) {
    $('#message').textContent = \`Couldn't load your progress (\${res.status}).\`;
    return;
  }
  const { decks } = await res.json();
  showDecks(decks);
}
${APP_TAIL}`;

const PAGE_SCENARIO = {
  web: {
    [`https://cognito-idp.${REGION}.amazonaws.com`]: {
      status: 200,
      ms: 400,
      json: { AuthenticationResult: { AccessToken: ANA_ACCESS_TOKEN, ExpiresIn: 3600, IdToken: ANA_ID_TOKEN, RefreshToken: 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.practice-refresh-token', TokenType: 'Bearer' }, ChallengeParameters: {} },
    },
    [`${API}/progress`]: {
      status: 200,
      ms: 250,
      json: { decks: SAVED.filter((d) => d.userId === ANA).map(({ userId, ...d }) => d) },
    },
  },
};

const PAGE_PROBE = `await practice.type('#email', 'ana@example.com');
await practice.type('#password', 'practice-Passw0rd!');
await practice.submit('#sign-in');
await practice.until(() => practice.all('#decks li').length > 0 || practice.text('#message') !== 'Signing in…', 3000);
await practice.wait(80);
const header = (h, name) => !h ? null : typeof h.get === 'function' ? h.get(name)
  : (Object.entries(h).find(([k]) => k.toLowerCase() === name) || [])[1] || null;
const apiCall = practice.fetchLog.find((e) => e.url.endsWith('/progress'));
const signedIn = {
  auth: apiCall ? header(apiCall.headers, 'authorization') : null,
  apiCalled: !!apiCall,
  decks: practice.all('#decks li').map((li) => li.textContent.trim()),
  who: practice.text('#who'),
};
// An hour later the token has run out, and the API answers 401
window.fetch = async () => ({
  ok: false, status: 401, statusText: 'Unauthorized',
  headers: { get: () => 'application/json' },
  json: async () => ({ message: 'Unauthorized' }),
  text: async () => '{"message":"Unauthorized"}',
});
let crashed = null;
try { await practice.click('#refresh'); await practice.wait(120); } catch (e) { crashed = String(e); }
return {
  signedIn,
  expired: { trackerHidden: practice.$('#tracker').hidden, formShown: !practice.$('#sign-in').hidden, message: practice.text('#message') },
  errors: practice.errors.map((e) => e.text),
  crashed,
};`;

// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'study-tracker',
  number: 4,
  title: 'Study tracker with sign-in',
  situation: 'The flashcard page from Tutorial 1 is a hit, but progress lives in one browser: switch from the office laptop to your phone and it\'s gone. You add accounts with Amazon Cognito, and save each person\'s progress in Amazon DynamoDB through an API with a sign-in check in front of it. These are the same building blocks the AWS Study Hub you\'re using right now runs on.',
  level: 'Advanced',
  hours: 6,
  skills: ['JSON Web Tokens', 'fetch with headers', 'async and await', 'input checks', 'status codes', 'keeping users apart'],
  aws: ['Amazon Cognito', 'API Gateway HTTP API', 'JWT authorizer', 'AWS Lambda', 'Amazon DynamoDB'],
  overview: 'You\'ll learn what signing in really produces (tokens), read one yourself, and see why your code may read them but must never trust them. Then you build the API\'s Lambda function: it saves and lists progress for whoever the verified token says, checks every request body, and never lets one person see another\'s data. Last, the page signs in, sends its token with each request, and handles the token running out. The Build step deploys it all with the AWS command line.',
  steps: [
    {
      id: 'sign-in-explained',
      kind: 'read',
      runtime: 'node',
      title: 'What signing in really gives you',
      minutes: 15,
      body: `Two different questions hide behind "sign-in":

- **Identity** (authentication): *who are you?* You prove it once, with a password.
- **Access** (authorization): *what may you do?* Every request asks again, and nobody wants to send a password every time.

**Amazon Cognito** answers the first question. A **user pool** stores your users and their passwords, and when someone signs in correctly it hands back three **tokens**:

| Token | What it's for | Lasts (default) |
|---|---|---|
| **ID token** | Who the person is: email, name. For your page to read. | 1 hour |
| **Access token** | Proof they may call your API. Sent with every request. | 1 hour |
| **Refresh token** | Gets new ID and access tokens without the password. | 30 days |

From then on, the page sends the access token with each request instead of the password. Your API checks the token and knows who's asking.

### A token is three pieces of text

The ID and access tokens are **JSON Web Tokens** (JWTs, said "jots"): three parts joined by dots.

\`\`\`text
eyJraWQiOi...   .   eyJzdWIiOiJm...   .   Qm9ndXMtc2ln...
   header             payload               signature
\`\`\`

The header and payload are just JSON, encoded so they're safe in a URL. The console below has the tokens Cognito gave a learner called Ana. Press **Run**:

\`\`\`js
import { idToken } from './sample.mjs';
idToken.split('.').length
\`\`\`

\`\`\`js
const parts = idToken.split('.');
JSON.parse(atob(parts[0]))
\`\`\`

The header names the signing method. Now the interesting part, the payload:

\`\`\`js
JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
\`\`\`

Those fields are called **claims**:

| Claim | Means |
|---|---|
| \`sub\` | The user's ID: a long random value that never changes, even if their email does. **This is the one to store data under.** |
| \`email\`, \`cognito:username\` | Who they are, in human terms. |
| \`iss\` | The issuer: which user pool made the token. |
| \`aud\` (ID token), \`client_id\` (access token) | Which app it was made for. |
| \`exp\`, \`iat\` | Expires at, issued at: seconds since 1 January 1970. |
| \`token_use\` | \`id\` or \`access\`. |

### Reading isn't trusting

Anyone can decode a token: you just did. And anyone can **write** one: put \`"sub": "someone-else"\` in a payload, encode it, and send it. The only thing they can't fake is the **signature**. It's made with a private key that only Cognito holds, and checking it needs Cognito's public keys.

So the rule is simple: **your page may read a token to show a name, but your API must only trust a token whose signature was checked.** Good news: you won't write that check yourself. In this tutorial, API Gateway does it for you before your code even runs.`,
      files: [sampleFile],
      scenario: {},
    },
    {
      id: 'read-token',
      kind: 'try',
      runtime: 'node',
      title: 'Read a token yourself',
      minutes: 15,
      body: `Two small functions you'll use on the page: one to read the claims, one to see how long a token has left.

\`atob()\` turns base64 back into text, but tokens use **base64url**, a variant that swaps \`+\` for \`-\` and \`/\` for \`_\` so it's safe in web addresses. Swap them back first, or \`atob\` fails on some tokens and not others: the worst kind of bug.

Time in tokens is **seconds** since 1970. JavaScript's \`Date.now()\` counts **milliseconds**. Mixing them up gives you tokens that "expire" in the year 57,000.`,
      task: 'Finish `readClaims(token)` so it returns the payload as an object, and `secondsLeft(claims, now)` so it returns how many whole seconds remain before `claims.exp` (negative once it has run out).',
      hint: '`token.split(\'.\')[1]`, then `.replace(/-/g, \'+\').replace(/_/g, \'/\')`, then `JSON.parse(atob(...))`. For the time: `Math.floor(claims.exp - now / 1000)`.',
      solution: TOKEN_SOLUTION,
      files: [{ path: 'token.mjs', starter: TOKEN_STARTER }, sampleFile],
      scenario: {},
      probe: `const bensIdToken = '${BEN_ID_TOKEN}';
const accessToken = '${ANA_ACCESS_TOKEN}';
let ben = null;
let access = null;
let error = null;
try { ben = mod.readClaims(bensIdToken); access = mod.readClaims(accessToken); } catch (e) { error = e.name + ': ' + e.message; }
return {
  error,
  ben: ben && { sub: ben.sub, email: ben.email, token_use: ben.token_use },
  access: access && { token_use: access.token_use, client_id: access.client_id },
  left: mod.secondsLeft({ exp: 1800000000 }, 1799999000 * 1000),
  over: mod.secondsLeft({ exp: 1800000000 }, 1800000090 * 1000),
};`,
      check: ({ probe, probeError, result }) => {
        if (result.error || probeError || !probe) return null;
        if (probe.error) {
          return /atob|character|decode|InvalidCharacter/i.test(probe.error)
            ? 'atob() choked on a token: swap base64url\'s - and _ back to + and / before decoding.'
            : `readClaims failed on another token: ${probe.error}`;
        }
        if (!probe.ben) return null;
        if (probe.ben.email !== 'ben@example.com' || probe.ben.sub !== BEN) return 'readClaims should return the payload (the middle part) as an object.';
        if (probe.access?.token_use !== 'access') return 'readClaims works on ID tokens; make sure it works on any token, like the access token.';
        if (probe.left === undefined || probe.left === null) return 'Now finish secondsLeft: return claims.exp minus the current time in seconds.';
        if (Math.abs(probe.left - 1000) > 1 || Math.abs(probe.over + 90) > 1) {
          return Math.abs(probe.left) > 1e9 ? 'secondsLeft is way off: Date.now() is in milliseconds, exp is in seconds. Divide now by 1000.' : 'secondsLeft should be exp minus now (in seconds): 1,000 seconds left in the first test, -90 in the second.';
        }
        return true;
      },
      success: 'You can now see inside any sign-in token. Remember what you also saw: nothing in there proves it\'s genuine. That\'s the signature\'s job.',
    },
    {
      id: 'api-design',
      kind: 'read',
      title: 'The API, and who checks what',
      minutes: 15,
      body: `Here's the whole app. The browser never talks to the database: it talks to an API, and the API only lets verified requests through.

\`\`\`text
 Browser ──sign in──▶ Amazon Cognito ──tokens──▶ Browser
 Browser ──GET /progress, Authorization: Bearer <access token>──▶ API Gateway (HTTP API)
                                    JWT authorizer: signature, issuer, audience, expiry ✓
                                                    │  claims passed on
                                                    ▼
                                             AWS Lambda ──Query / Put──▶ Amazon DynamoDB
\`\`\`

**API Gateway** gives your function a web address. An **HTTP API** is its simpler, cheaper kind. You give it a **JWT authorizer** with two settings: the **issuer** (your user pool's address) and the **audience** (your app client's ID). Then, for every request, API Gateway:

1. Takes the token from the \`Authorization: Bearer …\` header.
2. Checks the signature with Cognito's public keys, then the issuer, the audience (\`aud\` or \`client_id\`) and the expiry.
3. Answers **401 Unauthorized** itself if anything is wrong. Your function never even runs.
4. Otherwise calls your function, with the token's claims at \`event.requestContext.authorizer.jwt.claims\`.

So inside the function, \`claims.sub\` is trustworthy: API Gateway verified it.

### Two routes, one function

| Route | Does |
|---|---|
| \`GET /progress\` | Lists every deck *this user* has progress in |
| \`PUT /progress/{deckId}\` | Saves *this user's* progress in one deck: \`{ index, known, unknown }\` |

Each request arrives with \`event.routeKey\`, like \`'PUT /progress/{deckId}'\`, so one \`switch\` sends it to the right code. \`{deckId}\` is a **path parameter**: for \`/progress/aws-basics\`, \`event.pathParameters.deckId\` is \`'aws-basics'\`.

### The table: two keys

| userId (partition key) | deckId (sort key) | index | known | unknown |
|---|---|---|---|---|
| f81a2c3e-… (Ana) | aws-basics | 3 | ["s3-1", "lambda-2"] | ["iam-4"] |
| f81a2c3e-… (Ana) | exam-traps | 7 | … | … |
| 2c9e4b71-… (Ben) | aws-basics | 12 | … | … |

- The **partition key**, \`userId\`, decides where the data lives. All of one person's rows sit together.
- The **sort key**, \`deckId\`, tells their rows apart, one per deck.
- **Query** reads *one partition*: "everything for this userId", fast and cheap however big the table grows.
- **Scan** reads *the whole table* and filters afterwards. It's slow, it's costly, and if the filter has a bug, it hands out everyone's data.

### The three rules of a user-data API

1. **The user comes from the token, never the request.** A body that says \`"userId": "ben"\` is ignored. If your code trusted it, anyone could read or overwrite anyone's progress by typing someone else's ID.
2. **Check every input.** Bad JSON, missing fields or the wrong types get a **400 Bad Request** with a message, never a crash and never a half-saved row.
3. **Answer with the right status code.** 200 OK, 400 bad input, 401 not signed in, 404 no such route. The page reacts to the number.`,
    },
    {
      id: 'save-progress',
      kind: 'try',
      runtime: 'node',
      title: 'Save progress for the signed-in user',
      minutes: 30,
      body: `The function's skeleton is ready: it reads the user from the claims, and sends \`PUT /progress/{deckId}\` to \`saveProgress\`. **Test with the sample event** sends what API Gateway would for Ana saving the \`aws-basics\` deck.

\`JSON.parse\` throws on bad JSON, so it goes in **try / catch**:

\`\`\`js
try {
  JSON.parse('{"index": 3, known: [');
} catch (err) {
  console.log('caught:', err.name);
}
\`\`\`

Saving with the DynamoDB document client is one command. It takes plain JavaScript values, lists included:

\`\`\`text
await db.send(new PutCommand({ TableName: TABLE, Item: { userId, deckId, index, known, unknown } }));
\`\`\`

> Notice the destructuring \`const { index, known, unknown } = progress\` in a good answer: it copies only the fields you expect. Anything else a request sends, including a sneaky \`userId\`, never reaches the table.`,
      task: 'Finish `saveProgress`: bad JSON and any problem from `checkProgress` get a 400, and good progress is saved under the token\'s user. Finish `checkProgress` too, so `known` and `unknown` must each be a list of strings.',
      hint: 'In saveProgress: `let progress; try { progress = JSON.parse(rawBody ?? \'\'); } catch { return reply(400, { message: \'The body must be JSON\' }); }`, then `const problem = checkProgress(progress); if (problem) return reply(400, { message: problem });`, then the PutCommand. In checkProgress, loop over `[\'known\', \'unknown\']` and use `Array.isArray(ids) && ids.every((id) => typeof id === \'string\')`.',
      solution: SAVE_SOLUTION,
      files: [{ path: 'index.mjs', starter: SAVE_STARTER, invoke: { event: PUT_EVENT, timeout: 10 } }],
      scenario: { env: { TABLE_NAME: 'StudyProgress' }, aws: { dynamodb: table([]) } },
      probe: SAVE_PROBE,
      check: ({ invoke, aws, probe, probeError }) => {
        if (!invoke || invoke.error) return null;
        const saved = (aws.dynamodb?.StudyProgress || []).find((i) => i.userId === ANA && i.deckId === 'aws-basics');
        if (!saved) return 'Nothing was saved for Ana yet: send a PutCommand with TableName: TABLE.';
        if (saved.index !== 3 || JSON.stringify(saved.known) !== JSON.stringify(['s3-1', 'lambda-2']) || JSON.stringify(saved.unknown) !== JSON.stringify(['iam-4'])) {
          return 'The row is there, but save index, known and unknown from the request body too.';
        }
        if (invoke.response?.statusCode !== 200) return 'Saved! Now reply 200 when it worked.';
        if (probeError || !probe) return null;
        if (probe.owners.includes(`${BEN}/exam-traps`)) return 'A request from Carla saved progress under Ben\'s ID, because its body said so. Use the userId from the token\'s claims only, and save only index, known and unknown from the body.';
        if (probe.sneaky !== 200 || !probe.owners.includes('carla-0001/exam-traps')) return 'A good request from another user (Carla) should be saved under their own ID from the token.';
        if (probe.badJson !== 400) return probe.badJson === 'crash' ? 'Broken JSON crashed the function (a crash is a 500 for the user). Put JSON.parse inside try / catch and reply 400.' : `Broken JSON got a ${probe.badJson} instead of 400: JSON.parse inside try / catch.`;
        if (probe.badIndex !== 400) return 'An index of -1 should get a 400: use checkProgress before saving.';
        if (probe.badList !== 400 || probe.noList !== 400) return 'known: "s3-1" (text instead of a list), or no lists at all, should get a 400, not be saved. Finish TODO 4 in checkProgress.';
        if (probe.owners.includes(`${ANA}/probe-deck`)) return 'Bad progress was saved anyway. Reply 400 before the PutCommand when checkProgress finds a problem.';
        if (probe.nobody !== 401) return 'A request without a signed-in user should get 401.';
        return true;
      },
      success: 'Good data is saved, under the right person, and nothing else gets in. The tests also sent broken JSON, wrong types and a request pretending to be Ben: all turned away with a 400, and Ben\'s progress was never touched.',
    },
    {
      id: 'list-progress',
      kind: 'try',
      runtime: 'node',
      title: 'List one person\'s decks, and only theirs',
      minutes: 25,
      body: `Now \`GET /progress\`. The table already has Ana's two decks and one of Ben's.

**Query** needs the partition key's value. You write the condition as an expression, with a placeholder (\`:u\`) for the value:

\`\`\`text
await db.send(new QueryCommand({
  TableName: TABLE,
  KeyConditionExpression: 'userId = :u',
  ExpressionAttributeValues: { ':u': userId },
}));
\`\`\`

The answer has an \`Items\` list. There's no need to send each item's \`userId\` back to the browser: an object **rest** pattern drops one field and keeps the others:

\`\`\`js
const { userId: _owner, ...deck } = { userId: 'f81a…', deckId: 'aws-basics', index: 3 };
deck
\`\`\`

> A Query returns up to 1 MB at a time; beyond that, the answer has a \`LastEvaluatedKey\` to ask for the next page. One person's flashcard progress is far smaller, but remember it for big partitions.`,
      task: 'Finish `listProgress(userId)`: Query the table for this user only, and reply 200 with `{ decks: [...] }`, each deck without its `userId`. Use Query, not Scan.',
      hint: '`const { Items = [] } = await db.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: \'userId = :u\', ExpressionAttributeValues: { \':u\': userId } }));` then `reply(200, { decks: Items.map(({ userId: _owner, ...deck }) => deck) })`.',
      solution: LIST_SOLUTION,
      files: [{ path: 'index.mjs', starter: LIST_STARTER, invoke: { event: GET_EVENT, timeout: 10 } }],
      scenario: { env: { TABLE_NAME: 'StudyProgress' }, aws: { dynamodb: table(SAVED) } },
      probe: LIST_PROBE,
      check: ({ invoke, aws, probe, probeError }) => {
        if (!invoke || invoke.error) return null;
        let body = null;
        try { body = JSON.parse(invoke.response?.body); } catch { return null; }
        const decks = body?.decks;
        if (!Array.isArray(decks) || !decks.length) return null;
        const usedScan = (aws.calls || []).some((c) => c.command === 'ScanCommand');
        const ids = decks.map((d) => d.deckId).sort();
        if (decks.some((d) => d.userId === BEN) || ids.length > 2) return 'Ana can see Ben\'s progress! Only read the partition for the userId from the token.';
        if (usedScan) return 'The right decks, but through a Scan: it reads every user\'s rows. Use a QueryCommand on userId instead.';
        if (JSON.stringify(ids) !== JSON.stringify(['aws-basics', 'exam-traps'])) return 'Ana has two decks: aws-basics and exam-traps.';
        if (decks.some((d) => 'userId' in d)) return 'Right decks! Now leave userId out of each one: ({ userId: _owner, ...deck }) => deck.';
        if (invoke.response.statusCode !== 200) return 'Reply 200 with the decks.';
        if (probeError || !probe) return null;
        const benIds = (probe.ben?.decks || []).map((d) => d.deckId);
        if (probe.benStatus !== 200 || benIds.length !== 1 || benIds[0] !== 'aws-basics' || probe.ben.decks[0].index !== 12) return 'Signed in as Ben, the list should show only Ben\'s one deck.';
        if (probe.unknownRoute !== 404) return 'Keep the default case: other routes get a 404.';
        return true;
      },
      success: 'Each person sees their own decks, read straight from their own partition. Ana can\'t see Ben\'s, whatever she sends, because the key comes from a token API Gateway verified.',
    },
    {
      id: 'page-signs-in',
      kind: 'try',
      runtime: 'web',
      title: 'The page: sign in, send the token, handle expiry',
      minutes: 30,
      body: `Now the browser side. \`signIn()\` is done: it's one \`fetch\` to Cognito's \`InitiateAuth\` call, the same request the AWS libraries make for you. Read it, then try the page: sign in with any email and password (the practice Cognito accepts anything).

Calling the API needs one header:

\`\`\`text
Authorization: Bearer eyJraWQiOi…
\`\`\`

With \`fetch\`, headers go in the second argument:

\`\`\`text
fetch(\`\${API}/progress\`, { headers: { Authorization: \`Bearer \${session.AccessToken}\` } })
\`\`\`

Use the **access token** for APIs. The ID token is for the page itself: here it shows who's signed in. (An HTTP API's JWT authorizer accepts either, because both carry your app's ID. But the access token is the one meant for this.)

### When the token runs out

After an hour the API answers **401**. Then the page should send the person back to sign in, with a friendly message, not show an empty list or crash. (A real app first tries the **refresh token** to get new tokens quietly: the same \`InitiateAuth\` call with \`AuthFlow: 'REFRESH_TOKEN_AUTH'\`. Libraries like AWS Amplify do it for you.)

### Where should tokens live?

| Where | Survives a reload | Risk |
|---|---|---|
| A variable (this page) | No: sign in again | Lowest: nothing else can read it |
| \`sessionStorage\` | Yes, in this tab | Any script on the page can read it |
| \`localStorage\` | Yes, in every tab, for good | Same, and it stays around |

The risk is **cross-site scripting**: if an attacker gets any script onto your page, everything in storage is theirs. Keep tokens out of \`localStorage\` unless you've thought it through.`,
      task: 'Make `loadProgress()` send the access token in an `Authorization: Bearer …` header, and when the API answers 401, call `showSignIn(\'Your session expired. Sign in again.\')` instead of showing the list.',
      hint: 'In the fetch options: headers: { Authorization: `Bearer ${session.AccessToken}` }. Right after the fetch: if (res.status === 401) { showSignIn(\'Your session expired. Sign in again.\'); return; }',
      solution: APP_SOLUTION,
      files: [
        { path: 'app.js', starter: APP_STARTER },
        { path: 'index.html', starter: PAGE_HTML },
        { path: 'style.css', starter: PAGE_CSS },
      ],
      scenario: PAGE_SCENARIO,
      probe: PAGE_PROBE,
      check: ({ probe, probeError }) => {
        if (probeError || !probe) return null;
        const { signedIn, expired } = probe;
        if (!signedIn.apiCalled) return null;
        if (!signedIn.auth) return 'The page called the API without an Authorization header, so the real API would answer 401. Add headers: { Authorization: `Bearer ${session.AccessToken}` }.';
        if (signedIn.auth === `Bearer ${ANA_ID_TOKEN}`) return 'That works with this API, but send the access token: it\'s the one meant for calling APIs. The ID token is for the page.';
        if (signedIn.auth !== `Bearer ${ANA_ACCESS_TOKEN}`) return `The header should be "Bearer " and the access token, with one space. It was: ${signedIn.auth.slice(0, 30)}…`;
        if (!signedIn.decks.length) return 'Signed in, but no decks are shown.';
        if (!expired.trackerHidden || !expired.formShown) return 'When the API answers 401, send the person back to the sign-in form: call showSignIn(...) and stop.';
        if (!/expired|sign in/i.test(expired.message || '')) return 'Back at sign-in. Tell them why: showSignIn(\'Your session expired. Sign in again.\').';
        return true;
      },
      success: 'Sign in, call the API with the token, and recover when it runs out: that\'s the whole sign-in story of a real web app. The AWS Study Hub does exactly this, with the AWS Amplify library refreshing tokens in the background.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: Developer Associate',
      minutes: 8,
      body: `The AWS Certified Developer – Associate exam loves this tutorial's topics. The points that come up most:

- **User pools vs identity pools.** A Cognito **user pool** is a user directory: sign-up, sign-in, tokens. An **identity pool** swaps a sign-in (from a user pool, Google, Apple…) for **temporary AWS credentials**, so a browser or phone app can call AWS services like S3 or DynamoDB directly. "Users must sign in" → user pool. "The app must upload straight to S3 with temporary credentials" → identity pool.
- **Three ways to protect an API.** An **HTTP API** uses a **JWT authorizer** (any OpenID Connect issuer, Cognito included). A **REST API** has a **Cognito user pool authorizer**. Both can use a **Lambda authorizer** for custom checks, like an API key in a header or a token from another system.
- **ID token vs access token.** The ID token describes the user (\`email\`, \`aud\`); the access token grants access (\`scope\`, \`client_id\`). Both last an hour by default; the refresh token, 30 days.
- **Never trust the client for identity.** Take the user from the verified claims (\`sub\`), not from the body, a header or the query string.
- **Partition key and sort key.** Pick a partition key with many different values, so the load spreads out (the user's ID is a classic). A sort key lets one partition hold many related items, and supports \`begins_with\` and \`BETWEEN\` in queries.
- **Query vs Scan.** Query reads one partition and is efficient; Scan reads everything. "Reduce cost and latency" usually means: change a Scan into a Query, maybe with a **global secondary index** for a different access pattern.
- **Fine-grained access.** When an identity pool gives users credentials for DynamoDB directly, an IAM condition on \`dynamodb:LeadingKeys\` with \`\${cognito-identity.amazonaws.com:sub}\` limits each user to items whose partition key is their own ID.
- **401 vs 403.** 401: not signed in, or the token is bad. 403: signed in, but not allowed.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'Where should the Lambda function get the ID of the user it\'s saving progress for?', options: ['A `userId` field in the request body', 'A `?user=` query string', '`event.requestContext.authorizer.jwt.claims.sub`', 'A cookie the page sets'], answer: 2, explain: 'Only the claims were checked by API Gateway\'s JWT authorizer. Anything else in the request can be typed by anyone.' },
        { q: 'A request with no token reaches a route protected by a JWT authorizer. What happens?', options: ['Lambda runs with empty claims', 'API Gateway answers 401 and the function never runs', 'API Gateway answers 500', 'Cognito asks for a password'], answer: 1, explain: 'The authorizer runs first. Without a valid token, API Gateway answers 401 Unauthorized itself.' },
        { q: 'Your page decodes a JWT and finds `"email": "admin@example.com"`. What does that prove?', options: ['That the user is the admin', 'Nothing by itself: anyone can write a payload; only a checked signature proves it came from Cognito', 'That the token hasn\'t expired', 'That the password was right'], answer: 1, explain: 'Decoding is just reading base64. Trust comes from verifying the signature with the issuer\'s public keys.' },
        { q: 'The table\'s partition key is `userId` and sort key is `deckId`. What\'s the efficient way to get all of one person\'s decks?', options: ['Scan with a filter on userId', 'Query with `userId = :u`', 'One GetItem for every possible deck', 'Read the whole table into the browser'], answer: 1, explain: 'Query reads only that user\'s partition. Scan reads every row in the table and throws most of them away.' },
        { q: 'A mobile app must upload photos straight to Amazon S3 after the user signs in. Which Cognito feature gives it temporary AWS credentials?', options: ['A user pool app client secret', 'An identity pool', 'The refresh token', 'A JWT authorizer'], answer: 1, explain: 'Identity pools exchange a sign-in for temporary AWS credentials, limited by an IAM role.' },
        { q: 'Which place for tokens is safest against a malicious script on the page?', options: ['localStorage', 'sessionStorage', 'A JavaScript variable in memory', 'The page\'s URL'], answer: 2, explain: 'A variable disappears on reload and isn\'t sitting in storage for any script to read. The price: signing in again (or a refresh) after a reload.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'js4-tokens', front: 'The three tokens Cognito returns at sign-in', back: 'ID token (who you are), access token (what you may call), refresh token (gets new ones without the password).', tags: ['cognito'], difficulty: 'easy' },
        { id: 'js4-jwt', front: 'The three parts of a JWT', back: 'header.payload.signature, base64url-encoded and joined by dots.', tags: ['jwt'], difficulty: 'easy' },
        { id: 'js4-decode', front: 'Read a JWT\'s payload in JavaScript', back: '`JSON.parse(atob(token.split(\'.\')[1].replace(/-/g, \'+\').replace(/_/g, \'/\')))`', hint: 'base64url', tags: ['jwt'], difficulty: 'medium' },
        { id: 'js4-claims', front: 'Where a Lambda function behind an HTTP API JWT authorizer finds the user', back: '`event.requestContext.authorizer.jwt.claims.sub`', tags: ['api gateway'], difficulty: 'medium' },
        { id: 'js4-bearer', front: 'The header that sends a token to an API', back: '`Authorization: Bearer <access token>`', tags: ['http'], difficulty: 'easy' },
        { id: 'js4-query', front: 'Get every item for one user from a table keyed on userId', back: '`new QueryCommand({ TableName, KeyConditionExpression: \'userId = :u\', ExpressionAttributeValues: { \':u\': userId } })`', tags: ['dynamodb'], difficulty: 'medium' },
        { id: 'js4-pools', front: 'User pool vs identity pool', back: 'User pool: users and sign-in, gives tokens. Identity pool: swaps a sign-in for temporary AWS credentials.', tags: ['cognito'], difficulty: 'medium' },
        { id: 'js4-401', front: '401 vs 403', back: '401 Unauthorized: not signed in or a bad token. 403 Forbidden: signed in, but not allowed.', tags: ['http'], difficulty: 'easy' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 60,
      body: `Deploy the whole study tracker on your own AWS account with the AWS command line: a user pool, a table, the function, and the API with its JWT authorizer. (The TypeScript course builds the same app again with the Cloud Development Kit, in one command.)

**Before you start:** the AWS command line signed in (see *Start here*), and \`zip\`. On Ubuntu or the Windows Subsystem for Linux, run \`sudo apt install -y zip\` first.

1. **A folder, and your settings.** Put your finished \`index.mjs\` from the *List one person's decks* step in it. The Node.js 22 runtime already includes the AWS SDK, so there's nothing to install.

\`\`\`sh
mkdir -p ~/aws-study-projects/javascript/study-tracker && cd ~/aws-study-projects/javascript/study-tracker
REGION=$(aws configure get region)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "$ACCOUNT $REGION"
\`\`\`

If the region comes out empty, set it yourself: \`REGION=us-east-1\` (or your region).

2. **The user pool, its app client, and a test user.** Pick a test password with upper and lower case, a number and a symbol. The \`--message-action SUPPRESS\` skips the welcome email.

\`\`\`sh
POOL_ID=$(aws cognito-idp create-user-pool --pool-name study-tracker-users \\
  --username-attributes email --auto-verified-attributes email \\
  --query UserPool.Id --output text)

CLIENT_ID=$(aws cognito-idp create-user-pool-client --user-pool-id "$POOL_ID" \\
  --client-name study-tracker-web --no-generate-secret \\
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \\
  --query UserPoolClient.ClientId --output text)
echo "$POOL_ID $CLIENT_ID"

aws cognito-idp admin-create-user --user-pool-id "$POOL_ID" --username you@example.com \\
  --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true \\
  --message-action SUPPRESS > /dev/null
aws cognito-idp admin-set-user-password --user-pool-id "$POOL_ID" --username you@example.com \\
  --password 'Practice-Passw0rd!' --permanent
\`\`\`

A browser can't keep a secret, so the app client has none (\`--no-generate-secret\`).

3. **The table**, keyed on user and deck, paid per request:

\`\`\`sh
aws dynamodb create-table --table-name StudyProgress \\
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=deckId,AttributeType=S \\
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=deckId,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST > /dev/null
aws dynamodb wait table-exists --table-name StudyProgress
\`\`\`

4. **The function's role**, allowed to write logs and to Query and Put on this one table only:

\`\`\`sh
cat > trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > table.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["dynamodb:Query","dynamodb:PutItem"],"Resource":"arn:aws:dynamodb:$REGION:$ACCOUNT:table/StudyProgress"}]}
EOF
ROLE_ARN=$(aws iam create-role --role-name study-tracker-api \\
  --assume-role-policy-document file://trust.json --query Role.Arn --output text)
aws iam attach-role-policy --role-name study-tracker-api \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy --role-name study-tracker-api \\
  --policy-name study-progress-table --policy-document file://table.json
\`\`\`

5. **The function.** A new role takes a few seconds before Lambda can use it, hence the pause.

\`\`\`sh
zip function.zip index.mjs
sleep 10
FUNCTION_ARN=$(aws lambda create-function --function-name study-tracker-api \\
  --runtime nodejs22.x --handler index.handler --role "$ROLE_ARN" \\
  --zip-file fileb://function.zip --timeout 10 \\
  --environment "Variables={TABLE_NAME=StudyProgress}" \\
  --query FunctionArn --output text)
\`\`\`

6. **The API, its JWT authorizer, and the two routes.** The cross-origin settings (CORS) let your page, on another address, call the API. \`'*'\` is fine for practice; use your site's address for real.

\`\`\`sh
cat > cors.json <<'EOF'
{"AllowOrigins":["*"],"AllowMethods":["GET","PUT"],"AllowHeaders":["authorization","content-type"]}
EOF
API_ID=$(aws apigatewayv2 create-api --name study-tracker --protocol-type HTTP \\
  --cors-configuration file://cors.json --query ApiId --output text)

AUTHORIZER_ID=$(aws apigatewayv2 create-authorizer --api-id "$API_ID" --name cognito \\
  --authorizer-type JWT --identity-source '$request.header.Authorization' \\
  --jwt-configuration Audience=$CLIENT_ID,Issuer=https://cognito-idp.$REGION.amazonaws.com/$POOL_ID \\
  --query AuthorizerId --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration --api-id "$API_ID" \\
  --integration-type AWS_PROXY --integration-uri "$FUNCTION_ARN" \\
  --payload-format-version 2.0 --query IntegrationId --output text)

for ROUTE in 'GET /progress' 'PUT /progress/{deckId}'; do
  aws apigatewayv2 create-route --api-id "$API_ID" --route-key "$ROUTE" \\
    --target "integrations/$INTEGRATION_ID" \\
    --authorization-type JWT --authorizer-id "$AUTHORIZER_ID" > /dev/null
done

aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy > /dev/null
aws lambda add-permission --function-name study-tracker-api --statement-id apigateway-invoke \\
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \\
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT:$API_ID/*" > /dev/null
API=https://$API_ID.execute-api.$REGION.amazonaws.com
echo "$API"
\`\`\`

7. **Try it with curl.** First without a token (API Gateway answers 401 itself), then signed in:

\`\`\`sh
curl -i "$API/progress"

TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id "$CLIENT_ID" \\
  --auth-parameters USERNAME=you@example.com,PASSWORD='Practice-Passw0rd!' \\
  --query AuthenticationResult.AccessToken --output text)

curl -i -X PUT "$API/progress/aws-basics" -H "Authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' -d '{"index":3,"known":["s3-1"],"unknown":["iam-4"]}'
curl -s "$API/progress" -H "Authorization: Bearer $TOKEN"
curl -i -X PUT "$API/progress/aws-basics" -H "Authorization: Bearer $TOKEN" -d 'not json'
\`\`\`

The last one should be a 400. If a call fails, \`aws logs tail /aws/lambda/study-tracker-api --since 10m\` shows the function's log.

8. **The page.** Copy \`app.js\`, \`index.html\` and \`style.css\` from the last practice step into the folder. In \`app.js\`, set \`REGION\`, \`CLIENT_ID\` and \`API\` to your values (\`echo "$REGION $CLIENT_ID $API"\`). Serve the folder and open http://localhost:8000:

\`\`\`sh
python3 -m http.server 8000
\`\`\`

Sign in with your test user. Save some progress with curl, press **Refresh**, and it appears.

9. **Push to GitHub.** The client ID and API address aren't secrets: anyone using your page can see them. The password is: never commit it.

**Cost:** Cognito is free for your first 10,000 monthly active users. Lambda and DynamoDB on-demand stay within their always-free amounts at this size, and an HTTP API costs about $1 per million requests. Expect nothing, or a few cents.

**Clean up** when you're done. In a new terminal, set the variables again first:

\`\`\`sh
REGION=$(aws configure get region)
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='study-tracker'].ApiId" --output text)
POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='study-tracker-users'].Id" --output text)
echo "$API_ID $POOL_ID"
\`\`\`

\`\`\`sh
aws apigatewayv2 delete-api --api-id "$API_ID"
aws lambda delete-function --function-name study-tracker-api
aws iam delete-role-policy --role-name study-tracker-api --policy-name study-progress-table
aws iam detach-role-policy --role-name study-tracker-api \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name study-tracker-api
aws dynamodb delete-table --table-name StudyProgress > /dev/null
aws cognito-idp delete-user-pool --user-pool-id "$POOL_ID"
aws logs delete-log-group --log-group-name /aws/lambda/study-tracker-api
\`\`\``,
      checklist: [
        '`curl "$API/progress"` without a token gets a 401 from API Gateway',
        'With a token from `initiate-auth`, I saved progress and listed it back',
        'Bad JSON gets a 400',
        'My page signs in, shows my decks, and sends me back to sign-in on a 401',
        'It\'s on GitHub, with no password in it',
        'I cleaned up (or kept it, knowing what it costs)',
      ],
    },
  ],
};

export default tutorial;
