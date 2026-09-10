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
        'Random noise in model predictions caused by insufficient data',
        'Systematic errors that lead to unfair outcomes for certain groups',
        'A model overfitting to noise and outliers in its training data',
        'The difference between predicted and actual values during training'
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
        'Publishing a model\'s source code and weights for public review',
        'Understanding how and why an AI model makes specific decisions',
        'Documenting the intended use cases and known limitations of a model',
        'The accuracy with which a model reports its own confidence scores'
      ],
      correct: 1,
      explanation: 'Explainability refers to the ability to understand and communicate how AI systems make decisions, crucial for trust, compliance, and debugging.'
    },
    {
      id: 'd4q4',
      question: 'What is Amazon Bedrock Guardrails used for?',
      options: [
        'Restricting network access to foundation model endpoints',
        'Implementing safeguards for generative AI applications',
        'Encrypting model training data at rest and in transit',
        'Monitoring API usage to control foundation model costs'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock Guardrails helps implement customizable safeguards to filter harmful content and ensure AI applications behave appropriately.'
    },
    {
      id: 'd4q5',
      question: 'What is "model transparency" in AI governance?',
      options: [
        'Releasing a model\'s source code under an open-source license',
        'Clear understanding of what data was used and how the model works',
        'The ability of a model to explain each individual prediction it makes',
        'Publishing trained model weights for anyone to download'
      ],
      correct: 1,
      explanation: 'Model transparency involves clearly documenting and communicating what data was used for training, how the model works, and its limitations.'
    },
    {
      id: 'd4q6',
      question: 'What is "data lineage" in the context of responsible AI?',
      options: [
        'Measuring how recently training data was collected or refreshed',
        'Tracking the origin, movement, and transformation of data',
        'Classifying stored data by its sensitivity and retention requirements',
        'Enforcing role-based access controls on training datasets'
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
        'Manually labeling every training example before model training',
        'Human oversight and intervention capability in AI decision-making',
        'Replacing automated pipelines with fully manual review processes',
        'Collecting user feedback ratings after a model is deployed'
      ],
      correct: 1,
      explanation: 'Human-in-the-loop ensures humans can oversee, validate, and intervene in AI decisions, especially important for high-stakes applications.'
    },
    {
      id: 'd4q9',
      question: 'What is Amazon Augmented AI (Amazon A2I) used for?',
      options: [
        'Automatically retraining models when accuracy degrades',
        'Building human review workflows into ML applications',
        'Generating synthetic data to augment small training sets',
        'Monitoring deployed models for data drift and quality issues'
      ],
      correct: 1,
      explanation: 'Amazon A2I builds human review workflows that route low-confidence predictions to human reviewers. It integrates with Textract, Rekognition, and custom models, supporting private, public, or vendor workforces.'
    },
    {
      id: 'd4q10',
      question: 'Which legal risk is specific to generative AI producing outputs that resemble copyrighted material?',
      options: [
        'Defamation claims from false statements about individuals',
        'IP (Intellectual Property) infringement claims',
        'Breach of contract claims over service commitments',
        'Data residency and cross-border transfer violations'
      ],
      correct: 1,
      explanation: 'GenAI may produce outputs resembling copyrighted material, exposing organizations to IP infringement lawsuits. Mitigation includes content filtering, guardrails, disclaimers, and human review for high-stakes outputs.'
    },
    {
      id: 'd4q11',
      question: 'How does choosing a smaller AI model support environmental sustainability?',
      options: [
        'Smaller models can be trained entirely on renewable energy, while larger models cannot',
        'Smaller models require less energy for training and inference, reducing carbon emissions',
        'Smaller models eliminate the need for specialized accelerator hardware in data centers',
        'Smaller models reduce data storage costs, which is the primary sustainability factor'
      ],
      correct: 1,
      explanation: 'Larger models consume more energy. Right-sizing models, using distilled/quantized architectures, and choosing AWS regions with renewable energy all reduce the environmental footprint of AI workloads.'
    },
    {
      id: 'd4q12',
      question: 'What is the most common root cause of biased model behavior?',
      options: [
        'Choosing the wrong algorithm for the prediction task',
        'Poor data diversity and lack of representativeness in training data',
        'Using too many parameters, causing the model to memorize noise',
        'Insufficient training time preventing the model from converging'
      ],
      correct: 1,
      explanation: 'Poor data diversity is the most common root cause of bias. Datasets should be inclusive, diverse, balanced, and curated from vetted sources to prevent models from learning unfair patterns.'
    },
    {
      id: 'd4q13',
      question: 'What tradeoff exists between model interpretability and performance?',
      options: [
        'Interpretable models achieve higher accuracy because their features are hand-selected',
        'Simple, explainable models often underperform complex deep neural networks on difficult tasks',
        'Post-hoc explanation techniques make complex models fully transparent, eliminating the tradeoff',
        'Complex models are more interpretable because they capture more detailed feature relationships'
      ],
      correct: 1,
      explanation: 'Simple models (decision trees, linear regression) are more explainable but often underperform complex ones (deep neural networks). Post-hoc techniques like SHAP and LIME help explain complex models.'
    },
    {
      id: 'd4q14',
      question: 'What does SageMaker Clarify use to explain individual model predictions?',
      options: ['LIME (Local Interpretable Model-agnostic Explanations)', 'SHAP (SHapley Additive exPlanations) values', 'Principal Component Analysis', 'K-means clustering'],
      correct: 1,
      explanation: 'SageMaker Clarify uses SHAP-based feature importance to explain predictions, helping understand which features contributed most to each decision and enabling bias detection across demographic groups.'
    },
    {
      id: 'd4q15',
      question: 'A loan-approval model was trained on historical data in which one demographic group was rarely approved. The model now rejects that group at unusually high rates. What should the team do FIRST?',
      options: [
        'Deploy the model but add a disclaimer to rejection letters',
        'Measure bias metrics across groups (e.g., with SageMaker Clarify) and rebalance or augment the training data',
        'Remove the demographic column and assume the bias is gone',
        'Lower the approval threshold for all applicants equally'
      ],
      correct: 1,
      explanation: 'The first step is to quantify the bias with pre- and post-training metrics, then address the skewed data through rebalancing or augmentation. Simply dropping the demographic column fails because other features act as proxies for it, and disclaimers or global threshold changes don\'t fix discriminatory behavior.'
    },
    {
      id: 'd4q16',
      question: 'A model shows 94% overall accuracy, but a review reveals only 71% accuracy for one user subgroup. What responsible AI practice does this highlight?',
      options: [
        'Evaluating performance per subgroup, not just in aggregate, before deployment',
        'Reporting only the overall accuracy to avoid confusion',
        'Increasing overall accuracy until subgroup accuracy no longer matters',
        'Retraining with a higher learning rate'
      ],
      correct: 0,
      explanation: 'Aggregate metrics hide disparate performance across subgroups — fairness assessment requires disaggregated evaluation and closing the gaps found. Hiding the breakdown or chasing overall accuracy leaves the affected group underserved, and learning rate is unrelated.'
    },
    {
      id: 'd4q17',
      question: 'A vision model performs well in testing but fails badly on slightly blurred or rotated images in production. Which responsible AI dimension does this failure reflect?',
      options: [
        'Robustness — the model should tolerate realistic input variation',
        'Explainability — the model\'s decisions should be interpretable',
        'Privacy — the model should protect user data',
        'Sustainability — the model should minimize energy use'
      ],
      correct: 0,
      explanation: 'Robustness (veracity) is a system\'s ability to remain reliable under noisy, shifted, or adversarial inputs; testing should include realistic variations like blur and rotation. Explainability, privacy, and sustainability are separate responsible AI dimensions not implicated by this failure.'
    },
    {
      id: 'd4q18',
      question: 'Before adopting Amazon Rekognition, a compliance officer wants AWS\'s own documentation of the service\'s intended use cases, limitations, and responsible design considerations. Where is this published?',
      options: [
        'AWS AI Service Cards',
        'The EC2 pricing page',
        'AWS CloudTrail logs',
        'The service\'s IAM policy reference'
      ],
      correct: 0,
      explanation: 'AWS AI Service Cards are transparency documents describing an AI service\'s intended use cases, limitations, design choices, and deployment best practices. Pricing pages, audit logs, and IAM references don\'t cover responsible-use guidance.'
    },
    {
      id: 'd4q19',
      question: 'A public-facing chatbot must not discuss violent content, must mask any customer phone numbers in responses, and must block a list of competitor names. Which single Bedrock Guardrails configuration covers all three?',
      options: [
        'Content filters for violence, PII redaction for phone numbers, and word filters for the competitor names',
        'A system prompt asking the model to be careful',
        'Fine-tuning the model to forget phone numbers',
        'Lowering max tokens so harmful content is cut off'
      ],
      correct: 0,
      explanation: 'Guardrails composes multiple policy types in one configuration: content filters (harmful categories like violence), sensitive-information filters (PII masking), and word/phrase filters (custom blocklists). Prompt requests are bypassable, models can\'t be fine-tuned to "forget" data patterns reliably, and truncation doesn\'t prevent harmful content.'
    },
    {
      id: 'd4q20',
      question: 'When curating a dataset for a hiring-assistant model, which practice best supports fair outcomes?',
      options: [
        'Sourcing data that is inclusive and representative of all groups the model will affect, and documenting its provenance',
        'Using whatever data is fastest to collect since volume matters most',
        'Excluding all records from minority groups to simplify the data',
        'Using only data from the single best-performing office'
      ],
      correct: 0,
      explanation: 'Responsible dataset curation means representative, inclusive, balanced data with documented provenance so gaps and skews are visible. Convenience sampling, excluding groups, or drawing from one narrow source all bake in the exact biases a hiring model must avoid.'
    },
    {
      id: 'd4q21',
      question: 'A news site uses generative AI to draft some articles. Which practice best supports transparency with its readers?',
      options: [
        'Clearly labeling AI-generated content so readers know its origin',
        'Publishing AI drafts under randomly chosen human bylines',
        'Keeping AI use confidential to protect the brand',
        'Using AI only on weekends'
      ],
      correct: 0,
      explanation: 'Transparency means disclosing when content is AI-generated — via labels, disclosures, or provenance techniques like watermarking — so audiences can calibrate trust. Hiding AI involvement or attributing it to fake human authors is deceptive, and the timing of use is irrelevant.'
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
        'Fine-tuning data is anonymized before being shared with model providers',
        'Customer data is isolated and not used to train base models',
        'Customer data is encrypted but pooled to improve the base models',
        'Training data is retained by AWS to periodically refresh base models'
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
        'AWS handles all security for its managed AI services',
        'Customers handle all security, including physical infrastructure',
        'AWS secures infrastructure, customers secure their data and applications',
        'Responsibility is negotiated case by case in each service agreement'
      ],
      correct: 2,
      explanation: 'Under the Shared Responsibility Model, AWS secures the underlying infrastructure while customers are responsible for securing their data, applications, and access management.'
    },
    {
      id: 'd5q4',
      question: 'Which service helps with compliance auditing of AI workloads?',
      options: ['Amazon CloudWatch', 'AWS CloudTrail', 'Amazon GuardDuty', 'AWS Shield'],
      correct: 1,
      explanation: 'AWS CloudTrail logs API calls and user activities, providing an audit trail essential for compliance monitoring of AI workloads.'
    },
    {
      id: 'd5q5',
      question: 'What is the purpose of VPC endpoints for Amazon Bedrock?',
      options: [
        'Reduce inference latency by caching model responses',
        'Keep traffic within AWS network without internet exposure',
        'Encrypt API requests using customer-managed keys',
        'Distribute inference requests across multiple regions'
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
        'Encrypting model artifacts and training data at rest',
        'Managing user permissions and access to AI services',
        'Detecting anomalous access patterns to AI endpoints',
        'Logging every API call made to AI services'
      ],
      correct: 1,
      explanation: 'IAM (Identity and Access Management) controls who can access AI services and what actions they can perform, implementing least-privilege access.'
    },
    {
      id: 'd5q8',
      question: 'What compliance framework addresses AI system documentation requirements?',
      options: [
        'Service level agreements covering model uptime and support response times',
        'Architecture diagrams and cost allocation reports for each AI workload',
        'Model cards and documentation of training data, intended use, and limitations',
        'Source code repositories with version control and full change history'
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
        'Logging every API call made across your AWS accounts to support forensic security investigations',
        'Continuously auditing AWS usage with prebuilt compliance frameworks and automated evidence collection',
        'Scanning workloads for software vulnerabilities and prioritizing remediation by severity',
        'Tracking configuration changes to AWS resources against desired baselines'
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
        'Inserting maliciously crafted records into a model\'s training data to corrupt its future behavior',
        'An attack where malicious inputs manipulate the model to bypass instructions or perform unintended actions',
        'Embedding hidden watermarks in prompts so generated content can be traced back to specific users',
        'Chaining multiple prompts together in sequence to improve the accuracy of complex model responses'
      ],
      correct: 1,
      explanation: 'Prompt injection is a security attack where malicious inputs override system instructions. It includes direct injection (user-crafted) and indirect injection (malicious content in retrieved documents). Mitigations include Amazon Bedrock Guardrails and input sanitization.'
    },
    {
      id: 'd5q13',
      question: 'What are Amazon SageMaker Model Cards used for?',
      options: [
        'A central registry for storing, versioning, and cataloging trained model artifacts and their weights',
        'Structured documentation capturing model purpose, training details, evaluation metrics, and ethical considerations',
        'Dashboards for tracking training and inference costs across all model versions in an account',
        'Configuration profiles that automatically scale model inference endpoints based on traffic patterns'
      ],
      correct: 1,
      explanation: 'SageMaker Model Cards provide standardized documentation for audits — including model purpose, training data, evaluation metrics, limitations, risk ratings, and bias analysis. They are exportable as PDF or JSON.'
    },
    {
      id: 'd5q14',
      question: 'Which privacy-enhancing technology adds mathematical noise to protect individual records in training data?',
      options: ['Tokenization', 'Differential privacy', 'Data masking', 'Federated learning'],
      correct: 1,
      explanation: 'Differential privacy adds controlled mathematical noise to data to protect individual records while preserving overall statistical properties. Other PETs include anonymization, pseudonymization, federated learning, and tokenization.'
    },
    {
      id: 'd5q15',
      question: 'What is the purpose of the Generative AI Security Scoping Matrix?',
      options: [
        'A planning tool that estimates the total cost of ownership for generative AI workloads',
        'A governance framework that maps AI use cases to appropriate security requirements based on risk level',
        'A benchmark suite that measures foundation model accuracy across evaluation datasets',
        'A classification scheme that assigns data sensitivity levels for storage compliance'
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
    },
    {
      id: 'd5q17',
      question: 'A company wants its customer-support application to invoke exactly one approved Bedrock model and nothing else. How should this be enforced?',
      options: [
        'An IAM policy that allows bedrock:InvokeModel only on the approved model\'s ARN',
        'A system prompt telling the model to refuse other models\' requests',
        'Naming the application after the approved model',
        'Provisioned Throughput, which locks an account to one model'
      ],
      correct: 0,
      explanation: 'Least privilege is enforced with IAM: scope the application role\'s bedrock:InvokeModel permission to the specific model ARN. Prompts can\'t control authorization, naming is cosmetic, and Provisioned Throughput is a capacity purchase, not an access control.'
    },
    {
      id: 'd5q18',
      question: 'A European bank requires that customer data sent to a foundation model never leave the EU. What is the primary control for meeting this requirement on AWS?',
      options: [
        'Run the AI workload in an EU Region — Bedrock processes inference in-Region, and prompts are not sent elsewhere',
        'Enable encryption, which removes data-residency obligations',
        'Use a VPN so the data\'s location no longer matters',
        'Ask the model politely not to store the data abroad'
      ],
      correct: 0,
      explanation: 'Data residency is achieved by Region selection: deploying Bedrock in an EU Region keeps inference processing in that Region. Encryption protects confidentiality but doesn\'t change where data is processed, and VPNs or prompt instructions have no bearing on residency compliance.'
    },
    {
      id: 'd5q19',
      question: 'A developer hard-coded a third-party API key into the prompt template of a Bedrock agent. What is the correct remediation?',
      options: [
        'Store the key in AWS Secrets Manager and have the action\'s Lambda retrieve it at runtime',
        'Base64-encode the key inside the prompt so it is hidden',
        'Move the key into a code comment instead',
        'Rotate the key monthly but keep it in the prompt'
      ],
      correct: 0,
      explanation: 'Credentials never belong in prompts — prompt content can be logged, echoed in outputs, or extracted via injection. Secrets Manager stores and rotates secrets, and the tool\'s backing Lambda fetches them at runtime with IAM-scoped access. Encoding or commenting a secret is not protection, and rotating a still-exposed key leaves the exposure.'
    },
    {
      id: 'd5q20',
      question: 'A governance team must retain a record of every prompt sent to Bedrock and every response returned, for later review. Which feature provides this?',
      options: [
        'Bedrock model invocation logging to S3 and/or CloudWatch Logs',
        'AWS CloudTrail alone, which records full prompt and response bodies',
        'Amazon Inspector scanning',
        'S3 Transfer Acceleration'
      ],
      correct: 0,
      explanation: 'Bedrock\'s model invocation logging captures full request and response payloads (including prompts and completions) to S3 or CloudWatch Logs. CloudTrail records that an invocation API call happened but not the full model input/output bodies; Inspector finds vulnerabilities, and Transfer Acceleration speeds uploads.'
    },
    {
      id: 'd5q21',
      question: 'An auditor asks for AWS\'s SOC 2 and ISO 27001 compliance reports to include in the company\'s AI compliance package. Where does the team download these?',
      options: ['AWS Artifact', 'AWS Marketplace', 'Amazon S3 public buckets', 'The AWS status page'],
      correct: 0,
      explanation: 'AWS Artifact is the self-service portal for AWS\'s own compliance reports (SOC, ISO, PCI attestations) and agreements. Marketplace sells software, and neither public buckets nor the status page hosts compliance documentation.'
    },
    {
      id: 'd5q22',
      question: 'Company policy requires that raw training datasets be automatically deleted from storage 90 days after model training completes. Which mechanism implements this?',
      options: [
        'S3 Lifecycle policies that expire the objects after 90 days',
        'Asking data scientists to remember to delete files',
        'Model invocation logging',
        'Provisioned Throughput expiry'
      ],
      correct: 0,
      explanation: 'S3 Lifecycle rules automate retention by expiring or transitioning objects on a schedule, making the 90-day deletion policy enforceable rather than aspirational. Manual deletion is unreliable and unauditable; invocation logging and throughput commitments are unrelated to data retention.'
    },
    {
      id: 'd5q23',
      question: 'What is "data poisoning" in AI security?',
      options: [
        'An attacker manipulates training data so the resulting model learns harmful or attacker-chosen behavior',
        'A model producing toxic language at inference time',
        'Corruption of data in transit due to network errors',
        'Overwriting a database with too many writes'
      ],
      correct: 0,
      explanation: 'Data poisoning is the deliberate injection or manipulation of training data to corrupt what a model learns — mitigated by controlling data provenance, validating sources, and monitoring model behavior. Toxic inference output, transmission errors, and database overload are different problems.'
    },
    {
      id: 'd5q24',
      question: 'A security review of a fine-tuned model deployment asks how model artifacts and data are protected "at rest and in transit." Which pairing answers this on AWS?',
      options: [
        'KMS-managed encryption for stored artifacts and data, and TLS for all data in transit',
        'IAM for data at rest and CloudWatch for data in transit',
        'S3 versioning for data at rest and Route 53 for data in transit',
        'Encryption is unnecessary because models contain no customer data'
      ],
      correct: 0,
      explanation: 'The standard pattern is encryption at rest with AWS KMS keys (S3, EBS, SageMaker, and Bedrock artifacts all support it) plus TLS encrypting every connection in transit. IAM governs access rather than encrypting, versioning and DNS aren\'t encryption, and fine-tuned models can embed sensitive training data — so protection absolutely matters.'
    }
  ]
};
