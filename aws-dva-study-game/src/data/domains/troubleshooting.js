// Domain 4: Troubleshooting and Optimization (18% of exam)
// DVA-C02 Exam Content

export const troubleshooting = {
  id: 'troubleshooting',
  name: 'Troubleshooting and Optimization',
  icon: '🔧',
  weight: '18%',
  color: '#d29922',
  description: 'Root cause analysis, instrumentation for observability, and application performance optimization',
  questions: [
    {
      id: 'trb1',
      question: 'An API Gateway REST API uses a Lambda proxy integration. Clients receive HTTP 502 Bad Gateway on every call, yet the function logs show each invocation completing successfully and returning the plain string "OK". What should the developer change?',
      options: [
        'Increase the integration timeout on the API Gateway method',
        'Return an object with a statusCode and a string body from the function',
        'Raise the reserved concurrency setting of the Lambda function',
        'Enable CORS on the resource and then redeploy the stage'
      ],
      correctAnswer: 1,
      explanation: 'With a Lambda proxy integration, API Gateway expects the function to return a JSON object containing statusCode, optional headers, and body as a string; any other shape is a malformed response and produces a 502. A timeout would surface as a 504, concurrency limits cause throttling rather than a successful invocation, and CORS settings only affect browser preflight and response headers, not the response format.'
    },
    {
      id: 'trb2',
      question: 'A REST API endpoint triggers a Lambda function that builds a PDF report. Report generation now takes about 45 seconds, and callers receive HTTP 504 even though the function finishes and the report is saved. The API must stay responsive to clients. What is the best fix?',
      options: [
        'Raise the Lambda function timeout to its maximum value',
        'Enable API Gateway caching on the stage for the endpoint',
        'Accept the request, queue the work, and let clients poll for the result',
        'Switch the method from a proxy to a non-proxy Lambda integration'
      ],
      correctAnswer: 2,
      explanation: 'A 504 means API Gateway gave up waiting on the integration; the REST API integration timeout defaults to 29 seconds regardless of the Lambda timeout. Returning 202 immediately and processing asynchronously (for example through SQS or an asynchronous invocation) with a status endpoint keeps the API responsive. Raising the Lambda timeout does not change the API Gateway timeout, caching does not help a long-running write operation, and the integration type does not affect the timeout.'
    },
    {
      id: 'trb3',
      question: 'Partners call a REST API with API keys attached to a usage plan. During peak hours some partners intermittently receive HTTP 429 responses, while the backend Lambda function shows no errors or throttles. What is the most likely cause?',
      options: [
        'The Lambda authorizer is rejecting tokens that have expired',
        'The backend integration is exceeding the integration timeout',
        'The API key is missing from the x-api-key request header',
        'Requests exceed the usage plan rate or burst limit for the key'
      ],
      correctAnswer: 3,
      explanation: 'HTTP 429 Too Many Requests from API Gateway means a throttling limit (stage, method, or usage plan rate and burst) or a usage plan quota was exceeded, so the request never reached the backend. Rejected authorizer tokens and missing API keys return 401 or 403, and integration timeouts return 504. Clients should retry with exponential backoff and jitter, or the usage plan limits should be raised.'
    },
    {
      id: 'trb4',
      question: 'A developer tests a newly added POST /orders method on a REST API with curl and receives HTTP 403 with the message "Missing Authentication Token". The API uses no authorizers or API keys. What is the most likely cause?',
      options: [
        'The resource or method has not been deployed to the stage being called',
        'The account-level throttling limit for API Gateway has been reached',
        'The Lambda execution role cannot write logs to CloudWatch Logs',
        'The backend Lambda function threw an unhandled runtime exception'
      ],
      correctAnswer: 0,
      explanation: 'On a REST API, "Missing Authentication Token" with a 403 commonly means the request did not match any deployed resource and method, for example a typo in the path or changes that were never deployed to the stage. Throttling returns 429, a backend exception returns 502 through a proxy integration, and logging permissions on the execution role do not change the API response.'
    },
    {
      id: 'trb5',
      question: 'A Lambda function that parses large JSON files intermittently fails. The REPORT lines for failed invocations show "Max Memory Used: 1024 MB" with "Memory Size: 1024 MB", followed by "Runtime exited with error: signal: killed". What should the developer do first?',
      options: [
        'Increase the function timeout to its maximum allowed value',
        'Increase the memory allocated to the Lambda function',
        'Enable provisioned concurrency for the Lambda function',
        'Increase the ephemeral storage size of the function'
      ],
      correctAnswer: 1,
      explanation: 'Max Memory Used equal to the configured memory size followed by the runtime being killed is the signature of an out-of-memory failure, so the fix is to raise the memory setting (or stream the file instead of loading it whole). A timeout would log "Task timed out", provisioned concurrency only removes cold starts, and ephemeral storage is the /tmp disk, which is separate from memory.'
    },
    {
      id: 'trb6',
      question: 'An order-processing Lambda function is invoked asynchronously by S3 events. During a nightly batch job, a different function in the same account scales out heavily, and the order function\'s Throttles metric spikes while its events are delayed. The order function must always be able to run. What should the developer configure?',
      options: [
        'Reserved concurrency for the order-processing function',
        'More memory and a longer timeout for the order function',
        'Active X-Ray tracing on both of the Lambda functions',
        'A dead-letter queue on the batch-processing function'
      ],
      correctAnswer: 0,
      explanation: 'Both functions share the Regional account concurrency pool, so the batch function can starve the order function. Reserved concurrency sets aside capacity that only the order function can use (and also caps it). Memory and timeout do not affect concurrency, tracing only adds visibility, and a DLQ on the noisy function does not free up concurrency for the other one.'
    },
    {
      id: 'trb7',
      question: 'A DynamoDB table in provisioned mode is consuming well under its total write capacity, yet writes fail with ProvisionedThroughputExceededException. CloudWatch Contributor Insights shows that most writes target a single partition key value representing the current date. What is the best long-term fix?',
      options: [
        'Double the provisioned write capacity units on the table',
        'Add a global secondary index on the same partition key',
        'Place a DAX cluster in front of the table to absorb writes',
        'Append a random suffix to spread writes across key values'
      ],
      correctAnswer: 3,
      explanation: 'This is a hot partition: one key value receives more writes than a single partition can absorb, even though table-level capacity is unused. Write sharding (adding a calculated or random suffix to the key) distributes writes across partitions. Adding capacity does not fix a per-partition limit, a GSI with the same key inherits the same hot spot, and DAX is a write-through cache that still sends every write to the table.'
    },
    {
      id: 'trb8',
      question: 'Workers on EC2 poll a standard SQS queue and each message takes about 3 minutes to process. The queue uses the default 30-second visibility timeout, and the team sees many orders processed two or three times. What should the developer change?',
      options: [
        'Enable long polling with a 20-second receive wait time',
        'Raise the visibility timeout above the message processing time',
        'Convert the queue to a FIFO queue with content deduplication',
        'Reduce the message retention period configured on the queue'
      ],
      correctAnswer: 1,
      explanation: 'When processing outlasts the visibility timeout, the message becomes visible again and another worker receives it, causing duplicate processing. Setting the visibility timeout longer than the processing time (or extending it with ChangeMessageVisibility) fixes this. Long polling only reduces empty receives, FIFO deduplication only drops duplicate sends within its deduplication window, and retention controls how long unconsumed messages are kept.'
    },
    {
      id: 'trb9',
      question: 'An inbound rule was removed from a production security group last night, breaking access to an application. The team needs to identify which IAM principal made the change and when. Which approach answers this most directly?',
      options: [
        'Search CloudTrail event history for the RevokeSecurityGroupIngress call',
        'Query VPC Flow Logs for rejected traffic reaching the instances',
        'Review AWS Trusted Advisor security checks for the security group',
        'Filter X-Ray traces for calls made against the Amazon EC2 API'
      ],
      correctAnswer: 0,
      explanation: 'CloudTrail records management API calls, including the identity, time, source IP and parameters, and its event history keeps the last 90 days of management events by default. VPC Flow Logs show the effect on traffic but not who changed the rule, Trusted Advisor flags risky configurations without an audit trail, and X-Ray traces application requests, not control-plane changes.'
    },
    {
      id: 'trb10',
      question: 'A developer wants to find the 20 slowest invocations of a Lambda function in the past hour using CloudWatch Logs Insights on the function\'s log group. Which query returns this?',
      options: [
        'fields @timestamp, @message | filter @message like /slow/ | limit 20',
        'stats avg(@duration) by bin(1h) | sort @duration desc | limit 20',
        'filter @type = "REPORT" | sort @duration desc | limit 20',
        'fields @duration | sort @timestamp asc | limit 20'
      ],
      correctAnswer: 2,
      explanation: 'Lambda writes one REPORT line per invocation, and Logs Insights discovers @duration from it, so filtering on REPORT and sorting by @duration descending gives the slowest invocations. Matching the text "slow" depends on the application logging that word, the stats query returns hourly averages rather than individual invocations, and sorting by timestamp returns the oldest lines, not the slowest.'
    },
    {
      id: 'trb11',
      question: 'An application is instrumented with X-Ray. Support engineers want to open the X-Ray console and filter traces to only those for customers on the premium tier, using a filter expression. How should the developer record the customer tier?',
      options: [
        'Add the customer tier as metadata on the segment',
        'Create a sampling rule that matches the customer tier',
        'Write the customer tier as a field in the JSON log line',
        'Add the customer tier as an annotation on the segment'
      ],
      correctAnswer: 3,
      explanation: 'Annotations are indexed key-value pairs that can be used in filter expressions such as annotation.tier = "premium". Metadata can hold any object but is not indexed, so it cannot be searched. Sampling rules only decide which requests are recorded, and a log field helps in Logs Insights but not in X-Ray trace filtering.'
    },
    {
      id: 'trb12',
      question: 'During an incident, engineers see only a small fraction of requests to the /checkout path in X-Ray because of the default sampling behavior. They want every checkout request traced for the next few hours without redeploying or changing code. What should they do?',
      options: [
        'Create a higher-priority X-Ray sampling rule for the /checkout path',
        'Add metadata to each checkout segment and redeploy the service',
        'Increase the X-Ray daemon buffer size on every application host',
        'Enable detailed CloudWatch metrics on the API Gateway stage'
      ],
      correctAnswer: 0,
      explanation: 'X-Ray sampling rules are managed centrally, and the SDKs and collectors poll for them, so a new rule matching /checkout with a 100 percent fixed rate and a higher priority takes effect without a deployment. The default rule records the first request each second plus 5 percent of additional requests. Metadata does not change sampling, the daemon buffer does not decide what is sampled, and detailed stage metrics produce metrics, not traces.'
    },
    {
      id: 'trb13',
      question: 'A Lambda function processes orders and must publish custom metrics such as order value with tenant and Region dimensions. The team wants no extra API calls or added latency in the handler and wants the raw values kept alongside the logs. What should the developer use?',
      options: [
        'Call PutMetricData synchronously in the handler for each order',
        'Create a metric filter that counts log lines containing ORDER',
        'Send the values to an SQS queue processed by a second function',
        'Write the metrics to the logs in CloudWatch embedded metric format'
      ],
      correctAnswer: 3,
      explanation: 'Embedded metric format (EMF) is a JSON log structure that CloudWatch parses asynchronously into metrics with the declared dimensions, so the handler makes no metric API calls and the detailed values remain queryable in the logs. Calling PutMetricData per order adds latency and API cost, a word-count metric filter cannot carry the order value and tenant dimensions cleanly, and an extra queue and function adds needless moving parts.'
    },
    {
      id: 'trb14',
      question: 'A request flows from API Gateway to a Lambda function and then to a container service on ECS. When customers report a failed request, engineers struggle to find the matching log entries across the three log groups. What is the most effective improvement?',
      options: [
        'Write all services to a single shared log stream so entries stay in order',
        'Propagate a correlation ID header and log it as a field in JSON logs',
        'Stream every log group to Amazon OpenSearch Service with subscriptions',
        'Increase the retention period of each log group to one full year'
      ],
      correctAnswer: 1,
      explanation: 'Generating a correlation ID at the edge (or reusing the API Gateway request ID or the X-Ray trace ID), passing it in a header, and writing it into every structured JSON log line lets one Logs Insights query across several log groups return the whole request path. A shared log stream breaks concurrency and still has no join key, OpenSearch adds cost without solving correlation, and longer retention keeps more data without making it easier to link.'
    },
    {
      id: 'trb15',
      question: 'A developer enables active tracing on a Lambda function whose execution role was created by a custom template, but no traces appear in X-Ray. CloudTrail shows AccessDenied errors for xray:PutTraceSegments from the function\'s role. What should the developer do?',
      options: [
        'Install the X-Ray daemon in the function as a Lambda layer',
        'Open UDP port 2000 in the security group of the function',
        'Grant the execution role permission to send trace data to X-Ray',
        'Enable X-Ray tracing on the API Gateway stage instead of Lambda'
      ],
      correctAnswer: 2,
      explanation: 'With active tracing, Lambda runs the X-Ray integration for you, but the execution role still needs xray:PutTraceSegments and xray:PutTelemetryRecords, which the AWSXRayDaemonWriteAccess managed policy provides. Lambda does not need a separately installed daemon, UDP 2000 is the daemon port on hosts you manage and is not a security group issue here, and stage tracing adds API Gateway segments but cannot fix the denied Lambda calls.'
    },
    {
      id: 'trb16',
      question: 'A team is starting a new microservice on Amazon EKS. It wants vendor-neutral instrumentation that can send traces to X-Ray and metrics to CloudWatch today, while keeping the option to export to another observability backend later. Which should the developer use?',
      options: [
        'The AWS X-Ray daemon running as a sidecar container',
        'CloudWatch Logs subscription filters on each log group',
        'Amazon CloudWatch Synthetics canaries for every service',
        'AWS Distro for OpenTelemetry (ADOT) with its collector'
      ],
      correctAnswer: 3,
      explanation: 'ADOT is the AWS-supported distribution of OpenTelemetry, so the same instrumentation and collector can export traces to X-Ray, metrics to CloudWatch, and data to other OpenTelemetry-compatible backends. The X-Ray daemon only relays X-Ray segments, subscription filters stream logs rather than instrument code, and Synthetics canaries test endpoints from the outside instead of instrumenting the service.'
    },
    {
      id: 'trb17',
      question: 'A company wants to be alerted within minutes if the multi-step sign-in and checkout flow of its public website breaks, even at night when there is little real traffic. Which solution meets this requirement?',
      options: [
        'Amazon CloudWatch RUM collecting real user browser sessions',
        'A CloudWatch Synthetics canary that scripts the sign-in and checkout',
        'An Amazon Route 53 health check against the sign-in page URL',
        'An X-Ray sampling rule that records every sign-in request'
      ],
      correctAnswer: 1,
      explanation: 'Synthetics canaries run scripted Node.js or Python browser and API tests on a schedule, so they exercise multi-step flows continuously and can trigger alarms when steps fail, regardless of real traffic. RUM depends on real users being present, Route 53 health checks only test a single endpoint response, and X-Ray sampling records traffic that already exists rather than generating it.'
    },
    {
      id: 'trb18',
      question: 'A team runs dozens of Python Lambda functions. It wants structured JSON logs that include the request ID and a cold start flag, X-Ray tracing of handlers, and custom metrics in embedded metric format, all with minimal custom code. What should the team adopt?',
      options: [
        'Powertools for AWS Lambda using its Logger, Tracer, and Metrics utilities',
        'A set of saved CloudWatch Logs Insights queries shared across the team',
        'The Lambda Insights extension added to every function as a layer',
        'The CloudWatch agent packaged with each function as a custom layer'
      ],
      correctAnswer: 0,
      explanation: 'Powertools for AWS Lambda provides Logger (structured JSON with Lambda context and cold start), Tracer (X-Ray annotations and subcalls), and Metrics (EMF) utilities through decorators and a small amount of code. Saved queries only read logs, Lambda Insights collects system-level metrics such as memory and CPU without application metrics or structured logs, and the CloudWatch agent is designed for servers, not Lambda.'
    },
    {
      id: 'trb19',
      question: 'An application publishes a custom metric for payment failures. Operations needs an alarm that can fire within about 10 seconds of a spike rather than waiting for a one-minute data point. How should the developer configure this?',
      options: [
        'Publish with a storage resolution of 1 second and set a 10-second alarm period',
        'Publish at standard resolution and enable detailed monitoring on the instances',
        'Publish the metric every second at standard resolution with a 60-second period',
        'Use a metric math expression over the standard-resolution metric data'
      ],
      correctAnswer: 0,
      explanation: 'A custom metric published through PutMetricData with StorageResolution set to 1 is a high-resolution metric, and alarms on high-resolution metrics can use periods as short as 10 seconds. Detailed monitoring only changes EC2 built-in metrics to one-minute intervals, standard-resolution metrics are aggregated to one minute however often they are sent, and metric math cannot add resolution that the data does not have.'
    },
    {
      id: 'trb20',
      question: 'A REST API serves a product catalog from a Lambda function that queries DynamoDB. The catalog changes about once an hour, and most requests are identical GET calls. The team wants lower latency and less backend load with the fewest code changes. What should the developer do?',
      options: [
        'Add a DAX cluster and update the function to use the DAX client',
        'Enable provisioned concurrency on the catalog Lambda function',
        'Migrate the REST API to an HTTP API for lower request latency',
        'Enable API Gateway caching on the stage with a suitable TTL'
      ],
      correctAnswer: 3,
      explanation: 'Stage-level caching on a REST API returns cached responses for identical requests without invoking Lambda, and the TTL (default 300 seconds, maximum 3600) can match the hourly change rate with no code changes. DAX still requires Lambda invocations and a client change, provisioned concurrency only removes cold starts, and HTTP APIs do not offer built-in response caching.'
    },
    {
      id: 'trb21',
      question: 'A gaming leaderboard reads the same DynamoDB items thousands of times per second. The team needs microsecond read latency, can accept eventually consistent reads, and wants to keep its existing DynamoDB API calls with minimal code change. Which solution fits best?',
      options: [
        'Amazon ElastiCache with a lazy-loading pattern in the application',
        'DynamoDB global tables replicated to a second AWS Region',
        'DynamoDB Accelerator (DAX) accessed through the DAX client SDK',
        'A higher provisioned read capacity setting on the table'
      ],
      correctAnswer: 2,
      explanation: 'DAX is an in-memory, API-compatible cache for DynamoDB that serves eventually consistent reads in microseconds; the application swaps in the DAX client and keeps the same calls. ElastiCache can be as fast but requires writing caching logic, global tables add Regions for availability rather than cache reads, and more read capacity reduces throttling but keeps single-digit millisecond latency.'
    },
    {
      id: 'trb22',
      question: 'A CPU-bound image-resizing Lambda function is configured with 512 MB of memory and runs slowly. The team wants to find the memory setting that gives the best balance of speed and cost using real invocation data. What should the developer do?',
      options: [
        'Run AWS Lambda Power Tuning to compare several memory settings',
        'Raise the function timeout and keep the current memory setting',
        'Configure provisioned concurrency for the image function',
        'Move the image-processing libraries into a Lambda layer'
      ],
      correctAnswer: 0,
      explanation: 'Lambda allocates CPU in proportion to memory, so a CPU-bound function often runs faster, and sometimes cheaper, with more memory. AWS Lambda Power Tuning, an open-source Step Functions state machine, invokes the function at several memory sizes and charts duration against cost. A longer timeout hides the problem, provisioned concurrency only removes cold starts, and layers change packaging, not performance.'
    },
    {
      id: 'trb23',
      question: 'A latency-sensitive API backed by a Java Lambda function receives a large, predictable traffic spike every weekday at 9 AM. Cold starts during the spike add several seconds to some responses. The team wants initialized execution environments ready before the spike. What should the developer do?',
      options: [
        'Increase the reserved concurrency to match the peak traffic level',
        'Schedule provisioned concurrency to scale up shortly before 9 AM',
        'Increase the function memory to the maximum available setting',
        'Move the initialization code from global scope into the handler'
      ],
      correctAnswer: 1,
      explanation: 'Provisioned concurrency keeps execution environments initialized, and Application Auto Scaling scheduled actions can raise it before a predictable peak and lower it afterward to control cost. Reserved concurrency only guarantees and caps capacity without pre-warming, more memory shortens but does not remove cold starts, and moving initialization into the handler makes every invocation slower. Lambda SnapStart is another way to cut Java cold starts, but it was not among the choices.'
    },
    {
      id: 'trb24',
      question: 'Users around the world upload video files of several gigabytes to a single S3 bucket in us-east-1. Uploads from distant countries are slow, and a dropped connection forces the whole file to be sent again. What should the developer implement?',
      options: [
        'Enable S3 Versioning and Cross-Region Replication on the bucket',
        'Route uploads through an API Gateway endpoint backed by Lambda',
        'Use multipart uploads with S3 Transfer Acceleration enabled',
        'Store the uploads in an S3 Express One Zone directory bucket'
      ],
      correctAnswer: 2,
      explanation: 'Transfer Acceleration routes uploads over the CloudFront edge network to the bucket, speeding long-distance transfers, and multipart upload sends parts in parallel so a failure only retries the affected part. Replication copies objects after they arrive, API Gateway and Lambda payload limits make them unsuitable for multi-gigabyte files, and Express One Zone targets low latency within a single Availability Zone, not global uploads.'
    },
    {
      id: 'trb25',
      question: 'A Lambda function creates a new AWS SDK client and opens a new connection to an Amazon RDS for MySQL database inside the handler on every invocation. Latency is high, and during traffic spikes the database reports too many connections. Which change addresses both problems?',
      options: [
        'Increase the function timeout and the memory allocation',
        'Initialize clients outside the handler and connect through RDS Proxy',
        'Enable provisioned concurrency to keep database connections open',
        'Place the database in the same subnet as the Lambda function'
      ],
      correctAnswer: 1,
      explanation: 'Creating SDK clients and connections in the initialization code lets warm invocations reuse them, cutting per-request latency, and RDS Proxy pools and shares database connections so a burst of concurrent functions does not exhaust the database. More memory or timeout does not reduce connection churn, provisioned concurrency alone still lets each environment hold its own connection, and subnet placement does not limit connection counts.'
    },
    {
      id: 'trb26',
      question: 'Consumers on EC2 call ReceiveMessage on an SQS queue in a tight loop. The queue is often empty, and the SQS bill is dominated by requests that return no messages. What is the most cost-effective change?',
      options: [
        'Set the visibility timeout on the queue to zero seconds',
        'Enable content-based deduplication on the SQS queue',
        'Enable long polling by setting a receive wait time of up to 20 seconds',
        'Configure a delivery delay of several minutes on the queue'
      ],
      correctAnswer: 2,
      explanation: 'Long polling (ReceiveMessageWaitTimeSeconds or WaitTimeSeconds up to 20 seconds) keeps the request open until a message arrives, sharply reducing empty responses and request charges; receiving up to 10 messages per call reduces requests further. A zero visibility timeout causes duplicate processing, content-based deduplication is a FIFO send feature, and a delivery delay postpones messages without reducing empty receives.'
    }
  ]
};
