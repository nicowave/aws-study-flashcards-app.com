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
    {
      id: 'co1',
      question: 'A company runs a production web application on a fleet of EC2 instances that operate at a steady, predictable load 24/7. The company has committed to using AWS for at least 3 more years and does not expect to change the instance family. What is the MOST cost-effective purchasing option?',
      options: [
        'On-Demand Instances with Auto Scaling to match demand',
        'Standard Reserved Instances with a 3-year term',
        'Spot Instances distributed across multiple Availability Zones',
        'Convertible Reserved Instances with a 1-year term'
      ],
      correctAnswer: 1,
      explanation: 'Standard Reserved Instances with a 3-year term provide the deepest discount (up to about 72% versus On-Demand) for a steady, predictable workload with no expected instance family changes. On-Demand offers no discount for a workload that runs continuously anyway, Spot Instances can be interrupted with 2 minutes of notice and are unsuitable for a production web tier, and Convertible RIs trade a smaller discount for flexibility this company does not need.'
    },
    {
      id: 'co2',
      question: 'A media company processes video transcoding jobs in a queue. Jobs are stateless, can be retried from a checkpoint, and have no strict completion deadline. Which EC2 purchasing option will minimize compute cost for this workload?',
      options: [
        'Spot Instances, with the application handling interruption notices',
        'On-Demand Instances sized for peak queue depth',
        'A 1-year EC2 Instance Savings Plan covering peak capacity',
        'Dedicated Hosts to guarantee capacity for the transcoding fleet'
      ],
      correctAnswer: 0,
      explanation: 'Spot Instances offer discounts of up to about 90% off On-Demand pricing and are ideal for fault-tolerant, interruptible batch workloads like queued transcoding, since jobs can checkpoint and retry after the 2-minute interruption notice. On-Demand at peak sizing pays full price for idle capacity, committing a Savings Plan to peak (rather than baseline) usage wastes the commitment during quiet periods, and Dedicated Hosts are the most expensive option, intended for licensing or compliance needs.'
    },
    {
      id: 'co3',
      question: 'A company has a consistent baseline of compute spend but expects to migrate workloads from EC2 to AWS Fargate and Lambda over the next year, and may also change EC2 instance families and Regions. The company wants a committed-spend discount that survives all of these changes. Which option should a solutions architect recommend?',
      options: [
        'Standard Reserved Instances for the current instance types',
        'An EC2 Instance Savings Plan in the current Region',
        'A Compute Savings Plan',
        'Zonal Reserved Instances in each Availability Zone in use'
      ],
      correctAnswer: 2,
      explanation: 'Compute Savings Plans apply automatically to EC2 usage regardless of instance family, size, OS, or Region, and also cover Fargate and Lambda, so the discount follows the workloads through the planned migration. EC2 Instance Savings Plans are locked to a specific instance family in a specific Region and never apply to Fargate or Lambda, and Standard or zonal Reserved Instances are tied to specific instance attributes that the company plans to change.'
    },
    {
      id: 'co4',
      question: 'A company wants a 3-year commitment discount on EC2 for a database server, but anticipates it may need to switch from memory-optimized to compute-optimized instances partway through the term. Which purchasing option meets this requirement at the LOWEST cost?',
      options: [
        'Standard Reserved Instances, reselling them if requirements change',
        'On-Demand Instances until the final instance family is confirmed',
        'Spot Instances with capacity-optimized allocation',
        'Convertible Reserved Instances for the 3-year term'
      ],
      correctAnswer: 3,
      explanation: 'Convertible Reserved Instances can be exchanged during the term for RIs of a different instance family, OS, or tenancy of equal or greater value, so they suit a commitment where the instance family may change. Standard RIs cannot be exchanged for a different family (marketplace resale is uncertain and lossy), staying On-Demand forgoes the commitment discount entirely, and Spot Instances are inappropriate for a database that cannot tolerate interruption.'
    },
    {
      id: 'co5',
      question: 'A company must run a commercial application whose per-socket software licenses are bound to physical servers, and its compliance team requires visibility into the underlying sockets and cores. Which EC2 purchasing option supports bringing these licenses at the LOWEST cost consistent with the requirement?',
      options: [
        'Dedicated Hosts, with host-level Reserved pricing for steady usage',
        'Dedicated Instances with default tenancy licenses',
        'On-Demand Instances with License Manager tracking',
        'Spot Instances pinned to a single Availability Zone'
      ],
      correctAnswer: 0,
      explanation: 'Dedicated Hosts give you an entire physical server with visibility into sockets and cores, which is required for BYOL licenses bound to physical hardware, and host reservations reduce the cost for steady use. Dedicated Instances isolate hardware but do not expose socket/core placement needed for per-socket licensing, and On-Demand or Spot on shared tenancy cannot satisfy physical-server license binding at all.'
    },
    {
      id: 'co6',
      question: 'A company suspects many of its EC2 instances are significantly larger than their workloads require. Which AWS service analyzes CloudWatch utilization metrics and recommends specific smaller or different instance types to reduce cost?',
      options: [
        'AWS Budgets',
        'AWS Cost and Usage Report',
        'AWS Compute Optimizer',
        'AWS Config'
      ],
      correctAnswer: 2,
      explanation: 'AWS Compute Optimizer uses machine learning on CloudWatch metrics to identify over-provisioned EC2 instances, Auto Scaling groups, EBS volumes, and Lambda functions, and recommends specific right-sized alternatives. AWS Budgets alerts on spend thresholds but does not analyze utilization, the Cost and Usage Report provides raw billing data without recommendations, and AWS Config tracks resource configuration compliance rather than performance-based sizing.'
    },
    {
      id: 'co7',
      question: 'A finance team wants to visualize the past 12 months of AWS spending, forecast the next 3 months, and receive recommendations for Reserved Instance purchases based on historical usage. Which tool provides all of this natively?',
      options: [
        'AWS Trusted Advisor',
        'AWS Cost Explorer',
        'Amazon CloudWatch billing alarms',
        'AWS Pricing Calculator'
      ],
      correctAnswer: 1,
      explanation: 'Cost Explorer provides historical cost visualization, usage-based forecasting, and Reserved Instance and Savings Plans purchase recommendations derived from past usage, all in one tool. Trusted Advisor surfaces cost optimization checks such as idle resources but does not forecast, CloudWatch billing alarms only alert when a charge threshold is crossed, and the Pricing Calculator estimates costs for planned architectures rather than analyzing actual usage.'
    },
    {
      id: 'co8',
      question: 'A company wants to be notified when monthly spend in a development account is forecasted to exceed $5,000, and wants an automated response that restricts the ability to launch new EC2 instances when the actual spend crosses that threshold. Which approach meets these requirements with the LEAST custom development?',
      options: [
        'A CloudWatch billing alarm invoking a custom Lambda function that detaches IAM policies',
        'A Cost Explorer report reviewed weekly by the finance team',
        'AWS Cost Anomaly Detection with an SNS notification topic',
        'An AWS Budget with a forecasted-spend alert and a budget action that applies a restrictive IAM policy'
      ],
      correctAnswer: 3,
      explanation: 'AWS Budgets supports alerts on both actual and forecasted spend, and budget actions can automatically apply a restrictive IAM or SCP policy (or stop EC2/RDS instances) when a threshold is crossed, requiring no custom code. A CloudWatch alarm with Lambda achieves this only with custom development, weekly Cost Explorer reviews are neither automated nor timely, and Cost Anomaly Detection flags unusual spend patterns but cannot enforce a fixed threshold or take remediation actions.'
    },
    {
      id: 'co9',
      question: 'A company needs hourly-granularity, resource-level billing data including cost allocation tags, delivered automatically for analysis with SQL. Which solution meets this requirement?',
      options: [
        'Enable the AWS Cost and Usage Report delivered to an S3 bucket and query it with Amazon Athena',
        'Export Cost Explorer graphs as CSV files each month for the analysts',
        'Enable AWS Budgets reports emailed daily to the analytics team',
        'Stream CloudTrail management events to S3 and query them with Athena'
      ],
      correctAnswer: 0,
      explanation: 'The Cost and Usage Report (CUR) is the most granular billing dataset AWS provides, supporting hourly granularity and resource-level line items with cost allocation tags, and it delivers directly to S3 where Athena can query it with SQL. Cost Explorer exports are aggregated and manual, Budgets reports contain threshold summaries rather than detailed line items, and CloudTrail records API activity, not billing data.'
    },
    {
      id: 'co10',
      question: 'A company runs many workloads for different internal teams in a single AWS account and wants monthly cost breakdowns per team in its billing tools. What should a solutions architect do?',
      options: [
        'Create a separate CloudWatch dashboard for each team\'s resources',
        'Enable AWS CloudTrail and attribute costs from API call logs',
        'Tag resources with a team identifier and activate the tags as cost allocation tags in the Billing console',
        'Ask each team to estimate its usage with the AWS Pricing Calculator'
      ],
      correctAnswer: 2,
      explanation: 'Applying a consistent team tag to resources and then activating it as a cost allocation tag makes the tag available as a filter and grouping dimension in Cost Explorer and the Cost and Usage Report. Tags must be explicitly activated in the Billing console before they appear in cost reports. CloudWatch dashboards show operational metrics rather than cost, CloudTrail logs API calls without pricing data, and Pricing Calculator estimates are not actual billed usage.'
    },
    {
      id: 'co11',
      question: 'A data lake stores millions of objects in S3 whose access patterns are unpredictable — some objects are read frequently for months, others are never accessed again after upload. The company wants to reduce storage cost automatically without retrieval fees or performance impact. Which storage class should be used?',
      options: [
        'S3 Standard-IA with a lifecycle rule after 30 days',
        'S3 Intelligent-Tiering',
        'S3 Glacier Flexible Retrieval',
        'S3 One Zone-IA for all objects at upload time'
      ],
      correctAnswer: 1,
      explanation: 'S3 Intelligent-Tiering automatically moves objects between access tiers based on observed access patterns, charges no retrieval fees, and imposes no performance penalty for objects that turn out to be frequently accessed — making it the right choice when access patterns are unknown or changing. Standard-IA and One Zone-IA charge per-GB retrieval fees that punish objects that are still read frequently, and Glacier Flexible Retrieval requires a restore taking minutes to hours before objects can be read.'
    },
    {
      id: 'co12',
      question: 'A hospital must retain imaging archives for 7 years for regulatory compliance. The data is almost never accessed, and when it is, a retrieval time of up to 12 hours is acceptable. Which S3 storage class stores this data at the LOWEST cost?',
      options: [
        'S3 Standard-IA',
        'S3 Glacier Instant Retrieval',
        'S3 Intelligent-Tiering',
        'S3 Glacier Deep Archive'
      ],
      correctAnswer: 3,
      explanation: 'S3 Glacier Deep Archive is the lowest-cost storage class in S3, designed for long-term retention of data accessed less than once a year, with standard retrievals completing within 12 hours — matching the stated tolerance. Glacier Instant Retrieval and Standard-IA cost more because they provide millisecond access this workload does not need, and Intelligent-Tiering adds monitoring charges without beating Deep Archive pricing for data that is essentially never read.'
    },
    {
      id: 'co13',
      question: 'A company stores nightly-generated report files in S3. The files are accessed rarely after the first day, must be retained for a year, and can be regenerated from source data if ever lost. Which storage class minimizes cost for this data after its first 30 days?',
      options: [
        'S3 One Zone-IA',
        'S3 Standard',
        'S3 Standard-IA',
        'S3 Glacier Deep Archive'
      ],
      correctAnswer: 0,
      explanation: 'S3 One Zone-IA stores data in a single Availability Zone at roughly 20% less than Standard-IA, and is appropriate here because the reports are infrequently accessed and re-creatable if the AZ is lost. Standard-IA costs more to protect against an AZ loss that this data can tolerate, S3 Standard pays a premium for frequent-access performance the files no longer need, and Deep Archive would impose hours-long restores on files that still need occasional immediate reads.'
    },
    {
      id: 'co14',
      question: 'An audit of a company\'s S3 spending reveals significant charges for storage that does not appear in any bucket\'s object listing. Large files are regularly uploaded using multipart upload, and some uploads fail partway. What should a solutions architect do to eliminate this hidden cost?',
      options: [
        'Enable S3 Transfer Acceleration to prevent upload failures',
        'Transition all objects to S3 Intelligent-Tiering with a lifecycle rule',
        'Add a lifecycle rule that aborts incomplete multipart uploads after a set number of days',
        'Enable S3 Versioning so failed uploads can be rolled back and removed'
      ],
      correctAnswer: 2,
      explanation: 'Parts from failed or abandoned multipart uploads remain stored — and billed — even though no completed object appears in listings, and the fix is a lifecycle rule with the AbortIncompleteMultipartUpload action to delete them automatically. Transfer Acceleration speeds uploads but does not clean up parts from failures, Intelligent-Tiering transitions apply to completed objects rather than orphaned parts, and Versioning adds storage for old versions instead of removing anything.'
    },
    {
      id: 'co15',
      question: 'EC2 instances in private subnets transfer several terabytes of data to Amazon S3 in the same Region each day through a NAT gateway, generating large data processing charges. What is the MOST cost-effective change?',
      options: [
        'Replace the NAT gateway with a NAT instance on a smaller instance type',
        'Create a gateway VPC endpoint for S3 and route S3 traffic through it',
        'Move the EC2 instances to public subnets with Elastic IP addresses',
        'Provision an interface VPC endpoint for S3 in each Availability Zone'
      ],
      correctAnswer: 1,
      explanation: 'A gateway VPC endpoint for S3 has no hourly or per-GB charge and routes S3 traffic privately, eliminating the NAT gateway\'s per-GB data processing fees for this traffic — the classic fix for the "S3 through NAT" cost trap. A NAT instance still incurs instance and bandwidth costs and reduces reliability, moving instances to public subnets weakens the security posture, and interface endpoints work but carry hourly and per-GB charges that the free gateway endpoint avoids.'
    },
    {
      id: 'co16',
      question: 'A company serves static assets and video files globally from S3, and data transfer out to the internet has become its largest cost line. Requests come repeatedly for the same popular objects. What should a solutions architect recommend to reduce cost while improving performance?',
      options: [
        'Enable S3 Transfer Acceleration on the bucket',
        'Replicate the bucket to multiple Regions with Cross-Region Replication',
        'Move the assets to EBS volumes attached to EC2 instances in each Region',
        'Serve the content through an Amazon CloudFront distribution with S3 as the origin'
      ],
      correctAnswer: 3,
      explanation: 'CloudFront caches popular objects at edge locations, so repeated requests are served from cache instead of generating S3 data-transfer-out charges, and data transfer from S3 to CloudFront costs nothing — while also cutting latency for global users. Transfer Acceleration optimizes uploads into S3 rather than delivery cost, Cross-Region Replication multiplies storage cost without addressing internet egress, and shifting to EBS/EC2 adds compute and storage cost while still paying egress from each instance.'
    },
    {
      id: 'co17',
      question: 'A high-throughput application tier on EC2 exchanges large volumes of traffic with a backend service tier over private IP addresses in the same Region. The company wants to reduce data transfer charges without changing the application. Which network design principle applies?',
      options: [
        'Traffic between instances in the same Availability Zone over private IPs is free, while cross-AZ traffic incurs per-GB charges in each direction',
        'All traffic within a Region is free regardless of Availability Zone, so no savings are possible',
        'Cross-AZ traffic is free but same-AZ traffic is billed at the internet egress rate',
        'Data transfer into AWS from the internet is billed, so reducing inbound traffic is the priority'
      ],
      correctAnswer: 0,
      explanation: 'Within a Region, data transfer between EC2 instances in the same Availability Zone over private IP addresses is free, while traffic that crosses AZ boundaries is charged per GB on each side, so co-locating chatty tiers in one AZ (where availability requirements permit) reduces cost. Intra-Region traffic is not universally free, same-AZ private traffic is not billed at egress rates, and data transfer into AWS from the internet is free — it is outbound transfer that is charged.'
    },
    {
      id: 'co18',
      question: 'A company transfers a sustained 100 TB per month from its AWS environment to its on-premises data center over the public internet and wants to reduce this recurring transfer cost while gaining consistent network performance. What should a solutions architect recommend?',
      options: [
        'Compress the data and continue transferring over the internet gateway',
        'Use AWS Snowball Edge devices shipped monthly to the data center',
        'Establish an AWS Direct Connect connection to the data center',
        'Route the traffic through a Site-to-Site VPN over the internet'
      ],
      correctAnswer: 2,
      explanation: 'Direct Connect data transfer out is billed at a significantly lower per-GB rate than internet egress, so at a sustained 100 TB monthly volume the reduced transfer charges outweigh the port cost, and a dedicated connection also delivers consistent bandwidth and latency. Compression helps but does not change the per-GB rate, monthly Snowball shipments are operationally poor for continuous transfer needs, and a Site-to-Site VPN still sends traffic over the internet at standard internet egress rates.'
    },
    {
      id: 'co19',
      question: 'An API receives unpredictable, bursty traffic — sometimes thousands of requests per minute, and sometimes none for hours. Each request completes in under a second. The workload currently runs on an always-on EC2 instance behind an Application Load Balancer. What is the MOST cost-effective redesign?',
      options: [
        'Purchase a Reserved Instance for the EC2 instance to reduce its hourly rate',
        'Rebuild the API using Amazon API Gateway and AWS Lambda',
        'Move the API to a larger EC2 instance to handle bursts more efficiently',
        'Run the API on an ECS cluster of two On-Demand instances for high availability'
      ],
      correctAnswer: 1,
      explanation: 'Lambda charges only per request and per millisecond of execution, so during the hours with no traffic the cost is zero — eliminating the idle cost of an always-on instance, which is the dominant expense for intermittent workloads. A Reserved Instance discounts but still pays for 24/7 capacity that sits idle, a larger instance increases the idle cost, and a two-instance ECS cluster on On-Demand doubles the always-on footprint.'
    },
    {
      id: 'co20',
      question: 'A company runs development and test EC2 and RDS environments that are only used by engineers during business hours on weekdays. What is the MOST effective way to reduce the cost of these environments?',
      options: [
        'Purchase 3-year Standard Reserved Instances for the development fleet',
        'Migrate all development instances to burstable T-family instances',
        'Consolidate the environments into fewer, larger shared instances',
        'Automatically stop the instances outside business hours and start them each workday'
      ],
      correctAnswer: 3,
      explanation: 'Stopping non-production instances on a schedule (for example with Instance Scheduler on AWS or EventBridge-triggered automation) eliminates compute charges for the roughly 70% of the week they are unused; stopped EC2 and RDS instances accrue only storage charges. Reserved Instances are a poor fit because they bill for the full term regardless of usage, burstable instances still cost money while idle overnight, and consolidation reduces cost less than simply not running the capacity at all.'
    },
    {
      id: 'co21',
      question: 'A web application runs on a fixed fleet of 10 EC2 instances sized for peak traffic, but utilization data shows only 2 instances\' worth of load most of the day, with peaks occurring for a few hours each evening. What should a solutions architect implement to reduce cost while maintaining performance at peak?',
      options: [
        'An Auto Scaling group that scales on load, with target tracking to add and remove instances as demand changes',
        'A larger single instance that can absorb the entire peak load',
        'Reserved Instances covering all 10 instances at the peak level',
        'A second fixed fleet in another Availability Zone to distribute the load'
      ],
      correctAnswer: 0,
      explanation: 'An Auto Scaling group with target tracking sheds idle capacity during the many low-traffic hours and scales out for the evening peak, so the company pays for roughly 2 instances most of the day instead of 10. A single large instance still runs peak-sized capacity around the clock and creates a single point of failure, reserving all 10 instances locks in payment for idle capacity, and adding a second fixed fleet doubles cost rather than reducing it.'
    },
    {
      id: 'co22',
      question: 'A reporting database is queried heavily at the start of each month and is nearly idle the rest of the time. The company runs it on a large provisioned Amazon Aurora instance and wants to cut cost without managing capacity manually. Which solution meets this requirement?',
      options: [
        'Migrate the database to a memory-optimized RDS instance with a Reserved Instance',
        'Add Aurora read replicas that are manually deleted after month-start reporting',
        'Migrate the database to Aurora Serverless v2',
        'Move the reporting queries to a second identical provisioned Aurora cluster'
      ],
      correctAnswer: 2,
      explanation: 'Aurora Serverless v2 automatically scales database capacity (ACUs) up for the month-start reporting surge and back down to a small baseline when idle, so the company pays for capacity only in proportion to demand without manual intervention. A Reserved Instance commits to full-size capacity that idles most of the month, manually managed read replicas contradict the no-manual-capacity requirement, and a second identical provisioned cluster roughly doubles the cost.'
    },
    {
      id: 'co23',
      question: 'A new DynamoDB-backed application has completely unpredictable traffic that can spike from near zero to thousands of requests per second with no warning, and the team cannot forecast capacity. Which capacity mode minimizes cost and operational effort for this pattern?',
      options: [
        'Provisioned capacity set to the highest expected peak',
        'On-demand capacity mode',
        'Provisioned capacity with auto scaling and a low minimum',
        'Provisioned capacity with DynamoDB Accelerator (DAX) absorbing the spikes'
      ],
      correctAnswer: 1,
      explanation: 'On-demand mode charges per request and instantly accommodates sudden spikes without any capacity planning, making it the best fit for unpredictable, spiky traffic — you pay nothing for the near-zero periods. Provisioning for peak pays continuously for unused throughput, auto scaling on provisioned capacity reacts with a lag and can throttle sharp spikes from a low minimum, and DAX accelerates reads via caching but does not remove the need to provision write and cache-miss capacity.'
    },
    {
      id: 'co24',
      question: 'An RDS for MySQL database is under heavy read load, and analysis shows the majority of queries repeatedly fetch the same small set of reference data. The company wants to reduce database load and cost. Which approach is MOST cost-effective?',
      options: [
        'Add two additional read replicas and distribute the read traffic',
        'Scale the RDS instance up to the next larger instance class',
        'Migrate the database to Aurora with three reader instances',
        'Add an Amazon ElastiCache cluster in front of the database for the frequently repeated reads'
      ],
      correctAnswer: 3,
      explanation: 'When the read load is dominated by repeated queries for the same data, a cache such as ElastiCache serves those reads from memory at a fraction of the cost of additional database capacity, and dramatically cuts load on the primary. Read replicas and Aurora readers each add full database-instance costs to repeatedly re-read unchanging data, and scaling the instance up raises spend while still executing every redundant query against the database engine.'
    },
    {
      id: 'co25',
      question: 'A company runs a production RDS database in a Multi-AZ configuration and creates a copy of it for the development team. The development database is only used for functional testing, and short outages are acceptable. How can the company reduce the cost of the development database?',
      options: [
        'Run the development database as a Single-AZ instance',
        'Keep Multi-AZ but disable automated backups on the development database',
        'Run the development database as a Multi-AZ cluster with two readable standbys',
        'Move the development database to a cross-Region read replica of production'
      ],
      correctAnswer: 0,
      explanation: 'Multi-AZ roughly doubles the instance cost because a synchronous standby runs continuously, and a development database that can tolerate short outages does not need that availability tier — Single-AZ deployment is the standard cost optimization for non-production databases. Disabling backups saves comparatively little while keeping the expensive standby, a Multi-AZ cluster with two standbys adds even more capacity, and a cross-Region replica adds another instance plus inter-Region data transfer charges.'
    },
    {
      id: 'co26',
      question: 'A company has hundreds of EBS gp2 volumes attached to production instances. Performance requirements are already met, and the company wants to reduce EBS spend with the LEAST effort and no downtime. What should a solutions architect recommend?',
      options: [
        'Convert the volumes to st1 throughput-optimized HDD volumes',
        'Convert the volumes to io2 volumes with provisioned IOPS matching current usage',
        'Migrate the volumes from gp2 to gp3 using elastic volume modification',
        'Snapshot the volumes and recreate them at half their current size'
      ],
      correctAnswer: 2,
      explanation: 'gp3 volumes cost about 20% less per GB than gp2 and include a 3,000 IOPS and 125 MiB/s baseline regardless of size, and the change can be applied in place with elastic volume modification — no downtime and minimal effort. st1 HDD volumes are unsuitable for general-purpose boot and transactional workloads, io2 provisioned IOPS volumes cost more than gp2 rather than less, and recreating smaller volumes from snapshots is high-effort, risks capacity shortfalls, and requires reattachment.'
    },
    {
      id: 'co27',
      question: 'A company takes daily EBS snapshots of hundreds of volumes for backup. Snapshot storage costs have grown steadily because old snapshots are never removed. What is the MOST operationally efficient way to control this cost?',
      options: [
        'Write a cron job on an administration server that lists and deletes old snapshots',
        'Use Amazon Data Lifecycle Manager policies to create snapshots and automatically expire them after the retention period',
        'Copy all snapshots older than 30 days to another Region and delete the originals manually each quarter',
        'Switch from EBS snapshots to full AMI images taken weekly'
      ],
      correctAnswer: 1,
      explanation: 'Amazon Data Lifecycle Manager (DLM) automates the entire snapshot lifecycle with policies that schedule creation and delete snapshots once they age past the defined retention period, requiring no custom code or servers. A cron job on an admin server is custom infrastructure that must itself be maintained, copying old snapshots to another Region adds storage and transfer cost without deleting anything automatically, and weekly AMIs reduce backup granularity while still accumulating unmanaged snapshot storage.'
    },
    {
      id: 'co28',
      question: 'A company stores shared project files on Amazon EFS. Analysis shows that over 80% of the files have not been accessed in months, but users occasionally need any file without changing how they access the file system. How can storage cost be reduced with no application changes?',
      options: [
        'Export the old files to instance store volumes on a large EC2 instance',
        'Recreate the file system in EFS One Zone storage and accept reduced durability',
        'Mount an S3 bucket alongside EFS and ask users to move inactive files there',
        'Enable an EFS lifecycle management policy to transition inactive files to the EFS Infrequent Access storage class'
      ],
      correctAnswer: 3,
      explanation: 'EFS lifecycle management automatically transitions files that have not been accessed for a configured period to the Infrequent Access storage class, which costs a small fraction of the standard per-GB rate, while files stay in the same file system paths and are retrieved transparently when accessed. Instance store is ephemeral and loses data on instance stop, recreating the file system in One Zone is a disruptive migration that trades durability rather than targeting cold data, and requiring users to move files to S3 changes the access workflow.'
    },
    {
      id: 'co29',
      question: 'A company uses AWS Organizations with separate accounts for each business unit. One account purchased Reserved Instances but its usage has dropped, leaving the reservations underutilized, while another account runs matching instance types On-Demand. What happens with consolidated billing, assuming default settings?',
      options: [
        'Reserved Instance discount sharing applies the unused RI discount to matching usage in the other account automatically',
        'The RI discount is forfeited because Reserved Instances can never leave the purchasing account',
        'The RIs must be resold on the Reserved Instance Marketplace to the other account',
        'The management account must repurchase equivalent RIs before any sharing occurs'
      ],
      correctAnswer: 0,
      explanation: 'Under consolidated billing, Reserved Instance and Savings Plans discounts are shared across the organization by default: the purchasing account gets first priority, and any unused discount automatically applies to matching usage in other member accounts. The discount is not forfeited, no marketplace resale between accounts is needed, and the management account does not need to repurchase anything — although sharing can be turned off per account if desired.'
    },
    {
      id: 'co30',
      question: 'A company with 20 AWS accounts, each storing tens of terabytes in Amazon S3, manages the accounts independently and pays each bill separately. No single account\'s usage reaches S3\'s higher-volume pricing tiers. How can the company reduce its S3 and data transfer rates without moving any data?',
      options: [
        'Migrate all the data into a single central account to concentrate usage',
        'Purchase S3 Reserved Capacity for each of the 20 accounts',
        'Join the accounts to an AWS Organization so consolidated billing aggregates usage across accounts into shared volume pricing tiers',
        'Negotiate a Direct Connect connection for each account to lower storage rates'
      ],
      correctAnswer: 2,
      explanation: 'Consolidated billing treats all member accounts as one for pricing purposes, so combined S3 storage and data transfer usage is aggregated toward volume-based pricing tiers, letting the organization reach lower per-GB rates none of the accounts qualifies for alone — with no data migration. Centralizing data into one account is a disruptive migration achieving a similar tiering effect the hard way, S3 does not offer per-account reserved capacity purchasing as a standard cost lever, and Direct Connect addresses network connectivity rather than storage rates.'
    }
  ]
};
