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
      question: 'An email provider has millions of historical messages, each labeled by users as "spam" or "not spam," and wants to train a model to classify incoming mail. Which ML approach fits this scenario?',
      options: ['Unsupervised learning', 'Reinforcement learning', 'Supervised learning', 'Self-supervised learning'],
      correct: 2,
      explanation: 'Supervised learning trains a model on examples that already carry the correct answer — here, the spam/not-spam labels. Unsupervised learning applies when no labels exist, and reinforcement learning trains an agent through rewards for sequential decisions, not from a labeled dataset.'
    },
    {
      id: 'd1q2',
      question: 'Which statement correctly describes the relationship between artificial intelligence (AI), machine learning (ML), and deep learning?',
      options: [
        'ML is a subset of AI, and deep learning is a subset of ML that uses multi-layer neural networks',
        'AI is a subset of ML, and deep learning is the broadest category containing both',
        'AI and ML are interchangeable terms, while deep learning is an unrelated field',
        'Deep learning is a subset of AI but sits entirely outside of machine learning'
      ],
      correct: 0,
      explanation: 'AI is the broad discipline of machines performing tasks that require intelligence; ML is the subset of AI where systems learn patterns from data instead of following explicit rules; deep learning is the subset of ML built on multi-layer neural networks. The other options invert or break this nesting.'
    },
    {
      id: 'd1q3',
      question: 'A small development team with no ML expertise wants to add image moderation and sentiment analysis to its app as quickly as possible. Which approach best meets this requirement?',
      options: [
        'Train and deploy custom models with Amazon SageMaker',
        'Provision EC2 instances with AWS Deep Learning AMIs and build models there',
        'Develop a distributed Spark ML pipeline on Amazon EMR',
        'Call pre-trained AWS AI services such as Amazon Rekognition and Amazon Comprehend'
      ],
      correct: 3,
      explanation: 'AWS AI services like Rekognition (image analysis) and Comprehend (sentiment and text analysis) expose pre-trained models through simple APIs, so teams without ML expertise get results immediately. SageMaker, Deep Learning AMIs, and EMR all require the team to build, train, and manage models themselves — slower and demanding skills they lack.'
    },
    {
      id: 'd1q4',
      question: 'A trained model is deployed behind an API and returns predictions for new transactions it has never seen before. In ML terminology, what is this prediction phase called?',
      options: ['Training', 'Inference', 'Feature engineering', 'Hyperparameter tuning'],
      correct: 1,
      explanation: 'Inference is using an already-trained model to generate predictions on new, unseen data. Training is the earlier phase where the model learns from data, feature engineering prepares input data, and hyperparameter tuning adjusts settings that control how training runs.'
    },
    {
      id: 'd1q5',
      question: 'A manufacturer wants to automatically detect visual defects in photos of products on an assembly line. Which neural network architecture is the standard choice for this image-analysis task?',
      options: ['Convolutional neural network (CNN)', 'Recurrent neural network (RNN)', 'Generative adversarial network (GAN)', 'Single-layer feed-forward network'],
      correct: 0,
      explanation: 'CNNs use convolutional layers to learn spatial hierarchies of features (edges, textures, shapes), making them the standard architecture for image classification and defect detection. RNNs are built for sequential data like text or time series, GANs are a training setup for generating data rather than classifying it, and a single-layer network cannot learn the complex visual features required.'
    },
    {
      id: 'd1q6',
      question: 'During training, a model fits the noise and outliers in its training set so closely that it fails to generalize to examples it has not seen. Which term describes this condition?',
      options: ['Underfitting', 'Data leakage', 'Overfitting', 'Concept drift'],
      correct: 2,
      explanation: 'Overfitting is when a model memorizes training data — including its noise — instead of learning generalizable patterns, so performance on new data suffers. Underfitting is the opposite (too simple to capture patterns at all), data leakage means test information contaminated training, and concept drift is when real-world data changes after deployment.'
    },
    {
      id: 'd1q7',
      question: 'In generative AI, what distinguishes a foundation model from a traditional task-specific ML model?',
      options: [
        'It is trained from scratch on a small labeled dataset to solve one narrow task',
        'It is pre-trained on broad data at massive scale and can be adapted to many downstream tasks',
        'It requires no training data because its behavior is defined by hand-written rules',
        'It is a compressed version of a larger model optimized to run on edge devices'
      ],
      correct: 1,
      explanation: 'Foundation models are pre-trained on vast, broad datasets and then adapted to many different tasks through prompting or fine-tuning — the opposite of a model built for a single task. Rules-based systems don\'t learn from data at all, and compressed edge models describe distillation or quantization, not foundation models.'
    },
    {
      id: 'd1q8',
      question: 'Before training a model, a data scientist converts raw timestamps into "day of week" and "hour of day" columns and combines two fields into a spending ratio. Which ML process does this describe?',
      options: ['Hyperparameter tuning', 'Data labeling', 'Model evaluation', 'Feature engineering'],
      correct: 3,
      explanation: 'Feature engineering transforms raw data into input features that better represent the underlying problem, which often improves model accuracy more than algorithm changes. Data labeling assigns target answers to examples, hyperparameter tuning adjusts training settings, and model evaluation measures performance after training.'
    },
    {
      id: 'd1q9',
      question: 'A telecom company wants a customer-service bot that can understand both spoken and typed requests, such as "check my bill balance," and respond conversationally. Which AWS service is designed for building this?',
      options: ['Amazon Lex', 'Amazon Polly', 'Amazon Transcribe', 'Amazon Comprehend'],
      correct: 0,
      explanation: 'Amazon Lex is the managed service for building conversational interfaces, combining automatic speech recognition with natural language understanding to handle both voice and text — it powers the same technology as Alexa. Polly only converts text to speech, Transcribe only converts speech to text, and Comprehend analyzes text but cannot manage a conversation.'
    },
    {
      id: 'd1q10',
      question: 'A news app wants to read its articles aloud to users in natural-sounding voices across multiple languages. Which AWS service should it use?',
      options: ['Amazon Transcribe', 'Amazon Translate', 'Amazon Polly', 'Amazon Lex'],
      correct: 2,
      explanation: 'Amazon Polly converts text into lifelike speech using neural text-to-speech, with many voices and languages available. Transcribe does the reverse (speech to text), Translate converts text between languages but produces no audio, and Lex builds conversational bots rather than narrating content.'
    },
    {
      id: 'd1q11',
      question: 'A data science team needs a single managed platform to prepare data, train and tune custom models, deploy them to endpoints, and monitor them in production. Which AWS service provides this end-to-end ML lifecycle?',
      options: ['Amazon Bedrock', 'Amazon SageMaker', 'Amazon Comprehend', 'AWS Glue'],
      correct: 1,
      explanation: 'Amazon SageMaker is the fully managed platform covering the entire custom ML lifecycle — data preparation, training, tuning, deployment, and monitoring. Bedrock provides API access to pre-built foundation models rather than a custom-model training platform, Comprehend is a pre-trained NLP service, and Glue handles data integration and ETL, not model building.'
    },
    {
      id: 'd1q12',
      question: 'An insurer scores its entire five-million-customer database once each night, with results needed by morning and no requirement for per-record response speed. Which inference approach is most cost-effective?',
      options: [
        'Real-time inference on an endpoint provisioned around the clock',
        'Serverless real-time inference invoked once per individual record',
        'Deploying the model to edge devices at each branch office location',
        'Batch inference that processes the full dataset in one scheduled job'
      ],
      correct: 3,
      explanation: 'Batch inference is designed for scoring large datasets on a schedule: compute spins up for the job, processes everything with high throughput, and shuts down, so nothing is paid for idle time. An always-on real-time endpoint bills 24/7 for a job that runs once nightly, and invoking millions of individual real-time requests adds cost and overhead with no benefit when latency doesn\'t matter.'
    },
    {
      id: 'd1q13',
      question: 'Months after deployment, a model\'s predictions become less accurate as customer behavior shifts away from the patterns in its training data. Which SageMaker capability detects this kind of data drift and quality degradation in production?',
      options: ['SageMaker Model Monitor', 'SageMaker Data Wrangler', 'SageMaker Feature Store', 'SageMaker Autopilot'],
      correct: 0,
      explanation: 'SageMaker Model Monitor continuously watches deployed models, detecting data drift, model quality degradation, bias drift, and feature attribution changes, and can alert the team to retrain. Data Wrangler prepares data before training, Feature Store manages and serves features, and Autopilot builds models automatically — none of them monitor production behavior.'
    },
    {
      id: 'd1q14',
      question: 'A resume-screening model must balance two errors: advancing unqualified candidates (false positives) and rejecting qualified ones (false negatives). The team wants a single metric that accounts for both. Which should they use?',
      options: ['Accuracy', 'Recall', 'F1 score', 'Precision'],
      correct: 2,
      explanation: 'The F1 score is the harmonic mean of precision and recall, so it penalizes a model that is weak on either false positives or false negatives — exactly the single balanced metric the team wants. Precision alone ignores missed qualified candidates, recall alone ignores false alarms, and accuracy can look strong while hiding poor performance on the smaller class.'
    },
    {
      id: 'd1q15',
      question: 'A video-streaming service wants to show each user a "Recommended for You" row that updates in real time based on viewing behavior, without building a recommendation engine from scratch. Which AWS service is purpose-built for this?',
      options: ['Amazon Kendra', 'Amazon Personalize', 'Amazon Forecast', 'Amazon Comprehend'],
      correct: 1,
      explanation: 'Amazon Personalize is the managed service for real-time personalized recommendations, using the same technology developed for Amazon.com and requiring no ML expertise. Kendra is intelligent enterprise search, Forecast predicts future time-series values like demand, and Comprehend analyzes text — none of them generate per-user recommendations.'
    },
    {
      id: 'd1q16',
      question: 'An e-commerce company wants a managed ML service to score online activities such as new account signups and payments for fraud risk in real time. Which AWS service is purpose-built for this?',
      options: ['Amazon Macie', 'Amazon GuardDuty', 'Amazon Inspector', 'Amazon Fraud Detector'],
      correct: 3,
      explanation: 'Amazon Fraud Detector uses ML to score online activities like payments and account creation for fraud risk in real time, adapting to new fraud patterns faster than static rules. Macie discovers sensitive data in S3, GuardDuty detects threats against AWS accounts and workloads, and Inspector scans workloads for software vulnerabilities — all security services, but none score business transactions for fraud.'
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
      question: 'A startup wants to add a generative AI chat feature using foundation models from providers such as Anthropic, Meta, and Amazon, accessed through one managed API without provisioning any infrastructure. Which AWS service should it use?',
      options: ['Amazon Bedrock', 'Amazon SageMaker Ground Truth', 'Amazon Comprehend', 'Amazon Kendra'],
      correct: 0,
      explanation: 'Amazon Bedrock is the fully managed, serverless service that exposes foundation models from multiple providers through a single API for building generative AI applications. Ground Truth is a data-labeling service, Comprehend is pre-trained NLP analysis (sentiment, entities), and Kendra is intelligent enterprise search — none of them provide foundation model access.'
    },
    {
      id: 'd2q2',
      question: 'To improve a chatbot\'s answers, an analyst rewrites the instructions, adds example inputs and outputs, and specifies the desired response format — all without running any training job. What is this practice called?',
      options: ['Fine-tuning', 'Continued pre-training', 'Prompt engineering', 'Feature engineering'],
      correct: 2,
      explanation: 'Prompt engineering is the practice of crafting the model\'s input — instructions, examples, and format constraints — to steer its output without changing the model itself. Fine-tuning and continued pre-training both run training jobs that modify model weights, and feature engineering is a traditional-ML data-preparation step, not a prompting technique.'
    },
    {
      id: 'd2q3',
      question: 'An HR chatbot answers employee questions by first searching a knowledge base of company policies for relevant passages, then inserting those passages into the model\'s prompt before generating a response. What is this architecture called?',
      options: ['Parameter-efficient fine-tuning', 'Retrieval Augmented Generation (RAG)', 'Chain-of-thought prompting', 'Continued pre-training'],
      correct: 1,
      explanation: 'RAG augments the model\'s prompt with relevant documents retrieved at query time, letting it answer from knowledge outside its training data without any retraining. Fine-tuning and continued pre-training modify model weights through training, and chain-of-thought prompting elicits step-by-step reasoning but retrieves nothing.'
    },
    {
      id: 'd2q4',
      question: 'A team building a RAG application needs an AWS service that can store document embeddings and run vector similarity (k-NN) searches over them. Which service fits this requirement?',
      options: ['Amazon Athena', 'Amazon DynamoDB', 'Amazon Redshift', 'Amazon OpenSearch Service'],
      correct: 3,
      explanation: 'Amazon OpenSearch Service supports k-NN vector search, making it a common choice for storing and querying embeddings in RAG architectures (and it backs Bedrock Knowledge Bases via OpenSearch Serverless). Athena runs SQL over data in S3, DynamoDB is a key-value/document store, and Redshift is a data warehouse — none is designed around vector similarity search.'
    },
    {
      id: 'd2q5',
      question: 'A coding assistant confidently describes an SDK function that does not actually exist in the library. Which term describes this LLM behavior?',
      options: ['Hallucination', 'Model drift', 'Underfitting', 'Prompt injection'],
      correct: 0,
      explanation: 'Hallucination is when a model generates fluent, plausible-sounding content that is factually wrong or invented — like a nonexistent function. Model drift is performance degradation as real-world data changes, underfitting is a model too simple to learn its training data, and prompt injection is an attack where malicious input overrides the model\'s instructions.'
    },
    {
      id: 'd2q6',
      question: 'A healthcare company has thousands of labeled prompt-and-response pairs from its specialty and wants a foundation model\'s weights permanently adapted so it excels at this domain. Which customization approach does this describe?',
      options: ['Prompt engineering with templates', 'Retrieval Augmented Generation', 'Fine-tuning the foundation model', 'Zero-shot prompting'],
      correct: 2,
      explanation: 'Fine-tuning continues training a pre-trained model on labeled domain examples, updating its weights so the specialization is built into the model itself. Prompt engineering and zero-shot prompting only shape the input and change nothing permanently, while RAG supplies external knowledge at query time and deliberately leaves the weights untouched.'
    },
    {
      id: 'd2q7',
      question: 'A developer reads that a model supports a 200,000-token input limit and is billed per 1,000 tokens. What does a "token" represent here?',
      options: [
        'A temporary security credential attached to each API request',
        'A unit of text, such as a word or piece of a word, that the model processes',
        'One second of accelerated compute time consumed by the invocation',
        'A checkpoint of the model\'s weights saved during the training run'
      ],
      correct: 1,
      explanation: 'LLMs split text into tokens — words, subwords, or characters — and both context limits and usage-based pricing are measured in these units. Tokens are unrelated to authentication credentials, compute-time billing, or training checkpoints.'
    },
    {
      id: 'd2q8',
      question: 'A team steers a foundation model\'s output style by including a handful of worked examples directly in each request, with no training job and no change to the model\'s weights. Which technique is this?',
      options: ['Full fine-tuning', 'Continued pre-training', 'Model distillation', 'In-context learning with few-shot examples'],
      correct: 3,
      explanation: 'In-context (few-shot) learning conditions the model on examples supplied in the prompt itself, adapting its behavior for that request without touching its weights. Fine-tuning and continued pre-training are training jobs that do update weights, and distillation trains a smaller model to imitate a larger one.'
    },
    {
      id: 'd2q9',
      question: 'Before indexing a 500-page manual for a RAG system, a team splits it into passages of a few hundred tokens each so they can be embedded and retrieved individually. What is this preprocessing step called?',
      options: ['Chunking', 'Tokenization', 'Quantization', 'Normalization'],
      correct: 0,
      explanation: 'Chunking breaks large documents into smaller pieces that embed well, retrieve precisely, and fit within the model\'s context window — a core step in RAG pipelines. Tokenization is the model\'s own splitting of text into tokens, quantization compresses model weights to lower precision, and normalization standardizes data values.'
    },
    {
      id: 'd2q10',
      question: 'A retail app represents every product description as a list of numbers so that items with similar meaning end up numerically close together, even when they share no keywords. What are these numerical representations called?',
      options: ['Tokens', 'Hyperparameters', 'Embeddings', 'Checkpoints'],
      correct: 2,
      explanation: 'Embeddings are vector representations of data that capture semantic meaning, so similar concepts land close together in vector space — the basis for semantic search and recommendations. Tokens are the text units a model processes, hyperparameters are training configuration settings, and checkpoints are saved model states.'
    },
    {
      id: 'd2q11',
      question: 'A design team generates marketing images with a model that starts from pure random noise and progressively removes it until a coherent image emerges. Which type of generative model works this way?',
      options: ['Generative adversarial network (GAN)', 'Diffusion model', 'Recurrent neural network (RNN)', 'Variational autoencoder (VAE)'],
      correct: 1,
      explanation: 'Diffusion models learn to reverse a gradual noise-adding process, generating images by iterative denoising — the approach behind Stable Diffusion and Amazon Titan Image Generator. GANs generate through a generator-discriminator competition, VAEs decode from a learned latent space, and RNNs are sequence models, not image generators.'
    },
    {
      id: 'd2q12',
      question: 'Which sequence correctly orders the stages of the foundation model lifecycle?',
      options: [
        'Model selection → Data selection → Fine-tuning → Pre-training → Deployment → Evaluation → Feedback',
        'Data selection → Pre-training → Model selection → Deployment → Fine-tuning → Feedback → Evaluation',
        'Pre-training → Data selection → Model selection → Evaluation → Fine-tuning → Deployment → Feedback',
        'Data selection → Model selection → Pre-training → Fine-tuning → Evaluation → Deployment → Feedback'
      ],
      correct: 3,
      explanation: 'The lifecycle starts with selecting data and a model architecture, then pre-training on broad data, fine-tuning for the target use, evaluating, deploying, and gathering feedback that drives further iteration. The other orders are wrong because pre-training cannot precede data selection, and evaluation must happen before deployment, not after.'
    },
    {
      id: 'd2q13',
      question: 'A support app lets customers upload a photo of a broken part and type a question about it, and the model interprets both the image and the text to produce an answer. Which type of model enables this?',
      options: ['A multimodal model', 'An embedding model', 'A diffusion model', 'A text-only large language model'],
      correct: 0,
      explanation: 'Multimodal models process (and can generate) more than one type of data — here, image plus text input. An embedding model outputs vectors rather than answers, a diffusion model generates images from noise, and a text-only LLM cannot interpret the uploaded photo at all.'
    },
    {
      id: 'd2q14',
      question: 'A team wants to adapt a large foundation model to its domain but cannot afford the compute to update all of the model\'s billions of weights. Which approach trains only a small number of parameters while freezing the rest?',
      options: ['Full fine-tuning', 'Pre-training from scratch', 'Parameter-Efficient Fine-Tuning (PEFT), such as LoRA', 'Reinforcement learning from human feedback (RLHF)'],
      correct: 2,
      explanation: 'PEFT techniques like LoRA freeze the original weights and train only a small set of added or selected parameters, achieving domain adaptation at a fraction of the cost of full fine-tuning. Full fine-tuning updates every weight, pre-training from scratch is the most expensive option of all, and RLHF is an alignment technique, not a cost-reduction method.'
    },
    {
      id: 'd2q15',
      question: 'A development team wants an AI assistant inside their IDE that suggests code completions, generates functions from natural-language comments, and scans code for security vulnerabilities. Which AWS service provides this?',
      options: ['Amazon SageMaker Canvas', 'Amazon Q Developer', 'AWS CodeDeploy', 'Amazon Kendra'],
      correct: 1,
      explanation: 'Amazon Q Developer is the generative AI coding assistant that provides inline code suggestions, generates code from natural-language prompts, and scans for security issues directly in the IDE. SageMaker Canvas is a no-code ML model builder, CodeDeploy automates application deployments, and Kendra is enterprise document search.'
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
