// Tutorial 3: pack a folder every night, upload it to Amazon S3, keep 7.

const BUCKET = 'study-backups-learner';

const PROJECTS = {
  'projects/website/index.html': '<!doctype html>\n<h1>Our team site</h1>\n',
  'projects/website/style.css': 'body { font-family: sans-serif; }\n',
  'projects/scripts/health-check.sh': { content: '#!/bin/bash\necho "checking..."\n', mode: 0o755 },
  'projects/notes/ideas.md': '# Ideas\n- automate the Monday report\n- nightly backups (doing it!)\n',
  'projects/notes/passwords.txt': 'DO NOT KEEP PASSWORDS IN FILES. Use a password manager.\n',
};

// Old backups already in the bucket, one per night from Oct 19 to Oct 28
const oldBackups = (from, to) => {
  const objects = {};
  for (let d = from; d <= to; d++) {
    const day = String(d).padStart(2, '0');
    objects[`backups/projects-2026-10-${day}.tar.gz`] = { body: 'x'.repeat(4000 + d * 13), mtime: Date.UTC(2026, 9, d, 2, 0, 4) };
  }
  return objects;
};

const scenario = (objects = {}) => () => ({
  hostname: 'office-server',
  now: '2026-10-29T02:00:00Z',
  files: { ...PROJECTS, 'notes.txt': 'Backups are a habit, not a product.\n' },
  aws: { buckets: { [BUCKET]: objects } },
});

export const BACKUP_STARTER = `#!/bin/bash
# backup.sh: pack a folder, upload it to Amazon S3, keep the newest copies.
# Usage: bash backup.sh
set -euo pipefail

SOURCE_DIR="$HOME/projects"
BUCKET="${BUCKET}"
PREFIX="backups"
KEEP=7

log() {
  echo "$(date '+%F %T') $1"
}

archive="projects-$(date +%F).tar.gz"

log "packing $SOURCE_DIR into $archive"
tar -czf "/tmp/$archive" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

log "uploading to s3://$BUCKET/$PREFIX/"
# TODO: upload /tmp/$archive to s3://$BUCKET/$PREFIX/$archive

rm "/tmp/$archive"

log "keeping the newest $KEEP backups"
# TODO: delete every backup except the newest $KEEP

log "done"
`;

export const BACKUP_SOLUTION = `#!/bin/bash
# backup.sh: pack a folder, upload it to Amazon S3, keep the newest copies.
set -euo pipefail

SOURCE_DIR="$HOME/projects"
BUCKET="${BUCKET}"
PREFIX="backups"
KEEP=7

log() {
  echo "$(date '+%F %T') $1"
}

archive="projects-$(date +%F).tar.gz"

log "packing $SOURCE_DIR into $archive"
tar -czf "/tmp/$archive" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

log "uploading to s3://$BUCKET/$PREFIX/"
aws s3 cp "/tmp/$archive" "s3://$BUCKET/$PREFIX/$archive"

rm "/tmp/$archive"

log "keeping the newest $KEEP backups"
aws s3 ls "s3://$BUCKET/$PREFIX/" | awk '{print $4}' | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do
  log "removing $old"
  aws s3 rm "s3://$BUCKET/$PREFIX/$old"
done

log "done"`;

const backupKeys = (aws) => aws.keys(BUCKET, 'backups/').filter((k) => k.endsWith('.tar.gz'));

