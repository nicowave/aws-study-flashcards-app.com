// Domain 1: Development with AWS Services (32% of exam)
// DVA-C02 Exam Content

export const development = {
  id: 'development',
  name: 'Development with AWS Services',
  icon: '💻',
  weight: '32%',
  color: '#58a6ff',
  description: 'Develop code for applications hosted on AWS, Lambda, and data stores',
  questions: [
    // ── Task 1: Develop code for applications hosted on AWS ──
    {
      id: 'dev1',
      question: 'An order service must reserve inventory, charge a card and book shipping in sequence. If the charge fails, the inventory reservation must be released, and the team needs a visual history of every step for each order. Which approach should the developer use?',
      options: [
        'Publish an OrderPlaced event to an EventBridge bus and let each service react to it independently',
        'Have each Lambda function invoke the next one synchronously and roll back in a try/catch block',
        'Model the workflow as a Step Functions state machine with Catch blocks for compensation',
        'Send each step to its own SQS queue and have every consumer forward its message on to the next queue'
      ],
      correctAnswer: 2,
      explanation: 'Step Functions provides orchestration: a central state machine controls the sequence, runs compensating steps from Catch blocks and records a visual execution history for every order. EventBridge choreography decouples services but leaves no single place that owns the sequence or the rollback. Chaining Lambda functions synchronously couples them, wastes compute while waiting and loses state on timeouts, and hand-forwarding SQS messages rebuilds a workflow engine with no history.'
    },
    {
      id: 'dev2',
      question: 'When a customer uploads a document, three independent services (thumbnailing, virus scanning and indexing) must each process the upload at their own pace. If one service is down for an hour, it must not lose any uploads. Which design meets these requirements?',
      options: [
        'Publish to an SNS topic with an SQS queue subscribed for each service',
        'Send to a single SQS standard queue that all three services poll',
        'Publish to an SNS topic with an HTTPS endpoint subscribed for each service',
        'Write to a Kinesis data stream with one shard reserved for each service'
      ],
      correctAnswer: 0,
      explanation: 'The SNS-to-SQS fan-out pattern delivers a copy of every message to each subscribed queue, and each queue buffers messages durably until its service is back. A single shared queue delivers each message to only one consumer, so the services would split the work instead of each getting a copy. HTTPS subscriptions only retry within the limits of the delivery policy and then drop or dead-letter the message, so they are not a durable buffer for each service, and Kinesis shards are chosen by partition key, not assigned per consumer.'
    },
    {
      id: 'dev3',
      question: 'A worker reads messages from an SQS standard queue and calls a slow partner API. Processing usually takes about 90 seconds, and the logs show many messages being processed twice by different workers. The queue uses default settings. What should the developer change?',
      options: [
        'Enable long polling by setting ReceiveMessageWaitTimeSeconds to 20',
        'Convert the queue to a FIFO queue with content-based deduplication',
        'Lower the maxReceiveCount on the queue so duplicates go to a DLQ',
        'Raise the visibility timeout above the message processing time'
      ],
      correctAnswer: 3,
      explanation: 'The default visibility timeout is 30 seconds, so the message becomes visible again while the first worker is still working and a second worker receives it. Setting the visibility timeout longer than the processing time (or extending it with ChangeMessageVisibility) fixes the duplicates. Long polling only reduces empty receives, FIFO deduplication applies to sends within a 5-minute window rather than to re-delivery after a timeout, and a lower maxReceiveCount would push good messages to the DLQ.'
    },
    {
      id: 'dev4',
      question: 'A consumer application polls an SQS queue in a tight loop. Traffic is low, and the bill shows millions of ReceiveMessage calls that return no messages. How can the developer reduce cost with the smallest code change?',
      options: [
        'Add a fixed sleep between ReceiveMessage calls in the consumer loop',
        'Set WaitTimeSeconds on ReceiveMessage to use long polling',
        'Set a delivery delay on the queue so messages are batched together',
        'Raise MaxNumberOfMessages to 10 so each call returns more messages'
      ],
      correctAnswer: 1,
      explanation: 'Long polling (WaitTimeSeconds up to 20 on the call, or ReceiveMessageWaitTimeSeconds on the queue) makes ReceiveMessage wait for a message to arrive, which removes most empty responses and their cost. A fixed sleep adds latency and still makes empty calls. A delivery delay only postpones messages, and MaxNumberOfMessages helps when traffic is high but does nothing for empty receives.'
    },
    {
      id: 'dev5',
      question: 'A malformed message in an SQS queue makes the consumer throw an exception every time. The message keeps returning to the queue and blocks capacity for days. The team wants such messages moved aside automatically for later inspection. What should the developer configure?',
      options: [
        'A message retention period of one hour on the source queue',
        'A redrive policy to a DLQ with a maxReceiveCount',
        'A Lambda destination for failed records on the source queue',
        'A visibility timeout of zero so the message is retried immediately'
      ],
      correctAnswer: 1,
      explanation: 'A redrive policy with a dead-letter queue moves a message after it has been received maxReceiveCount times without being deleted, isolating poison messages for inspection and later redrive. A short retention period would silently delete good messages too. Lambda destinations apply to asynchronous invocations, not to SQS queues, and a zero visibility timeout makes the failing loop faster rather than removing the message.'
    },
    {
      id: 'dev6',
      question: 'A trading app sends order events to an SQS FIFO queue. Events for the same account must be processed in order, but throughput is too low because every message uses the same MessageGroupId. How should the developer increase parallelism while keeping per-account ordering?',
      options: [
        'Switch to a standard queue and sort messages by timestamp in the consumer',
        'Assign a unique MessageDeduplicationId to every message that is sent',
        'Add more consumers that all read from the same single message group',
        'Set MessageGroupId to the account ID so each account forms its own group'
      ],
      correctAnswer: 3,
      explanation: 'FIFO queues guarantee order within a message group and let different groups be processed in parallel, so using the account ID as the group ID keeps per-account order and spreads work across consumers. A standard queue gives best-effort ordering and possible duplicates. The deduplication ID controls duplicate suppression, not ordering or parallelism, and extra consumers cannot help because one group is delivered to only one consumer at a time.'
    },
    {
      id: 'dev7',
      question: 'An application must queue medical image metadata payloads of up to 50 MB for asynchronous processing. The payloads are larger than the SQS maximum message size. Which solution requires the least custom code?',
      options: [
        'Use the Amazon SQS Extended Client Library to store payloads in Amazon S3',
        'Compress each payload with gzip and send it as a base64 message body',
        'Split each payload into numbered parts and reassemble them in the consumer',
        'Switch the queue to a FIFO queue, which supports larger message payloads'
      ],
      correctAnswer: 0,
      explanation: 'The SQS Extended Client Library automatically stores large payloads in S3 and sends a pointer in the message, then retrieves the object on receive, so the application code barely changes. Compression may not shrink 50 MB below the limit, and splitting and reassembling messages is custom code that must handle ordering and loss. FIFO queues have the same message size limit as standard queues.'
    },
    {
      id: 'dev8',
      question: 'An SNS topic receives all order events. A fraud service only needs events where the order total exceeds 1,000 and the country attribute is not US. The developer wants to stop delivering irrelevant messages to the service without changing the publisher. What should the developer do?',
      options: [
        'Create a separate SNS topic for high-value orders and republish to it',
        'Discard unwanted messages in the fraud service after it receives them',
        'Add a subscription filter policy to the fraud service subscription',
        'Configure a delivery policy on the topic that skips non-matching messages'
      ],
      correctAnswer: 2,
      explanation: 'An SNS subscription filter policy matches on message attributes or the message body, including numeric ranges and anything-but conditions, so only matching messages are delivered to that subscriber. A second topic requires publisher or relay changes. Filtering in the consumer still pays for and processes every delivery, and delivery policies control retry behavior for HTTP endpoints, not which messages are sent.'
    },
    {
      id: 'dev9',
      question: 'A developer must read messages from an SQS queue, drop messages whose status is TEST, enrich the rest by calling a Lambda function, and start a Step Functions execution for each one. The team wants to avoid writing and maintaining polling or glue code. Which service fits best?',
      options: [
        'An EventBridge rule on the default event bus with an SQS target',
        'An SNS topic with a filter policy and a Step Functions subscription',
        'A Lambda function with an SQS event source mapping that calls the StartExecution API for each message',
        'An EventBridge pipe with filtering, Lambda enrichment and a state machine target'
      ],
      correctAnswer: 3,
      explanation: 'EventBridge Pipes connects a point-to-point source such as SQS to a target, with built-in filtering and an optional enrichment step, so no polling or glue code is needed. An EventBridge rule matches events on a bus and cannot poll an SQS queue as a source. SNS cannot read from a queue, and a Lambda consumer that calls StartExecution is exactly the glue code the team wants to avoid.'
    },
    {
      id: 'dev10',
      question: 'IoT devices send readings to a Kinesis data stream with several shards. Readings from each device must be processed in the order they were produced, while different devices should be spread across shards. How should the producer write records?',
      options: [
        'Use the device ID as the partition key in PutRecords calls',
        'Use a random UUID as the partition key for every record',
        'Use the reading timestamp as the partition key for each record',
        'Write every record to a single shard by passing a fixed partition key'
      ],
      correctAnswer: 0,
      explanation: 'Kinesis hashes the partition key to choose a shard and preserves order within a shard, so using the device ID keeps each device in order while spreading devices across shards. A random UUID or a timestamp distributes records well but scatters one device across shards and loses its order. A fixed key preserves order but puts all traffic on one shard and caps throughput.'
    },
    {
      id: 'dev11',
      question: 'A workflow processes each clickstream event in under 10 seconds, runs about 100,000 times per minute, and can tolerate at-least-once execution because each step is idempotent. Which Step Functions configuration is most cost-effective?',
      options: [
        'Standard workflow started with the StartExecution API',
        'Express workflow invoked asynchronously for each event',
        'Standard workflow with a Map state over each batch of events',
        'Express workflow nested as a child of a Standard workflow'
      ],
      correctAnswer: 1,
      explanation: 'Express workflows are built for high-volume, short-lived (up to 5 minutes) event processing, are billed by requests and duration, and their asynchronous mode has at-least-once semantics, which the idempotent steps tolerate. Standard workflows are billed per state transition and are designed for long-running, exactly-once workflows, which would be expensive at this volume. Wrapping an Express workflow in a Standard parent still pays Standard transitions for every event.'
    },
    {
      id: 'dev12',
      question: 'A Task state in a Step Functions workflow calls a Lambda function that occasionally fails with a throttling error. The developer wants up to three retries with increasing delays and, if they all fail, a transition to a NotifyFailure state that receives the error details. How should the state be configured?',
      options: [
        'Set TimeoutSeconds on the Task state and add a Choice state after it',
        'Configure Lambda asynchronous retries and an on-failure destination',
        'Add Retry with MaxAttempts and BackoffRate, plus a Catch to NotifyFailure',
        'Wrap the Lambda call in a Parallel state that contains a second fallback branch'
      ],
      correctAnswer: 2,
      explanation: 'A Retry field with ErrorEquals, MaxAttempts, IntervalSeconds and BackoffRate retries the Task with exponential delays, and a Catch field with Next and ResultPath routes the final failure and its error output to NotifyFailure. TimeoutSeconds limits runtime but does not retry, and a Choice state cannot inspect an unhandled failure. Lambda async retries do not apply because Step Functions invokes the function synchronously, and a Parallel state runs both branches rather than falling back.'
    },
    {
      id: 'dev13',
      question: 'Many instances of a batch job call DynamoDB at the same moment and receive ThrottlingException errors. The custom retry code waits exactly 1, 2 and then 4 seconds, and the retries keep colliding. What change best reduces the collisions?',
      options: [
        'Add random jitter to the exponential backoff between retries',
        'Retry immediately in a loop until the request finally succeeds',
        'Shorten every retry delay to a fixed interval of 100 milliseconds',
        'Disable the SDK retry logic and fail the job on the first error'
      ],
      correctAnswer: 0,
      explanation: 'Exponential backoff with jitter randomizes each client\'s wait so retries spread out instead of arriving together, which is the AWS-recommended pattern and what the AWS SDKs implement by default. Immediate or fixed-interval retries keep every client synchronized and make throttling worse. Failing on the first error avoids collisions but turns transient throttling into job failures.'
    },
    {
      id: 'dev14',
      question: 'A Lambda function charges customers when it receives a payment event. The event source can deliver the same event more than once, and duplicate charges have occurred. What is the most reliable way to make the function safe to retry?',
      options: [
        'Set the function reserved concurrency to 1 so events run one at a time',
        'Reduce the asynchronous retry attempts on the function to zero',
        'Increase the function timeout so retries are less likely to happen',
        'Store an idempotency key with a conditional write and skip known keys'
      ],
      correctAnswer: 3,
      explanation: 'Recording a unique idempotency key (for example the payment ID) with a conditional write such as attribute_not_exists lets the function detect a repeated event and return the earlier result without charging again; Powertools for AWS Lambda provides this pattern. Serializing invocations does not stop the same event arriving twice. Disabling retries loses events after transient errors, and a longer timeout does not prevent at-least-once delivery.'
    },
    {
      id: 'dev15',
      question: 'A legacy SOAP-style backend expects an XML body with different field names than the JSON that mobile clients send to an API Gateway REST API. The backend team cannot change their service, and the developer does not want to add a Lambda function. How should the integration be configured?',
      options: [
        'Use an HTTP proxy integration and let the backend parse the JSON body',
        'Use an HTTP API with a Lambda proxy integration that converts the JSON body to XML',
        'Use a non-proxy HTTP integration with request and response mapping templates',
        'Use a VPC link to the backend and enable content encoding on the stage'
      ],
      correctAnswer: 2,
      explanation: 'A non-proxy (custom) integration in a REST API lets VTL mapping templates transform the request into the XML the backend expects and transform the response back to JSON, with no extra compute. A proxy integration passes the request through unchanged, which the backend cannot accept. A Lambda converter is the code the developer wants to avoid, and VPC links and content encoding handle connectivity and compression, not field mapping.'
    },
    {
      id: 'dev16',
      question: 'An API Gateway endpoint starts a report that takes several minutes to generate, but clients receive a timeout error because the API waits for the work to finish. Clients can check back later for the result. Which change best fits this requirement?',
      options: [
        'Raise the Lambda function timeout to 15 minutes and keep the synchronous API call',
        'Queue the request in SQS, return 202 with a job ID, and process it asynchronously',
        'Enable API caching on the stage so repeated requests return the stored report',
        'Switch the endpoint to a Lambda function URL so the response has no time limit'
      ],
      correctAnswer: 1,
      explanation: 'Accepting the request, queuing the work and returning 202 Accepted with a job ID decouples the client from the long-running task, and the client can poll a status endpoint or be notified later. A longer Lambda timeout does not help because API Gateway integrations are designed for short requests and the integration timeout still ends the call. Caching only helps repeated identical requests, and a function URL is still bound by the Lambda maximum timeout and keeps clients waiting in a fragile synchronous design.'
    },

    // ── Task 2: Develop code for AWS Lambda ──
    {
      id: 'dev17',
      question: 'A Lambda function that resizes images is CPU-bound and takes 8 seconds per invocation at 512 MB of memory, using far less memory than allocated. How can the developer make it run faster without changing code?',
      options: [
        'Increase the memory setting, which also allocates more CPU to the function',
        'Increase the ephemeral storage setting so image processing has more room',
        'Enable provisioned concurrency so the function always runs on warm instances',
        'Increase the function timeout so each invocation can finish its processing'
      ],
      correctAnswer: 0,
      explanation: 'Lambda allocates CPU in proportion to configured memory, so raising memory speeds up CPU-bound work, often with little or no extra cost because duration drops. Ephemeral storage only adds /tmp disk space. Provisioned concurrency removes cold starts but does not speed up the handler itself, and a longer timeout only lets a slow function keep running.'
    },
    {
      id: 'dev18',
      question: 'Twelve Lambda functions in the same account use an identical set of internal utility libraries. Every library update currently means rebuilding and redeploying twelve large deployment packages. What should the developer do?',
      options: [
        'Store the libraries in Amazon S3 and download them at the start of each invocation',
        'Copy the libraries into /tmp during initialization and import them from there',
        'Move the libraries into an environment variable that every function reads',
        'Package the libraries as a Lambda layer and attach the layer to each function'
      ],
      correctAnswer: 3,
      explanation: 'A Lambda layer packages shared libraries once and can be attached to many functions, keeping each deployment package small; functions pick up a new library version when their layer version reference is updated. Downloading from S3 or copying into /tmp adds latency and custom loading code to every cold start. Environment variables are small key-value settings and cannot hold library code.'
    },
    {
      id: 'dev19',
      question: 'A data science team wants to run a Python inference function on Lambda. Its dependencies total about 3 GB, which is far above the size allowed for a .zip deployment package with layers. The team already builds Docker images in CI. What should they do?',
      options: [
        'Split the dependencies across several Lambda layers attached to the function',
        'Upload the .zip package to Amazon S3 so the package size limit no longer applies',
        'Package the function as a container image in Amazon ECR and deploy it to Lambda',
        'Download the dependencies to /tmp from Amazon S3 on every function invocation'
      ],
      correctAnswer: 2,
      explanation: 'Lambda container images can be up to 10 GB, are stored in ECR and fit a team that already builds Docker images. Layers count toward the same 250 MB unzipped limit as the function code, and uploading the .zip to S3 changes where it is stored, not the unzipped limit. Downloading 3 GB on each invocation is slow, and the default /tmp size is far smaller than that.'
    },
    {
      id: 'dev20',
      question: 'A Lambda function writes to a legacy database that fails when it receives more than 50 concurrent connections. During traffic spikes the function scales far beyond that. How should the developer limit the function without affecting other functions in the account?',
      options: [
        'Configure provisioned concurrency of 50 on the function alias',
        'Set reserved concurrency of 50 on the function',
        'Lower the account concurrency quota by opening a support case',
        'Set the event source mapping batch size to 50 for the function'
      ],
      correctAnswer: 1,
      explanation: 'Reserved concurrency both guarantees and caps the number of concurrent executions for one function, so setting it to 50 protects the database while leaving other functions unaffected. Provisioned concurrency pre-initializes environments to reduce cold starts but does not cap scaling. Lowering the account quota throttles every function, and batch size controls records per invocation rather than concurrency.'
    },
    {
      id: 'dev21',
      question: 'A checkout API backed by Lambda has a strict p99 latency target. Traffic is predictable, rising sharply at 9:00 every weekday, and the first requests each morning are slow because of cold starts. Which solution meets the latency target?',
      options: [
        'Raise the reserved concurrency for the function before 9:00 each weekday',
        'Schedule an EventBridge rule that invokes the function once every minute',
        'Increase the memory of the function so initialization runs more quickly',
        'Configure provisioned concurrency on an alias, scaled up on a schedule'
      ],
      correctAnswer: 3,
      explanation: 'Provisioned concurrency keeps a set number of execution environments initialized on a version or alias, and Application Auto Scaling can raise it on a schedule before the predictable spike. Reserved concurrency limits scaling but does not pre-warm anything. A once-a-minute ping keeps at most a few environments warm, not the many needed at peak, and more memory may shorten initialization but does not remove it.'
    },
    {
      id: 'dev22',
      question: 'A Java Spring Boot function on Lambda spends about 6 seconds initializing on each cold start. Traffic is spiky and unpredictable, and the team does not want to pay for idle pre-initialized environments. Which feature should the developer enable?',
      options: [
        'Lambda SnapStart on a published version of the function',
        'Provisioned concurrency on the function $LATEST version',
        'A Lambda extension that preloads the Spring application context',
        'Arm64 architecture with a larger ephemeral storage allocation'
      ],
      correctAnswer: 0,
      explanation: 'SnapStart snapshots the initialized execution environment when a version is published and resumes new environments from that snapshot, cutting Java cold starts sharply without paying for idle capacity. Provisioned concurrency charges for warm environments even when idle and cannot be set on $LATEST. Extensions run alongside the function but cannot skip its initialization, and Arm64 or more /tmp space does not remove a slow framework startup.'
    },
    {
      id: 'dev23',
      question: 'A Lambda function consumes an SQS queue with a batch size of 10. When one message in a batch fails, all 10 messages return to the queue and the 9 successful ones are processed again. How should the developer fix this?',
      options: [
        'Reduce the batch size to 1 so each message is processed in its own invocation',
        'Delete successful messages manually and then throw an error for the batch',
        'Enable ReportBatchItemFailures and return the IDs of the failed messages',
        'Configure an on-failure destination for the event source mapping'
      ],
      correctAnswer: 2,
      explanation: 'With ReportBatchItemFailures enabled on the event source mapping, the function returns batchItemFailures listing only the failed message IDs, and Lambda deletes the rest. A batch size of 1 avoids reprocessing but sharply lowers throughput and raises cost. Manually deleting messages works but is error-prone custom code, and an on-failure destination captures failed batches without stopping the successful messages from being retried.'
    },
    {
      id: 'dev24',
      question: 'S3 invokes a Lambda function asynchronously. When an event still fails after all retries, the team wants the original event, the error message and the stack trace delivered to another Lambda function for alerting. What should the developer configure?',
      options: [
        'A dead-letter queue on the function that uses an SNS topic',
        'An on-failure destination that targets the alerting function',
        'A DLQ redrive policy on the S3 bucket event notification configuration',
        'A CloudWatch Logs subscription filter that forwards all ERROR log lines'
      ],
      correctAnswer: 1,
      explanation: 'Lambda destinations for asynchronous invocations send a record that includes the request payload plus the response with the error message and stack trace, and can target another Lambda function directly. A function DLQ can only target SQS or SNS and carries the event with only a few error attributes, not the full error response. S3 notifications have no redrive policy, and a log subscription filter would require parsing logs to rebuild the event.'
    },
    {
      id: 'dev25',
      question: 'A Lambda function was attached to private subnets so it can reach an RDS database. Since the change, its calls to DynamoDB time out. The VPC has no NAT gateway, and the security team does not want traffic to leave the AWS network. What should the developer add?',
      options: [
        'A gateway VPC endpoint for DynamoDB added to the private route tables',
        'An internet gateway attached to the VPC and a public IP address on the function',
        'A NAT gateway in a public subnet with a default route from the private subnets',
        'A DynamoDB Accelerator cluster in the same subnets as the Lambda function'
      ],
      correctAnswer: 0,
      explanation: 'A VPC-attached Lambda function has no internet access, and a gateway VPC endpoint gives private, no-cost access to DynamoDB (and S3) through route table entries. Lambda functions cannot be given public IP addresses, so an internet gateway alone does not help. A NAT gateway would work but routes traffic to public endpoints and adds cost, and DAX is a cache that still needs DynamoDB access.'
    },
    {
      id: 'dev26',
      question: 'A payment provider needs to call a single Lambda function with webhook notifications over HTTPS. The provider signs every request with a shared secret and cannot sign requests with AWS credentials. The developer wants the simplest setup with no extra services. What should the developer do?',
      options: [
        'Create a REST API in API Gateway with an IAM authorizer on the method',
        'Put an Application Load Balancer in front of the function with HTTPS listeners',
        'Create a function URL with the AWS_IAM auth type and share the access keys',
        'Create a function URL with auth type NONE and verify signatures in code'
      ],
      correctAnswer: 3,
      explanation: 'A Lambda function URL gives the function its own HTTPS endpoint with no other service, and the NONE auth type suits callers that cannot use SigV4, as long as the function validates the provider\'s signature. API Gateway and an ALB work but add services the developer wanted to avoid, and an IAM authorizer would still require AWS signing. Sharing long-term access keys with a third party is a security anti-pattern.'
    },
    {
      id: 'dev27',
      question: 'A Lambda function creates a new database connection and a new SDK client inside the handler on every invocation. Latency is high and the database shows heavy connection churn. Which change gives the biggest improvement with the least effort?',
      options: [
        'Increase the function timeout so each connection has more time to open',
        'Create the client and connection outside the handler for reuse',
        'Store the open connection object in an environment variable between invocations',
        'Close the connection at the end of every invocation to free database resources'
      ],
      correctAnswer: 1,
      explanation: 'Code outside the handler runs once per execution environment during initialization, so clients and connections created there are reused by every warm invocation. A longer timeout does not reduce churn. Environment variables hold strings set at deployment and cannot store live objects, and closing connections each time makes the churn worse.'
    },
    {
      id: 'dev28',
      question: 'An observability vendor provides a component that collects telemetry from Lambda functions and ships it to the vendor platform. The team wants to add it to dozens of functions without changing function code and without delaying responses while data is sent. What should the developer use?',
      options: [
        'A CloudWatch Logs subscription filter that streams logs to the vendor',
        'A wrapper script set through the AWS_LAMBDA_EXEC_WRAPPER variable',
        'A Lambda extension delivered as a layer that uses the Telemetry API',
        'An EventBridge rule that forwards Lambda invocation events to the vendor'
      ],
      correctAnswer: 2,
      explanation: 'Lambda extensions run as companion processes in the execution environment, are distributed as layers, and can receive logs, metrics and traces through the Telemetry API and send them asynchronously without code changes. A log subscription filter only covers CloudWatch Logs and adds another delivery service. A wrapper script changes how the runtime starts rather than collecting telemetry in the background, and EventBridge does not emit an event for every invocation.'
    },

    // ── Task 3: Use data stores in application development ──
    {
      id: 'dev29',
      question: 'A DynamoDB table for a voting app uses the poll ID as its partition key. During a live TV poll, almost all writes go to one poll ID and the writes are throttled even though the table has spare capacity overall. How should the developer redesign the writes?',
      options: [
        'Switch the table to provisioned capacity with a much higher WCU setting',
        'Add a local secondary index on the poll ID so writes are distributed',
        'Use a Scan with a filter expression to spread the load across partitions',
        'Shard the key with a random suffix on the poll ID and sum on read'
      ],
      correctAnswer: 3,
      explanation: 'A single hot partition key is limited by per-partition throughput, so write sharding (pollId#1 to pollId#N) spreads writes across partitions, and the app sums the shards when reading. More table-level capacity does not lift the per-partition limit. An LSI shares the same partition key and adds writes rather than spreading them, and a Scan is a read operation that does nothing for write throttling.'
    },
    {
      id: 'dev30',
      question: 'An Orders table uses customerId as the partition key and orderDate as the sort key. The app must show one customer\'s orders from the last 30 days with the lowest read cost. Which call should the developer use?',
      options: [
        'Query on customerId with a BETWEEN key condition on orderDate',
        'Scan with a filter expression on customerId and orderDate for the date range',
        'GetItem with customerId and orderDate for each day in the date range',
        'Query with customerId in the key condition and a filter expression on orderDate'
      ],
      correctAnswer: 0,
      explanation: 'A Query with the partition key and a BETWEEN key condition on the sort key reads only the matching items, so it is the cheapest option. A Scan reads every item in the table before filtering. GetItem needs the exact sort key and would require dozens of calls, and a filter expression is applied after items are read, so it still consumes capacity for every order the customer has ever placed.'
    },
    {
      id: 'dev31',
      question: 'A DynamoDB table in production uses userId as its partition key. A new feature must look up users by email address, and the table cannot be recreated. What should the developer add?',
      options: [
        'A local secondary index with email as the sort key of the index',
        'A filter expression on email added to the existing Scan operations',
        'A global secondary index with email as its partition key',
        'A DynamoDB stream that copies each email into a lookup attribute'
      ],
      correctAnswer: 2,
      explanation: 'A global secondary index can use a different partition key, such as email, and can be added to an existing table at any time. A local secondary index must be created with the table and keeps the same partition key, so it cannot look up by email alone. A Scan with a filter reads the whole table, and a stream that copies attributes does not create a new way to query.'
    },
    {
      id: 'dev32',
      question: 'An application performs 20 strongly consistent reads per second on a DynamoDB table with provisioned capacity. Each item is 7 KB. How many read capacity units must the table provide?',
      options: [
        '20 RCU',
        '40 RCU',
        '35 RCU',
        '80 RCU'
      ],
      correctAnswer: 1,
      explanation: 'One RCU is one strongly consistent read per second of up to 4 KB, so a 7 KB item rounds up to 8 KB and needs 2 RCU per read; 20 reads x 2 = 40 RCU. 20 RCU is the eventually consistent figure, which costs half as much. 35 RCU comes from dividing 7 KB exactly instead of rounding up to 4 KB blocks, and 80 RCU would be correct for transactional reads, which cost double.'
    },
    {
      id: 'dev33',
      question: 'Two users can edit the same product record at the same time, and one user\'s changes sometimes silently overwrite the other\'s. Each item has a version number attribute. How should the developer prevent lost updates in DynamoDB?',
      options: [
        'Read the item with ConsistentRead set to true before each update',
        'Use BatchWriteItem so both updates are applied in a single request',
        'Enable DynamoDB Streams and roll back any conflicting change later',
        'Update with a condition on the expected version, then increment it'
      ],
      correctAnswer: 3,
      explanation: 'Optimistic locking uses a ConditionExpression such as version = :expected and increments the version in the same UpdateItem; if another writer got there first, the call fails with ConditionalCheckFailedException and the app can reload and retry. A strongly consistent read still leaves a race between the read and the write. BatchWriteItem does not support conditions, and rolling back from a stream after the fact is complex and leaves a window of bad data.'
    },
    {
      id: 'dev34',
      question: 'When a user redeems a reward, the app must deduct points from the Users table and insert a record into the Redemptions table. Either both writes succeed or neither does, and the deduction must fail if the balance would go negative. Which API should the developer use?',
      options: [
        'TransactWriteItems with a conditional Update and a Put',
        'BatchWriteItem with one request for each of the two tables',
        'Two UpdateItem calls wrapped in a retry loop with backoff',
        'PutItem on both tables with ReturnValues set to ALL_OLD'
      ],
      correctAnswer: 0,
      explanation: 'TransactWriteItems applies a group of writes across one or more tables atomically, and a condition on the Update (for example points >= :cost) cancels the whole transaction if it fails. BatchWriteItem is not atomic, does not support updates or conditions, and can leave some items unprocessed. Separate calls with retries can leave one write applied without the other, and ReturnValues only returns old attributes.'
    },
    {
      id: 'dev35',
      question: 'A report job runs a Query that should return about 50,000 items, but each call returns only a few thousand items and the report is incomplete. No errors are thrown. What is the cause and the fix?',
      options: [
        'The table is throttled; switch it to on-demand capacity mode',
        'The Limit parameter defaults to 1,000; set it to 50,000 instead',
        'Results stop at 1 MB; pass LastEvaluatedKey as ExclusiveStartKey',
        'The query uses eventual consistency; set ConsistentRead to true'
      ],
      correctAnswer: 2,
      explanation: 'A single Query or Scan returns at most 1 MB of data, and LastEvaluatedKey in the response means more results exist; the app must call again with ExclusiveStartKey until LastEvaluatedKey is absent, which SDK paginators do automatically. Throttling raises an error instead of returning partial results silently. Limit has no default of 1,000 and cannot exceed the 1 MB page size, and consistency affects freshness, not result count.'
    },
    {
      id: 'dev36',
      question: 'A gaming leaderboard reads the same DynamoDB items thousands of times per second and needs microsecond read latency. The team wants to keep using the DynamoDB API with minimal code changes. Which solution should the developer choose?',
      options: [
        'Amazon ElastiCache for Redis OSS with a lazy-loading cache layer in the app',
        'DynamoDB Accelerator (DAX) using the DAX client in place of the SDK client',
        'DynamoDB global tables with a replica in every Region where players live',
        'A global secondary index projecting the leaderboard attributes for reads'
      ],
      correctAnswer: 1,
      explanation: 'DAX is an in-memory cache for DynamoDB that is API-compatible, so the app swaps in the DAX client and gets microsecond reads for eventually consistent requests. ElastiCache can be just as fast but requires custom caching logic and a different API. Global tables reduce cross-Region latency but still return in milliseconds, and a GSI is another DynamoDB read path, not a cache.'
    },
    {
      id: 'dev37',
      question: 'A web app lets users upload videos directly from the browser to a private S3 bucket. The developer does not want uploads to pass through the application servers or to give users AWS credentials. What should the backend do?',
      options: [
        'Return a presigned PUT URL with a short expiry to the browser',
        'Enable static website hosting on the bucket and allow public PUT requests',
        'Embed an IAM access key with s3:PutObject permission in the browser app',
        'Enable S3 Transfer Acceleration and grant the bucket to all users'
      ],
      correctAnswer: 0,
      explanation: 'A presigned URL grants time-limited permission to perform one operation on one object using the permissions of the identity that signed it, so the browser uploads straight to S3 without credentials. Public PUT access lets anyone write to the bucket, and embedding access keys exposes long-term credentials. Transfer Acceleration speeds up uploads over distance but does not handle authorization.'
    },
    {
      id: 'dev38',
      question: 'An application uploads 20 GB backup files to S3 over an unreliable network. Single PutObject calls fail for these files, and when a network error occurs the whole upload restarts. What should the developer do?',
      options: [
        'Use S3 Transfer Acceleration with a single PutObject call for each file',
        'Compress each file with gzip and upload it in one PutObject request',
        'Upload the files through a presigned URL with a longer expiration time',
        'Use multipart upload so that failed parts can be retried alone'
      ],
      correctAnswer: 3,
      explanation: 'A single PUT is limited to 5 GB, and multipart upload splits a file into parts that upload in parallel, so only a failed part is retried; the SDK transfer managers do this automatically. Transfer Acceleration improves network path speed but does not lift the single-PUT limit. Compression may not bring a backup under 5 GB, and a presigned URL changes authorization, not the size limit.'
    },
    {
      id: 'dev39',
      question: 'An app uses lazy loading with ElastiCache in front of a product database. Customers sometimes see old prices for hours after an update because the cached item is still served. Which change keeps the cache current while limiting memory use?',
      options: [
        'Remove the TTL from cache entries so items are never evicted from memory',
        'Switch to read-through only and query the database whenever a cache miss occurs',
        'Write to the cache whenever the database is updated, and keep a TTL on entries',
        'Increase the node size of the cluster so more items can be held in memory'
      ],
      correctAnswer: 2,
      explanation: 'Write-through updates the cache at the same time as the database, so reads see new prices immediately, and a TTL still evicts items that are rarely read. Removing the TTL makes staleness and memory use worse. Lazy loading already reads the database on a miss, which is the cause of the stale data, and a bigger node holds more stale data rather than fixing it.'
    },
    {
      id: 'dev40',
      question: 'A Lambda function connects to an Aurora MySQL database. During traffic spikes, thousands of concurrent executions open connections and the database runs out of connections. Which solution requires the least application change?',
      options: [
        'Move the database credentials into AWS Secrets Manager with rotation',
        'Point the function at an Amazon RDS Proxy endpoint',
        'Add Aurora Replicas and send every write to the reader endpoint',
        'Set the Lambda timeout lower so connections are closed more quickly'
      ],
      correctAnswer: 1,
      explanation: 'RDS Proxy pools and shares database connections across many Lambda executions, so the app only changes its connection endpoint. Secrets Manager improves credential handling but not connection counts. Aurora Replicas cannot accept writes, and a shorter timeout fails requests without reducing how many connections are open at the same time.'
    },
    {
      id: 'dev41',
      question: 'Whenever an item in a DynamoDB Orders table changes status, a Lambda function must email the customer and include both the previous and the new status. How should the developer implement this?',
      options: [
        'Run a scheduled Lambda function that scans the table for recently changed items',
        'Enable DynamoDB TTL and process the expired items in a Lambda function',
        'Publish an SNS message from every code path that updates the order status',
        'Enable DynamoDB Streams with NEW_AND_OLD_IMAGES and add a Lambda trigger'
      ],
      correctAnswer: 3,
      explanation: 'DynamoDB Streams captures every item-level change, and the NEW_AND_OLD_IMAGES view type gives the Lambda function both the before and after values. Scheduled scans are slow, expensive and can miss intermediate changes. TTL only produces deletions of expired items, and publishing from every code path is easy to miss and does not include the old value reliably.'
    },
    {
      id: 'dev42',
      question: 'A product catalog is stored in DynamoDB. Users need full-text search with typo tolerance, relevance ranking and faceted filters across product names and descriptions. Which approach should the developer use?',
      options: [
        'Replicate the data into Amazon OpenSearch Service for search',
        'Add a global secondary index on the description attribute and query it',
        'Run a Scan with a contains() filter expression on the name and description',
        'Cache the catalog in DAX and filter the cached items in application code'
      ],
      correctAnswer: 0,
      explanation: 'OpenSearch Service provides full-text search, fuzzy matching, relevance scoring and aggregations for facets, and DynamoDB data can be replicated to it with the zero-ETL integration or a stream-driven Lambda. A GSI only supports exact key matches and prefix conditions on sort keys. A Scan with contains() reads the whole table and has no ranking or typo tolerance, and DAX caches items without adding any search features.'
    }
  ]
};
