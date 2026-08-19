// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels

export const domain5 = {
  id: 'domain5',
  name: 'Security, Compliance, and Governance for AI',
  description: 'AWS security services, compliance strategies, and governance for AI',
  icon: '🔒',
  color: '#16A085',
  gradient: 'linear-gradient(135deg, #16A085 0%, #138D75 100%)',
  source: 'AWS Certified AI Practitioner Exam Guide - Domain 5',
  examWeight: '14%',
  cards: [
    // Task Statement 5.1: Explain AWS services and features for security of AI systems
    {
      id: 'd5c1',
      front: 'What is AWS IAM (Identity and Access Management) and its role in AI security?',
      back: 'Service that controls WHO can access AI services and WHAT actions they can perform.\n\nKey features:\n• Users, Groups, Roles for access control\n• Policies define permissions\n• Least Privilege Principle\n• MFA (Multi-Factor Authentication)\n• Service-to-service permissions\n\nCritical for: Securing AI models, data, and infrastructure',
      hint: 'Controls access to AWS resources',
      tags: ['aws-services', 'iam', 'security', 'access-control'],
      difficulty: 'beginner',
      taskStatement: '5.1'
    },
    {
      id: 'd5c2',
      front: 'How does AWS KMS (Key Management Service) secure AI data?',
      back: 'Managed service for creating and controlling encryption keys.\n\nUses in AI:\n• Encrypt training data at rest\n• Encrypt model artifacts\n• Encrypt inference data\n• Encrypt S3 buckets with datasets\n• Automatic key rotation\n• Audit key usage with CloudTrail\n\nEnsures data confidentiality throughout ML lifecycle',
      hint: 'Encryption key management',
      tags: ['aws-services', 'kms', 'encryption', 'security'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c3',
      front: 'What is Amazon Macie and how does it protect AI data?',
      back: 'Data security service that uses ML to discover, classify, and protect sensitive data in S3.\n\nCapabilities:\n• Automatically discovers PII\n• Identifies sensitive data in training datasets\n• Detects unusual access patterns\n• Generates security findings\n• Compliance monitoring\n\nHelps ensure AI training data doesn\'t contain unexpected sensitive information',
      hint: 'Discovers and protects sensitive data',
      tags: ['aws-services', 'macie', 'data-security', 'pii'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c4',
      front: 'What is AWS CloudTrail\'s role in AI security?',
      back: 'Service that logs all API calls and actions in your AWS account.\n\nAI security uses:\n• Audit who accessed AI models\n• Track training job invocations\n• Monitor inference API calls\n• Detect unauthorized access\n• Compliance reporting\n• Forensic analysis\n• Integration with CloudWatch for alerts\n\nProvides complete audit trail for governance',
      hint: 'API activity logging and auditing',
      tags: ['aws-services', 'cloudtrail', 'auditing', 'compliance'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c5',
      front: 'How does Amazon VPC secure AI workloads?',
      back: 'Virtual Private Cloud - isolated network environment for AI resources.\n\nSecurity features:\n• Network isolation for training jobs\n• Private subnets for sensitive data\n• VPC Endpoints for private AWS service access\n• Security Groups control traffic\n• Network ACLs for subnet-level security\n• No internet exposure for critical workloads\n\nSageMaker and Bedrock support VPC deployments',
      hint: 'Isolated network environment',
      tags: ['aws-services', 'vpc', 'networking', 'isolation'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c6',
      front: 'What is AWS PrivateLink and its use in AI applications?',
      back: 'Service providing private connectivity between VPCs and AWS services without internet exposure.\n\nAI applications:\n• Private access to Bedrock APIs\n• Secure SageMaker endpoint access\n• Keep model inference traffic private\n• Prevent data exfiltration\n• Compliance with data residency\n\nTraffic never traverses public internet',
      hint: 'Private connectivity to AWS services',
      tags: ['aws-services', 'privatelink', 'networking', 'security'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c7',
      front: 'What is AWS Secrets Manager and how does it secure AI credentials?',
      back: 'Service to securely store, retrieve, and rotate secrets.\n\nAI use cases:\n• Store API keys for third-party models\n• Manage database credentials for training data\n• Rotate secrets automatically\n• Audit secret access\n• Integrate with Lambda for AI pipelines\n• Fine-grained access control\n\nPrevents hardcoding credentials in code',
      hint: 'Secure secrets storage and rotation',
      tags: ['aws-services', 'secrets-manager', 'credentials', 'security'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c8',
      front: 'How does AWS Shield protect AI applications?',
      back: 'Managed DDoS (Distributed Denial of Service) protection.\n\nTwo tiers:\n• Shield Standard - automatic, free protection\n• Shield Advanced - enhanced protection, 24/7 support\n\nProtects:\n• AI inference endpoints from DDoS\n• API Gateway for AI services\n• CloudFront distributions serving AI content\n• Application availability\n\nEnsures AI service availability during attacks',
      hint: 'DDoS protection service',
      tags: ['aws-services', 'shield', 'ddos', 'availability'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c9',
      front: 'What is AWS WAF (Web Application Firewall) for AI endpoints?',
      back: 'Firewall that protects web applications and APIs from common attacks.\n\nAI security uses:\n• Protect inference APIs from SQL injection\n• Block malicious requests to AI endpoints\n• Rate limiting to prevent abuse\n• Geo-blocking if needed\n• Custom rules for AI-specific threats\n• Integration with API Gateway, CloudFront\n\nPrevents exploitation of AI services',
      hint: 'Web application firewall',
      tags: ['aws-services', 'waf', 'firewall', 'api-security'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c10',
      front: 'What is Amazon GuardDuty\'s role in AI security?',
      back: 'Intelligent threat detection service using ML.\n\nAI security monitoring:\n• Detects unauthorized access to S3 training data\n• Identifies compromised EC2 instances running AI workloads\n• Monitors for data exfiltration\n• Detects cryptocurrency mining on AI infrastructure\n• Continuous monitoring of VPC Flow Logs, CloudTrail\n• Automated threat alerts\n\nML-powered security for ML workloads',
      hint: 'Intelligent threat detection',
      tags: ['aws-services', 'guardduty', 'threat-detection', 'monitoring'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    // Task Statement 5.2: Recognize compliance and governance strategies for AI systems
    {
      id: 'd5c11',
      front: 'What is the AWS Shared Responsibility Model for AI/ML?',
      back: 'AWS Responsibility (Security OF the cloud):\n• Physical infrastructure\n• Network infrastructure\n• Managed service infrastructure\n• Foundation model security\n\nCustomer Responsibility (Security IN the cloud):\n• Data encryption\n• Access management (IAM)\n• Model security and monitoring\n• Application security\n• Compliance adherence',
      hint: 'AWS handles infrastructure, you handle data/access',
      tags: ['shared-responsibility', 'security', 'compliance'],
      difficulty: 'beginner',
      taskStatement: '5.2'
    },
    {
      id: 'd5c12',
      front: 'What AI-specific compliance regulations should you consider?',
      back: 'Key regulations:\n• GDPR - EU data protection, right to explanation\n• CCPA - California consumer privacy\n• HIPAA - Healthcare data protection\n• SOC 2 - Service organization controls\n• ISO 27001 - Information security management\n• PCI DSS - Payment card data\n• Industry-specific AI regulations\n• Algorithmic accountability laws\n\nVaries by industry and region',
      hint: 'GDPR, HIPAA, SOC 2, ISO 27001',
      tags: ['compliance', 'regulations', 'governance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c13',
      front: 'What is AWS Artifact and how does it support AI compliance?',
      back: 'On-demand portal for AWS compliance reports and agreements.\n\nProvides:\n• SOC reports (1, 2, 3)\n• PCI DSS attestations\n• ISO certifications\n• GDPR compliance documentation\n• HIPAA Business Associate Addendum (BAA)\n• FedRAMP documentation\n\nHelps demonstrate AWS service compliance for AI workloads',
      hint: 'Compliance reports portal',
      tags: ['aws-services', 'artifact', 'compliance', 'documentation'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c14',
      front: 'What is AWS Config for AI governance?',
      back: 'Service to assess, audit, and evaluate AWS resource configurations.\n\nAI governance uses:\n• Track SageMaker notebook configurations\n• Monitor S3 bucket encryption status\n• Ensure IAM policies meet standards\n• Compliance rule evaluation\n• Configuration history tracking\n• Automated remediation\n• Resource inventory\n\nEnsures AI infrastructure compliance',
      hint: 'Configuration monitoring and compliance',
      tags: ['aws-services', 'config', 'governance', 'compliance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c15',
      front: 'How does AWS Organizations support AI governance?',
      back: 'Service to centrally manage multiple AWS accounts.\n\nAI governance benefits:\n• Separate accounts for dev/test/prod AI workloads\n• Service Control Policies (SCPs) enforce guardrails\n• Consolidated billing for AI costs\n• Centralized CloudTrail for all AI activities\n• Tag policies for resource organization\n• Organizational Units for business structure\n\nEnables scalable AI governance across teams',
      hint: 'Multi-account management and policies',
      tags: ['aws-services', 'organizations', 'governance', 'multi-account'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c16',
      front: 'What are Service Control Policies (SCPs) for AI governance?',
      back: 'Policies in AWS Organizations that set maximum permissions for accounts.\n\nAI governance examples:\n• Prevent deployment of non-approved AI models\n• Restrict AI services to specific regions\n• Enforce encryption for all training data\n• Require tagging for AI resources\n• Block public access to AI endpoints\n• Limit AI instance types\n\nProvide guardrails at organizational level',
      hint: 'Organization-wide permission boundaries',
      tags: ['scp', 'governance', 'policies', 'guardrails'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c17',
      front: 'What is data residency and why does it matter for AI?',
      back: 'Legal requirement that data must be stored in specific geographic locations.\n\nAI considerations:\n• Training data must stay in-region\n• Model artifacts storage location\n• Inference data processing location\n• Compliance with local laws (GDPR, etc.)\n• Use AWS Regions strategically\n• Monitor cross-region data transfer\n\nCritical for regulated industries and international deployments',
      hint: 'Data location requirements',
      tags: ['data-residency', 'compliance', 'governance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c18',
      front: 'How do you implement data governance for AI training data?',
      back: 'Best practices:\n• Data Classification - categorize by sensitivity\n• Access Controls - least privilege via IAM\n• Encryption - at rest and in transit\n• Data Lineage - track data sources and transformations\n• Retention Policies - define data lifecycle\n• Quality Controls - validate data integrity\n• Audit Logging - track data access\n• Privacy Controls - anonymization, de-identification\n\nEnsures responsible and compliant AI development',
      hint: 'Classification, access control, encryption, lineage',
      tags: ['data-governance', 'compliance', 'best-practices'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c19',
      front: 'What is Model Governance in AI systems?',
      back: 'Framework for managing AI models throughout their lifecycle.\n\nComponents:\n• Model Registry - catalog of all models\n• Version Control - track model iterations\n• Approval Workflows - review before deployment\n• Performance Monitoring - track accuracy drift\n• Access Control - who can deploy models\n• Documentation - model cards, metadata\n• Audit Trail - deployment history\n• Retirement Process - decommissioning old models\n\nEnsures accountability and quality',
      hint: 'Managing model lifecycle and quality',
      tags: ['model-governance', 'mlops', 'governance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c20',
      front: 'What compliance documentation should you maintain for AI systems?',
      back: 'Essential documentation:\n• Model Cards - capabilities, limitations, testing\n• Data Provenance - sources and licenses\n• Training Procedures - methodology and parameters\n• Evaluation Results - performance metrics\n• Risk Assessments - identified risks and mitigations\n• Incident Response Plans - handling failures\n• Access Logs - who used the system\n• Change History - all modifications\n• Compliance Attestations - regulatory adherence\n\nCritical for audits and accountability',
      hint: 'Model cards, data sources, training docs, assessments',
      tags: ['documentation', 'compliance', 'governance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    // Additional Domain 5 cards: Inspector, Audit Manager, Trusted Advisor, data lineage,
    // Model Cards, secure data engineering, prompt injection, security scoping, governance, data lifecycle
    {
      id: 'd5c21',
      front: 'What is Amazon Inspector and how does it support AI workload security?',
      back: 'Automated vulnerability management service that continuously scans workloads.\n\nCapabilities:\n• Scans EC2 instances running AI workloads for vulnerabilities\n• Checks container images (ECR) used in ML pipelines\n• Identifies software vulnerabilities (CVEs)\n• Assesses network exposure of AI endpoints\n• Prioritizes findings by severity with a risk score\n• Integrates with Security Hub for centralized findings\n\nEnsures AI infrastructure is free from known security vulnerabilities',
      hint: 'Automated vulnerability scanning',
      tags: ['aws-services', 'inspector', 'vulnerability-management', 'security'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c22',
      front: 'What is AWS Audit Manager and how does it help with AI compliance?',
      back: 'Service that continuously audits AWS usage to simplify risk and compliance assessment.\n\nKey features:\n• Prebuilt frameworks (SOC 2, GDPR, HIPAA, NIST)\n• Automated evidence collection from AWS services\n• Maps AI workload configurations to compliance controls\n• Generates audit-ready reports\n• Custom frameworks for AI-specific governance\n• Tracks compliance status over time\n\nReduces manual effort in preparing for AI system audits',
      hint: 'Automated audit evidence collection',
      tags: ['aws-services', 'audit-manager', 'compliance', 'auditing'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c23',
      front: 'What is AWS Trusted Advisor and how does it apply to AI environments?',
      back: 'Service that provides real-time best practice recommendations across five categories.\n\nCategories:\n• Cost Optimization - right-size AI instances, remove idle resources\n• Performance - optimize training job configurations\n• Security - close open ports, enable MFA, check IAM policies\n• Fault Tolerance - enable backups for model artifacts\n• Service Limits - monitor quotas for SageMaker, Bedrock\n\nActs as an automated best-practice auditor for your AI infrastructure',
      hint: 'Best practice recommendations across five pillars',
      tags: ['aws-services', 'trusted-advisor', 'best-practices', 'optimization'],
      difficulty: 'beginner',
      taskStatement: '5.2'
    },
    {
      id: 'd5c24',
      front: 'Why are source citation and data lineage important for AI governance?',
      back: 'Tracking data origins and transformations ensures transparency and compliance.\n\nKey concepts:\n• Data Lineage - trace data from source through transformations to model\n• Data Cataloging - inventory of datasets with metadata (AWS Glue Data Catalog)\n• Source Citation - document where training data originated\n• Provenance Tracking - record licensing, collection methods, consent\n• Impact Analysis - understand how data changes affect models\n\nCritical for: regulatory audits, bias investigations, reproducing results, and intellectual property compliance',
      hint: 'Track data origins, transformations, and metadata',
      tags: ['data-lineage', 'data-cataloging', 'governance', 'transparency'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c25',
      front: 'What are Amazon SageMaker Model Cards and their role in compliance?',
      back: 'Structured documentation that captures essential information about ML models.\n\nModel Card contents:\n• Model purpose and intended use cases\n• Training details and datasets used\n• Evaluation metrics and results\n• Ethical considerations and limitations\n• Risk ratings and bias analysis\n• Deployment recommendations\n\nCompliance benefits:\n• Standardized documentation for audits\n• Supports regulatory transparency requirements\n• Facilitates model review and approval workflows\n• Exportable for stakeholder review (PDF, JSON)',
      hint: 'Structured model documentation in SageMaker',
      tags: ['aws-services', 'sagemaker', 'model-cards', 'documentation', 'compliance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    },
    {
      id: 'd5c26',
      front: 'What are secure data engineering best practices for AI systems?',
      back: 'Practices that ensure data quality, privacy, and integrity throughout the ML pipeline.\n\nData Quality Assessment:\n• Validate completeness, accuracy, and consistency\n• Detect and handle missing values, outliers, duplicates\n• Implement automated data quality checks in pipelines\n\nPrivacy-Enhancing Technologies (PETs):\n• Differential privacy - add noise to protect individual records\n• Data anonymization and pseudonymization\n• Federated learning - train without centralizing data\n• Tokenization - replace sensitive values with tokens\n\nData Integrity:\n• Checksums to detect corruption\n• Version control for datasets\n• Immutable audit logs of data access',
      hint: 'Quality assessment, privacy tech, integrity controls',
      tags: ['data-engineering', 'data-quality', 'privacy', 'data-integrity', 'security'],
      difficulty: 'advanced',
      taskStatement: '5.1'
    },
    {
      id: 'd5c27',
      front: 'What is prompt injection and why is it a critical AI security threat?',
      back: 'Attack where malicious inputs manipulate an AI model into ignoring instructions or performing unintended actions.\n\nTypes:\n• Direct Injection - user crafts prompts to override system instructions\n• Indirect Injection - malicious content embedded in data the model processes (e.g., web pages, documents)\n\nRisks:\n• Data exfiltration from connected systems\n• Bypassing content safety filters\n• Unauthorized actions via AI agents\n• Reputation damage from harmful outputs\n\nMitigations:\n• Input validation and sanitization\n• Amazon Bedrock Guardrails for content filtering\n• Separate system and user prompt contexts\n• Output monitoring and logging\n• Limit model permissions (least privilege)',
      hint: 'Malicious inputs that override model instructions',
      tags: ['prompt-injection', 'security-threats', 'generative-ai', 'guardrails'],
      difficulty: 'intermediate',
      taskStatement: '5.1'
    },
    {
      id: 'd5c28',
      front: 'What is the Generative AI Security Scoping Matrix?',
      back: 'A governance framework that helps organizations identify and categorize security considerations for generative AI deployments.\n\nPurpose:\n• Map AI use cases to specific security requirements\n• Identify risk levels based on data sensitivity and access scope\n• Determine appropriate controls for each deployment tier\n• Align security measures with business objectives\n\nScoping dimensions:\n• Data classification (public, internal, confidential)\n• User access scope (internal, external, public)\n• Integration level (standalone, connected to systems)\n• Autonomy level (human-in-the-loop vs. automated)\n\nHelps organizations apply proportionate security controls to different AI use cases',
      hint: 'Framework mapping AI use cases to security requirements',
      tags: ['governance-framework', 'security-scoping', 'generative-ai', 'risk-management'],
      difficulty: 'advanced',
      taskStatement: '5.2'
    },
    {
      id: 'd5c29',
      front: 'What governance processes should organizations establish for AI systems?',
      back: 'Structured processes to ensure ongoing oversight and responsible AI use.\n\nReview Cadence:\n• Regular model performance reviews (weekly, monthly)\n• Periodic bias and fairness audits (quarterly)\n• Annual comprehensive risk assessments\n\nReview Strategies:\n• Human-in-the-loop validation for high-risk decisions\n• A/B testing for model updates before full deployment\n• Red team exercises to test safety boundaries\n\nTransparency Standards:\n• Publish model cards and usage guidelines\n• Disclose AI involvement to end users\n• Report known limitations and failure modes\n\nTeam Training:\n• Security awareness for prompt injection threats\n• Responsible AI usage policies\n• Incident response procedures for AI failures',
      hint: 'Review cadence, strategies, transparency, and training',
      tags: ['governance-processes', 'review-cadence', 'transparency', 'team-training'],
      difficulty: 'advanced',
      taskStatement: '5.2'
    },
    {
      id: 'd5c30',
      front: 'What are best practices for AI data lifecycle management?',
      back: 'Managing data throughout its lifecycle ensures security, compliance, and operational visibility.\n\nLogging:\n• CloudTrail for API-level audit trails\n• S3 access logging for training data access\n• Model invocation logging in Bedrock and SageMaker\n\nMonitoring and Observation:\n• CloudWatch metrics and alarms for AI endpoints\n• SageMaker Model Monitor for data drift and quality\n• Amazon OpenSearch or CloudWatch Logs Insights for analysis\n\nRetention:\n• Define retention policies per data classification\n• Automate lifecycle rules (S3 Lifecycle, Glacier archival)\n• Comply with regulatory minimum/maximum retention periods\n• Secure deletion when retention expires\n\nGoal: Full observability from data ingestion through model retirement',
      hint: 'Logging, monitoring, observation, and retention',
      tags: ['data-lifecycle', 'logging', 'monitoring', 'retention', 'governance'],
      difficulty: 'intermediate',
      taskStatement: '5.2'
    }
  ]
};

// Helper functions
export const getAllDecks = () => Object.values({ domain5 });

export const getDeckById = (id) => ({ domain5 })[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values({ domain5 }).forEach(deck => {
    deck.cards.forEach(card => {
      if (card.tags.includes(tag)) {
        allCards.push({ ...card, deckId: deck.id, deckName: deck.name });
      }
    });
  });
  return allCards;
};

export const getCardsByDifficulty = (difficulty) => {
  const allCards = [];
  Object.values({ domain5 }).forEach(deck => {
    deck.cards.forEach(card => {
      if (card.difficulty === difficulty) {
        allCards.push({ ...card, deckId: deck.id, deckName: deck.name });
      }
    });
  });
  return allCards;
};

export const getAllTags = () => {
  const tags = new Set();
  Object.values({ domain5 }).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
