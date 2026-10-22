// Domain 2: Design Resilient Architectures (26% of exam)
// SAA-C03 Exam Content

export const resilientArchitectures = {
  id: 'resilient-architectures',
  name: 'Design Resilient Architectures',
  icon: '🏗️',
  weight: '26%',
  color: '#3fb950',
  description: 'Scalable and loosely coupled architectures, and highly available and fault-tolerant designs',
  questions: [
    // ---------- Task 2.1: Scalable and loosely coupled architectures ----------
    {
      id: 'res1',
      question: 'An e-commerce web tier sends orders directly to a fleet of EC2 instances that process them. During flash sales the processing fleet is overwhelmed and some orders are lost. The company needs every order to be kept until it can be processed, and the processing fleet should scale with demand. What should a solutions architect do?',
      options: [
        'Place an Application Load Balancer in front of the processing fleet and enable cross-zone load balancing',
        'Publish each order to an Amazon SNS topic that pushes it to the processing instances over HTTP',
        'Write orders to an Amazon SQS queue and scale the processing fleet on the queue backlog per instance',
        'Move the processing fleet to a larger instance type and enable detailed CloudWatch monitoring'
      ],
      correctAnswer: 2,
      explanation: 'An SQS queue durably buffers orders so the web tier is decoupled from the processing tier, and scaling the consumers on backlog per instance matches capacity to demand. A load balancer still delivers requests synchronously, so an overwhelmed fleet still drops work. SNS push delivery to HTTP endpoints is not a durable work buffer for busy consumers, and a larger instance only raises the ceiling without decoupling the tiers.'
    },
    {
      id: 'res2',
      question: 'A payments service must process transactions exactly once and strictly in the order they were submitted for each customer account. Transactions for different accounts should be processed in parallel to keep throughput high. Which design meets these requirements?',
      options: [
        'An Amazon SQS FIFO queue that uses the customer account ID as the message group ID',
        'An Amazon SQS standard queue with consumers that sort messages by their timestamp',
        'An Amazon SQS FIFO queue that uses one fixed message group ID for every message',
        'An Amazon SNS standard topic with an Amazon SQS standard queue subscribed to it'
      ],
      correctAnswer: 0,
      explanation: 'SQS FIFO queues preserve order and deduplicate within a message group, and using the account ID as the group ID keeps each account ordered while different groups are consumed in parallel. A single fixed group ID would serialize every message and destroy parallelism. Standard queues and standard SNS topics offer best-effort ordering and at-least-once delivery, so client-side sorting cannot guarantee order or exactly-once processing.'
    },
    {
      id: 'res3',
      question: 'Workers poll an Amazon SQS standard queue, and some messages take up to 4 minutes to process. The team notices that these long-running messages are often processed twice by different workers. The queue uses its default settings. What is the MOST likely fix?',
      options: [
        'Enable long polling by setting the receive message wait time to 20 seconds',
        'Shorten the message retention period so that duplicate copies expire sooner',
        'Configure a dead-letter queue with a maximum receive count of 1 on the queue',
        'Raise the visibility timeout above the longest expected processing time'
      ],
      correctAnswer: 3,
      explanation: 'The default visibility timeout is 30 seconds, so a message still being processed becomes visible again and another worker receives it; setting the timeout above the maximum processing time prevents this. Long polling only reduces empty receives, and retention controls how long unprocessed messages are kept, not redelivery. A DLQ with a receive count of 1 would move healthy, slow messages aside instead of fixing the cause.'
    },
    {
      id: 'res4',
      question: 'A few malformed messages in an Amazon SQS queue fail processing every time. They are retried endlessly, waste consumer capacity, and delay other messages. The team wants these messages set aside automatically after several failed attempts so they can be inspected and later reprocessed. What should the solutions architect configure?',
      options: [
        'Set the message retention period to its maximum so failed messages are kept longer',
        'Attach a dead-letter queue to the source queue with a redrive policy and receive count',
        'Enable server-side encryption so that malformed payloads are rejected on arrival',
        'Switch consumers to short polling so they receive the failing messages less often'
      ],
      correctAnswer: 1,
      explanation: 'A redrive policy moves a message to the dead-letter queue once its receive count exceeds the configured maximum, isolating poison messages for analysis, and a DLQ redrive can return them to the source queue after a fix. Longer retention keeps the failing messages cycling for longer. Encryption does not validate payloads, and short polling changes how receives are sampled, not how failures are handled.'
    },
    {
      id: 'res5',
      question: 'A company runs consumers that poll an Amazon SQS queue in a tight loop. The queue is often empty, and the bill shows a very high number of ReceiveMessage requests that return no messages. How can the company reduce cost with the least change to the application?',
      options: [
        'Convert the standard queue to a FIFO queue to reduce the request volume',
        'Enable long polling by setting the receive message wait time above zero',
        'Lower the visibility timeout so that messages are returned more quickly',
        'Set a delivery delay on the queue so that messages arrive in larger groups'
      ],
      correctAnswer: 1,
      explanation: 'Long polling makes ReceiveMessage wait (up to 20 seconds) until a message arrives, which sharply cuts empty responses and request charges, and it is a queue or request setting rather than a code redesign. Queue type does not change empty-receive behavior. Visibility timeout governs redelivery of in-flight messages, and delivery delay postpones messages without reducing empty polls.'
    },
    {
      id: 'res6',
      question: 'When an order is placed, the inventory, billing, and analytics services must each receive their own copy of the order event. Each service processes at its own pace, and events must not be lost if one service is down for maintenance. Which architecture meets these requirements?',
      options: [
        'A single Amazon SQS queue that all three services poll at the same time',
        'An Amazon SNS topic with each service subscribed through an HTTPS endpoint',
        'An Amazon Kinesis data stream with each service reading a different shard',
        'An Amazon SNS topic with a separate Amazon SQS queue subscribed per service'
      ],
      correctAnswer: 3,
      explanation: 'The SNS-to-SQS fan-out pattern delivers a copy of every event to each queue, and each queue durably buffers events so a service that is down can catch up later. With one shared queue, each message is consumed by only one service. HTTPS subscriptions are retried for a limited time but do not buffer for long outages, and each Kinesis shard holds different records, so a service reading one shard would see only a subset.'
    },
    {
      id: 'res7',
      question: 'A company uses a third-party SaaS help desk that can emit events to AWS. It wants to route those events, along with events from its own AWS services, to different Lambda functions and Step Functions workflows based on fields in the event body, while writing as little custom code as possible. Which service should it use?',
      options: [
        'Amazon EventBridge with a partner event source and content-based rules',
        'An Amazon SNS standard topic with message attributes set by the vendor',
        'Amazon SQS with a Lambda function that inspects and forwards messages',
        'Amazon Kinesis Data Streams with an enhanced fan-out consumer per target'
      ],
      correctAnswer: 0,
      explanation: 'EventBridge natively receives SaaS partner events on a partner event bus and uses rules with event patterns to match on any field in the event body and route to many targets. SNS filtering depends on the publisher setting attributes and has no native SaaS integration. The SQS and Kinesis options both require custom routing code to inspect events and invoke each target.'
    },
    {
      id: 'res8',
      question: 'Changes to an Amazon DynamoDB table must start an AWS Step Functions workflow, but only for items whose status changes to SHIPPED, and each event must first be enriched with customer details from an internal API. The team wants a point-to-point integration without writing and maintaining glue code. What should a solutions architect recommend?',
      options: [
        'An EventBridge rule on the default event bus that matches DynamoDB API calls',
        'A Lambda function with an event source mapping that calls each downstream step',
        'An EventBridge pipe with the table stream as source, a filter, and an enrichment step',
        'An Amazon SNS topic subscribed to the table stream with a filter policy per target'
      ],
      correctAnswer: 2,
      explanation: 'EventBridge Pipes connect a source such as a DynamoDB stream to a target such as Step Functions, with built-in filtering and an optional enrichment step, so no glue code is needed. A rule on the default bus sees AWS API calls via CloudTrail, not item-level stream records. A Lambda function would work but is exactly the glue code the team wants to avoid, and SNS cannot subscribe to a DynamoDB stream.'
    },
    {
      id: 'res9',
      question: 'A subscription app must send each customer a reminder at a specific date and time in the customer\'s own time zone. There will be millions of individual one-time reminders, and today they are triggered by cron jobs on a single EC2 instance. Which solution is the MOST scalable with the least operational overhead?',
      options: [
        'One scheduled EventBridge rule on the default event bus for each reminder',
        'A cron job on one EC2 instance in an Auto Scaling group with a size of one',
        'An Amazon SQS delay queue with each message delayed until the reminder time',
        'Amazon EventBridge Scheduler with a one-time schedule for each reminder'
      ],
      correctAnswer: 3,
      explanation: 'EventBridge Scheduler is serverless, supports one-time and recurring schedules with time zones, and is built to hold very large numbers of schedules that invoke targets directly. Scheduled rules are limited by per-bus rule quotas and suit a small set of recurring patterns. An Auto Scaling group of one still leaves cron management on a server, and SQS delivery delays are capped at 15 minutes.'
    },
    {
      id: 'res10',
      question: 'An order fulfillment process has several steps, including a manual approval that can take up to five days. The company needs each step to run exactly once and wants a full visual execution history for auditing. Which orchestration option should a solutions architect choose?',
      options: [
        'AWS Step Functions Standard Workflows with a callback task token',
        'AWS Step Functions Express Workflows started asynchronously',
        'A chain of Lambda functions that invoke one another asynchronously',
        'AWS Step Functions Express Workflows started synchronously'
      ],
      correctAnswer: 0,
      explanation: 'Standard Workflows can run for up to one year, provide exactly-once workflow execution, keep a full execution history, and can pause on a callback task token until a human approves. Express Workflows are limited to five minutes and offer at-least-once (asynchronous) or at-most-once (synchronous) execution, so neither fits a multi-day process. Chained Lambda functions are capped at 15 minutes each and give no built-in state tracking or audit history.'
    },
    {
      id: 'res11',
      question: 'A company is publishing a public API for partners. It must cache responses to reduce backend load, enforce a separate request quota for each partner by API key, and validate request bodies before they reach the backend. Which solution meets these requirements with the least custom code?',
      options: [
        'An Amazon API Gateway HTTP API with a JWT authorizer and default route throttling',
        'An Amazon API Gateway WebSocket API with a separate route for each operation',
        'An Amazon API Gateway REST API with stage caching and usage plans with API keys',
        'An Application Load Balancer with AWS Lambda functions registered as targets'
      ],
      correctAnswer: 2,
      explanation: 'REST APIs support stage-level response caching, usage plans tied to API keys for per-client quotas and throttling, and request validation. HTTP APIs are cheaper and faster but do not offer API caching or usage plans with API keys. WebSocket APIs are for persistent two-way connections, and an ALB has none of these API management features.'
    },
    {
      id: 'res12',
      question: 'A company is building a serverless live chat feature. The backend must push new messages to connected browsers as soon as they are posted, without clients repeatedly asking for updates. Which solution should a solutions architect recommend?',
      options: [
        'An Amazon API Gateway REST API that the clients poll every few seconds',
        'An Amazon API Gateway WebSocket API with Lambda functions handling the routes',
        'An Amazon API Gateway HTTP API with Lambda proxy integrations per action',
        'An Amazon SQS queue that each browser client reads with long polling'
      ],
      correctAnswer: 1,
      explanation: 'WebSocket APIs keep a persistent, bidirectional connection open, so the backend can push messages to clients through the connection management API. REST and HTTP APIs are request-response, so they require polling, which is exactly what the requirement rules out. Having browsers poll SQS directly is still polling, exposes the queue to clients, and gives each message to only one consumer.'
    },
    {
      id: 'res13',
      question: 'A Lambda function writes to a legacy database that fails when it receives too many concurrent connections. During traffic spikes the function also consumes most of the account\'s concurrency and throttles other functions. Which single configuration both caps this function\'s concurrency and guarantees it a fixed share of the account\'s capacity?',
      options: [
        'Configure reserved concurrency on the function',
        'Configure provisioned concurrency on the function',
        'Increase the memory allocated to the function',
        'Enable Lambda SnapStart on the function'
      ],
      correctAnswer: 0,
      explanation: 'Reserved concurrency sets aside that amount of concurrency for the function and also acts as its maximum, protecting both the database and the other functions in the account. Provisioned concurrency keeps execution environments pre-initialized to reduce cold starts but is not by itself a cap. More memory makes each invocation faster, and SnapStart reduces initialization latency; neither limits concurrency.'
    },
    {
      id: 'res14',
      question: 'Amazon S3 invokes a Lambda function asynchronously for each uploaded file. Some invocations fail even after Lambda\'s automatic retries, and those events are lost. The team needs the failed events, together with error details, kept for reprocessing, using the least code. What should a solutions architect do?',
      options: [
        'Increase the function timeout so that the failing invocations are able to finish',
        'Wrap the handler in error handling that writes each failure to CloudWatch Logs',
        'Change the invocation to synchronous so the caller can retry failures itself',
        'Configure an on-failure destination that sends failed events to an SQS queue'
      ],
      correctAnswer: 3,
      explanation: 'For asynchronous invocations, Lambda retries failed events (twice by default) and can then send the event plus invocation details to an on-failure destination such as an SQS queue, ready for reprocessing with no extra code. A longer timeout helps only if failures are timeouts. Logging errors keeps no replayable event, and S3 event notifications always invoke Lambda asynchronously, so the invocation type cannot simply be changed.'
    },
    {
      id: 'res15',
      question: 'A Lambda function processes messages from an Amazon SQS standard queue in batches of 10. When one message in a batch fails, the whole batch returns to the queue, and the nine successful messages are processed again. Which change MOST efficiently prevents the successful messages from being reprocessed?',
      options: [
        'Set the event source mapping batch size to 1',
        'Enable partial batch responses (ReportBatchItemFailures)',
        'Increase the queue visibility timeout to its maximum',
        'Recreate the queue as FIFO so failures are retried last'
      ],
      correctAnswer: 1,
      explanation: 'With ReportBatchItemFailures enabled, the function returns only the IDs of failed messages, so Lambda deletes the successful ones and only the failures become visible again. A batch size of 1 also avoids reprocessing but greatly reduces throughput and increases invocations. A longer visibility timeout only delays the retry of the whole batch, and FIFO queues retry failed groups in order rather than last.'
    },
    {
      id: 'res16',
      question: 'A company is moving several containerized microservices to AWS. The team has no Kubernetes experience, does not want to patch or scale any servers, and wants an AWS-native orchestrator with the least operational overhead. Which solution should a solutions architect recommend?',
      options: [
        'Amazon EKS with self-managed node groups running on Amazon EC2',
        'Amazon ECS using the EC2 launch type in an Auto Scaling group',
        'Amazon ECS with the tasks running on AWS Fargate capacity',
        'Docker installed on Amazon EC2 instances behind a load balancer'
      ],
      correctAnswer: 2,
      explanation: 'ECS is AWS\'s native container orchestrator, and Fargate runs tasks without any instances to patch, scale, or manage. EKS adds Kubernetes complexity the team does not want, and self-managed nodes require server maintenance. The ECS EC2 launch type and plain Docker on EC2 both leave the team responsible for the underlying instances.'
    },
    {
      id: 'res17',
      question: 'A web application runs on EC2 instances in an Auto Scaling group behind an Application Load Balancer and stores user sessions in instance memory. When the group scales in, users are logged out. The company wants the web tier to scale freely without losing sessions, with sub-millisecond session lookups. What should a solutions architect do?',
      options: [
        'Enable sticky sessions on the Application Load Balancer target group',
        'Store session files on an Amazon EBS volume attached to each instance',
        'Store session data in Amazon ElastiCache and keep the instances stateless',
        'Suspend the scale-in process on the Auto Scaling group during peak hours'
      ],
      correctAnswer: 2,
      explanation: 'Moving session state to an external in-memory store such as ElastiCache makes the instances stateless, so any instance can serve any user and instances can be terminated safely. Sticky sessions keep sessions on one instance, so they are still lost when that instance is terminated. Per-instance EBS volumes have the same problem, and suspending scale-in sacrifices elasticity instead of fixing the design.'
    },
    {
      id: 'res18',
      question: 'An Amazon RDS for MySQL database supports an order-entry application. Analysts run heavy reporting queries that need near-current data, and these queries slow down production writes. The application can send reporting queries to a separate endpoint. Which solution offloads the reporting traffic?',
      options: [
        'Create a read replica and send the reporting queries to its endpoint',
        'Convert to a Multi-AZ DB instance deployment and query the standby',
        'Increase the allocated storage so the instance gets more baseline IOPS',
        'Restore the latest snapshot each night and run reports against the copy'
      ],
      correctAnswer: 0,
      explanation: 'A read replica receives changes asynchronously from the primary and serves read-only queries on its own endpoint, taking reporting load off the writer with near-current data. The standby in a Multi-AZ DB instance deployment cannot serve reads. More IOPS does not separate the workloads, and a nightly restore gives data that is up to a day old.'
    },

    // ---------- Task 2.2: Highly available and fault-tolerant architectures ----------
    {
      id: 'res19',
      question: 'A web application runs on EC2 instances in a single Availability Zone, and its database is already an Amazon RDS Multi-AZ deployment. The business requires the application to stay available if one Availability Zone fails, but it has no requirement to survive a Regional outage. Which solution is the MOST cost-effective?',
      options: [
        'Deploy a duplicate stack in a second Region with Route 53 failover routing',
        'Use a larger instance type with a CloudWatch alarm for EC2 auto recovery',
        'Launch the instances in a cluster placement group in the current zone',
        'Run the instances in an Auto Scaling group across multiple AZs behind an ALB'
      ],
      correctAnswer: 3,
      explanation: 'Spreading an Auto Scaling group across several Availability Zones behind an Application Load Balancer survives the loss of a zone, which is exactly the stated requirement. A second Region adds cost and complexity for a Regional failure the business does not need to survive. Auto recovery and cluster placement groups both keep everything in one zone, so a zone outage still takes the application down.'
    },
    {
      id: 'res20',
      question: 'A company exposes a TCP-based trading service to partners, who allowlist a fixed set of IP addresses in their firewalls. The service must handle millions of requests per second with very low latency and remain available across Availability Zones. Which load balancer configuration meets these requirements?',
      options: [
        'An Application Load Balancer with host-based routing rules',
        'A Network Load Balancer with an Elastic IP address in each AZ',
        'A Gateway Load Balancer with GENEVE encapsulation enabled',
        'A Classic Load Balancer with cross-zone load balancing on'
      ],
      correctAnswer: 1,
      explanation: 'A Network Load Balancer operates at layer 4, handles very high request rates with low latency, and provides one static IP per Availability Zone that can be an Elastic IP, which partners can allowlist. ALB IP addresses change over time and the ALB is a layer 7 HTTP/HTTPS balancer. GWLB is for inline virtual appliances, and the Classic Load Balancer is a previous-generation option without static IPs.'
    },
    {
      id: 'res21',
      question: 'A security team requires all traffic entering a VPC to be inspected by a fleet of third-party firewall virtual appliances that it must keep for licensing reasons. The appliances must scale out and be replaced automatically if they fail, transparently to the applications. Which solution should a solutions architect use?',
      options: [
        'A Gateway Load Balancer with the appliances registered as targets',
        'A Network Load Balancer with the appliances in a TCP target group',
        'An Application Load Balancer with AWS WAF attached to its listener',
        'AWS Network Firewall replacing the third-party appliances entirely'
      ],
      correctAnswer: 0,
      explanation: 'Gateway Load Balancer is designed to deploy, scale, and health-check fleets of third-party virtual appliances, using GENEVE to pass traffic through them transparently via Gateway Load Balancer endpoints. An NLB balances traffic addressed to the load balancer itself and is not built for transparent bump-in-the-wire inspection. AWS WAF protects HTTP applications only, and Network Firewall would replace the appliances the team must keep.'
    },
    {
      id: 'res22',
      question: 'EC2 instances in an Auto Scaling group sit behind an Application Load Balancer. Occasionally the application on an instance hangs and returns HTTP 500 errors. The ALB stops sending it traffic, but the Auto Scaling group never replaces the instance because its EC2 status checks still pass. How should a solutions architect fix this?',
      options: [
        'Enable detailed monitoring for the instances in the Auto Scaling group',
        'Add a step scaling policy that scales out on the HTTP 5XX error metric',
        'Turn on Elastic Load Balancing health checks for the Auto Scaling group',
        'Increase the health check grace period of the group to fifteen minutes'
      ],
      correctAnswer: 2,
      explanation: 'By default an Auto Scaling group uses only EC2 status checks; adding Elastic Load Balancing health checks lets the group mark instances that fail the target group health check as unhealthy and replace them. Detailed monitoring only increases metric frequency. Scaling out on errors adds instances but leaves the broken one running, and a longer grace period delays health checks rather than enabling them.'
    },
    {
      id: 'res23',
      question: 'An application on EC2 takes about 10 minutes to start because it loads a large dataset during initialization. Sudden traffic spikes cause poor performance while new instances in the Auto Scaling group are still initializing. The company wants faster scale-out without paying for a large number of idle running instances. What should a solutions architect do?',
      options: [
        'Raise the minimum capacity of the group high enough to cover peak load',
        'Replace the target tracking policy with a simple scaling policy on CPU',
        'Reduce the default instance warmup value configured on the group',
        'Add a warm pool of pre-initialized instances kept in the Stopped state'
      ],
      correctAnswer: 3,
      explanation: 'A warm pool keeps instances that have already completed initialization in a Stopped (or Hibernated) state, so they can enter service quickly, and stopped instances incur storage cost but no instance-hour charges. A higher minimum capacity works but pays for idle running instances all day. Changing the policy type or warmup value does not make a 10-minute initialization any shorter.'
    },
    {
      id: 'res24',
      question: 'A company runs its website behind an Application Load Balancer in one Region. If the site becomes unhealthy, visitors must automatically be sent to a static maintenance page hosted on Amazon S3, and return to the main site once it recovers. Which Amazon Route 53 configuration meets this requirement?',
      options: [
        'Geolocation routing with a default record that points to the S3 website',
        'Failover routing with a health-checked primary record and an S3 secondary',
        'Latency routing with one record for the ALB and one for the S3 website',
        'Multivalue answer routing that returns both endpoints in each response'
      ],
      correctAnswer: 1,
      explanation: 'Failover routing returns the primary record while its health check passes and automatically switches to the secondary record when it fails, then switches back on recovery: classic active-passive. A geolocation default record only serves users whose location matches no other record. Latency routing would send some users to the maintenance page even when the site is healthy, and multivalue answers return both endpoints to clients, not a clean failover.'
    },
    {
      id: 'res25',
      question: 'For content licensing reasons, a streaming company must serve all users located in Europe from its eu-central-1 deployment and everyone else from us-east-1, regardless of which Region would give a user lower latency. Which Route 53 routing policy should the company use?',
      options: [
        'Latency-based routing with records for both of the Regions',
        'Geolocation routing with a Europe record and a default record',
        'Weighted routing that sends half of the traffic to each Region',
        'Multivalue answer routing with health checks on both Regions'
      ],
      correctAnswer: 1,
      explanation: 'Geolocation routing answers based on where the user is located, which enforces location-based rules such as licensing, and a default record catches users outside the defined locations. Latency routing explicitly optimizes for latency, which the requirement says must not decide the answer. Weighted and multivalue routing distribute traffic without regard to user location.'
    },
    {
      id: 'res26',
      question: 'A company uses Route 53 failover records in a private hosted zone for an internal service that listens only on private IP addresses inside a VPC. Route 53 health checkers cannot reach those private endpoints. How can the company make failover respond to the health of the service?',
      options: [
        'Create an HTTP health check that targets the private IP address directly',
        'Create a calculated health check that combines two HTTP health checks',
        'Use a simple routing record with Evaluate Target Health set to Yes',
        'Create a health check that monitors the state of a CloudWatch alarm'
      ],
      correctAnswer: 3,
      explanation: 'Route 53 health checkers run outside the VPC, so for private resources you publish a CloudWatch metric and alarm (for example from the service or its load balancer) and create a health check based on that alarm\'s state. An HTTP check against a private IP cannot reach it, and a calculated check whose child checks cannot reach it does not help. Simple routing does not support failover or health checks.'
    },
    {
      id: 'res27',
      question: 'A production Amazon RDS for MySQL database runs in a single Availability Zone. It must fail over automatically if its zone fails, without losing committed transactions. The application does not need additional read capacity, and the company wants the lowest-cost option that meets the requirement. Which deployment should it choose?',
      options: [
        'A Multi-AZ DB instance deployment with one synchronous standby',
        'A Multi-AZ DB cluster deployment with two readable standby instances',
        'A cross-Region read replica that can be promoted during an outage',
        'A single-AZ instance with automated backups and point-in-time restore'
      ],
      correctAnswer: 0,
      explanation: 'A Multi-AZ DB instance deployment synchronously replicates to one standby in another zone and fails over automatically, which meets the requirement at the lowest cost. A Multi-AZ DB cluster adds a second standby and readable instances the company does not need. A read replica is asynchronous and must be promoted manually, and a point-in-time restore is neither automatic nor fast.'
    },
    {
      id: 'res28',
      question: 'A company runs Amazon RDS for PostgreSQL and wants to stay on RDS rather than migrate to Aurora. It needs faster automatic failover than a single-standby deployment provides, and it wants the standby instances to serve read traffic in normal operation. Which deployment should a solutions architect recommend?',
      options: [
        'A Multi-AZ DB instance deployment with its standby in a second AZ',
        'Two read replicas in other AZs with a script that promotes one on failure',
        'A Multi-AZ DB cluster deployment with one writer and two reader instances',
        'An Amazon RDS Proxy in front of a single-AZ instance to pool connections'
      ],
      correctAnswer: 2,
      explanation: 'A Multi-AZ DB cluster places a writer and two readable standbys in three Availability Zones, typically fails over faster than a Multi-AZ DB instance deployment, and serves reads through its reader endpoint. A Multi-AZ instance standby cannot serve reads. Scripted replica promotion is manual-style failover with possible data loss, and RDS Proxy improves connection handling but adds no standby.'
    },
    {
      id: 'res29',
      question: 'A company runs Amazon Aurora MySQL in us-east-1. It needs a disaster recovery copy in another Region with an RPO measured in seconds and an RTO of about a minute, and it also wants low-latency reads for users near the second Region. Which solution meets these requirements with the least operational effort?',
      options: [
        'Amazon Aurora Global Database with a secondary cluster in the DR Region',
        'Additional Aurora Replicas placed in other AZs of the primary Region',
        'Hourly AWS Backup snapshot copies of the cluster to the DR Region',
        'A custom binlog replication process managed with a scheduled script'
      ],
      correctAnswer: 0,
      explanation: 'Aurora Global Database replicates at the storage layer to secondary Regions with typical lag under a second, serves local reads there, and supports managed failover to promote the secondary quickly. Aurora Replicas in the same Region do not protect against a Regional outage. Hourly snapshot copies give an RPO of up to an hour and a long restore, and custom binlog replication adds operational effort and lag.'
    },
    {
      id: 'res30',
      question: 'A mobile game has players in North America, Europe, and Asia. Each player must read and write profile data with single-digit millisecond latency in the nearest Region, and the game must keep working if an entire Region fails. Which solution should a solutions architect use?',
      options: [
        'DynamoDB with on-demand capacity and a DAX cluster in each Region',
        'A single DynamoDB table with an Amazon CloudFront distribution in front',
        'DynamoDB Streams with a Lambda function that copies items between Regions',
        'DynamoDB global tables with a replica table in each of the three Regions'
      ],
      correctAnswer: 3,
      explanation: 'DynamoDB global tables are multi-Region and multi-active, so each Region accepts local reads and writes and AWS manages replication between replicas, which also keeps the game running if a Region fails. DAX caches reads for a table in one Region and does not replicate writes across Regions. CloudFront does not cache database writes, and a custom Streams-and-Lambda copier is what global tables already provide as a managed feature.'
    },
    {
      id: 'res31',
      question: 'A company enabled S3 Cross-Region Replication on a bucket that already held five years of objects. New uploads now appear in the destination bucket, but none of the older objects do. The company needs a complete copy in the destination Region. What should a solutions architect do?',
      options: [
        'Enable S3 Replication Time Control on the existing replication rule',
        'Turn on S3 Transfer Acceleration for the source bucket',
        'Run an S3 Batch Replication job for the existing objects',
        'Suspend and then re-enable versioning on the destination bucket'
      ],
      correctAnswer: 2,
      explanation: 'Replication rules apply only to objects written after the rule is enabled; S3 Batch Replication is the feature for replicating existing objects (and retrying failed ones). Replication Time Control adds a 15-minute replication SLA for new objects but does not backfill. Transfer Acceleration speeds up client uploads over long distances, and toggling versioning does not trigger replication.'
    },
    {
      id: 'res32',
      question: 'A company needs disaster recovery for a business application in a second Region. The requirements are an RPO of a few minutes and an RTO under one hour, at the lowest possible cost. Which disaster recovery strategy BEST meets these requirements?',
      options: [
        'Backup and restore',
        'Pilot light',
        'Warm standby',
        'Multi-site active/active'
      ],
      correctAnswer: 1,
      explanation: 'Pilot light keeps core data continuously replicated and running in the DR Region while application servers stay off until needed, giving an RPO of minutes and an RTO in the tens of minutes at low cost. Backup and restore is cheaper but typically has an RPO and RTO of hours. Warm standby and multi-site active/active recover faster but cost more than the requirements justify.'
    },
    {
      id: 'res33',
      question: 'An insurance company must be able to take production traffic in its DR Region within a few minutes of a Regional failure. Its application cannot accept writes in two Regions at once, and the budget does not allow running full production capacity in both Regions. Which disaster recovery strategy should a solutions architect choose?',
      options: [
        'Backup and restore with infrastructure as code templates ready to deploy',
        'Pilot light with only the database replicated and kept running',
        'Multi-site active/active with writes accepted in both of the Regions',
        'Warm standby with a scaled-down but fully functional copy of the stack'
      ],
      correctAnswer: 3,
      explanation: 'Warm standby runs a smaller, fully working copy of the whole stack that can serve traffic immediately and scale up, giving an RTO of minutes without paying for full capacity twice. Backup and restore and pilot light must first launch or deploy application resources, so recovery takes longer. Active/active requires multi-Region writes, which the application cannot support, and costs the most.'
    },
    {
      id: 'res34',
      question: 'A company runs dozens of on-premises VMware virtual machines with a mix of operating systems and applications. It needs disaster recovery into AWS with an RPO of seconds and an RTO of minutes, while paying for minimal compute in AWS until a failover actually happens. Which service should it use?',
      options: [
        'AWS Elastic Disaster Recovery with continuous block-level replication',
        'AWS Backup with daily backups of the virtual machines kept in AWS',
        'AWS Application Migration Service with a single planned cutover',
        'AWS DataSync tasks that copy the server file systems every hour'
      ],
      correctAnswer: 0,
      explanation: 'AWS Elastic Disaster Recovery continuously replicates source servers at the block level into a low-cost staging area and launches full recovery instances only during a drill or failover, delivering an RPO of seconds and an RTO of minutes. Daily backups give an RPO of up to a day. Application Migration Service is for one-time migrations rather than ongoing DR, and DataSync copies files, not bootable servers.'
    },
    {
      id: 'res35',
      question: 'A company has dozens of accounts in AWS Organizations running EBS, RDS, DynamoDB, and EFS resources. It needs centrally managed backup schedules, automatic copies to a second Region, and backups that nobody, including account administrators, can delete before their retention ends. Which solution meets these requirements?',
      options: [
        'Amazon Data Lifecycle Manager policies created in each account and Region',
        'Scheduled Lambda functions that call each service\'s snapshot API directly',
        'AWS Backup policies in Organizations with cross-Region copies and Vault Lock',
        'S3 Cross-Region Replication of exported snapshots with versioning enabled'
      ],
      correctAnswer: 2,
      explanation: 'AWS Backup centrally manages backup plans across many services and accounts through Organizations backup policies, copies recovery points to other Regions, and AWS Backup Vault Lock in compliance mode makes backups immutable until retention ends. Data Lifecycle Manager covers only EBS snapshots and AMIs and is configured per account. Custom Lambda scripts and exported snapshots add operational effort and give no deletion protection guarantee.'
    },
    {
      id: 'res36',
      question: 'Administrators patch EC2 instances in an Auto Scaling group by logging in and applying updates by hand. Over time the instances have drifted apart, and rolling back a bad patch is slow. The company wants every instance to be identical and changes to be repeatable and easy to roll back. What should a solutions architect recommend?',
      options: [
        'Use AWS Systems Manager Run Command to patch the instances in place nightly',
        'Bake patched AMIs and roll them out to the group with an instance refresh',
        'Enable termination protection on the instances once they are fully patched',
        'Take EBS snapshots before each manual patch so instances can be restored'
      ],
      correctAnswer: 1,
      explanation: 'Immutable infrastructure replaces instances instead of changing them: build a new versioned AMI (for example with EC2 Image Builder) and roll it out with an instance refresh, and roll back by redeploying the previous AMI. Run Command automates in-place patching but still mutates running servers. Termination protection blocks the replacement that immutability relies on, and per-instance snapshots make rollback slow and manual.'
    }
  ]
};
