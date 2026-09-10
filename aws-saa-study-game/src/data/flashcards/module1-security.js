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
      id: 'sec1',
      front: 'Security groups vs Network ACLs?',
      back: 'Two VPC firewall layers\n\n• SG: instance level, STATEFUL, allow rules only\n• NACL: subnet level, STATELESS, allow + deny\n• SG evaluates all rules; NACL by rule number\n• Return traffic: automatic for SG, explicit for NACL',
      hint: 'Think: stateful vs stateless',
      tags: ['vpc', 'security-groups'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec2',
      front: 'Identity-based vs resource-based IAM policies?',
      back: 'Two places to attach permissions\n\n• Identity-based: on users/groups/roles — what THEY can do\n• Resource-based: on the resource (S3 bucket, SQS queue) — who can touch IT\n• Resource-based names a Principal; identity-based never does\n• Cross-account: resource policy can grant directly, no role assumption needed',
      hint: 'Who holds the policy?',
      tags: ['iam', 'policies'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec3',
      front: 'IAM policy evaluation: what always wins?',
      back: 'Explicit DENY beats everything\n\n• Default: implicit deny\n• Any allow grants access...\n• ...unless ANY applicable policy has an explicit deny\n• No precedence by attachment type or recency',
      hint: 'One word: deny',
      tags: ['iam', 'policies'],
      difficulty: 'beginner'
    },
    {
      id: 'sec4',
      front: 'Cross-account access for a third-party vendor: the pattern?',
      back: 'Cross-account role + external ID\n\n• Create a role the vendor account can assume\n• Trust policy requires a unique sts:ExternalId\n• Prevents the confused deputy problem\n• Never share IAM users or access keys',
      hint: 'Confused deputy defense',
      tags: ['iam', 'cross-account'],
      difficulty: 'advanced'
    },
    {
      id: 'sec5',
      front: 'What does an IAM permissions boundary do?',
      back: 'Caps maximum permissions\n\n• Effective permissions = boundary ∩ identity policies\n• Attached admin policy? Still capped by boundary\n• Use: delegate role creation to dev teams safely\n• Does not GRANT anything by itself',
      hint: 'A ceiling, not a grant',
      tags: ['iam', 'governance'],
      difficulty: 'advanced'
    },
    {
      id: 'sec6',
      front: 'What can SCPs do — and not do?',
      back: 'Organization-wide guardrails\n\n• Limit the MAX permissions in member accounts\n• Apply to everyone, including account root\n• Never GRANT permissions — only restrict\n• Do not affect the management account',
      hint: 'Guardrails, not grants',
      tags: ['organizations', 'scp'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec7',
      front: 'Cognito user pools vs identity pools?',
      back: 'Authentication vs AWS credentials\n\n• User pool: sign-up/sign-in, issues JWTs (WHO you are)\n• Identity pool: exchanges tokens for temporary AWS credentials\n• User pool → your app\'s API auth\n• Identity pool → direct access to S3/DynamoDB from the client',
      hint: 'JWTs vs AWS creds',
      tags: ['cognito', 'auth'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec8',
      front: 'KMS: customer managed vs AWS managed keys?',
      back: 'Control vs convenience\n\n• Customer managed: your key policy, grants, rotation control, cross-account use\n• AWS managed (aws/service): AWS controls policy, no cross-account\n• Auto-rotation: yearly, opt-in for customer managed\n• CloudHSM: dedicated single-tenant hardware when compliance demands it',
      hint: 'Who writes the key policy?',
      tags: ['kms', 'encryption'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec9',
      front: 'Secrets Manager vs SSM Parameter Store?',
      back: 'Rotation vs price\n\n• Secrets Manager: built-in rotation (native RDS), per-secret cost\n• Parameter Store: standard tier free, no native rotation\n• Both: encrypted with KMS, IAM-controlled\n• Exam tell: "automatic rotation" → Secrets Manager',
      hint: 'Rotation is the tell',
      tags: ['secrets', 'ssm'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec10',
      front: 'S3 server-side encryption options?',
      back: 'Three SSE flavors\n\n• SSE-S3: AWS-owned keys, free, default\n• SSE-KMS: KMS keys — audit trail, key control, request quotas\n• SSE-C: you supply the key per request; AWS stores nothing\n• Enforce via bucket policy denying unencrypted PUTs',
      hint: 'Who holds the key?',
      tags: ['s3', 'encryption'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec11',
      front: 'S3 Object Lock: governance vs compliance mode?',
      back: 'WORM protection levels\n\n• Governance: privileged users CAN override/delete\n• Compliance: NOBODY can delete until retention expires — not even root\n• Requires versioning\n• Use compliance mode for regulatory retention',
      hint: 'Can root delete it?',
      tags: ['s3', 'compliance'],
      difficulty: 'advanced'
    },
    {
      id: 'sec12',
      front: 'Presigned URLs vs Block Public Access?',
      back: 'Share privately, block publicly\n\n• Presigned URL: temporary access with YOUR permissions, time-limited\n• Block Public Access: account/bucket switch overriding any public policy/ACL\n• Combine: buckets locked down + presigned for sharing\n• Presigned works even with all public access blocked',
      hint: 'Temporary key vs master switch',
      tags: ['s3', 'access-control'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec13',
      front: 'WAF vs Shield vs Network Firewall?',
      back: 'Three protection layers\n\n• WAF: layer 7 rules (SQLi, XSS, rate limits) on ALB/CloudFront/API GW\n• Shield Standard: free automatic L3/L4 DDoS; Advanced adds response team + cost protection\n• Network Firewall: managed stateful firewall for the whole VPC\n• They stack — not either/or',
      hint: 'Request rules vs DDoS vs VPC',
      tags: ['waf', 'ddos'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec14',
      front: 'GuardDuty vs Inspector vs Macie?',
      back: 'Detect vs scan vs classify\n\n• GuardDuty: THREAT detection from CloudTrail/VPC/DNS logs\n• Inspector: VULNERABILITY scanning of EC2/ECR/Lambda (CVEs)\n• Macie: SENSITIVE DATA discovery in S3 (PII)\n• Security Hub aggregates all findings in one place',
      hint: 'Threats, CVEs, PII',
      tags: ['security-services', 'detection'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec15',
      front: 'CloudTrail essentials for the exam?',
      back: 'The audit trail\n\n• Management events: control-plane API calls (default)\n• Data events: S3 object-level, Lambda invoke (opt-in, high volume)\n• Organization trail: all accounts to one S3 bucket\n• Log file validation: proves logs untampered',
      hint: 'Who did what, when',
      tags: ['cloudtrail', 'audit'],
      difficulty: 'intermediate'
    },
    {
      id: 'sec16',
      front: 'ACM certificate Region rule?',
      back: 'Where the cert must live\n\n• ALB/API Gateway: cert in the SAME Region\n• CloudFront: cert must be in us-east-1 — always\n• ACM public certs: free, auto-renewing\n• Cannot export ACM public cert private keys',
      hint: 'CloudFront = N. Virginia',
      tags: ['acm', 'tls'],
      difficulty: 'beginner'
    }
  ]
};
