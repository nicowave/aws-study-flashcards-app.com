// Domain 4: Guidelines for Responsible AI
export const domain4 = {
  id: 'domain4',
  name: 'Guidelines for Responsible AI',
  weight: '14%',
  icon: '⚖️',
  color: '#32CD32',
  gradient: 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)',
  questions: [
    {
      id: 'd4q1',
      question: 'What is "bias" in the context of AI/ML?',
      options: [
        'A technical error in code',
        'Systematic errors that lead to unfair outcomes for certain groups',
        'Overfitting on training data',
        'Using too much training data'
      ],
      correct: 1,
      explanation: 'AI bias refers to systematic errors in ML systems that create unfair outcomes, often reflecting historical biases in training data or design choices.'
    },
    {
      id: 'd4q2',
      question: 'Which AWS service helps detect bias in ML models?',
      options: ['AWS CloudTrail', 'Amazon SageMaker Clarify', 'AWS Config', 'Amazon Inspector'],
      correct: 1,
      explanation: 'Amazon SageMaker Clarify helps detect bias in ML models and data, and provides explanations for model predictions to improve transparency.'
    },
    {
      id: 'd4q3',
      question: 'What does "explainability" mean in responsible AI?',
      options: [
        'The ability to document code',
        'Understanding how and why an AI model makes specific decisions',
        'The speed of model training',
        'The cost of running AI systems'
      ],
      correct: 1,
      explanation: 'Explainability refers to the ability to understand and communicate how AI systems make decisions, crucial for trust, compliance, and debugging.'
    },
    {
      id: 'd4q4',
      question: 'What is Amazon Bedrock Guardrails used for?',
      options: [
        'Network security',
        'Implementing safeguards for generative AI applications',
        'Data backup',
        'Cost management'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock Guardrails helps implement customizable safeguards to filter harmful content and ensure AI applications behave appropriately.'
    },
    {
      id: 'd4q5',
      question: 'What is "model transparency" in AI governance?',
      options: [
        'Making model code open source',
        'Clear understanding of what data was used and how the model works',
        'Visual representation of neural networks',
        'Publishing model weights publicly'
      ],
      correct: 1,
      explanation: 'Model transparency involves clearly documenting and communicating what data was used for training, how the model works, and its limitations.'
    },
    {
      id: 'd4q6',
      question: 'What is "data lineage" in the context of responsible AI?',
      options: [
        'The age of the data',
        'Tracking the origin, movement, and transformation of data',
        'The format of stored data',
        'Data encryption methods'
      ],
      correct: 1,
      explanation: 'Data lineage tracks where data comes from, how it transforms, and where it flows, essential for compliance, debugging, and responsible AI practices.'
    },
    {
      id: 'd4q7',
      question: 'Which principle is NOT typically part of responsible AI frameworks?',
      options: ['Fairness', 'Transparency', 'Maximum profit', 'Privacy'],
      correct: 2,
      explanation: 'Responsible AI frameworks typically focus on fairness, transparency, privacy, accountability, and safety - not profit maximization.'
    },
    {
      id: 'd4q8',
      question: 'What is "human-in-the-loop" in AI systems?',
      options: [
        'Manual data entry',
        'Human oversight and intervention capability in AI decision-making',
        'Human resources management',
        'User interface design'
      ],
      correct: 1,
      explanation: 'Human-in-the-loop ensures humans can oversee, validate, and intervene in AI decisions, especially important for high-stakes applications.'
    },
    {
      id: 'd4q9',
      question: 'What is Amazon Augmented AI (Amazon A2I) used for?',
      options: [
        'Automated model training',
        'Building human review workflows into ML applications',
        'Generating synthetic training data',
        'Monitoring model performance'
      ],
      correct: 1,
      explanation: 'Amazon A2I builds human review workflows that route low-confidence predictions to human reviewers. It integrates with Textract, Rekognition, and custom models, supporting private, public, or vendor workforces.'
    },
    {
      id: 'd4q10',
      question: 'Which legal risk is specific to generative AI producing outputs that resemble copyrighted material?',
      options: [
        'Data drift',
        'IP (Intellectual Property) infringement claims',
        'Model latency',
        'Feature attribution drift'
      ],
      correct: 1,
      explanation: 'GenAI may produce outputs resembling copyrighted material, exposing organizations to IP infringement lawsuits. Mitigation includes content filtering, guardrails, disclaimers, and human review for high-stakes outputs.'
    },
    {
      id: 'd4q11',
      question: 'How does choosing a smaller AI model support environmental sustainability?',
      options: [
        'Smaller models are always more accurate',
        'Smaller models require less energy for training and inference, reducing carbon emissions',
        'Smaller models do not require any compute resources',
        'There is no sustainability benefit to smaller models'
      ],
      correct: 1,
      explanation: 'Larger models consume more energy. Right-sizing models, using distilled/quantized architectures, and choosing AWS regions with renewable energy all reduce the environmental footprint of AI workloads.'
    },
    {
      id: 'd4q12',
      question: 'What is the most common root cause of biased model behavior?',
      options: [
        'Using too many GPUs for training',
        'Poor data diversity and lack of representativeness in training data',
        'Having too many model parameters',
        'Deploying models in the wrong AWS region'
      ],
      correct: 1,
      explanation: 'Poor data diversity is the most common root cause of bias. Datasets should be inclusive, diverse, balanced, and curated from vetted sources to prevent models from learning unfair patterns.'
    },
    {
      id: 'd4q13',
      question: 'What tradeoff exists between model interpretability and performance?',
      options: [
        'More interpretable models are always more performant',
        'Simple, explainable models often underperform complex deep neural networks on difficult tasks',
        'Interpretability has no relationship to performance',
        'Complex models are always more interpretable'
      ],
      correct: 1,
      explanation: 'Simple models (decision trees, linear regression) are more explainable but often underperform complex ones (deep neural networks). Post-hoc techniques like SHAP and LIME help explain complex models.'
    },
    {
      id: 'd4q14',
      question: 'What does SageMaker Clarify use to explain individual model predictions?',
      options: ['Random sampling', 'SHAP (SHapley Additive exPlanations) values', 'Principal Component Analysis', 'K-means clustering'],
      correct: 1,
      explanation: 'SageMaker Clarify uses SHAP-based feature importance to explain predictions, helping understand which features contributed most to each decision and enabling bias detection across demographic groups.'
    }
  ]
};

