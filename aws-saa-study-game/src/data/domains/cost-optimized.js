// Domain 4: Design Cost-Optimized Architectures (20% of exam)
// SAA-C03 Exam Content

export const costOptimized = {
  id: 'cost-optimized',
  name: 'Design Cost-Optimized Architectures',
  icon: '💰',
  weight: '20%',
  color: '#d29922',
  description: 'Cost-optimized storage, compute, database, and network architectures',
  questions: [
    // ---------- Task 4.1: Cost-optimized storage ----------
    {
      id: 'cost1',
      question: 'A media analytics company stores 400 TB of objects in Amazon S3, most of them larger than 1 MB. Access patterns are unpredictable: some datasets sit idle for months and are then queried heavily for a few days. The team has no time to analyze access patterns and does not want retrieval fees or retrieval delays. Which storage class is the most cost-effective?',
      options: [
        'S3 Standard-IA with a lifecycle rule that transitions objects after 30 days',
        'S3 Intelligent-Tiering',
        'S3 Glacier Instant Retrieval with a lifecycle rule after 30 days',
        'S3 One Zone-IA'
      ],
      correctAnswer: 1,
      explanation: 'S3 Intelligent-Tiering moves each object between access tiers automatically based on its own access history, charges no retrieval fees, and adds only a small per-object monitoring fee, which makes it the default answer for unknown or changing access patterns. Standard-IA and Glacier Instant Retrieval charge per-GB retrieval fees that would spike during the bursts of heavy querying. One Zone-IA also charges retrieval fees and stores data in a single Availability Zone.'
    },
    {
      id: 'cost2',
      question: 'A financial services firm must retain scanned account records for 10 years to satisfy regulators. The records are almost never accessed, and when an auditor requests one, delivery within 48 hours is acceptable. Which S3 storage class provides the lowest storage cost?',
      options: [
        'S3 Glacier Deep Archive',
        'S3 Glacier Flexible Retrieval',
        'S3 Glacier Instant Retrieval',
        'S3 One Zone-IA'
      ],
      correctAnswer: 0,
      explanation: 'S3 Glacier Deep Archive is the lowest-cost S3 storage class, with standard retrievals completing within 12 hours and bulk retrievals within 48 hours, and its 180-day minimum storage duration is irrelevant for a 10-year retention period. Glacier Flexible Retrieval and Glacier Instant Retrieval offer faster access the firm does not need at a higher per-GB price. One Zone-IA costs far more per GB and keeps data in only one Availability Zone.'
    },
    {
      id: 'cost3',
      question: 'A hospital stores medical images in Amazon S3. After the first month, each image is viewed about once a quarter, but when a doctor opens one it must load in milliseconds. The images must survive the loss of an Availability Zone. Which storage class minimizes cost for images older than one month?',
      options: [
        'S3 Standard-IA',
        'S3 One Zone-IA',
        'S3 Glacier Flexible Retrieval with Expedited retrievals',
        'S3 Glacier Instant Retrieval'
      ],
      correctAnswer: 3,
      explanation: 'S3 Glacier Instant Retrieval is designed for long-lived data accessed about once a quarter that still needs millisecond retrieval, and it stores data across multiple Availability Zones at a lower per-GB price than Standard-IA. Standard-IA meets the latency and durability needs but costs more to store. One Zone-IA fails the requirement to survive an AZ loss, and Expedited retrievals from Glacier Flexible Retrieval take minutes, not milliseconds.'
    },
    {
      id: 'cost4',
      question: 'To save money, an application writes temporary processing files directly into the S3 Standard-IA storage class. Each file is read several times during its first day and is deleted after five days. The S3 bill is now higher than when the files were stored in S3 Standard. What is the most likely cause?',
      options: [
        'Standard-IA charges a per-object monitoring fee that exceeds the storage savings',
        'Standard-IA stores a copy of each object in a second Region, doubling storage charges',
        'Standard-IA bills a 30-day minimum storage duration and a per-GB fee for every retrieval',
        'Standard-IA requires S3 Versioning, so the deleted files keep accruing storage charges'
      ],
      correctAnswer: 2,
      explanation: 'Standard-IA charges for at least 30 days of storage even when an object is deleted sooner, and it adds a per-GB retrieval fee on every read, so short-lived, frequently read files cost more there than in S3 Standard. A per-object monitoring fee belongs to S3 Intelligent-Tiering, not Standard-IA. Standard-IA stores data across multiple AZs in one Region, not in a second Region, and it does not require versioning.'
    },
    {
      id: 'cost5',
      question: 'A research institute publishes a 2 PB genomics dataset in an S3 bucket. Partner universities that have their own AWS accounts download large portions of it, and the institute\'s data transfer bill has grown sharply. The institute wants the downloaders to pay for their own requests and data transfer. What should a solutions architect do?',
      options: [
        'Serve the dataset through Amazon CloudFront with a signed URL for each partner',
        'Enable Requester Pays on the bucket and require partners to send authenticated requests',
        'Enable S3 Transfer Acceleration so that partner downloads use AWS edge locations',
        'Replicate the bucket into each partner account with S3 Cross-Region Replication'
      ],
      correctAnswer: 1,
      explanation: 'With Requester Pays enabled, the requester pays the request and data transfer charges while the bucket owner pays only for storage; anonymous access is not allowed, so partners must use authenticated requests from their own accounts. CloudFront would still bill the institute for delivery. Transfer Acceleration adds a per-GB fee on top of normal transfer charges, and replication charges the source bucket owner for the replicated data transfer and requests.'
    },
    {
      id: 'cost6',
      question: 'A company runs 200 EC2 instances, each with a 1 TB gp2 EBS volume. Monitoring shows that each volume needs about 3,000 IOPS and 125 MiB/s of throughput. The company wants to lower EBS cost without downtime or any loss of performance. What should the solutions architect do?',
      options: [
        'Change each volume to io2 and provision exactly 3,000 IOPS',
        'Change each volume to st1 Throughput Optimized HDD',
        'Snapshot each volume and restore it as a smaller gp2 volume',
        'Modify each volume to gp3 in place by using Elastic Volumes'
      ],
      correctAnswer: 3,
      explanation: 'gp3 includes a baseline of 3,000 IOPS and 125 MiB/s regardless of volume size at a lower per-GB price than gp2, and Elastic Volumes changes the type while the volume stays attached and in use. io2 adds a charge for every provisioned IOPS and costs more. st1 is an HDD type that performs poorly for random I/O, and a smaller gp2 volume would lose IOPS (gp2 scales at 3 IOPS per GiB) and require a restore with downtime.'
    },
    {
      id: 'cost7',
      question: 'A company takes monthly EBS snapshots of its ERP volumes and must keep each snapshot for seven years. The snapshots are restored only if an auditor requests historical data, and a restore time of up to three days is acceptable. How can the company reduce snapshot storage costs?',
      options: [
        'Archive the snapshots to EBS Snapshots Archive by using Data Lifecycle Manager',
        'Enable Fast Snapshot Restore on the snapshots and delete the original EBS volumes',
        'Add a lifecycle rule to the snapshot S3 bucket that transitions to S3 Glacier Deep Archive',
        'Move the snapshots into the Recycle Bin, which stores retained snapshots at a lower rate'
      ],
      correctAnswer: 0,
      explanation: 'EBS Snapshots Archive stores full snapshots at a much lower price than the standard tier, has a 90-day minimum, and restores within 24 to 72 hours, which fits rarely restored long-term retention; Data Lifecycle Manager can archive snapshots on a schedule. Fast Snapshot Restore adds cost to make restores faster. EBS snapshots are not stored in a bucket you can manage with S3 lifecycle rules, and the Recycle Bin protects against accidental deletion while billing snapshots at the normal rate.'
    },

    // ---------- Task 4.2: Cost-optimized compute ----------
    {
      id: 'cost8',
      question: 'A company runs a steady baseline of compute 24/7 and wants a three-year commitment for large savings. During the term it plans to move from x86 instances to Graviton, shift some services from us-east-1 to eu-west-1, and containerize part of the workload on AWS Fargate. Which purchase option fits these plans?',
      options: [
        'Standard Reserved Instances for the current instance types',
        'EC2 Instance Savings Plans for the current instance family',
        'A Compute Savings Plan sized to the baseline hourly spend',
        'Convertible Reserved Instances exchanged as workloads move'
      ],
      correctAnswer: 2,
      explanation: 'A Compute Savings Plan applies automatically to EC2 usage in any instance family, size, Region, operating system, or tenancy, and also to Fargate and Lambda, so it follows the workload through all three planned changes. Standard Reserved Instances and EC2 Instance Savings Plans are tied to an instance family in a Region. Convertible Reserved Instances can be exchanged for other EC2 configurations, but they never apply to Fargate.'
    },
    {
      id: 'cost9',
      question: 'An analytics platform runs on memory-optimized R7i instances in us-east-1 and will stay on that instance family for at least three years, although instance sizes and operating systems will change. The company wants the largest discount that still allows those changes. Which option should the solutions architect choose?',
      options: [
        'A Compute Savings Plan with a three-year term',
        'An EC2 Instance Savings Plan for the R7i family in us-east-1',
        'Zonal Standard Reserved Instances for each current instance size',
        'Spot Instances requested through an EC2 Fleet'
      ],
      correctAnswer: 1,
      explanation: 'An EC2 Instance Savings Plan commits to one instance family in one Region and offers the deepest Savings Plans discount, while still applying across sizes, operating systems, and tenancy within that family. A Compute Savings Plan is more flexible but gives a smaller discount, which the company does not need. Zonal Reserved Instances apply only to an exact instance size in one AZ, and Spot Instances can be interrupted, which does not suit a steady platform.'
    },
    {
      id: 'cost10',
      question: 'A visual effects studio renders frames in nightly batch jobs. Each job checkpoints its progress, can be restarted on another instance, and only needs to finish by the next morning. The studio wants the lowest possible compute cost. Which approach is most appropriate?',
      options: [
        'Spot Instances across several instance types and AZs with the price-capacity-optimized strategy',
        'Spot Instances of one instance type in a single AZ with the lowest-price allocation strategy',
        'On-Demand Instances covered by a one-year Compute Savings Plan for the nightly hours',
        'Dedicated Instances launched each night by a scheduled Auto Scaling action'
      ],
      correctAnswer: 0,
      explanation: 'Interruptible, checkpointed batch work with a flexible deadline is the textbook Spot use case, and diversifying across instance types and AZs with price-capacity-optimized allocation picks low-priced pools that are least likely to be interrupted. Restricting Spot to one type in one AZ with lowest-price allocation concentrates the risk of interruption. A Savings Plan bills the commitment every hour of the day, and Dedicated Instances cost more than On-Demand.'
    },
    {
      id: 'cost11',
      question: 'A stateless web tier runs in an Auto Scaling group that mixes On-Demand and Spot Instances behind an Application Load Balancer. When Spot capacity is reclaimed, some users see errors because instances terminate before their connections drain. How should the solutions architect reduce this disruption while keeping the Spot savings?',
      options: [
        'Replace the Spot Instances with On-Demand Instances covered by a Compute Savings Plan',
        'Request Spot blocks with a defined duration so instances run uninterrupted for six hours',
        'Enable instance scale-in protection on every Spot Instance in the Auto Scaling group',
        'Enable Capacity Rebalancing and use a termination lifecycle hook to drain instances'
      ],
      correctAnswer: 3,
      explanation: 'Capacity Rebalancing launches a replacement as soon as EC2 sends a rebalance recommendation for an at-risk Spot Instance, and a termination lifecycle hook gives the instance time to deregister from the load balancer and drain during the two-minute interruption notice. Moving to On-Demand removes the savings the company wants to keep. Spot blocks are no longer offered, and scale-in protection only stops the Auto Scaling group from choosing the instance during scale-in; it cannot prevent EC2 from reclaiming Spot capacity.'
    },
    {
      id: 'cost12',
      question: 'A company is migrating Windows Server and SQL Server workloads to Amazon EC2 and wants to bring its existing licenses. The licenses are counted per physical core and require the instances to stay on the same physical server over time. Which EC2 option meets these requirements most cost-effectively?',
      options: [
        'Dedicated Instances launched into a VPC with dedicated tenancy',
        'License-included On-Demand Instances with an EC2 Instance Savings Plan',
        'Dedicated Hosts with host affinity enabled',
        'On-Demand Capacity Reservations in a single Availability Zone'
      ],
      correctAnswer: 2,
      explanation: 'Dedicated Hosts give you a physical server with visibility into its sockets and cores, and host affinity keeps an instance on the same host after it stops and starts, which is what per-core, server-bound BYOL licensing requires. Dedicated Instances run on single-tenant hardware but do not expose cores or keep you on the same host. License-included instances make you pay for licenses you already own, and Capacity Reservations run on shared hardware.'
    },
    {
      id: 'cost13',
      question: 'An operations team wants machine learning based recommendations, built from actual utilization metrics, to right-size its EC2 instances (including Graviton-based alternatives), choose better EBS volume types, and tune Lambda memory settings. Which AWS service should the team use?',
      options: [
        'AWS Compute Optimizer',
        'AWS Trusted Advisor',
        'AWS Cost Anomaly Detection',
        'Amazon CloudWatch Container Insights'
      ],
      correctAnswer: 0,
      explanation: 'AWS Compute Optimizer analyzes historical CloudWatch utilization and recommends optimal configurations for EC2 instances, Auto Scaling groups, EBS volumes, Lambda functions, and ECS services on Fargate, including Graviton options. Trusted Advisor flags low-utilization instances but does not produce EBS type or Lambda memory recommendations. Cost Anomaly Detection watches spending patterns, and Container Insights only collects container metrics.'
    },
    {
      id: 'cost14',
      question: 'A containerized API was ported to AWS Lambda. It now receives a steady, high request rate around the clock, and Lambda has become the largest line item on the bill. The team wants to cut compute cost while still not managing any servers. What should the solutions architect recommend?',
      options: [
        'Increase the Lambda memory setting so that each invocation finishes faster',
        'Run the API on ECS with Fargate and cover it with a Compute Savings Plan',
        'Move the functions to Lambda@Edge so that they run closer to the users',
        'Enable Lambda SnapStart to reduce the initialization time of each function'
      ],
      correctAnswer: 1,
      explanation: 'Lambda pricing per request and per GB-second is ideal for spiky or intermittent traffic, but constant high utilization is usually cheaper on always-on containers, and Fargate keeps the no-servers model while a Compute Savings Plan discounts the steady baseline. Raising memory raises the price of every GB-second and does not change the per-request economics. Lambda@Edge is priced higher than regional Lambda, and SnapStart improves cold-start latency rather than steady-state cost.'
    },
    {
      id: 'cost15',
      question: 'An internal reporting application runs on a fixed fleet of 20 EC2 instances sized for peak load. Demand is predictable: heavy from 8 AM to 6 PM on weekdays and nearly idle at all other times. How can the solutions architect reduce cost while still meeting peak demand?',
      options: [
        'Purchase three-year Reserved Instances for all 20 instances',
        'Replace the fleet with fewer, larger instances sized for peak',
        'Run the entire fleet on Spot Instances',
        'Use Auto Scaling with scheduled or predictive scaling'
      ],
      correctAnswer: 3,
      explanation: 'Scheduled or predictive scaling adds capacity before the weekday peak and removes it afterward, so the company stops paying for 20 instances during the many idle hours each week. Reserved Instances discount the rate but still pay for the full fleet around the clock. Fewer, larger instances do not reduce total capacity, and running a business application entirely on Spot risks interruptions during working hours.'
    },

    // ---------- Task 4.3: Cost-optimized databases ----------
    {
      id: 'cost16',
      question: 'A company runs a production Amazon RDS for PostgreSQL instance 24/7 and expects to keep it for three years. It also runs four development RDS instances that are used only during weekday business hours. Which combination is the most cost-effective?',
      options: [
        'A Compute Savings Plan covering all five database instances',
        'Three-year All Upfront Reserved Instances for all five instances',
        'A Reserved Instance for production and scheduled stops for dev',
        'Spot pricing for development and On-Demand for production'
      ],
      correctAnswer: 2,
      explanation: 'RDS Reserved Instances discount a database that runs steadily, and stopping the development instances outside business hours ends their instance-hour charges (storage and backups are still billed); because a stopped RDS instance starts again automatically after seven days, the stop must be scheduled, for example with EventBridge Scheduler. Compute Savings Plans do not cover RDS. Reserving the development instances pays for 24/7 capacity that is used about a third of the week, and RDS has no Spot pricing.'
    },
    {
      id: 'cost17',
      question: 'An internal application is backed by Amazon Aurora MySQL. Usage is unpredictable: the database is idle most nights and weekends, with occasional bursts of heavy activity during the day. The team wants database capacity to follow demand automatically and to stop paying for idle provisioned capacity. Which solution meets these requirements?',
      options: [
        'Aurora Serverless v2 with suitable minimum and maximum ACU settings',
        'Aurora provisioned instances covered by Reserved Instances',
        'An Aurora provisioned cluster with Aurora Auto Scaling for replicas',
        'An RDS for MySQL Multi-AZ DB cluster on larger instances'
      ],
      correctAnswer: 0,
      explanation: 'Aurora Serverless v2 scales capacity in fine-grained Aurora capacity units (ACUs) within the range you set and bills per second for the capacity in use, so idle periods cost little. Reserved Instances lock in provisioned capacity sized for the peak. Replica auto scaling adds and removes readers, but the writer is still a fixed provisioned instance, and a Multi-AZ DB cluster on larger instances is billed around the clock.'
    },
    {
      id: 'cost18',
      question: 'An Aurora PostgreSQL cluster supports an I/O-intensive order-processing system. Cost Explorer shows that I/O charges are more than half of the total Aurora spend for the cluster. How can the solutions architect reduce cost with the least change to the application?',
      options: [
        'Add Aurora Replicas so that read I/O is spread across more instances',
        'Switch the cluster storage configuration to Aurora I/O-Optimized',
        'Migrate the cluster to Aurora Serverless v2 with a low minimum ACU',
        'Enable Aurora Backtrack to reduce the number of write operations'
      ],
      correctAnswer: 1,
      explanation: 'Aurora I/O-Optimized removes per-request I/O charges in exchange for higher instance and storage prices, and AWS recommends it when I/O is more than about 25% of Aurora spend; the change is a cluster setting with no application changes. Adding replicas adds instance cost while the shared storage still bills the I/O. Serverless v2 on the Standard configuration still pays for I/O, and Backtrack adds cost without reducing I/O.'
    },
    {
      id: 'cost19',
      question: 'A DynamoDB table has run in on-demand capacity mode for a year. Its traffic is now steady and predictable, rising gradually during the day and falling at night. How can the solutions architect reduce the cost of this table the most?',
      options: [
        'Keep on-demand mode and place a DynamoDB Accelerator (DAX) cluster in front of the table',
        'Change the table class to DynamoDB Standard-IA to lower the per-request price',
        'Switch to provisioned capacity with auto scaling and buy reserved capacity for the baseline',
        'Convert the table to a global table so that traffic is spread across Regions'
      ],
      correctAnswer: 2,
      explanation: 'For steady, predictable traffic, provisioned capacity with auto scaling tracks the daily curve at a lower unit price than on-demand, and reserved capacity further discounts the always-present baseline. DAX adds node charges and helps only with repeated reads. The Standard-IA table class lowers storage cost but raises the price of reads and writes, and global tables add replicated write and transfer charges.'
    },
    {
      id: 'cost20',
      question: 'A retailer keeps five years of order history in a DynamoDB table. Storage now accounts for most of the table cost, and older items are read only occasionally for customer service lookups. The company wants to reduce cost without changing application code. What should the solutions architect do?',
      options: [
        'Export the older items to Amazon S3 and query them with Amazon Athena',
        'Add DynamoDB Accelerator (DAX) to cache the most frequently read items',
        'Switch the table from provisioned capacity to on-demand capacity mode',
        'Change the table class to DynamoDB Standard-Infrequent Access'
      ],
      correctAnswer: 3,
      explanation: 'The DynamoDB Standard-IA table class offers much lower storage prices with somewhat higher read and write prices, keeps the same API and performance, and is a simple table setting, so it fits storage-dominated tables with no code changes. Exporting to S3 and querying with Athena would require application changes. DAX adds cost and does nothing for storage, and the capacity mode affects throughput charges, not storage.'
    },
    {
      id: 'cost21',
      question: 'An e-commerce site runs on Amazon RDS for MySQL. Most traffic consists of the same product catalog queries repeated many times, and database CPU reaches 90% at peak. The team is considering adding several read replicas. What is the most cost-effective way to reduce the load on the database?',
      options: [
        'Add an ElastiCache cluster and cache query results using cache-aside',
        'Add three read replicas and route read queries to them in the application',
        'Scale the DB instance up to the next larger instance class in the same family',
        'Convert the DB instance to a Multi-AZ deployment with a standby instance'
      ],
      correctAnswer: 0,
      explanation: 'When the same queries repeat, an in-memory cache serves them in microseconds and absorbs most of the read load, and a small cache cluster usually costs less than several full-size read replicas. Each read replica is billed as a full DB instance, and scaling up roughly doubles the instance price. The standby in a Multi-AZ DB instance deployment does not serve reads, so it adds cost without reducing load.'
    },

    // ---------- Task 4.4: Cost-optimized network ----------
    {
      id: 'cost22',
      question: 'EC2 instances in private subnets process data stored in Amazon S3 in the same Region, moving several terabytes per day through a NAT gateway. NAT gateway data processing charges have become a major cost. What should the solutions architect do to reduce this cost?',
      options: [
        'Create an S3 interface VPC endpoint (AWS PrivateLink) in each Availability Zone',
        'Replace the NAT gateway with a larger self-managed NAT instance',
        'Create an S3 gateway VPC endpoint and add it to the private subnet route tables',
        'Enable S3 Transfer Acceleration on the bucket used by the instances'
      ],
      correctAnswer: 2,
      explanation: 'Gateway VPC endpoints for S3 and DynamoDB have no hourly or data processing charges, so routing S3 traffic through one removes the NAT gateway processing fee for that traffic. Interface endpoints bill per endpoint-hour in each AZ and per GB processed. A NAT instance adds operational overhead and becomes a bottleneck, and Transfer Acceleration adds a fee while the traffic still flows through the NAT gateway.'
    },
    {
      id: 'cost23',
      question: 'A company serves images and video files directly from an S3 bucket to customers around the world. Data transfer out to the internet is now the largest item on its AWS bill. Which change reduces cost and also improves performance for users?',
      options: [
        'Enable S3 Transfer Acceleration on the bucket',
        'Put an Amazon CloudFront distribution in front of the bucket',
        'Replicate the bucket to three Regions with S3 Cross-Region Replication',
        'Place AWS Global Accelerator in front of the bucket'
      ],
      correctAnswer: 1,
      explanation: 'Data transfer from S3 to CloudFront is free, CloudFront caches content at edge locations so fewer requests reach the origin, and its delivery rates are typically lower than serving directly from S3, while latency drops for users. Transfer Acceleration adds a per-GB fee and mainly speeds long-distance uploads. Cross-Region Replication adds replication transfer and extra storage, and Global Accelerator does not cache content and adds its own hourly and per-GB fees.'
    },
    {
      id: 'cost24',
      question: 'Two EC2 instances in the same VPC and the same Availability Zone exchange large volumes of data. They currently connect to each other\'s public IPv4 addresses, and the bill shows data transfer charges for this traffic. How can the solutions architect eliminate these charges?',
      options: [
        'Place both instances in a cluster placement group',
        'Enable enhanced networking with ENA on both instances',
        'Create a VPC peering connection between the two instances',
        'Have the instances communicate over private IP addresses'
      ],
      correctAnswer: 3,
      explanation: 'Traffic between instances in the same Availability Zone over private IP addresses is free, while traffic sent to public or Elastic IP addresses is billed as data transfer even inside the same AZ. A cluster placement group improves latency, and ENA improves throughput, but neither changes how public IP traffic is billed. VPC peering connects separate VPCs and does not apply to two instances in the same VPC.'
    },
    {
      id: 'cost25',
      question: 'A company transfers about 100 TB per month from AWS to its on-premises data center, every month, over the internet. It wants lower data transfer charges and more consistent network performance. Which solution is the most cost-effective in the long term?',
      options: [
        'An AWS Direct Connect dedicated connection',
        'AWS Site-to-Site VPN with accelerated tunnels',
        'Monthly AWS Snowball Edge export jobs',
        'S3 Transfer Acceleration for all downloads'
      ],
      correctAnswer: 0,
      explanation: 'Data transfer out over AWS Direct Connect is billed at lower per-GB rates than internet data transfer, and the private connection gives consistent performance, so the port-hour cost is quickly offset at this steady volume. Site-to-Site VPN still pays internet data transfer rates, and accelerated tunnels add Global Accelerator charges. Snowball suits one-time or occasional bulk moves, not a continuous monthly flow, and Transfer Acceleration adds fees on top of internet rates.'
    },
    {
      id: 'cost26',
      question: 'Two VPCs in the same Region need to exchange a large, steady volume of traffic. No other VPCs will ever be connected, and the CIDR ranges do not overlap. Which connectivity option is the most cost-effective?',
      options: [
        'AWS Transit Gateway with both VPCs attached',
        'AWS PrivateLink endpoint services in each VPC',
        'A VPC peering connection between the two VPCs',
        'Software VPN appliances on EC2 in each VPC'
      ],
      correctAnswer: 2,
      explanation: 'VPC peering has no hourly charge and no data processing charge; you pay only standard data transfer, and traffic within the same Availability Zone is free. Transit Gateway charges per attachment-hour plus a per-GB processing fee, which pays off only when many VPCs need hub-and-spoke routing. PrivateLink adds endpoint-hour and per-GB charges and exposes individual services, and VPN appliances add EC2 cost and operational overhead.'
    },

    // ---------- Task 4.5: Cost management tooling ----------
    {
      id: 'cost27',
      question: 'A company gives each development team its own AWS account in AWS Organizations. When a team\'s monthly spend reaches its budget, the company wants to automatically stop that team from launching new EC2 instances, without writing custom code. What should the solutions architect configure?',
      options: [
        'An AWS Cost Anomaly Detection monitor that alerts an SNS topic for the team',
        'An AWS Budgets budget with a budget action that applies a restrictive SCP',
        'A CloudWatch billing alarm that emails the team lead when spend crosses the limit',
        'A Trusted Advisor cost optimization check with weekly email notifications'
      ],
      correctAnswer: 1,
      explanation: 'AWS Budgets actions run automatically (or after approval) when a threshold is crossed and can apply an IAM policy or service control policy, or stop specific EC2 or RDS instances, so no custom code is needed. Cost Anomaly Detection and CloudWatch billing alarms only send notifications. Trusted Advisor reports optimization opportunities but does not enforce spending limits.'
    },
    {
      id: 'cost28',
      question: 'A company added a CostCenter tag to all of its resources so that finance can report spend by department. A week later, the tag still does not appear as a filter or grouping option in Cost Explorer. What must be done?',
      options: [
        'Enable AWS Config to record the tags on every resource',
        'Create a tag policy in AWS Organizations that requires the tag',
        'Enable hourly, resource-level granularity in Cost Explorer',
        'Activate the tag as a cost allocation tag in Billing'
      ],
      correctAnswer: 3,
      explanation: 'User-defined tags appear in Cost Explorer, Budgets, and the Cost and Usage Report only after they are activated as cost allocation tags, which in an organization is done from the management account. AWS Config records resource configuration, not billing dimensions. A tag policy standardizes tag keys and values but does not activate them for billing, and hourly granularity is unrelated to tag grouping.'
    },
    {
      id: 'cost29',
      question: 'A finance team wants to be notified when spending on any AWS service deviates from its normal pattern, such as an unexpected spike in data transfer, without setting and maintaining fixed dollar thresholds for each service. Which solution requires the least effort?',
      options: [
        'AWS Cost Anomaly Detection with an AWS services monitor and an alert subscription',
        'An AWS Budgets cost budget for every service, each with its own alert thresholds',
        'CloudWatch billing alarms on the EstimatedCharges metric for each service',
        'A weekly manual review of the daily cost graphs in AWS Cost Explorer'
      ],
      correctAnswer: 0,
      explanation: 'Cost Anomaly Detection uses machine learning to learn normal spending for each service and alerts through email or SNS when spend deviates, with root-cause details and no thresholds to maintain. Per-service budgets and CloudWatch billing alarms both depend on fixed thresholds that someone must set and keep current. A manual weekly review is slow and is the opposite of least effort.'
    },
    {
      id: 'cost30',
      question: 'A FinOps team needs hourly, resource-level billing line items, including Savings Plans and Reserved Instance amortization, and wants to query them with SQL and build dashboards. Which solution meets these requirements?',
      options: [
        'Use AWS Cost Explorer with hourly granularity and download the reports as CSV files',
        'Configure AWS Budgets reports to deliver daily budget summaries to an S3 bucket',
        'Create a CUR 2.0 export with AWS Data Exports to S3 and query it with Amazon Athena',
        'Use AWS Pricing Calculator to produce an itemized estimate for each workload'
      ],
      correctAnswer: 2,
      explanation: 'The Cost and Usage Report (CUR 2.0, delivered through AWS Data Exports) is the most detailed billing dataset, with hourly, resource-level line items and amortized commitment costs, and it lands in S3 where Athena can query it and QuickSight can visualize it. Cost Explorer is an interactive analysis tool rather than a SQL dataset. Budgets reports summarize budget status, and Pricing Calculator estimates planned costs instead of reporting actual usage.'
    }
  ]
};