const tutorial = {
  slug: 'nightly-backup-to-s3',
  number: 3,
  title: 'Nightly backup to S3',
  situation: '"We need backups, and we can\'t pay for a product." Your team\'s project files live on one office server. If its disk dies, they\'re gone. You build a nightly backup: pack the folder, upload it to Amazon S3, and keep only the last 7 copies so the bill stays tiny.',
  level: 'Intermediate',
  hours: 3,
  free: false,
  skills: ['tar', 'set -euo pipefail', 'while read', 'safe deletes', 'cron'],
  aws: ['Amazon S3', 'the AWS command line', 'IAM policies', 'S3 lifecycle rules'],
  overview: 'You\'ll learn how Amazon S3 stores files, upload and list with the AWS command line, pack folders with `tar`, and safely delete old copies. Then you write `backup.sh`, schedule it for 2 a.m., and lock it down with a least-privilege IAM policy.',
  steps: [
    {
      id: 's3-basics',
      kind: 'read',
      title: 'Amazon S3 in five minutes',
      minutes: 8,
      body: `**Amazon S3** (Simple Storage Service) stores files, which it calls **objects**, in containers called **buckets**.

| Idea | Meaning |
|---|---|
| Bucket | A container with a name that's unique across **all** of AWS, like \`study-backups-yourname\` |
| Key | An object's full name inside the bucket, like \`backups/projects-2026-10-29.tar.gz\` |
| Prefix | The "folder" part of a key, like \`backups/\`. S3 has no real folders; slashes are just part of the name |
| S3 address | \`s3://bucket/key\`, the way the AWS command line writes it |

Why it's great for backups: it's designed to keep 99.999999999% of objects safe over a year (*eleven nines*), costs about **2.3 US cents per gigabyte per month** for standard storage, and keeps copies in several data centers automatically.

The AWS command line's \`aws s3\` commands work like the file commands you know:

| Command | Like |
|---|---|
| \`aws s3 ls s3://bucket/prefix/\` | \`ls\` |
| \`aws s3 cp file s3://bucket/key\` | \`cp\` |
| \`aws s3 rm s3://bucket/key\` | \`rm\` |
| \`aws s3 sync folder s3://bucket/prefix\` | copy only what changed (Tutorial 4) |

> **For the Developer Associate exam:** know that S3 has no folders (only prefixes), that bucket names are global, and that objects are private unless you choose otherwise.`,
    },
    {
      id: 'first-upload',
      kind: 'try',
      title: 'Your first upload',
      minutes: 10,
      body: `The practice terminal is connected to a **pretend AWS account** with one bucket. First, always check *which* account you're talking to: in real life this saves you from uploading to the wrong one.

\`\`\`bash
aws sts get-caller-identity
\`\`\`

List your buckets, then what's in this one:

\`\`\`bash
aws s3 ls
\`\`\`

\`\`\`bash
aws s3 ls s3://${BUCKET}/
\`\`\`

Upload a file. A key ending in \`/\` means "keep the file's name":

\`\`\`bash
aws s3 cp notes.txt s3://${BUCKET}/test/
\`\`\``,
      task: `Upload \`notes.txt\` into the \`test/\` prefix of \`${BUCKET}\`, then **list** \`s3://${BUCKET}/test/\` to see it there.`,
      hint: `Run the \`aws s3 cp\` box above, then \`aws s3 ls s3://${BUCKET}/test/\`.`,
      solution: `aws s3 cp notes.txt s3://${BUCKET}/test/\naws s3 ls s3://${BUCKET}/test/`,
      scenario: scenario(),
      check: ({ aws, result }) => (aws.keys(BUCKET, 'test/').includes('test/notes.txt') && /aws\s+s3\s+ls/.test(result.command) && result.stdout.includes('notes.txt') ? true : null),
      success: 'Upload, then verify. Good engineers never assume a command worked: they check.',
    },
    {
      id: 'tar',
      kind: 'try',
      title: 'Pack a folder with tar',
      minutes: 15,
      body: `Uploading hundreds of small files one by one is slow and messy. Pack them into **one** compressed file first with \`tar\` (short for *tape archive*, from the days of tape backups):

\`\`\`bash
tar -czf test.tar.gz projects
\`\`\`

| Option | Meaning |
|---|---|
| \`-c\` | **c**reate an archive |
| \`-z\` | compress it with gzip (hence \`.tar.gz\`) |
| \`-f name\` | the archive's **f**ile name (always last, right before the name) |
| \`-t\` | lis**t** what's inside, instead of creating |
| \`-x\` | e**x**tract |

Look inside without unpacking:

\`\`\`bash
tar -tzf test.tar.gz
\`\`\`

For a nightly backup, put the **date** in the name so each night gets its own file. \`date +%F\` prints \`YYYY-MM-DD\`, which also sorts in time order:

\`\`\`bash
echo "projects-$(date +%F).tar.gz"
\`\`\``,
      task: 'Create a backup of the `projects` folder named with **today\'s date**, like `projects-2026-10-29.tar.gz`, using `$(date +%F)` (not typing the date). Then list what\'s inside it.',
      hint: '`tar -czf "projects-$(date +%F).tar.gz" projects`',
      solution: 'tar -czf "projects-$(date +%F).tar.gz" projects\ntar -tzf projects-2026-10-29.tar.gz',
      scenario: scenario(),
      check: ({ fs, history }) => {
        if (!fs.isFile('projects-2026-10-29.tar.gz')) return null;
        if (!history.some((h) => /date\s+\+%F/.test(h.command) && /tar/.test(h.command))) return 'The file is right. Now do it with `$(date +%F)` in the name, so the script works every night.';
        return history.some((h) => /tar\s+-?t/.test(h.command)) ? true : 'Archive created. Now look inside with `tar -tzf`.';
      },
      success: 'One file, with today\'s date in its name, holding the whole folder.',
    },
    {
      id: 'prune',
      kind: 'try',
      title: 'Keep only the newest 7, safely',
      minutes: 20,
      body: `Ten nights of backups are already in the bucket. Keeping every copy forever costs money for no reason. You want to keep the **newest 7**.

**Deleting is where scripts do damage.** So build the delete in steps, and **look before you delete**. First, the names, newest first (the dates in the names make \`sort -r\` put them in time order):

\`\`\`bash
aws s3 ls s3://${BUCKET}/backups/ | awk '{print $4}' | sort -r
\`\`\`

Skip the first 7 lines: \`tail -n +8\` starts printing at line 8. **These are the ones to delete.** Check the list:

\`\`\`bash
aws s3 ls s3://${BUCKET}/backups/ | awk '{print $4}' | sort -r | tail -n +8
\`\`\`

To act on each line, pipe it into a \`while read\` loop. Run it with \`echo\` first, as a **dry run**: it prints what *would* be deleted.

\`\`\`bash
aws s3 ls s3://${BUCKET}/backups/ | awk '{print $4}' | sort -r | tail -n +8 | while read -r old; do
  echo "would delete $old"
done
\`\`\`

\`read -r old\` reads one line into the variable \`old\` (\`-r\` keeps backslashes as they are). The loop runs until the lines run out.`,
      task: 'Delete every backup except the **newest 7**. Do a dry run first, then replace `echo "would delete $old"` with the real `aws s3 rm` command.',
      hint: `Inside the loop: \`aws s3 rm "s3://${BUCKET}/backups/$old"\``,
      solution: `aws s3 ls s3://${BUCKET}/backups/ | awk '{print $4}' | sort -r | tail -n +8 | while read -r old; do\n  aws s3 rm "s3://${BUCKET}/backups/$old"\ndone`,
      scenario: scenario(oldBackups(19, 28)),
      check: ({ aws }) => {
        const keys = backupKeys(aws);
        if (keys.length === 10) return null;
        if (keys.length === 7 && keys[0].endsWith('2026-10-22.tar.gz') && keys[6].endsWith('2026-10-28.tar.gz')) return true;
        if (keys.length < 7) return `Too many deleted: ${keys.length} left. Press "Reset the practice server" and try again, with a dry run first. That's why dry runs exist.`;
        return `${keys.length} backups left. The newest 7 should stay: Oct 22 to Oct 28.`;
      },
      success: 'Oct 22 through Oct 28 are left. You also practiced the most important habit in scripting: dry run first.',
    },
    {
      id: 'backup-script',
      kind: 'try',
      title: 'The backup script',
      minutes: 25,
      body: `Now put it all in \`backup.sh\`. Two new things at the top:

**\`set -euo pipefail\`**: the safety switches every serious Bash script starts with.

| Switch | Effect |
|---|---|
| \`-e\` | stop at the first command that fails, instead of carrying on |
| \`-u\` | treat a misspelled or unset variable as an error, instead of an empty string |
| \`-o pipefail\` | a pipeline fails if **any** part fails, not just the last one |

Without \`-u\`, a typo like \`rm -rf "$BACKUP_DRI/"\` becomes \`rm -rf "/"\`. With it, the script stops.

**\`tar -C\`**: change into a folder before packing, so the archive holds \`projects/...\` instead of the full path \`/home/learner/projects/...\`.

The bucket has 8 old backups. After tonight's run, it should hold exactly 7, including tonight's.`,
      task: 'Fill in both TODOs and run `bash backup.sh`. Tonight\'s backup should be in S3, the bucket should hold exactly **7** backups, and nothing should be left behind in `/tmp`.',
      hint: 'Upload: `aws s3 cp "/tmp/$archive" "s3://$BUCKET/$PREFIX/$archive"`. Prune: your loop from the last step, using `$BUCKET`, `$PREFIX` and `tail -n +$((KEEP + 1))`.',
      solution: BACKUP_SOLUTION,
      files: [{ path: 'backup.sh', starter: BACKUP_STARTER }],
      scenario: scenario(oldBackups(21, 28)),
      check: ({ aws, fs, history }) => {
        if (!history.some((h) => /backup\.sh/.test(h.command))) return null;
        const keys = backupKeys(aws);
        if (!keys.includes('backups/projects-2026-10-29.tar.gz')) return 'Tonight\'s backup isn\'t in S3 yet (the first TODO).';
        if (fs.exists('/tmp/projects-2026-10-29.tar.gz')) return 'Uploaded. But the archive is still in /tmp: it should be removed after the upload.';
        if (keys.length > 7) return `Uploaded. Now prune: ${keys.length} backups are in the bucket, and there should be 7 (the second TODO).`;
        if (keys.length < 7) return `Only ${keys.length} backups left: the newest 7 should stay. Press "Reset the practice server" to try again.`;
        return true;
      },
      success: 'A complete backup job: pack, upload, clean up, prune. And because of `set -euo pipefail`, if the upload fails, it stops **before** deleting anything.',
    },
    {
      id: 'schedule',
      kind: 'try',
      title: 'Schedule it for 2 a.m.',
      minutes: 10,
      body: `Backups run at night, when nobody's working and files aren't changing. Schedule it with cron like in Tutorial 1, and **keep a log**: if a backup fails at 2 a.m., the log is the only witness.

\`\`\`bash
echo "0 2 * * * /home/learner/backup.sh >> /home/learner/backup.log 2>&1" > jobs.txt
\`\`\`

\`>> backup.log\` adds each night's output to the end of the file, and \`2>&1\` sends error messages there too.

> On a real server, cron needs AWS credentials too. On an EC2 server, attach an **IAM role** to the server instead of storing keys on it: the AWS command line finds the role's temporary credentials automatically.`,
      task: 'Schedule `/home/learner/backup.sh` for **2:00 every night**, with its output and errors appended to a log file.',
      hint: 'Run the box above, then `crontab jobs.txt` and `crontab -l`.',
      solution: 'echo "0 2 * * * /home/learner/backup.sh >> /home/learner/backup.log 2>&1" > jobs.txt\ncrontab jobs.txt\ncrontab -l',
      scenario: () => ({ ...scenario()(), files: { ...PROJECTS, 'backup.sh': { content: BACKUP_SOLUTION, mode: 0o755 } } }),
      check: ({ shell }) => {
        const tab = shell.crontab;
        if (!tab) return null;
        if (!/^\s*0\s+2\s+\*\s+\*\s+\*\s+\S*backup\.sh/m.test(tab)) return 'The schedule should start with `0 2 * * *` (minute 0, hour 2, every day).';
        if (!/>>\s*\S+/.test(tab)) return 'Scheduled. Add `>> /home/learner/backup.log 2>&1` so you can see what happened each night.';
        return /2>&1/.test(tab) ? true : 'Add `2>&1` so error messages go to the log too.';
      },
    },
    {
      id: 'least-privilege',
      kind: 'read',
      title: 'Lock it down: least privilege and lifecycle rules',
      minutes: 15,
      body: `Your script only needs to do three things to one bucket: list it, upload, and delete. Give its credentials **exactly** that and nothing else. That's **least privilege**, and it's on every AWS exam.

An IAM policy is a JSON document of *statements*: which **actions** are allowed on which **resources**:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListTheBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${BUCKET}"
    },
    {
      "Sid": "ReadWriteDeleteBackups",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/backups/*"
    }
  ]
}
\`\`\`

Notice the two resources: \`ListBucket\` applies to the **bucket**, while put, get and delete apply to **objects** (\`bucket/prefix/*\`). Mixing them up is the most common reason a policy "doesn't work".

If someone steals this server's credentials, the worst they can do is mess with your backups, not your whole account.

### An alternative: let S3 do the cleanup

An **S3 lifecycle rule** can delete objects automatically after a number of days, or move them to cheaper storage like *S3 Glacier Flexible Retrieval*. Then the script doesn't need delete permission at all, which is even safer. Many teams use both: versioning plus a lifecycle rule.

| Approach | Good for |
|---|---|
| Script deletes old copies | "keep exactly 7", logic you control |
| Lifecycle rule (expire after 7 days) | simpler, no delete permission needed |
| Lifecycle rule (move to Glacier after 30 days) | keeping a year of backups for very little money |

> **Exam tip:** when a question says "automatically delete" or "move to cheaper storage after N days", the answer is almost always an S3 lifecycle rule.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'In S3, what is `backups/` in the key `backups/projects-2026-10-29.tar.gz`?', options: ['A real folder', 'A prefix: part of the object\'s name', 'A second bucket', 'A tag'], answer: 1, explain: 'S3 is flat. Slashes are just characters in the key; tools show prefixes as folders for convenience.' },
        { q: 'What does `set -u` protect you from?', options: ['Slow scripts', 'Using a variable that was never set (like a typo)', 'Running as root', 'Network errors'], answer: 1, explain: 'With `-u`, an unset variable stops the script instead of silently becoming an empty string.' },
        { q: 'Why do a dry run with `echo` before a delete loop?', options: ['It makes the loop faster', 'To see exactly what would be deleted before anything is', 'AWS requires it', 'echo deletes more safely'], answer: 1, explain: 'Printing the list first catches mistakes (like deleting the newest files) while they\'re still harmless.' },
        { q: '`ls | sort -r | tail -n +8` prints what?', options: ['The first 8 lines', 'The last 8 lines', 'Everything from line 8 on: all but the first 7', 'Line 8 only'], answer: 2, explain: '`tail -n +8` starts at line 8. After `sort -r` (newest first), that\'s everything except the newest 7.' },
        { q: 'A policy allows `s3:ListBucket` on `arn:aws:s3:::my-bucket/*`, and listing fails. Why?', options: ['ListBucket applies to the bucket, `arn:aws:s3:::my-bucket`, not its objects', 'The bucket is empty', 'Policies need a Deny', 'ListBucket isn\'t a real action'], answer: 0, explain: 'Bucket-level actions (ListBucket) use the bucket ARN; object actions (GetObject, PutObject, DeleteObject) use `bucket/*`.' },
        { q: 'Your backups should move to cheaper storage after 30 days, with no code. What do you use?', options: ['A cron job', 'An S3 lifecycle rule', 'A bigger bucket', 'CloudFront'], answer: 1, explain: 'Lifecycle rules transition or expire objects automatically.' },
        { q: 'The backup runs on an EC2 server. How should it get AWS credentials?', options: ['Access keys in the script', 'Access keys in a file in the projects folder', 'An IAM role attached to the server', 'The root user\'s password'], answer: 2, explain: 'A role gives the server short-lived credentials automatically. No keys to leak.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'b3-cp', front: 'Upload `report.pdf` to the `docs/` prefix of bucket `team-files`', back: '`aws s3 cp report.pdf s3://team-files/docs/`', tags: ['s3'], difficulty: 'easy' },
        { id: 'b3-tar', front: 'Create a compressed archive of the folder `site`', back: '`tar -czf site.tar.gz site`', hint: 'create, gzip, file', tags: ['tar'], difficulty: 'easy' },
        { id: 'b3-tar-t', front: 'See what\'s inside `site.tar.gz` without extracting', back: '`tar -tzf site.tar.gz`', tags: ['tar'], difficulty: 'easy' },
        { id: 'b3-strict', front: 'The safety line at the top of serious Bash scripts', back: '`set -euo pipefail`: stop on errors, on unset variables, and on failures anywhere in a pipeline.', tags: ['scripts'], difficulty: 'medium' },
        { id: 'b3-tailplus', front: 'Print a list starting from line 8', back: '`tail -n +8`', tags: ['text'], difficulty: 'medium' },
        { id: 'b3-while', front: 'Run a command once per line of input', back: '`... | while read -r line; do echo "$line"; done`', tags: ['loops'], difficulty: 'medium' },
        { id: 'b3-least', front: 'What is least privilege?', back: 'Giving a user, role or script only the permissions it needs, on only the resources it needs.', tags: ['iam'], difficulty: 'easy' },
        { id: 'b3-lifecycle', front: 'Automatically delete or archive S3 objects after N days', back: 'An S3 lifecycle rule (expiration, or transition to a cheaper storage class like Glacier).', tags: ['s3'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 35,
      body: `Run the real thing against your own AWS account.

1. **Create a bucket.** Names are global, so add something unique, like your name and the year:

\`\`\`sh
aws s3 mb s3://study-backups-yourname-2026
\`\`\`

New buckets block all public access by default. Leave it that way.

2. **Save the script** in \`~/aws-study-projects/bash/backup/backup.sh\`, change \`BUCKET\` to your bucket and \`SOURCE_DIR\` to a real folder (your \`aws-study-projects\` folder works). Then:

\`\`\`sh
chmod +x backup.sh
./backup.sh
aws s3 ls s3://study-backups-yourname-2026/backups/
\`\`\`

> **On a Mac,** \`/tmp\` works the same way, and \`date +%F\` too. If you see *Unable to locate credentials*, your sign-in expired: run \`aws sso login\`.

3. **Test a restore.** A backup you've never restored is a hope, not a backup:

\`\`\`sh
mkdir -p ~/restore-test
aws s3 cp s3://study-backups-yourname-2026/backups/projects-$(date +%F).tar.gz ~/restore-test/
tar -xzf ~/restore-test/projects-*.tar.gz -C ~/restore-test
ls ~/restore-test
\`\`\`

4. **Optional:** in the S3 console, open the bucket → *Management* → *Create lifecycle rule* to expire objects under \`backups/\` after 30 days.

5. Schedule it with \`crontab -e\` and push the script to GitHub, with your bucket name replaced by a placeholder.

**Cost:** a few megabytes in S3 Standard costs well under one cent a month. To remove everything afterwards: \`aws s3 rb s3://study-backups-yourname-2026 --force\`.`,
      checklist: [
        'My bucket exists and blocks public access',
        'backup.sh uploaded a backup with today\'s date',
        'I restored a backup into another folder and checked the files',
        'It\'s scheduled, and the script is on GitHub without my bucket name or any keys',
      ],
    },
  ],
};

export default tutorial;
