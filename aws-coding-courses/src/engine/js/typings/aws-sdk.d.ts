// Types for the practice AWS SDK for JavaScript v3: the parts the courses
// use, with the same names and shapes as the real @aws-sdk packages.

declare module '@aws-sdk/types' {
  export interface ResponseMetadata {
    httpStatusCode?: number;
    requestId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  }
  export interface MetadataBearer {
    $metadata: ResponseMetadata;
  }
  export interface ClientConfig {
    region?: string;
    maxAttempts?: number;
  }
  /** Every command remembers its input and output types, so send() returns the right shape. */
  export class Command<Input extends object, Output extends MetadataBearer> {
    constructor(input: Input);
    readonly input: Input;
    protected readonly __output?: Output;
  }
  export class Client {
    constructor(config?: ClientConfig);
    readonly config: ClientConfig & { region: string };
    send<I extends object, O extends MetadataBearer>(command: Command<I, O>): Promise<O>;
    destroy(): void;
  }
  export class ServiceException extends Error {
    readonly $fault: 'client' | 'server';
    readonly $metadata: ResponseMetadata;
    readonly $service?: string;
  }
  export interface PaginationConfiguration<C> {
    client: C;
    pageSize?: number;
    startingToken?: string;
  }
}

declare module '@aws-sdk/client-dynamodb' {
  import { Client, Command, MetadataBearer, ServiceException } from '@aws-sdk/types';
  export type AttributeValue =
    | { S: string } | { N: string } | { BOOL: boolean } | { NULL: true } | { B: Uint8Array }
    | { SS: string[] } | { NS: string[] } | { L: AttributeValue[] } | { M: Record<string, AttributeValue> };
  export class DynamoDBClient extends Client {}
  export class DynamoDBServiceException extends ServiceException {}
  export class ConditionalCheckFailedException extends DynamoDBServiceException { readonly name: 'ConditionalCheckFailedException'; }
  export class ResourceNotFoundException extends DynamoDBServiceException { readonly name: 'ResourceNotFoundException'; }
  interface Expressions {
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, AttributeValue>;
  }
  export interface PutItemCommandInput extends Expressions { TableName: string; Item: Record<string, AttributeValue>; ReturnValues?: 'NONE' | 'ALL_OLD'; }
  export interface PutItemCommandOutput extends MetadataBearer { Attributes?: Record<string, AttributeValue>; }
  export class PutItemCommand extends Command<PutItemCommandInput, PutItemCommandOutput> {}
  export interface GetItemCommandInput { TableName: string; Key: Record<string, AttributeValue>; ConsistentRead?: boolean; }
  export interface GetItemCommandOutput extends MetadataBearer { Item?: Record<string, AttributeValue>; }
  export class GetItemCommand extends Command<GetItemCommandInput, GetItemCommandOutput> {}
  export interface DeleteItemCommandInput extends Expressions { TableName: string; Key: Record<string, AttributeValue>; }
  export class DeleteItemCommand extends Command<DeleteItemCommandInput, MetadataBearer> {}
  export interface QueryCommandInput extends Expressions { TableName: string; KeyConditionExpression: string; FilterExpression?: string; Limit?: number; ScanIndexForward?: boolean; IndexName?: string; }
  export interface QueryCommandOutput extends MetadataBearer { Items?: Record<string, AttributeValue>[]; Count?: number; ScannedCount?: number; }
  export class QueryCommand extends Command<QueryCommandInput, QueryCommandOutput> {}
  export interface ScanCommandInput extends Expressions { TableName: string; FilterExpression?: string; Limit?: number; }
  export class ScanCommand extends Command<ScanCommandInput, QueryCommandOutput> {}
  export interface DescribeTableCommandOutput extends MetadataBearer {
    Table?: { TableName?: string; TableStatus?: string; ItemCount?: number; KeySchema?: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[] };
  }
  export class DescribeTableCommand extends Command<{ TableName: string }, DescribeTableCommandOutput> {}
  export class ListTablesCommand extends Command<{ Limit?: number }, MetadataBearer & { TableNames?: string[] }> {}
}

declare module '@aws-sdk/util-dynamodb' {
  import { AttributeValue } from '@aws-sdk/client-dynamodb';
  export function marshall(item: Record<string, unknown>, options?: { removeUndefinedValues?: boolean }): Record<string, AttributeValue>;
  export function unmarshall(item: Record<string, AttributeValue>): Record<string, any>;
}

