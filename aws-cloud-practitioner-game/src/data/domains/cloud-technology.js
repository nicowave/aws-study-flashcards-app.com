// Domain 3: Cloud Technology and Services (34% of exam)
// CLF-C02 Exam Content

export const cloudTechnology = {
  id: 'cloud-technology',
  name: 'Cloud Technology & Services',
  icon: '⚙️',
  weight: '34%',
  color: '#58a6ff',
  description: 'AWS services for compute, storage, networking, databases, and other core services',
  questions: [
    {
      id: 'ct1',
      question: 'What is Amazon EC2?',
      options: [
        'A managed relational database service for running SQL workloads',
        'A virtual server in the cloud that provides resizable compute capacity',
        'A durable object storage service for storing and retrieving any amount of data',
        'A global content delivery network that caches content close to users'
      ],
      correctAnswer: 1,
      explanation: 'Amazon EC2 (Elastic Compute Cloud) provides resizable virtual servers (instances) in the cloud. You can choose the instance type, operating system, and configure networking and storage.'
    },
    {
      id: 'ct2',
      question: 'What is Amazon S3?',
      options: [
        'A compute service that provides resizable virtual servers in the cloud',
        'A managed relational database service supporting multiple database engines',
        'An object storage service with virtually unlimited storage capacity',
        'A block storage service that attaches persistent volumes to instances'
      ],
      correctAnswer: 2,
      explanation: 'Amazon S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance for virtually unlimited storage.'
    },
    {
      id: 'ct3',
      question: 'Which AWS service provides a managed relational database?',
      options: [
        'Amazon DynamoDB',
        'Amazon RDS',
        'Amazon S3',
        'Amazon ElastiCache'
      ],
      correctAnswer: 1,
      explanation: 'Amazon RDS (Relational Database Service) is a managed service that makes it easy to set up, operate, and scale relational databases. It supports MySQL, PostgreSQL, Oracle, SQL Server, and more.'
    },
    {
      id: 'ct4',
      question: 'What is AWS Lambda?',
      options: [
        'A service that provides resizable virtual machines you fully manage',
        'A serverless compute service that runs code without provisioning servers',
        'A managed service for orchestrating and scaling containerized applications',
        'A service that automatically distributes incoming traffic across multiple targets'
      ],
      correctAnswer: 1,
      explanation: 'AWS Lambda is a serverless compute service that lets you run code without provisioning or managing servers. You pay only for the compute time you consume.'
    },
    {
      id: 'ct5',
      question: 'What is Amazon VPC?',
      options: [
        'A virtual private cloud that lets you launch AWS resources in a logically isolated network',
        'A managed service for creating encrypted VPN connections to on-premises networks',
        'A dedicated private network connection between your data center and AWS',
        'A scalable DNS service that routes end users to internet applications'
      ],
      correctAnswer: 0,
      explanation: 'Amazon VPC (Virtual Private Cloud) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network that you define.'
    },
    {
      id: 'ct6',
      question: 'Which AWS service is a fast, fully managed NoSQL database?',
      options: [
        'Amazon RDS',
        'Amazon DynamoDB',
        'Amazon Redshift',
        'Amazon Aurora'
      ],
      correctAnswer: 1,
      explanation: 'Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. It\'s great for applications needing single-digit millisecond latency.'
    },
    {
      id: 'ct7',
      question: 'What is Amazon CloudFront?',
      options: [
        'A web application firewall that filters malicious traffic before it reaches your site',
        'A content delivery network (CDN) that delivers content with low latency',
        'A scalable DNS service that routes users to applications and registers domains',
        'A networking service that improves availability by routing traffic over the AWS global network'
      ],
      correctAnswer: 1,
      explanation: 'Amazon CloudFront is a fast CDN service that securely delivers data, videos, applications, and APIs to customers globally with low latency and high transfer speeds.'
    },
    {
      id: 'ct8',
      question: 'Which service provides managed container orchestration?',
      options: [
        'AWS Lambda',
        'Amazon ECS and Amazon EKS',
        'Amazon EC2',
        'AWS Elastic Beanstalk'
      ],
      correctAnswer: 1,
      explanation: 'Amazon ECS (Elastic Container Service) and Amazon EKS (Elastic Kubernetes Service) are managed container orchestration services. ECS is AWS-native, while EKS is managed Kubernetes.'
    },
    {
      id: 'ct9',
      question: 'What is the purpose of Amazon Route 53?',
      options: [
        'Distributing incoming traffic across multiple targets',
        'DNS web service and domain registration',
        'Caching and delivering content at edge locations',
        'Connecting on-premises networks privately to AWS'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Route 53 is a highly available and scalable DNS web service. It routes end users to Internet applications and can also register domain names.'
    },
    {
      id: 'ct10',
      question: 'What is Elastic Load Balancing (ELB)?',
      options: [
        'A service that automatically distributes incoming traffic across multiple targets',
        'A service that adds or removes EC2 instances automatically based on demand',
        'A service that routes end users to applications using DNS policies',
        'A service that monitors resource utilization and application performance metrics'
      ],
      correctAnswer: 0,
      explanation: 'Elastic Load Balancing automatically distributes incoming application traffic across multiple targets, such as EC2 instances, containers, and IP addresses, in one or more Availability Zones.'
    },
    {
      id: 'ct11',
      question: 'Which AWS storage service is best for frequently accessed data?',
      options: [
        'Amazon S3 Glacier',
        'Amazon S3 Standard',
        'Amazon S3 Glacier Deep Archive',
        'AWS Storage Gateway'
      ],
      correctAnswer: 1,
      explanation: 'Amazon S3 Standard is designed for frequently accessed data. It offers high durability, availability, and performance for general-purpose storage.'
    },
    {
      id: 'ct12',
      question: 'What is Amazon EBS?',
      options: [
        'An object storage service that stores data as objects within buckets',
        'Block storage volumes for use with EC2 instances',
        'A shared file system that multiple EC2 instances can mount at once',
        'A centralized service for automating backups across AWS services'
      ],
      correctAnswer: 1,
      explanation: 'Amazon EBS (Elastic Block Store) provides persistent block storage volumes for use with EC2 instances. EBS volumes persist independently from the life of an instance.'
    },
    {
      id: 'ct13',
      question: 'Which AWS service provides a fully managed message queuing service?',
      options: [
        'Amazon SNS',
        'Amazon SQS',
        'AWS Step Functions',
        'Amazon EventBridge'
      ],
      correctAnswer: 1,
      explanation: 'Amazon SQS (Simple Queue Service) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications.'
    },
    {
      id: 'ct14',
      question: 'What is AWS Elastic Beanstalk?',
      options: [
        'A managed service for running containerized applications on clusters',
        'A service for deploying and scaling web applications without managing infrastructure',
        'A serverless compute service that runs code in response to events',
        'An infrastructure as code service for provisioning resources from templates'
      ],
      correctAnswer: 1,
      explanation: 'AWS Elastic Beanstalk is a service for deploying and scaling web applications. You simply upload your code, and Elastic Beanstalk automatically handles deployment, capacity provisioning, and load balancing.'
    },
    {
      id: 'ct15',
      question: 'What is Amazon Redshift used for?',
      options: [
        'Ingesting and processing real-time streaming data',
        'Data warehousing and analytics',
        'Running key-value NoSQL database workloads',
        'Caching frequently accessed data in memory'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Redshift is a fast, fully managed data warehouse that makes it simple and cost-effective to analyze all your data using standard SQL and existing business intelligence tools.'
    },
    {
      id: 'ct16',
      question: 'Which service provides managed file storage for EC2?',
      options: [
        'Amazon S3',
        'Amazon EFS',
        'Amazon EBS',
        'AWS Storage Gateway'
      ],
      correctAnswer: 1,
      explanation: 'Amazon EFS (Elastic File System) provides simple, scalable, elastic file storage for use with EC2 instances. Multiple instances can access an EFS file system simultaneously.'
    },
    {
      id: 'ct17',
      question: 'What is Amazon SNS?',
      options: [
        'A message queuing service for decoupling application components',
        'A pub/sub messaging service for sending notifications',
        'A service for streaming and processing real-time data at scale',
        'A serverless workflow service that coordinates distributed applications'
      ],
      correctAnswer: 1,
      explanation: 'Amazon SNS (Simple Notification Service) is a fully managed pub/sub messaging service for sending notifications. It can send messages to email, SMS, HTTP endpoints, and other AWS services.'
    },
    {
      id: 'ct18',
      question: 'Which AWS service can automatically scale EC2 capacity?',
      options: [
        'AWS Auto Scaling',
        'Elastic Load Balancing',
        'Amazon CloudWatch',
        'AWS CloudFormation'
      ],
      correctAnswer: 0,
      explanation: 'AWS Auto Scaling monitors your applications and automatically adjusts capacity to maintain steady, predictable performance. It can scale EC2 instances, ECS tasks, DynamoDB tables, and more.'
    },
    {
      id: 'ct19',
      question: 'What is AWS CloudFormation?',
      options: [
        'A monitoring service that collects metrics and logs from AWS resources',
        'An infrastructure as code service for provisioning AWS resources',
        'A service for deploying web applications without managing infrastructure yourself',
        'A service for automating software release pipelines and deployments'
      ],
      correctAnswer: 1,
      explanation: 'AWS CloudFormation is an infrastructure as code service that allows you to model and provision AWS resources using templates. It automates and standardizes resource deployment.'
    },
    {
      id: 'ct20',
      question: 'What is Amazon Aurora?',
      options: [
        'A fully managed NoSQL database delivering single-digit millisecond performance',
        'A MySQL and PostgreSQL-compatible relational database with improved performance',
        'A petabyte-scale data warehouse for analytics using standard SQL',
        'A managed graph database service for highly connected datasets'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Aurora is a MySQL and PostgreSQL-compatible relational database that combines the performance and availability of high-end commercial databases with the simplicity and cost-effectiveness of open-source databases.'
    },
    {
      id: 'ct21',
      question: 'A company keeps monthly reports that are accessed rarely but must be available within milliseconds when requested. Which S3 storage class fits best?',
      options: ['S3 Standard', 'S3 Standard-Infrequent Access (Standard-IA)', 'S3 Glacier Deep Archive', 'EBS gp3 volumes'],
      correctAnswer: 1,
      explanation: 'Standard-IA offers the same millisecond access as Standard at lower storage cost, with a per-retrieval fee — ideal for rarely read but immediately needed data. Deep Archive takes hours to retrieve, Standard costs more for rarely accessed data, and EBS is block storage for instances, not object archiving.'
    },
    {
      id: 'ct22',
      question: 'Compliance requires keeping records for 10 years; retrieval within 12 hours is acceptable and cost must be minimal. Which storage class fits?',
      options: ['S3 Standard', 'S3 One Zone-IA', 'S3 Glacier Deep Archive', 'Amazon EFS'],
      correctAnswer: 2,
      explanation: 'Glacier Deep Archive is the lowest-cost storage class, designed for long-term retention with retrieval in hours — matching a 10-year compliance archive. Standard and One Zone-IA cost far more for a decade of storage, and EFS is an active file system, not an archive.'
    },
    {
      id: 'ct23',
      question: 'A data lake\'s access patterns are unpredictable — some objects are read daily, others untouched for months. Which S3 feature optimizes cost automatically without performance impact?',
      options: ['S3 Intelligent-Tiering', 'S3 Transfer Acceleration', 'S3 Versioning', 'Manually moving objects every week'],
      correctAnswer: 0,
      explanation: 'Intelligent-Tiering monitors each object\'s access pattern and moves it between tiers automatically, with no retrieval fees or performance change. Transfer Acceleration speeds uploads, versioning preserves object history, and manual moves are exactly the toil this class eliminates.'
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
      explanation: 'EBS volumes persist independently — they survive instance stops and can be detached and reattached. Instance store is temporary block storage on the host: very fast, but data vanishes when the instance stops or fails. Neither restricts what type of data you store.'
    },
    {
      id: 'ct25',
      question: 'A team wants to run containers without provisioning or managing any EC2 instances. Which option provides serverless container compute?',
      options: ['AWS Fargate', 'Amazon EC2 with Docker installed', 'AWS Outposts', 'Amazon Lightsail instances'],
      correctAnswer: 0,
      explanation: 'Fargate runs ECS and EKS containers on AWS-managed compute — no instances to patch, scale, or right-size; you pay per task resources. Docker on EC2 leaves the servers to you, Outposts is on-prem hardware, and Lightsail is a simplified VPS.'
    },
    {
      id: 'ct26',
      question: 'Where should a team store and version its private Docker container images for deployment to ECS or EKS?',
      options: ['Amazon Elastic Container Registry (ECR)', 'Amazon EBS snapshots', 'AWS CloudTrail', 'Amazon Route 53'],
      correctAnswer: 0,
      explanation: 'ECR is the managed container image registry, integrated with ECS/EKS permissions and vulnerability scanning. EBS snapshots back up volumes, CloudTrail records API calls, and Route 53 is DNS.'
    },
    {
      id: 'ct27',
      question: 'A solo founder with little AWS experience wants a simple virtual private server with predictable monthly pricing for a small website. Which service targets this use case?',
      options: ['Amazon Lightsail', 'AWS Elastic Beanstalk', 'Amazon EKS', 'AWS Direct Connect'],
      correctAnswer: 0,
      explanation: 'Lightsail bundles a VPS, storage, and networking at a flat monthly price with a simplified console — built for simple workloads and newcomers. Beanstalk manages app environments on standard AWS services, EKS is enterprise Kubernetes, and Direct Connect is network connectivity.'
    },
    {
      id: 'ct28',
      question: 'An analyst wants to run standard SQL queries directly against CSV and JSON files stored in S3, without loading them into a database. Which service does this?',
      options: ['Amazon Athena', 'Amazon ElastiCache', 'AWS Snowball', 'Amazon SES'],
      correctAnswer: 0,
      explanation: 'Athena is serverless, interactive SQL over data in S3 — pay per query, no infrastructure or ETL loading required. ElastiCache is in-memory caching, Snowball is physical data transfer, and SES sends email.'
    },
    {
      id: 'ct29',
      question: 'A team needs a managed service to discover, catalog, and transform (ETL) data from multiple sources before analytics. Which service is designed for this?',
      options: ['AWS Glue', 'Amazon GuardDuty', 'AWS Shield', 'Amazon WorkSpaces'],
      correctAnswer: 0,
      explanation: 'Glue provides a serverless data catalog plus ETL jobs to prepare and move data between stores. GuardDuty is threat detection, Shield is DDoS protection, and WorkSpaces provides virtual desktops.'
    },
    {
      id: 'ct30',
      question: 'A fleet of IoT sensors emits thousands of events per second that must be ingested and processed in real time. Which service family is built for this streaming workload?',
      options: ['Amazon Kinesis', 'Amazon S3 Glacier', 'AWS Backup', 'Amazon CloudFront'],
      correctAnswer: 0,
      explanation: 'Kinesis ingests and processes high-volume streaming data in real time (with Data Streams and Data Firehose for delivery to stores). Glacier is archival storage, Backup centralizes backups, and CloudFront delivers cached content outward to users.'
    },
    {
      id: 'ct31',
      question: 'Business stakeholders want interactive dashboards and visualizations over data in S3 and Redshift, without managing BI servers. Which service provides this?',
      options: ['Amazon QuickSight', 'AWS CloudFormation', 'Amazon SQS', 'AWS IAM'],
      correctAnswer: 0,
      explanation: 'QuickSight is the managed, pay-per-session business intelligence service for dashboards over AWS data sources. CloudFormation is infrastructure as code, SQS is queuing, and IAM is access management.'
    },
    {
      id: 'ct32',
      question: 'A read-heavy application repeatedly queries the same product data, overloading its database. Which service adds a microsecond-latency in-memory layer to absorb these reads?',
      options: ['Amazon ElastiCache (Redis or Memcached)', 'Amazon Redshift', 'AWS Storage Gateway', 'Amazon SNS'],
      correctAnswer: 0,
      explanation: 'ElastiCache puts frequently read data in memory, serving repeated reads at microsecond latency and shielding the database. Redshift is an analytics warehouse, Storage Gateway bridges on-prem storage to AWS, and SNS is pub/sub messaging.'
    },
    {
      id: 'ct33',
      question: 'An architecture needs events from multiple applications and SaaS providers routed to different targets based on rules. Which serverless service acts as this central event bus?',
      options: ['Amazon EventBridge', 'Amazon EBS', 'AWS Artifact', 'Amazon Rekognition'],
      correctAnswer: 0,
      explanation: 'EventBridge receives events from AWS services, custom apps, and SaaS partners, then routes them to targets according to rules — the backbone of event-driven architectures. EBS is block storage, Artifact serves compliance docs, and Rekognition analyzes images.'
    },
    {
      id: 'ct34',
      question: 'An order process involves multiple Lambda functions that must run in sequence with retries, branching, and error handling. Which service coordinates this workflow visually?',
      options: ['AWS Step Functions', 'Amazon CloudFront', 'AWS WAF', 'Amazon Macie'],
      correctAnswer: 0,
      explanation: 'Step Functions orchestrates multi-step workflows as state machines — sequencing, branching, retrying, and error handling across Lambda and other services. CloudFront, WAF, and Macie address content delivery, web filtering, and data discovery respectively.'
    },
    {
      id: 'ct35',
      question: 'A team wants to publish, secure, throttle, and monitor REST APIs that front their Lambda functions. Which service provides this?',
      options: ['Amazon API Gateway', 'AWS Direct Connect', 'Amazon EFS', 'AWS Config'],
      correctAnswer: 0,
      explanation: 'API Gateway creates and manages APIs at scale, handling authorization, throttling, caching, and monitoring, and integrates natively with Lambda. Direct Connect is private networking, EFS is file storage, and Config tracks resource configurations.'
    },
    {
      id: 'ct36',
      question: 'Operations wants an alarm when average CPU on a production instance exceeds 80% for five minutes, triggering a notification. Which service provides these metrics and alarms?',
      options: ['Amazon CloudWatch', 'AWS CloudTrail', 'AWS Trusted Advisor', 'Amazon Inspector'],
      correctAnswer: 0,
      explanation: 'CloudWatch collects metrics and logs, and its alarms fire actions (like SNS notifications or Auto Scaling) when thresholds are breached. CloudTrail records API calls for auditing, Trusted Advisor gives best-practice checks, and Inspector scans for vulnerabilities.'
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
      explanation: 'Remember it as "watch performance, trail actions": CloudWatch answers "how is my system performing?", while CloudTrail answers "who did what, when?". The reversed pairing in option three is the classic exam trap.'
    },
    {
      id: 'ct38',
      question: 'An admin must securely open shell sessions on EC2 instances without SSH keys or open inbound ports, and patch the fleet on a schedule. Which service enables both?',
      options: ['AWS Systems Manager (Session Manager and Patch Manager)', 'Amazon Route 53', 'AWS Snowcone', 'Amazon Aurora'],
      correctAnswer: 0,
      explanation: 'Systems Manager\'s Session Manager provides browser/CLI shell access through the SSM agent — no bastion hosts, SSH keys, or open ports — and Patch Manager automates OS patching across the fleet. The others are DNS, edge data transfer, and a relational database.'
    },
    {
      id: 'ct39',
      question: 'A company must move 80 TB of data to AWS from a site with a slow internet link. Which option avoids weeks of uploading?',
      options: [
        'AWS Snowball — a shipped physical device that is loaded locally and returned to AWS',
        'Emailing the data in compressed chunks',
        'S3 Transfer Acceleration over the same slow link',
        'Storing the data in CloudFront edge caches'
      ],
      correctAnswer: 0,
      explanation: 'The Snow family exists for exactly this: AWS ships a rugged storage device, you copy data locally, and AWS ingests it into S3 on return. Transfer Acceleration still depends on the slow uplink, edge caches aren\'t ingestion storage, and email is not a data-transfer service.'
    },
    {
      id: 'ct40',
      question: 'An on-premises application must keep using file shares while its data is stored durably in AWS. Which hybrid service bridges this?',
      options: ['AWS Storage Gateway', 'Amazon QuickSight', 'AWS Fargate', 'Amazon Comprehend'],
      correctAnswer: 0,
      explanation: 'Storage Gateway presents local file, volume, or tape interfaces on-premises while persisting the data to AWS storage like S3 — a bridge for hybrid setups. QuickSight is BI, Fargate is container compute, and Comprehend is text analysis.'
    },
    {
      id: 'ct41',
      question: 'A global gaming company needs to improve performance and availability for non-HTTP (TCP/UDP) traffic by routing users onto the AWS network at the nearest edge. Which service does this?',
      options: ['AWS Global Accelerator', 'Amazon S3', 'AWS Glue', 'Amazon RDS'],
      correctAnswer: 0,
      explanation: 'Global Accelerator provides static anycast IPs and routes TCP/UDP traffic onto AWS\'s backbone at the closest edge location, improving latency and failover. CloudFront serves cached HTTP content, while S3, Glue, and RDS are storage, ETL, and database services.'
    },
    {
      id: 'ct42',
      question: 'A social network needs to store and query billions of highly connected relationships ("friends of friends"). Which purpose-built database fits?',
      options: ['Amazon Neptune (graph database)', 'Amazon Redshift', 'Amazon S3', 'Amazon MQ'],
      correctAnswer: 0,
      explanation: 'Neptune is the managed graph database, optimized for traversing relationship-heavy data. Redshift is columnar analytics, S3 is object storage, and MQ is a managed message broker — relationship traversal is what graphs uniquely handle well.'
    },
    {
      id: 'ct43',
      question: 'A serverless application needs a database with single-digit-millisecond reads at any scale, no servers to manage, and a flexible key-value model. Which service fits?',
      options: ['Amazon DynamoDB', 'Amazon RDS for Oracle', 'Amazon Redshift', 'Amazon EFS'],
      correctAnswer: 0,
      explanation: 'DynamoDB is the serverless key-value/document database with consistent millisecond performance and automatic scaling — the standard pairing with Lambda. RDS runs relational engines on managed instances, Redshift is for analytics, and EFS is file storage.'
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
      explanation: 'Multi-AZ maintains a synchronous standby in another AZ that takes over automatically on failure — availability, not extra read capacity. Read Replicas serve read queries to offload the primary — scaling, not automatic failover. The reversed version is a common exam trap, and both features span multiple engines.'
    },
    {
      id: 'ct45',
      question: 'A company wants to migrate its on-premises Oracle database to Amazon Aurora with minimal downtime. Which service performs the migration and ongoing replication?',
      options: ['AWS Database Migration Service (DMS)', 'AWS Snowmobile', 'Amazon Kendra', 'AWS Batch'],
      correctAnswer: 0,
      explanation: 'DMS replicates databases to AWS while the source stays live, supporting both same-engine and cross-engine migrations (with the Schema Conversion Tool for the latter). Snowmobile moves exabyte-scale raw data, Kendra is enterprise search, and Batch schedules compute jobs.'
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
      explanation: 'SQS queues hold messages until one consumer processes each — reliable task distribution. SNS topics push each message to every subscriber simultaneously — fan-out. The reversed pairing is the trap; S3 and CloudFront are storage and content delivery.'
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
      explanation: 'Private subnets have no route from the internet; a NAT gateway lets instances initiate outbound connections (updates) while blocking inbound access. A public subnet or public IP exposes the database, internet gateways attach to VPCs (not instances), and no networking means no updates.'
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
      explanation: 'An Internet Gateway attaches to a VPC and, combined with route table entries and public IPs, allows internet-bound traffic in and out for public subnets. Encryption, CDN behavior, and private DNS are handled by TLS/KMS, CloudFront, and Route 53 respectively.'
    },
    {
      id: 'ct49',
      question: 'A developer with no machine learning expertise must add face detection and object labeling to a photo app. Which service provides this through simple API calls?',
      options: ['Amazon Rekognition', 'Amazon SageMaker training jobs', 'AWS ParallelCluster', 'Amazon Braket'],
      correctAnswer: 0,
      explanation: 'Rekognition is a pre-trained AI service — send images or video via API and receive labels, faces, text, and moderation results with no model building. SageMaker is for teams building custom models, ParallelCluster is HPC, and Braket is quantum computing.'
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
      explanation: 'Static content needs no servers: S3 hosts the files durably for pennies, and CloudFront caches them at edge locations worldwide with HTTPS. EC2 fleets and Kubernetes clusters add cost and patching for no benefit here, and databases don\'t serve static sites.'
    }
  ]
};
