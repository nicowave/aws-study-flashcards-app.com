// Module 3: Performance & Scale
// Sources: official AWS documentation, linked on each card

export const module3 = {
  id: 'module3',
  name: 'Performance & Scale',
  description: 'Storage, compute, database, and network performance',
  icon: '⚡',
  color: '#a78bfa',
  gradient: 'linear-gradient(135deg, #a78bfa 0%, #a78bfa 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'saa-perf-c1',
      front: 'EBS volume types: gp3 vs io2 Block Express vs st1 vs sc1 - when?',
      back: '• gp3: default SSD for boot and most workloads; 3,000 IOPS and 125 MiB/s baseline, IOPS and throughput set independently of size\n• io2 Block Express: mission-critical databases needing sub-ms latency, highest IOPS, 99.999% durability\n• st1: frequently accessed, sequential, throughput-heavy (logs, big data)\n• sc1: cheapest, cold, infrequently accessed data\nHDD types (st1, sc1) cannot be boot volumes.',
      hint: 'IOPS SSD vs throughput HDD',
      tags: ['ebs', 'storage'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Amazon EBS volume types – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html', checked: '2026-11-25' },
        { title: 'Amazon EBS General Purpose SSD volumes – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c2',
      front: 'Four ways to speed up Amazon S3',
      back: '• Prefixes: request rates scale per prefix (at least 3,500 writes and 11,000 reads per second each), so spread keys across prefixes\n• Multipart upload: parallel parts and retries; recommended above 100 MB, required above 5 GB\n• Transfer Acceleration: long-distance uploads enter at an edge location and ride the AWS backbone\n• Byte-range fetches: parallel GETs of parts of an object, or read just the header',
      hint: 'Prefix, parts, edge, ranges',
      tags: ['s3', 'storage'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Performance design patterns for Amazon S3 – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance-design-patterns.html', checked: '2026-11-25' },
        { title: 'Uploading and copying objects using multipart upload in Amazon S3 – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c3',
      front: 'Which shared file system: EFS or which FSx?',
      back: '• EFS: elastic NFS for Linux, multi-AZ, pay per GB used\n• FSx for Windows File Server: SMB, Active Directory, Windows apps\n• FSx for Lustre: HPC and ML, parallel throughput, links to S3\n• FSx for NetApp ONTAP: NFS + SMB + iSCSI, SnapMirror, NetApp migrations\n• FSx for OpenZFS: NFS, low latency, ZFS migrations and snapshots',
      hint: 'Match the protocol and the source system',
      tags: ['efs', 'fsx', 'storage'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Help Me Choose An Amazon FSx File System | Amazon Web Services', url: 'https://aws.amazon.com/fsx/when-to-choose-fsx/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c4',
      front: 'Instance store: when is the data lost, and when is it the right answer?',
      back: 'Data survives a reboot but is lost when the instance stops, hibernates, terminates, or the underlying host fails.\nRight answer when you need the lowest latency and highest random I/O for buffers, caches, scratch space, or data already replicated across nodes.\nWrong answer for anything that must persist: use EBS (snapshot to S3) instead.',
      hint: 'Reboot yes, stop no',
      tags: ['ec2', 'storage', 'exam-trap'],
      difficulty: 'beginner',
      sources: [
        { title: 'Data persistence for Amazon EC2 instance store volumes – Amazon Elastic Compute Cloud', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-store-lifetime.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c5',
      front: 'Placement groups: cluster vs spread vs partition',
      back: '• Cluster: one AZ, packed together; lowest latency, highest throughput (HPC, MPI; add EFA)\n• Spread: each instance on distinct hardware; max 7 running instances per AZ per group; small critical sets\n• Partition: groups of instances on separate racks, up to 7 partitions per AZ; large rack-aware systems (HDFS, HBase, Cassandra)',
      hint: 'Speed, isolation, racks',
      tags: ['ec2', 'compute'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Placement strategies for your placement groups – Amazon Elastic Compute Cloud', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-strategies.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c6',
      front: 'Lambda performance levers: memory, provisioned concurrency, SnapStart',
      back: '• Memory (128 MB to 10,240 MB) also scales CPU; raise it for CPU-bound functions\n• Provisioned concurrency: keeps environments initialized for predictable low latency; billed while configured\n• SnapStart: resumes from a snapshot of the initialized environment to cut cold starts (Java, Python, .NET)\nYou cannot use SnapStart and provisioned concurrency on the same version.',
      hint: 'CPU follows memory',
      tags: ['lambda', 'compute'],
      difficulty: 'advanced',
      sources: [
        { title: 'Configure Lambda Event Function memory – AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html', checked: '2026-11-25' },
        { title: 'Improving startup performance with Lambda SnapStart – AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c7',
      front: 'RDS read replica vs Multi-AZ standby: which one scales reads?',
      back: 'Read replicas scale reads: asynchronous copies with their own endpoint.\nA Multi-AZ DB instance standby is for high availability only and serves no traffic.\nException: a Multi-AZ DB cluster has two readable standbys, and Aurora Replicas both serve reads and act as failover targets.\nA question about read performance wants read replicas or Aurora Replicas, not plain Multi-AZ.',
      hint: 'HA is not read scaling',
      tags: ['rds', 'aurora', 'database', 'exam-trap'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Multi-AZ DB instance deployments for Amazon RDS – Amazon Relational Database Service', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html', checked: '2026-11-25' },
        { title: 'Multi-AZ DB cluster deployments for Amazon RDS – Amazon Relational Database Service', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c8',
      front: 'DynamoDB: GSI vs LSI, and how to avoid hot partitions',
      back: '• GSI: different partition and sort key, add any time, eventually consistent reads, own capacity\n• LSI: same partition key, different sort key, must be created with the table, supports strongly consistent reads\nHot partitions: each partition has its own throughput limit, even in on-demand mode. Choose a high-cardinality partition key or add a random or calculated suffix (write sharding).',
      hint: 'Global = new key; local = same key',
      tags: ['dynamodb', 'database'],
      difficulty: 'advanced',
      sources: [
        { title: 'Improving data access with secondary indexes in DynamoDB – Amazon DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html', checked: '2026-11-25' },
        { title: 'Using write sharding to distribute workloads evenly in your DynamoDB table – Amazon DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c9',
      front: 'DAX vs ElastiCache: which cache?',
      back: '• DAX: only for DynamoDB, API-compatible, microsecond reads, almost no code changes\n• ElastiCache (Valkey, Redis OSS, Memcached): any data source such as RDS, sessions, leaderboards; you write the caching logic\nTrap: "cache DynamoDB with minimal code changes" is DAX, and DAX does not help an RDS database.',
      hint: 'DynamoDB-only vs any source',
      tags: ['dax', 'elasticache', 'database', 'exam-trap'],
      difficulty: 'intermediate',
      sources: [
        { title: 'In-memory acceleration with DynamoDB Accelerator (DAX) – Amazon DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html', checked: '2026-11-25' },
        { title: 'What is Amazon ElastiCache? – Amazon ElastiCache', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c10',
      front: 'Caching strategies: lazy loading vs write-through vs TTL',
      back: '• Lazy loading (cache-aside): fill the cache on a miss; only requested data is cached, but data can be stale and misses cost three trips\n• Write-through: update the cache on every DB write; never stale, but a write penalty and unused data in cache\n• TTL: expiry on keys; combine with either strategy to limit staleness and cache bloat',
      hint: 'Read path vs write path',
      tags: ['elasticache', 'caching'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Caching strategies for Memcached – Amazon ElastiCache', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c11',
      front: 'Purpose-built databases: match the workload',
      back: '• Graph relationships: Neptune\n• Time series (IoT, metrics): Timestream\n• Cassandra (CQL) workloads: Keyspaces\n• MongoDB-compatible documents: DocumentDB\n• Full-text search and log analytics: OpenSearch Service\n• Data warehouse, complex SQL analytics (OLAP): Redshift\n• Key-value at any scale: DynamoDB',
      hint: 'Data shape decides',
      tags: ['database', 'purpose-built'],
      difficulty: 'beginner',
      sources: [
        { title: 'Choosing an AWS database service – AWS Decision Guides', url: 'https://docs.aws.amazon.com/decision-guides/latest/decision-guides/databases-on-aws-how-to-choose.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c12',
      front: 'CloudFront Functions vs Lambda@Edge',
      back: '• CloudFront Functions: lightweight JavaScript, viewer request and response only, sub-millisecond, lowest cost, at most one network call per invocation (to an origin on the same distribution); header and URL rewrites, redirects, cache key normalization, simple token checks\n• Lambda@Edge: Node.js or Python, viewer and origin events, longer runtime, network access and request body access; calls to external services, heavier logic',
      hint: 'Lightweight vs full Lambda',
      tags: ['cloudfront', 'network'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Differences between CloudFront Functions and Lambda@Edge – Amazon CloudFront', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-choosing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c13',
      front: 'Global Accelerator vs CloudFront: which one?',
      back: '• CloudFront: caches HTTP and HTTPS content at edge locations; static and dynamic web content\n• Global Accelerator: no caching; two static anycast IPs, TCP and UDP, fast health-based Regional failover\nTrap: UDP, gaming, VoIP, static IPs to allow-list, or failover without DNS caching point to Global Accelerator, not CloudFront or Route 53.',
      hint: 'Cache vs static IP and backbone',
      tags: ['global-accelerator', 'cloudfront', 'network', 'exam-trap'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Global Accelerator FAQs – Amazon Web Services', url: 'https://aws.amazon.com/global-accelerator/faqs/', checked: '2026-11-25' },
        { title: 'How AWS Global Accelerator works – AWS Global Accelerator', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c14',
      front: 'Kinesis Data Streams vs Amazon Data Firehose vs Managed Service for Apache Flink',
      back: '• Data Streams: real-time, custom consumers, ordering per partition key, replay within retention\n• Firehose: fully managed delivery to S3, Redshift, OpenSearch, Splunk, HTTP; buffers in near real time; optional Lambda transform and Parquet conversion\n• Flink: stateful stream analytics (windows, joins, anomaly detection) in SQL, Java, Scala, or Python',
      hint: 'Stream, deliver, analyze',
      tags: ['kinesis', 'firehose', 'analytics'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Amazon Kinesis Data Streams terminology and concepts – Amazon Kinesis Data Streams', url: 'https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html', checked: '2026-11-25' },
        { title: 'What is Amazon Data Firehose? – Amazon Data Firehose', url: 'https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'saa-perf-c15',
      front: 'Athena vs Redshift Spectrum vs EMR for data in S3',
      back: '• Athena: serverless ad hoc SQL on S3, pay per data scanned; use Parquet, compression, and partitions to cut cost\n• Redshift Spectrum: join S3 data with tables already in Redshift from one query\n• EMR: managed Spark, Hive, and Presto clusters for large custom processing\nGlue crawlers and the Data Catalog supply the table definitions for all three.',
      hint: 'Ad hoc, warehouse join, big jobs',
      tags: ['athena', 'redshift', 'emr', 'analytics'],
      difficulty: 'advanced',
      sources: [
        { title: 'What is Amazon Athena? – Amazon Athena', url: 'https://docs.aws.amazon.com/athena/latest/ug/what-is.html', checked: '2026-11-25' },
        { title: 'Amazon Redshift Spectrum – Amazon Redshift', url: 'https://docs.aws.amazon.com/redshift/latest/dg/c-using-spectrum.html', checked: '2026-11-25' }
      ]
    }
  ]
};
