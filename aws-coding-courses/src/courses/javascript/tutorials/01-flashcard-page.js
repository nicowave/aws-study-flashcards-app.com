// Tutorial 1 (free): DEMO of the JavaScript practice engine. A tutorial writer
// replaces this with the real "Build a flashcard page" tutorial; until then it
// proves every feature end to end (the course tests run each task's answer).

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Flashcards</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p id="front"></p>
    <p id="back" hidden></p>
    <button id="flip">Flip</button>
    <button id="known">I knew it</button>
    <p id="score">Known: 0</p>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const PAGE_CSS = `body { font-family: system-ui, sans-serif; margin: 2rem; }
main { max-width: 28rem; }
#front { font-size: 1.4rem; font-weight: 600; }
button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }`;

const APP_STARTER = `// app.js: one card at a time, flip it, and count the ones you know.
const cards = [
  { front: 'What does Amazon S3 store?', back: 'Objects (files) in buckets' },
  { front: 'What runs your code without servers?', back: 'AWS Lambda' },
];

let known = Number(localStorage.getItem('known') ?? 0);

document.querySelector('#front').textContent = cards[0].front;
document.querySelector('#back').textContent = cards[0].back;
document.querySelector('#score').textContent = \`Known: \${known}\`;

// TODO: when #flip is clicked, show #back (set its hidden property to false)

// TODO: when #known is clicked, add 1 to known, save it with
//       localStorage.setItem('known', known), and update #score
`;

const APP_SOLUTION = `// app.js: one card at a time, flip it, and count the ones you know.
const cards = [
  { front: 'What does Amazon S3 store?', back: 'Objects (files) in buckets' },
  { front: 'What runs your code without servers?', back: 'AWS Lambda' },
];

let known = Number(localStorage.getItem('known') ?? 0);

document.querySelector('#front').textContent = cards[0].front;
document.querySelector('#back').textContent = cards[0].back;
document.querySelector('#score').textContent = \`Known: \${known}\`;

document.querySelector('#flip').addEventListener('click', () => {
  document.querySelector('#back').hidden = false;
});

document.querySelector('#known').addEventListener('click', () => {
  known += 1;
  localStorage.setItem('known', known);
  document.querySelector('#score').textContent = \`Known: \${known}\`;
});`;

const HANDLER_STARTER = `// index.mjs: a Lambda function that saves a learner's score.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const { userId, known } = JSON.parse(event.body ?? '{}');
  console.log('saving progress for', userId);
  // TODO: save { userId, known } to the table named in process.env.TABLE
  //       with db.send(new PutCommand({ TableName: ..., Item: ... }))
  return { statusCode: 200, body: JSON.stringify({ saved: false }) };
};
`;

const HANDLER_SOLUTION = `// index.mjs: a Lambda function that saves a learner's score.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const { userId, known } = JSON.parse(event.body ?? '{}');
  console.log('saving progress for', userId);
  await db.send(new PutCommand({ TableName: process.env.TABLE, Item: { userId, known } }));
  return { statusCode: 200, body: JSON.stringify({ saved: true }) };
};`;

const SAVE_EVENT = {
  version: '2.0', routeKey: 'POST /progress', rawPath: '/progress', rawQueryString: '',
  headers: { 'content-type': 'application/json' },
  requestContext: { http: { method: 'POST', path: '/progress' } },
  body: JSON.stringify({ userId: 'learner-42', known: 7 }),
  isBase64Encoded: false,
};

