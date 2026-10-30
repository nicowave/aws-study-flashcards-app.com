// Tutorial 3: a contact form with no server to run. The page posts JSON to
// an API Gateway HTTP API, a Lambda function checks it and emails the team
// through Amazon SES.

const API_URL = 'https://api.example.com/contact';
const TEAM = 'team@example.com';
const SENDER = 'contact-form@example.com';

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contact us</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Contact us</h1>
    <p>Questions about a workshop or a quote? We reply within one business day.</p>
    <form id="contact">
      <label>Your name <input id="name" name="name" required maxlength="100" autocomplete="name"></label>
      <label>Email <input id="email" name="email" type="email" required maxlength="254" autocomplete="email"></label>
      <label>Message <textarea id="message" name="message" required maxlength="5000" rows="5"></textarea></label>
      <!-- The honeypot: people never see this field, bots fill in everything -->
      <div class="hp" aria-hidden="true">
        <label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label>
      </div>
      <button type="submit">Send</button>
      <p id="status" role="status"></p>
    </form>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const PAGE_CSS = `body { font-family: system-ui, sans-serif; margin: 2rem; color: #1d2433; }
main { max-width: 32rem; }
label { display: block; margin-bottom: 0.9rem; font-weight: 600; }
input, textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 0.3rem; padding: 0.5rem; font: inherit; }
button { padding: 0.55rem 1.2rem; font: inherit; }
button:disabled { opacity: 0.5; }
.hp { position: absolute; left: -10000px; }
#status.ok { color: #1f7a3a; }
#status.error { color: #b3261e; }`;

const FORM_START = `// app.js: send the contact form to our API without leaving the page.
const API_URL = '${API_URL}';

const form = document.querySelector('#contact');
const button = form.querySelector('button');
const status = document.querySelector('#status');

function showStatus(text, kind) {
  status.textContent = text;
  status.className = kind; // 'ok' or 'error' (see style.css)
}
`;

export const FORM_STARTER = `${FORM_START}
form.addEventListener('submit', async (event) => {
  // TODO 1: stop the browser from leaving the page: event.preventDefault()

  // TODO 2: read the fields into an object:
  //         const fields = Object.fromEntries(new FormData(form));

  // TODO 3: turn the button off, then POST the fields to API_URL as JSON:
  //         fetch(API_URL, { method, headers: { 'content-type': ... }, body: JSON.stringify(...) })

  // TODO 4: if response.ok, showStatus("Thanks! We'll reply within one business day.", 'ok')
  //         and form.reset(). Otherwise show the error the API sent back:
  //         (await response.json()).error

  // TODO 5: if fetch itself fails (no connection), show
  //         "We couldn't reach the server. Please try again."
  //         And whatever happens, turn the button back on.
});
`;

export const FORM_SOLUTION = `${FORM_START}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  button.disabled = true;
  showStatus('Sending…', '');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (response.ok) {
      showStatus("Thanks! We'll reply within one business day.", 'ok');
      form.reset();
    } else {
      const data = await response.json().catch(() => ({}));
      showStatus(data.error || 'Something went wrong. Please try again.', 'error');
    }
  } catch {
    showStatus("We couldn't reach the server. Please try again.", 'error');
  } finally {
    button.disabled = false;
  }
});`;

const FORM_PROBE = `const fill = async () => {
  await practice.type('#name', 'Ada Lovelace');
  await practice.type('#email', 'ada@example.org');
  await practice.type('#message', 'Do you run workshops in December?');
};
await fill();
const prevented = await practice.submit('#contact');
if (!prevented) return { prevented };
await practice.until(() => /thanks/i.test(practice.text('#status') || ''), 1500);
const call = practice.fetchLog[practice.fetchLog.length - 1] || null;
let sent = null;
try { sent = call && call.body ? JSON.parse(call.body) : null; } catch (e) { sent = 'not json'; }
let headers = {};
if (call && call.headers) {
  const h = call.headers;
  const pairs = typeof h.forEach === 'function' && !Array.isArray(h) && typeof h.entries === 'function' ? [...h.entries()] : Array.isArray(h) ? h : Object.entries(h);
  headers = Object.fromEntries(pairs.map(([k, v]) => [String(k).toLowerCase(), String(v)]));
}
const success = practice.text('#status');
const cleared = document.querySelector('#name').value === '';

// The API says no
const realFetch = window.fetch;
window.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'Please enter a valid email address.' }) });
await fill();
await practice.submit('#contact');
await practice.until(() => /valid email/i.test(practice.text('#status') || ''), 1000);
const rejected = practice.text('#status');

// No connection at all
window.fetch = async () => { throw new TypeError('Failed to fetch'); };
await practice.submit('#contact');
await practice.until(() => (practice.text('#status') || '') !== rejected, 1000);
const offline = practice.text('#status');
const buttonBack = !document.querySelector('#contact button').disabled;
window.fetch = realFetch;
return { prevented, calls: practice.fetchLog.length, method: call && call.method, url: call && call.url, sent, contentType: headers['content-type'] || null, success, cleared, rejected, offline, buttonBack };`;

const checkForm = ({ result, probe }) => {
  if (result.errors.length || !probe) return null;
  if (!probe.prevented) return 'Pressing Send still makes the browser leave the page. Call `event.preventDefault()` first thing in the submit listener.';
  if (!probe.calls) return 'The form doesn\'t call the API yet: `await fetch(API_URL, { ... })`.';
  if (probe.method !== 'POST') return `The request went out as ${probe.method}. Add \`method: 'POST'\` to fetch's options.`;
  if (!probe.sent || typeof probe.sent !== 'object') return 'Send the fields as JSON: `body: JSON.stringify(fields)`.';
  if (probe.sent.email !== 'ada@example.org' || probe.sent.message !== 'Do you run workshops in December?') return 'The JSON body should carry the form\'s fields: `Object.fromEntries(new FormData(form))` reads them.';
  if (!/application\/json/i.test(probe.contentType || '')) return 'Tell the API what you\'re sending: `headers: { \'content-type\': \'application/json\' }`.';
  if (!/thanks/i.test(probe.success || '')) return 'When the API answers OK, show the thank-you message in #status.';
  if (!probe.cleared) return 'After a successful send, empty the form with `form.reset()`.';
  if (!/valid email/i.test(probe.rejected || '')) return 'When the API answers with an error, show the message it sent back: `(await response.json()).error`.';
  if (!/reach|connect|network|offline|internet/i.test(probe.offline || '')) return 'When fetch itself fails (no connection), catch it and show a "couldn\'t reach the server" message.';
  if (!probe.buttonBack) return 'Turn the button back on when the request ends, even after an error: a `finally` block does that.';
  return true;
};

