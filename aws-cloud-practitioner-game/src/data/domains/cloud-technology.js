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
    }
  ]
};
