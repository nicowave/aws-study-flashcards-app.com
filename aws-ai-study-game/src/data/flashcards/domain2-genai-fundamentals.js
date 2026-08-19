// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels

export const domain2 = {
  id: 'domain2',
  name: 'Fundamentals of Generative AI',
  description: 'Generative AI concepts, model selection, and AWS GenAI infrastructure',
  icon: '✨',
  color: '#9B59B6',
  gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
  source: 'AWS Certified AI Practitioner Exam Guide - Domain 2',
  examWeight: '24%',
  cards: [
    // Task Statement 2.1: Explain the basic concepts of GenAI
    {
      id: 'd2c1',
      front: 'What are Tokens in the context of large language models?',
      back: 'Tokens are the basic units of text that LLMs process. A token can be a word, part of a word, or a character.\n\nKey facts:\n• English text averages ~1.3 tokens per word\n• "Tokenization" splits text into these units\n• Models have token limits (context window)\n• Pricing is based on input/output tokens\n\nExample: "unhappiness" might be split into ["un", "happi", "ness"]',
      hint: 'The smallest units a model reads and generates',
      tags: ['tokens', 'tokenization', 'llm-basics'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c2',
      front: 'What is Chunking in generative AI?',
      back: 'Chunking is the process of breaking large documents into smaller, manageable pieces for processing.\n\nWhy it matters:\n• Models have limited context windows\n• Smaller chunks improve retrieval accuracy\n• Essential for RAG (Retrieval-Augmented Generation)\n\nStrategies:\n• Fixed-size chunking (e.g., 512 tokens)\n• Semantic chunking (by meaning/topic)\n• Sentence or paragraph-based chunking\n• Overlapping chunks to preserve context',
      hint: 'Splitting large text into smaller pieces',
      tags: ['chunking', 'rag', 'data-processing'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c3',
      front: 'What are Embeddings in generative AI?',
      back: 'Embeddings are numerical (vector) representations of text, images, or other data that capture semantic meaning.\n\nKey properties:\n• Similar concepts have similar embeddings\n• Enable semantic search and comparison\n• Produced by embedding models (e.g., Amazon Titan Embeddings)\n• Stored in vector databases for retrieval\n\nUse cases: Semantic search, recommendation systems, clustering, RAG',
      hint: 'Numbers that capture meaning',
      tags: ['embeddings', 'vectors', 'semantic-search'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c4',
      front: 'What are Vectors and Vector Databases in generative AI?',
      back: 'Vectors are ordered lists of numbers representing data in multi-dimensional space. Vector databases store and search these efficiently.\n\nKey concepts:\n• Each embedding is a vector (e.g., [0.2, -0.5, 0.8, ...])\n• Similarity is measured by distance (cosine, Euclidean)\n• Vector databases enable fast nearest-neighbor search\n\nAWS options:\n• Amazon OpenSearch Serverless\n• Amazon Aurora with pgvector\n• Pinecone on AWS Marketplace',
      hint: 'Lists of numbers stored in specialized databases',
      tags: ['vectors', 'vector-databases', 'embeddings'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c5',
      front: 'What is Prompt Engineering?',
      back: 'The practice of crafting effective inputs (prompts) to guide generative AI models toward desired outputs.\n\nKey techniques:\n• Zero-shot - no examples provided\n• Few-shot - include examples in the prompt\n• Chain-of-thought - ask model to reason step by step\n• System prompts - set context and behavior rules\n\nBest practices:\n• Be specific and clear\n• Provide context and constraints\n• Iterate and refine prompts\n• Use structured output formats',
      hint: 'Crafting inputs to get better AI outputs',
      tags: ['prompt-engineering', 'techniques', 'best-practices'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c6',
      front: 'What is a Transformer-based Large Language Model (LLM)?',
      back: 'A deep learning model built on the Transformer architecture that processes and generates human-like text.\n\nKey characteristics:\n• Self-attention mechanism to understand context\n• Trained on massive text datasets\n• Billions of parameters\n• Can handle long-range dependencies in text\n\nExamples: GPT, Claude, Llama, Amazon Titan Text\n\nThe Transformer architecture (2017) revolutionized NLP by enabling parallel processing of sequences',
      hint: 'Architecture using self-attention for text generation',
      tags: ['transformer', 'llm', 'architecture'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c7',
      front: 'What is a Foundation Model (FM)?',
      back: 'A large AI model pre-trained on broad, diverse datasets that can be adapted to a wide range of downstream tasks.\n\nCharacteristics:\n• Trained on massive unlabeled data\n• General-purpose capabilities\n• Can be fine-tuned for specific tasks\n• Serves as a starting point (foundation)\n\nExamples on Amazon Bedrock:\n• Anthropic Claude (text)\n• Amazon Titan (text and embeddings)\n• Stability AI (images)\n• Meta Llama (text)',
      hint: 'Pre-trained general-purpose model adaptable to many tasks',
      tags: ['foundation-models', 'pre-training', 'bedrock'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c8',
      front: 'What are Multimodal Models in generative AI?',
      back: 'AI models that can process and generate multiple types of data (modalities) such as text, images, audio, and video.\n\nCapabilities:\n• Text + Image understanding (e.g., describe an image)\n• Image generation from text prompts\n• Audio transcription and generation\n• Cross-modal reasoning\n\nExamples:\n• Anthropic Claude (text + image input)\n• Amazon Titan Multimodal Embeddings\n• GPT-4 Vision',
      hint: 'Models that handle text, images, audio, and more',
      tags: ['multimodal', 'foundation-models', 'capabilities'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c9',
      front: 'What are Diffusion Models in generative AI?',
      back: 'A class of generative models that create data (typically images) by learning to reverse a noise-adding process.\n\nHow they work:\n• Forward process: gradually add noise to data until pure noise\n• Reverse process: learn to remove noise step by step\n• Generate new data by starting from random noise\n\nExamples:\n• Stable Diffusion (Stability AI)\n• Amazon Titan Image Generator\n• DALL-E\n\nStrengths: High-quality image generation, controllable outputs',
      hint: 'Generate images by learning to remove noise',
      tags: ['diffusion-models', 'image-generation', 'architecture'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c10',
      front: 'What are common use cases for Image, Video, and Audio generation with GenAI?',
      back: 'Image generation:\n• Marketing visuals and product mockups\n• Art and creative design\n• Image editing and inpainting\n\nVideo generation:\n• Animated content creation\n• Video summarization and editing\n• Synthetic training data\n\nAudio generation:\n• Text-to-speech (Amazon Polly)\n• Music composition\n• Voice cloning and dubbing\n• Podcast and audiobook production',
      hint: 'Creating visual and audio content with AI',
      tags: ['use-cases', 'image-generation', 'audio-generation'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c11',
      front: 'How is generative AI used for Text Summarization and Translation?',
      back: 'Summarization:\n• Condense long documents into key points\n• Meeting notes and report summaries\n• News article digests\n• Legal and medical document summaries\n\nTranslation:\n• Real-time language translation\n• Document localization\n• Cross-language customer support\n• Multilingual content creation\n\nBoth leverage LLMs deep understanding of language structure and meaning',
      hint: 'Condensing text and converting between languages',
      tags: ['use-cases', 'summarization', 'translation'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c12',
      front: 'How is generative AI used for Code Generation and AI Assistants?',
      back: 'Code generation:\n• Auto-complete code (Amazon Q Developer)\n• Generate code from natural language\n• Code review and bug detection\n• Test case generation\n• Code documentation\n\nAI assistants:\n• Amazon Q Business for enterprise knowledge\n• Conversational chatbots\n• Personal productivity assistants\n• Domain-specific expert systems\n\nBoth reduce manual effort and accelerate workflows',
      hint: 'Writing code and powering intelligent helpers',
      tags: ['use-cases', 'code-generation', 'ai-assistants'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c13',
      front: 'How is generative AI used for Customer Service Agents and Search?',
      back: 'Customer service agents:\n• Automated chatbots handling routine inquiries\n• Intelligent ticket routing and response\n• 24/7 availability with natural conversations\n• Sentiment analysis and escalation\n\nSearch and information retrieval:\n• Semantic search (meaning-based, not keyword-based)\n• Enterprise knowledge base search\n• RAG-powered question answering\n• Amazon Kendra for intelligent search\n\nBoth improve user experience and reduce operational costs',
      hint: 'Automating support and finding information intelligently',
      tags: ['use-cases', 'customer-service', 'search'],
      difficulty: 'beginner',
      taskStatement: '2.1'
    },
    {
      id: 'd2c14',
      front: 'How is generative AI used for Recommendation Engines?',
      back: 'GenAI enhances recommendations by understanding content and user intent at a deeper level.\n\nCapabilities:\n• Personalized product recommendations\n• Content curation (articles, videos, music)\n• Next-best-action suggestions\n• Conversational recommendations via chat\n\nAdvantages over traditional approaches:\n• Understands nuance and context\n• Handles cold-start problem better\n• Can explain why items are recommended\n• Adapts to natural language preferences\n\nAWS service: Amazon Personalize',
      hint: 'Suggesting relevant items based on deep understanding',
      tags: ['use-cases', 'recommendation-engines', 'personalization'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c15',
      front: 'What are the stages of the Foundation Model Lifecycle?',
      back: '1. Data Selection - choose quality training data\n2. Model Selection - pick architecture and base model\n3. Pre-training - train on large datasets (expensive)\n4. Fine-tuning - adapt to specific tasks/domains\n5. Evaluation - test performance and safety\n6. Deployment - serve the model in production\n7. Feedback - collect user feedback for improvement\n\nThis is an iterative cycle where feedback drives continuous improvement',
      hint: 'Seven stages from data to deployment and back',
      tags: ['fm-lifecycle', 'model-development', 'mlops'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c16',
      front: 'What is involved in Data Selection and Pre-training for foundation models?',
      back: 'Data Selection:\n• Choose diverse, high-quality datasets\n• Remove biased, toxic, or private content\n• Balance representation across domains\n• Consider data licensing and compliance\n\nPre-training:\n• Self-supervised learning on massive data\n• Learns general language/vision patterns\n• Requires enormous compute resources (GPUs/TPUs)\n• Can cost millions of dollars\n• Results in a general-purpose foundation model\n\nMost organizations skip pre-training and use existing FMs',
      hint: 'Curating data and initial large-scale training',
      tags: ['fm-lifecycle', 'pre-training', 'data-selection'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c17',
      front: 'What is Fine-tuning and how does it differ from Pre-training?',
      back: 'Fine-tuning adapts a pre-trained foundation model to a specific task or domain using a smaller, labeled dataset.\n\nPre-training vs Fine-tuning:\n• Pre-training: broad data, general knowledge, very expensive\n• Fine-tuning: narrow data, specialized skills, much cheaper\n\nFine-tuning methods:\n• Full fine-tuning - update all model weights\n• Parameter-efficient (PEFT/LoRA) - update small subset\n• Instruction tuning - train on instruction-response pairs\n• RLHF - align with human preferences\n\nAWS: Amazon Bedrock custom model training',
      hint: 'Specializing a general model for your specific needs',
      tags: ['fine-tuning', 'fm-lifecycle', 'customization'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    {
      id: 'd2c18',
      front: 'What is involved in Evaluation, Deployment, and Feedback for foundation models?',
      back: 'Evaluation:\n• Benchmark testing (accuracy, fluency, safety)\n• Human evaluation of output quality\n• Bias and toxicity testing\n• Domain-specific performance metrics\n\nDeployment:\n• Choose hosting infrastructure (Bedrock, SageMaker)\n• Set up scaling and monitoring\n• Implement guardrails and content filters\n• A/B testing with users\n\nFeedback:\n• Collect user ratings and corrections\n• Monitor for drift and degradation\n• Use feedback to refine prompts or re-fine-tune\n• Continuous improvement loop',
      hint: 'Testing, serving, and continuously improving models',
      tags: ['fm-lifecycle', 'evaluation', 'deployment', 'feedback'],
      difficulty: 'intermediate',
      taskStatement: '2.1'
    },
    // Task Statement 2.2: Understand generative AI model selection and business value
    {
      id: 'd2c19',
      front: 'What is Nondeterminism in generative AI?',
      back: 'The same input prompt can produce different outputs each time due to:\n• Randomness in generation process\n• Temperature and sampling parameters\n• Model updates\n\nBenefits: Creativity and variety\nChallenges: Inconsistent results, harder testing, compliance issues\n\nCan be controlled via temperature settings (lower = more deterministic)',
      hint: 'Same input, different outputs',
      tags: ['nondeterminism', 'limitations', 'model-behavior'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    {
      id: 'd2c20',
      front: 'What factors should be considered when selecting a generative AI model?',
      back: '• Model Type - text, image, multi-modal, etc.\n• Performance Requirements - latency, throughput\n• Capabilities - task-specific features\n• Constraints - cost, infrastructure, token limits\n• Compliance - data privacy, regulatory requirements\n• Accuracy needs\n• Customization options (fine-tuning, RAG)',
      hint: 'Type, performance, cost, compliance',
      tags: ['model-selection', 'business-decisions'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    {
      id: 'd2c21',
      front: 'How do you determine business value for generative AI applications?',
      back: 'Key metrics:\n• Cross-domain Performance - versatility across tasks\n• Efficiency - time/cost savings\n• Conversion Rate - customer actions\n• Average Revenue Per User (ARPU)\n• Accuracy - quality of outputs\n• Customer Lifetime Value (CLV)\n• User engagement and satisfaction\n• Productivity improvements',
      hint: 'Measure impact on revenue and efficiency',
      tags: ['business-metrics', 'roi', 'value'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    {
      id: 'd2c22',
      front: 'What is the main inaccuracy risk with generative AI?',
      back: 'GenAI models can produce outputs that are:\n• Factually incorrect\n• Outdated (knowledge cutoff dates)\n• Contextually inappropriate\n• Biased or unfair\n\nMitigation strategies:\n• Use RAG for current information\n• Implement verification workflows\n• Human-in-the-loop review\n• Regular testing and monitoring',
      hint: 'Wrong answers presented confidently',
      tags: ['inaccuracy', 'limitations', 'quality'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    {
      id: 'd2c23',
      front: 'Why is Adaptability a key advantage of generative AI?',
      back: 'GenAI models can:\n• Handle multiple tasks without retraining\n• Work across different domains and industries\n• Adapt to new use cases through prompting\n• Transfer learning from pre-training\n• Require minimal customization for basic use\n\nOne model can do translation, summarization, Q&A, and more',
      hint: 'One model, many tasks',
      tags: ['adaptability', 'advantages', 'versatility'],
      difficulty: 'beginner',
      taskStatement: '2.2'
    },
    {
      id: 'd2c24',
      front: 'Why is Responsiveness considered an advantage of generative AI?',
      back: 'GenAI provides:\n• Real-time or near-real-time responses\n• Interactive conversations\n• Immediate content generation\n• Quick iterations on outputs\n• On-demand availability\n\nEnables responsive applications like chatbots, live assistance, and interactive tools',
      hint: 'Fast, real-time outputs',
      tags: ['responsiveness', 'advantages', 'performance'],
      difficulty: 'beginner',
      taskStatement: '2.2'
    },
    {
      id: 'd2c25',
      front: 'Why is Simplicity an advantage of generative AI?',
      back: 'GenAI simplifies AI adoption:\n• Natural language interface (no coding needed)\n• Pre-trained models ready to use\n• Lower technical barrier to entry\n• Minimal data requirements to get started\n• User-friendly tools like PartyRock\n• Quick prototyping and experimentation\n\nDemocratizes AI access for non-technical users',
      hint: 'Easy to use, low barrier to entry',
      tags: ['simplicity', 'advantages', 'accessibility'],
      difficulty: 'beginner',
      taskStatement: '2.2'
    },
    {
      id: 'd2c26',
      front: 'What performance requirements affect generative AI model selection?',
      back: 'Key considerations:\n• Latency - response time requirements\n• Throughput - requests per second\n• Token limits - input/output size constraints\n• Real-time vs. batch processing\n• Concurrent users\n• Geographic distribution\n• Availability requirements (uptime)\n• Cost per inference',
      hint: 'Speed, scale, and reliability needs',
      tags: ['performance', 'model-selection', 'requirements'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    {
      id: 'd2c27',
      front: 'How does compliance affect generative AI model selection?',
      back: 'Compliance considerations:\n• Data residency requirements (geographic location)\n• Industry regulations (HIPAA, GDPR, FINRA)\n• Data privacy and security standards\n• Model transparency requirements\n• Bias and fairness regulations\n• Content filtering needs\n• Audit trail and logging\n• Explainability requirements',
      hint: 'Regulatory and legal requirements',
      tags: ['compliance', 'governance', 'regulations'],
      difficulty: 'intermediate',
      taskStatement: '2.2'
    },
    // Task Statement 2.3: AWS infrastructure and technologies for generative AI
    {
      id: 'd2c28',
      front: 'What is Amazon Bedrock?',
      back: 'AWS fully managed service providing access to foundation models from leading AI companies through a single API.\n\nFeatures:\n• Multiple FMs (Anthropic, Meta, Amazon, etc.)\n• No infrastructure management\n• Serverless experience\n• Fine-tuning capabilities\n• RAG support\n• Security and compliance built-in\n\nIdeal for building GenAI applications quickly',
      hint: 'Managed foundation model service',
      tags: ['aws-services', 'bedrock', 'foundation-models'],
      difficulty: 'beginner',
      taskStatement: '2.3'
    },
    {
      id: 'd2c29',
      front: 'What is Amazon SageMaker JumpStart?',
      back: 'AWS service providing pre-trained models, algorithms, and solution templates for quick ML/AI deployment.\n\nFeatures:\n• 100+ pre-built models\n• One-click deployment\n• Foundation models access\n• Fine-tuning capabilities\n• Custom training options\n\nReduces time from idea to production',
      hint: 'Quick-start ML model hub',
      tags: ['aws-services', 'sagemaker', 'jumpstart'],
      difficulty: 'intermediate',
      taskStatement: '2.3'
    },
    {
      id: 'd2c30',
      front: 'What is PartyRock (an Amazon Bedrock Playground)?',
      back: 'A hands-on, code-free playground for learning and experimenting with generative AI.\n\nFeatures:\n• Build AI apps without coding\n• Experiment with prompts\n• Test different models\n• Share creations\n• Educational environment\n\nIdeal for beginners and rapid prototyping',
      hint: 'No-code GenAI playground',
      tags: ['aws-services', 'partyrock', 'playground'],
      difficulty: 'beginner',
      taskStatement: '2.3'
    },
    {
      id: 'd2c31',
      front: 'What is Amazon Q?',
      back: 'AWS generative AI-powered assistant for business and development tasks.\n\nCapabilities:\n• Code generation and debugging (Q Developer)\n• Business intelligence and analytics (Q Business)\n• AWS expert assistance\n• Natural language queries\n• Integration with enterprise data\n• Secure and compliant\n\nPersonalized for your organization',
      hint: 'AWS AI assistant for work',
      tags: ['aws-services', 'amazon-q', 'ai-assistant'],
      difficulty: 'intermediate',
      taskStatement: '2.3'
    },
    {
      id: 'd2c32',
      front: 'What are the advantages of using AWS generative AI services?',
      back: '• Accessibility - easy to use, minimal setup\n• Lower Barrier to Entry - no ML expertise required\n• Efficiency - faster development cycles\n• Cost-Effectiveness - pay-per-use pricing\n• Speed to Market - quick deployment\n• Ability to Meet Business Objectives - purpose-built tools\n• Scalability - handles growth automatically\n• Integration - works with existing AWS services',
      hint: 'Easy, fast, cost-effective, scalable',
      tags: ['aws-benefits', 'advantages'],
      difficulty: 'beginner',
      taskStatement: '2.3'
    },
    {
      id: 'd2c33',
      front: 'What are the security benefits of AWS infrastructure for generative AI?',
      back: '• Security - encryption, IAM, VPC isolation\n• Compliance - meets industry standards (SOC, ISO, HIPAA)\n• Responsibility - shared responsibility model\n• Safety - content filtering and guardrails\n• Data Protection - private endpoints, no data sharing\n• Audit and Monitoring - CloudTrail, CloudWatch\n• Access Control - fine-grained permissions',
      hint: 'Built-in security and compliance',
      tags: ['security', 'aws-benefits', 'compliance'],
      difficulty: 'intermediate',
      taskStatement: '2.3'
    },
    {
      id: 'd2c34',
      front: 'What are the cost tradeoffs of AWS generative AI services?',
      back: 'Factors affecting cost:\n• Responsiveness - faster = higher cost\n• Availability - high uptime = more expensive\n• Redundancy - multi-region = increased cost\n• Performance - larger models cost more\n• Regional Coverage - global deployment costs\n• Token-based Pricing - per input/output token\n• Provisioned Throughput - reserved capacity premium\n• Custom Models - fine-tuning adds cost',
      hint: 'Speed, scale, and customization drive costs',
      tags: ['cost', 'pricing', 'tradeoffs'],
      difficulty: 'intermediate',
      taskStatement: '2.3'
    },
    {
      id: 'd2c35',
      front: 'What is Token-based Pricing in AWS generative AI services?',
      back: 'Pricing model where you pay based on the number of tokens processed.\n\nComponents:\n• Input tokens (prompt)\n• Output tokens (response)\n• Different rates for different models\n• Volume discounts available\n\nExample: Amazon Bedrock charges per 1,000 input/output tokens\n\nBenefit: Pay only for what you use',
      hint: 'Pay per token processed',
      tags: ['pricing', 'tokens', 'cost-model'],
      difficulty: 'intermediate',
      taskStatement: '2.3'
    }
  ]
};

// Helper functions
export const getAllDecks = () => Object.values({ domain2 });

export const getDeckById = (id) => ({ domain2 })[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values({ domain2 }).forEach(deck => {
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
  Object.values({ domain2 }).forEach(deck => {
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
  Object.values({ domain2 }).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
