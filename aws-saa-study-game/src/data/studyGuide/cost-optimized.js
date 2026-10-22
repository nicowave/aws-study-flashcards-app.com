// Domain 4: Design Cost-Optimized Architectures (20% of exam)
// SAA-C03 Study Guide

export const costOptimizedGuide = {
  id: 'cost-optimized',
  name: 'Design Cost-Optimized Architectures',
  icon: '💰',
  color: '#d29922',
  weight: '20%',
  description: 'How to choose the cheapest storage, compute, database and network designs that still meet the requirements, and the tools that track and control AWS spend.',
  sections: [
    {
      id: 'costs1',
      title: 'Amazon S3 Storage Classes and Lifecycle',
      content: [
        { type: 'paragraph', text: 'S3 cost questions are about matching a storage class to how often data is read, how fast it must come back, and how long it lives. Cheaper storage classes trade a lower per-GB price for retrieval fees, minimum storage durations, slower access, or less resilience. The right answer is the cheapest class that still meets every stated constraint.' },
        { type: 'table', headers: ['Storage class', 'Best for', 'Retrieval', 'Minimum duration', 'AZs'], rows: [
          ['S3 Standard', 'Frequently accessed data', 'Milliseconds, no retrieval fee', 'None', '3 or more'],
          ['S3 Intelligent-Tiering', 'Unknown or changing access patterns', 'Milliseconds for the default tiers, no retrieval fee', 'None (small monitoring fee per object)', '3 or more'],
          ['S3 Standard-IA', 'Infrequent access, needs fast access and multi-AZ', 'Milliseconds, per-GB fee', '30 days', '3 or more'],
          ['S3 One Zone-IA', 'Infrequent, re-creatable data (secondary copies)', 'Milliseconds, per-GB fee', '30 days', '1'],
          ['S3 Glacier Instant Retrieval', 'Archive read about once a quarter, needs ms access', 'Milliseconds, higher per-GB fee', '90 days', '3 or more'],
          ['S3 Glacier Flexible Retrieval', 'Archive, minutes to hours acceptable', 'Expedited 1-5 min, Standard 3-5 h, Bulk 5-12 h', '90 days', '3 or more'],
          ['S3 Glacier Deep Archive', 'Long-term retention, rarely or never read', 'Standard within 12 h, Bulk within 48 h', '180 days', '3 or more'],
          ['S3 Express One Zone', 'Latency-sensitive, request-heavy workloads in one AZ', 'Consistent single-digit ms', 'N/A (higher per-GB price, lower request prices)', '1 (directory buckets)']
        ]},
        { type: 'keyTerm', term: 'Minimum storage duration', definition: 'An object deleted, overwritten or transitioned before the minimum is still billed for the remaining days. Short-lived data belongs in S3 Standard even if it is rarely read.' },
        { type: 'keyTerm', term: 'Minimum billable object size', definition: 'Standard-IA, One Zone-IA and Glacier Instant Retrieval bill each object as at least 128 KB, so millions of tiny objects can cost more in an IA class than in Standard.' },
        { type: 'keyTerm', term: 'S3 Lifecycle rules', definition: 'Transition actions move objects to cheaper classes as they age; expiration actions delete current or noncurrent versions. Add a rule to abort incomplete multipart uploads, which otherwise keep accruing storage charges.' },
        { type: 'comparison', title: 'Intelligent-Tiering vs lifecycle transitions', items: [
          { label: 'S3 Intelligent-Tiering', description: 'Moves each object between access tiers based on its own access history, with no retrieval fees and no operational analysis. Choose it when access patterns are unknown, unpredictable, or differ object by object.' },
          { label: 'Lifecycle transitions', description: 'Move every object matching a prefix or tag after a fixed number of days. Cheapest when the pattern is known and age-based, such as logs that are rarely read after 30 days and deleted after a year.' }
        ]},
        { type: 'awsService', name: 'S3 Requester Pays', description: 'A bucket setting that makes the requester pay request and data transfer charges while the owner pays only for storage. Requests must be authenticated, so it suits sharing large datasets with other AWS accounts.' },
        { type: 'awsService', name: 'S3 Storage Lens and Storage Class Analysis', description: 'Storage Lens gives organization-wide usage and activity metrics with cost-saving recommendations; Storage Class Analysis watches access to a bucket or prefix and suggests when to transition to Standard-IA.' },
        { type: 'examTip', text: 'Read the retrieval requirement first. Milliseconds rules out Glacier Flexible Retrieval and Deep Archive; "within 12 or 48 hours" points to Deep Archive; "must survive an AZ failure" rules out One Zone-IA and Express One Zone; "unknown access pattern" points to Intelligent-Tiering.' }
      ]
    },
    {
      id: 'costs2',
      title: 'Block and File Storage Costs',
      content: [
        { type: 'paragraph', text: 'EBS and EFS bills are driven by provisioned or stored capacity, so savings come from choosing the right volume type, deleting what is unused, and moving cold data to cheaper tiers. You pay for provisioned EBS capacity whether or not the space is used.' },
        { type: 'comparison', title: 'gp2 vs gp3 General Purpose SSD', items: [
          { label: 'gp2', description: 'Performance is tied to size at 3 IOPS per GiB, with burst credits for small volumes. Teams often over-provision capacity just to get IOPS.' },
          { label: 'gp3', description: 'Baseline of 3,000 IOPS and 125 MiB/s at any size, with IOPS and throughput provisioned separately, at a lower price per GB than gp2. Convert in place with Elastic Volumes and no downtime.' }
        ]},
        { type: 'bulletList', title: 'EBS cost levers:', items: [
          'Migrate gp2 to gp3, and only use io2 when you truly need very high, sustained IOPS or its durability.',
          'Use st1 (throughput HDD) or sc1 (cold HDD) for large sequential workloads such as logs or data processing; they cannot be boot volumes.',
          'Find and delete unattached volumes and old snapshots; snapshots are incremental, but they still accumulate.',
          'Move snapshots kept for compliance to EBS Snapshots Archive: much lower storage price, 90-day minimum, restores take 24 to 72 hours. Automate it with Amazon Data Lifecycle Manager.',
          'Recycle Bin protects against accidental snapshot deletion but bills retained snapshots at the normal rate.'
        ]},
        { type: 'awsService', name: 'Amazon EFS storage classes', description: 'EFS Standard, EFS Infrequent Access and EFS Archive. Lifecycle management moves files that have not been accessed for a set number of days to IA or Archive, and EFS Intelligent-Tiering can move files back to Standard when they are accessed again. One Zone file systems cost less when multi-AZ resilience is not needed.' },
        { type: 'table', headers: ['Requirement', 'Lowest-cost fit'], rows: [
          ['Boot or database volume for one EC2 instance', 'EBS gp3'],
          ['Shared POSIX file system for many Linux instances', 'Amazon EFS with lifecycle management'],
          ['Shared Windows (SMB) file system', 'Amazon FSx for Windows File Server'],
          ['Objects, backups, data lake, static content', 'Amazon S3 with the right storage class'],
          ['Long-term archive of files or backups', 'S3 Glacier Flexible Retrieval or Deep Archive'],
          ['Temporary scratch data that can be lost', 'EC2 instance store (included in the instance price)']
        ]},
        { type: 'examTip', text: 'When a question says "reduce EBS cost without downtime" and the volume is gp2, the answer is almost always gp3 through Elastic Volumes. When it says "keep snapshots for years, restore rarely", the answer is EBS Snapshots Archive.' }
      ]
    },
    {
      id: 'costs3',
      title: 'Compute Purchasing Options and Right-Sizing',
      content: [
        { type: 'paragraph', text: 'The exam expects you to match a purchase model to the shape of the workload: steady baseline, predictable peaks, interruptible batch, or licensing constraints. Most real designs combine them, for example a Savings Plan for the baseline, On-Demand for peaks and Spot for fault-tolerant work.' },
        { type: 'table', headers: ['Option', 'Discount vs On-Demand', 'Commitment', 'Use when'], rows: [
          ['On-Demand', 'None', 'None', 'Short-term, spiky or unpredictable workloads; testing'],
          ['Standard Reserved Instances', 'Up to 72%', '1 or 3 years, fixed family and Region', 'Steady usage on a known instance family; can be sold on the RI Marketplace'],
          ['Convertible Reserved Instances', 'Up to 66%', '1 or 3 years, exchangeable', 'Steady usage where the EC2 family or OS may change'],
          ['Compute Savings Plans', 'Up to 66%', '$/hour for 1 or 3 years', 'Any EC2 family, Region or OS, plus Fargate and Lambda'],
          ['EC2 Instance Savings Plans', 'Up to 72%', '$/hour, one family in one Region', 'Committed to one family; size, OS and tenancy can change'],
          ['Spot Instances', 'Up to 90%', 'None, can be interrupted', 'Fault-tolerant, flexible, stateless or checkpointed work'],
          ['Dedicated Hosts', 'Varies (On-Demand, reservation or Savings Plans)', 'Per host', 'BYOL licenses bound to sockets or cores; host affinity']
        ]},
        { type: 'comparison', title: 'Savings Plans vs Reserved Instances', items: [
          { label: 'Savings Plans', description: 'Commit to a dollar amount per hour. Discounts apply automatically to matching usage; Compute Savings Plans follow you across families, Regions, Fargate and Lambda. Usually the preferred modern answer for EC2.' },
          { label: 'Reserved Instances', description: 'Commit to an instance configuration. Still required for some services (RDS, ElastiCache, OpenSearch and Redshift use reservations of their own), and zonal RIs also reserve capacity in an AZ.' }
        ]},
        { type: 'bulletList', title: 'Spot Instances done right:', items: [
          'EC2 gives a two-minute interruption notice through instance metadata and EventBridge; a rebalance recommendation may arrive earlier.',
          'Diversify across many instance types and AZs and use the price-capacity-optimized allocation strategy.',
          'In an Auto Scaling group, use a mixed instances policy, enable Capacity Rebalancing, and use termination lifecycle hooks to drain work.',
          'Design work to checkpoint or be stateless; never rely on Spot for a single critical stateful server.'
        ]},
        { type: 'keyTerm', term: 'Dedicated Hosts vs Dedicated Instances', definition: 'Both run on hardware dedicated to your account. Only Dedicated Hosts expose sockets and cores and let you pin instances to a specific host, which per-core or per-socket licensing requires. Dedicated Instances are simpler and billed per instance.' },
        { type: 'awsService', name: 'AWS Compute Optimizer', description: 'Uses machine learning on CloudWatch utilization history to recommend right-sized EC2 instances and Auto Scaling groups, EBS volume types, Lambda memory and ECS on Fargate task sizes, including Graviton alternatives.' },
        { type: 'comparison', title: 'Lambda vs Fargate vs EC2 on cost', items: [
          { label: 'AWS Lambda', description: 'Pay per request and per GB-second, nothing when idle. Cheapest for spiky, event-driven or low-volume workloads; becomes expensive at constant high volume.' },
          { label: 'AWS Fargate', description: 'Pay per second for the vCPU and memory of running tasks with no servers to manage. Fargate Spot discounts interruptible tasks, and Compute Savings Plans apply.' },
          { label: 'Amazon EC2', description: 'Lowest unit cost at high, steady utilization when combined with Savings Plans, Spot and Graviton, at the price of managing instances.' }
        ]},
        { type: 'bulletList', title: 'Match capacity to demand:', items: [
          'Right-size first, then commit: buying Savings Plans for an over-sized fleet locks in waste.',
          'Graviton (Arm) instances usually give better price performance than comparable x86 instances for code that supports Arm.',
          'Auto Scaling: target tracking for variable load, scheduled scaling for known business hours, predictive scaling for recurring daily or weekly patterns.',
          'Stop or schedule non-production instances outside working hours.'
        ]},
        { type: 'examTip', text: 'Keywords map to answers: "steady for three years and may change family, Region or move to containers" = Compute Savings Plan; "same family, largest discount" = EC2 Instance Savings Plan; "can be interrupted" or "checkpoints" = Spot; "existing per-core licenses" = Dedicated Hosts; "predictable business hours" = scheduled scaling.' }
      ]
    },
    {
      id: 'costs4',
      title: 'Cost-Optimized Databases',
      content: [
        { type: 'paragraph', text: 'Database cost depends on whether load is steady or variable, how much is spent on I/O versus compute and storage, and whether repeated reads can be served from a cache instead of more database instances.' },
        { type: 'table', headers: ['Situation', 'Most cost-effective choice'], rows: [
          ['RDS or Aurora running 24/7 for 1-3 years', 'Database Reserved Instances'],
          ['Aurora with variable, intermittent or unpredictable load', 'Aurora Serverless v2 (ACUs scale automatically, billed per second)'],
          ['Aurora where I/O is more than about 25% of the spend', 'Aurora I/O-Optimized storage configuration'],
          ['Dev or test databases used only in working hours', 'Scheduled stop and start (auto restart after 7 days)'],
          ['DynamoDB with new, spiky or unknown traffic', 'On-demand capacity mode'],
          ['DynamoDB with steady, predictable traffic', 'Provisioned capacity with auto scaling plus reserved capacity'],
          ['DynamoDB table where storage dominates cost', 'DynamoDB Standard-IA table class'],
          ['Repeated identical reads overloading the database', 'Amazon ElastiCache in front of the database'],
          ['Data warehouse with intermittent queries', 'Amazon Redshift Serverless'],
          ['Data warehouse with large data and steady compute', 'Redshift RA3 nodes with reserved nodes']
        ]},
        { type: 'comparison', title: 'Aurora Standard vs Aurora I/O-Optimized', items: [
          { label: 'Aurora Standard', description: 'Lower instance and storage prices plus a charge per I/O request. Cheapest when I/O is a modest share of the bill.' },
          { label: 'Aurora I/O-Optimized', description: 'No I/O charges, higher instance and storage prices, predictable bills. Better for I/O-heavy workloads; switch per cluster with no application changes.' }
        ]},
        { type: 'keyTerm', term: 'Aurora Serverless v2', definition: 'Capacity is measured in Aurora capacity units (ACUs) and scales in fine increments between a minimum and maximum you set, billed per second. It suits dev and test, new applications and spiky workloads; for steady high load, provisioned instances with Reserved Instances are usually cheaper.' },
        { type: 'keyTerm', term: 'Read replicas vs caching', definition: 'Each read replica is billed as a full DB instance. When the same queries repeat, an ElastiCache cluster serves them from memory and usually removes more load for less money. Use replicas when reads are varied and must hit current data in SQL.' },
        { type: 'bulletList', title: 'Other database savings:', items: [
          'Stopped RDS instances and Aurora clusters stop instance charges, but storage and backups are still billed, and they restart automatically after seven days.',
          'DynamoDB TTL deletes expired items without consuming write capacity.',
          'Redshift RA3 separates compute from managed storage, so you size nodes for compute; Redshift Serverless bills only while queries run.',
          'Use the Multi-AZ setting for production only; dev and test rarely need a standby.'
        ]},
        { type: 'examTip', text: 'Compute Savings Plans never cover RDS or Aurora; database discounts come from Reserved Instances for those engines. If a question mentions I/O charges as a large share of Aurora cost, the answer is I/O-Optimized, not more replicas.' }
      ]
    },
    {
      id: 'costs5',
      title: 'Cost-Optimized Networking and Data Transfer',
      content: [
        { type: 'paragraph', text: 'Data transfer is the most overlooked line on an AWS bill. The exam tests whether you know which paths are free, which are billed, and which managed network components add per-GB processing charges on top of transfer.' },
        { type: 'table', headers: ['Traffic path', 'Charge'], rows: [
          ['Internet into AWS', 'Free'],
          ['Within the same AZ over private IP addresses', 'Free'],
          ['Within the same AZ over public or Elastic IP addresses', 'Billed'],
          ['Between AZs in the same Region', 'Billed per GB in each direction'],
          ['Between Regions', 'Billed per GB'],
          ['AWS out to the internet', 'Billed per GB, tiered by volume'],
          ['S3 or other AWS origins to CloudFront', 'Free'],
          ['Through a NAT gateway', 'Hourly charge plus per-GB processing, on top of transfer'],
          ['Through an S3 or DynamoDB gateway endpoint', 'No endpoint charges']
        ]},
        { type: 'comparison', title: 'Reaching S3 from private subnets', items: [
          { label: 'NAT gateway', description: 'Hourly charge plus a per-GB processing fee. Heavy S3 or DynamoDB traffic through it gets expensive quickly.' },
          { label: 'Gateway VPC endpoint', description: 'Free, works only for S3 and DynamoDB, added as a route in subnet route tables. The default cost answer.' },
          { label: 'Interface VPC endpoint', description: 'PrivateLink endpoint billed per hour in each AZ and per GB. Needed for most other services, or to reach S3 privately from on premises or another Region.' }
        ]},
        { type: 'comparison', title: 'Connecting networks', items: [
          { label: 'VPC peering', description: 'No hourly or processing charge, only standard data transfer. Cheapest for a few VPCs, but not transitive.' },
          { label: 'AWS Transit Gateway', description: 'Charges per attachment-hour plus per GB processed. Worth it for many VPCs and on-premises networks needing hub-and-spoke routing.' },
          { label: 'Site-to-Site VPN vs Direct Connect', description: 'VPN is quick and cheap to start but pays internet transfer rates. Direct Connect has port-hour charges but lower data transfer out rates and consistent performance, so it wins for large, steady volumes.' }
        ]},
        { type: 'bulletList', title: 'Design habits that reduce transfer cost:', items: [
          'Serve global content through CloudFront to cut origin egress and requests.',
          'Keep chatty components and the data they process in the same Region, and where resilience allows, the same AZ.',
          'A NAT gateway in each AZ avoids cross-AZ processing traffic and an AZ single point of failure; one shared NAT gateway is cheaper only for small, non-critical environments.',
          'Public IPv4 addresses carry an hourly charge, so release unused Elastic IPs and avoid public IPs where private ones work.'
        ]},
        { type: 'examTip', text: 'If an architecture sends S3 or DynamoDB traffic through a NAT gateway and asks for lower cost, add a gateway endpoint. If it serves files from S3 to global users and egress is high, add CloudFront. Transfer Acceleration and Global Accelerator add cost; they are performance answers.' }
      ]
    },
    {
      id: 'costs6',
      title: 'Cost Management and Governance Tools',
      content: [
        { type: 'paragraph', text: 'Expect questions that describe a cost management need and ask which tool fits. Separate estimating, analyzing, alerting, enforcing and exporting: each has its own service.' },
        { type: 'table', headers: ['Need', 'Tool'], rows: [
          ['Estimate a planned architecture before deploying it', 'AWS Pricing Calculator'],
          ['Visualize and filter past spend, forecast, see RI and Savings Plans recommendations', 'AWS Cost Explorer'],
          ['Alert on actual or forecast spend, usage, or RI/SP coverage and utilization', 'AWS Budgets'],
          ['Automatically restrict or stop resources when a budget is exceeded', 'AWS Budgets actions'],
          ['Detect unusual spend without fixed thresholds', 'AWS Cost Anomaly Detection'],
          ['Most detailed hourly, resource-level billing data for SQL and BI', 'Cost and Usage Report 2.0 via AWS Data Exports, queried with Athena'],
          ['Report spend by team, project or environment', 'Activated cost allocation tags (and Cost Categories)'],
          ['Find idle resources and savings opportunities', 'AWS Trusted Advisor and AWS Compute Optimizer'],
          ['One bill and pooled discounts across accounts', 'AWS Organizations consolidated billing']
        ]},
        { type: 'awsService', name: 'AWS Budgets', description: 'Creates cost, usage, Reserved Instance and Savings Plans budgets with alerts by email or SNS. Budget actions can apply an IAM policy or service control policy, or stop selected EC2 or RDS instances, either automatically or after approval.' },
        { type: 'awsService', name: 'AWS Cost Anomaly Detection', description: 'Machine learning monitors for services, linked accounts, cost categories or tags. Sends individual alerts or daily and weekly summaries and identifies the likely root cause.' },
        { type: 'keyTerm', term: 'Cost allocation tags', definition: 'AWS-generated and user-defined tags that become billing dimensions only after they are activated in the Billing console (by the management account in an organization). Tagging resources alone does not make a tag appear in cost reports.' },
        { type: 'keyTerm', term: 'Consolidated billing', definition: 'AWS Organizations combines usage across member accounts for volume pricing tiers and shares Reserved Instance and Savings Plans discounts across accounts by default; sharing can be turned off for specific accounts.' },
        { type: 'numberedList', title: 'A cost optimization routine:', items: [
          'Tag resources and activate cost allocation tags so spend can be attributed.',
          'Set AWS Budgets with alerts, and budget actions for sandbox and development accounts.',
          'Turn on Cost Anomaly Detection for unexpected spikes.',
          'Right-size with Compute Optimizer and remove idle resources flagged by Trusted Advisor.',
          'Commit to Savings Plans or Reserved Instances for the remaining steady baseline using Cost Explorer recommendations.',
          'Export CUR 2.0 data to S3 for detailed chargeback reporting with Athena or QuickSight.'
        ]},
        { type: 'examTip', text: 'Budgets and billing alarms are threshold based; Cost Anomaly Detection is pattern based. Only Budgets actions enforce anything automatically. "Before deployment" means Pricing Calculator, and "query billing data with SQL" means the Cost and Usage Report with Athena.' }
      ]
    }
  ]
};
