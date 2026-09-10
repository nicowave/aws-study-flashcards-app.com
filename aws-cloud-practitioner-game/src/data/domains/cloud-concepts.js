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
      question: 'A consultant preparing a cloud business case wants to cite the six advantages of cloud computing exactly as AWS publishes them. Which list is correct?',
      options: [
        'Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability',
        'Business, people, governance, platform, security, and operations',
        'Trade fixed expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop spending money running data centers, and go global in minutes',
        'Rehost, replatform, repurchase, refactor, retire, and retain'
      ],
      correctAnswer: 2,
      explanation: 'AWS\'s six advantages of cloud computing are: trade fixed expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop spending money running and maintaining data centers, and go global in minutes. The other lists are real AWS six-item frameworks but answer different questions: the Well-Architected Framework pillars, the Cloud Adoption Framework perspectives, and the six common migration strategies (the "6 Rs").'
    },
    {
      id: 'cc2',
      question: 'A solutions architect keeps using the term "elasticity" while presenting a proposed AWS design. What does elasticity mean in cloud computing?',
      options: [
        'Recovering automatically when infrastructure components fail',
        'Adding permanent capacity to accommodate long-term growth',
        'Distributing copies of data across multiple geographic Regions',
        'Acquiring resources as demand increases and releasing them when demand drops'
      ],
      correctAnswer: 3,
      explanation: 'Elasticity means resources expand and contract with actual demand, so you pay only for what you use at any moment. Automatic recovery from failure describes fault tolerance, permanently adding capacity is traditional fixed scaling rather than elasticity, and cross-Region data copies describe replication.'
    },
    {
      id: 'cc3',
      question: 'A systems team migrating a legacy workload must choose its own operating system, install custom kernel-level agents, and control the patching schedule. Which cloud service model gives them this level of control?',
      options: [
        'Infrastructure as a Service (IaaS)',
        'Software as a Service (SaaS)',
        'Platform as a Service (PaaS)',
        'Function as a Service (FaaS)'
      ],
      correctAnswer: 0,
      explanation: 'IaaS (such as Amazon EC2) provides the most control: the customer manages the operating system, installed software, and patching while AWS manages the physical hardware and virtualization. PaaS abstracts away the OS, FaaS abstracts away servers entirely, and SaaS delivers a finished application with no infrastructure access at all.'
    },
    {
      id: 'cc4',
      question: 'Before a major product launch, a CTO wants AWS\'s published guidance for judging whether the team\'s architecture is secure, reliable, performant, and cost-effective. What is the AWS Well-Architected Framework?',
      options: [
        'A managed service that continuously scans AWS accounts and automatically remediates misconfigurations',
        'A library of prebuilt CloudFormation templates for deploying common reference architectures',
        'A consulting engagement in which AWS Professional Services redesigns customer workloads',
        'A set of best practices, organized into six pillars, for designing and operating cloud workloads'
      ],
      correctAnswer: 3,
      explanation: 'The Well-Architected Framework is documented guidance — design principles and best practices across the Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability pillars. It is not a service that fixes issues automatically (the Well-Architected Tool only reviews and reports), not a template library, and not a paid consulting engagement.'
    },
    {
      id: 'cc5',
      question: 'A payments platform must continue processing transactions with zero interruption even while a component is actively failing, not merely recover quickly afterward. How do high availability and fault tolerance differ?',
      options: [
        'High availability minimizes downtime during failures; fault tolerance means operations continue with no downtime at all',
        'High availability guarantees zero downtime; fault tolerance only shortens the recovery period after an outage',
        'Fault tolerance is a lower-cost simplification of a highly available architecture',
        'The two terms describe the same architecture sold at different support tiers'
      ],
      correctAnswer: 0,
      explanation: 'High availability keeps downtime minimal but accepts brief interruptions during failover; fault tolerance keeps the system fully operational through a component failure, typically by running redundant components simultaneously. This zero-downtime requirement calls for fault tolerance, which generally costs more than high availability — not less — and the terms are not interchangeable.'
    },
    {
      id: 'cc6',
      question: 'A research team needs EC2 capacity for a two-week experiment that cannot tolerate interruptions, and the company refuses any one- or three-year commitment. Which purchasing option fits best?',
      options: [
        'Spot Instances',
        'On-Demand Instances',
        'Reserved Instances',
        'Savings Plans'
      ],
      correctAnswer: 1,
      explanation: 'On-Demand Instances charge by the hour or second with no long-term commitment, making them right for short-term, uninterruptible workloads. Spot Instances are cheaper but can be reclaimed by AWS with a two-minute warning, while Reserved Instances and Savings Plans both require a one- or three-year commitment.'
    },
    {
      id: 'cc7',
      question: 'An e-commerce company runs its web tier on EC2 instances spread across three Availability Zones behind a load balancer. What is the primary benefit of this design?',
      options: [
        'Lower data transfer costs between the instances',
        'Reduced latency for shoppers on other continents',
        'A larger default EC2 service quota in the Region',
        'The application keeps serving traffic if one Availability Zone fails'
      ],
      correctAnswer: 3,
      explanation: 'Spreading instances across multiple AZs provides high availability: if one AZ suffers an outage, the load balancer routes traffic to healthy instances in the others. Cross-AZ data transfer actually incurs a charge rather than saving money, serving distant continents is addressed by additional Regions or edge locations, and service quotas are unrelated to AZ placement.'
    },
    {
      id: 'cc8',
      question: 'A finance director used to fixed annual IT budgets asks how the company will be charged for AWS services under pay-as-you-go pricing. What should the cloud team explain?',
      options: [
        'Charges accrue only for the resources actually consumed, with no long-term contracts required',
        'A flat monthly fee covers unlimited usage of every AWS service',
        'A full year of estimated usage must be paid for in advance',
        'A minimum monthly spend must be met before resources can be launched'
      ],
      correctAnswer: 0,
      explanation: 'Pay-as-you-go means paying only for the individual services used, for as long as they are used, with no long-term contracts or complex licensing. There is no flat unlimited-use fee, no required annual prepayment (upfront payment is an optional feature of Reserved Instances), and no minimum spend to start using AWS.'
    },
    {
      id: 'cc9',
      question: 'A government agency is required to keep every workload and all data physically inside its own facility, while still using virtualization and cloud-style management tooling there. Which cloud deployment model describes this?',
      options: [
        'Public cloud',
        'Hybrid cloud',
        'Private cloud (on-premises)',
        'Multi-cloud'
      ],
      correctAnswer: 2,
      explanation: 'A private cloud (on-premises) deployment keeps all infrastructure in the organization\'s own data center while applying cloud-like virtualization and management. Hybrid would require connecting that facility to resources running in a public cloud, which the mandate forbids, and public cloud or multi-cloud would place the workloads on provider-owned infrastructure.'
    },
    {
      id: 'cc10',
      question: 'AWS aggregates the usage of hundreds of thousands of customers into its data centers. What benefit does this "economies of scale" advantage pass on to an individual customer?',
      options: [
        'Guaranteed capacity reservations during global demand spikes',
        'Lower pay-as-you-go prices than the customer could achieve running its own hardware',
        'Automatic architectural reviews performed on every account',
        'Dedicated physical servers included at no additional charge'
      ],
      correctAnswer: 1,
      explanation: 'Because AWS buys and operates infrastructure at massive scale, its unit costs are lower, and that translates into lower pay-as-you-go prices for customers than most could achieve on their own. Economies of scale does not guarantee capacity, trigger architecture reviews, or provide free dedicated hardware — Dedicated Hosts are a separately billed option.'
    },
    {
      id: 'cc11',
      question: 'A new engineer sees company resources deployed in "us-east-1" and "eu-west-2" and asks what these identifiers represent. What is an AWS Region?',
      options: [
        'A geographic area containing multiple physically separated Availability Zones',
        'A single data center building with redundant power and networking',
        'A cache site where CloudFront serves content close to end users',
        'A logically isolated virtual network defined inside an AWS account'
      ],
      correctAnswer: 0,
      explanation: 'A Region is a physical geographic area that contains multiple isolated Availability Zones, and each Region is isolated from the others. A single data center is smaller than an AZ, a cache site describes an edge location, and an isolated virtual network describes a VPC.'
    },
    {
      id: 'cc12',
      question: 'An architect designing for high availability asks what physically sits behind each Availability Zone within a Region. What is an Availability Zone?',
      options: [
        'A geographic area made up of several independent Regions',
        'A CloudFront edge site that caches content near end users',
        'One or more discrete data centers with redundant power, networking, and connectivity',
        'A virtual network segment reserved for a single customer\'s resources'
      ],
      correctAnswer: 2,
      explanation: 'An Availability Zone consists of one or more discrete data centers with redundant power, networking, and connectivity, physically separated from other AZs in the Region and linked by low-latency networking. The hierarchy runs the other way — Regions contain AZs — and edge sites and virtual network segments describe edge locations and subnets, respectively.'
    },
    {
      id: 'cc13',
      question: 'An architecture review finds unencrypted data at rest and IAM users granted far broader permissions than their jobs require. Under which Well-Architected Framework pillar do these findings fall?',
      options: [
        'Operational Excellence',
        'Reliability',
        'Performance Efficiency',
        'Security'
      ],
      correctAnswer: 3,
      explanation: 'Encryption at rest and least-privilege access control are core practices of the Security pillar, which covers protecting data, systems, and assets. Operational Excellence concerns running and improving operations, Reliability concerns recovery from failure, and Performance Efficiency concerns using resources effectively — none of them addresses these access and encryption gaps.'
    },
    {
      id: 'cc14',
      question: 'A streaming service with customers only in North America decides to expand, and within days it launches full application stacks in Frankfurt and Singapore without building any facilities. Which cloud advantage does this illustrate?',
      options: [
        'Benefit from massive economies of scale',
        'Go global in minutes',
        'Stop guessing about capacity',
        'Trade fixed expense for variable expense'
      ],
      correctAnswer: 1,
      explanation: '"Go global in minutes" means deploying an application into AWS Regions around the world with a few clicks, putting it closer to international users without building data centers abroad. Economies of scale is about AWS\'s buying power lowering prices, capacity guessing is about matching resource levels to demand, and the expense trade-off describes the CapEx-to-OpEx shift rather than geographic reach.'
    },
    {
      id: 'cc15',
      question: 'After migrating to EC2, a security lead asks who is responsible for patching the underlying hypervisor versus configuring security groups and encrypting application data. What does the AWS Shared Responsibility Model establish?',
      options: [
        'AWS assumes every security task once workloads are running on its infrastructure',
        'Customers take over physical security for the data centers hosting their instances',
        'AWS secures the cloud infrastructure itself, while customers secure what they run in the cloud',
        'Security duties are negotiated individually in each customer\'s support agreement'
      ],
      correctAnswer: 2,
      explanation: 'The Shared Responsibility Model makes AWS responsible for security "of" the cloud — facilities, hardware, and the virtualization layer including the hypervisor — while customers handle security "in" the cloud, such as security group rules, data encryption, and access management. AWS never takes over customer-side controls, customers never manage AWS\'s physical data centers, and the split is a standard model, not a per-contract negotiation.'
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
