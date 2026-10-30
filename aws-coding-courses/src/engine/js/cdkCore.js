// A pretend AWS Cloud Development Kit (aws-cdk-lib + constructs) for the
// TypeScript course: the same construct names and props as the real library,
// and app.synth() turns them into a CloudFormation-style template the checks
// can read. Real CDK deploys nothing either until `cdk deploy`.
//
// Self-contained (no imports): loaded as a data: URL module.

const SYNTHS = [];
let tokenCount = 0;
const TOKENS = new Map();

// Values that only exist after deploy (names, ARNs, URLs) are tokens, like real CDK
const token = (value) => {
  tokenCount += 1;
  const t = `\${Token[TOKEN.${tokenCount}]}`;
  TOKENS.set(t, value);
  return t;
};

const resolve = (v) => {
  if (typeof v === 'string') {
    if (TOKENS.has(v)) return TOKENS.get(v);
    if (v.includes('${Token[')) {
      const parts = v.split(/(\$\{Token\[TOKEN\.\d+\]\})/).filter(Boolean).map((p) => (TOKENS.has(p) ? TOKENS.get(p) : p));
      return { 'Fn::Join': ['', parts] };
    }
    return v;
  }
  if (v instanceof Duration) return v.toSeconds();
  if (Array.isArray(v)) return v.map(resolve);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, resolve(x)]));
  }
  return v;
};

const hash = (text) => {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

// ---------------------------------------------------------------------------
// constructs
// ---------------------------------------------------------------------------

export class Construct {
  constructor(scope, id) {
    if (scope !== undefined && !(scope instanceof Construct)) throw new TypeError(`The scope of '${id}' must be a construct (usually \`this\` inside a stack)`);
    if (typeof id !== 'string' || (scope && !id)) throw new TypeError('Every construct needs an id: a string unique within its scope');
    if (scope && scope.node.children.some((c) => c.node.id === id)) {
      throw new Error(`There is already a Construct with name '${id}' in ${scope.constructor.name}${scope.node.id ? ` [${scope.node.id}]` : ''}`);
    }
    this.node = { id, scope, children: [], path: scope && scope.node.path ? `${scope.node.path}/${id}` : id };
    if (scope) scope.node.children.push(this);
  }

  get stack() {
    let s = this;
    while (s && !(s instanceof Stack)) s = s.node.scope;
    if (!s) throw new Error(`'${this.node.id}' must be created inside a Stack`);
    return s;
  }
}

// ---------------------------------------------------------------------------
// aws-cdk-lib core
// ---------------------------------------------------------------------------

export class Duration {
  constructor(seconds) { this.seconds = seconds; }
  static seconds(n) { return new Duration(n); }
  static minutes(n) { return new Duration(n * 60); }
  static hours(n) { return new Duration(n * 3600); }
  static days(n) { return new Duration(n * 86400); }
  toSeconds() { return this.seconds; }
  toMinutes() { return this.seconds / 60; }
}

export const RemovalPolicy = { DESTROY: 'Delete', RETAIN: 'Retain', SNAPSHOT: 'Snapshot', RETAIN_ON_UPDATE_OR_DELETE: 'RetainExceptOnCreate' };

export class App extends Construct {
  constructor(props = {}) {
    super(undefined, '');
    this.props = props;
  }

  synth() {
    const stacks = this.node.children.filter((c) => c instanceof Stack);
    const out = { stacks: stacks.map((s) => ({ stackName: s.stackName, id: s.node.id, template: s.template() })) };
    SYNTHS.push(out);
    return out;
  }
}

export class Stack extends Construct {
  constructor(scope, id, props = {}) {
    if (!(scope instanceof App) && !(scope instanceof Stage)) throw new TypeError(`Stack '${id}' must be created inside the App: new ${id}(app, '${id}')`);
    super(scope, id);
    this.props = props;
    this.stackName = props.stackName || id;
    this.account = props.env?.account || token({ Ref: 'AWS::AccountId' });
    this.region = props.env?.region || token({ Ref: 'AWS::Region' });
    this.resources = {};
    this.outputs = {};
    this.tags = { ...(props.tags || {}) };
  }

  static of(construct) { return construct.stack; }

  logicalId(construct, suffix = '') {
    const parts = construct.node.path.split('/').slice(1);
    const human = parts.join('').replace(/[^A-Za-z0-9]/g, '') + suffix;
    return `${human}${hash(construct.node.path + suffix)}`;
  }

  addResource(construct, type, properties, { suffix = '', dependsOn, deletion } = {}) {
    const id = this.logicalId(construct, suffix);
    this.resources[id] = { Type: type, Properties: properties, ...(dependsOn ? { DependsOn: dependsOn } : {}), ...(deletion ? { DeletionPolicy: deletion, UpdateReplacePolicy: deletion } : {}) };
    return id;
  }

  template() {
    const t = { Resources: resolve(this.resources) };
    if (Object.keys(this.outputs).length) t.Outputs = resolve(this.outputs);
    return t;
  }
}

export class Stage extends Construct {}

export class CfnOutput extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props || props.value === undefined) throw new Error(`CfnOutput '${id}' needs a value`);
    this.stack.outputs[id] = { Value: props.value, ...(props.description ? { Description: props.description } : {}), ...(props.exportName ? { Export: { Name: props.exportName } } : {}) };
  }
}

