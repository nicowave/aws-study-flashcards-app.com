// Tutorial 3: the whole study tracker as code, with the AWS Cloud Development
// Kit, deployed by GitHub Actions on every push.
//
// Shared with JavaScript tutorial 4, which builds the same app by hand:
// a Cognito user pool and app client, an HTTP API with a JWT authorizer,
// GET /progress and PUT /progress/{deckId} to one Lambda function
// (nodejs22.x, lambda/index.mjs, index.handler, TABLE_NAME), and the
// StudyProgress table (userId + deckId, on demand).

// ---------------------------------------------------------------------------
// Code the learner builds up
// ---------------------------------------------------------------------------

const HEADER = `// study-tracker.ts: the study tracker, described as code.
// (A real CDK project keeps the stack class in lib/ and the last three lines
// in bin/. The Build step sets it up that way.)`;

const TABLE_STARTER = `${HEADER}
import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // TODO: a dynamodb.Table with the id 'Progress' and tableName 'StudyProgress':
    //   partition key userId and sort key deckId (both strings),
    //   billed per request, and removed with the stack (practice only)

    // TODO: a CfnOutput called 'TableName' with the table's tableName
  }
}

const app = new App();
new StudyTrackerStack(app, 'StudyTracker');
app.synth();
`;

const TABLE_BODY = `    const table = new dynamodb.Table(this, 'Progress', {
      tableName: 'StudyProgress',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deckId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // practice only: production keeps data
    });`;

const TABLE_SOLUTION = `${HEADER}
import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

${TABLE_BODY}

    new CfnOutput(this, 'TableName', { value: table.tableName });
  }
}

const app = new App();
new StudyTrackerStack(app, 'StudyTracker');
app.synth();`;

const API_IMPORTS = `import { App, Stack, StackProps, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';`;

const APP_FOOTER = `const app = new App();
new StudyTrackerStack(app, 'StudyTracker');
app.synth();`;

// Four mistakes the compiler catches before anything is deployed
const TYPES_STARTER = `${HEADER}
${API_IMPORTS}

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Progress', {
      tableName: 'StudyProgress',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deckId', type: dynamodb.AttributeType.STRING },
      billingMode: 'PAY_PER_REQUEST',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // The code is in the folder lambda/, file index.mjs, function handler
    const fn = new lambda.Function(this, 'ProgressFunction', {
      runtime: lambda.Runtime.NODEJS_22,
      code: lambda.Code.fromAsset('lambda'),
      timeout: Duration.seconds(10),
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(fn);

    const api = new HttpApi(this, 'StudyApi');
    api.addRoutes({
      path: '/progress',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('Progress', fn),
    });

    new CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

${APP_FOOTER}
`;

const FUNCTION_BODY = `    // The code is in the folder lambda/, file index.mjs, function handler
    const fn = new lambda.Function(this, 'ProgressFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: Duration.seconds(10),
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(fn);`;

const TYPES_SOLUTION = `${HEADER}
${API_IMPORTS}

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

${TABLE_BODY}

${FUNCTION_BODY}

    const api = new HttpApi(this, 'StudyApi');
    api.addRoutes({
      path: '/progress',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('Progress', fn),
    });

    new CfnOutput(this, 'ApiUrl', { value: api.url! });
  }
}

${APP_FOOTER}`;

const WHOLE_IMPORTS = `${API_IMPORTS}
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cognito from 'aws-cdk-lib/aws-cognito';`;

const CORS = `    // The study page calls the API from the browser, so allow it (CORS)
    const api = new HttpApi(this, 'StudyApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.PUT],
        allowHeaders: ['authorization', 'content-type'],
      },
    });
    const integration = new HttpLambdaIntegration('Progress', fn);`;

export const WHOLE_STARTER = `${HEADER}
${WHOLE_IMPORTS}

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

${TABLE_BODY}

${FUNCTION_BODY}

    // TODO 1: a cognito.UserPool 'Users': people can sign themselves up and
    //         sign in with their email address (verified automatically).
    //         Removed with the stack (practice only).

    // TODO 2: its app client 'WebClient' (pool.addClient): no secret, and the
    //         userPassword and userSrp sign-in flows

    // TODO 3: an HttpUserPoolAuthorizer 'StudyAuth' for the pool and client

${CORS}
    api.addRoutes({ path: '/progress', methods: [HttpMethod.GET], integration });

    // TODO 4: require the authorizer on GET /progress, and add
    //         PUT /progress/{deckId} with the same integration and authorizer

    new CfnOutput(this, 'ApiUrl', { value: api.url! });
    // TODO 5: outputs 'UserPoolId' and 'UserPoolClientId' for the web page
  }
}

${APP_FOOTER}
`;

export const WHOLE_SOLUTION = `${HEADER}
${WHOLE_IMPORTS}

export class StudyTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

${TABLE_BODY}

${FUNCTION_BODY}

    const pool = new cognito.UserPool(this, 'Users', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: RemovalPolicy.DESTROY, // practice only
    });
    const client = pool.addClient('WebClient', {
      generateSecret: false, // a web page can't keep a secret
      authFlows: { userPassword: true, userSrp: true },
    });
    const authorizer = new HttpUserPoolAuthorizer('StudyAuth', pool, { userPoolClients: [client] });

${CORS}
    api.addRoutes({ path: '/progress', methods: [HttpMethod.GET], integration, authorizer });
    api.addRoutes({ path: '/progress/{deckId}', methods: [HttpMethod.PUT], integration, authorizer });

    new CfnOutput(this, 'ApiUrl', { value: api.url! });
    new CfnOutput(this, 'UserPoolId', { value: pool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });
  }
}

${APP_FOOTER}`;

const TRUST_HEAD = `// trust-policy.ts: who may use the role GitHub Actions deploys with.
const PROVIDER = 'token.actions.githubusercontent.com';

interface WebIdentityStatement {
  Effect: 'Allow' | 'Deny';
  Principal: { Federated: string };
  Action: string;
  Condition: Record<string, Record<string, string>>;
}
interface TrustPolicy {
  Version: '2012-10-17';
  Statement: WebIdentityStatement[];
}
`;

