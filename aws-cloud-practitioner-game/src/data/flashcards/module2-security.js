// Module 2: AWS Security & IAM
// Source: AWS Cloud Practitioner Essentials

export const module2 = {
  id: 'module2',
  name: 'Security & IAM',
  description: 'Identity, access management, and security services',
  icon: '🔒',
  color: '#f85149',
  gradient: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
  source: 'AWS Cloud Practitioner Essentials',
  cards: [
    {
      id: 'sec1',
      front: 'What is IAM?',
      back: 'Identity and Access Management\n\n• Create users, groups, roles\n• Define permissions with policies\n• Control access to AWS resources\n• Free service\n• Global (not region-specific)',
      hint: 'Think: who can do what',
      tags: ['security', 'iam'],
      difficulty: 'beginner'
    },
    {
      id: 'sec2',
      front: 'What is the Shared Responsibility Model?',
      back: 'AWS: Security OF the cloud\n• Physical infrastructure\n• Network infrastructure\n• Hypervisor\n\nCustomer: Security IN the cloud\n• Data encryption\n• OS/network/firewall config\n• IAM\n• Application security',
      hint: 'AWS = infrastructure, You = data & config',
      tags: ['security', 'shared-responsibility'],
      difficulty: 'beginner'
    },
    {
      id: 'sec3',
      front: 'What is the Root User?',
      back: 'First account created with full access\n\nBest practices:\n• Enable MFA immediately\n• Don\'t use for daily tasks\n• Create IAM users instead\n• Lock away root credentials\n• Only use for specific tasks',
      hint: 'Think: super admin - use sparingly',
      tags: ['security', 'iam', 'root-user'],
      difficulty: 'beginner'
    },
    {
      id: 'sec4',
      front: 'What is MFA?',
      back: 'Multi-Factor Authentication\n\nRequires 2+ verification factors:\n• Something you know (password)\n• Something you have (device/token)\n\nSupported types:\n• Virtual MFA (app)\n• Hardware key\n• SMS (not recommended)',
      hint: 'Password + device code',
      tags: ['security', 'mfa', 'authentication'],
      difficulty: 'beginner'
    },
    {
      id: 'sec5',
      front: 'What is an IAM Policy?',
      back: 'JSON document defining permissions\n\nContains:\n• Effect: Allow or Deny\n• Action: What operations\n• Resource: Which resources\n• Condition: When it applies\n\nFollow least privilege principle!',
      hint: 'Think: permission rules in JSON',
      tags: ['security', 'iam', 'policies'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec6',
      front: 'What is an IAM Role?',
      back: 'Identity with permissions that can be assumed\n\n• No long-term credentials\n• Temporary security tokens\n• Used by services, apps, users\n• Cross-account access\n• Safer than sharing keys',
      hint: 'Think: temporary identity',
      tags: ['security', 'iam', 'roles'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec7',
      front: 'What is AWS Shield?',
      back: 'DDoS Protection Service\n\nShield Standard (Free):\n• Automatic protection\n• Layer 3/4 attacks\n\nShield Advanced ($):\n• Enhanced protection\n• 24/7 DRT support\n• Cost protection\n• Layer 7 attacks',
      hint: 'Think: DDoS protection',
      tags: ['security', 'shield', 'ddos'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec8',
      front: 'What is AWS WAF?',
      back: 'Web Application Firewall\n\nProtects against:\n• SQL injection\n• Cross-site scripting (XSS)\n• Bad bots\n\nFeatures:\n• Custom rules\n• Managed rule groups\n• Works with CloudFront, ALB, API Gateway',
      hint: 'Think: web app protection',
      tags: ['security', 'waf', 'firewall'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec9',
      front: 'What are Security Groups?',
      back: 'Virtual firewall for EC2 instances\n\n• Stateful (return traffic auto-allowed)\n• Allow rules only (no deny)\n• Inbound & outbound rules\n• Instance level\n• Default: deny all inbound',
      hint: 'Think: instance firewall',
      tags: ['security', 'networking', 'security-groups'],
      difficulty: 'beginner'
    },
    {
      id: 'sec10',
      front: 'What is AWS KMS?',
      back: 'Key Management Service\n\n• Create & manage encryption keys\n• Integrates with AWS services\n• Automatic key rotation\n• Audit key usage (CloudTrail)\n• FIPS 140-2 validated',
      hint: 'Think: encryption key management',
      tags: ['security', 'encryption', 'kms'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec11',
      front: 'What is Amazon GuardDuty?',
      back: 'Intelligent Threat Detection\n\n• Monitors AWS accounts & workloads\n• Uses ML to detect anomalies\n• Analyzes CloudTrail, VPC Flow Logs, DNS\n• No infrastructure to manage\n• Findings categorized by severity',
      hint: 'Think: smart security monitoring',
      tags: ['security', 'guardduty', 'threat-detection'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec12',
      front: 'What is the Principle of Least Privilege?',
      back: 'Grant only minimum permissions needed\n\nBenefits:\n• Reduces security risk\n• Limits blast radius\n• Easier compliance\n\nImplement via:\n• Specific IAM policies\n• Regular access reviews\n• Just-in-time access',
      hint: 'Only what you need, nothing more',
      tags: ['security', 'best-practices', 'least-privilege'],
      difficulty: 'beginner'
    }
  ]
};
