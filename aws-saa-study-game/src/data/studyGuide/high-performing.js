// Domain 3: Design High-Performing Architectures (24%)
export const highPerformingGuide = {
  id: 'high-performing',
  name: 'Design High-Performing Architectures',
  icon: '⚡',
  color: '#58a6ff',
  weight: '24%',
  description: 'Choose and tune storage, compute, databases, networking, and data pipelines so a workload meets its performance and scaling targets. Most questions give you a bottleneck and ask which service or setting removes it.',
  sections: [
    {
      id: 'perfs1',
      title: 'Block and Object Storage Performance',
      content: [
        { type: 'paragraph', text: 'Start every storage question by naming the access pattern: random small I/O (databases), large sequential reads and writes (logs, big data), shared file access, or object access over HTTP. The pattern picks the storage family; the constraint (latency, throughput, durability, cost) picks the option inside it.' },
        { type: 'awsService', name: 'Amazon S3', description: 'Object storage with strong read-after-write consistency. Request throughput scales per prefix, at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per partitioned prefix, so spreading keys across prefixes multiplies throughput.' },
        { type: 'bulletList', title: 'S3 performance techniques', items: [
          'Multipart upload: uploads parts in parallel and retries only failed parts. Recommended above 100 MB and required above 5 GB, the single PUT limit.',
          'S3 Transfer Acceleration: clients upload to the nearest edge location and data travels the AWS backbone to the bucket. Use it for long-distance uploads to a single bucket.',
          'Byte-range fetches: GET requests with a Range header pull specific parts of an object, either in parallel for speed or to read only a header.',
          'CloudFront in front of S3: caches frequently read objects at edge locations and reduces load on the bucket.'
        ]},
        { type: 'table', headers: ['EBS type', 'Media', 'Best for', 'Key facts'], rows: [
          ['gp3', 'SSD', 'Boot volumes, most apps, dev and test, medium databases', '3,000 IOPS and 125 MiB/s baseline; IOPS and throughput provisioned independently of size; cheaper than gp2'],
          ['io2 Block Express', 'SSD', 'Mission-critical databases (Oracle, SAP HANA, SQL Server)', 'Highest IOPS and throughput, sub-millisecond latency, 99.999% durability, Multi-Attach support'],
          ['st1', 'HDD', 'Frequently accessed sequential workloads: logs, big data, data warehouses', 'Priced and tuned for throughput, not IOPS; cannot be a boot volume'],
          ['sc1', 'HDD', 'Infrequently accessed cold data', 'Lowest cost EBS type; cannot be a boot volume']
        ]},
        { type: 'keyTerm', term: 'Instance store', definition: 'Temporary NVMe or SSD storage physically attached to the host. It gives the lowest latency and very high IOPS at no extra charge, but data is lost when the instance stops, hibernates, terminates, or the host fails. Use it for caches, buffers, scratch data, or data replicated across nodes.' },
        { type: 'keyTerm', term: 'EBS-optimized instances', definition: 'Dedicated bandwidth between the instance and EBS. Volume performance is capped by the instance as well as the volume, so a fast volume on a small instance can still be a bottleneck.' },
        { type: 'examTip', text: 'If a question says "highest durability" or "sub-millisecond latency for a critical database", pick io2 Block Express. If it says "throughput, sequential, lowest cost" pick st1, and if it adds "infrequently accessed" pick sc1. If the data can be lost or is replicated elsewhere, instance store usually wins on performance and cost.' }
      ]
    },
    {
      id: 'perfs2',
      title: 'File, Hybrid, and Data Transfer Storage',
      content: [
        { type: 'paragraph', text: 'Shared file systems are chosen by protocol and by the system being replaced. Hybrid services are chosen by whether the data needs ongoing access from on premises (Storage Gateway) or a one-time or scheduled move (DataSync).' },
        { type: 'awsService', name: 'Amazon EFS', description: 'Managed, elastic NFS file system for Linux that thousands of instances, containers, and Lambda functions can mount at once across AZs. Storage grows and shrinks automatically and lifecycle policies move cold files to cheaper storage classes.' },
        { type: 'comparison', title: 'EFS throughput modes', items: [
          { label: 'Elastic (recommended default)', description: 'Throughput scales automatically with demand and you pay for what you use. Best for spiky or unpredictable workloads.' },
          { label: 'Provisioned', description: 'You set a fixed throughput independent of storage size. Best for steady, known high throughput on a small file system.' },
          { label: 'Bursting', description: 'Throughput scales with the amount of data stored, using burst credits. Can throttle small file systems with heavy use.' }
        ]},
        { type: 'keyTerm', term: 'EFS performance modes', definition: 'General Purpose (default and recommended for almost all workloads, lowest latency) and Max I/O (higher aggregate parallelism for very large, highly parallel workloads, at higher latency).' },
        { type: 'table', headers: ['FSx option', 'Protocols', 'Choose it when'], rows: [
          ['FSx for Windows File Server', 'SMB', 'Windows applications need Active Directory integration, NTFS permissions, or DFS namespaces'],
          ['FSx for Lustre', 'Lustre (POSIX)', 'HPC, ML training, or media rendering needs massive parallel throughput, often linked to an S3 bucket'],
          ['FSx for NetApp ONTAP', 'NFS, SMB, iSCSI', 'Migrating NetApp, multiprotocol access, SnapMirror, cloning, and storage efficiency'],
          ['FSx for OpenZFS', 'NFS', 'Migrating ZFS or Linux file servers that need low latency, snapshots, and clones']
        ]},
        { type: 'comparison', title: 'Hybrid storage and transfer', items: [
          { label: 'S3 File Gateway', description: 'On-premises NFS or SMB share backed by S3 with a local cache. Ongoing hybrid access where files end up as S3 objects.' },
          { label: 'Volume Gateway', description: 'iSCSI block volumes. Cached mode keeps primary data in AWS; stored mode keeps it on premises with asynchronous backups to AWS as EBS snapshots.' },
          { label: 'Tape Gateway', description: 'Virtual tape library for existing backup software, archiving tapes to S3 Glacier storage classes.' },
          { label: 'AWS DataSync', description: 'Managed online transfer from NFS, SMB, HDFS, or object storage to S3, EFS, or FSx, with encryption, integrity checks, scheduling, and throttling.' }
        ]},
        { type: 'examTip', text: 'Match keywords: "Windows, SMB, Active Directory" is FSx for Windows; "HPC, parallel, S3-linked" is FSx for Lustre; "NetApp or multiprotocol" is FSx for ONTAP; "Linux NFS shared across AZs" is EFS. "Migrate or sync files over the network" is DataSync; "keep using it from on premises" is Storage Gateway.' }
      ]
    },
    {
      id: 'perfs3',
      title: 'High-Performing and Elastic Compute',
      content: [
        { type: 'paragraph', text: 'Compute questions ask you to pick the right instance family, place instances for the network pattern, and scale capacity at the right time. Serverless and container options trade control for lower operational overhead.' },
        { type: 'bulletList', title: 'EC2 instance families', items: [
          'General purpose (M, T): balanced CPU and memory; T instances are burstable.',
          'Compute optimized (C): batch processing, gaming servers, HPC, encoding.',
          'Memory optimized (R, X): in-memory databases and caches, real-time big data.',
          'Storage optimized (I, D): high local IOPS or throughput from instance store.',
          'Accelerated computing (P, G, Trn, Inf): GPU or custom chips for ML and graphics.',
          'Graviton (instance types ending in g, such as m7g): AWS Arm processors with better price performance for Linux workloads that can run on Arm.'
        ]},
        { type: 'comparison', title: 'Placement groups', items: [
          { label: 'Cluster', description: 'Instances packed close together in one AZ for the lowest latency and highest bandwidth. Use for tightly coupled HPC and MPI. A single AZ means lower availability.' },
          { label: 'Spread', description: 'Each instance on distinct hardware, up to seven running instances per AZ per group. Use for a small number of critical instances.' },
          { label: 'Partition', description: 'Instances split into partitions that do not share racks, up to seven partitions per AZ. Use for large, rack-aware distributed systems such as HDFS, Cassandra, and Kafka.' }
        ]},
        { type: 'keyTerm', term: 'Enhanced networking and EFA', definition: 'Enhanced networking with the Elastic Network Adapter (ENA) gives higher bandwidth, more packets per second, and lower latency. Elastic Fabric Adapter (EFA) adds OS-bypass for HPC and ML frameworks such as MPI and NCCL. Combine EFA with a cluster placement group for tightly coupled workloads.' },
        { type: 'bulletList', title: 'EC2 Auto Scaling policies', items: [
          'Target tracking: keep a metric such as average CPU at a target value. The default choice.',
          'Step and simple scaling: add or remove capacity when a CloudWatch alarm fires.',
          'Scheduled scaling: change capacity at known times.',
          'Predictive scaling: forecasts recurring patterns from history and launches capacity ahead of demand.',
          'Warm pools: keep pre-initialized instances ready to cut launch time for slow-booting apps.'
        ]},
        { type: 'table', headers: ['Lambda lever', 'What it does', 'When to use it'], rows: [
          ['Memory (128 MB to 10,240 MB)', 'Raises memory and proportional CPU', 'CPU-bound or memory-bound functions run too slowly'],
          ['Provisioned concurrency', 'Keeps environments initialized; billed while configured', 'Predictable, latency-critical traffic that cannot tolerate cold starts'],
          ['SnapStart', 'Resumes from a snapshot of the initialized environment', 'Slow initialization in Java, Python, or .NET with no idle capacity charge for Java'],
          ['Reserved concurrency', 'Guarantees and caps concurrency for one function', 'Protect downstream systems or reserve capacity, not to improve speed']
        ]},
        { type: 'comparison', title: 'Containers and batch', items: [
          { label: 'Amazon ECS', description: 'AWS-native container orchestration. Simplest path for teams without Kubernetes requirements.' },
          { label: 'Amazon EKS', description: 'Managed Kubernetes. Choose when the team already uses Kubernetes or needs portability of Kubernetes tooling.' },
          { label: 'AWS Fargate', description: 'Serverless compute for ECS or EKS tasks; no instances to patch or scale. Lowest operational overhead.' },
          { label: 'AWS Batch', description: 'Queues and runs batch jobs on right-sized EC2, Spot, or Fargate capacity. Use for long-running jobs that exceed the 15-minute Lambda limit.' }
        ]},
        { type: 'examTip', text: '"Least operational overhead for containers" means Fargate. "Lowest latency between nodes" means a cluster placement group, plus EFA for MPI. "Slow Java cold starts without paying for idle capacity" means SnapStart, while "guaranteed warm capacity" means provisioned concurrency.' }
      ]
    },
    {
      id: 'perfs4',
      title: 'High-Performing Databases and Caching',
      content: [
        { type: 'paragraph', text: 'Pick the engine that fits the data model first, then scale it. Relational workloads scale reads with replicas and connections with RDS Proxy; key-value workloads scale with DynamoDB partition design; repeated reads scale with a cache.' },
        { type: 'table', headers: ['Feature', 'Amazon RDS', 'Amazon Aurora'], rows: [
          ['Engines', 'MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2', 'MySQL- and PostgreSQL-compatible'],
          ['Storage', 'EBS volumes per instance', 'Shared cluster volume, six copies across three AZs, grows automatically'],
          ['Read scaling', 'Read replicas with asynchronous replication', 'Up to 15 Aurora Replicas behind a reader endpoint, low replica lag'],
          ['Variable load', 'Choose and resize instance classes', 'Aurora Serverless v2 scales capacity in fine-grained ACU increments'],
          ['Global', 'Cross-Region read replicas', 'Aurora Global Database with fast cross-Region replication']
        ]},
        { type: 'keyTerm', term: 'RDS Proxy', definition: 'A managed connection pool for RDS and Aurora. It absorbs connection storms from Lambda or many app servers, reuses connections, and speeds up failover by keeping client connections open.' },
        { type: 'keyTerm', term: 'Aurora endpoints', definition: 'The cluster (writer) endpoint always points to the primary; the reader endpoint load-balances across replicas; custom endpoints group specific instances, for example for reporting.' },
        { type: 'bulletList', title: 'DynamoDB performance', items: [
          'Partition key design: use a high-cardinality key so traffic spreads evenly; each partition has its own throughput limit even in on-demand mode.',
          'Capacity modes: on-demand for unpredictable or new workloads; provisioned with auto scaling for steady, predictable traffic at lower cost.',
          'GSI: different partition and sort key, can be added any time, eventually consistent reads.',
          'LSI: same partition key with a different sort key, must be created with the table, supports strongly consistent reads.',
          'DAX: API-compatible in-memory cache for microsecond reads with minimal code changes.'
        ]},
        { type: 'comparison', title: 'Caching strategies', items: [
          { label: 'Lazy loading (cache-aside)', description: 'The app reads the cache and fills it from the database on a miss. Only requested data is cached, but data can be stale until it expires.' },
          { label: 'Write-through', description: 'The app writes to the cache whenever it writes to the database. Data is never stale, at the cost of extra write work and caching data that may never be read.' },
          { label: 'TTL', description: 'An expiry on each key. Add it to either strategy to bound staleness and free memory.' }
        ]},
        { type: 'awsService', name: 'Amazon ElastiCache', description: 'Managed in-memory caching with Valkey, Redis OSS, or Memcached. Valkey and Redis OSS add replication, Multi-AZ failover, persistence, and data structures such as sorted sets for leaderboards; Memcached is simple, multithreaded, and has no replication or persistence.' },
        { type: 'table', headers: ['Workload', 'Purpose-built database'], rows: [
          ['Highly connected relationships, social graphs, fraud rings', 'Amazon Neptune'],
          ['Time series from IoT devices and metrics', 'Amazon Timestream'],
          ['Apache Cassandra workloads using CQL', 'Amazon Keyspaces'],
          ['MongoDB-compatible JSON documents', 'Amazon DocumentDB'],
          ['Full-text search and log analytics', 'Amazon OpenSearch Service'],
          ['Petabyte-scale data warehouse and OLAP queries', 'Amazon Redshift']
        ]},
        { type: 'examTip', text: 'Multi-AZ standby instances do not serve reads, so "improve read performance" points to read replicas or Aurora Replicas. "Too many connections from Lambda" is RDS Proxy. "Microsecond reads from DynamoDB with minimal changes" is DAX, while caching an RDS database is ElastiCache.' }
      ]
    },
    {
      id: 'perfs5',
      title: 'High-Performing and Scalable Networks',
      content: [
        { type: 'paragraph', text: 'Network questions are about getting users to the application quickly (edge services), connecting sites to AWS predictably (hybrid links), and connecting VPCs at scale (hub-and-spoke or service endpoints).' },
        { type: 'awsService', name: 'Amazon CloudFront', description: 'Content delivery network that caches content at edge locations. Origins include S3, ALB, EC2, and custom HTTP servers. Use cache policies to control the cache key and Origin Shield to further reduce origin load.' },
        { type: 'comparison', title: 'CloudFront Functions vs Lambda@Edge', items: [
          { label: 'CloudFront Functions', description: 'Lightweight JavaScript on viewer request and response events, sub-millisecond, no network calls, lowest cost. Header and URL rewrites, redirects, cache key normalization.' },
          { label: 'Lambda@Edge', description: 'Node.js or Python on viewer and origin events, longer execution, network and request body access. Use for calls to external services or heavier logic.' }
        ]},
        { type: 'awsService', name: 'AWS Global Accelerator', description: 'Two static anycast IP addresses that bring TCP and UDP traffic onto the AWS backbone at the nearest edge location and route it to healthy Regional endpoints (NLB, ALB, EC2, Elastic IP). No caching. Fast failover that does not depend on DNS.' },
        { type: 'keyTerm', term: 'Route 53 latency-based routing', definition: 'Returns the Regional endpoint with the lowest measured latency for the user. It is DNS-based, so it gives no static IPs and failover is subject to client DNS caching.' },
        { type: 'table', headers: ['Connectivity', 'Use it for', 'Watch out for'], rows: [
          ['Site-to-Site VPN', 'Quick, encrypted hybrid link over the internet', 'Performance varies with the internet path'],
          ['Direct Connect', 'Consistent bandwidth and latency over a private connection', 'Takes time to provision; not encrypted by default (add MACsec or a VPN over it)'],
          ['VPC peering', 'A few VPCs that need full connectivity', 'Not transitive; CIDRs cannot overlap; mesh grows quickly'],
          ['Transit Gateway', 'Many VPCs and on-premises networks through one hub', 'Hourly attachment and per-GB processing charges'],
          ['PrivateLink', 'Exposing one service to many VPCs privately', 'Exposes a single service behind an NLB, not whole networks; works with overlapping CIDRs']
        ]},
        { type: 'examTip', text: '"Static IPs, UDP, or fast Regional failover" means Global Accelerator; "cache content near users" means CloudFront. "Consistent performance plus encryption" means VPN over Direct Connect. "Dozens of VPCs with transitive routing" means Transit Gateway, and "share one service with overlapping CIDRs" means PrivateLink.' }
      ]
    },
    {
      id: 'perfs6',
      title: 'Data Ingestion, Transformation, and Analytics',
      content: [
        { type: 'paragraph', text: 'Analytics pipelines have three stages: ingest (Kinesis, Firehose, MSK, DataSync), transform and catalog (Glue, EMR, Flink), and query or visualize (Athena, Redshift, QuickSight). The exam asks you to pick the managed option that meets the latency and operational overhead constraints.' },
        { type: 'comparison', title: 'Streaming services', items: [
          { label: 'Kinesis Data Streams', description: 'Real-time stream with custom consumers, ordering per partition key, replay within the retention period, and enhanced fan-out for dedicated per-consumer throughput. Provisioned (shards) or on-demand capacity.' },
          { label: 'Amazon Data Firehose', description: 'Fully managed delivery to S3, Redshift, OpenSearch, Splunk, and HTTP endpoints. Buffers by size or time (near real time), with optional Lambda transformation and Parquet or ORC conversion.' },
          { label: 'Managed Service for Apache Flink', description: 'Stateful real-time analytics such as windowed aggregations, joins, and anomaly detection, written in SQL, Java, Scala, or Python.' },
          { label: 'Amazon MSK', description: 'Managed Apache Kafka, including MSK Serverless. Choose it when applications already use Kafka APIs or tooling.' }
        ]},
        { type: 'awsService', name: 'AWS Glue', description: 'Serverless data integration. Crawlers infer schemas and partitions and populate the Glue Data Catalog, a central metastore used by Athena, Redshift Spectrum, and EMR. Glue ETL jobs run serverless Spark to clean and convert data, for example from CSV to Parquet.' },
        { type: 'table', headers: ['Service', 'What it is', 'Choose it when'], rows: [
          ['Amazon Athena', 'Serverless SQL on S3, billed per data scanned', 'Ad hoc queries on a data lake with no infrastructure'],
          ['Amazon Redshift', 'Columnar data warehouse (provisioned or Serverless)', 'Complex, repeated BI queries on large structured data'],
          ['Redshift Spectrum', 'Redshift queries on external tables in S3', 'Joining warehouse tables with data lake files without loading them'],
          ['Amazon EMR', 'Managed Spark, Hive, Presto, and Hadoop', 'Large custom big data processing with framework control'],
          ['AWS Lake Formation', 'Builds and governs data lakes on S3', 'Central fine-grained permissions (table, column, row) across analytics services'],
          ['Amazon QuickSight', 'Serverless BI dashboards', 'Business users need interactive dashboards on these sources']
        ]},
        { type: 'bulletList', title: 'Make data lake queries fast and cheap', items: [
          'Store data in columnar formats such as Parquet or ORC so queries read only the needed columns.',
          'Partition data by commonly filtered columns, such as date, so queries skip irrelevant files.',
          'Compress files and avoid huge numbers of tiny files.'
        ]},
        { type: 'examTip', text: '"Multiple consumers, ordering, replay" means Kinesis Data Streams; "load streaming data into S3 or Redshift with no code" means Firehose; "real-time windowed analytics" means Flink. For data at rest in S3, "serverless ad hoc SQL" is Athena with a Glue crawler, and "join S3 with Redshift tables" is Redshift Spectrum.' }
      ]
    }
  ]
};
