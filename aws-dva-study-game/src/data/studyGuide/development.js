// Study guide: Development with AWS Services (32%)
export const developmentGuide = {
  id: 'development',
  name: 'Development with AWS Services',
  icon: '💻',
  color: '#58a6ff',
  weight: '32%',
  description: 'Develop code for applications hosted on AWS, Lambda, and data stores.',
  sections: [
    {
      id: 'devs1',
      title: 'Messaging and Event-Driven Patterns',
      content: [
        { type: 'paragraph', text: 'Most DVA-C02 architecture questions are really messaging questions: which service decouples the producer from the consumer, who gets a copy of each message, and what happens when a consumer is slow or broken. Learn the delivery model of each service first, then the settings you change in code.' },
        { type: 'table', headers: ['Service', 'Delivery model', 'Ordering', 'Pick it when'], rows: [
          ['Amazon SQS standard', 'Consumers poll (pull); each message goes to one consumer', 'Best effort, at-least-once', 'Buffer work, absorb spikes, decouple one producer from a worker fleet'],
          ['Amazon SQS FIFO', 'Pull, exactly-once processing within the deduplication interval', 'Strict per MessageGroupId', 'Order matters per entity (account, order) and duplicates must be suppressed'],
          ['Amazon SNS', 'Push to every subscriber (SQS, Lambda, HTTPS, email, SMS)', 'None (FIFO topics for ordered fan-out to FIFO queues)', 'Fan-out: many independent consumers need a copy'],
          ['Amazon EventBridge', 'Event bus with content-based rules routing to targets', 'None', 'Route events from AWS services, SaaS partners or your apps by content; archive and replay'],
          ['Kinesis Data Streams', 'Consumers read shards; data retained for replay', 'Strict per shard (partition key)', 'High-throughput ordered streams with multiple consumers and replay']
        ]},
        { type: 'keyTerm', term: 'Visibility timeout', definition: 'After a consumer receives an SQS message, the message is hidden for this period (default 30 seconds, max 12 hours). If it is not deleted before the timeout ends, it becomes visible and is delivered again. Set it longer than your processing time, or extend it with ChangeMessageVisibility. With a Lambda trigger, AWS recommends at least six times the function timeout.' },
        { type: 'keyTerm', term: 'Long polling', definition: 'ReceiveMessage waits up to 20 seconds (WaitTimeSeconds or the queue ReceiveMessageWaitTimeSeconds) for a message to arrive, removing most empty responses and their cost.' },
        { type: 'keyTerm', term: 'Dead-letter queue (DLQ)', definition: 'A redrive policy moves a message to a DLQ after it has been received maxReceiveCount times without being deleted. Inspect poison messages there and redrive them to the source queue after a fix. A FIFO queue must use a FIFO DLQ.' },
        { type: 'keyTerm', term: 'SQS Extended Client Library', definition: 'For payloads larger than the SQS message size limit, the library stores the body in Amazon S3 and sends a pointer in the message, then fetches the object on receive. The application code barely changes.' },
        { type: 'keyTerm', term: 'SNS filter policy', definition: 'A JSON policy on a subscription that matches message attributes or the message body (exact values, prefixes, numeric ranges, anything-but). Only matching messages are delivered, without any publisher change.' },
        { type: 'awsService', name: 'Amazon EventBridge Pipes', description: 'Point-to-point integration from a source (SQS, Kinesis, DynamoDB Streams, Amazon MQ, Kafka) through optional filtering and enrichment (Lambda, Step Functions Express, API Gateway, API destinations) to a target. Replaces hand-written polling and glue Lambda functions.' },
        { type: 'keyTerm', term: 'Partition key (Kinesis)', definition: 'Hashed to choose the shard. Records with the same key go to the same shard and stay in order. Use a high-cardinality key such as a device ID to spread load while keeping per-entity order.' },
        { type: 'keyTerm', term: 'KCL checkpoints', definition: 'The Kinesis Client Library tracks shard leases and checkpoints (the last processed sequence number) in a DynamoDB table, so a restarted or new worker resumes where processing stopped. Each shard is processed by one worker at a time, so workers beyond the shard count sit idle.' },
        { type: 'comparison', title: 'SQS FIFO identifiers', items: [
          { label: 'MessageGroupId', description: 'Defines the ordering scope. Messages in one group are delivered in order to one consumer at a time; different groups are processed in parallel. Use the entity ID to scale.' },
          { label: 'MessageDeduplicationId', description: 'Suppresses duplicate sends with the same ID within the 5-minute deduplication interval. Content-based deduplication generates it from a SHA-256 hash of the body.' }
        ]},
        { type: 'examTip', text: 'Duplicate processing on a standard queue with slow consumers points to the visibility timeout, not to FIFO. Many empty receives points to long polling. A message that fails forever points to a DLQ with maxReceiveCount. "Each service needs its own copy and must not lose messages while down" is SNS to one SQS queue per service.' }
      ]
    },
    {
      id: 'devs2',
      title: 'Workflows, APIs and Resilient Code',
      content: [
        { type: 'paragraph', text: 'Code on AWS must assume that calls fail, time out and get retried. The exam rewards stateless handlers, idempotent operations, asynchronous hand-offs for slow work, and the right integration between API Gateway and the backend.' },
        { type: 'comparison', title: 'Choreography vs orchestration', items: [
          { label: 'Choreography (EventBridge, SNS)', description: 'Each service reacts to events on its own. Loose coupling and easy to add consumers, but no single owner of the sequence, rollback or per-run history.' },
          { label: 'Orchestration (Step Functions)', description: 'A state machine drives the steps, retries, timeouts and compensations (saga pattern) and records a visual history for every execution. Use it when order, rollback or auditability matters.' }
        ]},
        { type: 'table', headers: ['', 'Standard workflow', 'Express workflow'], rows: [
          ['Maximum duration', 'Up to 1 year', 'Up to 5 minutes'],
          ['Execution semantics', 'Exactly-once', 'At-least-once (async) or at-most-once (sync)'],
          ['Pricing', 'Per state transition', 'Per request and duration'],
          ['History', 'Visual history in the console', 'CloudWatch Logs'],
          ['Typical use', 'Order processing, human approval, long jobs', 'High-volume event and stream processing, IoT ingestion']
        ]},
        { type: 'bulletList', title: 'Step Functions error handling:', items: [
          'Retry: ErrorEquals (for example States.TaskFailed or Lambda.TooManyRequestsException), IntervalSeconds, MaxAttempts, BackoffRate, and optionally MaxDelaySeconds and JitterStrategy.',
          'Catch: ErrorEquals, Next (the fallback or compensation state) and ResultPath to keep the original input alongside the error.',
          'Retriers run first; Catch handles the error only after retries are exhausted.',
          'States.ALL matches any error and must be the last entry.'
        ]},
        { type: 'keyTerm', term: 'Exponential backoff with jitter', definition: 'Wait longer after each failed attempt and randomize the wait so many clients do not retry together. The AWS SDKs do this automatically for throttling and 5xx errors; write it yourself for custom retries and for BatchWriteItem UnprocessedItems.' },
        { type: 'keyTerm', term: 'Idempotency', definition: 'Running an operation twice has the same effect as once. Store a unique key (order ID, payment ID, request ID) with a conditional write and return the stored result on a repeat. Powertools for AWS Lambda provides an idempotency utility backed by DynamoDB.' },
        { type: 'keyTerm', term: 'Stateless compute', definition: 'Keep no session or user state on the instance or function. Put state in DynamoDB, ElastiCache or S3 so any instance can serve any request and scaling in loses nothing.' },
        { type: 'comparison', title: 'API Gateway integrations', items: [
          { label: 'Proxy integration', description: 'The full request is passed through. With Lambda proxy, the function receives the whole event and must return statusCode, headers and body; a malformed response gives the client a 502.' },
          { label: 'Non-proxy (custom) integration', description: 'REST APIs only. VTL mapping templates transform the integration request and response, for example JSON to XML for a backend you cannot change. HTTP APIs offer parameter mapping, not VTL templates.' }
        ]},
        { type: 'keyTerm', term: 'Synchronous vs asynchronous', definition: 'A synchronous caller waits for the result and is bound by every timeout in the chain. For slow work, accept the request, put it on a queue or start a workflow, return 202 Accepted with a job ID, and let the client poll or be notified.' },
        { type: 'examTip', text: 'Keywords map to answers: "visual workflow, compensation, wait for approval" is Step Functions Standard; "100,000 short executions per minute" is Express; "transform the request without code" is a non-proxy integration with mapping templates; "retries collide" is backoff with jitter; "duplicate charges" is an idempotency key with a conditional write.' }
      ]
    },
    {
      id: 'devs3',
      title: 'Lambda Configuration and Performance',
      content: [
        { type: 'paragraph', text: 'Lambda questions on DVA-C02 are about the knobs a developer turns: memory, timeout, packaging, concurrency and networking. Know what each setting changes and, just as important, what it does not change.' },
        { type: 'table', headers: ['Setting', 'Range or default', 'What it controls'], rows: [
          ['Memory', '128 MB to 10,240 MB', 'Memory and proportional CPU; more memory often lowers duration for CPU-bound code'],
          ['Timeout', 'Default 3 s, max 15 min', 'Maximum run time per invocation'],
          ['Ephemeral storage (/tmp)', '512 MB default, up to 10,240 MB', 'Scratch disk, reused while the environment stays warm'],
          ['.zip package', '50 MB zipped upload, 250 MB unzipped with layers', 'Code plus dependencies; up to 5 layers'],
          ['Container image', 'Up to 10 GB, stored in ECR', 'Large dependencies, existing Docker tooling'],
          ['Environment variables', 'Up to 4 KB total, encrypted at rest with KMS', 'Per-version configuration such as table names and stage settings']
        ]},
        { type: 'keyTerm', term: 'Initialization code reuse', definition: 'Code outside the handler runs once per execution environment. Create SDK clients, database connections and load configuration there so warm invocations reuse them. Do not keep request-specific state in globals.' },
        { type: 'keyTerm', term: 'Lambda layers', definition: 'A .zip archive of libraries, a custom runtime or other files attached to many functions. Layers are versioned, so a function uses the layer version it references until you update it.' },
        { type: 'comparison', title: 'Concurrency controls', items: [
          { label: 'Reserved concurrency', description: 'Sets aside and caps concurrency for one function. Use it to protect a downstream system or to guarantee capacity. No extra charge. Setting it to 0 stops all invocations.' },
          { label: 'Provisioned concurrency', description: 'Keeps initialized environments ready on a version or alias, removing cold starts for predictable traffic. Billed while configured; scale it on a schedule with Application Auto Scaling.' },
          { label: 'SnapStart', description: 'Snapshots the initialized environment when you publish a version and resumes from it on cold start (Java, Python, .NET). No idle cost. Use runtime hooks to refresh unique state such as random seeds and connections after restore.' }
        ]},
        { type: 'keyTerm', term: 'VPC access', definition: 'Attach a function to subnets to reach private resources such as RDS. It then has only the network access of those subnets and never a public IP: add gateway endpoints for S3 and DynamoDB, interface endpoints for other services, or a NAT gateway for the internet. The execution role needs ENI permissions (AWSLambdaVPCAccessExecutionRole).' },
        { type: 'awsService', name: 'Lambda function URLs', description: 'A dedicated HTTPS endpoint for one function with auth type AWS_IAM (SigV4 signed callers) or NONE (public; validate requests in code, for example webhook signatures). Supports CORS and response streaming. Choose API Gateway when you need usage plans, request validation, caching or WAF on many routes.' },
        { type: 'awsService', name: 'Lambda extensions', description: 'Companion processes in the execution environment, usually delivered as layers. Monitoring, security and secrets-caching tools use them, and the Telemetry API lets them receive logs, metrics and traces without changing function code.' },
        { type: 'examTip', text: 'CPU-bound and slow means more memory, not a longer timeout. Cold starts with predictable peaks means provisioned concurrency; Java cold starts without idle cost means SnapStart. Protecting a database from too many invocations means reserved concurrency (or RDS Proxy). A VPC function that lost access to DynamoDB needs a gateway endpoint or NAT.' }
      ]
    },
    {
      id: 'devs4',
      title: 'Lambda Invocation Models and Error Handling',
      content: [
        { type: 'paragraph', text: 'How a function is invoked decides who retries, how often, and where failures go. Many exam questions describe a failure symptom and expect you to recognize the invocation model behind it.' },
        { type: 'table', headers: ['Model', 'Examples', 'Who retries', 'Failure handling'], rows: [
          ['Synchronous', 'API Gateway, function URLs, ALB, SDK RequestResponse, Step Functions tasks', 'The caller', 'Error returned to the caller; caller decides to retry'],
          ['Asynchronous', 'S3, SNS, EventBridge, SDK Event invocation', 'Lambda: 2 retries by default (0-2 configurable), max event age configurable', 'On-failure destination or DLQ'],
          ['Event source mapping (poll-based)', 'SQS, Kinesis, DynamoDB Streams, MSK', 'Lambda retries the batch per source settings', 'Partial batch response, SQS redrive to DLQ, stream on-failure destination']
        ]},
        { type: 'comparison', title: 'Destinations vs dead-letter queue (async)', items: [
          { label: 'Destinations', description: 'On-success and on-failure targets (SQS, SNS, Lambda, EventBridge, and S3 for failures). The record includes the request payload and the response, with error message and stack trace on failure.' },
          { label: 'Dead-letter queue', description: 'Failures only, SQS or SNS only. Carries the original event with a few error attributes. Still valid, but destinations are the recommended choice for new designs.' }
        ]},
        { type: 'bulletList', title: 'Event source mapping settings:', items: [
          'BatchSize: records per invocation; larger batches mean fewer invocations but bigger retry units.',
          'MaximumBatchingWindowInSeconds: wait to fill a batch, trading latency for cost.',
          'FunctionResponseTypes = ReportBatchItemFailures: return batchItemFailures with the failed itemIdentifier so only those records are retried.',
          'Streams only: BisectBatchOnFunctionError, MaximumRetryAttempts, MaximumRecordAgeInSeconds and an on-failure destination keep a bad record from blocking the shard.',
          'Filter criteria drop unwanted records before your function is invoked, so you do not pay for them.'
        ]},
        { type: 'numberedList', title: 'Handling a poison message in an SQS-triggered function:', items: [
          'Enable ReportBatchItemFailures and return only the failed message IDs.',
          'Set the queue visibility timeout to at least six times the function timeout.',
          'Configure a redrive policy on the source queue with a sensible maxReceiveCount and a DLQ.',
          'Alarm on the DLQ ApproximateNumberOfMessagesVisible metric and redrive after fixing the bug.'
        ]},
        { type: 'examTip', text: 'If the scenario wants the error details or success records sent somewhere, the answer is destinations, not a DLQ. If one bad SQS message makes the whole batch reprocess, the answer is ReportBatchItemFailures. Remember that a DLQ for an SQS-triggered function is configured on the queue, not on the function.' }
      ]
    },
    {
      id: 'devs5',
      title: 'Amazon DynamoDB for Developers',
      content: [
        { type: 'paragraph', text: 'DynamoDB is the most heavily tested data store on DVA-C02. Expect questions on key design, choosing Query over Scan, index types, capacity math, and the API calls that give you conditions, transactions and pagination.' },
        { type: 'keyTerm', term: 'Partition key and sort key', definition: 'The partition key is hashed to place items; choose a high-cardinality, evenly accessed value to avoid hot partitions. The sort key orders items within a partition and allows range conditions (between, begins_with, comparisons). For a single very hot key, use write sharding with a suffix.' },
        { type: 'comparison', title: 'Query vs Scan', items: [
          { label: 'Query', description: 'Requires the partition key; sort key conditions narrow what is read. Filter expressions apply after the read and still consume capacity. Use it for every access pattern you can.' },
          { label: 'Scan', description: 'Reads every item in the table or index, then filters. Expensive and slow on large tables; parallel scan speeds up bulk exports but not cost.' }
        ]},
        { type: 'table', headers: ['', 'Global secondary index (GSI)', 'Local secondary index (LSI)'], rows: [
          ['Keys', 'Any partition key and sort key', 'Same partition key, different sort key'],
          ['When created', 'Any time', 'Only when the table is created'],
          ['Read consistency', 'Eventually consistent only', 'Eventually or strongly consistent'],
          ['Throughput', 'Its own capacity; throttling can back-pressure table writes', 'Shares the table capacity'],
          ['Size limit', 'None per key', '10 GB per partition key value (item collection)']
        ]},
        { type: 'table', headers: ['Capacity unit', 'Covers', 'Example'], rows: [
          ['1 RCU', '1 strongly consistent read/s, or 2 eventually consistent reads/s, of up to 4 KB; transactional reads cost 2x', '20 strongly consistent reads/s of 7 KB: 7 KB rounds to 8 KB = 2 RCU each, so 40 RCU'],
          ['1 WCU', '1 write/s of up to 1 KB; transactional writes cost 2x', '10 writes/s of 2.5 KB: rounds to 3 KB = 3 WCU each, so 30 WCU']
        ]},
        { type: 'bulletList', title: 'APIs and features to know:', items: [
          'Conditional writes: ConditionExpression such as attribute_not_exists(pk) for create-only, or version = :expected for optimistic locking; failure raises ConditionalCheckFailedException.',
          'TransactWriteItems / TransactGetItems: all-or-nothing across items and tables with condition checks, at twice the capacity cost.',
          'BatchWriteItem / BatchGetItem: up to 25 writes or 100 reads per call, not atomic, no conditions; retry UnprocessedItems or UnprocessedKeys with backoff.',
          'Pagination: each Query or Scan returns at most 1 MB; repeat with ExclusiveStartKey set to LastEvaluatedKey, or use SDK paginators.',
          'TTL: a Number attribute holding an epoch-seconds timestamp; expired items are deleted in the background at no cost, not instantly, so filter them on read.',
          'Streams: ordered item-level changes kept for 24 hours, with view types KEYS_ONLY, NEW_IMAGE, OLD_IMAGE or NEW_AND_OLD_IMAGES; usually consumed by Lambda.',
          'DAX: API-compatible, write-through in-memory cache with microsecond reads for eventually consistent requests; strongly consistent reads pass through to DynamoDB.'
        ]},
        { type: 'examTip', text: 'Round item sizes up before multiplying: 4 KB blocks for reads, 1 KB blocks for writes, half for eventually consistent, double for transactions. "Strongly consistent read on a GSI" is never correct. A Query that returns fewer items than expected without errors means you ignored LastEvaluatedKey.' }
      ]
    },
    {
      id: 'devs6',
      title: 'Amazon S3, Caching and Relational Data from Code',
      content: [
        { type: 'paragraph', text: 'Beyond DynamoDB, the exam expects you to work with S3 from the SDK, add a cache in front of a database, manage relational connections from Lambda, and pick a search engine when key-value lookups are not enough.' },
        { type: 'keyTerm', term: 'Presigned URL', definition: 'A URL signed with the credentials of the identity that created it, granting time-limited access to one operation on one object (GET or PUT). Browsers and mobile apps upload or download directly without AWS credentials. It can never grant more than the signer has, and it stops working when the signing credentials expire.' },
        { type: 'keyTerm', term: 'Multipart upload', definition: 'Splits an object into parts uploaded in parallel and retried individually. Required above 5 GB (the single PUT limit) and recommended from about 100 MB. Add a lifecycle rule to abort incomplete multipart uploads so orphaned parts do not keep costing money.' },
        { type: 'keyTerm', term: 'S3 event notifications', definition: 'Object events such as s3:ObjectCreated:* sent to Lambda, SQS or SNS, with prefix and suffix filters. Enable delivery to EventBridge for richer content filtering and many targets. Avoid recursive loops when a function writes back to the bucket that triggers it.' },
        { type: 'keyTerm', term: 'S3 strong consistency', definition: 'All S3 GET, PUT, LIST and DELETE operations are strongly read-after-write consistent, so a read right after a successful write returns the new object with no extra code.' },
        { type: 'comparison', title: 'Caching strategies (ElastiCache)', items: [
          { label: 'Lazy loading (cache-aside)', description: 'Read the cache; on a miss read the database and populate the cache. Only requested data is cached and node failures are not fatal, but data can be stale and a miss costs extra round trips.' },
          { label: 'Write-through', description: 'Write to the cache every time the database is written. Data is always current, but you cache items that may never be read and add write latency. Combine with a TTL to bound memory and staleness.' }
        ]},
        { type: 'awsService', name: 'Amazon ElastiCache (Redis OSS, Valkey, Memcached)', description: 'Managed in-memory caching for any data store. Valkey and Redis OSS add replication, persistence, sorted sets for leaderboards and pub/sub; Memcached is a simple multithreaded cache. Your code owns the caching logic.' },
        { type: 'awsService', name: 'Amazon RDS Proxy', description: 'A managed connection pool in front of RDS and Aurora. Lambda functions share pooled connections instead of each opening its own, failovers are faster, and it can enforce IAM authentication with credentials in Secrets Manager. The app only changes its endpoint.' },
        { type: 'awsService', name: 'Amazon OpenSearch Service', description: 'Full-text search with relevance scoring, fuzzy matching and aggregations for facets. Keep DynamoDB as the system of record and replicate to OpenSearch with the zero-ETL integration or a Streams-driven Lambda function.' },
        { type: 'examTip', text: 'Direct browser upload without credentials is a presigned URL. Large or unreliable uploads mean multipart. Stale cache data means write-through plus TTL. Lambda exhausting database connections means RDS Proxy. Full-text or fuzzy search over DynamoDB data means OpenSearch, never a Scan with contains().' }
      ]
    }
  ]
};
