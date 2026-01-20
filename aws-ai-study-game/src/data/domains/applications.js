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
    }
  ]
};
