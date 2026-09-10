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
    },
    {
      id: 'cc16',
      question: 'A company\'s data center hardware is due for a costly refresh. By migrating to AWS instead, how does its cost structure change?',
      options: [
        'Variable operational expenses are traded for large fixed capital expenses',
        'Large upfront capital expenses are traded for pay-as-you-go operational expenses',
        'All costs are eliminated because AWS absorbs infrastructure spending',
        'Costs become fixed at the size of the original hardware quote'
      ],
      correctAnswer: 1,
      explanation: 'Moving to the cloud trades capital expense (buying hardware upfront) for variable operational expense (paying only for what you consume). Costs aren\'t eliminated or fixed — they scale with actual usage, which is the point.'
    },
    {
      id: 'cc17',
      question: 'A ticketing site sees traffic spike 20x during on-sale events and drop overnight. Which cloud capability lets capacity grow and shrink automatically to match this demand?',
      options: ['Fault tolerance', 'Elasticity', 'Data durability', 'Consolidated billing'],
      correctAnswer: 1,
      explanation: 'Elasticity is the ability to automatically acquire resources as demand rises and release them as it falls, paying only for what\'s used. Fault tolerance is about surviving failures, durability protects stored data, and consolidated billing is a payment feature.'
    },
    {
      id: 'cc18',
      question: 'What is the difference between scaling vertically and scaling horizontally?',
      options: [
        'Vertical scaling adds more instances; horizontal scaling uses a bigger instance',
        'Vertical scaling moves workloads across Regions; horizontal scaling stays in one Region',
        'Vertical scaling increases the size/power of one instance; horizontal scaling adds more instances',
        'They are two names for the same technique'
      ],
      correctAnswer: 2,
      explanation: 'Scaling up (vertical) means moving to a larger, more powerful instance; scaling out (horizontal) means adding more instances behind a load balancer. Horizontal scaling generally offers better availability because no single machine is a bottleneck or single point of failure.'
    },
    {
      id: 'cc19',
      question: 'A media company wants its static content cached physically close to users worldwide to cut latency. Which part of the AWS global infrastructure serves this purpose?',
      options: ['Availability Zones', 'Edge locations', 'AWS Regions', 'Subnets'],
      correctAnswer: 1,
      explanation: 'Edge locations are content-delivery sites (used by CloudFront and Route 53) placed in far more cities than Regions, caching content near end users. Regions and Availability Zones host the core infrastructure, and subnets are network segments inside a VPC.'
    },
    {
      id: 'cc20',
      question: 'A regulated firm must run some workloads on-premises but wants the same AWS APIs, hardware, and tools in its own data center. Which offering provides this?',
      options: ['AWS Outposts', 'Amazon CloudFront', 'AWS Fargate', 'Amazon WorkSpaces'],
      correctAnswer: 0,
      explanation: 'AWS Outposts brings AWS-managed racks with native AWS services and APIs into the customer\'s own facility — the hybrid option for residency or latency constraints. CloudFront is a CDN, Fargate runs containers in the cloud, and WorkSpaces provides virtual desktops.'
    },
    {
      id: 'cc21',
      question: 'Which practice reflects the Operational Excellence pillar of the Well-Architected Framework?',
      options: [
        'Making frequent, small, reversible changes and managing infrastructure as code',
        'Purchasing Reserved Instances for all workloads',
        'Encrypting all data at rest',
        'Deploying every workload to a single large server'
      ],
      correctAnswer: 0,
      explanation: 'Operational Excellence emphasizes operations as code, small reversible changes, frequent refinement of procedures, and learning from failures. Reserved Instances relate to cost optimization and encryption to the security pillar; a single large server contradicts reliability guidance.'
    },
    {
      id: 'cc22',
      question: 'A review finds most EC2 instances running at 5% CPU around the clock. Which Well-Architected pillar does right-sizing these instances address?',
      options: ['Security', 'Performance Efficiency', 'Cost Optimization', 'Sustainability only'],
      correctAnswer: 2,
      explanation: 'Paying for far more capacity than a workload uses is a cost-optimization problem — right-sizing matches resources to actual demand. It also helps sustainability, but the primary pillar for eliminating wasted spend is Cost Optimization; security and performance aren\'t the issue at 5% utilization.'
    },
    {
      id: 'cc23',
      question: 'Which design principle belongs to the Reliability pillar of the Well-Architected Framework?',
      options: [
        'Automatically recover from failure and test recovery procedures',
        'Choose the cheapest Region for every deployment',
        'Grant broad permissions to reduce administrative work',
        'Avoid making changes once a system is stable'
      ],
      correctAnswer: 0,
      explanation: 'Reliability focuses on a workload\'s ability to recover from failures — automatic recovery, tested procedures, horizontal scaling, and capacity management. Cheapest-Region selection is cost-related, broad permissions violate security, and freezing changes contradicts operational excellence.'
    },
    {
      id: 'cc24',
      question: 'A company moves its application servers to EC2 with no code changes, keeping the same architecture. Which migration strategy is this?',
      options: ['Refactoring (re-architecting)', 'Rehosting ("lift and shift")', 'Repurchasing (moving to SaaS)', 'Retiring'],
      correctAnswer: 1,
      explanation: 'Rehosting — lift and shift — moves applications as-is onto cloud infrastructure without redesign. Refactoring changes the architecture (e.g., to serverless), repurchasing replaces the app with a SaaS product, and retiring decommissions it.'
    },
    {
      id: 'cc25',
      question: 'What is the purpose of the AWS Cloud Adoption Framework (CAF)?',
      options: [
        'To calculate the exact monthly bill for a planned migration',
        'To provide guidance across business and technical perspectives for planning a cloud transformation',
        'To automatically migrate databases to AWS',
        'To certify employees on AWS services'
      ],
      correctAnswer: 1,
      explanation: 'The CAF organizes cloud adoption guidance into perspectives (Business, People, Governance, Platform, Security, Operations) to help organizations plan and de-risk their transformation. Pricing tools handle cost estimates, DMS migrates databases, and AWS Training handles certification.'
    },
    {
      id: 'cc26',
      question: 'When comparing on-premises Total Cost of Ownership (TCO) to AWS, which commonly overlooked cost category must be included for a fair comparison?',
      options: [
        'The cost of the AWS Management Console, which is licensed per user',
        'Facilities, power, cooling, and the IT labor to maintain hardware',
        'Fees AWS charges for inbound data transfer',
        'Per-query charges for using one\'s own on-premises database'
      ],
      correctAnswer: 1,
      explanation: 'On-prem TCO includes far more than server purchase price: data-center space, power, cooling, network gear, and the staff time spent racking, patching, and replacing hardware. The console is free, inbound data transfer is free, and on-prem databases don\'t bill per query.'
    },
    {
      id: 'cc27',
      question: 'What is the primary benefit of serverless computing services such as AWS Lambda?',
      options: [
        'Code runs without provisioning or managing servers, and you pay only for execution time',
        'Applications run without any code being written',
        'Workloads run on dedicated physical servers reserved for one customer',
        'Compute is free for workloads under 24 hours per day'
      ],
      correctAnswer: 0,
      explanation: 'Serverless means AWS manages all underlying infrastructure — provisioning, scaling, patching — and bills only for actual execution. Servers still exist (you just don\'t manage them), code is still required, and there is no free-if-under-24-hours rule.'
    },
    {
      id: 'cc28',
      question: 'An architect places a queue between a web front end and a video-processing back end so each part can fail or scale independently. Which design principle is this?',
      options: ['Tight coupling', 'Loose coupling', 'Vertical integration', 'Single point of failure'],
      correctAnswer: 1,
      explanation: 'Loose coupling connects components through intermediaries like queues (SQS) or load balancers so a failure or slowdown in one doesn\'t cascade to others. Tight coupling is the anti-pattern being avoided, and a queue removes rather than creates single points of failure.'
    },
    {
      id: 'cc29',
      question: 'A business needs its application to survive the complete loss of an entire AWS Region. What does this requirement imply?',
      options: [
        'Deploying to multiple Availability Zones within one Region is sufficient',
        'A disaster recovery or active deployment in a second Region is required',
        'Nothing — Regions cannot fail',
        'The application must run on-premises instead'
      ],
      correctAnswer: 1,
      explanation: 'Surviving a Region-level event requires presence in a second Region — from backups and pilot-light standby up to active-active deployments. Multi-AZ protects against data-center failures within a Region but not the Region itself, and no infrastructure is immune to failure.'
    },
    {
      id: 'cc30',
      question: 'Which factors should a company weigh when choosing which AWS Region to deploy in?',
      options: [
        'Data residency requirements, latency to users, service availability, and pricing',
        'Only alphabetical order of Region names',
        'Only the number of edge locations inside the Region',
        'The Region\'s founding date, since older Regions are always cheaper'
      ],
      correctAnswer: 0,
      explanation: 'Region choice balances compliance (where data must legally reside), proximity to users (latency), whether needed services are offered there, and cost, which varies by Region. Edge locations sit outside Regions, and age or names are irrelevant.'
    },
    {
      id: 'cc31',
      question: 'Before the cloud, a team waited 8 weeks for hardware procurement to test a new product idea. On AWS they provision in minutes. Which cloud advantage does this illustrate?',
      options: ['Increased speed and agility', 'Massive economies of scale', 'Consolidated billing', 'Fault tolerance'],
      correctAnswer: 0,
      explanation: 'Provisioning resources in minutes instead of weeks lets teams experiment, fail fast, and innovate more often — the "increase speed and agility" advantage. Economies of scale is about AWS\'s purchasing power lowering prices, and the others are unrelated to provisioning speed.'
    },
    {
      id: 'cc32',
      question: 'A startup can\'t predict whether it will need 2 servers or 200 at launch. How does AWS address the "capacity guessing" problem?',
      options: [
        'AWS requires a fixed capacity reservation at signup',
        'Capacity can scale up or down with demand, so over- and under-provisioning are no longer necessary',
        'AWS provides unlimited free capacity during launch events',
        'Customers must purchase for the worst-case scenario'
      ],
      correctAnswer: 1,
      explanation: '"Stop guessing capacity" is a core cloud advantage: scale to what demand actually is, in minutes, instead of buying hardware for a forecast. There are no fixed reservations required at signup, no free unlimited launch capacity, and worst-case purchasing is exactly the on-prem problem the cloud removes.'
    },
    {
      id: 'cc33',
      question: 'A company subscribes to a web-based CRM that it merely configures and uses — no servers, runtimes, or application code to manage. Which cloud service model is this?',
      options: ['Infrastructure as a Service (IaaS)', 'Platform as a Service (PaaS)', 'Software as a Service (SaaS)', 'Function as a Service (FaaS)'],
      correctAnswer: 2,
      explanation: 'SaaS delivers a complete application managed entirely by the provider — the customer just uses it. IaaS provides raw infrastructure (like EC2), PaaS provides a managed platform for your own code (like Elastic Beanstalk), and FaaS runs individual functions (like Lambda).'
    },
    {
      id: 'cc34',
      question: 'What advantage do microservices architectures offer over a monolithic design?',
      options: [
        'Each component can be developed, deployed, and scaled independently, limiting the blast radius of failures',
        'All functionality ships in a single deployable unit, simplifying scaling',
        'They eliminate the need for any inter-service communication',
        'They only run on-premises'
      ],
      correctAnswer: 0,
      explanation: 'Microservices split an application into small independent services, so teams deploy separately, scale only what\'s hot, and contain failures. The single deployable unit describes the monolith itself, communication between services increases (not disappears), and microservices run anywhere.'
    },
    {
      id: 'cc35',
      question: 'Which practice aligns with the Sustainability pillar of the Well-Architected Framework?',
      options: [
        'Maximizing utilization of provisioned resources and using managed services to reduce wasted energy',
        'Running all instances at maximum size continuously to be safe',
        'Storing every log forever in hot storage',
        'Printing infrastructure diagrams on recycled paper'
      ],
      correctAnswer: 0,
      explanation: 'The Sustainability pillar targets reducing the environmental footprint of workloads: high utilization, right-sizing, efficient storage tiering, and managed/serverless services that share infrastructure efficiently. Perpetually oversized instances and hot-storing all data forever waste energy — the opposite of the pillar\'s guidance.'
    },
    {
      id: 'cc36',
      question: 'What distinguishes AWS Local Zones from standard Regions?',
      options: [
        'Local Zones place compute and storage closer to large population centers for single-digit-millisecond latency',
        'Local Zones are free tiers of a Region',
        'Local Zones are Regions that only support S3',
        'Local Zones run customer-owned hardware'
      ],
      correctAnswer: 0,
      explanation: 'Local Zones extend a parent Region\'s infrastructure into metro areas so latency-sensitive workloads (media, gaming, real-time apps) run near users. They aren\'t free, aren\'t S3-only, and use AWS-owned infrastructure — customer-site hardware is Outposts.'
    }
  ]
};
