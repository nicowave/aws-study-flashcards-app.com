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
        'A discount program for students',
        'A non-profit pricing plan'
      ],
      correctAnswer: 1,
      explanation: 'AWS Free Tier offers free usage of certain AWS services. It includes: Always Free (never expire), 12 Months Free (for new customers), and Trials (short-term free trials).'
    },
    {
      id: 'bs4',
      question: 'What is the difference between Reserved Instances and On-Demand Instances?',
      options: [
        'Reserved are more powerful',
        'Reserved require a 1 or 3-year commitment but offer significant discounts (up to 72%)',
        'On-Demand instances have better availability',
        'There is no difference'
      ],
      correctAnswer: 1,
      explanation: 'Reserved Instances require a 1 or 3-year commitment but offer up to 72% discount compared to On-Demand pricing. They\'re ideal for steady-state workloads with predictable usage.'
    },
    {
      id: 'bs5',
      question: 'What is AWS Organizations?',
      options: [
        'A service for managing HR functions',
        'A service for centrally managing multiple AWS accounts',
        'A project management tool',
        'A team collaboration service'
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
        'Instances in a specific geographic location',
        'Unused EC2 capacity available at up to 90% discount that can be interrupted',
        'Instances with the best performance',
        'Reserved instances paid upfront'
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
        'Separate invoices for each account',
        'A single bill for all accounts with potential volume discounts',
        'Free usage across all accounts',
        'Automatic cost optimization'
      ],
      correctAnswer: 1,
      explanation: 'Consolidated Billing combines usage from all accounts in an organization into a single bill. This can result in volume discounts as aggregated usage may reach pricing tiers sooner.'
    },
    {
      id: 'bs10',
      question: 'What is AWS Cost Explorer?',
      options: [
        'A tool to estimate future costs',
        'A tool to visualize and analyze your AWS costs and usage over time',
        'A service to reduce costs automatically',
        'A pricing comparison website'
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
        'A technical support engineer',
        'A service providing recommendations for cost optimization, security, and performance',
        'A training program',
        'A certification exam'
      ],
      correctAnswer: 1,
      explanation: 'AWS Trusted Advisor is an online tool that provides real-time recommendations across five categories: cost optimization, performance, security, fault tolerance, and service limits.'
    },
    {
      id: 'bs13',
      question: 'What is the AWS Partner Network (APN)?',
      options: [
        'A VPN service',
        'A global partner program for companies that build or sell AWS solutions',
        'A content delivery network',
        'A customer support channel'
      ],
      correctAnswer: 1,
      explanation: 'The AWS Partner Network (APN) is a global partner program for technology and consulting businesses that build solutions or provide services using AWS.'
    },
    {
      id: 'bs14',
      question: 'What are Savings Plans?',
      options: [
        'A commitment to a consistent amount of compute usage ($/hour) for 1 or 3 years for discounts',
        'A retirement savings program',
        'A way to save data to S3',
        'A backup service discount'
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
