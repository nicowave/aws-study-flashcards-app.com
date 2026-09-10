// Module 3: Performance & Scale
// AWS Solutions Architect Associate (SAA-C03)

export const module3 = {
  id: 'module3',
  name: 'Performance & Scale',
  description: 'Storage, compute, database, and network performance',
  icon: '⚡',
  color: '#58a6ff',
  gradient: 'linear-gradient(135deg, #58a6ff 0%, #58a6ff 100%)',
  source: 'SAA-C03 Exam Guide',
  cards: [
    {
      id: 'perf1',
      front: 'EBS volume type ladder?',
      back: 'Four to know\n\n• gp3: default SSD — IOPS/throughput provisioned INDEPENDENT of size (to 16K IOPS)\n• io2: mission-critical — up to 256K IOPS (Block Express), 99.999% durability\n• st1: throughput HDD — big sequential (logs, big data)\n• sc1: cold HDD — cheapest, infrequent access',
      hint: 'gp3 decouples size from speed',
      tags: ['ebs', 'storage'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf2',
      front: 'When does instance store beat EBS?',
      back: 'Ephemeral speed demon\n\n• Physically attached NVMe — millions of IOPS, microsecond latency\n• Data GONE on stop/termination\n• Perfect: scratch space, caches, replicated cluster nodes\n• Never: anything that must survive the instance',
      hint: 'Fast but forgetful',
      tags: ['instance-store', 'storage'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf3',
      front: 'FSx for Windows vs FSx for Lustre?',
      back: 'Business files vs HPC\n\n• Windows File Server: SMB, NTFS ACLs, Active Directory\n• Lustre: parallel HPC file system, 100s of GB/s, sub-ms latency\n• Lustre links to S3 (lazy-load objects as files, write back)\n• "Windows shares" vs "genomics/ML training"',
      hint: 'SMB vs supercomputing',
      tags: ['fsx', 'storage'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf4',
      front: 'S3 large-object upload performance?',
      back: 'Split and parallelize\n\n• Multipart upload: required >5 GB, recommended >100 MB — parallel parts, failed parts retry alone\n• Transfer Acceleration: upload via nearest edge onto AWS backbone (global users)\n• Byte-range fetches: parallel downloads\n• Same-Region EC2→S3? Acceleration buys nothing',
      hint: 'Parts + edges',
      tags: ['s3', 'performance'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf5',
      front: 'CloudFront vs Global Accelerator?',
      back: 'Cache vs pipe\n\n• CloudFront: CACHES HTTP content at edges — static/media/API responses\n• Global Accelerator: routes ANY TCP/UDP onto AWS backbone, 2 static anycast IPs, fast failover\n• Gaming/VoIP/non-HTTP → GA\n• Cacheable web content → CloudFront',
      hint: 'HTTP cache vs TCP highway',
      tags: ['cloudfront', 'networking'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf6',
      front: 'ElastiCache: Redis vs Memcached?',
      back: 'Feature-rich vs dead simple\n\n• Redis: persistence, replication + failover, sorted sets (leaderboards!), pub/sub\n• Memcached: multi-threaded, simple key-value, no persistence/replication\n• Need HA or data structures → Redis\n• Simple cache, max simplicity → Memcached',
      hint: 'Leaderboard = Redis sorted set',
      tags: ['elasticache', 'caching'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf7',
      front: 'DynamoDB DAX: when?',
      back: 'Microsecond reads, zero code surgery\n\n• In-memory cache purpose-built for DynamoDB\n• Microsecond reads for read-heavy/hot-key workloads\n• API-compatible — point the SDK at DAX, done\n• Eventually consistent reads only; writes pass through',
      hint: 'DynamoDB\'s own cache',
      tags: ['dynamodb', 'caching'],
      difficulty: 'advanced'
    },
    {
      id: 'perf8',
      front: 'RDS Proxy: what problem does it solve?',
      back: 'Connection storms\n\n• Pools and shares DB connections\n• Classic fit: Lambda opening a connection per invocation\n• Also faster failover (keeps connections during switchover)\n• IAM auth to the database supported',
      hint: 'Lambda + RDS = Proxy',
      tags: ['rds', 'serverless'],
      difficulty: 'advanced'
    },
    {
      id: 'perf9',
      front: 'Placement groups: three kinds?',
      back: 'Where instances physically sit\n\n• Cluster: packed in one AZ — lowest latency, highest throughput (HPC)\n• Spread: separate hardware, max 7/AZ — critical instances isolated\n• Partition: groups on separate racks — Hadoop/Kafka/Cassandra\n• Latency → cluster; blast radius → spread',
      hint: 'Close, apart, or grouped',
      tags: ['ec2', 'placement'],
      difficulty: 'advanced'
    },
    {
      id: 'perf10',
      front: 'Lambda performance levers?',
      back: 'Memory is the dial\n\n• Memory setting scales CPU proportionally — more memory = faster\n• Provisioned concurrency: pre-warmed instances kill cold starts\n• Reserved concurrency: caps/guarantees a function\'s share\n• Keep deps light; init code runs once per environment',
      hint: 'Memory buys CPU',
      tags: ['lambda', 'serverless'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf11',
      front: 'Purpose-built database picker?',
      back: 'Match engine to access pattern\n\n• Key-value at any scale → DynamoDB\n• Relational OLTP → RDS/Aurora\n• Analytics OLAP → Redshift\n• Graph → Neptune · Time series → Timestream\n• Full-text search → OpenSearch · Sub-ms cache → ElastiCache',
      hint: 'Access pattern first',
      tags: ['databases', 'architecture'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf12',
      front: 'Kinesis Data Streams vs Firehose vs SQS?',
      back: 'Streaming decisions\n\n• Data Streams: real-time, ordered shards, REPLAY, multiple consumers\n• Firehose: fully managed DELIVERY to S3/Redshift/OpenSearch, near-real-time, no replay\n• SQS: decoupling queue — one consumer pool, no replay\n• "Load streaming data into S3, no code" → Firehose',
      hint: 'Replay? Delivery? Decouple?',
      tags: ['kinesis', 'streaming'],
      difficulty: 'advanced'
    },
    {
      id: 'perf13',
      front: 'Athena performance essentials?',
      back: 'Scan less, pay less, run faster\n\n• Serverless SQL directly on S3, priced per data scanned\n• Partition data (by date etc.) to prune scans\n• Columnar formats (Parquet/ORC) + compression\n• Glue Data Catalog holds the schemas',
      hint: 'Parquet + partitions',
      tags: ['athena', 'analytics'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf14',
      front: 'VPC peering vs Transit Gateway?',
      back: 'Pairs vs hub\n\n• Peering: 1-to-1, NOT transitive — N VPCs need N(N-1)/2 connections\n• Transit Gateway: hub-and-spoke, transitive, attaches VPCs + VPN + Direct Connect\n• Few VPCs, simple → peering (no hourly cost)\n• Many VPCs/hybrid → TGW',
      hint: 'Peering isn\'t transitive',
      tags: ['vpc', 'networking'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf15',
      front: 'Direct Connect vs Site-to-Site VPN?',
      back: 'Dedicated line vs quick tunnel\n\n• Direct Connect: private physical link — consistent latency/bandwidth, weeks to provision\n• VPN: IPsec over internet — up in hours, ~1.25 Gbps/tunnel, variable latency\n• DX + VPN backup = resilient hybrid\n• "Consistent network performance" → DX',
      hint: 'Weeks vs hours',
      tags: ['direct-connect', 'hybrid'],
      difficulty: 'intermediate'
    },
    {
      id: 'perf16',
      front: 'EFS performance modes?',
      back: 'Two dials\n\n• General Purpose: lowest latency (default, most apps)\n• Max I/O: higher aggregate throughput, more latency — massive parallel clients\n• Throughput: Elastic (default, spiky) / Provisioned (guaranteed)\n• EFS-IA storage class cuts cost for cold files',
      hint: 'Latency vs parallelism',
      tags: ['efs', 'performance'],
      difficulty: 'advanced'
    }
  ]
};
