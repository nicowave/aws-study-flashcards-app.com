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
    },
    {
      id: 'd1q17',
      question: 'A retail company wants to group its customers into segments based on purchasing behavior, but has no predefined categories or labels. Which ML approach fits this requirement?',
      options: [
        'Supervised learning with a classification algorithm',
        'Reinforcement learning with a reward function based on sales',
        'Unsupervised learning with a clustering algorithm',
        'Supervised learning with a regression algorithm'
      ],
      correct: 2,
      explanation: 'With no labels or predefined categories, this is unsupervised learning — clustering algorithms like K-means discover natural groupings in the data. Classification and regression are supervised methods that require labeled examples, and reinforcement learning applies to sequential decision-making with rewards, not segmentation.'
    },
    {
      id: 'd1q18',
      question: 'A real estate startup wants to predict the exact sale price of a home based on features like square footage, location, and age. Which type of ML problem is this?',
      options: [
        'Regression, because the output is a continuous numeric value',
        'Classification, because each home belongs to a price category',
        'Clustering, because similar homes should be grouped together',
        'Anomaly detection, because unusual prices must be flagged'
      ],
      correct: 0,
      explanation: 'Predicting a continuous numeric value (a dollar amount) is regression. Classification predicts discrete categories, clustering groups unlabeled data, and anomaly detection flags outliers — none of them output a precise continuous value.'
    },
    {
      id: 'd1q19',
      question: 'A bank\'s fraud model must catch as many fraudulent transactions as possible, even if that means flagging some legitimate ones for manual review. Which evaluation metric should the team prioritize?',
      options: ['Precision', 'Accuracy', 'Recall', 'Inference latency'],
      correct: 2,
      explanation: 'Recall measures the fraction of actual fraud cases the model catches — prioritizing it minimizes missed fraud (false negatives). Precision would minimize false alarms instead, and accuracy is misleading when fraud is rare because a model that flags nothing can still score high.'
    },
    {
      id: 'd1q20',
      question: 'An ML team splits its data into training, validation, and test sets. What is the purpose of the validation set?',
      options: [
        'To provide the final unbiased estimate of model performance before release',
        'To tune hyperparameters and compare model candidates during development',
        'To maximize the amount of data available for learning model weights',
        'To store production inference requests for future retraining'
      ],
      correct: 1,
      explanation: 'The validation set is used during development to tune hyperparameters and choose between candidate models. The test set is held back for the final unbiased performance estimate, and the training set is what the model actually learns from.'
    },
    {
      id: 'd1q21',
      question: 'A model achieves 99% accuracy on its training data but only 68% on new data. Which combination of remedies directly addresses this problem?',
      options: [
        'Increase model complexity and train for more epochs',
        'Add regularization, gather more diverse training data, or simplify the model',
        'Remove the test set so all data can be used for training',
        'Raise the classification threshold until accuracy improves'
      ],
      correct: 1,
      explanation: 'The large gap between training and new-data performance is overfitting. Regularization, more (and more diverse) training data, and simpler models all reduce it. Increasing complexity or training longer usually makes overfitting worse, and removing the test set only hides the problem.'
    },
    {
      id: 'd1q22',
      question: 'A company needs to compute sales tax for each order using published government tax tables. Why is ML the wrong tool for this task?',
      options: [
        'ML models cannot process numeric financial data reliably',
        'The problem is deterministic and fully specified by rules, so a rules-based system is simpler and exact',
        'Tax calculation requires more training data than any company can collect',
        'ML is only applicable to image and text data, not tabular data'
      ],
      correct: 1,
      explanation: 'When the correct output is defined exactly by known rules, a deterministic rules-based implementation is simpler, cheaper, and always correct. ML is suited to problems where patterns must be learned from data — using it here adds cost and error for no benefit. ML handles numeric and tabular data fine, so the other objections are false.'
    },
    {
      id: 'd1q23',
      question: 'A team has 100,000 unlabeled product images and needs high-quality labels to train a classifier. Which AWS service manages human labeling workflows, including workforce options and automated labeling?',
      options: ['Amazon Rekognition', 'SageMaker Ground Truth', 'Amazon Textract', 'SageMaker Model Monitor'],
      correct: 1,
      explanation: 'SageMaker Ground Truth manages data-labeling jobs with human workforces (Mechanical Turk, vendors, or your own team) and can auto-label a portion of data to cut costs. Rekognition analyzes images with pre-trained models but doesn\'t create training labels, Textract extracts document text, and Model Monitor watches production models.'
    },
    {
      id: 'd1q24',
      question: 'A developer wants to deploy a common ML solution quickly using pre-trained open-source models and one-click fine-tuning, without building from scratch. Which SageMaker capability should they use?',
      options: ['SageMaker JumpStart', 'SageMaker Ground Truth', 'SageMaker Clarify', 'SageMaker Feature Store'],
      correct: 0,
      explanation: 'SageMaker JumpStart is a hub of pre-trained models and solution templates that can be deployed or fine-tuned with minimal effort. Ground Truth handles labeling, Clarify handles bias detection and explainability, and Feature Store manages ML features — none of them provide ready-to-deploy models.'
    },
    {
      id: 'd1q25',
      question: 'A medical imaging startup has only 2,000 labeled X-ray images — too few to train a deep neural network from scratch. What is the most practical approach?',
      options: [
        'Train a small linear model since deep learning is impossible with this dataset',
        'Use transfer learning: start from a model pre-trained on a large image dataset and fine-tune it on the X-rays',
        'Duplicate each image 100 times to reach the required dataset size',
        'Switch to unsupervised learning since labels are insufficient'
      ],
      correct: 1,
      explanation: 'Transfer learning reuses features a model already learned from a large general dataset, so a small labeled dataset is enough to fine-tune it for a specialized task. Duplicating images adds no new information (and encourages overfitting), and abandoning the labels wastes the most valuable part of the data.'
    },
    {
      id: 'd1q26',
      question: 'Which scenario is the best fit for reinforcement learning?',
      options: [
        'Predicting next month\'s electricity demand from historical usage',
        'Grouping news articles by topic without labels',
        'Training an autonomous device to navigate a track by rewarding progress and penalizing collisions',
        'Detecting spam using a labeled email dataset'
      ],
      correct: 2,
      explanation: 'Reinforcement learning trains an agent through trial and error using rewards and penalties — the approach behind AWS DeepRacer. Demand prediction is supervised regression, topic grouping is unsupervised clustering, and spam detection is supervised classification.'
    },
    {
      id: 'd1q27',
      question: 'A dataset contains 99% legitimate transactions and 1% fraud. A model that predicts "legitimate" for everything scores 99% accuracy. What does this illustrate?',
      options: [
        'The model has successfully learned to detect fraud',
        'Accuracy is misleading on imbalanced datasets — metrics like precision, recall, and F1 are needed',
        'The dataset is too small for machine learning',
        'The model is overfitting to the fraud class'
      ],
      correct: 1,
      explanation: 'With severe class imbalance, accuracy rewards ignoring the minority class entirely. Precision, recall, and F1 score reveal that this model catches zero fraud. The dataset size isn\'t the issue, and the model isn\'t overfitting to fraud — it never predicts fraud at all.'
    },
    {
      id: 'd1q28',
      question: 'An application needs ML inference only a few times per hour with unpredictable timing, and the team doesn\'t want to pay for idle compute. Which SageMaker inference option fits best?',
      options: [
        'Real-time inference on a permanently provisioned endpoint',
        'Batch transform jobs scheduled every night',
        'Serverless inference that scales to zero between requests',
        'Multi-model endpoints on GPU instances'
      ],
      correct: 2,
      explanation: 'SageMaker Serverless Inference automatically provisions compute per request and scales to zero when idle, so you pay only for actual usage — ideal for intermittent, unpredictable traffic. A permanent endpoint bills for idle time, and nightly batch jobs can\'t serve on-demand requests.'
    },
    {
      id: 'd1q29',
      question: 'Which metric is most appropriate for evaluating a regression model that predicts delivery times?',
      options: ['F1 score', 'Root Mean Squared Error (RMSE)', 'Confusion matrix', 'Recall'],
      correct: 1,
      explanation: 'RMSE measures the average magnitude of prediction errors for continuous values, making it a standard regression metric. F1, recall, and confusion matrices evaluate classification models, which predict categories rather than continuous quantities.'
    },
    {
      id: 'd1q30',
      question: 'A team retrains and redeploys its model manually every month, which is slow and error-prone. Which AWS capability addresses this with automated, repeatable ML workflows?',
      options: [
        'SageMaker Pipelines for orchestrating build, train, and deploy steps',
        'Amazon Polly for automating the release announcements',
        'AWS CloudTrail for recording each manual deployment',
        'Amazon Kendra for indexing the deployment documentation'
      ],
      correct: 0,
      explanation: 'SageMaker Pipelines is the MLOps service for defining automated, repeatable workflows covering data preparation, training, evaluation, and deployment. CloudTrail only audits API calls, and Polly (text-to-speech) and Kendra (enterprise search) are unrelated to workflow automation.'
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
    },
    {
      id: 'd2q16',
      question: 'Which neural network architecture, built around a self-attention mechanism, underlies modern large language models?',
      options: [
        'Convolutional neural network (CNN)',
        'Transformer',
        'Recurrent neural network (RNN)',
        'Generative adversarial network (GAN)'
      ],
      correct: 1,
      explanation: 'The transformer architecture uses self-attention to weigh relationships between all tokens in a sequence at once, enabling the parallel training that made today\'s LLMs possible. CNNs dominate image tasks, RNNs process sequences step-by-step and struggle with long dependencies, and GANs are a training setup for generative image models.'
    },
    {
      id: 'd2q17',
      question: 'A user pastes a 300-page contract into a chatbot and the model ignores most of the document. What is the most likely cause?',
      options: [
        'The model\'s temperature is set too high',
        'The document exceeds the model\'s context window, so tokens beyond the limit are not processed',
        'The model was not fine-tuned on legal vocabulary',
        'The embeddings for legal text are of low quality'
      ],
      correct: 1,
      explanation: 'Every model has a fixed context window — a maximum number of tokens it can process per request. Input beyond that limit is simply not seen. Temperature affects randomness, not capacity; fine-tuning and embedding quality would degrade answer quality, not cause wholesale ignoring of most of the text.'
    },
    {
      id: 'd2q18',
      question: 'A company wants its site search to match "laptop won\'t turn on" with articles titled "computer fails to boot" even though they share no keywords. Which technique enables this?',
      options: [
        'Semantic search using vector embeddings',
        'Exact keyword matching with a larger synonym list',
        'Increasing the temperature of the search model',
        'Fine-tuning a model on the company\'s style guide'
      ],
      correct: 0,
      explanation: 'Embeddings map text into vectors where semantically similar phrases land close together, so meaning is matched rather than exact words. Synonym lists cannot scale to all phrasings, temperature is an inference-randomness parameter, and style-guide fine-tuning doesn\'t address retrieval.'
    },
    {
      id: 'd2q19',
      question: 'A compliance team requires that the same prompt always produces nearly identical wording in generated policy summaries. Which inference setting achieves this?',
      options: [
        'Increase top-p to 1.0',
        'Set temperature at or near 0 to make output selection nearly deterministic',
        'Raise the maximum token limit',
        'Enable response streaming'
      ],
      correct: 1,
      explanation: 'Temperature near 0 makes the model almost always pick the highest-probability token, minimizing run-to-run variation. High top-p widens the sampling pool (more variety), max tokens only caps length, and streaming changes delivery, not content.'
    },
    {
      id: 'd2q20',
      question: 'What does the top-p (nucleus sampling) parameter control during text generation?',
      options: [
        'The maximum number of tokens the model may generate',
        'The percentage of the training data the model can reference',
        'The pool of candidate tokens, limited to those whose cumulative probability reaches p',
        'The number of parallel responses generated per request'
      ],
      correct: 2,
      explanation: 'Top-p restricts sampling to the smallest set of tokens whose combined probability reaches the threshold p, cutting off the unlikely tail. It does not limit response length (max tokens does that), and it has nothing to do with training-data access or parallel generation.'
    },
    {
      id: 'd2q21',
      question: 'A product team wants to cap the cost and length of each chatbot reply. Which inference parameter directly does this?',
      options: ['Temperature', 'Top-k', 'Maximum output tokens', 'Presence penalty'],
      correct: 2,
      explanation: 'Output cost scales with tokens generated, so setting a maximum output token limit directly bounds both response length and spend. Temperature and top-k shape randomness, and presence penalties discourage repetition — none of them cap length.'
    },
    {
      id: 'd2q22',
      question: 'A developer wants generation to end as soon as the model finishes a JSON object, instead of rambling afterward. Which mechanism does this?',
      options: [
        'Stop sequences that halt generation when a specified string is produced',
        'A lower temperature setting',
        'A larger context window',
        'Chain-of-thought prompting'
      ],
      correct: 0,
      explanation: 'Stop sequences tell the model to stop generating the moment a given string (like a closing brace or delimiter) appears. Temperature affects randomness, context window affects input capacity, and chain-of-thought changes reasoning style — none of them terminate output at a marker.'
    },
    {
      id: 'd2q23',
      question: 'Users complain that a chatbot feels slow because nothing appears until the full answer is ready. What is the standard remedy?',
      options: [
        'Response streaming, so tokens display as they are generated',
        'Raising the temperature so the model answers faster',
        'Switching from RAG to fine-tuning',
        'Increasing the maximum token limit'
      ],
      correct: 0,
      explanation: 'Streaming returns tokens incrementally, so users see the answer forming immediately even though total generation time is unchanged. Temperature does not affect speed, and the other options don\'t address perceived latency.'
    },
    {
      id: 'd2q24',
      question: 'A pharmaceutical company has a huge corpus of unlabeled domain research papers and wants a model to deeply learn its field\'s vocabulary and concepts. Which customization approach fits?',
      options: [
        'Few-shot prompting with example Q&A pairs',
        'Continued pre-training on the unlabeled domain corpus',
        'Fine-tuning, which requires labeled prompt-completion pairs',
        'Retrieval Augmented Generation over the papers'
      ],
      correct: 1,
      explanation: 'Continued pre-training extends a model\'s self-supervised training on unlabeled domain text — exactly what a large raw corpus supports. Fine-tuning needs labeled input-output pairs, few-shot prompting can\'t instill deep domain knowledge, and RAG retrieves facts at query time rather than teaching the model the domain.'
    },
    {
      id: 'd2q25',
      question: 'A support assistant must answer from product docs that change weekly. Why is RAG a better fit than fine-tuning here?',
      options: [
        'RAG permanently embeds the docs into the model weights',
        'RAG retrieves current documents at query time, so updates require re-indexing rather than retraining',
        'Fine-tuning cannot be performed on document data',
        'RAG guarantees the model will never produce an incorrect answer'
      ],
      correct: 1,
      explanation: 'With RAG, knowledge lives in a searchable index that can be refreshed cheaply whenever docs change; fine-tuned knowledge is frozen in the weights and requires retraining to update. RAG reduces but does not eliminate wrong answers, and it deliberately does not modify model weights.'
    },
    {
      id: 'd2q26',
      question: 'A legal research chatbot occasionally cites cases that do not exist. Which approach most directly reduces these fabricated answers?',
      options: [
        'Ground responses in retrieved source documents (RAG) and require citations to them',
        'Increase the temperature to explore more diverse answers',
        'Extend the maximum output token limit',
        'Remove the system prompt to give the model more freedom'
      ],
      correct: 0,
      explanation: 'Hallucinations are best mitigated by grounding: retrieving real source documents and instructing the model to answer only from them, with citations users can verify. Higher temperature increases fabrication risk, and longer outputs or fewer instructions do nothing to anchor claims in real sources.'
    },
    {
      id: 'd2q27',
      question: 'Which task is a POOR fit for a generative AI model?',
      options: [
        'Drafting first versions of marketing copy',
        'Summarizing long support conversations',
        'Computing exact payroll withholdings that must be correct to the cent',
        'Brainstorming names for a new product'
      ],
      correct: 2,
      explanation: 'Generative models are probabilistic and can produce plausible-but-wrong numbers, so exact regulated calculations should be done with deterministic code. Drafting, summarizing, and brainstorming tolerate variation and benefit from generation.'
    },
    {
      id: 'd2q28',
      question: 'A team runs simple sentiment classification through the largest available foundation model and finds costs high and latency slow. What should they consider?',
      options: [
        'Using a smaller, cheaper model that meets the accuracy bar for this simple task',
        'Raising temperature to speed up token selection',
        'Duplicating the endpoint in a second region',
        'Adding chain-of-thought prompting to every request'
      ],
      correct: 0,
      explanation: 'Model choice should match task complexity — for simple classification, a smaller model is faster and dramatically cheaper while meeting accuracy needs. Temperature doesn\'t change speed, a second region doubles cost, and chain-of-thought increases token usage.'
    },
    {
      id: 'd2q29',
      question: 'An application sends a steady, high volume of requests to a Bedrock model and needs guaranteed throughput. Which pricing/capacity option is designed for this?',
      options: [
        'On-demand pay-per-token pricing',
        'Provisioned Throughput with committed model units',
        'AWS Free Tier',
        'Spot pricing for foundation models'
      ],
      correct: 1,
      explanation: 'Provisioned Throughput reserves dedicated model capacity for consistent, high-volume workloads (and is also required for serving custom fine-tuned models). On-demand suits variable or low volume, and there is no spot pricing for Bedrock models.'
    },
    {
      id: 'd2q30',
      question: 'What is the primary advantage of Amazon Bedrock for a team building a generative AI application?',
      options: [
        'It provides free access to all foundation models',
        'It offers a single serverless API to access foundation models from multiple providers without managing infrastructure',
        'It automatically fine-tunes every model on your company data',
        'It guarantees identical outputs across all supported models'
      ],
      correct: 1,
      explanation: 'Bedrock\'s core value is one managed, serverless API over many providers\' foundation models (Amazon, Anthropic, Meta, and others), letting teams swap and evaluate models without provisioning infrastructure. It is not free, does not fine-tune automatically, and different models naturally produce different outputs.'
    },
    {
      id: 'd2q31',
      question: 'Which describes how a generative adversarial network (GAN) is trained?',
      options: [
        'A generator creates samples while a discriminator tries to distinguish them from real data, and both improve through competition',
        'A model learns to reverse a gradual noise-adding process',
        'An agent maximizes cumulative reward through trial and error',
        'Two identical models vote on which output is more accurate'
      ],
      correct: 0,
      explanation: 'GANs pit a generator against a discriminator in an adversarial game — the generator improves by trying to fool the discriminator. Reversing added noise describes diffusion models, and reward maximization describes reinforcement learning.'
    },
    {
      id: 'd2q32',
      question: 'In generative AI, what does "grounding" a model\'s response mean?',
      options: [
        'Tying the response to verified source data so claims can be traced to real documents',
        'Lowering the temperature until output is deterministic',
        'Restricting the model to one-sentence answers',
        'Running the model on dedicated hardware'
      ],
      correct: 0,
      explanation: 'Grounding means anchoring generated content in authoritative source data — typically via retrieval — so responses reflect and can cite real information. It is the main defense against hallucination; it is unrelated to determinism settings, response length, or hardware.'
    },
    {
      id: 'd2q33',
      question: 'Employees need an AI assistant that answers questions using the company\'s internal wikis, SharePoint, and Salesforce data, with per-user access controls. Which AWS service is purpose-built for this?',
      options: ['Amazon Q Business', 'Amazon Polly', 'Amazon Rekognition', 'AWS Glue'],
      correct: 0,
      explanation: 'Amazon Q Business is the managed enterprise assistant that connects to company data sources (SharePoint, Salesforce, S3, and more) and respects existing user permissions when answering. Polly is text-to-speech, Rekognition is image analysis, and Glue is data integration.'
    },
    {
      id: 'd2q34',
      question: 'How is usage typically billed for on-demand foundation model inference?',
      options: [
        'A flat monthly fee per user',
        'By the number of input tokens processed plus output tokens generated',
        'By wall-clock seconds of GPU time only',
        'Per API call regardless of request size'
      ],
      correct: 1,
      explanation: 'On-demand pricing charges per token — both the tokens you send (input) and the tokens the model generates (output), usually at different rates. This is why long prompts and verbose outputs raise costs. Billing is not flat-rate, per-call, or raw GPU-seconds for managed on-demand inference.'
    },
    {
      id: 'd2q35',
      question: 'A QA engineer reruns the same prompt and gets differently worded (though similar) answers each time, complicating automated testing. What is the root cause?',
      options: [
        'The model\'s weights change slightly after every request',
        'Generative models sample from a probability distribution, so outputs are nondeterministic by default',
        'The context window shrinks with repeated use',
        'Token-based billing forces varied outputs'
      ],
      correct: 1,
      explanation: 'LLMs generate by sampling from predicted token probabilities, so identical prompts can yield different wordings. Weights are frozen at inference time and context windows don\'t shrink. Lowering temperature (and pinning other sampling parameters) reduces the variation.'
    },
    {
      id: 'd2q36',
      question: 'When selecting a foundation model for a new application, which set of factors is most relevant to compare?',
      options: [
        'Modality support, context window size, quality on the target task, latency, cost, and licensing terms',
        'The model\'s release date and the length of its name',
        'Only the parameter count — larger is always better',
        'Only the price per token — cheapest is always best'
      ],
      correct: 0,
      explanation: 'Model selection balances capability (task quality, modalities, context length) against operational constraints (latency, cost, license/data-use terms). Parameter count alone doesn\'t guarantee task fit, and choosing purely on price ignores whether outputs are usable.'
    }
  ]
};