const tutorial = {
  slug: 'flashcard-page',
  number: 1,
  title: 'Build a flashcard page',
  situation: 'Engine demo: a tutorial writer is replacing this with the full tutorial. Your team wants a quick study tool: a page that flips cards, counts what you know and remembers it, plus a Lambda function that saves the score.',
  level: 'Beginner',
  hours: 3,
  free: true,
  skills: ['the DOM', 'events', 'localStorage', 'modules', 'async and await'],
  aws: ['Lambda', 'DynamoDB'],
  overview: 'A short demo of every practice feature: a live page with a console, a Lambda function tested with a sample event, and the Node.js console.',
  steps: [
    {
      id: 'flip-cards',
      kind: 'try',
      runtime: 'web',
      title: 'Flip a card, count what you know',
      minutes: 15,
      body: `The page below is live: edit \`app.js\`, then press **Run**. Type JavaScript at the \`>\` to talk to the page, for example:

\`\`\`js
document.querySelector('#front').textContent
\`\`\`

\`\`\`js
localStorage.getItem('known')
\`\`\``,
      task: 'Make **Flip** show the answer, and **I knew it** add 1 to the score, show it, and save it with `localStorage.setItem` so it survives a reload.',
      hint: 'Use `document.querySelector(\'#flip\').addEventListener(\'click\', () => { ... })`. Inside, `document.querySelector(\'#back\').hidden = false`.',
      solution: APP_SOLUTION,
      files: [
        { path: 'app.js', starter: APP_STARTER },
        { path: 'index.html', starter: PAGE_HTML },
        { path: 'style.css', starter: PAGE_CSS },
      ],
      scenario: { storage: { known: '2' } },
      probe: `await practice.click('#flip');
const shown = !document.querySelector('#back').hidden;
const before = Number(practice.storage().known ?? 0);
await practice.click('#known');
return { shown, before, after: Number(practice.storage().known ?? 0), score: practice.text('#score') };`,
      check: ({ result, probe, probeError }) => {
        if (result.errors.length) return null;
        if (probeError || !probe) return null;
        if (!probe.shown) return 'Flip doesn\'t show the answer yet: set the hidden property of #back to false when #flip is clicked.';
        if (probe.after !== probe.before + 1) return 'I knew it should add 1 and save it with localStorage.setItem(\'known\', known).';
        if (probe.score !== `Known: ${probe.after}`) return 'The score is saved, but #score doesn\'t show it yet.';
        return true;
      },
      success: 'Your page reacts to clicks and remembers progress. Press Run again: the score is still there, like after a reload.',
    },
    {
      id: 'save-score',
      kind: 'try',
      runtime: 'node',
      title: 'Save the score with a Lambda function',
      minutes: 15,
      body: 'This file is a Lambda function on Node.js 22. **Test with the sample event** calls `handler` the way API Gateway would, and shows the logs and the response.',
      task: 'Save `{ userId, known }` to the DynamoDB table named in `process.env.TABLE`, and return `{ saved: true }`.',
      hint: '`await db.send(new PutCommand({ TableName: process.env.TABLE, Item: { userId, known } }))`',
      solution: HANDLER_SOLUTION,
      files: [{ path: 'index.mjs', starter: HANDLER_STARTER, invoke: { event: SAVE_EVENT, timeout: 10 } }],
      scenario: { env: { TABLE: 'StudyProgress' }, aws: { dynamodb: { StudyProgress: { key: ['userId'], items: [] } } } },
      check: ({ invoke, aws }) => {
        if (!invoke || invoke.error) return null;
        const item = (aws.dynamodb.StudyProgress || []).find((i) => i.userId === 'learner-42');
        if (!item) return 'Nothing was saved to the StudyProgress table yet.';
        if (item.known !== 7) return 'Save the known count too: Item: { userId, known }.';
        if (JSON.parse(invoke.response?.body || '{}').saved !== true) return 'Saved! Now return { saved: true } in the body.';
        return true;
      },
      success: 'That\'s the same call your real function will make: the practice account answered exactly like DynamoDB does.',
    },
    {
      id: 'who-am-i',
      kind: 'try',
      runtime: 'node',
      title: 'Ask AWS who you are',
      minutes: 5,
      body: `The console takes JavaScript one line at a time, \`await\` included:

\`\`\`js
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
const sts = new STSClient({});
\`\`\``,
      task: 'Send a `GetCallerIdentityCommand` and show the account number.',
      hint: '`(await sts.send(new GetCallerIdentityCommand({}))).Account`',
      solution: "import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';\n(await new STSClient({}).send(new GetCallerIdentityCommand({}))).Account",
      scenario: {},
      check: ({ result }) => (result.stdout.includes('111122223333') ? true : null),
    },
  ],
};

export default tutorial;
