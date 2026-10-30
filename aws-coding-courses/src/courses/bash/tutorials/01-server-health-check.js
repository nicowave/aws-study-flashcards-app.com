// Tutorial 1 (free): a morning health check for a web server.

const SITES = {
  'https://www.example.com': { status: 200, body: '<html><title>Example Store</title></html>', ms: 180 },
  'https://shop.example.com': { status: 200, body: '<html><title>Shop</title></html>', ms: 240 },
  'https://api.example.com': { status: 503, body: 'Service Unavailable', ms: 90 },
};

const server = (extra = {}) => ({
  hostname: 'web-01',
  now: '2026-10-29T07:00:00Z',
  disk: [
    { fs: '/dev/xvda1', size: 20, used: 17, mount: '/' },
    { fs: '/dev/xvdf', size: 100, used: 41, mount: '/data' },
  ],
  memory: { total: 3900, used: 2950 },
  web: SITES,
  ...extra,
});

export const HEALTH_CHECK_STARTER = `#!/bin/bash
# health-check.sh: is this server healthy? Run it every morning.
# Usage: bash health-check.sh

LOG_FILE="health.log"
DISK_LIMIT=80
SITES="https://www.example.com https://shop.example.com https://api.example.com"
problems=0

# Print a line with the time in front, to the screen AND the log file
log() {
  echo "$(date '+%F %T') $1" | tee -a "$LOG_FILE"
}

# 1. Disk
usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$usage" -ge "$DISK_LIMIT" ]; then
  log "WARNING disk is \${usage}% full"
  problems=$((problems + 1))
else
  log "OK disk is \${usage}% full"
fi

# 2. Websites
# TODO: loop over $SITES. For each site, get its status code with curl.
#       200 -> log "OK <site> <code>"
#       anything else -> log "WARNING <site> <code>" and add 1 to problems

# 3. Finish
# TODO: exit 1 if problems is more than 0, otherwise exit 0
`;

export const HEALTH_CHECK_SOLUTION = `#!/bin/bash
# health-check.sh: is this server healthy? Run it every morning.

LOG_FILE="health.log"
DISK_LIMIT=80
SITES="https://www.example.com https://shop.example.com https://api.example.com"
problems=0

log() {
  echo "$(date '+%F %T') $1" | tee -a "$LOG_FILE"
}

usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$usage" -ge "$DISK_LIMIT" ]; then
  log "WARNING disk is \${usage}% full"
  problems=$((problems + 1))
else
  log "OK disk is \${usage}% full"
fi

for site in $SITES; do
  code=$(curl -s -o /dev/null --max-time 10 -w "%{http_code}" "$site")
  if [ "$code" = "200" ]; then
    log "OK $site $code"
  else
    log "WARNING $site $code"
    problems=$((problems + 1))
  fi
done

if [ "$problems" -gt 0 ]; then
  log "$problems problem(s) found"
  exit 1
fi
log "all good"
exit 0`;

