// Domain 3: Design High-Performing Architectures (24% of exam)
// SAA-C03 Exam Content

export const highPerforming = {
  id: 'high-performing',
  name: 'Design High-Performing Architectures',
  icon: '⚡',
  weight: '24%',
  color: '#58a6ff',
  description: 'High-performing and scalable storage, compute, database, networking, and data ingestion solutions',
  questions: [
  {
    id: 'hp1',
    question: 'A database on EC2 uses a 500 GB gp3 EBS volume delivering the baseline 3,000 IOPS. The DBA needs 10,000 IOPS but the data set will not grow. What is the MOST cost-effective way to meet the IOPS requirement?',
    options: [
      'Increase the gp3 volume size to 3,334 GB so the volume earns 10,000 IOPS from its capacity',
      'Provision 10,000 IOPS directly on the existing gp3 volume without changing its size',
      'Migrate the data to an io2 volume provisioned with 10,000 IOPS',
      'Stripe ten additional 500 GB gp3 volumes together in a RAID 0 array'
    ],
    correctAnswer: 1,
    explanation: 'Unlike gp2, gp3 decouples performance from capacity: you can provision up to 16,000 IOPS and 1,000 MB/s independently of volume size, so paying only for the extra IOPS on the existing 500 GB volume is cheapest. Growing the volume is a gp2-era tactic that buys unneeded storage, and io2 delivers the IOPS but at a higher per-IOPS price. RAID 0 across many volumes adds cost and operational complexity for a target gp3 can hit natively.'
  },
  {
    id: 'hp2',
    question: 'A financial trading platform requires a single EBS volume that can sustain more than 100,000 IOPS with sub-millisecond latency and the highest available volume durability. Which volume type meets these requirements?',
    options: [
      'gp3 with maximum provisioned IOPS',
      'st1 with maximum provisioned throughput',
      'io2 Block Express with provisioned IOPS',
      'sc1 attached to a storage optimized instance'
    ],
    correctAnswer: 2,
    explanation: 'io2 Block Express supports up to 256,000 IOPS on a single volume with sub-millisecond latency and 99.999% durability, far exceeding what other EBS types offer. gp3 caps at 16,000 IOPS per volume, so it cannot reach the requirement. st1 and sc1 are HDD-based volumes measured in throughput, not IOPS, and cannot even serve as boot or low-latency transactional volumes.'
  },
  {
    id: 'hp3',
    question: 'A big data application performs large, sequential reads and writes of log files on EC2 and needs high throughput at the LOWEST storage cost, with data persisting across instance stops. Which EBS volume type is the best fit?',
    options: [
      'st1 Throughput Optimized HDD',
      'io2 Provisioned IOPS SSD',
      'gp3 General Purpose SSD',
      'Instance store NVMe volumes'
    ],
    correctAnswer: 0,
    explanation: 'st1 is purpose-built for frequently accessed, throughput-intensive sequential workloads such as log processing and big data, delivering high MB/s at a low HDD price. io2 and gp3 are SSD volumes optimized for random IOPS and cost more per gigabyte than needed for sequential streaming. Instance store offers high performance but is ephemeral, so the data would be lost when the instance stops.'
  },
  {
    id: 'hp4',
    question: 'An application writes temporary scratch data that requires millions of IOPS with microsecond latency. The data is regenerated on startup and does not need to survive instance stops. Which storage option delivers the HIGHEST performance for this workload?',
    options: [
      'A gp3 volume with 16,000 provisioned IOPS',
      'An io2 volume with maximum provisioned IOPS',
      'An EFS file system in Max I/O performance mode',
      'NVMe instance store volumes on a storage optimized instance'
    ],
    correctAnswer: 3,
    explanation: 'Instance store is physically attached to the host, so NVMe instance store on storage optimized instances (such as the i-family) delivers millions of IOPS at microsecond latency—higher than any network-attached option. Because the data is ephemeral scratch data, losing it on stop or termination is acceptable. gp3 and io2 are network-attached and cap well below this performance, and EFS adds network file system latency.'
  },
  {
    id: 'hp5',
    question: 'A content management system runs on multiple Linux EC2 instances across three Availability Zones, and every instance must read and write the same set of files concurrently through a standard file system interface. Which storage service meets this requirement with the LEAST operational overhead?',
    options: [
      'An EBS io2 volume attached to all instances using Multi-Attach',
      'An S3 bucket mounted on each instance with a third-party tool',
      'An EFS file system mounted on all instances via NFS',
      'An FSx for Windows File Server file system mounted via SMB'
    ],
    correctAnswer: 2,
    explanation: 'EFS is a fully managed NFS file system that thousands of Linux instances across multiple AZs can mount simultaneously, scaling automatically with no capacity management. EBS Multi-Attach is limited to io1/io2 volumes within a single AZ and requires a cluster-aware file system to avoid corruption. S3 is object storage rather than a POSIX file system, and FSx for Windows File Server targets SMB clients and Windows workloads, not Linux NFS mounts.'
  },
  {
    id: 'hp6',
    question: 'A company is migrating a Windows-based application that depends on shared SMB file storage and Active Directory integration with NTFS access controls. Which AWS service should provide the shared file storage?',
    options: [
      'Amazon FSx for Windows File Server',
      'Amazon EFS with Provisioned Throughput',
      'Amazon FSx for Lustre linked to an S3 bucket',
      'Amazon S3 with a File Gateway in front'
    ],
    correctAnswer: 0,
    explanation: 'FSx for Windows File Server is a fully managed native Windows file system supporting SMB, NTFS ACLs, and Active Directory integration—exactly what a lift-and-shift Windows application expects. EFS speaks NFS and targets Linux clients, so it cannot serve SMB with NTFS permissions. FSx for Lustre is built for high-performance computing, and File Gateway adds a hybrid appliance layer that is unnecessary when the workload is already in AWS.'
  },
  {
    id: 'hp7',
    question: 'A genomics research team runs high-performance computing jobs on hundreds of EC2 instances. Input data sets live in S3, and the jobs need a shared file system delivering hundreds of GB/s of throughput and sub-millisecond latencies. Which solution is the MOST performant?',
    options: [
      'Mount an EFS file system in Max I/O mode and copy the data from S3',
      'Use FSx for Lustre with a data repository association to the S3 bucket',
      'Attach a large io2 volume to each instance and sync the data from S3',
      'Use FSx for Windows File Server with S3 objects copied in via DataSync'
    ],
    correctAnswer: 1,
    explanation: 'FSx for Lustre is purpose-built for HPC, scaling to hundreds of GB/s with sub-millisecond latencies, and its S3 data repository integration lazily presents S3 objects as files and can write results back. EFS Max I/O scales well for parallelism but delivers far lower throughput and higher latency than Lustre. Per-instance io2 volumes are not a shared file system, and FSx for Windows targets SMB business workloads, not parallel HPC I/O.'
  },
  {
    id: 'hp8',
    question: 'An application must upload 40 GB video files from EC2 instances to S3 in the same Region. Uploads of large files occasionally fail near the end and must restart from the beginning. What should the architect do to improve upload performance and resilience?',
    options: [
      'Enable S3 Transfer Acceleration on the bucket and upload through the acceleration endpoint',
      'Compress each file into a single archive before performing one PUT request',
      'Write the files to an EFS file system and let S3 replicate them automatically',
      'Use multipart upload to send the files in parallel parts that can be retried individually'
    ],
    correctAnswer: 3,
    explanation: 'Multipart upload splits a large object into parts that upload in parallel for higher aggregate throughput, and a failed part can be retried alone instead of restarting the whole 40 GB transfer; it is also required for any single object over 5 GB per PUT. Transfer Acceleration helps clients that are geographically far from the bucket, not same-Region EC2 uploads. Compression still yields one fragile single PUT, and EFS does not automatically replicate files into S3.'
  },
  {
    id: 'hp9',
    question: 'Users around the world upload large media files to a single S3 bucket in us-east-1, and users in Asia and Europe report slow uploads. Which change improves upload performance with the LEAST application refactoring?',
    options: [
      'Enable S3 Transfer Acceleration so uploads enter AWS at the nearest edge location',
      'Create a CloudFront distribution with the bucket as origin and have users upload through it',
      'Deploy buckets in every Region and build a replication and reconciliation pipeline',
      'Ask users to split files manually and upload the pieces during off-peak hours'
    ],
    correctAnswer: 0,
    explanation: 'Transfer Acceleration routes uploads to the nearest CloudFront edge location and then carries them to the bucket over the optimized AWS global network, typically speeding up long-distance transfers with only an endpoint change in the application. CloudFront is primarily a content delivery cache; while PUT forwarding is possible, it is not the purpose-built, simplest path for accelerating S3 uploads. Multi-Region buckets require significant replication and consistency engineering, and manual splitting is operational burden, not architecture.'
  },
  {
    id: 'hp10',
    question: 'An analytics application issues millions of GET requests per second against objects stored in an S3 bucket and is hitting request-rate bottlenecks. All objects currently share a single key prefix. What should the architect do to achieve the HIGHEST request throughput?',
    options: [
      'Enable versioning on the bucket to create parallel copies of each object',
      'Request an S3 request-rate limit increase through AWS Support',
      'Distribute objects across many key prefixes and parallelize requests across them',
      'Switch the bucket to the S3 Intelligent-Tiering storage class'
    ],
    correctAnswer: 2,
    explanation: 'S3 supports at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per prefix, and there is no limit on the number of prefixes—so spreading keys across many prefixes and reading them in parallel scales throughput horizontally. Versioning creates historical versions, not extra read capacity. These per-prefix rates scale automatically rather than through support tickets, and storage classes like Intelligent-Tiering affect cost, not request-rate limits.'
  },
  {
    id: 'hp11',
    question: 'A website serves static images and videos from S3 to a global audience. Latency is high for users far from the bucket Region, and S3 data transfer costs are climbing. Which solution BEST improves read performance for these users?',
    options: [
      'Enable S3 Transfer Acceleration and serve downloads through the accelerated endpoint',
      'Create a CloudFront distribution with the S3 bucket as its origin',
      'Replicate the bucket to every AWS Region with Cross-Region Replication',
      'Front the bucket with a Global Accelerator standard accelerator'
    ],
    correctAnswer: 1,
    explanation: 'CloudFront caches static content at hundreds of edge locations, serving repeat requests close to users with low latency while reducing origin fetches and S3 transfer costs. Transfer Acceleration targets uploads to S3, not cached content delivery. Cross-Region Replication multiplies storage costs and still requires routing logic, and Global Accelerator optimizes network paths for TCP/UDP applications but performs no caching, so every request would still travel to the origin.'
  },
  {
    id: 'hp12',
    question: 'A gaming application built on DynamoDB has read-heavy traffic and now requires microsecond read latency for frequently accessed items without rewriting the data access layer. Which solution meets the requirement with the LEAST development effort?',
    options: [
      'Deploy an ElastiCache for Redis cluster and add cache-aside logic to the application',
      'Increase the table\'s provisioned read capacity units substantially',
      'Enable DynamoDB global tables and read from the nearest replica Region',
      'Deploy a DynamoDB Accelerator (DAX) cluster and point the application at it'
    ],
    correctAnswer: 3,
    explanation: 'DAX is an in-memory, write-through cache purpose-built for DynamoDB that delivers microsecond read latency and is API-compatible, so applications typically only swap in the DAX client rather than writing cache management code. ElastiCache can achieve similar latency but requires implementing cache-aside population, invalidation, and TTL logic. More RCUs raise throughput but reads remain single-digit milliseconds, and global tables address geographic latency, not the millisecond-to-microsecond gap.'
  },
  {
    id: 'hp13',
    question: 'A mobile game needs a real-time leaderboard ranking millions of players, and the in-memory data store must support replication for high availability and persistence for recovery. Which service should the architect choose?',
    options: [
      'ElastiCache for Redis, using sorted sets for ranking',
      'ElastiCache for Memcached with multiple nodes',
      'DynamoDB with DAX in front for microsecond reads',
      'RDS for MySQL with a Multi-AZ standby instance'
    ],
    correctAnswer: 0,
    explanation: 'Redis natively provides sorted sets, which maintain ranked leaderboards with efficient score updates and range queries, and it supports replication, automatic failover, and snapshot/AOF persistence. Memcached is simpler and multi-threaded but offers no replication, persistence, or advanced data structures. DynamoDB with DAX can serve fast reads but has no built-in ranking structure, requiring complex modeling, and a relational database computing rankings with ORDER BY queries will not sustain real-time performance at millions of players.'
  },
  {
    id: 'hp14',
    question: 'An architect needs a caching layer for simple string key-value lookups of database query results. The design calls for the simplest possible multi-threaded cache that scales horizontally by adding nodes, with no need for replication or persistence. Which service fits BEST?',
    options: [
      'ElastiCache for Redis in cluster mode',
      'DynamoDB Accelerator (DAX)',
      'ElastiCache for Memcached',
      'Amazon CloudFront with a long default TTL'
    ],
    correctAnswer: 2,
    explanation: 'Memcached is the right choice when requirements are a simple object cache: it is multi-threaded to exploit large multi-core nodes, scales out by adding nodes, and intentionally omits replication and persistence. Redis brings those durability and data-structure features at the cost of extra complexity that this design explicitly does not need. DAX only accelerates DynamoDB, and CloudFront caches HTTP responses at the edge rather than serving as an application-tier key-value cache.'
  },
  {
    id: 'hp15',
    question: 'A REST API on Amazon API Gateway backed by Lambda serves product catalog data that changes only a few times per day. The team wants to reduce backend invocations and latency for repeated identical requests WITHOUT changing application code. What should they do?',
    options: [
      'Add an ElastiCache for Redis cluster between API Gateway and Lambda',
      'Enable API Gateway caching on the stage with an appropriate TTL',
      'Enable Lambda provisioned concurrency for the backing functions',
      'Increase the Lambda function memory to reduce execution duration'
    ],
    correctAnswer: 1,
    explanation: 'API Gateway stage-level caching stores endpoint responses in a dedicated cache for a configurable TTL, so repeated identical requests are answered at the gateway without invoking Lambda at all—a pure configuration change. ElastiCache cannot sit between API Gateway and Lambda without new code to read and populate it. Provisioned concurrency removes cold-start latency and higher memory speeds execution, but both still invoke the backend on every request.'
  },
  {
    id: 'hp16',
    question: 'An application caches database reads in ElastiCache. The team complains that after database updates, users see stale data until cache entries expire, although cache hit rates are excellent. Which caching strategy change BEST addresses the staleness?',
    options: [
      'Lengthen the TTL on cached items so entries are refreshed less frequently',
      'Switch from Redis to Memcached to take advantage of multi-threading',
      'Move to a cache-aside pattern that loads data only after a cache miss',
      'Adopt a write-through pattern that updates the cache whenever the database is written'
    ],
    correctAnswer: 3,
    explanation: 'Write-through updates the cache as part of every database write, so reads immediately see current data and staleness windows disappear, at the cost of slightly slower writes. Lengthening TTLs makes stale data live longer, the opposite of the goal. The application is effectively already doing lazy-loading/cache-aside—that pattern is precisely what allows data to go stale between expirations—and switching engines to Memcached changes performance characteristics, not the consistency of cached values.'
  },
  {
    id: 'hp17',
    question: 'A tightly coupled high-performance computing workload runs on 20 EC2 instances that exchange large volumes of data over the network. The application needs the LOWEST possible inter-instance latency and highest throughput. How should the instances be launched?',
    options: [
      'In a cluster placement group within a single Availability Zone',
      'In a spread placement group across three Availability Zones',
      'In a partition placement group with one instance per partition',
      'In an Auto Scaling group balanced across all Availability Zones'
    ],
    correctAnswer: 0,
    explanation: 'A cluster placement group packs instances close together on high-bisection-bandwidth hardware in a single AZ, minimizing network latency and maximizing per-flow throughput—ideal for tightly coupled HPC. Spread placement groups do the opposite, deliberately separating instances onto distinct hardware for fault isolation. Partition placement groups isolate groups of instances for distributed data systems like Hadoop or Kafka, and spanning multiple AZs adds inter-AZ latency that HPC traffic cannot afford.'
  },
  {
    id: 'hp18',
    question: 'A company runs seven critical EC2 instances, each hosting an independent licensing server. A hardware failure must never affect more than one of these instances. Which placement strategy meets this requirement?',
    options: [
      'Launch the instances in a cluster placement group for dedicated capacity',
      'Launch the instances in a partition placement group with a single partition',
      'Launch the instances in a spread placement group',
      'Launch the instances on a single Dedicated Host for isolation'
    ],
    correctAnswer: 2,
    explanation: 'A spread placement group places each instance on distinct underlying hardware with separate racks, power, and network, so one hardware failure can affect at most one instance—supporting up to seven instances per AZ per group, which fits exactly. A cluster placement group concentrates instances on shared hardware, increasing correlated failure risk. A single partition keeps all instances on the same rack set, and one Dedicated Host is a single physical server, the worst possible blast radius.'
  },
  {
    id: 'hp19',
    question: 'A company runs a fleet of stateless web servers on x86 EC2 instances. The application is built on open-source software that can be recompiled for other architectures. Management wants better price-performance with minimal architectural change. What should the architect recommend?',
    options: [
      'Move the fleet to larger x86 instances to benefit from economies of scale',
      'Migrate the fleet to Graviton-based (ARM) instances such as the m7g family',
      'Convert the fleet to Dedicated Hosts to reduce virtualization overhead',
      'Rewrite the application as Lambda functions to eliminate servers entirely'
    ],
    correctAnswer: 1,
    explanation: 'AWS Graviton processors deliver up to roughly 40% better price-performance than comparable x86 instances, and open-source stacks that can be rebuilt for ARM typically migrate with little more than a recompile or an ARM-compatible image. Larger x86 instances cost proportionally more without a price-performance gain. Dedicated Hosts increase cost for licensing and compliance use cases, and a serverless rewrite is a major re-architecture, not a minimal change.'
  },
  {
    id: 'hp20',
    question: 'A Lambda function performing CPU-intensive image processing takes too long to complete. The code is already optimized. What is the MOST direct way to give the function more CPU power?',
    options: [
      'Enable provisioned concurrency so the function stays initialized',
      'Increase the function\'s reserved concurrency limit',
      'Attach the function to a VPC with enhanced networking enabled',
      'Increase the function\'s memory allocation, which scales CPU proportionally'
    ],
    correctAnswer: 3,
    explanation: 'Lambda allocates CPU in proportion to configured memory—from 128 MB up to 10,240 MB—so raising the memory setting is the way to give a function more compute, often reducing duration enough to offset the higher per-GB-second rate. Provisioned concurrency eliminates cold-start latency but does not speed up execution. Reserved concurrency controls how many instances may run simultaneously, not per-invocation power, and VPC networking configuration has no effect on CPU allocation.'
  },
  {
    id: 'hp21',
    question: 'A latency-sensitive API implemented with Lambda behind API Gateway suffers from intermittent multi-second response times when new execution environments initialize during traffic spikes. Which solution BEST eliminates these cold-start delays?',
    options: [
      'Configure provisioned concurrency for the function\'s production alias',
      'Raise the account\'s regional concurrency quota through AWS Support',
      'Reduce the function timeout so slow initializations fail fast',
      'Move initialization code from the handler into the invocation path'
    ],
    correctAnswer: 0,
    explanation: 'Provisioned concurrency keeps a specified number of execution environments initialized and ready, so requests up to that level are served with no cold start—exactly the fix for latency-sensitive APIs. A higher concurrency quota lets more environments run but each new one still cold-starts. Shortening the timeout just turns slow requests into errors, and moving setup work into the per-invocation path makes every request slower rather than faster.'
  },
  {
    id: 'hp22',
    question: 'An in-memory analytics engine needs EC2 instances with a very high ratio of RAM to vCPU to hold a large working set entirely in memory. Which instance family should the architect select?',
    options: [
      'Compute optimized instances such as the C family',
      'Storage optimized instances such as the I family',
      'Memory optimized instances such as the R or X family',
      'Burstable general purpose instances such as the T family'
    ],
    correctAnswer: 2,
    explanation: 'Memory optimized families (R, X, and high-memory instances) provide the highest RAM-to-vCPU ratios and are designed for in-memory databases, caches, and analytics engines that must keep large data sets resident in memory. Compute optimized instances favor vCPU over RAM for CPU-bound work. Storage optimized instances target high local NVMe IOPS, and burstable T instances offer baseline CPU with credits, making them unsuitable for sustained large-memory analytics.'
  },
  {
    id: 'hp23',
    question: 'An RDS for MySQL database is overwhelmed by read traffic from reporting dashboards, while write volume is modest. Which change relieves the read pressure with the LEAST disruption to the primary database?',
    options: [
      'Enable Multi-AZ and direct the dashboards to the standby instance',
      'Create read replicas and point the reporting dashboards at them',
      'Scale the primary instance vertically to the largest available class',
      'Shard the database across several independent RDS instances'
    ],
    correctAnswer: 1,
    explanation: 'RDS read replicas use asynchronous replication to serve read-only traffic on separate endpoints, offloading reporting queries from the primary without changing the write path. A Multi-AZ standby exists purely for failover and cannot be queried in RDS for MySQL. Vertical scaling has a hard ceiling, requires downtime for the instance class change, and still mixes reads with writes, while sharding is a major re-architecture far beyond what a read-heavy workload demands.'
  },
  {
    id: 'hp24',
    question: 'An Aurora MySQL cluster has one writer and five Aurora Replicas. The application connects to each replica by its individual instance endpoint, causing uneven load and failures when a replica is replaced. How should the application connect for the BEST read scaling?',
    options: [
      'Connect to the cluster endpoint for all read and write traffic',
      'Configure a Network Load Balancer with each replica as a target',
      'Use Route 53 weighted records pointing at each instance endpoint',
      'Use the cluster\'s reader endpoint, which load balances connections across replicas'
    ],
    correctAnswer: 3,
    explanation: 'The Aurora reader endpoint automatically distributes connections across all available Aurora Replicas and tracks membership as replicas are added, removed, or replaced—including by replica auto scaling—so the application needs only one stable DNS name. The cluster endpoint always routes to the writer, defeating read offload. An NLB or Route 53 records would require constant manual re-registration as replica membership changes, which the reader endpoint handles natively.'
  },
  {
    id: 'hp25',
    question: 'A serverless application invokes Lambda functions at high concurrency, and each invocation opens its own connection to an RDS for PostgreSQL database. During spikes, the database exhausts its connection limit and errors out. What is the BEST way to solve this?',
    options: [
      'Place RDS Proxy between the Lambda functions and the database to pool connections',
      'Increase the max_connections parameter to a very large value in the parameter group',
      'Configure the functions to sleep and retry when connection errors occur',
      'Migrate the database to DynamoDB to remove connection management entirely'
    ],
    correctAnswer: 0,
    explanation: 'RDS Proxy maintains a warm pool of database connections and multiplexes thousands of ephemeral Lambda connections over far fewer database connections, absorbing exactly this kind of connection storm while also speeding failover. Raising max_connections consumes database memory and only delays exhaustion. Sleep-and-retry adds latency and still storms the database, and swapping the relational engine for DynamoDB is a full data-model rewrite to solve a connection-pooling problem.'
  },
  {
    id: 'hp26',
    question: 'A retail platform needs a database for shopping cart and session data with single-digit millisecond latency at millions of requests per second, a simple key-value access pattern, and no servers to manage. Which database is the BEST fit?',
    options: [
      'Amazon RDS for MySQL with read replicas in each Availability Zone',
      'Amazon Redshift with concurrency scaling enabled',
      'Amazon DynamoDB with on-demand capacity mode',
      'Amazon Neptune with a multi-AZ cluster configuration'
    ],
    correctAnswer: 2,
    explanation: 'DynamoDB is a fully managed key-value database that delivers consistent single-digit millisecond latency at virtually unlimited request rates, and on-demand mode scales instantly with no capacity planning—ideal for cart and session data. RDS requires instance management and its relational engine tops out well below millions of requests per second. Redshift is an OLAP warehouse for analytics, not high-frequency transactional lookups, and Neptune is purpose-built for graph traversals, not simple key-value access.'
  },
  {
    id: 'hp27',
    question: 'An RDS for PostgreSQL database serves both the production OLTP workload and heavy analytical queries that scan and aggregate billions of rows, degrading transaction performance. What is the BEST architectural change for the analytics workload?',
    options: [
      'Add more read replicas and route all analytical queries to them',
      'Load the historical data into Amazon Redshift and run the analytics there',
      'Enable Multi-AZ so analytical queries can run on the standby',
      'Cache the analytical query results in ElastiCache for Redis'
    ],
    correctAnswer: 1,
    explanation: 'Redshift is a columnar, massively parallel OLAP warehouse designed for scanning and aggregating billions of rows, so moving analytics there isolates them from OLTP and executes them orders of magnitude faster than a row-oriented engine. Read replicas keep the row-based engine that is poorly suited to full-table aggregation and still burn replica resources. The Multi-AZ standby in RDS is not readable, and caching only helps repeated identical queries, not ad hoc analysis.'
  },
  {
    id: 'hp28',
    question: 'A social networking feature must answer queries such as "friends of my friends who like the same pages" across billions of highly connected relationships with millisecond latency. Which purpose-built database should the architect choose?',
    options: [
      'Amazon Timestream, using measures to model each relationship',
      'Amazon OpenSearch Service, using nested documents for connections',
      'Amazon Aurora MySQL, using recursive self-joins on a friends table',
      'Amazon Neptune, storing the relationships as a graph'
    ],
    correctAnswer: 3,
    explanation: 'Neptune is a purpose-built graph database optimized for traversing billions of relationships, answering multi-hop queries like friends-of-friends in milliseconds using Gremlin, openCypher, or SPARQL. Relational engines require recursive multi-way self-joins whose cost explodes with each hop. Timestream is designed for time-series measurements, and OpenSearch excels at full-text search and log analytics, not deep relationship traversal.'
  },
  {
    id: 'hp29',
    question: 'A multiplayer game uses a custom UDP protocol served from Network Load Balancers in two Regions. Global players need the LOWEST possible latency and a pair of static IP addresses that never change. Which service meets these requirements?',
    options: [
      'AWS Global Accelerator with the NLBs registered as endpoints',
      'Amazon CloudFront with the NLBs configured as custom origins',
      'Amazon Route 53 latency-based routing to each NLB\'s addresses',
      'An additional Network Load Balancer in a central third Region'
    ],
    correctAnswer: 0,
    explanation: 'Global Accelerator provides two static anycast IP addresses and routes TCP and UDP traffic onto the AWS global backbone at the nearest edge location, then steers it to the closest healthy Regional endpoint—exactly what a latency-sensitive UDP game needs. CloudFront handles HTTP/HTTPS content and cannot proxy a custom UDP protocol. Route 53 latency routing helps at resolution time but offers no static IPs and leaves traffic on the public internet, as would any additional load balancer.'
  },
  {
    id: 'hp30',
    question: 'A company transfers multiple terabytes daily between its data center and AWS. The current Site-to-Site VPN suffers from variable latency and throughput because it rides the public internet. Which solution provides the MOST consistent network performance?',
    options: [
      'Provision a second Site-to-Site VPN tunnel pair and load balance across them',
      'Enable VPN acceleration through AWS Global Accelerator',
      'Establish an AWS Direct Connect dedicated connection to the VPC',
      'Compress the data before transfer to reduce bandwidth requirements'
    ],
    correctAnswer: 2,
    explanation: 'Direct Connect provides a private, dedicated physical link between the data center and AWS with consistent bandwidth (up to 100 Gbps on dedicated connections) and predictable latency because traffic never touches the public internet. Additional VPN tunnels add aggregate capacity but each still traverses the variable internet. Accelerated VPN improves routing to the AWS edge yet remains internet-dependent on the first mile, and compression reduces volume without making the underlying path any more consistent.'
  },
  {
    id: 'hp31',
    question: 'A company has grown to 60 VPCs across several accounts, all interconnected with VPC peering. Managing the full mesh of peering connections and route tables has become unmanageable. Which service simplifies this into a hub-and-spoke architecture at scale?',
    options: [
      'PrivateLink interface endpoints between every pair of VPCs',
      'AWS Transit Gateway with each VPC attached to it',
      'CloudFront distributions fronting the services in each VPC',
      'A shared services VPC peered individually with the other 59 VPCs'
    ],
    correctAnswer: 1,
    explanation: 'Transit Gateway acts as a regional cloud router: each VPC attaches once to the hub and can reach every other attachment through centrally managed route tables, replacing the O(n²) peering mesh—nearly 1,800 connections for 60 VPCs—with 60 attachments. PrivateLink exposes individual services, not full network connectivity. CloudFront is a content delivery network, and a hub VPC using peering fails because VPC peering is not transitive, so spokes could never reach each other through it.'
  },
  {
    id: 'hp32',
    question: 'EC2 instances in private subnets call AWS Systems Manager and Amazon Kinesis Data Streams APIs. Security policy requires that this traffic never traverse the internet, a NAT gateway, or an internet gateway. What should the architect configure?',
    options: [
      'Gateway VPC endpoints for Systems Manager and Kinesis in the route tables',
      'An egress-only internet gateway attached to the VPC',
      'A NAT instance in a public subnet with a strict security group',
      'Interface VPC endpoints (AWS PrivateLink) for each service in the private subnets'
    ],
    correctAnswer: 3,
    explanation: 'Interface endpoints place elastic network interfaces with private IPs in your subnets, so API calls to services like Systems Manager and Kinesis resolve to those private addresses and stay entirely on the AWS network. Gateway endpoints exist only for S3 and DynamoDB, so they cannot serve these services. An egress-only internet gateway is for outbound IPv6 internet traffic, and a NAT instance still routes the API calls out through the public internet, violating the policy.'
  },
  {
    id: 'hp33',
    question: 'Two EC2 instances in the same VPC exchange very large data sets, and the team wants to maximize network throughput between them. The instance types support ENA. Which combination of changes helps achieve the HIGHEST throughput?',
    options: [
      'Enable enhanced networking with ENA and configure jumbo frames with a 9001-byte MTU',
      'Route the traffic through a NAT gateway sized for high throughput',
      'Move each instance into a separate Availability Zone to balance the network load',
      'Assign multiple Elastic IP addresses to each instance to widen the path'
    ],
    correctAnswer: 0,
    explanation: 'Enhanced networking with the Elastic Network Adapter provides SR-IOV-based high bandwidth with lower CPU overhead, and jumbo frames (9001 MTU) let each packet carry more payload, reducing per-packet overhead—both supported for traffic within a VPC. A NAT gateway is for outbound internet access from private subnets and would only add a hop. Separating the instances across AZs introduces inter-AZ latency and can reduce usable throughput, and Elastic IPs are public address mappings with no effect on bandwidth.'
  },
  {
    id: 'hp34',
    question: 'A fraud detection system must ingest clickstream events and process them in real time with strict per-user ordering, and analysts need the ability to replay the last 24 hours of events through new detection models. Which ingestion service meets these requirements?',
    options: [
      'Amazon SQS FIFO queues with one queue per user segment',
      'Amazon Data Firehose delivering the events to Amazon S3',
      'Amazon Kinesis Data Streams with events partitioned by user ID',
      'Amazon SNS fanning events out to multiple processing subscribers'
    ],
    correctAnswer: 2,
    explanation: 'Kinesis Data Streams preserves ordering within a shard—so partitioning by user ID guarantees per-user order—supports multiple consumers reading in real time, and retains records (24 hours by default, extensible to 365 days) so new models can replay history from any point. SQS FIFO orders messages but deletes them once consumed, making replay impossible. Firehose is near-real-time delivery with buffering rather than sub-second processing, and SNS pushes messages without retention or replay.'
  },
  {
    id: 'hp35',
    question: 'A team must continuously deliver streaming application logs into Amazon S3, converted to Parquet, with no consumer applications to build or shards to manage. Which solution accomplishes this with the LEAST operational overhead?',
    options: [
      'Kinesis Data Streams with a custom consumer that batches and writes to S3',
      'Amazon Data Firehose with record format conversion to Parquet enabled',
      'An SQS queue drained by a scheduled Lambda function that writes to S3',
      'An EC2 fleet running Fluentd agents aggregating logs onto EBS, synced to S3'
    ],
    correctAnswer: 1,
    explanation: 'Firehose is a fully managed delivery service that buffers streaming data and writes it to S3 with no shards to provision and no consumer code, and its built-in record format conversion produces Parquet using a Glue schema. Kinesis Data Streams would require writing and operating a consumer plus managing shard capacity. The SQS-plus-Lambda design means building batching, conversion, and error handling yourself, and an EC2 Fluentd fleet is the highest-maintenance option of all.'
  },
  {
    id: 'hp36',
    question: 'Analysts run ad hoc SQL with Amazon Athena over years of JSON event data in S3, but queries are slow and expensive because every query scans nearly the entire data set. Which change MOST improves query performance and reduces cost?',
    options: [
      'Increase the Athena workgroup\'s per-query data scan limit',
      'Load all of the JSON files into a large RDS instance and query it there',
      'Enable S3 Transfer Acceleration on the data bucket for faster scans',
      'Convert the data to partitioned, compressed Parquet and register it in the Glue Data Catalog'
    ],
    correctAnswer: 3,
    explanation: 'Athena bills and performs by data scanned, so converting JSON to columnar Parquet lets queries read only the referenced columns, compression shrinks bytes scanned further, and partitioning (for example by date) prunes irrelevant data entirely—together often cutting scans by 90% or more, with the Glue Data Catalog holding the table and partition metadata. Raising the scan limit only permits more expensive queries. Loading years of events into RDS abandons the serverless data lake, and Transfer Acceleration speeds client uploads to S3, not Athena scans.'
  }
  ]
};
