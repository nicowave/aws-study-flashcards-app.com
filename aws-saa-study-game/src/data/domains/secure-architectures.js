// Domain 1: Design Secure Architectures (30% of exam)
// SAA-C03 Exam Content

export const secureArchitectures = {
  id: 'secure-architectures',
  name: 'Design Secure Architectures',
  icon: '🛡️',
  weight: '30%',
  color: '#f85149',
  description: 'Secure access to AWS resources, secure workloads and applications, and data security controls',
  questions: [
  {
    id: 'sa1',
    question: 'A company hires a third-party monitoring vendor that needs read-only access to CloudWatch metrics in the company\'s AWS account. The vendor operates its own AWS account and serves many customers. Which approach grants this access MOST securely?',
    options: ['Create an IAM user for the vendor and email them the access keys over an encrypted channel', 'Attach a resource-based policy to CloudWatch that allows the vendor\'s account root user full access', 'Create a cross-account IAM role with read-only permissions that the vendor assumes, requiring a unique external ID in the trust policy', 'Create an IAM group with read-only permissions and add the vendor\'s federated identities to it'],
    correctAnswer: 2,
    explanation: 'A cross-account role with an external ID condition in its trust policy lets the vendor assume temporary credentials while preventing the confused deputy problem, where another of the vendor\'s customers could trick the vendor into using its access to your account. IAM users with long-lived access keys are less secure because keys can leak and must be rotated manually, and IAM groups cannot contain identities from another account.'
  },
  {
    id: 'sa2',
    question: 'An application running on EC2 instances must read objects from an S3 bucket and write items to a DynamoDB table. What is the MOST secure way to provide these permissions?',
    options: ['Attach an IAM role to the instances through an instance profile granting only the required S3 and DynamoDB actions', 'Create an IAM user, generate access keys, and store them in a configuration file on each instance', 'Embed the account root user credentials in the application using environment variables encrypted at rest', 'Configure the S3 bucket and DynamoDB table policies to allow anonymous access from the instances\' public IP addresses'],
    correctAnswer: 0,
    explanation: 'An IAM role attached via an instance profile delivers automatically rotated temporary credentials through the instance metadata service, so no long-term secrets ever touch the instance. Access keys in configuration files can be leaked and require manual rotation, root credentials should never be used for workloads, and IP-based anonymous access exposes the resources to anyone sharing or spoofing those addresses.'
  },
  {
    id: 'sa3',
    question: 'A developer belongs to an IAM group whose policy allows s3:* on all buckets. A second policy attached directly to the developer\'s IAM user contains an explicit deny for s3:DeleteObject on a specific bucket. The developer attempts to delete an object in that bucket. What is the result, and why?',
    options: ['The delete succeeds because allow statements from group policies take precedence over user policies', 'The delete fails because an explicit deny in any applicable policy overrides every allow', 'The delete succeeds because the most recently attached policy wins during evaluation', 'The delete fails because directly attached policies always override group policies regardless of effect'],
    correctAnswer: 1,
    explanation: 'IAM policy evaluation combines all identity-based policies that apply to the principal, and an explicit deny in any of them always overrides any allow. There is no precedence based on how a policy is attached or when it was attached; the evaluation logic is deny by default, then allow if permitted, with explicit deny trumping everything.'
  },
  {
    id: 'sa4',
    question: 'A platform team wants to let development teams create their own IAM roles for applications, but must ensure those roles can never exceed a defined set of maximum permissions, even if a developer attaches an administrator policy. Which feature meets this requirement?',
    options: ['Attach an AWS managed AdministratorAccess policy with an inline deny statement to each developer', 'Require developers to submit all role creation requests through AWS Config remediation actions', 'Enable MFA on all developer accounts so elevated permissions require a second factor', 'Require a permissions boundary on all developer-created roles that defines the maximum allowed permissions'],
    correctAnswer: 3,
    explanation: 'A permissions boundary is an advanced IAM feature that sets the maximum permissions an identity-based policy can grant; the effective permissions are the intersection of the boundary and the attached policies, so an attached administrator policy is capped by the boundary. MFA adds authentication strength but does not limit permissions, and AWS Config detects noncompliance after the fact rather than preventing over-permissive roles.'
  },
  {
    id: 'sa5',
    question: 'A company with 40 AWS accounts in AWS Organizations wants employees to sign in once and access assigned accounts with role-based permissions, with the LEAST operational overhead. Which solution should a solutions architect recommend?',
    options: ['Create IAM users in every account and synchronize passwords with a scheduled Lambda function', 'Enable IAM Identity Center, connect it to the identity source, and assign permission sets to users across accounts', 'Deploy SAML identity provider configurations and custom cross-account roles in each account individually', 'Share a small set of IAM users across teams and rotate their credentials with Secrets Manager'],
    correctAnswer: 1,
    explanation: 'IAM Identity Center (successor to AWS SSO) provides centralized workforce single sign-on across all accounts in an organization, using permission sets that automatically provision roles in member accounts. Duplicating IAM users per account or hand-configuring SAML federation in every account works but carries far more operational overhead, and shared IAM users violate the principle of individual accountability.'
  },
  {
    id: 'sa6',
    question: 'An enterprise runs Active Directory Federation Services (AD FS) on premises and wants employees to access the AWS Management Console using their existing corporate credentials without creating IAM users. Which approach accomplishes this?',
    options: ['Migrate all Active Directory accounts to Amazon Cognito user pools and enable hosted UI sign-in', 'Create one IAM user per employee and enforce the same password policy as Active Directory', 'Configure SAML 2.0 federation between AD FS and IAM so employees assume roles mapped from their AD groups', 'Install the AWS CLI on employee workstations and distribute shared long-term access keys per department'],
    correctAnswer: 2,
    explanation: 'IAM supports SAML 2.0 identity federation: AD FS authenticates the user and issues a SAML assertion, which the user exchanges for temporary credentials by assuming an IAM role mapped from their directory groups. This avoids creating or synchronizing IAM users entirely. Cognito user pools target customer-facing application sign-in rather than workforce console access, and shared access keys are a serious security antipattern.'
  },
  {
    id: 'sa7',
    question: 'Account A needs to allow a specific IAM role in Account B to read objects from one S3 bucket, and the role\'s sessions in Account B should not have to assume a different role to do so. What should the solutions architect configure?',
    options: ['Add a bucket policy in Account A granting the Account B role s3:GetObject, and ensure the role\'s identity-based policy also allows it', 'Create an IAM user in Account A for Account B\'s application and share its access keys', 'Enable S3 Transfer Acceleration on the bucket so cross-account principals are trusted automatically', 'Attach a VPC endpoint policy in Account B that grants access to the bucket in Account A'],
    correctAnswer: 0,
    explanation: 'For cross-account S3 access without role switching, both sides must permit the action: a resource-based bucket policy in the bucket\'s account grants the external principal access, and the principal\'s identity-based policy in its own account must also allow the S3 action. Sharing IAM user keys is insecure, Transfer Acceleration only speeds uploads over long distances, and a VPC endpoint policy can restrict traffic through the endpoint but does not by itself grant cross-account permissions.'
  },
  {
    id: 'sa8',
    question: 'A security team must ensure that every newly created EBS volume in a Region is encrypted, including volumes created by developers who forget to select encryption, with the LEAST ongoing effort. What should be done?',
    options: ['Run a nightly Lambda function that copies unencrypted volumes into encrypted snapshots and deletes the originals', 'Create an AWS Config rule that notifies administrators whenever an unencrypted volume appears', 'Train developers to always check the encryption box and audit compliance quarterly', 'Enable EBS encryption by default for the account in that Region so all new volumes are automatically encrypted'],
    correctAnswer: 3,
    explanation: 'EBS encryption by default is a per-Region account setting that forces every newly created volume and snapshot copy to be encrypted with the chosen KMS key, requiring no action from developers. A Config rule or manual audits only detect violations after unencrypted volumes exist, and a nightly remediation Lambda adds operational overhead and leaves data unencrypted until it runs.'
  },
  {
    id: 'sa9',
    question: 'A company using AWS Organizations wants to prevent all member accounts in a specific organizational unit from launching resources outside approved Regions, regardless of the IAM permissions administrators grant locally. Which mechanism enforces this?',
    options: ['Attach an identity-based policy denying non-approved Regions to every IAM user in the member accounts', 'Enable AWS Control Tower drift detection to roll back resources created in other Regions', 'Attach a service control policy to the OU that denies actions when the requested Region is not in the approved list', 'Configure AWS Config aggregators to reject configuration changes originating from other Regions'],
    correctAnswer: 2,
    explanation: 'Service control policies set the maximum available permissions for member accounts, so a deny based on the aws:RequestedRegion condition applies even if a local administrator grants full access; SCPs act as guardrails that no identity policy in the member account can exceed. Per-user identity policies can be modified or detached by local administrators, and AWS Config only records and evaluates configurations rather than blocking API calls.'
  },
  {
    id: 'sa10',
    question: 'A solutions architect attaches a service control policy denying s3:PutObject to the root of an organization. Which statement accurately describes the effect of this SCP?',
    options: ['It removes s3:PutObject permissions from all principals in every account, including the management account', 'It restricts principals in member accounts but has no effect on principals in the management account', 'It grants all other S3 permissions to member accounts because SCPs define allowed permissions', 'It blocks the action only for IAM users, while IAM roles and the root user of member accounts are exempt'],
    correctAnswer: 1,
    explanation: 'SCPs never affect principals in the management account, which is a key reason AWS recommends keeping workloads out of it; they do apply to all IAM users, roles, and even the root user of member accounts. SCPs also never grant permissions on their own; they only filter the maximum permissions that identity-based policies in member accounts can actually use.'
  },
  {
    id: 'sa11',
    question: 'After a public incident at another firm, a company mandates that no S3 bucket in its account may ever be made public, even if a developer misconfigures a bucket policy or ACL in the future. What is the MOST effective single control?',
    options: ['Enable S3 Block Public Access at the account level so public bucket policies and ACLs are ignored or rejected', 'Subscribe to AWS Trusted Advisor and review the public bucket check every week', 'Write a bucket policy on each existing bucket that denies the principal * from all actions', 'Enable default encryption with SSE-KMS so public users cannot decrypt any objects they access'],
    correctAnswer: 0,
    explanation: 'Account-level S3 Block Public Access overrides any bucket policy or ACL that would grant public access, protecting both current and future buckets with one setting. Trusted Advisor reviews are detective rather than preventive, per-bucket deny policies do not cover buckets created later, and SSE-KMS encryption does not stop a bucket from being publicly listable or its objects from being served to anonymous requesters if policy allows it.'
  },
  {
    id: 'sa12',
    question: 'A company is standardizing access control on its S3 buckets and wants to follow current AWS best practices for managing permissions at scale. Which approach should the solutions architect recommend?',
    options: ['Use object ACLs as the primary mechanism because they offer per-object granularity', 'Grant the bucket-owner-full-control canned ACL to all uploading accounts and manage access with email-based grantees', 'Enable ACLs on all buckets so both the object writer and bucket owner can define permissions independently', 'Disable ACLs with the bucket owner enforced setting and manage all access through bucket policies and IAM policies'],
    correctAnswer: 3,
    explanation: 'AWS recommends disabling ACLs (Object Ownership set to bucket owner enforced, the default for new buckets) so the bucket owner owns every object and all access is governed by bucket policies and IAM policies, which support conditions, are auditable, and scale far better. ACLs are a legacy mechanism with coarse grants and no condition support, needed only for rare cases like buckets requiring per-object ownership by other accounts.'
  },
  {
    id: 'sa13',
    question: 'A media application stores purchased video files in a private S3 bucket. After checkout, customers must be able to download their file for 15 minutes without the company managing any credentials for them. Which solution meets this requirement?',
    options: ['Temporarily add each customer\'s IP address to the bucket policy and remove it after 15 minutes', 'Make the object public at purchase time and use a Lambda function to re-privatize it later', 'Have the application generate an S3 presigned URL with a 15-minute expiration and return it to the customer', 'Create a Cognito identity pool and issue each customer scoped IAM credentials valid for 15 minutes'],
    correctAnswer: 2,
    explanation: 'A presigned URL is signed with the application\'s own credentials and grants time-limited access to exactly one object, expiring automatically, which is the standard pattern for temporary object downloads. Editing bucket policies per customer does not scale and risks propagation delays, briefly public objects can be discovered and scraped, and issuing per-customer AWS credentials via an identity pool is far more machinery than a simple download requires.'
  },
  {
    id: 'sa14',
    question: 'A financial services firm must retain trade records in S3 for seven years in a way that guarantees no user, including account administrators and the root user, can delete or overwrite them during the retention period. Which configuration satisfies this regulatory requirement?',
    options: ['Enable S3 Object Lock in compliance mode with a seven-year retention period on the objects', 'Enable S3 Object Lock in governance mode and restrict the s3:BypassGovernanceRetention permission', 'Enable S3 Versioning and MFA Delete so deletions require a hardware token', 'Apply a legal hold to the objects and document a policy prohibiting its removal for seven years'],
    correctAnswer: 0,
    explanation: 'Compliance mode retention cannot be shortened or removed by any user, including the root user, until the retention period ends, which is what strict regulatory immutability demands. Governance mode can be bypassed by principals granted s3:BypassGovernanceRetention, MFA Delete only protects deletions rather than guaranteeing immutability against privileged users, and a legal hold can be removed at any time by anyone with the s3:PutObjectLegalHold permission.'
  },
  {
    id: 'sa15',
    question: 'A company must encrypt objects in S3 and prove to auditors exactly which principals used the encryption key and when, and must be able to disable the key immediately if it is misused. Which encryption option meets these requirements?',
    options: ['SSE-S3, because Amazon manages the keys and records all usage in S3 server access logs', 'SSE-KMS with a customer managed key, because key usage is logged in CloudTrail and the key can be disabled', 'SSE-C, because the company supplies the key on every request and can simply stop sending it', 'Client-side encryption with a hardcoded application key rotated during each deployment'],
    correctAnswer: 1,
    explanation: 'SSE-KMS with a customer managed key logs every Decrypt and GenerateDataKey call in CloudTrail with the calling principal, and the key can be disabled or its key policy changed instantly to cut off access. SSE-S3 provides no per-key audit trail or key control, SSE-C means AWS never stores the key so there is nothing to audit or disable centrally, and hardcoded application keys offer neither auditing nor rapid revocation.'
  },
  {
    id: 'sa16',
    question: 'Due to a strict internal policy, a company must encrypt S3 objects with keys that AWS never stores in any form, while still letting S3 perform the encryption and decryption during requests. Which option satisfies this?',
    options: ['SSE-KMS with an imported key material customer managed key', 'SSE-S3 with default bucket encryption enabled', 'Client-side encryption using the AWS Encryption SDK with a KMS key', 'SSE-C, where the client supplies its own encryption key in each request header'],
    correctAnswer: 3,
    explanation: 'With SSE-C the customer provides the encryption key in the request headers, S3 uses it to encrypt or decrypt server-side and then discards it, storing only a salted HMAC to validate future requests, so AWS never retains the key. SSE-KMS stores key material inside KMS even when imported, SSE-S3 uses keys fully managed and stored by AWS, and Encryption SDK client-side encryption with a KMS key still relies on a key stored in AWS.'
  },
  {
    id: 'sa17',
    question: 'A compliance rule states that all requests to a sensitive S3 bucket must use encryption in transit. How can a solutions architect enforce this at the bucket level?',
    options: ['Enable default bucket encryption with SSE-KMS so all transfers are automatically encrypted in transit', 'Attach the bucket to a CloudFront distribution and enable the HTTPS-only viewer protocol policy', 'Add a bucket policy statement that denies all actions when the aws:SecureTransport condition is false', 'Require requesters to use S3 Transfer Acceleration endpoints, which only accept TLS connections'],
    correctAnswer: 2,
    explanation: 'A bucket policy with an explicit deny when aws:SecureTransport is false rejects any request made over plain HTTP, enforcing TLS for every principal and access path. Default encryption governs encryption at rest, not in transit, and a CloudFront HTTPS policy only controls viewer connections to CloudFront, leaving direct HTTP requests to the bucket endpoint unblocked.'
  },
  {
    id: 'sa18',
    question: 'An analytics workload in private subnets must access an S3 bucket, and the security team requires that the bucket reject any request that does not travel through the company\'s VPC, with no data transfer processing charges for the S3 traffic. Which combination meets these requirements?',
    options: ['Route S3 traffic through a NAT gateway and add the NAT\'s Elastic IP to the bucket policy allow list', 'Create a gateway VPC endpoint for S3 and add a bucket policy denying requests whose aws:sourceVpce does not match the endpoint', 'Create an interface VPC endpoint for S3 and rely on its security group to filter which principals reach the bucket', 'Enable S3 Block Public Access and restrict the bucket policy to the VPC\'s private CIDR range'],
    correctAnswer: 1,
    explanation: 'A gateway endpoint for S3 carries traffic privately via route table entries at no additional charge, and a bucket policy conditioned on aws:sourceVpce guarantees the bucket only serves requests arriving through that endpoint. A NAT gateway incurs per-GB processing charges, an interface endpoint for S3 carries hourly and data charges and its security group cannot enforce the bucket side, and private CIDR ranges are not preserved as source IPs for S3 policy evaluation without an endpoint.'
  },
  {
    id: 'sa19',
    question: 'A data lake bucket is shared by dozens of teams, and its single bucket policy has grown so large and complex that changes now risk breaking other teams\' access. What should the solutions architect use to simplify managing access for each team?',
    options: ['Create S3 Access Points, one per team, each with its own access policy scoped to that team\'s prefix', 'Split every team\'s data into a separate AWS account and replicate objects between them nightly', 'Convert the bucket policy into object ACLs so each object carries its own grants', 'Front the bucket with an API Gateway REST API and manage authorization in Lambda code'],
    correctAnswer: 0,
    explanation: 'S3 Access Points give each application or team its own named network endpoint with a dedicated access point policy, decomposing one enormous bucket policy into small, independently managed policies, and they can also be restricted to a VPC. Splitting into accounts with replication adds cost and consistency problems, ACLs are legacy and lack condition support, and building a custom API layer adds operational burden that S3 access management does not require.'
  },
  {
    id: 'sa20',
    question: 'A security team requires full control over the lifecycle of the encryption key used by several AWS services: they must define its key policy, control which external accounts can use it, and schedule its deletion if needed. Which key type must they use?',
    options: ['An AWS owned key, because it is shared across customers and centrally maintained by AWS', 'An AWS managed key, because AWS creates it in the customer account for each service', 'A data key generated at runtime and discarded after each encryption operation', 'A customer managed KMS key, which the team creates and fully governs through its key policy'],
    correctAnswer: 3,
    explanation: 'Only customer managed keys let the customer author the key policy, grant cross-account usage, enable or disable the key, and schedule deletion. AWS managed keys (aws/service names) live in your account but their policies cannot be edited and they cannot be shared cross-account or deleted on demand, and AWS owned keys are not even visible in your account. Data keys are outputs of a KMS key, not a governable KMS resource themselves.'
  },
  {
    id: 'sa21',
    question: 'A company\'s policy requires that KMS key material used for encrypting data be changed every year without re-encrypting existing data or updating applications that reference the key. How should this be implemented?',
    options: ['Create a new KMS key every year and update all key ARNs across application configurations', 'Enable automatic key rotation on the customer managed symmetric key so KMS rotates the backing key material annually', 'Export the key material yearly, generate a replacement offline, and re-import it into the same key', 'Delete and recreate the key each year, then use S3 batch operations to re-encrypt all stored objects'],
    correctAnswer: 1,
    explanation: 'Automatic rotation on a customer managed symmetric key makes KMS generate new backing key material every year while the key ID, ARN, and policy remain unchanged, and KMS retains prior material to decrypt older ciphertexts, so neither applications nor data need to change. Creating or recreating keys forces configuration updates and mass re-encryption, and keys with imported key material do not support automatic rotation.'
  },
  {
    id: 'sa22',
    question: 'An AWS service integration needs to temporarily allow a specific principal to use a customer managed KMS key for decryption, and the permission must be revocable programmatically without editing the key policy or IAM policies. Which KMS feature is designed for this?',
    options: ['Key aliases, which can be repointed to a different key to cut off access', 'A permissions boundary attached to the principal restricting kms:Decrypt', 'A KMS grant that allows the grantee specific operations and can be retired or revoked at any time', 'Multi-Region key replication with the replica disabled after use'],
    correctAnswer: 2,
    explanation: 'Grants are the KMS mechanism for delegating scoped, temporary use of a key programmatically; they name a grantee principal, list allowed operations, and can be retired or revoked without touching the key policy, which is exactly how AWS services obtain key access on your behalf. Aliases only affect name resolution rather than authorization, permissions boundaries cap identity policies rather than delegating new access, and multi-Region replicas address geography, not delegation.'
  },
  {
    id: 'sa23',
    question: 'A company encrypts DynamoDB global table data with KMS and needs a disaster recovery Region to decrypt backups using the same key material without making cross-Region KMS API calls during recovery. What should the solutions architect implement?',
    options: ['Create a multi-Region KMS key and replicate it into the DR Region so both keys share key material and interoperate', 'Enable automatic rotation so the key material eventually propagates to other Regions', 'Copy the key\'s ARN into the DR Region applications, since KMS keys are global resources', 'Export the key material with CloudHSM and import it into an unrelated key in the DR Region'],
    correctAnswer: 0,
    explanation: 'Multi-Region keys are a matched set: the primary and its replicas have the same key ID and key material, so ciphertext encrypted in one Region decrypts in another using the local replica, avoiding cross-Region calls. Standard KMS keys are strictly regional resources, so an ARN from another Region cannot be used locally; rotation never copies material across Regions; and KMS does not allow exporting the key material of a standard KMS-generated key.'
  },
  {
    id: 'sa24',
    question: 'An application must encrypt files that are hundreds of megabytes in size using KMS-protected keys. Direct calls to the KMS Encrypt API are failing for these files. Why, and what is the correct pattern?',
    options: ['KMS throttles large payloads, so the application should request a service quota increase for payload size', 'The files exceed the KMS ciphertext size limit, so they must be split into 4 KB chunks and encrypted individually', 'KMS can only encrypt up to 4 KB directly, so the application should use envelope encryption: generate a data key, encrypt the file locally, and store the encrypted data key alongside it', 'The KMS key policy is missing the kms:EncryptLargeObject permission required for files over 100 MB'],
    correctAnswer: 2,
    explanation: 'The KMS Encrypt API accepts at most 4 KB of plaintext, because KMS keys are meant to protect data keys, not bulk data. Envelope encryption is the intended pattern: call GenerateDataKey, use the returned plaintext data key to encrypt the file locally, then store the encrypted copy of the data key with the ciphertext and discard the plaintext key. Chunking large files into 4 KB KMS calls would be absurdly slow and costly, and there is no kms:EncryptLargeObject permission or payload quota to raise.'
  },
  {
    id: 'sa25',
    question: 'A regulated institution must generate and store cryptographic keys in a single-tenant hardware security module validated to FIPS 140-2 Level 3, with exclusive control over the HSM and no AWS access to key material. Which service should it use?',
    options: ['AWS KMS with customer managed keys, which stores keys in shared FIPS-validated HSMs', 'AWS Secrets Manager with a customer managed KMS encryption key', 'AWS Certificate Manager with a private certificate authority', 'AWS CloudHSM, which provides dedicated single-tenant HSMs under the customer\'s exclusive control'],
    correctAnswer: 3,
    explanation: 'CloudHSM provisions dedicated, single-tenant HSM appliances validated at FIPS 140-2 Level 3 in which the customer alone manages users and keys, and AWS has no access to the key material. Standard KMS uses multi-tenant HSMs managed by AWS, which fails the single-tenant and exclusive-control requirements; Secrets Manager stores application secrets rather than serving as an HSM; and ACM issues and manages certificates, not raw HSM-resident keys.'
  },
  {
    id: 'sa26',
    question: 'An application stores its RDS for PostgreSQL database password in configuration files, and the security team now requires the password to be rotated automatically every 30 days without application downtime or code that handles rotation logic. Which solution meets this with the LEAST development effort?',
    options: ['Store the password in SSM Parameter Store as a SecureString and rotate it with a custom-built Step Functions workflow', 'Store the credential in AWS Secrets Manager and enable managed rotation for RDS on a 30-day schedule, retrieving it from the application at connection time', 'Encrypt the configuration file with KMS and schedule an EC2 cron job to regenerate the password monthly', 'Move the password into an encrypted DynamoDB table and trigger rotation through EventBridge rules'],
    correctAnswer: 1,
    explanation: 'Secrets Manager has built-in rotation for RDS databases: it provisions the rotation Lambda, updates both the database and the stored secret in step, and applications simply fetch the current secret at connection time, so no custom rotation code is needed. Parameter Store SecureStrings have no native rotation, requiring you to build and maintain the entire rotation workflow yourself, as do the cron and DynamoDB approaches.'
  },
  {
    id: 'sa27',
    question: 'A startup needs to centrally store a few dozen non-rotating configuration values and API endpoint strings for its applications, encrypted at rest, at the LOWEST possible cost. Which service fits best?',
    options: ['AWS Systems Manager Parameter Store standard parameters, using SecureString for sensitive values', 'AWS Secrets Manager with one secret per configuration value', 'Amazon S3 with SSE-KMS and a JSON file per application environment', 'AWS AppConfig with a freeform configuration profile and a validator Lambda'],
    correctAnswer: 0,
    explanation: 'Parameter Store standard parameters are free to store and retrieve, support KMS-encrypted SecureString values, and integrate with IAM, making them ideal for configuration data that does not need rotation. Secrets Manager charges per secret per month plus API calls, which buys automatic rotation the requirement does not need; S3 and AppConfig work but add object management or feature complexity without being cheaper than free.'
  },
  {
    id: 'sa28',
    question: 'A solutions architect adds an inbound rule to an EC2 instance\'s security group allowing TCP 443 from the internet, but adds no outbound rules for the responses. Clients can still complete HTTPS requests successfully. Why?',
    options: ['The default outbound rule in every security group cannot be removed, so responses always flow', 'The instance\'s network ACL automatically creates matching outbound entries for each inbound rule', 'Security groups are stateful, so response traffic for an allowed inbound connection is automatically permitted', 'AWS routes return traffic through the internet gateway, which bypasses security group evaluation'],
    correctAnswer: 2,
    explanation: 'Security groups track connection state: once inbound traffic is allowed, the corresponding return traffic is permitted automatically regardless of outbound rules. This contrasts with network ACLs, which are stateless and require explicit rules in both directions, including the ephemeral port range for responses. The default allow-all outbound rule can in fact be removed, and NACLs never create rules on their own.'
  },
  {
    id: 'sa29',
    question: 'A web application behind an internet-facing ALB is receiving abusive scraping traffic from one specific IP address. The team wants to block that address at the subnet boundary before it reaches any resources. Which control accomplishes this?',
    options: ['Add a deny rule for the IP address to the ALB\'s security group', 'Add a low-numbered deny rule for the IP address to the network ACL on the public subnets', 'Remove the IP address from the ALB target group\'s allowed sources list', 'Enable VPC Flow Logs with a reject filter for the IP address'],
    correctAnswer: 1,
    explanation: 'Network ACLs support explicit deny rules evaluated in ascending rule-number order at the subnet boundary, so a low-numbered deny entry blocks the address before it reaches the load balancer. Security groups only support allow rules and cannot deny a specific source, target groups have no source allow list, and Flow Logs record traffic metadata for analysis but never block anything.'
  },
  {
    id: 'sa30',
    question: 'EC2 instances in private subnets currently reach DynamoDB through a NAT gateway, and the data transfer processing charges have become significant. How can the architecture keep the traffic off the public internet while eliminating those charges?',
    options: ['Replace the NAT gateway with a NAT instance on a burstable instance type to reduce hourly cost', 'Create an interface VPC endpoint for DynamoDB and route table entries pointing at its ENIs', 'Enable DynamoDB Accelerator (DAX) in the private subnets so requests are served locally', 'Create a gateway VPC endpoint for DynamoDB and add it to the private subnets\' route tables'],
    correctAnswer: 3,
    explanation: 'Gateway endpoints, available for S3 and DynamoDB, add prefix-list routes to the subnet route tables so traffic reaches the service privately with no per-hour or per-GB endpoint charge, removing the NAT data processing cost entirely. A NAT instance still bills for instance hours and pushes traffic through a public path, and DAX is a cache that reduces read latency, not a private connectivity mechanism. DynamoDB also offers interface endpoints, but they carry hourly and data processing charges the free gateway endpoint avoids.'
  },
  {
    id: 'sa31',
    question: 'Applications in private subnets with no internet access must call AWS Secrets Manager and Amazon SQS. Traffic must stay on the AWS network. What should the solutions architect create?',
    options: ['Interface VPC endpoints (AWS PrivateLink) for Secrets Manager and SQS in the VPC', 'Gateway VPC endpoints for Secrets Manager and SQS with route table associations', 'An egress-only internet gateway so the subnets can make outbound IPv6 calls to the service APIs', 'A Site-to-Site VPN connection from the VPC to each service\'s regional endpoint'],
    correctAnswer: 0,
    explanation: 'Secrets Manager and SQS are reached privately through interface endpoints, which place elastic network interfaces with private IPs into your subnets via AWS PrivateLink. Gateway endpoints exist only for S3 and DynamoDB, an egress-only internet gateway still sends traffic over the public internet path, and Site-to-Site VPN connects networks to a VPC rather than providing private access to regional AWS service APIs.'
  },
  {
    id: 'sa32',
    question: 'A security engineer suspects an application in a private subnet is being probed from a peered VPC and needs to see which connections are being accepted or rejected at the ENI level, including source ports and packet counts. Which capability provides this data?',
    options: ['AWS CloudTrail management events filtered by the instance\'s role ARN', 'Amazon GuardDuty findings for the affected instance', 'VPC Flow Logs on the subnet or ENI, delivered to CloudWatch Logs or S3 for analysis', 'AWS Config configuration timeline for the elastic network interface'],
    correctAnswer: 2,
    explanation: 'VPC Flow Logs capture metadata for IP traffic to and from ENIs, including source and destination addresses and ports, protocol, byte and packet counts, and the ACCEPT or REJECT action, which is exactly what connection-level investigation requires. CloudTrail records API calls rather than network packets, GuardDuty surfaces curated threat findings rather than raw connection records, and AWS Config tracks resource configuration changes, not traffic.'
  },
  {
    id: 'sa33',
    question: 'A company operates a bastion host to let engineers SSH into private EC2 instances, but the security team wants to eliminate all inbound SSH ports and public entry points while keeping a full audit log of every interactive session. What should replace the bastion?',
    options: ['A smaller hardened bastion in a separate security account with SSH key rotation via Lambda', 'AWS Systems Manager Session Manager, with session logging to CloudWatch Logs or S3', 'EC2 Instance Connect, which brokers SSH through the instance\'s public endpoint', 'A client VPN endpoint publishing routes to the private subnets over port 22'],
    correctAnswer: 1,
    explanation: 'Session Manager establishes shell sessions through the SSM agent\'s outbound connection to the Systems Manager service, so instances need no open inbound ports, no public IPs, and no SSH keys, while every session can be logged to CloudWatch Logs or S3 and every start is recorded in CloudTrail. A hardened bastion still exposes an inbound SSH surface, EC2 Instance Connect still uses port 22, and a client VPN keeps SSH ports open inside the network without native session recording.'
  },
  {
    id: 'sa34',
    question: 'Application servers in private subnets must download operating system patches from public repositories, but the security team insists the servers must never be reachable from the internet. Which design meets both needs?',
    options: ['Assign public IPs to the servers and restrict their security groups to the repositories\' address ranges', 'Move the servers to public subnets and rely on the network ACL to block all inbound traffic', 'Attach an internet gateway route to the private subnets only during scheduled patch windows', 'Route the private subnets\' outbound traffic through a NAT gateway in a public subnet'],
    correctAnswer: 3,
    explanation: 'A NAT gateway allows instances in private subnets to initiate outbound connections to the internet while refusing all unsolicited inbound connections, so the servers can pull patches without ever being addressable from outside. Public IPs or public subnet placement make the instances internet-reachable and depend on filter rules staying correct, and toggling internet gateway routes on a schedule is operationally fragile and still exposes instances during the window.'
  },
  {
    id: 'sa35',
    question: 'A web application behind an Application Load Balancer is being targeted with SQL injection attempts and bursts of thousands of requests per minute from individual clients. Which service can block both attack types at the load balancer?',
    options: ['AWS WAF associated with the ALB, using SQL injection managed rules and a rate-based rule', 'AWS Shield Standard enabled on the ALB\'s public listener', 'AWS Network Firewall deployed in the application\'s target subnets', 'Amazon GuardDuty with EC2 protection enabled for the target instances'],
    correctAnswer: 0,
    explanation: 'AWS WAF is a layer-7 firewall that attaches directly to an ALB (as well as CloudFront, API Gateway, and AppSync) and can apply managed SQL injection rule groups plus rate-based rules that automatically block clients exceeding a request threshold. Shield Standard mitigates network-layer DDoS but does not inspect request content, Network Firewall filters VPC network traffic rather than parsing HTTP requests for injection patterns, and GuardDuty detects threats but blocks nothing.'
  },
  {
    id: 'sa36',
    question: 'A company running a high-profile e-commerce site on CloudFront and Route 53 wants 24/7 access to a specialized DDoS response team during attacks and financial protection against usage spikes caused by DDoS-driven scaling. Which service provides these specific benefits?',
    options: ['AWS WAF with Bot Control and fraud prevention managed rule groups', 'AWS Shield Standard, which is enabled automatically for CloudFront distributions', 'AWS Shield Advanced subscribed on the CloudFront and Route 53 resources', 'AWS Firewall Manager administering WAF rules across the organization'],
    correctAnswer: 2,
    explanation: 'Shield Advanced adds what Standard lacks: access to the Shield Response Team, cost protection credits for scaling charges incurred during a DDoS event, and enhanced detection and mitigation for protected resources. Shield Standard is free and automatic but includes no response team or cost protection, WAF filters malicious requests but offers neither benefit, and Firewall Manager centrally manages rules rather than providing DDoS services itself.'
  },
  {
    id: 'sa37',
    question: 'A security team must inspect and filter all traffic leaving a VPC, blocking connections to known-bad domains and applying intrusion prevention signatures, using a managed service that scales automatically. Which service should be deployed?',
    options: ['AWS WAF web ACLs attached to each workload\'s load balancer', 'AWS Network Firewall in dedicated firewall subnets, with routes sending egress traffic through its endpoints', 'Security groups with outbound rules restricted to approved destination CIDR blocks', 'Amazon Inspector network reachability assessments on all instances'],
    correctAnswer: 1,
    explanation: 'AWS Network Firewall is a managed, stateful network firewall for VPCs supporting domain name filtering, Suricata-compatible intrusion prevention rules, and automatic scaling, inserted into traffic paths through firewall endpoints and route table configuration. WAF only inspects web requests reaching resources it is attached to, security groups match IPs and ports but cannot filter by domain or apply IPS signatures, and Inspector assesses vulnerability posture rather than filtering live traffic.'
  },
  {
    id: 'sa38',
    question: 'A static website is served by CloudFront from an S3 origin. The security team discovers users can bypass CloudFront and fetch objects directly from the S3 bucket URL. What is the recommended way to ensure the bucket only serves requests coming through CloudFront?',
    options: ['Configure origin access control (OAC) on the distribution and a bucket policy allowing only the CloudFront service principal for that distribution', 'Enable S3 static website hosting and set the index document to require a CloudFront referrer header', 'Restrict the bucket policy to the published list of CloudFront edge location IP ranges', 'Move the objects to a private bucket and have CloudFront sign a presigned URL for every viewer request'],
    correctAnswer: 0,
    explanation: 'Origin access control is the current recommended mechanism (replacing origin access identity): CloudFront signs origin requests, and the bucket policy grants access to the cloudfront.amazonaws.com service principal conditioned on the specific distribution ARN, so direct bucket requests fail. Referrer headers are trivially spoofed, edge IP allow lists are brittle and would admit any CloudFront customer, and S3 website endpoints do not support OAC or private origins at all.'
  },
  {
    id: 'sa39',
    question: 'A development team is building a mobile app and needs a managed service to handle user sign-up, sign-in with MFA, and password recovery, issuing JSON Web Tokens the app\'s API can validate. Which service directly provides this?',
    options: ['Amazon Cognito identity pools, which authenticate users and issue session tokens', 'IAM Identity Center with a permission set assigned to each mobile user', 'AWS Secrets Manager storing per-user password hashes retrieved by the app backend', 'An Amazon Cognito user pool, which acts as the user directory and issues ID and access tokens after authentication'],
    correctAnswer: 3,
    explanation: 'Cognito user pools are the authentication component: a managed user directory handling sign-up, sign-in, MFA, and account recovery, returning JWTs (ID, access, and refresh tokens) that APIs can validate. Identity pools do not authenticate users; they exchange tokens from an identity provider for temporary AWS credentials. IAM Identity Center serves workforce access to AWS accounts rather than customer app sign-in, and Secrets Manager is not an identity service.'
  },
  {
    id: 'sa40',
    question: 'A company discovers its production RDS for MySQL instance was created without storage encryption. Compliance now requires the database storage, its automated backups, and its snapshots to be encrypted with KMS. What must the team do?',
    options: ['Enable the encryption setting on the existing instance during the next maintenance window', 'Enable default EBS encryption for the account, which retroactively encrypts the instance\'s storage', 'Take a snapshot, copy the snapshot with encryption enabled, restore a new instance from the encrypted copy, and repoint the application', 'Create an encrypted read replica of the instance and promote it once replication catches up'],
    correctAnswer: 2,
    explanation: 'RDS storage encryption can only be chosen at instance creation and cannot be toggled on an existing unencrypted instance. The supported path is snapshot, encrypted snapshot copy, then restore, after which storage, automated backups, snapshots, and read replicas of the new instance are all encrypted. Default EBS encryption does not apply to RDS-managed storage, and RDS does not allow creating an encrypted read replica from an unencrypted source instance.'
  },
  {
    id: 'sa41',
    question: 'A security team wants continuous, intelligent detection of threats such as compromised IAM credentials, cryptocurrency mining, and communication with known command-and-control servers, by analyzing CloudTrail events, VPC Flow Logs, and DNS query logs without deploying any agents. Which service does this?',
    options: ['Amazon Inspector, which continuously scans workloads for software vulnerabilities', 'Amazon GuardDuty, a managed threat detection service that analyzes these log sources with machine learning and threat intelligence', 'Amazon Detective, which builds behavior graphs to investigate the root cause of findings', 'AWS Config, which evaluates resources against compliance rules as they change'],
    correctAnswer: 1,
    explanation: 'GuardDuty is the managed threat detection service that continuously analyzes CloudTrail management events, VPC Flow Logs, and DNS logs using threat intelligence feeds and machine learning, requiring no agents or infrastructure. Inspector finds software vulnerabilities and unintended network exposure rather than active threats, Detective is for investigating findings after detection, and Config checks configuration compliance rather than analyzing activity for attacks.'
  },
  {
    id: 'sa42',
    question: 'Before a compliance audit, a company must discover which of its hundreds of S3 buckets contain personally identifiable information such as names, credit card numbers, and passport numbers, using a managed service. Which service should it run?',
    options: ['Amazon Macie, which uses machine learning and pattern matching to discover sensitive data in S3', 'Amazon GuardDuty with S3 protection enabled on all buckets', 'AWS Audit Manager with the PCI DSS framework selected', 'Amazon Inspector with a data classification assessment template'],
    correctAnswer: 0,
    explanation: 'Macie is purpose-built for sensitive data discovery in S3, using managed data identifiers for PII types like credit card and passport numbers and reporting which buckets and objects contain them. GuardDuty S3 protection detects suspicious access patterns rather than classifying data contents, Audit Manager collects evidence for audits rather than scanning objects, and Inspector assesses software vulnerabilities, not data classification.'
  },
  {
    id: 'sa43',
    question: 'A cloud security team receives findings from GuardDuty, Inspector, Macie, and third-party tools across 30 accounts and wants a single place to aggregate them, check accounts against standards like CIS AWS Foundations, and track posture centrally. Which service provides this?',
    options: ['Amazon Detective, by linking all accounts into one behavior graph', 'AWS Trusted Advisor with the security checks enabled at the organization level', 'AWS Config aggregators combined with conformance packs in each Region', 'AWS Security Hub with cross-account aggregation and security standards enabled'],
    correctAnswer: 3,
    explanation: 'Security Hub aggregates findings from GuardDuty, Inspector, Macie, and integrated partner products into a normalized format across accounts and Regions, and runs automated checks against standards such as CIS AWS Foundations and AWS Foundational Security Best Practices. Detective investigates individual findings rather than aggregating them, Trusted Advisor offers a fixed set of best-practice checks without third-party ingestion, and Config aggregators consolidate only configuration compliance data.'
  },
  {
    id: 'sa44',
    question: 'Auditors require a record of every object-level read and write on a sensitive S3 bucket, plus proof that the delivered log files were not altered after CloudTrail wrote them. Which configuration meets both requirements?',
    options: ['Enable CloudTrail management events, which include S3 object operations by default, with SSE-KMS on the log bucket', 'Enable S3 server access logging and configure MFA Delete on the logging bucket', 'Configure a CloudTrail trail with S3 data events for the bucket and enable log file validation on the trail', 'Enable CloudTrail Insights on the trail and store logs in a bucket with Object Lock in governance mode'],
    correctAnswer: 2,
    explanation: 'Object-level S3 operations such as GetObject and PutObject are data events, which are not logged by default and must be explicitly enabled on a trail, and log file validation makes CloudTrail deliver signed digest files that prove whether log files were modified or deleted after delivery. Management events cover control-plane calls only, S3 server access logs are best-effort with no integrity validation, and Insights detects unusual API volumes rather than recording object access.'
  },
  {
    id: 'sa45',
    question: 'A team is adding HTTPS with an ACM public certificate to two components: an Application Load Balancer in eu-west-1 and a CloudFront distribution for the same domain. Where must the certificates be requested?',
    options: ['Both certificates in eu-west-1, because resources should use certificates from their nearest Region', 'The ALB certificate in eu-west-1 and the CloudFront certificate in us-east-1, because CloudFront only accepts ACM certificates from us-east-1', 'Both certificates in us-east-1, because ACM is a global service homed there', 'Either Region for both, because ACM automatically replicates certificates to wherever they are referenced'],
    correctAnswer: 1,
    explanation: 'ACM certificates are regional: a certificate used by an ALB must exist in the load balancer\'s own Region, while CloudFront, being a global service, only accepts ACM certificates issued in us-east-1 (N. Virginia). ACM never replicates certificates between Regions, so a single certificate cannot serve both resources unless the ALB also happens to be in us-east-1.'
  }
  ]
};
