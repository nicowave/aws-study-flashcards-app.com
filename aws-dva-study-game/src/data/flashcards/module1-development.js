// Module 1: Development with AWS Services
// AWS Certified Developer – Associate (DVA-C02)

export const module1 = {
  id: 'module1',
  name: 'Development with AWS Services',
  description: 'Lambda, API Gateway, DynamoDB, SQS/SNS/EventBridge, SDKs and data stores',
  icon: '💻',
  color: '#58a6ff',
  gradient: 'linear-gradient(135deg, #58a6ff 0%, #58a6ff 100%)',
  source: 'DVA-C02 Exam Guide',
  cards: [
    {
      id: 'dva-dev-c1',
      front: 'SQS vs SNS vs EventBridge: when do you use each?',
      back: '• SQS: a queue. One consumer group pulls and processes each message; buffers load; consumers poll.\n• SNS: pub/sub push. Every subscriber gets a copy; filter policies per subscription.\n• EventBridge: event bus with content-based rules, many AWS and SaaS sources, schema registry, archive and replay.\nFan-out with durability: SNS topic to one SQS queue per consumer.',
      hint: 'Pull queue, push topic, routed bus',
      tags: ['sqs', 'sns', 'eventbridge'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dev-c2',
      front: 'Choreography vs orchestration: EventBridge or Step Functions?',
      back: '• Choreography (EventBridge): services react to events independently. Loose coupling, no central owner of the flow.\n• Orchestration (Step Functions): a state machine drives the sequence, retries, compensations and keeps a visual execution history.\nRule: need ordered steps, rollback (saga) or a per-run audit trail? Step Functions. Need independent reactions to a fact? EventBridge.',
      hint: 'Who owns the sequence?',
      tags: ['eventbridge', 'step-functions', 'patterns'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c3',
      front: 'SQS FIFO: what do MessageGroupId and MessageDeduplicationId do?',
      back: '• MessageGroupId: ordering scope. Strict order inside a group; different groups process in parallel. Use an entity ID (account, order) for parallelism.\n• MessageDeduplicationId: duplicate sends with the same ID within the 5-minute deduplication interval are accepted but not delivered again. Or enable content-based deduplication (SHA-256 of the body).\nA FIFO queue needs a FIFO DLQ.',
      hint: 'Order scope vs duplicate suppression',
      tags: ['sqs', 'fifo'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c4',
      front: 'SQS visibility timeout, long polling and DLQ: the key settings',
      back: '• Visibility timeout (default 30 s, max 12 h): hides a received message; set it longer than processing time, or extend with ChangeMessageVisibility.\n• With a Lambda trigger, AWS recommends a queue visibility timeout of at least 6x the function timeout.\n• Long polling: WaitTimeSeconds up to 20 s cuts empty receives and cost.\n• DLQ: redrive policy moves a message after maxReceiveCount receives.',
      hint: 'Hide, wait, park',
      tags: ['sqs', 'lambda'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c5',
      front: 'Step Functions Standard vs Express',
      back: '• Standard: up to 1 year, exactly-once, billed per state transition, full visual history. Long-running and human-approval flows.\n• Express: up to 5 minutes, billed by requests and duration, at-least-once (async) or at-most-once (sync), logs to CloudWatch Logs. High-volume event processing.\nError handling in both: Retry (ErrorEquals, IntervalSeconds, MaxAttempts, BackoffRate) and Catch (ErrorEquals, Next, ResultPath).',
      hint: 'Long and exact vs short and cheap',
      tags: ['step-functions'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c6',
      front: 'API Gateway: proxy vs non-proxy (custom) integration',
      back: '• Proxy: the whole request is passed to the backend as-is; for Lambda proxy the function must return { statusCode, headers, body } or the client gets a 502.\n• Non-proxy (REST APIs): VTL mapping templates transform the integration request and response, so you can reshape payloads for a backend you cannot change.\nHTTP APIs offer parameter mapping but not VTL mapping templates.',
      hint: 'Pass-through vs transform',
      tags: ['api-gateway', 'lambda'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c7',
      front: 'Lambda limits that show up on the exam',
      back: '• Memory: 128 MB to 10,240 MB; CPU scales with memory.\n• Timeout: default 3 s, max 15 min.\n• /tmp ephemeral storage: 512 MB default, configurable up to 10,240 MB.\n• Package: 50 MB zipped direct upload, 250 MB unzipped including layers; container images up to 10 GB.\n• Up to 5 layers per function; environment variables up to 4 KB total.',
      hint: 'Memory, time, disk, size',
      tags: ['lambda', 'limits'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-dev-c8',
      front: 'Reserved vs provisioned concurrency vs SnapStart',
      back: '• Reserved: guarantees and caps concurrency for one function. Protects downstream systems; no extra charge.\n• Provisioned: pre-initialized environments on a version or alias; removes cold starts for predictable load; billed while configured.\n• SnapStart: snapshot of the initialized environment on a published version (Java, Python, .NET); cuts cold starts with no idle cost. Re-create unique state (random seeds, connections) in after-restore hooks.',
      hint: 'Cap, pre-warm, snapshot',
      tags: ['lambda', 'concurrency', 'performance'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-dev-c9',
      front: 'Lambda async invocations: retries, destinations or DLQ?',
      back: '• Async (S3, SNS, EventBridge): Lambda retries failed events twice by default; configure retry attempts (0-2) and maximum event age.\n• Destinations: on-success and on-failure records that include the request, response and error details.\n• DLQ: SQS or SNS only, failures only, event payload with limited error attributes.\nPrefer destinations for new designs.',
      hint: 'Two retries, then where?',
      tags: ['lambda', 'error-handling'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c10',
      front: 'Event source mappings (SQS, Kinesis, DynamoDB Streams): tuning and partial failures',
      back: '• Lambda polls the source and invokes your function with batches.\n• BatchSize and MaximumBatchingWindowInSeconds trade latency for fewer invocations.\n• ReportBatchItemFailures: return batchItemFailures with the failed itemIdentifier values so only those records are retried.\n• Streams: BisectBatchOnFunctionError, MaximumRetryAttempts and an on-failure destination stop a bad record from blocking the shard.',
      hint: 'Batch, window, report failures',
      tags: ['lambda', 'sqs', 'kinesis'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-dev-c11',
      front: 'EXAM TRAP: a Lambda function in a VPC suddenly cannot reach S3, DynamoDB or the internet',
      back: 'A VPC-attached function only has the network access of its subnets, and it never gets a public IP, even in a public subnet.\n• AWS services: add a gateway endpoint (S3, DynamoDB) or interface endpoints.\n• Internet: private subnet with a route to a NAT gateway.\nThe execution role also needs the ENI permissions (AWSLambdaVPCAccessExecutionRole).',
      hint: 'Endpoints or NAT, not a public IP',
      tags: ['lambda', 'vpc', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c12',
      front: 'DynamoDB RCU and WCU math',
      back: '• 1 RCU = 1 strongly consistent read/s of up to 4 KB, or 2 eventually consistent reads; transactional reads cost 2x.\n• 1 WCU = 1 write/s of up to 1 KB; transactional writes cost 2x.\n• Always round item size UP to the next 4 KB (reads) or 1 KB (writes) first.\nExample: 10 strongly consistent reads/s of 6 KB = 10 x 2 = 20 RCU; 10 writes/s of 2.5 KB = 10 x 3 = 30 WCU.',
      hint: 'Round up first: 4 KB reads, 1 KB writes',
      tags: ['dynamodb', 'capacity'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c13',
      front: 'EXAM TRAP: GSI vs LSI',
      back: '• GSI: any partition and sort key, add or delete at any time, own throughput, eventually consistent reads ONLY.\n• LSI: same partition key with a different sort key, must be created with the table, shares table throughput, supports strongly consistent reads, 10 GB limit per partition key value.\nTrap: "strongly consistent read on a GSI" is never a valid answer.',
      hint: 'Global = anytime, eventual only',
      tags: ['dynamodb', 'indexes', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-dev-c14',
      front: 'EXAM TRAP: BatchWriteItem vs TransactWriteItems',
      back: '• BatchWriteItem: up to 25 puts or deletes, no updates, no conditions, NOT atomic. Throttled items come back in UnprocessedItems and must be retried with exponential backoff.\n• TransactWriteItems: all-or-nothing across items and tables, supports condition checks and updates, costs 2x capacity.\nIgnoring UnprocessedItems means silently lost writes.',
      hint: 'Partial success vs all-or-nothing',
      tags: ['dynamodb', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-dev-c15',
      front: 'DynamoDB Query vs Scan, pagination and TTL',
      back: '• Query: needs the partition key; key conditions on the sort key read only matching items. Filter expressions apply AFTER the read and still consume capacity.\n• Scan: reads the whole table; use parallel scan only for bulk jobs.\n• Each call returns at most 1 MB: loop with ExclusiveStartKey = LastEvaluatedKey.\n• TTL: a Number attribute in epoch seconds; expired items are deleted in the background, not instantly, so filter them out on read.',
      hint: 'Key conditions, 1 MB pages, epoch seconds',
      tags: ['dynamodb'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-dev-c16',
      front: 'Caching: lazy loading vs write-through (ElastiCache, DAX)',
      back: '• Lazy loading (cache-aside): read the cache, on a miss read the DB and populate. Only requested data is cached; data can go stale; a miss costs three trips.\n• Write-through: update the cache on every DB write. Always fresh, but caches data nobody reads.\nCombine write-through with a TTL. DAX is a write-through, API-compatible cache for DynamoDB; ElastiCache needs your own logic.',
      hint: 'Fill on miss vs fill on write',
      tags: ['elasticache', 'dax', 'caching'],
      difficulty: 'intermediate'
    }
  ]
};
