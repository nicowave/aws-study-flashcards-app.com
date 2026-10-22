// Module 2: Resilience & HA
// AWS Solutions Architect Associate (SAA-C03)

export const module2 = {
  id: 'module2',
  name: 'Resilience & HA',
  description: 'Multi-AZ, DR strategies, decoupling, and failover',
  icon: '🏗️',
  color: '#3fb950',
  gradient: 'linear-gradient(135deg, #3fb950 0%, #3fb950 100%)',
  source: 'SAA-C03 Exam Guide',
  cards: [
    {
      id: 'saa-res-c1',
      front: 'SQS vs SNS vs EventBridge: when do you pick each?',
      back: '• SQS: a queue. One consumer group pulls work at its own pace; durable buffer that absorbs spikes.\n• SNS: pub/sub push. One message fans out to many subscribers (SQS, Lambda, HTTPS, email, SMS).\n• EventBridge: event bus with content-based rules on any event field, SaaS partner sources, AWS service events, schemas, and archive/replay.\nRule: buffer work = SQS; copy to many = SNS (+ SQS per consumer); route by content or integrate SaaS = EventBridge.',
      hint: 'Pull, push, route',
      tags: ['sqs', 'sns', 'eventbridge', 'decoupling'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-res-c2',
      front: 'SQS standard vs FIFO queues',
      back: '• Standard: nearly unlimited throughput, at-least-once delivery, best-effort ordering.\n• FIFO: strict order within a message group ID, exactly-once processing via deduplication ID or content-based deduplication, lower throughput (high-throughput mode raises it).\n• Parallelism in FIFO comes from many message group IDs, e.g. one per customer.\n• A FIFO queue needs a FIFO dead-letter queue.\n• You cannot convert a queue between types; create a new queue.',
      hint: 'Order and dedup per group',
      tags: ['sqs', 'fifo', 'decoupling'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c3',
      front: 'Exam trap: visibility timeout vs delivery delay vs long polling',
      back: '• Visibility timeout (default 30 s, max 12 h): hides a received message while it is processed. Duplicates from slow workers = raise it above processing time.\n• Delivery delay / delay queue (max 15 min): hides NEW messages before first delivery.\n• Long polling (wait time up to 20 s): fewer empty receives and lower cost.\n• maxReceiveCount + DLQ: isolates poison messages.\nMatch the symptom to the setting.',
      hint: 'Duplicates, delays, empty receives',
      tags: ['sqs', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c4',
      front: 'Step Functions Standard vs Express Workflows',
      back: '• Standard: runs up to 1 year, exactly-once workflow execution, full execution history, priced per state transition. Use for long-running, auditable, human-approval flows (callback task tokens).\n• Express: runs up to 5 minutes, very high event rates, at-least-once (async) or at-most-once (sync), priced by executions and duration. Use for high-volume streaming or IoT processing and short API orchestration.',
      hint: 'Long and auditable vs short and high volume',
      tags: ['step-functions', 'orchestration'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c5',
      front: 'API Gateway: REST API vs HTTP API vs WebSocket API',
      back: '• REST API: full feature set: response caching, usage plans and API keys, request validation, AWS WAF, private endpoints, edge-optimized.\n• HTTP API: cheaper and lower latency; JWT/OIDC authorizers, Lambda and HTTP proxies; no caching and no usage plans.\n• WebSocket API: persistent two-way connections so the server can push (chat, live dashboards).\nThrottled requests get HTTP 429.',
      hint: 'Features, price, push',
      tags: ['api-gateway', 'serverless'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c6',
      front: 'Exam trap: Lambda reserved vs provisioned concurrency',
      back: '• Reserved concurrency: carves out capacity for one function AND caps it. Use to protect a downstream database or stop one function starving others. Setting it to 0 stops all invocations.\n• Provisioned concurrency: keeps environments pre-initialized to remove cold starts; it costs money while configured and is not a cap by itself.\n• SnapStart: faster initialization for supported runtimes; not a concurrency control.',
      hint: 'Cap and guarantee vs warm',
      tags: ['lambda', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'saa-res-c7',
      front: 'ALB vs NLB vs GWLB: decision rule',
      back: '• ALB (layer 7): HTTP/HTTPS/gRPC, path and host routing, Lambda and IP targets, auth with Cognito/OIDC, WAF.\n• NLB (layer 4): TCP/UDP/TLS, extreme throughput and low latency, one static IP per AZ (can be Elastic IP), PrivateLink endpoint services.\n• GWLB (layer 3): transparently inserts fleets of third-party virtual appliances (firewalls, IDS) using GENEVE.\nCross-zone balancing: on by default for ALB, off by default for NLB and GWLB.',
      hint: 'URL, static IP, appliances',
      tags: ['elb', 'high-availability'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c8',
      front: 'Auto Scaling policy types: which one when?',
      back: '• Target tracking: keep a metric at a value (CPU 50%, requests per target, queue backlog per instance). Default choice.\n• Step scaling: different adjustments for different alarm breach sizes.\n• Scheduled: known dates and times (Monday 9 am, a product launch).\n• Predictive: forecasts recurring daily or weekly patterns from history and launches capacity ahead.\n• Warm pool: pre-initialized stopped, hibernated, or running instances for apps with long boot times.',
      hint: 'Metric, steps, calendar, forecast',
      tags: ['auto-scaling', 'scalability'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c9',
      front: 'Route 53 routing policies in one line each',
      back: '• Simple: one record, no health checks.\n• Failover: active-passive with health checks.\n• Weighted: split by percentage (canary, blue/green).\n• Latency: lowest-latency Region for the user.\n• Geolocation: by user continent/country/state; add a default record.\n• Geoproximity: by distance, with a bias to shift traffic.\n• Multivalue answer: up to 8 healthy records, client-side spread; not a load balancer.\n• IP-based: by client CIDR.',
      hint: 'Match the requirement word',
      tags: ['route53', 'dns', 'high-availability'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-res-c10',
      front: 'Exam trap: RDS Multi-AZ instance vs Multi-AZ cluster vs read replica',
      back: '• Multi-AZ DB instance: one synchronous standby, automatic failover, standby is NOT readable. HA only.\n• Multi-AZ DB cluster (MySQL, PostgreSQL): writer + two readable standbys in three AZs, faster failover.\n• Read replica: asynchronous, readable, can be cross-Region, promotion is manual. Read scaling and DR, not automatic HA.\n"Reads from the standby" in a Multi-AZ instance answer is wrong.',
      hint: 'HA, HA plus reads, scaling',
      tags: ['rds', 'exam-trap', 'databases'],
      difficulty: 'advanced'
    },
    {
      id: 'saa-res-c11',
      front: 'Aurora replicas vs Aurora Global Database',
      back: '• Aurora storage: six copies across three AZs in the Region.\n• Aurora Replicas: up to 15 in-Region readers on shared storage, reader endpoint, automatic failover target (priority tiers).\n• Aurora Global Database: storage-level replication to secondary Regions, typical lag under 1 second, local reads there, managed switchover/failover. Answer for cross-Region DR with an RPO of seconds and RTO of about a minute.',
      hint: 'In-Region vs cross-Region',
      tags: ['aurora', 'databases', 'disaster-recovery'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c12',
      front: 'DR strategies ordered by cost and RTO',
      back: '1. Backup and restore: cheapest; RPO/RTO in hours.\n2. Pilot light: data replicated and live, app servers off; RTO tens of minutes.\n3. Warm standby: scaled-down full stack running and serving; RTO minutes.\n4. Multi-site active/active: full capacity in multiple Regions; near-zero RPO/RTO, highest cost.\nPick the cheapest strategy that still meets the stated RPO and RTO.',
      hint: 'Cheapest that meets RPO/RTO',
      tags: ['disaster-recovery', 'rpo-rto'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-res-c13',
      front: 'Exam trap: what S3 Cross-Region Replication does NOT do',
      back: '• Requires versioning on source and destination.\n• Replicates only objects written after the rule is enabled: use S3 Batch Replication for existing objects.\n• Does not chain: objects replicated into a bucket are not replicated onward by that bucket\'s rules.\n• Delete markers replicate only if enabled; versioned deletes do not replicate.\n• Need a time guarantee? S3 Replication Time Control: 99.99% within 15 minutes.',
      hint: 'Existing objects need Batch Replication',
      tags: ['s3', 'replication', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'saa-res-c14',
      front: 'AWS Elastic Disaster Recovery vs AWS Backup',
      back: '• Elastic Disaster Recovery: continuous block-level replication of servers (on-premises, other clouds, or EC2) into a low-cost staging area; launches recovery instances in minutes. RPO seconds, RTO minutes.\n• AWS Backup: policy-based, point-in-time backups for many services across accounts and Regions; Vault Lock makes them immutable. RPO = backup frequency, RTO = restore time.\nNeed server failover fast = DRS; need governed, immutable backups = AWS Backup.',
      hint: 'Replication vs point-in-time',
      tags: ['disaster-recovery', 'backup'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-res-c15',
      front: 'How do you make a web tier stateless?',
      back: '• Move session state off the instance: ElastiCache (Valkey or Redis OSS) for sub-millisecond reads, or DynamoDB with TTL for durable sessions.\n• Put user files in S3 or EFS, not on local disk or instance EBS.\n• Bake config into AMIs or read it from Parameter Store at boot.\nSticky sessions keep users on one instance and still lose sessions when it terminates, so they do not make a tier stateless.',
      hint: 'State lives outside the instance',
      tags: ['stateless', 'elasticache', 'dynamodb', 'scalability'],
      difficulty: 'beginner'
    }
  ]
};
