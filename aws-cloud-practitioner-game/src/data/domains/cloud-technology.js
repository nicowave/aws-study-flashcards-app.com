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
        'A database service',
        'A virtual server in the cloud that provides resizable compute capacity',
        'A storage service',
        'A content delivery network'
      ],
      correctAnswer: 1,
      explanation: 'Amazon EC2 (Elastic Compute Cloud) provides resizable virtual servers (instances) in the cloud. You can choose the instance type, operating system, and configure networking and storage.'
    },
    {
      id: 'ct2',
      question: 'What is Amazon S3?',
      options: [
        'A compute service',
        'A relational database',
        'An object storage service with virtually unlimited storage capacity',
        'A virtual private network'
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
        'A virtual machine service',
        'A serverless compute service that runs code without provisioning servers',
        'A container orchestration service',
        'A load balancing service'
      ],
      correctAnswer: 1,
      explanation: 'AWS Lambda is a serverless compute service that lets you run code without provisioning or managing servers. You pay only for the compute time you consume.'
    },
    {
      id: 'ct5',
      question: 'What is Amazon VPC?',
      options: [
        'A virtual private cloud that lets you launch AWS resources in a logically isolated network',
        'A VPN service',
        'A content delivery network',
        'A database service'
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
        'A firewall service',
        'A content delivery network (CDN) that delivers content with low latency',
        'A DNS service',
        'A compute service'
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
        'Load balancing',
        'DNS web service and domain registration',
        'Content delivery',
        'Data warehousing'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Route 53 is a highly available and scalable DNS web service. It routes end users to Internet applications and can also register domain names.'
    },
    {
      id: 'ct10',
      question: 'What is Elastic Load Balancing (ELB)?',
      options: [
        'A service that automatically distributes incoming traffic across multiple targets',
        'A storage service',
        'A database service',
        'A monitoring service'
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
        'An object storage service',
        'Block storage volumes for use with EC2 instances',
        'A file storage service',
        'A backup service'
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
        'A container service',
        'A service for deploying and scaling web applications without managing infrastructure',
        'A serverless compute service',
        'A database service'
      ],
      correctAnswer: 1,
      explanation: 'AWS Elastic Beanstalk is a service for deploying and scaling web applications. You simply upload your code, and Elastic Beanstalk automatically handles deployment, capacity provisioning, and load balancing.'
    },
    {
      id: 'ct15',
      question: 'What is Amazon Redshift used for?',
      options: [
        'Real-time data streaming',
        'Data warehousing and analytics',
        'Object storage',
        'Container orchestration'
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
        'A queueing service',
        'A pub/sub messaging service for sending notifications',
        'A streaming service',
        'A database service'
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
        'A monitoring service',
        'An infrastructure as code service for provisioning AWS resources',
        'A compute service',
        'A security service'
      ],
      correctAnswer: 1,
      explanation: 'AWS CloudFormation is an infrastructure as code service that allows you to model and provision AWS resources using templates. It automates and standardizes resource deployment.'
    },
    {
      id: 'ct20',
      question: 'What is Amazon Aurora?',
      options: [
        'A NoSQL database',
        'A MySQL and PostgreSQL-compatible relational database with improved performance',
        'A data warehouse',
        'A graph database'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Aurora is a MySQL and PostgreSQL-compatible relational database that combines the performance and availability of high-end commercial databases with the simplicity and cost-effectiveness of open-source databases.'
    }
  ]
};
