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
        'A fully managed service for training custom ML models at scale',
        'Enterprise AI assistant for business and development tasks',
        'A vector database for storing embeddings used in RAG applications',
        'A service that converts text into lifelike speech for applications'
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
        'Building conversational chatbots with voice and text',
        'Intelligent enterprise search powered by ML',
        'Extracting text and data from scanned documents',
        'Generating personalized content recommendations for users'
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
        'Analyzing sentiment and entities in text',
        'Building conversational interfaces (chatbots)',
        'Converting speech recordings into text transcripts',
        'Extracting data from forms and documents'
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
        'Converting written text into natural-sounding speech',
        'Automatic speech-to-text transcription',
        'Translating spoken audio between different languages',
        'Analyzing sentiment in recorded customer conversations'
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
        'Forecasting future demand from historical time-series data',
        'Creating real-time personalized recommendations',
        'Segmenting customers for targeted marketing campaigns',
        'Searching enterprise content using natural language queries'
      ],
      correct: 1,
      explanation: 'Amazon Personalize enables developers to build applications with real-time personalized recommendations, similar to those used by Amazon.com.'
    },
    {
      id: 'd3q11',
      question: 'What does the "temperature" parameter control in foundation model inference?',
      options: [
        'The maximum number of tokens in the generated response',
        'The randomness/creativity of model outputs',
        'The probability cutoff used when sampling candidate tokens',
        'The penalty applied to repeated words in the output'
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
        'A repository of pre-trained models available for deployment',
        'A service for labeling and managing model training datasets'
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
        'Continuously monitor deployed model quality and detect drift in production',
        'Enable FMs to execute multi-step tasks by orchestrating API calls and actions',
        'Route low-confidence model predictions to human reviewers for validation',
        'Filter harmful content from model inputs and outputs using configurable policies'
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
        'Few-shot prompting permanently improves the model for future requests'
      ],
      correct: 1,
      explanation: 'Zero-shot prompting asks the model to perform a task without any examples. Few-shot prompting provides 2-5 examples to establish patterns, improving consistency and accuracy for complex tasks.'
    },
    {
      id: 'd3q17',
      question: 'What is Reinforcement Learning from Human Feedback (RLHF)?',
      options: [
        'A supervised method where humans write the ideal response to every training prompt',
        'A training technique that uses human preferences to align model outputs with human values',
        'A crowdsourcing method for collecting labeled examples used in pre-training',
        'An evaluation process where humans grade model outputs after deployment'
      ],
      correct: 1,
      explanation: 'RLHF uses human evaluators to rank model responses, trains a reward model on those preferences, and then uses reinforcement learning to optimize the FM — aligning it with human values and reducing harmful outputs.'
    },
    {
      id: 'd3q18',
      question: 'What is model distillation?',
      options: [
        'Reducing the numerical precision of model weights to shrink model size',
        'Training a smaller "student" model to replicate a larger "teacher" model\'s behavior',
        'Removing unnecessary layers and connections from a trained neural network',
        'Compiling a trained model to run efficiently on edge devices'
      ],
      correct: 1,
      explanation: 'Model distillation trains a smaller student model to mimic a larger teacher model\'s outputs, achieving similar quality at lower cost, reduced latency, and smaller deployment footprint.'
    },
    {
      id: 'd3q19',
      question: 'What is the primary purpose of prompt templates?',
      options: [
        'Predefined system prompts that end users are not permitted to modify at runtime',
        'Reusable, parameterized prompt structures that ensure consistency and scalability',
        'Cached prompt prefixes that reduce token costs on repeated requests',
        'Curated example prompts used to fine-tune a model for a domain'
      ],
      correct: 1,
      explanation: 'Prompt templates are reusable structures with placeholders for variable content. They ensure consistency across requests, are easier to maintain and version, and enable A/B testing of prompt variations.'
    },
    {
      id: 'd3q20',
      question: 'What is the main advantage of in-context learning over fine-tuning?',
      options: [
        'In-context learning permanently updates the model weights so improvements persist across requests',
        'In-context learning provides examples in the prompt without changing model weights, requiring zero training cost',
        'In-context learning produces higher accuracy than fine-tuning on specialized domain-specific tasks',
        'In-context learning reduces inference costs because the examples are only processed on the first request'
      ],
      correct: 1,
      explanation: 'In-context learning provides examples directly in the prompt without changing model weights. It has zero training cost, is quick to implement, and is temporary — only affecting the current request. Fine-tune only if in-context learning is insufficient.'
    }
  ]
};
