// Domain 4: Billing, Pricing, and Support (12% of exam)
// CLF-C02 Exam Content

export const billingSupport = {
  id: 'billing-support',
  name: 'Billing, Pricing & Support',
  icon: '💰',
  weight: '12%',
  color: '#f472b6',
  description: 'AWS pricing models, billing services, and support plans',
  questions: [
    {
      id: 'bs1',
      question: 'A solutions architect is planning a migration and must present leadership with an estimate of monthly AWS costs before any resources are deployed. Which tool should the architect use?',
      options: [
        'AWS Cost Explorer',
        'AWS Budgets',
        'AWS Pricing Calculator',
        'AWS Cost and Usage Report'
      ],
      correctAnswer: 2,
      explanation: 'The AWS Pricing Calculator models the cost of a planned architecture before anything is deployed, producing shareable estimates for services you have not used yet. Cost Explorer and the Cost and Usage Report only analyze spend that has already occurred, and Budgets tracks actual or forecasted spend against thresholds rather than estimating new workloads.',
      sources: [
        { title: 'What is AWS Pricing Calculator? – AWS Pricing Calculator User Guide', url: 'https://docs.aws.amazon.com/pricing-calculator/latest/userguide/what-is-pricing-calculator.html', checked: '2026-11-25' },
        { title: 'Analyzing your costs and usage with AWS Cost Explorer – AWS Cost Management', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs2',
      question: 'A large enterprise wants a designated AWS employee who proactively reviews its architecture, coordinates access to AWS experts, and provides ongoing operational guidance. Which support plan includes this Technical Account Manager (TAM)?',
      options: [
        'Enterprise Support',
        'Business Support+',
        'Developer',
        'Basic'
      ],
      correctAnswer: 0,
      explanation: 'A designated Technical Account Manager is an Enterprise Support feature (the higher Unified Operations plan includes one too), providing consultative architectural and operational guidance tailored to the customer. Business Support+ offers 24/7 access to Cloud Support Engineers and the full set of Trusted Advisor checks but no TAM, while Developer (being discontinued on January 1, 2027) and Basic offer no designated contact at all.',
      sources: [
        { title: 'AWS Support Plans – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html', checked: '2026-11-25' },
        { title: 'Compare AWS Support plans – AWS Support', url: 'https://aws.amazon.com/premiumsupport/plans/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs3',
      question: 'A startup has just created its first AWS account and wants to experiment with services such as EC2 and S3 without incurring charges. Which statement accurately describes the AWS Free Tier the startup can use?',
      options: [
        'It makes every AWS service permanently free as long as usage stays low',
        'It refunds new customers for whatever they spend during their first month',
        'It applies discounted academic pricing to accounts owned by students',
        'It offers new customers up to $200 in credits, plus Always Free monthly allowances and short-term trials for select services'
      ],
      correctAnswer: 3,
      explanation: 'New AWS customers get USD $100 in credits at sign-up and can earn up to $100 more, choosing a Free account plan (no charges for up to six months or until the credits run out) or a Paid plan. On top of that, more than 30 services have Always Free monthly allowances, and select services offer short-term trials. It does not make every service free, it is not a refund program, and it is unrelated to academic discounts.',
      sources: [
        { title: 'Explore AWS services with AWS Free Tier – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html', checked: '2026-11-25' },
        { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs4',
      question: 'A company runs a database server with steady, predictable usage 24/7 and expects the workload to continue unchanged for the next three years. Compared with On-Demand, why would Reserved Instances be the better choice?',
      options: [
        'Reserved Instances run on physical hardware dedicated to one customer',
        'Reserved Instances trade a 1- or 3-year commitment for discounts of up to 72%',
        'Reserved Instances can scale automatically while On-Demand cannot',
        'Reserved Instances are exempt from data transfer and storage charges'
      ],
      correctAnswer: 1,
      explanation: 'Reserved Instances offer up to 72% savings over On-Demand in exchange for a 1- or 3-year commitment, which fits steady, predictable workloads perfectly. Dedicated hardware describes Dedicated Hosts, not RIs, auto scaling is a separate feature available to any purchasing option, and no purchasing option waives data transfer or storage charges.',
      sources: [
        { title: 'Amazon EC2 Reserved Instances', url: 'https://aws.amazon.com/ec2/pricing/reserved-instances/', checked: '2026-11-25' },
        { title: 'Amazon EC2 billing and purchasing options – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs5',
      question: 'A company has grown to 40 AWS accounts across several business units and wants to apply governance policies centrally and receive one combined bill. Which service should it use?',
      options: [
        'AWS IAM Identity Center',
        'AWS Resource Groups',
        'AWS Organizations',
        'AWS Config'
      ],
      correctAnswer: 2,
      explanation: 'AWS Organizations centrally manages multiple AWS accounts, letting you apply service control policies across them and consolidate billing into a single invoice. IAM Identity Center manages workforce sign-in rather than accounts themselves, Resource Groups only organizes resources within accounts, and AWS Config records resource configuration changes.',
      sources: [
        { title: 'What is AWS Organizations? – AWS Organizations User Guide', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs6',
      question: 'A finance manager wants an automatic email alert when the company\'s monthly AWS spend is forecasted to exceed $5,000, before the overage actually happens. Which tool provides this?',
      options: [
        'AWS Budgets',
        'AWS Cost Explorer',
        'AWS Pricing Calculator',
        'AWS CloudTrail'
      ],
      correctAnswer: 0,
      explanation: 'AWS Budgets lets you set custom cost or usage thresholds and sends alerts when actual or forecasted spend crosses them, so it can warn before the $5,000 mark is reached. Cost Explorer visualizes and forecasts spend but does not send threshold alerts, the Pricing Calculator only estimates costs pre-deployment, and CloudTrail logs API activity, not spending.',
      sources: [
        { title: 'Managing your costs with AWS Budgets – AWS Cost Management', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs7',
      question: 'A media company runs a nightly batch job that renders video thumbnails. The job is fault-tolerant and can resume after a failure, and the company wants the lowest possible EC2 cost. Which purchasing option is the best fit?',
      options: [
        'On-Demand Instances',
        'Reserved Instances',
        'Dedicated Hosts',
        'Spot Instances'
      ],
      correctAnswer: 3,
      explanation: 'Spot Instances sell unused EC2 capacity at discounts of up to 90%, and the trade-off — interruption with a two-minute warning — is acceptable because the batch job can resume. On-Demand carries no discount, Reserved Instances suit steady 24/7 workloads rather than interruptible batches, and Dedicated Hosts dedicate an entire physical server to you for licensing or compliance needs, not to cut cost for interruptible jobs.',
      sources: [
        { title: 'Amazon EC2 Spot Instances', url: 'https://aws.amazon.com/ec2/spot/', checked: '2026-11-25' },
        { title: 'Spot Instance interruption notices – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs8',
      question: 'A student is learning AWS on a personal account and does not want to pay anything for support. Which support plan is included at no charge for every AWS customer?',
      options: [
        'Business Support+',
        'Basic',
        'Enterprise Support',
        'Unified Operations'
      ],
      correctAnswer: 1,
      explanation: 'Basic support is free and automatically included with every AWS account, providing 24/7 customer service for account and billing questions, documentation, AWS re:Post, AWS Health, and the core Trusted Advisor checks. Business Support+, Enterprise Support, and Unified Operations are paid plans that add technical support cases and faster response times (the older Developer and Business plans are being discontinued on January 1, 2027).',
      sources: [
        { title: 'Compare AWS Support plans – AWS Support', url: 'https://aws.amazon.com/premiumsupport/plans/', checked: '2026-11-25' },
        { title: 'AWS Support Plans – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs9',
      question: 'A company with 25 AWS accounts in an organization enables Consolidated Billing. What benefit should the company expect?',
      options: [
        'Each account continues to receive and pay its own separate invoice',
        'Free Tier allowances are multiplied by the number of member accounts',
        'One combined bill, with aggregated usage that can reach volume discount tiers sooner',
        'Idle resources across all accounts are automatically terminated to reduce spend'
      ],
      correctAnswer: 2,
      explanation: 'Consolidated Billing rolls all member accounts into a single invoice paid by the management account, and because usage is aggregated across accounts, tiered volume discounts can kick in sooner. It does not multiply Free Tier benefits across accounts, and no billing feature terminates resources on its own.',
      sources: [
        { title: 'Consolidating billing for AWS Organizations – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html', checked: '2026-11-25' },
        { title: 'Effective billing date, account activity, and volume discounts – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/useconsolidatedbilling-effective.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs10',
      question: 'A cloud analyst is asked why the company\'s AWS bill jumped 40% last month and to project spending for the next quarter. Which tool lets the analyst visualize historical costs and generate forecasts?',
      options: [
        'AWS Cost Explorer',
        'AWS Pricing Calculator',
        'AWS Budgets',
        'AWS Trusted Advisor'
      ],
      correctAnswer: 0,
      explanation: 'Cost Explorer provides interactive charts of historical cost and usage, filters by service or tag to find what drove the increase, and forecasts future spend. The Pricing Calculator only estimates costs before deployment, Budgets alerts on thresholds rather than analyzing history, and Trusted Advisor gives best-practice recommendations, not spend visualizations.',
      sources: [
        { title: 'Analyzing your costs and usage with AWS Cost Explorer – AWS Cost Management', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs11',
      question: 'A research team\'s simulation workload can tolerate interruptions and restarts. The team wants the EC2 purchasing option with the deepest possible discount off On-Demand pricing. Which option offers it?',
      options: [
        'Savings Plans',
        'Spot Instances',
        'Reserved Instances',
        'Dedicated Hosts'
      ],
      correctAnswer: 1,
      explanation: 'Spot Instances offer the largest discount of any EC2 purchasing option — up to 90% off On-Demand — because they use spare capacity that AWS can reclaim with a two-minute warning. Savings Plans and Reserved Instances top out around 72% and require a 1- or 3-year commitment, and Dedicated Hosts pay for a whole physical server for licensing or compliance needs rather than offering a deep discount.',
      sources: [
        { title: 'Amazon EC2 Spot Instances', url: 'https://aws.amazon.com/ec2/spot/', checked: '2026-11-25' },
        { title: 'What are Savings Plans? – Savings Plans User Guide', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs12',
      question: 'An operations team wants automated checks that flag idle EC2 instances, overly permissive security groups, low fault tolerance, and approaching service limits in its account. Which AWS tool provides these recommendations?',
      options: [
        'Amazon Inspector',
        'AWS Config',
        'AWS CloudTrail',
        'AWS Trusted Advisor'
      ],
      correctAnswer: 3,
      explanation: 'Trusted Advisor runs automated best-practice checks across six categories — cost optimization, performance, security, fault tolerance, service limits, and operational excellence — which covers all the items the team listed. Inspector focuses on workload vulnerability scanning, Config records and evaluates resource configuration changes, and CloudTrail logs API activity.',
      sources: [
        { title: 'AWS Trusted Advisor check reference – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor-check-reference.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs13',
      question: 'A consulting firm wants to formally partner with AWS, earn competency designations, and be recognized for delivering customer solutions on AWS. Which program should the firm join?',
      options: [
        'AWS Professional Services',
        'AWS Managed Services',
        'The AWS Partner Network (APN)',
        'AWS Activate'
      ],
      correctAnswer: 2,
      explanation: 'The AWS Partner Network is the global program for consulting and technology companies that build or deliver solutions on AWS, offering training, competencies, and go-to-market benefits. Professional Services and Managed Services are teams AWS itself provides to customers, and Activate is a credits program for startups, not a partner program.',
      sources: [
        { title: 'Becoming an AWS Partner – AWS Partner Central', url: 'https://docs.aws.amazon.com/partner-central/latest/getting-started/becoming.html', checked: '2026-11-25' },
        { title: 'AWS Specializations – AWS Partner Network', url: 'https://aws.amazon.com/partners/programs/specializations/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs14',
      question: 'A company wants compute discounts but expects to switch instance families, sizes, and Regions as its workloads evolve. It is willing to commit to a consistent spend of $10/hour for three years. Which pricing option fits best?',
      options: [
        'Compute Savings Plans',
        'On-Demand Capacity Reservations',
        'Standard Reserved Instances for a specific instance type',
        'Spot Instances'
      ],
      correctAnswer: 0,
      explanation: 'Compute Savings Plans exchange a 1- or 3-year commitment to a consistent amount of compute usage, measured in dollars per hour, for savings of up to 72% — while automatically applying across instance families, sizes, and Regions. Standard Reserved Instances lock you to specific attributes, Capacity Reservations guarantee capacity without a discount, and Spot provides no guarantee the instances will keep running.',
      sources: [
        { title: 'What are Savings Plans? – Savings Plans User Guide', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html', checked: '2026-11-25' },
        { title: 'Reserve compute capacity with EC2 On-Demand Capacity Reservations – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs15',
      question: 'A financial services company runs a business-critical trading platform and requires AWS to respond in under 15 minutes if that system goes down. Which support plan is the minimum that targets this response time?',
      options: [
        'Business Support+',
        'Enterprise Support',
        'Unified Operations',
        'Basic'
      ],
      correctAnswer: 1,
      explanation: 'Enterprise Support is the lowest plan with a response target of under 15 minutes for business-critical system down cases. Business Support+\'s fastest target is under 30 minutes, Unified Operations is faster still (under 5 minutes) but is a higher tier than this requirement needs, and Basic includes no technical support cases at all.',
      sources: [
        { title: 'Compare AWS Support plans – AWS Support', url: 'https://aws.amazon.com/premiumsupport/plans/', checked: '2026-11-25' },
        { title: 'AWS Support Plans – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs16',
      question: 'Finance wants the monthly AWS bill broken down by project and department. What must be set up to enable this?',
      options: [
        'Cost allocation tags applied to resources and activated in the Billing console',
        'A separate AWS account for every employee',
        'An Enterprise support plan, which includes per-project billing',
        'CloudFront distributions for each department'
      ],
      correctAnswer: 0,
      explanation: 'Tagging resources (e.g., project:alpha, department:marketing) and activating those tags as cost allocation tags lets Cost Explorer and reports slice spending by tag. Per-employee accounts is impractical for this goal, and support plans and CDNs don\'t affect billing breakdowns.',
      sources: [
        { title: 'Organizing and tracking costs using AWS cost allocation tags – AWS Billing User Guide', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs17',
      question: 'An analytics team needs the most detailed, line-item-level data about AWS usage and costs, delivered to S3 for querying. Which tool provides this?',
      options: [
        'The AWS Cost and Usage Report (CUR)',
        'The monthly PDF invoice',
        'AWS Trusted Advisor',
        'Amazon Inspector findings'
      ],
      correctAnswer: 0,
      explanation: 'The Cost and Usage Report is the most granular billing dataset AWS offers — hourly line items per resource and tag, delivered to S3 where you can query it with Athena or load it into Amazon Redshift. Invoices summarize, Trusted Advisor gives recommendations, and Inspector is security scanning.',
      sources: [
        { title: 'What are AWS Cost and Usage Reports? – AWS Data Exports', url: 'https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs18',
      question: 'A company runs production workloads and needs 24/7 phone support with a response under one hour when a production system is down, at the lowest cost. Which support plan fits?',
      options: ['Basic', 'Developer', 'Business Support+', 'Enterprise Support'],
      correctAnswer: 2,
      explanation: 'Business Support+ is AWS\'s minimum recommended plan for production workloads: 24/7 phone, web, and chat access, the full set of Trusted Advisor checks, and <1 hour response for production system down. Developer is being discontinued on January 1, 2027 (customers move to Business Support+), Basic has no technical support cases, and Enterprise Support costs far more ($5,000 minimum, adding a TAM and 15-minute critical response).',
      sources: [
        { title: 'Compare AWS Support plans – AWS Support', url: 'https://aws.amazon.com/premiumsupport/plans/', checked: '2026-11-25' },
        { title: 'Developer, Business, and Enterprise On-Ramp end of support – AWS Support User Guide', url: 'https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs19',
      question: 'Which statement correctly describes AWS data transfer pricing?',
      options: [
        'Data transferred IN to AWS from the internet is generally free; data transferred OUT to the internet is charged',
        'Inbound and outbound transfer are both always free',
        'Inbound transfer is charged; outbound is free',
        'Data transfer pricing depends on the support plan'
      ],
      correctAnswer: 0,
      explanation: 'The general rule: inbound from the internet is free, outbound to the internet is billed per GB (with tiering), and inter-Region or inter-AZ transfers carry their own rates. The reversed version is a common trap, and support plans never change transfer rates.',
      sources: [
        { title: 'Exploring Data Transfer Costs for AWS Managed Databases – AWS Architecture Blog', url: 'https://aws.amazon.com/blogs/architecture/exploring-data-transfer-costs-for-aws-managed-databases/', checked: '2026-11-25' },
        { title: 'Amazon EC2 On-Demand Pricing', url: 'https://aws.amazon.com/ec2/pricing/on-demand/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'bs20',
      question: 'A company wants to buy third-party software (like a firewall appliance or SaaS tool) with billing consolidated into its existing AWS invoice. Where does it purchase this?',
      options: ['AWS Marketplace', 'The AWS Partner Network directory', 'AWS Artifact', 'The AWS Pricing Calculator'],
      correctAnswer: 0,
      explanation: 'AWS Marketplace is the curated catalog where third-party software is subscribed to and billed through your AWS account. The Partner Network lists consulting/technology partners but sells nothing directly, Artifact serves compliance reports, and the Pricing Calculator only estimates costs.',
      sources: [
        { title: 'What is AWS Marketplace? – AWS Marketplace Buyer Guide', url: 'https://docs.aws.amazon.com/marketplace/latest/buyerguide/what-is-marketplace.html', checked: '2026-11-25' }
      ]
    }
  ]
};
