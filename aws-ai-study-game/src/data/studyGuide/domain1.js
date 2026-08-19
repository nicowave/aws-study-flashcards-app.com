// Domain 1: Fundamentals of AI and ML (20%)
export const domain1Guide = {
  id: 'domain1',
  name: 'Fundamentals of AI and ML',
  icon: '\u{1F9E0}',
  color: '#FF6B35',
  weight: '20%',
  description: 'Core AI and ML concepts, the machine learning pipeline, common algorithms, and key AWS services for traditional ML workloads.',
  sections: [
    {
      id: 'd1s1',
      title: 'Types of Machine Learning',
      content: [
        { type: 'paragraph', text: 'Machine learning is a subset of artificial intelligence where systems learn patterns from data rather than being explicitly programmed. There are three primary paradigms, each suited to different types of problems and data availability.' },
        { type: 'keyTerm', term: 'Supervised Learning', definition: 'The model learns from labeled data — each training example includes both the input and the desired output. The model finds patterns that map inputs to outputs, then generalizes to unseen data. Used when you have historical labeled examples.' },
        { type: 'keyTerm', term: 'Unsupervised Learning', definition: 'The model discovers hidden patterns or structures in unlabeled data. No target variable is provided — the algorithm finds groupings, associations, or dimensionality reductions on its own.' },
        { type: 'keyTerm', term: 'Reinforcement Learning', definition: 'An agent learns by interacting with an environment, receiving rewards for desirable actions and penalties for undesirable ones. The agent optimizes its strategy (policy) over time to maximize cumulative reward.' },
        { type: 'table', headers: ['Type', 'Data Required', 'Common Use Cases', 'Example Algorithms'], rows: [
          ['Supervised', 'Labeled (input + output)', 'Spam detection, price prediction, image classification', 'Linear Regression, Decision Trees, Neural Networks'],
          ['Unsupervised', 'Unlabeled (input only)', 'Customer segmentation, anomaly detection, topic modeling', 'K-Means, DBSCAN, PCA, Autoencoders'],
          ['Reinforcement', 'Reward signal from environment', 'Game playing, robotics, recommendation optimization', 'Q-Learning, Policy Gradient, PPO']
        ]},
        { type: 'keyTerm', term: 'Semi-Supervised Learning', definition: 'A hybrid approach that uses a small amount of labeled data combined with a large amount of unlabeled data. This is practical when labeling is expensive but unlabeled data is abundant.' },
        { type: 'examTip', text: 'The exam frequently asks you to identify which type of ML is appropriate for a given scenario. If labeled data is available, it is supervised learning. If you need to find patterns without labels, it is unsupervised. If an agent interacts with an environment and receives feedback, it is reinforcement learning.' }
      ]
    },
    {
      id: 'd1s2',
      title: 'The Machine Learning Pipeline',
      content: [
        { type: 'paragraph', text: 'Building an ML model is not just about training — it is a multi-stage pipeline that starts with understanding the problem and ends with monitoring the deployed model. Each stage has specific considerations that affect model quality.' },
        { type: 'numberedList', title: 'ML Pipeline Stages:', items: [
          'Problem Definition — Frame the business problem as an ML task. Determine whether it is classification, regression, clustering, etc.',
          'Data Collection — Gather relevant data from databases, APIs, logs, sensors, or third-party sources. Data quality directly impacts model performance.',
          'Data Preprocessing — Clean the data by handling missing values, removing duplicates, fixing inconsistencies, and normalizing formats.',
          'Feature Engineering — Select, transform, or create input variables (features) that help the model learn. This is often the most impactful step for model accuracy.',
          'Model Training — Choose an algorithm and train it on the prepared data. The model adjusts its internal parameters to minimize a loss function.',
          'Model Evaluation — Assess model performance on held-out test data using appropriate metrics. Compare against baselines.',
          'Model Deployment — Deploy the trained model to a production environment where it can serve predictions (inference).',
          'Monitoring & Retraining — Continuously monitor model performance for drift (data distribution changes) and retrain as needed.'
        ]},
        { type: 'keyTerm', term: 'Feature Engineering', definition: 'The process of selecting, transforming, or creating input variables that improve model performance. Examples include one-hot encoding categorical variables, normalizing numerical features, or creating interaction features.' },
        { type: 'keyTerm', term: 'Data Drift', definition: 'When the statistical properties of the input data change over time compared to the data the model was trained on. This can degrade model accuracy and requires retraining.' },
        { type: 'awsService', name: 'Amazon SageMaker', description: 'Fully managed service that covers the entire ML pipeline — from data labeling (Ground Truth) and notebook-based exploration (Studio) to training, tuning, and deploying models at scale. Supports built-in algorithms, custom code, and popular frameworks.' },
        { type: 'awsService', name: 'Amazon SageMaker Canvas', description: 'A no-code ML tool that allows business analysts to build and use ML models without writing any code. Provides a visual, point-and-click interface for the entire ML workflow.' },
        { type: 'examTip', text: 'Know all stages of the ML pipeline. The exam may ask which stage addresses a specific problem — for example, handling missing values is data preprocessing, while selecting the right input variables is feature engineering.' }
      ]
    },
    {
      id: 'd1s3',
      title: 'Classification, Regression, and Clustering',
      content: [
        { type: 'paragraph', text: 'These are the three most fundamental task types in machine learning. Understanding when to apply each is essential for the exam.' },
        { type: 'keyTerm', term: 'Classification', definition: 'Predicting a discrete category or class label. The output is one of a finite set of classes. Examples: spam/not-spam (binary), sentiment analysis (multi-class), image recognition (multi-class).' },
        { type: 'keyTerm', term: 'Regression', definition: 'Predicting a continuous numerical value. The output is a real number. Examples: house price prediction, temperature forecasting, stock price estimation.' },
        { type: 'keyTerm', term: 'Clustering', definition: 'Grouping similar data points together without predefined labels. This is an unsupervised task. Examples: customer segmentation, document grouping, anomaly detection.' },
        { type: 'comparison', title: 'Classification vs. Regression', items: [
          { label: 'Classification', description: 'Output is a category (e.g., "cat" or "dog"). Uses metrics like accuracy, precision, recall, F1 score. Algorithms: Logistic Regression, SVM, Random Forest, Neural Networks.' },
          { label: 'Regression', description: 'Output is a number (e.g., $425,000). Uses metrics like MSE, RMSE, MAE, R-squared. Algorithms: Linear Regression, Decision Trees, Gradient Boosting.' }
        ]},
        { type: 'examTip', text: 'If the question asks about predicting whether something belongs to a group, it is classification. If it asks about predicting a number or amount, it is regression. If it asks about finding groups in data without labels, it is clustering.' }
      ]
    },
    {
      id: 'd1s4',
      title: 'Neural Networks and Deep Learning',
      content: [
        { type: 'paragraph', text: 'Neural networks are computing systems inspired by the biological neural networks in the brain. They consist of layers of interconnected nodes (neurons) that process information. Deep learning refers to neural networks with many layers (deep architectures) that can learn complex patterns.' },
        { type: 'keyTerm', term: 'Neural Network', definition: 'A model composed of layers of nodes: an input layer, one or more hidden layers, and an output layer. Each connection has a weight that is adjusted during training. The network learns by propagating errors backward (backpropagation) and updating weights to minimize the loss function.' },
        { type: 'keyTerm', term: 'Convolutional Neural Network (CNN)', definition: 'A specialized neural network architecture designed for processing grid-like data such as images. CNNs use convolutional layers that apply filters to detect spatial patterns like edges, textures, and objects. They are the standard for image classification, object detection, and computer vision tasks.' },
        { type: 'keyTerm', term: 'Recurrent Neural Network (RNN)', definition: 'A neural network designed for sequential data where the output from previous steps is fed as input to the current step. Used for time series, natural language processing, and speech recognition. LSTMs and GRUs are improved variants that handle long-range dependencies.' },
        { type: 'keyTerm', term: 'Deep Learning', definition: 'A subset of machine learning that uses neural networks with many layers. Deep learning excels at automatically learning hierarchical representations from raw data, eliminating much of the need for manual feature engineering.' },
        { type: 'bulletList', title: 'When to use deep learning:', items: [
          'Large amounts of data are available (deep learning is data-hungry)',
          'The problem involves unstructured data (images, text, audio)',
          'Feature engineering is difficult or unknown',
          'High computational resources are available (GPUs/TPUs)'
        ]},
        { type: 'examTip', text: 'CNNs are for images and spatial data. RNNs (and their variants LSTM/GRU) are for sequential data like text and time series. Transformers (covered in Domain 2) have largely replaced RNNs for NLP tasks.' }
      ]
    },
    {
      id: 'd1s5',
      title: 'Overfitting and Underfitting',
      content: [
        { type: 'paragraph', text: 'One of the most important concepts in ML is the balance between a model that is too simple (underfitting) and one that is too complex (overfitting). This tradeoff is known as the bias-variance tradeoff.' },
        { type: 'keyTerm', term: 'Overfitting', definition: 'When a model performs well on training data but poorly on new, unseen data. The model has memorized the training data including its noise and outliers, rather than learning the underlying pattern. Characterized by high variance and low bias.' },
        { type: 'keyTerm', term: 'Underfitting', definition: 'When a model is too simple to capture the underlying pattern in the data. It performs poorly on both training and test data. Characterized by high bias and low variance.' },
        { type: 'keyTerm', term: 'Bias-Variance Tradeoff', definition: 'Bias is the error from overly simplistic assumptions (underfitting). Variance is the error from sensitivity to small fluctuations in training data (overfitting). The goal is to find the sweet spot that minimizes total error.' },
        { type: 'bulletList', title: 'Techniques to prevent overfitting:', items: [
          'Regularization — Add penalty terms (L1/L2) to the loss function to discourage overly complex models',
          'Early Stopping — Halt training when validation performance stops improving',
          'Cross-Validation — Use K-fold cross-validation to get a more reliable estimate of model performance',
          'Data Augmentation — Increase training data diversity through transformations (rotation, flipping, noise)',
          'Dropout — Randomly disable neurons during training to prevent co-adaptation',
          'Pruning — Remove irrelevant features or simplify decision trees',
          'Ensembling — Combine multiple models (bagging, boosting) to reduce variance'
        ]},
        { type: 'keyTerm', term: 'K-Fold Cross-Validation', definition: 'A technique that splits the dataset into K equal subsets (folds). The model is trained K times, each time using K-1 folds for training and 1 fold for validation. The results are averaged to get a more robust performance estimate.' },
        { type: 'awsService', name: 'Amazon SageMaker', description: 'Provides built-in automatic model tuning (hyperparameter optimization) and real-time training metrics that help detect overfitting. SageMaker can automatically stop training when specified metrics stop improving.' },
        { type: 'examTip', text: 'If a model has high training accuracy but low test accuracy, it is overfitting. If both training and test accuracy are low, it is underfitting. Know the prevention techniques — regularization, early stopping, and cross-validation are the most commonly tested.' }
      ]
    },
    {
      id: 'd1s6',
      title: 'Model Evaluation Metrics',
      content: [
        { type: 'paragraph', text: 'Choosing the right evaluation metric depends on the type of ML task and the business requirements. A model that optimizes for one metric may perform poorly on another.' },
        { type: 'keyTerm', term: 'Accuracy', definition: 'The percentage of correct predictions out of all predictions. Simple but can be misleading with imbalanced classes — a model predicting "not fraud" for every transaction would have 99%+ accuracy if fraud is rare.' },
        { type: 'keyTerm', term: 'Precision', definition: 'Of all positive predictions, how many were actually positive? Precision = TP / (TP + FP). High precision means few false positives. Important when false positives are costly (e.g., spam filter marking legitimate email as spam).' },
        { type: 'keyTerm', term: 'Recall (Sensitivity)', definition: 'Of all actual positives, how many were correctly identified? Recall = TP / (TP + FN). High recall means few false negatives. Important when missing positives is costly (e.g., disease detection, fraud detection).' },
        { type: 'keyTerm', term: 'F1 Score', definition: 'The harmonic mean of precision and recall: F1 = 2 * (Precision * Recall) / (Precision + Recall). Provides a single balanced metric when both precision and recall matter. Ranges from 0 to 1.' },
        { type: 'keyTerm', term: 'Confusion Matrix', definition: 'A table showing four outcomes: True Positives (TP), True Negatives (TN), False Positives (FP), and False Negatives (FN). It provides a complete picture of classification performance beyond a single metric.' },
        { type: 'table', headers: ['Metric', 'Best For', 'Formula'], rows: [
          ['Accuracy', 'Balanced datasets', 'Correct / Total'],
          ['Precision', 'Minimizing false positives', 'TP / (TP + FP)'],
          ['Recall', 'Minimizing false negatives', 'TP / (TP + FN)'],
          ['F1 Score', 'Balance of precision and recall', '2 * P * R / (P + R)'],
          ['AUC-ROC', 'Overall binary classifier performance', 'Area under ROC curve'],
          ['RMSE', 'Regression error measurement', 'sqrt(mean(errors^2))']
        ]},
        { type: 'examTip', text: 'The exam often presents a scenario and asks which metric to prioritize. For fraud detection or medical diagnosis, prioritize recall (catching all positives). For spam filtering or recommendation quality, prioritize precision (avoiding false positives). When both matter equally, use F1 score.' }
      ]
    },
    {
      id: 'd1s7',
      title: 'AWS AI and ML Services Overview',
      content: [
        { type: 'paragraph', text: 'AWS offers a three-tier stack for AI/ML: AI Services (pre-built, no ML expertise needed), ML Services (tools for ML practitioners), and ML Frameworks & Infrastructure (for researchers and advanced users). The exam focuses heavily on AI Services and SageMaker.' },
        { type: 'awsService', name: 'Amazon Rekognition', description: 'Computer vision service that analyzes images and video. Detects objects, faces, text, scenes, and activities. Can perform facial comparison, content moderation, and celebrity recognition. No ML expertise required.' },
        { type: 'awsService', name: 'Amazon Comprehend', description: 'Natural language processing (NLP) service that extracts insights from text. Performs sentiment analysis, entity recognition, key phrase extraction, language detection, and topic modeling.' },
        { type: 'awsService', name: 'Amazon Polly', description: 'Text-to-speech service that converts text into lifelike speech. Supports multiple languages and voices, including neural text-to-speech for the most natural sound.' },
        { type: 'awsService', name: 'Amazon Transcribe', description: 'Automatic speech recognition (ASR) service that converts speech to text. Supports real-time and batch transcription, custom vocabulary, speaker identification, and automatic content redaction.' },
        { type: 'awsService', name: 'Amazon Translate', description: 'Neural machine translation service for language translation. Supports 75+ languages, custom terminology, and real-time or batch translation.' },
        { type: 'awsService', name: 'Amazon Lex', description: 'Service for building conversational chatbots with automatic speech recognition and natural language understanding. Powers the same technology behind Alexa.' },
        { type: 'awsService', name: 'Amazon Textract', description: 'Document analysis service that extracts text, handwriting, tables, and forms from scanned documents. Goes beyond simple OCR by understanding document structure.' },
        { type: 'awsService', name: 'Amazon Kendra', description: 'Intelligent enterprise search service powered by ML. Provides natural language search across multiple data sources with relevant, accurate answers.' },
        { type: 'awsService', name: 'Amazon Personalize', description: 'ML service for building real-time personalized recommendations. Used for product recommendations, personalized search results, and customized content.' },
        { type: 'examTip', text: 'Know which AWS service matches which use case: Rekognition = images/video, Comprehend = text analysis/NLP, Polly = text-to-speech, Transcribe = speech-to-text, Translate = languages, Lex = chatbots, Textract = documents/forms, Kendra = enterprise search, Personalize = recommendations.' }
      ]
    }
  ]
};
