// Domain 3: Cloud Technology and Services (34% of exam)
// CLF-C02 Exam Content

export const cloudTechnology = {
  id: 'cloud-technology',
  name: 'Cloud Technology & Services',
  icon: '⚙️',
  weight: '34%',
  color: '#a78bfa',
  description: 'AWS services for compute, storage, networking, databases, and other core services',
  questions: [
    {
      id: 'ct1',
      question: 'A team is migrating a legacy application that requires full control over the operating system, installed software, and instance sizing. Which AWS service provides resizable virtual servers for this?',
      options: [
        'AWS Lambda',
        'AWS Elastic Beanstalk',
        'Amazon EC2',
        'Amazon WorkSpaces'
      ],
      correctAnswer: 2,
      explanation: 'Amazon EC2 provides virtual servers (instances) where you choose the operating system, instance type, and software — exactly the control a legacy migration needs. Lambda runs short-lived functions with no OS access, Elastic Beanstalk abstracts away much of the environment management, and WorkSpaces provides virtual desktops for end users, not application servers.',
      sources: [
        { title: 'What is Amazon EC2? – Amazon Elastic Compute Cloud', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct2',
      question: 'A mobile app must durably store millions of user-uploaded photos and retrieve any of them on demand over HTTPS, with no capacity planning. Which service is designed for this?',
      options: [
        'Amazon S3',
        'Amazon EBS',
        'Amazon RDS',
        'AWS Snowball'
      ],
      correctAnswer: 0,
      explanation: 'Amazon S3 stores objects with very high durability and virtually unlimited capacity, and each photo can be retrieved directly over HTTPS. EBS is block storage that must be attached to EC2 instances, RDS is a relational database rather than a media store, and Snowball Edge was a physical device for bulk data transfer (no longer offered to new customers), not ongoing storage.',
      sources: [
        { title: 'Data protection in Amazon S3 – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html', checked: '2026-11-25' },
        { title: 'AWS Snowball Edge availability change – AWS Snowball Edge Developer Guide', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct3',
      question: 'An e-commerce team wants to run a MySQL database with automated backups, patching, and easy scaling — without administering database servers themselves. Which service should they choose?',
      options: [
        'Amazon DynamoDB',
        'Amazon ElastiCache',
        'Amazon Redshift',
        'Amazon RDS'
      ],
      correctAnswer: 3,
      explanation: 'Amazon RDS runs managed relational engines including MySQL, PostgreSQL, MariaDB, Oracle, and SQL Server, handling backups, patching, and scaling for you. DynamoDB is a NoSQL key-value database and cannot run MySQL, ElastiCache is an in-memory cache, and Redshift is a data warehouse for analytics rather than transactional workloads.',
      sources: [
        { title: 'What is Amazon Relational Database Service (Amazon RDS)? – Amazon Relational Database Service', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct4',
      question: 'Whenever a photo lands in an S3 bucket, a team needs code to run for a few seconds to generate a thumbnail — with no servers to manage and no charge while idle. Which compute service fits?',
      options: [
        'Amazon EC2',
        'AWS Lambda',
        'Amazon Lightsail',
        'AWS Elastic Beanstalk'
      ],
      correctAnswer: 1,
      explanation: 'Lambda runs code in response to events like S3 uploads, with no servers to provision and billing only for the time the code actually runs. EC2 and Lightsail instances keep running (and billing) even when idle, and Elastic Beanstalk deploys long-running web application environments rather than short event-driven functions.',
      sources: [
        { title: 'Process Amazon S3 event notifications with Lambda – AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html', checked: '2026-11-25' },
        { title: 'What is AWS Lambda? – AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct5',
      question: 'Before launching its first workloads, a company needs a logically isolated network on AWS where it defines its own IP address ranges, subnets, and route tables. Which service provides this foundation?',
      options: [
        'AWS Direct Connect',
        'Amazon Route 53',
        'Amazon VPC',
        'AWS Site-to-Site VPN'
      ],
      correctAnswer: 2,
      explanation: 'Amazon VPC lets you carve out an isolated virtual network in AWS, choosing your own IP ranges, subnets, route tables, and gateways — the networking foundation other resources launch into. Direct Connect and Site-to-Site VPN connect on-premises networks to AWS, and Route 53 is a DNS service, not a network container.',
      sources: [
        { title: 'What is Amazon VPC? – Amazon Virtual Private Cloud', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct6',
      question: 'A mobile game must store player session state and leaderboard scores for millions of concurrent players, with consistently fast key-value reads and writes at any scale. Which fully managed NoSQL database fits?',
      options: [
        'Amazon DynamoDB',
        'Amazon RDS for MySQL',
        'Amazon Redshift',
        'Amazon Neptune'
      ],
      correctAnswer: 0,
      explanation: 'DynamoDB is a fully managed NoSQL key-value database that delivers single-digit millisecond performance and scales automatically — a classic fit for gaming session state and leaderboards. RDS for MySQL is relational and would need capacity management at this scale, Redshift is an analytics warehouse, and Neptune is a graph database for connected-relationship queries.',
      sources: [
        { title: 'What is Amazon DynamoDB? – Amazon DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct7',
      question: 'A media company streams video files to viewers on several continents and wants copies cached at locations near each viewer to reduce latency. Which service delivers this?',
      options: [
        'AWS Global Accelerator',
        'Amazon Route 53',
        'Amazon S3 Transfer Acceleration',
        'Amazon CloudFront'
      ],
      correctAnswer: 3,
      explanation: 'CloudFront is a content delivery network that caches content at edge locations worldwide, so each viewer is served from a nearby point of presence. Global Accelerator routes traffic onto the AWS backbone but does not cache content, S3 Transfer Acceleration speeds long-distance transfers between clients and an S3 bucket but does not cache copies near viewers, and Route 53 resolves DNS names without caching content.',
      sources: [
        { title: 'What is Amazon CloudFront? – Amazon CloudFront', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', checked: '2026-11-25' },
        { title: 'Configuring fast, secure file transfers using Amazon S3 Transfer Acceleration – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct8',
      question: 'A company has packaged its microservices as Docker containers and needs a managed service to schedule, deploy, and scale those containers across a cluster. Which pair of services provides this orchestration?',
      options: [
        'AWS CodeDeploy and AWS CodePipeline',
        'Amazon ECS and Amazon EKS',
        'Amazon EC2 and Amazon EBS',
        'AWS CloudFormation and AWS Config'
      ],
      correctAnswer: 1,
      explanation: 'Amazon ECS is the AWS-native container orchestrator, and Amazon EKS is managed Kubernetes — both schedule and scale containers across clusters. CodeDeploy and CodePipeline automate software releases rather than run containers, EC2 and EBS are raw compute and block storage, and CloudFormation and Config handle infrastructure templates and configuration tracking.',
      sources: [
        { title: 'What is Amazon Elastic Container Service? – Amazon Elastic Container Service', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html', checked: '2026-11-25' },
        { title: 'What is Amazon EKS? – Amazon EKS', url: 'https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct9',
      question: 'A startup needs to register a new domain name and then route users to its application with DNS records, including health-check-based failover routing. Which service handles both tasks?',
      options: [
        'Amazon Route 53',
        'Amazon CloudFront',
        'Elastic Load Balancing',
        'AWS Global Accelerator'
      ],
      correctAnswer: 0,
      explanation: 'Route 53 is both a domain registrar and a scalable DNS service, offering routing policies such as failover, latency-based, and weighted routing with health checks. CloudFront caches content at edge locations, ELB balances traffic that has already reached your application, and Global Accelerator optimizes network paths — none of them register domains or serve DNS records.',
      sources: [
        { title: 'What is Amazon Route 53? – Amazon Route 53', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', checked: '2026-11-25' },
        { title: 'Creating Amazon Route 53 health checks – Amazon Route 53', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct10',
      question: 'A web application runs on six EC2 instances across two Availability Zones. The team wants a single endpoint that spreads incoming requests across only the healthy instances. Which service provides this?',
      options: [
        'Amazon Route 53',
        'AWS Auto Scaling',
        'Elastic Load Balancing',
        'Amazon API Gateway'
      ],
      correctAnswer: 2,
      explanation: 'Elastic Load Balancing gives the application one endpoint, health-checks each registered target, and distributes requests across healthy instances in multiple Availability Zones. Auto Scaling changes how many instances exist rather than routing individual requests, Route 53 resolves DNS names, and API Gateway publishes and manages APIs rather than balancing traffic to an instance fleet.',
      sources: [
        { title: 'What is Elastic Load Balancing? – Elastic Load Balancing', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct11',
      question: 'A photo-sharing app serves images that are downloaded thousands of times a day, and the team wants millisecond access with no per-retrieval fees. Which S3 storage class fits this hot data?',
      options: [
        'S3 Glacier Flexible Retrieval',
        'S3 Standard',
        'S3 One Zone-Infrequent Access',
        'S3 Glacier Deep Archive'
      ],
      correctAnswer: 1,
      explanation: 'S3 Standard is built for frequently accessed data: millisecond latency, high availability, and no retrieval fees, so heavy read traffic costs nothing extra per download. The Infrequent Access class charges a fee on every retrieval, which adds up fast for hot data, and the Glacier classes are archival tiers with retrieval costs and, in most cases, retrieval delays.',
      sources: [
        { title: 'Understanding and managing Amazon S3 storage classes – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct12',
      question: 'A database running on a single EC2 instance needs storage that survives instance stops, supports point-in-time snapshots, and can grow in size as the data grows. Which storage service fits?',
      options: [
        'Amazon S3',
        'EC2 instance store',
        'Amazon EFS',
        'Amazon EBS'
      ],
      correctAnswer: 3,
      explanation: 'EBS provides persistent block storage volumes that live independently of the instance, can be snapshotted for point-in-time backups, and can be increased in size as needs grow. Instance store is ephemeral and loses data when the instance stops, S3 is object storage that cannot be mounted as a database disk, and EFS is a shared file system rather than the block volume a database engine expects.',
      sources: [
        { title: 'Amazon EBS volumes – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes.html', checked: '2026-11-25' },
        { title: 'Modify an Amazon EBS volume using Elastic Volumes operations – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct13',
      question: 'A checkout service produces orders faster than the fulfillment backend can process them. The team wants a buffer that holds each order until the backend is ready, so spikes never overwhelm it. Which service decouples these components?',
      options: [
        'Amazon SQS',
        'Amazon SNS',
        'Amazon Data Firehose',
        'AWS Step Functions'
      ],
      correctAnswer: 0,
      explanation: 'SQS is a managed message queue: producers enqueue orders at any rate, messages wait durably, and the consumer pulls them at its own pace — the standard pattern for absorbing traffic spikes. SNS pushes messages to subscribers immediately rather than buffering for a slow consumer, Firehose delivers streaming data into storage and analytics destinations, and Step Functions orchestrates workflow steps rather than queuing work.',
      sources: [
        { title: 'What is Amazon Simple Queue Service? – Amazon Simple Queue Service', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct14',
      question: 'Developers want to upload their Node.js web application and have AWS automatically handle capacity provisioning, load balancing, and scaling — while keeping full access to the underlying EC2 resources. Which service does this?',
      options: [
        'AWS Lambda',
        'Amazon Lightsail',
        'AWS Elastic Beanstalk',
        'AWS CloudFormation'
      ],
      correctAnswer: 2,
      explanation: 'Elastic Beanstalk takes uploaded application code and automatically provisions the environment — instances, load balancer, and scaling — while leaving the underlying resources visible and controllable. Lambda runs event-driven functions rather than a full web environment, Lightsail is a simplified fixed-price VPS you manage yourself, and CloudFormation provisions resources from templates you author instead of from application code.',
      sources: [
        { title: 'AWS Elastic Beanstalk FAQs – Amazon Web Services (AWS)', url: 'https://aws.amazon.com/elasticbeanstalk/faqs/', checked: '2026-11-25' },
        { title: 'What is AWS Elastic Beanstalk? – AWS Elastic Beanstalk', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct15',
      question: 'Analysts need to run complex SQL queries that join years of sales history — hundreds of terabytes — to power recurring business reports. Which service is a purpose-built data warehouse for this?',
      options: [
        'Amazon DynamoDB',
        'Amazon ElastiCache',
        'Amazon Kinesis',
        'Amazon Redshift'
      ],
      correctAnswer: 3,
      explanation: 'Redshift is a fully managed, petabyte-scale data warehouse optimized for complex analytical SQL across huge historical datasets, and it integrates with standard BI tools. DynamoDB is a key-value database that does not run analytical SQL joins, ElastiCache is an in-memory cache, and Kinesis ingests streaming data rather than storing and querying a warehouse.',
      sources: [
        { title: 'What is Amazon Redshift? – Amazon Redshift', url: 'https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct16',
      question: 'A rendering farm of many EC2 instances must read and write the same set of project files simultaneously through a standard file system interface. Which storage service fits?',
      options: [
        'Amazon EBS',
        'Amazon EFS',
        'S3 Glacier Deep Archive',
        'EC2 instance store'
      ],
      correctAnswer: 1,
      explanation: 'EFS is a managed, elastic NFS file system that many EC2 instances can mount and access concurrently. An EBS volume attaches to a single instance at a time (outside niche multi-attach cases), Glacier Deep Archive is archival object storage with hours-long retrieval, and instance store is ephemeral per-host storage.',
      sources: [
        { title: 'How Amazon EFS works – Amazon Elastic File System', url: 'https://docs.aws.amazon.com/efs/latest/ug/how-it-works.html', checked: '2026-11-25' },
        { title: 'Attach an EBS volume to multiple EC2 instances using Multi-Attach – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct17',
      question: 'When a deployment finishes, a platform team wants a single event pushed simultaneously to an email list, an SMS group, and several webhook endpoints. Which service does this?',
      options: [
        'Amazon SNS',
        'Amazon SQS',
        'AWS Step Functions',
        'Amazon Kinesis'
      ],
      correctAnswer: 0,
      explanation: 'SNS is pub/sub: one published message fans out to every subscribed endpoint — email, SMS, HTTP webhooks, Lambda, and SQS queues. SQS delivers each message to a polling consumer rather than pushing to many subscribers, Step Functions orchestrates workflows, and Kinesis is for high-volume stream processing.',
      sources: [
        { title: 'What is Amazon SNS? – Amazon Simple Notification Service', url: 'https://docs.aws.amazon.com/sns/latest/dg/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct18',
      question: 'A web application needs EC2 instances added automatically when CPU stays high and removed when traffic drops, so capacity always tracks demand. Which service provides this?',
      options: [
        'Elastic Load Balancing',
        'AWS CloudFormation',
        'Amazon EC2 Auto Scaling',
        'Amazon CloudWatch on its own'
      ],
      correctAnswer: 2,
      explanation: 'Auto Scaling adds and removes instances based on policies tied to metrics like CPU, keeping capacity matched to demand. ELB distributes traffic across whatever instances exist but doesn\'t change their number, CloudFormation provisions infrastructure from templates, and CloudWatch supplies the metrics and alarms that trigger scaling but doesn\'t scale anything by itself.',
      sources: [
        { title: 'What is Amazon EC2 Auto Scaling? – Amazon EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct19',
      question: 'A team must stand up identical dev, staging, and production environments repeatedly, with every AWS resource defined in reviewable template files. Which service is built for this?',
      options: [
        'AWS CloudFormation',
        'AWS Elastic Beanstalk',
        'Amazon CloudWatch',
        'AWS Trusted Advisor'
      ],
      correctAnswer: 0,
      explanation: 'CloudFormation is infrastructure as code: templates declare resources, and identical stacks can be created, updated, and deleted repeatably across environments. Beanstalk manages an application environment without template-level control of arbitrary resources, CloudWatch is monitoring, and Trusted Advisor offers best-practice recommendations.',
      sources: [
        { title: 'What is CloudFormation? – AWS CloudFormation', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct20',
      question: 'A company wants to migrate its self-managed MySQL database to a managed AWS engine that keeps MySQL compatibility while offering substantially higher throughput and storage replicated across Availability Zones. Which service fits?',
      options: [
        'Amazon DynamoDB',
        'Amazon Redshift',
        'Amazon Neptune',
        'Amazon Aurora'
      ],
      correctAnswer: 3,
      explanation: 'Aurora is MySQL- and PostgreSQL-compatible, delivering several times the throughput of standard MySQL with storage automatically replicated across three AZs. DynamoDB is NoSQL with no MySQL compatibility, Redshift is an analytics warehouse, and Neptune is a graph database.',
      sources: [
        { title: 'What is Amazon Aurora? – Amazon Aurora', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html', checked: '2026-11-25' },
        { title: 'Amazon Aurora storage – Amazon Aurora', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct21',
      question: 'A company keeps monthly reports that are accessed rarely but must be available within milliseconds when requested. Which S3 storage class fits best?',
      options: ['S3 Standard', 'S3 Standard-Infrequent Access (Standard-IA)', 'S3 Glacier Deep Archive', 'EBS gp3 volumes'],
      correctAnswer: 1,
      explanation: 'Standard-IA offers the same millisecond access as Standard at lower storage cost, with a per-retrieval fee — ideal for rarely read but immediately needed data. Deep Archive takes hours to retrieve, Standard costs more for rarely accessed data, and EBS is block storage for instances, not object archiving.',
      sources: [
        { title: 'Understanding and managing Amazon S3 storage classes – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct22',
      question: 'Compliance requires keeping records for 10 years; retrieval within 12 hours is acceptable and cost must be minimal. Which storage class fits?',
      options: ['S3 Standard', 'S3 One Zone-IA', 'S3 Glacier Deep Archive', 'Amazon EFS'],
      correctAnswer: 2,
      explanation: 'Glacier Deep Archive is the lowest-cost storage class, designed for long-term retention with retrieval in hours — matching a 10-year compliance archive. Standard and One Zone-IA cost far more for a decade of storage, and EFS is an active file system, not an archive.',
      sources: [
        { title: 'Understanding S3 Glacier storage classes for long-term data storage – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html', checked: '2026-11-25' },
        { title: 'Understanding archive retrieval options – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects-retrieval-options.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct23',
      question: 'A data lake\'s access patterns are unpredictable — some objects are read daily, others untouched for months. Which S3 feature optimizes cost automatically without performance impact?',
      options: ['S3 Intelligent-Tiering', 'S3 Transfer Acceleration', 'S3 Versioning', 'Manually moving objects every week'],
      correctAnswer: 0,
      explanation: 'Intelligent-Tiering monitors each object\'s access pattern and moves it between tiers automatically, with no retrieval fees or performance change. Transfer Acceleration speeds uploads, versioning preserves object history, and manual moves are exactly the toil this class eliminates.',
      sources: [
        { title: 'Managing storage costs with Amazon S3 Intelligent-Tiering – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct24',
      question: 'What is the key difference between EBS volumes and EC2 instance store?',
      options: [
        'EBS is network-attached and persists independently of the instance; instance store is physically attached and its data is lost when the instance stops',
        'Instance store is durable across stops; EBS is ephemeral',
        'EBS can only store databases; instance store only stores logs',
        'They are the same storage with different billing'
      ],
      correctAnswer: 0,
      explanation: 'EBS volumes persist independently — they survive instance stops and can be detached and reattached. Instance store is temporary block storage on the host: very fast, but data vanishes when the instance stops or fails. Neither restricts what type of data you store.',
      sources: [
        { title: 'Data persistence for Amazon EC2 instance store volumes – Amazon Elastic Compute Cloud', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-store-lifetime.html', checked: '2026-11-25' },
        { title: 'Amazon EBS volumes – Amazon EBS', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct25',
      question: 'A team wants to run containers without provisioning or managing any EC2 instances. Which option provides serverless container compute?',
      options: ['AWS Fargate', 'Amazon EC2 with Docker installed', 'AWS Outposts', 'Amazon Lightsail instances'],
      correctAnswer: 0,
      explanation: 'Fargate runs ECS and EKS containers on AWS-managed compute — no instances to patch, scale, or right-size; you pay per task resources. Docker on EC2 leaves the servers to you, Outposts is on-prem hardware, and Lightsail is a simplified VPS.',
      sources: [
        { title: 'Architect for AWS Fargate for Amazon ECS – Amazon Elastic Container Service', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html', checked: '2026-11-25' },
        { title: 'AWS Fargate Pricing', url: 'https://aws.amazon.com/fargate/pricing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct26',
      question: 'Where should a team store and version its private Docker container images for deployment to ECS or EKS?',
      options: ['Amazon Elastic Container Registry (ECR)', 'Amazon EBS snapshots', 'AWS CloudTrail', 'Amazon Route 53'],
      correctAnswer: 0,
      explanation: 'ECR is the managed container image registry, integrated with ECS/EKS permissions and vulnerability scanning. EBS snapshots back up volumes, CloudTrail records API calls, and Route 53 is DNS.',
      sources: [
        { title: 'What is Amazon Elastic Container Registry? – Amazon ECR', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html', checked: '2026-11-25' },
        { title: 'Scan images for software vulnerabilities in Amazon ECR – Amazon ECR', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct27',
      question: 'A solo founder with little AWS experience wants a simple virtual private server with predictable monthly pricing for a small website. Which service targets this use case?',
      options: ['Amazon Lightsail', 'AWS Elastic Beanstalk', 'Amazon EKS', 'AWS Direct Connect'],
      correctAnswer: 0,
      explanation: 'Lightsail bundles a VPS, storage, and networking at a flat monthly price with a simplified console — built for simple workloads and newcomers. Beanstalk manages app environments on standard AWS services, EKS is enterprise Kubernetes, and Direct Connect is network connectivity.',
      sources: [
        { title: 'What is Amazon Lightsail? – Amazon Lightsail', url: 'https://docs.aws.amazon.com/lightsail/latest/userguide/what-is-amazon-lightsail.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct28',
      question: 'An analyst wants to run standard SQL queries directly against CSV and JSON files stored in S3, without loading them into a database. Which service does this?',
      options: ['Amazon Athena', 'Amazon ElastiCache', 'AWS Snowball', 'Amazon SES'],
      correctAnswer: 0,
      explanation: 'Athena is serverless, interactive SQL over data in S3 — pay per query, no infrastructure or ETL loading required. ElastiCache is in-memory caching, Snowball Edge was a physical data-transfer device (no longer offered to new customers), and SES sends email.',
      sources: [
        { title: 'What is Amazon Athena? – Amazon Athena', url: 'https://docs.aws.amazon.com/athena/latest/ug/what-is.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct29',
      question: 'A team needs a managed service to discover, catalog, and transform (ETL) data from multiple sources before analytics. Which service is designed for this?',
      options: ['AWS Glue', 'Amazon GuardDuty', 'AWS Shield', 'Amazon WorkSpaces'],
      correctAnswer: 0,
      explanation: 'Glue provides a serverless data catalog plus ETL jobs to prepare and move data between stores. GuardDuty is threat detection, Shield is DDoS protection, and WorkSpaces provides virtual desktops.',
      sources: [
        { title: 'What is AWS Glue? – AWS Glue', url: 'https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct30',
      question: 'A fleet of IoT sensors emits thousands of events per second that must be ingested and processed in real time. Which service family is built for this streaming workload?',
      options: ['Amazon Kinesis', 'Amazon S3 Glacier', 'AWS Backup', 'Amazon CloudFront'],
      correctAnswer: 0,
      explanation: 'Kinesis ingests and processes high-volume streaming data in real time (Kinesis Data Streams for real-time processing, and Amazon Data Firehose, formerly Kinesis Data Firehose, for delivery to stores). Glacier is archival storage, Backup centralizes backups, and CloudFront delivers cached content outward to users.',
      sources: [
        { title: 'What is Amazon Kinesis Data Streams? – Amazon Kinesis Data Streams', url: 'https://docs.aws.amazon.com/streams/latest/dev/introduction.html', checked: '2026-11-25' },
        { title: 'What is Amazon Data Firehose? – Amazon Data Firehose', url: 'https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct31',
      question: 'Business stakeholders want interactive dashboards and visualizations over data in S3 and Redshift, without managing BI servers. Which service provides this?',
      options: ['AWS Quick Sight (formerly Amazon QuickSight)', 'AWS CloudFormation', 'Amazon SQS', 'AWS IAM'],
      correctAnswer: 0,
      explanation: 'Quick Sight (formerly Amazon QuickSight, now part of AWS Quick) is the managed business intelligence service for interactive dashboards over AWS data sources. CloudFormation is infrastructure as code, SQS is queuing, and IAM is access management.',
      sources: [
        { title: 'What is AWS Quick? – AWS Quick', url: 'https://docs.aws.amazon.com/quick/latest/userguide/what-is.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct32',
      question: 'A read-heavy application repeatedly queries the same product data, overloading its database. Which service adds a microsecond-latency in-memory layer to absorb these reads?',
      options: ['Amazon ElastiCache (Valkey, Memcached, or Redis OSS)', 'Amazon Redshift', 'AWS Storage Gateway', 'Amazon SNS'],
      correctAnswer: 0,
      explanation: 'ElastiCache puts frequently read data in memory, serving repeated reads at microsecond latency and shielding the database. Redshift is an analytics warehouse, Storage Gateway bridges on-prem storage to AWS, and SNS is pub/sub messaging.',
      sources: [
        { title: 'What is Amazon ElastiCache? – Amazon ElastiCache', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html', checked: '2026-11-25' },
        { title: 'Valkey-, Memcached-, and Redis OSS-Compatible Cache – Amazon ElastiCache – AWS', url: 'https://aws.amazon.com/elasticache/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct33',
      question: 'An architecture needs events from multiple applications and SaaS providers routed to different targets based on rules. Which serverless service acts as this central event bus?',
      options: ['Amazon EventBridge', 'Amazon EBS', 'AWS Artifact', 'Amazon Rekognition'],
      correctAnswer: 0,
      explanation: 'EventBridge receives events from AWS services, custom apps, and SaaS partners, then routes them to targets according to rules — the backbone of event-driven architectures. EBS is block storage, Artifact serves compliance docs, and Rekognition analyzes images.',
      sources: [
        { title: 'What Is Amazon EventBridge? – Amazon EventBridge', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html', checked: '2026-11-25' },
        { title: 'Receiving events from a SaaS partner with Amazon EventBridge – Amazon EventBridge', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-saas.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct34',
      question: 'An order process involves multiple Lambda functions that must run in sequence with retries, branching, and error handling. Which service coordinates this workflow visually?',
      options: ['AWS Step Functions', 'Amazon CloudFront', 'AWS WAF', 'Amazon Macie'],
      correctAnswer: 0,
      explanation: 'Step Functions orchestrates multi-step workflows as state machines — sequencing, branching, retrying, and error handling across Lambda and other services. CloudFront, WAF, and Macie address content delivery, web filtering, and data discovery respectively.',
      sources: [
        { title: 'What is Step Functions? – AWS Step Functions', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct35',
      question: 'A team wants to publish, secure, throttle, and monitor REST APIs that front their Lambda functions. Which service provides this?',
      options: ['Amazon API Gateway', 'AWS Direct Connect', 'Amazon EFS', 'AWS Config'],
      correctAnswer: 0,
      explanation: 'API Gateway creates and manages APIs at scale, handling authorization, throttling, caching, and monitoring, and integrates natively with Lambda. Direct Connect is private networking, EFS is file storage, and Config tracks resource configurations.',
      sources: [
        { title: 'What is Amazon API Gateway? – Amazon API Gateway', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html', checked: '2026-11-25' },
        { title: 'Throttle requests to your REST APIs for better throughput in API Gateway – Amazon API Gateway', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct36',
      question: 'Operations wants an alarm when average CPU on a production instance exceeds 80% for five minutes, triggering a notification. Which service provides these metrics and alarms?',
      options: ['Amazon CloudWatch', 'AWS CloudTrail', 'AWS Trusted Advisor', 'Amazon Inspector'],
      correctAnswer: 0,
      explanation: 'CloudWatch collects metrics and logs, and its alarms fire actions (like SNS notifications or Auto Scaling) when thresholds are breached. CloudTrail records API calls for auditing, Trusted Advisor gives best-practice checks, and Inspector scans for vulnerabilities.',
      sources: [
        { title: 'Using Amazon CloudWatch alarms – Amazon CloudWatch', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct37',
      question: 'What is the difference between Amazon CloudWatch and AWS CloudTrail?',
      options: [
        'CloudWatch monitors performance (metrics, logs, alarms); CloudTrail audits activity (who made which API call)',
        'CloudWatch is for billing data; CloudTrail is for DNS records',
        'CloudTrail monitors CPU usage; CloudWatch records API history',
        'They are interchangeable monitoring services'
      ],
      correctAnswer: 0,
      explanation: 'Remember it as "watch performance, trail actions": CloudWatch answers "how is my system performing?", while CloudTrail answers "who did what, when?". The reversed pairing in option three is the classic exam trap.',
      sources: [
        { title: 'What is Amazon CloudWatch? – Amazon CloudWatch', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html', checked: '2026-11-25' },
        { title: 'What Is AWS CloudTrail? – AWS CloudTrail', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct38',
      question: 'An admin must securely open shell sessions on EC2 instances without SSH keys or open inbound ports, and patch the fleet on a schedule. Which service enables both?',
      options: ['AWS Systems Manager (Session Manager and Patch Manager)', 'Amazon Route 53', 'AWS Snowcone', 'Amazon Aurora'],
      correctAnswer: 0,
      explanation: 'Systems Manager\'s Session Manager provides browser/CLI shell access through the SSM agent — no bastion hosts, SSH keys, or open ports — and Patch Manager automates OS patching across the fleet. The others are DNS, a discontinued edge data-transfer device, and a relational database.',
      sources: [
        { title: 'AWS Systems Manager Session Manager – AWS Systems Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html', checked: '2026-11-25' },
        { title: 'AWS Systems Manager Patch Manager – AWS Systems Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct39',
      question: 'A company must move 80 TB of data to AWS from a site with a slow internet link. Which option avoids weeks of uploading?',
      options: [
        'AWS Data Transfer Terminal — bring your own storage devices to an AWS facility and upload over a high-throughput connection',
        'Emailing the data in compressed chunks',
        'S3 Transfer Acceleration over the same slow link',
        'Storing the data in CloudFront edge caches'
      ],
      correctAnswer: 0,
      explanation: 'Data Transfer Terminal is a secure physical AWS location (reserved in the console, currently for Enterprise Support customers) where you plug in your own devices and upload over 100 Gbps fiber, bypassing the slow site link. The older shipped-device option, Snowball Edge, is no longer available to new customers. Transfer Acceleration still depends on the slow uplink, edge caches aren\'t ingestion storage, and email is not a data-transfer service.',
      sources: [
        { title: 'What is Data Transfer Terminal? – AWS Data Transfer Terminal', url: 'https://docs.aws.amazon.com/datatransferterminal/latest/userguide/what-is-dtt.html', checked: '2026-11-25' },
        { title: 'AWS Snowball Edge availability change – AWS Snowball Edge Developer Guide', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct40',
      question: 'An on-premises application must keep using file shares while its data is stored durably in AWS. Which hybrid service bridges this?',
      options: ['AWS Storage Gateway', 'AWS Quick Sight', 'AWS Fargate', 'Amazon Comprehend'],
      correctAnswer: 0,
      explanation: 'Storage Gateway presents local file, volume, or tape interfaces on-premises while persisting the data to AWS storage like S3 — a bridge for hybrid setups. Quick Sight (formerly Amazon QuickSight) is BI, Fargate is container compute, and Comprehend is text analysis.',
      sources: [
        { title: 'AWS Storage Gateway | Amazon Web Services', url: 'https://aws.amazon.com/storagegateway/', checked: '2026-11-25' },
        { title: 'What is Amazon S3 File Gateway – AWS Storage Gateway', url: 'https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct41',
      question: 'A global gaming company needs to improve performance and availability for non-HTTP (TCP/UDP) traffic by routing users onto the AWS network at the nearest edge. Which service does this?',
      options: ['AWS Global Accelerator', 'Amazon S3', 'AWS Glue', 'Amazon RDS'],
      correctAnswer: 0,
      explanation: 'Global Accelerator provides static anycast IPs and routes TCP/UDP traffic onto AWS\'s backbone at the closest edge location, improving latency and failover. CloudFront serves cached HTTP content, while S3, Glue, and RDS are storage, ETL, and database services.',
      sources: [
        { title: 'AWS Global Accelerator FAQs – Amazon Web Services', url: 'https://aws.amazon.com/global-accelerator/faqs/', checked: '2026-11-25' },
        { title: 'What is AWS Global Accelerator? – AWS Global Accelerator', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct42',
      question: 'A social network needs to store and query billions of highly connected relationships ("friends of friends"). Which purpose-built database fits?',
      options: ['Amazon Neptune (graph database)', 'Amazon Redshift', 'Amazon S3', 'Amazon MQ'],
      correctAnswer: 0,
      explanation: 'Neptune is the managed graph database, optimized for traversing relationship-heavy data. Redshift is columnar analytics, S3 is object storage, and MQ is a managed message broker — relationship traversal is what graphs uniquely handle well.',
      sources: [
        { title: 'What Is Amazon Neptune? – Amazon Neptune', url: 'https://docs.aws.amazon.com/neptune/latest/userguide/intro.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct43',
      question: 'A serverless application needs a database with single-digit-millisecond reads at any scale, no servers to manage, and a flexible key-value model. Which service fits?',
      options: ['Amazon DynamoDB', 'Amazon RDS for Oracle', 'Amazon Redshift', 'Amazon EFS'],
      correctAnswer: 0,
      explanation: 'DynamoDB is the serverless key-value/document database with consistent millisecond performance and automatic scaling — the standard pairing with Lambda. RDS runs relational engines on managed instances, Redshift is for analytics, and EFS is file storage.',
      sources: [
        { title: 'What is Amazon DynamoDB? – Amazon DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct44',
      question: 'What is the difference between RDS Multi-AZ deployment and RDS Read Replicas?',
      options: [
        'Multi-AZ provides synchronous standby for high availability and failover; Read Replicas provide asynchronous copies to scale read traffic',
        'Multi-AZ scales reads; Read Replicas provide failover',
        'Both exist only to reduce storage costs',
        'Multi-AZ is for MySQL only; Read Replicas are for PostgreSQL only'
      ],
      correctAnswer: 0,
      explanation: 'A Multi-AZ DB instance deployment maintains a synchronous standby in another AZ that takes over automatically on failure and does not serve reads — availability, not extra read capacity (Multi-AZ DB clusters add readable standbys, but their job is still failover). Read Replicas serve read queries to offload the primary — scaling, not automatic failover. The reversed version is a common exam trap, and both features span multiple engines.',
      sources: [
        { title: 'Multi-AZ DB instance deployments for Amazon RDS – Amazon Relational Database Service', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html', checked: '2026-11-25' },
        { title: 'Working with DB instance read replicas – Amazon Relational Database Service', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct45',
      question: 'A company wants to migrate its on-premises Oracle database to Amazon Aurora with minimal downtime. Which service performs the migration and ongoing replication?',
      options: ['AWS Database Migration Service (DMS)', 'AWS Snowmobile', 'Amazon Kendra', 'AWS Batch'],
      correctAnswer: 0,
      explanation: 'DMS replicates databases to AWS while the source stays live, supporting both same-engine and cross-engine migrations (with DMS Schema Conversion or the Schema Conversion Tool for the latter). Snowmobile was an exabyte-scale physical transfer service that is no longer offered, Kendra is enterprise search, and Batch schedules compute jobs.',
      sources: [
        { title: 'What is AWS Database Migration Service? – AWS Database Migration Service', url: 'https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html', checked: '2026-11-25' },
        { title: 'AWS Snowball Edge availability change – AWS Snowball Edge Developer Guide', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct46',
      question: 'One microservice must reliably hand tasks to a single worker pool, while another event must notify many subscribers at once. Which pairing is correct?',
      options: [
        'SQS for the work queue; SNS for the fan-out notifications',
        'SNS for the work queue; SQS for the fan-out notifications',
        'S3 for both use cases',
        'CloudFront for both use cases'
      ],
      correctAnswer: 0,
      explanation: 'SQS queues hold messages until one consumer processes each — reliable task distribution. SNS topics push each message to every subscriber simultaneously — fan-out. The reversed pairing is the trap; S3 and CloudFront are storage and content delivery.',
      sources: [
        { title: 'What is Amazon Simple Queue Service? – Amazon Simple Queue Service', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html', checked: '2026-11-25' },
        { title: 'What is Amazon SNS? – Amazon Simple Notification Service', url: 'https://docs.aws.amazon.com/sns/latest/dg/welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct47',
      question: 'A VPC has a database that must not be reachable from the internet, but it still needs to download OS updates. What is the standard design?',
      options: [
        'Place the database in a private subnet and route its outbound traffic through a NAT gateway',
        'Place the database in a public subnet with a public IP for updates',
        'Give the database an internet gateway attached directly to the instance',
        'Disable all networking on the database subnet'
      ],
      correctAnswer: 0,
      explanation: 'Private subnets have no route from the internet; a NAT gateway lets instances initiate outbound connections (updates) while blocking inbound access. A public subnet or public IP exposes the database, internet gateways attach to VPCs (not instances), and no networking means no updates.',
      sources: [
        { title: 'NAT gateways – Amazon Virtual Private Cloud', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', checked: '2026-11-25' },
        { title: 'Subnets for your VPC – Amazon Virtual Private Cloud', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct48',
      question: 'What is the function of an Internet Gateway in a VPC?',
      options: [
        'It enables communication between resources in the VPC and the internet',
        'It encrypts all traffic inside the VPC',
        'It converts a VPC into a content delivery network',
        'It provides DNS resolution for private hostnames'
      ],
      correctAnswer: 0,
      explanation: 'An Internet Gateway attaches to a VPC and, combined with route table entries and public IPs, allows internet-bound traffic in and out for public subnets. Encryption, CDN behavior, and private DNS are handled by TLS/KMS, CloudFront, and Route 53 respectively.',
      sources: [
        { title: 'Enable internet access for a VPC using an internet gateway – Amazon Virtual Private Cloud', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct49',
      question: 'A developer with no machine learning expertise must add face detection and object labeling to a photo app. Which service provides this through simple API calls?',
      options: ['Amazon Rekognition', 'Amazon SageMaker training jobs', 'AWS ParallelCluster', 'Amazon Braket'],
      correctAnswer: 0,
      explanation: 'Rekognition is a pre-trained AI service — send images or video via API and receive labels, faces, text, and moderation results with no model building. SageMaker is for teams building custom models, ParallelCluster is HPC, and Braket is quantum computing.',
      sources: [
        { title: 'What is Amazon Rekognition? – Amazon Rekognition', url: 'https://docs.aws.amazon.com/rekognition/latest/dg/what-is.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'ct50',
      question: 'A marketing site consists only of static HTML, CSS, and JavaScript. What is the most cost-effective, lowest-maintenance way to host it globally on AWS?',
      options: [
        'S3 static website hosting with CloudFront distribution in front',
        'A fleet of EC2 instances behind a load balancer in three Regions',
        'An EKS cluster running nginx pods',
        'An RDS database serving the HTML'
      ],
      correctAnswer: 0,
      explanation: 'Static content needs no servers: S3 hosts the files durably for pennies, and CloudFront caches them at edge locations worldwide with HTTPS. EC2 fleets and Kubernetes clusters add cost and patching for no benefit here, and databases don\'t serve static sites.',
      sources: [
        { title: 'Get started with a secure static website – Amazon CloudFront', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/getting-started-secure-static-website-cloudformation-template.html', checked: '2026-11-25' },
        { title: 'Hosting a static website using Amazon S3 – Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html', checked: '2026-11-25' }
      ]
    }
  ]
};
