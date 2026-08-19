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
        'Lower total cost of ownership, guaranteed application availability, automatic security compliance, unlimited compute capacity, dedicated hardware for every customer, free premium support',
        'Pay-as-you-go pricing, reserved capacity discounts, spot pricing for spare capacity, volume-based tiering, free tier access for new customers, enterprise agreements',
        'Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability'
      ],
      correctAnswer: 0,
      explanation: 'AWS lists six advantages: (1) Trade fixed expense for variable expense, (2) Benefit from massive economies of scale, (3) Stop guessing capacity, (4) Increase speed and agility, (5) Stop spending money running and maintaining data centers, (6) Go global in minutes.'
    },
    {
      id: 'cc2',
      question: 'What does "elasticity" mean in cloud computing?',
      options: [
        'The ability to recover automatically from infrastructure or component failures',
        'The ability to acquire resources when needed and release them when no longer needed',
        'The ability to handle long-term growth by permanently adding more capacity',
        'The ability to distribute workloads across multiple geographic regions'
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
        'A managed service that automatically audits workloads and remediates configuration issues it finds',
        'A set of best practices and guidelines for building secure, high-performing, resilient, and efficient infrastructure',
        'A collection of pre-built CloudFormation templates for deploying common application architectures',
        'A certification and training program that validates the skills of AWS solutions architects'
      ],
      correctAnswer: 1,
      explanation: 'The AWS Well-Architected Framework provides best practices across six pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.'
    },
    {
      id: 'cc5',
      question: 'What is the difference between High Availability and Fault Tolerance?',
      options: [
        'They are interchangeable terms for the same approach to minimizing downtime',
        'High Availability minimizes downtime; Fault Tolerance means zero downtime during failures',
        'Fault Tolerance is a lower-cost architecture option than High Availability',
        'High Availability guarantees zero downtime; Fault Tolerance only minimizes downtime during failures'
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
        'Reduced infrastructure and data transfer costs',
        'Lower latency for end users in other countries',
        'High availability and fault tolerance',
        'Increased compute and storage capacity limits'
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
        'You pay a discounted rate by committing to consistent usage'
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
        'Higher discounts as your own usage grows over time',
        'Lower variable costs due to AWS\'s massive scale',
        'Priority access to new AWS services and features',
        'Faster application performance during peak demand'
      ],
      correctAnswer: 1,
      explanation: 'Because AWS aggregates usage from hundreds of thousands of customers, they can achieve higher economies of scale, which translates into lower pay-as-you-go prices for customers.'
    },
    {
      id: 'cc11',
      question: 'What is a Region in AWS?',
      options: [
        'A single data center with redundant power and networking',
        'A group of Availability Zones in a geographic area',
        'An edge location used to cache content closer to end users',
        'A logically isolated virtual network that you define in AWS'
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
        'An edge location where CloudFront caches content near users',
        'A logically isolated virtual network defined within a Region'
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
        'Pay identical low prices for services in every AWS Region',
        'Deploy applications in multiple Regions around the world with a few clicks',
        'Applications are replicated automatically to every AWS Region by default',
        'Data transfer between AWS Regions is always free of charge'
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
        'An agreement in which AWS manages all security on behalf of the customer',
        'A framework for dividing operational duties among accounts in an organization'
      ],
      correctAnswer: 1,
      explanation: 'The Shared Responsibility Model divides security: AWS is responsible for security "of" the cloud (infrastructure), while customers are responsible for security "in" the cloud (data, applications, access management).'
    }
  ]
};
