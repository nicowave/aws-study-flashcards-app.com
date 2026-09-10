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
      id: 'cost1',
      front: 'EC2 purchase option picker?',
      back: 'Match commitment to workload\n\n• Steady 24/7, 1-3 yrs → Reserved / Savings Plans (to ~72% off)\n• Interruptible batch → Spot (to ~90% off)\n• Spiky/unknown → On-Demand\n• BYOL / compliance → Dedicated Hosts',
      hint: 'Workload pattern decides',
      tags: ['ec2', 'pricing'],
      difficulty: 'beginner'
    },
    {
      id: 'cost2',
      front: 'Standard vs Convertible Reserved Instances?',
      back: 'Discount vs flexibility\n\n• Standard: bigger discount, locked instance family\n• Convertible: smaller discount, can EXCHANGE family/OS/tenancy\n• Both: 1 or 3 years, zonal RIs also reserve capacity\n• Unsure about future instance needs → Convertible',
      hint: 'Can you exchange it?',
      tags: ['reserved-instances', 'pricing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost3',
      front: 'Compute vs EC2 Instance Savings Plans?',
      back: 'Commit $/hour, not instances\n\n• Compute SP: applies to EC2 ANY family/Region + Fargate + Lambda\n• EC2 Instance SP: one family in one Region, bigger discount\n• Both beat RIs on simplicity — automatic application\n• Migrating/changing shapes → Compute SP',
      hint: 'Broad vs deep discount',
      tags: ['savings-plans', 'pricing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost4',
      front: 'Spot Instances: the model?',
      back: 'Spare capacity, huge discount\n\n• Up to ~90% off On-Demand\n• 2-minute interruption warning\n• Fits: batch, CI, stateless workers, fault-tolerant big data\n• Never: databases, stateful singletons\n• Mixed ASG: On-Demand base + Spot burst',
      hint: '2-minute warning',
      tags: ['spot', 'pricing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost5',
      front: 'S3 storage class ladder?',
      back: 'Colder = cheaper storage, pricier retrieval\n\n• Standard → Intelligent-Tiering → Standard-IA → One Zone-IA\n• Glacier: Instant (ms) → Flexible (min-hrs) → Deep Archive (hrs, cheapest)\n• IA/Glacier: retrieval fees + minimum storage durations (30/90/180 days)\n• One Zone-IA: single AZ — recreatable data only',
      hint: 'Cold storage, warm retrieval fees',
      tags: ['s3', 'storage-classes'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost6',
      front: 'S3 lifecycle policies + Intelligent-Tiering?',
      back: 'Automate the ladder\n\n• Lifecycle: transition by age (30d → IA, 90d → Glacier), expire old versions\n• Also: abort incomplete multipart uploads (hidden cost!)\n• Intelligent-Tiering: auto-moves per-object by access pattern, no retrieval fees\n• Unknown/changing patterns → Intelligent-Tiering',
      hint: 'Age rules vs auto-tiering',
      tags: ['s3', 'lifecycle'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost7',
      front: 'The NAT gateway cost trap?',
      back: 'Private subnet → S3 through NAT = paying twice\n\n• NAT gateway bills hourly + per-GB processing\n• Gateway VPC endpoints (S3, DynamoDB) are FREE\n• Route S3/DynamoDB traffic via gateway endpoint, not NAT\n• Classic exam answer for "reduce NAT charges"',
      hint: 'Gateway endpoints are free',
      tags: ['vpc', 'cost-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'cost8',
      front: 'Data transfer cost rules?',
      back: 'Direction and distance matter\n\n• IN from internet: free · OUT to internet: charged per GB\n• Cross-AZ: charged both directions (keep chatty traffic same-AZ)\n• Cross-Region: charged\n• Same-AZ private IP: free',
      hint: 'Out and across cost money',
      tags: ['data-transfer', 'pricing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost9',
      front: 'How does CloudFront cut costs (not just latency)?',
      back: 'Cache = less origin egress\n\n• Cache hits serve from edge — origin transfers drop\n• S3 → CloudFront transfer is free; CloudFront egress rates ≤ S3\'s\n• Fewer origin requests = less compute too\n• High-traffic static content: CDN is the cost answer',
      hint: 'Cache hits are cheap hits',
      tags: ['cloudfront', 'cost'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost10',
      front: 'gp3 vs gp2: why migrate?',
      back: 'Same job, ~20% cheaper\n\n• gp3 base: 3,000 IOPS + 125 MB/s at ANY size\n• gp2: IOPS tied to size (3/GB) — big volumes just for IOPS\n• gp3 provisions extra IOPS/throughput à la carte\n• Migration is an online volume modification',
      hint: 'Stop buying size for speed',
      tags: ['ebs', 'cost'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost11',
      front: 'Aurora Serverless v2: when does it save money?',
      back: 'Pay for capacity used, not provisioned\n\n• Scales ACUs up/down with load in fine increments\n• Fits: variable, intermittent, unpredictable workloads (dev/test, spiky SaaS)\n• Steady high load → provisioned Aurora/RI is cheaper\n• Same Aurora engine, HA, and features',
      hint: 'Spiky = serverless',
      tags: ['aurora', 'serverless'],
      difficulty: 'advanced'
    },
    {
      id: 'cost12',
      front: 'DynamoDB on-demand vs provisioned capacity?',
      back: 'Per-request vs per-hour\n\n• On-demand: pay per request — unpredictable/spiky/new tables\n• Provisioned: pay per RCU/WCU-hour — cheaper for steady load\n• Provisioned + auto scaling covers gentle variation\n• Reserved capacity discounts provisioned further',
      hint: 'Predictability decides',
      tags: ['dynamodb', 'pricing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost13',
      front: 'Lambda vs always-on EC2: cost crossover?',
      back: 'Idle time is the variable\n\n• Lambda: per-request + GB-second — ZERO idle cost\n• Intermittent/low traffic → Lambda wins big\n• Sustained high utilization → EC2 (+Savings Plan) wins\n• Also weigh ops overhead — serverless patches itself',
      hint: 'Who pays for idle?',
      tags: ['lambda', 'cost'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost14',
      front: 'Organizations: the billing wins?',
      back: 'One bill, shared discounts\n\n• Consolidated billing: single payer account\n• RI + Savings Plans discounts SHARE across member accounts\n• Usage aggregates into volume pricing tiers\n• Cost allocation tags + per-account visibility still work',
      hint: 'Discounts float across accounts',
      tags: ['organizations', 'billing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost15',
      front: 'Cost Explorer vs Budgets vs CUR?',
      back: 'See, alert, dissect\n\n• Cost Explorer: visualize/analyze/forecast, RI-SP recommendations\n• Budgets: thresholds + alerts (actual AND forecast), can trigger actions\n• CUR: the granular line-item truth, delivered to S3, query with Athena\n• Tag resources or none of it slices by team',
      hint: 'Dashboard, alarm, raw data',
      tags: ['cost-tools', 'billing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cost16',
      front: 'Quick cost-optimization checklist?',
      back: 'The usual savings, in order\n\n• Right-size with Compute Optimizer\n• Kill idle: unattached EBS, old snapshots, idle LBs, unused EIPs\n• Stop non-prod nights/weekends\n• Commit (SP/RI) for the steady baseline; Spot the rest\n• Tier storage; check Trusted Advisor cost checks',
      hint: 'Right-size, kill idle, commit',
      tags: ['optimization', 'checklist'],
      difficulty: 'beginner'
    }
  ]
};