export class Tags {
  static of(scope) {
    return { add: (key, value) => { scope.stack.tags[key] = value; } };
  }
}

// ---------------------------------------------------------------------------
// IAM (roles and policies the grants produce)
// ---------------------------------------------------------------------------

export const Effect = { ALLOW: 'Allow', DENY: 'Deny' };

export class PolicyStatement {
  constructor(props = {}) {
    this.effect = props.effect || 'Allow';
    this.actions = [...(props.actions || [])];
    this.resources = [...(props.resources || [])];
  }

  toJSON() {
    return { Effect: this.effect, Action: this.actions.length === 1 ? this.actions[0] : this.actions, Resource: this.resources.length === 1 ? this.resources[0] : this.resources };
  }
}

export class ServicePrincipal {
  constructor(service) { this.service = service; }
}

export class Role extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);
    this.statements = [];
    this.managed = [...(props.managedPolicies || [])];
    this.logicalId = this.stack.addResource(this, 'AWS::IAM::Role', {
      AssumeRolePolicyDocument: { Version: '2012-10-17', Statement: [{ Action: 'sts:AssumeRole', Effect: 'Allow', Principal: { Service: props.assumedBy?.service || 'lambda.amazonaws.com' } }] },
      ManagedPolicyArns: this.managed,
    });
    this.roleArn = token({ 'Fn::GetAtt': [this.logicalId, 'Arn'] });
  }

  addToPolicy(statement) {
    this.statements.push(statement);
    const policyId = this.stack.logicalId(this, 'DefaultPolicy');
    this.stack.resources[policyId] = {
      Type: 'AWS::IAM::Policy',
      Properties: { PolicyDocument: { Version: '2012-10-17', Statement: this.statements.map((s) => s.toJSON()) }, PolicyName: policyId, Roles: [{ Ref: this.logicalId }] },
    };
  }
}

export class ManagedPolicy {
  static fromAwsManagedPolicyName(name) {
    return `arn:aws:iam::aws:policy/${name}`;
  }
}

const grant = (grantee, actions, resources) => {
  if (!grantee || typeof grantee.addToRolePolicy !== 'function') throw new TypeError('grant…() needs something with a role, like a lambda.Function');
  grantee.addToRolePolicy(new PolicyStatement({ actions, resources }));
};

// ---------------------------------------------------------------------------
// S3
// ---------------------------------------------------------------------------

export const BlockPublicAccess = { BLOCK_ALL: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true } };
export const BucketEncryption = { S3_MANAGED: 'AES256', KMS_MANAGED: 'aws:kms', UNENCRYPTED: undefined };

