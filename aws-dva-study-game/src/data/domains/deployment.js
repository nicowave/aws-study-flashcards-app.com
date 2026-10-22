// Domain 3: Deployment (24% of exam)
// DVA-C02 Exam Content

export const deployment = {
  id: 'deployment',
  name: 'Deployment',
  icon: '🚀',
  weight: '24%',
  color: '#3fb950',
  description: 'Prepare artifacts, test in development environments, automate deployment testing, and deploy with CI/CD',
  questions: [
    {
      id: 'dep1',
      question: 'A developer is moving a Python image-processing function to AWS Lambda. With its machine learning libraries and model files, the unzipped deployment package is about 1.5 GB. The team wants to keep using Lambda with the least refactoring. How should the developer package the function?',
      options: [
        'Split the dependencies across five Lambda layers attached to the function',
        'Upload the .zip file to Amazon S3 and reference it from the function configuration',
        'Build a container image, push it to Amazon ECR, and create the function from the image',
        'Store the libraries in /tmp and download them from Amazon S3 on every cold start'
      ],
      correctAnswer: 2,
      explanation: 'Lambda container images can be up to 10 GB, so a 1.5 GB set of dependencies fits as an image stored in Amazon ECR. A .zip package, even when uploaded through S3, is limited to 250 MB unzipped, and that limit includes all layers, so splitting the code across layers does not help. Downloading libraries into /tmp on every cold start adds latency and complexity, and /tmp storage still has to be sized for it.'
    },
    {
      id: 'dep2',
      question: 'A team maintains 12 Node.js Lambda functions that all use the same internal logging library and the same version of a large SDK. Every function bundles its own copy, and updating the library means rebuilding all 12 packages. What should the team do to share the code with the least duplication?',
      options: [
        'Publish the shared code as a Lambda layer and attach the layer version to each function',
        'Move the shared code into a single function that the other functions invoke synchronously',
        'Store the shared code in AWS AppConfig and load it into memory at function startup',
        'Mount an Amazon EBS volume containing the shared code on each Lambda function'
      ],
      correctAnswer: 0,
      explanation: 'A Lambda layer packages libraries once and lets many functions reference a specific layer version, so the shared code is deployed and versioned separately from each function. Invoking a separate function for every library call adds latency, cost and coupling. AppConfig is for configuration data and feature flags, not code, and Lambda cannot mount EBS volumes (it supports Amazon EFS for shared file systems).'
    },
    {
      id: 'dep3',
      question: 'A developer writes a template that uses AWS::Serverless::Function and AWS::Serverless::Api resources. When the template is deployed with AWS CloudFormation, the stack fails because those resource types are not recognized. What must the developer add to the template?',
      options: [
        'A Globals section that sets the Runtime and Handler for every function',
        'A Metadata section that lists the AWS SAM CLI version used to build the template',
        'An AWSTemplateFormatVersion value of 2016-10-31 at the top of the template',
        'A Transform: AWS::Serverless-2016-10-31 declaration at the top level of the template'
      ],
      correctAnswer: 3,
      explanation: 'The Transform: AWS::Serverless-2016-10-31 declaration tells CloudFormation to run the AWS SAM transform, which expands serverless resource types into standard CloudFormation resources. Globals only sets shared properties and is itself SAM syntax that needs the transform. The Metadata section does not change how resources are processed, and AWSTemplateFormatVersion (2010-09-09) describes the template format, not the SAM transform.'
    },
    {
      id: 'dep4',
      question: 'A CI pipeline builds an AWS SAM application in one stage and deploys it with a CloudFormation deploy action in a later stage. The deploy stage needs a template whose CodeUri values point to artifacts that are already in Amazon S3. Which step should the build stage run after sam build?',
      options: [
        'sam local invoke, to confirm the function runs and record its output location',
        'sam package (or aws cloudformation package), to upload artifacts and write a packaged template',
        'sam init, to regenerate the project with S3 locations instead of local paths',
        'sam sync, to push the code directly to the deployed functions without a template'
      ],
      correctAnswer: 1,
      explanation: 'sam package (equivalent to aws cloudformation package) uploads the local build artifacts to S3 and outputs a new template whose CodeUri properties reference those S3 objects, which a later CloudFormation action can deploy. sam local invoke only runs a function locally. sam init scaffolds a new project, and sam sync is a development shortcut that updates a stack quickly, not a way to produce a packaged template for a pipeline.'
    },
    {
      id: 'dep5',
      question: 'A developer must change a property of an Amazon RDS DB instance that is managed by a production CloudFormation stack. The developer needs to know before the update runs whether CloudFormation will modify the database in place or replace it. What should the developer do?',
      options: [
        'Run drift detection on the stack and review the resource drift status',
        'Create a change set and check the Replacement value for the DB instance',
        'Enable termination protection on the stack and then perform a direct update',
        'Add a stack policy that denies Update:Replace and read the error message'
      ],
      correctAnswer: 1,
      explanation: 'A change set previews the exact actions CloudFormation will take, including whether each resource will be modified or replaced (Replacement: True, False or Conditional), without changing anything until it is executed. Drift detection compares live resources with the template and says nothing about a pending update. Termination protection only blocks stack deletion, and a stack policy can prevent a replacement but is a guard rail, not a preview.'
    },
    {
      id: 'dep6',
      question: 'A test environment is built from a CloudFormation stack that includes an Amazon RDS DB instance. The team deletes the stack every Friday but must be able to restore the database contents the following week. Which configuration meets this requirement with the least effort?',
      options: [
        'Set the DeletionPolicy attribute of the DB instance to Retain',
        'Enable termination protection on the stack before deleting it',
        'Add an Output that exports the DB instance endpoint for later import',
        'Set the DeletionPolicy attribute of the DB instance to Snapshot'
      ],
      correctAnswer: 3,
      explanation: 'DeletionPolicy: Snapshot makes CloudFormation take a final snapshot of the DB instance before deleting it, so the data can be restored later while the running instance stops incurring cost. Retain keeps the whole instance running and billing after the stack is gone. Termination protection blocks the deletion entirely, and exporting an endpoint preserves nothing once the database is deleted.'
    },
    {
      id: 'dep7',
      question: 'A networking team manages a CloudFormation stack that creates a VPC and subnets. Several application teams deploy their own independent stacks and need to reference the subnet IDs, which must stay in sync if the network stack is updated. What is the recommended approach?',
      options: [
        'Export the subnet IDs from the network stack Outputs and read them with Fn::ImportValue',
        'Copy the subnet IDs into each application template as hard-coded default parameter values',
        'Include the network template in every application stack as a nested stack resource',
        'Use a Mappings section in each application template that lists the subnet IDs per Region'
      ],
      correctAnswer: 0,
      explanation: 'Cross-stack references let one stack export values in Outputs and other independently managed stacks read them with Fn::ImportValue, and CloudFormation prevents the exporting stack from deleting or changing an export that is still in use. Hard-coded parameters and Mappings go stale when the network changes. Nesting the network template in every application stack would create a separate VPC per stack instead of sharing one.'
    },
    {
      id: 'dep8',
      question: 'An operator changed the inbound rules of a security group in the console during an incident. The security group is managed by a CloudFormation stack, and the team wants to find every resource in the stack whose live configuration no longer matches the template. What should the team use?',
      options: [
        'A change set created from the current template',
        'AWS CloudTrail event history filtered by stack name',
        'CloudFormation drift detection on the stack',
        'A rollback trigger with a CloudWatch alarm'
      ],
      correctAnswer: 2,
      explanation: 'Drift detection compares the actual configuration of supported resources with the expected configuration in the stack template and reports each resource as IN_SYNC, MODIFIED or DELETED. A change set only previews differences between templates, not out-of-band changes. CloudTrail shows who made API calls but does not compare against the template, and rollback triggers only watch alarms during a stack operation.'
    },
    {
      id: 'dep9',
      question: 'A developer runs cdk deploy for the first time in a new AWS account and Region. The deployment fails with a message that the environment is not bootstrapped and the required staging resources cannot be found. What should the developer do?',
      options: [
        'Run cdk synth to generate the CloudFormation template and deploy it manually',
        'Run cdk diff to compare the app with the deployed stack and fix the differences',
        'Create an S3 bucket with the same name as the app and run cdk deploy again',
        'Run cdk bootstrap for that account and Region, then run cdk deploy again'
      ],
      correctAnswer: 3,
      explanation: 'cdk bootstrap deploys the CDKToolkit stack, which creates the S3 bucket, ECR repository and IAM roles the CDK uses to stage assets and deploy, and it is required once per account and Region. cdk synth only produces the template and does not create the staging resources. cdk diff compares stacks, and a manually created bucket does not provide the roles and naming the CDK expects.'
    },
    {
      id: 'dep10',
      question: 'A developer wants to turn a new checkout feature on for production users gradually and be able to turn it off within minutes if errors increase. The change must not require redeploying the application code, and invalid flag values must be rejected before they reach users. Which solution meets these requirements?',
      options: [
        'Store the flag as a Lambda environment variable and update it with a new function version',
        'Store the flag in an S3 object and have every application instance poll the object every few seconds',
        'Use an AWS AppConfig feature flag with a validator, gradual rollout and alarm-based rollback',
        'Use a CloudFormation parameter for the flag and update the stack when the value changes'
      ],
      correctAnswer: 2,
      explanation: 'AWS AppConfig deploys configuration and feature flags separately from code, validates values before deployment, rolls them out with a deployment strategy (for example, linear with bake time), and rolls back automatically when a CloudWatch alarm fires. Changing a Lambda environment variable or a CloudFormation parameter is effectively a redeployment and has no built-in validation or gradual rollout. Polling an S3 object provides neither validation nor controlled rollout.'
    },
    {
      id: 'dep11',
      question: 'A team deploys container images from Amazon ECR to Amazon ECS. An incident occurred when someone pushed a new build with the same v2.3.1 tag, and a task restart silently picked up different code. How can the team prevent an existing tag from being overwritten?',
      options: [
        'Enable tag immutability on the ECR repository',
        'Enable image scanning on push for the ECR repository',
        'Add a lifecycle policy that expires untagged images',
        'Enable cross-Region replication for the ECR repository'
      ],
      correctAnswer: 0,
      explanation: 'With tag immutability enabled, ECR rejects any push that would reuse an existing tag, so v2.3.1 always refers to the same image (referencing images by digest gives the same guarantee). Image scanning finds vulnerabilities but does not protect tags. Lifecycle policies clean up old images, and replication copies images to other Regions without stopping a tag from being moved.'
    },
    {
      id: 'dep12',
      question: 'A developer is debugging a Lambda function, defined in an AWS SAM template, that processes Amazon S3 object-created notifications. The developer wants to run the function on a laptop with a realistic event payload before deploying anything. Which approach should the developer use?',
      options: [
        'Run sam deploy with a separate dev stack name, then upload a test object to the bucket',
        'Generate an S3 put event with sam local generate-event, then run sam local invoke with it',
        'Run sam local start-api and send the S3 event to the local endpoint with curl',
        'Run sam validate with the event file to check that the function handles it'
      ],
      correctAnswer: 1,
      explanation: 'sam local generate-event produces sample payloads for event sources such as S3, and sam local invoke -e runs the function once in a local Lambda-like container (Docker is required) with that payload. sam deploy deploys to AWS, which the developer wants to avoid. sam local start-api emulates API Gateway HTTP endpoints, not S3 notifications, and sam validate only checks the template syntax.'
    },
    {
      id: 'dep13',
      question: 'A front-end developer is building a web app against a REST API defined in an AWS SAM template with several Lambda-backed routes. The developer wants to call the routes from a browser on a local machine and iterate quickly without deploying to AWS. Which command supports this?',
      options: [
        'sam local start-api',
        'sam local invoke',
        'sam build --use-container',
        'sam logs --tail'
      ],
      correctAnswer: 0,
      explanation: 'sam local start-api starts a local HTTP server that emulates API Gateway and runs the matching Lambda function in a container for each request, so the browser can call real routes locally. sam local invoke runs one function with one event and exposes no HTTP endpoint. sam build --use-container compiles dependencies but runs nothing, and sam logs reads CloudWatch logs from functions already deployed to AWS.'
    },
    {
      id: 'dep14',
      question: 'A REST API in Amazon API Gateway has dev and prod stages. Both stages must call the same Lambda function, but the dev stage must invoke the function\'s dev alias and the prod stage its prod alias, without maintaining two copies of the API. What should the developer configure?',
      options: [
        'Two separate APIs, each with a hard-coded function ARN in its integration',
        'A usage plan per stage that maps API keys to the matching Lambda alias',
        'A canary release on the prod stage that sends a share of the traffic to the dev alias',
        'A stage variable per stage used in the integration ARN, plus invoke permission per alias'
      ],
      correctAnswer: 3,
      explanation: 'Setting a stage variable such as lambdaAlias in each stage and using ${stageVariables.lambdaAlias} in the Lambda integration ARN lets one API definition target a different alias per stage; each alias also needs a resource-based policy that allows API Gateway to invoke it. Two copies of the API is the duplication the team wants to avoid. Usage plans control throttling and quotas, and a canary release splits traffic within a single stage.'
    },
    {
      id: 'dep15',
      question: 'A team wants production clients to invoke only code that passed testing, while developers keep changing the function. Production should be able to move to a new tested release, or back to the previous one, without clients changing the ARN they call. How should the team set up the Lambda function?',
      options: [
        'Have production call the $LATEST version and restrict who can update the function code',
        'Create a separate function for every release and update clients with the new function name',
        'Publish an immutable version per tested release and move a prod alias between versions',
        'Store each release as a separate layer version and change the layer attached to the function'
      ],
      correctAnswer: 2,
      explanation: 'Published Lambda versions are immutable snapshots of code and configuration, and an alias is a stable pointer that clients invoke by ARN; moving the alias between versions promotes or rolls back without client changes. $LATEST changes with every code update, so production would receive untested code. Creating new functions forces client changes, and swapping layers changes the function code itself rather than giving a stable, versioned release.'
    },
    {
      id: 'dep16',
      question: 'A mobile team needs to start integrating with a new REST endpoint in Amazon API Gateway next week, but the backend service will not be ready for another month. The team needs the endpoint to return a fixed sample JSON response at no backend cost. What should the developer configure?',
      options: [
        'An HTTP proxy integration that points at a placeholder EC2 instance',
        'A mock integration whose integration response returns the sample JSON',
        'A Lambda proxy integration with a function that returns the sample JSON',
        'An AWS service integration that reads the sample JSON from DynamoDB'
      ],
      correctAnswer: 1,
      explanation: 'A mock integration makes API Gateway return a response generated entirely from the integration response and its mapping template, with no backend at all, which is ideal for unblocking client teams. A placeholder EC2 instance, a Lambda function or a DynamoDB table would all work but add resources, cost and code that the requirement does not need.'
    },
    {
      id: 'dep17',
      question: 'A company deploys the same serverless application to dev, test and prod. Each environment uses a different table name, log level and memory size, and the team wants one template to stay the single source of truth. Which approach is the most maintainable?',
      options: [
        'Keep three copies of the template and edit the values in each copy before deploying',
        'Deploy all three environments as resources inside a single stack, with suffixes on each name',
        'Use Parameters for environment-specific values and deploy one stack per environment',
        'Hard-code the prod values and override them in dev and test with manual console changes'
      ],
      correctAnswer: 2,
      explanation: 'Parameters (often combined with Conditions or Mappings keyed on an environment parameter) let one template produce a separate stack per environment, ideally in separate accounts, so every environment is built from the same reviewed code. Template copies drift apart over time. A single stack for all environments means one update or failure affects all of them, and manual console changes cause drift from the template.'
    },
    {
      id: 'dep18',
      question: 'A developer adds unit tests to an AWS CodeBuild project. The build must stop and be reported as failed if any test fails, and the tests must run after dependencies are installed. Where in the buildspec should the test command go?',
      options: [
        'In the env section, as a variable that CodeBuild evaluates before the build starts',
        'In the pre_build or build phase commands, after the install phase',
        'In the artifacts section, so the test output is uploaded with the build output',
        'In the cache section, so test results are reused by the next build run'
      ],
      correctAnswer: 1,
      explanation: 'buildspec phases run in order (install, pre_build, build, post_build), and any command that exits with a non-zero code fails that phase and the build, so running the test command in pre_build or build after install stops a bad build. The env section only defines variables. The artifacts section lists output files, and the cache section stores files such as dependencies between builds; neither runs commands.'
    },
    {
      id: 'dep19',
      question: 'A team runs Jest unit tests in AWS CodeBuild and writes JUnit XML results to a reports folder. Reviewers want to see pass and fail counts and trends for each build in the CodeBuild console instead of reading raw logs. What should the developer add to the buildspec?',
      options: [
        'An artifacts section that uploads the reports folder to an S3 bucket',
        'A post_build command that publishes the XML file to an Amazon SNS topic',
        'A CloudWatch Logs configuration that streams the test output to a log group',
        'A reports section that defines a report group with the JUNITXML file format'
      ],
      correctAnswer: 3,
      explanation: 'The reports section of a buildspec points CodeBuild at test result files (JUnit XML, Cucumber JSON, TestNG and other supported formats) and creates test reports in a report group, which the console shows with pass rates and trends. Uploading the files to S3 or SNS just moves the raw XML, and CloudWatch Logs contains plain log lines without test reporting.'
    },
    {
      id: 'dep20',
      question: 'A CodeBuild project compiles a Java service. The next stage of the pipeline, a CodeDeploy deployment, needs only the JAR file from target/ and the appspec.yml and scripts/ folder from the repository root, not the whole source tree. How should the build define its output?',
      options: [
        'List those paths under files in the artifacts section of the buildspec',
        'Copy the files to /tmp in post_build so the next stage can read them',
        'Add the paths to the cache section so the next stage can reuse them',
        'Set the paths as exported variables in the env section of the buildspec'
      ],
      correctAnswer: 0,
      explanation: 'The artifacts section selects which files become the build output artifact (with options such as base-directory and discard-paths), and CodePipeline passes that artifact to the next stage through its artifact store in S3. Files left in /tmp disappear with the build container. The cache speeds up future builds and is not passed to other stages, and exported variables carry small string values, not files.'
    },
    {
      id: 'dep21',
      question: 'A pipeline in AWS CodePipeline deploys automatically to a staging environment. Company policy requires that a release manager reviews the staging deployment and explicitly allows each release before it reaches production. How should the developer implement this?',
      options: [
        'Disable the transition into the production stage and have the release manager enable it each time',
        'Add a manual approval action before the production deploy, notifying through SNS',
        'Add a CodeBuild action that pauses with a sleep command until the release manager logs in',
        'Create a second pipeline for production that the release manager starts by hand'
      ],
      correctAnswer: 1,
      explanation: 'A manual approval action stops the pipeline at that point until an authorized user approves or rejects it, and it can notify reviewers through Amazon SNS with a link to the staging URL, giving an auditable record. Disabling transitions works mechanically but is not a per-release approval record. A sleeping CodeBuild action wastes build minutes and has no approval semantics, and a separate manual pipeline breaks traceability from one artifact to production.'
    },
    {
      id: 'dep22',
      question: 'A pipeline builds a microservice and deploys it to a staging stack. The team wants every release to run API-level integration tests against staging and to stop automatically if any test fails, before the production stage runs. What is the simplest approach?',
      options: [
        'Add a CodeBuild test action after the staging deploy that fails on any test failure',
        'Run the integration tests in the production stage after the production deploy completes',
        'Have developers run the integration tests locally with sam local start-api before merging',
        'Add a CloudWatch Synthetics canary to production and roll back the release if it fails'
      ],
      correctAnswer: 0,
      explanation: 'A CodeBuild test action placed after the staging deployment runs the integration suite against the live staging endpoint, and a failing command fails the action so the pipeline never reaches production. Testing only after the production deployment exposes users to the defect. Local runs are not enforced and do not test real AWS integrations, and a production canary detects problems after release instead of preventing it.'
    },
    {
      id: 'dep23',
      question: 'An application is deployed to Amazon EC2 instances with AWS CodeDeploy using an in-place deployment. After the new files are copied to the instance, a script must install packages and set file permissions before the application starts. In which appspec.yml lifecycle hook should the script run?',
      options: [
        'ApplicationStop',
        'BeforeInstall',
        'AfterInstall',
        'ValidateService'
      ],
      correctAnswer: 2,
      explanation: 'For EC2 and on-premises deployments the hooks run in the order ApplicationStop, BeforeInstall, (Install), AfterInstall, ApplicationStart and ValidateService. AfterInstall runs after the revision files are copied but before ApplicationStart, which is the right place to configure the new files. ApplicationStop and BeforeInstall run before the new files exist, and ValidateService runs after the application has started, to verify it.'
    },
    {
      id: 'dep24',
      question: 'A web application runs on 10 EC2 instances behind an Application Load Balancer and is deployed with an in-place CodeDeploy deployment. The team wants to keep at least half of the instances serving traffic during each deployment while still finishing reasonably quickly. Which deployment configuration should they choose?',
      options: [
        'CodeDeployDefault.AllAtOnce',
        'CodeDeployDefault.LambdaLinear10PercentEvery1Minute',
        'CodeDeployDefault.OneAtATime',
        'CodeDeployDefault.HalfAtATime'
      ],
      correctAnswer: 3,
      explanation: 'HalfAtATime deploys to up to half of the instances at once, so the other half keep serving traffic and the deployment completes in about two batches. AllAtOnce takes every instance out at the same time, and OneAtATime keeps the most capacity but takes the longest. The Lambda linear configuration applies only to Lambda deployments, not EC2.'
    },
    {
      id: 'dep25',
      question: 'A developer deploys a Lambda function with AWS SAM. New versions must receive 10 percent of production traffic for a few minutes before receiving all of it, and the release must roll back automatically if the function\'s error alarm goes into ALARM during that window. Which SAM configuration meets this requirement?',
      options: [
        'Set AutoPublishAlias and a DeploymentPreference of Linear10PercentEvery10Minutes with no alarms',
        'Set ProvisionedConcurrencyConfig on the function and a CloudWatch alarm that invokes a rollback function',
        'Configure an API Gateway canary release on the stage with 10 percent of traffic and an SNS alarm',
        'Set AutoPublishAlias and a Canary10Percent5Minutes DeploymentPreference listing the alarm'
      ],
      correctAnswer: 3,
      explanation: 'AutoPublishAlias publishes a new version on each deployment, and DeploymentPreference makes CodeDeploy shift alias traffic with a canary configuration while monitoring the listed CloudWatch alarms, rolling back automatically if one fires. A linear configuration shifts traffic in repeated increments rather than one 10 percent step, and without alarms there is no automatic rollback. Provisioned concurrency controls cold starts, not traffic shifting, and an API Gateway canary does not roll back on its own.'
    },
    {
      id: 'dep26',
      question: 'An AWS Elastic Beanstalk environment serves steady production traffic on six instances. The team needs deployments that never reduce serving capacity below six instances, but wants to avoid the cost and time of launching a full second set of instances. Which deployment policy should they use?',
      options: [
        'Rolling',
        'Rolling with additional batch',
        'Immutable',
        'All at once'
      ],
      correctAnswer: 1,
      explanation: 'Rolling with additional batch first launches an extra batch of instances, then updates the existing instances batch by batch, so full capacity is maintained while only one extra batch is paid for. Plain rolling takes each batch out of service and reduces capacity. Immutable launches a full parallel set of new instances, which costs more and takes longer, and all at once causes downtime.'
    },
    {
      id: 'dep27',
      question: 'A team deploys a critical application on AWS Elastic Beanstalk. A failed deployment must never leave existing instances running a mix of old and new code, and rollback should only require terminating the new instances. Which deployment policy best meets these requirements?',
      options: [
        'Immutable',
        'Rolling',
        'Rolling with additional batch',
        'All at once'
      ],
      correctAnswer: 0,
      explanation: 'An immutable deployment launches new instances in a temporary Auto Scaling group and moves them into the environment only after they pass health checks, so the original instances are never modified and a failure is undone by terminating the new instances. Rolling and rolling with additional batch update existing instances in place, so a failure can leave mixed versions that must be redeployed. All at once updates every instance at the same time and risks a full outage.'
    },
    {
      id: 'dep28',
      question: 'A company must move an Elastic Beanstalk application to a new major platform version. The new version must be fully tested against production-like settings before customers use it, and the team needs to switch back quickly if problems appear after cut-over. What should the team do?',
      options: [
        'Perform a rolling deployment with a batch size of one instance and monitor health',
        'Update the platform version in place with the all at once deployment policy',
        'Clone the environment, upgrade and test the clone, then use Swap environment URLs to move traffic',
        'Create a second Auto Scaling group in the same environment and shift weighted traffic with Route 53'
      ],
      correctAnswer: 2,
      explanation: 'A blue/green deployment with a cloned environment lets the team test the new platform separately, and Swap environment URLs (a CNAME swap) moves traffic to it; swapping back reverses the cut-over quickly. Rolling and all at once deployments modify the live environment in place, so the old version is not standing by. Elastic Beanstalk manages its own Auto Scaling group, so a second group inside the same environment is not a supported pattern.'
    },
    {
      id: 'dep29',
      question: 'A developer deploys an application to AWS Elastic Beanstalk and needs every instance to install an operating system package and set an environment property during deployment. The configuration must live in the application source bundle so it is version-controlled with the code. Where should the developer define it?',
      options: [
        'In a .config file in the .ebextensions folder of the source bundle',
        'In an appspec.yml file at the root of the application source bundle',
        'In a buildspec.yml file stored inside the .elasticbeanstalk folder',
        'In the EC2 user data field of the environment launch template'
      ],
      correctAnswer: 0,
      explanation: 'Elastic Beanstalk reads YAML or JSON .config files from the .ebextensions folder at the root of the source bundle, where they can install packages, run commands and set option_settings such as environment properties. appspec.yml is read by CodeDeploy, not Elastic Beanstalk, and buildspec.yml is for CodeBuild. Elastic Beanstalk manages the launch configuration itself, so editing user data directly is not version-controlled with the code.'
    },
    {
      id: 'dep30',
      question: 'A team runs an Amazon ECS service behind an Application Load Balancer and deploys with CodeDeploy blue/green. Before any production traffic reaches the new task set, they want automated tests to call it through a separate port, and the deployment must stop if the tests fail. How should they set this up?',
      options: [
        'Use a rolling update deployment and run the tests in the ValidateService hook',
        'Add an AfterInstall hook in a buildspec file that runs the tests from CodeBuild',
        'Configure ECS Service Auto Scaling to replace tasks that fail their health checks',
        'Add a test listener and run Lambda tests in the AfterAllowTestTraffic hook'
      ],
      correctAnswer: 3,
      explanation: 'In an ECS blue/green deployment, CodeDeploy can route a test listener to the replacement (green) task set, and the AfterAllowTestTraffic hook invokes a Lambda function that runs the tests and reports success or failure, stopping the deployment on failure before production traffic shifts. ValidateService is an EC2/on-premises hook and rolling updates do not create a separate task set. Hooks are defined in appspec, not buildspec, and Auto Scaling replaces unhealthy tasks but does not test a new release.'
    },
    {
      id: 'dep31',
      question: 'A developer updates a CloudFormation stack that changes an Auto Scaling group and its launch template. Even if every resource reports success, the team wants the update rolled back automatically if the application\'s 5XX error alarm goes into ALARM during or shortly after the update. What should the developer configure?',
      options: [
        'A DeletionPolicy of Retain on the Auto Scaling group resource',
        'Rollback triggers on the stack that monitor the 5XX CloudWatch alarm',
        'A stack policy that denies updates to the Auto Scaling group',
        'Drift detection that runs on a schedule after each update'
      ],
      correctAnswer: 1,
      explanation: 'Rollback triggers let CloudFormation monitor specified CloudWatch alarms during a stack create or update and for a monitoring period afterwards, rolling the stack back if any alarm goes into ALARM. DeletionPolicy controls what happens to resources when they are removed, a stack policy only blocks updates, and drift detection reports out-of-band changes without rolling anything back.'
    },
    {
      id: 'dep32',
      question: 'A small team has a React single-page application in a GitHub repository. They want every push to main to build and deploy automatically, preview URLs for pull requests, and a custom domain with HTTPS, all with the least setup and infrastructure to manage. Which service should they use?',
      options: [
        'AWS Elastic Beanstalk with a Node.js platform environment',
        'An S3 bucket and CloudFront distribution updated by a custom CodeBuild project',
        'AWS Amplify Hosting connected to the GitHub repository',
        'Amazon ECS on AWS Fargate with an Application Load Balancer'
      ],
      correctAnswer: 2,
      explanation: 'Amplify Hosting connects to a Git repository and provides managed build and deploy on each push, branch and pull request previews, and custom domains with managed certificates for static and server-side rendered front ends. S3 with CloudFront and a custom CodeBuild project can host the app but requires building the pipeline and previews yourself. Elastic Beanstalk and ECS run servers or containers that a static single-page app does not need.'
    }
  ]
};
