// Module 3: Pricing, Billing & Support
// Source: AWS Cloud Practitioner Essentials

export const module3 = {
  id: 'module3',
  name: 'Pricing & Support',
  description: 'AWS pricing models, billing tools, and support plans',
  icon: '💰',
  color: '#67e8f9',
  gradient: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)',
  source: 'AWS Cloud Practitioner Essentials',
  cards: [
    {
      id: 'pr1',
      front: 'What are the 3 AWS pricing fundamentals?',
      back: '1. Pay for what you use\n   • No long-term contracts\n   • Stop anytime\n\n2. Pay less when you reserve\n   • Up to 72% savings\n\n3. Pay less with volume discounts\n   • Tiered pricing\n   • The more you use, the less per unit',
      hint: 'Use, Reserve, Volume',
      tags: ['pricing', 'fundamentals'],
      difficulty: 'beginner'
    },
    {
      id: 'pr2',
      front: 'What is the AWS Free Tier?',
      back: 'Three types of free offers:\n\n1. Always Free\n   • Lambda: 1M requests/month\n   • DynamoDB: 25GB storage\n\n2. 12 Months Free\n   • EC2: 750 hrs/month t2.micro\n   • S3: 5GB storage\n\n3. Trials\n   • Short-term free trials',
      hint: 'Always, 12 months, Trials',
      tags: ['pricing', 'free-tier'],
      difficulty: 'beginner'
    },
    {
      id: 'pr3',
      front: 'What are the EC2 pricing options?',
      back: '1. On-Demand: Pay by hour/second\n   • No commitment, highest price\n\n2. Reserved: 1-3 year commitment\n   • Up to 72% off On-Demand\n\n3. Spot: Bid for unused capacity\n   • Up to 90% off, can be interrupted\n\n4. Savings Plans: $/hour commitment\n   • Flexible across services',
      hint: 'On-Demand → Reserved → Spot',
      tags: ['pricing', 'ec2'],
      difficulty: 'beginner'
    },
    {
      id: 'pr4',
      front: 'What is AWS Organizations?',
      back: 'Centrally manage multiple AWS accounts\n\nFeatures:\n• Consolidated billing\n• Volume discounts across accounts\n• Service Control Policies (SCPs)\n• Hierarchical organization\n• Automate account creation',
      hint: 'Think: multi-account management',
      tags: ['billing', 'organizations'],
      difficulty: 'intermediate'
    },
    {
      id: 'pr5',
      front: 'What is Consolidated Billing?',
      back: 'Single bill for multiple accounts\n\nBenefits:\n• One payment method\n• Combined usage for volume discounts\n• Track charges per account\n• Share Reserved Instances & Savings Plans\n• No extra cost',
      hint: 'One bill, combined discounts',
      tags: ['billing', 'consolidated-billing'],
      difficulty: 'beginner'
    },
    {
      id: 'pr6',
      front: 'What is AWS Budgets?',
      back: 'Set custom cost & usage budgets\n\nFeatures:\n• Cost budgets\n• Usage budgets\n• Reservation budgets\n• Email/SNS alerts\n• Forecast warnings\n• First 2 budgets free',
      hint: 'Think: spending alerts',
      tags: ['billing', 'budgets'],
      difficulty: 'beginner'
    },
    {
      id: 'pr7',
      front: 'What is AWS Cost Explorer?',
      back: 'Visualize & analyze costs\n\nFeatures:\n• Historical cost data (13 months)\n• Forecast future costs (12 months)\n• Filter by service, region, tag\n• Identify trends\n• Recommendations for savings',
      hint: 'Think: cost graphs & reports',
      tags: ['billing', 'cost-explorer'],
      difficulty: 'beginner'
    },
    {
      id: 'pr8',
      front: 'What are the AWS Support Plans?',
      back: 'Basic (Free):\n• Documentation, whitepapers\n• Trusted Advisor core checks\n\nDeveloper ($29/mo):\n• Business hours email support\n\nBusiness ($100+/mo):\n• 24/7 phone, chat, email\n• < 1hr response for production down\n\nEnterprise ($15K+/mo):\n• TAM, < 15min critical response',
      hint: 'Basic → Developer → Business → Enterprise',
      tags: ['support', 'support-plans'],
      difficulty: 'intermediate'
    },
    {
      id: 'pr9',
      front: 'What is AWS Trusted Advisor?',
      back: 'Best practice recommendations\n\n5 Categories:\n• Cost Optimization\n• Performance\n• Security\n• Fault Tolerance\n• Service Limits\n\nBasic: 7 core checks\nBusiness+: All checks',
      hint: 'Think: AWS best practice checker',
      tags: ['support', 'trusted-advisor'],
      difficulty: 'beginner'
    },
    {
      id: 'pr10',
      front: 'What is the AWS Pricing Calculator?',
      back: 'Estimate costs before deployment\n\nFeatures:\n• Model your solution\n• Compare configurations\n• Export estimates\n• Share with stakeholders\n• Free to use',
      hint: 'Think: cost estimator tool',
      tags: ['billing', 'pricing-calculator'],
      difficulty: 'beginner'
    },
    {
      id: 'pr11',
      front: 'What is a Technical Account Manager (TAM)?',
      back: 'Dedicated AWS expert for your account\n\nOnly with Enterprise Support:\n• Proactive guidance\n• Architecture reviews\n• Operational best practices\n• Coordinates AWS resources\n• Helps optimize AWS usage',
      hint: 'Enterprise Support only',
      tags: ['support', 'tam'],
      difficulty: 'intermediate'
    },
    {
      id: 'pr12',
      front: 'What factors affect EC2 pricing?',
      back: 'EC2 cost factors:\n\n• Instance type (CPU, memory, etc.)\n• Region\n• Operating system\n• Pricing model (On-Demand, etc.)\n• Tenancy (shared vs dedicated)\n• Data transfer out',
      hint: 'Type, Region, OS, Model',
      tags: ['pricing', 'ec2'],
      difficulty: 'intermediate'
    }
  ]
};