export class Bucket extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);
    if (props.autoDeleteObjects && props.removalPolicy !== RemovalPolicy.DESTROY) {
      throw new Error("Cannot use 'autoDeleteObjects' property on a bucket without setting removal policy to 'DESTROY'.");
    }
    this.logicalId = this.stack.addResource(this, 'AWS::S3::Bucket', {
      BucketName: props.bucketName,
      VersioningConfiguration: props.versioned ? { Status: 'Enabled' } : undefined,
      PublicAccessBlockConfiguration: props.blockPublicAccess,
      BucketEncryption: props.encryption ? { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: props.encryption } }] } : undefined,
      WebsiteConfiguration: props.websiteIndexDocument ? { IndexDocument: props.websiteIndexDocument } : undefined,
      Tags: props.autoDeleteObjects ? [{ Key: 'aws-cdk:auto-delete-objects', Value: 'true' }] : undefined,
    }, { deletion: props.removalPolicy || 'Retain' });
    this.bucketName = token({ Ref: this.logicalId });
    this.bucketArn = token({ 'Fn::GetAtt': [this.logicalId, 'Arn'] });
    this.bucketDomainName = token({ 'Fn::GetAtt': [this.logicalId, 'DomainName'] });
    this.bucketRegionalDomainName = token({ 'Fn::GetAtt': [this.logicalId, 'RegionalDomainName'] });
  }

  arnForObjects(pattern) { return `${this.bucketArn}/${pattern}`; }
  grantRead(grantee) { grant(grantee, ['s3:GetObject*', 's3:GetBucket*', 's3:List*'], [this.bucketArn, this.arnForObjects('*')]); }
  grantWrite(grantee) { grant(grantee, ['s3:DeleteObject*', 's3:PutObject', 's3:Abort*'], [this.bucketArn, this.arnForObjects('*')]); }
  grantPut(grantee) { grant(grantee, ['s3:PutObject', 's3:Abort*'], [this.arnForObjects('*')]); }
  grantReadWrite(grantee) { this.grantRead(grantee); this.grantWrite(grantee); }
}

// ---------------------------------------------------------------------------
// DynamoDB
// ---------------------------------------------------------------------------

export const AttributeType = { STRING: 'S', NUMBER: 'N', BINARY: 'B' };
export const BillingMode = { PAY_PER_REQUEST: 'PAY_PER_REQUEST', PROVISIONED: 'PROVISIONED' };

export class Table extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props?.partitionKey) throw new Error(`Table '${id}' needs a partitionKey, like { name: 'pk', type: AttributeType.STRING }`);
    const keys = [props.partitionKey, props.sortKey].filter(Boolean);
    const billing = props.billingMode || BillingMode.PROVISIONED;
    this.logicalId = this.stack.addResource(this, 'AWS::DynamoDB::Table', {
      TableName: props.tableName,
      KeySchema: keys.map((k, n) => ({ AttributeName: k.name, KeyType: n === 0 ? 'HASH' : 'RANGE' })),
      AttributeDefinitions: keys.map((k) => ({ AttributeName: k.name, AttributeType: k.type })),
      BillingMode: billing === BillingMode.PAY_PER_REQUEST ? 'PAY_PER_REQUEST' : undefined,
      ProvisionedThroughput: billing === BillingMode.PROVISIONED ? { ReadCapacityUnits: props.readCapacity || 5, WriteCapacityUnits: props.writeCapacity || 5 } : undefined,
      TimeToLiveSpecification: props.timeToLiveAttribute ? { AttributeName: props.timeToLiveAttribute, Enabled: true } : undefined,
      PointInTimeRecoverySpecification: props.pointInTimeRecovery ? { PointInTimeRecoveryEnabled: true } : undefined,
    }, { deletion: props.removalPolicy || 'Retain' });
    this.tableName = token({ Ref: this.logicalId });
    this.tableArn = token({ 'Fn::GetAtt': [this.logicalId, 'Arn'] });
  }

  grantReadData(grantee) { grant(grantee, ['dynamodb:BatchGetItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:ConditionCheckItem', 'dynamodb:DescribeTable'], [this.tableArn]); }
  grantWriteData(grantee) { grant(grantee, ['dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:DescribeTable'], [this.tableArn]); }
  grantReadWriteData(grantee) {
    grant(grantee, ['dynamodb:BatchGetItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:ConditionCheckItem',
      'dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:DescribeTable'], [this.tableArn]);
  }
}

