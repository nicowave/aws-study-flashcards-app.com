// Study guide: Troubleshooting and Optimization (18%)
export const troubleshootingGuide = {
  id: 'troubleshooting',
  name: 'Troubleshooting and Optimization',
  icon: '🔧',
  color: '#d29922',
  weight: '18%',
  description: 'Root cause analysis, instrumentation for observability, and application performance optimization.',
  sections: [
    {
      id: 'trbs1',
      title: 'Root Cause Analysis with CloudWatch',
      content: [
        { type: 'paragraph', text: 'Most troubleshooting questions start with a symptom (errors, slowness, duplicates) and ask which signal will reveal the cause. CloudWatch holds three of the signals you will reach for first: logs, metrics and alarms. Learn to read them before you reach for a fix.' },
        { type: 'awsService', name: 'Amazon CloudWatch Logs', description: 'Central store for application and service logs, organized into log groups and log streams. Lambda writes to a log group per function by default. Metric filters turn log patterns into metrics, subscription filters stream logs to Lambda, Data Firehose or OpenSearch, and Live Tail shows events as they arrive.' },
        { type: 'keyTerm', term: 'CloudWatch Logs Insights', definition: 'An interactive query language over one or more log groups. Core commands are fields, filter, stats, sort, limit and parse. For Lambda it discovers fields from the REPORT line such as @duration, @maxMemoryUsed and @initDuration, so "filter @type = \"REPORT\" | sort @duration desc | limit 20" lists the slowest invocations.' },
        { type: 'keyTerm', term: 'CloudWatch alarm', definition: 'Watches a single metric or a metric math expression and moves between OK, ALARM and INSUFFICIENT_DATA. Actions can notify SNS, scale an Auto Scaling group or run an EC2 action. Composite alarms combine several alarms to reduce noise, and anomaly detection alarms compare a metric to a learned band.' },
        { type: 'table', headers: ['Lambda symptom', 'Where it shows', 'Usual fix'], rows: [
          ['Timeout', '"Task timed out after N seconds" in the log; Duration near the timeout', 'Find the slow dependency (X-Ray), then raise the timeout or make the work asynchronous'],
          ['Out of memory', 'REPORT shows Max Memory Used equal to Memory Size, then the runtime is killed', 'Increase memory or stream data instead of loading it whole'],
          ['Throttling', 'Throttles metric rises; synchronous callers get 429 TooManyRequestsException', 'Reserved concurrency for critical functions, request a higher account limit, smooth traffic with SQS'],
          ['Init failure', 'Error before the handler runs, e.g. Runtime.ImportModuleError or a handler-not-found error', 'Fix packaging, dependencies or the handler setting'],
          ['Stream consumer lag', 'IteratorAge rises for Kinesis or DynamoDB Streams sources', 'Raise batch size or parallelization factor, fix slow or failing records']
        ]},
        { type: 'bulletList', title: 'Lambda metrics worth knowing', items: [
          'Invocations, Errors and Throttles for health',
          'Duration for latency and cost, ConcurrentExecutions for capacity',
          'IteratorAge for stream sources, AsyncEventAge for asynchronous invocations waiting to run',
          'Lambda Insights adds system metrics such as memory and CPU per function'
        ]},
        { type: 'examTip', text: 'When a question gives you a log line, match it to the failure type: "Task timed out" is a timeout, Max Memory Used equal to Memory Size is out of memory, and a 429 or Throttles metric is concurrency. The fix follows from the type, so do not pick "increase memory" for a timeout caused by a slow downstream call.' }
      ]
    },
    {
      id: 'trbs2',
      title: 'Reading Error Signals Across Services',
      content: [
        { type: 'paragraph', text: 'The exam often hands you an HTTP status code, an exception name or a duplicate-processing complaint and expects you to name the cause. Memorize what each signal usually means and which service produced it.' },
        { type: 'table', headers: ['API Gateway code', 'Usual meaning', 'First thing to check'], rows: [
          ['400 Bad Request', 'Malformed request or failed request validation', 'Request body, parameters and the request validator or model'],
          ['403 Forbidden', 'Denied by IAM auth, a resource policy, AWS WAF or an invalid API key; on REST APIs "Missing Authentication Token" usually means the path or method does not exist in the deployed stage', 'URL path, deployment to the stage, policies and keys'],
          ['429 Too Many Requests', 'Stage, method or usage plan throttling, or a usage plan quota was hit', 'Usage plan rate, burst and quota; client retries with backoff'],
          ['502 Bad Gateway', 'The integration returned something API Gateway could not use, e.g. a Lambda proxy response without statusCode and a string body, or an unhandled function error', 'Function return format and function errors'],
          ['504 Gateway Timeout', 'The integration did not respond within the integration timeout (29 seconds by default for REST APIs)', 'Slow backend; move long work to an asynchronous pattern']
        ]},
        { type: 'keyTerm', term: 'ProvisionedThroughputExceededException', definition: 'DynamoDB rejected reads or writes beyond the capacity a table, index or partition can serve. If table-level consumption is well below provisioned capacity, the cause is a hot partition key. Use Contributor Insights for DynamoDB to find the hot keys, then redesign the key or shard writes. AWS SDKs retry these errors with exponential backoff automatically.' },
        { type: 'keyTerm', term: 'SQS visibility timeout', definition: 'The time a received message stays hidden from other consumers. If processing takes longer, the message reappears and is processed again. Set it above the processing time or extend it with ChangeMessageVisibility. For Lambda event source mappings, AWS recommends at least six times the function timeout. Use a dead-letter queue with maxReceiveCount for messages that keep failing.' },
        { type: 'comparison', title: 'Which tool answers which question', items: [
          { label: 'AWS CloudTrail', description: 'Who called which API, when and from where. Event history keeps 90 days of management events; data events such as S3 object access need a trail or event data store.' },
          { label: 'Amazon CloudWatch', description: 'How the system is behaving: metrics, logs and alarms for performance and errors.' },
          { label: 'AWS Config', description: 'What a resource looked like over time and whether it complied with rules; links to the CloudTrail event that changed it.' },
          { label: 'AWS X-Ray', description: 'Where latency and errors occur inside a single request as it crosses services.' }
        ]},
        { type: 'examTip', text: '"Who deleted or changed this resource?" is always CloudTrail. "Why are messages processed twice?" is almost always the SQS visibility timeout. "Throttled but the table has spare capacity" is a hot partition, not a capacity problem.' }
      ]
    },
    {
      id: 'trbs3',
      title: 'Distributed Tracing with X-Ray and OpenTelemetry',
      content: [
        { type: 'paragraph', text: 'Tracing follows one request across API Gateway, Lambda, containers and AWS SDK calls so you can see which hop is slow or failing. X-Ray stores and visualizes the traces; you send data with the X-Ray SDKs or with OpenTelemetry through AWS Distro for OpenTelemetry (ADOT).' },
        { type: 'keyTerm', term: 'Trace, segment and subsegment', definition: 'A trace is one request end to end, tied together by the trace ID in the X-Amzn-Trace-Id header. Each service records a segment for its work. Subsegments break a segment into downstream calls (DynamoDB, HTTP APIs, SQL) or code blocks. Calls to services that are not instrumented appear as inferred nodes in the trace map.' },
        { type: 'comparison', title: 'Annotations vs metadata', items: [
          { label: 'Annotations', description: 'Indexed key-value pairs with string, number or boolean values. Use them in filter expressions and X-Ray groups, e.g. annotation.customer_tier = "premium".' },
          { label: 'Metadata', description: 'Any value or object, not indexed. Use it for debugging context that you read inside a trace but never search on.' }
        ]},
        { type: 'keyTerm', term: 'Sampling rules', definition: 'Decide which requests are recorded, to control cost and overhead. The default rule records the first request each second plus 5 percent of additional requests. Custom rules match on service name, host, HTTP method, URL path and more, with a priority, a reservoir and a fixed rate. Rules live in X-Ray and are fetched by the SDKs and collectors, so changing them needs no redeploy.' },
        { type: 'bulletList', title: 'Turning tracing on', items: [
          'Lambda: enable active tracing; the execution role needs xray:PutTraceSegments and xray:PutTelemetryRecords (AWSXRayDaemonWriteAccess)',
          'API Gateway REST APIs: enable X-Ray tracing on the stage',
          'EC2 and on-premises: run the X-Ray daemon or the ADOT or CloudWatch agent collector; the daemon listens on UDP port 2000',
          'ECS and EKS: run the daemon or ADOT collector as a sidecar or DaemonSet and grant the task or pod role X-Ray write permissions',
          'Instrument the AWS SDK and HTTP clients so downstream calls appear as subsegments'
        ]},
        { type: 'awsService', name: 'AWS Distro for OpenTelemetry (ADOT)', description: 'AWS-supported distribution of the OpenTelemetry SDKs and collector. One vendor-neutral instrumentation can export traces to X-Ray, metrics to CloudWatch and data to other OpenTelemetry backends. AWS steers new instrumentation toward OpenTelemetry, while the X-Ray SDK concepts still appear on the exam.' },
        { type: 'awsService', name: 'CloudWatch Application Signals', description: 'Application performance monitoring built on OpenTelemetry instrumentation. It discovers services, shows latency, error and fault rates per operation, and lets you define service level objectives. It extends the earlier ServiceLens idea of joining traces, metrics and logs in one service map.' },
        { type: 'examTip', text: 'If a question says engineers must "filter" or "search" traces by a business value, the answer is an annotation, not metadata. If it says "trace more requests without redeploying", the answer is a sampling rule. If traces are missing from Lambda, check active tracing and the execution role permissions.' }
      ]
    },
    {
      id: 'trbs4',
      title: 'Instrumenting Code for Observability',
      content: [
        { type: 'paragraph', text: 'Good instrumentation makes the next incident short. The exam expects you to know how to emit logs that can be queried, metrics that can be alarmed on, and tests that catch breakage before customers do.' },
        { type: 'keyTerm', term: 'Structured logging', definition: 'Log one JSON object per event with consistent fields such as level, message, request ID and correlation ID. Logs Insights discovers JSON fields automatically, so you can filter and aggregate on them. Lambda can emit its own logs as JSON and filter by log level through its logging configuration.' },
        { type: 'keyTerm', term: 'Correlation ID', definition: 'An identifier created at the entry point (or taken from the API Gateway request ID or X-Ray trace ID), passed downstream in a header or message attribute, and written into every log line. One Logs Insights query across several log groups can then reconstruct the full request.' },
        { type: 'table', headers: ['Way to publish a metric', 'How it works', 'Best for'], rows: [
          ['Embedded metric format (EMF)', 'A JSON log line with an _aws block; CloudWatch extracts the metric asynchronously', 'Lambda and containers: no API call, no added latency, raw values kept in logs'],
          ['PutMetricData', 'Direct API call with namespace, dimensions, unit and optional StorageResolution = 1', 'Servers and batch jobs; batch values to reduce calls'],
          ['Metric filter', 'Pattern match on existing log events that increments or extracts a value', 'Adding a metric with no code change'],
          ['CloudWatch agent', 'Agent on EC2 or on-premises that publishes OS metrics and ships log files', 'Memory and disk space metrics that EC2 does not provide by default']
        ]},
        { type: 'bulletList', title: 'Custom metric rules', items: [
          'Each unique combination of dimensions is its own metric; you retrieve exactly the combination you published',
          'Standard resolution is 1 minute; high resolution (StorageResolution = 1) goes down to 1 second, and alarms on it can use periods as short as 10 seconds',
          'Keep high-cardinality values such as user IDs in logs, not in dimensions',
          'Default EC2 metrics have no memory or disk space data; detailed monitoring only shortens the interval from 5 minutes to 1 minute'
        ]},
        { type: 'awsService', name: 'Powertools for AWS Lambda', description: 'Open-source toolkit for Python, TypeScript, Java and .NET. Logger gives structured JSON logs with Lambda context and cold start flags, Tracer wraps X-Ray, and Metrics writes EMF. Other utilities cover idempotency, batch processing and parameters.' },
        { type: 'comparison', title: 'Testing from the outside', items: [
          { label: 'CloudWatch Synthetics canaries', description: 'Scripted Node.js or Python tests that run on a schedule against APIs and multi-step browser flows. They catch breakage even when no users are active.' },
          { label: 'CloudWatch RUM', description: 'Collects performance and error data from real user browser sessions. Only reports what real users actually do.' },
          { label: 'Route 53 health checks', description: 'Checks one endpoint for a healthy response, mainly to drive DNS failover. Cannot script a multi-step flow.' }
        ]},
        { type: 'examTip', text: 'For Lambda custom metrics with "no additional latency" or "no API calls", choose embedded metric format, often through Powertools Metrics. For EC2 memory metrics, choose the CloudWatch agent, never detailed monitoring. For "detect a broken user journey before customers do", choose a Synthetics canary.' }
      ]
    },
    {
      id: 'trbs5',
      title: 'Optimizing Performance and Cost',
      content: [
        { type: 'paragraph', text: 'Optimization questions name a goal (lower latency, higher throughput, lower cost) and a constraint (fewest code changes, least operational overhead). Pick the feature closest to the bottleneck the scenario describes.' },
        { type: 'table', headers: ['Cache', 'Where it sits', 'Choose it when'], rows: [
          ['API Gateway cache', 'REST API stage; TTL default 300 seconds, maximum 3600', 'Identical GET responses, no code changes; not available on HTTP APIs'],
          ['Amazon CloudFront', 'Edge locations worldwide', 'Global users, static assets and cacheable API responses'],
          ['Amazon ElastiCache', 'In-memory store (Valkey, Redis OSS, Memcached) beside the app', 'Any data source, session state; you code lazy loading or write-through with TTLs'],
          ['DynamoDB Accelerator (DAX)', 'In front of DynamoDB, API compatible', 'Microsecond, eventually consistent DynamoDB reads with minimal code change']
        ]},
        { type: 'comparison', title: 'Lambda concurrency and start-up controls', items: [
          { label: 'Reserved concurrency', description: 'Guarantees capacity for one function and caps it. No pre-warming and no extra charge.' },
          { label: 'Provisioned concurrency', description: 'Keeps environments initialized so requests skip cold starts. Billed while configured; use Application Auto Scaling schedules for predictable peaks.' },
          { label: 'SnapStart', description: 'Restores a snapshot of the initialized environment to cut start-up time for Java, Python and .NET functions.' }
        ]},
        { type: 'bulletList', title: 'Lambda tuning', items: [
          'CPU scales with memory (up to 10,240 MB), so CPU-bound code can become faster and even cheaper with more memory',
          'AWS Lambda Power Tuning runs the function at several memory sizes and charts duration against cost',
          'Create SDK clients and database connections outside the handler so warm invocations reuse them',
          'Use RDS Proxy to pool connections when many concurrent functions talk to a relational database'
        ]},
        { type: 'bulletList', title: 'Data and messaging throughput', items: [
          'SQS: long polling (wait time up to 20 seconds) cuts empty receives; receive up to 10 messages per call; tune Lambda batch size and batching window and report partial batch failures',
          'DynamoDB: on-demand for unpredictable traffic, provisioned with auto scaling for steady traffic; high-cardinality partition keys; Query instead of Scan',
          'S3: multipart upload for large objects (required above 5 GB), Transfer Acceleration for distant clients, byte-range GETs for parallel downloads, spread keys across prefixes for very high request rates',
          'Auto Scaling: target tracking on a CloudWatch metric such as CPU, request count per target, or a custom SQS backlog-per-instance metric'
        ]},
        { type: 'examTip', text: 'Match the constraint: "no code changes" points to API Gateway caching or CloudFront, "DynamoDB microseconds" points to DAX, "predictable cold-start spike" points to scheduled provisioned concurrency, and "too many database connections from Lambda" points to RDS Proxy plus connection reuse.' }
      ]
    }
  ]
};