const TRUST_STARTER = `${TRUST_HEAD}
// repo is "owner/name", like "nicotek/study-tracker"
export function githubTrustPolicy(accountId: string, repo: string): TrustPolicy {
  return {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'allow',
      Principal: { Federated: \`arn:aws:iam::\${accountId}:oidc-provider/\${PROVIDER}\` },
      Action: 'sts:AssumeRole', // TODO: GitHub signs in with a web identity token
      Condition: {
        StringEquals: { [\`\${PROVIDER}:aud\`]: 'sts.amazonaws.com' },
        // TODO: this lets ANY repository on GitHub deploy to your account.
        //       Allow only pushes to main in the repo passed in.
        StringLike: { [\`\${PROVIDER}:sub\`]: 'repo:*' },
      },
    }],
  };
}

console.log(JSON.stringify(githubTrustPolicy('111122223333', 'nicotek/study-tracker'), null, 2));
`;

const TRUST_SOLUTION = `${TRUST_HEAD}
// repo is "owner/name", like "nicotek/study-tracker"
export function githubTrustPolicy(accountId: string, repo: string): TrustPolicy {
  return {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Federated: \`arn:aws:iam::\${accountId}:oidc-provider/\${PROVIDER}\` },
      Action: 'sts:AssumeRoleWithWebIdentity',
      Condition: {
        StringEquals: {
          [\`\${PROVIDER}:aud\`]: 'sts.amazonaws.com',
          [\`\${PROVIDER}:sub\`]: \`repo:\${repo}:ref:refs/heads/main\`,
        },
      },
    }],
  };
}

console.log(JSON.stringify(githubTrustPolicy('111122223333', 'nicotek/study-tracker'), null, 2));`;

// ---------------------------------------------------------------------------
// Reading the synthesized template
// ---------------------------------------------------------------------------

const stackOf = (cdk) => cdk?.stacks?.StudyTracker || null;
const resourcesOf = (t, type) => Object.entries(t.Resources || {}).filter(([, r]) => r.Type === type);
const isRefTo = (v, id) => v && typeof v === 'object' && v.Ref === id;

const typeErrors = (diagnostics) => (diagnostics.length
  ? `The compiler still reports ${diagnostics.length} error${diagnostics.length === 1 ? '' : 's'} (in red in the console). Fix ${diagnostics.length === 1 ? 'it' : 'them'} before deploying anything.`
  : null);

const checkTable = (t) => {
  const tables = resourcesOf(t, 'AWS::DynamoDB::Table');
  if (!tables.length) return { error: 'The template has no AWS::DynamoDB::Table yet.' };
  const [id, table] = tables[0];
  const p = table.Properties;
  if (p.TableName !== 'StudyProgress') return { error: 'Give the table tableName: \'StudyProgress\', the name the function and the JavaScript course use.' };
  const keys = (p.KeySchema || []).map((k) => `${k.AttributeName}:${k.KeyType}`).join(',');
  if (keys !== 'userId:HASH,deckId:RANGE') return { error: 'The keys should be partitionKey userId and sortKey deckId.' };
  if ((p.AttributeDefinitions || []).some((a) => a.AttributeType !== 'S')) return { error: 'Both keys are strings: dynamodb.AttributeType.STRING.' };
  if (p.BillingMode !== 'PAY_PER_REQUEST') return { error: 'Without billingMode the table is provisioned (and billed every hour). Use dynamodb.BillingMode.PAY_PER_REQUEST.' };
  if (table.DeletionPolicy !== 'Delete') return { error: 'Add removalPolicy: RemovalPolicy.DESTROY, so the practice table goes away with the stack.' };
  return { id };
};

const checkFunction = (t, tableId) => {
  const fns = resourcesOf(t, 'AWS::Lambda::Function');
  if (!fns.length) return 'The template has no AWS::Lambda::Function.';
  const [, fn] = fns[0];
  const p = fn.Properties;
  if (p.Runtime !== 'nodejs22.x') return 'The function should run on Node.js 22: lambda.Runtime.NODEJS_22_X.';
  if (p.Handler !== 'index.handler') return 'The handler is the file name and the exported function: \'index.handler\'.';
  if (!isRefTo(p.Environment?.Variables?.TABLE_NAME, tableId)) return 'Pass the table\'s name to the function: environment: { TABLE_NAME: table.tableName }.';
  const statements = resourcesOf(t, 'AWS::IAM::Policy').flatMap(([, r]) => r.Properties.PolicyDocument.Statement);
  const forTable = statements.find((s) => JSON.stringify(s.Resource).includes(`"${tableId}"`));
  const actions = [].concat(forTable?.Action || []);
  if (!actions.includes('dynamodb:PutItem') || !actions.includes('dynamodb:Query')) return 'The function needs read and write access to the table: table.grantReadWriteData(fn).';
  return null;
};

