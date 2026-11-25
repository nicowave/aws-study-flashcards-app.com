// Module 2: AWS Security & IAM
// Sources: official AWS documentation, linked on each card

export const module2 = {
  id: 'module2',
  name: 'Security & IAM',
  description: 'Identity, access management, and security services',
  icon: '🔒',
  color: '#f85149',
  gradient: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'sec1',
      front: 'What is IAM?',
      back: 'Identity and Access Management\n\n• Create users, groups, roles\n• Define permissions with policies\n• Control access to AWS resources\n• Free service\n• Global (not region-specific)',
      hint: 'Think: who can do what',
      tags: ['security', 'iam'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is IAM? – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html', checked: '2026-11-25' },
        { title: 'IAM policy validation check reference – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-reference-policy-checks.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec2',
      front: 'What is the Shared Responsibility Model?',
      back: 'AWS: Security OF the cloud\n• Physical infrastructure\n• Network infrastructure\n• Hypervisor\n\nCustomer: Security IN the cloud\n• Data encryption\n• OS/network/firewall config\n• IAM\n• Application security',
      hint: 'AWS = infrastructure, You = data & config',
      tags: ['security', 'shared-responsibility'],
      difficulty: 'beginner',
      sources: [
        { title: 'Shared Responsibility Model – AWS', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec3',
      front: 'What is the Root User?',
      back: 'The identity created with the AWS account, with complete access to all services and resources\n\nBest practices:\n• Enable MFA immediately\n• Don\'t use for everyday tasks\n• Create an administrative user instead (e.g., in IAM Identity Center)\n• Lock away root credentials\n• Only use for tasks that require root',
      hint: 'Think: super admin - use sparingly',
      tags: ['security', 'iam', 'root-user'],
      difficulty: 'beginner',
      sources: [
        { title: 'AWS account root user – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html', checked: '2026-11-25' },
        { title: 'Root user best practices for your AWS account – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec4',
      front: 'What is MFA?',
      back: 'Multi-Factor Authentication\n\nRequires 2+ verification factors:\n• Something you know (password)\n• Something you have (device/token)\n\nSupported types:\n• Passkeys & security keys (FIDO)\n• Virtual authenticator app\n• Hardware TOTP token\n\nSMS MFA is no longer supported',
      hint: 'Password + device code',
      tags: ['security', 'mfa', 'authentication'],
      difficulty: 'beginner',
      sources: [
        { title: 'AWS Multi-factor authentication in IAM – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec5',
      front: 'What is an IAM Policy?',
      back: 'JSON document defining permissions\n\nContains:\n• Effect: Allow or Deny\n• Action: What operations\n• Resource: Which resources\n• Condition: When it applies\n\nFollow least privilege principle!',
      hint: 'Think: permission rules in JSON',
      tags: ['security', 'iam', 'policies'],
      difficulty: 'intermediate',
      sources: [
        { title: 'IAM JSON policy element reference – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html', checked: '2026-11-25' },
        { title: 'Security best practices in IAM – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec6',
      front: 'What is an IAM Role?',
      back: 'Identity with permissions that can be assumed\n\n• No long-term credentials\n• Temporary security tokens\n• Used by services, apps, users\n• Cross-account access\n• Safer than sharing keys',
      hint: 'Think: temporary identity',
      tags: ['security', 'iam', 'roles'],
      difficulty: 'intermediate',
      sources: [
        { title: 'IAM roles – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec7',
      front: 'What is AWS Shield?',
      back: 'DDoS Protection Service\n\nShield Standard (Free):\n• Automatic protection\n• Layer 3/4 attacks\n\nShield Advanced ($):\n• Enhanced protection\n• 24/7 Shield Response Team (SRT)\n• Cost protection\n• Layer 7 attacks',
      hint: 'Think: DDoS protection',
      tags: ['security', 'shield', 'ddos'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Shield Standard overview – AWS WAF, AWS Firewall Manager, and AWS Shield Advanced Developer Guide', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/ddos-standard-summary.html', checked: '2026-11-25' },
        { title: 'Managed DDoS Protection – AWS Shield Features', url: 'https://aws.amazon.com/shield/features/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec8',
      front: 'What is AWS WAF?',
      back: 'Web Application Firewall\n\nProtects against:\n• SQL injection\n• Cross-site scripting (XSS)\n• Bad bots\n\nFeatures:\n• Custom rules\n• Managed rule groups\n• Works with CloudFront, ALB, API Gateway',
      hint: 'Think: web app protection',
      tags: ['security', 'waf', 'firewall'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS WAF – AWS WAF, AWS Firewall Manager, and AWS Shield Advanced Developer Guide', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html', checked: '2026-11-25' },
        { title: 'Web Application Firewall – AWS WAF', url: 'https://aws.amazon.com/waf/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec9',
      front: 'What are Security Groups?',
      back: 'Virtual firewall for EC2 instances\n\n• Stateful (return traffic auto-allowed)\n• Allow rules only (no deny)\n• Inbound & outbound rules\n• Instance level\n• Default: deny all inbound',
      hint: 'Think: instance firewall',
      tags: ['security', 'networking', 'security-groups'],
      difficulty: 'beginner',
      sources: [
        { title: 'Control traffic to your AWS resources using security groups – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html', checked: '2026-11-25' },
        { title: 'Security group rules – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec10',
      front: 'What is AWS KMS?',
      back: 'Key Management Service\n\n• Create & manage encryption keys\n• Integrates with AWS services\n• Automatic key rotation (optional, yearly by default)\n• Audit key usage (CloudTrail)\n• FIPS 140-3 Level 3 validated HSMs',
      hint: 'Think: encryption key management',
      tags: ['security', 'encryption', 'kms'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Features – AWS Key Management Service (KMS)', url: 'https://aws.amazon.com/kms/features/', checked: '2026-11-25' },
        { title: 'Rotate AWS KMS keys – AWS Key Management Service Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec11',
      front: 'What is Amazon GuardDuty?',
      back: 'Intelligent Threat Detection\n\n• Monitors AWS accounts & workloads\n• Uses ML to detect anomalies\n• Analyzes CloudTrail, VPC Flow Logs, DNS\n• No infrastructure to manage\n• Findings categorized by severity',
      hint: 'Think: smart security monitoring',
      tags: ['security', 'guardduty', 'threat-detection'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Amazon GuardDuty? – Amazon GuardDuty User Guide', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html', checked: '2026-11-25' },
        { title: 'Severity levels of GuardDuty findings – Amazon GuardDuty User Guide', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings-severity.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'sec12',
      front: 'What is the Principle of Least Privilege?',
      back: 'Grant only minimum permissions needed\n\nBenefits:\n• Reduces security risk\n• Limits blast radius\n• Easier compliance\n\nImplement via:\n• Specific IAM policies\n• Regular access reviews\n• Just-in-time access',
      hint: 'Only what you need, nothing more',
      tags: ['security', 'best-practices', 'least-privilege'],
      difficulty: 'beginner',
      sources: [
        { title: 'SEC03-BP02 Grant least privilege access – Security Pillar (AWS Well-Architected Framework)', url: 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_least_privileges.html', checked: '2026-11-25' },
        { title: 'Security best practices in IAM – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', checked: '2026-11-25' }
      ]
    }
  ]
};