// ---------------------------------------------------------------------------
// Lambda
// ---------------------------------------------------------------------------

export class Runtime {
  constructor(name) { this.name = name; }
  toString() { return this.name; }
}
Runtime.NODEJS_22_X = new Runtime('nodejs22.x');
Runtime.NODEJS_20_X = new Runtime('nodejs20.x');
Runtime.PYTHON_3_13 = new Runtime('python3.13');
Runtime.PYTHON_3_12 = new Runtime('python3.12');

export class Code {
  constructor(props) { Object.assign(this, props); }
  static fromAsset(path) {
    if (typeof path !== 'string' || !path) throw new TypeError('Code.fromAsset() needs the path to the folder with your function code');
    return new Code({ asset: path });
  }
  static fromInline(code) { return new Code({ inline: code }); }
}

export class Function extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props?.runtime || !props.handler || !props.code) throw new Error(`Function '${id}' needs runtime, handler and code`);
    if (props.timeout && props.timeout.toSeconds() > 900) throw new Error(`Function '${id}': timeout can't be more than 15 minutes`);
    this.role = new Role(this, 'ServiceRole', { managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')] });
    this.environment = { ...(props.environment || {}) };
    this.logicalId = this.stack.addResource(this, 'AWS::Lambda::Function', {
      FunctionName: props.functionName,
      Runtime: props.runtime.name,
      Handler: props.handler,
      Code: props.code.inline ? { ZipFile: props.code.inline } : { S3Bucket: { 'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}' }, S3Key: `${hash(props.code.asset)}.zip`, 'aws:asset:path': props.code.asset },
      Role: this.role.roleArn,
      Timeout: props.timeout ? props.timeout.toSeconds() : 3,
      MemorySize: props.memorySize,
      Environment: { Variables: this.environment },
    }, { dependsOn: [this.role.logicalId] });
    this.functionName = token({ Ref: this.logicalId });
    this.functionArn = token({ 'Fn::GetAtt': [this.logicalId, 'Arn'] });
  }

  addEnvironment(key, value) { this.environment[key] = value; return this; }
  addToRolePolicy(statement) { this.role.addToPolicy(statement); }
  grantInvoke(grantee) { grant(grantee, ['lambda:InvokeFunction'], [this.functionArn]); }
}

export class NodejsFunction extends Function {
  constructor(scope, id, props = {}) {
    const { entry, handler, ...rest } = props;
    super(scope, id, { ...rest, runtime: props.runtime || Runtime.NODEJS_22_X, handler: `index.${handler || 'handler'}`, code: Code.fromAsset(entry || `lambda/${id}.ts`) });
  }
}

// ---------------------------------------------------------------------------
// API Gateway HTTP APIs
// ---------------------------------------------------------------------------

