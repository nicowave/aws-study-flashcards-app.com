// Module 2: ML Training Process and Data Types
// Source: AWS Skill Builder - Certified AI Practitioner Course #1

export const module2 = {
  id: 'module2',
  name: 'ML Training Process & Data Types',
  description: 'Data preparation, structured vs unstructured data, and learning paradigms',
  icon: '📊',
  color: '#00CED1',
  gradient: 'linear-gradient(135deg, #00CED1 0%, #20B2AA 100%)',
  source: 'AWS Skill Builder - Certified AI Practitioner Course #1',
  cards: [
    {
      id: 'm2c1',
      front: 'What are the 4 main steps in building a machine learning model?',
      back: '1. Data collection and preparation\n2. Selecting an appropriate algorithm\n3. Training the model on prepared data\n4. Evaluating performance through testing and iteration',
      hint: 'Think: Collect → Choose → Train → Test',
      tags: ['ml-process', 'core-concept'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c2',
      front: 'What does "Garbage In, Garbage Out" mean in ML?',
      back: 'An ML model is only as good as the data used to train it. Bad or poor-quality data will result in a poorly performing model, regardless of how good the algorithm is.\n\nData preparation is arguably the MOST CRITICAL stage in the ML process.',
      hint: 'Quality of input determines quality of output',
      tags: ['data-quality', 'best-practices'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c3',
      front: 'What is LABELED data?',
      back: 'A dataset where each instance is accompanied by a label or target variable representing the desired output or classification.\n\nLabels are typically provided by human experts or obtained through a reliable process.\n\nExample: Images with class labels like "cat", "dog", "car"',
      hint: 'Data WITH answers attached',
      tags: ['data-types', 'supervised-learning'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c4',
      front: 'What is UNLABELED data?',
      back: 'A dataset where instances do NOT have any associated labels or target variables.\n\nThe data consists only of input features, without any corresponding output or classification.\n\nExample: A collection of images without any labels or annotations',
      hint: 'Data WITHOUT answers - just raw inputs',
      tags: ['data-types', 'unsupervised-learning'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c5',
      front: 'What is STRUCTURED data? Give examples.',
      back: 'Data that is organized and formatted in a predefined manner, typically in tables or databases with rows and columns.\n\nExamples:\n• Tabular data (spreadsheets, CSV files, databases)\n• Time-series data (stock prices, sensor readings, weather data)\n\nSuitable for traditional ML algorithms.',
      hint: 'Think: spreadsheets, rows & columns',
      tags: ['data-types', 'structured-data'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c6',
      front: 'What is UNSTRUCTURED data? Give examples.',
      back: 'Data that lacks a predefined structure or format.\n\nExamples:\n• Text data (documents, articles, social media posts)\n• Image data (photographs, video frames)\n• Audio and video\n\nRequires more advanced ML techniques to extract meaningful patterns.',
      hint: 'Think: text, images, audio, video',
      tags: ['data-types', 'unstructured-data'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c7',
      front: 'What is TABULAR data?',
      back: 'A type of structured data stored in spreadsheets, databases, or CSV files.\n\n• Rows represent instances (individual records)\n• Columns represent features or attributes\n\nExample: Customer database with columns for name, age, purchase history',
      hint: 'Spreadsheet format - rows and columns',
      tags: ['data-types', 'structured-data'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c8',
      front: 'What is TIME-SERIES data?',
      back: 'A type of structured data consisting of sequences of values measured at successive points in time.\n\nExamples:\n• Stock prices over time\n• Sensor readings\n• Weather data\n• Website traffic metrics',
      hint: 'Data points ordered by time',
      tags: ['data-types', 'structured-data', 'time-series'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c9',
      front: 'What are the 3 main categories of ML learning?',
      back: '1. SUPERVISED Learning - trained on labeled data\n\n2. UNSUPERVISED Learning - learns from unlabeled data\n\n3. REINFORCEMENT Learning - learns from rewards/penalties feedback',
      hint: 'Supervised, Unsupervised, Reinforcement',
      tags: ['ml-types', 'core-concept'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c10',
      front: 'What is SUPERVISED Learning?',
      back: 'ML algorithms trained on LABELED data.\n\nGoal: Learn a mapping function that can predict the output for new, unseen input data.\n\nThe model learns from examples where the correct answer is provided.\n\nExamples: Classification, Regression',
      hint: 'Learning WITH a teacher (labels)',
      tags: ['ml-types', 'supervised-learning'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c11',
      front: 'What is UNSUPERVISED Learning?',
      back: 'ML algorithms that learn from UNLABELED data.\n\nGoal: Discover inherent patterns, structures, or relationships within the input data.\n\nNo correct answers provided - the model finds patterns on its own.\n\nExamples: Clustering, Dimensionality Reduction',
      hint: 'Learning WITHOUT a teacher - finding hidden patterns',
      tags: ['ml-types', 'unsupervised-learning'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c12',
      front: 'What is REINFORCEMENT Learning?',
      back: 'ML where the machine is given only a performance score as guidance.\n\nFeedback is provided as REWARDS or PENALTIES for its actions.\n\nThe machine learns from this feedback to improve decision-making over time.\n\nExample: Game-playing AI, robotics, autonomous vehicles',
      hint: 'Learning by trial and error with rewards',
      tags: ['ml-types', 'reinforcement-learning'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c13',
      front: 'What is SEMI-SUPERVISED Learning?',
      back: 'A learning approach where only a PORTION of the training data is labeled.\n\nCombines aspects of supervised and unsupervised learning.\n\nUseful when labeling data is expensive or time-consuming.',
      hint: 'Mix of labeled + unlabeled data',
      tags: ['ml-types', 'semi-supervised'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c14',
      front: 'What is INFERENCING in machine learning?',
      back: 'The process of using the information that a trained model has learned to make predictions or decisions on new data.\n\nThis happens AFTER the model has been trained.\n\nIt\'s the "production" phase where the model is actually used.',
      hint: 'Using a trained model to make predictions',
      tags: ['inference', 'ml-process'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c15',
      front: 'What are the 2 main types of inferencing?',
      back: '1. BATCH Inferencing\n   - Process large volumes of data at once\n   - Not time-sensitive\n   - Example: Nightly report generation\n\n2. REAL-TIME Inferencing\n   - Process data immediately as it arrives\n   - Low latency required\n   - Example: Fraud detection, recommendations',
      hint: 'Batch (bulk) vs Real-time (immediate)',
      tags: ['inference', 'deployment'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c16',
      front: 'Which learning type uses labeled data: Supervised, Unsupervised, or Reinforcement?',
      back: 'SUPERVISED Learning uses labeled data.\n\nUnsupervised uses unlabeled data.\n\nReinforcement uses rewards/penalties (no traditional labels).',
      hint: 'Super-VISED = super-VISION = someone watching and correcting',
      tags: ['ml-types', 'exam-tip'],
      difficulty: 'beginner'
    },
    {
      id: 'm2c17',
      front: 'Why is data preparation the most critical stage in ML?',
      back: 'Because the quality of your model depends entirely on the quality of your data.\n\n• Bad data = bad model (Garbage In, Garbage Out)\n• Even the best algorithm can\'t fix poor data\n• Data prep includes: cleaning, formatting, handling missing values, feature engineering',
      hint: 'Your model can only be as good as your data',
      tags: ['data-quality', 'best-practices', 'exam-tip'],
      difficulty: 'intermediate'
    },
    {
      id: 'm2c18',
      front: 'Match: Images for facial recognition training would be what type of data?',
      back: 'UNSTRUCTURED data (specifically image data)\n\nIf the images have labels identifying the person → LABELED unstructured data (for supervised learning)\n\nIf no labels → UNLABELED unstructured data (for unsupervised learning)',
      hint: 'Images = unstructured; labels depend on whether answers are provided',
      tags: ['data-types', 'exam-tip'],
      difficulty: 'intermediate'
    }
  ]
};
