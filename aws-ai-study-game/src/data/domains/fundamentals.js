// Domain 1: Fundamentals of AI and ML
export const domain1 = {
  id: 'domain1',
  name: 'Fundamentals of AI and ML',
  weight: '20%',
  icon: '🧠',
  color: '#FF6B35',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  questions: [
    {
      id: 'd1q1',
      question: 'Which type of machine learning is best suited for spam email detection where you have labeled examples of spam and non-spam emails?',
      options: ['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Self-supervised Learning'],
      correct: 1,
      explanation: 'Supervised learning is ideal when you have labeled training data. Spam detection uses historical emails labeled as spam/not-spam to train the model.'
    },
    {
      id: 'd1q2',
      question: 'What is the primary difference between Artificial Intelligence (AI) and Machine Learning (ML)?',
      options: [
        'AI is a subset of ML',
        'ML is a subset of AI that learns from data',
        'They are the same thing',
        'ML requires more computing power than AI'
      ],
      correct: 1,
      explanation: 'Machine Learning is a subset of AI. AI is the broader concept of machines being able to carry out tasks intelligently, while ML specifically refers to systems that learn from data.'
    },
    {
      id: 'd1q3',
      question: 'Which AWS service provides pre-trained models for common ML tasks without requiring ML expertise?',
      options: ['Amazon SageMaker', 'Amazon AI Services', 'AWS Deep Learning AMIs', 'Amazon EMR'],
      correct: 1,
      explanation: 'Amazon AI Services (like Rekognition, Comprehend, Polly) provide pre-trained models that developers can use via APIs without ML expertise.'
    },
    {
      id: 'd1q4',
      question: 'What does "inference" mean in the context of machine learning?',
      options: [
        'Training a model on new data',
        'Using a trained model to make predictions',
        'Cleaning and preparing data',
        'Selecting features for a model'
      ],
      correct: 1,
      explanation: 'Inference is the process of using a trained machine learning model to make predictions on new, unseen data.'
    },
    {
      id: 'd1q5',
      question: 'Which type of neural network is most commonly used for image recognition tasks?',
      options: ['Recurrent Neural Networks (RNN)', 'Convolutional Neural Networks (CNN)', 'Generative Adversarial Networks (GAN)', 'Feed-forward Neural Networks'],
      correct: 1,
      explanation: 'CNNs are specifically designed for processing grid-like data such as images. They use convolutional layers to automatically learn spatial hierarchies of features.'
    },
    {
      id: 'd1q6',
      question: 'What is "overfitting" in machine learning?',
      options: [
        'When a model is too simple to capture patterns',
        'When a model performs well on training data but poorly on new data',
        'When training takes too long',
        'When the dataset is too large'
      ],
      correct: 1,
      explanation: 'Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor generalization to new data.'
    },
    {
      id: 'd1q7',
      question: 'In the context of generative AI, what is a "foundation model"?',
      options: [
        'The first version of any ML model',
        'A large pre-trained model that can be adapted for various tasks',
        'A model used only for classification',
        'The mathematical foundation of neural networks'
      ],
      correct: 1,
      explanation: 'Foundation models are large AI models trained on broad data that can be adapted to a wide range of downstream tasks through fine-tuning or prompting.'
    },
    {
      id: 'd1q8',
      question: 'What is the primary purpose of feature engineering in ML?',
      options: [
        'To increase model size',
        'To transform raw data into features that better represent the problem',
        'To reduce training time',
        'To deploy models to production'
      ],
      correct: 1,
      explanation: 'Feature engineering transforms raw data into features that better represent the underlying problem to predictive models, improving model accuracy.'
    },
    {
      id: 'd1q9',
      question: 'Which AWS service allows you to build conversational chatbots using voice and text?',
      options: ['Amazon Polly', 'Amazon Lex', 'Amazon Comprehend', 'Amazon Transcribe'],
      correct: 1,
      explanation: 'Amazon Lex is a fully managed service for building conversational interfaces (chatbots) using automatic speech recognition (ASR) and natural language understanding (NLU).'
    },
    {
      id: 'd1q10',
      question: 'What is Amazon Polly primarily used for?',
      options: [
        'Speech-to-text transcription',
        'Text-to-speech conversion',
        'Language translation',
        'Sentiment analysis'
      ],
      correct: 1,
      explanation: 'Amazon Polly converts text into lifelike speech using neural TTS technology, supporting dozens of voices across many languages.'
    },
    {
      id: 'd1q11',
      question: 'Which AWS service provides an end-to-end platform for building, training, and deploying ML models?',
      options: ['Amazon Bedrock', 'Amazon SageMaker', 'Amazon Comprehend', 'AWS Lambda'],
      correct: 1,
      explanation: 'Amazon SageMaker is a fully managed platform covering the entire ML lifecycle — from data preparation and model training to deployment and monitoring.'
    },
    {
      id: 'd1q12',
      question: 'What is the key difference between batch inference and real-time inference?',
      options: [
        'Batch inference is more accurate',
        'Real-time inference processes individual requests on demand with low latency, while batch processes large datasets at once',
        'Batch inference requires more expensive hardware',
        'Real-time inference only works with image models'
      ],
      correct: 1,
      explanation: 'Real-time inference handles individual requests with millisecond latency (e.g., fraud detection), while batch inference processes large datasets at once with higher throughput but higher latency (e.g., nightly recommendations).'
    },
    {
      id: 'd1q13',
      question: 'Which SageMaker component detects data drift and model quality degradation in production?',
      options: ['SageMaker Data Wrangler', 'SageMaker Feature Store', 'SageMaker Model Monitor', 'SageMaker Autopilot'],
      correct: 2,
      explanation: 'SageMaker Model Monitor continuously monitors models in production, detecting data drift, model quality degradation, bias drift, and feature attribution changes.'
    },
    {
      id: 'd1q14',
      question: 'What does the F1 Score measure in model evaluation?',
      options: [
        'The speed of model inference',
        'The harmonic mean of Precision and Recall',
        'The total number of correct predictions',
        'The area under the ROC curve'
      ],
      correct: 1,
      explanation: 'The F1 Score is the harmonic mean of Precision and Recall, balancing false positives and false negatives. It is ideal when both precision and recall matter equally.'
    },
    {
      id: 'd1q15',
      question: 'Which AWS service provides real-time personalized product recommendations?',
      options: ['Amazon Kendra', 'Amazon Personalize', 'Amazon Comprehend', 'Amazon Forecast'],
      correct: 1,
      explanation: 'Amazon Personalize enables developers to build applications with real-time personalized recommendations using the same technology as Amazon.com.'
    },
    {
      id: 'd1q16',
      question: 'Which AWS service uses ML to detect fraudulent activity in real-time?',
      options: ['Amazon Macie', 'Amazon GuardDuty', 'Amazon Fraud Detector', 'Amazon Inspector'],
      correct: 2,
      explanation: 'Amazon Fraud Detector uses ML to identify potentially fraudulent online activity such as payment fraud and fake account creation, adapting to new fraud patterns faster than rule-based systems.'
    }
  ]
};

