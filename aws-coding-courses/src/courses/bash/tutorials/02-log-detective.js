// Tutorial 2: dig through a night of web server logs to find what broke.

// ---------------------------------------------------------------------------
// The practice log: 6 hours of traffic (00:00–05:59 UTC) in the standard
// nginx "combined" format, generated the same way every time. Hidden in it:
//  - a bad deploy at 02:13 makes /api/checkout fail with 500s from 02:14 to 02:41
//  - one address (203.0.113.45) guesses passwords on /login all night
// ---------------------------------------------------------------------------
const ATTACKER = '203.0.113.45';
const PATHS = [
  ['/', 30], ['/products', 18], ['/products/1042', 8], ['/products/2210', 6], ['/cart', 7], ['/api/checkout', 6],
  ['/login', 4], ['/static/app.js', 8], ['/static/style.css', 8], ['/images/logo.png', 5], ['/about', 2], ['/wp-login.php', 1],
];
const AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148',
  'curl/8.5.0',
];

let cached = null;

export function practiceLog() {
  if (cached) return cached;
  let seed = 20261029;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pick = (weighted) => {
    const total = weighted.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [v, w] of weighted) if ((r -= w) < 0) return v;
    return weighted[0][0];
  };
  const ips = Array.from({ length: 260 }, (_, i) => (i % 2 ? `198.51.100.${(i * 7) % 250 + 3}` : `192.0.2.${(i * 11) % 250 + 3}`));
  const lines = [];
  const pad = (n) => String(n).padStart(2, '0');
  const stats = { total: 0, s500: 0, size500: 0, checkout: 0, attacker: 0 };

  for (let sec = 0; sec < 6 * 3600; sec++) {
    const hh = Math.floor(sec / 3600);
    const mm = Math.floor((sec % 3600) / 60);
    const ss = sec % 60;
    const minute = hh * 60 + mm;
    const busy = 0.55 + 0.25 * Math.sin(sec / 2400);
    const n = rand() < busy ? (rand() < 0.15 ? 2 : 1) : 0;
    const stamp = `[29/Oct/2026:${pad(hh)}:${pad(mm)}:${pad(ss)} +0000]`;
    const events = [];
    for (let k = 0; k < n; k++) events.push({ ip: ips[Math.floor(rand() * ips.length)], path: pick(PATHS) });
    // Password guessing from one address, 01:50 to 03:10, every few seconds
    if (minute >= 110 && minute < 190 && sec % 3 === 0) events.push({ ip: ATTACKER, path: '/login', method: 'POST', status: 401 });
    // During the incident, customers keep retrying checkout
    if (minute >= 134 && minute <= 161 && rand() < 0.5) events.push({ ip: ips[Math.floor(rand() * ips.length)], path: '/api/checkout' });
    for (const ev of events) {
      const method = ev.method || (ev.path === '/api/checkout' || (ev.path === '/login' && rand() < 0.4) ? 'POST' : 'GET');
      let status = ev.status ?? 200;
      if (ev.status === undefined) {
        if (ev.path === '/wp-login.php') status = 404;
        else if (ev.path.startsWith('/static') && rand() < 0.3) status = 304;
        else if (ev.path === '/api/checkout' && minute >= 134 && minute <= 161) status = rand() < 0.75 ? 500 : rand() < 0.3 ? 502 : 200;
        else if (rand() < 0.0015) status = 500;
        else if (ev.path === '/login' && rand() < 0.1) status = 401;
      }
      let bytes = status === 304 ? 0 : status >= 500 ? 182 + Math.floor(rand() * 40) : ev.path.startsWith('/images') ? 18234 : 512 + Math.floor(rand() * 9000);
      // A few normal pages happen to be exactly 500 bytes: the trap for `grep " 500 "`
      if (status === 200 && ev.path === '/about') bytes = 500;
      const agent = ev.ip === ATTACKER ? 'python-requests/2.32.3' : AGENTS[Math.floor(rand() * AGENTS.length)];
      lines.push(`${ev.ip} - - ${stamp} "${method} ${ev.path} HTTP/1.1" ${status} ${bytes} "-" "${agent}"`);
      stats.total++;
      if (status === 500) stats.s500++;
      if (bytes === 500) stats.size500++;
      if (ev.path === '/api/checkout') stats.checkout++;
      if (ev.ip === ATTACKER) stats.attacker++;
    }
  }
  cached = { text: lines.join('\n') + '\n', stats };
  return cached;
}

