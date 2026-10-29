import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
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
  'https://bash.aws-study-flashcards-app.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

// Stripe price IDs aren't secret, but they live in the untracked
// aws-backend/.env (STRIPE_PRICE_*=price_...). Refuse to deploy without them:
// empty prices would switch checkout off. CI only builds (never deploys), so
// it synthesizes without prices.
function loadPriceEnv(): Record<string, string> {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    if (process.env.CI === 'true') return {};
    throw new Error(`Missing ${envPath} (STRIPE_PRICE_* lines; copy it from the main checkout)`);
  }
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^(STRIPE_PRICE_[A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}


// Hidden test builds of each app live at /next/ (./deploy.sh next).
const TEST_PATH = '/next/';

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
    table.grantReadWriteData(preTokenFn); // writes EMAIL#<email> links

    // User-migration + pre-sign-up Lambda — moves old Firebase password
    // accounts on password reset, and guards their emails until then
    const migrateUserFn = new lambda.Function(this, 'MigrateUserFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/migrate-user')),
      environment: { TABLE_NAME: table.tableName },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });
    table.grantReadData(migrateUserFn); // pre-sign-up checks EMAIL# links

    // -----------------------------------------------------------------
    // Cognito user pool
    // -----------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'StudyHubUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      // Sign-up sends a link (like Firebase did), not a code to type in.
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
        emailSubject: 'Verify your AWS Study Hub email',
        emailBody: 'Welcome to AWS Study Hub! {##Click here to verify your email##}, then come back and sign in.',
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      // Same rule as Firebase (6+ characters), so every Firebase password can
      // move over: Cognito rejects migrated passwords that break its policy.
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: { preTokenGeneration: preTokenFn, userMigration: migrateUserFn, preSignUp: migrateUserFn },
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

    // Branded sign-in address, so Google's consent screen shows our domain.
    // Uses the existing *.aws-study-flashcards-app.com certificate (us-east-1).
    const authDomainName = 'auth.aws-study-flashcards-app.com';
    const authDomain = userPool.addDomain('AuthCustomDomain', {
      customDomain: {
        domainName: authDomainName,
        certificate: acm.Certificate.fromCertificateArn(
          this,
          'WildcardCert',
          'arn:aws:acm:us-east-1:418272768335:certificate/9c5abd7d-76d2-4506-9f2b-1f067e761abc',
        ),
      },
    });
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'SiteZone', {
      hostedZoneId: 'Z03018293W2CBVCSFY7I2',
      zoneName: 'aws-study-flashcards-app.com',
    });
    new route53.ARecord(this, 'AuthDomainAlias', {
      zone: hostedZone,
      recordName: 'auth',
      target: route53.RecordTarget.fromAlias(new route53Targets.UserPoolDomainTarget(authDomain)),
    });

    // "Sign in with Google". The OAuth client lives in Google Cloud (project
    // aws-study-hub); scripts/google-signin-to-aws.sh stores its ID and secret
    // in "study-hub/google-oauth". CloudFormation resolves both at deploy time.
    const googleSecretId = 'study-hub/google-oauth';
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: cdk.SecretValue.secretsManager(googleSecretId, { jsonField: 'clientId' }).unsafeUnwrap(),
      clientSecretValue: cdk.SecretValue.secretsManager(googleSecretId, { jsonField: 'clientSecret' }),
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    });

    // SPA client: no secret. Email/password uses USER_PASSWORD_AUTH (the
    // migration trigger needs the password); Google uses the hosted code flow.
    const webClient = userPool.addClient('WebClient', {
      authFlows: { userSrp: true, userPassword: true },
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          ...SITE_ORIGINS.map((o) => `${o}/`),
          ...SITE_ORIGINS.filter((o) => o.startsWith('https://')).map((o) => `${o}${TEST_PATH}`),
        ],
        logoutUrls: SITE_ORIGINS.map((o) => `${o}/`),
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });
    webClient.node.addDependency(googleProvider);

    // -----------------------------------------------------------------
    // HTTP API + Lambda skeleton
    // -----------------------------------------------------------------
    const apiFn = new lambda.Function(this, 'ApiFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
      environment: { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });
    table.grantReadWriteData(apiFn);
    userPool.grant(apiFn, 'cognito-idp:AdminDeleteUser'); // DELETE /v1/me

    const httpApi = new apigwv2.HttpApi(this, 'StudyHubApi', {
      corsPreflight: {
        allowOrigins: SITE_ORIGINS,
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Authorization', 'Content-Type'],
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
      { path: '/v1/me', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PATCH, apigwv2.HttpMethod.DELETE] },
      { path: '/v1/progress/{certId}', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT] },
    ]) {
      httpApi.addRoutes({ ...route, integration, authorizer });
    }

    // -----------------------------------------------------------------
    // Payments (Stripe checkout, billing portal, webhook). The apps send their
    // Cognito ID token; purchases and entitlements are stored in the table.
    // Secret "study-hub/billing" = { stripeApiKey, stripeWebhookSecret },
    // populated by the owner, never in git.
    // -----------------------------------------------------------------
    const billingSecret = secretsmanager.Secret.fromSecretNameV2(this, 'BillingSecret', 'study-hub/billing');
    const callablesFn = new lambda.Function(this, 'CallablesFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/callables')),
      environment: {
        SECRET_ID: 'study-hub/billing',
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: webClient.userPoolClientId,
        ...loadPriceEnv(),
      },
      timeout: cdk.Duration.seconds(20),
      memorySize: 512,
    });
    billingSecret.grantRead(callablesFn);
    table.grantReadWriteData(callablesFn);

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
    new cdk.CfnOutput(this, 'AuthBaseUrl', { value: `https://${authDomainName}` });
    new cdk.CfnOutput(this, 'GoogleRedirectUri', { value: `https://${authDomainName}/oauth2/idpresponse` });
    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'CallableBaseUrl', { value: `${httpApi.apiEndpoint}/callable` });
    new cdk.CfnOutput(this, 'StripeWebhookUrl', { value: `${httpApi.apiEndpoint}/stripe/webhook` });
  }
}