declare module '@aws-sdk/lib-dynamodb' {
  import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
  import { Command, MetadataBearer } from '@aws-sdk/types';
  /** A whole item: plain JavaScript values, the way the document client takes them. */
  type Item = Record<string, any>;
  export interface TranslateConfig { marshallOptions?: { removeUndefinedValues?: boolean; convertEmptyValues?: boolean }; }
  export class DynamoDBDocumentClient extends DynamoDBClient {
    static from(client: DynamoDBClient, translateConfig?: TranslateConfig): DynamoDBDocumentClient;
  }
  interface Expressions {
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  }
  export interface PutCommandInput extends Expressions { TableName: string; Item: Item; ReturnValues?: 'NONE' | 'ALL_OLD'; }
  export interface PutCommandOutput extends MetadataBearer { Attributes?: Item; }
  export class PutCommand extends Command<PutCommandInput, PutCommandOutput> {}
  export interface GetCommandInput { TableName: string; Key: Item; ConsistentRead?: boolean; }
  export interface GetCommandOutput extends MetadataBearer { Item?: Item; }
  export class GetCommand extends Command<GetCommandInput, GetCommandOutput> {}
  export interface QueryCommandInput extends Expressions { TableName: string; KeyConditionExpression: string; FilterExpression?: string; Limit?: number; ScanIndexForward?: boolean; IndexName?: string; }
  export interface QueryCommandOutput extends MetadataBearer { Items?: Item[]; Count?: number; ScannedCount?: number; }
  export class QueryCommand extends Command<QueryCommandInput, QueryCommandOutput> {}
  export interface ScanCommandInput extends Expressions { TableName: string; FilterExpression?: string; Limit?: number; }
  export class ScanCommand extends Command<ScanCommandInput, QueryCommandOutput> {}
  export interface UpdateCommandInput extends Expressions {
    TableName: string; Key: Item; UpdateExpression: string;
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
  }
  export interface UpdateCommandOutput extends MetadataBearer { Attributes?: Item; }
  export class UpdateCommand extends Command<UpdateCommandInput, UpdateCommandOutput> {}
  export interface DeleteCommandInput extends Expressions { TableName: string; Key: Item; ReturnValues?: 'NONE' | 'ALL_OLD'; }
  export class DeleteCommand extends Command<DeleteCommandInput, MetadataBearer & { Attributes?: Item }> {}
}

declare module '@aws-sdk/client-sesv2' {
  import { Client, Command, MetadataBearer, ServiceException } from '@aws-sdk/types';
  export class SESv2Client extends Client {}
  export class SESv2ServiceException extends ServiceException {}
  export class MessageRejected extends SESv2ServiceException { readonly name: 'MessageRejected'; }
  interface Text { Data: string; Charset?: string; }
  export interface SendEmailCommandInput {
    FromEmailAddress?: string;
    Destination?: { ToAddresses?: string[]; CcAddresses?: string[]; BccAddresses?: string[] };
    ReplyToAddresses?: string[];
    Content: { Simple?: { Subject: Text; Body: { Text?: Text; Html?: Text } } };
  }
  export interface SendEmailCommandOutput extends MetadataBearer { MessageId?: string; }
  export class SendEmailCommand extends Command<SendEmailCommandInput, SendEmailCommandOutput> {}
}

declare module '@aws-sdk/client-s3' {
  import { Client, Command, MetadataBearer, ServiceException, PaginationConfiguration } from '@aws-sdk/types';
  export class S3Client extends Client {}
  export class S3ServiceException extends ServiceException {}
  export class NoSuchKey extends S3ServiceException { readonly name: 'NoSuchKey'; }
  export class NoSuchBucket extends S3ServiceException { readonly name: 'NoSuchBucket'; }
  export class NotFound extends S3ServiceException { readonly name: 'NotFound'; }
  export interface Bucket { Name?: string; CreationDate?: Date; }
  export class ListBucketsCommand extends Command<{}, MetadataBearer & { Buckets?: Bucket[]; Owner?: { ID?: string } }> {}
  export interface _Object { Key?: string; LastModified?: Date; ETag?: string; Size?: number; StorageClass?: string; }
  export interface ListObjectsV2CommandInput { Bucket: string; Prefix?: string; Delimiter?: string; MaxKeys?: number; ContinuationToken?: string; StartAfter?: string; }
  export interface ListObjectsV2CommandOutput extends MetadataBearer {
    Contents?: _Object[]; CommonPrefixes?: { Prefix?: string }[]; IsTruncated?: boolean; KeyCount?: number;
    NextContinuationToken?: string; ContinuationToken?: string; Name?: string; Prefix?: string; MaxKeys?: number;
  }
  export class ListObjectsV2Command extends Command<ListObjectsV2CommandInput, ListObjectsV2CommandOutput> {}
  export function paginateListObjectsV2(config: PaginationConfiguration<S3Client>, input: ListObjectsV2CommandInput): AsyncGenerator<ListObjectsV2CommandOutput>;
  export interface StreamingBody {
    transformToString(encoding?: string): Promise<string>;
    transformToByteArray(): Promise<Uint8Array>;
    [Symbol.asyncIterator](): AsyncIterator<Uint8Array>;
  }
  export interface GetObjectCommandOutput extends MetadataBearer {
    Body?: StreamingBody; ContentLength?: number; ContentType?: string; ETag?: string; LastModified?: Date; Metadata?: Record<string, string>;
  }
  export class GetObjectCommand extends Command<{ Bucket: string; Key: string }, GetObjectCommandOutput> {}
  export class HeadObjectCommand extends Command<{ Bucket: string; Key: string }, Omit<GetObjectCommandOutput, 'Body'>> {}
  export interface PutObjectCommandInput { Bucket: string; Key: string; Body?: string | Uint8Array; ContentType?: string; CacheControl?: string; Metadata?: Record<string, string>; }
  export class PutObjectCommand extends Command<PutObjectCommandInput, MetadataBearer & { ETag?: string }> {}
  export class DeleteObjectCommand extends Command<{ Bucket: string; Key: string }, MetadataBearer> {}
  export interface CopyObjectCommandInput { Bucket: string; Key: string; CopySource: string; ContentType?: string; Metadata?: Record<string, string>; MetadataDirective?: 'COPY' | 'REPLACE'; }
  export class CopyObjectCommand extends Command<CopyObjectCommandInput, MetadataBearer & { CopyObjectResult?: { ETag?: string; LastModified?: Date } }> {}
}

