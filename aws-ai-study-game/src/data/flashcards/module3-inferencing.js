// Module 3: Inferencing - Using Trained Models
// Source: AWS Skill Builder - Certified AI Practitioner Course #1
// Includes visual diagram references for enhanced learning

export const module3 = {
  id: 'module3',
  name: 'Inferencing & Model Deployment',
  description: 'Batch vs Real-time inferencing and the ML pipeline',
  icon: '⚡',
  color: '#9370DB',
  gradient: 'linear-gradient(135deg, #9370DB 0%, #7B68EE 100%)',
  source: 'AWS Skill Builder - Certified AI Practitioner Course #1',
  cards: [
    {
      id: 'm3c1',
      front: 'What is INFERENCING in machine learning?',
      back: 'The process of using the information that a TRAINED model has learned to make predictions or decisions.\n\nThis happens AFTER training is complete.\n\n📊 Visual: Training Data → ML Algorithm → Model → [INFERENCING]',
      hint: 'Training = learning, Inferencing = applying what was learned',
      tags: ['inference', 'core-concept'],
      difficulty: 'beginner',
      hasVisual: true,
      visualType: 'ml-pipeline'
    },
    {
      id: 'm3c2',
      front: 'What is the ML Training Pipeline?\n\n[Visual: 3-step flow diagram]',
      back: '┌──────────────┐    ┌──────────────┐    ┌──────────────┐\n│ Training     │ →  │     ML       │ →  │    Model     │\n│    Data      │    │  Algorithm   │    │   (output)   │\n└──────────────┘    └──────────────┘    └──────────────┘\n\n1. Training Data feeds into the algorithm\n2. ML Algorithm learns patterns\n3. Model is the trained result ready for inferencing',
      hint: 'Data → Algorithm → Model',
      tags: ['ml-pipeline', 'training', 'visual'],
      difficulty: 'beginner',
      hasVisual: true,
      visualType: 'training-pipeline'
    },
    {
      id: 'm3c3',
      front: 'What are the 2 main types of inferencing?',
      back: '1. BATCH Inferencing\n   • Processes large amounts of data at once\n   • Results delivered as a set\n   • Speed less critical than accuracy\n\n2. REAL-TIME Inferencing\n   • Processes data immediately as it arrives\n   • Decisions made almost instantaneously\n   • Speed is critical',
      hint: 'Batch = bulk/later, Real-time = immediate',
      tags: ['inference', 'deployment'],
      difficulty: 'beginner',
      hasVisual: false
    },
    {
      id: 'm3c4',
      front: 'What is BATCH Inferencing?',
      back: 'When the computer takes a LARGE AMOUNT of data (images, text, etc.) and analyzes it ALL AT ONCE to provide a set of results.\n\nKey characteristics:\n• Not time-sensitive\n• Accuracy prioritized over speed\n• Processes data in bulk\n\nUse cases: Data analysis, report generation, bulk predictions',
      hint: 'Think: overnight batch jobs, bulk processing',
      tags: ['inference', 'batch'],
      difficulty: 'beginner',
      hasVisual: false
    },
    {
      id: 'm3c5',
      front: 'What is REAL-TIME Inferencing?',
      back: 'When the computer makes decisions QUICKLY in response to new information AS IT COMES IN.\n\nKey characteristics:\n• Immediate decision-making\n• Low latency required\n• Processes data instantaneously\n\nUse cases: Chatbots, self-driving cars, fraud detection, recommendations',
      hint: 'Think: instant responses, live predictions',
      tags: ['inference', 'real-time'],
      difficulty: 'beginner',
      hasVisual: false
    },
    {
      id: 'm3c6',
      front: 'When would you use BATCH inferencing?\n\nGive 3 examples.',
      back: 'Use batch inferencing when speed is NOT critical:\n\n1. Nightly data analysis reports\n2. Processing thousands of images for labeling\n3. Bulk email spam classification\n4. Monthly customer churn predictions\n5. Historical data analysis\n\nKey: Results can wait hours or overnight',
      hint: 'When you can wait for results',
      tags: ['inference', 'batch', 'use-cases'],
      difficulty: 'intermediate',
      hasVisual: false
    },
    {
      id: 'm3c7',
      front: 'When would you use REAL-TIME inferencing?\n\nGive 3 examples.',
      back: 'Use real-time inferencing when IMMEDIATE decisions are critical:\n\n1. Chatbots responding to users\n2. Self-driving cars detecting obstacles\n3. Credit card fraud detection\n4. Product recommendations while browsing\n5. Voice assistants (Alexa, Siri)\n\nKey: Milliseconds matter!',
      hint: 'When delays could cause problems',
      tags: ['inference', 'real-time', 'use-cases'],
      difficulty: 'intermediate',
      hasVisual: false
    },
    {
      id: 'm3c8',
      front: 'EXAM SCENARIO:\n\nA company wants to analyze customer purchase history overnight to predict next month\'s inventory needs.\n\nWhich inferencing type?',
      back: 'BATCH Inferencing ✓\n\nWhy?\n• "Overnight" = not time-sensitive\n• "Purchase history" = large dataset to analyze\n• "Next month" = results don\'t need to be immediate\n• Accuracy of predictions matters more than speed',
      hint: 'Look for time-sensitivity clues',
      tags: ['inference', 'exam-tip', 'scenario'],
      difficulty: 'intermediate',
      hasVisual: false
    },
    {
      id: 'm3c9',
      front: 'EXAM SCENARIO:\n\nA bank needs to approve or deny credit card transactions as they happen.\n\nWhich inferencing type?',
      back: 'REAL-TIME Inferencing ✓\n\nWhy?\n• "As they happen" = immediate processing needed\n• Fraud must be caught BEFORE transaction completes\n• Customer can\'t wait minutes for approval\n• Latency must be milliseconds',
      hint: 'Transaction approval = instant decision',
      tags: ['inference', 'exam-tip', 'scenario'],
      difficulty: 'intermediate',
      hasVisual: false
    },
    {
      id: 'm3c10',
      front: 'What determines which inferencing type to use?',
      back: 'YOUR USE CASE determines the inferencing type:\n\nChoose BATCH when:\n• Time is flexible\n• Processing large datasets\n• Accuracy > Speed\n• Scheduled/periodic tasks\n\nChoose REAL-TIME when:\n• Immediate response required\n• User is waiting\n• Safety-critical decisions\n• Continuous data streams',
      hint: 'Match the solution to the problem\'s timing needs',
      tags: ['inference', 'decision-making', 'exam-tip'],
      difficulty: 'intermediate',
      hasVisual: false
    },
    {
      id: 'm3c11',
      front: 'Complete the ML Pipeline:\n\nTraining Data → _____ → Model',
      back: 'Training Data → ML ALGORITHM → Model\n\n┌──────────────┐    ┌──────────────┐    ┌──────────────┐\n│ Training     │ →  │     ML       │ →  │    Model     │\n│    Data      │    │  Algorithm   │    │              │\n└──────────────┘    └──────────────┘    └──────────────┘\n\nThe ML Algorithm is the "learning engine" that:\n• Processes the training data\n• Identifies patterns\n• Produces the trained model',
      hint: 'What processes the data to create the model?',
      tags: ['ml-pipeline', 'training', 'visual'],
      difficulty: 'beginner',
      hasVisual: true,
      visualType: 'training-pipeline'
    },
    {
      id: 'm3c12',
      front: 'What comes AFTER training in the ML lifecycle?',
      back: 'INFERENCING (also called "inference" or "prediction")\n\nML Lifecycle:\n1. Data Collection & Preparation\n2. Algorithm Selection\n3. Training (model learns)\n4. Evaluation & Testing\n5. INFERENCING (model predicts) ← After training\n6. Monitoring & Iteration',
      hint: 'The model is now ready to be USED',
      tags: ['ml-pipeline', 'inference', 'lifecycle'],
      difficulty: 'beginner',
      hasVisual: false
    }
  ]
};

