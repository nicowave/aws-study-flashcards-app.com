import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as fs from 'fs';
import * as path from 'path';

const SITE_ORIGINS = [
  'https://aws-study-flashcards-app.com',
  'https://cloud.aws-study-flashcards-app.com',
  'https://ai.aws-study-flashcards-app.com',
  'https://saa.aws-study-flashcards-app.com',
  'https://dva.aws-study-flashcards-app.com',
  'https://architect.aws-study-flashcards-app.com',
  'https://developer.aws-study-flashcards-app.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

// Stripe price IDs aren't secret. They live in the (untracked) functions/.env
// so the Firebase and AWS deployments read the same values.
function loadPriceEnv(): Record<string, string> {
  const envPath = path.join(__dirname, '../../functions/.env');
  const out: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^(STRIPE_PRICE_[A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

export class StudyHubBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -----------------------------------------------------------------
    // DynamoDB — single-table design.
    //   PK = USER#<sub>            SK = PROFILE
    //   PK = USER#<sub>            SK = PROGRESS#<certId>
    //   PK = USER#<sub>            SK = ENTITLEMENTS
    //   (Phase 4 adds CERT#<id> / QUESTION#... items for premium content)
    // -----------------------------------------------------------------
    const table = new dynamodb.Table(this, 'StudyHubTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // never delete customer data on stack teardown
    });

    // -----------------------------------------------------------------
    // Pre-token-generation Lambda — injects entitlements from DynamoDB
    // into every issued JWT (the AWS analog of Firebase custom claims).
    // -----------------------------------------------------------------
    const preTokenFn = new lambda.Function(this, 'PreTokenGenerationFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/pre-token')),
      environment: { TABLE_NAME: table.tableName },
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
    });
    table.grantReadData(preTokenFn);

    // -----------------------------------------------------------------
    // Cognito user pool
    // -----------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'StudyHubUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: { preTokenGeneration: preTokenFn },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Hosted UI domain (Cognito-managed). A custom domain such as
    // auth.aws-study-flashcards-app.com can replace this in Phase 2
    // (requires an ACM cert in us-east-1 + a Route53 alias).
    // NOTE: Cognito domain prefixes may not contain "aws", "amazon", or "cognito".
    const domainPrefix = this.node.tryGetContext('cognitoDomainPrefix') ?? 'study-hub-auth-418272768335';
    const userPoolDomain = userPool.addDomain('HostedUiDomain', {
      cognitoDomain: { domainPrefix },
    });

    // SPA client: no secret, SRP + hosted-UI code flow.
    // Google federation is added in Phase 2 (needs a Google OAuth client
    // secret, which is created in the Google console and stored by the
    // account owner — see README).
    const webClient = userPool.addClient('WebClient', {
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: SITE_ORIGINS.map((o) => `${o}/`),
        logoutUrls: SITE_ORIGINS.map((o) => `${o}/`),
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // -----------------------------------------------------------------
    // HTTP API + Lambda skeleton
    // -----------------------------------------------------------------
    const apiFn = new lambda.Function(this, 'ApiFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
      environment: { TABLE_NAME: table.tableName },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });
    table.grantReadWriteData(apiFn);

    const httpApi = new apigwv2.HttpApi(this, 'StudyHubApi', {
      corsPreflight: {
        allowOrigins: SITE_ORIGINS,
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Authorization', 'Content-Type', 'X-Firebase-AppCheck', 'Firebase-Instance-ID-Token'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    const integration = new HttpLambdaIntegration('ApiIntegration', apiFn);
    const authorizer = new HttpJwtAuthorizer('JwtAuthorizer', userPool.userPoolProviderUrl, {
      jwtAudience: [webClient.userPoolClientId],
    });

    // Public
    httpApi.addRoutes({
      path: '/v1/health',
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });

    // Authenticated
    for (const route of [
      { path: '/v1/me', methods: [apigwv2.HttpMethod.GET] },
      { path: '/v1/progress/{certId}', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT] },
    ]) {
      httpApi.addRoutes({ ...route, integration, authorizer });
    }

    // -----------------------------------------------------------------
    // Payments + cross-site sign-in (migration step 1). Called by the apps
    // with Firebase's httpsCallableFromURL(); still verifies Firebase ID
    // tokens and mirrors purchases into Firebase until sign-in moves.
    // Secret "study-hub/billing" = { stripeApiKey, stripeWebhookSecret,
    // firebaseServiceAccount } — populated by the owner, never in git.
    // -----------------------------------------------------------------
    const billingSecret = secretsmanager.Secret.fromSecretNameV2(this, 'BillingSecret', 'study-hub/billing');
    const callablesFn = new lambda.Function(this, 'CallablesFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/callables')),
      environment: { SECRET_ID: 'study-hub/billing', ...loadPriceEnv() },
      timeout: cdk.Duration.seconds(20),
      memorySize: 512,
    });
    billingSecret.grantRead(callablesFn);

    const callablesIntegration = new HttpLambdaIntegration('CallablesIntegration', callablesFn);
    httpApi.addRoutes({
      path: '/callable/{name}',
      methods: [apigwv2.HttpMethod.POST],
      integration: callablesIntegration,
    });
    httpApi.addRoutes({
      path: '/stripe/webhook',
      methods: [apigwv2.HttpMethod.POST],
      integration: callablesIntegration,
    });

    // -----------------------------------------------------------------
    // Outputs — the frontends consume these in Phase 2
    // -----------------------------------------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: webClient.userPoolClientId });
    new cdk.CfnOutput(this, 'HostedUiBaseUrl', { value: userPoolDomain.baseUrl() });
    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'CallableBaseUrl', { value: `${httpApi.apiEndpoint}/callable` });
    new cdk.CfnOutput(this, 'StripeWebhookUrl', { value: `${httpApi.apiEndpoint}/stripe/webhook` });
  }
}
