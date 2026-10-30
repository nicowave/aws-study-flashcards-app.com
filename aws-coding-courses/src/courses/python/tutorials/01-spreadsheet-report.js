// Tutorial 1 (free): automate the help desk's Monday spreadsheet report.

// ---------------------------------------------------------------------------
// The practice export: one week of help desk tickets, messy the way real
// exports are. Generated the same way every time (seeded), so the checks can
// work out the right answers from the same data.
//   - team and priority typed by hand: "network", " NETWORK ", "High", "p1"
//   - two date formats: "2026-10-26 09:15" and "10/26/2026 9:15 AM"
//   - 3 tickets exported twice
//   - open tickets have no closed date
// ---------------------------------------------------------------------------

const TEAMS = {
  Network: ['Network', 'network', ' Network', 'NETWORK', 'network '],
  'Desktop Support': ['Desktop Support', 'desktop support', 'Desktop support ', 'DESKTOP SUPPORT'],
  Accounts: ['Accounts', 'accounts', 'Accounts '],
  Security: ['Security', 'security', ' SECURITY'],
};
const PRIORITIES = {
  P1: ['P1', 'p1', '1', 'High', 'high '],
  P2: ['P2', 'p2', '2', 'Medium'],
  P3: ['P3', 'p3 ', '3', 'Low', 'low'],
};
const PEOPLE = ['ana.ruiz', 'ben.okafor', 'chen.li', 'dev.patel', 'emma.berg', 'farid.haddad', 'grace.kim', 'hugo.silva', 'ines.costa', 'jon.meyer'];

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
const us = (d) => {
  const h = d.getUTCHours();
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()} ${h % 12 || 12}:${pad(d.getUTCMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
};

export const ticketData = () => {
  const rand = rng(2026);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const tickets = [];
  const teamNames = Object.keys(TEAMS);
  const weights = ['Network', 'Network', 'Network', 'Desktop Support', 'Desktop Support', 'Desktop Support', 'Desktop Support', 'Accounts', 'Accounts', 'Security'];
  for (let n = 0; n < 48; n++) {
    const team = n < teamNames.length ? teamNames[n] : pick(weights);
    const priority = rand() < 0.15 ? 'P1' : rand() < 0.5 ? 'P2' : 'P3';
    const day = 26 + Math.floor(n / 10); // Monday 26 to Friday 30 October 2026
    const opened = new Date(Date.UTC(2026, 9, day, 8 + Math.floor(rand() * 9), Math.floor(rand() * 12) * 5));
    const hours = { P1: 1 + rand() * 4, P2: 2 + rand() * 14, P3: 4 + rand() * 40 }[priority];
    const closedAt = new Date(opened.getTime() + Math.round(hours * 12) * 5 * 60000);
    const stillOpen = closedAt > new Date(Date.UTC(2026, 9, 30, 17, 0)) || rand() < 0.08;
    tickets.push({ id: `HD-${1001 + n}`, opened, closed: stillOpen ? null : closedAt, team, priority, requester: `${pick(PEOPLE)}@example.com` });
  }
  // Two open P1s, so the report always has something to flag
  for (const id of ['HD-1032', 'HD-1041']) Object.assign(tickets.find((t) => t.id === id), { priority: 'P1', closed: null });

  const rows = tickets.map((t) => {
    const fmt = rand() < 0.3 ? us : iso;
    return [t.id, fmt(t.opened), t.closed ? fmt(t.closed) : '', pick(TEAMS[t.team]), pick(PRIORITIES[t.priority]), t.requester].join(',');
  });
  // The export glitch: 3 tickets appear twice
  rows.splice(20, 0, rows[7]);
  rows.splice(35, 0, rows[30]);
  rows.push(rows[12]);
  const csv = `ticket_id,opened,closed,team,priority,requester\n${rows.join('\n')}\n`;

  // The answers, worked out from the clean data
  const byTeam = {};
  for (const t of tickets) {
    const s = (byTeam[t.team] = byTeam[t.team] || { count: 0, hours: 0, closed: 0 });
    s.count++;
    if (t.closed) { s.closed++; s.hours += (t.closed - t.opened) / 3600000; }
  }
  const stats = Object.fromEntries(Object.entries(byTeam).map(([team, s]) => [team, { count: s.count, avg: s.closed ? s.hours / s.closed : 0 }]));
  const openP1 = tickets.filter((t) => t.priority === 'P1' && !t.closed).map((t) => t.id);
  return { csv, tickets, stats, openP1, total: tickets.length, duplicates: rows.length - tickets.length };
};

// ---------------------------------------------------------------------------
// Code the learner builds up, step by step
// ---------------------------------------------------------------------------

const MESSY_TEAMS = ['Network', 'desktop support', ' NETWORK ', 'Accounts', 'Desktop Support', 'network', 'security', 'Desktop support ', 'accounts', 'Network'];
const countTeams = (list) => {
  const out = {};
  for (const t of list) {
    const clean = t.trim().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    out[clean] = (out[clean] || 0) + 1;
  }
  return out;
};

const COUNT_STARTER = `# count_teams.py: how many tickets did each team get?
teams = ${JSON.stringify(MESSY_TEAMS).replace(/","/g, '", "')}

counts = {}
for team in teams:
    # TODO: clean the name (no spaces around it, "Title Case"),
    #       then add 1 to that team's count in the counts dictionary
    pass

# TODO: print one line per team, like:  Network: 3
`;

const COUNT_SOLUTION = `# count_teams.py: how many tickets did each team get?
teams = ${JSON.stringify(MESSY_TEAMS).replace(/","/g, '", "')}

counts = {}
for team in teams:
    clean = team.strip().title()
    counts[clean] = counts.get(clean, 0) + 1

for team, count in counts.items():
    print(f"{team}: {count}")`;

const CLEANING_STARTER = `# cleaning.py: tidy up values typed by hand

PRIORITY_NAMES = {
    "p1": "P1", "1": "P1", "high": "P1",
    # TODO: add P2 (p2, 2, medium) and P3 (p3, 3, low)
}


def clean_team(text):
    """' NETWORK ' -> 'Network'"""
    # TODO
    return text


def clean_priority(text):
    """'High' -> 'P1', ' p3 ' -> 'P3', anything unknown -> None"""
    # TODO: tidy the text, then look it up in PRIORITY_NAMES
    return text


print(clean_team(" NETWORK "))
print(clean_priority("High"))
`;

const CLEANING_FUNCTIONS = `PRIORITY_NAMES = {
    "p1": "P1", "1": "P1", "high": "P1",
    "p2": "P2", "2": "P2", "medium": "P2",
    "p3": "P3", "3": "P3", "low": "P3",
}


def clean_team(text):
    """' NETWORK ' -> 'Network'"""
    return text.strip().title()


def clean_priority(text):
    """'High' -> 'P1', ' p3 ' -> 'P3', anything unknown -> None"""
    return PRIORITY_NAMES.get(text.strip().lower())`;

const CLEANING_SOLUTION = `# cleaning.py: tidy up values typed by hand

${CLEANING_FUNCTIONS}


print(clean_team(" NETWORK "))
print(clean_priority("High"))`;

const DATES_STARTER = `# dates.py: read the two date formats in the export
from datetime import datetime

FORMATS = ["%Y-%m-%d %H:%M"]  # TODO: add the US format, like 10/26/2026 9:15 AM


def parse_time(text):
    """Turn export text into a datetime, or None when it's empty."""
    text = text.strip()
    if text == "":
        return None
    for fmt in FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass  # not this format: try the next one
    raise ValueError(f"unknown date format: {text!r}")


print(parse_time("2026-10-26 09:15"))
print(parse_time("10/26/2026 2:40 PM"))
`;

const DATES_FUNCTION = `FORMATS = ["%Y-%m-%d %H:%M", "%m/%d/%Y %I:%M %p"]


def parse_time(text):
    """Turn export text into a datetime, or None when it's empty."""
    text = text.strip()
    if text == "":
        return None
    for fmt in FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass  # not this format: try the next one
    raise ValueError(f"unknown date format: {text!r}")`;

const DATES_SOLUTION = `# dates.py: read the two date formats in the export
from datetime import datetime

${DATES_FUNCTION}


print(parse_time("2026-10-26 09:15"))
print(parse_time("10/26/2026 2:40 PM"))`;

const HEADER = `# weekly_report.py: clean the help desk export and write the weekly report.
# Usage: python weekly_report.py
import csv
from datetime import datetime

EXPORT = "tickets.csv"
CLEAN_FILE = "tickets-clean.csv"
REPORT_FILE = "report.txt"

# --- Your functions from the earlier steps -------------------------------

${CLEANING_FUNCTIONS}


${DATES_FUNCTION}


# --- 1. Read and clean ---------------------------------------------------

def load_tickets(path):
    """Read the export, clean every row, and drop duplicate tickets."""
    tickets = []
    seen = set()
    duplicates = 0
    with open(path, newline="") as f:
        for row in csv.DictReader(f):`;

export const REPORT_STARTER = `${HEADER}
            # TODO: if row["ticket_id"] is already in seen, add 1 to
            #       duplicates and skip the row (continue). Otherwise add it to seen.

            tickets.append({
                "id": row["ticket_id"],
                "opened": parse_time(row["opened"]),
                "closed": parse_time(row["closed"]),
                "team": clean_team(row["team"]),
                "priority": clean_priority(row["priority"]),
            })
    return tickets, duplicates


# --- 2. Work out the numbers ---------------------------------------------

def team_stats(tickets):
    """{team: {"count": tickets, "avg_hours": average hours to close}}"""
    stats = {}
    for t in tickets:
        s = stats.setdefault(t["team"], {"count": 0, "hours": 0, "closed": 0})
        s["count"] += 1
        # TODO: if the ticket is closed, add the hours it took to s["hours"]
        #       and 1 to s["closed"].  Hint: (t["closed"] - t["opened"]) is a
        #       timedelta; .total_seconds() / 3600 turns it into hours.
    for s in stats.values():
        s["avg_hours"] = s["hours"] / s["closed"] if s["closed"] else 0
    return stats


def open_p1(tickets):
    """Tickets that are P1 and still open, oldest first."""
    # TODO: return the tickets whose priority is "P1" and closed is None
    return []


# --- 3. Write the files --------------------------------------------------

def write_clean_csv(tickets, path):
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ticket_id", "opened", "closed", "team", "priority"])
        for t in tickets:
            closed = t["closed"].strftime("%Y-%m-%d %H:%M") if t["closed"] else ""
            writer.writerow([t["id"], t["opened"].strftime("%Y-%m-%d %H:%M"), closed, t["team"], t["priority"]])


def write_report(tickets, duplicates, path):
    lines = ["Help desk weekly report", "=======================",
             f"Tickets: {len(tickets)} ({duplicates} duplicates removed)", "", "By team:"]
    for team, s in sorted(team_stats(tickets).items()):
        lines.append(f"  {team}: {s['count']} tickets, {s['avg_hours']:.1f} hours to close on average")
    lines += ["", "Open P1 tickets:"]
    # TODO: one line per open P1 ticket, like:
    #   "  HD-1032 Network, opened 2026-10-29 14:05"
    text = "\\n".join(lines) + "\\n"
    with open(path, "w") as f:
        f.write(text)
    return text


tickets, duplicates = load_tickets(EXPORT)
write_clean_csv(tickets, CLEAN_FILE)
print(write_report(tickets, duplicates, REPORT_FILE))
`;

export const REPORT_SOLUTION = `${HEADER}
            if row["ticket_id"] in seen:
                duplicates += 1
                continue
            seen.add(row["ticket_id"])
            tickets.append({
                "id": row["ticket_id"],
                "opened": parse_time(row["opened"]),
                "closed": parse_time(row["closed"]),
                "team": clean_team(row["team"]),
                "priority": clean_priority(row["priority"]),
            })
    return tickets, duplicates


# --- 2. Work out the numbers ---------------------------------------------

def team_stats(tickets):
    """{team: {"count": tickets, "avg_hours": average hours to close}}"""
    stats = {}
    for t in tickets:
        s = stats.setdefault(t["team"], {"count": 0, "hours": 0, "closed": 0})
        s["count"] += 1
        if t["closed"]:
            s["hours"] += (t["closed"] - t["opened"]).total_seconds() / 3600
            s["closed"] += 1
    for s in stats.values():
        s["avg_hours"] = s["hours"] / s["closed"] if s["closed"] else 0
    return stats


def open_p1(tickets):
    """Tickets that are P1 and still open, oldest first."""
    found = [t for t in tickets if t["priority"] == "P1" and t["closed"] is None]
    return sorted(found, key=lambda t: t["opened"])


# --- 3. Write the files --------------------------------------------------

def write_clean_csv(tickets, path):
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ticket_id", "opened", "closed", "team", "priority"])
        for t in tickets:
            closed = t["closed"].strftime("%Y-%m-%d %H:%M") if t["closed"] else ""
            writer.writerow([t["id"], t["opened"].strftime("%Y-%m-%d %H:%M"), closed, t["team"], t["priority"]])


def write_report(tickets, duplicates, path):
    lines = ["Help desk weekly report", "=======================",
             f"Tickets: {len(tickets)} ({duplicates} duplicates removed)", "", "By team:"]
    for team, s in sorted(team_stats(tickets).items()):
        lines.append(f"  {team}: {s['count']} tickets, {s['avg_hours']:.1f} hours to close on average")
    lines += ["", "Open P1 tickets:"]
    for t in open_p1(tickets):
        lines.append(f"  {t['id']} {t['team']}, opened {t['opened']:%Y-%m-%d %H:%M}")
    text = "\\n".join(lines) + "\\n"
    with open(path, "w") as f:
        f.write(text)
    return text


tickets, duplicates = load_tickets(EXPORT)
write_clean_csv(tickets, CLEAN_FILE)
print(write_report(tickets, duplicates, REPORT_FILE))`;

const exportFiles = () => ({ files: { 'tickets.csv': ticketData().csv } });

// Checks for the report: read the numbers back out of report.txt
const checkReport = ({ files, result }) => {
  const data = ticketData();
  const report = files['report.txt'];
  if (result.error) return null;
  if (!report) return 'No report.txt yet. Run the program: it writes report.txt at the end.';
  const total = report.match(/Tickets:\s*(\d+)\s*\((\d+) duplicates? removed\)/);
  if (!total) return 'The report needs its "Tickets: … (… duplicates removed)" line.';
  if (Number(total[2]) !== data.duplicates || Number(total[1]) !== data.total) {
    return `The export has ${data.total + data.duplicates} rows, but ${data.duplicates} are tickets exported twice. Skip a row when its ticket_id is already in \`seen\`.`;
  }
  for (const [team, s] of Object.entries(data.stats)) {
    const m = report.match(new RegExp(`${team}: (\\d+) tickets, ([\\d.]+) hours`));
    if (!m) return `The report has no line for ${team}.`;
    if (Number(m[1]) !== s.count) return `${team} should have ${s.count} tickets: check the team names are cleaned.`;
    if (Math.abs(Number(m[2]) - s.avg) > 0.06) {
      return Number(m[2]) === 0
        ? 'The averages are all 0.0: in team_stats, add the hours for closed tickets.'
        : `${team}'s average looks off (expected ${s.avg.toFixed(1)}). Only count closed tickets, and turn the timedelta into hours with .total_seconds() / 3600.`;
    }
  }
  const p1 = report.split('Open P1 tickets:')[1] || '';
  const missing = data.openP1.filter((id) => !p1.includes(id));
  if (missing.length) return `These open P1 tickets are missing from the report: ${missing.join(', ')}.`;
  if (!files['tickets-clean.csv']?.includes('HD-1001')) return 'tickets-clean.csv is missing or empty.';
  return true;
};

const tutorial = {
  slug: 'spreadsheet-report',
  number: 1,
  title: 'Spreadsheet report, automated',
  situation: 'Every Monday, Dana on the help desk exports last week\'s tickets to a spreadsheet, fixes the messy bits by hand, works out the numbers and emails a summary to the IT manager. It takes them two hours. You write a Python program that does it in under a second, the same way every time.',
  level: 'Beginner',
  hours: 3,
  free: true,
  skills: ['values and variables', 'text', 'lists', 'dictionaries', 'loops', 'functions', 'files', 'CSV', 'dates'],
  aws: [],
  overview: 'You\'ll learn Python from your first line: values, text, lists, dictionaries, loops and functions. Then you\'ll build `weekly_report.py`: it reads the export, fixes typos in team names and priorities, reads two date formats, drops duplicate tickets, works out each team\'s numbers and writes the report.',
  steps: [
    {
      id: 'first-lines',
      kind: 'read',
      runtime: 'python',
      title: 'Your first lines of Python',
      minutes: 12,
      body: `Below the text is the **Python console**. The \`>>>\` is Python waiting for you. Type a line and press Enter, and it answers straight away. Press **Run** on each box to send it there:

\`\`\`python
2 + 3
\`\`\`

\`\`\`python
print("Hello from Python")
\`\`\`

A **variable** is a name for a value. \`=\` puts the value in; after that the name stands for it:

\`\`\`python
tickets = 48
hours = 2.5
team = "Network"
tickets * hours
\`\`\`

Those are the three kinds of values you'll use most:

| Kind | Python calls it | Examples |
|---|---|---|
| Whole numbers | \`int\` | \`48\`, \`-3\`, \`0\` |
| Numbers with a decimal point | \`float\` | \`2.5\`, \`0.1\` |
| Text | \`str\` (a "string") | \`"Network"\`, \`'HD-1001'\` |

Text goes in quotes, single or double. Without quotes, Python thinks it's a variable name. Try it:

\`\`\`python
Network
\`\`\`

That's a \`NameError\`: Python doesn't know a variable called \`Network\`. **Error messages are your friends.** The last line says what went wrong, and the line above it says where. Below the error, the console adds a plain-English tip.

### Putting values into text

An **f-string** has an \`f\` before the quotes, and puts any value in \`{curly braces}\` into the text:

\`\`\`python
print(f"{team} handled {tickets} tickets")
\`\`\`

\`\`\`python
type("48"), type(48)
\`\`\`

\`"48"\` in quotes is text, not a number, and that matters: \`"48" + 1\` is an error. Everything in a spreadsheet export arrives as text, so you'll convert with \`int("48")\` or \`float("2.5")\`.`,
      scenario: {},
    },
    {
      id: 'clean-text',
      kind: 'try',
      runtime: 'python',
      title: 'Clean up a messy value',
      minutes: 10,
      body: `Text has **methods**: built-in actions you call with a dot. Each returns a new, changed copy of the text:

\`\`\`python
raw = "  network "
raw.strip()
\`\`\`

\`\`\`python
raw.upper()
\`\`\`

\`\`\`python
"desktop support".title()
\`\`\`

| Method | Does | \`"  hELLo  "\` becomes |
|---|---|---|
| \`.strip()\` | removes spaces at both ends | \`"hELLo"\` |
| \`.lower()\` / \`.upper()\` | all small / all capital letters | \`"  hello  "\` |
| \`.title()\` | capital first letter of each word | \`"  Hello  "\` |
| \`.replace("a", "b")\` | swaps every \`a\` for \`b\` | |

Methods can be **chained**: each one works on the result of the one before, left to right. \`raw.strip().upper()\` strips first, then capitalizes.

> The original never changes: \`raw.strip()\` gives you a new value and leaves \`raw\` alone. To keep the result, put it in a variable.`,
      task: 'The console already has `raw = "  network "`. Make a variable called `team` that holds the clean version: `"Network"`, with no spaces around it and a capital N.',
      hint: 'Chain two methods: one removes the spaces, the other fixes the capitals. Then `team = ...` keeps the result.',
      solution: 'team = raw.strip().title()\nteam',
      scenario: { setup: 'raw = "  network "' },
      probe: 'team',
      check: ({ probe, probeError }) => {
        if (probeError === 'NameError') return null;
        if (probe === 'Network') return true;
        if (typeof probe === 'string' && probe.trim() === 'Network') return 'Close: `team` still has spaces around it. Add `.strip()`.';
        if (typeof probe === 'string' && probe.trim().toLowerCase() === 'network') return `\`team\` is "${probe}". Capital N, lowercase rest: \`.title()\` does that.`;
        return null;
      },
      success: 'That one line is most of the cleanup Dana does by hand: `" NETWORK "`, `"network "` and `"Network"` all become the same team.',
    },
    {
      id: 'lists-dicts',
      kind: 'read',
      runtime: 'python',
      title: 'Lists, loops and dictionaries',
      minutes: 15,
      body: `A **list** holds values in order, in square brackets:

\`\`\`python
teams = ["Network", "Accounts", "Network"]
len(teams)
\`\`\`

\`\`\`python
teams[0], teams[-1]
\`\`\`

Positions start at **0**, and \`-1\` means the last one. \`teams.append("Security")\` adds to the end.

A **for loop** runs the indented lines once for every item:

\`\`\`python
for team in teams:
    print("Ticket for", team)
\`\`\`

The **indent** (4 spaces) is how Python knows which lines are inside the loop. In the console, press Enter on an empty line to finish a block.

**if** runs lines only when something is true:

\`\`\`python
for team in teams:
    if team == "Network":
        print("network ticket")
    else:
        print("other ticket")
\`\`\`

\`==\` compares, \`=\` assigns. Mixing them up is the most common typo in every language.

### Dictionaries: names for values

A **dictionary** looks values up by a **key**, like a word in a real dictionary:

\`\`\`python
counts = {"Network": 2, "Accounts": 1}
counts["Network"]
\`\`\`

Add or change a key with \`counts["Security"] = 1\`. Asking for a key that isn't there is a \`KeyError\`, so when a key might be missing, use \`.get()\` with a fallback:

\`\`\`python
counts.get("Security", 0)
\`\`\`

That's the whole trick for counting things: start with an empty dictionary, and for each item do \`counts[x] = counts.get(x, 0) + 1\`.

\`\`\`python
counts = {}
for team in teams:
    counts[team] = counts.get(team, 0) + 1
counts
\`\`\`

To go through a dictionary, \`.items()\` gives you each key and value together:

\`\`\`python
for team, n in counts.items():
    print(f"{team}: {n}")
\`\`\``,
      scenario: {},
    },
    {
      id: 'count-teams',
      kind: 'try',
      runtime: 'python',
      title: 'Count tickets per team',
      minutes: 15,
      body: 'Here\'s a short program in an editor. Edit it, then press **Run count_teams.py** (or Ctrl/⌘ + Enter in the editor). The output appears in the console below, and you can look at any variable afterwards by typing its name at `>>>`.',
      task: 'Finish `count_teams.py` so the `counts` dictionary has the number of tickets for each **clean** team name (`Network`, `Desktop Support`, `Accounts`, `Security`), then print one line per team, like `Network: 4`.',
      hint: 'Inside the loop: `clean = team.strip().title()`, then `counts[clean] = counts.get(clean, 0) + 1`. After the loop, `for team, count in counts.items():` and an f-string.',
      solution: COUNT_SOLUTION,
      files: [{ path: 'count_teams.py', starter: COUNT_STARTER }],
      scenario: {},
      probe: 'counts',
      check: ({ probe, result }) => {
        if (result.error || !probe || typeof probe !== 'object') return null;
        const want = countTeams(MESSY_TEAMS);
        const keys = Object.keys(probe);
        if (!keys.length) return null;
        if (keys.some((k) => k !== k.trim() || k !== k.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()))) {
          return `Some keys aren't clean yet: ${keys.map((k) => JSON.stringify(k)).join(', ')}. Clean each name before counting it.`;
        }
        const right = Object.entries(want).every(([k, v]) => probe[k] === v) && keys.length === Object.keys(want).length;
        if (!right) return `The counts should be ${Object.entries(want).map(([k, v]) => `${k}: ${v}`).join(', ')}.`;
        if (!Object.entries(want).every(([k, v]) => result.stdout.includes(`${k}: ${v}`))) return 'The counts are right. Now print one line per team, like `Network: 4`.';
        return true;
      },
      success: 'Ten messy names, four clean teams. This exact loop works on ten rows or ten million.',
    },
    {
      id: 'functions',
      kind: 'read',
      runtime: 'python',
      title: 'Functions: name a job, reuse it',
      minutes: 12,
      body: `You'll clean team names in several places, so give the job a name. A **function** is a named, reusable piece of code:

\`\`\`python
def clean_team(text):
    return text.strip().title()

clean_team("  desktop SUPPORT ")
\`\`\`

- \`def\` starts it, then the name, then the **parameters** in brackets: the values it gets.
- The indented lines are the **body**.
- \`return\` sends the answer back to whoever called it. A function without \`return\` gives back \`None\`, Python's "nothing".

### A dictionary as a lookup table

Priorities are messier: people typed \`P1\`, \`p1\`, \`1\` or \`High\` for the same thing. Instead of a long chain of \`if\`s, put every spelling in a dictionary and look it up:

\`\`\`python
PRIORITY_NAMES = {"p1": "P1", "1": "P1", "high": "P1"}

def clean_priority(text):
    return PRIORITY_NAMES.get(text.strip().lower())

clean_priority(" High"), clean_priority("urgent")
\`\`\`

Tidy the text first (\`.strip().lower()\`), so the table only needs lowercase keys. \`.get()\` returns \`None\` for spellings it doesn't know. That's useful: an unknown priority is something the report can flag instead of crashing.

> **Names in CAPITALS** like \`PRIORITY_NAMES\` are a Python habit for "a setting that doesn't change while the program runs".

### Test as you go

A quick way to check a function is to call it with tricky inputs and look:

\`\`\`python
for raw in ["P1", " p1", "1", "HIGH ", "3"]:
    print(repr(raw), "->", clean_priority(raw))
\`\`\`

\`repr()\` shows a value the way you'd type it, quotes and spaces included, which makes stray spaces easy to see.`,
      scenario: {},
    },
    {
      id: 'cleaning-functions',
      kind: 'try',
      runtime: 'python',
      title: 'Write the cleaning functions',
      minutes: 15,
      task: 'Finish `cleaning.py`: `clean_team(text)` returns the tidy team name, and `clean_priority(text)` returns `"P1"`, `"P2"` or `"P3"` for every spelling in the export (`P1`, `p1`, `1`, `High`; `P2`, `2`, `Medium`; `P3`, `3`, `Low`, with any capitals and spaces), and `None` for anything else.',
      hint: 'Add the P2 and P3 spellings to `PRIORITY_NAMES` in lowercase. In `clean_priority`, return `PRIORITY_NAMES.get(text.strip().lower())`.',
      solution: CLEANING_SOLUTION,
      files: [{ path: 'cleaning.py', starter: CLEANING_STARTER }],
      scenario: {},
      probe: `[[clean_team(x) for x in [" NETWORK ", "desktop support", "Accounts "]],
 [clean_priority(x) for x in ["P1", " p1", "1", "High", "high ", "P2", "2", "Medium", "p3 ", "3", "Low", "low", "urgent", ""]]]`,
      check: ({ probe, result }) => {
        if (result.error || !Array.isArray(probe)) return null;
        const [teams, prios] = probe;
        if (JSON.stringify(teams) !== JSON.stringify(['Network', 'Desktop Support', 'Accounts'])) {
          return `clean_team gives ${JSON.stringify(teams)} for " NETWORK ", "desktop support" and "Accounts ".`;
        }
        const want = ['P1', 'P1', 'P1', 'P1', 'P1', 'P2', 'P2', 'P2', 'P3', 'P3', 'P3', 'P3', null, null];
        const inputs = ['P1', ' p1', '1', 'High', 'high ', 'P2', '2', 'Medium', 'p3 ', '3', 'Low', 'low', 'urgent', ''];
        const wrong = inputs.filter((x, i) => prios[i] !== want[i]);
        if (wrong.length === inputs.length) return null;
        if (wrong.length) {
          return `clean_priority isn't right yet for: ${wrong.map((x) => JSON.stringify(x)).join(', ')}. ${wrong.includes('urgent') ? 'Unknown spellings should give None: use .get().' : 'Tidy the text with .strip().lower() before looking it up.'}`;
        }
        return true;
      },
      success: 'Those two functions now fix every spelling in the export. When next week someone types "Med", add one entry to the table and you\'re done.',
    },
    {
      id: 'files-dates',
      kind: 'read',
      runtime: 'python',
      title: 'Read the spreadsheet, and its dates',
      minutes: 15,
      body: `A spreadsheet export is a **CSV** file: one line per row, commas between columns, and the column names on the first line. The practice folder has this week's export, \`tickets.csv\`:

\`\`\`python
with open("tickets.csv") as f:
    for line in f.readlines()[:4]:
        print(line, end="")
\`\`\`

\`with open(...) as f:\` opens the file and closes it again when the block ends, even if there's an error.

Splitting lines at commas yourself breaks as soon as a value contains a comma. Python's \`csv\` module handles that, and \`csv.DictReader\` turns every row into a dictionary keyed by the column names:

\`\`\`python
import csv

with open("tickets.csv", newline="") as f:
    rows = list(csv.DictReader(f))

len(rows), rows[0]
\`\`\`

\`import\` loads a **module**: a library of extra tools. \`csv\`, \`datetime\`, \`json\` and many more come with Python. Together they're called the **standard library**.

### Dates

Look at the \`opened\` column: some rows say \`2026-10-26 09:15\`, others \`10/26/2026 9:15 AM\`. Two people's computers, two formats. To compare dates or subtract them, turn the text into a real **datetime** with \`strptime\` (string, parse, time) and a format pattern:

\`\`\`python
from datetime import datetime

opened = datetime.strptime("2026-10-26 09:15", "%Y-%m-%d %H:%M")
closed = datetime.strptime("10/27/2026 1:30 PM", "%m/%d/%Y %I:%M %p")
closed - opened
\`\`\`

| Code | Means | Code | Means |
|---|---|---|---|
| \`%Y\` | 2026 | \`%H\` | hour, 00–23 |
| \`%m\` | month, 01–12 | \`%I\` | hour, 01–12 |
| \`%d\` | day, 01–31 | \`%M\` | minute |
| \`%p\` | AM or PM | | |

Subtracting two datetimes gives a **timedelta**, a length of time. For hours, take its seconds and divide:

\`\`\`python
(closed - opened).total_seconds() / 3600
\`\`\`

### When the format doesn't match

\`strptime\` raises a \`ValueError\` if the text doesn't fit the pattern. **try / except** catches the error so you can try something else instead of crashing:

\`\`\`python
try:
    datetime.strptime("10/27/2026 1:30 PM", "%Y-%m-%d %H:%M")
except ValueError:
    print("not this format")
\`\`\``,
      scenario: exportFiles,
    },
    {
      id: 'parse-dates',
      kind: 'try',
      runtime: 'python',
      title: 'Read both date formats',
      minutes: 10,
      task: '`parse_time(text)` tries each pattern in `FORMATS` until one fits. Add the second format, so it reads both `2026-10-26 09:15` and `10/26/2026 2:40 PM`, and still returns `None` for an empty cell.',
      hint: 'Month/day/year, a 12-hour clock and AM/PM: `"%m/%d/%Y %I:%M %p"`.',
      solution: DATES_SOLUTION,
      files: [{ path: 'dates.py', starter: DATES_STARTER }],
      scenario: {},
      probe: `[str(parse_time(x)) for x in ["2026-10-26 09:15", "10/26/2026 2:40 PM", "10/27/2026 9:05 AM", "  ", "12/1/2026 12:00 PM"]]`,
      check: ({ probe, probeError, result }) => {
        if (result.error?.type === 'ValueError') return 'The US format isn\'t matched yet. Add its pattern to FORMATS.';
        if (probeError === 'ValueError') return 'Some dates still don\'t match. The US format needs %m/%d/%Y, %I for the 12-hour clock, and %p for AM/PM.';
        if (!Array.isArray(probe)) return null;
        const want = ['2026-10-26 09:15:00', '2026-10-26 14:40:00', '2026-10-27 09:05:00', 'None', '2026-12-01 12:00:00'];
        if (probe[1] === '2026-10-26 02:40:00') return '2:40 PM came out as 02:40. Use %I (12-hour clock) and %p (AM/PM), not %H.';
        return JSON.stringify(probe) === JSON.stringify(want) ? true : `parse_time gives ${probe.join(', ')}.`;
      },
      success: 'One function, any number of formats. If a third one turns up, it\'s one more line in the list.',
    },
    {
      id: 'weekly-report',
      kind: 'try',
      runtime: 'python',
      title: 'The whole report',
      minutes: 30,
      body: `Time to put it together. \`weekly_report.py\` already has your functions at the top, and it reads, cleans and writes the files. Four TODOs are left:

1. **Duplicates**: the export has some tickets twice. A **set** (\`seen = set()\`) remembers which IDs you've had: \`x in seen\` is a fast yes/no, and \`seen.add(x)\` adds one.
2. **Average hours to close**, per team, counting only closed tickets.
3. **Open P1 tickets**: priority \`"P1"\` and no closed date. A **list comprehension** builds a list in one line: \`[t for t in tickets if ...]\`.
4. **Write those P1s** into the report.

Run it as often as you like. After a run, the console knows everything the program made: type \`tickets[0]\` or \`team_stats(tickets)\` at \`>>>\` to look.

> \`t["closed"] is None\` asks "is this nothing?". Use \`is None\`, not \`== None\`: it's the Python habit, and always right.`,
      task: 'Finish the TODOs so `report.txt` has the right ticket count (without duplicates), each team\'s count and average hours to close, and every open P1 ticket.',
      hint: '1: `if row["ticket_id"] in seen: duplicates += 1; continue`, then `seen.add(...)`. 2: `if t["closed"]:` add `(t["closed"] - t["opened"]).total_seconds() / 3600` and 1. 3: `[t for t in tickets if t["priority"] == "P1" and t["closed"] is None]`. 4: loop over `open_p1(tickets)` and `lines.append(...)`.',
      solution: REPORT_SOLUTION,
      files: [{ path: 'weekly_report.py', starter: REPORT_STARTER }],
      scenario: exportFiles,
      check: checkReport,
      success: 'That\'s Dana\'s two hours, done in well under a second, and the same way every week. Open `report.txt` by typing `print(open("report.txt").read())` at `>>>`.',
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'What does `"  Accounts ".strip()` give?', options: ['`"Accounts"`', '`"  Accounts "`, unchanged', '`"accounts"`', 'An error'], answer: 0, explain: '`.strip()` removes spaces from both ends and returns a new string.' },
        { q: '`counts = {}` then `counts["Network"] += 1`. What happens?', options: ['counts becomes `{"Network": 1}`', 'A KeyError: the key isn\'t there yet', 'counts becomes `{"Network": 0}`', 'Nothing'], answer: 1, explain: '`+= 1` has to read the old value first. Use `counts["Network"] = counts.get("Network", 0) + 1`.' },
        { q: 'Which pattern reads `10/26/2026 2:40 PM`?', options: ['`%Y-%m-%d %H:%M`', '`%d/%m/%Y %H:%M %p`', '`%m/%d/%Y %I:%M %p`', '`%m/%d/%y %I:%M`'], answer: 2, explain: 'Month first, `%Y` for a 4-digit year, `%I` for the 12-hour clock and `%p` for AM/PM.' },
        { q: 'What does a function return if it has no `return` line?', options: ['0', 'An empty string', '`None`', 'An error'], answer: 2, explain: '`None` is Python\'s "nothing". It\'s a common surprise when a function prints its result instead of returning it.' },
        { q: 'Why use `csv.DictReader` instead of `line.split(",")`?', options: ['It\'s required by Python', 'It handles commas and quotes inside values, and names the columns', 'It\'s faster to type', 'It removes duplicates'], answer: 1, explain: 'A value like `"Smith, Jane"` contains a comma. The csv module reads it correctly, and DictReader lets you write `row["team"]` instead of `row[3]`.' },
        { q: 'Which is the best way to remember IDs you\'ve already seen?', options: ['A list, checking with `in`', 'A set, checking with `in`', 'A string', 'A new file per ID'], answer: 1, explain: 'Both work, but a set answers `in` instantly however big it gets; a list checks every item one by one.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'p1-strip', front: 'Remove spaces from both ends of `text`', back: '`text.strip()`', tags: ['strings'], difficulty: 'easy' },
        { id: 'p1-fstring', front: 'Put the variable `n` into the text "n tickets"', back: '`f"{n} tickets"`', hint: 'f-string', tags: ['strings'], difficulty: 'easy' },
        { id: 'p1-get', front: 'Read key `"Network"` from `counts`, or 0 if it\'s missing', back: '`counts.get("Network", 0)`', tags: ['dictionaries'], difficulty: 'easy' },
        { id: 'p1-count', front: 'Count how many times each item appears in a list', back: '`counts = {}` then for each item: `counts[x] = counts.get(x, 0) + 1`', tags: ['dictionaries', 'loops'], difficulty: 'medium' },
        { id: 'p1-dictreader', front: 'Read a CSV file as one dictionary per row', back: '`with open(path, newline="") as f:` then `for row in csv.DictReader(f):`', tags: ['csv'], difficulty: 'medium' },
        { id: 'p1-strptime', front: 'Turn "2026-10-26 09:15" into a datetime', back: '`datetime.strptime(text, "%Y-%m-%d %H:%M")`', tags: ['dates'], difficulty: 'medium' },
        { id: 'p1-hours', front: 'Hours between two datetimes `a` and `b`', back: '`(b - a).total_seconds() / 3600`', tags: ['dates'], difficulty: 'medium' },
        { id: 'p1-comprehension', front: 'A list of the tickets whose priority is "P1"', back: '`[t for t in tickets if t["priority"] == "P1"]`', hint: 'list comprehension', tags: ['lists'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 40,
      body: `Run the report on your own computer, then make it run itself every Monday.

1. **Install Python 3.** Check first: \`python3 --version\` in your terminal. If it says 3.10 or newer, you're set.
   - **Mac:** download the installer from [python.org/downloads](https://www.python.org/downloads/), or \`brew install python\` if you use Homebrew.
   - **Windows (with the Windows Subsystem for Linux from Start here):** \`sudo apt update && sudo apt install -y python3\`
   - **Linux:** usually already there; otherwise \`sudo apt install -y python3\`.

2. **Make a project folder** and download the practice export into it (button below):

\`\`\`sh
mkdir -p ~/aws-study-projects/python/weekly-report
cd ~/aws-study-projects/python/weekly-report
\`\`\`

3. **Copy your program** from the editor in the last step into a file called \`weekly_report.py\` in that folder. Any editor works; [Visual Studio Code](https://code.visualstudio.com) is free and has good Python support.

4. **Run it:**

\`\`\`sh
python3 weekly_report.py
cat report.txt
\`\`\`

> On your computer the command is \`python3\` (on some systems just \`python\`). In the practice console it was already running, so you typed Python straight in.

5. **Real spreadsheets.** If the export is an Excel file, the free \`openpyxl\` library reads it. Install it into a **virtual environment**, a private folder of libraries for this project, so projects don't fight over versions:

\`\`\`sh
python3 -m venv .venv
source .venv/bin/activate
pip install openpyxl
\`\`\`

\`\`\`py
from openpyxl import load_workbook

sheet = load_workbook("tickets.xlsx").active
rows = list(sheet.iter_rows(values_only=True))
header, data = rows[0], rows[1:]
tickets = [dict(zip(header, row)) for row in data]
\`\`\`

Excel already stores dates as dates, so those cells arrive as \`datetime\` values: no \`strptime\` needed.

6. **Every Monday at 8:00.** On Mac or Linux, \`crontab -e\` and add this line (the Bash course covers cron in depth). Change the path to your real folder:

\`\`\`sh
0 8 * * 1 cd ~/aws-study-projects/python/weekly-report && python3 weekly_report.py >> run.log 2>&1
\`\`\`

On Windows itself, **Task Scheduler** does the same job.

7. **Push it to GitHub** (see *Start here*). Add a \`.gitignore\` with \`.venv/\`, \`tickets*.csv\` and \`report.txt\`: real exports contain names and email addresses, and don't belong in a public repository.`,
      downloads: [{ label: 'Download tickets.csv (practice export)', filename: 'tickets.csv', content: () => ticketData().csv }],
      checklist: [
        'Python 3 runs on my computer (`python3 --version`)',
        'weekly_report.py writes report.txt from the downloaded export',
        'It\'s scheduled to run every Monday',
        'It\'s on GitHub, with the exports and .venv in .gitignore',
      ],
    },
  ],
};

export default tutorial;
