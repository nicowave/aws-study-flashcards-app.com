// Module 4: Troubleshooting & Optimization
// AWS Certified Developer – Associate (DVA-C02)

export const module4 = {
  id: 'module4',
  name: 'Troubleshooting & Optimization',
  description: 'CloudWatch, X-Ray, logging, metrics, caching and performance tuning',
  icon: '🔧',
  color: '#d29922',
  gradient: 'linear-gradient(135deg, #d29922 0%, #d29922 100%)',
  source: 'DVA-C02 Exam Guide',
  cards: [
    {
      id: 'dva-trb-c1',
      front: 'API Gateway status codes: what does 400, 403, 429, 502 and 504 usually mean?',
      back: '• 400: malformed request or failed request validation\n• 403: denied by IAM, resource policy, WAF or a bad API key; on REST APIs "Missing Authentication Token" often means a wrong path or undeployed method\n• 429: throttling or usage plan quota exceeded\n• 502: bad response from the integration, e.g. a Lambda proxy result without statusCode and string body\n• 504: integration timeout (REST default 29 s)',
      hint: '4xx = request, 5xx = backend',
      tags: ['api-gateway', 'troubleshooting', 'http'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c2',
      front: 'X-Ray annotations vs metadata: which one can you search?',
      back: 'Annotations: indexed key-value pairs (string, number, boolean). Use them in filter expressions and groups, e.g. annotation.tier = "premium".\n\nMetadata: any value or object, not indexed. Use it for debug detail you only read inside a trace.\n\nTrap: if the question says "filter" or "search traces by", the answer is annotations.',
      hint: 'Indexed vs not indexed',
      tags: ['x-ray', 'tracing', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c3',
      front: 'X-Ray building blocks and sampling',
      back: '• Trace: one request end to end, linked by the trace ID header (X-Amzn-Trace-Id)\n• Segment: work done by one service\n• Subsegment: a downstream call or code block inside a segment\n• Default sampling: first request each second plus 5% of the rest\n• Sampling rules are set centrally in X-Ray; SDKs and collectors pick them up with no redeploy',
      hint: 'Trace > segment > subsegment',
      tags: ['x-ray', 'tracing', 'sampling'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-trb-c4',
      front: 'Reading Lambda failures from the logs: timeout, out of memory, throttle, init error',
      back: '• Timeout: "Task timed out after N seconds"; check slow dependencies, then raise the timeout\n• Out of memory: REPORT shows Max Memory Used = Memory Size, runtime killed; add memory\n• Throttle: Throttles metric, 429 TooManyRequestsException for sync callers; check concurrency\n• Init error: failure before the handler runs, e.g. import error or wrong handler name',
      hint: 'Read the REPORT line',
      tags: ['lambda', 'troubleshooting', 'cloudwatch'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c5',
      front: 'Why are SQS messages processed more than once, and how do you stop it?',
      back: 'If processing takes longer than the visibility timeout, the message reappears and another consumer gets it.\n\nFix: set the visibility timeout above the processing time, or extend it with ChangeMessageVisibility. For a Lambda event source, AWS recommends a queue visibility timeout of at least 6x the function timeout.\n\nTrap: FIFO deduplication does not prevent redelivery after a timeout. Still make consumers idempotent.',
      hint: 'Visibility timeout vs processing time',
      tags: ['sqs', 'troubleshooting', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c6',
      front: 'DynamoDB ProvisionedThroughputExceededException while the table has spare capacity: what is going on?',
      back: 'A hot partition: one key value gets more traffic than one partition can serve.\n\n• Find it with CloudWatch Contributor Insights for DynamoDB\n• Fix with a higher-cardinality key or write sharding (key + suffix)\n• Cache hot reads with DAX\n• On-demand mode helps with spiky totals but not a single hot key\n• SDKs retry throttled calls with exponential backoff',
      hint: 'Key design, not table size',
      tags: ['dynamodb', 'throttling', 'performance'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-trb-c7',
      front: 'CloudTrail vs CloudWatch vs AWS Config vs X-Ray: which answers which question?',
      back: '• CloudTrail: who called which API, when, from where\n• CloudWatch: how the system is behaving (metrics, logs, alarms)\n• Config: what a resource\'s configuration looked like over time and whether it complies\n• X-Ray: where time and errors occur inside a request across services',
      hint: 'Who / how / what / where',
      tags: ['cloudtrail', 'cloudwatch', 'config', 'x-ray'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-trb-c8',
      front: 'Custom metrics: embedded metric format vs PutMetricData vs metric filters',
      back: '• EMF: write a JSON log line with an _aws block; CloudWatch extracts the metric asynchronously. Best for Lambda: no API call, no added latency\n• PutMetricData: direct API call; supports dimensions and high resolution; batch it and keep it off the hot path\n• Metric filter: turns matching log patterns into a metric after the fact, no code change',
      hint: 'Log it, call it, or match it',
      tags: ['cloudwatch', 'metrics', 'instrumentation'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c9',
      front: 'Metric dimensions and high-resolution metrics: what should you know?',
      back: '• Each unique combination of dimensions is a separate metric, so you query exactly the combination you published\n• Standard resolution: 1 minute\n• High resolution: StorageResolution = 1, data down to 1 second; alarms can use periods as short as 10 seconds\n• High-cardinality values such as user IDs belong in logs, not dimensions',
      hint: 'StorageResolution = 1',
      tags: ['cloudwatch', 'metrics', 'alarms'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-trb-c10',
      front: 'Why is EC2 memory utilization missing from CloudWatch?',
      back: 'The hypervisor cannot see inside the guest OS, so default EC2 metrics cover CPU, network, disk I/O and status checks only.\n\nInstall the CloudWatch agent to publish memory, disk space and custom application logs; its configuration can be stored in SSM Parameter Store.\n\nTrap: detailed monitoring only changes the interval from 5 minutes to 1 minute. It does not add memory metrics.',
      hint: 'Agent, not detailed monitoring',
      tags: ['ec2', 'cloudwatch', 'exam-trap'],
      difficulty: 'beginner'
    },
    {
      id: 'dva-trb-c11',
      front: 'Synthetics vs RUM vs Application Signals vs Lambda Insights',
      back: '• Synthetics canaries: scripted tests on a schedule; catch breakage with no real traffic\n• RUM: real user browser performance and errors\n• Application Signals: APM with service maps, latency, error rates and SLOs, built on OpenTelemetry instrumentation\n• Lambda Insights: system metrics per function such as memory and CPU',
      hint: 'Robot, human, service, function',
      tags: ['cloudwatch', 'observability', 'monitoring'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c12',
      front: 'Which cache fits: API Gateway cache, CloudFront, ElastiCache or DAX?',
      back: '• API Gateway cache: REST API stage responses, TTL default 300 s, no code change\n• CloudFront: edge cache for static and dynamic content close to global users\n• ElastiCache (Valkey, Redis OSS, Memcached): general-purpose app cache, you write lazy loading or write-through logic\n• DAX: DynamoDB-only, API-compatible, microsecond reads',
      hint: 'Where does the hit happen?',
      tags: ['caching', 'performance', 'optimization'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c13',
      front: 'Reserved concurrency vs provisioned concurrency vs SnapStart',
      back: '• Reserved: guarantees and caps a function\'s concurrency; no pre-warming, no extra charge\n• Provisioned: pre-initialized environments, no cold starts, billed while configured; scale it on a schedule with Application Auto Scaling\n• SnapStart: restores a snapshot of the initialized environment (Java, Python, .NET)\n\nTrap: reserved concurrency does not fix cold starts.',
      hint: 'Guarantee vs pre-warm vs snapshot',
      tags: ['lambda', 'concurrency', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'dva-trb-c14',
      front: 'Tuning Lambda for speed and cost',
      back: '• CPU scales with memory (up to 10,240 MB), so CPU-bound code can get faster and cheaper with more memory\n• AWS Lambda Power Tuning measures duration and cost across memory sizes\n• Create SDK clients and connections outside the handler so warm invocations reuse them\n• Use RDS Proxy to pool database connections\n• Keep packages small to shorten init',
      hint: 'Memory buys CPU',
      tags: ['lambda', 'performance', 'optimization'],
      difficulty: 'intermediate'
    },
    {
      id: 'dva-trb-c15',
      front: 'Quick throughput wins for SQS and S3',
      back: 'SQS\n• Long polling (wait time up to 20 s) cuts empty receives and cost\n• Receive up to 10 messages per call; tune Lambda batch size and batching window\n• Report partial batch failures so only failed messages retry\n\nS3\n• Multipart upload for large objects (required above 5 GB)\n• Transfer Acceleration for long-distance uploads\n• Byte-range GETs for parallel downloads',
      hint: 'Wait longer, send in parts',
      tags: ['sqs', 's3', 'optimization'],
      difficulty: 'intermediate'
    }
  ]
};
