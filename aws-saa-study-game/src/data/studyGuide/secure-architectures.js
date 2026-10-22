// Domain 1: Design Secure Architectures (30% of exam)
// SAA-C03 Study Guide

export const secureArchitecturesGuide = {
  id: 'secure-architectures',
  name: 'Design Secure Architectures',
  icon: '🛡️',
  color: '#f85149',
  weight: '30%',
  description: 'The largest domain on the exam: controlling who can access what, protecting workloads at the network and application layers, and choosing the right encryption, key management, and data protection controls.',
  sections: [
    {
      id: 'secs1',
      title: 'IAM Fundamentals and Policy Evaluation',
      content: [
        { type: 'paragraph', text: 'AWS Identity and Access Management (IAM) decides whether every API request is allowed. The exam expects you to pick the option that uses temporary credentials, grants least privilege, and needs the least ongoing maintenance. Long-term access keys are almost never the right answer.' },
        { type: 'keyTerm', term: 'IAM Role', definition: 'An identity with permissions but no long-term credentials. Users, applications, and AWS services assume a role and receive temporary credentials from AWS STS. EC2 instances get a role through an instance profile; Lambda functions and ECS tasks get one through their execution or task role.' },
        { type: 'keyTerm', term: 'Least Privilege', definition: 'Grant only the actions and resources a principal needs. Start narrow, use IAM Access Analyzer to generate policies from actual activity and to find unused access, and remove what is not used.' },
        { type: 'comparison', title: 'Identity-based vs Resource-based Policies', items: [
          { label: 'Identity-based policy', description: 'Attached to a user, group, or role. Defines what that principal can do. Has no Principal element. Managed (reusable) or inline (one-to-one).' },
          { label: 'Resource-based policy', description: 'Attached to a resource such as an S3 bucket, KMS key, SQS queue, Lambda function, or a role trust policy. Names which principals can access it, including other accounts and AWS services.' }
        ]},
        { type: 'numberedList', title: 'How IAM evaluates a request:', items: [
          'Every request starts as an implicit deny.',
          'An explicit Deny in any applicable policy ends evaluation: the request is denied.',
          'Organization guardrails (SCPs and RCPs), permissions boundaries, and session policies must all allow the action if they apply.',
          'An identity-based or resource-based policy must explicitly allow the action.',
          'For cross-account requests, both the calling account (identity policy) and the resource account (resource policy) must allow it.'
        ]},
        { type: 'keyTerm', term: 'Permissions Boundary', definition: 'A managed policy attached to a user or role that sets the maximum permissions it can have. Effective permissions are the intersection of the boundary and the identity policies. Used to delegate role creation safely by requiring a boundary (condition key iam:PermissionsBoundary) on any role a developer creates.' },
        { type: 'keyTerm', term: 'Attribute-based Access Control (ABAC)', definition: 'Permissions based on tags, for example allowing actions only when aws:ResourceTag/project equals aws:PrincipalTag/project. One policy scales to many projects without edits, unlike role-based policies that list each resource.' },
        { type: 'bulletList', title: 'Root user and MFA best practices:', items: [
          'Enable MFA on the root user and never create root access keys.',
          'Use the root user only for the few tasks that require it, such as changing account settings or closing the account.',
          'In AWS Organizations, centralized root access management lets you remove root credentials from member accounts and perform root-only tasks from the management account.',
          'Require MFA for sensitive actions with a Deny statement using aws:MultiFactorAuthPresent.',
          'Prefer IAM Identity Center users or federated roles over IAM users for people.'
        ]},
        { type: 'examTip', text: 'If an answer stores access keys anywhere (user data, code, environment variables, even Secrets Manager) and another answer uses an IAM role, pick the role. Remember that an explicit deny always wins and that cross-account access needs an allow on both sides.' }
      ]
    },
    {
      id: 'secs2',
      title: 'Multi-account Governance and Federation',
      content: [
        { type: 'paragraph', text: 'Most exam scenarios involve many accounts. AWS Organizations groups accounts into organizational units (OUs) and applies guardrails, IAM Identity Center gives workforce users single sign-on, and STS role assumption connects accounts securely.' },
        { type: 'awsService', name: 'AWS Organizations', description: 'Central management of multiple accounts with consolidated billing, OUs, and policies. Service control policies (SCPs) cap what principals in member accounts can do; resource control policies (RCPs) cap what can be done to resources such as S3 buckets and KMS keys, including by principals outside the organization.' },
        { type: 'awsService', name: 'AWS Control Tower', description: 'Sets up and governs a multi-account landing zone on top of Organizations with the least effort: creates log archive and audit accounts, applies preventive controls (SCPs/RCPs), detective controls (AWS Config rules), and proactive controls (CloudFormation hooks), and vends new accounts through Account Factory.' },
        { type: 'awsService', name: 'IAM Identity Center', description: 'Workforce single sign-on to all accounts in an organization and to business applications. Connects to its own directory, Active Directory, or an external SAML 2.0 IdP (with SCIM provisioning), and uses permission sets that it deploys as roles into each assigned account.' },
        { type: 'table', headers: ['Requirement', 'Best Choice', 'Why'], rows: [
          ['Employees need SSO to many AWS accounts', 'IAM Identity Center', 'Central permission sets, integrates with Organizations and external IdPs'],
          ['Customers sign in to a web or mobile app', 'Amazon Cognito', 'User pools for app users, identity pools for AWS credentials'],
          ['Workload in Account A accesses Account B', 'Cross-account IAM role + sts:AssumeRole', 'Temporary credentials, revocable by Account B'],
          ['Third-party vendor accesses your account', 'IAM role with an external ID condition', 'Prevents the confused deputy problem'],
          ['Prevent any member account from leaving the org or using a Region', 'SCP', 'Applies to every principal in member accounts'],
          ['Workloads outside AWS need AWS credentials', 'IAM Roles Anywhere', 'X.509 certificates exchanged for temporary credentials']
        ]},
        { type: 'comparison', title: 'SCP vs Permissions Boundary vs IAM Policy', items: [
          { label: 'SCP', description: 'Organization-level ceiling for every principal in an account or OU, including the member account root user. Never grants permissions and does not affect the management account or service-linked roles.' },
          { label: 'Permissions boundary', description: 'Ceiling for a single IAM user or role. Commonly used for delegated administration so developers cannot escalate privileges.' },
          { label: 'IAM identity policy', description: 'The only one of the three that actually grants permissions. Effective access is the allow that survives every applicable ceiling.' }
        ]},
        { type: 'keyTerm', term: 'SAML 2.0 and OIDC Federation', definition: 'Federation lets users authenticate with an external identity provider and receive temporary AWS credentials instead of IAM users. SAML is typical for corporate directories; OIDC is used for web identity, for example GitHub Actions or EKS pods assuming roles.' },
        { type: 'examTip', text: 'An SCP that allows s3:* does not let anyone use S3 by itself; users still need IAM permissions. For "multi-account environment with guardrails and least effort" choose Control Tower, and for "workforce SSO across accounts" choose IAM Identity Center, not Cognito.' }
      ]
    },
    {
      id: 'secs3',
      title: 'Network Security in the VPC',
      content: [
        { type: 'paragraph', text: 'Network controls are layered: route tables decide where traffic can go, network ACLs filter at the subnet edge, and security groups filter at each network interface. Private subnets, NAT, and VPC endpoints keep workloads off the public internet.' },
        { type: 'table', headers: ['Feature', 'Security Group', 'Network ACL'], rows: [
          ['Scope', 'Elastic network interface (instance level)', 'Subnet'],
          ['State', 'Stateful: return traffic allowed automatically', 'Stateless: return traffic needs its own rule (ephemeral ports)'],
          ['Rule types', 'Allow only', 'Allow and deny'],
          ['Evaluation', 'All rules evaluated together', 'Lowest rule number first, first match wins'],
          ['Typical use', 'Least-privilege access between tiers, referencing other security groups', 'Blocking specific IP ranges for a whole subnet']
        ]},
        { type: 'keyTerm', term: 'Public vs Private Subnet', definition: 'A public subnet has a route to an internet gateway. A private subnet does not; its instances reach the internet outbound through a NAT gateway in a public subnet, and cannot be reached from the internet.' },
        { type: 'keyTerm', term: 'NAT Gateway', definition: 'Managed outbound-only IPv4 internet access for private subnets. A zonal NAT gateway lives in one Availability Zone, so for high availability deploy one per AZ and route each private subnet to the NAT gateway in its own AZ. For IPv6 outbound-only traffic, use an egress-only internet gateway.' },
        { type: 'comparison', title: 'Gateway Endpoint vs Interface Endpoint', items: [
          { label: 'Gateway endpoint', description: 'Only for Amazon S3 and DynamoDB. Added as a target in route tables. No hourly or data charge. Not usable from on premises or peered VPCs. Control access with endpoint policies and bucket policy conditions such as aws:SourceVpce.' },
          { label: 'Interface endpoint (PrivateLink)', description: 'For most AWS services, SaaS partners, and your own endpoint services. Creates ENIs with private IPs, protected by security groups. Private DNS lets default SDK hostnames resolve privately. Hourly plus per-GB charges; reachable over VPN and Direct Connect.' }
        ]},
        { type: 'awsService', name: 'AWS PrivateLink Endpoint Services', description: 'Expose your own service, fronted by a Network Load Balancer, to other VPCs and accounts. Consumers create interface endpoints, so only that service is reachable and overlapping CIDR ranges do not matter, unlike VPC peering or Transit Gateway.' },
        { type: 'awsService', name: 'AWS Network Firewall', description: 'Managed, stateful VPC firewall with Suricata-compatible IPS rules, domain allow and deny lists, and TLS inspection. Commonly deployed in a central inspection VPC behind Transit Gateway. Manage rules across accounts with AWS Firewall Manager.' },
        { type: 'examTip', text: 'Security groups cannot deny, so "block this IP range" means a network ACL (or a WAF IP set for HTTP traffic). "Private access to S3 at the lowest cost" means a gateway endpoint, and "expose a service to many VPCs with overlapping CIDRs" means PrivateLink.' }
      ]
    },
    {
      id: 'secs4',
      title: 'Protecting Applications and Detecting Threats',
      content: [
        { type: 'paragraph', text: 'Above the network layer, the exam tests edge protection (WAF and Shield), application authentication (Cognito and API Gateway authorizers), secret storage, and the managed detection services. Each detection service has a narrow job; match the keyword in the question to the service.' },
        { type: 'awsService', name: 'AWS WAF', description: 'Layer 7 web application firewall for CloudFront, ALB, API Gateway, AppSync, and Cognito user pools. Web ACLs use AWS managed rule groups (SQL injection, XSS, known bad inputs, bot control), IP sets, geo match, and rate-based rules.' },
        { type: 'comparison', title: 'Shield Standard vs Shield Advanced', items: [
          { label: 'Shield Standard', description: 'Free and automatic for all customers. Protects against common layer 3 and 4 DDoS attacks such as SYN floods and UDP reflection, especially on CloudFront and Route 53.' },
          { label: 'Shield Advanced', description: 'Paid subscription for EC2, ELB, CloudFront, Global Accelerator, and Route 53. Adds 24/7 Shield Response Team access, DDoS cost protection, advanced attack visibility, and AWS WAF at no extra charge for protected resources.' }
        ]},
        { type: 'table', headers: ['Service', 'What It Does', 'Exam Keyword'], rows: [
          ['Amazon GuardDuty', 'Threat detection from CloudTrail, VPC Flow Logs, DNS logs, plus optional S3, EKS, RDS, Lambda, malware, and runtime protection', 'Compromised instance, crypto mining, unusual API calls'],
          ['Amazon Inspector', 'Continuous vulnerability scanning of EC2, ECR container images, and Lambda functions', 'CVEs, software vulnerabilities, network exposure'],
          ['Amazon Macie', 'Discovers sensitive data such as PII in S3 and reports bucket security posture', 'PII in S3, sensitive data discovery'],
          ['AWS Security Hub', 'Aggregates findings across accounts and runs automated best-practice checks (AWS Foundational Security Best Practices, CIS)', 'Single pane of glass, security posture'],
          ['Amazon Detective', 'Builds behavior graphs to investigate the root cause of findings', 'Investigate, root cause analysis']
        ]},
        { type: 'comparison', title: 'Cognito User Pools vs Identity Pools', items: [
          { label: 'User pool', description: 'User directory for app sign-up and sign-in, MFA, and social or SAML federation. Issues JWTs that API Gateway and ALB can validate.' },
          { label: 'Identity pool', description: 'Exchanges a user pool token or social login for temporary IAM credentials so the app can call AWS services such as S3 directly, scoped by IAM roles and policy variables.' }
        ]},
        { type: 'bulletList', title: 'API Gateway authorization options:', items: [
          'IAM authorization (SigV4): callers are AWS principals, such as other services or cross-account roles; combine with resource policies.',
          'Cognito user pool authorizer: validates user pool tokens with no custom code (REST APIs); HTTP APIs use JWT authorizers.',
          'Lambda authorizer: custom logic for third-party tokens or request parameters.',
          'API keys and usage plans are for throttling and quotas, not for authentication.'
        ]},
        { type: 'comparison', title: 'Secrets Manager vs Parameter Store', items: [
          { label: 'AWS Secrets Manager', description: 'Purpose-built for secrets: automatic rotation (managed for RDS, Aurora, Redshift, and DocumentDB), cross-Region replication, fine-grained resource policies. Charged per secret per month plus API calls.' },
          { label: 'Systems Manager Parameter Store', description: 'Hierarchical configuration and SecureString parameters encrypted with KMS. Standard parameters have no extra charge. No built-in rotation, so use it for configuration and secrets that do not need rotation.' }
        ]},
        { type: 'examTip', text: 'Read for the decisive keyword: "rotate automatically" is Secrets Manager, "SQL injection" or "rate limit" is WAF, "DDoS response team" or "cost protection" is Shield Advanced, "PII in S3" is Macie, "CVE" is Inspector, and "aggregate findings" is Security Hub.' }
      ]
    },
    {
      id: 'secs5',
      title: 'Encryption and Key Management',
      content: [
        { type: 'paragraph', text: 'AWS Key Management Service (KMS) is the default answer for encryption keys. Know the key types, how key policies control access, how envelope encryption works, and when a requirement forces CloudHSM instead.' },
        { type: 'table', headers: ['Key Type', 'Who Controls It', 'Key Policy Editable', 'Cross-account Use', 'Rotation'], rows: [
          ['AWS owned key', 'AWS, used internally by services', 'No (not visible)', 'Not applicable', 'Managed by AWS'],
          ['AWS managed key (aws/service)', 'AWS on your behalf', 'No', 'No', 'Automatic, yearly'],
          ['Customer managed key', 'You', 'Yes', 'Yes, via key policy plus IAM', 'Optional automatic, configurable period, or on demand']
        ]},
        { type: 'keyTerm', term: 'Key Policy', definition: 'The resource-based policy on every KMS key and the primary way to control access to it. IAM policies only work for a key if its key policy allows the account to delegate access through IAM. Grants provide temporary, scoped permissions, often used by AWS services.' },
        { type: 'keyTerm', term: 'Envelope Encryption', definition: 'KMS GenerateDataKey returns a plaintext data key and the same key encrypted under a KMS key. Data is encrypted locally with the plaintext key, which is then discarded; the encrypted data key is stored with the data. The KMS Encrypt API only accepts small payloads, so large data always uses envelope encryption.' },
        { type: 'keyTerm', term: 'Multi-Region Keys', definition: 'A set of interoperable KMS keys in different Regions with the same key ID and key material. Data encrypted in one Region can be decrypted in another without a cross-Region call, which suits disaster recovery and global applications. Each replica has its own key policy.' },
        { type: 'awsService', name: 'AWS CloudHSM', description: 'Dedicated, single-tenant, FIPS-validated hardware security modules in your VPC. You manage the users and keys and AWS has no access to key material. Supports PKCS#11, JCE, and Microsoft CNG for workloads such as Oracle TDE, SSL/TLS offload, and certificate authorities. Can back a KMS custom key store.' },
        { type: 'comparison', title: 'Encryption at Rest vs in Transit', items: [
          { label: 'At rest', description: 'Turn on KMS-integrated encryption for EBS (including encryption by default), RDS and Aurora, DynamoDB, S3, EFS, and backups. RDS encryption must be chosen at creation; to encrypt an existing instance, copy a snapshot with encryption and restore it.' },
          { label: 'In transit', description: 'Use TLS everywhere: ACM certificates on ALB, CloudFront, and API Gateway, enforce HTTPS with aws:SecureTransport in bucket policies, and require SSL connections to databases.' }
        ]},
        { type: 'awsService', name: 'AWS Certificate Manager (ACM)', description: 'Provisions free public TLS certificates for integrated services and renews them automatically with DNS validation. Certificates are Regional; CloudFront requires certificates in us-east-1. Imported third-party certificates are not renewed by ACM.' },
        { type: 'examTip', text: 'Choose a customer managed key whenever the question needs control of the key policy, cross-account use, disabling the key, or custom rotation. Choose CloudHSM only when the question demands single-tenant HSMs, exclusive customer control, or interfaces like PKCS#11.' }
      ]
    },
    {
      id: 'secs6',
      title: 'S3 Data Protection, Backups, and Compliance',
      content: [
        { type: 'paragraph', text: 'S3 security combines access controls (policies, Block Public Access, Object Ownership), encryption, and immutability. Compliance scenarios add AWS Backup, CloudTrail, and AWS Config for retention, audit, and continuous evaluation.' },
        { type: 'bulletList', title: 'S3 access controls:', items: [
          'Bucket policies: resource-based JSON policies for cross-account access, enforcing HTTPS (aws:SecureTransport), restricting to a VPC endpoint (aws:SourceVpce), or requiring an organization (aws:PrincipalOrgID).',
          'S3 Block Public Access: account-level or bucket-level setting that overrides any public ACL or policy; enabled by default on new buckets.',
          'Object Ownership set to bucket owner enforced: disables ACLs so the bucket owner owns every object; the default for new buckets.',
          'Presigned URLs: temporary access to a private object for a limited time, signed by a principal that has permission.',
          'S3 Access Points: separate access policies per application or team on a shared bucket.'
        ]},
        { type: 'table', headers: ['Encryption Option', 'Key Managed By', 'Choose It When'], rows: [
          ['SSE-S3', 'Amazon S3', 'Default for all new objects; no key management or per-use audit needed'],
          ['SSE-KMS', 'AWS KMS (AWS managed or customer managed key)', 'Need key policy control, CloudTrail audit of key use, or separation of duties; add S3 Bucket Keys to reduce KMS cost'],
          ['DSSE-KMS', 'AWS KMS', 'Compliance requires two independent layers of server-side encryption'],
          ['SSE-C', 'Customer, supplied with every request over HTTPS', 'Keys must be managed outside AWS while S3 performs the encryption'],
          ['Client-side encryption', 'Customer or KMS through the encryption SDK', 'Data must be encrypted before it leaves the application']
        ]},
        { type: 'comparison', title: 'S3 Object Lock Modes', items: [
          { label: 'Governance mode', description: 'Protects object versions from deletion, but users with s3:BypassGovernanceRetention can override the lock or shorten retention. Useful for testing retention settings or internal policies.' },
          { label: 'Compliance mode', description: 'No user, including the root user, can delete a locked version or shorten its retention until it expires. Required for strict WORM regulations. Legal holds add protection with no expiry date.' }
        ]},
        { type: 'awsService', name: 'AWS Backup', description: 'Central backup policies across services and accounts with backup plans, cross-Region and cross-account copies. Backup Vault Lock in compliance mode makes recovery points immutable after a grace period, protecting against ransomware and rogue administrators.' },
        { type: 'awsService', name: 'AWS CloudTrail', description: 'Records API activity (who did what, when, from where). Use an organization trail to log every account to a central S3 bucket in a log archive account, enable log file integrity validation, and protect logs with Object Lock and restrictive bucket policies.' },
        { type: 'awsService', name: 'AWS Config', description: 'Records resource configuration history and evaluates resources against managed or custom rules, such as encrypted volumes or public buckets. Supports automatic remediation through Systems Manager Automation and organization-wide conformance packs and aggregators.' },
        { type: 'examTip', text: 'CloudTrail answers "who made this API call", Config answers "what did this resource look like and is it compliant". For immutable records choose Object Lock compliance mode, and for immutable backups choose Backup Vault Lock in compliance mode; governance mode can always be bypassed by privileged users.' }
      ]
    }
  ]
};
