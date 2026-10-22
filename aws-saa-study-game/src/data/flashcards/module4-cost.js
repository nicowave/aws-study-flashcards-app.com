// Module 4: Cost Optimization
// AWS Solutions Architect Associate (SAA-C03)

export const module4 = {
  id: 'module4',
  name: 'Cost Optimization',
  description: 'Pricing models, storage tiers, and cost tooling',
  icon: '💰',
  color: '#d29922',
  gradient: 'linear-gradient(135deg, #d29922 0%, #d29922 100%)',
  source: 'SAA-C03 Exam Guide',
  cards: [
    {
      id: 'saa-cost-c1',
      front: 'S3 storage classes: minimum storage duration and retrieval speed?',
      back: '• Standard / Intelligent-Tiering: no minimum, milliseconds\n• Standard-IA / One Zone-IA: 30 days, ms, per-GB retrieval fee, 128 KB minimum billable size\n• Glacier Instant Retrieval: 90 days, ms\n• Glacier Flexible Retrieval: 90 days, Expedited 1-5 min, Standard 3-5 h, Bulk 5-12 h\n• Glacier Deep Archive: 180 days, Standard within 12 h, Bulk within 48 h\nDeleting early still bills the remaining minimum days.',
      hint: '0 / 30 / 90 / 90 / 180',
      tags: ['s3', 'storage-classes'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c2',
      front: 'S3 Intelligent-Tiering vs a lifecycle rule: when do you pick each?',
      back: '• Intelligent-Tiering: access pattern unknown or changing. Moves each object by its own access history, no retrieval fees, small per-object monitoring fee (objects under 128 KB are not monitored and stay in the frequent tier).\n• Lifecycle rule: access pattern known and age-based (e.g. "rarely read after 30 days, delete after 1 year"). Cheapest when predictable.\nEFS has the same idea: lifecycle policies to IA/Archive, or EFS Intelligent-Tiering to move files back on access.',
      hint: 'Unknown pattern vs known age',
      tags: ['s3', 'lifecycle', 'efs'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c3',
      front: 'Cost allocation tags and consolidated billing: what catches people out?',
      back: '• User-defined tags show up in Cost Explorer, Budgets and CUR only after you ACTIVATE them as cost allocation tags (management account in an organization).\n• Tagging resources alone does nothing for billing reports.\n• Consolidated billing (AWS Organizations): one bill, usage pooled for volume pricing tiers, and RI / Savings Plans discounts shared across accounts by default (sharing can be turned off per account).',
      hint: 'Tag, then activate',
      tags: ['tagging', 'organizations', 'exam-trap'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-cost-c4',
      front: 'gp2 vs gp3: why is gp3 the default answer?',
      back: '• gp2: IOPS tied to size (3 IOPS per GiB, burst credits for small volumes). To get more IOPS you buy more GB.\n• gp3: 3,000 IOPS and 125 MiB/s baseline at any size, IOPS and throughput provisioned independently, and a lower price per GB.\n• Migrate in place with Elastic Volumes, no downtime.\nOver-sized gp2 volumes bought "for IOPS" are an easy saving.',
      hint: 'Baseline 3,000 IOPS at any size',
      tags: ['ebs', 'storage'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-cost-c5',
      front: 'Standard vs Convertible Reserved Instances?',
      back: '• Standard RI: deepest RI discount; can modify AZ, size (within family, Linux) and network; can be sold on the RI Marketplace.\n• Convertible RI: smaller discount; can be EXCHANGED for another family, OS or tenancy of equal or greater value; cannot be sold on the Marketplace.\n• Both: 1 or 3 years; All, Partial or No Upfront.\n• Regional RIs give size flexibility; zonal RIs reserve capacity in one AZ.',
      hint: 'Sell vs exchange',
      tags: ['ec2', 'reserved-instances'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c6',
      front: 'Compute Savings Plan vs EC2 Instance Savings Plan?',
      back: '• Compute SP: commit to $/hour; applies to any EC2 family, size, Region, OS, tenancy, plus Fargate and Lambda. Most flexible, smaller discount (up to 66%).\n• EC2 Instance SP: one instance family in one Region; flexible on size, OS, tenancy. Deeper discount (up to 72%).\nRule: changing family/Region or moving to containers or serverless -> Compute SP. Locked to one family -> EC2 Instance SP.\nNeither covers RDS.',
      hint: 'Flexibility vs depth',
      tags: ['ec2', 'savings-plans'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c7',
      front: 'Spot Instances: when to use them, and how to handle interruptions?',
      back: '• Up to 90% off On-Demand; for fault-tolerant, flexible, stateless or checkpointed work (batch, CI, rendering, big data, stateless web behind a load balancer).\n• 2-minute interruption notice (instance metadata + EventBridge); a rebalance recommendation can arrive earlier.\n• Diversify instance types and AZs; use price-capacity-optimized allocation.\n• ASG: mixed instances policy + Capacity Rebalancing + termination lifecycle hooks to drain.\nNever for a single critical database.',
      hint: 'Two minutes, diversify',
      tags: ['ec2', 'spot'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c8',
      front: 'Dedicated Hosts vs Dedicated Instances: which one for BYOL licensing?',
      back: '• Dedicated Host: a whole physical server for you; visibility of sockets and cores; host affinity keeps instances on the same host. Needed for per-socket / per-core / per-VM licenses (Windows Server, SQL Server, Oracle).\n• Dedicated Instance: runs on hardware not shared with other customers, billed per instance, but no core visibility or host placement control.\nTrap: "compliance needs single-tenant hardware" alone -> Dedicated Instances is enough; "existing server-bound licenses" -> Dedicated Hosts.',
      hint: 'Licenses need visibility',
      tags: ['ec2', 'licensing', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c9',
      front: 'Lambda vs Fargate vs EC2: which is cheapest for which load?',
      back: '• Lambda: pay per request and GB-second; nothing when idle. Cheapest for spiky, intermittent or low-volume work.\n• Fargate: pay per vCPU and GB per second for running tasks; no servers; Fargate Spot for interruptible tasks.\n• EC2: cheapest per unit at high, steady utilization, especially with Savings Plans, Spot and Graviton.\nThe more constant the load, the more the answer moves from Lambda toward containers or EC2.',
      hint: 'Idle cost vs unit cost',
      tags: ['lambda', 'fargate', 'ec2'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c10',
      front: 'Aurora Standard vs I/O-Optimized vs Serverless v2: cost rules?',
      back: '• Aurora Standard: pay per I/O request; best when I/O is a small share of spend.\n• I/O-Optimized: no I/O charges, higher instance and storage prices; AWS suggests it when I/O exceeds about 25% of Aurora spend. Switchable per cluster.\n• Serverless v2: capacity in ACUs scaled automatically and billed per second; for variable, unpredictable or intermittent load (dev/test, new apps).\n• Steady 24/7 provisioned load -> Reserved Instances.',
      hint: '25% rule',
      tags: ['aurora', 'database'],
      difficulty: 'advanced'
    },
    {
      id: 'saa-cost-c11',
      front: 'DynamoDB cost levers: capacity modes, reserved capacity, table classes?',
      back: '• On-demand: pay per request; best for new, unpredictable or spiky tables.\n• Provisioned + auto scaling: cheaper for steady, predictable traffic.\n• Reserved capacity: 1 or 3-year commitment on provisioned capacity for the baseline.\n• Standard-IA table class: much cheaper storage, pricier reads/writes; use when storage dominates cost.\n• TTL: expired items deleted at no write cost.',
      hint: 'Predictability and storage share',
      tags: ['dynamodb', 'database'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c12',
      front: 'Can you save money by stopping an RDS or Aurora database?',
      back: 'Yes, partly.\n• Stopped: no instance-hour charges.\n• Still billed: storage, provisioned IOPS, backups and snapshots.\n• Trap: a stopped RDS instance or Aurora cluster starts again automatically after 7 days, so use a schedule (EventBridge Scheduler, Lambda or Systems Manager) to keep dev databases stopped outside working hours.\n• Longer idle periods: snapshot and delete, or use Aurora Serverless v2.',
      hint: 'Seven days',
      tags: ['rds', 'aurora', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c13',
      front: 'AWS data transfer pricing: what is free and what is billed?',
      back: '• Inbound from the internet: free.\n• Same AZ over private IP: free. Same AZ via public or Elastic IP: billed.\n• Across AZs in a Region: billed in each direction.\n• Across Regions: billed per GB.\n• Out to the internet: billed, tiered by volume.\n• S3 or other AWS origins to CloudFront: free; CloudFront egress usually cheaper than direct.\n• Direct Connect egress: lower rates than internet.',
      hint: 'In is free, out costs',
      tags: ['networking', 'data-transfer'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c14',
      front: 'Private subnet to S3: NAT gateway vs gateway endpoint vs interface endpoint cost?',
      back: '• NAT gateway: hourly charge + per-GB data processing. Expensive for heavy S3 or DynamoDB traffic.\n• Gateway VPC endpoint (S3 and DynamoDB only): FREE, added to route tables.\n• Interface endpoint (PrivateLink): hourly per AZ + per GB; needed for other services or for access from on premises.\nTrap: for S3 or DynamoDB cost questions, pick the gateway endpoint, not the interface endpoint.',
      hint: 'Gateway endpoints are free',
      tags: ['vpc', 'networking', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-cost-c15',
      front: 'Which cost tool for which job?',
      back: '• Pricing Calculator: estimate before you build.\n• Cost Explorer: analyze past spend, forecast, RI/SP recommendations, coverage and utilization.\n• Budgets: alert on actual or forecast spend; Budget Actions apply IAM/SCP policies or stop EC2/RDS.\n• Cost Anomaly Detection: ML alerts on unusual spend, no thresholds.\n• CUR 2.0 (Data Exports): most detailed line items to S3, query with Athena.\n• Trusted Advisor / Compute Optimizer: savings and right-sizing recommendations.',
      hint: 'Estimate, analyze, alert, export',
      tags: ['cost-management', 'tools'],
      difficulty: 'beginner'
    }
  ]
};
