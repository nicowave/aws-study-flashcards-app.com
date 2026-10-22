// Module 1: Security & Identity
// AWS Solutions Architect Associate (SAA-C03)

export const module1 = {
  id: 'module1',
  name: 'Security & Identity',
  description: 'IAM, KMS, network security, and data protection',
  icon: '🛡️',
  color: '#f85149',
  gradient: 'linear-gradient(135deg, #f85149 0%, #f85149 100%)',
  source: 'SAA-C03 Exam Guide',
  cards: [
    {
      id: 'saa-sec-c1',
      front: 'Identity-based vs resource-based policies: what is the difference?',
      back: '• Identity-based: attached to a user, group, or role; says what that principal can do. No Principal element.\n• Resource-based: attached to a resource (S3 bucket policy, KMS key policy, SQS queue policy, role trust policy); names the Principal who may access it.\n\nCross-account rule: BOTH the resource policy in the owning account and the identity policy in the calling account must allow the action (when the caller uses its own role).',
      hint: 'Who vs what is attached',
      tags: ['iam', 'policies', 'cross-account'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-sec-c2',
      front: 'How does IAM evaluate a request?',
      back: '1. Start with implicit deny.\n2. Any explicit Deny in any applicable policy wins, always.\n3. Every guardrail that applies (SCP, RCP, permissions boundary, session policy) must allow.\n4. Then an identity-based or resource-based policy must explicitly allow.\n\nRule of thumb: explicit deny > explicit allow > implicit deny.',
      hint: 'Deny always wins',
      tags: ['iam', 'policies'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c3',
      front: 'Exam trap: what can a service control policy (SCP) NOT do?',
      back: '• It never grants permissions; it only sets the maximum allowed. Users still need IAM allows.\n• It does not affect the management account.\n• It does not affect service-linked roles.\n• It does apply to every user and role in member accounts, including the member account root user.\n\nUse SCPs for org-wide guardrails such as "deny leaving the organization" or "deny unapproved Regions".',
      hint: 'A ceiling, not a grant',
      tags: ['organizations', 'scp', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c4',
      front: 'Permissions boundary vs SCP: when to use which?',
      back: '• Permissions boundary: a managed policy set on one IAM user or role that caps its maximum permissions. Classic use: let developers create roles safely by requiring a boundary on every role they create.\n• SCP: caps permissions for every principal in an account or OU across AWS Organizations.\n\nNeither grants access on its own; effective permissions are the intersection with identity policies.',
      hint: 'One principal vs whole account',
      tags: ['iam', 'permissions-boundary', 'scp'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c5',
      front: 'Cross-account access with STS: how does it work, and what is an external ID for?',
      back: '• Account B creates a role whose trust policy names Account A (or a role in it).\n• Account A grants its principal sts:AssumeRole on that role ARN.\n• The caller receives temporary credentials.\n\nExternal ID: a unique value in the trust policy condition (sts:ExternalId) for third-party vendors. It prevents the confused deputy problem, where another customer of the vendor tricks it into accessing your account.',
      hint: 'Trust policy + AssumeRole',
      tags: ['sts', 'iam', 'cross-account'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c6',
      front: 'Exam trap: Cognito user pool vs identity pool',
      back: '• User pool = authentication. A user directory with sign-up, sign-in, MFA, and social or SAML federation. Issues JWTs. Use with an API Gateway Cognito authorizer or an ALB.\n• Identity pool = authorization to AWS. Exchanges tokens (from a user pool or a social IdP) for temporary IAM credentials via STS, so apps can call S3 or DynamoDB directly.\n\nNeed AWS credentials in a mobile app? You need an identity pool.',
      hint: 'Who you are vs what AWS lets you touch',
      tags: ['cognito', 'identity', 'exam-trap'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c7',
      front: 'Security groups vs network ACLs',
      back: '• Security group: instance or ENI level, stateful (return traffic allowed automatically), allow rules only, all rules evaluated. Can reference other security groups.\n• Network ACL: subnet level, stateless (allow return traffic on ephemeral ports explicitly), allow AND deny rules, evaluated in rule-number order, first match wins.\n\nBlock a specific IP range? Use a network ACL deny rule.',
      hint: 'Stateful instance vs stateless subnet',
      tags: ['vpc', 'network-security'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-sec-c8',
      front: 'Gateway VPC endpoint vs interface VPC endpoint',
      back: '• Gateway endpoint: S3 and DynamoDB only. A route table target. No charge. Not reachable from on premises or peered VPCs.\n• Interface endpoint (PrivateLink): most AWS services plus your own endpoint services. ENIs with private IPs in your subnets, secured by security groups. Hourly and per-GB charges. Reachable over VPN and Direct Connect.\n\nPrivate S3 access at the lowest cost: gateway endpoint.',
      hint: 'Route table vs ENI',
      tags: ['vpc', 'endpoints', 'privatelink'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c9',
      front: 'WAF vs Shield Standard vs Shield Advanced vs Network Firewall',
      back: '• AWS WAF: layer 7 rules (SQLi, XSS, rate limits, geo, IP sets) on CloudFront, ALB, API Gateway, AppSync, Cognito.\n• Shield Standard: free, automatic layer 3/4 DDoS protection.\n• Shield Advanced: paid; Shield Response Team, DDoS cost protection, advanced metrics.\n• Network Firewall: stateful VPC firewall with IPS and domain filtering for traffic in and out of VPCs.',
      hint: 'App layer, DDoS, or VPC traffic?',
      tags: ['waf', 'shield', 'network-firewall'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c10',
      front: 'GuardDuty vs Inspector vs Macie vs Security Hub vs Detective',
      back: '• GuardDuty: threat detection from CloudTrail, VPC Flow Logs, and DNS logs (compromised instances, odd API calls).\n• Inspector: vulnerability scanning of EC2, ECR images, and Lambda (CVEs).\n• Macie: finds sensitive data (PII) in S3.\n• Security Hub: aggregates findings and runs best-practice checks across accounts.\n• Detective: investigates the root cause of findings.',
      hint: 'Threats, CVEs, PII, dashboard, investigation',
      tags: ['guardduty', 'inspector', 'macie', 'security-hub'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-sec-c11',
      front: 'Secrets Manager vs Systems Manager Parameter Store',
      back: '• Secrets Manager: built-in automatic rotation (managed rotation for RDS, Aurora, Redshift, DocumentDB; Lambda for others), cross-Region secret replication, per-secret monthly charge.\n• Parameter Store: hierarchical config values and SecureString parameters encrypted with KMS; standard tier has no extra charge; no native rotation.\n\nKeyword "rotate automatically" means Secrets Manager.',
      hint: 'Rotation is the tiebreaker',
      tags: ['secrets-manager', 'parameter-store'],
      difficulty: 'beginner'
    },
    {
      id: 'saa-sec-c12',
      front: 'KMS key types: AWS owned vs AWS managed vs customer managed',
      back: '• AWS owned: used by services internally; not visible in your account, no control.\n• AWS managed (aws/s3, aws/ebs): visible, logged in CloudTrail, rotated yearly by AWS; you cannot edit the key policy, disable it, or use it cross-account.\n• Customer managed: you control the key policy, grants, rotation, disabling, and deletion (7-30 day waiting period). Required for cross-account use.',
      hint: 'Control rises from owned to customer',
      tags: ['kms', 'encryption'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c13',
      front: 'S3 server-side encryption: SSE-S3 vs SSE-KMS vs DSSE-KMS vs SSE-C',
      back: '• SSE-S3: S3 manages keys; default for all new objects.\n• SSE-KMS: KMS key with key policy control and CloudTrail audit; enable S3 Bucket Keys to cut KMS request costs.\n• DSSE-KMS: two layers of encryption with KMS keys, for multi-layer compliance mandates.\n• SSE-C: you send your own key with every request over HTTPS; AWS does not store it.',
      hint: 'Who holds the key, and how many layers',
      tags: ['s3', 'encryption', 'kms'],
      difficulty: 'intermediate'
    },
    {
      id: 'saa-sec-c14',
      front: 'Exam trap: Object Lock governance vs compliance mode (and Backup Vault Lock)',
      back: '• Governance mode: users with s3:BypassGovernanceRetention can delete or shorten retention. Good for testing or internal policy.\n• Compliance mode: nobody, not even the root user, can delete the object version or shorten retention until it expires.\n• Legal hold: no expiry, removed explicitly.\n\nAWS Backup Vault Lock has the same two modes for backup recovery points (ransomware protection).',
      hint: 'Can an admin bypass it?',
      tags: ['s3', 'object-lock', 'backup', 'exam-trap'],
      difficulty: 'advanced'
    },
    {
      id: 'saa-sec-c15',
      front: 'Exam trap: which Region must an ACM certificate be in for CloudFront?',
      back: 'US East (N. Virginia), us-east-1, regardless of where the origin runs.\n\nOther ACM rules:\n• Regional services (ALB, API Gateway Regional) need the certificate in their own Region.\n• ACM-issued public certificates renew automatically when DNS validation stays in place.\n• Imported certificates are NOT renewed by ACM; you must reimport them before they expire.',
      hint: 'N. Virginia',
      tags: ['acm', 'cloudfront', 'encryption-in-transit', 'exam-trap'],
      difficulty: 'intermediate'
    }
  ]
};
