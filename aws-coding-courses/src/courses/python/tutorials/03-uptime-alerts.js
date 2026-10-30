// Tutorial 3: a Lambda function that checks every site and certificate each
// hour, and emails the team through SNS when something is wrong.

// ---------------------------------------------------------------------------
// The practice internet. Certificate dates are worked out from today, so
// "expires in 12 days" stays true whenever someone takes the tutorial.
// ---------------------------------------------------------------------------

const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// The way certificates write dates: 'Dec  5 12:00:00 2026 GMT' (day padded with a space)
const certTime = (ms) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${d.getUTCFullYear()} GMT`;
};

export const TOPIC_ARN = 'arn:aws:sns:us-east-1:111122223333:site-alerts';

export const SITES = [
  'https://www.example.com',
  'https://shop.example.com',
  'https://api.example.com',
  'https://status.example.com',
  'https://blog.example.com',
  'https://docs.example.com',
];

const siteScenario = () => {
  const now = Date.now();
  return {
    web: {
      'https://www.example.com': { status: 200, body: '<title>Example Store</title>', ms: 180 },
      'https://shop.example.com': { status: 200, body: '<title>Shop</title>', ms: 240 },
      'https://api.example.com': { status: 503, body: 'Service Unavailable', ms: 90 },
      'https://status.example.com': { hang: true },
      'https://blog.example.com': { status: 200, body: '<title>Blog</title>', ms: 210 },
      'https://docs.example.com': { status: 200, body: '<title>Docs</title>', ms: 150 },
      'https://old-promo.example.com': { error: 'dns' },
    },
    certs: {
      'www.example.com': { notAfter: certTime(now + 74.5 * DAY) },
      'shop.example.com': { notAfter: certTime(now + 12.5 * DAY) },
      'api.example.com': { notAfter: certTime(now + 61.5 * DAY) },
      'blog.example.com': { notAfter: certTime(now - 3 * DAY) },
      'docs.example.com': { notAfter: certTime(now + 200.5 * DAY) },
    },
    aws: { sns: ['site-alerts'] },
    env: { SITES: SITES.join(','), TOPIC_ARN },
  };
};

// What Amazon EventBridge sends a function on a schedule
const SCHEDULED_EVENT = {
  version: '0',
  id: '53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa',
  'detail-type': 'Scheduled Event',
  source: 'aws.events',
  account: '111122223333',
  time: '2026-11-02T09:00:00Z',
  region: 'us-east-1',
  resources: ['arn:aws:events:us-east-1:111122223333:rule/site-checker-hourly'],
  detail: {},
};

// ---------------------------------------------------------------------------
// Code the learner builds up
// ---------------------------------------------------------------------------

const CHECK_SITE = `def check_site(url):
    """Is this site up? Returns ok, the status (or the error) and the time it took."""
    start = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as resp:
            status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code  # the site answered, with an error status
    except (urllib.error.URLError, TimeoutError) as e:
        ms = round((time.monotonic() - start) * 1000)
        return {"url": url, "ok": False, "error": str(getattr(e, "reason", e)), "ms": ms}
    ms = round((time.monotonic() - start) * 1000)
    return {"url": url, "ok": 200 <= status < 400, "status": status, "ms": ms}`;

const UPTIME_STARTER = `# uptime.py: is each site up, and how fast does it answer?
import time
import urllib.error
import urllib.request

TIMEOUT = 10  # seconds
URLS = [
    "https://www.example.com",
    "https://api.example.com",
    "https://old-promo.example.com",
    "https://status.example.com",
]


def check_site(url):
    """Is this site up? Returns ok, the status (or the error) and the time it took."""
    start = time.monotonic()
    # TODO: pass timeout=TIMEOUT, and catch the errors:
    #   urllib.error.HTTPError  -> the site answered with an error: status = e.code
    #   urllib.error.URLError   -> no answer at all: return ok False and str(e.reason)
    with urllib.request.urlopen(url) as resp:
        status = resp.status
    ms = round((time.monotonic() - start) * 1000)
    return {"url": url, "ok": status == 200, "status": status, "ms": ms}


for url in URLS:
    print(check_site(url))
`;

const UPTIME_SOLUTION = `# uptime.py: is each site up, and how fast does it answer?
import time
import urllib.error
import urllib.request

TIMEOUT = 10  # seconds
URLS = [
    "https://www.example.com",
    "https://api.example.com",
    "https://old-promo.example.com",
    "https://status.example.com",
]


${CHECK_SITE}