// ---------------------------------------------------------------------------
// Checking what arrives
// ---------------------------------------------------------------------------

const VALIDATE_HEAD = `// validate.mjs: check what a visitor sent before we email it.
// The browser's checks are only a convenience: anyone can call the API directly.
export const LIMITS = { name: 100, email: 254, message: 5000 };
const EMAIL_SHAPE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

// Text, trimmed; anything that isn't text counts as empty
const text = (value) => (typeof value === 'string' ? value.trim() : '');
`;

const VALIDATE_TRY = `
// Try it: press Run, or call validate() in the console below
console.log(validate({ name: ' Ada ', email: 'ada@example.org', message: 'Hello' }));
console.log(validate({ name: 'Ada', email: 'not an email', message: 'Hello' }));
`;

export const VALIDATE_STARTER = `${VALIDATE_HEAD}
/** { ok: true, value: { name, email, message } } or { ok: false, error: 'for the visitor' } */
export function validate(input) {
  const name = text(input?.name);
  const email = text(input?.email);
  const message = text(input?.message);

  // TODO: name, email and message are all required
  // TODO: email must match EMAIL_SHAPE
  // TODO: none may be longer than its limit in LIMITS

  return { ok: true, value: { name, email, message } };
}
${VALIDATE_TRY}`;

const VALIDATE_FUNCTION = `/** { ok: true, value: { name, email, message } } or { ok: false, error: 'for the visitor' } */
export function validate(input) {
  const name = text(input?.name);
  const email = text(input?.email);
  const message = text(input?.message);

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!email) return { ok: false, error: 'Please enter your email address.' };
  if (!message) return { ok: false, error: 'Please write a message.' };
  if (!EMAIL_SHAPE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
  for (const [field, value] of Object.entries({ name, email, message })) {
    if (value.length > LIMITS[field]) return { ok: false, error: \`The \${field} can be at most \${LIMITS[field]} characters.\` };
  }
  return { ok: true, value: { name, email, message } };
}`;

export const VALIDATE_SOLUTION = `${VALIDATE_HEAD}
${VALIDATE_FUNCTION}
${VALIDATE_TRY}`;

const VALIDATE_PROBE = `const good = { name: 'Ada Lovelace', email: 'ada@example.org', message: 'Hi!' };
const cases = {
  good: { name: '  Ada Lovelace ', email: ' ada@example.org ', message: ' Hi! ' },
  longest: { name: 'n'.repeat(100), email: 'ada@example.org', message: 'm'.repeat(5000) },
  noName: { ...good, name: '' },
  blankName: { ...good, name: '    ' },
  noEmail: { ...good, email: '' },
  noAt: { ...good, email: 'ada.example.org' },
  twoAts: { ...good, email: 'ada@@example.org' },
  noDot: { ...good, email: 'ada@example' },
  spaceInEmail: { ...good, email: 'ada lovelace@example.org' },
  noMessage: { ...good, message: '' },
  longName: { ...good, name: 'n'.repeat(101) },
  longMessage: { ...good, message: 'm'.repeat(5001) },
  notText: { name: 42, email: ['ada@example.org'], message: { text: 'hi' } },
  nothing: null,
};
const out = {};
for (const [k, v] of Object.entries(cases)) {
  try { out[k] = mod.validate(v); } catch (e) { out[k] = { threw: e.name + ': ' + e.message }; }
}
return out;`;

const checkValidate = ({ result, probe, probeError }) => {
  if (result.error) return null;
  if (probeError) return 'validate.mjs needs to export the validate function (`export function validate(input)`).';
  if (!probe) return null;
  const threw = Object.entries(probe).find(([, r]) => r?.threw);
  if (threw) return `validate() crashed on the "${threw[0]}" case (${threw[1].threw}). It should return { ok: false, error } instead of throwing.`;
  const g = probe.good;
  if (!g?.ok) return `A good message was refused: ${g?.error}.`;
  if (g.value?.name !== 'Ada Lovelace' || g.value?.email !== 'ada@example.org' || g.value?.message !== 'Hi!') return 'Return the trimmed values in `value`.';
  if (!probe.longest?.ok) return 'Values exactly at the limit (100, 254, 5000 characters) are allowed: use `>`, not `>=`.';
  const bad = ['noName', 'blankName', 'noEmail', 'noAt', 'twoAts', 'noDot', 'spaceInEmail', 'noMessage', 'longName', 'longMessage', 'notText', 'nothing'];
  const passed = bad.filter((k) => probe[k]?.ok !== false);
  if (passed.length === bad.length) return null;
  const why = {
    noName: 'an empty name', blankName: 'a name of only spaces', noEmail: 'an empty email', noAt: 'an email without @', twoAts: 'an email with two @',
    noDot: 'an email without a dot in the domain', spaceInEmail: 'an email with a space', noMessage: 'an empty message',
    longName: 'a 101-character name', longMessage: 'a 5,001-character message', notText: 'fields that aren\'t text', nothing: 'no input at all',
  };
  if (passed.length) return `These still get through: ${passed.map((k) => why[k]).join(', ')}.`;
  const silent = bad.find((k) => typeof probe[k]?.error !== 'string' || !probe[k].error.trim());
  if (silent) return 'Every refusal needs an `error` the visitor can read, like "Please enter your name."';
  return true;
};

// ---------------------------------------------------------------------------
// The Lambda function
// ---------------------------------------------------------------------------

const HANDLER_HEAD = `// index.mjs: the contact form's Lambda function (Node.js 22).
// API Gateway calls handler() for every POST /contact.
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({}); // created once, reused while the function stays warm
const { TO_ADDRESS, FROM_ADDRESS } = process.env;

// --- Your validate() from the last step ------------------------------------
const LIMITS = { name: 100, email: 254, message: 5000 };
const EMAIL_SHAPE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const text = (value) => (typeof value === 'string' ? value.trim() : '');

${VALIDATE_FUNCTION.replace('export function', 'function')}
// ---------------------------------------------------------------------------

const reply = (statusCode, data) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(data),
});

export const handler = async (event) => {
  // 1. The body is a string, base64-encoded when event.isBase64Encoded is true
  let input;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body ?? '';
    input = JSON.parse(raw);
  } catch {
    return reply(400, { error: "The request wasn't valid JSON." });
  }
`;

