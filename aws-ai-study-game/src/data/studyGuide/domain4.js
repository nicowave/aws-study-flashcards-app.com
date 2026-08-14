// Domain 4: Guidelines for Responsible AI (14%)
export const domain4Guide = {
  id: 'domain4',
  name: 'Guidelines for Responsible AI',
  icon: '\u2696\uFE0F',
  color: '#32CD32',
  weight: '14%',
  description: 'Responsible AI practices including bias detection, explainability, guardrails, and human oversight.',
  sections: [
    {
      id: 'd4s1',
      title: 'AI Bias and Fairness',
      content: [
        { type: 'paragraph', text: 'Bias in AI systems occurs when model outputs systematically favor or disadvantage particular groups. Bias can enter at any stage of the machine learning pipeline — from data collection and labeling to model training and deployment. Identifying and mitigating bias is a core responsibility when building AI systems, and the exam tests your ability to recognize different bias types and their origins.' },
        { type: 'keyTerm', term: 'Selection Bias', definition: 'Occurs when the training data is not representative of the real-world population the model will serve. For example, training a hiring model only on data from one geographic region creates selection bias because it does not reflect the diversity of the full applicant pool.' },
        { type: 'keyTerm', term: 'Measurement Bias', definition: 'Arises when the data collection process introduces systematic errors. This can happen when different groups are measured using different standards, tools, or criteria — for example, using different diagnostic thresholds for different demographic groups in a medical dataset.' },
        { type: 'keyTerm', term: 'Confirmation Bias', definition: 'Occurs when data collection or model design favors information that confirms pre-existing beliefs or hypotheses. Teams may unconsciously select features or label data in ways that reinforce expected outcomes rather than letting the data speak for itself.' },
        { type: 'keyTerm', term: 'Automation Bias', definition: 'The tendency for humans to over-rely on automated system outputs, accepting AI predictions without sufficient critical evaluation. This is particularly dangerous in high-stakes domains like healthcare and criminal justice where human oversight is essential.' },
        { type: 'keyTerm', term: 'Sample Bias (Sampling Bias)', definition: 'Occurs when certain groups are overrepresented or underrepresented in the training dataset. For example, a facial recognition model trained predominantly on lighter-skinned faces will perform poorly on darker-skinned faces because of imbalanced representation.' },
        { type: 'keyTerm', term: 'Reporting Bias', definition: 'Happens when the frequency of events in the training data does not reflect their real-world frequency. People tend to report unusual or noteworthy events more often, so datasets built from user-generated content may overrepresent dramatic outcomes and underrepresent common ones.' },
        { type: 'numberedList', title: 'How Bias Enters the ML Pipeline:', items: [
          'Data Collection — Non-representative sampling, historical inequities baked into the data, or biased labeling by human annotators.',
          'Feature Selection — Choosing features that correlate with protected attributes (e.g., zip code as a proxy for race) introduces indirect discrimination.',
          'Model Training — Algorithms optimize for the objective function, which may amplify existing biases if the training data is skewed.',
          'Evaluation — Using biased or unbalanced test sets can mask poor performance on underrepresented groups.',
          'Deployment — Feedback loops can reinforce bias over time when model predictions influence the data that is collected next.'
        ]},
        { type: 'bulletList', title: 'Bias Detection Strategies:', items: [
          'Analyze training data distributions across demographic groups before training',
          'Compute fairness metrics (demographic parity, equalized odds, disparate impact ratio) after training',
          'Use AWS SageMaker Clarify to detect pre-training and post-training bias automatically',
          'Perform disaggregated evaluation — measure model performance separately for each subgroup',
          'Conduct adversarial testing with edge cases and underrepresented scenarios',
          'Establish continuous monitoring for bias drift after deployment'
        ]},
        { type: 'examTip', text: 'Know all six bias types and be able to identify them from scenario descriptions. The exam will describe a situation and ask which type of bias is present. Selection bias = non-representative data, measurement bias = inconsistent data collection, sample bias = imbalanced group representation, reporting bias = skewed event frequency, confirmation bias = pre-existing assumptions influence design, automation bias = over-trusting AI outputs.' }
      ]
    },
    {
      id: 'd4s2',
      title: 'Model Explainability and Interpretability',
      content: [
        { type: 'paragraph', text: 'As AI models are used in more consequential decisions, stakeholders need to understand why a model produces a specific prediction. Explainability and interpretability are related but distinct concepts that address this need. Both are critical for building trust, meeting regulatory requirements, and debugging model behavior.' },
        { type: 'comparison', title: 'Interpretability vs. Explainability', items: [
          { label: 'Interpretability', description: 'Refers to how easily a human can understand the internal mechanics of a model. Inherently interpretable models (like linear regression or decision trees) have transparent logic that can be directly inspected. The model itself is understandable.' },
          { label: 'Explainability', description: 'Refers to the ability to provide post-hoc explanations for a model\'s predictions, even when the model is a black box. Techniques like SHAP values and feature importance are applied after training to explain individual predictions or overall model behavior.' }
        ]},
        { type: 'keyTerm', term: 'SHAP (SHapley Additive exPlanations)', definition: 'A game-theory-based method that assigns each feature an importance value for a particular prediction. SHAP values show how much each feature contributed to pushing the prediction above or below the average. They provide both local explanations (individual predictions) and global explanations (overall feature importance). Used by SageMaker Clarify.' },
        { type: 'keyTerm', term: 'Feature Importance', definition: 'A ranking of input features by their contribution to model predictions. Can be computed globally (across all predictions) or locally (for a single prediction). Methods include permutation importance, gain-based importance in tree models, and SHAP-based importance.' },
        { type: 'keyTerm', term: 'Attention Visualization', definition: 'A technique specific to transformer-based models that shows which parts of the input the model focused on when generating its output. For example, in a text classification task, attention maps highlight which words were most influential in the model\'s decision.' },
        { type: 'table', headers: ['Model Type', 'Interpretability Level', 'Explanation Approach'], rows: [
          ['Linear Regression', 'High — inherently interpretable', 'Coefficients directly show feature impact'],
          ['Decision Tree', 'High — inherently interpretable', 'Follow the tree path from root to leaf'],
          ['Random Forest', 'Medium — ensemble of trees', 'Feature importance, partial dependence plots'],
          ['Neural Network', 'Low — black box', 'SHAP, attention maps, saliency maps'],
          ['Large Language Model', 'Very Low — complex black box', 'SHAP, attention visualization, prompt-based explanations']
        ]},
        { type: 'paragraph', text: 'There is a fundamental trade-off between model complexity and interpretability. Simple models like linear regression are easy to interpret but may not capture complex patterns. Deep neural networks can model highly complex relationships but are difficult to explain. Choosing the right balance depends on the use case — regulated industries often require higher interpretability even at the cost of some accuracy.' },
        { type: 'bulletList', title: 'When Explainability is Especially Important:', items: [
          'Regulated industries (finance, healthcare) where decisions must be justified',
          'High-stakes decisions affecting individuals (loan approvals, hiring, criminal justice)',
          'Debugging model errors and understanding failure modes',
          'Building trust with end users and stakeholders',
          'Compliance with AI governance frameworks and organizational policies'
        ]},
        { type: 'examTip', text: 'The exam distinguishes between interpretability (understanding the model itself) and explainability (understanding predictions after the fact). SHAP is the most commonly tested explainability technique — know that it assigns per-feature contribution scores and is used by SageMaker Clarify. If a question asks about understanding a black-box model, the answer involves explainability techniques, not interpretability.' }
      ]
    },
    {
      id: 'd4s3',
      title: 'Amazon Bedrock Guardrails',
      content: [
        { type: 'paragraph', text: 'Amazon Bedrock Guardrails provide configurable safeguards that wrap around foundation model (FM) invocations to enforce responsible AI policies. Guardrails evaluate both user inputs and model outputs, blocking or filtering content that violates your defined policies. They are the primary AWS mechanism for implementing content safety controls on generative AI applications.' },
        { type: 'awsService', name: 'Amazon Bedrock Guardrails', description: 'A feature of Amazon Bedrock that lets you define and enforce content policies for your generative AI applications. Guardrails sit between the user and the foundation model, filtering both inputs and outputs. You can create multiple guardrails with different configurations and apply them to different use cases within the same application.' },
        { type: 'keyTerm', term: 'Content Filtering', definition: 'Guardrails can filter harmful content across categories such as hate speech, insults, sexual content, violence, and misconduct. Each category can be configured with adjustable strength levels (none, low, medium, high) independently for both inputs and outputs.' },
        { type: 'keyTerm', term: 'Denied Topics', definition: 'Custom topics that you define as off-limits for your application. You provide a natural language description of each denied topic, and the guardrail blocks any user inputs or model responses that touch on those subjects. For example, a customer service chatbot could deny topics related to competitor comparisons or investment advice.' },
        { type: 'keyTerm', term: 'Word Filters', definition: 'Exact word or phrase blocklists that prevent specific terms from appearing in inputs or outputs. Also includes a managed profanity filter. Useful for blocking brand-specific terms, competitor names, or inappropriate language.' },
        { type: 'keyTerm', term: 'Sensitive Information Filters (PII)', definition: 'Guardrails can detect and handle personally identifiable information (PII) such as names, email addresses, phone numbers, social security numbers, and credit card numbers. PII can be either blocked entirely or redacted (masked) in the output, depending on configuration.' },
        { type: 'keyTerm', term: 'Contextual Grounding Check', definition: 'Evaluates whether the model\'s response is grounded in the provided source material (for RAG applications) and is relevant to the user\'s query. This helps detect and prevent hallucinations by checking that responses are factually supported by the reference context.' },
        { type: 'numberedList', title: 'How Guardrails Work in the Request Flow:', items: [
          'User sends a prompt to the generative AI application.',
          'The guardrail evaluates the input against all configured policies (content filters, denied topics, word filters, PII filters).',
          'If the input violates a policy, the request is blocked and a configurable blocked message is returned to the user.',
          'If the input passes, it is forwarded to the foundation model for inference.',
          'The model generates a response.',
          'The guardrail evaluates the output against all configured policies and contextual grounding checks.',
          'If the output violates a policy, it is blocked or the PII is redacted before the response reaches the user.',
          'The clean response is returned to the user.'
        ]},
        { type: 'table', headers: ['Guardrail Feature', 'What It Controls', 'Configuration Options'], rows: [
          ['Content Filters', 'Harmful content categories (hate, violence, sexual, etc.)', 'Strength levels per category, separate for input and output'],
          ['Denied Topics', 'Custom off-limits subjects', 'Natural language topic descriptions'],
          ['Word Filters', 'Specific words or phrases', 'Custom blocklist + managed profanity filter'],
          ['PII Filters', 'Personally identifiable information', 'Block or redact, per PII type'],
          ['Contextual Grounding', 'Hallucination and relevance', 'Grounding threshold and relevance threshold']
        ]},
        { type: 'examTip', text: 'Amazon Bedrock Guardrails is the go-to answer for any exam question about content safety, filtering harmful outputs, blocking PII, preventing hallucinations in RAG, or enforcing topic restrictions in generative AI applications. Remember that guardrails evaluate both inputs AND outputs, and that PII can be either blocked or redacted.' }
      ]
    },
    {
      id: 'd4s4',
      title: 'Amazon SageMaker Clarify',
      content: [
        { type: 'paragraph', text: 'Amazon SageMaker Clarify is a purpose-built tool for detecting bias in ML datasets and models, and for providing feature-level explanations of model predictions. It integrates directly into the SageMaker ML workflow and can be used during data preparation, after training, and during production monitoring.' },
        { type: 'awsService', name: 'Amazon SageMaker Clarify', description: 'Detects potential bias in data and ML models, and provides explanations for model predictions using SHAP values. Works across the ML lifecycle — pre-training (data analysis), post-training (model evaluation), and in production (monitoring for bias drift). Integrates with SageMaker Pipelines, Studio, and Model Monitor.' },
        { type: 'keyTerm', term: 'Pre-Training Bias Detection', definition: 'Analyzes the raw training data before any model is built. Identifies imbalances and potential sources of bias in the dataset by computing metrics like Class Imbalance (CI), Difference in Proportions of Labels (DPL), and Kullback-Leibler Divergence (KL). Helps you fix data issues before they propagate into the model.' },
        { type: 'keyTerm', term: 'Post-Training Bias Detection', definition: 'Evaluates the trained model\'s predictions for bias by comparing outcomes across different groups. Uses metrics like Disparate Impact (DI), Difference in Conditional Acceptance (DCA), and Treatment Equality (TE). Reveals whether the model treats different groups fairly in its predictions.' },
        { type: 'comparison', title: 'Pre-Training vs. Post-Training Bias Detection', items: [
          { label: 'Pre-Training Bias Detection', description: 'Examines the data before model training. Answers the question: "Is the training data fair and representative?" Catches issues like underrepresentation, label imbalance, and distribution differences across groups. Does not require a trained model.' },
          { label: 'Post-Training Bias Detection', description: 'Examines the model\'s predictions after training. Answers the question: "Does the trained model produce fair outcomes?" A model can introduce or amplify bias even when trained on relatively balanced data, so post-training checks are essential.' }
        ]},
        { type: 'keyTerm', term: 'SHAP-Based Feature Explanations', definition: 'SageMaker Clarify uses SHAP (Kernel SHAP) to compute feature attributions that explain why the model made each prediction. This provides both global explanations (which features matter most overall) and local explanations (which features drove a specific individual prediction).' },
        { type: 'bulletList', title: 'Key Bias Metrics in SageMaker Clarify:', items: [
          'Class Imbalance (CI) — Measures whether one group has significantly more or fewer samples than another',
          'Difference in Proportions of Labels (DPL) — Compares the proportion of positive outcomes between groups in the training data',
          'Disparate Impact (DI) — Ratio of positive outcome rates between groups in model predictions; a value far from 1.0 suggests bias',
          'Difference in Conditional Acceptance (DCA) — Compares acceptance rates between groups for individuals the model predicts as positive',
          'Counterfactual Fliptest (FT) — Checks whether changing a sensitive attribute (e.g., gender) flips the model prediction'
        ]},
        { type: 'numberedList', title: 'SageMaker Clarify Integration Points:', items: [
          'SageMaker Data Wrangler — Run pre-training bias analysis as part of data preparation.',
          'SageMaker Experiments — Track bias metrics alongside model training experiments.',
          'SageMaker Pipelines — Automate bias detection as a step in your ML pipeline for CI/CD workflows.',
          'SageMaker Model Monitor — Continuously monitor deployed models for bias drift over time.',
          'SageMaker Studio — Visualize bias reports and SHAP explanations in an interactive notebook environment.'
        ]},
        { type: 'examTip', text: 'SageMaker Clarify is the answer whenever the exam asks about detecting bias in data or models, or about explaining model predictions with feature importance. Remember the distinction: pre-training bias detection analyzes data, post-training bias detection analyzes model predictions. Clarify also provides SHAP-based explainability — do not confuse it with Bedrock Guardrails, which handles content safety for generative AI.' }
      ]
    },
    {
      id: 'd4s5',
      title: 'Human-in-the-Loop and Amazon A2I',
      content: [
        { type: 'paragraph', text: 'Human-in-the-loop (HITL) refers to the practice of incorporating human judgment into AI workflows, particularly at points where automated decisions could have significant consequences or where model confidence is low. Rather than fully automating every decision, HITL systems route certain predictions to human reviewers for validation, correction, or override.' },
        { type: 'keyTerm', term: 'Human-in-the-Loop (HITL)', definition: 'A design pattern where humans are integrated into the AI decision-making process. Humans review, validate, or correct AI predictions before they are acted upon. This is essential for maintaining accuracy, accountability, and fairness in high-stakes or ambiguous situations.' },
        { type: 'bulletList', title: 'When to Use Human-in-the-Loop:', items: [
          'High-stakes decisions — medical diagnoses, loan approvals, legal determinations, and safety-critical systems where errors have serious consequences',
          'Low-confidence predictions — when the model\'s confidence score falls below a defined threshold, route to a human reviewer',
          'Sensitive content — moderation of user-generated content, flagged images, or potentially harmful text that requires nuanced human judgment',
          'Regulatory requirements — industries where regulations mandate human oversight of automated decisions (e.g., EU AI Act, financial compliance)',
          'Model improvement — human feedback on edge cases and errors feeds back into the training process, improving the model over time',
          'New deployment — during initial rollout of an AI system, human review catches errors before the model is trusted to operate autonomously'
        ]},
        { type: 'awsService', name: 'Amazon Augmented AI (Amazon A2I)', description: 'A managed service that makes it easy to build human review workflows for ML predictions. A2I lets you define conditions that trigger human review (e.g., confidence thresholds), route predictions to human reviewers (private teams, AWS Marketplace vendors, or Amazon Mechanical Turk), and collect structured feedback. Integrates directly with Amazon Rekognition, Amazon Textract, and any custom ML model.' },
        { type: 'numberedList', title: 'Amazon A2I Workflow Components:', items: [
          'Worker Task Template — Defines the UI that human reviewers see, including the data to review and the response options available.',
          'Flow Definition — Specifies the conditions that trigger human review (e.g., confidence score below 0.90) and which workforce should perform the review.',
          'Human Loop — A single unit of human review work, created when a prediction meets the trigger conditions. Contains the data, context, and routing information.',
          'Workforce — The pool of human reviewers: a private team (your employees), an AWS Marketplace vendor, or Amazon Mechanical Turk workers.'
        ]},
        { type: 'comparison', title: 'A2I Workforce Options', items: [
          { label: 'Private Workforce', description: 'Your own employees or contractors. Best for sensitive or proprietary data that cannot leave your organization. You manage access through Amazon Cognito or OIDC identity providers.' },
          { label: 'AWS Marketplace Vendors', description: 'Pre-vetted third-party companies that specialize in data labeling and review tasks. Good for scaling without building an internal team. Subject to vendor agreements.' },
          { label: 'Amazon Mechanical Turk', description: 'A crowdsourced workforce of distributed workers. Best for high-volume, non-sensitive tasks where data privacy is not a concern. Most scalable but least controlled option.' }
        ]},
        { type: 'table', headers: ['A2I Integration', 'Use Case', 'Default Trigger'], rows: [
          ['Amazon Rekognition', 'Content moderation — review flagged images', 'Confidence below threshold for unsafe content'],
          ['Amazon Textract', 'Document processing — review low-confidence extractions', 'Confidence below threshold for key-value pairs or tables'],
          ['Custom Models', 'Any ML model — review predictions via custom conditions', 'You define the trigger conditions in the flow definition']
        ]},
        { type: 'examTip', text: 'Amazon A2I is the answer when the exam asks about adding human review to ML predictions, routing low-confidence results to reviewers, or building human oversight workflows. Remember the three workforce options (private, Marketplace, Mechanical Turk) and the built-in integrations with Rekognition and Textract. For custom models, you define your own trigger conditions.' }
      ]
    },
    {
      id: 'd4s6',
      title: 'Transparency, Intellectual Property, and Sustainability',
      content: [
        { type: 'paragraph', text: 'Responsible AI extends beyond model performance and fairness. Organizations must also address transparency in how models are built and used, intellectual property (IP) considerations around training data and generated outputs, and the environmental impact of large-scale model training. These topics are increasingly relevant on the exam as AI governance matures.' },
        { type: 'keyTerm', term: 'Model Documentation (Model Cards)', definition: 'Structured documentation that describes a model\'s intended use, training data, performance metrics, limitations, and ethical considerations. Model cards promote transparency by making it clear what a model can and cannot do, and under what conditions it was evaluated.' },
        { type: 'bulletList', title: 'Transparency Best Practices:', items: [
          'Publish model cards documenting intended use cases, limitations, and known failure modes',
          'Clearly disclose when users are interacting with an AI system rather than a human',
          'Document the training data sources, preprocessing steps, and any data filtering applied',
          'Provide explanations for automated decisions when they affect individuals (right to explanation)',
          'Maintain audit trails of model versions, training runs, and configuration changes',
          'Communicate model confidence levels to end users so they can calibrate their trust appropriately'
        ]},
        { type: 'keyTerm', term: 'Data Lineage and Provenance', definition: 'The ability to trace data back to its origin and track all transformations it has undergone. Data lineage answers the questions: Where did this data come from? How was it processed? Who had access to it? This is critical for compliance, debugging, and establishing trust in model outputs.' },
        { type: 'keyTerm', term: 'Intellectual Property (IP) in AI', definition: 'Legal considerations around who owns the training data, whether the model has the right to use it, and who owns the outputs generated by AI systems. These are evolving legal questions with significant business implications.' },
        { type: 'bulletList', title: 'Intellectual Property Considerations:', items: [
          'Training data licensing — Ensure you have the legal right to use data for model training; copyrighted material may require explicit licensing',
          'Output ownership — Generated content (text, images, code) may not have clear copyright ownership; policies vary by jurisdiction',
          'Model weights and artifacts — Trained model weights may be considered trade secrets or proprietary assets depending on how they were developed',
          'Open-source model licenses — Different open-source models have different licensing terms (some restrict commercial use, modification, or redistribution)',
          'Indemnification — Some AI service providers (including AWS with certain Bedrock models) offer IP indemnification to protect customers against copyright infringement claims related to model outputs'
        ]},
        { type: 'keyTerm', term: 'AI Sustainability and Environmental Impact', definition: 'Training large foundation models requires enormous computational resources, consuming significant amounts of electricity and generating a substantial carbon footprint. Responsible AI practices include considering the environmental cost of model training and inference, and taking steps to minimize it.' },
        { type: 'bulletList', title: 'Reducing the Environmental Impact of AI:', items: [
          'Use pre-trained or fine-tuned models instead of training from scratch whenever possible',
          'Leverage serverless inference to avoid running idle GPU instances',
          'Choose energy-efficient instance types and AWS Regions powered by renewable energy',
          'Apply model compression techniques (distillation, quantization, pruning) to reduce inference compute requirements',
          'Use managed services like Amazon Bedrock that optimize resource utilization across customers',
          'Monitor and report on the carbon footprint of ML workloads using tools like the AWS Customer Carbon Footprint Tool'
        ]},
        { type: 'table', headers: ['Responsible AI Pillar', 'Key Concern', 'AWS Approach'], rows: [
          ['Transparency', 'Users and stakeholders understand how AI works', 'Model cards, SageMaker Model Registry, CloudWatch logging'],
          ['Fairness', 'Models treat all groups equitably', 'SageMaker Clarify for bias detection and monitoring'],
          ['Safety', 'AI outputs do not cause harm', 'Bedrock Guardrails for content filtering and PII protection'],
          ['Accountability', 'Humans maintain oversight and control', 'Amazon A2I for human review workflows'],
          ['Privacy', 'Personal data is protected', 'Bedrock Guardrails PII filters, data encryption, VPC endpoints'],
          ['Sustainability', 'Environmental impact is minimized', 'Efficient instance types, serverless inference, Graviton chips']
        ]},
        { type: 'examTip', text: 'Expect 1-2 questions on IP and data licensing. Know that using copyrighted data for training requires proper licensing, that AI-generated output ownership is legally uncertain, and that some AWS services offer IP indemnification. For sustainability questions, remember that using pre-trained models and managed services is more environmentally responsible than training from scratch. The exam may also ask about transparency — model cards and data lineage are key concepts.' }
      ]
    }
  ]
};
