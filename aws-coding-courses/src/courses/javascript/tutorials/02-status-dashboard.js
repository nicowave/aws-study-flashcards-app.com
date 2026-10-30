// Tutorial 2: a live status dashboard that answers "is AWS down, or is it us?"

// ---------------------------------------------------------------------------
// The practice internet: the company's own health endpoints, each failing in
// a different way, plus a pretend public status feed for AWS.
// ---------------------------------------------------------------------------

const API = 'https://status.example.com/api';
const FEED = 'https://health.example.com/feed.json';
const GONE = 'https://old-status.example.net/api/billing.json';

const ENDPOINTS = {
  [`${API}/website.json`]: { status: 200, json: { service: 'Website', status: 'ok' }, ms: 140 },
  [`${API}/signin.json`]: { status: 200, json: { service: 'Sign-in', status: 'ok' }, ms: 220 },
  [`${API}/checkout.json`]: { status: 503, body: 'Service Unavailable', ms: 90 },
  [`${API}/search.json`]: { hang: true },
  [`${API}/email.json`]: { status: 200, body: '<html><title>Down for maintenance</title></html>', ms: 160 },
  [`${API}/missing.json`]: { status: 404, body: 'Not Found', ms: 60 },
  [`${API}/reports.json`]: {
    sequence: [
      { status: 503, body: 'Service Unavailable', ms: 80 },
      { status: 503, body: 'Service Unavailable', ms: 80 },
      { status: 200, json: { service: 'Reports', status: 'ok' }, ms: 120 },
    ],
  },
  [FEED]: {
    status: 200,
    ms: 300,
    json: {
      source: 'Pretend public status feed',
      services: [
        { name: 'Amazon S3', region: 'us-east-1', status: 'operational' },
        { name: 'AWS Lambda', region: 'us-east-1', status: 'degraded', note: 'Increased error rates for some invocations' },
        { name: 'Amazon DynamoDB', region: 'us-east-1', status: 'operational' },
        { name: 'Amazon CloudFront', region: 'global', status: 'operational' },
      ],
    },
  },
};

const web = () => ({ web: ENDPOINTS });

// What each of the company's services should show, and why
const EXPECTED = {
  Website: 'ok',
  'Sign-in': 'ok',
  Checkout: 'down', // the service answered 503
  Search: 'unknown', // no answer before the timeout
  Email: 'unknown', // answered, but not with JSON
};

// ---------------------------------------------------------------------------
// The pages
// ---------------------------------------------------------------------------

const BASE_CSS = `body { font-family: system-ui, sans-serif; margin: 1.5rem; color: #1d2430; }
h1 { font-size: 1.3rem; margin: 0 0 0.75rem; }
ul { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; gap: 0.4rem; max-width: 30rem; }
li { padding: 0.45rem 0.7rem; border-radius: 6px; background: #eef1f5; }
li.ok { background: #e2f6e5; }
li.degraded { background: #fff4d6; }
li.down { background: #fde3e1; }
li.unknown { background: #e9e9ee; color: #555; }
.muted { color: #667; font-size: 0.85rem; }
button { margin-right: 0.4rem; padding: 0.35rem 0.8rem; }`;

const FIRST_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Is it us?</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Is it us?</h1>
  <p>Website: <strong id="website">checking…</strong></p>
  <script src="app.js"></script>
</body>
</html>`;

const FIRST_STARTER = `// app.js: ask the website's health endpoint how it's doing.
const WEBSITE_URL = '${API}/website.json';

async function showWebsite() {
  // TODO: fetch WEBSITE_URL, read the answer as JSON, and put its
  //       status (data.status) into the #website element
}

showWebsite();
`;

const FIRST_SOLUTION = `// app.js: ask the website's health endpoint how it's doing.
const WEBSITE_URL = '${API}/website.json';

async function showWebsite() {
  const response = await fetch(WEBSITE_URL);
  const data = await response.json();
  document.querySelector('#website').textContent = data.status;
}

showWebsite();`;

const CHECK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Check one service</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Check one service</h1>
  <p class="muted">The results appear in the console below.</p>
  <script src="app.js"></script>
</body>
</html>`;

const CHECK_STARTER = `// app.js: check one service, and never crash or hang doing it.
const TIMEOUT_MS = 3000;

// Returns { status, detail }:
//   status 'ok' / 'degraded' / 'down' when the service told us,
//   status 'unknown' when we couldn't find out.
async function checkService(url) {
  // TODO 1: give up after TIMEOUT_MS: fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const response = await fetch(url);

  // TODO 2: an HTTP error (response.ok is false) means the service is down:
  //         return { status: 'down', detail: \`HTTP \${response.status}\` }

  const data = await response.json();
  return { status: data.status, detail: 'answered' };

  // TODO 3: wrap it all in try/catch. Any error (timeout, no network,
  //         an answer that isn't JSON) means we don't know:
  //         return { status: 'unknown', detail: error.message }
}

for (const name of ['website', 'checkout']) {
  checkService(\`${API}/\${name}.json\`)
    .then((result) => console.log(name, result))
    .catch((error) => console.error(name, 'crashed:', error.message));
}
`;

const CHECK_FUNCTION = `async function checkService(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      return { status: 'down', detail: \`HTTP \${response.status}\` };
    }
    const data = await response.json();
    return { status: data.status, detail: 'answered' };
  } catch (error) {
    // TimeoutError, "Failed to fetch" or a SyntaxError from .json(): we can't tell
    if (error.name === 'TimeoutError') return { status: 'unknown', detail: \`no answer in \${TIMEOUT_MS / 1000} seconds\` };
    if (error.name === 'SyntaxError') return { status: 'unknown', detail: 'the answer was not JSON' };
    return { status: 'unknown', detail: error.message };
  }
}`;

