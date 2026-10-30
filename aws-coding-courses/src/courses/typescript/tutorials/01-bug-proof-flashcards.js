// Tutorial 1 (free): DEMO of the TypeScript practice engine. A tutorial writer
// replaces this with the real "Make the flashcard page bug-proof" tutorial;
// until then it proves each feature end to end (the course tests run each
// task's answer through its check).

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Flashcards</title><link rel="stylesheet" href="style.css"></head>
<body>
  <h1 id="count"></h1>
  <ul id="list"></ul>
  <script src="app.js"></script>
</body>
</html>`;

const APP_STARTER = `// app.ts: list the cards. TypeScript found a bug: read the error below.
interface Card {
  front: string;
  back: string;
  tags: string[];
}

const cards: Card[] = [
  { front: 'Amazon S3', back: 'Object storage', tags: ['storage'] },
  { front: 'AWS Lambda', back: 'Serverless functions', tags: ['compute'] },
];

const list = document.querySelector('#list');
for (const card of cards) {
  const item = document.createElement('li');
  item.textContent = \`\${card.fornt}: \${card.back}\`;
  list.append(item);
}
document.querySelector('#count')!.textContent = \`\${cards.length} cards\`;
`;

const APP_SOLUTION = `// app.ts: list the cards. TypeScript found a bug: read the error below.
interface Card {
  front: string;
  back: string;
  tags: string[];
}

const cards: Card[] = [
  { front: 'Amazon S3', back: 'Object storage', tags: ['storage'] },
  { front: 'AWS Lambda', back: 'Serverless functions', tags: ['compute'] },
];

const list = document.querySelector('#list');
if (list) {
  for (const card of cards) {
    const item = document.createElement('li');
    item.textContent = \`\${card.front}: \${card.back}\`;
    list.append(item);
  }
}
document.querySelector('#count')!.textContent = \`\${cards.length} cards\`;`;

const HANDLER_STARTER = `// index.ts: return one learner's progress.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = event.pathParameters.userId;
  const out = await db.send(new GetCommand({ TableName: 'StudyProgress', Key: { userId } }));
  return { statusCode: 200, body: JSON.stringify(out.Item) };
};
`;

const HANDLER_SOLUTION = `// index.ts: return one learner's progress.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = event.pathParameters?.userId;
  if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  const out = await db.send(new GetCommand({ TableName: 'StudyProgress', Key: { userId } }));
  if (!out.Item) return { statusCode: 404, body: JSON.stringify({ error: 'not found' }) };
  return { statusCode: 200, body: JSON.stringify(out.Item) };
};`;

const STACK_STARTER = `// app.ts: the study tracker's table, described as code.
import { App, Stack, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const app = new App();
const stack = new Stack(app, 'StudyTracker');

// TODO: a dynamodb.Table called 'Progress' with partition key userId (a string),
//       billingMode PAY_PER_REQUEST and removalPolicy DESTROY,
//       and a CfnOutput called 'TableName' with its tableName

app.synth();
`;

const STACK_SOLUTION = `// app.ts: the study tracker's table, described as code.
import { App, Stack, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const app = new App();
const stack = new Stack(app, 'StudyTracker');

const table = new dynamodb.Table(stack, 'Progress', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.DESTROY,
});
new CfnOutput(stack, 'TableName', { value: table.tableName });

app.synth();`;

const tutorial = {
  slug: 'bug-proof-flashcards',
  number: 1,
  title: 'Make the flashcard page bug-proof',
  situation: 'Engine demo: a tutorial writer is replacing this with the full tutorial. A typo broke the flashcard page in production. With TypeScript, the editor catches that kind of mistake before anyone sees it.',
  level: 'Beginner',
  hours: 3,
  free: true,
  skills: ['types', 'interfaces', 'strict mode', 'null checks'],
  aws: ['Lambda', 'DynamoDB', 'AWS CDK'],
  overview: 'A short demo of every TypeScript practice feature: type errors in a live page, a typed Lambda function, and a CDK stack synthesized into a template.',
  steps: [
    {
      id: 'fix-the-typo',
      kind: 'try',
      runtime: 'web',
      title: 'Read the error, fix the bug',
      minutes: 10,
      body: 'Press **Run**: TypeScript checks `app.ts` in strict mode before the page runs, and lists every error in the console with the line and a tip.',
      task: 'Fix both type errors in `app.ts` so it has **zero errors** and the list shows each card\'s front and back.',
      hint: 'One is a typo in a property name. The other: `querySelector` can find nothing, so `list` might be null. Wrap the loop in `if (list) { ... }`.',
      solution: APP_SOLUTION,
      files: [
        { path: 'app.ts', starter: APP_STARTER },
        { path: 'index.html', starter: PAGE_HTML },
        { path: 'style.css', starter: 'body { font-family: system-ui, sans-serif; margin: 2rem; }' },
      ],
      scenario: {},
      probe: 'return practice.all("#list li").map((li) => li.textContent);',
      check: ({ diagnostics, probe }) => {
        if (diagnostics.length) return `TypeScript still reports ${diagnostics.length} error${diagnostics.length === 1 ? '' : 's'}: fix ${diagnostics.length === 1 ? 'it' : 'them'} and run again.`;
        if (!Array.isArray(probe) || probe.length !== 2 || probe.some((t) => t.includes('undefined'))) return 'No type errors, but the list isn\'t right yet.';
        return true;
      },
      success: 'Zero errors. The typo would have shipped as "undefined" on the page; TypeScript stopped it in the editor.',
    },
    {
      id: 'typed-handler',
      kind: 'try',
      runtime: 'node',
      title: 'A typed Lambda function',
      minutes: 15,
      body: 'With types for the event and the response, TypeScript knows `pathParameters` might be missing and that `out.Item` might be undefined.',
      task: 'Fix the type error: return **400** when there\'s no `userId`, **404** when the item isn\'t found, and the item with **200** otherwise.',
      hint: '`event.pathParameters?.userId`, then `if (!userId) return { statusCode: 400, ... }`.',
      solution: HANDLER_SOLUTION,
      files: [{ path: 'index.ts', starter: HANDLER_STARTER, invoke: { event: { version: '2.0', routeKey: 'GET /progress/{userId}', rawPath: '/progress/learner-42', pathParameters: { userId: 'learner-42' }, headers: {}, requestContext: { http: { method: 'GET' } }, isBase64Encoded: false }, timeout: 10 } }],
      scenario: { aws: { dynamodb: { StudyProgress: { key: ['userId'], items: [{ userId: 'learner-42', known: 7 }] } } } },
      probe: `const missing = await mod.handler({ ...practice.apiEvent({ path: '/progress' }) }, practice.context());
const unknown = await mod.handler({ ...practice.apiEvent({ path: '/progress/x', pathParameters: { userId: 'nobody' } }) }, practice.context());
return [missing.statusCode, unknown.statusCode];`,
      check: ({ diagnostics, invoke, probe }) => {
        if (diagnostics.length) return `Fix the type error${diagnostics.length === 1 ? '' : 's'} first: TypeScript is pointing at a real bug.`;
        if (!invoke || invoke.error) return null;
        if (invoke.response?.statusCode !== 200) return 'The sample event should get a 200 with the item.';
        if (!Array.isArray(probe)) return null;
        if (probe[0] !== 400) return 'With no userId in the path, return statusCode 400.';
        if (probe[1] !== 404) return 'When the item isn\'t found, return statusCode 404.';
        return true;
      },
    },
    {
      id: 'table-as-code',
      kind: 'try',
      runtime: 'node',
      title: 'Describe the table as code',
      minutes: 15,
      body: 'The AWS Cloud Development Kit turns TypeScript into a CloudFormation template. Run the file: the console shows the template `cdk synth` would produce.',
      task: 'Add the `Progress` table (partition key `userId`, a string; pay per request; destroyed with the stack) and a `TableName` output.',
      hint: 'new dynamodb.Table(stack, \'Progress\', { partitionKey: { name: \'userId\', type: dynamodb.AttributeType.STRING }, ... })',
      solution: STACK_SOLUTION,
      files: [{ path: 'app.ts', starter: STACK_STARTER, runLabel: 'Synthesize (cdk synth)', command: 'npx cdk synth' }],
      scenario: {},
      check: ({ diagnostics, cdk }) => {
        if (diagnostics.length) return null;
        const t = cdk?.stacks?.StudyTracker;
        if (!t) return null;
        const table = Object.values(t.Resources).find((r) => r.Type === 'AWS::DynamoDB::Table');
        if (!table) return 'The template has no AWS::DynamoDB::Table yet.';
        if (table.Properties.KeySchema?.[0]?.AttributeName !== 'userId') return 'The partition key should be userId.';
        if (table.Properties.BillingMode !== 'PAY_PER_REQUEST') return 'Use billingMode: dynamodb.BillingMode.PAY_PER_REQUEST.';
        if (table.DeletionPolicy !== 'Delete') return 'Add removalPolicy: RemovalPolicy.DESTROY, so practice tables don\'t linger.';
        if (!t.Outputs?.TableName) return 'Add a CfnOutput called TableName.';
        return true;
      },
    },
  ],
};

export default tutorial;
