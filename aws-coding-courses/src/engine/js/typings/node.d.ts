// The small part of Node.js the practice runner provides (Lambda-style code).

declare namespace NodeJS {
  interface ProcessEnv { [key: string]: string | undefined; }
  interface Process {
    env: ProcessEnv;
    argv: string[];
    exitCode: number | undefined;
    platform: string;
    version: string;
    cwd(): string;
    exit(code?: number): never;
  }
}

declare var process: NodeJS.Process;

declare module 'node:process' {
  const process: NodeJS.Process;
  export default process;
  export const env: NodeJS.ProcessEnv;
  export const argv: string[];
  export function exit(code?: number): never;
  export function cwd(): string;
}
declare module 'process' {
  export * from 'node:process';
  export { default } from 'node:process';
}

declare module 'node:crypto' {
  export function randomUUID(): string;
  export function getRandomValues<T extends ArrayBufferView>(array: T): T;
}
declare module 'crypto' {
  export * from 'node:crypto';
}

/** Lambda's context object, the handler's second argument. */
interface LambdaContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis(): number;
}

// The event and context types from @types/aws-lambda (type-only: import type { ... } from 'aws-lambda')
declare module 'aws-lambda' {
  export interface Context extends LambdaContext {}
  export type Handler<TEvent = any, TResult = any> = (event: TEvent, context: Context) => Promise<TResult>;
  export interface APIGatewayProxyEventV2 {
    version: '2.0';
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    cookies?: string[];
    headers: Record<string, string | undefined>;
    queryStringParameters?: Record<string, string | undefined>;
    pathParameters?: Record<string, string | undefined>;
    body?: string;
    isBase64Encoded: boolean;
    requestContext: {
      accountId: string;
      apiId: string;
      domainName: string;
      http: { method: string; path: string; protocol: string; sourceIp: string; userAgent: string };
      requestId: string;
      routeKey: string;
      stage: string;
      time: string;
      timeEpoch: number;
    };
  }
  export interface APIGatewayProxyEventV2WithJWTAuthorizer extends APIGatewayProxyEventV2 {
    requestContext: APIGatewayProxyEventV2['requestContext'] & {
      authorizer: { jwt: { claims: Record<string, string | number | boolean | string[]>; scopes: string[] | null } };
    };
  }
  export interface APIGatewayProxyStructuredResultV2 {
    statusCode?: number;
    headers?: Record<string, string | number | boolean>;
    body?: string;
    isBase64Encoded?: boolean;
    cookies?: string[];
  }
  export type APIGatewayProxyResultV2<T = never> = APIGatewayProxyStructuredResultV2 | string | T;
  export type APIGatewayProxyHandlerV2 = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
  export interface ScheduledEvent {
    version: string; id: string; 'detail-type': 'Scheduled Event'; source: 'aws.events' | 'aws.scheduler'; account: string;
    time: string; region: string; resources: string[]; detail: Record<string, unknown>;
  }
  export interface S3Event {
    Records: {
      eventName: string; eventTime: string; awsRegion: string;
      s3: { bucket: { name: string; arn: string }; object: { key: string; size: number; eTag: string } };
    }[];
  }
}