// Domain 5: Security, Compliance, and Governance
export const domain5 = {
  id: 'domain5',
  name: 'Security, Compliance, and Governance',
  weight: '14%',
  icon: '🔒',
  color: '#DC143C',
  gradient: 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
  questions: [
    {
      id: 'd5q1',
      question: 'How does Amazon Bedrock handle data privacy for custom fine-tuned models?',
      options: [
        'Data is shared across all users',
        'Customer data is isolated and not used to train base models',
        'Data is stored indefinitely',
        'Data privacy is not guaranteed'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock keeps customer data private and isolated. Your data is not used to train the underlying foundation models, ensuring data privacy.'
    },
    {
      id: 'd5q2',
      question: 'Which AWS service provides encryption key management for AI workloads?',
      options: ['AWS Shield', 'AWS KMS (Key Management Service)', 'AWS WAF', 'Amazon GuardDuty'],
      correct: 1,
      explanation: 'AWS KMS allows you to create and manage encryption keys to protect data at rest and in transit for your AI/ML workloads.'
    },
    {
      id: 'd5q3',
      question: 'What is the AWS Shared Responsibility Model for AI services?',
      options: [
        'AWS handles all security',
        'Customers handle all security',
        'AWS secures infrastructure, customers secure their data and applications',
        'Security is optional'
      ],
      correct: 2,
      explanation: 'Under the Shared Responsibility Model, AWS secures the underlying infrastructure while customers are responsible for securing their data, applications, and access management.'
    },
    {
      id: 'd5q4',
      question: 'Which service helps with compliance auditing of AI workloads?',
      options: ['Amazon SageMaker', 'AWS CloudTrail', 'Amazon Bedrock', 'AWS Lambda'],
      correct: 1,
      explanation: 'AWS CloudTrail logs API calls and user activities, providing an audit trail essential for compliance monitoring of AI workloads.'
    },
    {
      id: 'd5q5',
      question: 'What is the purpose of VPC endpoints for Amazon Bedrock?',
      options: [
        'Increase processing speed',
        'Keep traffic within AWS network without internet exposure',
        'Reduce costs',
        'Enable multi-region deployment'
      ],
      correct: 1,
      explanation: 'VPC endpoints allow you to privately connect to Amazon Bedrock without exposing traffic to the public internet, enhancing security.'
    },
    {
      id: 'd5q6',
      question: 'Which AWS service helps identify sensitive data in datasets used for AI training?',
      options: ['Amazon Inspector', 'Amazon Macie', 'AWS Config', 'AWS Shield'],
      correct: 1,
      explanation: 'Amazon Macie uses ML to discover, classify, and protect sensitive data like PII in your AWS environment, important for AI data governance.'
    },
    {
      id: 'd5q7',
      question: 'What is IAM\'s role in securing AI services on AWS?',
      options: [
        'Encrypting model weights',
        'Managing user permissions and access to AI services',
        'Training ML models',
        'Storing data'
      ],
      correct: 1,
      explanation: 'IAM (Identity and Access Management) controls who can access AI services and what actions they can perform, implementing least-privilege access.'
    },
    {
      id: 'd5q8',
      question: 'What compliance framework addresses AI system documentation requirements?',
      options: [
        'AWS only requires cost documentation',
        'No documentation is required',
        'Model cards and documentation of training data, intended use, and limitations',
        'Only source code documentation'
      ],
      correct: 2,
      explanation: 'Responsible AI governance requires documenting model details, training data, intended use cases, limitations, and potential biases through model cards and similar artifacts.'
    },
    {
      id: 'd5q9',
      question: 'Which AWS service automatically scans EC2 instances and container images for software vulnerabilities?',
      options: ['AWS Trusted Advisor', 'Amazon GuardDuty', 'Amazon Inspector', 'AWS Config'],
      correct: 2,
      explanation: 'Amazon Inspector automatically scans EC2 instances and container images (ECR) for software vulnerabilities (CVEs), prioritizes findings by severity, and integrates with Security Hub.'
    },
    {
      id: 'd5q10',
      question: 'What is AWS Audit Manager used for in AI compliance?',
      options: [
        'Training ML models on audit data',
        'Continuously auditing AWS usage with prebuilt compliance frameworks and automated evidence collection',
        'Encrypting audit logs',
        'Managing user permissions'
      ],
      correct: 1,
      explanation: 'AWS Audit Manager provides prebuilt frameworks (SOC 2, GDPR, HIPAA, NIST), automated evidence collection, audit-ready reports, and custom frameworks for AI-specific governance.'
    },
    {
      id: 'd5q11',
      question: 'What are the five categories that AWS Trusted Advisor provides recommendations for?',
      options: [
        'Speed, Memory, Storage, Network, Compute',
        'Cost Optimization, Performance, Security, Fault Tolerance, Service Limits',
        'Identity, Access, Encryption, Logging, Monitoring',
        'Development, Testing, Staging, Production, Archival'
      ],
      correct: 1,
      explanation: 'AWS Trusted Advisor provides best practice recommendations across five categories: Cost Optimization, Performance, Security, Fault Tolerance, and Service Limits.'
    },
    {
      id: 'd5q12',
      question: 'What is "prompt injection" in AI security?',
      options: [
        'Injecting new data into training datasets',
        'An attack where malicious inputs manipulate the model to bypass instructions or perform unintended actions',
        'Adding more prompts to improve response quality',
        'A technique for faster model inference'
      ],
      correct: 1,
      explanation: 'Prompt injection is a security attack where malicious inputs override system instructions. It includes direct injection (user-crafted) and indirect injection (malicious content in retrieved documents). Mitigations include Amazon Bedrock Guardrails and input sanitization.'
    },
    {
      id: 'd5q13',
      question: 'What are Amazon SageMaker Model Cards used for?',
      options: [
        'Storing model weights and parameters',
        'Structured documentation capturing model purpose, training details, evaluation metrics, and ethical considerations',
        'Managing billing for model training',
        'Scaling model endpoints'
      ],
      correct: 1,
      explanation: 'SageMaker Model Cards provide standardized documentation for audits — including model purpose, training data, evaluation metrics, limitations, risk ratings, and bias analysis. They are exportable as PDF or JSON.'
    },
    {
      id: 'd5q14',
      question: 'Which privacy-enhancing technology adds mathematical noise to protect individual records in training data?',
      options: ['Tokenization', 'Differential privacy', 'Data masking', 'VPC endpoints'],
      correct: 1,
      explanation: 'Differential privacy adds controlled mathematical noise to data to protect individual records while preserving overall statistical properties. Other PETs include anonymization, pseudonymization, federated learning, and tokenization.'
    },
    {
      id: 'd5q15',
      question: 'What is the purpose of the Generative AI Security Scoping Matrix?',
      options: [
        'To calculate model training costs',
        'A governance framework that maps AI use cases to appropriate security requirements based on risk level',
        'To measure model accuracy across demographics',
        'To manage API rate limits'
      ],
      correct: 1,
      explanation: 'The GenAI Security Scoping Matrix maps AI use cases to security requirements across dimensions like data classification, user access scope, integration level, and autonomy level — helping organizations apply proportionate controls.'
    },
    {
      id: 'd5q16',
      question: 'Which AWS service provides API-level audit trails for AI workload compliance?',
      options: ['Amazon CloudWatch', 'AWS CloudTrail', 'AWS Config', 'Amazon Inspector'],
      correct: 1,
      explanation: 'AWS CloudTrail logs all API calls and user activities, providing a comprehensive audit trail essential for compliance. S3 access logging and model invocation logging complement CloudTrail for full data lifecycle visibility.'
    }
  ]
};
