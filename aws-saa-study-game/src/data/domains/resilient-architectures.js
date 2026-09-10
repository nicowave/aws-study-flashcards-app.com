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
  {
    id: 'ra1',
    question: 'A company runs a web application on a single EC2 instance in one Availability Zone. After an AZ outage caused downtime, the company wants the MOST resilient architecture within a single Region with minimal application changes. What should a solutions architect recommend?',
    options: ['Move the application to a larger EC2 instance type with EBS-optimized storage', 'Create an AMI of the instance and manually launch a replacement if the AZ fails', 'Run the application in an Auto Scaling group spanning multiple Availability Zones behind an Application Load Balancer', 'Deploy a second copy of the application in another AWS Region with a separate DNS name'],
    correctAnswer: 2,
    explanation: 'An Auto Scaling group spread across multiple AZs behind an ALB survives the loss of any single AZ, and unhealthy instances are automatically replaced. A larger instance type improves performance but is still a single point of failure in one AZ. Manual AMI recovery means significant downtime, and a second Region adds cost and complexity beyond what a single-Region availability requirement needs.'
  },
  {
    id: 'ra2',
    question: 'A web application stores user session data in memory on each EC2 instance. When Auto Scaling terminates an instance, users on that instance are logged out. How can the architecture be made stateless so that scaling events do not affect users?',
    options: ['Store session data in Amazon ElastiCache or a DynamoDB table that all instances share', 'Enable sticky sessions on the load balancer so each user always reaches the same instance', 'Increase the Auto Scaling cooldown period so instances are terminated less frequently', 'Take EBS snapshots of each instance so session data can be restored after termination'],
    correctAnswer: 0,
    explanation: 'Moving session state to a shared store such as ElastiCache or DynamoDB makes the web tier stateless, so any instance can serve any request and terminations lose no data. Sticky sessions still lose sessions when the pinned instance is terminated. Cooldown tuning and EBS snapshots do not remove the fundamental problem of state living on individual instances.'
  },
  {
    id: 'ra3',
    question: 'A company hosts several microservices behind a single endpoint and needs to route requests to different target groups based on the URL path, such as /api and /images. Which load balancer should be used?',
    options: ['Network Load Balancer, because it operates at layer 4 and offers the lowest latency', 'Application Load Balancer, because it supports path-based and host-based routing at layer 7', 'Gateway Load Balancer, because it can distribute traffic to multiple service endpoints', 'Classic Load Balancer, because it supports both layer 4 and layer 7 listeners'],
    correctAnswer: 1,
    explanation: 'The Application Load Balancer works at layer 7 (HTTP/HTTPS) and can evaluate the request path or host header to route to different target groups. A Network Load Balancer operates at layer 4 and cannot inspect URL paths. Gateway Load Balancer is for deploying third-party network appliances, and Classic Load Balancer does not support path-based routing.'
  },
  {
    id: 'ra4',
    question: 'A company runs a TCP-based gaming service that must handle millions of requests per second with ultra-low latency, and clients must connect to fixed IP addresses that can be whitelisted in corporate firewalls. Which load balancer meets these requirements?',
    options: ['Application Load Balancer with AWS Global Accelerator in front of it', 'Gateway Load Balancer with an Elastic IP address in each Availability Zone', 'Application Load Balancer with an alias record pointing to its DNS name', 'Network Load Balancer with an Elastic IP address in each Availability Zone'],
    correctAnswer: 3,
    explanation: 'The Network Load Balancer operates at layer 4, handles millions of requests per second with very low latency, and supports assigning a static Elastic IP per AZ, which satisfies firewall whitelisting. An ALB only exposes a DNS name with changing IPs, so it fails the static IP requirement even with an alias record. Gateway Load Balancer is designed for inline security appliances, not general TCP application traffic.'
  },
  {
    id: 'ra5',
    question: 'A security team must inspect all inbound traffic to an application using a fleet of third-party virtual firewall appliances, and the solution must scale the appliances transparently. Which AWS service is designed for this?',
    options: ['Network Load Balancer with the firewall appliances registered as IP targets', 'AWS WAF attached to an Application Load Balancer in front of the appliances', 'Gateway Load Balancer, which distributes traffic to the appliance fleet using the GENEVE protocol', 'Amazon CloudFront with Lambda@Edge functions performing traffic inspection'],
    correctAnswer: 2,
    explanation: 'Gateway Load Balancer is purpose-built to deploy, scale, and load balance fleets of third-party virtual appliances such as firewalls and IDS/IPS, passing traffic transparently using the GENEVE protocol. An NLB can distribute traffic but does not provide the transparent bump-in-the-wire insertion model appliances need. AWS WAF is a managed rule engine, not a way to run third-party appliances, and Lambda@Edge cannot host firewall software.'
  },
  {
    id: 'ra6',
    question: 'An Application Load Balancer distributes traffic to instances in two Availability Zones, but one AZ has eight instances and the other has two. Users report inconsistent response times because the two-instance AZ receives half of the traffic. What should the solutions architect do?',
    options: ['Create a separate load balancer for each Availability Zone and use Route 53 weighted records', 'Enable cross-zone load balancing so traffic is distributed evenly across all registered instances', 'Enable sticky sessions so users are pinned to the less loaded Availability Zone', 'Change the load balancer to a Network Load Balancer, which balances across zones by default'],
    correctAnswer: 1,
    explanation: 'With cross-zone load balancing enabled, each load balancer node distributes traffic across all registered targets in all enabled AZs, so each of the ten instances receives roughly equal load. Without it, each AZ node splits traffic evenly per zone regardless of instance count. Separate load balancers add complexity, sticky sessions do not fix uneven distribution, and NLB actually has cross-zone load balancing disabled by default.'
  },
  {
    id: 'ra7',
    question: 'A solutions architect must configure an Auto Scaling group so average CPU utilization across the fleet stays near 50% as traffic changes, with the LEAST operational overhead. Which scaling policy should be used?',
    options: ['A target tracking scaling policy with a 50% average CPU utilization target', 'A step scaling policy with CloudWatch alarms at 40%, 60%, and 80% CPU utilization', 'A scheduled scaling action that adjusts desired capacity at peak hours each day', 'A simple scaling policy that adds one instance whenever CPU exceeds 50%'],
    correctAnswer: 0,
    explanation: 'Target tracking works like a thermostat: you set the metric target and Auto Scaling creates and manages the CloudWatch alarms and capacity calculations automatically, which is the least operational overhead. Step and simple scaling require you to design and maintain the alarm thresholds and adjustment sizes yourself. Scheduled scaling only handles predictable time-based patterns and does not react to actual load.'
  },
  {
    id: 'ra8',
    question: 'An application experiences a predictable traffic surge every weekday at 9:00 AM when employees log in. Dynamic scaling reacts too slowly, and users see errors for the first several minutes. What is the MOST appropriate solution?',
    options: ['Configure a step scaling policy with a more aggressive CPU threshold', 'Reduce the health check grace period so new instances enter service faster', 'Increase the maximum size of the Auto Scaling group to allow more instances', 'Create a scheduled scaling action that increases desired capacity shortly before 9:00 AM'],
    correctAnswer: 3,
    explanation: 'Scheduled scaling is designed for predictable load patterns: capacity is increased proactively before the known surge, so instances are already in service when users arrive. Step scaling is still reactive and only triggers after load rises, leaving a launch-time gap. Raising the maximum size does not change when scaling starts, and the health check grace period does not speed up instance boot and application startup.'
  },
  {
    id: 'ra9',
    question: 'EC2 instances in an Auto Scaling group behind an Application Load Balancer sometimes hang at the application level while the operating system keeps running. The ALB marks them unhealthy, but the Auto Scaling group never replaces them. What should the solutions architect change?',
    options: ['Enable detailed monitoring on the instances so CloudWatch detects the failures sooner', 'Configure the Auto Scaling group to use ELB health checks in addition to EC2 status checks', 'Decrease the ALB health check interval and unhealthy threshold for faster detection', 'Add a lifecycle hook that runs a script to verify application health at launch time'],
    correctAnswer: 1,
    explanation: 'By default an Auto Scaling group uses only EC2 status checks, which pass as long as the instance and hypervisor are healthy, so an application-level hang goes unnoticed. Enabling ELB health checks makes the group treat load balancer failures as unhealthy and replace those instances. Faster ALB detection alone only removes instances from rotation without replacing them, and detailed monitoring or launch-time hooks do not address runtime application hangs.'
  },
  {
    id: 'ra10',
    question: 'An Auto Scaling group is configured with a minimum of 2, desired capacity of 4, and maximum of 8. One instance fails its health check during normal operation. What does Amazon EC2 Auto Scaling do?',
    options: ['It reduces the desired capacity to 3 and continues running with the remaining instances', 'It waits for the cooldown period to expire and then scales to the maximum of 8 instances', 'It terminates the unhealthy instance and launches a replacement to maintain the desired capacity of 4', 'It sends a notification to the administrator, who must manually replace the instance'],
    correctAnswer: 2,
    explanation: 'Maintaining the desired capacity is a core function of Auto Scaling: unhealthy instances are terminated and automatically replaced with new ones, keeping the group at 4 instances. Health-based replacement does not lower the desired capacity or require manual intervention. The maximum value of 8 only caps how far scaling policies can grow the group and is not involved in replacing a single failed instance.'
  },
  {
    id: 'ra11',
    question: 'A company hosts its primary web application in us-east-1 and maintains a static "service unavailable" page in an S3 bucket. If the primary application becomes unreachable, users should automatically see the static page. Which Route 53 configuration achieves this?',
    options: ['A weighted routing policy sending 90% of traffic to the application and 10% to the S3 site', 'A latency routing policy with records for both the application endpoint and the S3 website', 'A geolocation routing policy with a default record pointing to the S3 static website', 'A failover routing policy with a health check on the primary record and the S3 website as the secondary'],
    correctAnswer: 3,
    explanation: 'Failover routing is designed for active-passive setups: Route 53 monitors a health check on the primary record and returns the secondary record, here the S3 static website, only when the primary is unhealthy. Weighted routing would send a portion of traffic to the error page even when the application is healthy. Latency and geolocation policies choose records based on performance or user location, not on endpoint health.'
  },
  {
    id: 'ra12',
    question: 'A company deploys identical application stacks in us-east-1 and eu-west-1. Users worldwide should be routed to whichever Region gives them the fastest response, and an unhealthy Region should be removed from DNS responses. Which Route 53 setup meets this?',
    options: ['Latency-based routing records for both Regions, each associated with a health check', 'A failover routing policy with us-east-1 as primary and eu-west-1 as secondary', 'Geolocation routing that maps each continent to its legally required Region', 'A simple routing record containing the IP addresses of both Regional endpoints'],
    correctAnswer: 0,
    explanation: 'Latency-based routing answers each query with the Region that historically gives that user the lowest latency, and attaching health checks removes an unhealthy Region from consideration. Failover routing sends all users to one primary Region regardless of their location. Geolocation routes by user location rather than measured latency, and a simple record cannot use health checks, so it could return an unhealthy endpoint.'
  },
  {
    id: 'ra13',
    question: 'A company wants its zone apex domain, example.com, to resolve to an Application Load Balancer. CNAME records are not allowed at the zone apex. What should the solutions architect configure in Route 53?',
    options: ['An A record containing the current IP addresses of the load balancer nodes', 'An alias A record pointing to the Application Load Balancer\'s DNS name', 'An NS record that delegates the apex domain to the load balancer\'s DNS servers', 'A TXT record redirecting example.com to the www subdomain of the site'],
    correctAnswer: 1,
    explanation: 'Route 53 alias records are an AWS-specific extension that lets a zone apex record point to AWS resources such as an ALB, and Route 53 resolves the target\'s changing IPs automatically at no query charge. Hardcoding the ALB\'s IP addresses in a standard A record breaks when AWS changes them. NS records delegate authority rather than resolve to a resource, and TXT records cannot redirect traffic.'
  },
  {
    id: 'ra14',
    question: 'For compliance reasons, a company must ensure that users in Germany are always served from its eu-central-1 stack, regardless of which endpoint would give them the lowest latency. Which Route 53 routing policy should be used?',
    options: ['Latency routing, because European users will normally resolve to eu-central-1 anyway', 'Weighted routing with the eu-central-1 record given the highest weight value', 'Geolocation routing with a rule mapping Germany to the eu-central-1 endpoint', 'Failover routing with eu-central-1 configured as the primary record'],
    correctAnswer: 2,
    explanation: 'Geolocation routing answers queries based on the location the query originates from, so a rule for Germany deterministically returns the eu-central-1 endpoint, satisfying the compliance requirement. Latency routing offers no guarantee, because the lowest-latency endpoint for a German user could occasionally be another Region. Weighted routing distributes traffic probabilistically, and failover routing selects records based on health, not user location.'
  },
  {
    id: 'ra15',
    question: 'A production application uses an Amazon RDS for MySQL Multi-AZ deployment. What happens when the primary DB instance fails?',
    options: ['RDS automatically fails over to the synchronous standby in another AZ, and the DNS endpoint points to the new primary within minutes', 'RDS promotes the most up-to-date read replica, which may lose recently committed transactions', 'The database is unavailable until RDS restores the latest automated backup to a new instance', 'The application must be reconfigured with the standby instance\'s separate connection endpoint'],
    correctAnswer: 0,
    explanation: 'Multi-AZ RDS maintains a synchronously replicated standby in a different AZ, and on failure RDS automatically fails over and updates the existing DNS endpoint, typically completing in about one to two minutes with no data loss. Read replica promotion is a separate, asynchronous mechanism that can lose recent transactions. Restoring from backup would mean far longer downtime, and applications keep using the same endpoint, so no reconfiguration is needed.'
  },
  {
    id: 'ra16',
    question: 'A reporting team runs heavy analytical queries against a production RDS PostgreSQL database, degrading performance for the main application. The reports can tolerate slightly stale data. What is the MOST appropriate solution?',
    options: ['Convert the database to a Multi-AZ deployment and run reports against the standby instance', 'Scale the primary DB instance to a larger instance class to absorb the reporting load', 'Schedule the reports to restore a recent snapshot into a temporary database each night', 'Create a read replica of the database and direct the reporting queries to the replica'],
    correctAnswer: 3,
    explanation: 'A read replica receives asynchronous replication from the primary and serves read-only queries, isolating the reporting workload while tolerating small replication lag. The standby in an RDS Multi-AZ deployment cannot serve read traffic; it exists purely for failover. Scaling the primary is more expensive and still mixes both workloads, and nightly snapshot restores add operational overhead while providing much staler data.'
  },
  {
    id: 'ra17',
    question: 'A solutions architect is explaining the durability of Amazon Aurora\'s storage layer. How does Aurora protect data at the storage level within a Region?',
    options: ['It writes data to a single EBS volume that is snapshotted to S3 every five minutes', 'It synchronously mirrors the data volume to one standby instance in another Availability Zone', 'It stores six copies of the data across three Availability Zones and can tolerate the loss of an entire AZ', 'It streams every transaction to a read replica cluster in a second AWS Region'],
    correctAnswer: 2,
    explanation: 'Aurora\'s distributed storage layer keeps six copies of data spread across three AZs, remaining writable after losing two copies and readable after losing three, so an entire AZ failure does not cause data loss. This replication happens at the storage layer independent of any DB instances. Single-volume EBS or one-standby mirroring describes other architectures, and cross-Region streaming is a feature of Aurora Global Database, not the baseline storage design.'
  },
  {
    id: 'ra18',
    question: 'A global financial application uses Amazon Aurora and requires a cross-Region disaster recovery capability with a recovery point objective of about 1 second and cross-Region failover in under a few minutes. Which solution meets these requirements?',
    options: ['Copy automated Aurora snapshots to the DR Region every hour and restore on failure', 'Use Aurora Global Database with a secondary cluster in the DR Region', 'Create a cross-Region Aurora MySQL read replica using binlog replication', 'Run AWS Database Migration Service continuously between clusters in two Regions'],
    correctAnswer: 1,
    explanation: 'Aurora Global Database uses dedicated storage-level replication with typical cross-Region lag under one second, and a secondary Region can be promoted to full read-write capability in minutes, meeting both the RPO and RTO. Hourly snapshot copies imply an RPO of up to an hour. Binlog-based cross-Region replicas and DMS replication add higher and less predictable lag and require more operational effort to fail over.'
  },
  {
    id: 'ra19',
    question: 'A database administrator accidentally deleted rows from a production RDS MySQL database at 2:30 PM. Automated backups are enabled with a 7-day retention period. How can the data be recovered to its state just before the mistake?',
    options: ['Fail over the Multi-AZ deployment, because the standby still holds the pre-deletion data', 'Restore last night\'s automated snapshot in place over the existing database instance', 'Query the read replica, because asynchronous replication will not yet have applied the delete', 'Use point-in-time recovery to restore a new DB instance to approximately 2:29 PM'],
    correctAnswer: 3,
    explanation: 'With automated backups enabled, RDS retains transaction logs that allow point-in-time recovery to any second within the retention window, restoring to a new instance just before the deletion. A Multi-AZ standby replicates synchronously, so the deletion already exists there. RDS restores always create a new instance rather than overwriting in place, and last night\'s snapshot alone would lose the whole day\'s changes; a read replica applies changes within seconds, so the delete would already be replicated.'
  },
  {
    id: 'ra20',
    question: 'A gaming company needs its DynamoDB-backed application to serve users in North America, Europe, and Asia with local low-latency reads and writes in each Region, and to keep working if an entire Region becomes unavailable. What should the solutions architect use?',
    options: ['DynamoDB global tables replicating the table across the three Regions in an active-active configuration', 'DynamoDB Accelerator (DAX) clusters deployed in each of the three Regions', 'A single DynamoDB table with on-demand capacity fronted by Amazon CloudFront', 'Cross-Region DynamoDB Streams processed by Lambda functions that copy items to backup tables'],
    correctAnswer: 0,
    explanation: 'Global tables provide fully managed multi-Region, multi-active replication, so each Region accepts local reads and writes and the application can shift to surviving Regions during an outage. DAX only accelerates reads against a table in its own Region and does not replicate data. CloudFront does not make DynamoDB writes local or multi-Region, and a self-built Streams-and-Lambda pipeline recreates global tables with far more operational burden.'
  },
  {
    id: 'ra21',
    question: 'A compliance team requires that a DynamoDB table be recoverable to any point within the last 35 days to protect against accidental writes or deletes, with minimal operational effort. What should be enabled?',
    options: ['DynamoDB Streams with a Lambda function that archives every item change to S3', 'On-demand backups triggered by a scheduled EventBridge rule every hour', 'Point-in-time recovery (PITR) on the table', 'A daily export of the table to Amazon S3 using the DynamoDB export feature'],
    correctAnswer: 2,
    explanation: 'PITR continuously backs up the table and allows restoring to any second in the preceding 35 days with a single setting and no infrastructure to manage. Hourly on-demand backups leave up to an hour of unrecoverable changes and require scheduling machinery. Streams-based archiving and daily S3 exports both demand custom restore tooling and provide coarser or more complex recovery than the managed PITR feature.'
  },
  {
    id: 'ra22',
    question: 'A payment processing system requires that messages for the same account be processed in the exact order they were sent and that no message is processed more than once. Which Amazon SQS configuration meets these requirements?',
    options: ['A standard queue with a dead-letter queue configured for failed messages', 'A FIFO queue using the account ID as the message group ID with content-based deduplication', 'A standard queue with long polling enabled and a visibility timeout of 12 hours', 'Two standard queues with an SNS topic fanning out messages to both for redundancy'],
    correctAnswer: 1,
    explanation: 'FIFO queues guarantee ordering within a message group and provide exactly-once processing through deduplication, and using the account ID as the group ID preserves per-account order while allowing parallelism across accounts. Standard queues provide only best-effort ordering and at-least-once delivery, so duplicates and reordering are possible regardless of DLQ, polling, or visibility timeout settings. Fan-out to two queues makes duplication worse rather than preventing it.'
  },
  {
    id: 'ra23',
    question: 'Consumers of an SQS standard queue take about 3 minutes to process each message, but operators notice many messages are being processed twice by different consumers. The queue uses the default visibility timeout of 30 seconds. What is the MOST likely fix?',
    options: ['Increase the visibility timeout to a value longer than the processing time, such as 5 minutes', 'Switch the consumers from long polling to short polling to receive messages faster', 'Enable content-based deduplication on the standard queue to suppress duplicates', 'Add a dead-letter queue so duplicated messages are moved out of the main queue'],
    correctAnswer: 0,
    explanation: 'When processing takes longer than the visibility timeout, the message becomes visible again before the first consumer finishes and deletes it, so another consumer receives it. Raising the timeout beyond the processing time prevents this overlap. Polling mode does not affect visibility behavior, content-based deduplication is a FIFO-queue feature not available on standard queues, and a dead-letter queue handles repeatedly failing messages, not in-flight duplicates.'
  },
  {
    id: 'ra24',
    question: 'An order processing application occasionally receives malformed messages that cause the consumer to fail repeatedly. These "poison" messages are retried forever, blocking useful work and flooding logs. What should the solutions architect configure?',
    options: ['A shorter message retention period so malformed messages expire from the queue quickly', 'A Lambda function that scans the queue and deletes any messages that fail schema validation', 'Delivery delay on the queue so failing messages are retried less frequently by consumers', 'A dead-letter queue with a maxReceiveCount so messages that fail repeatedly are moved aside for analysis'],
    correctAnswer: 3,
    explanation: 'A dead-letter queue with a redrive policy moves any message aside after it has been received maxReceiveCount times without being deleted, unblocking the main queue while preserving the bad messages for debugging. Shortening retention would also expire valid messages during backlogs. Pre-scanning the queue with Lambda is unreliable because receiving messages hides them from real consumers, and delivery delay only postpones first delivery rather than stopping endless retries.'
  },
  {
    id: 'ra25',
    question: 'A ticketing website experiences sudden traffic spikes that overwhelm its backend order-processing database, causing dropped orders. Orders do not need to be confirmed in real time. How should the architecture be changed to handle spikes without losing orders?',
    options: ['Enable RDS Multi-AZ so the standby instance can absorb the additional write traffic', 'Place an SQS queue between the web tier and the processing tier so orders are buffered and processed at a sustainable rate', 'Use larger EC2 instances for the processing tier so each instance handles more concurrent orders', 'Add a CloudFront distribution in front of the website to cache the order submission responses'],
    correctAnswer: 1,
    explanation: 'An SQS queue decouples order intake from processing: the web tier enqueues orders instantly during spikes, and the processing tier consumes them at the database\'s sustainable pace, so no orders are dropped. Multi-AZ provides failover, not extra write capacity, since the standby serves no traffic. Larger instances still have a fixed ceiling that a spike can exceed, and CloudFront cannot cache unique POST transactions like order submissions.'
  },
  {
    id: 'ra26',
    question: 'When an image is uploaded to S3, three independent backend systems must each act on the event: one generates thumbnails, one runs content moderation, and one updates a search index. Each system must process every event independently and reliably. What is the recommended pattern?',
    options: ['Configure the S3 event notification to invoke each of the three services directly in sequence', 'Send the events to a single SQS queue that all three systems poll for messages', 'Publish the event to an SNS topic that fans out to three SQS queues, one subscribed by each system', 'Store the events in a DynamoDB table that each system scans on a fixed schedule'],
    correctAnswer: 2,
    explanation: 'The SNS-to-SQS fan-out pattern delivers a copy of every event to each subscribed queue, so the three systems consume independently, retry at their own pace, and buffer during downtime. A single shared SQS queue would not work because each message is consumed by only one of the competing pollers. Direct sequential invocation couples the systems and loses events if one fails, and periodic DynamoDB scans add latency and polling complexity.'
  },
  {
    id: 'ra27',
    question: 'A company\'s monolithic application emits many types of business events. Different downstream services should receive only the event types relevant to them, with routing rules based on the event content, and new consumers should be added without changing the producers. Which service BEST fits this requirement?',
    options: ['Amazon SQS FIFO queues with one queue per event type and producer-side routing logic', 'AWS Step Functions with a Choice state that branches on the event type field', 'Amazon Kinesis Data Streams with each consumer filtering the full stream client-side', 'Amazon EventBridge with rules that match event content and route to the appropriate targets'],
    correctAnswer: 3,
    explanation: 'EventBridge is an event bus where rules match on event content and route matching events to many kinds of targets, so new consumers are added by writing new rules without touching producers. Producer-side routing to per-type SQS queues couples producers to every consumer. Step Functions orchestrates a defined workflow rather than serving as a pub/sub bus, and Kinesis forces every consumer to read and filter the whole stream itself.'
  },
  {
    id: 'ra28',
    question: 'A multi-step order fulfillment process calls several Lambda functions and external services in sequence. The company needs automatic retries with backoff for each step, error-specific fallback paths, and a visual record of exactly where each order is in the process. Which service should orchestrate the workflow?',
    options: ['AWS Step Functions, defining the process as a state machine with per-step retry and catch configuration', 'Amazon SQS queues chained between Lambda functions, with each function invoking the next stage', 'Amazon EventBridge Scheduler running each step of the workflow at fixed time intervals', 'A single long-running Lambda function that calls each step and implements retries in code'],
    correctAnswer: 0,
    explanation: 'Step Functions state machines provide declarative per-state Retry and Catch policies with exponential backoff, and the console shows each execution\'s progress visually, exactly matching the requirements. Chained queues scatter retry logic and give no unified view of an order\'s status. A scheduler runs steps by time rather than by workflow state, and a single Lambda orchestrator is limited to a 15-minute runtime and buries error handling in custom code.'
  },
  {
    id: 'ra29',
    question: 'A Lambda function is invoked asynchronously by S3 event notifications. Occasionally the function exhausts its automatic retries and events are lost silently. The team must capture the details of every failed invocation for later reprocessing, with minimal code changes. What should they configure?',
    options: ['Synchronous invocation from S3 so errors are returned directly to the event source', 'An on-failure destination (or dead-letter queue) on the function to capture events whose retries are exhausted', 'A CloudWatch Logs metric filter that pages the on-call engineer when errors are logged', 'Reserved concurrency on the function so throttling can no longer cause any failures'],
    correctAnswer: 1,
    explanation: 'For asynchronous invocations, Lambda retries failures twice and can then send the failed event to an on-failure destination such as SQS, SNS, or EventBridge (or a DLQ), preserving the event for reprocessing without application changes. S3 event notifications invoke Lambda asynchronously and cannot be made synchronous. A metric filter alerts a human but does not retain the event payload, and reserved concurrency addresses throttling, not function errors.'
  },
  {
    id: 'ra30',
    question: 'An auditor asks how Amazon S3 Standard protects objects against data loss and accidental overwrites. Which statement is accurate?',
    options: ['S3 stores each object in one Availability Zone and relies on customers to replicate data themselves', 'S3 offers 99.99% durability, so critical objects should always be copied to Amazon Glacier as well', 'S3 is designed for 99.999999999% (11 nines) durability by redundantly storing objects across multiple AZs, and versioning can preserve prior versions against overwrites and deletes', 'S3 automatically retains every previous version of an object indefinitely on all buckets by default'],
    correctAnswer: 2,
    explanation: 'S3 Standard redundantly stores data across a minimum of three Availability Zones and is designed for eleven nines of durability, and enabling versioning keeps prior object versions so overwrites and deletions are recoverable. Only the One Zone storage classes store data in a single AZ. The durability figure is far higher than 99.99% (that is the availability design for S3 Standard), and versioning is off by default and must be explicitly enabled per bucket.'
  },
  {
    id: 'ra31',
    question: 'A company must replicate objects from an S3 bucket in us-east-1 to a bucket in eu-west-1 for disaster recovery. When configuring Cross-Region Replication, which prerequisite must be met?',
    options: ['Versioning must be enabled on both the source and destination buckets', 'Both buckets must use the same bucket policy and the same KMS encryption key', 'Transfer Acceleration must be enabled on the source bucket to move data between Regions', 'The destination bucket must be in the same AWS account as the source bucket'],
    correctAnswer: 0,
    explanation: 'S3 replication is built on versioning, so both the source and destination buckets must have versioning enabled before a replication rule can be created, along with an IAM role that S3 assumes to copy objects. Buckets do not need matching policies or shared KMS keys, and cross-account replication is fully supported. Transfer Acceleration speeds client uploads over long distances and is unrelated to replication.'
  },
  {
    id: 'ra32',
    question: 'A company wants a low-cost way to keep its marketing site reachable if the primary application servers fail. The plan is to serve a functional static version of the site during outages. Which combination implements this?',
    options: ['An Auto Scaling group in a second Region kept at zero instances until an outage occurs', 'An AMI of the web server stored in a second Region for rapid manual launch during outages', 'ElastiCache in front of the web servers so cached pages continue to be served during failures', 'A static copy of the site hosted on S3 with static website hosting, used as the secondary target of a Route 53 failover record'],
    correctAnswer: 3,
    explanation: 'S3 static website hosting costs almost nothing while idle and scales automatically, and a Route 53 failover record with a health check on the primary automatically directs users to the static site during an outage. A zero-instance Auto Scaling group and a stored AMI both require launch time or manual action before serving any traffic. ElastiCache sits behind the application tier and cannot serve pages to users when the web servers themselves are down.'
  },
  {
    id: 'ra33',
    question: 'A content management system runs on EC2 instances in an Auto Scaling group across three Availability Zones. All instances must read and write the same set of files concurrently through a standard file system interface. Which storage service should be used?',
    options: ['An EBS io2 volume with Multi-Attach enabled, attached to all instances in the group', 'Amazon EFS mounted on every instance, since it is accessible from multiple AZs concurrently', 'An instance store volume on each instance, synchronized with a cron-based rsync job', 'S3 buckets accessed through the AWS CLI from a startup script on each instance'],
    correctAnswer: 1,
    explanation: 'Amazon EFS is a managed NFS file system that stores data redundantly across multiple AZs and can be mounted simultaneously by many instances in different AZs, matching the shared file system requirement. EBS Multi-Attach only works within a single AZ and requires a cluster-aware file system. Instance store is ephemeral and per-instance, and S3 is object storage without standard file system semantics such as POSIX file locking.'
  },
  {
    id: 'ra34',
    question: 'An EC2 instance with an attached EBS data volume runs in Availability Zone us-east-1a. The team needs the ability to recover this workload in a different Availability Zone if us-east-1a fails. Which fact must the recovery plan account for?',
    options: ['EBS volumes automatically replicate to a second AZ, so the volume can simply be re-attached there', 'EBS volumes can be attached across AZs only if the instance uses an Elastic Network Interface in each zone', 'An EBS volume exists only within its Availability Zone, so a snapshot must be taken and a new volume created in the target AZ', 'EBS data must be first migrated to instance store before it can move between Availability Zones'],
    correctAnswer: 2,
    explanation: 'An EBS volume is an AZ-scoped resource that can only be attached to instances in the same AZ, so cross-AZ recovery requires creating a snapshot (stored regionally in S3) and restoring it as a new volume in the target AZ. EBS replicates within its AZ for hardware resilience, not across AZs. There is no cross-AZ attachment mechanism regardless of network interfaces, and instance store is ephemeral local storage, not a migration path.'
  },
  {
    id: 'ra35',
    question: 'A company runs workloads using EC2, EBS, RDS, DynamoDB, and EFS across several accounts. Auditors require centrally managed, policy-based backups for all of these services, including scheduled backups, retention rules, and cross-Region copies. What should the solutions architect recommend with the LEAST operational overhead?',
    options: ['Use AWS Backup with backup plans applied to resources across the accounts via AWS Organizations', 'Write Lambda functions triggered by EventBridge schedules that call each service\'s snapshot API', 'Enable each service\'s native automated backup feature and track the settings in a spreadsheet', 'Use S3 Cross-Region Replication to copy all snapshot data to a secondary Region'],
    correctAnswer: 0,
    explanation: 'AWS Backup provides one place to define backup plans covering schedules, retention, and cross-Region and cross-account copies for EC2, EBS, RDS, DynamoDB, EFS, and other supported services, and it integrates with Organizations for multi-account policy enforcement. Custom Lambda schedulers reimplement this with ongoing maintenance burden. Per-service native settings are fragmented and hard to audit centrally, and S3 CRR replicates bucket objects, not service snapshots you do not control as S3 objects.'
  },
  {
    id: 'ra36',
    question: 'A business-critical application has a recovery time objective of 15 minutes and a recovery point objective of a few minutes, but the company wants to avoid the cost of running a full-capacity duplicate environment in the DR Region. Which disaster recovery strategy is MOST appropriate?',
    options: ['Backup and restore, with nightly backups copied to the DR Region for restoration on demand', 'Multi-site active-active, running full production capacity in both Regions simultaneously', 'Pilot light, with only data replication running and all servers provisioned after a disaster is declared', 'Warm standby, running a scaled-down but fully functional copy of the environment in the DR Region'],
    correctAnswer: 3,
    explanation: 'Warm standby keeps a smaller but always-running, functional replica with continuous data replication, so failover requires only scaling up and shifting traffic, which fits a 15-minute RTO at a fraction of full duplicate cost. Backup and restore typically has an RTO of hours and an RPO tied to backup frequency. Pilot light must provision and boot the application tier first, making a 15-minute RTO risky, and active-active meets the RTO but incurs the full-capacity cost the company wants to avoid.'
  },
  {
    id: 'ra37',
    question: 'A company must be able to recover hundreds of on-premises and EC2-based servers into an AWS Region after a disaster, achieving an RTO of minutes and an RPO of seconds, while paying only for low-cost staging resources during normal operation. Which AWS service is designed for this?',
    options: ['AWS Backup, restoring server images from a cross-Region backup vault after a disaster', 'AWS DataSync, continuously copying server file systems to Amazon S3 for later restore', 'AWS Elastic Disaster Recovery (DRS), which continuously replicates servers to a staging area and launches recovery instances on demand', 'AWS Storage Gateway in cached volume mode, keeping primary data in Amazon S3'],
    correctAnswer: 2,
    explanation: 'Elastic Disaster Recovery performs continuous block-level replication of source servers into a low-cost staging area and can launch full recovery instances in minutes, delivering second-level RPO and minute-level RTO without running duplicate production capacity. AWS Backup restores are point-in-time and typically yield RPOs of hours. DataSync copies files rather than replicating bootable servers, and Storage Gateway addresses hybrid storage access, not whole-server disaster recovery.'
  },
  {
    id: 'ra38',
    question: 'During a brief downstream outage, thousands of clients of a microservice retried failed requests immediately and simultaneously, creating a retry storm that prevented the recovering service from stabilizing. Which client-side change BEST prevents this pattern?',
    options: ['Configure clients to retry immediately but cap the total number of retries at ten', 'Implement retries with exponential backoff and jitter so retry attempts spread out over time', 'Remove client retries entirely and surface every transient failure directly to end users', 'Route all retry traffic through a dedicated SQS FIFO queue to serialize the requests'],
    correctAnswer: 1,
    explanation: 'Exponential backoff increases the wait between successive retries, and adding jitter randomizes the timing so thousands of clients do not retry in synchronized waves, giving the recovering service breathing room. Immediate retries, even when capped, still concentrate load at the worst moment. Removing retries sacrifices resilience to transient errors, and forcing synchronous request/response traffic through a FIFO queue changes the application model without addressing retry timing.'
  },
  {
    id: 'ra39',
    question: 'A VPC has private subnets in three Availability Zones, all routing outbound internet traffic through a single NAT gateway in AZ-a. A solutions architect reviewing the design for single points of failure should make which recommendation?',
    options: ['Replace the NAT gateway with a NAT instance in an Auto Scaling group of one instance', 'Move the NAT gateway to a public subnet that spans all three Availability Zones', 'Enable Multi-AZ mode on the existing NAT gateway so it fails over automatically', 'Deploy a NAT gateway in each AZ and configure each private subnet\'s route table to use the NAT gateway in its own AZ'],
    correctAnswer: 3,
    explanation: 'A NAT gateway is resilient within its own AZ but becomes a single point of failure for the whole VPC when other AZs depend on it; if AZ-a fails, instances in the other AZs lose internet access. Deploying one NAT gateway per AZ with zonal route tables removes this dependency and avoids cross-AZ data charges. NAT gateways have no Multi-AZ or cross-AZ failover mode, subnets cannot span multiple AZs, and a single NAT instance is less available than a NAT gateway.'
  }
  ]
};