export const HttpMethod = { ANY: 'ANY', GET: 'GET', POST: 'POST', PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE', OPTIONS: 'OPTIONS', HEAD: 'HEAD' };
export const CorsHttpMethod = { ...HttpMethod };

export class HttpLambdaIntegration {
  constructor(id, handler) {
    if (!(handler instanceof Function)) throw new TypeError(`HttpLambdaIntegration('${id}', …) needs a lambda.Function`);
    this.id = id;
    this.handler = handler;
  }
}

export class HttpUserPoolAuthorizer {
  constructor(id, userPool, props = {}) {
    this.id = id;
    this.userPool = userPool;
    this.clients = props.userPoolClients || [];
  }
}

export class HttpApi extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);
    const cors = props.corsPreflight;
    this.logicalId = this.stack.addResource(this, 'AWS::ApiGatewayV2::Api', {
      Name: props.apiName || id,
      ProtocolType: 'HTTP',
      CorsConfiguration: cors ? { AllowOrigins: cors.allowOrigins, AllowMethods: cors.allowMethods, AllowHeaders: cors.allowHeaders, MaxAge: cors.maxAge?.toSeconds() } : undefined,
    });
    this.stack.addResource(this, 'AWS::ApiGatewayV2::Stage', { ApiId: { Ref: this.logicalId }, StageName: '$default', AutoDeploy: true }, { suffix: 'DefaultStage' });
    this.apiId = token({ Ref: this.logicalId });
    this.apiEndpoint = token({ 'Fn::GetAtt': [this.logicalId, 'ApiEndpoint'] });
    this.url = `${this.apiEndpoint}/`;
    this.routes = [];
    this.defaultAuthorizer = props.defaultAuthorizer;
  }

  addRoutes(options) {
    if (!options?.path?.startsWith('/')) throw new Error("Route paths must start with '/', like '/progress'");
    if (!options.integration) throw new Error('addRoutes() needs an integration, like new HttpLambdaIntegration(...)');
    const methods = options.methods || [HttpMethod.ANY];
    const integration = options.integration;
    const integrationId = this.stack.addResource(this, 'AWS::ApiGatewayV2::Integration', {
      ApiId: { Ref: this.logicalId }, IntegrationType: 'AWS_PROXY', IntegrationUri: integration.handler.functionArn, PayloadFormatVersion: '2.0',
    }, { suffix: `${integration.id}Integration` });
    this.stack.addResource(this, 'AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction', FunctionName: integration.handler.functionArn, Principal: 'apigateway.amazonaws.com',
    }, { suffix: `${integration.id}Permission` });
    const authorizer = options.authorizer || this.defaultAuthorizer;
    let authorizerId;
    if (authorizer) {
      authorizerId = this.stack.addResource(this, 'AWS::ApiGatewayV2::Authorizer', {
        ApiId: { Ref: this.logicalId }, AuthorizerType: 'JWT', Name: authorizer.id, IdentitySource: ['$request.header.Authorization'],
        JwtConfiguration: { Audience: authorizer.clients.map((c) => c.userPoolClientId), Issuer: `https://cognito-idp.\${AWS::Region}.amazonaws.com/${authorizer.userPool.userPoolId}` },
      }, { suffix: `${authorizer.id}Authorizer` });
    }
    for (const method of methods) {
      const key = `${method} ${options.path}`;
      if (this.routes.includes(key)) throw new Error(`Route '${key}' already exists`);
      this.routes.push(key);
      this.stack.addResource(this, 'AWS::ApiGatewayV2::Route', {
        ApiId: { Ref: this.logicalId }, RouteKey: key, Target: { 'Fn::Join': ['', ['integrations/', { Ref: integrationId }]] },
        ...(authorizerId ? { AuthorizationType: 'JWT', AuthorizerId: { Ref: authorizerId } } : {}),
      }, { suffix: `${method}${options.path.replace(/[^A-Za-z0-9]/g, '')}Route` });
    }
    return this;
  }
}

// ---------------------------------------------------------------------------
// Cognito
// ---------------------------------------------------------------------------

export class UserPoolClient extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props?.userPool) throw new Error(`UserPoolClient '${id}' needs a userPool`);
    const flows = props.authFlows || {};
    this.logicalId = this.stack.addResource(this, 'AWS::Cognito::UserPoolClient', {
      UserPoolId: props.userPool.userPoolId,
      GenerateSecret: !!props.generateSecret,
      ExplicitAuthFlows: [flows.userPassword && 'ALLOW_USER_PASSWORD_AUTH', flows.userSrp && 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'].filter(Boolean),
    });
    this.userPoolClientId = token({ Ref: this.logicalId });
  }
}