declare module '@aws-sdk/client-sts' {
  import { Client, Command, MetadataBearer, ServiceException } from '@aws-sdk/types';
  export class STSClient extends Client {}
  export class STSServiceException extends ServiceException {}
  export interface GetCallerIdentityCommandOutput extends MetadataBearer { UserId?: string; Account?: string; Arn?: string; }
  export class GetCallerIdentityCommand extends Command<{}, GetCallerIdentityCommandOutput> {}
}

declare module '@aws-sdk/client-cloudfront' {
  import { Client, Command, MetadataBearer, ServiceException } from '@aws-sdk/types';
  export class CloudFrontClient extends Client {}
  export class CloudFrontServiceException extends ServiceException {}
  export class NoSuchDistribution extends CloudFrontServiceException { readonly name: 'NoSuchDistribution'; }
  export interface InvalidationBatch { Paths: { Quantity: number; Items?: string[] }; CallerReference: string; }
  export interface Invalidation { Id: string; Status: string; CreateTime: Date; InvalidationBatch: InvalidationBatch; }
  export class CreateInvalidationCommand extends Command<{ DistributionId: string; InvalidationBatch: InvalidationBatch }, MetadataBearer & { Location?: string; Invalidation?: Invalidation }> {}
  export class GetInvalidationCommand extends Command<{ DistributionId: string; Id: string }, MetadataBearer & { Invalidation?: Invalidation }> {}
  export interface DistributionSummary { Id: string; DomainName: string; Status: string; Enabled: boolean; Comment: string; Aliases: { Quantity: number; Items?: string[] }; }
  export class ListDistributionsCommand extends Command<{ Marker?: string; MaxItems?: number }, MetadataBearer & { DistributionList?: { Items?: DistributionSummary[]; Quantity: number; IsTruncated: boolean } }> {}
}

declare module '@aws-sdk/client-ec2' {
  import { Client, Command, MetadataBearer, ServiceException, PaginationConfiguration } from '@aws-sdk/types';
  export class EC2Client extends Client {}
  export class EC2ServiceException extends ServiceException {}
  export interface Tag { Key?: string; Value?: string; }
  export interface Filter { Name: string; Values: string[]; }
  export type InstanceStateName = 'pending' | 'running' | 'shutting-down' | 'terminated' | 'stopping' | 'stopped';
  export interface Instance {
    InstanceId?: string; InstanceType?: string; ImageId?: string; LaunchTime?: Date;
    State?: { Code?: number; Name?: InstanceStateName }; Placement?: { AvailabilityZone?: string };
    PrivateIpAddress?: string; PublicIpAddress?: string; StateTransitionReason?: string;
    /** Missing entirely when the instance has no tags */
    Tags?: Tag[];
  }
  export interface DescribeInstancesCommandInput { Filters?: Filter[]; InstanceIds?: string[]; MaxResults?: number; NextToken?: string; }
  export interface DescribeInstancesCommandOutput extends MetadataBearer {
    Reservations?: { ReservationId?: string; OwnerId?: string; Instances?: Instance[] }[];
    NextToken?: string;
  }
  export class DescribeInstancesCommand extends Command<DescribeInstancesCommandInput, DescribeInstancesCommandOutput> {}
  export function paginateDescribeInstances(config: PaginationConfiguration<EC2Client>, input: DescribeInstancesCommandInput): AsyncGenerator<DescribeInstancesCommandOutput>;
}
