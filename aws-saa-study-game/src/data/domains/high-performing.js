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
      id: 'perf1',
      question: 'An IoT platform writes sensor readings to a single Amazon S3 bucket using keys such as data/reading-000123.json. As traffic grew to several thousand PUT requests per second, the application started receiving HTTP 503 Slow Down errors. What should a solutions architect do to sustain the higher request rate?',
      options: [
        'Enable S3 Transfer Acceleration on the bucket',
        'Request a service quota increase for S3 PUT requests',
        'Distribute the object keys across multiple prefixes',
        'Move the objects to the S3 Intelligent-Tiering class'
      ],
      correctAnswer: 2,
      explanation: 'S3 scales request throughput per prefix (at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per partitioned prefix), so spreading keys across many prefixes multiplies the achievable rate. There is no account quota to raise for per-prefix request rates, Transfer Acceleration speeds long-distance transfers rather than request rates, and a storage class change does nothing for request throughput.'
    },
    {
      id: 'perf2',
      question: 'Film crews on several continents upload raw video files of 20-50 GB each to an S3 bucket in us-east-1. Uploads over the public internet are slow and frequently fail partway through. The company wants faster, more reliable uploads with minimal changes to its upload tool. What should the solutions architect recommend?',
      options: [
        'Enable S3 Transfer Acceleration and use multipart upload',
        'Create buckets in each Region and use Cross-Region Replication',
        'Provision AWS Direct Connect links from every film location',
        'Upload through an AWS Site-to-Site VPN to the us-east-1 VPC'
      ],
      correctAnswer: 0,
      explanation: 'Transfer Acceleration routes uploads into the nearest CloudFront edge location and across the AWS backbone, and multipart upload sends parts in parallel and retries only failed parts, which is required anyway for objects over 5 GB. Regional buckets with replication require the tool to choose buckets per location, Direct Connect is impractical for temporary global sites, and a VPN still runs over the same congested internet path.'
    },
    {
      id: 'perf3',
      question: 'A media application stores multi-gigabyte video files in Amazon S3. Clients need to start playback quickly, and a processing job must download whole files as fast as possible from EC2. Which approach improves download performance for both needs?',
      options: [
        'Enable S3 Transfer Acceleration for the bucket',
        'Copy each object to an EBS volume before reading',
        'Use the multipart upload API to split the downloads',
        'Parallel byte-range GET requests per object'
      ],
      correctAnswer: 3,
      explanation: 'Byte-range fetches use the HTTP Range header to request specific parts of an object, so clients can fetch only the first segment and jobs can download many ranges in parallel for higher aggregate throughput. Multipart upload is only for writing objects, copying to EBS adds a slow extra step, and Transfer Acceleration helps long-distance internet transfers rather than in-Region EC2 reads.'
    },
    {
      id: 'perf4',
      question: 'A financial services company is moving a mission-critical Oracle database to Amazon EC2. The storage must deliver sub-millisecond latency, very high sustained IOPS, and the highest durability available for EBS. Which EBS volume type meets these requirements?',
      options: [
        'General Purpose SSD (gp3) at its maximum IOPS',
        'Provisioned IOPS SSD (io2 Block Express)',
        'Throughput Optimized HDD (st1) in RAID 0',
        'Instance store NVMe volumes on an I-family instance'
      ],
      correctAnswer: 1,
      explanation: 'io2 Block Express is built for the most demanding databases, offering sub-millisecond latency, the highest IOPS and throughput of any EBS type, and 99.999% durability. gp3 is cost-effective for most workloads but has lower durability and performance ceilings, st1 is an HDD type for sequential throughput rather than random IOPS, and instance store data is lost when the instance stops or fails.'
    },
    {
      id: 'perf5',
      question: 'A data engineering team runs a log-processing cluster on EC2 that reads and writes large files sequentially throughout the day. The workload is throughput-bound, not IOPS-bound, and the team wants the lowest storage cost that still suits frequently accessed data. Which EBS volume type should they choose for the data volumes?',
      options: [
        'Cold HDD (sc1)',
        'Throughput Optimized HDD (st1)',
        'Provisioned IOPS SSD (io2)',
        'General Purpose SSD (gp3)'
      ],
      correctAnswer: 1,
      explanation: 'st1 is a low-cost HDD volume designed for frequently accessed, throughput-intensive sequential workloads such as log processing, big data, and data warehouses. sc1 is cheaper but intended for infrequently accessed cold data, while io2 and gp3 are SSD types priced for random IOPS performance that this workload does not need.'
    },
    {
      id: 'perf6',
      question: 'A company runs a distributed NoSQL database on a fleet of EC2 instances. The database replicates every write to three nodes, so losing a single node is acceptable. The team needs the lowest possible latency and highest random I/O for temporary and replicated data at the lowest cost. Which storage option is the best fit?',
      options: [
        'io2 Block Express volumes attached to each node',
        'An Amazon EFS file system in Max I/O performance mode',
        'Several gp3 volumes striped together as RAID 0',
        'NVMe instance store volumes on I-family instances'
      ],
      correctAnswer: 3,
      explanation: 'Instance store is physically attached to the host, so it delivers the lowest latency and very high random I/O at no extra storage charge, and the database replication covers the fact that instance store data does not survive a stop or host failure. io2 Block Express and striped gp3 add network-attached latency and per-GB or per-IOPS charges, and EFS is a shared network file system with far higher latency than local NVMe.'
    },
    {
      id: 'perf7',
      question: 'Hundreds of Linux EC2 instances share an Amazon EFS file system that stores only a few hundred gigabytes. Throughput demand is spiky and unpredictable, and jobs slow down when burst credits run out. The company wants throughput to scale automatically with demand and to pay only for what it uses. Which configuration should the solutions architect choose?',
      options: [
        'Switch the file system to Elastic throughput mode',
        'Switch to Provisioned throughput set to the peak',
        'Keep Bursting throughput and add more stored data',
        'Recreate the file system in Max I/O performance mode'
      ],
      correctAnswer: 0,
      explanation: 'Elastic throughput scales throughput up and down automatically with the workload and bills for the throughput actually used, which suits spiky, unpredictable access to a small file system. Provisioned throughput sized for peak charges for that peak all the time, inflating storage just to earn burst credits is wasteful, and Max I/O is a performance mode for parallelism that does not fix throughput credit exhaustion.'
    },
    {
      id: 'perf8',
      question: 'A genomics company stores input datasets in Amazon S3 and runs short-lived HPC jobs on hundreds of EC2 instances. The jobs need a POSIX file system with sub-millisecond latency and hundreds of GB/s of aggregate throughput, and results must be written back to S3. Which storage solution meets these requirements?',
      options: [
        'Amazon EFS with Provisioned throughput mode',
        'Amazon FSx for Windows File Server with SSD storage',
        'Amazon FSx for Lustre linked to the S3 bucket',
        'Amazon S3 File Gateway mounted on each instance'
      ],
      correctAnswer: 2,
      explanation: 'FSx for Lustre is a parallel file system built for HPC and ML, and a data repository association lets it lazily load objects from S3 and export results back to S3. EFS is a general-purpose NFS file system without Lustre-level parallel throughput, FSx for Windows File Server targets SMB Windows workloads, and S3 File Gateway is a hybrid cache for on-premises clients rather than an HPC scratch file system.'
    },
    {
      id: 'perf9',
      question: 'A company is migrating an on-premises NetApp storage array to AWS. Linux servers access the data over NFS and Windows servers access the same volumes over SMB, and the storage team relies on SnapMirror replication and storage efficiency features. The company wants to migrate without changing its tools. Which AWS service should it use?',
      options: [
        'Amazon FSx for Windows File Server',
        'Amazon EFS with lifecycle management',
        'Amazon FSx for OpenZFS',
        'Amazon FSx for NetApp ONTAP'
      ],
      correctAnswer: 3,
      explanation: 'FSx for NetApp ONTAP runs the ONTAP file system, supports multiprotocol NFS, SMB, and iSCSI access, and keeps NetApp features such as SnapMirror, FlexClone, and deduplication. FSx for Windows File Server is SMB-focused, EFS supports only NFS for Linux clients, and FSx for OpenZFS is NFS-based and suited to ZFS migrations rather than NetApp tooling.'
    },
    {
      id: 'perf10',
      question: 'A company must move 300 TB of files from an on-premises NFS server to Amazon EFS over its existing Direct Connect link. The transfer must be encrypted in transit, verify data integrity, run on a schedule, and require as little custom scripting as possible. Which solution should the solutions architect recommend?',
      options: [
        'Deploy an AWS DataSync agent on premises and create transfer tasks',
        'Deploy an S3 File Gateway and copy the files through its NFS share',
        'Run rsync scripts from on-premises servers to an EC2 instance',
        'Set up AWS Transfer Family with SFTP and upload with a client'
      ],
      correctAnswer: 0,
      explanation: 'DataSync is a managed online transfer service that copies NFS, SMB, HDFS, and object data directly to EFS, FSx, or S3 with encryption, integrity checks, scheduling, and bandwidth throttling. S3 File Gateway writes to S3 rather than EFS and is meant for ongoing hybrid access, rsync requires custom scripting and validation, and Transfer Family is for partner file exchange over SFTP, FTPS, or FTP rather than bulk migration.'
    },
    {
      id: 'perf11',
      question: 'A research team runs a tightly coupled computational fluid dynamics simulation using MPI across 64 EC2 instances. Performance is limited by inter-node communication latency. Which deployment gives the lowest latency and highest throughput between nodes?',
      options: [
        'A spread placement group with enhanced networking enabled',
        'A partition placement group spanning three Availability Zones',
        'A cluster placement group in one AZ using Elastic Fabric Adapter',
        'Instances in several AZs connected through a Network Load Balancer'
      ],
      correctAnswer: 2,
      explanation: 'A cluster placement group packs instances close together in one Availability Zone for low-latency, high-bandwidth networking, and Elastic Fabric Adapter adds OS-bypass so MPI traffic skips the kernel network stack. Spread and partition groups deliberately place instances on separate hardware, which increases latency, and routing node-to-node traffic across AZs through a load balancer adds latency rather than removing it.'
    },
    {
      id: 'perf12',
      question: 'A company is deploying a 60-node Apache Cassandra cluster on EC2. The database is rack-aware and the team wants to limit the blast radius of a hardware failure by ensuring groups of nodes do not share underlying racks with other groups. Which EC2 placement strategy should they use?',
      options: [
        'A cluster placement group',
        'A partition placement group',
        'A spread placement group',
        'Dedicated Hosts with host affinity'
      ],
      correctAnswer: 1,
      explanation: 'Partition placement groups divide instances into logical partitions that do not share racks, and expose partition information so rack-aware systems like Cassandra, HDFS, and Kafka can place replicas safely at large scale. Cluster groups concentrate instances on close hardware, increasing correlated failure risk, spread groups are limited to seven running instances per AZ per group, and Dedicated Hosts address licensing rather than rack isolation.'
    },
    {
      id: 'perf13',
      question: 'A Lambda function that resizes images is CPU-bound and takes too long to run when configured with 512 MB of memory. The function uses only about 200 MB of memory during execution. What is the most effective way to reduce its execution time?',
      options: [
        'Increase the memory setting of the function',
        'Configure provisioned concurrency for the function',
        'Raise the reserved concurrency of the function',
        'Increase the timeout setting of the function'
      ],
      correctAnswer: 0,
      explanation: 'Lambda allocates CPU power in proportion to configured memory, so raising memory gives a CPU-bound function more compute and often lowers total cost because it runs for less time. Provisioned concurrency only removes cold-start initialization, reserved concurrency only controls how many copies can run at once, and a longer timeout lets the function run longer without making it faster.'
    },
    {
      id: 'perf14',
      question: 'A Java Lambda function built with a large framework takes several seconds to initialize, causing latency spikes for users whenever a new execution environment is created. Traffic is unpredictable, and the company does not want to pay for pre-initialized environments that sit idle. What should the solutions architect do?',
      options: [
        'Configure provisioned concurrency equal to peak traffic',
        'Increase memory to the maximum the function allows',
        'Move the function to Lambda@Edge in edge locations',
        'Enable Lambda SnapStart on published function versions'
      ],
      correctAnswer: 3,
      explanation: 'SnapStart snapshots the initialized execution environment when a version is published and resumes new environments from that snapshot, cutting cold-start latency for Java without paying for idle capacity. Provisioned concurrency also removes cold starts but bills continuously for the environments it keeps warm, more memory speeds initialization only modestly, and Lambda@Edge is for CloudFront request processing, not for fixing initialization time.'
    },
    {
      id: 'perf15',
      question: 'A company is containerizing a set of microservices. The operations team does not want to provision, patch, or scale any EC2 instances, but each service must scale its number of tasks automatically based on load. Which solution meets these requirements with the least operational overhead?',
      options: [
        'Amazon ECS on EC2 with an Auto Scaling group capacity provider',
        'Amazon ECS on AWS Fargate with service auto scaling',
        'Amazon EKS with self-managed node groups and Cluster Autoscaler',
        'Docker installed on EC2 instances in an Auto Scaling group'
      ],
      correctAnswer: 1,
      explanation: 'Fargate is serverless compute for containers, so AWS provisions and patches the underlying capacity while ECS service auto scaling adjusts task counts. ECS on EC2, EKS self-managed nodes, and plain Docker on EC2 all leave the team responsible for the instances, their AMIs, and capacity scaling.'
    },
    {
      id: 'perf16',
      question: 'An online retailer runs its web tier in an EC2 Auto Scaling group. Traffic rises sharply at the same time every morning, and new instances need about 10 minutes to boot and warm up, so users see slow responses until capacity catches up. The existing target tracking policy reacts too late. What should the solutions architect add?',
      options: [
        'A simple scaling policy with a lower CPU alarm threshold',
        'A step scaling policy that adds more instances per alarm',
        'A predictive scaling policy added to target tracking',
        'A longer health check grace period for the Auto Scaling group'
      ],
      correctAnswer: 2,
      explanation: 'Predictive scaling uses historical load to forecast recurring daily and weekly patterns and launches capacity ahead of the forecasted demand, which compensates for long instance warm-up times, while target tracking still handles unexpected changes. Simple and step scaling are still reactive to alarms that fire after load arrives, and a longer grace period only delays health checks rather than adding capacity sooner.'
    },
    {
      id: 'perf17',
      question: 'Every night a company runs thousands of containerized jobs that each take one to three hours and need different amounts of CPU and memory. The company wants job queuing, dependency handling, and automatic provisioning of the right compute, using Spot Instances to minimize cost with little operational effort. Which service should it use?',
      options: [
        'A cron scheduler on one large On-Demand EC2 instance',
        'AWS Step Functions invoking AWS Lambda for each job',
        'AWS Batch with a managed compute environment on Spot',
        'A long-running Amazon EMR cluster with Spark jobs'
      ],
      correctAnswer: 2,
      explanation: 'AWS Batch manages job queues and dependencies and provisions right-sized EC2, Spot, or Fargate capacity for each job, scaling to zero when work finishes. A single cron instance cannot scale or right-size, Lambda functions stop at 15 minutes so multi-hour jobs fail, and an always-on EMR cluster is built for big data frameworks rather than general containerized batch jobs.'
    },
    {
      id: 'perf18',
      question: 'An application uses an Amazon Aurora MySQL cluster with a single writer instance. Heavy reporting queries run during business hours and are slowing down transactional writes. The company wants to isolate the reporting load with minimal application changes. What should the solutions architect do?',
      options: [
        'Add Aurora Replicas and send reporting queries to the reader endpoint',
        'Add an Aurora Replica and send reporting queries to the cluster endpoint',
        'Scale the writer instance up to a larger memory-optimized class',
        'Place Amazon RDS Proxy in front of the writer for the reports'
      ],
      correctAnswer: 0,
      explanation: 'Aurora Replicas share the cluster storage volume, and the reader endpoint load-balances read-only connections across them, so reports no longer compete with writes on the writer. The cluster endpoint always points to the writer, so adding a replica alone does not move the reports; a larger writer still shares one instance between both loads, and RDS Proxy pools connections but does not offload query processing.'
    },
    {
      id: 'perf19',
      question: 'A serverless API uses AWS Lambda functions that connect to an Amazon RDS for PostgreSQL database. During traffic bursts, thousands of concurrent function invocations open new connections, and the database runs out of connections and memory. What is the most effective solution with minimal code changes?',
      options: [
        'Move the database to a larger instance class to raise max_connections',
        'Create read replicas and spread the connections across them',
        'Put an Amazon ElastiCache cluster in front of the database',
        'Use Amazon RDS Proxy to pool and share database connections'
      ],
      correctAnswer: 3,
      explanation: 'RDS Proxy maintains a warm pool of database connections and multiplexes many Lambda connections onto them, protecting the database from connection storms; functions only change their endpoint. A larger instance just moves the ceiling, read replicas do not help write connections and still each face the storm, and ElastiCache requires caching logic and does not manage database connections.'
    },
    {
      id: 'perf20',
      question: 'A SaaS company runs an Aurora PostgreSQL database for an application whose load is highly variable: near idle overnight and with sudden spikes during the day. The team wants database compute to scale automatically in fine-grained increments within seconds, without choosing instance sizes. Which option meets these requirements?',
      options: [
        'Aurora provisioned instances with replica auto scaling',
        'Aurora Serverless v2 instances in the cluster',
        'Amazon RDS for PostgreSQL with storage autoscaling',
        'Amazon DynamoDB tables in on-demand capacity mode'
      ],
      correctAnswer: 1,
      explanation: 'Aurora Serverless v2 scales capacity in fine-grained Aurora Capacity Unit increments as load changes, without instance sizing, while keeping full Aurora PostgreSQL compatibility. Replica auto scaling adds whole read replicas and does not resize the writer, RDS storage autoscaling grows storage rather than compute, and DynamoDB would require rewriting a relational application.'
    },
    {
      id: 'perf21',
      question: 'An order-tracking application stores items in a DynamoDB table with status (PENDING, SHIPPED, or DELIVERED) as the partition key. Writes are throttled during peaks even though the consumed capacity for the whole table is well below what is provisioned. What should the solutions architect do?',
      options: [
        'Switch the table from provisioned to on-demand capacity mode',
        'Add a local secondary index that uses status as its sort key',
        'Add a DynamoDB Accelerator (DAX) cluster in front of the table',
        'Use a high-cardinality partition key such as the order ID'
      ],
      correctAnswer: 3,
      explanation: 'With only three key values, nearly all traffic lands on a few hot partitions, and each partition has its own throughput limit regardless of total table capacity; a high-cardinality key spreads writes evenly. On-demand mode still enforces per-partition limits, an LSI keeps the same partition key and must be defined at table creation, and DAX caches reads but does not reduce write pressure.'
    },
    {
      id: 'perf22',
      question: 'A gaming company stores player profiles in DynamoDB. Read traffic is very heavy and repetitive, and the game requires microsecond read latency. The developers want to add caching with the fewest application code changes. What should the solutions architect recommend?',
      options: [
        'Amazon DynamoDB Accelerator (DAX)',
        'Amazon ElastiCache with a lazy-loading layer',
        'DynamoDB global tables in more Regions',
        'Higher provisioned read capacity units'
      ],
      correctAnswer: 0,
      explanation: 'DAX is an in-memory cache built for DynamoDB that is API-compatible, so the application swaps in the DAX client and gets microsecond reads for cached items. ElastiCache can be fast but requires writing and maintaining caching logic, global tables replicate data across Regions for multi-Region access rather than caching, and more read capacity keeps single-digit millisecond latency instead of microseconds.'
    },
    {
      id: 'perf23',
      question: 'An e-commerce site caches product prices from Amazon RDS in Amazon ElastiCache. Customers must never see a stale price after it is updated, reads far outnumber writes, and a small amount of extra write latency is acceptable. Which caching strategy should be used?',
      options: [
        'Lazy loading with a long TTL on every cached item',
        'Write-through, updating the cache on every database write',
        'Lazy loading with no TTL so items stay in the cache',
        'Memcached with Auto Discovery and client-side hashing'
      ],
      correctAnswer: 1,
      explanation: 'Write-through updates the cache whenever the database is written, so cached prices are always current at the cost of extra write work; adding a TTL also expires items that are never read. Lazy loading only refreshes an item after a cache miss, so a long TTL or no TTL serves stale prices, and Memcached Auto Discovery is a node discovery feature, not a consistency strategy.'
    },
    {
      id: 'perf24',
      question: 'A social media startup needs to power friend-of-a-friend recommendations and fraud ring detection by traversing highly connected relationships many hops deep with low latency. Which AWS database is purpose-built for this workload?',
      options: [
        'Amazon DocumentDB',
        'Amazon Keyspaces',
        'Amazon Neptune',
        'Amazon Timestream'
      ],
      correctAnswer: 2,
      explanation: 'Neptune is a managed graph database that stores relationships natively and traverses them quickly using Gremlin, openCypher, or SPARQL, making it the fit for social graphs and fraud rings. DocumentDB is a MongoDB-compatible document store, Keyspaces is a Cassandra-compatible wide-column store, and Timestream is built for time series data, none of which handle deep multi-hop traversals efficiently.'
    },
    {
      id: 'perf25',
      question: 'A global news site uses Amazon CloudFront. On every viewer request it needs to rewrite URLs and redirect users based on a request header, at millions of requests per second, with sub-millisecond execution and the lowest cost. The logic does not call any external service. Which solution should be used?',
      options: [
        'CloudFront Functions on the viewer request event',
        'Lambda@Edge functions on the origin request event',
        'A Lambda function behind Amazon API Gateway',
        'AWS WAF rules attached to the distribution'
      ],
      correctAnswer: 0,
      explanation: 'CloudFront Functions run lightweight JavaScript at edge locations on viewer request and response events, scale to millions of requests per second, and cost much less than Lambda@Edge, which fits simple header-based rewrites and redirects. Lambda@Edge suits heavier logic that needs network access or origin events, API Gateway adds a full round trip to a Region, and WAF filters requests rather than rewriting URLs.'
    },
    {
      id: 'perf26',
      question: 'A gaming company runs UDP-based game servers behind Network Load Balancers in three AWS Regions. Players need two fixed IP addresses to allow-list, traffic should enter the AWS network as close to players as possible, and failover between Regions must happen in seconds without depending on DNS caching. Which service meets these requirements?',
      options: [
        'Amazon CloudFront with the NLBs as custom origins',
        'Amazon Route 53 latency-based routing records',
        'Amazon Route 53 failover routing with health checks',
        'AWS Global Accelerator with endpoint groups per Region'
      ],
      correctAnswer: 3,
      explanation: 'Global Accelerator provides two static anycast IP addresses, onboards TCP and UDP traffic at the nearest edge location onto the AWS backbone, and shifts traffic between Regional endpoints quickly based on health checks. CloudFront is designed for HTTP and HTTPS content delivery, and Route 53 routing policies return different IP addresses through DNS, so clients that cache records fail over slowly and get no static IPs.'
    },
    {
      id: 'perf27',
      question: 'A company transfers several terabytes daily between its data center and a VPC over a Site-to-Site VPN on the internet, and the transfers suffer from unpredictable latency and throughput. The company needs consistent network performance and its security policy requires all traffic to be encrypted. What should the solutions architect recommend?',
      options: [
        'Add more Site-to-Site VPN tunnels over the internet',
        'Provision an AWS Direct Connect connection on its own',
        'An IPsec VPN running over a Direct Connect connection',
        'Route the traffic through AWS Global Accelerator endpoints'
      ],
      correctAnswer: 2,
      explanation: 'Direct Connect provides a dedicated private connection with consistent bandwidth and latency, and running an IPsec VPN over it adds the required encryption. Extra internet VPN tunnels still share the unpredictable internet path, Direct Connect by itself is private but not encrypted by default, and Global Accelerator improves internet traffic to application endpoints rather than providing hybrid site-to-VPC connectivity.'
    },
    {
      id: 'perf28',
      question: 'A company has 40 VPCs across multiple accounts and Regions plus two on-premises data centers connected by VPN. Managing a full mesh of VPC peering connections and route tables has become unmanageable, and some VPCs need to reach on-premises networks through a shared path. What should the solutions architect implement?',
      options: [
        'A full mesh of VPC peering connections managed with CloudFormation',
        'AWS Transit Gateway as a hub with VPC and VPN attachments',
        'AWS PrivateLink interface endpoints between every pair of VPCs',
        'A virtual private gateway in each VPC using AWS VPN CloudHub'
      ],
      correctAnswer: 1,
      explanation: 'Transit Gateway acts as a regional hub that supports transitive routing between attached VPCs, VPNs, and Direct Connect, with peering between Regions, replacing the mesh with a hub-and-spoke design. VPC peering is not transitive and grows quadratically, PrivateLink exposes individual services rather than routing whole networks, and VPN CloudHub links remote sites to each other through one virtual private gateway rather than interconnecting many VPCs.'
    },
    {
      id: 'perf29',
      question: 'A SaaS provider wants to offer its API privately to hundreds of customer VPCs. Many customers use overlapping CIDR ranges, and the provider must expose only this one service, not its whole network, without traffic crossing the internet. Which solution should it use?',
      options: [
        'AWS PrivateLink endpoint service fronted by a Network Load Balancer',
        'VPC peering connections between the provider and each customer',
        'An AWS Transit Gateway shared with all customer accounts',
        'A public Application Load Balancer restricted by security groups'
      ],
      correctAnswer: 0,
      explanation: 'With PrivateLink, the provider publishes an endpoint service behind an NLB and each customer creates an interface endpoint in its own VPC, which works with overlapping CIDRs and exposes only that service. VPC peering and Transit Gateway both require non-overlapping CIDRs and open network-level routing, and a public ALB sends traffic over the internet.'
    },
    {
      id: 'perf30',
      question: 'A company ingests clickstream events in real time. Three independent applications must each read the same events with dedicated throughput, records with the same session ID must be processed in order, and the company must be able to replay events from the previous several days. Which service should be used?',
      options: [
        'Amazon Data Firehose delivering to Amazon S3',
        'Amazon SQS standard queues with three consumers',
        'Amazon SNS topic fanning out to Lambda functions',
        'Amazon Kinesis Data Streams with enhanced fan-out'
      ],
      correctAnswer: 3,
      explanation: 'Kinesis Data Streams orders records within a shard by partition key, retains data for a configurable period (24 hours by default, extendable) for replay, and enhanced fan-out gives each consumer its own dedicated read throughput. Firehose is a delivery service with no consumer replay, SQS standard queues do not guarantee order and delete messages once processed, and SNS pushes messages without retaining them for replay.'
    },
    {
      id: 'perf31',
      question: 'An application produces streaming log records that must land in Amazon S3 in Apache Parquet format for analysis with Athena, typically within a few minutes. The team does not want to write or operate any consumer applications. Which solution meets these requirements with the least operational overhead?',
      options: [
        'Kinesis Data Streams with KCL consumer applications on EC2',
        'Amazon Data Firehose with record format conversion to Parquet',
        'Amazon MSK with a self-managed Kafka Connect cluster on EC2',
        'Amazon SQS with a scheduled Lambda function batching to S3'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Data Firehose is fully managed, buffers records by size or time, converts JSON records to Parquet or ORC using a schema from the Glue Data Catalog, and delivers them to S3 in near real time. Kinesis Data Streams with KCL, MSK with Kafka Connect, and SQS with Lambda all require building and operating custom consumer or conversion code.'
    },
    {
      id: 'perf32',
      question: 'A company stores terabytes of JSON and CSV application logs in Amazon S3. Analysts occasionally need to run ad hoc SQL queries against them, and the company wants a serverless solution that discovers the schema automatically and charges only when queries run. What should the solutions architect recommend?',
      options: [
        'Load the logs into a provisioned Amazon Redshift cluster nightly',
        'Run Apache Hive on a long-running Amazon EMR cluster',
        'Catalog the data with a Glue crawler and query it with Athena',
        'Import the logs into Amazon RDS for MySQL and query them there'
      ],
      correctAnswer: 2,
      explanation: 'A Glue crawler infers schemas and partitions and registers tables in the Glue Data Catalog, and Athena runs serverless SQL directly on S3 billed by data scanned. A provisioned Redshift cluster and a long-running EMR cluster cost money while idle and need loading or management, and RDS is not designed for terabyte-scale log analytics.'
    },
    {
      id: 'perf33',
      question: 'A company keeps the most recent year of sales data in an Amazon Redshift cluster and ten years of history as Parquet files in Amazon S3. Analysts need to join current and historical data in a single SQL query without loading the history into the cluster. What should the solutions architect do?',
      options: [
        'Load the full history into Redshift with the COPY command',
        'Query history in Athena and join the results in the application',
        'Enable Concurrency Scaling on the Redshift cluster',
        'Create external tables with Redshift Spectrum to query S3'
      ],
      correctAnswer: 3,
      explanation: 'Redshift Spectrum queries data in S3 through external tables defined in the Glue Data Catalog, so a single Redshift query can join local tables with S3 data without loading it. COPY would load ten years of history into paid cluster storage, joining Athena results in application code is complex and slow, and Concurrency Scaling adds capacity for concurrent queries rather than access to S3 data.'
    },
    {
      id: 'perf34',
      question: 'A payments company needs to detect anomalies in a stream of transactions from Kinesis Data Streams using stateful processing such as sliding-window aggregations, with results available within seconds. The team wants a fully managed service and plans to write the logic in SQL or Java. Which service should it use?',
      options: [
        'Amazon Managed Service for Apache Flink',
        'Amazon Data Firehose with a Lambda transformation',
        'AWS Glue ETL jobs scheduled to run every hour',
        'Amazon Athena queries scheduled every minute'
      ],
      correctAnswer: 0,
      explanation: 'Managed Service for Apache Flink runs Flink applications in Java, Scala, Python, or SQL with managed state, windowing, and checkpointing for real-time stream analytics. A Firehose Lambda transformation processes buffered batches without durable windowed state, hourly Glue jobs are batch rather than real time, and Athena queries data at rest in S3 rather than an in-flight stream.'
    }
  ]
};
