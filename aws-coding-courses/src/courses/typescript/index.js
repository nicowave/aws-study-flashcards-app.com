// TypeScript for AWS: typescript.aws-study-flashcards-app.com
import meta from './meta.json';
import startHere from '../../shared/startHere';
import bugProofFlashcards from './tutorials/01-bug-proof-flashcards';
import awsCliTool from './tutorials/02-aws-cli-tool';
import deployWithCode from './tutorials/03-deploy-with-code';

const course = {
  ...meta,
  mark: 'TS',
  accent: '#93a8f4',
  eyebrow: 'Coding course · TypeScript',
  headline: 'Catch the bug before your users do.',
  lede: 'TypeScript for AWS is JavaScript with safety rails, and it\'s what most cloud teams and the AWS Cloud Development Kit use. You\'ll make a page bug-proof, build a typed command-line tool on the AWS SDK, and describe a whole app as code so one command deploys it and every push to GitHub updates it.',
  heroNote: 'Start here and Tutorial 1 are free. The real TypeScript compiler runs in your browser, in strict mode, so you see every error the way your editor would.',
  heroTerminal: `app.ts(14,22): error TS2551: Property 'fornt' does not
  exist on type 'Card'. Did you mean 'front'?

$ npx tsx bin/app.ts
Synthesized stack StudyTracker:
  AWS::DynamoDB::Table      Progress
  AWS::Lambda::Function     Api
  AWS::ApiGatewayV2::Api    HttpApi
  AWS::Cognito::UserPool    Users`,
  outcomes: [
    'Use types, interfaces, union types and generics, and read compiler errors with confidence',
    'Turn on strict mode and fix the bugs it finds: undefined values, wrong property names, missing cases',
    'Build a typed command-line tool on the **AWS SDK for JavaScript v3**, with clear errors and help text',
    'Describe infrastructure as code with the **AWS Cloud Development Kit**: DynamoDB, Lambda, API Gateway, Cognito',
    'Deploy with one command, and on every push with **GitHub Actions**, using short-lived credentials',
    'Read the CloudFormation template your code produces, and know what each resource does',
  ],
  pricingLede: 'All three tutorials with every practice task, quiz, flashcard deck and real-AWS project. Pay once, keep it. Part of the Developer Path: Bash, Python, JavaScript and TypeScript, toward the AWS Certified Developer – Associate.',
  faq: [
    { q: 'Do I need to know JavaScript first?', a: 'It helps a lot. TypeScript is JavaScript plus types, so the [JavaScript course](https://js.aws-study-flashcards-app.com) is the best start. If you\'ve written some JavaScript before, you\'re ready.' },
    { q: 'Is it the real TypeScript compiler?', a: 'Yes: TypeScript 6 runs in your browser in strict mode, with the same error messages as your editor. The only pretend parts are the AWS account and the AWS Cloud Development Kit, which produces a real-looking CloudFormation template without deploying anything.' },
    { q: 'Do I need an AWS account?', a: 'Not to start. The **Build it** step at the end of each tutorial uses your own free AWS account, and *Start here* shows how to set one up with a budget alert.' },
    { q: 'Will the real AWS projects cost money?', a: 'Almost nothing: everything fits in the AWS Free Tier, and the CDK app has a one-command cleanup. GitHub Actions is free for public repositories.' },
    { q: 'Does this help with the AWS Certified Developer – Associate exam?', a: 'Yes, the deployment part: infrastructure as code, CloudFormation, CI/CD pipelines and least-privilege permissions. Each tutorial ends with exam tips. Pair it with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).' },
    { q: 'Is this an official AWS course?', a: 'No. AWS Study Hub is an independent study site by Nico Tek Solutions. AWS is a trademark of Amazon.com, Inc.' },
  ],
  afterCourse: `**Next steps:**
- Put the CDK app on GitHub with its deploy workflow: it shows you can ship, not just code.
- Practice for the exam with the [Developer Associate study game](https://developer.aws-study-flashcards-app.com).
- You've finished the Developer Path. Book the AWS Certified Developer – Associate when your practice scores are steady above 80%.`,
  siblings: [
    { title: 'Bash for AWS', url: 'https://bash.aws-study-flashcards-app.com', live: true },
    { title: 'Python for AWS', url: 'https://python.aws-study-flashcards-app.com', live: true },
    { title: 'JavaScript for AWS', url: 'https://js.aws-study-flashcards-app.com', live: false },
  ],
  tutorials: [startHere, bugProofFlashcards, awsCliTool, deployWithCode],
};

export default course;