// Visual diagram data for rendering in the UI
export const moduleVisuals = {
  'training-pipeline': {
    type: 'flow',
    title: 'ML Training Pipeline',
    steps: [
      { label: 'Training Data', color: '#0d4f63', description: 'Input data for learning' },
      { label: 'ML Algorithm', color: '#0a7c91', description: 'Learning engine' },
      { label: 'Model', color: '#4ade80', description: 'Trained output' }
    ]
  },
  'inference-types': {
    type: 'comparison',
    title: 'Inferencing Types',
    items: [
      { 
        label: 'Batch', 
        icon: '📦', 
        characteristics: ['Large datasets', 'Scheduled', 'Accuracy focus'],
        examples: ['Reports', 'Bulk analysis']
      },
      { 
        label: 'Real-time', 
        icon: '⚡', 
        characteristics: ['Immediate', 'Low latency', 'Speed focus'],
        examples: ['Chatbots', 'Fraud detection']
      }
    ]
  },
  'ml-types': {
    type: 'icons',
    title: 'ML Learning Types',
    items: [
      { label: 'Supervised', icon: 'eye-book', description: 'Learns with labeled data' },
      { label: 'Unsupervised', icon: 'gears-shapes', description: 'Finds patterns in unlabeled data' },
      { label: 'Reinforcement', icon: 'reward-badge', description: 'Learns from rewards/penalties' }
    ]
  }
};
