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
        'AI is a subset of ML that focuses on automation',
        'ML is a subset of AI that learns from data',
        'AI and ML are interchangeable terms for the same technology',
        'AI learns from data while ML relies on predefined rules'
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
        'When a model is too simple to capture the patterns in the data',
        'When a model performs well on training data but poorly on new data',
        'When a model performs poorly on both training data and new data',
        'When training data accidentally includes information from the test set'
      ],
      correct: 1,
      explanation: 'Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor generalization to new data.'
    },
    {
      id: 'd1q7',
      question: 'In the context of generative AI, what is a "foundation model"?',
      options: [
        'The baseline model trained at the start of an ML project',
        'A large pre-trained model that can be adapted for various tasks',
        'A model trained from scratch on a single labeled dataset for one task',
        'A small task-specific model distilled from a larger network'
      ],
      correct: 1,
      explanation: 'Foundation models are large AI models trained on broad data that can be adapted to a wide range of downstream tasks through fine-tuning or prompting.'
    },
    {
      id: 'd1q8',
      question: 'What is the primary purpose of feature engineering in ML?',
      options: [
        'To automatically select the best algorithm for a given dataset',
        'To transform raw data into features that better represent the problem',
        'To label raw data so it can be used for supervised learning',
        'To tune the hyperparameters that control how a model learns'
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
      options: ['Amazon Bedrock', 'Amazon SageMaker', 'Amazon Comprehend', 'Amazon EMR'],
      correct: 1,
      explanation: 'Amazon SageMaker is a fully managed platform covering the entire ML lifecycle — from data preparation and model training to deployment and monitoring.'
    },
    {
      id: 'd1q12',
      question: 'What is the key difference between batch inference and real-time inference?',
      options: [
        'Batch inference produces more accurate predictions because it can compare each record against the full dataset',
        'Real-time inference processes individual requests on demand with low latency, while batch processes large datasets at once',
        'Batch inference requires dedicated GPU instances, while real-time inference runs only on CPU-based endpoints',
        'Real-time inference retrains the model with each request, while batch inference uses a fixed model version'
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
        'The ratio of true positives to all positive predictions',
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
        'A fully managed service for labeling training data with human workforces',
        'A fully managed service for building generative AI applications with foundation models',
        'A fully managed platform for building, training, and deploying custom ML models',
        'A managed vector database service for storing and querying embeddings'
      ],
      correct: 1,
      explanation: 'Amazon Bedrock is a fully managed service that offers foundation models from leading AI companies through a single API, making it easy to build generative AI applications.'
    },
    {
      id: 'd2q2',
      question: 'What is "prompt engineering" in the context of generative AI?',
      options: [
        'The process of fine-tuning a model on domain-specific example prompts',
        'The practice of designing effective inputs to guide AI model outputs',
        'Training a new model from scratch using curated question-answer pairs',
        'Optimizing a model\'s architecture to reduce inference latency'
      ],
      correct: 1,
      explanation: 'Prompt engineering is the practice of crafting effective prompts to guide generative AI models to produce desired outputs without changing the underlying model.'
    },
    {
      id: 'd2q3',
      question: 'What is RAG (Retrieval Augmented Generation)?',
      options: [
        'A fine-tuning method that retrains the model on newly collected data',
        'A technique that enhances LLM responses by retrieving relevant external knowledge',
        'A technique that compresses model weights to speed up text generation',
        'A training approach that augments datasets with synthetically generated examples'
      ],
      correct: 1,
      explanation: 'RAG combines the power of LLMs with external knowledge retrieval, allowing models to access up-to-date or domain-specific information not in their training data.'
    },
    {
      id: 'd2q4',
      question: 'Which Amazon service provides vector database capabilities for building RAG applications?',
      options: ['Amazon Athena', 'Amazon OpenSearch Service', 'Amazon DynamoDB', 'Amazon Redshift'],
      correct: 1,
      explanation: 'Amazon OpenSearch Service supports vector search capabilities, making it suitable for storing and querying embeddings in RAG applications.'
    },
    {
      id: 'd2q5',
      question: 'What is "hallucination" in the context of large language models?',
      options: [
        'Visual artifacts produced by image generation models',
        'When a model generates plausible but factually incorrect information',
        'When a model refuses to answer questions outside its training data',
        'When a model memorizes and repeats noisy examples from training data'
      ],
      correct: 1,
      explanation: 'Hallucination refers to when LLMs generate content that sounds plausible but is factually incorrect, made up, or not grounded in the input or reality.'
    },
    {
      id: 'd2q6',
      question: 'What is the purpose of fine-tuning a foundation model?',
      options: [
        'To compress a model so it can run on smaller hardware',
        'To adapt a pre-trained model to a specific task or domain',
        'To retrain a model from scratch using a larger dataset',
        'To provide examples in the prompt without changing model weights'
      ],
      correct: 1,
      explanation: 'Fine-tuning adapts a pre-trained foundation model to specific tasks or domains by training it further on domain-specific data, improving performance for that use case.'
    },
    {
      id: 'd2q7',
      question: 'What is a "token" in the context of large language models?',
      options: [
        'A security credential used to authenticate API requests to the model',
        'A unit of text that the model processes (word, subword, or character)',
        'A unit of compute time consumed during each model invocation',
        'A saved model checkpoint created during the training process'
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
        'Batching multiple user requests into a single model invocation',
        'Breaking large documents into smaller pieces for processing',
        'Splitting a model across multiple GPUs for parallel inference',
        'Compressing embeddings to reduce vector storage requirements'
      ],
      correct: 1,
      explanation: 'Chunking breaks large documents into smaller, manageable pieces for processing. This is essential for RAG systems since models have limited context windows.'
    },
    {
      id: 'd2q10',
      question: 'What are "embeddings" in generative AI?',
      options: [
        'Compressed copies of training documents stored inside the model',
        'Numerical vector representations of data that capture semantic meaning',
        'Keywords extracted from text to build a traditional search index',
        'Model parameters that are updated during the fine-tuning process'
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
        'Model Selection → Data Selection → Fine-tuning → Pre-training → Deployment → Evaluation → Feedback',
        'Data Selection → Model Selection → Pre-training → Fine-tuning → Evaluation → Deployment → Feedback',
        'Data Selection → Pre-training → Model Selection → Deployment → Fine-tuning → Feedback → Evaluation',
        'Pre-training → Data Selection → Model Selection → Evaluation → Fine-tuning → Deployment → Feedback'
      ],
      correct: 1,
      explanation: 'The FM lifecycle follows: Data Selection → Model Selection → Pre-training → Fine-tuning → Evaluation → Deployment → Feedback. This is an iterative cycle where feedback drives continuous improvement.'
    },
    {
      id: 'd2q13',
      question: 'What are "multimodal models" in generative AI?',
      options: [
        'Models that can translate text between many different human languages in real time',
        'Models trained in multiple sequential stages on progressively larger datasets',
        'AI models that can process and generate multiple types of data such as text, images, and audio',
        'Ensembles that combine the predictions of multiple separately trained models into one output'
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
        'It provisions and manages the cloud infrastructure that runs your application code',
        'It auto-completes code, generates code from natural language, detects bugs, and creates tests',
        'It trains a private foundation model on your entire codebase automatically',
        'It requires fine-tuning on your source code before it can generate suggestions'
      ],
      correct: 1,
      explanation: 'Amazon Q Developer assists developers by auto-completing code, generating code from natural language descriptions, reviewing code for bugs, generating test cases, and creating documentation.'
    }
  ]
};
