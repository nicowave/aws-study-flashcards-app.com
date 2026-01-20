// Module 1: AWS Core Services
// Source: AWS Cloud Practitioner Essentials

export const module1 = {
  id: 'module1',
  name: 'AWS Core Services',
  description: 'Essential compute, storage, and database services',
  icon: '⚙️',
  color: '#58a6ff',
  gradient: 'linear-gradient(135deg, #58a6ff 0%, #388bfd 100%)',
  source: 'AWS Cloud Practitioner Essentials',
  cards: [
    {
      id: 'cs1',
      front: 'What is Amazon EC2?',
      back: 'Elastic Compute Cloud - Virtual servers in the cloud\n\n• Resizable compute capacity\n• Pay only for what you use\n• Choose instance type, OS, storage\n• Scale up/down in minutes',
      hint: 'Think: virtual machines',
      tags: ['compute', 'ec2'],
      difficulty: 'beginner'
    },
    {
      id: 'cs2',
      front: 'What is Amazon S3?',
      back: 'Simple Storage Service - Object storage\n\n• Unlimited storage capacity\n• 99.999999999% (11 9s) durability\n• Store any file type\n• Access via URL\n• Storage classes for cost optimization',
      hint: 'Think: files & buckets',
      tags: ['storage', 's3'],
      difficulty: 'beginner'
    },
    {
      id: 'cs3',
      front: 'What is Amazon RDS?',
      back: 'Relational Database Service - Managed databases\n\n• Supports MySQL, PostgreSQL, Oracle, SQL Server, MariaDB, Aurora\n• Automated backups, patching, scaling\n• Multi-AZ for high availability\n• Read replicas for performance',
      hint: 'Think: managed SQL databases',
      tags: ['database', 'rds'],
      difficulty: 'beginner'
    },
    {
      id: 'cs4',
      front: 'What is AWS Lambda?',
      back: 'Serverless compute - Run code without servers\n\n• Pay per invocation (milliseconds)\n• Auto-scales automatically\n• Supports many languages\n• Triggered by events\n• Max 15 min execution time',
      hint: 'Think: functions as a service',
      tags: ['compute', 'serverless', 'lambda'],
      difficulty: 'beginner'
    },
    {
      id: 'cs5',
      front: 'What is Amazon VPC?',
      back: 'Virtual Private Cloud - Your isolated network\n\n• Define your IP range (CIDR)\n• Create subnets (public/private)\n• Control routing\n• Network ACLs and Security Groups\n• Connect to on-premises via VPN',
      hint: 'Think: your private network in AWS',
      tags: ['networking', 'vpc'],
      difficulty: 'beginner'
    },
    {
      id: 'cs6',
      front: 'What is Amazon DynamoDB?',
      back: 'Managed NoSQL database\n\n• Key-value and document data\n• Single-digit millisecond latency\n• Serverless - auto-scales\n• Built-in security & backup\n• Global tables for multi-region',
      hint: 'Think: fast NoSQL',
      tags: ['database', 'dynamodb', 'nosql'],
      difficulty: 'beginner'
    },
    {
      id: 'cs7',
      front: 'What is Amazon CloudFront?',
      back: 'Content Delivery Network (CDN)\n\n• 400+ edge locations globally\n• Cache content close to users\n• Reduces latency\n• Integrates with S3, EC2, ELB\n• DDoS protection included',
      hint: 'Think: fast content delivery',
      tags: ['networking', 'cdn', 'cloudfront'],
      difficulty: 'beginner'
    },
    {
      id: 'cs8',
      front: 'What is Amazon Route 53?',
      back: 'DNS and Domain Registration\n\n• Highly available DNS service\n• Domain name registration\n• Health checks and routing\n• Supports various routing policies\n• Integrates with AWS services',
      hint: 'Why 53? DNS uses port 53',
      tags: ['networking', 'dns', 'route53'],
      difficulty: 'beginner'
    },
    {
      id: 'cs9',
      front: 'What is Elastic Load Balancing (ELB)?',
      back: 'Distribute traffic across targets\n\nTypes:\n• ALB - Layer 7 (HTTP/HTTPS)\n• NLB - Layer 4 (TCP/UDP)\n• CLB - Classic (legacy)\n• GLB - Gateway (appliances)\n\nAuto-scales and health checks',
      hint: 'Think: traffic distributor',
      tags: ['networking', 'elb', 'load-balancing'],
      difficulty: 'intermediate'
    },
    {
      id: 'cs10',
      front: 'What is Amazon EBS?',
      back: 'Elastic Block Store - Block storage for EC2\n\n• Persistent storage volumes\n• Snapshot backups to S3\n• Various volume types (SSD, HDD)\n• Encryption available\n• Attach to one EC2 at a time',
      hint: 'Think: hard drives for EC2',
      tags: ['storage', 'ebs'],
      difficulty: 'beginner'
    }
  ]
};
