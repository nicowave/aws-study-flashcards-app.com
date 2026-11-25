// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels
// Sources: official AWS documentation, linked on each card

export const flashcardDecks = {
  module1: {
    id: 'module1',
    name: 'Fundamentals of ML and AI',
    description: 'Core concepts of AI, ML, Deep Learning, and Generative AI',
    icon: '🧠',
    color: '#f472b6',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    source: 'Official AWS documentation (linked on each card)',
    cards: [
      {
        id: 'm1c1',
        front: 'What is Generative AI?',
        back: 'A branch of artificial intelligence that focuses on creating NEW content (text, images, audio, code) from existing data. Unlike traditional AI that analyzes data, generative AI learns patterns from training data and generates entirely new content.',
        hint: 'Think "creating" vs "analyzing"',
        tags: ['generative-ai', 'core-concept'],
        difficulty: 'beginner',
        sources: [
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c2',
        front: 'How does Generative AI differ from Traditional AI/ML?',
        back: 'Traditional AI/ML systems ANALYZE and INTERPRET data. Generative AI CREATES new content by learning patterns and relationships from vast amounts of training data.',
        hint: 'Traditional = interpret, Generative = create',
        tags: ['generative-ai', 'comparison'],
        difficulty: 'beginner',
        sources: [
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' },
          { title: 'What is Machine Learning? – AWS', url: 'https://aws.amazon.com/what-is/machine-learning/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c3',
        front: 'Name 4 types of content that Generative AI can create',
        back: '1. Text (stories, reports, articles)\n2. Images (from text prompts)\n3. Audio (voices, music, speech)\n4. Computer Code (snippets or full programs)',
        hint: 'Think about different media types',
        tags: ['generative-ai', 'applications'],
        difficulty: 'beginner',
        sources: [
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c4',
        front: 'What are Amazon Nova and Anthropic Claude?',
        back: 'Foundation model families in Amazon Bedrock whose Large Language Models (LLMs) handle TEXT GENERATION. They can produce human-like writing on virtually any topic, from creative stories to technical reports.\n\nNote: older material may name Amazon Titan; Titan text models are no longer listed in Bedrock (Titan now means embeddings models), and Amazon Nova is Amazon\'s current model family.',
        hint: 'These are foundation models for text',
        tags: ['aws-services', 'llm', 'text-generation'],
        difficulty: 'intermediate',
        sources: [
          { title: 'Models at a glance – Amazon Bedrock User Guide', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html', checked: '2026-11-25' },
          { title: 'Amazon Nova – AWS', url: 'https://aws.amazon.com/nova/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c5',
        front: 'What is Stable Diffusion?',
        back: 'A generative AI model for COMPUTER VISION that creates stunning visual images from simple text prompts (text-to-image generation).',
        hint: 'Think images from text descriptions',
        tags: ['generative-ai', 'image-generation'],
        difficulty: 'intermediate',
        sources: [
          { title: 'What are Foundation Models? – AWS', url: 'https://aws.amazon.com/what-is/foundation-models/', checked: '2026-11-25' },
          { title: 'Stability AI – Models in Amazon Bedrock – AWS', url: 'https://aws.amazon.com/bedrock/stability-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c6',
        front: 'How is Generative AI revolutionizing audio?',
        back: 'AI models can generate realistic human-like voices for:\n• Virtual assistants\n• Audiobooks\n• Podcasts\n• Speech synthesis',
        hint: 'Voice and speech applications',
        tags: ['generative-ai', 'audio', 'speech'],
        difficulty: 'beginner',
        sources: [
          { title: 'Generative voices – Amazon Polly Developer Guide', url: 'https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html', checked: '2026-11-25' },
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c7',
        front: 'How can Generative AI assist developers with coding?',
        back: '• Auto-completing code snippets\n• Generating entire programs from natural language descriptions\n• Code explanation and documentation\n• Bug detection and fixes',
        hint: 'Think code assistants like Amazon Q Developer or Kiro',
        tags: ['generative-ai', 'coding', 'developer-tools'],
        difficulty: 'intermediate',
        sources: [
          { title: 'What is Amazon Q Developer? – Amazon Q Developer User Guide', url: 'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c8',
        front: 'What are the key Responsible AI considerations for Generative AI?',
        back: '• Bias - ensuring fair and unbiased outputs\n• Privacy - protecting sensitive data\n• Responsible Use - safe and trustworthy deployment\n\nThese must be carefully addressed for safe deployment.',
        hint: 'Think ethics and safety',
        tags: ['responsible-ai', 'ethics', 'governance'],
        difficulty: 'intermediate',
        sources: [
          { title: 'Responsible AI – AWS', url: 'https://aws.amazon.com/ai/responsible-ai/', checked: '2026-11-25' },
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c9',
        front: 'What is the AI/ML hierarchy from broadest to most specific?',
        back: '1. Artificial Intelligence (broadest)\n2. Machine Learning (subset of AI)\n3. Deep Learning (subset of ML)\n4. Generative AI (application of deep learning)',
        hint: 'Each is a subset of the one above',
        tags: ['core-concept', 'hierarchy'],
        difficulty: 'beginner',
        sources: [
          { title: 'What is AI? – AWS', url: 'https://aws.amazon.com/what-is/artificial-intelligence/', checked: '2026-11-25' },
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      },
      {
        id: 'm1c10',
        front: 'What does "training data" mean in the context of Generative AI?',
        back: 'Vast amounts of existing data that generative AI models learn patterns and relationships from. The quality and quantity of training data directly affects the model\'s ability to generate new, relevant content.',
        hint: 'The data the model learns from',
        tags: ['core-concept', 'training'],
        difficulty: 'beginner',
        sources: [
          { title: 'What are Foundation Models? – AWS', url: 'https://aws.amazon.com/what-is/foundation-models/', checked: '2026-11-25' },
          { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' }
        ]
      }
    ]
  }
};

// Helper functions
export const getAllDecks = () => Object.values(flashcardDecks);

export const getDeckById = (id) => flashcardDecks[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values(flashcardDecks).forEach(deck => {
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
  Object.values(flashcardDecks).forEach(deck => {
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
  Object.values(flashcardDecks).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