const CHECK_SOLUTION = `// app.js: check one service, and never crash or hang doing it.
const TIMEOUT_MS = 3000;

// Returns { status, detail }:
//   status 'ok' / 'degraded' / 'down' when the service told us,
//   status 'unknown' when we couldn't find out.
${CHECK_FUNCTION}

for (const name of ['website', 'checkout']) {
  checkService(\`${API}/\${name}.json\`)
    .then((result) => console.log(name, result))
    .catch((error) => console.error(name, 'crashed:', error.message));
}`;

const DASH_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Is it us?</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Is it us?</h1>
  <h2>Our services</h2>
  <ul id="services"></ul>
  <h2>AWS</h2>
  <ul id="aws"><li>checking…</li></ul>
  <p id="updated" class="muted">Not checked yet</p>
  <button id="refresh">Refresh now</button>
  <button id="pause">Pause</button>
  <script src="app.js"></script>
</body>
</html>`;

const DASH_TOP = `// app.js: is AWS down, or is it us? Checks every 30 seconds.
const TIMEOUT_MS = 3000;
const REFRESH_MS = 30000;
const FEED_URL = '${FEED}';
const SERVICES = [
  { name: 'Website', url: '${API}/website.json' },
  { name: 'Sign-in', url: '${API}/signin.json' },
  { name: 'Checkout', url: '${API}/checkout.json' },
  { name: 'Search', url: '${API}/search.json' },
  { name: 'Email', url: '${API}/email.json' },
];

// From the last step
${CHECK_FUNCTION}

