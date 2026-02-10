// Domain 3: Applications of Foundation Models
export const domain3 = {
  id: 'domain3',
  name: 'Applications of Foundation Models',
  weight: '28%',
  icon: '🚀',
  color: '#00CED1',
  gradient: 'linear-gradient(135deg, #00CED1 0%, #20B2AA 100%)',
  questions: [
    {
      id: 'd3q1',
      question: 'Which AWS service would you use for real-time text-to-speech conversion?',
      options: ['Amazon Transcribe', 'Amazon Polly', 'Amazon Comprehend', 'Amazon Translate'],
      correct: 1,
      explanation: 'Amazon Polly converts text to lifelike speech, allowing you to create applications that talk and build speech-enabled products.'
    },
    {
      id: 'd3q2',
      question: 'What is Amazon Q designed for?',
      options: [
        'Image generation',
        'Enterprise AI assistant for business and development tasks',
        'Database management',
        'Network monitoring'
      ],
      correct: 1,
      explanation: 'Amazon Q is an AI-powered assistant designed to help with business tasks, answer questions about company data, and assist developers with coding tasks.'
    },
    {
      id: 'd3q3',
      question: 'Which service would you use to detect and analyze faces in images?',
      options: ['Amazon Comprehend', 'Amazon Rekognition', 'Amazon Textract', 'Amazon Lex'],
      correct: 1,
      explanation: 'Amazon Rekognition provides image and video analysis capabilities including facial detection, analysis, and recognition.'
    },
    {
      id: 'd3q4',
      question: 'What is Amazon Kendra primarily used for?',
      options: [
        'Training ML models',
        'Intelligent enterprise search powered by ML',
        'Video streaming',
        'Data warehousing'
      ],
      correct: 1,
      explanation: 'Amazon Kendra is an intelligent search service powered by machine learning that provides accurate answers from enterprise content and documents.'
    },
    {
      id: 'd3q5',
      question: 'Which service helps extract text and data from scanned documents?',
      options: ['Amazon Comprehend', 'Amazon Rekognition', 'Amazon Textract', 'Amazon Translate'],
      correct: 1,
      explanation: 'Amazon Textract automatically extracts text, handwriting, and data from scanned documents, going beyond simple OCR to identify form fields and tables.'
    },
    {
      id: 'd3q6',
      question: 'What is the primary use case for Amazon Lex?',
      options: [
        'Text analytics',
        'Building conversational interfaces (chatbots)',
        'Speech recognition',
        'Document processing'
      ],
      correct: 1,
      explanation: 'Amazon Lex provides the technologies for building conversational interfaces (chatbots) with voice and text capabilities.'
    },
    {
      id: 'd3q7',
      question: 'Which service provides natural language processing to extract insights from text?',
      options: ['Amazon Polly', 'Amazon Comprehend', 'Amazon Transcribe', 'Amazon Rekognition'],
      correct: 1,
      explanation: 'Amazon Comprehend uses NLP to extract insights from text, including sentiment analysis, entity recognition, and topic modeling.'
    },
    {
      id: 'd3q8',
      question: 'What capability does Amazon Transcribe provide?',
      options: [
        'Text-to-speech conversion',
        'Automatic speech-to-text transcription',
        'Language translation',
        'Sentiment analysis'
      ],
      correct: 1,
      explanation: 'Amazon Transcribe is an automatic speech recognition service that converts audio to text, supporting multiple languages and custom vocabularies.'
    },
    {
      id: 'd3q9',
      question: 'Which AWS service would you use to translate text between languages?',
      options: ['Amazon Comprehend', 'Amazon Polly', 'Amazon Translate', 'Amazon Transcribe'],
      correct: 2,
      explanation: 'Amazon Translate is a neural machine translation service that delivers fast, high-quality, and affordable language translation.'
    },
    {
      id: 'd3q10',
      question: 'What is Amazon Personalize used for?',
      options: [
        'Personal data storage',
        'Creating real-time personalized recommendations',
        'Personal assistant features',
        'User authentication'
      ],
      correct: 1,
      explanation: 'Amazon Personalize enables developers to build applications with real-time personalized recommendations, similar to those used by Amazon.com.'
    },
    {
      id: 'd3q11',
      question: 'What does the "temperature" parameter control in foundation model inference?',
      options: [
        'The GPU temperature during processing',
        'The randomness/creativity of model outputs',
        'The speed of response generation',
        'The cost per token'
      ],
      correct: 1,
      explanation: 'Temperature controls output randomness. Low temperature (e.g., 0.1) produces deterministic, focused responses for factual tasks. High temperature (e.g., 0.9) produces more creative, diverse responses for brainstorming.'
    },
    {
      id: 'd3q12',
      question: 'What is Amazon Bedrock Knowledge Bases?',
      options: [
        'A documentation repository for AWS services',
        'A fully managed RAG service that connects FMs to your data sources',
        'A database for storing model weights',
        'A training data management platform'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock Knowledge Bases is a managed RAG service that automatically handles data ingestion, chunking, embedding generation, vector store integration, and source citations — without managing infrastructure.'
    },
    {
      id: 'd3q13',
      question: 'What is the cheapest approach to customize a foundation model\'s behavior?',
      options: [
        'Pre-training from scratch',
        'Continued pre-training',
        'Fine-tuning',
        'Prompt engineering / In-context learning'
      ],
      correct: 3,
      explanation: 'Prompt engineering has zero training cost (only inference costs). The cost hierarchy from cheapest to most expensive is: Prompt engineering → RAG → Fine-tuning → Continued pre-training → Pre-training from scratch.'
    },
    {
      id: 'd3q14',
      question: 'What are Amazon Bedrock Agents designed to do?',
      options: [
        'Monitor model performance in production',
        'Enable FMs to execute multi-step tasks by orchestrating API calls and actions',
        'Provide human review for model predictions',
        'Encrypt data at rest and in transit'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock Agents enable FMs to break complex tasks into steps, call external APIs and Lambda functions, query knowledge bases, and maintain conversation state — automating workflows like booking travel or processing orders.'
    },
    {
      id: 'd3q15',
      question: 'Which prompting technique asks the model to break down reasoning into explicit intermediate steps?',
      options: ['Zero-shot prompting', 'Few-shot prompting', 'Chain-of-thought (CoT) prompting', 'Negative prompting'],
      correct: 2,
      explanation: 'Chain-of-thought prompting instructs the model to reason step by step, improving accuracy on math, logic, and multi-step problems by making reasoning transparent and auditable.'
    },
    {
      id: 'd3q16',
      question: 'What is the difference between zero-shot and few-shot prompting?',
      options: [
        'Zero-shot uses more tokens than few-shot',
        'Zero-shot provides no examples; few-shot provides multiple examples in the prompt',
        'Few-shot requires fine-tuning; zero-shot does not',
        'There is no difference'
      ],
      correct: 1,
      explanation: 'Zero-shot prompting asks the model to perform a task without any examples. Few-shot prompting provides 2-5 examples to establish patterns, improving consistency and accuracy for complex tasks.'
    },
    {
      id: 'd3q17',
      question: 'What is Reinforcement Learning from Human Feedback (RLHF)?',
      options: [
        'A technique to speed up model training',
        'A training technique that uses human preferences to align model outputs with human values',
        'A method for collecting labeled training data',
        'A deployment strategy for ML models'
      ],
      correct: 1,
      explanation: 'RLHF uses human evaluators to rank model responses, trains a reward model on those preferences, and then uses reinforcement learning to optimize the FM — aligning it with human values and reducing harmful outputs.'
    },
    {
      id: 'd3q18',
      question: 'What is model distillation?',
      options: [
        'Compressing data for model training',
        'Training a smaller "student" model to replicate a larger "teacher" model\'s behavior',
        'Removing unnecessary layers from a neural network',
        'Converting a model to run on mobile devices'
      ],
      correct: 1,
      explanation: 'Model distillation trains a smaller student model to mimic a larger teacher model\'s outputs, achieving similar quality at lower cost, reduced latency, and smaller deployment footprint.'
    },
    {
      id: 'd3q19',
      question: 'What is the primary purpose of prompt templates?',
      options: [
        'To encrypt prompts before sending to the model',
        'Reusable, parameterized prompt structures that ensure consistency and scalability',
        'To limit the number of tokens used',
        'To automatically fine-tune models'
      ],
      correct: 1,
      explanation: 'Prompt templates are reusable structures with placeholders for variable content. They ensure consistency across requests, are easier to maintain and version, and enable A/B testing of prompt variations.'
    },
    {
      id: 'd3q20',
      question: 'What is the main advantage of in-context learning over fine-tuning?',
      options: [
        'In-context learning permanently changes model behavior',
        'In-context learning provides examples in the prompt without changing model weights, requiring zero training cost',
        'In-context learning is always more accurate',
        'In-context learning works without a context window'
      ],
      correct: 1,
      explanation: 'In-context learning provides examples directly in the prompt without changing model weights. It has zero training cost, is quick to implement, and is temporary — only affecting the current request. Fine-tune only if in-context learning is insufficient.'
    }
  ]
};
