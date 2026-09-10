// Domain 2: Security and Compliance (30% of exam)
// CLF-C02 Exam Content

export const securityCompliance = {
  id: 'security-compliance',
  name: 'Security & Compliance',
  icon: '🔒',
  weight: '30%',
  color: '#f85149',
  description: 'AWS shared responsibility model, security services, and compliance concepts',
  questions: [
    {
      id: 'sc1',
      question: 'A newly hired cloud engineer asks which security tasks the company can hand off entirely to AWS after moving its workloads onto EC2. Under the Shared Responsibility Model, which task is AWS\'s responsibility?',
      options: [
        'Configuring the security group rules attached to each EC2 instance',
        'Choosing to enable encryption for the data stored on EBS volumes',
        'Securing the physical data centers and replacing failed host hardware',
        'Managing IAM permissions for the engineers who operate the workloads'
      ],
      correctAnswer: 2,
      explanation: 'AWS owns security OF the cloud: physical facilities, host hardware, and the infrastructure software that runs AWS services. Security group rules, encryption choices, and IAM permissions are all customer-controlled settings — security IN the cloud — so they cannot be handed off to AWS.'
    },
    {
      id: 'sc2',
      question: 'A startup\'s five engineers all sign in to AWS with the same shared credentials and can access every service. The CTO wants each engineer to have an individual identity with fine-grained permissions controlling exactly which AWS services and resources they can use. Which service provides this?',
      options: [
        'AWS Identity and Access Management (IAM)',
        'Amazon GuardDuty',
        'AWS Systems Manager',
        'Amazon Cognito'
      ],
      correctAnswer: 0,
      explanation: 'IAM lets you create individual users, organize them with groups and roles, and attach policies that allow or deny specific actions on specific resources. Cognito manages identity for an application\'s end customers rather than for people accessing AWS itself, GuardDuty detects threats, and Systems Manager handles operational tasks like patching and run commands.'
    },
    {
      id: 'sc3',
      question: 'An IAM user\'s password was stolen in a phishing attack, yet the attacker still failed to sign in to the AWS Management Console with it. Which control most likely blocked the sign-in?',
      options: [
        'A password policy requiring rotation every 90 days',
        'An IAM permissions boundary attached to the user',
        'CloudTrail logging of all console sign-in events',
        'Multi-factor authentication requiring a code from the user\'s device'
      ],
      correctAnswer: 3,
      explanation: 'MFA requires something the user has (a device-generated code or security key) in addition to something they know, so a stolen password alone is not enough to sign in. Password rotation does not stop a currently valid stolen password, a permissions boundary only limits what a user can do after signing in, and CloudTrail records events without blocking anything.'
    },
    {
      id: 'sc4',
      question: 'An e-commerce site running behind an Application Load Balancer is hit by a massive SYN flood that threatens to take it offline. Which AWS service is purpose-built to detect and mitigate this kind of DDoS attack?',
      options: [
        'AWS Config',
        'AWS Shield',
        'Amazon Macie',
        'AWS Secrets Manager'
      ],
      correctAnswer: 1,
      explanation: 'AWS Shield is the DDoS protection service: Shield Standard automatically defends all customers against common network- and transport-layer attacks like SYN floods at no cost, and Shield Advanced adds enhanced protections for a fee. Config tracks resource configurations, Macie discovers sensitive data in S3, and Secrets Manager stores credentials — none of them mitigate DDoS traffic.'
    },
    {
      id: 'sc5',
      question: 'A new data analyst joins a company and only needs to run read-only queries against one specific database. Applying the principle of least privilege, what access should the analyst be granted?',
      options: [
        'The AdministratorAccess managed policy, to avoid repeated permission requests',
        'Full access to every analytics service in case their duties expand later',
        'Read-only permissions scoped to the specific database the job requires',
        'No permissions at all until the analyst passes an annual security review'
      ],
      correctAnswer: 2,
      explanation: 'Least privilege means granting only the minimum permissions needed to perform the task at hand — here, read-only access to one database — and expanding deliberately if duties change. Broad "just in case" grants enlarge the blast radius of mistakes or compromised credentials, while granting nothing at all blocks legitimate work; the principle is minimum necessary, not zero.'
    },
    {
      id: 'sc6',
      question: 'Overnight, an EC2 instance begins contacting domains associated with cryptocurrency mining, and API calls appear from an IP address in an unusual location. Which service continuously analyzes CloudTrail events, VPC Flow Logs, and DNS logs to automatically flag this kind of behavior?',
      options: [
        'Amazon GuardDuty',
        'AWS WAF',
        'AWS Artifact',
        'AWS Config'
      ],
      correctAnswer: 0,
      explanation: 'GuardDuty is AWS\'s intelligent threat detection service: it continuously analyzes CloudTrail, VPC Flow Logs, and DNS query logs and raises findings for behavior like crypto-mining activity or anomalous API calls. WAF filters incoming web requests rather than detecting compromise, Config tracks configuration changes, and Artifact provides compliance documents.'
    },
    {
      id: 'sc7',
      question: 'During a vendor assessment, a company\'s auditors request AWS\'s latest SOC and ISO certification reports as evidence of AWS\'s own security controls. Where can the company download these documents on demand?',
      options: [
        'The AWS Health Dashboard',
        'AWS Trusted Advisor',
        'The AWS Marketplace',
        'AWS Artifact'
      ],
      correctAnswer: 3,
      explanation: 'AWS Artifact is the self-service portal for downloading AWS\'s compliance reports (SOC, ISO, PCI, and others) and reviewing agreements. The Health Dashboard reports service events and account impact, Trusted Advisor gives best-practice recommendations, and the Marketplace sells third-party software — none of them distribute AWS\'s audit reports.'
    },
    {
      id: 'sc8',
      question: 'After a security incident, a team must reconstruct exactly how a security group\'s rules changed over the past month and review the configuration history of related resources. Which service records this information?',
      options: [
        'Amazon CloudWatch',
        'AWS Config',
        'AWS CloudTrail',
        'AWS Trusted Advisor'
      ],
      correctAnswer: 1,
      explanation: 'AWS Config records the configuration state of resources over time, letting you see what a security group looked like at any point and how it changed. CloudTrail is the closest distractor — it logs the API calls that made changes but does not assemble a resource\'s configuration timeline. CloudWatch handles metrics and logs, and Trusted Advisor offers best-practice checks.'
    },
    {
      id: 'sc9',
      question: 'An external auditing firm needs temporary access to review resources in a company\'s AWS account, and the security team refuses to create long-term credentials for the auditors. Which IAM feature best fits this requirement?',
      options: [
        'An IAM group with a shared password issued to the auditing firm',
        'An IAM user whose access keys are emailed to the audit team',
        'An IAM role the auditors\' own account can assume for temporary credentials',
        'A service control policy applied to the auditors\' organization'
      ],
      correctAnswer: 2,
      explanation: 'An IAM role is an identity that trusted entities — including users in another AWS account — can assume to receive temporary, automatically expiring credentials, which is exactly what cross-account auditor access calls for. IAM groups have no sign-in credentials of their own, emailed long-term access keys are the risk the team is avoiding, and service control policies restrict permissions in an organization rather than granting access.'
    },
    {
      id: 'sc10',
      question: 'A compliance team requires that the encryption keys protecting data in S3 and on EBS volumes be created and controlled by the company, with every use of each key logged for auditors. Which service meets this requirement?',
      options: [
        'AWS Key Management Service (KMS)',
        'AWS Secrets Manager',
        'AWS Certificate Manager',
        'Amazon Macie'
      ],
      correctAnswer: 0,
      explanation: 'KMS lets you create and manage customer managed keys, integrates with services like S3 and EBS for encryption, and records every key usage in CloudTrail for auditing. Secrets Manager stores and rotates credentials rather than encryption keys, Certificate Manager handles TLS certificates, and Macie discovers sensitive data instead of encrypting it.'
    },
    {
      id: 'sc11',
      question: 'A critical kernel vulnerability is announced affecting the Linux distribution running on a company\'s fleet of EC2 instances. Under the Shared Responsibility Model, who must ensure the operating systems on those instances get patched?',
      options: [
        'AWS, which applies the patch automatically to every EC2 instance',
        'AWS Support, once the company opens a support case requesting it',
        'No one — the hypervisor isolation makes guest OS patching unnecessary',
        'The customer, for example by automating updates with Systems Manager Patch Manager'
      ],
      correctAnswer: 3,
      explanation: 'On EC2 the customer controls the guest operating system, so patching it — and everything installed on it — is the customer\'s responsibility; AWS patches only the underlying host infrastructure. AWS never reaches inside customer instances to apply updates, with or without a support case, and hypervisor isolation does not fix vulnerabilities inside the guest OS.'
    },
    {
      id: 'sc12',
      question: 'A media site delivered through CloudFront must block requests originating from specific countries and throttle any IP address that exceeds a request-rate threshold. Which service applies these rules at the web request level?',
      options: [
        'AWS Shield Standard',
        'AWS WAF',
        'Amazon GuardDuty',
        'AWS Network Firewall'
      ],
      correctAnswer: 1,
      explanation: 'AWS WAF inspects individual HTTP(S) requests on CloudFront, Application Load Balancers, and API Gateway, and supports geographic match rules and rate-based rules that do exactly this. Shield Standard mitigates network-layer DDoS automatically but offers no configurable request rules, GuardDuty detects threats rather than blocking traffic, and Network Firewall filters VPC network traffic, not CloudFront web requests.'
    },
    {
      id: 'sc13',
      question: 'A cloud administrator\'s IAM user has the AdministratorAccess managed policy attached, yet one task still cannot be completed with it. Which task requires signing in as the account root user?',
      options: [
        'Closing the AWS account or changing the root user\'s email address',
        'Launching EC2 instances in a Region the company has not used before',
        'Creating additional IAM users and attaching policies to them',
        'Viewing the account\'s charges in the Billing and Cost Management console'
      ],
      correctAnswer: 0,
      explanation: 'A small set of account-level tasks — such as closing the account and changing the root user\'s email or password — can only be performed by the root user, which is why its credentials should be locked away and protected with MFA. Launching instances and managing IAM are ordinary admin actions, and billing information can be viewed by IAM identities once IAM access to billing is activated.'
    },
    {
      id: 'sc14',
      question: 'A security administrator manages dozens of AWS accounts in one organization and must ensure consistent WAF rules and security group policies are applied to every account automatically — including accounts created in the future. Which service is designed for this?',
      options: [
        'AWS Security Hub',
        'Amazon Detective',
        'AWS Firewall Manager',
        'AWS Resource Access Manager'
      ],
      correctAnswer: 2,
      explanation: 'AWS Firewall Manager centrally defines and enforces firewall policies — WAF rules, Shield Advanced protections, security group policies, and Network Firewall rules — across all accounts in an AWS Organization, automatically covering new accounts and resources as they appear. Security Hub aggregates security findings but does not push firewall rules, Detective helps investigate findings, and Resource Access Manager shares resources between accounts.'
    },
    {
      id: 'sc15',
      question: 'A web server on an EC2 instance must accept HTTPS traffic from anywhere but allow SSH only from the office\'s IP address, and return traffic for allowed connections should be permitted automatically. Where should these rules be configured?',
      options: [
        'In a network ACL attached to the subnets of the VPC',
        'In an AWS WAF web ACL associated with the instance',
        'In an IAM policy attached to the instance\'s role',
        'In the security group attached to the instance'
      ],
      correctAnswer: 3,
      explanation: 'Security groups are stateful virtual firewalls at the instance level: you allow inbound HTTPS from 0.0.0.0/0 and SSH from the office IP, and response traffic is permitted automatically. Network ACLs work at the subnet level and are stateless, so return traffic would need explicit rules; WAF associates with resources like CloudFront and load balancers, not directly with instances; and IAM policies govern API permissions, not network traffic.'
    },
    {
      id: 'sc16',
      question: 'How do Network ACLs differ from Security Groups?',
      options: [
        'Network ACLs are stateful and apply per instance; Security Groups are stateless and apply per subnet',
        'Network ACLs are stateless and filter traffic at the subnet level; Security Groups are stateful and filter at the instance level',
        'Network ACLs encrypt traffic; Security Groups compress it',
        'They are identical features with different names'
      ],
      correctAnswer: 1,
      explanation: 'NACLs operate at the subnet boundary, are stateless (return traffic needs explicit rules), and support allow and deny rules. Security Groups attach to instances, are stateful, and only have allow rules. Neither encrypts or compresses traffic.'
    },
    {
      id: 'sc17',
      question: 'An application on an EC2 instance needs to read from an S3 bucket. What is the recommended way to grant this access?',
      options: [
        'Store an IAM user\'s access keys in the application\'s config file',
        'Attach an IAM role to the EC2 instance with a policy allowing S3 read access',
        'Make the S3 bucket public so no credentials are needed',
        'Share the root user\'s credentials with the application'
      ],
      correctAnswer: 1,
      explanation: 'IAM roles provide temporary, automatically rotated credentials to the instance — no secrets stored in code or config. Hard-coded access keys leak, public buckets expose data to everyone, and root credentials should never be used by applications.'
    },
    {
      id: 'sc18',
      question: 'Twelve developers all need identical permissions to the same AWS services. What is the recommended way to manage this?',
      options: [
        'Attach the policy to an IAM group and add the twelve users to the group',
        'Attach twelve copies of the policy, one to each user individually',
        'Have all twelve developers share one IAM user',
        'Give all twelve the root user password'
      ],
      correctAnswer: 0,
      explanation: 'IAM groups apply a policy once to many users — changing team permissions means editing one group, not twelve users. Per-user policy copies drift out of sync, shared IAM users destroy accountability, and sharing root credentials is the gravest IAM anti-pattern.'
    },
    {
      id: 'sc19',
      question: 'What are IAM access keys used for?',
      options: [
        'Signing in to the AWS Management Console in a browser',
        'Programmatic access to AWS via the CLI, SDKs, or APIs',
        'Encrypting EBS volumes',
        'Physically unlocking AWS data centers'
      ],
      correctAnswer: 1,
      explanation: 'Access keys (an access key ID plus secret) authenticate programmatic calls from the CLI, SDKs, and direct API requests. Console sign-in uses a password (ideally with MFA), volume encryption uses KMS keys, and data-center physical security is AWS\'s responsibility.'
    },
    {
      id: 'sc20',
      question: 'Which set of practices should be applied to the AWS account root user?',
      options: [
        'Enable MFA, use a strong unique password, avoid daily use, and create IAM identities for routine work',
        'Share it with the operations team for convenience',
        'Embed its credentials in deployment scripts for reliability',
        'Delete the root user entirely once IAM users exist'
      ],
      correctAnswer: 0,
      explanation: 'The root user has unrestricted power, so it gets MFA and a strong password, is reserved for the few tasks that require it, and daily work happens through IAM identities. It cannot be deleted, and sharing or embedding its credentials creates catastrophic risk.'
    },
    {
      id: 'sc21',
      question: 'A security team must determine which user deleted a production S3 bucket last Tuesday. Which service holds this record?',
      options: ['Amazon CloudWatch', 'AWS CloudTrail', 'AWS Cost Explorer', 'Amazon Inspector'],
      correctAnswer: 1,
      explanation: 'CloudTrail records API activity — who called what action, when, and from where — making it the source for "who did this" investigations. CloudWatch tracks metrics and logs for monitoring, Cost Explorer analyzes spending, and Inspector scans for vulnerabilities.'
    },
    {
      id: 'sc22',
      question: 'A compliance rule requires that all EBS volumes be encrypted, and the team needs continuous detection of any resource that drifts out of compliance. Which service does this?',
      options: ['AWS Config with compliance rules', 'Amazon Route 53', 'AWS Batch', 'Amazon Polly'],
      correctAnswer: 0,
      explanation: 'AWS Config continuously records resource configurations and evaluates them against rules, flagging noncompliant resources (like unencrypted volumes) as they appear. Route 53 is DNS, Batch runs compute jobs, and Polly is text-to-speech.'
    },
    {
      id: 'sc23',
      question: 'Which service automatically scans EC2 instances and container images for software vulnerabilities and unintended network exposure?',
      options: ['Amazon Macie', 'AWS Shield', 'Amazon Inspector', 'AWS Artifact'],
      correctAnswer: 2,
      explanation: 'Amazon Inspector continually scans workloads (EC2, ECR images, Lambda) for known vulnerabilities and network reachability issues. Macie discovers sensitive data in S3, Shield mitigates DDoS attacks, and Artifact serves compliance documents.'
    },
    {
      id: 'sc24',
      question: 'A company suspects some S3 buckets contain unprotected personally identifiable information (PII). Which service uses ML to discover and classify such sensitive data?',
      options: ['Amazon Macie', 'AWS WAF', 'Amazon GuardDuty', 'AWS KMS'],
      correctAnswer: 0,
      explanation: 'Macie applies machine learning and pattern matching to find sensitive data (PII, credentials, financial data) in S3 and reports exposure risks. WAF filters web traffic, GuardDuty detects threats from activity logs, and KMS manages encryption keys.'
    },
    {
      id: 'sc25',
      question: 'A database password is hard-coded in application source code, and policy now requires automatic rotation. Which service solves both problems?',
      options: ['AWS Secrets Manager', 'Amazon SNS', 'AWS CloudFormation', 'S3 Versioning'],
      correctAnswer: 0,
      explanation: 'Secrets Manager stores credentials centrally, applications retrieve them at runtime via API, and built-in rotation updates passwords on a schedule (with native RDS integration). SNS sends notifications, CloudFormation provisions infrastructure, and versioning preserves S3 object history.'
    },
    {
      id: 'sc26',
      question: 'A team needs free public SSL/TLS certificates for its load-balanced website, with automatic renewal. Which service provides this?',
      options: ['AWS Certificate Manager (ACM)', 'AWS KMS', 'Amazon Cognito', 'AWS IAM'],
      correctAnswer: 0,
      explanation: 'ACM issues and automatically renews public TLS certificates at no cost for use with AWS services like ELB and CloudFront. KMS manages encryption keys (not certificates), Cognito handles app user identity, and IAM manages AWS access.'
    },
    {
      id: 'sc27',
      question: 'What is the standard way to protect data in transit between users and an AWS-hosted application?',
      options: [
        'TLS/SSL encryption (HTTPS) for all connections',
        'Storing the data in a private subnet',
        'Enabling S3 versioning',
        'Using larger EC2 instances'
      ],
      correctAnswer: 0,
      explanation: 'Data in transit is protected by encrypting the connection itself with TLS (HTTPS). Private subnets control network placement, versioning protects stored object history, and instance size has nothing to do with transport security.'
    },
    {
      id: 'sc28',
      question: 'What is the difference between AWS Shield Standard and Shield Advanced?',
      options: [
        'Standard is automatic and free for all customers; Advanced is a paid tier with enhanced DDoS protections, visibility, and response support',
        'Standard protects EC2 only; Advanced protects S3 only',
        'Standard is for on-premises servers; Advanced is for cloud servers',
        'They differ only in name'
      ],
      correctAnswer: 0,
      explanation: 'Shield Standard defends all AWS customers against common network-layer DDoS attacks automatically and free. Shield Advanced adds enhanced detection, application-layer protections, cost protection during attacks, and access to the Shield Response Team — for a subscription fee.'
    },
    {
      id: 'sc29',
      question: 'A security team is overwhelmed checking findings separately in GuardDuty, Inspector, and Macie. Which service aggregates security findings into a single consolidated view?',
      options: ['AWS Security Hub', 'AWS Budgets', 'Amazon EventBridge', 'AWS Snowball'],
      correctAnswer: 0,
      explanation: 'Security Hub collects and prioritizes findings from AWS security services (and partner tools) in one dashboard and scores your posture against standards like CIS. Budgets tracks spending, EventBridge routes events, and Snowball transfers data.'
    },
    {
      id: 'sc30',
      question: 'A mobile app needs user sign-up, sign-in, and social login (Google/Apple) for its own customers. Which service is designed for this?',
      options: ['AWS IAM', 'Amazon Cognito', 'AWS Directory Service', 'AWS Organizations'],
      correctAnswer: 1,
      explanation: 'Cognito manages application end-user identity: registration, authentication, social and enterprise federation, and token issuance. IAM governs access to AWS resources for builders and workloads — not app customers; Directory Service hosts Microsoft AD, and Organizations manages AWS accounts.'
    },
    {
      id: 'sc31',
      question: 'A company wants its employees to sign in once and access all of its AWS accounts and business applications with centrally managed permissions. Which service provides this?',
      options: ['AWS IAM Identity Center (successor to AWS SSO)', 'Amazon GuardDuty', 'AWS WAF', 'Amazon Detective'],
      correctAnswer: 0,
      explanation: 'IAM Identity Center provides workforce single sign-on across multiple AWS accounts and SAML applications, with centralized permission sets. GuardDuty detects threats, WAF filters web requests, and Detective investigates security findings.'
    },
    {
      id: 'sc32',
      question: 'A customer wants to run penetration tests against their own EC2-hosted applications. What is AWS\'s policy?',
      options: [
        'Penetration testing is never allowed on AWS',
        'Customers may test a defined list of their own services (including EC2) without prior approval, within AWS\'s rules',
        'All testing requires a written contract signed by AWS legal',
        'Testing is allowed only in the us-east-1 Region'
      ],
      correctAnswer: 1,
      explanation: 'AWS permits security testing of your own workloads on a list of permitted services (EC2, RDS, Lambda, and others) without pre-approval, provided the rules of engagement are followed — no DoS-style testing, for example. It is neither banned, contract-gated, nor Region-restricted.'
    },
    {
      id: 'sc33',
      question: 'A healthcare company must confirm which AWS services are HIPAA-eligible and download AWS\'s compliance attestations for auditors. Where does it find these?',
      options: [
        'AWS Artifact and the AWS services-in-scope compliance pages',
        'The EC2 spot pricing history',
        'Amazon CloudWatch dashboards',
        'The AWS Marketplace seller guide'
      ],
      correctAnswer: 0,
      explanation: 'AWS Artifact provides on-demand compliance reports (SOC, ISO, PCI) and agreements like the BAA, while AWS\'s compliance pages list which services are in scope for each program. Pricing history, monitoring dashboards, and Marketplace documentation contain no compliance attestations.'
    },
    {
      id: 'sc34',
      question: 'A company\'s S3 bucket was left publicly readable and customer data leaked. Under the Shared Responsibility Model, who is responsible?',
      options: [
        'AWS, because S3 is a managed service',
        'The customer, because configuring bucket access controls is security "in" the cloud',
        'Both equally, splitting any penalties',
        'No one — public buckets are unavoidable'
      ],
      correctAnswer: 1,
      explanation: 'Access configuration of customer data is squarely the customer\'s side of the model — AWS secures the S3 infrastructure, but bucket policies, Block Public Access, and ACLs are customer-controlled settings. AWS even provides guardrails (Block Public Access) to prevent exactly this.'
    },
    {
      id: 'sc35',
      question: 'For which setup does AWS take over operating system patching as part of its responsibility?',
      options: [
        'An EC2 instance running a customer-managed Linux AMI',
        'A managed service like Amazon RDS, where AWS patches the underlying OS and database engine',
        'A customer\'s on-premises servers connected via VPN',
        'Any server, as long as the customer files a support ticket'
      ],
      correctAnswer: 1,
      explanation: 'Responsibility shifts with the service model: on EC2 the customer patches the guest OS, but for managed services like RDS, AWS handles OS and engine patching (the customer manages data, credentials, and settings). On-premises hardware is entirely the customer\'s, ticket or not.'
    },
    {
      id: 'sc36',
      question: 'A German customer stores data in the eu-central-1 (Frankfurt) Region. What does AWS commit regarding that data\'s location?',
      options: [
        'AWS may relocate it to any Region for load balancing',
        'Customer content stays in the chosen Region unless the customer moves it or enables cross-Region features',
        'Data is automatically copied to us-east-1 for backup',
        'Data location depends on which support plan is purchased'
      ],
      correctAnswer: 1,
      explanation: 'Customers choose the Region their content resides in, and AWS does not move or replicate it elsewhere without the customer taking action (such as enabling cross-Region replication). This underpins data-residency compliance; support plans have no effect on data location.'
    },
    {
      id: 'sc37',
      question: 'A bank requires a dedicated, private network connection from its data center to AWS that never traverses the public internet. Which option meets this?',
      options: ['AWS Direct Connect', 'AWS Site-to-Site VPN over the internet', 'Amazon CloudFront', 'A public Elastic IP address'],
      correctAnswer: 0,
      explanation: 'Direct Connect is a dedicated physical link between the customer\'s network and AWS, bypassing the internet for consistent latency and private connectivity. Site-to-Site VPN encrypts traffic but still rides the public internet; CloudFront and Elastic IPs are unrelated to private connectivity.'
    },
    {
      id: 'sc38',
      question: 'Which tasks are examples of the CUSTOMER\'s responsibility "in" the cloud?',
      options: [
        'Maintaining data-center power, cooling, and physical access controls',
        'Replacing failed host hardware and network switches',
        'Classifying data, configuring IAM permissions, and enabling encryption for their content',
        'Global infrastructure design of Regions and Availability Zones'
      ],
      correctAnswer: 2,
      explanation: 'Customers own what they put in the cloud and how it\'s configured: data classification, identity and access management, encryption choices, and application security. Facilities, hardware, and global infrastructure are AWS\'s security "of" the cloud.'
    },
    {
      id: 'sc39',
      question: 'What is the difference between Amazon GuardDuty and Amazon Inspector?',
      options: [
        'GuardDuty detects active threats by analyzing account activity and network logs; Inspector finds software vulnerabilities in workloads before they are exploited',
        'GuardDuty scans code repositories; Inspector reviews AWS bills',
        'GuardDuty is for on-premises only; Inspector is for cloud only',
        'They are identical services sold at different prices'
      ],
      correctAnswer: 0,
      explanation: 'GuardDuty is threat detection — it continuously analyzes CloudTrail, VPC Flow Logs, and DNS logs for signs of compromise. Inspector is vulnerability management — it scans instances and images for known CVEs and exposure. They complement each other rather than overlap.'
    },
    {
      id: 'sc40',
      question: 'Why should encryption keys be rotated periodically, and how does AWS KMS help?',
      options: [
        'Rotation limits how much data any single key version protects, and KMS can rotate keys automatically on a schedule',
        'Rotation makes data permanently unreadable, which improves privacy',
        'Rotation is required to keep the AWS Free Tier active',
        'KMS requires customers to manually re-encrypt all data monthly'
      ],
      correctAnswer: 0,
      explanation: 'Regular rotation reduces the blast radius if a key version is ever compromised. KMS supports automatic annual rotation for customer-managed keys and transparently uses the right version to decrypt older data — no manual re-encryption of existing data and no connection to Free Tier status.'
    },
    {
      id: 'sc41',
      question: 'A new compliance policy requires that every EBS volume created in the account be encrypted by default. What is the simplest way to achieve this?',
      options: [
        'Enable EBS encryption by default at the account/Region level, using a KMS key',
        'Email developers a reminder to tick the encryption box',
        'Encrypt volumes by placing them in a private subnet',
        'Buy a Business support plan, which encrypts volumes automatically'
      ],
      correctAnswer: 0,
      explanation: 'EC2 offers an account-level "encryption by default" setting per Region so every new EBS volume is encrypted with the chosen KMS key automatically — no reliance on human memory. Subnet placement affects network access, not storage encryption, and support plans don\'t change encryption behavior.'
    },
    {
      id: 'sc42',
      question: 'An auditor wants a report showing all IAM users and the status of their passwords, access keys, and MFA devices. Which IAM feature produces this?',
      options: ['The IAM credential report', 'AWS Pricing Calculator', 'S3 Transfer Acceleration', 'EC2 launch templates'],
      correctAnswer: 0,
      explanation: 'IAM generates a downloadable credential report listing every user and the age/status of their credentials and MFA — a standard audit artifact. The other options concern cost estimation, upload speed, and instance provisioning.'
    },
    {
      id: 'sc43',
      question: 'A junior admin\'s IAM policy allows every action on every service, though they only manage EC2 in one Region. Which security principle does this violate, and what is the fix?',
      options: [
        'Least privilege — scope the policy to only the EC2 actions and resources the role actually needs',
        'Elasticity — move the admin to an Auto Scaling group',
        'Durability — replicate the policy across Regions',
        'Consolidated billing — merge the accounts'
      ],
      correctAnswer: 0,
      explanation: 'Granting broad permissions "just in case" violates least privilege; the policy should permit only required actions on required resources, expanding deliberately when needs grow. Elasticity, durability, and billing consolidation are unrelated concepts.'
    },
    {
      id: 'sc44',
      question: 'Which service protects a web application specifically against exploits like SQL injection and cross-site scripting?',
      options: ['AWS WAF with managed or custom rules', 'AWS Shield Standard alone', 'Amazon Macie', 'AWS Direct Connect'],
      correctAnswer: 0,
      explanation: 'WAF inspects HTTP(S) requests and blocks application-layer attack patterns like SQL injection and XSS using rule sets. Shield Standard mitigates network-layer DDoS (not request-content attacks), Macie finds sensitive data, and Direct Connect is private connectivity.'
    }
  ]
};