const tutorial = {
  slug: 'deploy-with-code',
  number: 3,
  title: 'Deploy everything with code',
  situation: '"Can we rebuild this in another account by Friday?" The study tracker was clicked together in the AWS console, and nobody remembers every setting. You describe the whole app in TypeScript with the AWS Cloud Development Kit, so one command creates it anywhere, and every push to GitHub updates it.',
  level: 'Advanced',
  hours: 6,
  skills: ['infrastructure as code', 'classes', 'typed props', 'non-null assertions', 'CI/CD'],
  aws: ['AWS CDK', 'CloudFormation', 'Cognito', 'API Gateway', 'Lambda', 'DynamoDB', 'IAM', 'GitHub Actions'],
  overview: 'You\'ll learn how infrastructure as code works, then describe the study tracker\'s table, function, API and sign-in as a CDK stack. The compiler catches wrong settings before anything is deployed, grants write the permissions for you, and a GitHub Actions workflow deploys every push to main, signing in to AWS without any stored keys.',
  steps: [
    {
      id: 'why-code',
      kind: 'read',
      title: 'Infrastructure as code',
      minutes: 10,
      body: `The study tracker from the JavaScript course has six parts: a table, a function, its role, an API, a sign-in service and the settings that tie them together. Built by clicking in the console, the only record of it is the account itself. Rebuilding it means remembering dozens of choices, and someone will get one wrong.

**Infrastructure as code** means writing those choices down as code, in Git, like any other code:

- **Repeatable.** The same code builds the same app in a test account, a second region, or a new company account. That's Friday's request, done.
- **Reviewable.** A change to the infrastructure is a pull request someone can read, comment on and approve before it happens.
- **No drift.** When the code is the source of truth, nobody fixes production by hand and forgets to tell anyone. If someone does, it shows up as a difference.
- **Undoable.** The previous version is one \`git revert\` away.

### CloudFormation, in one paragraph

AWS CloudFormation is the AWS service that does the building. You give it a **template**, a JSON or YAML file that lists **resources** (a table, a function, a role) and their settings. It creates them together as a **stack**, in the right order. To change the stack, you give it a new template; it works out the difference as a **change set**, which you can review first, then applies it. If anything fails halfway, it **rolls back** to the last working version on its own. Deleting the stack deletes everything in it.

### Where the CDK fits

Templates are long and repetitive: the study tracker is about 300 lines of JSON. The **AWS Cloud Development Kit (CDK)** lets you write it in TypeScript instead, about 50 lines. The CDK turns your code into a CloudFormation template (\`cdk synth\`), and CloudFormation does the building (\`cdk deploy\`).

Writing it in TypeScript means everything from the last two tutorials works on your infrastructure too: the editor knows every setting, and the compiler catches a wrong one before anything is deployed.`,
    },
    {
      id: 'cdk-concepts',
      kind: 'read',
      runtime: 'node',
      title: 'Apps, stacks and constructs',
      minutes: 15,
      body: `A CDK program is a tree of **constructs**: objects that stand for pieces of cloud infrastructure.

- The **App** is the root.
- A **Stack** is one CloudFormation stack: everything that's deployed together.
- Inside a stack are the resources: a \`Table\`, a \`Function\`, an \`HttpApi\`.

Each construct takes three things: its **scope** (the parent it belongs to), an **id** (a name unique within that parent) and **props**, an object with its settings. Press **Run**: the console shows the template this program becomes.

\`\`\`ts
import { App, Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const app = new App();
const stack = new Stack(app, 'Demo');
new dynamodb.Table(stack, 'Notes', {
  partitionKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
});
app.synth().stacks[0].template
\`\`\`

Four lines of TypeScript became a full \`AWS::DynamoDB::Table\` resource. Look at its name in the template: \`Notes\` plus a code. That's its **logical ID**, which CloudFormation uses to recognize it next time. If you change a construct's id, CloudFormation sees a new table and deletes the old one, data and all. **Choose ids once, and don't rename them.**

The CDK also filled in settings you didn't choose: \`ProvisionedThroughput\` (capacity you pay for every hour) and \`DeletionPolicy: Retain\` (keep the table if the stack is deleted). Safe defaults, but worth knowing.

### Props are typed

Every construct's props are a TypeScript interface. Mistype a setting, forget a required one, or use the wrong kind of value, and you get a red error in the editor, before \`cdk deploy\` spends five minutes finding it out:

\`\`\`ts
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
const props: dynamodb.TableProps = {
  partitionKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
};
props
\`\`\`

> Console lines aren't type-checked, only the editor's files are. That's where the compiler earns its keep.

### Levels of constructs

| Level | Looks like | What you get |
|---|---|---|
| **L1** | \`new CfnTable(...)\` | Exactly one CloudFormation resource. Every setting is yours to fill in. |
| **L2** | \`new Table(...)\` | The same resource with good defaults, helper methods like \`grantReadData\`, and fewer ways to get it wrong. |
| **L3** (patterns) | \`new LambdaRestApi(...)\` | Several resources wired together for a common job. |

You'll use L2 constructs, like most CDK code does.

### Two settings to know

- **\`Duration\`**: times are written \`Duration.seconds(10)\` or \`Duration.minutes(5)\`, never a bare number, so nobody wonders whether \`10\` means seconds or minutes.
- **\`RemovalPolicy\`**: what happens to a table, bucket or user pool when the stack is deleted. The default for things that hold data is \`RETAIN\`: the stack goes, the data stays. For practice you'll use \`DESTROY\`, so cleanup is one command. **In production, keep \`RETAIN\`.** A deleted stack shouldn't take your customers' data with it.`,
      scenario: {},
    },
    {
      id: 'table-as-code',
      kind: 'try',
      runtime: 'node',
      title: 'The table, as code',
      minutes: 15,
      body: `Real CDK code puts each stack in a **class** that extends \`Stack\`, with the resources in its constructor. \`this\` is the stack, so it's the scope for everything inside.

\`\`\`text
App
└─ StudyTracker  (a StudyTrackerStack)
   └─ Progress    (a dynamodb.Table)
\`\`\`

A **\`CfnOutput\`** is a value the stack reports after it's deployed, like the table's real name. Names, addresses and IDs only exist after deploy, so in your code they're placeholders (they print like \`\${Token[TOKEN.12]}\`), and CloudFormation fills them in.

Press **Synthesize** to run \`cdk synth\`: the console shows the template.`,
      task: 'Add the `Progress` table: `tableName` `StudyProgress`, partition key `userId` and sort key `deckId` (both strings), billed per request, removed with the stack. Then add a `CfnOutput` called `TableName` with its `tableName`. The compiler must report no errors.',
      hint: 'Inside the constructor: `const table = new dynamodb.Table(this, \'Progress\', { tableName: \'StudyProgress\', partitionKey: { name: \'userId\', type: dynamodb.AttributeType.STRING }, sortKey: { ... }, billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, removalPolicy: RemovalPolicy.DESTROY });` then `new CfnOutput(this, \'TableName\', { value: table.tableName });`',
      solution: TABLE_SOLUTION,
      files: [{ path: 'study-tracker.ts', starter: TABLE_STARTER, runLabel: 'Synthesize (cdk synth)', command: 'npx cdk synth' }],
      scenario: {},
      check: ({ diagnostics, cdk, result }) => {
        const t = stackOf(cdk);
        if (!t || result.error) return null;
        const errors = typeErrors(diagnostics);
        if (errors) return errors;
        if (!resourcesOf(t, 'AWS::DynamoDB::Table').length) return null;
        const table = checkTable(t);
        if (table.error) return table.error;
        if (!t.Outputs?.TableName) return 'The table is right. Now add the output: `new CfnOutput(this, \'TableName\', { value: table.tableName });`';
        return true;
      },
      success: 'Look at the `TableName` output in the template: a `Ref` to the table. CloudFormation replaces it with the real name when it deploys. Your code never has to know it.',
    },
    {
      id: 'functions-and-grants',
      kind: 'read',
      runtime: 'node',
      title: 'A function, an API, and permissions you don\'t write',
      minutes: 15,
      body: `The rest of the app is three more constructs, each with typed props.

**The function.** \`lambda.Function\` needs a runtime, the handler (\`file.function\`: \`index.handler\` means the \`handler\` export of \`index.mjs\`), and where the code is. \`Code.fromAsset('lambda')\` zips the \`lambda\` folder and uploads it at deploy time.

**The permissions.** A Lambda function can do nothing until its role allows it. Writing that policy by hand is where people either forget an action or give up and allow \`dynamodb:*\` on everything. The CDK writes it for you, for just this table:

\`\`\`ts
import { App, Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const app = new App();
const stack = new Stack(app, 'GrantDemo');
const table = new dynamodb.Table(stack, 'Notes', { partitionKey: { name: 'noteId', type: dynamodb.AttributeType.STRING } });
const fn = new lambda.Function(stack, 'Reader', {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline('export const handler = async () => "hi";'),
});
table.grantReadData(fn);
Object.values(app.synth().stacks[0].template.Resources).filter((r) => r.Type === 'AWS::IAM::Policy')[0].Properties.PolicyDocument
\`\`\`

One line, \`grantReadData\`, became a policy with just the read actions, on just that table's ARN. That's **least privilege**, without typing a single action name. There's \`grantWriteData\` and \`grantReadWriteData\` too, and the same idea on buckets, queues and topics.

**The API.** An \`HttpApi\` is an Amazon API Gateway HTTP API. Each route sends a method and path to an **integration**, here the function:

\`\`\`text
api.addRoutes({
  path: '/progress',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration('Progress', fn),
});
\`\`\`

The CDK also adds the permission that lets API Gateway call the function. That's another thing people forget in the console.

### When the type says "maybe"

\`api.url\` has the type \`string | undefined\`: an API can be set up without a default address, so TypeScript can't promise there is one. A \`CfnOutput\` needs a \`string\`, so the compiler refuses. You know this API has an address, so tell it so with a **non-null assertion**, a \`!\` after the value: \`api.url!\`. Use \`!\` only when you're sure. It switches the check off.`,
      scenario: {},
    },
    {
      id: 'fix-the-types',
      kind: 'try',
      runtime: 'node',
      title: 'Let the compiler review it',
      minutes: 15,
      body: 'A colleague added the function and the API, and it "deploys fine on my machine". Press **Synthesize**: the compiler disagrees, four times. Each error says the file, line and column, what\'s wrong, and often a suggestion. Fix them one at a time, from the top.',
      task: 'Fix all four type errors, so the compiler reports none and the template has the function on Node.js 22 with the handler `index.handler`, the table\'s name in its environment, read and write access to the table, and an `ApiUrl` output.',
      hint: '1: `dynamodb.BillingMode.PAY_PER_REQUEST`, not the text. 2: the error suggests `NODEJS_22_X`. 3: the function is missing `handler: \'index.handler\'`. 4: `value: api.url!`.',
      solution: TYPES_SOLUTION,
      files: [{ path: 'study-tracker.ts', starter: TYPES_STARTER, runLabel: 'Synthesize (cdk synth)', command: 'npx cdk synth' }],
      scenario: {},
      check: ({ diagnostics, cdk, result, kind }) => {
        if (kind !== 'run') return null;
        const errors = typeErrors(diagnostics);
        if (errors) return errors;
        const t = stackOf(cdk);
        if (!t || result.error) return null;
        const table = checkTable(t);
        if (table.error) return table.error;
        const fn = checkFunction(t, table.id);
        if (fn) return fn;
        if (!t.Outputs?.ApiUrl) return 'Keep the ApiUrl output: the web page needs the address.';
        return true;
      },
      success: 'Four bugs, found in a second, without deploying anything. In the console, each would have been a failed deployment and a rollback, one at a time.',
    },
    {
      id: 'whole-app',
      kind: 'try',
      runtime: 'node',
      title: 'Add sign-in: the whole app',
      minutes: 30,
      body: `The study tracker keeps each person's progress, so the API must know who's calling. Three constructs do that:

- **\`cognito.UserPool\`**: an Amazon Cognito user pool, the list of people who can sign in, with its rules (who can sign up, what they sign in with).
- **An app client**, from \`pool.addClient(...)\`: the settings for one app that signs people in. A web page can't keep a secret (anyone can read its code), so it gets \`generateSecret: false\`.
- **\`HttpUserPoolAuthorizer\`**: tells the API to accept only requests with a valid sign-in token (a **JWT**, JSON Web Token) from that pool and client. It checks the token's issuer (your pool) and its audience (your client) before your function ever runs, and passes the person's ID to the function as \`claims.sub\`.

Pass the authorizer to each route with \`authorizer\`. A route without one is open to the whole internet.

\`HttpUserPoolAuthorizer\` comes from \`aws-cdk-lib/aws-apigatewayv2-authorizers\`. Its props are typed too: try writing \`userPoolClient\` instead of \`userPoolClients\`, and see what the compiler says.`,
      task: 'Finish the TODOs: a user pool where people sign themselves up with their email, an app client with no secret and the `userPassword` and `userSrp` flows, an authorizer, both routes (`GET /progress` and `PUT /progress/{deckId}`) behind it, and the `UserPoolId` and `UserPoolClientId` outputs. No compiler errors.',
      hint: '`const pool = new cognito.UserPool(this, \'Users\', { selfSignUpEnabled: true, signInAliases: { email: true }, autoVerify: { email: true }, removalPolicy: RemovalPolicy.DESTROY });` then `const client = pool.addClient(\'WebClient\', { generateSecret: false, authFlows: { userPassword: true, userSrp: true } });` and `const authorizer = new HttpUserPoolAuthorizer(\'StudyAuth\', pool, { userPoolClients: [client] });`. Add `authorizer` to each `addRoutes`.',
      solution: WHOLE_SOLUTION,
      files: [{ path: 'study-tracker.ts', starter: WHOLE_STARTER, runLabel: 'Synthesize (cdk synth)', command: 'npx cdk synth' }],
      scenario: {},
      check: ({ diagnostics, cdk, result }) => {
        const t = stackOf(cdk);
        if (!t || result.error) return null;
        const errors = typeErrors(diagnostics);
        if (errors) return errors;
        const table = checkTable(t);
        if (table.error) return table.error;
        const fn = checkFunction(t, table.id);
        if (fn) return fn;
        const pools = resourcesOf(t, 'AWS::Cognito::UserPool');
        if (!pools.length) return null;
        const pool = pools[0][1].Properties;
        if (pool.AdminCreateUserConfig?.AllowAdminCreateUserOnly !== false) return 'People should be able to sign themselves up: selfSignUpEnabled: true.';
        if (!(pool.UsernameAttributes || []).includes('email')) return 'Let people sign in with their email: signInAliases: { email: true }.';
        const clients = resourcesOf(t, 'AWS::Cognito::UserPoolClient');
        if (!clients.length) return 'Add the app client: const client = pool.addClient(\'WebClient\', { ... }).';
        const [clientId, clientRes] = clients[0];
        if (clientRes.Properties.GenerateSecret) return 'A web page can\'t keep a secret: generateSecret: false.';
        const flows = clientRes.Properties.ExplicitAuthFlows || [];
        if (!flows.includes('ALLOW_USER_PASSWORD_AUTH') || !flows.includes('ALLOW_USER_SRP_AUTH')) return 'Turn on both sign-in flows: authFlows: { userPassword: true, userSrp: true }.';
        const auths = resourcesOf(t, 'AWS::ApiGatewayV2::Authorizer');
        if (!auths.length) return 'Create the HttpUserPoolAuthorizer, and pass it to the routes with authorizer.';
        if (!(auths[0][1].Properties.JwtConfiguration?.Audience || []).some((a) => isRefTo(a, clientId))) return 'Give the authorizer your client: { userPoolClients: [client] }.';
        const routes = Object.fromEntries(resourcesOf(t, 'AWS::ApiGatewayV2::Route').map(([, r]) => [r.Properties.RouteKey, r.Properties]));
        if (!routes['PUT /progress/{deckId}']) return 'Add the second route: path \'/progress/{deckId}\', method HttpMethod.PUT.';
        const open = ['GET /progress', 'PUT /progress/{deckId}'].filter((k) => routes[k] && routes[k].AuthorizationType !== 'JWT');
        if (open.length) return `${open.join(' and ')} ${open.length === 1 ? 'is' : 'are'} open to anyone. Pass authorizer to ${open.length === 1 ? 'that route' : 'both routes'}.`;
        if (!routes['GET /progress']) return 'Keep the GET /progress route.';
        const missing = ['ApiUrl', 'UserPoolId', 'UserPoolClientId'].filter((o) => !t.Outputs?.[o]);
        if (missing.length) return `Add the output${missing.length === 1 ? '' : 's'} ${missing.join(' and ')}: the web page needs ${missing.length === 1 ? 'it' : 'them'} to sign people in.`;
        return true;
      },
      success: 'That\'s the whole study tracker: table, function, role and policy, API, routes, authorizer, user pool and client. About 60 lines of TypeScript became 20 CloudFormation resources. Scroll through the template: every one of them would have been a console page to fill in.',
    },
    {
      id: 'deploy',
      kind: 'read',
      title: 'Synth, diff, deploy',
      minutes: 12,
      body: `On your own computer, four commands take the stack to AWS. The Build step walks through them for real.

\`\`\`sh
npx cdk bootstrap        # once per account and region
npx cdk synth            # the template, like the practice console
npx cdk diff             # what would change
npx cdk deploy           # do it
\`\`\`

**\`cdk bootstrap\`** sets up what the CDK needs in an account and region, once: an S3 bucket for uploaded code (like your \`lambda\` folder) and a few IAM roles that deployments use. It's a CloudFormation stack too, called \`CDKToolkit\`.

**\`cdk diff\`** compares your code with what's deployed. **Read it before every deploy.** It's your change set preview, and the line to look for is any resource marked for **replacement** or **destroy**:

\`\`\`console
Resources
[~] AWS::DynamoDB::Table Progress ProgressA1B2C3D4 replace
 └─ [~] KeySchema (requires replacement)
\`\`\`

That says changing the table's keys means a new table, and the old one, with its data, is deleted. Some settings can't be changed in place. The diff tells you before it happens, not after.

**\`cdk deploy\`** synthesizes, uploads the code, and asks CloudFormation to apply the change set. If the change adds or widens permissions, it shows them and asks you to confirm. When it finishes, it prints the outputs:

\`\`\`console
Outputs:
StudyTracker.ApiUrl = https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/
StudyTracker.UserPoolClientId = 4h7example1clientid
StudyTracker.UserPoolId = us-east-1_AbCdEf123
\`\`\`

If a resource fails to create, CloudFormation rolls the whole stack back to how it was. You never end up with half an app.

### Another account by Friday

Where a stack goes is its **environment**: an account and region. Leave it out and the CDK uses your current credentials. Set it to deploy the same code twice:

\`\`\`py
new StudyTrackerStack(app, 'StudyTracker-Test', { env: { account: '111122223333', region: 'us-east-1' } });
new StudyTrackerStack(app, 'StudyTracker-Prod', { env: { account: '444455556666', region: 'us-east-1' } });
\`\`\`

Each account needs \`cdk bootstrap\` once, then \`npx cdk deploy StudyTracker-Prod\`. That's Friday's request: one command.

**\`cdk destroy\`** deletes the stack and everything in it, except anything with \`RemovalPolicy.RETAIN\`.`,
    },
    {
      id: 'github-actions',
      kind: 'read',
      title: 'Deploy on every push, without keys',
      minutes: 15,
      body: `Deploying from your laptop works until two people do it at once, or someone deploys code that was never reviewed. **CI/CD** (continuous integration and continuous delivery) moves it to a pipeline: every push to \`main\` is tested and deployed the same way, by a machine, with a log of who changed what.

**GitHub Actions** runs pipelines, called **workflows**, from YAML files in your repository's \`.github/workflows/\` folder. AWS has its own pipeline services too (AWS CodePipeline, with AWS CodeBuild doing the work), built from the same ideas: a source, a build with tests, then a deploy.

\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]

permissions:
  id-token: write   # lets the job ask GitHub for a sign-in token for AWS
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::111122223333:role/github-deploy-study-tracker
          aws-region: us-east-1
      - run: npx cdk diff
      - run: npx cdk deploy --require-approval never
\`\`\`

\`npm ci\` installs exactly what's in the lockfile. \`npm test\` stops the deploy if a test fails. \`cdk diff\` writes the changes to the log for anyone reviewing later. \`--require-approval never\` lets the deploy go ahead without a person at the keyboard: the review happened in the pull request.

### Signing in without keys

The old way was an IAM user's access keys saved as GitHub secrets. Those keys never expire, work from anywhere, and leak in logs and screenshots.

Instead, the workflow uses **OpenID Connect (OIDC)**:

1. GitHub gives the running job a short-lived, signed token that says which repository, branch and workflow it is.
2. \`configure-aws-credentials\` hands that token to AWS Security Token Service (STS) with **\`AssumeRoleWithWebIdentity\`**.
3. AWS checks the signature against the GitHub identity provider you registered once, and checks the role's **trust policy**.
4. The job gets temporary credentials for that role, valid for about an hour. Nothing is stored, and nothing to rotate.

The trust policy is the whole security of this setup. It says *which* tokens may use the role:

\`\`\`json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:nicotek/study-tracker:ref:refs/heads/main"
  }
}
\`\`\`

The \`sub\` (subject) line is the important one: only pushes to \`main\` in that one repository. Leave it out, or write \`repo:*\`, and **every repository on GitHub** could deploy into your account. That has happened to real companies.

### What the role may do

With the CDK, the pipeline's role needs very little: the bootstrap step already made the roles that do the real work (\`cdk-hnb659fds-deploy-role-…\`, \`…-file-publishing-role-…\`). So the GitHub role only needs permission to assume those, \`sts:AssumeRole\` on \`arn:aws:iam::ACCOUNT:role/cdk-hnb659fds-*\`, and nothing else.`,
    },
    {
      id: 'trust-policy',
      kind: 'try',
      runtime: 'node',
      title: 'Write the trust policy, with types',
      minutes: 15,
      body: `A trust policy is JSON, and JSON is easy to get subtly wrong: \`"allow"\` instead of \`"Allow"\`, or the wrong action name, and the role just doesn't work. Here the policy is built by a TypeScript function, with interfaces that describe its shape.

Look at the interface: \`Effect: 'Allow' | 'Deny'\`. That's a **union of literal types**: only those two exact strings are allowed. Press **Run**, and the compiler finds the first mistake.

Keys written like \`\`[\`\${PROVIDER}:sub\`]\`\` are **computed property names**: the text inside the square brackets becomes the key.`,
      task: 'Fix `githubTrustPolicy` so it compiles with no errors, uses the action `sts:AssumeRoleWithWebIdentity`, and lets in only pushes to `main` in the repository passed in: `repo:<owner>/<name>:ref:refs/heads/main`, with no wildcards.',
      hint: '`Effect: \'Allow\'`, `Action: \'sts:AssumeRoleWithWebIdentity\'`. Remove the `StringLike` line and add a second key to `StringEquals`: ``[`${PROVIDER}:sub`]: `repo:${repo}:ref:refs/heads/main` ``.',
      solution: TRUST_SOLUTION,
      files: [{ path: 'trust-policy.ts', starter: TRUST_STARTER }],
      scenario: {},
      probe: `return [mod.githubTrustPolicy('111122223333', 'nicotek/study-tracker'), mod.githubTrustPolicy('444455556666', 'someone/other-repo')];`,
      check: ({ diagnostics, probe, result }) => {
        if (result.error || !Array.isArray(probe)) return null;
        const errors = typeErrors(diagnostics);
        if (errors) return errors;
        const [a, b] = probe.map((p) => p?.Statement?.[0]);
        if (!a || !b) return null;
        if (a.Action !== 'sts:AssumeRoleWithWebIdentity') return 'GitHub signs in with a web identity token, so the action is sts:AssumeRoleWithWebIdentity.';
        if (a.Principal?.Federated !== 'arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com') return 'Keep the Federated principal: the GitHub identity provider in the account passed in.';
        const all = JSON.stringify(probe);
        if (all.includes('*')) return 'There\'s still a wildcard in the policy. Allow one exact repository and branch.';
        const eq = a.Condition?.StringEquals || {};
        if (eq['token.actions.githubusercontent.com:aud'] !== 'sts.amazonaws.com') return 'Keep the aud condition: sts.amazonaws.com.';
        const sub = eq['token.actions.githubusercontent.com:sub'];
        if (!sub) return 'Add the sub condition to StringEquals, so only your repository can use the role.';
        if (sub !== 'repo:nicotek/study-tracker:ref:refs/heads/main') return `The sub for nicotek/study-tracker should be "repo:nicotek/study-tracker:ref:refs/heads/main", but it's "${sub}".`;
        if (b.Condition?.StringEquals?.['token.actions.githubusercontent.com:sub'] !== 'repo:someone/other-repo:ref:refs/heads/main') return 'Build the sub from the repo parameter, so the function works for any repository.';
        return true;
      },
      success: 'One wrong character in a trust policy is either a role that never works or a door left open. Typed, tested code makes both much harder.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: deployment',
      minutes: 8,
      body: `Deployment is about a quarter of the AWS Certified Developer – Associate exam. What this tutorial covered, the way the exam asks it:

- **CloudFormation** builds **stacks** from **templates**. A **change set** previews an update. A failed create or update **rolls back** by default. \`DeletionPolicy: Retain\` keeps a resource (and its data) when the stack is deleted. **Outputs** can be **exported** and read by other stacks with \`Fn::ImportValue\`. **Drift detection** finds manual changes.
- **The CDK** synthesizes CloudFormation. \`cdk bootstrap\` prepares an account and region; \`cdk diff\` previews; \`cdk deploy\` deploys. L1 constructs are \`Cfn*\` resources, L2 add defaults and grants.
- **AWS SAM** (Serverless Application Model) is the other common option: a CloudFormation template with the \`Transform: AWS::Serverless-2016-10-31\` line and short resource types like \`AWS::Serverless::Function\`. \`sam build\`, \`sam deploy --guided\`, and \`sam local invoke\` to run a function on your computer.
- **Pipelines:** AWS CodePipeline (stages), AWS CodeBuild (runs \`buildspec.yml\`), AWS CodeDeploy (deployments). GitHub Actions plays the same roles.
- **Lambda deployments:** publish **versions**, point an **alias** at one, and shift traffic gradually with CodeDeploy: \`Canary10Percent5Minutes\`, \`Linear10PercentEvery1Minute\` or \`AllAtOnce\`, rolling back automatically if a CloudWatch alarm fires.
- **Other deployment strategies:** all at once, rolling, rolling with an extra batch, immutable, and blue/green (two environments, switch traffic).
- **Credentials:** never long-lived access keys in code or pipelines. Roles, assumed with STS: \`AssumeRole\` for AWS principals, \`AssumeRoleWithWebIdentity\` for OIDC providers like GitHub, Amazon Cognito identity pools for app users.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'What does `cdk synth` produce?', options: ['A running stack', 'A CloudFormation template', 'A Docker image', 'A list of AWS bills'], answer: 1, explain: 'The CDK turns your code into a CloudFormation template. `cdk deploy` then asks CloudFormation to build it.' },
        { q: 'You changed a table\'s sort key. What does `cdk diff` warn you about?', options: ['Nothing: keys can change any time', 'The table will be replaced: a new table, and the old one and its data deleted', 'The stack will be deleted', 'The function will be renamed'], answer: 1, explain: 'Some settings can\'t change in place. The diff marks those resources for replacement before you deploy, not after.' },
        { q: 'What does `table.grantReadWriteData(fn)` do?', options: ['Makes the table public', 'Adds a policy to the function\'s role with read and write actions on that one table', 'Gives every function in the account access', 'Copies the table into the function'], answer: 1, explain: 'Grants write least-privilege IAM for you: the right actions, on just that resource\'s ARN.' },
        { q: 'Why does `new CfnOutput(this, \'ApiUrl\', { value: api.url })` fail to compile?', options: ['CfnOutput takes a number', '`api.url` is `string | undefined`, and value must be a string', 'Outputs can\'t contain URLs', 'The id must be lowercase'], answer: 1, explain: 'An API might have no default address, so TypeScript won\'t assume one. `api.url!` says "I know it\'s there".' },
        { q: 'Why use OpenID Connect instead of access keys in GitHub secrets?', options: ['It\'s faster', 'The credentials are temporary, nothing is stored to leak or rotate, and the trust policy limits which repository and branch can use them', 'Access keys don\'t work with the CDK', 'GitHub requires it'], answer: 1, explain: 'Each job gets short-lived credentials for one role. The trust policy decides exactly who may assume it.' },
        { q: 'A trust policy has `"token.actions.githubusercontent.com:sub": "repo:*"` under StringLike. What\'s the problem?', options: ['None', 'Any repository on GitHub could assume the role and deploy into your account', 'Only private repositories can use it', 'It blocks every repository'], answer: 1, explain: 'The sub condition is what ties the role to your repository. Make it exact: `repo:owner/name:ref:refs/heads/main`.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'ts3-synth', front: 'Turn a CDK app into a CloudFormation template', back: '`npx cdk synth`', tags: ['cdk'], difficulty: 'easy' },
        { id: 'ts3-diff', front: 'See what a deploy would change, before deploying', back: '`npx cdk diff`: look for resources marked replace or destroy', tags: ['cdk'], difficulty: 'easy' },
        { id: 'ts3-bootstrap', front: 'What does `cdk bootstrap` do?', back: 'Once per account and region: creates the CDKToolkit stack, with a bucket for uploaded code and the roles deployments use.', tags: ['cdk'], difficulty: 'medium' },
        { id: 'ts3-grant', front: 'Let function `fn` read and write table `table`, least privilege', back: '`table.grantReadWriteData(fn)`', tags: ['cdk', 'iam'], difficulty: 'medium' },
        { id: 'ts3-removal', front: 'Delete a practice table along with its stack', back: '`removalPolicy: RemovalPolicy.DESTROY` (production keeps the default, RETAIN)', tags: ['cdk'], difficulty: 'medium' },
        { id: 'ts3-nonnull', front: 'Tell TypeScript a `string | undefined` value is really there', back: 'A non-null assertion: `api.url!`. Only when you\'re sure.', tags: ['typescript'], difficulty: 'medium' },
        { id: 'ts3-oidc', front: 'Which STS call does GitHub Actions use to sign in to AWS with OIDC?', back: '`AssumeRoleWithWebIdentity`, with the workflow permission `id-token: write`', tags: ['iam', 'ci/cd'], difficulty: 'hard' },
        { id: 'ts3-sub', front: 'The trust policy condition that allows only pushes to main in one repository', back: '`token.actions.githubusercontent.com:sub` = `repo:owner/name:ref:refs/heads/main` (StringEquals)', tags: ['iam', 'ci/cd'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 75,
      body: `Deploy the study tracker with the CDK, then let GitHub Actions deploy every change. You need Node.js, the AWS command line signed in (*Start here*), and a GitHub account.

1. **Node.js 22.** Check with \`node --version\`. If it's older or missing, install the 22 "LTS" version from [nodejs.org](https://nodejs.org), or with \`nvm install 22\` if you use the Node Version Manager.

2. **A CDK project.** The folder's name becomes the class names, so call it \`study-tracker\`:

\`\`\`sh
mkdir -p ~/aws-study-projects/typescript/study-tracker
cd ~/aws-study-projects/typescript/study-tracker
npx aws-cdk@latest init app --language typescript
\`\`\`

That makes a Git repository with \`bin/study-tracker.ts\` (the app), \`lib/study-tracker-stack.ts\` (the stack class), \`test/\`, and \`cdk.json\`. The CDK command line is installed in the project, so \`npx cdk\` always uses the same version as your teammates and the pipeline.

3. **Your stack.** Replace the class in \`lib/study-tracker-stack.ts\` with your \`StudyTrackerStack\` from the last practice step: the imports and the class, without the last three lines. In \`bin/study-tracker.ts\`, set the stack's id to \`StudyTracker\`:

\`\`\`py
new StudyTrackerStack(app, 'StudyTracker', {});
\`\`\`

4. **The function's code.** If you built the study tracker in the JavaScript course, copy its \`lambda/index.mjs\` into a \`lambda\` folder here. Otherwise, this short version works. Save it as \`lambda/index.mjs\`:

\`\`\`py
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const reply = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub; // checked by the authorizer
  if (event.routeKey === 'GET /progress') {
    const out = await db.send(new QueryCommand({
      TableName: TABLE, KeyConditionExpression: 'userId = :u', ExpressionAttributeValues: { ':u': userId },
    }));
    return reply(200, out.Items);
  }
  if (event.routeKey === 'PUT /progress/{deckId}') {
    const { known = 0, total = 0 } = JSON.parse(event.body || '{}');
    const item = { userId, deckId: event.pathParameters.deckId, known: Number(known), total: Number(total), updatedAt: new Date().toISOString() };
    await db.send(new PutCommand({ TableName: TABLE, Item: item }));
    return reply(200, item);
  }
  return reply(404, { error: 'Not found' });
};
\`\`\`

The Node.js 22 runtime on Lambda already includes the AWS SDK, so there's nothing to install for it.

5. **Bootstrap, then deploy:**

\`\`\`sh
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
echo "$ACCOUNT $REGION"
npx cdk bootstrap aws://$ACCOUNT/$REGION
npx cdk synth
npx cdk diff
npx cdk deploy
\`\`\`

If \`REGION\` comes out empty, set it first: \`REGION=us-east-1\`. \`cdk deploy\` lists the new permissions and asks \`Do you wish to deploy these changes (y/n)?\`. Answer \`y\`. It takes a few minutes, then prints the outputs.

6. **Try it.** Copy the outputs into variables, sign up a test user, and call the API:

\`\`\`sh
out() { aws cloudformation describe-stacks --stack-name StudyTracker --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
API=$(out ApiUrl); POOL=$(out UserPoolId); CLIENT=$(out UserPoolClientId)

aws cognito-idp sign-up --client-id "$CLIENT" --username you@example.com --password 'Practice-Pass1!'
aws cognito-idp admin-confirm-sign-up --user-pool-id "$POOL" --username you@example.com
TOKEN=$(aws cognito-idp initiate-auth --client-id "$CLIENT" --auth-flow USER_PASSWORD_AUTH \\
  --auth-parameters 'USERNAME=you@example.com,PASSWORD=Practice-Pass1!' \\
  --query AuthenticationResult.IdToken --output text)

curl -s -X PUT "\${API}progress/aws-basics" -H "Authorization: Bearer $TOKEN" \\
  -H "content-type: application/json" -d '{"known": 12, "total": 40}'
curl -s "\${API}progress" -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null -w "%{http_code}\\n" "\${API}progress"
\`\`\`

The first two calls return your progress. The last one has no token, so the authorizer answers \`401\` and your function never runs.

7. **Push it to GitHub.** Create an empty repository called \`study-tracker\` on GitHub (no README), then:

\`\`\`sh
git add -A
git commit -m "Study tracker stack"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/study-tracker.git
git push -u origin main
\`\`\`

8. **Let GitHub sign in to AWS.** Register GitHub as an identity provider in your account. It's needed once per account; if it says the provider already exists, that's fine.

\`\`\`sh
aws iam create-open-id-connect-provider \\
  --url https://token.actions.githubusercontent.com \\
  --client-id-list sts.amazonaws.com
\`\`\`

Then the role the workflow uses. Put your GitHub name in \`REPO\`:

\`\`\`sh
REPO=YOUR-NAME/study-tracker
cat > trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:$REPO:ref:refs/heads/main"
      }
    }
  }]
}
EOF
cat > assume-cdk.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{ "Effect": "Allow", "Action": "sts:AssumeRole", "Resource": "arn:aws:iam::$ACCOUNT:role/cdk-hnb659fds-*" }]
}
EOF
aws iam create-role --role-name github-deploy-study-tracker --assume-role-policy-document file://trust.json
aws iam put-role-policy --role-name github-deploy-study-tracker --policy-name assume-cdk-roles --policy-document file://assume-cdk.json
echo "arn:aws:iam::$ACCOUNT:role/github-deploy-study-tracker"
\`\`\`

The role can do one thing: assume the roles \`cdk bootstrap\` created. Those do the deploying.

9. **The workflow.** Save the workflow from the *Deploy on every push* step as \`.github/workflows/deploy.yml\`, with your role ARN (the last line above) and region. Then:

\`\`\`sh
git add .github/workflows/deploy.yml
git commit -m "Deploy on push to main"
git push
\`\`\`

Open your repository's **Actions** tab and watch it run: install, test, diff, deploy. Change something small, like the function's \`timeout\`, push again, and watch the pipeline deploy it while you do something else.

10. **Clean up.** The table and user pool use \`DESTROY\`, so one command removes the app:

\`\`\`sh
npx cdk destroy
aws iam delete-role-policy --role-name github-deploy-study-tracker --policy-name assume-cdk-roles
aws iam delete-role --role-name github-deploy-study-tracker
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com
\`\`\`

Keep the \`CDKToolkit\` stack if you'll use the CDK again (its bucket costs fractions of a cent). To remove it too, empty its bucket and delete the stack in the CloudFormation console. In a new terminal, run the \`ACCOUNT=...\` line from step 5 again first.

**Cost:** for a few test users, Lambda, API Gateway, DynamoDB on-demand and Cognito cost nothing or a few cents. GitHub Actions is free for public repositories and includes free minutes for private ones.`,
      checklist: [
        '`npx cdk deploy` created the study tracker and printed its outputs',
        'A signed-in `curl` saved and read progress; without a token it got 401',
        'The repository is on GitHub, with no access keys anywhere in it',
        'A push to main deployed through GitHub Actions, signed in with OpenID Connect',
        'I ran `npx cdk destroy` and removed the deploy role (or I\'m keeping it on purpose)',
      ],
    },
  ],
};

export default tutorial;
