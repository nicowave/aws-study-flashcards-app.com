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
    // Task Statement 1.1: Design secure access to AWS resources
    {
      id: 'sec1',
      question: 'An application running on Amazon EC2 instances must read objects from an S3 bucket in the same account. The security team prohibits long-term credentials on the instances or in source code. What is the MOST secure way to grant access?',
      options: [
        'Create an IAM user for the application and pass its access keys in EC2 user data',
        'Store an IAM user\'s access keys in Secrets Manager and fetch them when the instance boots',
        'Attach an IAM role with S3 read access to the instances through an instance profile',
        'Add a bucket policy that grants s3:GetObject to the security group attached to the instances'
      ],
      correctAnswer: 2,
      explanation: 'An IAM role attached through an instance profile gives the instances temporary credentials from STS that rotate automatically, so no long-term secrets exist anywhere. Access keys in user data or in Secrets Manager are still long-term IAM user credentials that can leak. Bucket policies cannot name security groups as principals.'
    },
    {
      id: 'sec2',
      question: 'A company uses AWS Organizations with dozens of member accounts. Auditors require that nobody in any member account, including users with AdministratorAccess, can stop or delete CloudTrail trails. Which solution meets this requirement with the LEAST operational overhead?',
      options: [
        'Attach an SCP to the organization root that denies stopping or deleting CloudTrail trails',
        'Add an IAM policy that denies the CloudTrail actions to every user and role in each member account',
        'Attach a permissions boundary that excludes CloudTrail actions to every administrator role',
        'Deploy an AWS Config rule that detects stopped trails and notifies the security team by email'
      ],
      correctAnswer: 0,
      explanation: 'An SCP attached at the organization root limits the maximum permissions of every principal in every member account, including administrators and the member account root user, and new accounts inherit it automatically. Per-account IAM policies and permissions boundaries must be maintained everywhere and can be removed by local administrators. A Config rule only detects the change after it happens instead of preventing it.'
    },
    {
      id: 'sec3',
      question: 'Developers must be able to create IAM roles for their own Lambda functions, but security requires that no role they create can ever have more permissions than an approved set. Which approach enforces this?',
      options: [
        'Attach a service control policy to the developers\' account that lists the approved actions',
        'Grant developers only iam:CreateRole and have security attach policies to each new role',
        'Place developers in an IAM group with the ReadOnlyAccess managed policy plus iam:PassRole',
        'Allow iam:CreateRole only when the new role carries a required permissions boundary'
      ],
      correctAnswer: 3,
      explanation: 'Requiring the iam:PermissionsBoundary condition key on iam:CreateRole forces every new role to carry the approved boundary, so its effective permissions can never exceed that set even if a broad policy is attached. An SCP would limit the developers themselves and the whole account, not the roles they delegate. Manual policy attachment by security does not scale, and ReadOnlyAccess would not let developers create roles at all.'
    },
    {
      id: 'sec4',
      question: 'A company has 40 AWS accounts in AWS Organizations and an existing external identity provider that supports SAML 2.0. Employees need single sign-on to the accounts they work in, with permissions managed centrally. Which solution requires the LEAST administrative effort?',
      options: [
        'Create IAM users in every account and synchronize passwords with a scheduled script',
        'Enable IAM Identity Center, connect the external IdP, and assign permission sets to groups',
        'Create an Amazon Cognito user pool federated with the IdP and grant it access to each account',
        'Create a SAML identity provider and federated roles manually in each of the 40 accounts'
      ],
      correctAnswer: 1,
      explanation: 'IAM Identity Center integrates with Organizations, federates with an external SAML IdP, and provisions roles from permission sets into every assigned account, giving one place to manage workforce access. IAM users in every account create long-term credentials and huge overhead. Cognito is for customer-facing application users, and per-account SAML roles work but must be built and maintained 40 times.'
    },
    {
      id: 'sec5',
      question: 'An application in Account A must write items to a DynamoDB table in Account B. The security team wants temporary credentials only and the ability to revoke access from Account B at any time. What should a solutions architect do?',
      options: [
        'Create an IAM user in Account B and store its access keys in the application configuration in Account A',
        'Create a role in Account B that trusts the Account A role, and have the app assume it',
        'Enable DynamoDB global tables so the table is replicated into Account A for local writes',
        'Peer the VPCs of both accounts and allow the application subnet in the table\'s security group'
      ],
      correctAnswer: 1,
      explanation: 'A cross-account role in Account B, whose trust policy names the application role in Account A, issues temporary STS credentials and can be modified or deleted by Account B to revoke access instantly. IAM user keys are long-term credentials. Global tables replicate within a single account across Regions, and DynamoDB access is authorized by IAM rather than by VPC peering and security groups.'
    },
    {
      id: 'sec6',
      question: 'A company grants a third-party SaaS monitoring vendor access to its account through an IAM role. The vendor uses the same AWS account to access many customers. How should the company protect against the confused deputy problem?',
      options: [
        'Require multi-factor authentication in the role trust policy for the vendor account',
        'Create a dedicated IAM user for the vendor and rotate its access keys every 90 days',
        'Attach a service control policy that allows only the vendor\'s account to call sts:AssumeRole',
        'Require a unique external ID from the vendor as a condition in the role trust policy'
      ],
      correctAnswer: 3,
      explanation: 'An external ID that is unique per customer, checked with the sts:ExternalId condition in the trust policy, ensures the vendor can only assume your role when acting on your behalf, which prevents another customer from tricking the vendor into accessing your account. MFA is not practical for an automated vendor service and does not address the confused deputy. IAM users add long-term credentials, and an SCP cannot express this per-customer check.'
    },
    {
      id: 'sec7',
      question: 'A company has just created a new standalone AWS account. Which set of actions follows AWS best practices for protecting the root user?',
      options: [
        'Enable root MFA, delete any root access keys, and use root only for tasks that need it',
        'Create root access keys for break-glass automation and store them in AWS Secrets Manager',
        'Share the root password with the admin team and register one virtual MFA app on a shared phone',
        'Attach an IAM policy to the root user that denies all actions except billing and support'
      ],
      correctAnswer: 0,
      explanation: 'Best practice is a strong password with MFA on the root user, no root access keys, and daily work done through IAM Identity Center users or roles, reserving root for the few tasks that require it. Root access keys should never exist, even for automation. Shared credentials remove accountability, and IAM policies cannot be attached to the root user (only an SCP can restrict a member account root user).'
    },
    {
      id: 'sec8',
      question: 'A role in Account B must read objects from an S3 bucket owned by Account A. The objects are encrypted with SSE-S3. What is required for the access to succeed?',
      options: [
        'Only a bucket policy in Account A that grants s3:GetObject to the role in Account B',
        'Only an identity-based policy on the role in Account B that allows s3:GetObject on the bucket',
        'A bucket policy in Account A and an identity-based policy in Account B, both allowing it',
        'A service control policy in Account A that allows principals from Account B to call s3:GetObject'
      ],
      correctAnswer: 2,
      explanation: 'For cross-account access, both sides must allow the request: the resource-based bucket policy in Account A must trust the role, and the identity-based policy in Account B must grant the role the S3 actions. Either policy alone results in an implicit deny. SCPs never grant permissions; they only cap what is allowed in member accounts.'
    },
    {
      id: 'sec9',
      question: 'A company wants to stand up a new multi-account environment quickly, with a dedicated log archive account, an audit account, preconfigured guardrails, and a self-service way to vend new accounts. Which service provides this with the LEAST effort?',
      options: [
        'AWS Organizations with SCPs and CloudFormation StackSets written by the team',
        'AWS Config conformance packs deployed to every account in the organization',
        'AWS Control Tower with its landing zone, controls, and Account Factory',
        'IAM Identity Center with permission sets assigned to each new account'
      ],
      correctAnswer: 2,
      explanation: 'AWS Control Tower automates a landing zone on top of Organizations, creating the log archive and audit accounts, applying preventive and detective controls, and providing Account Factory for vending accounts. Building the same with SCPs and StackSets is possible but far more effort. Config conformance packs only cover compliance rules, and Identity Center only handles workforce access.'
    },
    {
      id: 'sec10',
      question: 'A small team of administrators signs in as IAM users with MFA devices registered. The security team requires that the ec2:TerminateInstances action is denied unless the caller authenticated with MFA. Which policy element enforces this?',
      options: [
        'An AWS Config rule that checks whether MFA is enabled for each user',
        'A Deny statement for ec2:TerminateInstances when aws:MultiFactorAuthPresent is false',
        'An Allow statement for ec2:TerminateInstances with the aws:SecureTransport condition',
        'A CloudWatch alarm on CloudTrail events that terminate instances without MFA'
      ],
      correctAnswer: 1,
      explanation: 'A Deny statement with the condition BoolIfExists aws:MultiFactorAuthPresent false blocks the action for any session that did not authenticate with MFA, and an explicit deny overrides any allow. A Config rule only reports whether MFA is configured, not how a session authenticated. aws:SecureTransport checks for HTTPS, and a CloudWatch alarm reacts after the instance is already gone.'
    },

    // Task Statement 1.2: Design secure workloads and applications
    {
      id: 'sec11',
      question: 'A mobile app lets users sign in with Google or Apple accounts. After sign-in, the app must upload photos directly to a user-specific prefix in an S3 bucket using temporary AWS credentials. Which combination meets these requirements?',
      options: [
        'A Cognito user pool alone, using its ID token to sign S3 requests directly',
        'IAM Identity Center with the social providers configured as external identity sources',
        'An IAM user per app user, with access keys embedded in the mobile app at install time',
        'A Cognito user pool for sign-in plus an identity pool that issues temporary credentials'
      ],
      correctAnswer: 3,
      explanation: 'Cognito user pools handle sign-up and sign-in (including social federation) and issue JWTs, while identity pools exchange those tokens for temporary IAM credentials scoped by a role, which can use policy variables to limit each user to their own prefix. A user pool token cannot sign S3 requests. Identity Center is for workforce users, and embedding IAM user keys in an app is insecure and does not scale.'
    },
    {
      id: 'sec12',
      question: 'Web servers in a public subnet are receiving malicious traffic from a specific IP address range. The team must block that range immediately for the whole subnet. What should they do?',
      options: [
        'Add an inbound deny rule for the range to the subnet\'s network ACL with a low rule number',
        'Add an inbound deny rule for the range to the security group attached to the web servers',
        'Remove the internet gateway route from the subnet route table until the attack stops',
        'Enable Amazon GuardDuty so it automatically blocks the malicious IP addresses'
      ],
      correctAnswer: 0,
      explanation: 'Network ACLs support explicit deny rules and are evaluated in rule-number order, so a low-numbered deny rule blocks the range before any allow rule matches. Security groups only support allow rules and cannot deny specific addresses. Removing the internet gateway route takes the whole site offline, and GuardDuty detects threats but does not block traffic by itself.'
    },
    {
      id: 'sec13',
      question: 'Instances in private subnets across two Availability Zones need outbound internet access for patching and must not be reachable from the internet. Access must survive the loss of one AZ. What should a solutions architect deploy?',
      options: [
        'One NAT gateway in a public subnet, with both private route tables pointing to it',
        'A NAT gateway in each AZ, with each private route table using the one in its own AZ',
        'An internet gateway route in the private subnets and security groups that block inbound traffic',
        'An egress-only internet gateway with a default route from each private subnet'
      ],
      correctAnswer: 1,
      explanation: 'A zonal NAT gateway lives in one AZ, so placing one in each AZ and routing each private subnet to the NAT gateway in its own AZ removes the single point of failure. A single NAT gateway fails with its AZ. Routing private subnets to an internet gateway makes them public subnets, and an egress-only internet gateway only handles IPv6 traffic.'
    },
    {
      id: 'sec14',
      question: 'An analytics fleet in private subnets reads terabytes of data from Amazon S3 in the same Region each day through a NAT gateway, and NAT data processing charges are high. Which change reduces cost the MOST while keeping traffic off the internet?',
      options: [
        'Create an S3 gateway VPC endpoint and add it to the private subnets\' route tables',
        'Replace the NAT gateway with a larger NAT instance running on a Graviton EC2 instance',
        'Create an S3 interface VPC endpoint in each private subnet with private DNS enabled',
        'Move the instances to public subnets and access S3 through the internet gateway'
      ],
      correctAnswer: 0,
      explanation: 'S3 gateway endpoints carry no hourly or data processing charge and keep traffic on the AWS network through a route table entry, which makes them the cheapest option. An S3 interface endpoint also keeps traffic private but adds hourly and per-GB charges. A NAT instance adds management overhead and is still a NAT path, and public subnets expose the instances unnecessarily.'
    },
    {
      id: 'sec15',
      question: 'Lambda functions in a VPC with no internet access must call AWS Secrets Manager and Amazon SQS. The functions use the default AWS SDK endpoints. How can a solutions architect enable this with no code changes?',
      options: [
        'Create gateway VPC endpoints for Secrets Manager and SQS and update the route tables',
        'Add a NAT gateway and restrict its security group to the Secrets Manager and SQS endpoints',
        'Create interface VPC endpoints for both services with private DNS names enabled',
        'Configure AWS Direct Connect and route the service traffic through the on-premises network'
      ],
      correctAnswer: 2,
      explanation: 'Interface endpoints (AWS PrivateLink) place ENIs in the VPC, and with private DNS enabled the default service hostnames resolve to those private IPs, so the SDK works unchanged. Gateway endpoints exist only for S3 and DynamoDB. A NAT gateway provides internet access rather than private access and has no security group, and Direct Connect is unrelated to reaching AWS services from a VPC.'
    },
    {
      id: 'sec16',
      question: 'A SaaS provider wants to expose an API that runs in its VPC to hundreds of customer VPCs in other AWS accounts. Many customers use CIDR ranges that overlap with the provider\'s VPC, and traffic must not traverse the internet. Which solution should the provider use?',
      options: [
        'Create a VPC peering connection with each customer VPC and update all route tables',
        'Attach every customer VPC to a shared transit gateway owned by the provider',
        'Publish the API through an internet-facing ALB protected by AWS WAF and IP allow lists',
        'Expose the API as a PrivateLink endpoint service behind a Network Load Balancer'
      ],
      correctAnswer: 3,
      explanation: 'An endpoint service (AWS PrivateLink) behind a Network Load Balancer lets each customer create an interface endpoint in its own VPC, exposing only that service with no routing between VPCs, so overlapping CIDRs do not matter. VPC peering and Transit Gateway both require non-overlapping CIDRs and open broader network paths. An internet-facing ALB sends traffic over the internet.'
    },
    {
      id: 'sec17',
      question: 'A public web application behind an Application Load Balancer is being hit by SQL injection attempts and by bursts of requests from single IP addresses. Which solution addresses both problems with the LEAST operational overhead?',
      options: [
        'Enable AWS Shield Standard on the ALB and add deny rules to the ALB security group',
        'Associate an AWS WAF web ACL using a managed SQLi rule group and a rate-based rule',
        'Deploy AWS Network Firewall in front of the ALB with custom Suricata rules',
        'Add network ACL rules that deny traffic containing SQL keywords in the request'
      ],
      correctAnswer: 1,
      explanation: 'AWS WAF inspects HTTP requests at layer 7: an AWS managed rule group blocks common SQL injection patterns, and a rate-based rule throttles IP addresses that exceed a request threshold. Shield Standard covers network-layer DDoS, not application payloads, and security groups cannot deny. Network Firewall is a VPC-level firewall that needs custom rules, and network ACLs cannot inspect request contents.'
    },
    {
      id: 'sec18',
      question: 'A media company runs a high-profile site on CloudFront and Route 53. It needs 24/7 access to AWS DDoS experts during attacks and protection against scaling charges caused by DDoS traffic. Which service should it add?',
      options: [
        'AWS Shield Standard, which is enabled automatically on CloudFront and Route 53',
        'AWS WAF with AWS managed rule groups applied to the CloudFront distribution',
        'Amazon GuardDuty with findings routed to the on-call team through EventBridge',
        'AWS Shield Advanced, which includes the Shield Response Team and cost protection'
      ],
      correctAnswer: 3,
      explanation: 'Shield Advanced adds enhanced detection and mitigation, 24/7 access to the Shield Response Team, and cost protection credits for scaling charges caused by DDoS attacks, and it includes AWS WAF at no extra charge for protected resources. Shield Standard is free and automatic but offers neither SRT access nor cost protection. WAF alone handles layer 7 rules, and GuardDuty detects threats rather than mitigating DDoS.'
    },
    {
      id: 'sec19',
      question: 'A security team wants to be alerted if an EC2 instance starts communicating with known cryptocurrency mining domains or if credentials are used from an unusual location. They do not want to install agents or manage log pipelines. Which service should they enable?',
      options: [
        'Amazon GuardDuty',
        'Amazon Inspector',
        'Amazon Macie',
        'Amazon Detective'
      ],
      correctAnswer: 0,
      explanation: 'GuardDuty is a managed threat detection service that analyzes CloudTrail events, VPC Flow Logs, and DNS logs using threat intelligence and anomaly detection, with no agents or log pipelines to manage. Inspector scans for software vulnerabilities, Macie finds sensitive data in S3, and Detective helps investigate findings after they occur rather than generating them.'
    },
    {
      id: 'sec20',
      question: 'A healthcare company stores millions of documents across hundreds of S3 buckets in several accounts. Compliance officers need to find which buckets contain personally identifiable information and be notified of buckets that are publicly accessible. Which service meets this need?',
      options: [
        'Amazon GuardDuty with S3 Protection enabled',
        'Amazon Inspector with continuous scanning enabled',
        'Amazon Macie with automated sensitive data discovery',
        'AWS Config with the s3-bucket-public-read-prohibited rule'
      ],
      correctAnswer: 2,
      explanation: 'Macie uses machine learning and pattern matching to discover sensitive data such as PII in S3 objects and also evaluates bucket security posture, such as public access, across accounts in an organization. GuardDuty S3 Protection looks for suspicious access activity, not data contents. Inspector scans compute for vulnerabilities, and the Config rule checks public access but cannot classify data.'
    },
    {
      id: 'sec21',
      question: 'A company must continuously scan its EC2 instances, container images in Amazon ECR, and Lambda functions for known software vulnerabilities (CVEs) and get prioritized findings. Which service should a solutions architect recommend?',
      options: [
        'AWS Trusted Advisor security checks',
        'Amazon GuardDuty Runtime Monitoring',
        'AWS Systems Manager Patch Manager',
        'Amazon Inspector'
      ],
      correctAnswer: 3,
      explanation: 'Amazon Inspector automatically discovers EC2 instances, ECR images, and Lambda functions and continuously scans them for software vulnerabilities and unintended network exposure, producing risk-scored findings. Trusted Advisor checks account configuration rather than CVEs. GuardDuty Runtime Monitoring detects threats in running workloads, and Patch Manager applies patches but does not assess container images or Lambda code.'
    },
    {
      id: 'sec22',
      question: 'A company runs GuardDuty, Inspector, and Macie in 30 accounts. The security team wants one place to view and prioritize all findings across accounts and to automatically check accounts against the AWS Foundational Security Best Practices standard. Which service should they use?',
      options: [
        'AWS CloudTrail Lake with an organization event data store',
        'AWS Config with an organization-wide aggregator',
        'AWS Security Hub with a delegated administrator account',
        'Amazon Detective with behavior graphs in each account'
      ],
      correctAnswer: 2,
      explanation: 'Security Hub aggregates and normalizes findings from GuardDuty, Inspector, Macie, and partner tools across an organization through a delegated administrator, and runs automated checks against standards such as AWS Foundational Security Best Practices and CIS. CloudTrail Lake queries API activity, a Config aggregator collects resource configuration and compliance, and Detective is for investigating findings rather than aggregating them.'
    },
    {
      id: 'sec23',
      question: 'An application stores its Amazon RDS database credentials in a configuration file. The security team requires the credentials to be removed from the file and rotated automatically every 30 days with the LEAST operational overhead. What should a solutions architect do?',
      options: [
        'Store the credentials in Systems Manager Parameter Store as a SecureString and write a rotation script',
        'Store the credentials in AWS Secrets Manager and enable managed rotation for the RDS secret',
        'Encrypt the configuration file with a customer managed KMS key and rotate the key every 30 days',
        'Store the credentials in Lambda environment variables encrypted with an AWS managed KMS key'
      ],
      correctAnswer: 1,
      explanation: 'Secrets Manager provides built-in managed rotation for Amazon RDS credentials on a schedule, updating both the secret and the database user, and applications fetch the current value at runtime. Parameter Store SecureString encrypts values but has no native rotation, so a custom solution is needed. Rotating a KMS key does not change the database password, and environment variables still hold a static credential.'
    },
    {
      id: 'sec24',
      question: 'A company is building a REST API with Amazon API Gateway. Users already sign in through an Amazon Cognito user pool, and only signed-in users may call the API. Which authorization option requires the LEAST custom code?',
      options: [
        'A Lambda authorizer that downloads the user pool keys and validates each JWT',
        'API keys distributed to each user and enforced through a usage plan',
        'IAM authorization that requires every user to sign requests with Signature Version 4',
        'A Cognito user pool authorizer configured on the API methods'
      ],
      correctAnswer: 3,
      explanation: 'A Cognito user pool authorizer validates the user pool tokens natively in API Gateway with no code to write or maintain. A Lambda authorizer can do the same but requires custom code. API keys identify clients for throttling and quotas and are not an authentication mechanism, and SigV4 IAM authorization is better suited to AWS principals than to end users of a user pool.'
    },
    {
      id: 'sec25',
      question: 'A company routes all VPC egress traffic through a central inspection VPC. It needs stateful inspection, intrusion prevention, and the ability to allow outbound HTTPS only to an approved list of domain names. Which service meets these requirements?',
      options: [
        'AWS Network Firewall',
        'AWS WAF',
        'Security groups',
        'Network ACLs'
      ],
      correctAnswer: 0,
      explanation: 'AWS Network Firewall is a managed, stateful VPC firewall with Suricata-compatible intrusion prevention rules and domain list filtering for outbound traffic, and it fits centralized inspection designs with Transit Gateway. AWS WAF only protects HTTP endpoints such as ALB, API Gateway, and CloudFront. Security groups and network ACLs filter by IP, port, and protocol only and cannot filter by domain name or inspect payloads.'
    },
    {
      id: 'sec26',
      question: 'A three-tier application has an ALB, web instances in an Auto Scaling group, and an RDS database. Instance IP addresses change constantly. How should a solutions architect restrict the database so it accepts connections only from the web tier?',
      options: [
        'Allow the database port from the private subnet CIDR ranges in the database network ACL',
        'In the database security group, allow the DB port from the web tier security group',
        'Allow the database port from the ALB security group in the database security group',
        'Update the database security group with each new instance IP address from a lifecycle hook'
      ],
      correctAnswer: 1,
      explanation: 'Referencing the web tier security group as the source allows any instance in that group, whatever its IP address, and nothing else, which follows least privilege with no maintenance. Subnet CIDR rules would admit any resource in those subnets. The ALB does not connect to the database, and maintaining individual IP addresses through lifecycle hooks is fragile and unnecessary.'
    },

    // Task Statement 1.3: Determine appropriate data security controls
    {
      id: 'sec27',
      question: 'A company must encrypt sensitive S3 data with a key whose policy it controls, see every use of the key in CloudTrail, and be able to disable the key immediately if a breach is suspected. Which encryption option should it use?',
      options: [
        'SSE-S3 with S3 managed keys',
        'SSE-KMS with the AWS managed key aws/s3',
        'SSE-KMS with a customer managed KMS key',
        'Client-side encryption with a key stored in Parameter Store'
      ],
      correctAnswer: 2,
      explanation: 'A customer managed KMS key lets the company write and change the key policy, logs every cryptographic use in CloudTrail, and can be disabled or scheduled for deletion at any time. SSE-S3 keys are fully managed by S3 with no key policy or per-use audit. The AWS managed key aws/s3 is logged in CloudTrail, but its key policy cannot be edited and it cannot be disabled. A key in Parameter Store adds risk and manual work.'
    },
    {
      id: 'sec28',
      question: 'Account A encrypts objects in a shared S3 bucket with a customer managed KMS key. A role in Account B can list the bucket but receives AccessDenied when downloading objects. Which change fixes the problem?',
      options: [
        'Share the KMS key with Account B through AWS Resource Access Manager',
        'Re-encrypt the objects with the AWS managed key aws/s3, which works across accounts',
        'Allow Account B in the KMS key policy and grant the role kms:Decrypt in its IAM policy',
        'Export the key material from KMS in Account A and import it into a key in Account B'
      ],
      correctAnswer: 2,
      explanation: 'Cross-account use of a KMS key requires both the key policy in the owning account to allow the external account or role and an IAM policy in Account B that grants kms:Decrypt on that key ARN. KMS keys are not shared through AWS RAM. AWS managed keys cannot be used across accounts at all, and KMS never allows key material to be exported.'
    },
    {
      id: 'sec29',
      question: 'An application must encrypt multi-gigabyte video files before storing them, using a KMS key, while minimizing calls to KMS and the data sent to it. Which approach should the developers use?',
      options: [
        'Call the KMS Encrypt API on each complete file and store the ciphertext it returns',
        'Use GenerateDataKey, encrypt locally, and store the encrypted data key with the file',
        'Split each file into small chunks and call the KMS Encrypt API once for every chunk',
        'Store the files in a CloudHSM cluster, which encrypts them when they are written'
      ],
      correctAnswer: 1,
      explanation: 'This is envelope encryption: KMS returns a plaintext data key and the same key encrypted under the KMS key, the application encrypts the file locally and discards the plaintext key, and later calls Decrypt only on the small encrypted data key. The KMS Encrypt API accepts only small payloads (up to 4 KB), so large files cannot be sent directly, and chunking would cause huge numbers of KMS calls. CloudHSM is a key store, not file storage.'
    },
    {
      id: 'sec30',
      question: 'A company replicates client-side encrypted data from us-east-1 to eu-west-1 for disaster recovery. During a Regional outage, the DR application must decrypt the data in eu-west-1 without calling KMS in us-east-1. What should a solutions architect use?',
      options: [
        'A single-Region customer managed key, which KMS automatically copies to every Region',
        'A CloudHSM cluster with HSMs placed in both Regions as a single cluster',
        'A KMS multi-Region key with a primary key in us-east-1 and a replica key in eu-west-1',
        'An AWS managed key, because AWS managed keys share key material across Regions'
      ],
      correctAnswer: 2,
      explanation: 'Multi-Region keys are interoperable KMS keys in different Regions that share the same key ID and key material, so data encrypted in one Region can be decrypted in another without cross-Region calls. Single-Region keys and AWS managed keys never leave their Region. A CloudHSM cluster exists within one Region, so it does not provide this cross-Region decryption.'
    },
    {
      id: 'sec31',
      question: 'A bank\'s regulator requires that encryption keys reside in single-tenant hardware security modules under the bank\'s exclusive control, with no AWS access to key material. A legacy application uses the PKCS#11 interface. Which service should the bank use?',
      options: [
        'AWS KMS with customer managed keys and a restrictive key policy',
        'AWS CloudHSM',
        'AWS KMS with imported key material',
        'AWS Secrets Manager with a customer managed KMS key'
      ],
      correctAnswer: 1,
      explanation: 'CloudHSM provides dedicated, single-tenant HSMs in your VPC where only you manage the users and keys, and it supports standard interfaces such as PKCS#11, JCE, and Microsoft CNG. KMS, including keys with imported key material, runs on multi-tenant HSMs managed by AWS and exposes the KMS API rather than PKCS#11. Secrets Manager stores secrets and relies on KMS for encryption.'
    },
    {
      id: 'sec32',
      question: 'A team requested a public certificate from AWS Certificate Manager in eu-west-1 and attached it to an ALB. When they create a CloudFront distribution in front of the ALB, the certificate does not appear in the list for the custom domain. What should they do?',
      options: [
        'Request or import the certificate in ACM in the us-east-1 Region and select it on the distribution',
        'Create a CloudFront origin access control so the distribution can read the eu-west-1 certificate',
        'Rely on CloudFront reusing the ALB certificate for viewer connections automatically',
        'Grant the CloudFront service principal access to the certificate in the KMS key policy'
      ],
      correctAnswer: 0,
      explanation: 'CloudFront only uses ACM certificates from the US East (N. Virginia) us-east-1 Region, so the team needs a certificate in that Region for the viewer side, while the ALB keeps its Regional certificate. Origin access control is for restricting S3 origins, not certificates. CloudFront does not borrow certificates from origins, and ACM certificates are not governed by KMS key policies.'
    },
    {
      id: 'sec33',
      question: 'After an incident in which an engineer made a bucket public, a company wants to guarantee that no S3 bucket in the account can be made public through ACLs or bucket policies, including buckets created in the future. What is the MOST effective control?',
      options: [
        'Enable default encryption with SSE-KMS on every bucket in the account',
        'Enable versioning and MFA Delete on every bucket in the account',
        'Run Amazon Macie daily and remove public access when it finds any',
        'Enable account-level S3 Block Public Access and protect it with an SCP'
      ],
      correctAnswer: 3,
      explanation: 'Account-level S3 Block Public Access overrides any ACL or bucket policy that would grant public access, for all current and future buckets, and an SCP denying s3:PutAccountPublicAccessBlock keeps it from being turned off. Encryption does not stop public reads by authorized principals, versioning protects against deletion rather than exposure, and Macie detects exposure after it has already happened.'
    },
    {
      id: 'sec34',
      question: 'A financial firm must store trade records in S3 in WORM format for 7 years. Regulators require that no user, including the root user, can delete or overwrite the records or shorten the retention during that time. Which configuration meets this requirement?',
      options: [
        'S3 Object Lock in compliance mode with a 7-year default retention period',
        'S3 Object Lock in governance mode with a 7-year default retention period',
        'S3 Versioning with MFA Delete enabled and a bucket policy denying deletes',
        'An S3 Lifecycle rule that transitions objects to S3 Glacier Deep Archive'
      ],
      correctAnswer: 0,
      explanation: 'In compliance mode, a locked object version cannot be overwritten or deleted by any user, including the root user, and its retention period cannot be shortened. Governance mode lets users with s3:BypassGovernanceRetention remove the lock. MFA Delete and bucket policies can be changed by a sufficiently privileged user, and a Lifecycle transition changes storage class without preventing deletion.'
    },
    {
      id: 'sec35',
      question: 'A web application lets paying customers download private reports stored in S3. Customers do not have AWS credentials, and each download link should work only for a short time. Which solution is the MOST secure?',
      options: [
        'Make the report objects public and give them long, randomly generated key names',
        'Create an IAM user for each customer and share access keys through the application',
        'Have the backend generate a presigned URL with a short expiration for each request',
        'Add a bucket policy that allows downloads only from each customer\'s source IP address'
      ],
      correctAnswer: 2,
      explanation: 'A presigned URL carries the permissions of the backend role that signed it and expires after a set time, so the bucket stays private and each link is temporary. Public objects with obscure names can still be found and shared indefinitely. IAM users per customer create unmanageable long-term credentials, and IP-based bucket policies break for mobile users and do not expire.'
    },
    {
      id: 'sec36',
      question: 'A government contractor must store data in Amazon S3 with two independent layers of server-side encryption to satisfy a multi-layer encryption requirement, while keeping keys in AWS KMS. Which option should be configured as the bucket default?',
      options: [
        'SSE-KMS with an S3 Bucket Key enabled',
        'DSSE-KMS with a customer managed KMS key',
        'SSE-S3 combined with S3 Object Lock',
        'SSE-C with keys supplied on each request'
      ],
      correctAnswer: 1,
      explanation: 'DSSE-KMS (dual-layer server-side encryption with KMS keys) applies two independent layers of AES-256 encryption to each object, which is designed for multi-layer encryption mandates. SSE-KMS applies a single layer, and an S3 Bucket Key only reduces KMS request costs. Object Lock adds immutability rather than encryption, and SSE-C is single-layer with keys managed outside KMS.'
    },
    {
      id: 'sec37',
      question: 'After a ransomware incident at a peer company, a CIO wants assurance that backups of EBS volumes and RDS databases cannot be deleted or have their retention shortened, even by an attacker who obtains administrator credentials. What should a solutions architect implement?',
      options: [
        'An IAM policy that denies backup:DeleteRecoveryPoint to all administrator roles',
        'Cross-Region copies of every backup into a second backup vault in the same account',
        'S3 Versioning on the bucket that AWS Backup uses to store recovery points',
        'Store the backups in an AWS Backup vault locked with Vault Lock in compliance mode'
      ],
      correctAnswer: 3,
      explanation: 'Backup Vault Lock in compliance mode makes the vault immutable after its grace period ends, so no user, including the root user, can delete recovery points early, change retention, or remove the lock. An IAM deny can be removed by an attacker with administrator access, and copies in the same account are equally exposed. AWS Backup does not store recovery points in a customer S3 bucket you can version.'
    },
    {
      id: 'sec38',
      question: 'An existing Amazon RDS for MySQL DB instance was created without encryption. The company now requires encryption at rest using a customer managed KMS key. What should a solutions architect do?',
      options: [
        'Take a snapshot, copy it with encryption enabled using the KMS key, and restore a new instance from it',
        'Modify the DB instance, enable encryption at rest, and apply the change during the next maintenance window',
        'Create an encrypted read replica of the instance and promote it to be the new primary',
        'Turn on EBS encryption by default in the Region so the existing storage volumes are encrypted'
      ],
      correctAnswer: 0,
      explanation: 'Encryption at rest cannot be enabled on an existing unencrypted RDS instance, so the supported path is to snapshot it, copy the snapshot with encryption and the KMS key, and restore from the encrypted copy. The modify option does not exist for this setting. You cannot create an encrypted read replica of an unencrypted instance, and EBS encryption by default only affects newly created EBS volumes, not RDS storage.'
    },
    {
      id: 'sec39',
      question: 'A compliance audit requires that all access to a sensitive S3 bucket happens over encrypted connections, and any request made over plain HTTP must be rejected. How should a solutions architect enforce this?',
      options: [
        'Enable default encryption on the bucket with SSE-KMS and a customer managed key',
        'Attach an ACM certificate to the bucket so that it only accepts HTTPS connections',
        'Enable S3 Block Public Access and S3 Object Ownership set to bucket owner enforced',
        'Add a bucket policy that denies all S3 actions when aws:SecureTransport is false'
      ],
      correctAnswer: 3,
      explanation: 'A bucket policy Deny with the condition aws:SecureTransport false rejects any request that is not made over TLS, enforcing encryption in transit. Default encryption protects data at rest, not the connection. ACM certificates cannot be attached to S3 buckets, and Block Public Access and Object Ownership govern public access and ACLs rather than the transport protocol.'
    },
    {
      id: 'sec40',
      question: 'A company must continuously verify that every EBS volume is encrypted, keep a history of configuration changes for auditors, and automatically remediate noncompliant resources across its accounts. Which solution meets these requirements?',
      options: [
        'AWS Config rules with automatic remediation through Systems Manager Automation',
        'AWS CloudTrail with an organization trail and CloudTrail Insights enabled',
        'Amazon Inspector with continuous scanning of all EC2 instances and their volumes',
        'AWS Trusted Advisor security checks with weekly email notifications'
      ],
      correctAnswer: 0,
      explanation: 'AWS Config records resource configuration history, evaluates resources against rules such as encrypted-volumes, and can trigger Systems Manager Automation remediation, and it can be deployed across an organization with conformance packs. CloudTrail records API activity but does not evaluate compliance or remediate. Inspector scans for vulnerabilities, and Trusted Advisor provides periodic checks without configuration history or auto-remediation.'
    }
  ]
};