const DEPLOY_LOG = `2026-10-27 16:02:11 deployed web v3.8.0 (by maria)
2026-10-28 11:45:30 deployed api v2.4.0 (by sam)
2026-10-29 02:13:52 deployed checkout-service v2.4.1 (by night-pipeline)
2026-10-29 02:42:05 rolled back checkout-service to v2.4.0 (by on-call: dev)
`;

const scenario = () => ({
  hostname: 'web-01',
  now: '2026-10-29T08:30:00Z',
  cwd: '/var/log/nginx',
  files: {
    '/var/log/nginx/access.log': practiceLog().text,
    '/var/log/nginx/error.log': '2026/10/29 02:14:03 [error] 1182#1182: *88121 upstream prematurely closed connection while reading response header from upstream, client: 192.0.2.84, server: shop.example.com, request: "POST /api/checkout HTTP/1.1"\n',
    '/var/log/deploy.log': DEPLOY_LOG,
  },
});

export const SUMMARY_STARTER = `#!/bin/bash
# log-summary.sh: a morning summary of a web server log.
# Usage: bash log-summary.sh /var/log/nginx/access.log

LOG="$1"
REPORT="$HOME/summary-$(date +%F).txt"

# Stop early, with a helpful message, if there's no log file
if [ -z "$LOG" ] || [ ! -f "$LOG" ]; then
  echo "Usage: $0 path/to/access.log" >&2
  exit 1
fi

total=$(wc -l < "$LOG")
errors=$(awk '$9 >= 500' "$LOG" | wc -l)

{
  echo "Log summary for $(date +%F)"
  echo "Requests: $total"
  echo "Server errors (5xx): $errors"
  echo
  echo "Top 5 visitors:"
  # TODO: the 5 addresses with the most requests, busiest first

  echo
  echo "Paths with the most server errors:"
  # TODO: the 5 paths with the most 5xx responses
} > "$REPORT"

echo "Report written to $REPORT"
cat "$REPORT"
`;

export const SUMMARY_SOLUTION = `#!/bin/bash
# log-summary.sh: a morning summary of a web server log.
# Usage: bash log-summary.sh /var/log/nginx/access.log

LOG="$1"
REPORT="$HOME/summary-$(date +%F).txt"

if [ -z "$LOG" ] || [ ! -f "$LOG" ]; then
  echo "Usage: $0 path/to/access.log" >&2
  exit 1
fi

total=$(wc -l < "$LOG")
errors=$(awk '$9 >= 500' "$LOG" | wc -l)

{
  echo "Log summary for $(date +%F)"
  echo "Requests: $total"
  echo "Server errors (5xx): $errors"
  echo
  echo "Top 5 visitors:"
  awk '{print $1}' "$LOG" | sort | uniq -c | sort -rn | head -n 5

  echo
  echo "Paths with the most server errors:"
  awk '$9 >= 500 {print $7}' "$LOG" | sort | uniq -c | sort -rn | head -n 5
} > "$REPORT"

echo "Report written to $REPORT"
cat "$REPORT"`;

