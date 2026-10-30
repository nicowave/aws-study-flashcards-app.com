// Bash for AWS: bash.aws-study-flashcards-app.com
import meta from './meta.json';
import startHere from '../../shared/startHere';
import serverHealthCheck from './tutorials/01-server-health-check';
import logDetective from './tutorials/02-log-detective';
import nightlyBackup from './tutorials/03-nightly-backup';
import websiteDeploy from './tutorials/04-website-deploy';

const course = {
  ...meta,
  mark: '$_',
  accent: '#89d185',
  eyebrow: 'Coding course · Bash',
  headline: 'Automate the work you already do by hand.',
  lede: 'Bash for AWS teaches the command-line scripting IT teams use every day: health checks, log digging, backups to Amazon S3 and one-command website deploys. No programming background needed.',
  heroNote: 'Start here and Tutorial 1 are free. Nothing to install to begin: the practice terminal runs in your browser.',
  heroTerminal: `$ ./health-check.sh
2026-10-29 07:00:01 OK disk is 62% full
2026-10-29 07:00:02 OK https://www.example.com 200
2026-10-29 07:00:02 WARNING https://api.example.com 503

$ ./backup.sh
packing ~/projects into projects-2026-10-29.tar.gz
upload: projects-2026-10-29.tar.gz to s3://team-backups/
keeping the newest 7 backups

$ ./deploy.sh production
Deploying site to production (s3://www-example)
Cache clear started: I2J7Q8EXAMPLE
Live at https://www.example.com`,
  outcomes: [
    'Read and write Bash scripts with variables, `if` checks, loops and functions',
    'Find the cause of an outage in thousands of log lines with `grep`, `awk`, `sort` and `uniq`',
    'Run jobs on a schedule with cron, with logs you can trust',
    'Upload, list and clean up files in **Amazon S3** with the AWS command line',
    'Deploy a website to **S3 and CloudFront** with the right cache headers, settings in **Secrets Manager**',
    'Write safe scripts: `set -euo pipefail`, input checks, dry runs and least-privilege permissions',
  ],
  pricingLede: 'All four tutorials with every practice task, quiz, flashcard deck and real-AWS project. Pay once, keep it. Part of the Developer Path: Bash, then Python, JavaScript and TypeScript, toward the AWS Certified Developer – Associate.',
  faq: [
    { q: 'Do I need to know how to code?', a: 'No. If you\'re comfortable with computers (IT support, sysadmin, help desk, a technical hobby), you\'re ready. Tutorial 1 starts from your very first command.' },
    { q: 'Do I need an AWS account?', a: 'Not to start: every lesson has a practice terminal with a pretend AWS account, right in your browser. The **Build it** step at the end of each tutorial uses your own free AWS account, and *Start here* shows how to set one up with a budget alert so it can\'t surprise you.' },
    { q: 'Will the real AWS projects cost money?', a: 'Almost nothing. Everything fits in the AWS Free Tier or costs a few cents, except AWS Secrets Manager in Tutorial 4 ($0.40 a month per secret after a 30-day free trial). Each Build step ends with cleanup commands.' },
    { q: 'Mac, Windows or Linux?', a: 'All three. Mac and Linux have a terminal built in. On Windows, *Start here* shows how to install the Windows Subsystem for Linux, which gives you a real Ubuntu terminal.' },
    { q: 'Does this help with the AWS Certified Developer – Associate exam?', a: 'Yes. The exam expects you to work with the AWS command line, S3, CloudFront, IAM policies and Secrets Manager, and each tutorial ends with exam tips. Pair it with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com) for full exam practice.' },
    { q: 'Is this an official AWS course?', a: 'No. AWS Study Hub is an independent study site by Nico Tek Solutions. AWS is a trademark of Amazon.com, Inc.' },
  ],
  afterCourse: `**Next steps:**
- Put the four scripts on your résumé as a "Bash automation" project, linking to your GitHub.
- Practice for the exam with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).
- Continue with [Python for AWS](https://python.aws-study-flashcards-app.com): the language AWS automation runs on, with boto3, Lambda and DynamoDB.`,
  siblings: [
    { title: 'Python for AWS', url: 'https://python.aws-study-flashcards-app.com', live: true },
    { title: 'JavaScript for AWS', url: 'https://js.aws-study-flashcards-app.com', live: false },
    { title: 'TypeScript for AWS', url: 'https://typescript.aws-study-flashcards-app.com', live: false },
  ],
  tutorials: [startHere, serverHealthCheck, logDetective, nightlyBackup, websiteDeploy],
};

export default course;
