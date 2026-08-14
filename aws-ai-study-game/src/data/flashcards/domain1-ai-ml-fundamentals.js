// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels

export const domain1 = {
  id: 'domain1',
  name: 'Fundamentals of AI and ML',
  description: 'Core AI/ML concepts, practical use cases, and ML development lifecycle',
  icon: '🤖',
  color: '#3498DB',
  gradient: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
  source: 'AWS Certified AI Practitioner Exam Guide - Domain 1',
  examWeight: '20%',
  cards: [
      // Task Statement 1.1: Define basic AI concepts and terminology
      {
        id: 'd1c1',
        front: 'What is Artificial Intelligence (AI)?',
        back: 'A broad field encompassing the development of intelligent systems capable of performing tasks that typically require human intelligence.\n\nIncludes:\n• Perception\n• Reasoning\n• Learning\n• Problem-solving\n• Decision-making',
        hint: 'Umbrella term for intelligent systems',
        tags: ['ai', 'core-concept', 'fundamentals'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c2',
        front: 'What is Machine Learning (ML)?',
        back: 'A type of AI that enables systems to learn and improve from experience without being explicitly programmed.\n\nKey concept: Uses DATA to improve performance on tasks.\n\nML is a SUBSET of AI.',
        hint: 'Learning from data',
        tags: ['ml', 'core-concept', 'fundamentals'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c3',
        front: 'What is Deep Learning (DL)?',
        back: 'A subset of machine learning that uses neural networks with multiple layers (deep neural networks).\n\nInspired by: Human brain structure (neurons and synapses)\n\nExample AWS service: Amazon Rekognition (image/video analysis)',
        hint: 'Multi-layered neural networks',
        tags: ['deep-learning', 'neural-networks', 'fundamentals'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c4',
        front: 'What are Neural Networks?',
        back: 'Computing systems inspired by biological neural networks in the human brain.\n\nComponents:\n• Neurons - processing units\n• Layers - input, hidden, output\n• Connections - weighted links between neurons\n• Activation Functions - determine neuron output',
        hint: 'Brain-inspired computing',
        tags: ['neural-networks', 'deep-learning'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c5',
        front: 'What is Computer Vision?',
        back: 'AI field enabling computers to interpret and understand visual information from images and videos.\n\nApplications:\n• Object detection\n• Face recognition\n• Image classification\n• Medical imaging\n• Autonomous vehicles',
        hint: 'Teaching computers to "see"',
        tags: ['computer-vision', 'ai-applications'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c6',
        front: 'What is Natural Language Processing (NLP)?',
        back: 'AI field focused on enabling computers to understand, interpret, and generate human language.\n\nCapabilities:\n• Text analysis\n• Sentiment detection\n• Language translation\n• Speech recognition\n• Chatbots and virtual assistants',
        hint: 'Understanding human language',
        tags: ['nlp', 'ai-applications'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c7',
        front: 'What is a Large Language Model (LLM)?',
        back: 'A type of AI model trained on massive amounts of text data to understand and generate human-like text.\n\nCharacteristics:\n• Billions of parameters\n• General-purpose language understanding\n• Can perform various NLP tasks\n• Foundation for chatbots, content generation\n\nExamples: GPT, Claude, Amazon Titan',
        hint: 'Massive text-trained models',
        tags: ['llm', 'nlp', 'foundation-models'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c8',
        front: 'What is the difference between a Model and an Algorithm?',
        back: 'Algorithm:\n• The METHOD or process used to learn from data\n• Example: Linear Regression, Decision Tree\n\nModel:\n• The OUTPUT after training with an algorithm on data\n• The learned representation that makes predictions\n\nAnalogy: Recipe (algorithm) vs. Finished Cake (model)',
        hint: 'Process vs. Output',
        tags: ['core-concept', 'terminology'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c9',
        front: 'What is Training in machine learning?',
        back: 'The process of feeding data to an algorithm to create a model.\n\nDuring training:\n• Model learns patterns from data\n• Adjusts internal parameters\n• Minimizes prediction errors\n• Result: A trained model ready for inference',
        hint: 'Learning from data',
        tags: ['training', 'ml-lifecycle'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c10',
        front: 'What is Inference in machine learning?',
        back: 'Using a TRAINED model to make predictions on NEW, unseen data.\n\nThis is the "production" phase where:\n• Model is deployed\n• Receives new inputs\n• Generates predictions/outputs\n• Delivers value to users',
        hint: 'Making predictions with trained model',
        tags: ['inference', 'ml-lifecycle'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c11',
        front: 'What is Bias in AI/ML?',
        back: 'Systematic errors or unfairness in AI model outputs, often reflecting biases in training data.\n\nCauses:\n• Unrepresentative training data\n• Historical inequities in data\n• Biased labeling\n\nConsequence: Unfair treatment of certain groups',
        hint: 'Systematic unfairness',
        tags: ['bias', 'responsible-ai', 'fairness'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c12',
        front: 'What is Fairness in AI?',
        back: 'Ensuring AI systems treat all individuals and groups equitably without discrimination.\n\nKey aspects:\n• Equal performance across demographics\n• No systematic bias\n• Representative training data\n• Regular bias audits\n• Transparent decision-making',
        hint: 'Equitable treatment for all',
        tags: ['fairness', 'responsible-ai', 'ethics'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c13',
        front: 'What is Overfitting in machine learning?',
        back: 'When a model learns the training data TOO WELL, including noise and outliers.\n\nResult:\n• Excellent performance on training data\n• POOR performance on new data\n• Model memorizes instead of generalizing\n\nSolution: Validation data, regularization, simpler models',
        hint: 'Memorizing vs. learning',
        tags: ['overfitting', 'model-performance'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c14',
        front: 'What is Underfitting in machine learning?',
        back: 'When a model is TOO SIMPLE to capture patterns in the data.\n\nResult:\n• Poor performance on both training AND test data\n• Fails to learn underlying relationships\n\nSolution: More complex model, better features, more training',
        hint: 'Too simple to learn',
        tags: ['underfitting', 'model-performance'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c15',
        front: 'What is Labeled Data?',
        back: 'Data where each example has a corresponding ANSWER or TARGET VALUE.\n\nExample:\n• Image of cat → labeled "cat"\n• Email → labeled "spam" or "not spam"\n• House features → labeled with price\n\nRequired for: Supervised learning',
        hint: 'Data with answers',
        tags: ['data-types', 'supervised-learning'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c16',
        front: 'What is Unlabeled Data?',
        back: 'Data WITHOUT corresponding answers or target values.\n\nExample:\n• Collection of customer purchase histories\n• Set of images without categories\n• Text documents without classifications\n\nUsed for: Unsupervised learning (clustering, pattern discovery)',
        hint: 'Data without answers',
        tags: ['data-types', 'unsupervised-learning'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c17',
        front: 'What is Structured Data?',
        back: 'Data organized in a defined format, typically in tables with rows and columns.\n\nExamples:\n• Databases (SQL)\n• Spreadsheets\n• CSV files\n\nCharacteristics: Easy to search, query, and analyze',
        hint: 'Organized in tables',
        tags: ['data-types', 'structured-data'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c18',
        front: 'What is Unstructured Data?',
        back: 'Data without a predefined format or organization.\n\nExamples:\n• Text documents\n• Images and videos\n• Audio files\n• Social media posts\n• Emails\n\nRequires: Special processing (NLP, computer vision) before ML',
        hint: 'No predefined format',
        tags: ['data-types', 'unstructured-data'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      {
        id: 'd1c19',
        front: 'What are Tabular, Time-Series, Image, and Text data?',
        back: 'Data modalities in ML:\n\nTabular: Rows/columns (databases, spreadsheets)\nTime-Series: Data points over time (stocks, sensors)\nImage: Visual data (photos, medical scans)\nText: Natural language (documents, reviews)\n\nEach requires different ML approaches',
        hint: 'Different data formats',
        tags: ['data-types', 'modalities'],
        difficulty: 'intermediate',
        taskStatement: '1.1'
      },
      {
        id: 'd1c20',
        front: 'What are the three main learning paradigms in ML?',
        back: '1. Supervised Learning - learns from labeled data\n2. Unsupervised Learning - finds patterns in unlabeled data\n3. Reinforcement Learning - learns through trial and error with rewards\n\nEach suited for different types of problems',
        hint: 'Supervised, Unsupervised, Reinforcement',
        tags: ['learning-paradigms', 'ml-fundamentals'],
        difficulty: 'beginner',
        taskStatement: '1.1'
      },
      // Task Statement 1.2: Identify practical use cases for AI
      {
        id: 'd1c21',
        front: 'When are AI/ML solutions NOT appropriate?',
        back: '• When a SPECIFIC outcome is required (not a prediction)\n• When cost-benefit analysis shows negative ROI\n• When data is insufficient or of poor quality\n• When transparency/explainability is legally required\n• When simpler rule-based systems would work better\n• When ethical concerns outweigh benefits',
        hint: 'Consider costs, requirements, and alternatives',
        tags: ['use-cases', 'business-decisions'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c22',
        front: 'What ML technique is used for predicting CONTINUOUS numerical values?',
        back: 'Regression - predicts continuous outcomes.\n\nExamples:\n• House price prediction\n• Sales forecasting\n• Temperature prediction\n• Stock price estimation\n\nOutput: A numerical value on a continuous scale',
        hint: 'Predicting numbers/amounts',
        tags: ['regression', 'ml-techniques', 'supervised-learning'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      },
      {
        id: 'd1c23',
        front: 'What ML technique is used for predicting CATEGORIES or CLASSES?',
        back: 'Classification - assigns data to predefined categories.\n\nExamples:\n• Email spam detection (spam/not spam)\n• Image classification (cat/dog/bird)\n• Disease diagnosis (positive/negative)\n• Sentiment analysis (positive/negative/neutral)',
        hint: 'Predicting categories/labels',
        tags: ['classification', 'ml-techniques', 'supervised-learning'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      },
      {
        id: 'd1c24',
        front: 'What ML technique is used for finding GROUPS in unlabeled data?',
        back: 'Clustering - groups similar data points together without predefined labels.\n\nExamples:\n• Customer segmentation\n• Document categorization\n• Anomaly detection\n• Image compression\n• Market basket analysis',
        hint: 'Finding natural groupings',
        tags: ['clustering', 'ml-techniques', 'unsupervised-learning'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      },
      {
        id: 'd1c25',
        front: 'What AWS managed AI/ML service converts speech to text?',
        back: 'Amazon Transcribe - Automatic Speech Recognition (ASR) service.\n\nCapabilities:\n• Audio transcription\n• Supports multiple languages\n• Custom vocabulary\n• Speaker identification\n• Real-time and batch processing\n\nUse cases: Meeting transcription, subtitles, call analytics',
        hint: 'Speech → Text conversion',
        tags: ['aws-services', 'transcribe', 'speech'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c26',
        front: 'What AWS service translates text between languages?',
        back: 'Amazon Translate - Neural machine translation service.\n\nCapabilities:\n• Real-time and batch translation\n• 75+ languages\n• Custom terminology\n• Automatic language detection\n\nUse cases: Website localization, document translation, real-time chat',
        hint: 'Language translation service',
        tags: ['aws-services', 'translate', 'nlp'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c27',
        front: 'What AWS service analyzes text to extract insights?',
        back: 'Amazon Comprehend - Natural language processing service.\n\nCapabilities:\n• Sentiment analysis\n• Entity recognition (people, places, dates)\n• Key phrase extraction\n• Language detection\n• Topic modeling\n• PII detection\n\nUse cases: Customer feedback analysis, document classification',
        hint: 'Text understanding and insights',
        tags: ['aws-services', 'comprehend', 'nlp'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      // Task Statement 1.3: Describe the ML development lifecycle
      {
        id: 'd1c28',
        front: 'What are the main components of an ML pipeline?',
        back: '1. Data Collection\n2. Exploratory Data Analysis (EDA)\n3. Data Pre-processing\n4. Feature Engineering\n5. Model Training\n6. Hyperparameter Tuning\n7. Evaluation\n8. Deployment\n9. Monitoring',
        hint: 'From data to production model',
        tags: ['ml-lifecycle', 'ml-pipeline', 'mlops'],
        difficulty: 'intermediate',
        taskStatement: '1.3'
      },
      {
        id: 'd1c29',
        front: 'What are the key concepts of MLOps (ML Operations)?',
        back: 'MLOps brings DevOps principles to ML:\n\n• Experimentation - tracking experiments and parameters\n• Repeatable Processes - automation and reproducibility\n• Scalable Systems - handling production workloads\n• Managing Technical Debt - maintaining model quality\n• Production Readiness - reliable deployment\n• Model Monitoring - detecting drift and degradation\n• Model Re-training - keeping models current',
        hint: 'DevOps for Machine Learning',
        tags: ['mlops', 'ml-lifecycle', 'operations'],
        difficulty: 'intermediate',
        taskStatement: '1.3'
      },
      // Additional Task Statement 1.2 cards — AWS AI services, inferencing, models, metrics, and applications
      {
        id: 'd1c30',
        front: 'What is Amazon Lex?',
        back: 'A fully managed AWS service for building conversational interfaces (chatbots) using voice and text.\n\nCapabilities:\n• Automatic speech recognition (ASR)\n• Natural language understanding (NLU)\n• Multi-turn conversation support\n• Integration with AWS Lambda for fulfillment\n• Built-in slot types for common data (dates, numbers)\n\nUse cases: Customer service bots, IVR systems, virtual assistants',
        hint: 'Chatbot builder service',
        tags: ['aws-services', 'lex', 'nlp', 'chatbots'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c31',
        front: 'What is Amazon Polly?',
        back: 'A fully managed AWS service that converts text into lifelike speech (text-to-speech / TTS).\n\nCapabilities:\n• Dozens of voices across many languages\n• Neural TTS for natural-sounding speech\n• SSML support for pronunciation control\n• Real-time streaming and batch synthesis\n• Custom lexicons for domain-specific terms\n\nUse cases: Accessibility features, voice-enabled apps, e-learning narration',
        hint: 'Text-to-speech service',
        tags: ['aws-services', 'polly', 'speech', 'tts'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c32',
        front: 'What is Amazon SageMaker AI?',
        back: 'A fully managed AWS platform for building, training, and deploying ML models at scale.\n\nKey capabilities:\n• Jupyter notebooks for exploration\n• Built-in algorithms and framework support\n• Managed training infrastructure\n• One-click model deployment\n• AutoML with SageMaker Autopilot\n• Ground Truth for data labeling\n\nCovers the ENTIRE ML lifecycle from data prep to production',
        hint: 'End-to-end ML platform',
        tags: ['aws-services', 'sagemaker', 'ml-platform'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c33',
        front: 'What are SageMaker Data Wrangler, Feature Store, and Model Monitor?',
        back: 'Three SageMaker components for the ML lifecycle:\n\nData Wrangler:\n• Visual data preparation and transformation\n• 300+ built-in data transforms\n• Reduces data prep time from weeks to minutes\n\nFeature Store:\n• Centralized repository for ML features\n• Supports online (real-time) and offline (batch) access\n• Enables feature reuse across teams and models\n\nModel Monitor:\n• Detects data drift and model quality degradation\n• Automated alerts for anomalies\n• Tracks bias and feature attribution over time',
        hint: 'Data prep, feature storage, and monitoring tools',
        tags: ['aws-services', 'sagemaker', 'data-wrangler', 'feature-store', 'model-monitor'],
        difficulty: 'intermediate',
        taskStatement: '1.3'
      },
      {
        id: 'd1c34',
        front: 'What is the difference between Batch Inferencing and Real-Time Inferencing?',
        back: 'Batch Inferencing:\n• Processes large datasets all at once\n• Higher throughput, higher latency\n• Cost-effective for non-urgent predictions\n• Example: Nightly product recommendations\n\nReal-Time Inferencing:\n• Processes individual requests on demand\n• Low latency (milliseconds)\n• Requires always-on endpoint\n• Example: Fraud detection at point of sale\n\nChoose based on latency needs and cost constraints',
        hint: 'All-at-once vs. on-demand predictions',
        tags: ['inference', 'batch', 'real-time', 'deployment'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c35',
        front: 'What is the difference between using a Pre-Trained Model and training a Custom Model?',
        back: 'Pre-Trained (Open Source) Models:\n• Ready to use out of the box\n• Faster time to value\n• Lower cost to start\n• May lack domain-specific accuracy\n• Examples: Hugging Face models, BERT, ResNet\n\nCustom Models:\n• Trained on YOUR specific data\n• Higher accuracy for your domain\n• Requires data, compute, and ML expertise\n• Longer development time\n\nHybrid approach: Fine-tune a pre-trained model on custom data',
        hint: 'Ready-made vs. built-from-scratch',
        tags: ['pre-trained-models', 'custom-models', 'model-selection'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c36',
        front: 'What is the difference between a Managed API Service and a Self-Hosted API for deploying ML models?',
        back: 'Managed API Service:\n• Provider hosts and manages infrastructure\n• Pay-per-request pricing\n• No infrastructure management needed\n• Automatic scaling and high availability\n• Examples: Amazon Rekognition, Amazon Comprehend\n\nSelf-Hosted API:\n• You deploy and manage the model endpoint\n• Full control over hardware and configuration\n• Requires operational expertise\n• Example: SageMaker endpoint with custom container\n\nTrade-off: Convenience vs. control',
        hint: 'Provider-managed vs. you-managed deployment',
        tags: ['deployment', 'managed-services', 'self-hosted', 'api'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c37',
        front: 'What are Accuracy, AUC, and F1 Score in model evaluation?',
        back: 'Key model performance metrics:\n\nAccuracy:\n• Percentage of correct predictions overall\n• Can be misleading with imbalanced classes\n\nAUC (Area Under the ROC Curve):\n• Measures ability to distinguish between classes\n• Ranges from 0.5 (random) to 1.0 (perfect)\n• Robust to class imbalance\n\nF1 Score:\n• Harmonic mean of Precision and Recall\n• Balances false positives and false negatives\n• Ideal when both precision and recall matter',
        hint: 'How well does the model predict?',
        tags: ['model-evaluation', 'metrics', 'accuracy', 'auc', 'f1-score'],
        difficulty: 'intermediate',
        taskStatement: '1.3'
      },
      {
        id: 'd1c38',
        front: 'What business metrics should you track to evaluate an AI/ML solution?',
        back: 'Business performance metrics for AI/ML:\n\n• Cost per User - total AI/ML spend divided by users served\n• Development Costs - data labeling, training, compute, personnel\n• Customer Feedback - satisfaction scores, NPS, support tickets\n• Return on Investment (ROI) - revenue gains or cost savings vs. total investment\n• Time to Market - speed of delivery compared to alternatives\n\nKey point: A model with great technical metrics can still fail if business metrics are negative',
        hint: 'Beyond model accuracy — measuring business value',
        tags: ['business-metrics', 'roi', 'cost', 'evaluation'],
        difficulty: 'intermediate',
        taskStatement: '1.2'
      },
      {
        id: 'd1c39',
        front: 'How are Recommendation Systems used as an AI/ML application?',
        back: 'Recommendation systems suggest relevant items to users based on patterns in data.\n\nApproaches:\n• Collaborative Filtering - uses behavior of similar users\n• Content-Based Filtering - uses item attributes\n• Hybrid - combines both approaches\n\nExamples:\n• Product recommendations (e-commerce)\n• Movie/music suggestions (streaming)\n• Content feeds (social media)\n\nAWS Service: Amazon Personalize',
        hint: 'Suggesting items users might like',
        tags: ['ai-applications', 'recommendations', 'personalization'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      },
      {
        id: 'd1c40',
        front: 'How is Fraud Detection used as an AI/ML application?',
        back: 'AI/ML detects fraudulent activity by identifying unusual patterns in data.\n\nTechniques used:\n• Anomaly detection (unsupervised)\n• Classification (supervised — fraud vs. legitimate)\n• Real-time scoring of transactions\n\nExamples:\n• Credit card fraud detection\n• Insurance claim fraud\n• Account takeover prevention\n\nAWS Service: Amazon Fraud Detector\n\nKey advantage: ML adapts to new fraud patterns faster than rule-based systems',
        hint: 'Catching suspicious activity with ML',
        tags: ['ai-applications', 'fraud-detection', 'anomaly-detection'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      },
      {
        id: 'd1c41',
        front: 'How is Forecasting used as an AI/ML application?',
        back: 'AI/ML predicts future values based on historical time-series data.\n\nUse cases:\n• Demand forecasting (inventory planning)\n• Revenue and sales projections\n• Resource capacity planning\n• Energy consumption prediction\n\nAWS Service: Amazon Forecast\n\nKey advantage: ML captures complex seasonal patterns, trends, and external factors that traditional methods miss',
        hint: 'Predicting the future with historical data',
        tags: ['ai-applications', 'forecasting', 'time-series'],
        difficulty: 'beginner',
        taskStatement: '1.2'
      }
    ]
};

// Helper functions
export const getAllDecks = () => Object.values({ domain1 });

export const getDeckById = (id) => ({ domain1 })[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values({ domain1 }).forEach(deck => {
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
  Object.values({ domain1 }).forEach(deck => {
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
  Object.values({ domain1 }).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
