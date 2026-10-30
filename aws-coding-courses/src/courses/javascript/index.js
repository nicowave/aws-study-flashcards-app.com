// JavaScript for AWS: js.aws-study-flashcards-app.com
import meta from './meta.json';
import startHere from '../../shared/startHere';
import flashcardPage from './tutorials/01-flashcard-page';
import statusDashboard from './tutorials/02-status-dashboard';
import contactForm from './tutorials/03-contact-form';
import studyTracker from './tutorials/04-study-tracker';

const course = {
  ...meta,
  mark: 'JS',
  accent: '#eed65a',
  eyebrow: 'Coding course · JavaScript',
  headline: 'Build the web pages and serverless back ends AWS teams ship.',
  lede: 'JavaScript for AWS teaches the language of the web through things teams really build: a study page that remembers your progress, a live status dashboard, a contact form with no server to run, and a tracker with sign-in on Lambda, API Gateway, DynamoDB and Cognito. No programming background needed.',
  heroNote: 'Start here and Tutorial 1 are free. Nothing to install to begin: your pages and Lambda functions run right in the browser, with a pretend AWS account to practice on.',
  heroTerminal: `> scoreText(['s3-bucket', 'lambda-what'], ['iam-least'])
'2 known · 1 to review'

$ test index.mjs with the sample event
START RequestId: 6f1c… Version: $LATEST
END RequestId: 6f1c…
Response:
{ "statusCode": 200,
  "body": "{\\"saved\\":true,\\"deckId\\":\\"aws-basics\\"}" }`,
  outcomes: [
    'Read and write modern JavaScript: values, arrays, objects, functions, modules, and async/await',
    'Build web pages that react to clicks and remember progress, with the DOM and localStorage',
    'Fetch live data, handle slow or failing services politely, and show it on a page',
    'Write **AWS Lambda** functions in Node.js behind **API Gateway**, with input checks and CORS',
    'Save and read data with **DynamoDB** and send email with **Amazon SES**, using the AWS SDK for JavaScript v3',
    'Add sign-in with **Amazon Cognito** and keep each person\'s data separate',
  ],
  pricingLede: 'All four tutorials with every practice task, quiz, flashcard deck and real-AWS project. Pay once, keep it. Part of the Developer Path: Bash, Python, JavaScript and TypeScript, toward the AWS Certified Developer – Associate.',
  faq: [
    { q: 'Do I need to know how to code?', a: 'No. If you\'re comfortable with computers, you\'re ready: Tutorial 1 starts from your first line of JavaScript. The [Bash](https://bash.aws-study-flashcards-app.com) and [Python](https://python.aws-study-flashcards-app.com) courses help, but aren\'t required.' },
    { q: 'Is it real JavaScript?', a: 'Yes. Web pages run in your own browser, and server code runs like Node.js 22 on AWS Lambda. The only pretend parts are the AWS account and the websites your code calls, so you can practice without a bill.' },
    { q: 'Do I need an AWS account?', a: 'Not to start. Every lesson practices against a pretend AWS account in your browser. The **Build it** step at the end of each tutorial uses your own free AWS account, and *Start here* shows how to set one up with a budget alert.' },
    { q: 'Will the real AWS projects cost money?', a: 'Almost nothing. Lambda, API Gateway, Cognito and SES stay within AWS\'s free amounts for these projects, and DynamoDB on-demand costs fractions of a cent at this size. Each Build step ends with cleanup commands.' },
    { q: 'Does this help with the AWS Certified Developer – Associate exam?', a: 'Yes. The exam is about writing code against Lambda, API Gateway, DynamoDB and Cognito, with security and error handling: exactly what tutorials 3 and 4 build. Each tutorial ends with exam tips. Pair it with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).' },
    { q: 'Is this an official AWS course?', a: 'No. AWS Study Hub is an independent study site by Nico Tek Solutions. AWS is a trademark of Amazon.com, Inc.' },
  ],
  afterCourse: `**Next steps:**
- Put the four projects on your résumé and GitHub: a live page, a dashboard, an API and an app with sign-in.
- Practice for the exam with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).
- Continue with [TypeScript for AWS](https://typescript.aws-study-flashcards-app.com): the same code with safety rails, and the whole app deployed with the AWS Cloud Development Kit.`,
  siblings: [
    { title: 'Bash for AWS', url: 'https://bash.aws-study-flashcards-app.com', live: true },
    { title: 'Python for AWS', url: 'https://python.aws-study-flashcards-app.com', live: true },
    { title: 'TypeScript for AWS', url: 'https://typescript.aws-study-flashcards-app.com', live: true },
  ],
  tutorials: [startHere, flashcardPage, statusDashboard, contactForm, studyTracker],
};

export default course;
