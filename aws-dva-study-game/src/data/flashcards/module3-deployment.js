// Module 3: Deployment & CI/CD
// AWS Certified Developer – Associate (DVA-C02)

export const module3 = {
  id: 'module3',
  name: 'Deployment & CI/CD',
  description: 'SAM, CloudFormation, CDK, CodePipeline/CodeBuild/CodeDeploy, Elastic Beanstalk, deployment strategies',
  icon: '🚀',
  color: '#3fb950',
  gradient: 'linear-gradient(135deg, #3fb950 0%, #3fb950 100%)',
  source: 'DVA-C02 Exam Guide',
  cards: [
    {
      id: 'dva-dep-c1',
      front: 'Lambda packaging: .zip vs container image, when?',
      back: '• .zip: up to 50 MB zipped for direct upload, 250 MB unzipped including all layers (max 5 layers)\n• Container image: up to 10 GB, stored in Amazon ECR, built from an AWS base image or one with the Runtime Interface Client\n\nRule: large ML or native dependencies, or an existing Docker workflow → container image. Small functions sharing libraries → .zip plus layers.',
      hint: 'Size decides',
      tags: ['lambda', 'packaging'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c2',
      front: 'Uploading the .zip to S3 gets around the 250 MB Lambda limit. True?',
      back: 'False.\n\nS3 upload only lifts the 50 MB direct-upload limit. The 250 MB unzipped limit applies to the function code plus all of its layers, however the package is delivered.\n\nPast 250 MB unzipped → use a container image (up to 10 GB).',
      hint: 'Layers count too',
      tags: ['lambda', 'packaging', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c3',
      front: 'What makes a template an AWS SAM template, and what does Globals do?',
      back: '• Transform: AWS::Serverless-2016-10-31 tells CloudFormation to expand SAM resource types (Function, Api, HttpApi, SimpleTable, LayerVersion, StateMachine)\n• Globals: shared properties (Runtime, Timeout, MemorySize, Environment) applied to every function or API so you do not repeat them\n\nNo Transform → CloudFormation rejects AWS::Serverless::* types.',
      hint: 'One line at the top',
      tags: ['sam', 'templates'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dep-c4',
      front: 'sam build vs sam package vs sam deploy',
      back: '• sam build: resolves dependencies and builds artifacts into .aws-sam/build\n• sam package: uploads artifacts to S3 (and images to ECR) and writes a template with S3 URIs; same as aws cloudformation package\n• sam deploy: packages if needed, then creates and executes a CloudFormation change set\n\nPipelines often run build + package, then hand the packaged template to a CloudFormation deploy action.',
      hint: 'Build, upload, change set',
      tags: ['sam', 'cli'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c5',
      front: 'Key CloudFormation intrinsic functions to recognise',
      back: '• Ref: parameter value or the resource default ID (for a Lambda function, its name)\n• Fn::GetAtt: a resource attribute, such as an Arn\n• Fn::Sub: substitute variables into a string\n• Fn::FindInMap: look up a value in Mappings (for example, AMI per Region)\n• Fn::ImportValue: read another stack\'s export\n• Fn::If with Conditions: environment-specific resources',
      hint: 'Ref vs GetAtt',
      tags: ['cloudformation', 'templates'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c6',
      front: 'Cross-stack references (Exports) vs nested stacks: when?',
      back: '• Exports + Fn::ImportValue: independent stacks with their own lifecycles share values (network stack exports subnet IDs). An export in use cannot be changed or deleted.\n• Nested stacks (AWS::CloudFormation::Stack): reuse a common component inside one parent stack, deployed and updated together.\n\nRule: different owners or lifecycles → exports. Reusable building block → nested stack.',
      hint: 'Separate lifecycles?',
      tags: ['cloudformation', 'architecture'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c7',
      front: 'Change sets vs drift detection',
      back: '• Change set: preview what an update WILL do before running it, including Replacement: True / False / Conditional\n• Drift detection: report what someone ALREADY changed outside CloudFormation (IN_SYNC, MODIFIED, DELETED)\n\nDrift detection does not fix anything; you reconcile by updating the template or the resource.',
      hint: 'Future vs past',
      tags: ['cloudformation', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c8',
      front: 'DeletionPolicy options and when to use each',
      back: '• Delete (default for most resources): resource removed with the stack\n• Retain: resource kept and still billed after stack deletion\n• Snapshot: final snapshot, then delete (RDS, EBS volumes, ElastiCache, Redshift and some others)\n\nUpdateReplacePolicy applies the same choices when an update replaces a resource.',
      hint: 'Keep, snapshot, delete',
      tags: ['cloudformation', 'data-protection'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dep-c9',
      front: 'AWS CDK workflow: synth, bootstrap, deploy',
      back: '• Constructs: L1 (Cfn* raw resources), L2 (sensible defaults), L3 patterns\n• cdk synth: generates the CloudFormation template (cloud assembly)\n• cdk bootstrap: once per account + Region; creates the CDKToolkit stack (S3 bucket, ECR repo, IAM roles)\n• cdk diff: compare with deployed stack\n• cdk deploy: deploys through CloudFormation\n\n"Not bootstrapped" error → run cdk bootstrap.',
      hint: 'Once per account and Region',
      tags: ['cdk', 'iac'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dep-c10',
      front: 'Lambda versions and aliases: the rules',
      back: '• $LATEST: mutable, changes on every code update\n• Published version: immutable snapshot of code + configuration, has its own ARN\n• Alias: named pointer (prod, dev) to a version; clients call the alias ARN\n• Weighted alias: split traffic between two versions (used by CodeDeploy canary/linear)\n\nAPI Gateway stage variables can pick the alias per stage; each alias needs invoke permission.',
      hint: 'Pointer to an immutable snapshot',
      tags: ['lambda', 'versions', 'testing'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c11',
      front: 'Testing locally with the AWS SAM CLI',
      back: '• sam local invoke -e event.json: run one function once with an event\n• sam local generate-event s3 put (sqs, sns, apigateway...): create sample payloads\n• sam local start-api: local HTTP server emulating API Gateway\n• sam local start-lambda: local endpoint for SDK or CLI invoke calls\n\nAll need Docker. For fast cloud iteration in a dev stack: sam sync --watch.',
      hint: 'Needs Docker',
      tags: ['sam', 'testing'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dep-c12',
      front: 'buildspec.yml: the sections you must know',
      back: '• env: variables, parameter-store and secrets-manager references\n• phases: install → pre_build → build → post_build; a non-zero exit fails the build\n• artifacts: files, base-directory, discard-paths (output passed to the next stage)\n• reports: test results (JUNITXML, CUCUMBERJSON...) shown in report groups\n• cache: reuse dependencies between builds\n\nDefault file name is buildspec.yml at the source root.',
      hint: 'Phases, artifacts, reports',
      tags: ['codebuild', 'ci-cd'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c13',
      front: 'CodeDeploy appspec hook order for EC2 / on-premises',
      back: 'ApplicationStop → (DownloadBundle) → BeforeInstall → (Install) → AfterInstall → ApplicationStart → ValidateService\n\nWith a load balancer, traffic hooks wrap this: BeforeBlockTraffic / AfterBlockTraffic and BeforeAllowTraffic / AfterAllowTraffic.\n\nLambda: BeforeAllowTraffic, AfterAllowTraffic only.\nECS: BeforeInstall, AfterInstall, AfterAllowTestTraffic, BeforeAllowTraffic, AfterAllowTraffic.',
      hint: 'Stop, install, start, validate',
      tags: ['codedeploy', 'appspec', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-dep-c14',
      front: 'Elastic Beanstalk deployment policies: pick one',
      back: '• All at once: fastest, downtime\n• Rolling: no extra cost, reduced capacity\n• Rolling with additional batch: full capacity, small extra cost\n• Immutable: new instances in a temporary ASG, safest, fastest rollback\n• Traffic splitting: canary share of traffic to new instances\n• Blue/green: clone the environment, then Swap environment URLs (CNAME swap)',
      hint: 'Capacity vs cost vs safety',
      tags: ['elastic-beanstalk', 'deployment-strategies'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dep-c15',
      front: 'Lambda canary vs linear vs all-at-once with CodeDeploy',
      back: '• Canary (Canary10Percent5Minutes): one small step, then the rest\n• Linear (Linear10PercentEvery1Minute): equal steps on a fixed interval\n• AllAtOnce: shift everything immediately\n\nIn SAM: AutoPublishAlias + DeploymentPreference (Type, Alarms, PreTraffic/PostTraffic hooks). Rollback is automatic only if you list CloudWatch alarms or a hook fails.',
      hint: 'One step vs equal steps',
      tags: ['codedeploy', 'lambda', 'exam-trap'],
      difficulty: 'advanced'
    }
  ]
};
