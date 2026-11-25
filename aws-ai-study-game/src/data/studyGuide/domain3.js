// Domain 3: Applications of Foundation Models (28%)
export const domain3Guide = {
  id: 'domain3',
  name: 'Applications of Foundation Models',
  icon: '\u{1F680}',
  color: '#22d3ee',
  weight: '28%',
  description: 'Prompt engineering, RAG, Bedrock agents, model customization, evaluation metrics, and AWS AI services for real-world applications.',
  sections: [
    {
      id: 'd3s1',
      title: 'Prompt Engineering Techniques',
      sources: [
        { title: 'What is Prompt Engineering? – AWS', url: 'https://aws.amazon.com/what-is/prompt-engineering/', checked: '2026-11-25' },
        { title: 'Prompt engineering concepts – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-engineering-guidelines.html', checked: '2026-11-25' },
        { title: 'Design a prompt – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/design-a-prompt.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Prompt engineering is the art and science of crafting inputs to guide a foundation model toward producing the desired output. It is the simplest and most cost-effective way to customize model behavior — no training required.' },
        { type: 'keyTerm', term: 'Zero-Shot Prompting', definition: 'Asking the model to perform a task without providing any examples. The model relies entirely on its pre-training knowledge. Example: "Classify this review as positive or negative: \'The product was terrible.\'"' },
        { type: 'keyTerm', term: 'Few-Shot Prompting', definition: 'Providing a few examples of the desired input-output pattern before the actual task (also called in-context learning). This helps the model understand the expected format and behavior. Example: giving 3 classified reviews before asking it to classify a new one.' },
        { type: 'keyTerm', term: 'Chain-of-Thought (CoT) Prompting', definition: 'Instructing the model to show its reasoning step-by-step before arriving at a final answer. This significantly improves accuracy on complex reasoning, math, and multi-step problems. Triggered by phrases like "Think step by step" or "Show your reasoning."' },
        { type: 'keyTerm', term: 'Prompt Template', definition: 'A reusable prompt structure with placeholders for variable content. Templates ensure consistent formatting and behavior across many requests. Example: "You are a {role}. Given the following {context}, answer the question: {question}"' },
        { type: 'keyTerm', term: 'System Prompt', definition: 'Instructions that set the model\'s overall behavior, persona, and constraints for an entire conversation. System prompts define the "rules" the model should follow, separate from the user\'s individual messages.' },
        { type: 'bulletList', title: 'Best practices for effective prompts:', items: [
          'Be specific and clear about the desired output format',
          'Provide relevant context and constraints',
          'Use delimiters to separate instructions from content',
          'Specify the desired length, tone, and style',
          'Include examples (few-shot) for complex or ambiguous tasks',
          'Iterate and refine based on output quality'
        ]},
        { type: 'examTip', text: 'Zero-shot = no examples, few-shot = with examples, chain-of-thought = step-by-step reasoning. The exam will give scenarios and ask which technique is most appropriate. Chain-of-thought is best for complex reasoning; few-shot is best when you need a specific output format.' }
      ]
    },
    {
      id: 'd3s2',
      title: 'Inference Parameters',
      sources: [
        { title: 'Influence response generation with inference parameters – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Inference parameters control HOW the model generates responses without changing the model itself. These are set per request and affect the randomness, length, and diversity of outputs.' },
        { type: 'keyTerm', term: 'Temperature', definition: 'Controls the randomness of the model\'s output by reshaping the probability distribution for the next token. The allowed range and default depend on the model (often 0 to 1). Low temperature (e.g., 0.1-0.3) favors higher-probability tokens for focused, more deterministic outputs. High temperature (e.g., 0.7-1.0) makes lower-probability tokens more likely, giving more creative, varied outputs.' },
        { type: 'keyTerm', term: 'Top-p (Nucleus Sampling)', definition: 'Controls the cumulative probability threshold for token selection. The model considers only the most likely tokens that together make up the top p of the probability distribution. Top-p = 0.9 means the model picks from the top 90% of the distribution, so the number of candidates varies from token to token. Lower values are more focused.' },
        { type: 'keyTerm', term: 'Top-k', definition: 'Limits the model to choosing from only the top K most likely next tokens. Top-k = 50 means only the 50 highest-probability tokens are considered at each step. Lower values produce more focused outputs.' },
        { type: 'keyTerm', term: 'Max Tokens', definition: 'The maximum number of tokens the model will generate in its response. This is a hard limit — the response will stop at this count. Does not affect quality, only length.' },
        { type: 'keyTerm', term: 'Stop Sequences', definition: 'Specific strings that tell the model to stop generating when encountered. Useful for controlling output boundaries, such as stopping at a newline or a specific delimiter.' },
        { type: 'table', headers: ['Parameter', 'What It Controls', 'Low Value Effect', 'High Value Effect'], rows: [
          ['Temperature', 'Randomness', 'Focused, deterministic', 'Creative, diverse'],
          ['Top-p', 'Token probability threshold', 'Very focused', 'More variety'],
          ['Top-k', 'Number of candidate tokens', 'Fewer choices, more focused', 'More choices, more variety'],
          ['Max Tokens', 'Response length limit', 'Shorter responses', 'Longer responses']
        ]},
        { type: 'examTip', text: 'Low temperature = factual/deterministic tasks (data extraction, classification). High temperature = creative tasks (story writing, brainstorming). The exam frequently tests understanding of temperature\'s effect on output.' }
      ]
    },
    {
      id: 'd3s3',
      title: 'Retrieval Augmented Generation (RAG)',
      sources: [
        { title: 'Retrieve data and generate AI responses with Amazon Bedrock Knowledge Bases – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', checked: '2026-11-25' },
        { title: 'How Amazon Bedrock knowledge bases work – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/kb-how-it-works.html', checked: '2026-11-25' },
        { title: 'What is RAG? – AWS', url: 'https://aws.amazon.com/what-is/retrieval-augmented-generation/', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'RAG is one of the most important patterns in generative AI applications. It solves the problem of models not having access to current, proprietary, or domain-specific information by retrieving relevant data and including it in the prompt.' },
        { type: 'keyTerm', term: 'RAG (Retrieval Augmented Generation)', definition: 'A three-step pattern: (1) Query a data source to find relevant information, (2) Augment the prompt with the retrieved information, (3) Generate a response using the augmented prompt. RAG keeps models grounded in factual, up-to-date data without retraining.' },
        { type: 'numberedList', title: 'The RAG Process:', items: [
          'User sends a query to the application',
          'The query is converted to an embedding (vector representation)',
          'The embedding is used to search a vector database for semantically similar documents',
          'The most relevant document chunks are retrieved',
          'These chunks are added to the prompt as context',
          'The augmented prompt is sent to the foundation model',
          'The model generates a response grounded in the retrieved information'
        ]},
        { type: 'keyTerm', term: 'Vector Database', definition: 'A database optimized for storing and searching vector embeddings. It enables semantic similarity search — finding documents that are semantically similar to a query, even if they do not share exact keywords.' },
        { type: 'awsService', name: 'Amazon Bedrock Knowledge Bases', description: 'A managed RAG feature in Bedrock. You point it at your data sources (S3, web crawlers, etc.), and Bedrock automatically chunks the documents, generates embeddings, stores them in a vector database, and handles retrieval at query time. No RAG pipeline code needed.' },
        { type: 'bulletList', title: 'When to use RAG vs. fine-tuning:', items: [
          'RAG: When you need current or frequently updated information',
          'RAG: When you need to cite specific source documents',
          'RAG: When you want to avoid retraining costs',
          'Fine-tuning: When you need to change the model\'s style, format, or behavior consistently',
          'Fine-tuning: When the knowledge is stable and does not change often',
          'Both: Can be combined for best results'
        ]},
        { type: 'examTip', text: 'RAG is the recommended approach for adding proprietary, current, or domain-specific knowledge to a model without retraining. Know the three-step process: retrieve, augment, generate. Bedrock Knowledge Bases is the managed RAG solution on AWS.' }
      ]
    },
    {
      id: 'd3s4',
      title: 'Bedrock Agents and Orchestration',
      sources: [
        { title: 'Automate tasks in your application using AI agents – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html', checked: '2026-11-25' },
        { title: 'How Amazon Bedrock Agents works – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/agents-how.html', checked: '2026-11-25' },
        { title: 'Amazon Bedrock Agents Classic maintenance mode – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Agents extend foundation models beyond simple question-answering by enabling them to take actions, call APIs, query databases, and orchestrate multi-step workflows. An agent interprets user input, plans a sequence of actions, executes them, and returns results.' },
        { type: 'keyTerm', term: 'Agent', definition: 'An AI application that can autonomously plan and execute multi-step tasks by combining a foundation model with external tools (APIs, databases, functions). The model acts as the "brain" that decides which tools to use and in what order.' },
        { type: 'keyTerm', term: 'Orchestration', definition: 'The process of coordinating between a foundation model and external data sources, APIs, or applications. The model decides what actions to take, the orchestration layer executes them, and results are fed back to the model.' },
        { type: 'awsService', name: 'Amazon Bedrock Agents', description: 'A managed feature for creating agents that can plan and execute multi-step tasks. You define the agent\'s instructions, available actions (via API schemas), and knowledge bases. Bedrock handles the orchestration loop automatically. Now called Bedrock Agents Classic and closed to new customers since July 30, 2026; AWS recommends Amazon Bedrock AgentCore for new agents, but the exam may still say Bedrock Agents.' },
        { type: 'bulletList', title: 'Agent capabilities:', items: [
          'Break complex requests into steps and execute them in order',
          'Call external APIs and functions (action groups)',
          'Query knowledge bases for information',
          'Maintain conversation context across turns',
          'Ask the user for any missing details an action needs'
        ]},
        { type: 'examTip', text: 'Agents perform orchestration cyclically: interpret input, decide on action, execute, observe result, repeat. Know that Bedrock Agents combine the FM with action groups (APIs) and knowledge bases (data) to automate complex workflows.' }
      ]
    },
    {
      id: 'd3s5',
      title: 'Model Customization in Amazon Bedrock',
      sources: [
        { title: 'Customize your model to improve its performance for your use case – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/custom-models.html', checked: '2026-11-25' },
        { title: 'Customize a model with reinforcement fine-tuning in Amazon Bedrock – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/reinforcement-fine-tuning.html', checked: '2026-11-25' },
        { title: 'Amazon Bedrock FAQs – AWS', url: 'https://aws.amazon.com/bedrock/faqs/', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'The Amazon Bedrock User Guide currently lists three customization methods: supervised fine-tuning, reinforcement fine-tuning, and distillation. Continued pre-training on unlabeled data (offered for Amazon Titan models, per the Bedrock FAQs) is the fourth approach to know. Each suits different goals and data types.' },
        { type: 'keyTerm', term: 'Model Distillation', definition: 'Transferring knowledge from a larger "teacher" model to a smaller "student" model. The teacher generates high-quality responses that are used to train the student. Result: a smaller, faster, cheaper model that maintains much of the teacher\'s quality. Best for: reducing inference cost while preserving quality.' },
        { type: 'keyTerm', term: 'Reinforcement Fine-tuning', definition: 'Improving model alignment using reward functions instead of labeled data pairs. You define reward functions (for example, an AWS Lambda function or an AI judge) that score model outputs. The model learns to produce outputs that maximize the reward. Does NOT require labeled input-output pairs.' },
        { type: 'keyTerm', term: 'Supervised Fine-tuning', definition: 'Training the model on labeled data pairs (prompt + desired response). The model adjusts its parameters to produce outputs similar to your examples. Requires curated labeled data but produces highly consistent, task-specific behavior.' },
        { type: 'keyTerm', term: 'Continued Pre-training', definition: 'Training the model on unlabeled domain-specific text to teach it new vocabulary and concepts. The model learns from raw text without labeled pairs. Best for: teaching the model about a specialized domain (medical, legal, financial terminology).' },
        { type: 'table', headers: ['Method', 'Data Type', 'Goal', 'Cost'], rows: [
          ['Distillation', 'Teacher model outputs', 'Smaller, faster model', 'Medium'],
          ['Reinforcement Fine-tuning', 'Reward functions (Lambda)', 'Better alignment without labels', 'Medium-High'],
          ['Supervised Fine-tuning', 'Labeled pairs (input + output)', 'Task-specific behavior', 'High'],
          ['Continued Pre-training', 'Unlabeled domain text', 'Domain knowledge', 'Highest']
        ]},
        { type: 'examTip', text: 'Distillation = teacher-to-student (smaller/faster model). Reinforcement fine-tuning = reward functions, no labeled pairs. Supervised fine-tuning = labeled pairs. Continued pre-training = unlabeled text. Training is charged by tokens processed (training-data tokens x epochs), plus monthly storage for each custom model.' }
      ]
    },
    {
      id: 'd3s6',
      title: 'Evaluation Metrics for Generative AI',
      sources: [
        { title: 'Evaluating quality and reliability in generated outputs – AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/dev-experimenting-quality.html', checked: '2026-11-25' },
        { title: 'Automatically generate impressions from findings in radiology reports using generative AI on AWS – AWS Machine Learning Blog', url: 'https://aws.amazon.com/blogs/machine-learning/automatically-generate-impressions-from-findings-in-radiology-reports-using-generative-ai-on-aws/', checked: '2026-11-25' },
        { title: 'Model evaluation task types in Amazon Bedrock – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-evaluation-tasks.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Evaluating generative AI outputs is more challenging than traditional ML because outputs are open-ended text. Several automated metrics exist, each measuring different aspects of quality.' },
        { type: 'keyTerm', term: 'BLEU (Bilingual Evaluation Understudy)', definition: 'A precision-based metric that measures n-gram overlap between generated text and reference text. It counts how many n-grams (word sequences) in the output appear in the reference. Includes a brevity penalty for short outputs. Score range: 0 to 1. Originally designed for machine translation.' },
        { type: 'keyTerm', term: 'ROUGE (Recall-Oriented Understudy for Gisting Evaluation)', definition: 'A recall-based metric that measures how much of the reference text is captured in the generated text. ROUGE-1 checks unigram overlap, ROUGE-2 checks bigram overlap, ROUGE-L checks longest common subsequence. Commonly used for summarization evaluation.' },
        { type: 'keyTerm', term: 'BERTScore', definition: 'A semantic similarity metric that uses BERT embeddings to compare generated and reference text. Unlike BLEU and ROUGE (which compare exact words), BERTScore captures semantic equivalence — paraphrases score well even without exact word matches.' },
        { type: 'keyTerm', term: 'Perplexity', definition: 'Measures how well a model predicts a sample of text. Lower perplexity means the model is less "surprised" by the text, indicating better language modeling. Used to evaluate language model quality, not specific outputs.' },
        { type: 'comparison', title: 'BLEU vs. ROUGE', items: [
          { label: 'BLEU (Precision)', description: 'How much of the OUTPUT appears in the reference? Measures precision. "Of what the model said, how much was correct?" Best for: translation.' },
          { label: 'ROUGE (Recall)', description: 'How much of the REFERENCE appears in the output? Measures recall. "Of what should have been said, how much did the model say?" Best for: summarization.' }
        ]},
        { type: 'awsService', name: 'Amazon Bedrock Model Evaluation', description: 'A feature that lets you evaluate and compare models using automatic evaluations (accuracy, robustness, and toxicity, computed with metrics such as BERTScore for summarization and F1 for question answering), a judge model (LLM-as-a-judge), or human evaluation. Helps you select the best model for your specific use case.' },
        { type: 'examTip', text: 'BLEU = precision (n-gram overlap from output perspective). ROUGE = recall (n-gram overlap from reference perspective). BERTScore = semantic similarity. Perplexity = language model quality. The exam may ask which metric is best for translation (BLEU) vs. summarization (ROUGE).' }
      ]
    },
    {
      id: 'd3s7',
      title: 'AWS AI Services for Applications',
      sources: [
        { title: 'What is Amazon Q Business? – Amazon Q Business', url: 'https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/what-is.html', checked: '2026-11-25' },
        { title: 'What is Amazon Kendra? – Amazon Kendra', url: 'https://docs.aws.amazon.com/kendra/latest/dg/what-is-kendra.html', checked: '2026-11-25' },
        { title: 'What Is Amazon Polly? – Amazon Polly', url: 'https://docs.aws.amazon.com/polly/latest/dg/what-is.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'AWS provides pre-built AI services that handle common tasks without requiring ML expertise. These services are fully managed, pay-per-use, and accessible via APIs. They are important for Domain 3 because they represent ready-made applications of AI.' },
        { type: 'awsService', name: 'Amazon Polly', description: 'Text-to-speech service. Converts written text into lifelike speech using deep learning. Supports SSML for controlling pronunciation, speaking rate, pitch, and volume. Offers generative, long-form, neural, and standard voices in many languages and language variants.' },
        { type: 'awsService', name: 'Amazon Transcribe', description: 'Speech-to-text service. Converts audio to text using automatic speech recognition (ASR). Features: real-time and batch transcription, custom vocabulary, speaker diarization (who said what), automatic content redaction for PII.' },
        { type: 'awsService', name: 'Amazon Rekognition', description: 'Image and video analysis. Detects objects, faces, text, scenes, and activities. Can compare faces, moderate content, detect PPE, and recognize celebrities. No ML experience needed — just call the API with an image.' },
        { type: 'awsService', name: 'Amazon Textract', description: 'Intelligent document processing. Extracts text, forms, tables, and handwriting from scanned documents. Goes beyond basic OCR by understanding document structure and relationships between form fields and values.' },
        { type: 'awsService', name: 'Amazon Comprehend', description: 'NLP service for text analysis. Extracts sentiment (positive/negative/neutral/mixed), entities (people, places, dates), key phrases, language, and PII, and custom classifiers sort text into your own categories (topic modeling is no longer open to new customers). Comprehend Medical specializes in healthcare text.' },
        { type: 'awsService', name: 'Amazon Lex', description: 'Conversational AI for chatbots. Provides automatic speech recognition (ASR) and natural language understanding (NLU) to build chat and voice interfaces. Same technology as Alexa.' },
        { type: 'awsService', name: 'Amazon Kendra', description: 'Intelligent enterprise search powered by ML. Searches across multiple data sources (S3, databases, SharePoint, Salesforce, etc.) and returns specific answers to natural language queries, not just document links. No longer open to new customers: AWS points new builds to Amazon Bedrock Knowledge Bases.' },
        { type: 'awsService', name: 'Amazon Personalize', description: 'Real-time personalization and recommendation service. Creates personalized product recommendations, search results, and marketing content based on user behavior data.' },
        { type: 'awsService', name: 'Amazon Q Business', description: 'AI assistant for enterprises that answers questions, generates content, and takes actions based on your organization\'s data. Connects to enterprise data sources through built-in connectors and gives permissions-aware answers. No longer open to new customers: AWS Quick is its next evolution.' },
        { type: 'examTip', text: 'Match the service to the use case: Images/video = Rekognition. Text-to-speech = Polly. Speech-to-text = Transcribe. Documents/forms = Textract. Text analysis = Comprehend. Chatbots = Lex. Enterprise search = Kendra. Recommendations = Personalize. Enterprise AI assistant = Amazon Q Business (AWS Quick for new customers).' }
      ]
    }
  ]
};