// One <li> per service, coloured by its status (see style.css)
function renderServices(results) {
  const list = document.querySelector('#services');
  list.replaceChildren();
  results.forEach((result, i) => {
    const li = document.createElement('li');
    li.className = result.status;
    li.textContent = \`\${SERVICES[i].name}: \${result.status} (\${result.detail})\`;
    list.append(li);
  });
}
`;

export const DASH_STARTER = `${DASH_TOP}
// The AWS feed: list only the services that aren't 'operational'
function renderAws(feed) {
  const list = document.querySelector('#aws');
  list.replaceChildren();
  // TODO: for each service in feed.services whose status isn't 'operational',
  //       add an <li> like "AWS Lambda (us-east-1): degraded"
  //       If there are none, add one <li> saying "All operational".
}

let timer = null;

async function refresh() {
  // TODO 1: check every service AND the feed at the same time with
  //         Promise.allSettled([...SERVICES.map((s) => checkService(s.url)), fetchFeed()])
  //         then render the services, and the feed if it was fulfilled
  // TODO 2: show the time: "Last updated 10:42:13 AM" in #updated
}

async function fetchFeed() {
  const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

document.querySelector('#refresh').addEventListener('click', refresh);

// TODO 3: refresh now, then every REFRESH_MS with setInterval.
// TODO 4: #pause stops the timer with clearInterval and its label becomes
//         "Resume"; clicking again starts it and sets the label back to "Pause".
`;

export const DASH_SOLUTION = `${DASH_TOP}
// The AWS feed: list only the services that aren't 'operational'
function renderAws(feed) {
  const list = document.querySelector('#aws');
  list.replaceChildren();
  const problems = feed.services.filter((s) => s.status !== 'operational');
  for (const s of problems) {
    const li = document.createElement('li');
    li.className = 'degraded';
    li.textContent = \`\${s.name} (\${s.region}): \${s.status}\${s.note ? \` - \${s.note}\` : ''}\`;
    list.append(li);
  }
  if (problems.length === 0) {
    const li = document.createElement('li');
    li.className = 'ok';
    li.textContent = 'All operational';
    list.append(li);
  }
}

let timer = null;
let refreshing = false;

async function refresh() {
  if (refreshing) return; // a check is still running: don't pile up requests
  refreshing = true;
  try {
    const settled = await Promise.allSettled([...SERVICES.map((s) => checkService(s.url)), fetchFeed()]);
    const feed = settled.pop();
    renderServices(settled.map((r) => r.value));
    if (feed.status === 'fulfilled') renderAws(feed.value);
    else document.querySelector('#aws').innerHTML = '<li class="unknown">Feed unavailable</li>';
    document.querySelector('#updated').textContent = \`Last updated \${new Date().toLocaleTimeString()}\`;
  } finally {
    refreshing = false;
  }
}

async function fetchFeed() {
  const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

document.querySelector('#refresh').addEventListener('click', refresh);

function start() {
  timer = setInterval(refresh, REFRESH_MS);
  document.querySelector('#pause').textContent = 'Pause';
}

function stop() {
  clearInterval(timer);
  timer = null;
  document.querySelector('#pause').textContent = 'Resume';
}

document.querySelector('#pause').addEventListener('click', () => (timer ? stop() : start()));

refresh();
start();`;

const RETRY_STARTER = `// retry.mjs: ask again when a service is busy, politely.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url, { tries = 3, baseMs = 200 } = {}) {
  // TODO: try up to \`tries\` times.
  //  - A network error or timeout, a 429 or a 5xx status: wait, then try again.
  //    Wait baseMs * 2 ** (attempt - 1), plus a random bit up to baseMs.
  //  - Any other error status (like 404): don't retry, throw straight away.
  //  - After the last try, throw.
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(\`HTTP \${response.status} from \${url}\`);
  return response.json();
}

const report = await fetchWithRetry('${API}/reports.json');
console.log('got', report.service, report.status);
`;

const RETRY_SOLUTION = `// retry.mjs: ask again when a service is busy, politely.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url, { tries = 3, baseMs = 200 } = {}) {
  for (let attempt = 1; ; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    } catch (error) {
      if (attempt >= tries) throw error; // no answer at all, and no tries left
    }
    if (response) {
      if (response.ok) return response.json();
      const worthRetrying = response.status === 429 || response.status >= 500;
      if (!worthRetrying || attempt >= tries) throw new Error(\`HTTP \${response.status} from \${url}\`);
    }
    const wait = baseMs * 2 ** (attempt - 1) + Math.random() * baseMs;
    console.log(\`attempt \${attempt} failed, trying again in \${Math.round(wait)} ms\`);
    await sleep(wait);
  }
}

const report = await fetchWithRetry('${API}/reports.json');
console.log('got', report.service, report.status);`;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const DASH_PROBE = `await practice.wait(300);
if (!practice.fetchLog.length) return { idle: true };
const finished = () => {
  const items = practice.all('#services li');
  return items.length === 5 && !practice.text('#aws').includes('checking');
};
const done = await practice.until(finished, 4500);
const services = practice.all('#services li').map((li) => ({ text: li.textContent.replace(/\\s+/g, ' ').trim(), cls: li.className }));
const aws = practice.all('#aws li').map((li) => li.textContent.replace(/\\s+/g, ' ').trim());
const updated = practice.text('#updated');
const before = practice.fetchLog.length;
await practice.click('#refresh');
const after = practice.fetchLog.length;
await practice.click('#pause');
const paused = practice.text('#pause');
await practice.click('#pause');
const resumed = practice.text('#pause');
return { done: !!done, services, aws, updated, before, after, paused, resumed };`;

const SERVICES_COUNT = Object.keys(EXPECTED).length;

const checkDashboard = ({ result, probe, probeError, sources }) => {
  if (probeError || !probe) return null;
  if (probe.idle) return result.errors.length ? null : 'The page doesn\'t check anything yet. refresh() should check every service and the feed, and the page should call it when it loads.';
  if (!probe.done) {
    if (!probe.services.length) return result.errors.length ? null : 'The services list stays empty. refresh() should check them all and call renderServices with the results.';
    return 'The dashboard never finished its first check within a few seconds. Is every request given a timeout, and does the AWS list get filled in?';
  }
  for (const [name, status] of Object.entries(EXPECTED)) {
    const item = probe.services.find((s) => s.text.startsWith(`${name}:`));
    if (!item) return `${name} is missing from the list.`;
    if (item.cls !== status) return `${name} shows "${item.cls}" but should be "${status}".`;
  }
  if (!probe.aws.some((t) => t.includes('AWS Lambda') && t.includes('degraded'))) return 'The AWS list should show AWS Lambda as degraded.';
  if (probe.aws.some((t) => t.includes('Amazon S3'))) return 'Only list the AWS services that are not operational: Amazon S3 is fine.';
  if (!/Last updated .*\d{1,2}[:.]\d{2}/.test(probe.updated || '')) return 'Show when the page last checked: "Last updated" and the time, in #updated.';
  if (probe.after - probe.before < SERVICES_COUNT) return 'Refresh now should check every service again.';
  const code = sources['app.js'] || '';
  if (!/setInterval\s*\(/.test(code)) return 'The page should refresh itself: use setInterval(refresh, REFRESH_MS).';
  if (probe.paused !== 'Resume' || !/clearInterval\s*\(/.test(code)) return 'Pause should stop the timer with clearInterval and change its label to "Resume".';
  if (probe.resumed !== 'Pause') return 'Clicking "Resume" should start the timer again and set the label back to "Pause".';
  return true;
};

const tutorial = {
  slug: 'status-dashboard',
  number: 2,
  title: 'Live status dashboard',
  situation: '"Is AWS down, or is it us?" Every time something breaks, the team spends the first 20 minutes finding out, one browser tab at a time. You build one page that asks every service how it\'s doing, checks a public status feed for AWS, refreshes itself, and stays calm when a service fails or doesn\'t answer.',
  level: 'Beginner',
  hours: 4,
  skills: ['fetch', 'Promises', 'async and await', 'error handling', 'timeouts', 'Promise.allSettled', 'timers', 'retries'],
  aws: ['Amazon S3 static websites', 'CORS'],
  overview: 'You\'ll learn how a page talks to the internet with `fetch`, why answers arrive "later" as Promises, and how `async` and `await` make that readable. Then you build the dashboard: every check has a timeout, a failing service shows "unknown" instead of a blank page, everything is checked at once, and the page refreshes itself every 30 seconds. Last, you retry politely with exponential backoff.',
  steps: [
    {
      id: 'fetch-basics',
      kind: 'read',
      runtime: 'web',
      title: 'Asking a server: fetch and Promises',
      minutes: 15,
      body: `Most services publish a tiny **health endpoint**: an address that answers with JSON saying how the service is doing. Here's what the company's website endpoint returns:

\`\`\`json
{ "service": "Website", "status": "ok" }
\`\`\`

In JavaScript, \`fetch(url)\` asks for it. But it doesn't hand you the answer. Run this in the page console below:

\`\`\`js
fetch('${API}/website.json') instanceof Promise
\`\`\`

\`true\`: you get a **Promise**. Asking a server takes time, from milliseconds to never, and JavaScript doesn't stop and wait. \`fetch\` hands you a Promise straight away: a box the answer will be put in later. The page stays responsive in the meantime.

### await: wait for the box to fill

Put \`await\` in front of a Promise to wait for its value. Here, that's a **Response**: the status code, the headers, and a body you haven't read yet:

\`\`\`js
const response = await fetch('${API}/website.json');
[response.status, response.ok, response.headers.get('content-type')]
\`\`\`

Reading the body takes time too, so \`.json()\` is another Promise:

\`\`\`js
const res = await fetch('${API}/website.json');
const data = await res.json();
data.status
\`\`\`

> This console waits for Promises and shows what's inside. A browser's own console shows \`Promise {<pending>}\` until you \`await\` it.

### async functions

Inside a script, \`await\` only works inside a function marked \`async\`. An \`async\` function always returns a Promise, so whoever calls it can \`await\` it in turn:

\`\`\`js
async function getStatus(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data.status;
}
await getStatus('${API}/signin.json')
\`\`\`

> You'll also meet the older style, \`fetch(url).then((r) => r.json()).then((data) => ...)\`. It does the same thing; \`await\` is easier to read, so this course uses it.`,
      scenario: web,
    },
    {
      id: 'first-fetch',
      kind: 'try',
      runtime: 'web',
      title: 'Show the website\'s status',
      minutes: 10,
      body: 'Edit `app.js`, then press **Run the page**. The preview shows the page; the console under it shows anything the page logs, and errors.',
      task: 'Finish `showWebsite()` so the page fetches the website\'s health endpoint and puts its status into **#website** (it should say `ok`).',
      hint: '`const response = await fetch(WEBSITE_URL);` then `const data = await response.json();` then `document.querySelector(\'#website\').textContent = data.status;`',
      solution: FIRST_SOLUTION,
      files: [
        { path: 'app.js', starter: FIRST_STARTER },
        { path: 'index.html', starter: FIRST_HTML },
        { path: 'style.css', starter: BASE_CSS },
      ],
      scenario: web,
      probe: `await practice.until(() => practice.text('#website') !== 'checking…', 2500);
return { text: practice.text('#website'), fetched: practice.fetchLog.map((e) => e.url) };`,
      check: ({ probe, probeError }) => {
        if (probeError || !probe) return null;
        if (probe.text === 'ok') return true;
        if (probe.text === 'checking…') return null;
        if (probe.text === '[object Promise]') return 'The page shows "[object Promise]": put `await` in front of `fetch(...)` and `response.json()`.';
        if (probe.text === '[object Object]') return 'That\'s the whole JSON object. Show just its status: `data.status`.';
        if (probe.text === 'undefined') return 'The page shows "undefined". The JSON has a `status` field: `data.status`, with the data from `await response.json()`.';
        return `#website says "${probe.text}"; it should say "ok".`;
      },
      success: 'Your page just asked another server for data and showed the answer. Every dashboard, weather widget and shopping cart starts with exactly this.',
    },
    {
      id: 'when-it-fails',
      kind: 'read',
      runtime: 'web',
      title: 'When the answer is bad, or never comes',
      minutes: 15,
      body: `During an outage, health endpoints fail in every way you can think of. The practice internet has one of each. Try them:

**1. The service answers with an error status.** Checkout is answering *503 Service Unavailable*:

\`\`\`js
const r = await fetch('${API}/checkout.json');
[r.status, r.ok]
\`\`\`

**\`fetch\` does not fail on an error status.** It only fails when there's no answer at all. A 404 or a 503 is still an answer, so check \`response.ok\` (true for 200 to 299) yourself.

**2. The answer isn't JSON.** Email answers with a "down for maintenance" web page:

\`\`\`js
await (await fetch('${API}/email.json')).json()
\`\`\`

That's a \`SyntaxError\`: \`.json()\` throws when the body isn't JSON.

**3. No answer at all.** Search accepts the request and never replies. Without a time limit, your page waits for ever. \`AbortSignal.timeout(ms)\` gives up after that long:

\`\`\`js
await fetch('${API}/search.json', { signal: AbortSignal.timeout(2000) })
\`\`\`

After two seconds: a \`TimeoutError\`. **Every request to a server you don't control needs a timeout.** A few seconds is plenty for a health endpoint.

**4. The address doesn't exist** (an old server, or the network is down):

\`\`\`js
await fetch('${GONE}')
\`\`\`

\`TypeError: Failed to fetch\`.

### try / catch

Errors 2, 3 and 4 *throw*: they stop the function unless you catch them. \`try { ... } catch (error) { ... }\` runs the \`catch\` part when anything in the \`try\` part throws:

\`\`\`js
try {
  await fetch('${API}/search.json', { signal: AbortSignal.timeout(1000) });
} catch (error) {
  console.log('could not check:', error.name);
}
\`\`\`

For a dashboard, the rule is simple:

| What happened | Show |
|---|---|
| JSON with a status | that status (\`ok\`, \`degraded\`, \`down\`) |
| An error status, like 503 | \`down\`: the service said so |
| Timeout, no network, or not JSON | \`unknown\`: we couldn't find out |

"Unknown" is honest. A blank page, or a page frozen on "checking…", is how dashboards lose people's trust in the middle of an incident.`,
      scenario: web,
    },
    {
      id: 'check-service',
      kind: 'try',
      runtime: 'web',
      title: 'A check that never crashes or hangs',
      minutes: 20,
      task: 'Finish `checkService(url)`. It must **always** return `{ status, detail }` and never throw or hang: the service\'s own status for a good answer, `down` for an error status (with the code in `detail`, like `HTTP 503`), and `unknown` for a timeout, a network error or an answer that isn\'t JSON. Give every request a timeout of `TIMEOUT_MS`.',
      hint: 'Put everything inside `try { ... } catch (error) { return { status: \'unknown\', detail: error.message }; }`. Inside the try: `fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })`, then `if (!response.ok) return { status: \'down\', detail: \'HTTP \' + response.status };`',
      solution: CHECK_SOLUTION,
      files: [
        { path: 'app.js', starter: CHECK_STARTER },
        { path: 'index.html', starter: CHECK_HTML },
        { path: 'style.css', starter: BASE_CSS },
      ],
      scenario: web,
      probe: `const urls = { website: '${API}/website.json', checkout: '${API}/checkout.json', search: '${API}/search.json', email: '${API}/email.json', gone: '${GONE}' };
if (typeof checkService !== 'function') return { missing: true };
const out = {};
const hung = new Promise((resolve) => setTimeout(() => resolve({ hung: true }), 3400));
for (const [name, url] of Object.entries(urls)) {
  try { out[name] = await Promise.race([checkService(url), hung]); } catch (error) { out[name] = { threw: error.name + ': ' + error.message }; }
}
return { out, searchHadTimeout: practice.fetchLog.filter((e) => e.url.endsWith('/search.json')).every((e) => e.hasSignal) };`,
      check: ({ probe, probeError }) => {
        if (probeError === 'Timeout') return null;
        if (probeError || !probe || probe.missing) return null;
        const { out } = probe;
        const hungOn = Object.entries(out).find(([, r]) => r.hung);
        if (hungOn) return `checkService never answered for ${hungOn[0]}. Give fetch a timeout: { signal: AbortSignal.timeout(TIMEOUT_MS) }.`;
        const threw = Object.entries(out).find(([, r]) => r.threw);
        if (threw) return `checkService threw for ${threw[0]} (${threw[1].threw}). Catch every error and return { status: 'unknown', ... } instead.`;
        if (out.website.status !== 'ok') return `The website is fine, but checkService says "${out.website.status}".`;
        if (out.checkout.status !== 'down') return `Checkout answered 503, so it's "down" (you got "${out.checkout.status}"). Check response.ok before reading the JSON.`;
        if (!String(out.checkout.detail).includes('503')) return 'Put the status code in the detail for an error status, like "HTTP 503".';
        if (!probe.searchHadTimeout) return 'Search never answers: give fetch a signal, AbortSignal.timeout(TIMEOUT_MS).';
        for (const name of ['search', 'email', 'gone']) {
          if (out[name].status !== 'unknown') return `${name} should be "unknown" (we couldn't find out), not "${out[name].status}".`;
        }
        return true;
      },
      success: 'Five ways to fail, one calm answer each. This function is the heart of the dashboard, and the same pattern (timeout, check the status, catch the rest) belongs around every call to someone else\'s server.',
    },
    {
      id: 'all-at-once',
      kind: 'read',
      runtime: 'web',
      title: 'Check everything at once, and show it',
      minutes: 15,
      body: `### One after another is slow

With \`await\` in a loop, each check waits for the one before it. If Search takes its full 3 seconds to time out, every service after it waits too. Five slow services, 15 seconds.

Start them all first, then wait for all of them together. \`Promise.allSettled\` takes a list of Promises and waits until **every one** has finished, whether it worked or failed:

\`\`\`js
const results = await Promise.allSettled([
  fetch('${API}/website.json'),
  fetch('${GONE}'),
]);
results.map((r) => r.status)
\`\`\`

Each result is \`{ status: 'fulfilled', value }\` or \`{ status: 'rejected', reason }\`.

**Why not \`Promise.all\`?** It's the same idea, but it rejects as soon as *one* Promise fails, and you lose every other answer. On a dashboard, one broken service would blank out the healthy ones:

\`\`\`js
await Promise.all([fetch('${API}/website.json'), fetch('${GONE}')])
\`\`\`

### Turning data into a list on the page

\`.map()\` turns a list of things into a list of other things, and \`.filter()\` keeps only the ones you want:

\`\`\`js
const feed = await (await fetch('${FEED}')).json();
feed.services.filter((s) => s.status !== 'operational').map((s) => s.name)
\`\`\`

To show them, make an element for each one:

\`\`\`js
const li = document.createElement('li');
li.textContent = 'AWS Lambda: degraded';
document.body.append(li);
\`\`\`

> Use \`textContent\`, not \`innerHTML\`, for text that came from somewhere else. \`innerHTML\` runs any HTML it's given, so a feed that sent \`<img src=x onerror=...>\` could run code in your page.

### Times

\`new Date()\` is right now. \`toLocaleTimeString()\` formats it the way the viewer's computer does:

\`\`\`js
\`Last updated \${new Date().toLocaleTimeString()}\`
\`\`\`

### Timers

\`setInterval(fn, ms)\` calls \`fn\` every \`ms\` milliseconds and returns an ID. \`clearInterval(id)\` stops it:

\`\`\`js
let n = 0;
const id = setInterval(() => console.log('tick', ++n), 1000);
setTimeout(() => clearInterval(id), 3500);
'ticking for 3.5 seconds…'
\`\`\`

**Don't hammer.** A dashboard open on ten screens, refreshing every second, is 36,000 requests an hour to a service that might be struggling already. Every 30 seconds is plenty for "is it up?", and never start a new check while the last one is still running.`,
      scenario: web,
    },
    {
      id: 'dashboard',
      kind: 'try',
      runtime: 'web',
      title: 'The dashboard',
      minutes: 30,
      body: '`app.js` has your `checkService` and a `renderServices` that draws the list. You write the rest: the AWS list, the refresh, the time, and the timer.',
      task: 'Finish the dashboard: `refresh()` checks all five services **and** the AWS feed at the same time with `Promise.allSettled`, draws the services, lists only the AWS services that aren\'t `operational`, and shows "Last updated" with the time. The page refreshes itself every `REFRESH_MS`, **Refresh now** checks again, and **Pause** stops the timer (its label becomes "Resume"; clicking again restarts it).',
      hint: 'In refresh: `const settled = await Promise.allSettled([...SERVICES.map((s) => checkService(s.url)), fetchFeed()]);` The last result is the feed: `const feed = settled.pop();` and the rest are services: `renderServices(settled.map((r) => r.value))`. For the timer: `timer = setInterval(refresh, REFRESH_MS)` and `clearInterval(timer)`.',
      solution: DASH_SOLUTION,
      files: [
        { path: 'app.js', starter: DASH_STARTER },
        { path: 'index.html', starter: DASH_HTML },
        { path: 'style.css', starter: BASE_CSS },
      ],
      scenario: web,
      probe: DASH_PROBE,
      check: checkDashboard,
      success: 'Next outage, one glance answers the question: AWS Lambda is degraded in us-east-1, Checkout is down, Search isn\'t answering. That\'s 20 minutes back, and a calmer incident channel.',
    },
    {
      id: 'retry',
      kind: 'try',
      runtime: 'node',
      title: 'Retry, politely',
      minutes: 20,
      body: `Some failures are temporary. A service that's busy answers **429 Too Many Requests**; one that's restarting answers **503** for a few seconds. Asking again a moment later often works. Asking again *immediately*, in a tight loop, makes it worse: every client hammering a struggling service at once keeps it down.

The polite way is **exponential backoff with jitter**:

- wait a little before the second try, twice as long before the third, and so on (200 ms, 400 ms, 800 ms…);
- add a random bit (**jitter**), so a thousand clients that failed at the same moment don't all come back at the same moment;
- give up after a few tries;
- only retry what can get better: a timeout, a network error, a 429 or a 5xx. A **404 Not Found** will be just as missing next time.

This step runs on the server side, like Node.js: the same JavaScript, without a page. \`2 ** 3\` is 2 to the power of 3, which is 8.

\`\`\`js
[0, 1, 2, 3].map((n) => 200 * 2 ** n)
\`\`\`

The practice Reports endpoint answers 503 twice, then works (and stays up, so later runs succeed first time; the check also tries a fresh flaky service of its own).`,
      task: 'Finish `fetchWithRetry(url, { tries, baseMs })`: retry timeouts, network errors, 429 and 5xx answers, waiting `baseMs * 2 ** (attempt - 1)` plus a random bit up to `baseMs` between tries; never retry other error statuses (like 404); throw after the last try. The Reports call at the bottom should then print `got Reports ok`.',
      hint: 'Loop `for (let attempt = 1; ; attempt++)`. Put the fetch in try/catch (a throw means no answer: retry unless it was the last try). If `response.ok`, return the JSON. Otherwise `const worthRetrying = response.status === 429 || response.status >= 500;` and throw if it isn\'t, or if it was the last try. Then wait and loop.',
      solution: RETRY_SOLUTION,
      files: [{ path: 'retry.mjs', starter: RETRY_STARTER, runLabel: 'Run node retry.mjs', command: 'node retry.mjs' }],
      scenario: web,
      probe: `const count = (end) => practice.webLog.filter((e) => e.url.endsWith(end)).length;
const attempt = async (path, tries) => {
  const before = count(path);
  try { await mod.fetchWithRetry('${API}' + path, { tries, baseMs: 20 }); return { threw: false, calls: count(path) - before }; }
  catch (error) { return { threw: true, calls: count(path) - before }; }
};
// A fresh flaky endpoint every time, so earlier runs can't change the answer
const flaky = '/flaky-' + Date.now() + '.json';
practice.setSite('${API}' + flaky, { sequence: [{ status: 503, ms: 40 }, { status: 429, ms: 40 }, { status: 200, json: { status: 'ok' }, ms: 40 }] });
return { flaky: await attempt(flaky, 3), missing: await attempt('/missing.json', 3), down: await attempt('/checkout.json', 3) };`,
      check: ({ result, probe, probeError }) => {
        if (result.error) {
          if (/HTTP 503/.test(result.error.message)) return 'The first 503 ended the program. A 503 is worth retrying: wait, then try again.';
          return null;
        }
        if (probeError || !probe) return null;
        if (!/got Reports ok/.test(result.stdout)) return 'The Reports call should end by printing "got Reports ok".';
        if (probe.flaky.threw || probe.flaky.calls !== 3) return `A service that answers 503, then 429, then works should take exactly 3 requests and succeed (it took ${probe.flaky.calls}${probe.flaky.threw ? ' and threw' : ''}). Retry 429 and 5xx answers.`;
        if (probe.missing.calls !== 1 || !probe.missing.threw) return `A 404 won't get better: throw straight away, without retrying (it was asked ${probe.missing.calls} times).`;
        if (probe.down.calls !== 3 || !probe.down.threw) return `A service that stays down should be asked \`tries\` times (3), then throw (it was asked ${probe.down.calls} times${probe.down.threw ? '' : ' and nothing was thrown'}).`;
        return true;
      },
      success: 'That\'s how the AWS SDKs themselves behave: when an AWS API says "slow down", the SDK backs off and retries for you, with jitter, a few times, then gives up.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: retries, throttling and timeouts',
      minutes: 8,
      body: `The AWS Certified Developer – Associate exam asks about the same ideas, on AWS's side.

- **Throttling.** When you call an AWS API too fast, it answers with a throttling error: HTTP 429, \`ThrottlingException\`, or, for Amazon DynamoDB, \`ProvisionedThroughputExceededException\`. The answer the exam wants: **retry with exponential backoff and jitter**. The AWS SDKs already do this for you (the JavaScript SDK version 3 tries up to 3 times by default; \`maxAttempts\` changes it).
- **Amazon API Gateway** throttles too: by default 10,000 requests per second per Region for an account, with bursts of 5,000, and it answers **429 Too Many Requests** beyond that. Usage plans set limits per API key.
- **Who retries a Lambda function?** Asynchronous invocations (like Amazon S3 events) are retried by Lambda twice. Synchronous ones (like API Gateway calls) aren't: the caller decides.
- **Timeouts everywhere.** A Lambda function has a timeout (default 3 seconds, up to 15 minutes); API Gateway's integration timeout is 29 seconds by default. Timeouts in your code should be shorter than the ones around them.
- **CORS.** A page can only \`fetch\` another site's data if that site allows it, with an \`Access-Control-Allow-Origin\` header. "Enable CORS on the API Gateway API (or the S3 bucket)" is a classic answer when a browser shows a CORS error.
- **Watching endpoints from outside.** **Amazon CloudWatch Synthetics canaries** run scripts on a schedule to check your endpoints and pages; **Amazon Route 53 health checks** check endpoints and can fail traffic over. The **AWS Health Dashboard** shows events that affect your account; its API (the AWS Health API) needs a Business, Enterprise On-Ramp or Enterprise Support plan.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: '`await fetch(url)` comes back with status 503. What happens?', options: ['fetch throws an error', 'You get a Response with `ok` set to false', 'The page reloads', 'fetch retries automatically'], answer: 1, explain: 'fetch only throws when there\'s no answer at all (network error, timeout). An error status is still an answer: check `response.ok`.' },
        { q: 'A health endpoint never answers. What stops your page waiting for ever?', options: ['`try/catch`', '`response.ok`', '`fetch(url, { signal: AbortSignal.timeout(3000) })`', '`setInterval`'], answer: 2, explain: 'The signal aborts the request after 3 seconds and fetch rejects with a TimeoutError, which try/catch can then handle.' },
        { q: 'You check five services with `Promise.all` and one is unreachable. What do you get?', options: ['Four answers and one error', 'A rejection, and none of the five answers', 'Five answers, one of them null', 'It waits for ever'], answer: 1, explain: '`Promise.all` rejects as soon as one Promise rejects. `Promise.allSettled` waits for all of them and tells you how each one went.' },
        { q: 'Why add a random amount (jitter) to the backoff wait?', options: ['To make the code harder to read', 'So clients that failed together don\'t all retry at the same moment', 'Because timers aren\'t precise', 'AWS requires it in the request'], answer: 1, explain: 'Without jitter, every client retries in lockstep and hits the recovering service with the same spike again.' },
        { q: 'Which answer is NOT worth retrying?', options: ['429 Too Many Requests', '503 Service Unavailable', 'A timeout', '404 Not Found'], answer: 3, explain: 'Throttling, a 5xx and a timeout can get better on their own. A missing page will be just as missing next time.' },
        { q: 'Your page on one site fetches JSON from another and the browser blocks it with a CORS error. What fixes it?', options: ['Add a longer timeout', 'Use Promise.allSettled', 'The other site must send an `Access-Control-Allow-Origin` header that allows your site', 'Catch the error with try/catch'], answer: 2, explain: 'CORS is the other site\'s decision. On AWS that means configuring CORS on the API Gateway API or the S3 bucket that serves the data.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'js2-fetch', front: 'Get JSON from `url`', back: '`const response = await fetch(url);` then `const data = await response.json();`', tags: ['fetch'], difficulty: 'easy' },
        { id: 'js2-ok', front: 'Does fetch throw on a 404 or 503?', back: 'No. It only throws when there\'s no answer. Check `response.ok` (true for 200–299).', tags: ['fetch'], difficulty: 'medium' },
        { id: 'js2-timeout', front: 'Give a fetch a 3-second timeout', back: '`fetch(url, { signal: AbortSignal.timeout(3000) })` — it rejects with a TimeoutError.', tags: ['fetch', 'timeouts'], difficulty: 'medium' },
        { id: 'js2-async', front: 'Where can you use `await` in a script?', back: 'Inside a function marked `async` (and at the top level of a module). An async function always returns a Promise.', tags: ['async'], difficulty: 'easy' },
        { id: 'js2-allsettled', front: 'Wait for several Promises, keeping every result even if some fail', back: '`await Promise.allSettled([p1, p2])` — each result is `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`.', tags: ['promises'], difficulty: 'medium' },
        { id: 'js2-interval', front: 'Run `refresh` every 30 seconds, and stop it later', back: '`const id = setInterval(refresh, 30000);` then `clearInterval(id);`', tags: ['timers'], difficulty: 'easy' },
        { id: 'js2-backoff', front: 'Exponential backoff with jitter: the wait before try n', back: '`base * 2 ** (n - 1)` plus a random amount, up to a few tries. Only for timeouts, 429 and 5xx.', tags: ['retries'], difficulty: 'hard' },
        { id: 'js2-cors', front: 'Browser says a fetch was blocked by CORS. Whose setting is it?', back: 'The server being called: it must send `Access-Control-Allow-Origin` for your site. On AWS, enable CORS on the API Gateway API or S3 bucket.', tags: ['cors', 'aws'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 40,
      body: `Run the dashboard on your computer, then publish it on Amazon S3 so the team can open it.

### The catch: CORS

Your page can only read another site's data if **that site allows it**, by sending an \`Access-Control-Allow-Origin\` header. Most company health endpoints don't, and neither does the AWS Health Dashboard's RSS feed, so a browser blocks those fetches (you'll see a CORS error in the browser's console). Two ways that always work:

- put the status files **on the same site as the page** (same origin, so no CORS question), or
- use public APIs that allow everyone, like GitHub's status API, which sends \`Access-Control-Allow-Origin: *\`.

This build does both: your own status files next to the page, plus GitHub's real status.

1. **A project folder** with the page files (use the download buttons for \`index.html\` and \`style.css\`, and copy \`app.js\` from the dashboard step's editor):

\`\`\`sh
mkdir -p ~/aws-study-projects/javascript/status-dashboard/status
cd ~/aws-study-projects/javascript/status-dashboard
\`\`\`

2. **Your status files**, one per service:

\`\`\`sh
echo '{"service":"Website","status":"ok"}' > status/website.json
echo '{"service":"Sign-in","status":"ok"}' > status/signin.json
echo '{"service":"Checkout","status":"ok"}' > status/checkout.json
\`\`\`

3. **Point app.js at them.** In \`SERVICES\`, use relative addresses: \`{ name: 'Website', url: 'status/website.json' }\` and so on (delete Search and Email, or add files for them). Replace the AWS feed with GitHub's: set \`FEED_URL\` to \`https://www.githubstatus.com/api/v2/status.json\`, and change \`renderAws\` to show \`feed.status.description\` (for example "All Systems Operational") in one \`<li>\`.

4. **Try it locally.** Pages opened straight from disk (\`file://\`) can't fetch files, so serve the folder:

\`\`\`sh
python3 -m http.server 8080
\`\`\`

Open http://localhost:8080 and watch it refresh. Stop the server with Ctrl+C.

5. **Publish it on S3** as a static website. Your Region first (if it prints nothing, run \`REGION=us-east-1\`):

\`\`\`sh
REGION=$(aws configure get region); echo "$REGION"
BUCKET="status-dashboard-$(date +%s)"; echo "$BUCKET"
aws s3 mb "s3://$BUCKET" --region "$REGION"
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3 website "s3://$BUCKET" --index-document index.html
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{\\"Version\\":\\"2012-10-17\\",\\"Statement\\":[{\\"Effect\\":\\"Allow\\",\\"Principal\\":\\"*\\",\\"Action\\":\\"s3:GetObject\\",\\"Resource\\":\\"arn:aws:s3:::$BUCKET/*\\"}]}"
aws s3 sync . "s3://$BUCKET" --exclude ".git/*" --cache-control "no-cache"
echo "http://$BUCKET.s3-website-$REGION.amazonaws.com"
\`\`\`

Open the address it prints. (Some Regions use a dot instead of the last dash: \`s3-website.$REGION\`; the bucket's *Properties* tab in the console shows the exact address.) \`no-cache\` makes browsers ask again each time, so status changes show up on the next refresh.

> **If \`put-bucket-policy\` says AccessDenied,** your account blocks public buckets for every bucket (Block Public Access at the account level). That's a good safety setting: keep it, and run the dashboard locally instead. The Bash course's last tutorial shows the private way to publish a site, through Amazon CloudFront.

6. **Simulate an outage.** Mark Checkout as down and upload just that file:

\`\`\`sh
echo '{"service":"Checkout","status":"down"}' > status/checkout.json
aws s3 cp status/checkout.json "s3://$BUCKET/status/checkout.json" --cache-control "no-cache"
\`\`\`

Within 30 seconds, the dashboard turns red.

7. **Push it to GitHub** (see *Start here*). Everything here is safe to share.

**Cost:** a few cents a month at most for a small bucket. Everything in it is public, so only put status files and the page there.

**Clean up** when you're done. In a new terminal \`$BUCKET\` is empty, so find the name first:

\`\`\`sh
aws s3 ls | grep status-dashboard
aws s3 rb "s3://status-dashboard-1234567890" --force
\`\`\`

(Use your bucket's name from the first command.)`,
      downloads: [
        { label: 'Download index.html', filename: 'index.html', content: () => DASH_HTML },
        { label: 'Download style.css', filename: 'style.css', content: () => BASE_CSS },
      ],
      checklist: [
        'The dashboard runs locally at http://localhost:8080 with my own status files',
        'It shows GitHub\'s real status from its public API',
        'It\'s published on S3 (or I kept Block Public Access on and run it locally)',
        'Changing checkout.json to "down" turned it red within 30 seconds',
        'It\'s on GitHub',
      ],
    },
  ],
};

export default tutorial;
