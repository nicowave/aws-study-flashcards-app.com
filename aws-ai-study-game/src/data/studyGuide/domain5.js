// Domain 5: Security, Compliance, and Governance for AI (14%)
export const domain5Guide = {
  id: 'domain5',
  name: 'Security, Compliance, and Governance for AI',
  icon: '\u{1F512}',
  color: '#DC143C',
  weight: '14%',
  description: 'Security best practices, compliance frameworks, and governance strategies for AI workloads on AWS.',
  sections: [
    {
      id: 'd5s1',
      title: 'Data Privacy and Encryption',
      content: [
        { type: 'paragraph', text: 'Protecting data is foundational to AI security. AWS provides encryption capabilities for data at rest (stored on disk) and data in transit (moving across the network). Understanding encryption options, key management, and data classification is essential for the exam.' },
        { type: 'keyTerm', term: 'Encryption at Rest', definition: 'Protecting stored data by converting it into an unreadable format using encryption keys. Even if physical storage media is compromised, the data remains inaccessible without the decryption key. Applies to S3 objects, EBS volumes, RDS databases, SageMaker training data, and model artifacts.' },
        { type: 'keyTerm', term: 'Encryption in Transit', definition: 'Protecting data as it moves between systems over a network. Uses protocols like TLS (Transport Layer Security) to encrypt data during transmission. Prevents eavesdropping and man-in-the-middle attacks. All AWS API calls use HTTPS (TLS) by default.' },
        { type: 'keyTerm', term: 'AWS Key Management Service (KMS)', definition: 'A managed service for creating, managing, and controlling encryption keys used to encrypt your data. KMS integrates with most AWS services. You can use AWS managed keys (automatic), customer managed keys (you control rotation and policies), or customer provided keys (SSE-C). Supports automatic annual key rotation.' },
        { type: 'table', headers: ['S3 Encryption Option', 'Key Management', 'When to Use'], rows: [
          ['SSE-S3', 'AWS manages keys entirely', 'Default encryption, simplest option, no additional cost'],
          ['SSE-KMS', 'AWS KMS manages keys, you control policies', 'Need audit trail of key usage, fine-grained access control, regulatory compliance'],
          ['SSE-C', 'Customer provides and manages keys', 'Must manage your own keys outside AWS, full control over key lifecycle'],
          ['Client-Side Encryption', 'Customer encrypts before upload', 'Data must be encrypted before it reaches AWS, strictest compliance needs']
        ]},
        { type: 'bulletList', title: 'Data classification best practices for AI workloads:', items: [
          'Classify training data by sensitivity level (public, internal, confidential, restricted)',
          'Apply appropriate encryption based on classification level',
          'Use AWS Tags to label resources by data classification',
          'Restrict access to sensitive training data using IAM policies and S3 bucket policies',
          'Maintain an inventory of where sensitive data is stored and processed'
        ]},
        { type: 'awsService', name: 'AWS Key Management Service (KMS)', description: 'Centralized service for creating and managing encryption keys. Integrates natively with S3, EBS, SageMaker, Bedrock, and 100+ other AWS services. Provides an audit trail of key usage via CloudTrail. Supports both symmetric and asymmetric keys.' },
        { type: 'examTip', text: 'Know the difference between encryption at rest and in transit. SSE-S3 is the default and simplest, SSE-KMS gives you audit trails and key control, and SSE-C means you manage keys entirely. TLS encrypts data in transit. All SageMaker training jobs and model artifacts can be encrypted with KMS keys.' }
      ]
    },
    {
      id: 'd5s2',
      title: 'IAM and the Shared Responsibility Model',
      content: [
        { type: 'paragraph', text: 'The AWS Shared Responsibility Model defines the boundary between what AWS secures and what the customer must secure. For AI/ML workloads, this boundary is critical to understand. AWS handles the security of the underlying infrastructure, while customers are responsible for securing their data, models, access controls, and application configurations.' },
        { type: 'keyTerm', term: 'Shared Responsibility Model', definition: 'AWS is responsible for security OF the cloud (hardware, networking, facilities, managed service infrastructure). The customer is responsible for security IN the cloud (data, identity management, application configuration, encryption settings, network controls). For AI services, the customer owns data security, model access, and IAM policies.' },
        { type: 'table', headers: ['Responsibility', 'AWS Manages', 'Customer Manages'], rows: [
          ['Infrastructure', 'Physical data centers, hardware, networking, hypervisors', 'VPC configuration, security groups, NACLs, subnet design'],
          ['Compute', 'EC2 host maintenance, SageMaker managed infrastructure', 'OS patching (EC2), container images, custom AMIs'],
          ['AI/ML Services', 'Bedrock infrastructure, SageMaker platform, API availability', 'Model access policies, training data security, endpoint access controls'],
          ['Data', 'Storage durability, physical security of media', 'Encryption settings, access policies, data classification, backup strategy'],
          ['Identity', 'IAM service availability, MFA infrastructure', 'IAM policies, roles, user management, least privilege enforcement'],
          ['Compliance', 'Service certifications (SOC, ISO, HIPAA eligibility)', 'Customer workload compliance, audit logging configuration, data residency']
        ]},
        { type: 'keyTerm', term: 'Principle of Least Privilege', definition: 'Grant only the minimum permissions required for a user, role, or service to perform its intended function. Avoid wildcard (*) permissions. For AI workloads, this means SageMaker execution roles should only access the specific S3 buckets, KMS keys, and ECR repositories they need.' },
        { type: 'keyTerm', term: 'SageMaker Execution Role', definition: 'An IAM role that SageMaker assumes to perform actions on your behalf during training, processing, and inference. It defines what AWS resources (S3 buckets, ECR images, KMS keys, CloudWatch Logs) the SageMaker job can access. Every SageMaker notebook, training job, and endpoint requires an execution role.' },
        { type: 'bulletList', title: 'IAM best practices for AI workloads:', items: [
          'Create separate execution roles per project or team with scoped permissions',
          'Use IAM conditions to restrict access by IP, VPC, time, or MFA status',
          'Enable AWS Organizations Service Control Policies (SCPs) to set permission guardrails',
          'Use resource-based policies on S3 buckets and KMS keys for defense in depth',
          'Regularly audit permissions with IAM Access Analyzer',
          'Avoid embedding credentials in code — use IAM roles instead'
        ]},
        { type: 'keyTerm', term: 'Service-Linked Role', definition: 'A predefined IAM role that is linked directly to an AWS service. The service creates and manages this role automatically. It contains all permissions the service needs to call other AWS services on your behalf. You cannot modify the permissions of a service-linked role.' },
        { type: 'examTip', text: 'The exam will ask you to determine whether AWS or the customer is responsible for a given security task. AWS manages the physical infrastructure and managed service platforms. The customer manages IAM policies, data encryption choices, network configurations, and model access controls. For SageMaker, the customer is responsible for configuring execution roles with least privilege.' }
      ]
    },
    {
      id: 'd5s3',
      title: 'Network Security for AI Workloads',
      content: [
        { type: 'paragraph', text: 'AI workloads often process sensitive data, making network isolation critical. AWS provides mechanisms to keep traffic private, prevent data from traversing the public internet, and isolate training and inference environments within your VPC.' },
        { type: 'keyTerm', term: 'VPC (Virtual Private Cloud)', definition: 'A logically isolated virtual network within AWS where you can launch resources. You control IP addressing, subnets, route tables, and network gateways. Running SageMaker training jobs and endpoints inside a VPC keeps traffic within your private network.' },
        { type: 'keyTerm', term: 'VPC Endpoint', definition: 'A private connection between your VPC and an AWS service that does not traverse the public internet. Two types: Interface Endpoints (powered by PrivateLink, create an ENI in your subnet) and Gateway Endpoints (for S3 and DynamoDB, added to route tables). Eliminates the need for an internet gateway or NAT gateway to access AWS services.' },
        { type: 'keyTerm', term: 'AWS PrivateLink', definition: 'A technology that provides private connectivity between VPCs and AWS services (or your own services) by creating interface VPC endpoints. Traffic stays on the Amazon network and never touches the public internet. Used for SageMaker API calls, Bedrock API calls, and other service interactions.' },
        { type: 'awsService', name: 'VPC Endpoints (Interface & Gateway)', description: 'Interface endpoints create an elastic network interface (ENI) in your subnet with a private IP address. Use them for SageMaker API, SageMaker Runtime, Bedrock, and most AWS services. Gateway endpoints are free and used specifically for S3 and DynamoDB.' },
        { type: 'bulletList', title: 'Network isolation for SageMaker:', items: [
          'Enable VPC mode for training jobs — runs containers inside your VPC subnets',
          'Enable network isolation (internet-free mode) to completely block outbound internet access from training containers',
          'Use VPC endpoints for S3 access so training data never leaves the AWS network',
          'Apply security groups to control inbound and outbound traffic to SageMaker resources',
          'Use NACLs (Network Access Control Lists) as subnet-level stateless firewalls for additional defense',
          'Deploy SageMaker endpoints in private subnets with no internet gateway'
        ]},
        { type: 'keyTerm', term: 'Internet-Free Training Mode', definition: 'A SageMaker network isolation setting that blocks all outbound network access from training containers. The container cannot download packages, call external APIs, or send data to the internet. All code and dependencies must be included in the container image. Critical for protecting sensitive training data from exfiltration.' },
        { type: 'comparison', title: 'Security Groups vs. NACLs', items: [
          { label: 'Security Groups', description: 'Instance-level firewall. Stateful (return traffic is automatically allowed). Default denies all inbound, allows all outbound. Evaluate all rules before deciding. Applied to ENIs attached to instances and endpoints.' },
          { label: 'NACLs (Network ACLs)', description: 'Subnet-level firewall. Stateless (return traffic must be explicitly allowed). Default allows all traffic. Rules evaluated in order by number. Applied to all resources in the subnet.' }
        ]},
        { type: 'examTip', text: 'If a question asks how to prevent training data from leaving your network, the answer involves VPC configuration with VPC endpoints and network isolation mode. PrivateLink keeps API calls off the public internet. Know the difference between interface endpoints (most services) and gateway endpoints (S3 and DynamoDB only).' }
      ]
    },
    {
      id: 'd5s4',
      title: 'Auditing and Monitoring',
      content: [
        { type: 'paragraph', text: 'Continuous auditing and monitoring are essential for maintaining security posture, detecting anomalies, and meeting compliance requirements. AWS provides several services that log, monitor, and evaluate AI/ML workloads in real time.' },
        { type: 'awsService', name: 'AWS CloudTrail', description: 'Records all API calls made in your AWS account as events. Captures who made the call, when, from which IP, and what parameters were used. Essential for security auditing and forensics. For AI workloads, CloudTrail logs every SageMaker API call (CreateTrainingJob, InvokeEndpoint) and Bedrock API call (InvokeModel).' },
        { type: 'awsService', name: 'Amazon CloudWatch', description: 'Monitoring and observability service for AWS resources. Collects metrics (CPU, memory, latency, invocation count), stores logs, and triggers alarms. For AI workloads: monitors SageMaker endpoint latency and error rates, training job GPU utilization, and model inference metrics.' },
        { type: 'awsService', name: 'AWS Config', description: 'Continuously evaluates the configuration of your AWS resources against desired settings (Config Rules). Records configuration changes over time. For AI security: ensures S3 buckets storing training data have encryption enabled, SageMaker endpoints are in a VPC, and KMS keys have proper rotation policies.' },
        { type: 'awsService', name: 'AWS Audit Manager', description: 'Automates evidence collection for compliance audits. Maps AWS resource configurations and CloudTrail logs to compliance frameworks (SOC 2, HIPAA, GDPR, ISO 27001). Generates audit-ready reports. Reduces manual effort in proving compliance for AI workloads.' },
        { type: 'numberedList', title: 'Setting up monitoring for AI workloads:', items: [
          'Enable CloudTrail in all regions and store logs in a centralized, encrypted S3 bucket',
          'Create CloudWatch alarms for SageMaker endpoint errors, latency spikes, and invocation anomalies',
          'Enable AWS Config rules to enforce encryption, VPC attachment, and tagging on ML resources',
          'Use CloudWatch Logs Insights to query and analyze SageMaker training logs and inference logs',
          'Set up CloudWatch dashboards to visualize key ML metrics in a single view',
          'Configure SNS notifications for critical alarm thresholds'
        ]},
        { type: 'keyTerm', term: 'Model Monitoring', definition: 'The practice of tracking a deployed model\'s performance and data quality over time. Detects data drift (input data distribution changes), model drift (prediction quality degrades), bias drift (fairness metrics shift), and feature attribution drift. SageMaker Model Monitor automates this with scheduled monitoring jobs.' },
        { type: 'awsService', name: 'Amazon SageMaker Model Monitor', description: 'Automatically monitors deployed models for data quality, model quality, bias, and feature attribution drift. Compares incoming inference data against a baseline and triggers CloudWatch alarms when violations are detected. Supports real-time and batch monitoring.' },
        { type: 'examTip', text: 'CloudTrail is for API call auditing (who did what and when). CloudWatch is for metrics, logs, and alarms (how is the system performing). AWS Config is for configuration compliance (are resources configured correctly). Know that CloudTrail logs every SageMaker and Bedrock API call — this is the primary service for security auditing.' }
      ]
    },
    {
      id: 'd5s5',
      title: 'Sensitive Data Protection',
      content: [
        { type: 'paragraph', text: 'AI workloads frequently process personally identifiable information (PII), protected health information (PHI), and other sensitive data. AWS provides services to discover, classify, and protect sensitive data throughout the ML lifecycle. Understanding data anonymization techniques is also important for the exam.' },
        { type: 'awsService', name: 'Amazon Macie', description: 'An ML-powered data security service that automatically discovers, classifies, and protects sensitive data stored in Amazon S3. Macie identifies PII (names, addresses, credit card numbers, SSNs), PHI, credentials, and API keys. It generates findings with severity ratings and integrates with Security Hub for centralized alerts.' },
        { type: 'awsService', name: 'Amazon Inspector', description: 'An automated vulnerability management service that continuously scans EC2 instances, container images (in ECR), and Lambda functions for software vulnerabilities and unintended network exposure. For AI workloads, it scans custom training container images for known CVEs and configuration issues.' },
        { type: 'keyTerm', term: 'Data Anonymization', definition: 'The process of irreversibly removing or modifying personally identifiable information so that individuals cannot be re-identified. Techniques include data masking (replacing values with fictional data), generalization (broadening values, e.g., exact age to age range), and suppression (removing fields entirely). Once anonymized, data is no longer considered personal data under most regulations.' },
        { type: 'keyTerm', term: 'Pseudonymization', definition: 'Replacing identifiable fields with artificial identifiers (pseudonyms) while keeping a separate mapping table that can restore the original values. Unlike anonymization, pseudonymization is reversible with the mapping key. Data is still considered personal data under GDPR because re-identification is possible.' },
        { type: 'keyTerm', term: 'Differential Privacy', definition: 'A mathematical framework that adds calibrated noise to data or query results to protect individual privacy while preserving statistical utility. Provides a provable guarantee that the presence or absence of any single individual in the dataset does not significantly change the output. Used in aggregate analytics and model training.' },
        { type: 'bulletList', title: 'Sensitive data protection strategies for AI:', items: [
          'Use Amazon Macie to scan S3 buckets before using data for training — identify and handle PII',
          'Apply data masking or tokenization to sensitive fields before training',
          'Use Amazon Comprehend PII detection to redact PII from text data in real time',
          'Implement differential privacy techniques when training models on sensitive datasets',
          'Use Amazon Transcribe automatic content redaction for PII in audio data',
          'Store anonymization mapping tables separately with strict access controls',
          'Encrypt all training data and model artifacts with KMS keys'
        ]},
        { type: 'comparison', title: 'Anonymization vs. Pseudonymization', items: [
          { label: 'Anonymization', description: 'Irreversible. Cannot recover original data. Data is no longer personal data under GDPR. Techniques: masking, generalization, suppression, aggregation. Lower utility but stronger privacy.' },
          { label: 'Pseudonymization', description: 'Reversible with a mapping key. Data is still personal data under GDPR. Techniques: tokenization, encryption, hashing with salt. Higher utility but requires protecting the mapping key.' }
        ]},
        { type: 'examTip', text: 'Amazon Macie is the go-to service for discovering PII in S3 buckets. Know that Macie uses ML to classify sensitive data automatically. For PII detection in text, Amazon Comprehend also offers PII entity detection. Anonymization is irreversible; pseudonymization is reversible with a key — the exam tests this distinction.' }
      ]
    },
    {
      id: 'd5s6',
      title: 'Model Governance and Security Threats',
      content: [
        { type: 'paragraph', text: 'Model governance ensures that AI models are documented, tracked, and managed throughout their lifecycle. Security threats against AI systems are also an important exam topic. Understanding both governance practices and adversarial threats is critical for building secure, auditable AI systems.' },
        { type: 'keyTerm', term: 'SageMaker Model Cards', definition: 'Standardized documentation for machine learning models that captures the model\'s intended use, training details, evaluation metrics, ethical considerations, and limitations. Model Cards promote transparency and accountability by providing stakeholders with essential information about how a model was built and how it should (and should not) be used.' },
        { type: 'keyTerm', term: 'Model Lineage Tracking', definition: 'Recording the complete history of a model including data sources, preprocessing steps, training parameters, code versions, and evaluation results. SageMaker ML Lineage Tracking automatically captures this information as a connected graph of artifacts, actions, and contexts. Essential for reproducibility and audit compliance.' },
        { type: 'awsService', name: 'Amazon SageMaker Model Registry', description: 'A centralized repository for managing model versions, tracking approval status, and deploying models to production. Supports model versioning, metadata tracking, and approval workflows (Pending, Approved, Rejected). Integrates with CI/CD pipelines for automated model deployment.' },
        { type: 'bulletList', title: 'Model governance best practices:', items: [
          'Create Model Cards for every production model documenting purpose, limitations, and ethical considerations',
          'Use SageMaker Model Registry to track all model versions with metadata and approval status',
          'Enable ML Lineage Tracking to maintain a complete audit trail from data to deployed model',
          'Implement approval workflows requiring human review before models are deployed to production',
          'Conduct regular model reviews to assess performance, fairness, and continued appropriateness',
          'Maintain a model inventory cataloging all models in production with their owners and use cases',
          'Version control all training code, configuration, and pipeline definitions'
        ]},
        { type: 'keyTerm', term: 'Prompt Injection', definition: 'An attack where malicious instructions are embedded in user inputs or external data to manipulate a foundation model\'s behavior. Direct prompt injection inserts instructions directly in the user message. Indirect prompt injection hides instructions in retrieved documents, web pages, or emails that the model processes via RAG or agents.' },
        { type: 'keyTerm', term: 'Adversarial Attack', definition: 'An attack that modifies input data in subtle ways (often imperceptible to humans) to cause an ML model to make incorrect predictions. For example, adding carefully crafted noise to an image that causes a classifier to misidentify it. Adversarial examples exploit vulnerabilities in how models learn decision boundaries.' },
        { type: 'table', headers: ['Threat', 'Description', 'Mitigation'], rows: [
          ['Direct Prompt Injection', 'User inserts malicious instructions in their prompt to override system instructions', 'Input validation, system prompt hardening, guardrails, output filtering'],
          ['Indirect Prompt Injection', 'Malicious instructions hidden in external data (documents, web pages) that the model retrieves', 'Sanitize retrieved content, limit model permissions, use Bedrock Guardrails'],
          ['Model Poisoning', 'Attacker corrupts the training data or training process to embed backdoors or biases in the model', 'Validate training data sources, monitor training metrics for anomalies, use trusted data pipelines'],
          ['Data Poisoning', 'Injecting malicious samples into the training dataset to degrade model performance or introduce targeted errors', 'Data validation, anomaly detection in training data, provenance tracking'],
          ['Model Extraction', 'Attacker queries a deployed model extensively to reconstruct or steal the model\'s knowledge', 'Rate limiting, query monitoring, access controls on inference endpoints'],
          ['Membership Inference', 'Attacker determines whether a specific data point was in the training dataset, potentially revealing private information', 'Differential privacy, regularization, output probability rounding']
        ]},
        { type: 'awsService', name: 'Amazon Bedrock Guardrails', description: 'A feature that applies configurable safeguards to foundation model interactions. Filters harmful content, blocks denied topics, redacts PII, and controls hallucinations with grounding checks. Helps mitigate prompt injection by enforcing content policies on both inputs and outputs.' },
        { type: 'examTip', text: 'SageMaker Model Cards are the primary AWS tool for model governance documentation. Know the difference between direct prompt injection (user inputs) and indirect prompt injection (hidden in retrieved data). Model poisoning targets the training process, while data poisoning targets the training data. Bedrock Guardrails is the managed solution for content filtering and prompt safety.' }
      ]
    }
  ]
};