export const HANDLER_STARTER = `${HANDLER_HEAD}
  // 2. TODO: the honeypot. If input.website has anything in it, a bot filled in
  //    the hidden field: answer 200 { ok: true } so it leaves happy, and send nothing.

  // 3. TODO: validate(input). If it isn't ok, answer 400 with { error }.

  // 4. TODO: email the team with ses.send(new SendEmailCommand({ ... })):
  //    From FROM_ADDRESS, to [TO_ADDRESS], Reply-To [the visitor's email],
  //    subject \`Contact form: <name>\`, and the name, email and message as text.

  // 5. TODO: if SES fails, log the real error with console.error, and answer
  //    500 with a polite message. Never send err.message back to the browser.

  return reply(200, { ok: true });
};
`;

export const HANDLER_SOLUTION = `${HANDLER_HEAD}
  // 2. The honeypot: only bots fill in the hidden field
  if (input?.website) {
    console.log('Honeypot field filled in: ignoring a bot');
    return reply(200, { ok: true });
  }

  // 3. Never trust the browser
  const check = validate(input);
  if (!check.ok) return reply(400, { error: check.error });
  const { name, email, message } = check.value;

  // 4. Email the team; replies go to the visitor
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      Destination: { ToAddresses: [TO_ADDRESS] },
      ReplyToAddresses: [email],
      Content: {
        Simple: {
          Subject: { Data: \`Contact form: \${name.replace(/\\s+/g, ' ')}\` },
          Body: { Text: { Data: \`From: \${name} <\${email}>\\n\\n\${message}\` } },
        },
      },
    }));
  } catch (err) {
    // 5. The details go to the logs, not to the visitor
    console.error('Sending the email failed:', err);
    return reply(500, { error: 'Sorry, your message could not be sent. Please try again later.' });
  }

  console.log('Message sent to the team');
  return reply(200, { ok: true });
};`;

const SAMPLE_EVENT = {
  version: '2.0',
  routeKey: 'POST /contact',
  rawPath: '/contact',
  rawQueryString: '',
  headers: {
    'content-type': 'application/json',
    host: 'abc123.execute-api.us-east-1.amazonaws.com',
    origin: 'https://www.example.com',
    'user-agent': 'Mozilla/5.0',
  },
  requestContext: {
    accountId: '111122223333',
    apiId: 'abc123',
    domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
    http: { method: 'POST', path: '/contact', protocol: 'HTTP/1.1', sourceIp: '203.0.113.20', userAgent: 'Mozilla/5.0' },
    requestId: 'JKJaXmPLvHcESHA=',
    routeKey: 'POST /contact',
    stage: '$default',
    time: '29/Oct/2026:14:05:11 +0000',
    timeEpoch: 1793282711000,
  },
  body: JSON.stringify({ name: 'Grace Hopper', email: 'grace@example.org', message: 'Can your team give our admins a two-day AWS workshop?', website: '' }),
  isBase64Encoded: false,
};

const HANDLER_PROBE = `const ctx = practice.context();
const sentCount = () => practice.aws().ses.sent.length;
const call = async (body, extra = {}) => {
  const before = sentCount();
  try {
    const event = { ...practice.apiEvent({ method: 'POST', path: '/contact', body }), ...extra };
    const r = await mod.handler(event, ctx);
    let data = null;
    try { data = JSON.parse(r?.body); } catch (e) { data = r?.body ?? null; }
    return { status: r?.statusCode, data, emails: sentCount() - before };
  } catch (e) {
    return { threw: e.name + ': ' + e.message, emails: sentCount() - before };
  }
};
const good = { name: 'Ada Lovelace', email: 'ada@example.org', message: 'Hello from the probe', website: '' };
const out = {};
out.good = await call(good);
out.last = practice.aws().ses.sent.at(-1) || null;
out.missing = await call({ ...good, name: '' });
out.badEmail = await call({ ...good, email: 'ada.example.org' });
out.tooLong = await call({ ...good, message: 'm'.repeat(6000) });
out.notJson = await call('{name: oops');
out.honeypot = await call({ ...good, website: 'http://cheap-pills.example' });
out.base64 = await call(undefined, { body: btoa(JSON.stringify({ ...good, message: 'Sent as base64' })), isBase64Encoded: true });
// SES refuses for one call (nothing verified), then the practice account goes back to normal
const ses = practice.state.ses;
const verified = ses.verified;
ses.verified = [];
try { out.sesDown = await call(good); } finally { ses.verified = verified; }
return out;`;

const checkHandler = ({ invoke, probe, probeError }) => {
  if (!invoke || invoke.error) return null;
  if (probeError || !probe) return null;
  const { good, last } = probe;
  if (good.threw) return `The handler crashed on a good message: ${good.threw}.`;
  if (!good.emails && good.status === 500) return 'SES refused to send a good message, so the function answered 500. Check the error in the logs above: From must be your verified FROM_ADDRESS (the visitor goes in Reply-To), and To is TO_ADDRESS.';
  if (!good.emails) return 'A good message doesn\'t send an email yet: `await ses.send(new SendEmailCommand({ ... }))`.';
  if (good.status !== 200) return `A good message should answer 200, not ${good.status}.`;
  if (!last.to?.includes(TEAM)) return 'Send the email to the team: `Destination: { ToAddresses: [TO_ADDRESS] }`.';
  if (last.from !== SENDER) return 'The From address must be your verified sender, FROM_ADDRESS. The visitor\'s address goes in Reply-To.';
  if (!last.replyTo?.includes('ada@example.org')) return 'Put the visitor\'s address in `ReplyToAddresses: [email]`, so the team can just press Reply.';
  if (!/Ada Lovelace/.test(last.subject || '')) return 'Put the visitor\'s name in the subject: `Contact form: Ada Lovelace`.';
  if (!/Hello from the probe/.test(last.text || '') || !/ada@example\.org/.test(last.text || '')) return 'The email\'s text should include the name, email address and message.';
  for (const [k, label] of [['missing', 'a missing name'], ['badEmail', 'a bad email address'], ['tooLong', 'a 6,000-character message']]) {
    const r = probe[k];
    if (r.threw) return `The handler crashed on ${label}: ${r.threw}.`;
    if (r.emails) return `An email went out for ${label}. Validate before sending.`;
    if (r.status !== 400 || typeof r.data?.error !== 'string') return `For ${label}, answer 400 with { error } from validate().`;
  }
  if (probe.notJson.status !== 400) return 'A body that isn\'t JSON should get a 400 (step 1 already handles it: keep it).';
  if (probe.honeypot.emails) return 'A bot filled in the hidden website field and still got an email through. Check `input.website` first.';
  if (probe.honeypot.status !== 200) return 'For a bot, answer 200 { ok: true } anyway: it shouldn\'t learn that it was caught.';
  if (probe.base64.threw || !probe.base64.emails) return 'A base64-encoded body should work too: decode it with Buffer.from(event.body, \'base64\') when event.isBase64Encoded is true.';
  const down = probe.sesDown;
  if (down.threw) return 'When SES refuses to send, the handler crashes. Wrap the send in try / catch and answer 500.';
  if (down.status !== 500) return `When SES refuses to send, answer 500, not ${down.status}.`;
  if (/verified|identit|MessageRejected|SES/i.test(JSON.stringify(down.data))) return 'The 500 answer shows the visitor AWS\'s own error text. Log it with console.error, and send back a polite message instead.';
  return true;
};