export class UserPool extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);
    this.logicalId = this.stack.addResource(this, 'AWS::Cognito::UserPool', {
      UserPoolName: props.userPoolName,
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: !props.selfSignUpEnabled },
      UsernameAttributes: props.signInAliases?.email ? ['email'] : undefined,
      AutoVerifiedAttributes: props.autoVerify?.email ? ['email'] : undefined,
      Policies: props.passwordPolicy ? { PasswordPolicy: { MinimumLength: props.passwordPolicy.minLength || 8 } } : undefined,
    }, { deletion: props.removalPolicy || 'Retain' });
    this.userPoolId = token({ Ref: this.logicalId });
    this.userPoolArn = token({ 'Fn::GetAtt': [this.logicalId, 'Arn'] });
  }

  addClient(id, props = {}) { return new UserPoolClient(this, id, { ...props, userPool: this }); }
}

// ---------------------------------------------------------------------------
// CloudFront and bucket deployments (website hosting)
// ---------------------------------------------------------------------------

export const ViewerProtocolPolicy = { REDIRECT_TO_HTTPS: 'redirect-to-https', HTTPS_ONLY: 'https-only', ALLOW_ALL: 'allow-all' };

export class S3BucketOrigin {
  constructor(bucket) { this.bucket = bucket; }
  static withOriginAccessControl(bucket) {
    if (!(bucket instanceof Bucket)) throw new TypeError('S3BucketOrigin.withOriginAccessControl() needs an s3.Bucket');
    return new S3BucketOrigin(bucket);
  }
}

export class Distribution extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props?.defaultBehavior?.origin) throw new Error(`Distribution '${id}' needs defaultBehavior: { origin: ... }`);
    const bucket = props.defaultBehavior.origin.bucket;
    const oac = this.stack.addResource(this, 'AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: { Name: `${id}OAC`, OriginAccessControlOriginType: 's3', SigningBehavior: 'always', SigningProtocol: 'sigv4' },
    }, { suffix: 'OriginAccessControl' });
    this.logicalId = this.stack.addResource(this, 'AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Enabled: true,
        DefaultRootObject: props.defaultRootObject,
        Origins: [{ Id: `${id}Origin1`, DomainName: bucket.bucketRegionalDomainName, OriginAccessControlId: { 'Fn::GetAtt': [oac, 'Id'] }, S3OriginConfig: { OriginAccessIdentity: '' } }],
        DefaultCacheBehavior: { TargetOriginId: `${id}Origin1`, ViewerProtocolPolicy: props.defaultBehavior.viewerProtocolPolicy || 'allow-all', Compress: true },
        CustomErrorResponses: props.errorResponses?.map((e) => ({ ErrorCode: e.httpStatus, ResponseCode: e.responseHttpStatus, ResponsePagePath: e.responsePagePath })),
      },
    });
    this.distributionId = token({ Ref: this.logicalId });
    this.distributionDomainName = token({ 'Fn::GetAtt': [this.logicalId, 'DomainName'] });
  }
}

export class Source {
  static asset(path) { return { asset: path }; }
}

export class BucketDeployment extends Construct {
  constructor(scope, id, props) {
    super(scope, id);
    if (!props?.sources?.length || !props.destinationBucket) throw new Error(`BucketDeployment '${id}' needs sources and destinationBucket`);
    this.stack.addResource(this, 'Custom::CDKBucketDeployment', {
      SourceObjectKeys: props.sources.map((s) => `${hash(s.asset)}.zip`),
      DestinationBucketName: props.destinationBucket.bucketName,
      DistributionId: props.distribution?.distributionId,
      DistributionPaths: props.distributionPaths,
    });
  }
}

// For the practice runner: every template synthesized during a run
export const practice = {
  synths: SYNTHS,
  reset() { SYNTHS.length = 0; TOKENS.clear(); tokenCount = 0; },
};
