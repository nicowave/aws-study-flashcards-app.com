// Domain 2: Design Resilient Architectures (26%)
export const resilientArchitecturesGuide = {
  id: 'resilient-architectures',
  name: 'Design Resilient Architectures',
  icon: '🏗️',
  color: '#3fb950',
  weight: '26%',
  description: 'Build loosely coupled systems that scale with demand, and highly available, fault-tolerant designs that survive the loss of an instance, an Availability Zone, or a whole Region.',
  sections: [
    {
      id: 'ress1',
      title: 'Decoupling with Queues, Topics, and Events',
      content: [
        { type: 'paragraph', text: 'Loose coupling means components talk through an intermediary instead of calling each other directly, so a slow or failed component does not take the others down and each side can scale on its own. On the exam, any scenario with lost requests during spikes, tightly chained tiers, or one producer feeding several consumers is pointing you at SQS, SNS, or EventBridge.' },
        { type: 'comparison', title: 'SQS vs SNS vs EventBridge', items: [
          { label: 'Amazon SQS', description: 'A pull-based queue. Consumers poll and delete messages at their own pace, so the queue absorbs spikes and holds work while consumers are down. Each message is processed by one consumer. Choose it to buffer work between tiers.' },
          { label: 'Amazon SNS', description: 'Push-based publish/subscribe. One published message is delivered to every subscriber (SQS, Lambda, HTTPS, email, SMS, Data Firehose). Subscription filter policies let a subscriber receive only matching messages. Choose it to fan out one event to many consumers.' },
          { label: 'Amazon EventBridge', description: 'A serverless event bus. Rules match on any field in the event body and route to many targets. It receives AWS service events and SaaS partner events, and supports archive and replay. Choose it for content-based routing and integrations.' }
        ]},
        { type: 'table', headers: ['Feature', 'SQS standard', 'SQS FIFO'], rows: [
          ['Ordering', 'Best effort', 'Strict, within each message group ID'],
          ['Delivery', 'At least once (duplicates possible)', 'Exactly-once processing with deduplication ID or content-based deduplication'],
          ['Throughput', 'Nearly unlimited', 'Lower; high-throughput mode raises it'],
          ['Parallelism', 'Any number of consumers', 'One in-flight batch per message group; use many group IDs to scale'],
          ['Dead-letter queue', 'Standard DLQ', 'Must also be a FIFO queue']
        ]},
        { type: 'keyTerm', term: 'Visibility timeout', definition: 'After a consumer receives a message it stays in the queue but is hidden for the visibility timeout (default 30 seconds, maximum 12 hours). If it is not deleted in time, it becomes visible and another consumer processes it again. Set it longer than the worst-case processing time.' },
        { type: 'keyTerm', term: 'Dead-letter queue (DLQ)', definition: 'A queue that receives messages that failed processing more than the maxReceiveCount set in the source queue redrive policy. It isolates poison messages for debugging; DLQ redrive can move them back after a fix.' },
        { type: 'keyTerm', term: 'Long polling', definition: 'ReceiveMessage waits up to 20 seconds for a message instead of returning immediately. It cuts empty responses and API cost. Short polling is the default (wait time 0).' },
        { type: 'keyTerm', term: 'Delay queue', definition: 'Hides new messages for up to 15 minutes before their first delivery. Useful for short postponements, not for long-term scheduling.' },
        { type: 'awsService', name: 'SNS + SQS fan-out', description: 'Subscribe one SQS queue per consuming service to an SNS topic. Every service gets its own durable copy of each message and can fail, pause, or scale independently. Add filter policies so each queue receives only the messages it needs.' },
        { type: 'awsService', name: 'Amazon EventBridge Pipes', description: 'Point-to-point integration from a source (SQS, Kinesis, DynamoDB Streams, Amazon MSK, Amazon MQ) to a target, with built-in filtering and an optional enrichment step (Lambda, Step Functions, API Gateway, API destination). Replaces custom glue Lambda functions.' },
        { type: 'awsService', name: 'Amazon EventBridge Scheduler', description: 'Serverless scheduler for one-time and recurring (cron or rate) schedules with time-zone support, flexible time windows, and retries. Built to hold very large numbers of schedules that invoke AWS targets directly. Prefer it over cron on EC2 and over scheduled rules for per-user or per-item schedules.' },
        { type: 'examTip', text: 'Map the symptom to the setting: messages processed twice by slow workers = raise the visibility timeout; many empty receives = long polling; a message that always fails = DLQ with maxReceiveCount; strict order per customer = FIFO with the customer ID as the message group ID; several services each need every event = SNS fan-out to one SQS queue each.' }
      ]
    },
    {
      id: 'ress2',
      title: 'Serverless Orchestration, APIs, and Containers',
      content: [
        { type: 'paragraph', text: 'Serverless and container services let you build scalable components without managing servers. The exam tests which flavor of each service fits a constraint such as run duration, cost per request, push vs pull, or how much infrastructure the team is willing to operate.' },
        { type: 'comparison', title: 'Step Functions: Standard vs Express Workflows', items: [
          { label: 'Standard', description: 'Runs up to one year with exactly-once workflow execution and full, visual execution history. Priced per state transition. Use for long-running business processes, human approval steps (callback task tokens), and anything that needs an audit trail.' },
          { label: 'Express', description: 'Runs up to five minutes at very high event rates. Asynchronous Express is at-least-once and synchronous Express is at-most-once. Priced by number of executions and duration. Use for high-volume event processing, streaming transforms, and short API orchestration.' }
        ]},
        { type: 'table', headers: ['API Gateway type', 'Choose it when', 'Key features'], rows: [
          ['REST API', 'You need API management features', 'Response caching, usage plans and API keys, request validation, AWS WAF, private and edge-optimized endpoints'],
          ['HTTP API', 'You want the lowest cost and latency for a simple proxy', 'JWT/OIDC authorizers, Lambda and HTTP proxy integrations, CORS; no caching or usage plans'],
          ['WebSocket API', 'The server must push data to clients', 'Persistent two-way connections; routes by message; backend posts to connections']
        ]},
        { type: 'keyTerm', term: 'API Gateway throttling', definition: 'Account-level and per-stage or per-method rate and burst limits protect backends; usage plans add per-client limits and quotas tied to API keys (REST APIs). Throttled clients receive HTTP 429 Too Many Requests and should retry with backoff.' },
        { type: 'keyTerm', term: 'Reserved concurrency', definition: 'Sets aside a number of concurrent executions for one Lambda function and caps it at that number. Use it to protect a fragile downstream system or to keep one function from starving others.' },
        { type: 'keyTerm', term: 'Provisioned concurrency', definition: 'Keeps a number of Lambda execution environments initialized and ready, removing cold-start latency for latency-sensitive functions. Billed while configured.' },
        { type: 'bulletList', title: 'Lambda invocation models:', items: [
          'Synchronous (API Gateway, ALB, SDK invoke): the caller waits and handles errors and retries.',
          'Asynchronous (S3, SNS, EventBridge): Lambda queues the event and retries twice by default; send failures to an on-failure destination or DLQ. Destinations also support on-success.',
          'Event source mapping (SQS, Kinesis, DynamoDB Streams, Amazon MSK): Lambda polls the source and invokes in batches. Use partial batch responses (ReportBatchItemFailures) so only failed records are retried; for streams, bisect-on-error and a failure destination stop one bad record from blocking a shard.',
          'For SQS sources, set the queue visibility timeout several times longer than the function timeout so in-flight batches are not redelivered.'
        ]},
        { type: 'comparison', title: 'Container platforms', items: [
          { label: 'Amazon ECS', description: 'AWS-native orchestrator with a simple task and service model and deep integration with ALB, IAM roles for tasks, and CloudWatch. Lowest learning curve.' },
          { label: 'Amazon EKS', description: 'Managed Kubernetes control plane. Choose it when the team already uses Kubernetes tooling or needs portability across environments.' },
          { label: 'AWS Fargate', description: 'Serverless compute for ECS and EKS: no instances to patch, scale, or right-size. Choose it whenever the requirement says no server management. Use the EC2 launch type instead for GPUs, special instance types, or maximum cost control at scale.' }
        ]},
        { type: 'examTip', text: 'Duration and history decide Step Functions: more than five minutes, human approval, or audit trail = Standard; huge volume of short executions = Express. For API Gateway, caching or per-client API keys = REST API, cheapest simple proxy = HTTP API, server push = WebSocket API. "No servers to manage" with containers = Fargate.' }
      ]
    },
    {
      id: 'ress3',
      title: 'Scaling Stateless Tiers: Caching, Replicas, and Session State',
      content: [
        { type: 'paragraph', text: 'Horizontal scaling only works when any instance can serve any request. That means keeping state out of the compute tier, taking repeated reads off the database with caches and replicas, and splitting components so each can scale and fail on its own.' },
        { type: 'keyTerm', term: 'Stateless design', definition: 'Instances or containers hold no user-specific data between requests. Sessions go to ElastiCache or DynamoDB, files to S3 or EFS, and configuration to AMIs, Parameter Store, or Secrets Manager. Stateless instances can be added, removed, or replaced at any time.' },
        { type: 'comparison', title: 'Where to keep session state', items: [
          { label: 'Amazon ElastiCache (Valkey, Redis OSS)', description: 'In-memory store with sub-millisecond reads, replication, and Multi-AZ failover. Best for high-traffic session stores and shared counters.' },
          { label: 'Amazon DynamoDB', description: 'Serverless key-value store with single-digit millisecond reads, TTL to expire old sessions, and global tables for multi-Region apps. Best when sessions must be durable or the team wants no cluster to manage.' },
          { label: 'ALB sticky sessions', description: 'Pins a user to one target with a cookie. It hides the problem rather than solving it: sessions are lost when that instance fails or scales in, and load can become uneven.' }
        ]},
        { type: 'table', headers: ['Layer', 'Service', 'What it offloads'], rows: [
          ['Edge', 'Amazon CloudFront', 'Static assets and cacheable responses close to users; shields the origin (S3, ALB, custom)'],
          ['API', 'API Gateway REST API cache', 'Repeated identical API responses per stage'],
          ['Application', 'Amazon ElastiCache', 'Repeated database queries and computed results (lazy loading or write-through, with TTLs)'],
          ['DynamoDB', 'DynamoDB Accelerator (DAX)', 'Microsecond reads for DynamoDB only, with no application logic changes beyond the client'],
          ['Relational database', 'RDS and Aurora read replicas', 'Read-only queries such as reporting; asynchronous, so reads can be slightly stale']
        ]},
        { type: 'comparison', title: 'Monolith vs microservices', items: [
          { label: 'Monolith', description: 'One deployable unit. Simple to start, but one hot or failing component forces the whole application to scale or fail together, and every change redeploys everything.' },
          { label: 'Microservices', description: 'Independently deployed services that own their data and communicate through APIs, queues, or events. Each scales and fails on its own; asynchronous messaging between them contains failures. Costs more operational effort.' }
        ]},
        { type: 'examTip', text: 'Users logged out during scale-in, or an app that cannot scale horizontally, means state is on the instance: move it to ElastiCache or DynamoDB, and treat "enable sticky sessions" as the trap. Read-heavy relational database = read replicas or ElastiCache; DAX only works in front of DynamoDB; CloudFront caches HTTP content, not database queries.' }
      ]
    },
    {
      id: 'ress4',
      title: 'Multi-AZ Compute: Load Balancing and Auto Scaling',
      content: [
        { type: 'paragraph', text: 'An Availability Zone is one or more data centers with independent power and networking. The default resilient pattern for compute is an Auto Scaling group spread across at least two (ideally three) zones behind an Elastic Load Balancer. Multi-AZ protects against zone failure inside a Region; only multi-Region designs protect against a Regional outage, at much higher cost and complexity.' },
        { type: 'table', headers: ['Load balancer', 'Layer and protocols', 'Choose it for'], rows: [
          ['Application Load Balancer', 'Layer 7: HTTP, HTTPS, gRPC, WebSockets', 'Path and host routing, microservices, Lambda and IP targets, user authentication, AWS WAF'],
          ['Network Load Balancer', 'Layer 4: TCP, UDP, TLS', 'Extreme throughput and low latency, static IP or Elastic IP per AZ, PrivateLink endpoint services, non-HTTP protocols'],
          ['Gateway Load Balancer', 'Layer 3: IP packets via GENEVE', 'Transparent insertion and scaling of third-party firewalls, IDS/IPS, and other virtual appliances']
        ]},
        { type: 'keyTerm', term: 'Health checks', definition: 'Each target group checks targets on a protocol, port, and path, and stops routing to unhealthy targets. By default an Auto Scaling group replaces instances only when EC2 status checks fail; enable Elastic Load Balancing health checks on the group so instances failing application health checks are also replaced. The health check grace period gives new instances time to boot first.' },
        { type: 'keyTerm', term: 'Cross-zone load balancing', definition: 'Spreads traffic evenly across all registered targets in all enabled zones. Enabled by default on ALB; disabled by default on NLB and GWLB, where enabling it can incur inter-AZ data transfer charges.' },
        { type: 'comparison', title: 'Auto Scaling policies', items: [
          { label: 'Target tracking', description: 'Keeps a metric near a target value, such as 50% CPU, ALB requests per target, or SQS backlog per instance. The usual first choice.' },
          { label: 'Step scaling', description: 'Applies different adjustments depending on how far a CloudWatch alarm is breached, for fine-grained control.' },
          { label: 'Scheduled scaling', description: 'Changes capacity at specific times for known events, such as business hours or a launch date.' },
          { label: 'Predictive scaling', description: 'Uses machine learning on historical load to forecast recurring daily or weekly patterns and launches capacity before the demand arrives. Pair it with target tracking for unexpected spikes.' },
          { label: 'Warm pools', description: 'Keep pre-initialized instances in a Stopped, Hibernated, or Running state so applications with long initialization can scale out quickly; stopped instances pay only for storage.' }
        ]},
        { type: 'keyTerm', term: 'Immutable infrastructure', definition: 'Never change running servers. Build a new versioned image (EC2 Image Builder or a pipeline), roll it out with an Auto Scaling instance refresh or a blue/green deployment, and roll back by redeploying the previous version. This removes configuration drift and makes changes repeatable.' },
        { type: 'examTip', text: 'Static IPs for allowlisting, TCP/UDP, or millions of requests per second = NLB; URL-based routing = ALB; third-party appliances = GWLB. Instances returning errors but never replaced = enable ELB health checks on the Auto Scaling group. "Survive an AZ failure, most cost-effective" means Multi-AZ, not a second Region.' }
      ]
    },
    {
      id: 'ress5',
      title: 'Highly Available Data: RDS, Aurora, DynamoDB, and S3',
      content: [
        { type: 'paragraph', text: 'Compute is easy to replace; data is not. The exam expects you to tell apart features that provide high availability (automatic failover), read scaling, and cross-Region disaster recovery, because each database option provides a different mix.' },
        { type: 'table', headers: ['Option', 'Replication', 'Readable?', 'Failover', 'Main purpose'], rows: [
          ['RDS Multi-AZ DB instance', 'Synchronous to one standby', 'No', 'Automatic, typically one to two minutes', 'HA within a Region'],
          ['RDS Multi-AZ DB cluster (MySQL, PostgreSQL)', 'Writer plus two standbys in three AZs', 'Yes, via reader endpoint', 'Automatic, typically faster than the instance option', 'HA plus read capacity'],
          ['RDS read replica', 'Asynchronous; same or cross-Region', 'Yes', 'Manual promotion', 'Read scaling and DR'],
          ['Aurora Replicas', 'Shared cluster storage, six copies across three AZs', 'Yes, reader endpoint (up to 15)', 'Automatic, by priority tier', 'HA plus read scaling'],
          ['Aurora Global Database', 'Storage-level to secondary Regions, typically under 1 second', 'Yes, in each secondary Region', 'Managed switchover or failover', 'Cross-Region DR and local reads']
        ]},
        { type: 'awsService', name: 'Amazon DynamoDB global tables', description: 'Multi-Region, multi-active replicas of a table: every replica Region accepts reads and writes and AWS manages replication. Default replication is asynchronous with last-writer-wins conflict resolution; a multi-Region strong consistency mode is also available for workloads that cannot tolerate stale reads. Use for globally distributed apps that must keep working if a Region fails. Point-in-time recovery protects against accidental writes and deletes.' },
        { type: 'awsService', name: 'Amazon S3 replication', description: 'Cross-Region Replication (CRR) and Same-Region Replication (SRR) copy objects asynchronously between buckets, which both need versioning. Only new objects replicate after a rule is enabled; use S3 Batch Replication for existing objects. S3 Replication Time Control adds an SLA of 99.99% of objects replicated within 15 minutes, with replication metrics.' },
        { type: 'bulletList', title: 'Replication facts that decide answers:', items: [
          'A Multi-AZ DB instance standby cannot serve reads; any answer that reads from it is wrong.',
          'Read replicas are asynchronous, so promoting one can lose the most recent writes.',
          'Aurora with no replicas recovers by creating a new instance, which is slower; add at least one Aurora Replica in another AZ for fast failover.',
          'S3 is already designed for very high durability within a Region; replication is for Regional DR, compliance copies, or lower-latency access elsewhere.'
        ]},
        { type: 'examTip', text: 'HA only = RDS Multi-AZ; HA plus readable standbys on RDS = Multi-AZ DB cluster; offload reads = read replicas; relational cross-Region DR with an RPO of seconds = Aurora Global Database; multi-Region writes for key-value data = DynamoDB global tables. "Old objects missing after enabling CRR" = S3 Batch Replication.' }
      ]
    },
    {
      id: 'ress6',
      title: 'Multi-Region Failover and Disaster Recovery',
      content: [
        { type: 'paragraph', text: 'Disaster recovery questions give you a Recovery Point Objective (how much data loss is acceptable) and a Recovery Time Objective (how long the service may be down), plus a budget. Pick the cheapest strategy that still meets both numbers, then pick the services that implement it.' },
        { type: 'keyTerm', term: 'RPO and RTO', definition: 'RPO is the maximum acceptable age of the data you recover, driven by backup frequency or replication lag. RTO is the maximum acceptable time from disruption to restored service, driven by how much infrastructure is already running.' },
        { type: 'table', headers: ['Strategy', 'What runs in the DR Region', 'Typical RPO / RTO', 'Cost'], rows: [
          ['Backup and restore', 'Only backups and snapshots; infrastructure redeployed from code', 'Hours / hours', 'Lowest'],
          ['Pilot light', 'Core data live and replicated; application servers off or not yet launched', 'Minutes / tens of minutes', 'Low'],
          ['Warm standby', 'A scaled-down but fully functional copy serving or ready to serve traffic', 'Seconds to minutes / minutes', 'Medium'],
          ['Multi-site active/active', 'Full production capacity serving traffic in every Region', 'Near zero / near zero', 'Highest']
        ]},
        { type: 'table', headers: ['Route 53 policy', 'Use it to'], rows: [
          ['Failover', 'Send traffic to a primary and switch to a secondary when its health check fails (active-passive)'],
          ['Latency', 'Send users to the Region that gives them the lowest latency'],
          ['Weighted', 'Split traffic by percentage for canary releases, blue/green, or gradual migration'],
          ['Geolocation', 'Route by user location for compliance, licensing, or localization; add a default record'],
          ['Geoproximity', 'Route by distance between users and resources, using a bias to shift traffic'],
          ['Multivalue answer', 'Return up to eight healthy records for simple client-side spreading (not a load balancer)'],
          ['IP-based', 'Route by the client IP range, for example a known ISP or corporate network']
        ]},
        { type: 'keyTerm', term: 'Route 53 health checks', definition: 'Endpoint checks probe a public IP or domain over HTTP, HTTPS, or TCP; calculated checks combine other checks; CloudWatch alarm checks follow an alarm state. Health checkers run outside your VPC, so for private resources use a CloudWatch alarm-based health check.' },
        { type: 'awsService', name: 'AWS Elastic Disaster Recovery', description: 'Continuously replicates on-premises, other-cloud, or EC2 servers at the block level into a low-cost staging area in AWS, and launches full-size recovery instances only for drills or real failovers. Delivers an RPO of seconds and an RTO of minutes without paying for idle production compute.' },
        { type: 'awsService', name: 'AWS Backup', description: 'Centralized, policy-based backups for EC2, EBS, RDS, Aurora, DynamoDB, EFS, FSx, S3, and more, across accounts through AWS Organizations backup policies. Copies recovery points across Regions and accounts, and AWS Backup Vault Lock (compliance mode) makes backups immutable so no one can delete them before retention ends, which protects against ransomware.' },
        { type: 'numberedList', title: 'Choosing a DR design:', items: [
          'Read the RPO and RTO and eliminate strategies that cannot meet them.',
          'Of the remaining strategies, prefer the least expensive one.',
          'Match the data layer: snapshots for backup and restore, continuous replication (Aurora Global Database, DynamoDB global tables, S3 CRR, Elastic Disaster Recovery) for everything faster.',
          'Automate failover with Route 53 health checks and failover routing, and keep infrastructure as code ready to deploy or scale the DR Region.',
          'Test the plan regularly with drills; an untested DR plan is an assumption.'
        ]},
        { type: 'examTip', text: 'RTO in hours and lowest cost = backup and restore; tens of minutes = pilot light; minutes with traffic ready = warm standby; near-zero downtime = active/active. On-premises servers needing RPO in seconds = AWS Elastic Disaster Recovery; cross-account, immutable backups = AWS Backup with Vault Lock. "Regardless of latency, by country" = geolocation routing.' }
      ]
    }
  ]
};
