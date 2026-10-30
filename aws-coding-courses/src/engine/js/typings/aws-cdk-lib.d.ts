// Types for the practice AWS Cloud Development Kit: the constructs and
// props the TypeScript course uses, named like the real aws-cdk-lib.

declare module 'constructs' {
  export interface Node { readonly id: string; readonly path: string; }
  export class Construct {
    constructor(scope: Construct, id: string);
    readonly node: Node;
  }
}

declare module 'aws-cdk-lib' {
  import { Construct } from 'constructs';
  export class Duration {
    static seconds(amount: number): Duration;
    static minutes(amount: number): Duration;
    static hours(amount: number): Duration;
    static days(amount: number): Duration;
    toSeconds(): number;
    toMinutes(): number;
  }
  export enum RemovalPolicy { DESTROY = 'Delete', RETAIN = 'Retain', SNAPSHOT = 'Snapshot', RETAIN_ON_UPDATE_OR_DELETE = 'RetainExceptOnCreate' }
  export interface Environment { account?: string; region?: string; }
  export interface StackProps { env?: Environment; stackName?: string; description?: string; tags?: Record<string, string>; }
  export interface StageSynthesis { stacks: { stackName: string; id: string; template: CloudFormationTemplate }[]; }
  export interface CloudFormationTemplate {
    Resources: Record<string, { Type: string; Properties?: Record<string, any>; DependsOn?: string[]; DeletionPolicy?: string }>;
    Outputs?: Record<string, { Value: any; Description?: string }>;
  }
  export class App extends Construct {
    constructor(props?: { context?: Record<string, any> });
    synth(): StageSynthesis;
  }
  export class Stage extends Construct {}
  export class Stack extends Construct {
    constructor(scope: Construct, id: string, props?: StackProps);
    readonly stackName: string;
    readonly account: string;
    readonly region: string;
    static of(construct: Construct): Stack;
  }
  export interface CfnOutputProps { value: string; description?: string; exportName?: string; }
  export class CfnOutput extends Construct {
    constructor(scope: Construct, id: string, props: CfnOutputProps);
  }
  export class Tags {
    static of(scope: Construct): { add(key: string, value: string): void };
  }

  export * as aws_s3 from 'aws-cdk-lib/aws-s3';
  export * as aws_dynamodb from 'aws-cdk-lib/aws-dynamodb';
  export * as aws_lambda from 'aws-cdk-lib/aws-lambda';
  export * as aws_lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
  export * as aws_apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
  export * as aws_apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
  export * as aws_apigatewayv2_authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
  export * as aws_cognito from 'aws-cdk-lib/aws-cognito';
  export * as aws_iam from 'aws-cdk-lib/aws-iam';
  export * as aws_cloudfront from 'aws-cdk-lib/aws-cloudfront';
  export * as aws_cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
  export * as aws_s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
}

declare module 'aws-cdk-lib/aws-iam' {
  import { Construct } from 'constructs';
  export enum Effect { ALLOW = 'Allow', DENY = 'Deny' }
  export interface PolicyStatementProps { effect?: Effect; actions?: string[]; resources?: string[]; }
  export class PolicyStatement { constructor(props?: PolicyStatementProps); }
  export interface IGrantable { addToRolePolicy(statement: PolicyStatement): void; }
  export class ServicePrincipal { constructor(service: string); }
  export class ManagedPolicy { static fromAwsManagedPolicyName(name: string): string; }
  export class Role extends Construct {
    constructor(scope: Construct, id: string, props: { assumedBy: ServicePrincipal; managedPolicies?: string[] });
    readonly roleArn: string;
    addToPolicy(statement: PolicyStatement): void;
  }
}

declare module 'aws-cdk-lib/aws-s3' {
  import { Construct } from 'constructs';
  import { RemovalPolicy } from 'aws-cdk-lib';
  import { IGrantable } from 'aws-cdk-lib/aws-iam';
  export class BlockPublicAccess { static readonly BLOCK_ALL: BlockPublicAccess; private __brand: 'BlockPublicAccess'; }
  export enum BucketEncryption { S3_MANAGED = 'AES256', KMS_MANAGED = 'aws:kms', UNENCRYPTED = 'none' }
  export interface BucketProps {
    bucketName?: string;
    versioned?: boolean;
    removalPolicy?: RemovalPolicy;
    autoDeleteObjects?: boolean;
    blockPublicAccess?: BlockPublicAccess;
    encryption?: BucketEncryption;
    websiteIndexDocument?: string;
  }
  export class Bucket extends Construct {
    constructor(scope: Construct, id: string, props?: BucketProps);
    readonly bucketName: string;
    readonly bucketArn: string;
    readonly bucketDomainName: string;
    readonly bucketRegionalDomainName: string;
    arnForObjects(keyPattern: string): string;
    grantRead(grantee: IGrantable): void;
    grantWrite(grantee: IGrantable): void;
    grantPut(grantee: IGrantable): void;
    grantReadWrite(grantee: IGrantable): void;
  }
}

