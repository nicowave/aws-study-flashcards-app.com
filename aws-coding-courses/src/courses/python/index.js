// Python for AWS: python.aws-study-flashcards-app.com
import meta from './meta.json';
import startHere from '../../shared/startHere';
import spreadsheetReport from './tutorials/01-spreadsheet-report';
import awsBill from './tutorials/02-aws-bill';
import uptimeAlerts from './tutorials/03-uptime-alerts';
import uploadPipeline from './tutorials/04-upload-pipeline';

const course = {
  ...meta,
  mark: '>>>',
  accent: '#7db6e4',
  eyebrow: 'Coding course · Python',
  headline: 'Turn the jobs you do by hand into Python that runs itself.',
  lede: 'Python for AWS teaches the language AWS automation runs on, through jobs IT teams really get asked to do: a weekly spreadsheet report, a hunt for what\'s on the AWS bill, certificate alerts and an upload pipeline built on Lambda and DynamoDB. No programming background needed.',
  heroNote: 'Start here and Tutorial 1 are free. Nothing to install to begin: real Python runs in your browser, with a pretend AWS account to practice on.',
  heroTerminal: `$ python weekly_report.py
Tickets: 48 (3 duplicates removed)
  Network: 15 tickets, 15.6 hours to close
Open P1 tickets: 4, oldest HD-1032

$ python cost_report.py
4 regions checked
Forgotten: 8 resources, about $49.10 a month

$ test lambda_function.py
Response:
{"checked": 6, "problems": 5, "alerted": true}`,
  outcomes: [
    'Read and write Python: values, lists, dictionaries, loops, functions and error handling',
    'Clean a messy spreadsheet export and write the weekly report automatically, with the `csv` and `datetime` modules',
    'Use **boto3**, Amazon\'s Python toolkit, to list servers, disks and snapshots in every region, with paginators and least-privilege permissions',
    'Build **Lambda** functions that run on a schedule with **EventBridge** and send email alerts through **SNS**',
    'Process uploads automatically with **S3 events**, **Lambda** and **DynamoDB**, safely retried',
    'Handle the errors real code meets: timeouts, missing keys, AWS error codes, duplicates and bad input',
  ],
  pricingLede: 'All four tutorials with every practice task, quiz, flashcard deck and real-AWS project. Pay once, keep it. Part of the Developer Path: Bash, then Python, JavaScript and TypeScript, toward the AWS Certified Developer – Associate.',
  faq: [
    { q: 'Do I need to know how to code?', a: 'No. If you\'re comfortable with computers (IT support, sysadmin, help desk, a technical hobby), you\'re ready. Tutorial 1 starts from your very first line of Python. The [Bash course](https://bash.aws-study-flashcards-app.com) helps but isn\'t required.' },
    { q: 'Is it real Python?', a: 'Yes: Python 3.13, running in your browser through Pyodide. The only pretend parts are the AWS account and the internet it talks to, so you can practice without a bill or a real website going down.' },
    { q: 'Do I need an AWS account?', a: 'Not to start. Every lesson practices against a pretend AWS account, right in your browser. The **Build it** step at the end of each tutorial uses your own free AWS account, and *Start here* shows how to set one up with a budget alert so it can\'t surprise you.' },
    { q: 'Will the real AWS projects cost money?', a: 'Almost nothing. Lambda, EventBridge, SNS email, DynamoDB on-demand and S3 all fit in the AWS Free Tier for these projects. Each Build step ends with cleanup commands.' },
    { q: 'Mac, Windows or Linux?', a: 'All three. Tutorial 1\'s Build step shows how to install Python on each, and *Start here* sets up a terminal.' },
    { q: 'Does this help with the AWS Certified Developer – Associate exam?', a: 'Yes. A third of that exam is writing code against AWS services: Lambda, DynamoDB, S3 and SNS, with retries, error handling and permissions. Each tutorial ends with exam tips. Pair it with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com) for full exam practice.' },
    { q: 'Is this an official AWS course?', a: 'No. AWS Study Hub is an independent study site by Nico Tek Solutions. AWS is a trademark of Amazon.com, Inc.' },
  ],
  afterCourse: `**Next steps:**
- Put the four programs on your résumé as a "Python and AWS automation" project, linking to your GitHub.
- Practice for the exam with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).
- Continue with [JavaScript for AWS](https://js.aws-study-flashcards-app.com): web pages, and Lambda functions behind a real sign-in.`,
  siblings: [
    { title: 'Bash for AWS', url: 'https://bash.aws-study-flashcards-app.com', live: true },
    { title: 'JavaScript for AWS', url: 'https://js.aws-study-flashcards-app.com', live: true },
    { title: 'TypeScript for AWS', url: 'https://typescript.aws-study-flashcards-app.com', live: true },
  ],
  tutorials: [startHere, spreadsheetReport, awsBill, uptimeAlerts, uploadPipeline],
};

export default course;