const scenario = {
  env: { TO_ADDRESS: TEAM, FROM_ADDRESS: SENDER },
  aws: { ses: { verified: ['example.com'], sandbox: true } },
};

// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'contact-form',
  number: 3,
  title: 'Serverless contact form',
  situation: 'The marketing site needs a contact form, and nobody wants to rent, patch and watch a server just to send a few emails a day. You build the form, a Lambda function behind it that checks every message and emails the team, and the API that connects the two. It costs nothing when nobody writes, and it scales when everybody does.',
  level: 'Intermediate',
  hours: 5,
  skills: ['forms and submit events', 'fetch with JSON', 'error states', 'server-side validation', 'Lambda handlers for HTTP', 'environment variables', 'CORS'],
  aws: ['Lambda', 'API Gateway', 'SES', 'IAM'],
  overview: 'You\'ll build the form\'s JavaScript (no page reload, clear success and error messages), then the Node.js Lambda function behind it: it reads the request, refuses bad input and bots, and sends the email through Amazon SES with the visitor in Reply-To. Then you deploy all of it with the AWS command line, including CORS so only your site can call it.',
  steps: [
    {
      id: 'how-it-fits',
      kind: 'read',
      title: 'Four pieces, no server',
      minutes: 8,
      body: `A contact form looks simple, but something has to receive what the visitor typed and turn it into an email. Renting a server for that means patching it, watching it and paying for it all month. Instead, you'll connect four managed pieces:

\`\`\`text
 Browser                Amazon API Gateway        AWS Lambda              Amazon SES
┌──────────────┐  POST  ┌──────────────────┐ event ┌────────────────┐ send ┌──────────────┐
│ form + app.js│ ─────▶ │ HTTP API         │ ────▶ │ index.mjs      │ ───▶ │ email to the │
│              │ ◀───── │ POST /contact    │ ◀──── │ checks, sends  │      │ team's inbox │
└──────────────┘  JSON  └──────────────────┘ reply └────────────────┘      └──────────────┘
\`\`\`

1. **The page** sends the form as JSON with \`fetch\`, and shows "Thanks" or what went wrong, without reloading.
2. **Amazon API Gateway** gives your function a public web address. An **HTTP API** is its simpler, cheaper kind. It also handles **CORS**: which websites may call it.
3. **AWS Lambda** runs your function only when a request arrives. It's Node.js 22, the same JavaScript you write in the browser, plus server-side tools.
4. **Amazon Simple Email Service (SES)** sends the email from an address you've proved you own.

You pay per request, a fraction of a cent, and nothing at all when nobody writes. If a campaign brings a thousand messages in an hour, Lambda simply runs more copies.

> **Why not send the email from the browser?** Sending needs AWS credentials. Anything in the page's JavaScript can be read by anyone who opens it, so the credentials would be public within a day. The function keeps them on the server side, where its **execution role** grants them.`,
    },
    {
      id: 'the-form',
      kind: 'try',
      runtime: 'web',
      title: 'Send the form without leaving the page',
      minutes: 30,
      body: `By default, pressing a form's button makes the browser **leave the page**: it sends the fields and shows whatever the server answers. For a modern form you take over:

1. Listen for the form's **\`submit\`** event. It fires for a click on the button *and* for Enter in a field, which a button's \`click\` event would miss.
2. Call **\`event.preventDefault()\`** to stop the browser leaving.
3. Read every field at once with **\`FormData\`**. Each input's \`name\` attribute becomes a key:

\`\`\`js
Object.fromEntries(new FormData(document.querySelector('#contact')))
\`\`\`

4. Send it with **\`fetch\`**, as JSON. A POST needs three options:

\`\`\`text
fetch(API_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(fields),
})
\`\`\`

5. Check **\`response.ok\`**. It's \`true\` for statuses 200 to 299. A 400 from the API is *not* an exception: fetch only throws when there's no answer at all (no connection, no such server). So there are three outcomes to handle: it worked, the API said no, or nobody answered.

> **Disable the button while sending.** People double-click. Turn it back on in a \`finally\` block, which runs after success and failure alike.

The preview below is live, with a pretend API that answers like the real one will. Fill in the form and press **Send** to try your code, or type in the console at \`>\`.`,
      task: 'Finish `app.js`: on submit, stay on the page, POST the fields as JSON to `API_URL`, then show the thank-you message (and empty the form), the error the API sends back, or a "couldn\'t reach the server" message when there\'s no answer. Turn the button off while sending and back on afterwards.',
      hint: '`event.preventDefault()`, then `const fields = Object.fromEntries(new FormData(form))`. Inside `try`: `const response = await fetch(API_URL, { method: \'POST\', headers: { \'content-type\': \'application/json\' }, body: JSON.stringify(fields) })`. `if (response.ok) { ... } else { const data = await response.json(); showStatus(data.error, \'error\') }`. `catch` shows the connection message; `finally` turns the button on.',
      solution: FORM_SOLUTION,
      files: [
        { path: 'app.js', starter: FORM_STARTER },
        { path: 'index.html', starter: PAGE_HTML },
        { path: 'style.css', starter: PAGE_CSS },
      ],
      scenario: { web: { [API_URL]: { status: 200, json: { ok: true }, ms: 600 } } },
      probe: FORM_PROBE,
      check: checkForm,
      success: 'That\'s a form people can trust: one click, a clear answer either way, and no lost message when the network drops. Notice the hidden "website" field went along too, empty. The function will use it to spot bots.',
    },
    {
      id: 'lambda-http',
      kind: 'read',
      runtime: 'node',
      title: 'What a Lambda function receives from an API',
      minutes: 12,
      body: `When a request reaches \`POST /contact\`, API Gateway calls your function's **handler** with an **event**: a JavaScript object describing the request. HTTP APIs use **payload format 2.0**, which looks like this (shortened):

\`\`\`text
{
  "version": "2.0",
  "routeKey": "POST /contact",
  "headers": { "content-type": "application/json", "origin": "https://www.example.com" },
  "requestContext": { "http": { "method": "POST", "sourceIp": "203.0.113.20" } },
  "body": "{\\"name\\":\\"Grace Hopper\\",\\"email\\":\\"grace@example.org\\"}",
  "isBase64Encoded": false
}
\`\`\`

The console below runs JavaScript like Node.js. Try each box:

\`\`\`js
const event = { routeKey: 'POST /contact', isBase64Encoded: false, body: '{"name":"Grace","email":"grace@example.org"}' };
typeof event.body
\`\`\`

The **body is a string**, not an object. You parse it yourself:

\`\`\`js
JSON.parse(event.body).name
\`\`\`

Sometimes API Gateway sends the body **base64-encoded**, a way of writing any bytes as plain letters, and sets \`isBase64Encoded: true\`. Node's \`Buffer\` decodes it:

\`\`\`js
const encoded = Buffer.from(event.body).toString('base64');
encoded
\`\`\`

\`\`\`js
JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')).email
\`\`\`

### What the function sends back

The handler **returns** the answer: a status code, headers and a body, which must be a **string** again:

\`\`\`js
const reply = (statusCode, data) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
reply(400, { error: 'Please enter your name.' })
\`\`\`

| Status | Means | Use it when |
|---|---|---|
| \`200\` | OK | the message was sent |
| \`400\` | Bad Request | the visitor's input is wrong: say what to fix |
| \`500\` | Internal Server Error | something on *your* side failed |

> **A handler is just an exported async function**: \`export const handler = async (event, context) => { ... }\`. The file is \`index.mjs\` (\`.mjs\` tells Node it's a modern ES module, so \`import\` works), and Lambda's handler setting is \`index.handler\`: the file name, a dot, the function name.`,
      scenario: {},
    },
    {
      id: 'validate',
      kind: 'try',
      runtime: 'node',
      title: 'Never trust the browser',
      minutes: 20,
      body: `The form has \`required\` and \`type="email"\`, so why check again on the server?

Because **anyone can call your API directly**, without your page: with \`curl\`, a script, or a bot that found the address. The browser's checks are a convenience for honest visitors. The server's checks are the real ones.

What to check:

- **Required fields**: present, and not just spaces. \`.trim()\` removes spaces at both ends.
- **The right type**: \`typeof value === 'string'\`. Someone can send \`{"name": 42}\` or \`{"name": ["a", "b"]}\`.
- **Email shape**: one \`@\`, something before it, and a domain with a dot. A **regular expression** (a text pattern between slashes) checks it in one line. It can't prove the address exists, only that it looks like one:

\`\`\`js
const EMAIL_SHAPE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
[EMAIL_SHAPE.test('ada@example.org'), EMAIL_SHAPE.test('ada@example'), EMAIL_SHAPE.test('ada@@example.org')]
\`\`\`

- **Length limits**: without them, someone can send a 50 MB "message" and you pay to process it.

Return something the caller can act on, instead of throwing: \`{ ok: true, value }\` or \`{ ok: false, error: 'Please enter your name.' }\`. The error text goes straight back to the visitor, so write it for a person.`,
      task: 'Finish `validate()` in `validate.mjs`: refuse a missing (or all-spaces) name, email or message, an email that doesn\'t match `EMAIL_SHAPE`, and anything longer than its limit in `LIMITS`, each with an `error` a visitor can read. A good message returns `{ ok: true, value }` with the trimmed text.',
      hint: 'After trimming: `if (!name) return { ok: false, error: \'Please enter your name.\' }`, the same for email and message, then `if (!EMAIL_SHAPE.test(email)) ...`, then loop over `Object.entries({ name, email, message })` and compare each `value.length` with `LIMITS[field]`.',
      solution: VALIDATE_SOLUTION,
      files: [{ path: 'validate.mjs', starter: VALIDATE_STARTER, runLabel: 'Run validate.mjs' }],
      scenario: {},
      probe: VALIDATE_PROBE,
      check: checkValidate,
      success: 'Fourteen kinds of input, and each one gets a clear yes or no. You\'ll paste this into the function next.',
    },
    {
      id: 'sending-email',
      kind: 'read',
      runtime: 'node',
      title: 'Sending email with Amazon SES',
      minutes: 12,
      body: `The AWS SDK for JavaScript (version 3) has one small package per service. Lambda's Node.js 22 runtime already includes it, so the function needs no \`npm install\`. You create a **client** once, then **send commands** to it:

\`\`\`js
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
const ses = new SESv2Client({});
\`\`\`

\`\`\`js
await ses.send(new SendEmailCommand({
  FromEmailAddress: 'contact-form@example.com',
  Destination: { ToAddresses: ['team@example.com'] },
  Content: { Simple: { Subject: { Data: 'Hello' }, Body: { Text: { Data: 'It works.' } } } },
}))
\`\`\`

The practice account has verified the domain \`example.com\`. Now try sending *as the visitor*, from their own address:

\`\`\`js
await ses.send(new SendEmailCommand({
  FromEmailAddress: 'grace@example.org',
  Destination: { ToAddresses: ['team@example.com'] },
  Content: { Simple: { Subject: { Data: 'Hello' }, Body: { Text: { Data: 'From the visitor' } } } },
}))
\`\`\`

\`MessageRejected\`: SES only sends **from addresses or domains you've verified**, to stop anyone sending email in your company's name. So:

- **From** is always your own verified address, like \`contact-form@yourcompany.com\`.
- The visitor goes in **\`ReplyToAddresses\`**. When the team presses Reply, the answer goes to the visitor.

### The SES sandbox

New AWS accounts start in the **SES sandbox**: you can only send **to** verified addresses too, at most 200 emails a day. For a contact form that emails your own team, that's fine: verify the team's address. To email customers, you request **production access** in the SES console.

### Settings in environment variables

The addresses differ between your test and live setups, so they don't belong in the code. Lambda passes **environment variables** to the function, and Node reads them from \`process.env\`:

\`\`\`js
process.env.TO_ADDRESS
\`\`\`

Environment variables are right for settings like these. **Secrets** (passwords, API keys) belong in **AWS Secrets Manager** instead, where access is logged and they can be rotated.`,
      scenario,
    },
    {
      id: 'handler',
      kind: 'try',
      runtime: 'node',
      title: 'The function that checks and sends',
      minutes: 35,
      body: `Time to build the whole function. \`index.mjs\` already reads the body (both kinds) and has your \`validate()\`. Four parts are left:

1. **The honeypot.** The form has a field people never see. Bots fill in every field they find, so a value there means a bot. Answer \`200\` as if it worked, so the bot doesn't learn to skip the field, and send nothing.
2. **Validate**, and answer \`400\` with the error.
3. **Send the email**: from your verified address, to the team, with the visitor in Reply-To.
4. **Handle failure.** If SES fails, log the real error with \`console.error\` (it goes to the function's logs in Amazon CloudWatch) and answer \`500\` with a polite message.

> **Never send \`err.message\` back to the browser.** AWS error messages can name your account, your addresses and your setup. Attackers collect exactly that. Details go to the logs, where only your team can read them.

**Test with the sample event** runs the handler with the request a visitor's browser would make. Afterwards, the check sends it a few harder ones: bad input, a bot, a base64 body, and SES refusing to send.`,
      task: 'Finish the handler: ignore bots (200, no email), refuse invalid input with 400 and the error, email the team from `FROM_ADDRESS` to `TO_ADDRESS` with the visitor in Reply-To and their name in the subject, and answer 500 with a polite message (never AWS\'s error) if sending fails.',
      hint: '`if (input?.website) return reply(200, { ok: true })`. `const check = validate(input); if (!check.ok) return reply(400, { error: check.error })`. Then `try { await ses.send(new SendEmailCommand({ FromEmailAddress: FROM_ADDRESS, Destination: { ToAddresses: [TO_ADDRESS] }, ReplyToAddresses: [email], Content: { Simple: { Subject: { Data: ... }, Body: { Text: { Data: ... } } } } })) } catch (err) { console.error(err); return reply(500, { error: \'Sorry, ...\' }) }`.',
      solution: HANDLER_SOLUTION,
      files: [{ path: 'index.mjs', starter: HANDLER_STARTER, invoke: { event: SAMPLE_EVENT, handler: 'handler', timeout: 10 } }],
      scenario,
      probe: HANDLER_PROBE,
      check: checkHandler,
      success: 'That\'s a production-quality contact function: it refuses junk, quietly drops bots, keeps AWS\'s details private, and the team can answer with one click on Reply.',
    },
    {
      id: 'cors-and-limits',
      kind: 'read',
      title: 'CORS, permissions and limits',
      minutes: 12,
      body: `Three settings decide who can use the function, and how much.

### CORS: which websites may call your API

Browsers protect people with the **same-origin policy**: a page from \`https://www.example.com\` may *not* read answers from \`https://abc123.execute-api.us-east-1.amazonaws.com\` unless that API says so. **CORS** (cross-origin resource sharing) is how it says so.

For a JSON POST, the browser first sends a **preflight**: an \`OPTIONS\` request asking "may www.example.com send POST with a content-type header?". Only if the answer says yes does the real request go out. If not, the browser console shows the famous error:

\`\`\`text
Access to fetch at 'https://abc123.execute-api…/contact' from origin 'https://www.example.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present…
\`\`\`

With an **HTTP API**, you configure CORS on the API and API Gateway answers preflights for you. Your function doesn't add CORS headers itself:

| Setting | Value | Why |
|---|---|---|
| Allowed origins | \`https://www.example.com\` | only your site's pages can use it |
| Allowed methods | \`POST\` | the only thing the form does |
| Allowed headers | \`content-type\` | the one header the form sends |
| Max age | \`3600\` | browsers can skip the preflight for an hour |

> **Why not allow every origin (\`*\`)?** Any website could then embed your form's API and use it, sending email in your name from pages you don't control. CORS doesn't stop \`curl\` or bots (that's what validation and the honeypot are for), but it keeps other sites' visitors' browsers out. List your real origins: production, and \`http://localhost:8080\` while you test.

### Least privilege: what the function may do

The function's **execution role** needs two things: write its logs (the AWS managed policy \`AWSLambdaBasicExecutionRole\`), and send email **from one identity**:

\`\`\`text
{
  "Effect": "Allow",
  "Action": "ses:SendEmail",
  "Resource": "arn:aws:ses:us-east-1:111122223333:identity/contact-form@example.com"
}
\`\`\`

Not \`ses:*\`, and not every identity. If the code is ever tricked into doing something else, the role won't allow it.

### Limits: so a bot can't run up the bill

- **Throttling** on the API: a few requests per second is plenty for a contact form. Anything above gets \`429 Too Many Requests\` before your function even runs.
- The function's **timeout**: 10 seconds is generous for one email.
- The limits in \`validate()\`: no 50 MB messages.`,
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: AWS Certified Developer – Associate',
      minutes: 8,
      body: `This tutorial touches several things the Developer Associate exam asks about again and again:

- **HTTP API vs. REST API.** Both are Amazon API Gateway. HTTP APIs are simpler and cheaper, with JWT authorizers and built-in CORS. REST APIs add API keys and usage plans, request validation, caching and AWS WAF. "Cheapest, simplest proxy to Lambda" means HTTP API. "Usage plans for partners" means REST API.
- **Proxy integration event formats.** HTTP APIs send **payload 2.0** (\`routeKey\`, \`rawPath\`, \`requestContext.http.method\`). REST APIs send **1.0** (\`httpMethod\`, \`path\`, \`multiValueHeaders\`). In both, \`body\` is a string, and \`isBase64Encoded\` says whether to decode it.
- **CORS on a REST API with Lambda proxy integration**: API Gateway can answer the preflight, but **the function must add \`Access-Control-Allow-Origin\` to its own responses**. A classic exam answer to "the browser still shows a CORS error".
- **502 Bad Gateway** from a REST API proxy integration usually means the function returned the wrong shape: for example \`body\` as an object instead of a string. HTTP APIs are more forgiving with payload 2.0.
- **Timeouts**: an HTTP API waits **30 seconds** at most for the integration (a fixed limit; REST APIs default to 29 seconds), whatever the Lambda timeout says. Long jobs belong behind a queue.
- **Throttling**: a client over the limit gets **429**. API Gateway allows 10,000 requests per second per account and Region by default. Lambda's concurrency limit is usually 1,000 per Region. **Reserved concurrency** caps (and guarantees) one function's share.
- **SES sandbox**: only verified recipients, 200 emails a day, one per second, until you request production access. \`MessageRejected\` "Email address is not verified" is the giveaway.
- **Environment variables** are encrypted at rest with AWS KMS, 4 KB in total. Secrets that need rotation or auditing belong in **Secrets Manager** (or Systems Manager Parameter Store \`SecureString\`).
- **Invoke permission**: API Gateway needs a **resource-based policy** on the function (\`aws lambda add-permission\` with \`--principal apigateway.amazonaws.com\`). The execution role is the *other* direction: what the function may call.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'The form already has `required` and `type="email"`. Why does the Lambda function check the input again?', options: ['Browsers often ignore those attributes', 'Anyone can call the API directly, without the page', 'Lambda requires it', 'To make the form faster'], answer: 1, explain: 'The browser\'s checks only help honest visitors. curl, scripts and bots skip the page entirely, so the server\'s checks are the ones that count.' },
        { q: 'In an HTTP API (payload 2.0) event, what is `event.body`?', options: ['An object you can read directly', 'A string: parse it with JSON.parse, and decode it first if isBase64Encoded is true', 'Always base64', 'Undefined for POST requests'], answer: 1, explain: 'API Gateway passes the body as text. Parse it yourself, and handle the base64 case.' },
        { q: 'Why does the visitor\'s address go in `ReplyToAddresses` rather than `FromEmailAddress`?', options: ['Reply-To is faster', 'SES only sends from addresses and domains you have verified', 'The visitor asked for it', 'From is limited to 10 characters'], answer: 1, explain: 'SES refuses unverified senders with MessageRejected. From is your verified address; Reply-To sends the team\'s answer to the visitor.' },
        { q: 'A new account\'s function gets `MessageRejected: Email address is not verified` when emailing a customer. What\'s happening?', options: ['The customer\'s inbox is full', 'The account is in the SES sandbox, which only sends to verified addresses', 'The Lambda timeout is too short', 'CORS is blocking it'], answer: 1, explain: 'In the sandbox, recipients must be verified too. Request production access to email anyone.' },
        { q: 'The page shows "blocked by CORS policy: No \'Access-Control-Allow-Origin\' header" calling your HTTP API. What do you fix?', options: ['Add the site\'s origin to the API\'s CORS configuration', 'Make the Lambda timeout longer', 'Use GET instead of POST', 'Allow ses:* in the role'], answer: 0, explain: 'The browser asked the API whether this origin may call it, and the API didn\'t say yes. Add the exact origin (scheme, host and port) to the allowed origins.' },
        { q: 'When SES fails, what should the function send back to the browser?', options: ['err.message, so the visitor knows what happened', 'The full error object as JSON', 'A 500 with a polite message, while the real error goes to the logs', 'A 200, to hide the problem'], answer: 2, explain: 'AWS errors can reveal account details. Log them with console.error (they go to CloudWatch Logs) and tell the visitor something useful but general.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'js3-prevent', front: 'Stop a form submit from leaving the page', back: '`form.addEventListener(\'submit\', (event) => { event.preventDefault(); ... })`', tags: ['forms'], difficulty: 'easy' },
        { id: 'js3-formdata', front: 'All of a form\'s fields as a plain object', back: '`Object.fromEntries(new FormData(form))`: each input\'s `name` becomes a key', tags: ['forms'], difficulty: 'medium' },
        { id: 'js3-post', front: 'POST `data` as JSON with fetch', back: '`fetch(url, { method: \'POST\', headers: { \'content-type\': \'application/json\' }, body: JSON.stringify(data) })`', tags: ['fetch'], difficulty: 'medium' },
        { id: 'js3-ok', front: 'Does fetch throw for a 400 answer?', back: 'No. Check `response.ok`. fetch only throws when there is no answer at all.', tags: ['fetch'], difficulty: 'medium' },
        { id: 'js3-body', front: 'Read the JSON body of an HTTP API event', back: '`JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, \'base64\').toString(\'utf8\') : event.body)`', tags: ['lambda'], difficulty: 'hard' },
        { id: 'js3-reply', front: 'What a Lambda function returns to an HTTP API', back: '`{ statusCode: 200, headers: { \'content-type\': \'application/json\' }, body: JSON.stringify(data) }`: body is a string', tags: ['lambda', 'api gateway'], difficulty: 'medium' },
        { id: 'js3-sandbox', front: 'The SES sandbox', back: 'New accounts send only to verified addresses, 200 a day, until you request production access', tags: ['ses'], difficulty: 'medium' },
        { id: 'js3-cors', front: 'What is a CORS preflight?', back: 'An OPTIONS request the browser sends first, asking the API if this origin may use this method and headers', tags: ['cors'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 60,
      body: `Deploy the whole thing to your AWS account with the AWS command line (set up in *Start here*), then send yourself a message from the real page. Use the terminal on your computer.

**1. Tools.** You need Node.js 22 or newer to test the page locally, and \`zip\`:

\`\`\`sh
node --version
\`\`\`

If that's missing or older than 22, install it from [nodejs.org](https://nodejs.org). On Ubuntu or the Windows Subsystem for Linux, also install \`zip\`:

\`\`\`sh
sudo apt update && sudo apt install -y zip
\`\`\`

**2. A folder and your settings.** Make a project folder, then copy \`app.js\`, \`index.html\` and \`style.css\` from the form step, and \`index.mjs\` from the handler step, into it. Then set these variables. Use **your own email address** for \`EMAIL\`:

\`\`\`sh
mkdir -p ~/aws-study-projects/javascript/contact-form && cd ~/aws-study-projects/javascript/contact-form
EMAIL=you@example.com
SITE=http://localhost:8080
REGION=$(aws configure get region)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "$EMAIL $REGION $ACCOUNT"
\`\`\`

If \`REGION\` comes out empty, set it yourself: \`REGION=us-east-1\`. **These variables only live in this terminal window.** If you open a new one later, run this step again (from \`EMAIL=\` on).

**3. Verify your address with SES.** Your account is in the sandbox, so you'll send *from* and *to* this same address:

\`\`\`sh
aws sesv2 create-email-identity --email-identity "$EMAIL"
\`\`\`

Open the email from Amazon Web Services and click the link. Then check:

\`\`\`sh
aws sesv2 get-email-identity --email-identity "$EMAIL" --query VerifiedForSendingStatus
\`\`\`

Wait until it says \`true\`.

**4. The function's role.** Who may use it (Lambda), the managed policy for logs, and permission to send from your one address:

\`\`\`sh
cat > trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Principal": { "Service": "lambda.amazonaws.com" }, "Action": "sts:AssumeRole" }
  ]
}
EOF
cat > send.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "ses:SendEmail", "Resource": "arn:aws:ses:$REGION:$ACCOUNT:identity/$EMAIL" }
  ]
}
EOF
aws iam create-role --role-name contact-form-role --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name contact-form-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy --role-name contact-form-role --policy-name send-contact-email \\
  --policy-document file://send.json
\`\`\`

The first heredoc has \`'EOF'\` in quotes, so it's copied exactly. The second has no quotes, so the shell fills in \`$REGION\`, \`$ACCOUNT\` and \`$EMAIL\`. A new role takes a few seconds to reach Lambda: wait 10 seconds before the next step.

**5. The function.** Zip it and create it, with the addresses as environment variables:

\`\`\`sh
zip function.zip index.mjs
aws lambda create-function --function-name contact-form \\
  --runtime nodejs22.x --handler index.handler --timeout 10 \\
  --role "arn:aws:iam::$ACCOUNT:role/contact-form-role" \\
  --zip-file fileb://function.zip \\
  --environment "Variables={TO_ADDRESS=$EMAIL,FROM_ADDRESS=$EMAIL}"
\`\`\`

If it says the role "cannot be assumed by Lambda", the role isn't ready yet: wait 10 seconds and run it again.

**6. The API.** An HTTP API with CORS for your test page, a Lambda integration, the \`POST /contact\` route, and an auto-deploying stage with throttling:

\`\`\`sh
cat > cors.json <<EOF
{ "AllowOrigins": ["$SITE"], "AllowMethods": ["POST"], "AllowHeaders": ["content-type"], "MaxAge": 3600 }
EOF
API_ID=$(aws apigatewayv2 create-api --name contact-form-api --protocol-type HTTP \\
  --cors-configuration file://cors.json --query ApiId --output text)
INTEGRATION_ID=$(aws apigatewayv2 create-integration --api-id "$API_ID" \\
  --integration-type AWS_PROXY --payload-format-version 2.0 \\
  --integration-uri "arn:aws:lambda:$REGION:$ACCOUNT:function:contact-form" \\
  --query IntegrationId --output text)
aws apigatewayv2 create-route --api-id "$API_ID" --route-key "POST /contact" \\
  --target "integrations/$INTEGRATION_ID"
aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy \\
  --default-route-settings ThrottlingBurstLimit=5,ThrottlingRateLimit=2
\`\`\`

\`'$default'\` is in single quotes on purpose: it's the stage's real name, not a shell variable.

**7. Let API Gateway call the function.** A resource-based policy on the function, limited to this API's route:

\`\`\`sh
aws lambda add-permission --function-name contact-form \\
  --statement-id allow-contact-api --action lambda:InvokeFunction \\
  --principal apigateway.amazonaws.com \\
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT:$API_ID/*/POST/contact"
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/contact"
echo "$API_URL"
\`\`\`

**8. Test it with curl.** A good message, then a bad one:

\`\`\`sh
curl -i -X POST "$API_URL" -H 'content-type: application/json' \\
  -d '{"name":"Test","email":"test@example.org","message":"Hello from curl"}'
curl -i -X POST "$API_URL" -H 'content-type: application/json' -d '{"name":"Test"}'
\`\`\`

The first answers \`200\` and an email arrives (check your spam folder the first time). The second answers \`400\`. If something fails, read the function's logs:

\`\`\`sh
aws logs tail /aws/lambda/contact-form --since 1h
\`\`\`

**9. The real page.** In \`app.js\`, set \`API_URL\` to the address from step 7, then serve the folder on port 8080 (the origin you allowed in CORS):

\`\`\`sh
npx --yes http-server -p 8080 .
\`\`\`

Open [http://localhost:8080](http://localhost:8080), send a message, and watch it arrive. Press Ctrl+C to stop the server. To use the form on your real site, add its origin to \`AllowOrigins\` in \`cors.json\` and run \`aws apigatewayv2 update-api --api-id "$API_ID" --cors-configuration file://cors.json\`.

**10. Push it to GitHub.** The code has no addresses, keys or account numbers in it: those live in the function's settings. Add \`function.zip\` to \`.gitignore\`.

**Cost:** for a contact form, practically nothing. Lambda includes a million requests a month free. HTTP APIs cost about $1 per million requests (new accounts get free credits to start with). SES costs $0.10 per 1,000 emails.

**To clean up** (in a new terminal, run step 2 first):

\`\`\`sh
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='contact-form-api'].ApiId" --output text)
aws apigatewayv2 delete-api --api-id "$API_ID"
aws lambda delete-function --function-name contact-form
aws iam delete-role-policy --role-name contact-form-role --policy-name send-contact-email
aws iam detach-role-policy --role-name contact-form-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name contact-form-role
aws logs delete-log-group --log-group-name /aws/lambda/contact-form
aws sesv2 delete-email-identity --email-identity "$EMAIL"
\`\`\``,
      checklist: [
        'My address is verified in SES (`VerifiedForSendingStatus` is true)',
        'curl with a good message answered 200, and the email arrived',
        'curl with a bad message answered 400, and no email came',
        'The page on http://localhost:8080 sent a message without reloading',
        'The project is on GitHub, without function.zip',
      ],
    },
  ],
};

export default tutorial;
