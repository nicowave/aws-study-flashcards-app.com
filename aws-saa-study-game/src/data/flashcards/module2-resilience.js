// Module 2: Resilience & HA
// AWS Solutions Architect Associate (SAA-C03)

export const module2 = {
  id: 'module2',
  name: 'Resilience & HA',
  description: 'Multi-AZ, DR strategies, decoupling, and failover',
  icon: '🏗️',
  color: '#3fb950',
  gradient: 'linear-gradient(135deg, #3fb950 0%, #3fb950 100%)',
  source: 'SAA-C03 Exam Guide',
  cards: [
    {
      id: 'res1',
      front: 'Multi-AZ vs multi-Region: when is each required?',
      back: 'Match scope to the failure you must survive\n\n• Multi-AZ: survives data center failure — the default HA posture\n• Multi-Region: survives Region failure — DR and global users\n• Multi-AZ is cheap and simple; multi-Region costs real money\n• Exam tell: "survive a Region outage" → second Region required',
      hint: 'What failure must you survive?',
      tags: ['ha', 'architecture'],
      difficulty: 'beginner'
    },
    {
      id: 'res2',
      front: 'ALB vs NLB vs Gateway Load Balancer?',
      back: 'Pick by layer and job\n\n• ALB: layer 7 HTTP — path/host routing, WAF attachable\n• NLB: layer 4 TCP/UDP — millions of req/s, STATIC IPs per AZ\n• GWLB: transparent insertion of appliance fleets (GENEVE)\n• Exam tell: "static IP to whitelist" → NLB',
      hint: 'HTTP vs TCP vs appliances',
      tags: ['elb', 'load-balancing'],
      difficulty: 'intermediate'
    },
    {
      id: 'res3',
      front: 'Auto Scaling policy types?',
      back: 'Thermostat, stairs, calendar\n\n• Target tracking: "keep CPU at 50%" — least overhead\n• Step: your own alarm thresholds and adjustment sizes\n• Scheduled: known time-based patterns\n• Predictive: ML forecast for recurring cycles',
      hint: 'Thermostat = target tracking',
      tags: ['autoscaling', 'scaling'],
      difficulty: 'intermediate'
    },
    {
      id: 'res4',
      front: 'ASG health checks: EC2 vs ELB type?',
      back: 'What counts as healthy\n\n• EC2 (default): instance running = healthy\n• ELB: must ALSO pass load balancer health checks\n• App can hang while instance runs — use ELB type behind a LB\n• Unhealthy → terminated and replaced automatically',
      hint: 'Running ≠ serving',
      tags: ['autoscaling', 'health-checks'],
      difficulty: 'intermediate'
    },
    {
      id: 'res5',
      front: 'Route 53 routing policies?',
      back: 'Six to know\n\n• Failover: primary + standby with health check\n• Weighted: % splits (canary)\n• Latency: fastest Region per user\n• Geolocation: by user country/continent\n• Multivalue: up to 8 healthy records\n• Simple: one record, no health checks',
      hint: 'Failover needs a health check',
      tags: ['route53', 'dns'],
      difficulty: 'intermediate'
    },
    {
      id: 'res6',
      front: 'RDS Multi-AZ vs read replicas?',
      back: 'The classic exam trap\n\n• Multi-AZ: SYNCHRONOUS standby, auto-failover, NOT readable (classic)\n• Read replica: ASYNC copy, serves reads, cross-Region OK, promotable\n• Multi-AZ = availability; replicas = read scaling\n• DR bonus: promote a cross-Region replica',
      hint: 'Availability vs read scaling',
      tags: ['rds', 'ha'],
      difficulty: 'intermediate'
    },
    {
      id: 'res7',
      front: 'Aurora resilience model?',
      back: 'Storage-level durability\n\n• 6 copies across 3 AZs, self-healing storage\n• Up to 15 reader replicas, reader endpoint load balances\n• Failover promotes a reader in ~30s\n• Global Database: cross-Region, ~1s replication lag, fast promotion',
      hint: '6 copies, 3 AZs',
      tags: ['aurora', 'ha'],
      difficulty: 'intermediate'
    },
    {
      id: 'res8',
      front: 'DynamoDB resilience features?',
      back: 'Regional by default, global on demand\n\n• Global tables: multi-Region ACTIVE-ACTIVE replication\n• PITR: restore to any second in last 35 days\n• On-demand backups: keep forever\n• Table data already replicated across AZs automatically',
      hint: 'Active-active across Regions',
      tags: ['dynamodb', 'dr'],
      difficulty: 'intermediate'
    },
    {
      id: 'res9',
      front: 'SQS standard vs FIFO?',
      back: 'Throughput vs ordering\n\n• Standard: unlimited throughput, at-least-once, best-effort order\n• FIFO: strict order + exactly-once, ~300 msg/s (3,000 batched)\n• FIFO queue names end in .fifo\n• Need order + dedup? FIFO. Need scale? Standard',
      hint: 'Order costs throughput',
      tags: ['sqs', 'messaging'],
      difficulty: 'intermediate'
    },
    {
      id: 'res10',
      front: 'SQS visibility timeout + DLQ?',
      back: 'Failure handling machinery\n\n• Visibility timeout: message hidden while a consumer works; reappears if not deleted\n• Too short → duplicate processing; too long → slow retry\n• DLQ: after maxReceiveCount failures, message moves aside\n• DLQ = inspect poison messages without blocking the queue',
      hint: 'Hidden, not gone',
      tags: ['sqs', 'error-handling'],
      difficulty: 'advanced'
    },
    {
      id: 'res11',
      front: 'SNS fan-out pattern?',
      back: 'One event, many consumers\n\n• Publish once to SNS topic → delivered to many SQS queues\n• Each queue processes independently at its own pace\n• Decouples producers from consumer count\n• Add filters so subscribers get only relevant messages',
      hint: 'One-to-many + queues',
      tags: ['sns', 'decoupling'],
      difficulty: 'intermediate'
    },
    {
      id: 'res12',
      front: 'S3 versioning + Cross-Region Replication?',
      back: 'Undo + geographic copies\n\n• Versioning: overwrites/deletes keep old versions (delete marker)\n• CRR REQUIRES versioning on both buckets\n• Replicates new objects only (batch replication for existing)\n• MFA delete: extra guard on permanent deletion',
      hint: 'CRR needs versioning',
      tags: ['s3', 'replication'],
      difficulty: 'intermediate'
    },
    {
      id: 'res13',
      front: 'EFS vs EBS availability model?',
      back: 'Regional vs zonal storage\n\n• EFS: regional — mountable from all AZs, survives AZ loss\n• EBS: lives in ONE AZ — snapshot to move/restore elsewhere\n• EBS snapshots stored in S3 (regional durability)\n• Multi-AZ app with shared files → EFS, not EBS',
      hint: 'Zonal vs regional',
      tags: ['efs', 'ebs'],
      difficulty: 'intermediate'
    },
    {
      id: 'res14',
      front: 'The DR strategy ladder?',
      back: 'Cost up, recovery time down\n\n• Backup & restore: cheapest, hours RTO\n• Pilot light: core (data) always on, scale up on failover\n• Warm standby: scaled-down full copy running\n• Active-active: full capacity both Regions, near-zero RTO/RPO',
      hint: 'Cheap-slow → costly-instant',
      tags: ['dr', 'rto-rpo'],
      difficulty: 'intermediate'
    },
    {
      id: 'res15',
      front: 'RTO vs RPO?',
      back: 'The two DR numbers\n\n• RTO: how long until service is BACK (downtime tolerance)\n• RPO: how much DATA you can lose (backup/replication frequency)\n• "15 min of data loss OK" → RPO 15 min\n• Strategy choice = matching both numbers at lowest cost',
      hint: 'Time back vs data lost',
      tags: ['dr', 'rto-rpo'],
      difficulty: 'beginner'
    },
    {
      id: 'res16',
      front: 'Common single points of failure to fix?',
      back: 'The usual suspects\n\n• One NAT gateway → one PER AZ\n• Session state on instances → ElastiCache/DynamoDB\n• Single AZ database → Multi-AZ\n• Failing dependencies → retries with exponential backoff + jitter, idempotent operations',
      hint: 'NAT per AZ',
      tags: ['ha', 'design'],
      difficulty: 'advanced'
    }
  ]
};
