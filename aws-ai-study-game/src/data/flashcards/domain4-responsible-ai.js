// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels
// Sources: official AWS documentation, linked on each card

export const domain4 = {
  id: 'domain4',
  name: 'Guidelines for Responsible AI',
  description: 'Responsible AI development, transparency, and explainability',
  icon: '⚖️',
  color: '#f87171',
  gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
  source: 'Official AWS documentation (linked on each card)',
  examWeight: '14%',
  cards: [
    // Task Statement 4.1: Explain the development of AI systems that are responsible
    {
      id: 'd4c1',
      front: 'What are the key principles of Responsible AI?',
      back: 'AWS core dimensions of responsible AI:\n• Fairness - considering impacts on different groups of stakeholders\n• Explainability - understanding and evaluating system outputs\n• Privacy and Security - appropriately obtaining, using, and protecting data and models\n• Safety - preventing harmful system output and misuse\n• Controllability - mechanisms to monitor and steer AI system behavior\n• Veracity and Robustness - correct outputs, even with unexpected or adversarial inputs\n• Governance - best practices across the AI supply chain\n• Transparency - helping stakeholders make informed choices about using an AI system',
      hint: 'Fairness, explainability, privacy, safety, controllability, veracity, governance, transparency',
      tags: ['responsible-ai', 'principles', 'ethics'],
      difficulty: 'beginner',
      sources: [
        { title: 'Responsible AI – AWS', url: 'https://aws.amazon.com/ai/responsible-ai/', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c2',
      front: 'What is AI Bias and how does it occur?',
      back: 'Systematic and unfair discrimination in AI outputs.\n\nCauses:\n• Training Data Bias - underrepresented groups\n• Historical Bias - past inequities in data\n• Measurement Bias - how data is collected\n• Algorithmic Bias - model design choices\n• Labeling Bias - subjective annotations\n\nExample: Facial recognition performing worse on darker skin tones',
      hint: 'Unfair discrimination in outputs',
      tags: ['bias', 'fairness', 'responsible-ai'],
      difficulty: 'beginner',
      sources: [
        { title: 'RAIBR02-BP01 Identify potential harmful events impacting fairness – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raibr02-bp01.html', checked: '2026-11-25' },
        { title: 'RAIDP03-BP02 Minimize unwanted bias in your datasets – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raidp03-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c3',
      front: 'How can you detect bias in AI models?',
      back: 'Detection methods:\n• Disaggregated Evaluation - test across demographics\n• Fairness Metrics - measure outcome disparities\n• Bias Audits - systematic reviews\n• A/B Testing - compare across groups\n• Human Review - expert assessment\n• Statistical Analysis - identify patterns\n• Red Teaming - adversarial testing\n\nMonitor continuously, not just at launch',
      hint: 'Test across groups, measure disparities',
      tags: ['bias-detection', 'testing', 'fairness'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAIRC03-BP02 Measure fairness as unwanted bias across stakeholder groups – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/rairc03-bp02.html', checked: '2026-11-25' },
        { title: 'Content Domain 4: Guidelines for Responsible AI – AWS Certified AI Practitioner (AIF-C01) Exam Guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01-domain4.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c4',
      front: 'What are strategies to mitigate AI bias?',
      back: '• Diverse Training Data - representative samples\n• Data Augmentation - balance underrepresented groups\n• Algorithmic Fairness Constraints - built-in fairness\n• Regular Audits - ongoing monitoring\n• Inclusive Development Teams - diverse perspectives\n• Human Oversight - human-in-the-loop\n• Bias Testing Tools - automated detection\n• Feedback Loops - user reporting',
      hint: 'Diverse data, fairness constraints, monitoring',
      tags: ['bias-mitigation', 'fairness', 'best-practices'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAISP02-BP03 Mitigate unwanted bias directly in the core AI system design – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp03.html', checked: '2026-11-25' },
        { title: 'RAIDP03-BP02 Minimize unwanted bias in your datasets – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raidp03-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c5',
      front: 'What is Fairness in AI?',
      back: 'Ensuring AI systems treat all individuals and groups equitably without discrimination.\n\nKey considerations:\n• Equal Performance - similar accuracy across groups\n• Equal Opportunity - similar false positive/negative rates\n• Demographic Parity - similar outcomes across demographics\n• Individual Fairness - similar individuals treated similarly\n\nChallenges: Different fairness metrics can conflict',
      hint: 'Equitable treatment without discrimination',
      tags: ['fairness', 'ethics', 'responsible-ai'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAIRC03-BP02 Measure fairness as unwanted bias across stakeholder groups – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/rairc03-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c6',
      front: 'What is Amazon Bedrock Guardrails?',
      back: 'Amazon Bedrock feature that implements safeguards for foundation model applications (formerly called Guardrails for Amazon Bedrock).\n\nCapabilities:\n• Content Filtering - block harmful content\n• Denied Topics - prevent specific subjects\n• Word Filters - block problematic terms\n• Sensitive Information Filters - block or mask PII\n• Prompt Attack Detection - security\n• Contextual Grounding Checks - detect hallucinations\n• Automated Reasoning Checks - validate responses against logical rules\n• Customizable Policies - organization-specific rules\n\nHelps ensure responsible AI deployment',
      hint: 'Safety controls for Bedrock models',
      tags: ['aws-services', 'guardrails', 'safety'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Detect and filter harmful content by using Amazon Bedrock Guardrails – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c7',
      front: 'What types of content can Amazon Bedrock Guardrails filter?',
      back: 'Content filter categories:\n• Hate - discriminatory content\n• Insults - offensive language\n• Sexual - inappropriate material\n• Violence - harmful or dangerous content\n• Misconduct - criminal or harmful activity\n• Prompt Attacks - jailbreaks, prompt injection, prompt leakage\n\nSensitive data (PII) is handled by a separate filter: sensitive information filters.\n\nThresholds: None, Low, Medium, High filtering',
      hint: 'Hate, insults, sexual, violence, misconduct, attacks',
      tags: ['guardrails', 'content-filtering', 'safety'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Block harmful words and conversations with content filters – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-content-filters.html', checked: '2026-11-25' },
        { title: 'Detect prompt attacks with Amazon Bedrock Guardrails – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-prompt-attack.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c8',
      front: 'What is Toxicity Detection in AI systems?',
      back: 'Identifying and filtering harmful, offensive, or inappropriate content in inputs and outputs.\n\nTypes of toxicity:\n• Profanity and offensive language\n• Hate speech and discrimination\n• Threats and violence\n• Harassment and bullying\n• Sexual content\n\nImplementation: Content moderation APIs, guardrails, human review',
      hint: 'Detecting harmful content',
      tags: ['toxicity', 'content-moderation', 'safety'],
      difficulty: 'beginner',
      sources: [
        { title: 'Trust and safety – Amazon Comprehend', url: 'https://docs.aws.amazon.com/comprehend/latest/dg/trust-safety.html', checked: '2026-11-25' },
        { title: 'RAISP03-BP03 Implement output filtering to catch unsafe content before it reaches users – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp03-bp03.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c9',
      front: 'How do you ensure AI Safety and Robustness?',
      back: 'Safety measures:\n• Rigorous Testing - edge cases, adversarial inputs\n• Fallback Mechanisms - graceful failure handling\n• Human Oversight - human-in-the-loop for critical decisions\n• Monitoring - continuous performance tracking\n• Rate Limiting - prevent abuse\n• Input Validation - sanitize user inputs\n• Error Handling - clear error messages\n• Regular Updates - security patches',
      hint: 'Testing, monitoring, fallbacks, oversight',
      tags: ['safety', 'robustness', 'reliability'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAISP02-BP10 Build safety protections into the core AI system – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp10.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c10',
      front: 'What is Human-in-the-Loop (HITL) in AI systems?',
      back: 'Keeping humans involved in AI decision-making processes, especially for high-stakes decisions.\n\nApplications:\n• Critical Decisions - medical diagnosis, legal, hiring\n• Quality Control - reviewing outputs\n• Labeling Data - training data annotation\n• Handling Edge Cases - unusual situations\n• Providing Feedback - improving models\n\nEnsures accountability and oversight',
      hint: 'Humans involved in AI decisions',
      tags: ['hitl', 'human-oversight', 'accountability'],
      difficulty: 'beginner',
      sources: [
        { title: 'RAIUC04-BP02 Identify human oversight opportunities – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raiuc04-bp02.html', checked: '2026-11-25' },
        { title: 'Using Amazon Augmented AI for Human Review – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-use-augmented-ai-a2i-human-review-loops.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c11',
      front: 'What is AI Governance?',
      back: 'Frameworks and processes for responsible AI development and deployment.\n\nComponents:\n• Policies and Standards - guidelines for AI use\n• Oversight Committees - decision-making bodies\n• Risk Management - identify and mitigate risks\n• Compliance Monitoring - regulatory adherence\n• Documentation - audit trails\n• Incident Response - handling failures\n• Training - educating teams on responsible AI',
      hint: 'Policies, oversight, risk management, compliance',
      tags: ['governance', 'compliance', 'oversight'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAIUC05-BP01 Engage your organization in approving your use case – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raiuc05-bp01.html', checked: '2026-11-25' },
        { title: 'RAIBR03-BP04 Use a risk registry to track and calibrate potential harms and risks – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raibr03-bp04.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c12',
      front: 'How does data privacy impact responsible AI development?',
      back: 'Privacy considerations:\n• Data Minimization - collect only necessary data\n• Consent - user permission for data use\n• Anonymization - remove personally identifiable information\n• Secure Storage - encryption and access controls\n• Right to be Forgotten - data deletion\n• Purpose Limitation - use data only as intended\n• Compliance - GDPR, CCPA, HIPAA\n\nBuild privacy in from the start',
      hint: 'Consent, minimization, anonymization, security',
      tags: ['privacy', 'data-protection', 'compliance'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAISP02-BP02 Privacy: Build privacy-preserving mechanisms into the core AI system – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp02.html', checked: '2026-11-25' },
        { title: 'RAIMON01-BP01 Obtain consent for monitoring production data – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raimon01-bp01.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c13',
      front: 'What is Factuality in AI and why is it important?',
      back: 'The accuracy and truthfulness of AI-generated information.\n\nChallenges:\n• Hallucinations - model generates false information\n• Outdated Knowledge - training data cutoff\n• Misinterpretation - incorrect context understanding\n\nMitigation:\n• RAG - retrieve current, verified information\n• Grounding Checks - e.g., Amazon Bedrock Guardrails contextual grounding checks\n• Citation Requirements - source attribution\n• Fact-Checking - verification processes\n• Human Review - expert validation\n\nCritical for trust and reliability',
      hint: 'Accuracy and truthfulness of outputs',
      tags: ['factuality', 'accuracy', 'hallucinations'],
      difficulty: 'intermediate',
      sources: [
        { title: 'RAISP02-BP08 Consider core AI system designs that improve factual accuracy – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp08.html', checked: '2026-11-25' },
        { title: 'Use contextual grounding check to filter hallucinations in responses – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    // Task Statement 4.2: Recognize the importance of transparent and explainable models
    {
      id: 'd4c14',
      front: 'What is AI Transparency?',
      back: 'Being open and clear about how AI systems work, their capabilities, and limitations.\n\nAspects:\n• Model Information - architecture and training data\n• Capabilities - what it can and cannot do\n• Limitations - known weaknesses\n• Decision Process - how outputs are generated\n• Data Sources - where information comes from\n• Error Rates - performance metrics\n\nBuilds user trust and enables informed use',
      hint: 'Openness about AI systems',
      tags: ['transparency', 'explainability', 'trust'],
      difficulty: 'beginner',
      sources: [
        { title: 'Responsible AI – AWS', url: 'https://aws.amazon.com/ai/responsible-ai/', checked: '2026-11-25' },
        { title: 'RAIGT01-BP02 Create a system card that communicates intended usage and limitations – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raigt01-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c15',
      front: 'What is AI Explainability?',
      back: 'The ability to understand and interpret how an AI model arrives at its decisions.\n\nWhy it matters:\n• Trust - users understand outputs\n• Debugging - identify errors\n• Compliance - regulatory requirements\n• Fairness - detect bias\n• Improvement - insights for refinement\n\nTechniques: Feature importance (SHAP), LIME, partial dependence plots',
      hint: 'Understanding how AI makes decisions',
      tags: ['explainability', 'interpretability', 'transparency'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Explainable AI? – AWS', url: 'https://aws.amazon.com/what-is/explainable-ai/', checked: '2026-11-25' },
        { title: 'Model Explainability – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-model-explainability.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c16',
      front: 'What is the difference between Interpretability and Explainability?',
      back: 'Interpretability:\n• Inherent transparency of the model\n• Understanding the model structure itself\n• Example: Decision trees are interpretable\n\nExplainability:\n• Post-hoc explanations of model decisions\n• Techniques applied after training\n• Example: SHAP values for neural networks\n\nBoth help humans understand AI systems',
      hint: 'Inherent vs. post-hoc understanding',
      tags: ['interpretability', 'explainability', 'transparency'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Explainable AI? – AWS', url: 'https://aws.amazon.com/what-is/explainable-ai/', checked: '2026-11-25' },
        { title: 'RAISP02-BP07 Incorporate explainability mechanisms into the core AI system – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp07.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c17',
      front: 'What are common explainability techniques for AI models?',
      back: '• Feature Importance - which inputs matter most\n• SHAP (Shapley Values) - contribution of each feature\n• LIME - local interpretable model-agnostic explanations\n• Partial Dependence Plots (PDP) - how a feature changes the outcome\n• DeepLIFT / Integrated Gradients - feature importance in deep learning models\n• Interpretable Models - e.g., explainable boosting machines\n• Global, Cohort, and Local Explanations - whole model, a group, or one prediction\n\nSageMaker Clarify uses SHAP (also for computer vision and NLP) and produces PDPs',
      hint: 'SHAP, LIME, PDPs, feature attributions',
      tags: ['explainability', 'techniques', 'interpretability'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Explainable AI? – AWS', url: 'https://aws.amazon.com/what-is/explainable-ai/', checked: '2026-11-25' },
        { title: 'Model Explainability – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-model-explainability.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c18',
      front: 'Why is model transparency important for regulatory compliance?',
      back: 'Regulatory requirements:\n• AI-Specific Regulations and Standards - e.g., EU AI Act, ISO/IEC 42001\n• Algorithmic Accountability - government mandates\n• Fair Lending - financial regulations\n• Healthcare Compliance - providers must demonstrate explainability\n• Discrimination Laws - prove fairness\n• Audit Requirements - demonstrable processes\n\nTransparency enables:\n• Legal compliance\n• Audit trails\n• Accountability\n• Risk mitigation',
      hint: 'Legal requirements for AI decisions',
      tags: ['compliance', 'regulations', 'transparency'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Explainable AI? – AWS', url: 'https://aws.amazon.com/what-is/explainable-ai/', checked: '2026-11-25' },
        { title: 'Responsible AI Lens – AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/responsible-ai-lens.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c19',
      front: 'What information should be documented about AI models for transparency?',
      back: 'Model Documentation:\n• Model Architecture - structure and components\n• Training Data - sources, size, characteristics\n• Performance Metrics - accuracy, error rates\n• Known Limitations - what it cannot do\n• Intended Use Cases - appropriate applications\n• Potential Biases - identified fairness issues\n• Evaluation Methods - how it was tested\n• Update History - version changes\n• Stakeholder Information - who developed it',
      hint: 'Architecture, data, metrics, limitations, use cases',
      tags: ['documentation', 'transparency', 'model-cards'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Amazon SageMaker Model Cards – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html', checked: '2026-11-25' },
        { title: 'RAIGT01-BP02 Create a system card that communicates intended usage and limitations – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raigt01-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c20',
      front: 'What are Model Cards and why are they important?',
      back: 'Standardized documentation providing transparency about ML models.\n\nContents:\n• Model Details - version, type, license\n• Intended Use - appropriate applications\n• Performance - metrics across demographics\n• Limitations - known weaknesses\n• Training Data - sources and characteristics\n• Ethical Considerations - fairness, bias\n• Recommendations - best practices for use\n\nBenefits: Transparency, accountability, informed use, trust',
      hint: 'Standardized model documentation',
      tags: ['model-cards', 'documentation', 'transparency'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Amazon SageMaker Model Cards – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html', checked: '2026-11-25' },
        { title: 'Responsible AI Tools and Resources – AWS', url: 'https://aws.amazon.com/ai/responsible-ai/resources/', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    // Additional Domain 4 cards: AWS tools, legal risks, sustainability, dataset characteristics,
    // bias effects on demographics, safety/transparency tradeoffs, human-centered design
    {
      id: 'd4c21',
      front: 'What is Amazon SageMaker Clarify?',
      back: 'AWS service for detecting bias and improving explainability in ML models.\n\nCapabilities:\n• Pre-Training Bias Detection - analyze training data for imbalances\n• Post-Training Bias Detection - measure bias in model predictions\n• Feature Importance - SHAP-based explanations for predictions\n• Bias Reports - detailed metrics across demographic groups\n• Integration - works within SageMaker pipelines\n\nBias metrics include: Class Imbalance (CI), Difference in Proportions of Labels (DPL), Conditional Demographic Disparity (CDD), and more.\n\nHelps meet regulatory and fairness requirements.\n\nNote: SageMaker Clarify is no longer open to new customers; existing customers can keep using it.',
      hint: 'AWS bias detection and explainability tool in SageMaker',
      tags: ['sagemaker-clarify', 'bias-detection', 'explainability', 'aws-services'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Fairness, model explainability and bias detection with SageMaker Clarify – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-configure-processing-jobs.html', checked: '2026-11-25' },
        { title: 'Pre-training Bias Metrics – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-measure-data-bias.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c22',
      front: 'What is Amazon SageMaker Model Monitor?',
      back: 'AWS service for continuously monitoring ML models in production.\n\nMonitoring types:\n• Data Quality - detect drift in input data distributions\n• Model Quality - track accuracy and performance degradation\n• Bias Drift - monitor fairness metrics over time\n• Feature Attribution Drift - changes in feature importance\n\nKey features:\n• Automated alerts when thresholds are breached\n• Integration with CloudWatch for dashboards\n• Baseline comparison against training data\n• Monitoring schedules for real-time endpoints and batch transform jobs\n\nEnsures models remain reliable and fair after deployment.\n\nNote: Model Monitor is no longer open to new customers; existing customers can keep using it.',
      hint: 'Continuous production monitoring for data quality, bias, and drift',
      tags: ['sagemaker-model-monitor', 'monitoring', 'drift-detection', 'aws-services'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Data and model quality monitoring with Amazon SageMaker Model Monitor – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c23',
      front: 'What is Amazon Augmented AI (Amazon A2I)?',
      back: 'AWS service for building human review workflows into ML applications.\n\nKey features:\n• Human Review Workflows - route low-confidence predictions to humans\n• Built-In Integration - works with Amazon Textract, Rekognition, and custom models\n• Private Workforce - use your own reviewers\n• Vendor Workforce - vendor-managed reviewers\n\nUse cases:\n• Content moderation review\n• Document processing verification\n• Sentiment analysis validation\n• Any prediction requiring human judgment\n\nImplements human-in-the-loop at scale.\n\nNote: Amazon A2I is no longer open to new customers; existing customers can keep using it.',
      hint: 'AWS service for human review workflows in ML applications',
      tags: ['amazon-a2i', 'human-review', 'hitl', 'aws-services'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Using Amazon Augmented AI for Human Review – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-use-augmented-ai-a2i-human-review-loops.html', checked: '2026-11-25' },
        { title: 'Core Components of Amazon A2I – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-getting-started-core-components.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c24',
      front: 'What are the legal risks associated with Generative AI?',
      back: 'Key legal risks:\n\n• IP Infringement Claims - GenAI may produce outputs resembling copyrighted material, exposing organizations to lawsuits\n• Biased Model Outputs - unfair results for some groups\n• Hallucinations - confident but false content\n• Loss of Customer Trust - inaccurate, biased, or harmful outputs damage brand reputation and customer relationships\n• End User Risk - users may rely on AI-generated content that is incorrect, misleading, or harmful\n• Data Privacy Violations - models may memorize and reveal sensitive training data\n• Liability Uncertainty - unclear who is responsible for AI-generated harm\n\nMitigation:\n• Content filtering and guardrails\n• Clear usage disclaimers and terms of service\n• Human review for high-stakes outputs\n• Regular legal and compliance audits',
      hint: 'IP infringement, trust loss, end user harm, privacy violations',
      tags: ['legal-risks', 'genai-risks', 'ip-infringement', 'compliance'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Content Domain 4: Guidelines for Responsible AI – AWS Certified AI Practitioner (AIF-C01) Exam Guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01-domain4.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c25',
      front: 'How do environmental sustainability considerations affect AI model selection?',
      back: 'Environmental factors in model selection:\n\n• Compute Footprint - larger models require more energy for training and inference\n• Carbon Emissions - data center energy consumption contributes to carbon output\n• Right-Sizing Models - choose the smallest model that meets requirements\n• Efficient Architectures - distilled or quantized models reduce resource usage\n• Region Selection - choose AWS regions powered by renewable energy\n\nBest practices:\n• Evaluate if a smaller, fine-tuned model can replace a large general model\n• Use serverless inference to avoid idle compute\n• Monitor and report energy consumption\n• Consider the full lifecycle: training, deployment, and ongoing inference costs\n\nBalancing performance needs with environmental responsibility.',
      hint: 'Energy use, carbon footprint, right-sizing models',
      tags: ['sustainability', 'environmental', 'model-selection', 'responsible-ai'],
      difficulty: 'intermediate',
      sources: [
        { title: 'GENSUS03-BP01 Leverage smaller models and optimized inference techniques to reduce carbon footprint – Generative AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gensus03-bp01.html', checked: '2026-11-25' },
        { title: 'MLSUS02-BP02 Select sustainable Regions – Machine Learning Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/mlsus02-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c26',
      front: 'What dataset characteristics help ensure responsible AI?',
      back: 'Key dataset characteristics:\n\n• Inclusivity - represent all affected populations, including minorities and edge cases\n• Diversity - cover a wide range of demographics, geographies, and scenarios\n• Balanced Datasets - ensure proportional representation to prevent majority-class bias\n• Curated Data Sources - use vetted, high-quality sources with known provenance\n\nBest practices:\n• Audit datasets for demographic gaps before training\n• Oversample underrepresented groups when needed\n• Document data collection methods and limitations\n• Use stratified sampling to maintain proportionality\n• Regularly refresh datasets to reflect current populations\n\nPoor data diversity is a common root cause of biased model behavior.',
      hint: 'Inclusivity, diversity, balance, curation',
      tags: ['dataset-quality', 'inclusivity', 'diversity', 'bias-prevention'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Content Domain 4: Guidelines for Responsible AI – AWS Certified AI Practitioner (AIF-C01) Exam Guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01-domain4.html', checked: '2026-11-25' },
        { title: 'RAIDP03-BP02 Minimize unwanted bias in your datasets – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raidp03-bp02.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c27',
      front: 'How do bias and variance in models affect different demographic groups?',
      back: 'Impact on demographic groups:\n\n• High Bias (underfitting) - model oversimplifies and ignores patterns unique to minority groups, leading to poor accuracy for underrepresented populations\n• High Variance (overfitting) - model memorizes majority group patterns and fails to generalize to other demographics\n• Disparate Error Rates - different groups experience different false positive/negative rates\n• Compounding Effects - small per-group errors compound into systemic disadvantage over time\n\nExamples:\n• Hiring model biased toward majority demographic\n• Medical diagnosis less accurate for underrepresented ethnicities\n• Loan approval models with higher rejection rates for certain groups\n\nMitigation: Evaluate metrics per demographic, not just overall accuracy.',
      hint: 'Underfitting ignores minorities, overfitting memorizes majority patterns',
      tags: ['bias-variance', 'demographic-impact', 'fairness', 'model-evaluation'],
      difficulty: 'advanced',
      sources: [
        { title: 'What is Overfitting? – AWS', url: 'https://aws.amazon.com/what-is/overfitting/', checked: '2026-11-25' },
        { title: 'RAIBR02-BP01 Identify potential harmful events impacting fairness – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raibr02-bp01.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.1'
    },
    {
      id: 'd4c28',
      front: 'What are the tradeoffs between model safety, transparency, and performance?',
      back: 'Key tradeoffs:\n\n• Interpretability vs. Performance - simple, explainable models (decision trees, linear regression) often underperform complex ones (deep neural networks) on difficult tasks\n• Safety Guardrails vs. Utility - stricter content filtering reduces harmful outputs but may block legitimate use cases (over-refusal)\n• Transparency vs. Proprietary Protection - full model disclosure aids trust but may expose trade secrets or enable adversarial attacks\n• Latency vs. Safety - adding safety checks (guardrails, human review) increases response time\n\nHow to balance:\n• Match the level of explainability to the risk level of the application\n• Use post-hoc explainability (SHAP, LIME) for complex models\n• Calibrate safety thresholds per use case\n• Document tradeoff decisions for stakeholders',
      hint: 'Explainability vs. accuracy, safety filters vs. usefulness',
      tags: ['tradeoffs', 'interpretability', 'safety', 'performance'],
      difficulty: 'advanced',
      sources: [
        { title: 'RAISP01 BP02 Consider design trade-offs across competing objectives – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp01-bp02.html', checked: '2026-11-25' },
        { title: 'RAISP02-BP07 Incorporate explainability mechanisms into the core AI system – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raisp02-bp07.html', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    },
    {
      id: 'd4c29',
      front: 'What are human-centered design principles for explainable AI?',
      back: 'Designing AI explanations with end users in mind:\n\n• Audience-Appropriate - tailor explanations to the user (technical vs. non-technical)\n• Actionable Explanations - help users understand what they can do differently\n• Contextual Relevance - explain only the factors relevant to the specific decision\n• Progressive Disclosure - provide summary first, details on demand\n• Multiple Modalities - use text, visuals, and examples as appropriate\n• User Control - let users ask follow-up questions or request more detail\n\nDesign principles:\n• Involve end users in designing explanation interfaces\n• Test explanations for comprehension, not just accuracy\n• Avoid information overload\n• Build user trust through consistent and honest explanations\n\nGoal: Empower users to make informed decisions based on AI outputs.',
      hint: 'Tailor explanations to users, actionable, progressive disclosure',
      tags: ['human-centered-design', 'explainability', 'ux', 'transparency'],
      difficulty: 'advanced',
      sources: [
        { title: 'RAIGT01-BP04 Guide users on how to understand system outputs – Responsible AI Lens', url: 'https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/raigt01-bp04.html', checked: '2026-11-25' },
        { title: 'What is Explainable AI? – AWS', url: 'https://aws.amazon.com/what-is/explainable-ai/', checked: '2026-11-25' }
      ],
      taskStatement: '4.2'
    }
  ]
};

// Helper functions
export const getAllDecks = () => Object.values({ domain4 });

export const getDeckById = (id) => ({ domain4 })[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values({ domain4 }).forEach(deck => {
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
  Object.values({ domain4 }).forEach(deck => {
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
  Object.values({ domain4 }).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
