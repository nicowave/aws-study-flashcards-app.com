// Domain 4: Billing, Pricing, and Support (12% of exam)
// CLF-C02 Exam Content

export const billingSupport = {
  id: 'billing-support',
  name: 'Billing, Pricing & Support',
  icon: '💰',
  weight: '12%',
  color: '#d29922',
  description: 'AWS pricing models, billing services, and support plans',
  questions: [
    {
      id: 'bs1',
      question: 'Which AWS tool provides cost estimates for AWS services before you use them?',
      options: [
        'AWS Cost Explorer',
        'AWS Pricing Calculator',
        'AWS Budgets',
        'AWS Cost and Usage Report'
      ],
      correctAnswer: 1,
      explanation: 'AWS Pricing Calculator helps you estimate the cost of AWS services before you use them. You can model your solutions and explore price points for your use case.'
    },
    {
      id: 'bs2',
      question: 'Which AWS support plan provides access to a Technical Account Manager (TAM)?',
      options: [
        'Basic',
        'Developer',
        'Business',
        'Enterprise'
      ],
      correctAnswer: 3,
      explanation: 'Only the Enterprise support plan provides a designated Technical Account Manager (TAM) who provides consultative architectural and operational guidance.'
    },
    {
      id: 'bs3',
      question: 'What is AWS Free Tier?',
      options: [
        'A permanent free version of all AWS services',
        'A trial period offering free usage of certain AWS services for new customers',
        'A discount program offering reduced rates to students and educators',
        'A credit program that reimburses new customers for their first month of usage'
      ],
      correctAnswer: 1,
      explanation: 'AWS Free Tier offers free usage of certain AWS services. It includes: Always Free (never expire), 12 Months Free (for new customers), and Trials (short-term free trials).'
    },
    {
      id: 'bs4',
      question: 'What is the difference between Reserved Instances and On-Demand Instances?',
      options: [
        'Reserved Instances run on hardware dedicated to a single customer',
        'Reserved require a 1 or 3-year commitment but offer significant discounts (up to 72%)',
        'Reserved Instances can be interrupted at any time while On-Demand cannot',
        'Reserved Instances are billed per second while On-Demand is billed monthly'
      ],
      correctAnswer: 1,
      explanation: 'Reserved Instances require a 1 or 3-year commitment but offer up to 72% discount compared to On-Demand pricing. They\'re ideal for steady-state workloads with predictable usage.'
    },
    {
      id: 'bs5',
      question: 'What is AWS Organizations?',
      options: [
        'A service for grouping IAM users and roles within a single account',
        'A service for centrally managing multiple AWS accounts',
        'A directory service that federates workforce identities into AWS',
        'A tagging service for organizing AWS resources into logical groups'
      ],
      correctAnswer: 1,
      explanation: 'AWS Organizations lets you centrally manage multiple AWS accounts, apply policies across accounts, and consolidate billing. It helps with governance and cost management at scale.'
    },
    {
      id: 'bs6',
      question: 'Which tool allows you to set custom cost and usage budgets?',
      options: [
        'AWS Cost Explorer',
        'AWS Budgets',
        'AWS Pricing Calculator',
        'AWS Trusted Advisor'
      ],
      correctAnswer: 1,
      explanation: 'AWS Budgets allows you to set custom budgets and receive alerts when your costs or usage exceed (or are forecasted to exceed) your budgeted amount.'
    },
    {
      id: 'bs7',
      question: 'What are Spot Instances?',
      options: [
        'EC2 capacity reserved in a specific Availability Zone for immediate use',
        'Unused EC2 capacity available at up to 90% discount that can be interrupted',
        'Instances that run on physical servers dedicated to a single customer',
        'Discounted instances that require a 1 or 3-year commitment paid upfront'
      ],
      correctAnswer: 1,
      explanation: 'Spot Instances let you use unused EC2 capacity at up to 90% discount. However, they can be interrupted with a 2-minute warning when AWS needs the capacity back.'
    },
    {
      id: 'bs8',
      question: 'Which AWS support plan is free and available to all customers?',
      options: [
        'Developer',
        'Business',
        'Basic',
        'Enterprise'
      ],
      correctAnswer: 2,
      explanation: 'Basic support is free and available to all AWS customers. It includes 24/7 access to customer service, documentation, whitepapers, and AWS Trusted Advisor core checks.'
    },
    {
      id: 'bs9',
      question: 'What does Consolidated Billing in AWS Organizations provide?',
      options: [
        'Separate invoices generated individually for each member account',
        'A single bill for all accounts with potential volume discounts',
        'Free Tier benefits multiplied across every account in the organization',
        'Automatic identification and termination of unused resources to cut costs'
      ],
      correctAnswer: 1,
      explanation: 'Consolidated Billing combines usage from all accounts in an organization into a single bill. This can result in volume discounts as aggregated usage may reach pricing tiers sooner.'
    },
    {
      id: 'bs10',
      question: 'What is AWS Cost Explorer?',
      options: [
        'A tool to estimate the cost of AWS services before you deploy them',
        'A tool to visualize and analyze your AWS costs and usage over time',
        'A tool that sets custom spending thresholds and alerts when they are exceeded',
        'A dashboard that consolidates invoices from every account into a single bill'
      ],
      correctAnswer: 1,
      explanation: 'AWS Cost Explorer lets you visualize, understand, and manage your AWS costs and usage over time. It provides interactive charts and forecasting capabilities.'
    },
    {
      id: 'bs11',
      question: 'Which pricing model offers the highest discount for EC2?',
      options: [
        'On-Demand',
        'Reserved Instances',
        'Spot Instances',
        'Dedicated Hosts'
      ],
      correctAnswer: 2,
      explanation: 'Spot Instances offer the highest discount (up to 90% off On-Demand prices) because they use spare EC2 capacity. However, they can be interrupted, making them suitable for fault-tolerant workloads.'
    },
    {
      id: 'bs12',
      question: 'What is AWS Trusted Advisor?',
      options: [
        'A designated engineer who provides consultative architectural guidance',
        'A service providing recommendations for cost optimization, security, and performance',
        'A service that aggregates security findings from across your accounts',
        'A tool that estimates the monthly cost of planned AWS workloads'
      ],
      correctAnswer: 1,
      explanation: 'AWS Trusted Advisor is an online tool that provides real-time recommendations across five categories: cost optimization, performance, security, fault tolerance, and service limits.'
    },
    {
      id: 'bs13',
      question: 'What is the AWS Partner Network (APN)?',
      options: [
        'A private network service that connects AWS accounts across organizations',
        'A global partner program for companies that build or sell AWS solutions',
        'A marketplace where customers buy and sell third-party software solutions',
        'A premium support tier that pairs customers with AWS solutions architects'
      ],
      correctAnswer: 1,
      explanation: 'The AWS Partner Network (APN) is a global partner program for technology and consulting businesses that build solutions or provide services using AWS.'
    },
    {
      id: 'bs14',
      question: 'What are Savings Plans?',
      options: [
        'A commitment to a consistent amount of compute usage ($/hour) for 1 or 3 years for discounts',
        'A discount automatically applied when usage stays within Free Tier limits',
        'A billing feature that consolidates invoices across accounts in an organization',
        'A capacity reservation for EC2 instances in a specific Availability Zone'
      ],
      correctAnswer: 0,
      explanation: 'Savings Plans offer significant savings (up to 72%) over On-Demand in exchange for a commitment to a consistent amount of usage (measured in $/hour) for a 1 or 3-year term.'
    },
    {
      id: 'bs15',
      question: 'Which support plan offers a response time of less than 15 minutes for business-critical system down?',
      options: [
        'Basic',
        'Developer',
        'Business',
        'Enterprise'
      ],
      correctAnswer: 3,
      explanation: 'Enterprise support offers less than 15-minute response time for business-critical system down cases. Business support offers less than 1 hour for production system down.'
    }
  ]
};
