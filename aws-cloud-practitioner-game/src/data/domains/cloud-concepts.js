// Domain 1: Cloud Concepts (24% of exam)
// CLF-C02 Exam Content

export const cloudConcepts = {
  id: 'cloud-concepts',
  name: 'Cloud Concepts',
  icon: '☁️',
  weight: '24%',
  color: '#3fb950',
  description: 'AWS Cloud value proposition, cloud economics, and cloud architecture design principles',
  questions: [
    {
      id: 'cc1',
      question: 'What are the six advantages of cloud computing according to AWS?',
      options: [
        'Trade fixed expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop spending money on data centers, go global in minutes',
        'Lower costs, better security, more features, faster deployment, easier management, better support',
        'Free tier, pay-as-you-go, reserved instances, spot instances, savings plans, enterprise discounts',
        'EC2, S3, RDS, Lambda, CloudFront, Route 53'
      ],
      correctAnswer: 0,
      explanation: 'AWS lists six advantages: (1) Trade fixed expense for variable expense, (2) Benefit from massive economies of scale, (3) Stop guessing capacity, (4) Increase speed and agility, (5) Stop spending money running and maintaining data centers, (6) Go global in minutes.'
    },
    {
      id: 'cc2',
      question: 'What does "elasticity" mean in cloud computing?',
      options: [
        'The ability to recover from failures automatically',
        'The ability to acquire resources when needed and release them when no longer needed',
        'The ability to run applications in multiple regions',
        'The ability to encrypt data at rest and in transit'
      ],
      correctAnswer: 1,
      explanation: 'Elasticity is the ability to automatically scale resources up or down based on demand. You acquire resources when you need them and release them when you don\'t, paying only for what you use.'
    },
    {
      id: 'cc3',
      question: 'Which cloud computing model provides the MOST control over the underlying infrastructure?',
      options: [
        'Software as a Service (SaaS)',
        'Platform as a Service (PaaS)',
        'Infrastructure as a Service (IaaS)',
        'Function as a Service (FaaS)'
      ],
      correctAnswer: 2,
      explanation: 'IaaS provides the most control over IT resources. You manage the OS, applications, and data while AWS manages the hardware, networking, and virtualization. Examples include EC2 and EBS.'
    },
    {
      id: 'cc4',
      question: 'What is the AWS Well-Architected Framework?',
      options: [
        'A billing management tool',
        'A set of best practices and guidelines for building secure, high-performing, resilient, and efficient infrastructure',
        'A migration service for moving to AWS',
        'A certification program for AWS architects'
      ],
      correctAnswer: 1,
      explanation: 'The AWS Well-Architected Framework provides best practices across six pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.'
    },
    {
      id: 'cc5',
      question: 'What is the difference between High Availability and Fault Tolerance?',
      options: [
        'They mean the same thing',
        'High Availability minimizes downtime; Fault Tolerance means zero downtime during failures',
        'Fault Tolerance is cheaper than High Availability',
        'High Availability requires multiple regions; Fault Tolerance requires multiple accounts'
      ],
      correctAnswer: 1,
      explanation: 'High Availability (HA) means the system remains accessible with minimal downtime. Fault Tolerance (FT) means the system continues operating without any degradation even when components fail. FT typically costs more but provides zero downtime.'
    },
    {
      id: 'cc6',
      question: 'Which pricing model allows you to pay for compute capacity by the hour or second with no long-term commitments?',
      options: [
        'Reserved Instances',
        'Savings Plans',
        'On-Demand Instances',
        'Spot Instances'
      ],
      correctAnswer: 2,
      explanation: 'On-Demand Instances let you pay for compute capacity by the hour or second with no long-term commitments. This is ideal for unpredictable workloads that cannot be interrupted.'
    },
    {
      id: 'cc7',
      question: 'What is the benefit of using multiple Availability Zones?',
      options: [
        'Lower costs',
        'Faster network speeds',
        'High availability and fault tolerance',
        'More storage capacity'
      ],
      correctAnswer: 2,
      explanation: 'Using multiple Availability Zones provides high availability and fault tolerance. If one AZ fails, your application can continue running in another AZ with minimal or no interruption.'
    },
    {
      id: 'cc8',
      question: 'What does "pay-as-you-go" pricing mean?',
      options: [
        'You pay a fixed monthly fee regardless of usage',
        'You pay only for the resources you actually use',
        'You pay upfront for a year of service',
        'You pay based on your company size'
      ],
      correctAnswer: 1,
      explanation: 'Pay-as-you-go means you only pay for the individual services you need, for as long as you use them, without requiring long-term contracts or complex licensing.'
    },
    {
      id: 'cc9',
      question: 'Which type of cloud deployment model runs infrastructure in a customer\'s own data center using AWS tools?',
      options: [
        'Public cloud',
        'Private cloud (on-premises)',
        'Hybrid cloud',
        'Multi-cloud'
      ],
      correctAnswer: 1,
      explanation: 'Private cloud (on-premises) deployment runs infrastructure in your own data center. AWS provides tools like AWS Outposts to bring AWS services to your on-premises environment.'
    },
    {
      id: 'cc10',
      question: 'What is the main benefit of "economies of scale" in cloud computing?',
      options: [
        'More features are available',
        'Lower variable costs due to AWS\'s massive scale',
        'Better customer support',
        'Faster application performance'
      ],
      correctAnswer: 1,
      explanation: 'Because AWS aggregates usage from hundreds of thousands of customers, they can achieve higher economies of scale, which translates into lower pay-as-you-go prices for customers.'
    },
    {
      id: 'cc11',
      question: 'What is a Region in AWS?',
      options: [
        'A single data center',
        'A group of Availability Zones in a geographic area',
        'A content delivery network edge location',
        'A virtual private network'
      ],
      correctAnswer: 1,
      explanation: 'An AWS Region is a physical location around the world consisting of multiple, isolated Availability Zones. Each Region is designed to be completely isolated from other Regions for fault tolerance.'
    },
    {
      id: 'cc12',
      question: 'What is an Availability Zone (AZ)?',
      options: [
        'A geographic area containing multiple Regions',
        'One or more data centers with redundant power, networking, and connectivity',
        'A CDN edge location',
        'A virtual network within a Region'
      ],
      correctAnswer: 1,
      explanation: 'An Availability Zone is one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region. AZs are physically separated and connected through low-latency links.'
    },
    {
      id: 'cc13',
      question: 'Which pillar of the Well-Architected Framework focuses on protecting information and systems?',
      options: [
        'Operational Excellence',
        'Security',
        'Reliability',
        'Performance Efficiency'
      ],
      correctAnswer: 1,
      explanation: 'The Security pillar focuses on protecting information, systems, and assets while delivering business value through risk assessments and mitigation strategies.'
    },
    {
      id: 'cc14',
      question: 'What is the benefit of "going global in minutes"?',
      options: [
        'Lower costs in all regions',
        'Deploy applications in multiple Regions around the world with a few clicks',
        'Automatic translation of content',
        'Free data transfer between regions'
      ],
      correctAnswer: 1,
      explanation: 'AWS\'s global infrastructure allows you to deploy your application in multiple Regions around the world with just a few clicks, providing lower latency and better experience for customers worldwide.'
    },
    {
      id: 'cc15',
      question: 'What is the AWS Shared Responsibility Model?',
      options: [
        'A cost-sharing program between AWS and customers',
        'A division of security responsibilities between AWS and the customer',
        'A data backup partnership',
        'A technical support agreement'
      ],
      correctAnswer: 1,
      explanation: 'The Shared Responsibility Model divides security: AWS is responsible for security "of" the cloud (infrastructure), while customers are responsible for security "in" the cloud (data, applications, access management).'
    }
  ]
};