const tutorial = {
  slug: 'server-health-check',
  number: 1,
  title: 'Server health check',
  situation: 'Your manager asks: "Can you check every morning that the website is up and the disk isn\'t full?" Doing it by hand takes ten minutes and gets skipped on busy days. You write a script that does it, logs the result, and runs itself.',
  level: 'Beginner',
  hours: 2,
  free: true,
  skills: ['commands', 'pipes', 'variables', 'if-checks', 'loops', 'exit codes', 'cron'],
  aws: [],
  overview: 'You\'ll learn how commands, options and pipes work, then build `health-check.sh`: it checks disk space and three websites, writes a timestamped log, and exits with a failure code when something is wrong. Then you schedule it to run every morning.',
  steps: [
    {
      id: 'commands',
      kind: 'read',
      title: 'Commands, options and arguments',
      minutes: 10,
      body: `Every command line has the same shape:

\`\`\`text
ls   -l   /var/log
│    │    └─ argument: what to work on
│    └─ option: how to do it (starts with a dash)
└─ command: what to do
\`\`\`

Options can be combined: \`ls -l -a\` is the same as \`ls -la\`. Many also have a long name: \`df -h\` is \`df --human-readable\`.

The terminal below is a pretend web server called **web-01**. Press **Run** on each box and compare the output:

\`\`\`bash
ls /var
\`\`\`

\`\`\`bash
ls -l /var
\`\`\`

\`\`\`bash
whoami
\`\`\`

\`\`\`bash
date
\`\`\`

\`\`\`bash
uptime
\`\`\`

> **Stuck on what an option does?** On a real computer, \`man ls\` opens the manual (press \`q\` to leave) and most commands accept \`--help\`. Searching "ls command options" works too: every engineer does it.`,
      scenario: server({ files: { '/var/log/syslog': 'Oct 29 06:59:01 web-01 CRON[812]: (root) CMD (run-parts /etc/cron.hourly)\n', '/var/www/index.html': '<h1>Example Store</h1>\n' } }),
    },
    {
      id: 'disk-space',
      kind: 'try',
      title: 'How full is the disk?',
      minutes: 10,
      body: `A full disk is one of the most common reasons a server falls over: logs can't be written, uploads fail, databases stop. The command to check is \`df\` (**d**isk **f**ree). Add \`-h\` for **h**uman-readable sizes (\`17G\` instead of \`17825792\`):

\`\`\`bash
df -h
\`\`\`

Each line is a disk, and the **Mounted on** column says which folder it holds. \`/\` is the main disk, where the operating system lives. Give \`df\` a folder and it shows just the disk that holds that folder.`,
      task: 'Show the disk usage for **only** the main disk, `/`, in human-readable sizes. You should see two lines: the header, and one disk.',
      hint: 'Add the folder as an argument: `df -h` followed by `/`.',
      solution: 'df -h /',
      scenario: server(),
      check: ({ result }) => {
        if (!/^df\b/.test(result.command.trim())) return null;
        const lines = result.stdout.trim().split('\n');
        if (lines.length === 2 && lines[1].endsWith(' /') && /G/.test(lines[1])) return true;
        if (lines.length > 2) return 'That shows every disk. Add the folder you care about, `/`, at the end.';
        return /G/.test(result.stdout) ? null : 'Add `-h` so the sizes read like 20G instead of long numbers.';
      },
      success: 'The **Use%** column says **85%**. That\'s high: most teams alert at 80%.',
    },
    {
      id: 'pipes',
      kind: 'try',
      title: 'Pipes: keep only what you need',
      minutes: 15,
      body: `A script can't "look at" a table. It needs just the number: \`85\`. You get there by chaining small tools with the **pipe**, \`|\`. It sends one command's output into the next one's input.

\`\`\`bash
df -h / | awk 'NR==2'
\`\`\`

\`awk\` reads text line by line and splits each line into columns: \`$1\`, \`$2\`, \`$3\`... \`NR\` is the line number, so \`NR==2\` keeps only line 2 (the one under the header). Now print only column 5:

\`\`\`bash
df -h / | awk 'NR==2 {print $5}'
\`\`\`

Last, \`tr -d '%'\` **tr**anslates text, and \`-d\` **d**eletes the characters you name:

\`\`\`bash
echo "85%" | tr -d '%'
\`\`\`

> The single quotes around \`'NR==2 {print $5}'\` matter. They tell Bash "pass this to awk exactly as written", so Bash doesn't try to treat \`$5\` as one of its own variables.`,
      task: 'Build one pipeline that prints **just the number** of the main disk\'s usage, with no `%` sign and nothing else.',
      hint: 'Chain all three: `df -h /`, then `awk` to pick line 2 column 5, then `tr` to delete the `%`.',
      solution: "df -h / | awk 'NR==2 {print $5}' | tr -d '%'",
      scenario: server(),
      check: ({ result }) => {
        const out = result.stdout.trim();
        if (out === '85') return true;
        if (out === '85%') return 'Almost: one more pipe to remove the `%`.';
        return null;
      },
      success: 'Three small tools, each doing one job, joined with pipes. That\'s the whole Unix idea, and it\'s how most real scripts work.',
    },
    {
      id: 'variables',
      kind: 'try',
      title: 'Variables: save an answer for later',
      minutes: 10,
      body: `A **variable** is a name for a value. Set it with \`=\` and **no spaces**, then read it back with \`$\`:

\`\`\`bash
server="web-01"
echo "Checking $server"
\`\`\`

To save a command's **output**, wrap the command in \`$( )\`. This is called *command substitution*: Bash runs the inside first and drops the result in place.

\`\`\`bash
today=$(date +%F)
echo "Report for $today"
\`\`\`

Use \`\${name}\` when the variable touches other text: \`"\${usage}%"\` prints \`85%\`, but \`"$usage%"\` would work too. \`"$usagepercent"\` would not: Bash would look for a variable called *usagepercent*.

> **Common mistake:** \`usage = 85\` (with spaces) fails. Bash reads it as "run a command called usage".`,
      task: 'Save the disk usage number in a variable called **`usage`**, then print exactly: `Disk: 85% used`',
      hint: 'Wrap your pipeline from the last step in `usage=$( ... )`, then `echo "Disk: ${usage}% used"`.',
      solution: "usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')\necho \"Disk: ${usage}% used\"",
      scenario: server(),
      check: ({ shell, result }) => {
        if (shell.vars.usage !== '85') return /usage/.test(result.command) ? 'The variable `usage` should hold just `85`. Check it with: `echo $usage`' : null;
        return result.stdout.trim() === 'Disk: 85% used' ? true : null;
      },
    },
    {
      id: 'decisions',
      kind: 'try',
      title: 'Decisions: if, exit codes and tests',
      minutes: 15,
      body: `Every command finishes with an **exit code**: \`0\` means success, anything else means a problem. \`$?\` holds the last one:

\`\`\`bash
ls /var/log; echo "exit code: $?"
\`\`\`

\`\`\`bash
ls /no/such/folder; echo "exit code: $?"
\`\`\`

\`if\` runs a command and checks its exit code. The command is usually \`[ ]\`, which **tests** something and exits 0 when it's true:

\`\`\`bash
usage=85
if [ "$usage" -ge 80 ]; then
  echo "WARNING: disk is \${usage}% full"
else
  echo "OK"
fi
\`\`\`

| Test | True when |
|---|---|
| \`[ "$a" -ge 80 ]\` | number **g**reater than or **e**qual (also \`-gt\`, \`-lt\`, \`-le\`, \`-eq\`, \`-ne\`) |
| \`[ "$a" = "200" ]\` | text is equal (\`!=\` for not equal) |
| \`[ -f report.txt ]\` | the file exists |
| \`[ -z "$a" ]\` | the variable is empty |

The spaces inside \`[ \` and \` ]\` are required. Always put \`"quotes"\` around variables in tests, so an empty value doesn't break the line.`,
      task: 'Using the real disk number (not a typed-in 85), print `WARNING` if the main disk is **80% or more** full, and `OK` otherwise. Use an `if`.',
      hint: 'First `usage=$(...)` from the last step, then `if [ "$usage" -ge 80 ]; then echo WARNING; else echo OK; fi`. You can type it all on one line with `;` between parts.',
      solution: "usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')\nif [ \"$usage\" -ge 80 ]; then echo WARNING; else echo OK; fi",
      scenario: server(),
      check: ({ result, history }) => {
        const usedRealDisk = history.some((h) => /df\b/.test(h.command));
        if (!/\bif\b/.test(result.command)) return null;
        if (!usedRealDisk) return 'That works, but use the real number from `df` instead of typing 85.';
        return result.stdout.includes('WARNING') ? true : null;
      },
      success: 'Your script can now decide. Next: check the websites.',
    },
    {
      id: 'websites',
      kind: 'try',
      title: 'Is the website up? curl and loops',
      minutes: 15,
      body: `\`curl\` fetches a web address from the terminal. A browser shows you the page; a script needs the **status code**: \`200\` means OK, \`404\` not found, \`500\`–\`599\` the server is broken.

\`\`\`bash
curl -s -o /dev/null -w "%{http_code}\\n" https://www.example.com
\`\`\`

| Piece | Meaning |
|---|---|
| \`-s\` | **s**ilent: no progress bar |
| \`-o /dev/null\` | send the page to \`/dev/null\`, a black hole, since we don't need it |
| \`-w "%{http_code}\\n"\` | **w**rite out only the status code |
| \`--max-time 10\` | give up after 10 seconds instead of hanging forever |

To check several sites, use a **for loop**. It runs the middle part once for each word, with \`$site\` set to that word:

\`\`\`bash
for site in https://www.example.com https://shop.example.com; do
  echo "checking $site"
done
\`\`\``,
      task: 'Write a `for` loop that prints the site and its status code for all three: `https://www.example.com`, `https://shop.example.com` and `https://api.example.com`. One of them is not OK. Which?',
      hint: 'Inside the loop: `echo "$site $(curl -s -o /dev/null -w "%{http_code}" "$site")"`',
      solution: 'for site in https://www.example.com https://shop.example.com https://api.example.com; do\n  echo "$site $(curl -s -o /dev/null -w "%{http_code}" "$site")"\ndone',
      scenario: server(),
      check: ({ result }) => {
        const out = result.stdout;
        if (!/\bfor\b/.test(result.command)) return null;
        if (out.includes('503') && out.includes('200') && (out.match(/example\.com/g) || []).length >= 3) return true;
        return /curl/.test(result.command) ? 'Make sure each line shows the site name and the code, for all three sites.' : null;
      },
      success: '`api.example.com` answers **503 Service Unavailable**. Your health check should flag that.',
    },
    {
      id: 'the-script',
      kind: 'try',
      title: 'Put it together: health-check.sh',
      minutes: 25,
      body: `Typing commands is fine once. A **script** is a file of commands you can run again and again. Open the editor below: most of \`health-check.sh\` is written for you. Read it top to bottom first:

- \`#!/bin/bash\` (the *shebang*) says which program runs the file.
- Settings live at the top in CAPITAL letters, so the next person can change them without reading everything.
- \`log()\` is a **function**: a named group of commands. \`$1\` is the first thing you pass to it. \`tee -a\` prints to the screen **and** **a**ppends to the log file.
- \`$((problems + 1))\` does arithmetic.

Two parts are marked **TODO**. Fill them in, then press **Run**.

> The last line matters: \`exit 1\` when something is wrong. Monitoring tools, cron and deploy pipelines all read exit codes. A script that always exits 0 can never raise an alarm.`,
      task: 'Finish both TODOs. When you run `bash health-check.sh`, it should log the disk and all three sites to `health.log`, and **exit with code 1** because there are problems. Check with `echo $?` afterwards.',
      hint: 'Reuse the loop from the last step, but save the code first: `code=$(curl ...)`, then an `if [ "$code" = "200" ]`. For the finish: `if [ "$problems" -gt 0 ]; then exit 1; fi` and `exit 0` after it.',
      solution: HEALTH_CHECK_SOLUTION,
      files: [{ path: 'health-check.sh', starter: HEALTH_CHECK_STARTER }],
      scenario: server(),
      check: ({ fs, history }) => {
        const ran = history.filter((h) => /health-check\.sh/.test(h.command));
        if (!ran.length) return null;
        const log = fs.isFile('health.log') ? fs.read('health.log') : '';
        const last = ran[ran.length - 1];
        const sites = ['www.example.com', 'shop.example.com', 'api.example.com'].every((s) => log.includes(s));
        if (!/disk/.test(log)) return 'The log should have a disk line. Is `health.log` being written?';
        if (!sites) return 'The disk line is in `health.log`. Now log all three websites (the first TODO).';
        if (last.status === 0) return 'All three sites are logged. Now make the script exit with 1 when there are problems (the second TODO).';
        return /WARNING .*api\.example\.com.*503/.test(log) ? true : 'Make sure the 503 site is logged with WARNING.';
      },
      success: 'That\'s a real, useful script. Look at the log with `cat health.log`: every run adds timestamped lines, so you can see when a problem started.',
    },
    {
      id: 'schedule',
      kind: 'try',
      title: 'Run it every morning with cron',
      minutes: 15,
      body: `**cron** is the Linux scheduler. You give it lines of "when" + "what", called a *crontab*. The "when" is five fields:

\`\`\`text
┌──── minute (0-59)
│ ┌──── hour (0-23)
│ │ ┌──── day of the month (1-31)
│ │ │ ┌──── month (1-12)
│ │ │ │ ┌──── day of the week (0-6, Sunday is 0)
│ │ │ │ │
0 7 * * *   /home/learner/health-check.sh
\`\`\`

\`*\` means "every". So \`0 7 * * *\` is *minute 0 of hour 7, every day*: 7:00 a.m. Some more:

| Schedule | Means |
|---|---|
| \`*/15 * * * *\` | every 15 minutes |
| \`0 2 * * *\` | 2:00 a.m. every day |
| \`30 8 * * 1-5\` | 8:30 a.m. Monday to Friday |

Cron runs with almost no settings, so use **full paths**, and send the output somewhere you can read later with \`>> file 2>&1\` (\`2>&1\` adds the error messages too).

On a real server you'd type \`crontab -e\`. Here, write the line to a file and load it:

\`\`\`bash
echo "0 7 * * * /home/learner/health-check.sh >> /home/learner/cron.log 2>&1" > jobs.txt
\`\`\``,
      task: 'Install a crontab that runs `/home/learner/health-check.sh` at **7:00 every morning**. Then list it with `crontab -l` to confirm.',
      hint: 'After creating `jobs.txt` with the Run button above, load it with `crontab jobs.txt`.',
      solution: 'echo "0 7 * * * /home/learner/health-check.sh >> /home/learner/cron.log 2>&1" > jobs.txt\ncrontab jobs.txt\ncrontab -l',
      scenario: server({ files: { 'health-check.sh': { content: HEALTH_CHECK_SOLUTION, mode: 0o755 } } }),
      check: ({ shell }) => {
        if (!shell.crontab) return null;
        if (/^\s*0\s+7\s+\*\s+\*\s+\*\s+\S*health-check\.sh/m.test(shell.crontab)) return true;
        if (/health-check\.sh/.test(shell.crontab)) return 'The script is scheduled, but not at 7:00 every day. The first two fields should be `0 7`.';
        return null;
      },
      success: 'Scheduled. Every morning at 7, the server checks itself and keeps a record.',
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 5,
      questions: [
        { q: 'In `df -h /`, what is `-h`?', options: ['An argument: the folder to check', 'An option: show sizes in human-readable units', 'A command', 'A pipe'], answer: 1, explain: 'Options start with a dash and change *how* a command works. `/` is the argument.' },
        { q: 'What does `df -h / | awk \'NR==2 {print $5}\'` do?', options: ['Runs df, then awk, separately', 'Sends df\'s output into awk, which prints column 5 of line 2', 'Saves df\'s output to a file called awk', 'Prints line 5 of column 2'], answer: 1, explain: 'The pipe feeds one command\'s output to the next. `NR==2` picks line 2; `$5` is column 5.' },
        { q: 'A command finished with exit code `0`. What does that mean?', options: ['It failed', 'It succeeded', 'It printed nothing', 'It is still running'], answer: 1, explain: '0 means success. Anything from 1 to 255 means some kind of failure.' },
        { q: 'Which line saves the **output** of `date +%F` in a variable?', options: ['`today = date +%F`', '`today=date +%F`', '`today=$(date +%F)`', '`$today=(date +%F)`'], answer: 2, explain: '`$( )` runs the command and puts its output in place. No spaces around `=`.' },
        { q: 'Which crontab schedule runs at 7:00 a.m. every day?', options: ['`7 0 * * *`', '`* 7 * * *`', '`0 7 * * *`', '`0 7 * * 1`'], answer: 2, explain: 'Minute first, then hour. `* 7 * * *` would run every minute from 7:00 to 7:59. `0 7 * * 1` is Mondays only.' },
        { q: 'Why should a health check `exit 1` when it finds a problem?', options: ['It makes the script faster', 'So other tools (cron, monitoring, pipelines) can tell it failed', 'Bash requires it', 'It deletes the log'], answer: 1, explain: 'Exit codes are how programs report success or failure to each other. Exiting 0 on a problem hides it.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'b1-df', front: 'Check how full the main disk is, with readable sizes', back: '`df -h /`', hint: 'disk free', tags: ['disk'], difficulty: 'easy' },
        { id: 'b1-pipe', front: 'What does `|` do?', back: 'Sends the output of the command on the left into the command on the right.', tags: ['pipes'], difficulty: 'easy' },
        { id: 'b1-exit', front: 'How do you see the exit code of the last command?', back: '`echo $?` — 0 is success, anything else is a failure.', tags: ['exit codes'], difficulty: 'easy' },
        { id: 'b1-subst', front: 'Save a command\'s output in a variable', back: '`name=$(command)` — no spaces around `=`.', hint: 'command substitution', tags: ['variables'], difficulty: 'easy' },
        { id: 'b1-test', front: 'Test "number in `$n` is 80 or more"', back: '`[ "$n" -ge 80 ]` — spaces inside the brackets, quotes around the variable.', tags: ['if'], difficulty: 'medium' },
        { id: 'b1-curl', front: 'Print only a website\'s status code with curl', back: '`curl -s -o /dev/null -w "%{http_code}" URL`', tags: ['curl'], difficulty: 'medium' },
        { id: 'b1-shebang', front: 'What is `#!/bin/bash` at the top of a script?', back: 'The *shebang*: it says which program runs the file.', tags: ['scripts'], difficulty: 'easy' },
        { id: 'b1-cron', front: 'The five cron fields, in order', back: 'minute, hour, day of month, month, day of week. `0 7 * * *` = 7:00 every day.', tags: ['cron'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 25,
      body: `Now run it on your own computer, against websites you care about, and put it in your portfolio.

1. In your \`aws-study-projects\` folder (from *Start here*), make a folder for it:

\`\`\`sh
mkdir -p ~/aws-study-projects/bash/health-check
cd ~/aws-study-projects/bash/health-check
\`\`\`

2. Create \`health-check.sh\` with your finished script (\`nano health-check.sh\`, paste, then Ctrl+O, Enter, Ctrl+X). Change \`SITES\` to two or three real addresses, for example \`https://aws-study-flashcards-app.com\`.

3. Make it runnable, run it, and check the exit code:

\`\`\`sh
chmod +x health-check.sh
./health-check.sh
echo "exit code: $?"
\`\`\`

> **On a Mac,** \`df -h /\` has a column called *Capacity* instead of *Use%*, but it's still column 5, so your script works unchanged.

4. Schedule it with \`crontab -e\` and a line like the one you practiced, with **your** full path (\`pwd\` prints it). Cron only runs while your computer is awake. On a real server, it runs around the clock.

5. Add a short \`README.md\` saying what it checks and what the output looks like, then push it:

\`\`\`sh
cd ~/aws-study-projects
git add bash/health-check
git commit -m "Add server health check script"
git push
\`\`\`

**Stretch goal:** also check memory with \`free -m\`, or make a site count as a problem when it takes more than 2 seconds (\`-w "%{time_total}"\`).`,
      checklist: [
        'My script checks the disk and at least two real websites',
        '`echo $?` shows 1 when I add a broken address like `https://example.invalid`',
        'It\'s scheduled with cron',
        'It\'s pushed to GitHub with a README',
      ],
    },
  ],
};

export default tutorial;
