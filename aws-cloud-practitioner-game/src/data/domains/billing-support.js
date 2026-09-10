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
      question: 'A solutions architect is planning a migration and must present leadership with an estimate of monthly AWS costs before any resources are deployed. Which tool should the architect use?',
      options: [
        'AWS Cost Explorer',
        'AWS Budgets',
        'AWS Pricing Calculator',
        'AWS Cost and Usage Report'
      ],
      correctAnswer: 2,
      explanation: 'The AWS Pricing Calculator models the cost of a planned architecture before anything is deployed, producing shareable estimates for services you have not used yet. Cost Explorer and the Cost and Usage Report only analyze spend that has already occurred, and Budgets tracks actual or forecasted spend against thresholds rather than estimating new workloads.'
    },
    {
      id: 'bs2',
      question: 'A large enterprise wants a designated AWS employee who proactively reviews its architecture, coordinates access to AWS experts, and provides ongoing operational guidance. Which support plan includes this Technical Account Manager (TAM)?',
      options: [
        'Enterprise',
        'Business',
        'Developer',
        'Basic'
      ],
      correctAnswer: 0,
      explanation: 'A designated Technical Account Manager is an Enterprise support plan feature, providing consultative architectural and operational guidance tailored to the customer. Business support offers 24/7 technical support and full Trusted Advisor checks but no TAM, while Developer and Basic offer no designated contact at all.'
    },
    {
      id: 'bs3',
      question: 'A startup has just created its first AWS account and wants to experiment with services such as EC2 and S3 without incurring charges. Which statement accurately describes the AWS Free Tier the startup can use?',
      options: [
        'It makes every AWS service permanently free as long as usage stays low',
        'It refunds new customers for whatever they spend during their first month',
        'It applies discounted academic pricing to accounts owned by students',
        'It offers limited free usage of certain services, including 12-month, always-free, and trial offers'
      ],
      correctAnswer: 3,
      explanation: 'The Free Tier provides limited free usage of specific services in three forms: 12 Months Free for new accounts, Always Free offers that never expire, and short-term trials. It does not cover every service or unlimited usage, it is not a refund program, and it is unrelated to academic discounts.'
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
      explanation: 'Reserved Instances offer up to 72% savings over On-Demand in exchange for a 1- or 3-year commitment, which fits steady, predictable workloads perfectly. Dedicated hardware describes Dedicated Hosts, not RIs, auto scaling is a separate feature available to any purchasing option, and no purchasing option waives data transfer or storage charges.'
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
      explanation: 'AWS Organizations centrally manages multiple AWS accounts, letting you apply service control policies across them and consolidate billing into a single invoice. IAM Identity Center manages workforce sign-in rather than accounts themselves, Resource Groups only organizes resources within accounts, and AWS Config records resource configuration changes.'
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
      explanation: 'AWS Budgets lets you set custom cost or usage thresholds and sends alerts when actual or forecasted spend crosses them, so it can warn before the $5,000 mark is reached. Cost Explorer visualizes and forecasts spend but does not send threshold alerts, the Pricing Calculator only estimates costs pre-deployment, and CloudTrail logs API activity, not spending.'
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
      explanation: 'Spot Instances sell unused EC2 capacity at discounts of up to 90%, and the trade-off — interruption with a two-minute warning — is acceptable because the batch job can resume. On-Demand carries no discount, Reserved Instances suit steady 24/7 workloads rather than interruptible batches, and Dedicated Hosts are the most expensive option, used for licensing or compliance needs.'
    },
    {
      id: 'bs8',
      question: 'A student is learning AWS on a personal account and does not want to pay anything for support. Which support plan is included at no charge for every AWS customer?',
      options: [
        'Developer',
        'Basic',
        'Business',
        'Enterprise'
      ],
      correctAnswer: 1,
      explanation: 'Basic support is free and automatically included with every AWS account, providing 24/7 customer service for account and billing questions, documentation, and the core Trusted Advisor checks. Developer, Business, and Enterprise are paid tiers that add technical support cases and faster response times.'
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
      explanation: 'Consolidated Billing rolls all member accounts into a single invoice paid by the management account, and because usage is aggregated across accounts, tiered volume discounts can kick in sooner. It does not multiply Free Tier benefits across accounts, and no billing feature terminates resources on its own.'
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
      explanation: 'Cost Explorer provides interactive charts of historical cost and usage, filters by service or tag to find what drove the increase, and forecasts future spend. The Pricing Calculator only estimates costs before deployment, Budgets alerts on thresholds rather than analyzing history, and Trusted Advisor gives best-practice recommendations, not spend visualizations.'
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
      explanation: 'Spot Instances offer the largest discount of any EC2 purchasing option — up to 90% off On-Demand — because they use spare capacity that AWS can reclaim with a two-minute warning. Savings Plans and Reserved Instances top out around 72% and require a 1- or 3-year commitment, and Dedicated Hosts carry a premium rather than a discount.'
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
      explanation: 'Trusted Advisor runs automated best-practice checks across five categories — cost optimization, performance, security, fault tolerance, and service limits — which covers all the items the team listed. Inspector focuses on workload vulnerability scanning, Config records and evaluates resource configuration changes, and CloudTrail logs API activity.'
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
      explanation: 'The AWS Partner Network is the global program for consulting and technology companies that build or deliver solutions on AWS, offering training, competencies, and go-to-market benefits. Professional Services and Managed Services are teams AWS itself provides to customers, and Activate is a credits program for startups, not a partner program.'
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
      explanation: 'Compute Savings Plans exchange a 1- or 3-year commitment to a consistent amount of compute usage, measured in dollars per hour, for savings of up to 72% — while automatically applying across instance families, sizes, and Regions. Standard Reserved Instances lock you to specific attributes, Capacity Reservations guarantee capacity without a discount, and Spot provides no guarantee the instances will keep running.'
    },
    {
      id: 'bs15',
      question: 'A financial services company runs a business-critical trading platform and requires AWS to respond in under 15 minutes if that system goes down. Which support plan is the minimum that guarantees this response time?',
      options: [
        'Business',
        'Enterprise',
        'Developer',
        'Basic'
      ],
      correctAnswer: 1,
      explanation: 'Only Enterprise support provides a response time of under 15 minutes for business-critical system down cases. Business support\'s fastest target is under 1 hour for a production system down, Developer offers business-hours support with slower targets, and Basic includes no technical support cases at all.'
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
      explanation: 'Tagging resources (e.g., project:alpha, department:marketing) and activating those tags as cost allocation tags lets Cost Explorer and reports slice spending by tag. Per-employee accounts is impractical for this goal, and support plans and CDNs don\'t affect billing breakdowns.'
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
      explanation: 'The Cost and Usage Report is the most granular billing dataset AWS offers — hourly line items per resource and tag, delivered to S3 where Athena or QuickSight can query it. Invoices summarize, Trusted Advisor gives recommendations, and Inspector is security scanning.'
    },
    {
      id: 'bs18',
      question: 'A company runs production workloads and needs 24/7 phone support with a response under one hour for production system impairment, at the lowest cost. Which support plan fits?',
      options: ['Basic', 'Developer', 'Business', 'Enterprise'],
      correctAnswer: 2,
      explanation: 'Business support is the entry point for production workloads: 24/7 phone/chat, full Trusted Advisor checks, and <1 hour response for production system impairment. Developer offers business-hours email only, Basic has no technical support cases, and Enterprise costs far more (adding a TAM and 15-minute critical response).'
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
      explanation: 'The general rule: inbound from the internet is free, outbound to the internet is billed per GB (with tiering), and inter-Region or inter-AZ transfers carry their own rates. The reversed version is a common trap, and support plans never change transfer rates.'
    },
    {
      id: 'bs20',
      question: 'A company wants to buy third-party software (like a firewall appliance or SaaS tool) with billing consolidated into its existing AWS invoice. Where does it purchase this?',
      options: ['AWS Marketplace', 'The AWS Partner Network directory', 'AWS Artifact', 'The AWS Pricing Calculator'],
      correctAnswer: 0,
      explanation: 'AWS Marketplace is the curated catalog where third-party software is subscribed to and billed through your AWS account. The Partner Network lists consulting/technology partners but sells nothing directly, Artifact serves compliance reports, and the Pricing Calculator only estimates costs.'
    }
  ]
};