// Domain 2: Fundamentals of Generative AI
export const domain2 = {
  id: 'domain2',
  name: 'Fundamentals of Generative AI',
  weight: '24%',
  icon: '✨',
  color: '#7B68EE',
  gradient: 'linear-gradient(135deg, #7B68EE 0%, #9370DB 100%)',
  questions: [
    {
      id: 'd2q1',
      question: 'What is Amazon Bedrock?',
      options: [
        'A data lake service',
        'A fully managed service for building generative AI applications with foundation models',
        'A container orchestration service',
        'A database service'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock is a fully managed service that offers foundation models from leading AI companies through a single API, making it easy to build generative AI applications.'
    },
    {
      id: 'd2q2',
      question: 'What is "prompt engineering" in the context of generative AI?',
      options: [
        'Building hardware for AI systems',
        'The practice of designing effective inputs to guide AI model outputs',
        'Training new models from scratch',
        'Optimizing model architecture'
      ],
      correct: 1,
      explanation: 'Prompt engineering is the practice of crafting effective prompts to guide generative AI models to produce desired outputs without changing the underlying model.'
    },
    {
      id: 'd2q3',
      question: 'What is RAG (Retrieval Augmented Generation)?',
      options: [
        'A type of GPU for AI training',
        'A technique that enhances LLM responses by retrieving relevant external knowledge',
        'A method to compress AI models',
        'A random data augmentation technique'
      ],
      correct: 1,
      explanation: 'RAG combines the power of LLMs with external knowledge retrieval, allowing models to access up-to-date or domain-specific information not in their training data.'
    },
    {
      id: 'd2q4',
      question: 'Which Amazon service provides vector database capabilities for building RAG applications?',
      options: ['Amazon RDS', 'Amazon OpenSearch Service', 'Amazon DynamoDB', 'Amazon Redshift'],
      correct: 1,
      explanation: 'Amazon OpenSearch Service supports vector search capabilities, making it suitable for storing and querying embeddings in RAG applications.'
    },
    {
      id: 'd2q5',
      question: 'What is "hallucination" in the context of large language models?',
      options: [
        'Visual glitches in image generation',
        'When a model generates plausible but factually incorrect information',
        'Memory errors in GPU processing',
        'Overfitting on training data'
      ],
      correct: 1,
      explanation: 'Hallucination refers to when LLMs generate content that sounds plausible but is factually incorrect, made up, or not grounded in the input or reality.'
    },
    {
      id: 'd2q6',
      question: 'What is the purpose of fine-tuning a foundation model?',
      options: [
        'To make the model smaller',
        'To adapt a pre-trained model to a specific task or domain',
        'To increase inference speed',
        'To reduce costs'
      ],
      correct: 1,
      explanation: 'Fine-tuning adapts a pre-trained foundation model to specific tasks or domains by training it further on domain-specific data, improving performance for that use case.'
    },
    {
      id: 'd2q7',
      question: 'What is a "token" in the context of large language models?',
      options: [
        'A security credential',
        'A unit of text that the model processes (word, subword, or character)',
        'A payment method for API calls',
        'A model checkpoint'
      ],
      correct: 1,
      explanation: 'Tokens are the basic units that LLMs process - they can be words, parts of words, or characters. Models have limits on input/output tokens they can handle.'
    },
    {
      id: 'd2q8',
      question: 'Which technique allows you to customize a foundation model\'s behavior without modifying its weights?',
      options: ['Transfer learning', 'In-context learning / prompting', 'Gradient descent', 'Backpropagation'],
      correct: 1,
      explanation: 'In-context learning or prompting allows customization of model behavior through carefully crafted prompts and examples, without changing the model weights.'
    },
    {
      id: 'd2q9',
      question: 'What is "chunking" in the context of generative AI?',
      options: [
        'Dividing GPU memory into segments',
        'Breaking large documents into smaller pieces for processing',
        'Splitting a model into multiple parts',
        'Compressing training data'
      ],
      correct: 1,
      explanation: 'Chunking breaks large documents into smaller, manageable pieces for processing. This is essential for RAG systems since models have limited context windows.'
    },
    {
      id: 'd2q10',
      question: 'What are "embeddings" in generative AI?',
      options: [
        'Hardware chips embedded in AI servers',
        'Numerical vector representations of data that capture semantic meaning',
        'Security tokens embedded in API calls',
        'Hidden layers in neural networks'
      ],
      correct: 1,
      explanation: 'Embeddings are numerical (vector) representations that capture semantic meaning. Similar concepts have similar embeddings, enabling semantic search and comparison.'
    },
    {
      id: 'd2q11',
      question: 'What type of generative AI model creates images by learning to reverse a noise-adding process?',
      options: ['Transformer models', 'Recurrent Neural Networks', 'Diffusion models', 'Autoencoder models'],
      correct: 2,
      explanation: 'Diffusion models generate images by learning to reverse a noise-adding process — starting from random noise and gradually removing it to create high-quality images. Examples include Stable Diffusion and Amazon Titan Image Generator.'
    },
    {
      id: 'd2q12',
      question: 'What is the correct order of the Foundation Model Lifecycle stages?',
      options: [
        'Deployment → Training → Evaluation → Data Selection',
        'Data Selection → Model Selection → Pre-training → Fine-tuning → Evaluation → Deployment → Feedback',
        'Fine-tuning → Pre-training → Deployment → Feedback',
        'Model Selection → Data Selection → Evaluation → Pre-training'
      ],
      correct: 1,
      explanation: 'The FM lifecycle follows: Data Selection → Model Selection → Pre-training → Fine-tuning → Evaluation → Deployment → Feedback. This is an iterative cycle where feedback drives continuous improvement.'
    },
    {
      id: 'd2q13',
      question: 'What are "multimodal models" in generative AI?',
      options: [
        'Models that can only process text',
        'Models trained on a single dataset',
        'AI models that can process and generate multiple types of data such as text, images, and audio',
        'Models that run on multiple GPUs'
      ],
      correct: 2,
      explanation: 'Multimodal models can process and generate multiple data types (modalities) such as text, images, audio, and video. Examples include Anthropic Claude (text + image) and Amazon Titan Multimodal Embeddings.'
    },
    {
      id: 'd2q14',
      question: 'Which fine-tuning method updates only a small subset of model parameters to reduce cost?',
      options: ['Full fine-tuning', 'Pre-training from scratch', 'Parameter-Efficient Fine-Tuning (PEFT/LoRA)', 'Reinforcement Learning'],
      correct: 2,
      explanation: 'Parameter-Efficient Fine-Tuning (PEFT) methods like LoRA update only a small subset of model weights, making fine-tuning much cheaper and faster than updating all parameters.'
    },
    {
      id: 'd2q15',
      question: 'What is the primary advantage of using Amazon Q Developer for code generation?',
      options: [
        'It replaces the need for developers entirely',
        'It auto-completes code, generates code from natural language, detects bugs, and creates tests',
        'It only works with Python',
        'It requires pre-training a custom model first'
      ],
      correct: 1,
      explanation: 'Amazon Q Developer assists developers by auto-completing code, generating code from natural language descriptions, reviewing code for bugs, generating test cases, and creating documentation.'
    }
  ]
};