const tutorial = {
  slug: 'log-detective',
  number: 2,
  title: 'Log detective',
  situation: 'Something broke overnight. Customers say checkout failed, and nobody knows when or why. The web server wrote thousands of lines of logs. You dig through them to find the errors, the busiest visitors, and the minute it started.',
  level: 'Beginner',
  hours: 2.5,
  free: false,
  skills: ['grep', 'awk', 'sort', 'uniq', 'cut', 'loops', 'functions'],
  aws: [],
  overview: 'You\'ll investigate a real-shaped incident in a web server log: count errors precisely, rank visitors, find the minute it started and match it to a deploy. Then you turn the investigation into `log-summary.sh`, a report that runs every morning.',
  steps: [
    {
      id: 'first-look',
      kind: 'read',
      title: 'First look: how big, what shape?',
      minutes: 10,
      body: `Never open a huge log in an editor: it can freeze. Look at its size and a few lines first. You're in \`/var/log/nginx\`, where the nginx web server keeps its logs.

\`\`\`bash
ls -lh
\`\`\`

\`\`\`bash
wc -l access.log
\`\`\`

\`\`\`bash
head -n 3 access.log
\`\`\`

\`\`\`bash
tail -n 3 access.log
\`\`\`

Every line is one request, in the standard *combined* format. Split on spaces, the columns are:

| Column | Example | Meaning |
|---|---|---|
| \`$1\` | \`192.0.2.84\` | the visitor's address |
| \`$4\` | \`[29/Oct/2026:02:14:07\` | date and time (UTC) |
| \`$6\` | \`"POST\` | method: GET reads, POST sends |
| \`$7\` | \`/api/checkout\` | the page or API path |
| \`$9\` | \`500\` | the status code |
| \`$10\` | \`214\` | response size in bytes |

> On a real server, \`less access.log\` lets you scroll a big file (\`q\` quits, \`/word\` searches) and \`tail -f access.log\` follows new lines as they arrive.`,
      scenario,
    },
    {
      id: 'grep',
      kind: 'try',
      title: 'Search with grep',
      minutes: 15,
      body: `\`grep\` prints only the lines that contain a pattern. It's the first tool everyone reaches for:

\`\`\`bash
grep "/api/checkout" access.log | head -n 5
\`\`\`

| Option | Meaning |
|---|---|
| \`-c\` | **c**ount matching lines instead of printing them |
| \`-i\` | **i**gnore upper/lower case |
| \`-v\` | in**v**ert: lines that do **not** match |
| \`-E\` | **e**xtended patterns, like \`"5[0-9][0-9]"\` |

Combine them with pipes: \`grep "/login" access.log | grep -c "POST"\` counts login attempts.`,
      task: 'How many requests in `access.log` were for **`/api/checkout`**? Print just the number.',
      hint: '`grep -c` counts. Put the path in quotes.',
      solution: 'grep -c "/api/checkout" access.log',
      scenario,
      check: ({ result }) => (result.stdout.trim() === String(practiceLog().stats.checkout) ? true : null),
      success: 'That\'s how many customers tried to pay. Next: how many of them failed?',
    },
    {
      id: 'awk-columns',
      kind: 'try',
      title: 'Columns with awk: count errors precisely',
      minutes: 20,
      body: `It's tempting to count errors with \`grep -c " 500 "\`. Try it, but it's **wrong** here:

\`\`\`bash
grep -c " 500 " access.log
\`\`\`

Why? Some normal pages are exactly 500 **bytes** long, so " 500 " also appears in the size column. \`grep\` only sees text; it doesn't know columns.

\`awk\` does. It splits each line into columns and lets you test them. A pattern with no \`{ }\` prints the lines that match:

\`\`\`bash
awk '$9 == 500' access.log | head -n 3
\`\`\`

\`\`\`bash
awk '{print $1, $9}' access.log | head -n 3
\`\`\`

\`\`\`bash
awk '$9 >= 500 {print $7}' access.log | head -n 5
\`\`\`

| awk piece | Meaning |
|---|---|
| \`$9 == 500\` | column 9 equals 500 |
| \`{print $1, $9}\` | print columns 1 and 9, with a space between |
| \`NR\` | the line number |
| \`NF\` | how many columns this line has |`,
      task: 'Count the requests whose **status code** (column 9) is exactly `500`. Print just the number.',
      hint: 'Filter with `awk \'$9 == 500\' access.log`, then pipe into `wc -l` to count lines.',
      solution: "awk '$9 == 500' access.log | wc -l",
      scenario,
      check: ({ result }) => {
        const { s500, size500 } = practiceLog().stats;
        const out = result.stdout.trim();
        if (out === String(s500)) return true;
        if (out === String(s500 + size500)) return 'That\'s the grep count, which includes pages that are 500 bytes. Test column 9 with awk instead.';
        return null;
      },
      success: 'Precise. The grep count also included normal pages that happen to be 500 bytes long. In an incident report, wrong numbers cost trust.',
    },
    {
      id: 'rank',
      kind: 'try',
      title: 'Count and rank: sort | uniq -c | sort -rn',
      minutes: 15,
      body: `This four-step pipeline answers "what's most common?" for anything in a log. Learn it once, use it forever:

\`\`\`bash
awk '{print $9}' access.log | sort | uniq -c | sort -rn
\`\`\`

1. \`awk '{print $9}'\`: pull out one column (here, status codes)
2. \`sort\`: put identical lines next to each other
3. \`uniq -c\`: collapse each group to one line, with a **c**ount in front
4. \`sort -rn\`: sort by that count, **n**umerically, in **r**everse (biggest first)

Add \`| head -n 5\` to keep the top five.

> \`uniq\` only merges lines that are **next to each other**, which is why \`sort\` comes first. Forgetting it is the classic mistake.`,
      task: 'Which visitor address sent the **most requests** all night? Show the top 5 addresses with their counts, busiest first.',
      hint: 'Same pipeline, but column `$1` (the address), and finish with `head -n 5`.',
      solution: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -n 5",
      scenario,
      check: ({ result }) => {
        const first = result.stdout.trim().split('\n')[0] || '';
        if (first.includes(ATTACKER) && /^\s*\d+\s/.test(first)) return true;
        return null;
      },
      success: `\`${ATTACKER}\` sent far more requests than anyone. Look at what it was doing: \`grep "${ATTACKER}" access.log | head -n 3\`. A POST to \`/login\` every few seconds, always \`401\` (wrong password), from a script (\`python-requests\`). That's someone guessing passwords. On AWS you'd block it with a WAF rule or a network ACL.`,
    },
    {
      id: 'timeline',
      kind: 'try',
      title: 'When did it start?',
      minutes: 15,
      body: `To find *when* errors started, count them per minute. The time is inside column 4, like \`[29/Oct/2026:02:14:07\`. Two ways to pull out \`02:14\`:

\`\`\`bash
head -n 1 access.log | cut -d: -f2,3
\`\`\`

\`cut -d: -f2,3\` splits the line on **:** and keeps fields 2 and 3. (The address has no colons, so field 2 is the hour.) Or with awk, take 5 characters starting at position 14 of column 4:

\`\`\`bash
head -n 1 access.log | awk '{print substr($4, 14, 5)}'
\`\`\`

Now combine: keep only server errors, pull out the minute, and count each minute. Leave out the final \`sort -rn\` so the minutes stay in **time order**.`,
      task: 'Print the number of server errors (status 500 or above) **per minute**, in time order. Find the first minute where they jump.',
      hint: '`awk \'$9 >= 500 {print substr($4, 14, 5)}\' access.log | sort | uniq -c`',
      solution: "awk '$9 >= 500 {print substr($4, 14, 5)}' access.log | sort | uniq -c",
      scenario,
      check: ({ result }) => (/uniq\s+-c/.test(result.command) && /\b02:14\b/.test(result.stdout) && /\b02:41\b/.test(result.stdout) ? true : null),
      success: 'Errors jump at **02:14** and stop after **02:41**. Now check what changed just before: `cat /var/log/deploy.log`. A deploy at 02:13:52, and a rollback at 02:42. That\'s your root cause, with evidence. This is exactly what an incident review needs.',
    },
    {
      id: 'summary-script',
      kind: 'try',
      title: 'Turn it into a morning report',
      minutes: 25,
      body: `You'll be asked these questions again tomorrow. Turn them into \`log-summary.sh\`, which takes the log file as an **argument**:

- \`$1\` is the first argument (\`$2\` the second, \`$#\` how many). \`$0\` is the script's own name.
- The \`if\` near the top stops early with a helpful message when the file is missing. Messages for humans go to the error stream with \`>&2\`, and \`exit 1\` signals failure.
- \`wc -l < "$LOG"\` feeds the file into \`wc\` with \`<\`, so it prints only the number (no file name).
- Everything inside \`{ ... } > "$REPORT"\` goes into one file.

Fill in the two TODOs with your ranking pipelines, then run it.`,
      task: 'Finish `log-summary.sh` and run it on the real log: `bash log-summary.sh access.log`. It should write `~/summary-2026-10-29.txt` with the totals, the top 5 visitors and the top error paths.',
      hint: 'Use `"$LOG"` instead of `access.log` inside the script, so it works on any file you pass in.',
      solution: SUMMARY_SOLUTION,
      files: [{ path: 'log-summary.sh', starter: SUMMARY_STARTER, runCommand: 'bash log-summary.sh access.log', runLabel: 'Run bash log-summary.sh access.log' }],
      scenario,
      check: ({ fs, history }) => {
        if (!history.some((h) => /log-summary\.sh/.test(h.command))) return null;
        const path = '/home/learner/summary-2026-10-29.txt';
        if (!fs.isFile(path)) return 'No report yet at `~/summary-2026-10-29.txt`. Did you pass the log file, like `bash log-summary.sh access.log`?';
        const report = fs.read(path);
        if (!report.includes(ATTACKER)) return 'The report is there. Now fill in the top 5 visitors (the first TODO).';
        if (!/\d+\s+\/api\/checkout/.test(report)) return 'Visitors are in. Now the paths with the most server errors (the second TODO).';
        return true;
      },
      success: 'Try the safety check too: `bash log-summary.sh nope.log; echo $?`. A clear message and exit code 1, instead of a confusing error halfway through.',
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 5,
      questions: [
        { q: 'Why can `grep -c " 500 " access.log` give the wrong number of 500 errors?', options: ['grep can\'t count', '" 500 " can also match other columns, like a 500-byte response size', 'grep ignores numbers', 'It counts only the first match'], answer: 1, explain: 'grep matches text anywhere on the line. Use awk to test a specific column: `awk \'$9 == 500\'`.' },
        { q: 'In `sort | uniq -c | sort -rn`, why does the first `sort` matter?', options: ['uniq only merges identical lines that are next to each other', 'It makes the output colorful', 'uniq needs numbers', 'It removes empty lines'], answer: 0, explain: 'Without sorting first, the same address spread across the file is counted in many small groups.' },
        { q: 'What does `awk \'$9 >= 500 {print $7}\'` print?', options: ['Lines 500 and up', 'Column 7 (the path) of every request with status 500 or higher', 'The 9th line', 'Every column except 7'], answer: 1, explain: 'The pattern tests column 9; the action prints column 7.' },
        { q: 'Inside a script run as `bash log-summary.sh access.log`, what is `$1`?', options: ['`bash`', '`log-summary.sh`', '`access.log`', 'The first line of the log'], answer: 2, explain: '`$0` is the script name; `$1` is the first argument after it.' },
        { q: 'Which line sends an error message to the error stream instead of normal output?', options: ['`echo "No log" > error`', '`echo "No log" >&2`', '`echo "No log" | 2`', '`error "No log"`'], answer: 1, explain: '`>&2` redirects to stream 2, standard error. Pipes and files of normal output then stay clean.' },
        { q: 'You found errors start at 02:14. What makes this an explanation, not just a fact?', options: ['Counting them twice', 'Matching it to a change at the same time, like the 02:13 deploy', 'Deleting the log', 'Restarting the server'], answer: 1, explain: 'Incident reviews connect "what happened" to "what changed". Deploy and change logs are the first place to look.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'b2-grep-c', front: 'Count the lines that contain "timeout"', back: '`grep -c "timeout" file.log`', tags: ['grep'], difficulty: 'easy' },
        { id: 'b2-grep-v', front: 'Show lines that do NOT contain "health"', back: '`grep -v "health" file.log`', hint: 'invert', tags: ['grep'], difficulty: 'easy' },
        { id: 'b2-awk-col', front: 'Print only column 7 of every line', back: '`awk \'{print $7}\' file`', tags: ['awk'], difficulty: 'easy' },
        { id: 'b2-awk-filter', front: 'Print lines where column 9 is 500 or more', back: '`awk \'$9 >= 500\' file`', tags: ['awk'], difficulty: 'medium' },
        { id: 'b2-rank', front: 'The "most common values" pipeline', back: '`sort | uniq -c | sort -rn | head`', tags: ['sort', 'uniq'], difficulty: 'medium' },
        { id: 'b2-cut', front: 'Split lines on ":" and keep fields 2 and 3', back: '`cut -d: -f2,3`', tags: ['cut'], difficulty: 'medium' },
        { id: 'b2-args', front: 'In a script, what are `$0`, `$1` and `$#`?', back: 'The script\'s name, the first argument, and how many arguments there are.', tags: ['scripts'], difficulty: 'easy' },
        { id: 'b2-stderr', front: 'Send a message to standard error', back: '`echo "message" >&2`', tags: ['redirects'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 20,
      body: `Take the investigation off the practice server.

1. Download the same log to your computer with the button below, and save your script next to it in \`~/aws-study-projects/bash/log-summary/\`.
2. Run it there:

\`\`\`sh
chmod +x log-summary.sh
./log-summary.sh access.log
\`\`\`

> **On a Mac,** \`wc -l\` puts spaces before the number. It still works in the script; \`echo "Requests: $total"\` just shows a few extra spaces.

3. **If you have a server** with nginx or Apache, point it at the real log (\`/var/log/nginx/access.log\`, usually readable with \`sudo\`). On AWS, the same format comes from an Application Load Balancer or CloudFront access logs.
4. Schedule it for 8:00 every morning with cron, like in Tutorial 1.
5. Push the script and a sample report to GitHub. In your README, write two sentences about the incident you found: *what* broke, *when*, and *why*. That's an incident summary, and interviewers love them.

**Stretch goal:** add an "error rate" line: errors divided by requests, as a percentage, with \`awk "BEGIN {printf \\"%.2f\\", $errors * 100 / $total}"\`.`,
      downloads: [{ label: 'Download access.log (practice log)', filename: 'access.log', content: () => practiceLog().text }],
      checklist: [
        'My script runs on my computer against the downloaded log',
        'The report shows the attacker\'s address and `/api/checkout`',
        'It\'s scheduled with cron',
        'It\'s on GitHub, with a two-sentence incident summary in the README',
      ],
    },
  ],
};

export default tutorial;
