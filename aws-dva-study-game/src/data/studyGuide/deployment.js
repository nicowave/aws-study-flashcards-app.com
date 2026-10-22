// Study guide: Deployment (24%)
export const deploymentGuide = {
  id: 'deployment',
  name: 'Deployment',
  icon: '🚀',
  color: '#3fb950',
  weight: '24%',
  description: 'Prepare artifacts, test in development environments, automate deployment testing, and deploy with CI/CD.',
  sections: [
    {
      id: 'deps1',
      title: 'Packaging Lambda Functions and AWS SAM',
      content: [
        { type: 'paragraph', text: 'Before anything can be deployed it has to be packaged. For Lambda the first decision is the package type, and the deciding factors are size, dependencies and how your team already builds software. AWS SAM then describes the function and its event sources in a short template that becomes CloudFormation.' },
        { type: 'table', headers: ['Factor', '.zip archive', 'Container image'], rows: [
          ['Maximum size', '50 MB zipped for direct upload; 250 MB unzipped including all layers', 'Up to 10 GB'],
          ['Where it lives', 'Uploaded directly or from Amazon S3', 'Amazon ECR repository in the same Region'],
          ['Shared libraries', 'Lambda layers (up to 5 per function)', 'Image layers in the Dockerfile; Lambda layers not used'],
          ['Best for', 'Small and medium functions, fast iteration', 'Large ML or native dependencies, existing Docker tooling']
        ]},
        { type: 'keyTerm', term: 'Lambda layer', definition: 'A versioned .zip archive of libraries, a custom runtime or other dependencies that many functions can reference. Updating the layer means publishing a new layer version and updating the functions to use it. Layer contents count toward the 250 MB unzipped limit.' },
        { type: 'keyTerm', term: 'Transform: AWS::Serverless-2016-10-31', definition: 'The top-level declaration that marks a template as AWS SAM. CloudFormation runs the SAM transform to expand AWS::Serverless::Function, Api, HttpApi, SimpleTable, LayerVersion and StateMachine into standard resources.' },
        { type: 'keyTerm', term: 'Globals', definition: 'A SAM section that sets properties such as Runtime, Timeout, MemorySize, Tracing and Environment once for every function or API in the template.' },
        { type: 'numberedList', title: 'SAM CLI workflow:', items: [
          'sam init: scaffold a project from a template',
          'sam build: install dependencies and build artifacts into .aws-sam/build (use --use-container to build native dependencies in a Lambda-like environment)',
          'sam package: upload artifacts to S3 (images to ECR) and write a template that references them; same as aws cloudformation package',
          'sam deploy: package if needed, then create and execute a CloudFormation change set (--guided saves settings to samconfig.toml)'
        ]},
        { type: 'examTip', text: 'If a question says the unzipped package is too large, the answer is a container image, not uploading the .zip through S3 and not more layers. If AWS::Serverless resource types are rejected, the template is missing the Transform line.' }
      ]
    },
    {
      id: 'deps2',
      title: 'CloudFormation, CDK, AppConfig and ECR',
      content: [
        { type: 'paragraph', text: 'CloudFormation is the engine underneath SAM, the CDK and many pipelines. The exam tests how to make one template work in many environments, how to share values between stacks, and how to change or delete stacks safely.' },
        { type: 'table', headers: ['Template feature', 'What it does', 'Typical use'], rows: [
          ['Parameters', 'Values supplied at deploy time', 'Environment name, instance size'],
          ['Mappings + Fn::FindInMap', 'Static lookup tables', 'AMI ID per Region, settings per environment'],
          ['Conditions + Fn::If', 'Create or configure resources conditionally', 'Only create alarms in prod'],
          ['Outputs + Export', 'Publish values for other stacks', 'VPC and subnet IDs for app stacks'],
          ['Fn::GetAtt / Ref / Fn::Sub', 'Read attributes, IDs and build strings', 'Pass a role ARN, build a bucket name']
        ]},
        { type: 'comparison', title: 'Sharing and reuse', items: [
          { label: 'Cross-stack references', description: 'Outputs with Export in one stack, Fn::ImportValue in others. Stacks keep separate lifecycles; an export that is imported cannot be changed or removed.' },
          { label: 'Nested stacks', description: 'An AWS::CloudFormation::Stack resource that deploys a reusable template as part of a parent stack. Updated together with the parent.' },
          { label: 'StackSets', description: 'Deploy the same stack to many accounts and Regions from one administrator account.' }
        ]},
        { type: 'keyTerm', term: 'Change set', definition: 'A preview of the changes an update will make, including whether each resource is modified or replaced. Nothing changes until you execute it.' },
        { type: 'keyTerm', term: 'Drift detection', definition: 'Compares live resource configuration with the template and flags resources changed outside CloudFormation. It reports drift but does not correct it.' },
        { type: 'keyTerm', term: 'DeletionPolicy', definition: 'Delete, Retain or Snapshot (for supported data resources such as RDS and EBS). UpdateReplacePolicy applies the same options when an update replaces the resource.' },
        { type: 'awsService', name: 'AWS CDK', description: 'Define infrastructure in TypeScript, Python, Java, C# or Go using constructs (L1 raw Cfn resources, L2 with defaults, L3 patterns). cdk synth produces a CloudFormation template, cdk bootstrap prepares each account and Region with staging resources, and cdk deploy deploys through CloudFormation.' },
        { type: 'awsService', name: 'AWS AppConfig', description: 'Deploys configuration and feature flags separately from code, with validators (JSON Schema or Lambda), deployment strategies (all at once, linear, exponential, with bake time) and automatic rollback on CloudWatch alarms.' },
        { type: 'awsService', name: 'Amazon ECR', description: 'Private registry for container images used by ECS, EKS and Lambda. Enable tag immutability so a tag such as v1.4.2 can never be overwritten, or deploy by image digest. Lifecycle policies expire old or untagged images.' },
        { type: 'examTip', text: 'Preview an update → change set. Find manual changes → drift detection. Keep data after stack deletion → DeletionPolicy Retain or Snapshot. Share values between independently owned stacks → Export and Fn::ImportValue. Flags without redeploying code → AppConfig.' }
      ]
    },
    {
      id: 'deps3',
      title: 'Testing in Development Environments',
      content: [
        { type: 'paragraph', text: 'Developers test code locally first, then in an isolated dev environment in AWS, and only then promote the same artifact. Lambda versions and aliases plus API Gateway stages make that promotion safe.' },
        { type: 'bulletList', title: 'Local testing with the SAM CLI (requires Docker):', items: [
          'sam local invoke -e event.json MyFunction: run one function once with an event',
          'sam local generate-event: create sample payloads for S3, SQS, SNS, API Gateway, DynamoDB Streams and more',
          'sam local start-api: run a local HTTP server that emulates API Gateway routes',
          'sam local start-lambda: expose a local endpoint that the SDK or CLI can invoke',
          'sam sync --watch: quickly push code changes to a dev stack in AWS while you edit'
        ]},
        { type: 'comparison', title: 'Lambda $LATEST, versions and aliases', items: [
          { label: '$LATEST', description: 'The editable working copy. Every code or configuration update changes it, so production should not call it.' },
          { label: 'Published version', description: 'An immutable snapshot of code and configuration with its own ARN (for example, :7).' },
          { label: 'Alias', description: 'A named, movable pointer (dev, prod) to a version. Clients call the alias ARN; promotion or rollback is just repointing the alias. A weighted alias splits traffic between two versions.' }
        ]},
        { type: 'keyTerm', term: 'API Gateway stage', definition: 'A named deployment of an API (dev, test, prod) with its own URL, settings, throttling, logging and optional canary release.' },
        { type: 'keyTerm', term: 'Stage variables', definition: 'Name-value pairs per stage that can be referenced in integrations and mapping templates, for example ${stageVariables.lambdaAlias} in a Lambda ARN so each stage calls a different alias. Each alias needs a resource-based policy allowing API Gateway to invoke it.' },
        { type: 'keyTerm', term: 'Mock integration', definition: 'An API Gateway integration that returns a response built from the integration response mapping, with no backend. Used to unblock client teams and test API contracts.' },
        { type: 'paragraph', text: 'Isolate environments with separate stacks built from one parameterized template, and ideally separate AWS accounts in AWS Organizations, so a test deployment cannot affect production resources or quotas.' },
        { type: 'examTip', text: 'Same API, different backend per environment → stage variables pointing to Lambda aliases. Front end needs a fake endpoint now → mock integration. Production must only run tested code → publish a version and point the prod alias at it.' }
      ]
    },
    {
      id: 'deps4',
      title: 'Automating Builds and Tests: CodeBuild and CodePipeline',
      content: [
        { type: 'paragraph', text: 'A pipeline turns each commit into a tested, deployable artifact. CodePipeline orchestrates stages; CodeBuild runs the build and test commands defined in buildspec.yml. Sources are typically GitHub, GitLab or Bitbucket through a CodeConnections connection, or an S3 object or ECR image. AWS CodeCommit stopped accepting new customers in 2024, so new pipelines should not depend on it.' },
        { type: 'table', headers: ['buildspec section', 'Purpose', 'Example'], rows: [
          ['env', 'Plain variables and references to Parameter Store or Secrets Manager', 'secrets-manager: DB_PASS: prod/db:password'],
          ['phases: install', 'Install runtimes and tools', 'runtime-versions: nodejs: 20; npm ci'],
          ['phases: pre_build', 'Log in, lint, run unit tests', 'aws ecr get-login-password ...'],
          ['phases: build', 'Compile, test, build images', 'npm test; docker build ...'],
          ['phases: post_build', 'Push images, write deploy files', 'docker push; write imagedefinitions.json'],
          ['artifacts', 'Files passed to the next stage', 'files, base-directory, discard-paths'],
          ['reports', 'Test and coverage reports', 'file-format: JUNITXML'],
          ['cache', 'Reuse dependencies between builds', 'paths: node_modules/**/*']
        ]},
        { type: 'numberedList', title: 'A typical pipeline:', items: [
          'Source: a push to main triggers the pipeline and produces a source artifact',
          'Build: CodeBuild compiles, runs unit tests and publishes test reports; a failing command fails the stage',
          'Deploy to staging: CloudFormation, CodeDeploy, ECS or Elastic Beanstalk action',
          'Test: CodeBuild runs integration or end-to-end tests against staging',
          'Approval: manual approval action, with an SNS notification to reviewers',
          'Deploy to production: the same artifact, promoted unchanged'
        ]},
        { type: 'keyTerm', term: 'Manual approval action', definition: 'Pauses a pipeline until an authorized IAM principal approves or rejects. It can notify reviewers through Amazon SNS and include a URL to review. A rejection stops the run.' },
        { type: 'keyTerm', term: 'Build once, deploy many', definition: 'Build the artifact once and promote that exact artifact through every environment, changing only configuration, so what you tested is what you release.' },
        { type: 'examTip', text: 'Test failures must stop the pipeline: put tests in a CodeBuild action whose command exits non-zero on failure, placed before the stage you are protecting. Visual pass and fail results → buildspec reports section. Human sign-off → manual approval action, not a disabled transition.' }
      ]
    },
    {
      id: 'deps5',
      title: 'CodeDeploy and Deployment Strategies',
      content: [
        { type: 'paragraph', text: 'AWS CodeDeploy deploys to EC2 and on-premises servers (through the CodeDeploy agent), Lambda functions (by shifting alias traffic) and ECS services (by shifting traffic between task sets). The appspec file defines what to deploy and which lifecycle hooks to run.' },
        { type: 'table', headers: ['Platform', 'Lifecycle hooks (in order)', 'Deployment configurations'], rows: [
          ['EC2 / on-premises', 'ApplicationStop, BeforeInstall, AfterInstall, ApplicationStart, ValidateService (plus Block/Allow traffic hooks with a load balancer)', 'AllAtOnce, HalfAtATime, OneAtATime, or custom minimum healthy hosts; in-place or blue/green'],
          ['AWS Lambda', 'BeforeAllowTraffic, AfterAllowTraffic (Lambda functions as hooks)', 'Canary (for example, Canary10Percent5Minutes), Linear (for example, Linear10PercentEvery1Minute), AllAtOnce'],
          ['Amazon ECS', 'BeforeInstall, AfterInstall, AfterAllowTestTraffic, BeforeAllowTraffic, AfterAllowTraffic', 'Canary, Linear or AllAtOnce traffic shifting between blue and green task sets']
        ]},
        { type: 'comparison', title: 'Deployment strategies', items: [
          { label: 'All at once', description: 'Update everything together. Fastest and cheapest, but causes downtime and a failure hits every user.' },
          { label: 'Rolling', description: 'Update in batches. No extra capacity is added, so capacity drops during the deployment and versions are mixed.' },
          { label: 'Rolling with additional batch', description: 'Add one batch first, then roll. Full capacity is kept for a small extra cost.' },
          { label: 'Immutable', description: 'Deploy to brand-new instances and keep them only if healthy. Safest in-environment option; rollback is terminating the new instances.' },
          { label: 'Blue/green', description: 'Run old and new environments side by side and switch traffic (load balancer, DNS or CNAME swap). Instant rollback by switching back; double capacity during cut-over.' },
          { label: 'Canary', description: 'Send a small share of traffic to the new version, wait, then shift the rest. Detects problems with minimal exposure.' },
          { label: 'Linear', description: 'Shift traffic in equal increments at a fixed interval until all traffic is on the new version.' }
        ]},
        { type: 'keyTerm', term: 'SAM safe Lambda deployments', definition: 'AutoPublishAlias publishes a new version and updates the alias on each deploy; DeploymentPreference sets the CodeDeploy Type (Canary, Linear, AllAtOnce), Alarms to watch, and optional PreTraffic and PostTraffic hook functions. A firing alarm or failed hook rolls traffic back to the previous version.' },
        { type: 'keyTerm', term: 'Automatic rollback', definition: 'CodeDeploy can roll back when a deployment fails or when a configured CloudWatch alarm goes into ALARM. It redeploys the last known good revision (for Lambda and ECS, shifts traffic back).' },
        { type: 'examTip', text: 'Know the hook order for EC2: ApplicationStop, BeforeInstall, AfterInstall, ApplicationStart, ValidateService. Configure new files in AfterInstall; check health in ValidateService. Canary is one small step then the rest; linear is equal steps; only alarms or hooks make rollback automatic.' }
      ]
    },
    {
      id: 'deps6',
      title: 'Elastic Beanstalk, ECS, CloudFormation Rollback and Amplify',
      content: [
        { type: 'paragraph', text: 'Several services deploy code for you, each with its own controls. The exam usually describes a constraint (capacity, cost, rollback speed, no downtime) and expects you to pick the matching policy.' },
        { type: 'table', headers: ['Elastic Beanstalk policy', 'Capacity during deploy', 'Extra cost', 'Rollback'], rows: [
          ['All at once', 'Downtime', 'None', 'Redeploy previous version'],
          ['Rolling', 'Reduced by one batch', 'None', 'Redeploy; versions mixed meanwhile'],
          ['Rolling with additional batch', 'Full', 'One extra batch', 'Redeploy; versions mixed meanwhile'],
          ['Immutable', 'Full (double during deploy)', 'Full temporary set', 'Terminate new instances'],
          ['Traffic splitting', 'Full', 'Full temporary set', 'Reroute traffic to original instances'],
          ['Blue/green (Swap URLs)', 'Full (separate environment)', 'Second environment', 'Swap the CNAMEs back']
        ]},
        { type: 'keyTerm', term: '.ebextensions', definition: 'A folder at the root of the source bundle containing YAML or JSON .config files that install packages, create files, run commands and set option_settings (including environment properties) on every instance.' },
        { type: 'keyTerm', term: 'Swap environment URLs', definition: 'The Elastic Beanstalk blue/green mechanism: deploy to a cloned environment, test it, then swap CNAMEs so its URL serves production. Used for major platform changes and fast rollback.' },
        { type: 'awsService', name: 'Amazon ECS deployments', description: 'Rolling updates are managed by ECS itself (minimum healthy and maximum percent). Blue/green with CodeDeploy uses an Application or Network Load Balancer, two target groups, a production listener and an optional test listener; hooks such as AfterAllowTestTraffic run Lambda tests before production traffic shifts. ECS also offers built-in blue/green deployments without CodeDeploy.' },
        { type: 'keyTerm', term: 'CloudFormation rollback', definition: 'A failed create or update rolls back automatically by default. Rollback triggers add CloudWatch alarms that are watched during the operation and a monitoring period afterwards. If an update rollback itself fails (UPDATE_ROLLBACK_FAILED), fix the cause and use continue-update-rollback.' },
        { type: 'awsService', name: 'AWS Amplify Hosting', description: 'Git-based CI/CD and hosting for static and server-side rendered front ends (React, Next.js, Vue, Angular): builds on every push, branch environments, pull request previews, custom domains with managed certificates, and a CDN.' },
        { type: 'examTip', text: 'Full capacity at low cost → rolling with additional batch. Safest, quickest rollback on Beanstalk → immutable. Major platform change → blue/green with Swap environment URLs. Roll back a stack update on an alarm → CloudFormation rollback triggers. Front end from GitHub with previews → Amplify Hosting.' }
      ]
    }
  ]
};