declare module 'aws-cdk-lib/aws-dynamodb' {
  import { Construct } from 'constructs';
  import { RemovalPolicy } from 'aws-cdk-lib';
  import { IGrantable } from 'aws-cdk-lib/aws-iam';
  export enum AttributeType { STRING = 'S', NUMBER = 'N', BINARY = 'B' }
  export enum BillingMode { PAY_PER_REQUEST = 'PAY_PER_REQUEST', PROVISIONED = 'PROVISIONED' }
  export interface Attribute { name: string; type: AttributeType; }
  export interface TableProps {
    partitionKey: Attribute;
    sortKey?: Attribute;
    tableName?: string;
    billingMode?: BillingMode;
    readCapacity?: number;
    writeCapacity?: number;
    removalPolicy?: RemovalPolicy;
    timeToLiveAttribute?: string;
    pointInTimeRecovery?: boolean;
  }
  export class Table extends Construct {
    constructor(scope: Construct, id: string, props: TableProps);
    readonly tableName: string;
    readonly tableArn: string;
    grantReadData(grantee: IGrantable): void;
    grantWriteData(grantee: IGrantable): void;
    grantReadWriteData(grantee: IGrantable): void;
  }
}

declare module 'aws-cdk-lib/aws-lambda' {
  import { Construct } from 'constructs';
  import { Duration } from 'aws-cdk-lib';
  import { IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
  export class Runtime {
    static readonly NODEJS_22_X: Runtime;
    static readonly NODEJS_20_X: Runtime;
    static readonly PYTHON_3_13: Runtime;
    static readonly PYTHON_3_12: Runtime;
    readonly name: string;
  }
  export class Code {
    static fromAsset(path: string): Code;
    static fromInline(code: string): Code;
    private __brand: 'Code';
  }
  export interface FunctionProps {
    runtime: Runtime;
    handler: string;
    code: Code;
    functionName?: string;
    environment?: Record<string, string>;
    timeout?: Duration;
    memorySize?: number;
    description?: string;
  }
  export class Function extends Construct implements IGrantable {
    constructor(scope: Construct, id: string, props: FunctionProps);
    readonly functionName: string;
    readonly functionArn: string;
    addEnvironment(key: string, value: string): this;
    addToRolePolicy(statement: PolicyStatement): void;
    grantInvoke(grantee: IGrantable): void;
  }
}

declare module 'aws-cdk-lib/aws-lambda-nodejs' {
  import { Construct } from 'constructs';
  import { Function, FunctionProps, Runtime } from 'aws-cdk-lib/aws-lambda';
  export interface NodejsFunctionProps extends Omit<FunctionProps, 'runtime' | 'handler' | 'code'> {
    entry?: string;
    handler?: string;
    runtime?: Runtime;
  }
  export class NodejsFunction extends Function {
    constructor(scope: Construct, id: string, props?: NodejsFunctionProps);
  }
}

declare module 'aws-cdk-lib/aws-apigatewayv2' {
  import { Construct } from 'constructs';
  import { Duration } from 'aws-cdk-lib';
  export enum HttpMethod { ANY = 'ANY', GET = 'GET', POST = 'POST', PUT = 'PUT', PATCH = 'PATCH', DELETE = 'DELETE', OPTIONS = 'OPTIONS', HEAD = 'HEAD' }
  export enum CorsHttpMethod { ANY = 'ANY', GET = 'GET', POST = 'POST', PUT = 'PUT', PATCH = 'PATCH', DELETE = 'DELETE', OPTIONS = 'OPTIONS', HEAD = 'HEAD' }
  export interface HttpRouteIntegration { readonly id: string; }
  export interface HttpRouteAuthorizer { readonly id: string; }
  export interface CorsPreflightOptions { allowOrigins?: string[]; allowMethods?: CorsHttpMethod[]; allowHeaders?: string[]; maxAge?: Duration; }
  export interface HttpApiProps { apiName?: string; corsPreflight?: CorsPreflightOptions; defaultAuthorizer?: HttpRouteAuthorizer; }
  export interface AddRoutesOptions { path: string; methods?: HttpMethod[]; integration: HttpRouteIntegration; authorizer?: HttpRouteAuthorizer; }
  export class HttpApi extends Construct {
    constructor(scope: Construct, id: string, props?: HttpApiProps);
    readonly apiId: string;
    readonly apiEndpoint: string;
    readonly url: string | undefined;
    addRoutes(options: AddRoutesOptions): this;
  }
}

declare module 'aws-cdk-lib/aws-apigatewayv2-integrations' {
  import { Function } from 'aws-cdk-lib/aws-lambda';
  import { HttpRouteIntegration } from 'aws-cdk-lib/aws-apigatewayv2';
  export class HttpLambdaIntegration implements HttpRouteIntegration {
    constructor(id: string, handler: Function);
    readonly id: string;
  }
}

declare module 'aws-cdk-lib/aws-apigatewayv2-authorizers' {
  import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
  import { HttpRouteAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2';
  export class HttpUserPoolAuthorizer implements HttpRouteAuthorizer {
    constructor(id: string, pool: UserPool, props?: { userPoolClients?: UserPoolClient[] });
    readonly id: string;
  }
}

declare module 'aws-cdk-lib/aws-cognito' {
  import { Construct } from 'constructs';
  import { RemovalPolicy } from 'aws-cdk-lib';
  export interface UserPoolClientOptions { authFlows?: { userPassword?: boolean; userSrp?: boolean }; generateSecret?: boolean; }
  export interface UserPoolProps {
    userPoolName?: string;
    selfSignUpEnabled?: boolean;
    signInAliases?: { email?: boolean; username?: boolean };
    autoVerify?: { email?: boolean };
    passwordPolicy?: { minLength?: number };
    removalPolicy?: RemovalPolicy;
  }
  export class UserPool extends Construct {
    constructor(scope: Construct, id: string, props?: UserPoolProps);
    readonly userPoolId: string;
    readonly userPoolArn: string;
    addClient(id: string, options?: UserPoolClientOptions): UserPoolClient;
  }
  export class UserPoolClient extends Construct {
    constructor(scope: Construct, id: string, props: UserPoolClientOptions & { userPool: UserPool });
    readonly userPoolClientId: string;
  }
}

declare module 'aws-cdk-lib/aws-cloudfront' {
  import { Construct } from 'constructs';
  export enum ViewerProtocolPolicy { REDIRECT_TO_HTTPS = 'redirect-to-https', HTTPS_ONLY = 'https-only', ALLOW_ALL = 'allow-all' }
  export interface IOrigin { readonly __origin: true; }
  export interface ErrorResponse { httpStatus: number; responseHttpStatus?: number; responsePagePath?: string; }
  export interface DistributionProps {
    defaultBehavior: { origin: IOrigin; viewerProtocolPolicy?: ViewerProtocolPolicy };
    defaultRootObject?: string;
    errorResponses?: ErrorResponse[];
  }
  export class Distribution extends Construct {
    constructor(scope: Construct, id: string, props: DistributionProps);
    readonly distributionId: string;
    readonly distributionDomainName: string;
  }
}

declare module 'aws-cdk-lib/aws-cloudfront-origins' {
  import { Bucket } from 'aws-cdk-lib/aws-s3';
  import { IOrigin } from 'aws-cdk-lib/aws-cloudfront';
  export class S3BucketOrigin implements IOrigin {
    readonly __origin: true;
    static withOriginAccessControl(bucket: Bucket): S3BucketOrigin;
  }
}

declare module 'aws-cdk-lib/aws-s3-deployment' {
  import { Construct } from 'constructs';
  import { Bucket } from 'aws-cdk-lib/aws-s3';
  import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
  export interface ISource { readonly __source: true; }
  export class Source { static asset(path: string): ISource; }
  export class BucketDeployment extends Construct {
    constructor(scope: Construct, id: string, props: { sources: ISource[]; destinationBucket: Bucket; distribution?: Distribution; distributionPaths?: string[] });
  }
}