for url in URLS:
    print(check_site(url))`;

const CHECK_CERT = `def check_cert(host):
    """How many days until this site's certificate expires?"""
    try:
        with socket.create_connection((host, 443), timeout=TIMEOUT) as sock:
            with tls_context.wrap_socket(sock, server_hostname=host) as tls:
                cert = tls.getpeercert()
    except ssl.SSLCertVerificationError as e:
        if e.verify_message == "certificate has expired":
            return {"host": host, "status": "EXPIRED"}
        return {"host": host, "status": "ERROR", "detail": e.verify_message}
    except OSError as e:  # no answer: unknown name, refused, timed out
        return {"host": host, "status": "ERROR", "detail": str(e)}
    expires = ssl.cert_time_to_seconds(cert["notAfter"])
    days = int((expires - time.time()) // 86400)
    status = "EXPIRING" if days < WARN_DAYS else "OK"
    return {"host": host, "status": status, "days_left": days}`;

const CERTS_STARTER = `# certs.py: how long until each site's certificate expires?
import socket
import ssl
import time

TIMEOUT = 10
WARN_DAYS = 30
HOSTS = ["www.example.com", "shop.example.com", "blog.example.com", "status.example.com"]
tls_context = ssl.create_default_context()


def check_cert(host):
    """How many days until this site's certificate expires?"""
    with socket.create_connection((host, 443), timeout=TIMEOUT) as sock:
        with tls_context.wrap_socket(sock, server_hostname=host) as tls:
            cert = tls.getpeercert()
    # TODO: days left = (ssl.cert_time_to_seconds(cert["notAfter"]) - time.time()) // 86400
    #       status "EXPIRING" when fewer than WARN_DAYS are left, otherwise "OK"
    # TODO: catch ssl.SSLCertVerificationError (expired -> "EXPIRED")
    #       and then OSError (no connection -> "ERROR")
    return {"host": host, "status": "OK", "days_left": None}


for host in HOSTS:
    print(check_cert(host))
`;

const CERTS_SOLUTION = `# certs.py: how long until each site's certificate expires?
import socket
import ssl
import time

TIMEOUT = 10
WARN_DAYS = 30
HOSTS = ["www.example.com", "shop.example.com", "blog.example.com", "status.example.com"]
tls_context = ssl.create_default_context()


${CHECK_CERT}


for host in HOSTS:
    print(check_cert(host))`;

const HANDLER_HEAD = `# lambda_function.py: check every site and certificate each hour,
# and email the team when something is wrong.
import os
import socket
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request

import boto3

# Settings come from the function's environment variables
SITES = [s.strip() for s in os.environ["SITES"].split(",") if s.strip()]
TOPIC_ARN = os.environ["TOPIC_ARN"]
TIMEOUT = 10
WARN_DAYS = 30

# Created once, then reused while the function stays warm
sns = boto3.client("sns")
tls_context = ssl.create_default_context()


# --- Your functions from the earlier steps --------------------------------

${CHECK_SITE}


${CHECK_CERT}


# --- The handler: Lambda calls this ---------------------------------------
`;

export const HANDLER_STARTER = `${HANDLER_HEAD}
def lambda_handler(event, context):
    problems = []
    for url in SITES:
        site = check_site(url)
        cert = check_cert(urllib.parse.urlsplit(url).hostname)
        print(site, cert)  # print goes to CloudWatch Logs
        # TODO: if the site isn't ok, add a line like
        #   "DOWN https://api.example.com: status 503"
        # TODO: if the certificate is EXPIRED or EXPIRING, add a line like
        #   "CERTIFICATE shop.example.com: expires in 12 days"

    # TODO: if there are problems, publish ONE message to TOPIC_ARN with all
    #       the lines, and a short Subject. Nothing at all when all is well.

    return {"checked": len(SITES)}
`;

export const HANDLER_SOLUTION = `${HANDLER_HEAD}
def lambda_handler(event, context):
    problems = []
    for url in SITES:
        site = check_site(url)
        cert = check_cert(urllib.parse.urlsplit(url).hostname)
        print(site, cert)  # print goes to CloudWatch Logs
        if not site["ok"]:
            detail = f"status {site['status']}" if "status" in site else site["error"]
            problems.append(f"DOWN {url}: {detail}")
        if cert["status"] == "EXPIRED":
            problems.append(f"CERTIFICATE {cert['host']}: EXPIRED")
        elif cert["status"] == "EXPIRING":
            problems.append(f"CERTIFICATE {cert['host']}: expires in {cert['days_left']} days")

    if problems:
        sns.publish(
            TopicArn=TOPIC_ARN,
            Subject=f"Site check: {len(problems)} problem(s)",
            Message="\\n".join(problems),
        )
    return {"checked": len(SITES), "problems": len(problems), "alerted": bool(problems)}`;

// Runs after the test event: makes every site healthy, calls the handler again,
// and counts the emails, so the check can tell "one email" and "no email when fine".
const QUIET_PROBE = `import practice
msgs = practice.aws.STATE["sns"]["${TOPIC_ARN}"]["messages"]
before = len(msgs)
for site in practice.net.WEB.values():
    site.clear()
    site.update({"status": 200, "ms": 150})
for host in list(practice.net.CERTS):
    practice.net.CERTS[host] = {"notAfter": practice.net.cert_time(practice.net._real["time"]() + 90 * 86400)}
quiet = lambda_handler({}, practice.context())
RESULT = {"before": before, "after": len(msgs), "quiet": quiet}`;

const tutorial = {
  slug: 'uptime-and-certificate-alerts',
  number: 3,
  title: 'Uptime and certificate alerts',
  situation: 'Last month the company site\'s security certificate expired on a Saturday. Customers saw a scary browser warning for 9 hours before anyone noticed. You build an AWS Lambda function that checks every site each hour, and emails the team when a site is down or a certificate expires within 30 days.',
  level: 'Intermediate',
  hours: 4,
  skills: ['HTTP requests', 'timeouts', 'exceptions', 'certificates', 'environment variables', 'Lambda handlers'],
  aws: ['AWS Lambda', 'Amazon SNS', 'Amazon EventBridge Scheduler', 'Amazon CloudWatch Logs', 'IAM roles'],
  overview: 'You\'ll check websites with Python\'s built-in `urllib`, handle every way a request can fail, and read a site\'s certificate to see how many days it has left. Then you put both checks in a Lambda function that runs every hour and sends one email through Amazon SNS when there\'s a problem, and none when there isn\'t.',
  steps: [
    {
      id: 'http-basics',
      kind: 'read',
      runtime: 'python',
      title: 'Ask a website how it\'s doing',
      minutes: 15,
      body: `Checking a site is what your browser does: send a request, read the answer. Python's standard library does it with \`urllib.request.urlopen\`. The practice internet below has a few company sites. Press **Run**:

\`\`\`python
import urllib.request

with urllib.request.urlopen("https://www.example.com", timeout=10) as resp:
    print(resp.status, resp.read().decode())
\`\`\`

\`resp.status\` is the **status code**, the site's one-number answer:

| Code | Means |
|---|---|
| 200 | OK |
| 301, 302 | moved: \`urlopen\` follows these for you |
| 404 | no such page |
| 500, 502, 503 | the site is broken or overloaded |

### Errors are exceptions

Now the API, which is having a bad day:

\`\`\`python
urllib.request.urlopen("https://api.example.com", timeout=10)
\`\`\`

For a 4xx or 5xx answer, \`urlopen\` doesn't return at all: it **raises** an \`HTTPError\`. That's an answer, just a bad one, and \`e.code\` holds the number:

\`\`\`python
import urllib.error

try:
    urllib.request.urlopen("https://api.example.com", timeout=10)
except urllib.error.HTTPError as e:
    print("answered with", e.code)
\`\`\`

When there's **no answer at all**, you get a \`URLError\` instead, and \`e.reason\` says why: the name doesn't exist, the connection was refused, or it timed out.

\`\`\`python
try:
    urllib.request.urlopen("https://old-promo.example.com", timeout=10)
except urllib.error.URLError as e:
    print("no answer:", e.reason)
\`\`\`

### Always set a timeout

The status page is stuck: it accepts the connection and never answers. Without a timeout, a real program waits **for ever**:

\`\`\`python
try:
    urllib.request.urlopen("https://status.example.com")
except urllib.error.URLError as e:
    print("gave up:", e.reason)
\`\`\`

The practice internet gave up for you after two minutes and printed a warning. A real Lambda function would sit there until it hit its own time limit and was stopped, without ever sending your alert. With \`timeout=10\`, it gives up after 10 seconds and moves on to the next site:

\`\`\`python
try:
    urllib.request.urlopen("https://status.example.com", timeout=10)
except urllib.error.URLError as e:
    print("gave up:", e.reason)
\`\`\`

> **Why not the popular \`requests\` library?** It's nicer to use, but it isn't part of the Lambda Python runtime: you'd have to package it with your code. \`urllib\` is always there, so small Lambda functions often use it.`,
      scenario: siteScenario,
    },
    {
      id: 'check-site',
      kind: 'try',
      runtime: 'python',
      title: 'Write the uptime check',
      minutes: 20,
      body: `A check that crashes on the first broken site is no use, because broken sites are the whole point. So \`check_site\` catches every failure and always returns a dictionary:

\`\`\`text
{"url": "https://www.example.com", "ok": True, "status": 200, "ms": 180}
{"url": "https://old-promo.example.com", "ok": False, "error": "[Errno -2] Name or service not known", "ms": 0}
\`\`\`

Two details matter:

- **Order of the \`except\` lines.** \`HTTPError\` is a kind of \`URLError\` (a *subclass*), and Python uses the first \`except\` that matches. Catch \`HTTPError\` first, or the 503 lands in the "no answer" branch.
- **Response time.** \`time.monotonic()\` is a clock that only goes forward. Read it before and after, and the difference is how long the request took. (Don't use the time of day for this: it can jump when the computer's clock is corrected.)

A slow answer can also time out halfway through reading, and then Python raises \`TimeoutError\` directly instead of wrapping it in a \`URLError\`. Catching both, \`except (urllib.error.URLError, TimeoutError) as e:\`, covers it.`,
      task: 'Finish `check_site(url)` in `uptime.py` so it never crashes: pass `timeout=TIMEOUT`, catch `HTTPError` (use `e.code` as the status) and `URLError` (return `ok` False with `str(e.reason)` as `error`). Keep `ms` in every result.',
      hint: 'Wrap the `with urllib.request.urlopen(url, timeout=TIMEOUT) as resp:` block in `try:`. Then `except urllib.error.HTTPError as e: status = e.code`, and after it `except urllib.error.URLError as e:` returning `{"url": url, "ok": False, "error": str(e.reason), "ms": ...}`.',
      solution: UPTIME_SOLUTION,
      files: [{ path: 'uptime.py', starter: UPTIME_STARTER }],
      scenario: siteScenario,
      probe: '[check_site(u) for u in ["https://www.example.com", "https://api.example.com", "https://old-promo.example.com", "https://status.example.com"]]',
      check: ({ probe, probeError, web, result }) => {
        if (probeError === 'NameError') return null;
        if (probeError === 'HTTPError' || result.error?.type === 'HTTPError') return 'check_site crashed on the 503 from api.example.com. Catch `urllib.error.HTTPError` and use `e.code` as the status.';
        if (probeError === 'URLError' || result.error?.type === 'URLError') return 'check_site crashed on a site that didn\'t answer. Catch `urllib.error.URLError` and return ok False with `str(e.reason)`.';
        if (probeError) return `check_site raised ${probeError}. It should catch failures and return a dictionary instead.`;
        if (!Array.isArray(probe) || probe.some((r) => !r || typeof r !== 'object')) return null;
        const [www, api, dns, hang] = probe;
        if (www.ok !== true || www.status !== 200) return 'www.example.com is up (status 200), but check_site doesn\'t say ok True with status 200.';
        if (api.ok !== false || !(api.status === 503 || String(api.error || '').includes('503'))) return 'api.example.com answers 503: that should be ok False with status 503. Is `except HTTPError` above `except URLError`?';
        if (dns.ok !== false || !dns.error) return 'old-promo.example.com doesn\'t exist: return ok False and the reason in "error".';
        if (hang.ok !== false || !/timed out/.test(String(hang.error))) return 'status.example.com never answers: return ok False with the "timed out" reason.';
        const untimed = (web?.log || []).filter((e) => e.kind === 'http' && e.timeout === null);
        if (untimed.length) return `Some requests had no timeout (${untimed[0].url}). Pass \`timeout=TIMEOUT\` to urlopen, so one stuck site can't hold up the rest.`;
        if (probe.some((r) => typeof r.ms !== 'number') || www.ms <= 0) return 'Every result needs "ms": the milliseconds the request took, from time.monotonic() before and after.';
        return true;
      },
      success: 'Four sites, four kinds of answer, and the function came back from every one. The stuck site cost 10 seconds instead of for ever.',
    },
    {
      id: 'certificates',
      kind: 'read',
      runtime: 'python',
      title: 'Read a site\'s certificate',
      minutes: 15,
      body: `The padlock in the browser comes from the site's **TLS certificate**: proof that the site really is \`www.example.com\`. Every certificate has an expiry date. Free ones from Let's Encrypt last 90 days, paid ones about a year. When it passes, browsers show a full-page warning and most people leave.

To read the date, open a connection to the site's secure port (443) and do the same **handshake** a browser does:

\`\`\`python
import socket, ssl

tls_context = ssl.create_default_context()
host = "shop.example.com"
with socket.create_connection((host, 443), timeout=10) as sock:
    with tls_context.wrap_socket(sock, server_hostname=host) as tls:
        cert = tls.getpeercert()

cert["notAfter"]
\`\`\`

- \`socket.create_connection\` opens a plain connection, with a timeout like before.
- \`wrap_socket\` does the handshake. \`server_hostname\` tells the site which certificate you want, since one server often hosts many sites.
- \`getpeercert()\` returns the certificate as a dictionary. \`notAfter\` is the expiry date.

\`ssl.cert_time_to_seconds\` turns that date into seconds since 1970, the same count \`time.time()\` uses for "now". Subtract, and divide by the seconds in a day:

\`\`\`python
import time

seconds_left = ssl.cert_time_to_seconds(cert["notAfter"]) - time.time()
int(seconds_left // 86400)
\`\`\`

\`//\` divides and rounds down, so 12.9 days left counts as 12. Rounding down is the safe direction for a warning.

### An expired certificate fails the handshake

\`create_default_context()\` checks certificates the way a browser does, so an expired one doesn't connect at all:

\`\`\`python
host = "blog.example.com"
try:
    with socket.create_connection((host, 443), timeout=10) as sock:
        with tls_context.wrap_socket(sock, server_hostname=host) as tls:
            print(tls.getpeercert()["notAfter"])
except ssl.SSLCertVerificationError as e:
    print("refused:", e.verify_message)
\`\`\`

That's good news: you don't need the date to know it's **EXPIRED**. Just catch the error and say so.

> **Don't switch the check off.** Code online sometimes sets \`verify_mode = ssl.CERT_NONE\` to "fix" this error. Then nothing gets checked, and \`getpeercert()\` returns an empty dictionary anyway.`,
      scenario: siteScenario,
    },
    {
      id: 'check-cert',
      kind: 'try',
      runtime: 'python',
      title: 'Write the certificate check',
      minutes: 20,
      body: `Like \`check_site\`, \`check_cert\` never crashes, and it returns one of four statuses:

| status | when | extra keys |
|---|---|---|
| \`OK\` | 30 days or more left | \`days_left\` |
| \`EXPIRING\` | fewer than 30 days left | \`days_left\` |
| \`EXPIRED\` | the handshake says "certificate has expired" | |
| \`ERROR\` | no connection at all | \`detail\` |

Catch \`ssl.SSLCertVerificationError\` **before** \`OSError\`. The certificate error is a kind of \`OSError\` too, so the order decides which branch runs. \`OSError\` then covers every way a connection fails: unknown name, refused, timed out.

\`ERROR\` isn't a certificate problem: the uptime check already reports a site that doesn't answer. Keeping them apart stops one broken site from sending two alarms for the same thing.`,
      task: 'Finish `check_cert(host)` in `certs.py`: work out `days_left`, set the status to `OK` or `EXPIRING` (under 30 days), return `EXPIRED` for an expired certificate, and `ERROR` with a `detail` when it can\'t connect.',
      hint: 'After the `with` blocks: `days = int((ssl.cert_time_to_seconds(cert["notAfter"]) - time.time()) // 86400)`. Wrap the `with` blocks in `try:`, then `except ssl.SSLCertVerificationError as e:` (check `e.verify_message == "certificate has expired"`), then `except OSError as e:`.',
      solution: CERTS_SOLUTION,
      files: [{ path: 'certs.py', starter: CERTS_STARTER }],
      scenario: siteScenario,
      probe: '[check_cert(h) for h in ["www.example.com", "shop.example.com", "blog.example.com", "status.example.com"]]',
      check: ({ probe, probeError, result }) => {
        if (probeError === 'NameError') return null;
        if (probeError === 'SSLCertVerificationError' || result.error?.type === 'SSLCertVerificationError') return 'check_cert crashed on blog.example.com, whose certificate has expired. Catch `ssl.SSLCertVerificationError` and return status "EXPIRED".';
        if (probeError === 'TimeoutError' || result.error?.type === 'TimeoutError') return 'check_cert crashed on status.example.com, which never answers. Catch `OSError` (after the certificate error) and return status "ERROR".';
        if (probeError) return `check_cert raised ${probeError}. It should catch it and return a status instead.`;
        if (!Array.isArray(probe) || probe.some((r) => !r || typeof r !== 'object')) return null;
        const [www, shop, blog, status] = probe;
        if (typeof www.days_left !== 'number' || typeof shop.days_left !== 'number') return 'Work out "days_left" from cert["notAfter"] with ssl.cert_time_to_seconds() and time.time().';
        if (www.days_left < 70 || www.days_left > 75) return `www.example.com shows ${www.days_left} days left; it should be about 74. Subtract time.time() and divide by 86400 with //.`;
        if (www.status !== 'OK') return 'www.example.com has 74 days left: status "OK".';
        if (shop.status !== 'EXPIRING' || shop.days_left < 11 || shop.days_left > 12) return 'shop.example.com has 12 days left: status "EXPIRING" (fewer than WARN_DAYS).';
        if (blog.status !== 'EXPIRED') return 'blog.example.com\'s certificate has expired: status "EXPIRED". Is `except ssl.SSLCertVerificationError` above `except OSError`?';
        if (status.status !== 'ERROR' || !status.detail) return 'status.example.com can\'t be reached: status "ERROR" with a "detail".';
        return true;
      },
      success: 'Now 12 days\' warning arrives with time to renew, and an expired certificate is called out by name instead of crashing the check.',
    },
    {
      id: 'lambda-model',
      kind: 'read',
      runtime: 'python',
      title: 'How a Lambda function works',
      minutes: 20,
      body: `**AWS Lambda** runs your code without a server to look after. You upload the code, and AWS runs it whenever something calls it: a schedule, an upload, a web request. You pay only for the milliseconds it runs.

### The handler

Lambda calls one function in your file, the **handler**, with two arguments:

\`\`\`python
def lambda_handler(event, context):
    print("event:", event)
    return {"ok": True}
\`\`\`

- **event**: a dictionary describing what happened. A schedule sends little more than the time; an upload sends the bucket and file name.
- **context**: details about this run, like \`context.aws_request_id\` and \`context.get_remaining_time_in_millis()\`.
- **return**: the answer, sent back to whoever called it. Lambda turns it into JSON.
- **print()** output goes to **Amazon CloudWatch Logs**, where you'll read it later.

In the practice console, \`practice.context()\` makes a stand-in for the context:

\`\`\`python
import practice
lambda_handler({"time": "2026-11-02T09:00:00Z"}, practice.context())
\`\`\`

### Settings in environment variables

The list of sites and the email topic will change, and they're different in a test account and the real one. So they don't belong in the code. Lambda passes **environment variables** to your function, and Python reads them with \`os.environ\`:

\`\`\`python
import os
os.environ["SITES"].split(",")
\`\`\`

### Code outside the handler runs once

Lambda keeps your function's environment **warm** for a while between runs. Lines at the top of the file run once, when it starts; only the handler runs every time. That's why you create the boto3 client at the top: it's reused, and each run is faster.

### Time limit

A function is stopped when it hits its **timeout**. The default is **3 seconds**, and the maximum is 15 minutes. One stuck site takes 10 seconds before it gives up, so this function needs more: set it to **60 seconds**.

### Sending the email: Amazon SNS

**Amazon Simple Notification Service (SNS)** delivers a message to everyone **subscribed** to a **topic**: email addresses, phone numbers, other programs. Your code publishes once, and SNS does the delivering. The practice account has a topic called \`site-alerts\`:

\`\`\`python
import boto3, os
sns = boto3.client("sns")
sns.publish(
    TopicArn=os.environ["TOPIC_ARN"],
    Subject="Site check: 1 problem(s)",
    Message="DOWN https://api.example.com: status 503",
)
\`\`\`

The **Subject** becomes the email's subject line, and SNS is strict about it: under 100 characters, and **no line breaks**. Put the details in **Message**, one line each:

\`\`\`python
sns.publish(TopicArn=os.environ["TOPIC_ARN"], Subject="Problems:\\napi down", Message="x")
\`\`\`

> **One email per run, not one per problem.** Five problems should be one email with five lines. Otherwise a bad hour fills everyone's inbox and people start ignoring the alerts.`,
      scenario: siteScenario,
    },
    {
      id: 'handler',
      kind: 'try',
      runtime: 'python',
      title: 'The alerting Lambda function',
      minutes: 30,
      body: `\`lambda_function.py\` has your two checks at the top, the settings from environment variables, and the boto3 client. The handler loops over the sites; you write the part that decides and alerts.

Press **Test with the sample event** to run it the way Lambda would. The console shows the same lines Lambda writes to CloudWatch Logs: \`START\`, your prints, \`END\`, and a \`REPORT\` with the **Duration**. Then the **Response**, what the handler returned.

> Look at the Duration after a run: the stuck site alone takes 20 seconds (10 for the page, 10 for the certificate). With Lambda's default 3-second timeout, this function would be stopped before it ever sent the email.`,
      task: 'Finish the handler: collect a line for each site that\'s down and each certificate that\'s `EXPIRED` or `EXPIRING`, publish **one** SNS message with all of them (only when there are problems), and return `{"checked": ..., "problems": ..., "alerted": ...}`.',
      hint: 'In the loop: `if not site["ok"]: problems.append(f"DOWN {url}: ...")` and the same for `cert["status"]`. After the loop: `if problems: sns.publish(TopicArn=TOPIC_ARN, Subject=f"Site check: {len(problems)} problem(s)", Message="\\n".join(problems))`. Return `len(SITES)`, `len(problems)` and `bool(problems)`.',
      solution: HANDLER_SOLUTION,
      files: [{ path: 'lambda_function.py', starter: HANDLER_STARTER, invoke: { event: SCHEDULED_EVENT, handler: 'lambda_handler', timeout: 60, function: 'site-checker' } }],
      scenario: siteScenario,
      probe: QUIET_PROBE,
      check: ({ result, probe, probeError, aws }) => {
        if (result.error) return result.error.type === 'KeyError' ? 'The file couldn\'t read an environment variable. Use os.environ["SITES"] and os.environ["TOPIC_ARN"].' : null;
        if (!result.invoke) return null;
        const err = result.invoke.error;
        if (err) {
          if (/InvalidParameter/.test(err.message || '')) return 'SNS refused the message. The Subject must be under 100 characters with no line breaks: put the details in Message.';
          return `The function failed with ${err.type}: ${err.message}`;
        }
        const messages = aws?.sns?.[TOPIC_ARN]?.messages || [];
        const sent = probe ? messages.slice(0, probe.before) : messages;
        if (!sent.length) return 'No email went out, but four sites have problems. Publish to TOPIC_ARN when `problems` isn\'t empty.';
        if (sent.length > 1) return `That run sent ${sent.length} emails. Send one: collect the lines in a list and publish them together with "\\n".join(...).`;
        const text = `${sent[0].subject || ''}\n${sent[0].message}`;
        const missing = ['api.example.com', 'status.example.com', 'blog.example.com', 'shop.example.com'].filter((h) => !text.includes(h));
        if (missing.length) return `The email doesn't mention ${missing.join(', ')}. Add a line for every site that's down and every certificate that's EXPIRED or EXPIRING.`;
        if (['www.example.com', 'docs.example.com'].some((h) => text.includes(h))) return 'The email lists healthy sites too. Only add lines for problems, so the email is quick to read.';
        const res = result.invoke.response || {};
        if (res.checked !== 6 || res.alerted !== true || typeof res.problems !== 'number' || res.problems < 4) {
          return `The handler returned ${JSON.stringify(res)}. Return {"checked": 6, "problems": <how many lines>, "alerted": true}.`;
        }
        if (probeError === 'InvalidParameterException') return 'With every site healthy there are no lines to send, and SNS refuses an empty message. Only publish when `problems` isn\'t empty.';
        if (probeError) return `With every site healthy, the handler failed (${probeError}). It should run quietly.`;
        if (!probe) return null;
        if (probe.after !== probe.before) return 'With every site healthy, the handler still sent an email. Only publish when there are problems.';
        if (probe.quiet?.alerted !== false) return 'With every site healthy, the handler should return "alerted": false.';
        return true;
      },
      success: 'One email listing the four broken sites, and silence when everything is fine. That silence matters as much as the alert: it\'s what makes people trust the email when it does come.',
    },
    {
      id: 'schedule-permissions',
      kind: 'read',
      title: 'Every hour, with only the permissions it needs',
      minutes: 15,
      body: `Two things turn the function into a watchman: a **schedule** that runs it, and **permissions** that let it do its job and nothing else.

### The schedule: Amazon EventBridge Scheduler

**Amazon EventBridge Scheduler** calls a target, like your function, on a timetable:

| Expression | Runs |
|---|---|
| \`rate(1 hour)\` | every hour |
| \`rate(15 minutes)\` | every 15 minutes |
| \`cron(0 9 ? * MON-FRI *)\` | 9:00 every weekday (UTC unless you set a time zone) |

The scheduler needs permission to call your function, so it gets its own small role that can do one thing: \`lambda:InvokeFunction\` on this function.

### The function's role

Every Lambda function runs as an **IAM role**, its **execution role**. Whatever that role allows, your code can do, and nothing more. This one needs two things:

1. **Write its logs.** The AWS managed policy \`AWSLambdaBasicExecutionRole\` allows writing to CloudWatch Logs.
2. **Publish to one topic.** A small policy of your own:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sns:Publish",
    "Resource": "arn:aws:sns:us-east-1:111122223333:site-alerts"
  }]
}
\`\`\`

Note the **Resource**: this topic only, not \`"*"\`. If the code is ever wrong, or someone gets hold of the role, the worst it can do is send an email to your own team. That's **least privilege**.

> Checking websites needs no AWS permission at all: it's ordinary internet traffic. Functions are on the internet by default; only if you put one inside a private network (a VPC) does it need extra setup to reach outside.

### When the function itself fails

If the code crashes, the schedule keeps running it every hour. Two safety nets:

- **The logs**: everything you print, plus any error and its traceback, is in CloudWatch Logs. \`aws logs tail\` shows them in your terminal.
- **An alarm**: Lambda counts every failed run in a CloudWatch metric called **Errors**. An alarm on it (more than 0 in an hour) tells you when the watchman itself is broken.`,
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: AWS Certified Developer – Associate',
      minutes: 8,
      body: `This tutorial covers several things the Developer Associate exam asks about again and again:

- **Lambda timeout**: default **3 seconds**, maximum **15 minutes** (900 seconds). A function that calls slow services needs more than the default. "Task timed out" in the logs means this.
- **Initialize outside the handler**: SDK clients and connections created at the top of the file are reused across invocations while the environment is warm. It's a standard "how do you make this function faster?" answer.
- **Environment variables** hold configuration, up to 4 KB in total. They're encrypted at rest with AWS KMS. Real secrets (passwords, API keys) belong in **AWS Secrets Manager** or **Systems Manager Parameter Store**, read at startup.
- **Execution role vs. who may call the function**: the *execution role* is what the function can do (here: publish, write logs). Who can *invoke* it is separate: here the scheduler's own role; for S3 or SNS triggers, a resource-based policy added with \`aws lambda add-permission\`.
- **Logs** need \`logs:CreateLogGroup\`, \`logs:CreateLogStream\` and \`logs:PutLogEvents\`: exactly what \`AWSLambdaBasicExecutionRole\` grants. No logs showing up usually means the role is missing them.
- **SNS** is push-based fan-out: one publish, many subscribers. **Email subscriptions must be confirmed** by clicking the link before they receive anything.
- **Asynchronous invocations** (schedules, S3 and SNS events) are retried by Lambda **twice** on errors. Failed events can go to a **dead-letter queue** or an **on-failure destination**. Tutorial 4 uses this.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'What does `urllib.request.urlopen` do when a site answers with status 503?', options: ['Returns a response with `status` 503', 'Raises an `HTTPError` whose `code` is 503', 'Returns `None`', 'Waits and tries again'], answer: 1, explain: 'Any 4xx or 5xx answer raises `HTTPError`. Catch it, and `e.code` is the status.' },
        { q: 'Why does `except urllib.error.HTTPError` have to come before `except urllib.error.URLError`?', options: ['Python requires alphabetical order', '`HTTPError` is a subclass of `URLError`, and the first matching `except` wins', 'URLError is slower', 'It doesn\'t matter'], answer: 1, explain: 'Every HTTPError is also a URLError. With URLError first, a 503 would be treated as "no answer".' },
        { q: 'A Lambda function checks 6 sites with a 10-second timeout each, and the logs say "Task timed out after 3.00 seconds". What\'s wrong?', options: ['The sites are down', 'The function still has the default 3-second timeout', 'SNS is too slow', 'The handler name is wrong'], answer: 1, explain: 'The default Lambda timeout is 3 seconds. Raise it (up to 900) to cover the slowest realistic run.' },
        { q: 'Where does `print()` output from a Lambda function go?', options: ['Nowhere', 'Amazon CloudWatch Logs', 'The SNS topic', 'An S3 bucket'], answer: 1, explain: 'Everything a function writes to standard output or error goes to its CloudWatch Logs log group, /aws/lambda/<function name>.' },
        { q: 'Which permissions does this function\'s execution role need?', options: ['AdministratorAccess', '`sns:Publish` on the topic, plus CloudWatch Logs (AWSLambdaBasicExecutionRole)', '`lambda:InvokeFunction`', 'Read access to the websites'], answer: 1, explain: 'Least privilege: publish to one topic and write logs. Invoking the function is the scheduler\'s permission; websites need no AWS permission.' },
        { q: 'Why create `boto3.client("sns")` at the top of the file instead of inside the handler?', options: ['It\'s required by boto3', 'It runs once per warm environment and is reused, so each run is faster', 'Clients inside functions don\'t work', 'It hides the client from the logs'], answer: 1, explain: 'Code outside the handler runs when the environment starts, then stays in memory between invocations.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'p3-urlopen', front: 'Open `url` with Python\'s standard library, giving up after 10 seconds', back: '`urllib.request.urlopen(url, timeout=10)`', tags: ['http'], difficulty: 'easy' },
        { id: 'p3-httperror', front: 'The site answered 404. What does urlopen do, and where\'s the number?', back: 'Raises `urllib.error.HTTPError`; the status is `e.code`.', tags: ['http', 'exceptions'], difficulty: 'medium' },
        { id: 'p3-urlerror', front: 'No answer at all (unknown name, refused, timed out): which exception, and why?', back: '`urllib.error.URLError`; `e.reason` says why.', tags: ['http', 'exceptions'], difficulty: 'medium' },
        { id: 'p3-days', front: 'Days until a certificate expires, from `cert["notAfter"]`', back: '`(ssl.cert_time_to_seconds(cert["notAfter"]) - time.time()) // 86400`', tags: ['certificates'], difficulty: 'hard' },
        { id: 'p3-handler', front: 'The Python handler Lambda calls, by default', back: '`def lambda_handler(event, context):` in `lambda_function.py` (handler setting `lambda_function.lambda_handler`)', tags: ['lambda'], difficulty: 'easy' },
        { id: 'p3-env', front: 'Read the environment variable `TOPIC_ARN` in Python', back: '`os.environ["TOPIC_ARN"]` (or `os.environ.get("TOPIC_ARN")` for None if missing)', tags: ['lambda'], difficulty: 'easy' },
        { id: 'p3-publish', front: 'Send one alert to an SNS topic with boto3', back: '`sns.publish(TopicArn=arn, Subject="…", Message="…")`: Subject under 100 characters, no line breaks', tags: ['sns'], difficulty: 'medium' },
        { id: 'p3-timeout', front: 'Lambda\'s default and maximum timeout', back: 'Default 3 seconds, maximum 15 minutes (900 seconds).', tags: ['lambda', 'exam'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 50,
      body: `Deploy the watchman to your own AWS account with the AWS command line. Use your own sites, or public ones like \`https://www.wikipedia.org\` to try it.

1. **A project folder** with your finished \`lambda_function.py\` from the editor:

\`\`\`sh
mkdir -p ~/aws-study-projects/python/site-checker
cd ~/aws-study-projects/python/site-checker
\`\`\`

2. **The topic and your email.** \`create-topic\` prints the topic's ARN; keep it in a variable:

\`\`\`sh
TOPIC_ARN=$(aws sns create-topic --name site-alerts --query TopicArn --output text)
aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint you@example.com
\`\`\`

Open the email from AWS Notifications and click **Confirm subscription**. Until you do, nothing is delivered.

3. **The function's role.** First who may use it (Lambda), then what it may do:

\`\`\`sh
cat > trust-lambda.json <<'EOF'
{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}
EOF
aws iam create-role --role-name site-checker-role --assume-role-policy-document file://trust-lambda.json
aws iam attach-role-policy --role-name site-checker-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

cat > publish.json <<EOF
{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "sns:Publish", "Resource": "$TOPIC_ARN"}]}
EOF
aws iam put-role-policy --role-name site-checker-role --policy-name publish-site-alerts --policy-document file://publish.json
\`\`\`

(The first heredoc has \`'EOF'\` in quotes so nothing in it changes; the second doesn't, so \`$TOPIC_ARN\` is filled in.)

4. **The settings**, as a file, because the list of sites has commas in it:

\`\`\`sh
cat > env.json <<EOF
{"Variables": {"SITES": "https://www.wikipedia.org,https://www.example.com", "TOPIC_ARN": "$TOPIC_ARN"}}
EOF
\`\`\`

5. **Create the function**, with a 60-second timeout:

\`\`\`sh
zip function.zip lambda_function.py
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws lambda create-function \\
  --function-name site-checker \\
  --runtime python3.13 \\
  --handler lambda_function.lambda_handler \\
  --role arn:aws:iam::$ACCOUNT:role/site-checker-role \\
  --zip-file fileb://function.zip \\
  --timeout 60 \\
  --environment file://env.json
\`\`\`

If it says the role *cannot be assumed by Lambda*, the new role hasn't reached every AWS server yet: wait 10 seconds and run it again. boto3 is already part of the Lambda Python runtime, so the zip only needs your file.

6. **Test it**, then read its logs:

\`\`\`sh
aws lambda invoke --function-name site-checker response.json
cat response.json
aws logs tail /aws/lambda/site-checker --follow
\`\`\`

Press Ctrl+C to stop following the logs. To see an alert, add a site that doesn't exist (like \`https://no-such-site.example.com\`) to \`env.json\`, then \`aws lambda update-function-configuration --function-name site-checker --environment file://env.json\` and invoke again. After a code change: \`zip function.zip lambda_function.py\` and \`aws lambda update-function-code --function-name site-checker --zip-file fileb://function.zip\`.

7. **Every hour.** The scheduler's role may only invoke this one function:

\`\`\`sh
FUNCTION_ARN=$(aws lambda get-function --function-name site-checker --query Configuration.FunctionArn --output text)
cat > trust-scheduler.json <<'EOF'
{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Principal": {"Service": "scheduler.amazonaws.com"}, "Action": "sts:AssumeRole"}]}
EOF
cat > invoke.json <<EOF
{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "lambda:InvokeFunction", "Resource": "$FUNCTION_ARN"}]}
EOF
aws iam create-role --role-name site-checker-scheduler --assume-role-policy-document file://trust-scheduler.json
aws iam put-role-policy --role-name site-checker-scheduler --policy-name invoke-site-checker --policy-document file://invoke.json
SCHEDULER_ROLE_ARN=$(aws iam get-role --role-name site-checker-scheduler --query Role.Arn --output text)

aws scheduler create-schedule \\
  --name site-checker-hourly \\
  --schedule-expression "rate(1 hour)" \\
  --flexible-time-window Mode=OFF \\
  --target "{\\"Arn\\": \\"$FUNCTION_ARN\\", \\"RoleArn\\": \\"$SCHEDULER_ROLE_ARN\\"}"
\`\`\`

Within the hour, \`aws logs tail /aws/lambda/site-checker\` shows a run you didn't start.

8. **Push it to GitHub.** \`lambda_function.py\` has no addresses, ARNs or keys in it: they're all in the environment. Add \`env.json\`, \`response.json\` and \`function.zip\` to \`.gitignore\`.

**Cost:** nothing for this project. Each month the free tier includes 1 million Lambda requests and 400,000 GB-seconds of compute (an hourly 20-second check uses under 2,000), 1,000 SNS emails, and 14 million EventBridge Scheduler invocations.

**Cleanup**, when you're done:

\`\`\`sh
aws scheduler delete-schedule --name site-checker-hourly
aws lambda delete-function --function-name site-checker
aws sns delete-topic --topic-arn "$TOPIC_ARN"
aws logs delete-log-group --log-group-name /aws/lambda/site-checker
aws iam delete-role-policy --role-name site-checker-scheduler --policy-name invoke-site-checker
aws iam delete-role --role-name site-checker-scheduler
aws iam delete-role-policy --role-name site-checker-role --policy-name publish-site-alerts
aws iam detach-role-policy --role-name site-checker-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name site-checker-role
\`\`\``,
      checklist: [
        'I confirmed the email subscription to my site-alerts topic',
        'The function runs with a 60-second timeout and returns a summary',
        'A broken site in the list sent me one email listing it',
        'The logs show a run started by the hourly schedule',
        'lambda_function.py is on GitHub, with no ARNs or addresses in it',
      ],
    },
  ],
};

export default tutorial;
