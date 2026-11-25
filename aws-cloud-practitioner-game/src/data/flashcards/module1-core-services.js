// Module 1: AWS Core Services
// Sources: official AWS documentation, linked on each card

export const module1 = {
  id: 'module1',
  name: 'AWS Core Services',
  description: 'Essential compute, storage, and database services',
  icon: '⚙️',
  color: '#a78bfa',
  gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'cs1',
      front: 'What is Amazon EC2?',
      back: 'Elastic Compute Cloud - Virtual servers in the cloud\n\n• Resizable compute capacity\n• Pay only for what you use\n• Choose instance type, OS, storage\n• Scale up/down in minutes',
      hint: 'Think: virtual machines',
      tags: ['compute', 'ec2'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon EC2? – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html', checked: '2026-11-25' },
        { title: 'Secure and resizable cloud compute – Amazon EC2', url: 'https://aws.amazon.com/ec2/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs2',
      front: 'What is Amazon S3?',
      back: 'Simple Storage Service - Object storage\n\n• Unlimited storage capacity\n• 99.999999999% (11 9s) durability\n• Store any file type\n• Access via URL\n• Storage classes for cost optimization',
      hint: 'Think: files & buckets',
      tags: ['storage', 's3'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon S3? – Amazon S3 User Guide', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html', checked: '2026-11-25' },
        { title: 'Amazon S3 FAQs', url: 'https://aws.amazon.com/s3/faqs/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs3',
      front: 'What is Amazon RDS?',
      back: 'Relational Database Service - Managed databases\n\n• Supports MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, IBM Db2 (plus Amazon Aurora)\n• Automated backups, patching, scaling\n• Multi-AZ for high availability\n• Read replicas for performance',
      hint: 'Think: managed SQL databases',
      tags: ['database', 'rds'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Relational Database Service (Amazon RDS)? – Amazon RDS User Guide', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs4',
      front: 'What is AWS Lambda?',
      back: 'Serverless compute - Run code without servers\n\n• Pay per request and compute time (billed per ms)\n• Auto-scales automatically\n• Supports many languages\n• Triggered by events\n• Max timeout 30 min (1,800 seconds), raised from 15 min; older material may still say 15',
      hint: 'Think: functions as a service',
      tags: ['compute', 'serverless', 'lambda'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is AWS Lambda? – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', checked: '2026-11-25' },
        { title: 'Lambda quotas – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs5',
      front: 'What is Amazon VPC?',
      back: 'Virtual Private Cloud - Your isolated network\n\n• Define your IP range (CIDR)\n• Create subnets (public/private)\n• Control routing\n• Network ACLs and Security Groups\n• Connect to on-premises via VPN',
      hint: 'Think: your private network in AWS',
      tags: ['networking', 'vpc'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon VPC? – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', checked: '2026-11-25' },
        { title: 'Infrastructure security in Amazon VPC – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs6',
      front: 'What is Amazon DynamoDB?',
      back: 'Managed NoSQL database\n\n• Key-value and document data\n• Single-digit millisecond latency\n• Serverless - auto-scales\n• Built-in security & backup\n• Global tables for multi-region',
      hint: 'Think: fast NoSQL',
      tags: ['database', 'dynamodb', 'nosql'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon DynamoDB? – Amazon DynamoDB Developer Guide', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs7',
      front: 'What is Amazon CloudFront?',
      back: 'Content Delivery Network (CDN)\n\n• 750+ Points of Presence (edge locations) globally\n• Cache content close to users\n• Reduces latency\n• Integrates with S3, EC2, ELB\n• DDoS protection included (AWS Shield Standard)',
      hint: 'Think: fast content delivery',
      tags: ['networking', 'cdn', 'cloudfront'],
      difficulty: 'beginner',
      sources: [
        { title: 'Key Features of a Content Delivery Network – Amazon CloudFront', url: 'https://aws.amazon.com/cloudfront/features/', checked: '2026-11-25' },
        { title: 'What is Amazon CloudFront? – Amazon CloudFront Developer Guide', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs8',
      front: 'What is Amazon Route 53?',
      back: 'DNS and Domain Registration\n\n• Highly available DNS service\n• Domain name registration\n• Health checks and routing\n• Supports various routing policies\n• Integrates with AWS services',
      hint: 'Why 53? DNS uses port 53',
      tags: ['networking', 'dns', 'route53'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Route 53? – Amazon Route 53 Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', checked: '2026-11-25' },
        { title: 'Amazon Route 53 features', url: 'https://aws.amazon.com/route53/features/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs9',
      front: 'What is Elastic Load Balancing (ELB)?',
      back: 'Distribute traffic across targets\n\nTypes:\n• ALB - Layer 7 (HTTP/HTTPS)\n• NLB - Layer 4 (TCP/UDP/TLS)\n• GWLB - Gateway (Layer 3, third-party appliances)\n• CLB - Classic (previous generation)\n\nAuto-scales and health checks',
      hint: 'Think: traffic distributor',
      tags: ['networking', 'elb', 'load-balancing'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Elastic Load Balancing? – Elastic Load Balancing User Guide', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html', checked: '2026-11-25' },
        { title: 'Elastic Load Balancing features', url: 'https://aws.amazon.com/elasticloadbalancing/features/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cs10',
      front: 'What is Amazon EBS?',
      back: 'Elastic Block Store - Block storage for EC2\n\n• Persistent storage volumes\n• Snapshot backups to S3\n• Various volume types (SSD, HDD)\n• Encryption available\n• Usually attached to one EC2 instance at a time (io1/io2 Multi-Attach can share a volume within one AZ)',
      hint: 'Think: hard drives for EC2',
      tags: ['storage', 'ebs'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Elastic Block Store? – Amazon EBS User Guide', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html', checked: '2026-11-25' },
        { title: 'Attach an EBS volume to multiple EC2 instances using Multi-Attach – Amazon EBS User Guide', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html', checked: '2026-11-25' }
      ]
    }
  ]
};
