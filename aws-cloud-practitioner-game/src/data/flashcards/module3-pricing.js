// Module 3: Pricing, Billing & Support
// Sources: official AWS documentation, linked on each card

export const module3 = {
  id: 'module3',
  name: 'Pricing & Support',
  description: 'AWS pricing models, billing tools, and support plans',
  icon: '💰',
  color: '#67e8f9',
  gradient: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'pr1',
      front: 'What are the 3 AWS pricing fundamentals?',
      back: '1. Pay-as-you-go\n   • Pay only for what you use\n   • No termination fees, stop anytime\n\n2. Save when you commit\n   • Savings Plans (1 or 3 years): up to 72% savings\n\n3. Pay less by using more\n   • Tiered (volume-based) pricing\n   • The more you use, the less per unit\n\n(AWS also now lists flat-rate plans)',
      hint: 'Pay-as-you-go, Commit, Use more',
      tags: ['pricing', 'fundamentals'],
      difficulty: 'beginner',
      sources: [
        { title: 'AWS Product and Service Pricing', url: 'https://aws.amazon.com/pricing/', checked: '2026-11-25' },
        { title: 'Cloud Cost Savings – Savings Plans', url: 'https://aws.amazon.com/savingsplans/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr2',
      front: 'What is the AWS Free Tier?',
      back: 'For accounts created since July 15, 2025:\n\n1. Credits\n   • $100 at sign-up + up to $100 more for completing activities\n   • Free plan: no charges for up to 6 months (or until credits run out)\n\n2. Always Free (30+ services)\n   • Lambda: 1M requests/month\n   • DynamoDB: 25GB storage\n\n3. Short-term trials\n\nOlder accounts keep the legacy 12-months-free offers',
      hint: 'Credits, Always Free, Trials',
      tags: ['pricing', 'free-tier'],
      difficulty: 'beginner',
      sources: [
        { title: 'Explore AWS services with AWS Free Tier – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html', checked: '2026-11-25' },
        { title: 'Free Cloud Computing Services – AWS Free Tier', url: 'https://aws.amazon.com/free/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr3',
      front: 'What are the EC2 pricing options?',
      back: '1. On-Demand: Pay by hour/second\n   • No commitment, highest price\n\n2. Reserved: 1-3 year commitment\n   • Up to 72% off On-Demand\n\n3. Spot: Use spare EC2 capacity\n   • Up to 90% off, can be interrupted\n\n4. Savings Plans: $/hour commitment\n   • Flexible across services',
      hint: 'On-Demand → Reserved → Spot',
      tags: ['pricing', 'ec2'],
      difficulty: 'beginner',
      sources: [
        { title: 'Amazon EC2 Pricing', url: 'https://aws.amazon.com/ec2/pricing/', checked: '2026-11-25' },
        { title: 'Amazon EC2 Reserved Instances', url: 'https://aws.amazon.com/ec2/pricing/reserved-instances/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr4',
      front: 'What is AWS Organizations?',
      back: 'Centrally manage multiple AWS accounts\n\nFeatures:\n• Consolidated billing\n• Volume discounts across accounts\n• Service Control Policies (SCPs)\n• Hierarchical organization\n• Automate account creation',
      hint: 'Think: multi-account management',
      tags: ['billing', 'organizations'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is AWS Organizations? – AWS Organizations User Guide', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html', checked: '2026-11-25' },
        { title: 'Consolidating billing for AWS Organizations – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr5',
      front: 'What is Consolidated Billing?',
      back: 'Single bill for multiple accounts\n\nBenefits:\n• One payment method\n• Combined usage for volume discounts\n• Track charges per account\n• Share Reserved Instances & Savings Plans\n• No extra cost',
      hint: 'One bill, combined discounts',
      tags: ['billing', 'consolidated-billing'],
      difficulty: 'beginner',
      sources: [
        { title: 'Consolidating billing for AWS Organizations – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr6',
      front: 'What is AWS Budgets?',
      back: 'Set custom cost & usage budgets\n\nFeatures:\n• Cost budgets\n• Usage budgets\n• Reservation & Savings Plans budgets\n• Email/SNS alerts\n• Forecast warnings\n• Monitoring is free; first 2 action-enabled budgets free',
      hint: 'Think: spending alerts',
      tags: ['billing', 'budgets'],
      difficulty: 'beginner',
      sources: [
        { title: 'Managing your costs with AWS Budgets – AWS Cost Management User Guide', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html', checked: '2026-11-25' },
        { title: 'AWS Budgets Pricing', url: 'https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr7',
      front: 'What is AWS Cost Explorer?',
      back: 'Visualize & analyze costs\n\nFeatures:\n• Historical cost data (current + previous 13 months)\n• Forecast future costs (up to 18 months)\n• Filter by service, region, tag\n• Identify trends\n• Recommendations for savings',
      hint: 'Think: cost graphs & reports',
      tags: ['billing', 'cost-explorer'],
      difficulty: 'beginner',
      sources: [
        { title: 'Exploring more data for advanced cost analysis – AWS Cost Management User Guide', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-advanced-cost-analysis.html', checked: '2026-11-25' },
        { title: 'Modifying your chart – AWS Cost Management User Guide', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-modify.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr8',
      front: 'What are the AWS Support Plans?',
      back: 'Basic (Free):\n• Customer service, documentation, re:Post\n• Trusted Advisor core checks\n\nBusiness Support+ (from $29/mo per account):\n• 24/7 phone, chat, email + AI help\n• < 30 min business-critical down, < 1hr production down\n\nEnterprise Support (from $5K/mo):\n• Designated TAM, < 15min critical response\n\nUnified Operations (from $50K/mo):\n• < 5min response for mission-critical incidents\n\nDeveloper, Business and Enterprise On-Ramp: closed to new sign-ups, end Jan 1, 2027',
      hint: 'Basic → Business Support+ → Enterprise → Unified Operations',
      tags: ['support', 'support-plans'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Support Plans – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html', checked: '2026-11-25' },
        { title: 'AWS Support pricing', url: 'https://aws.amazon.com/premiumsupport/pricing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr9',
      front: 'What is AWS Trusted Advisor?',
      back: 'Best practice recommendations\n\n6 Categories:\n• Cost Optimization\n• Performance\n• Security\n• Fault Tolerance\n• Service Limits\n• Operational Excellence\n\nBasic: 6 core security checks + service limit checks\nBusiness Support+ and higher: All checks',
      hint: 'Think: AWS best practice checker',
      tags: ['support', 'trusted-advisor'],
      difficulty: 'beginner',
      sources: [
        { title: 'Get started with Trusted Advisor Recommendations – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/get-started-with-aws-trusted-advisor.html', checked: '2026-11-25' },
        { title: 'AWS Premium Support FAQs', url: 'https://aws.amazon.com/premiumsupport/faqs/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr10',
      front: 'What is the AWS Pricing Calculator?',
      back: 'Estimate costs before deployment\n\nFeatures:\n• Model your solution\n• Compare configurations\n• Export estimates\n• Share with stakeholders\n• Free to use',
      hint: 'Think: cost estimator tool',
      tags: ['billing', 'pricing-calculator'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is AWS Pricing Calculator? – AWS Pricing Calculator User Guide', url: 'https://docs.aws.amazon.com/pricing-calculator/latest/userguide/what-is-pricing-calculator.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr11',
      front: 'What is a Technical Account Manager (TAM)?',
      back: 'Designated AWS expert for your account\n\nIncluded with Enterprise Support and Unified Operations:\n• Proactive guidance\n• Architecture reviews\n• Operational best practices\n• Coordinates AWS resources\n• Helps optimize AWS usage',
      hint: 'Enterprise Support and above',
      tags: ['support', 'tam'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Support Plans – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html', checked: '2026-11-25' },
        { title: 'Enterprise cloud support – AWS Enterprise Support plan', url: 'https://aws.amazon.com/premiumsupport/plans/enterprise/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'pr12',
      front: 'What factors affect EC2 pricing?',
      back: 'EC2 cost factors:\n\n• Instance type (CPU, memory, etc.)\n• Region\n• Operating system\n• Pricing model (On-Demand, etc.)\n• Tenancy (shared vs dedicated)\n• Data transfer out',
      hint: 'Type, Region, OS, Model',
      tags: ['pricing', 'ec2'],
      difficulty: 'intermediate',
      sources: [
        { title: 'EC2 On-Demand Instance Pricing', url: 'https://aws.amazon.com/ec2/pricing/on-demand/', checked: '2026-11-25' },
        { title: 'Amazon EC2 billing and purchasing options – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html', checked: '2026-11-25' }
      ]
    }
  ]
};
