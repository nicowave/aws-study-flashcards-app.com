// Flashcard data organized by module/topic
// Each card has front (question/term) and back (answer/definition)
// Cards can include optional hints, tags, and difficulty levels

export const domain3 = {
  id: 'domain3',
  name: 'Applications of Foundation Models',
  description: 'Foundation model design, prompt engineering, training techniques, and evaluation',
  icon: '🏗️',
  color: '#E67E22',
  gradient: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
  source: 'AWS Certified AI Practitioner Exam Guide - Domain 3',
  examWeight: '28%',
  cards: [
    // Task Statement 3.1: Design considerations for FM applications
    {
      id: 'd3c1',
      front: 'What are key design considerations when selecting a foundation model for an application?',
      back: 'Selection factors:\n\n• Task Type - text generation, summarization, code, image, multi-modal\n• Model Size - larger models are more capable but costlier\n• Latency Requirements - real-time vs. batch processing\n• Cost - per-token pricing varies significantly across models\n• Accuracy Needs - domain-specific vs. general performance\n• Context Window - how much input the model can process\n• Customization - fine-tuning support, RAG compatibility\n• Compliance - data residency, industry regulations\n\nAWS: Amazon Bedrock lets you test multiple FMs before committing',
      hint: 'Task, size, cost, latency, accuracy, compliance',
      tags: ['model-selection', 'design-considerations', 'foundation-models'],
      difficulty: 'beginner',
      taskStatement: '3.1'
    },
    {
      id: 'd3c2',
      front: 'What are the tradeoffs between model size and performance?',
      back: 'Larger models:\n• More parameters = more knowledge and capability\n• Better at complex reasoning and nuanced tasks\n• Higher inference cost and latency\n• Require more compute resources\n\nSmaller models:\n• Faster inference and lower latency\n• Lower cost per request\n• May struggle with complex tasks\n• Easier to deploy at edge or on-device\n\nBest practice: Start with the smallest model that meets your requirements, then scale up only if needed.\n\nAlternative: Use model distillation to get large-model quality at smaller-model cost.',
      hint: 'Bigger = smarter but slower and costlier',
      tags: ['model-selection', 'model-size', 'tradeoffs'],
      difficulty: 'beginner',
      taskStatement: '3.1'
    },
    {
      id: 'd3c3',
      front: 'What is the temperature parameter in foundation model inference?',
      back: 'Temperature controls the randomness/creativity of model outputs.\n\n• Low temperature (e.g., 0.1) - More deterministic, focused, and consistent responses. Best for factual/analytical tasks.\n• High temperature (e.g., 0.9) - More random, creative, and diverse responses. Best for creative writing and brainstorming.\n• Temperature 0 - Nearly deterministic (greedy decoding)\n• Temperature 1 - Standard sampling\n\nKey: Temperature does NOT affect model knowledge, only output distribution.',
      hint: 'Controls randomness of output',
      tags: ['inference-parameters', 'temperature', 'model-configuration'],
      difficulty: 'beginner',
      taskStatement: '3.1'
    },
    {
      id: 'd3c4',
      front: 'How do input/output length limits affect FM application design?',
      back: 'Context window and token limits impact design:\n\n• Input length (context window) - Maximum tokens the model can process at once. Affects how much context you can provide.\n• Output length (max tokens) - Maximum tokens the model can generate in a response.\n\nDesign implications:\n• Long documents may need chunking strategies\n• Summarization tasks need sufficient output length\n• RAG helps overcome context window limits\n• Larger context windows cost more per request\n• Prompt caching can reduce costs for repeated prefixes',
      hint: 'Token limits shape your architecture',
      tags: ['inference-parameters', 'context-window', 'token-limits'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c5',
      front: 'What is Retrieval Augmented Generation (RAG)?',
      back: 'RAG is a technique that enhances FM responses by retrieving relevant information from external knowledge sources before generating answers.\n\nHow it works:\n1. User sends a query\n2. System retrieves relevant documents from a knowledge base\n3. Retrieved context is added to the prompt\n4. FM generates a response grounded in retrieved data\n\nBenefits:\n• Reduces hallucinations\n• Provides up-to-date information\n• No model retraining needed\n• Cites sources for transparency',
      hint: 'Retrieve first, then generate',
      tags: ['rag', 'retrieval-augmented-generation', 'design-pattern'],
      difficulty: 'beginner',
      taskStatement: '3.1'
    },
    {
      id: 'd3c6',
      front: 'What are the business applications of RAG?',
      back: 'RAG enables powerful enterprise use cases:\n\n• Customer support - Answer questions from product docs and FAQs\n• Legal research - Search case law and contracts\n• Healthcare - Query medical literature for clinical decisions\n• Internal knowledge bases - Search company wikis and policies\n• Financial analysis - Query reports and filings\n• Technical documentation - Search codebases and API docs\n\nKey advantage: Keeps responses grounded in your organization\'s actual data without retraining the model.',
      hint: 'Enterprise knowledge at scale',
      tags: ['rag', 'business-applications', 'use-cases'],
      difficulty: 'beginner',
      taskStatement: '3.1'
    },
    {
      id: 'd3c7',
      front: 'What is Amazon Bedrock Knowledge Bases?',
      back: 'A fully managed RAG service in Amazon Bedrock that connects FMs to your data sources.\n\nFeatures:\n• Automatic data ingestion and chunking\n• Vector embedding generation\n• Managed vector store integration\n• Automatic retrieval and context injection\n• Source citations in responses\n\nSupported sources:\n• Amazon S3 documents\n• Web crawlers\n• Confluence, SharePoint, Salesforce\n\nBenefit: Build RAG applications without managing infrastructure.',
      hint: 'Managed RAG on Bedrock',
      tags: ['amazon-bedrock', 'knowledge-bases', 'rag', 'aws-service'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c8',
      front: 'What is a vector database and why is it important for RAG?',
      back: 'A vector database stores data as high-dimensional numerical vectors (embeddings) and enables fast similarity search.\n\nWhy it matters for RAG:\n• Converts text/images into embeddings\n• Finds semantically similar content quickly\n• Powers the "retrieval" step in RAG\n• Enables nearest-neighbor search at scale\n\nAWS vector database options:\n• Amazon OpenSearch Service\n• Amazon Aurora (pgvector)\n• Amazon Neptune (graph + vector)\n• Amazon RDS for PostgreSQL (pgvector)',
      hint: 'Stores and searches embeddings',
      tags: ['vector-database', 'embeddings', 'rag'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c9',
      front: 'Which AWS services support vector database capabilities for RAG?',
      back: 'AWS vector database services:\n\n• Amazon OpenSearch Service - Full-text and vector search, k-NN plugin, scalable, commonly used with Bedrock\n• Amazon Aurora PostgreSQL - pgvector extension, familiar SQL interface, transactional workloads\n• Amazon Neptune - Graph database with vector search, relationship-rich data\n• Amazon RDS for PostgreSQL - pgvector extension, cost-effective for smaller workloads\n\nChoose based on:\n• Existing infrastructure\n• Scale requirements\n• Query patterns (SQL vs. graph vs. search)',
      hint: 'OpenSearch, Aurora, Neptune, RDS',
      tags: ['vector-database', 'aws-service', 'opensearch', 'aurora', 'neptune'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c10',
      front: 'What are the cost tradeoffs between FM customization approaches?',
      back: 'From least to most expensive:\n\n1. Prompt engineering / In-context learning\n   • No training cost, only inference\n   • Quick to implement\n\n2. RAG (Retrieval Augmented Generation)\n   • Vector DB hosting + embedding costs\n   • No model training required\n\n3. Fine-tuning\n   • Moderate training compute\n   • Smaller labeled dataset needed\n   • Creates custom model variant\n\n4. Continued pre-training\n   • Large unlabeled domain data\n   • Significant compute cost\n\n5. Pre-training from scratch\n   • Most expensive (millions of dollars)\n   • Massive data and compute',
      hint: 'Prompt engineering is cheapest, pre-training is costliest',
      tags: ['cost-tradeoffs', 'customization', 'fine-tuning', 'rag'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c11',
      front: 'What are Amazon Bedrock Agents?',
      back: 'Amazon Bedrock Agents enable FMs to execute multi-step tasks by orchestrating API calls and actions.\n\nCapabilities:\n• Break complex tasks into steps\n• Call external APIs and Lambda functions\n• Query knowledge bases for context\n• Maintain conversation state\n• Chain reasoning across steps\n\nComponents:\n• Instructions - Define agent behavior\n• Action groups - APIs the agent can call\n• Knowledge bases - Data sources for RAG\n\nUse case: Automate workflows like booking travel, processing orders, or managing IT tickets.',
      hint: 'FMs that take actions via APIs',
      tags: ['amazon-bedrock', 'agents', 'agentic-ai', 'aws-service'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    {
      id: 'd3c12',
      front: 'What is agentic AI and model context protocol (MCP)?',
      back: 'Agentic AI: AI systems that autonomously plan, reason, and take actions to achieve goals across multiple steps.\n\nCharacteristics:\n• Goal-oriented reasoning\n• Tool use and API calling\n• Multi-step planning\n• Self-correction and iteration\n• Memory across interactions\n\nModel Context Protocol (MCP):\n• An open standard for connecting AI models to external tools and data sources\n• Provides a universal interface for tool integration\n• Enables agents to discover and use tools dynamically\n• Reduces custom integration effort',
      hint: 'Autonomous AI with tool access',
      tags: ['agentic-ai', 'model-context-protocol', 'agents'],
      difficulty: 'intermediate',
      taskStatement: '3.1'
    },
    // Task Statement 3.2: Prompt engineering techniques
    {
      id: 'd3c13',
      front: 'What are the key components of a well-structured prompt?',
      back: 'A well-structured prompt includes:\n\n• Context - Background information and role setting (e.g., "You are a medical expert")\n• Instruction - Clear task description (e.g., "Summarize the following article")\n• Input data - The content to process\n• Output format - Desired structure (e.g., "Respond in bullet points")\n\nOptional elements:\n• Examples (for few-shot)\n• Constraints (length, tone, style)\n• Negative prompts (what to avoid)',
      hint: 'Context, instruction, input, output format',
      tags: ['prompt-engineering', 'prompt-structure', 'basics'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c14',
      front: 'What are negative prompts?',
      back: 'Instructions that tell the model what NOT to include or do in its response.\n\nExamples:\n• "Do not include technical jargon"\n• "Avoid listing more than 5 items"\n• "Do not make up information"\n• In image generation: "no blurry, no watermarks"\n\nBenefits:\n• Reduces unwanted content\n• Improves output precision\n• Especially useful in image generation to exclude undesired elements\n\nBest practice: Combine positive instructions with negative constraints for best results.',
      hint: 'Tell the model what to avoid',
      tags: ['prompt-engineering', 'negative-prompts', 'techniques'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c15',
      front: 'What is model latent space in the context of prompt engineering?',
      back: 'The latent space is the internal, high-dimensional representation of knowledge learned by the model during training.\n\nRelevance to prompting:\n• Prompts activate specific regions of the latent space\n• Better prompts access more relevant knowledge\n• The model can only respond with what exists in its latent space\n• Fine-tuning modifies the latent space\n\nImplication: If the model was not trained on certain knowledge, no prompt can extract it. RAG or fine-tuning is needed to expand what the model knows.',
      hint: 'Internal knowledge representation',
      tags: ['prompt-engineering', 'latent-space', 'model-internals'],
      difficulty: 'intermediate',
      taskStatement: '3.2'
    },
    {
      id: 'd3c16',
      front: 'What is prompt routing?',
      back: 'A technique that directs user prompts to the most appropriate model or processing pipeline based on the request type.\n\nHow it works:\n• Classifies incoming prompts by category, complexity, or domain\n• Routes to specialized models or agents\n• Optimizes cost and performance\n\nExamples:\n• Simple questions → smaller, cheaper model\n• Complex reasoning → larger, more capable model\n• Code tasks → code-specialized model\n\nAWS: Amazon Bedrock supports intelligent routing across multiple FMs.',
      hint: 'Send prompts to the right model',
      tags: ['prompt-engineering', 'prompt-routing', 'optimization'],
      difficulty: 'intermediate',
      taskStatement: '3.2'
    },
    {
      id: 'd3c17',
      front: 'What is zero-shot prompting?',
      back: 'Asking the model to perform a task without providing any examples.\n\nExample:\n"Classify the following review as positive or negative: \'The product broke after one day.\'"\n\nCharacteristics:\n• No examples given\n• Relies entirely on the model\'s pre-trained knowledge\n• Simplest prompting technique\n• Works well for straightforward tasks\n\nBest for: Tasks the model has seen during training and can understand from instructions alone.',
      hint: 'No examples provided',
      tags: ['prompt-engineering', 'zero-shot', 'techniques'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c18',
      front: 'What is single-shot (one-shot) prompting?',
      back: 'Providing exactly one example before asking the model to perform the task.\n\nExample:\nReview: "Great battery life!" → Positive\nReview: "Screen cracked in a week." → ?\n\nCharacteristics:\n• One example demonstrates the expected pattern\n• Helps the model understand format and task\n• More guidance than zero-shot\n• Less token usage than few-shot\n\nBest for: When one example is enough to clarify the task format or expected output style.',
      hint: 'One example provided',
      tags: ['prompt-engineering', 'single-shot', 'techniques'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c19',
      front: 'What is few-shot prompting?',
      back: 'Providing multiple examples (typically 2-5) before asking the model to perform the task.\n\nExample:\nReview: "Amazing quality!" → Positive\nReview: "Terrible experience." → Negative\nReview: "It works okay." → Neutral\nReview: "Waste of money." → ?\n\nBenefits:\n• Establishes clear patterns\n• Improves consistency of outputs\n• Teaches format, style, and reasoning\n• Reduces ambiguity\n\nTradeoff: Uses more tokens (higher cost), but improves accuracy for complex tasks.',
      hint: 'Multiple examples provided',
      tags: ['prompt-engineering', 'few-shot', 'techniques'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c20',
      front: 'What is chain-of-thought (CoT) prompting?',
      back: 'A technique that instructs the model to break down its reasoning into explicit intermediate steps before giving a final answer.\n\nExample: "Think step by step. If a store has 15 apples and sells 3 per hour, how many are left after 4 hours?"\n\nStep 1: 3 apples/hour x 4 hours = 12 sold\nStep 2: 15 - 12 = 3 remaining\n\nBenefits:\n• Improves accuracy on math and logic tasks\n• Makes reasoning transparent and auditable\n• Reduces errors in multi-step problems\n• Can be combined with few-shot examples',
      hint: 'Think step by step',
      tags: ['prompt-engineering', 'chain-of-thought', 'techniques'],
      difficulty: 'intermediate',
      taskStatement: '3.2'
    },
    {
      id: 'd3c21',
      front: 'What are prompt templates and why are they useful?',
      back: 'Prompt templates are reusable, parameterized prompt structures with placeholders for variable content.\n\nExample template:\n"Given the following {document_type}, extract the {fields}. Format the output as {format}."\n\nBenefits:\n• Consistency across requests\n• Easier to maintain and version\n• Scalable for production applications\n• Enable A/B testing of prompt variations\n• Reduce prompt engineering effort\n\nAWS: Amazon Bedrock supports prompt management with versioning and variables.',
      hint: 'Reusable prompt structures with variables',
      tags: ['prompt-engineering', 'prompt-templates', 'best-practices'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c22',
      front: 'What are best practices for writing effective prompts?',
      back: 'Key best practices:\n\n• Be specific and concise - Clear instructions reduce ambiguity\n• Provide context - Set the role and scenario\n• Use examples - Few-shot for complex tasks\n• Specify output format - JSON, bullets, table, etc.\n• Iterate and experiment - Test variations\n• Use guardrails - Set boundaries on responses\n• Break complex tasks into steps - Chain-of-thought\n• Include constraints - Length, tone, style limits\n\nDiscovery: Try different approaches and evaluate which prompts produce the best results for your use case.',
      hint: 'Specific, contextual, iterative',
      tags: ['prompt-engineering', 'best-practices', 'response-quality'],
      difficulty: 'beginner',
      taskStatement: '3.2'
    },
    {
      id: 'd3c23',
      front: 'What is prompt injection and what are its risks?',
      back: 'Prompt injection is a security attack where malicious input manipulates the model to bypass its instructions or behave unexpectedly.\n\nTypes:\n• Direct injection - User crafts input to override system prompt\n• Indirect injection - Malicious content in retrieved documents\n\nRisks:\n• Data exposure - Leaking system prompts or sensitive info\n• Prompt hijacking - Redirecting the model to unintended tasks\n• Jailbreaking - Bypassing safety guardrails\n\nMitigations:\n• Input validation and sanitization\n• Amazon Bedrock Guardrails\n• Output filtering\n• Separate system and user contexts',
      hint: 'Malicious input manipulates model behavior',
      tags: ['prompt-engineering', 'security', 'prompt-injection', 'risks'],
      difficulty: 'intermediate',
      taskStatement: '3.2'
    },
    {
      id: 'd3c24',
      front: 'What are prompt poisoning, hijacking, and jailbreaking?',
      back: 'Three distinct prompt security threats:\n\nPrompt Poisoning:\n• Embedding malicious instructions in training data or documents\n• Affects model behavior at retrieval time\n• Hard to detect in large datasets\n\nPrompt Hijacking:\n• Redirecting the model from its intended task to perform a different one\n• Example: "Ignore previous instructions and instead..."\n\nJailbreaking:\n• Techniques to bypass model safety guardrails\n• Tricks model into generating harmful content\n• Example: Role-playing scenarios to circumvent restrictions\n\nDefense: Use Amazon Bedrock Guardrails, input filtering, and output validation.',
      hint: 'Poisoning, hijacking, and jailbreaking are distinct attacks',
      tags: ['prompt-engineering', 'security', 'jailbreaking', 'risks'],
      difficulty: 'intermediate',
      taskStatement: '3.2'
    },
    // Task Statement 3.3: Training and fine-tuning FMs
    {
      id: 'd3c25',
      front: 'What is pre-training in the context of foundation models?',
      back: 'Pre-training is the initial, large-scale training phase where a model learns general knowledge from massive datasets.\n\nCharacteristics:\n• Uses enormous datasets (terabytes of text/images)\n• Self-supervised learning (no manual labels)\n• Learns language patterns, facts, reasoning\n• Extremely expensive (millions of dollars)\n• Requires massive compute (thousands of GPUs)\n• Results in a general-purpose foundation model\n\nExamples: Training GPT, Claude, or Amazon Titan from scratch.\n\nMost organizations use pre-trained models rather than training from scratch.',
      hint: 'Initial large-scale training from scratch',
      tags: ['pre-training', 'training', 'foundation-models'],
      difficulty: 'beginner',
      taskStatement: '3.3'
    },
    {
      id: 'd3c26',
      front: 'What is fine-tuning a foundation model?',
      back: 'Fine-tuning adapts a pre-trained model to a specific task or domain by training it further on a smaller, labeled dataset.\n\nProcess:\n1. Start with a pre-trained FM\n2. Prepare task-specific labeled data\n3. Train on new data with lower learning rate\n4. Model specializes while retaining general knowledge\n\nBenefits:\n• Much cheaper than pre-training\n• Smaller dataset required\n• Improves performance on specific tasks\n• Retains base model capabilities\n\nAWS: Amazon Bedrock Custom Model Training supports fine-tuning.',
      hint: 'Adapt a pre-trained model to your task',
      tags: ['fine-tuning', 'training', 'customization'],
      difficulty: 'beginner',
      taskStatement: '3.3'
    },
    {
      id: 'd3c27',
      front: 'What is continuous pre-training (domain adaptation pre-training)?',
      back: 'Continuing the pre-training process on domain-specific unlabeled data to expand the model\'s knowledge in a particular area.\n\nDifference from fine-tuning:\n• Uses unlabeled data (not task-specific labels)\n• Teaches the model new domain vocabulary and concepts\n• Broader adaptation than fine-tuning\n\nUse cases:\n• Medical domain - train on clinical literature\n• Legal domain - train on legal documents\n• Finance - train on financial reports\n\nCost: More expensive than fine-tuning but cheaper than pre-training from scratch.\n\nAWS: Supported via Amazon Bedrock continued pre-training.',
      hint: 'Extend pre-training with domain-specific data',
      tags: ['continuous-pre-training', 'domain-adaptation', 'training'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c28',
      front: 'What is model distillation?',
      back: 'A technique where a smaller "student" model is trained to replicate the behavior of a larger "teacher" model.\n\nProcess:\n1. Large teacher model generates outputs\n2. Smaller student model learns to mimic those outputs\n3. Student achieves similar quality at lower cost\n\nBenefits:\n• Smaller, faster model for deployment\n• Lower inference costs\n• Reduced latency\n• Maintains much of the teacher\'s capability\n\nTradeoff: Some accuracy loss compared to the teacher model.\n\nAWS: Amazon Bedrock supports model distillation for creating efficient custom models.',
      hint: 'Train a small model to mimic a large one',
      tags: ['distillation', 'training', 'optimization'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c29',
      front: 'What is instruction tuning?',
      back: 'A fine-tuning method that trains the model on instruction-response pairs to improve its ability to follow directions.\n\nTraining data format:\nInstruction: "Summarize this article in 3 bullet points"\nResponse: [expected summary]\n\nBenefits:\n• Model becomes better at following instructions\n• Improves zero-shot performance\n• More helpful and aligned responses\n• Better format compliance\n\nRelation to RLHF: Often combined with Reinforcement Learning from Human Feedback for further alignment.',
      hint: 'Train model to follow instructions better',
      tags: ['instruction-tuning', 'fine-tuning', 'alignment'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c30',
      front: 'What is transfer learning in the context of foundation models?',
      back: 'Applying knowledge learned from one task or domain to a different but related task or domain.\n\nHow it works with FMs:\n1. Model pre-trained on general data (source task)\n2. Knowledge transfers to specific use case (target task)\n3. Fine-tuning adapts the model with minimal data\n\nBenefits:\n• Reduces training data requirements\n• Faster convergence during fine-tuning\n• Leverages expensive pre-training investment\n• Works even with limited labeled data\n\nFoundation models are built on transfer learning - their general knowledge transfers to specific applications.',
      hint: 'Apply knowledge from one task to another',
      tags: ['transfer-learning', 'training', 'fine-tuning'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c31',
      front: 'What is data curation for fine-tuning foundation models?',
      back: 'The process of selecting, cleaning, and preparing high-quality training data for fine-tuning.\n\nKey steps:\n• Data collection - Gather relevant domain data\n• Data cleaning - Remove noise, duplicates, errors\n• Quality filtering - Ensure accuracy and relevance\n• Deduplication - Remove duplicate entries\n• Format standardization - Consistent structure\n• Toxicity filtering - Remove harmful content\n• PII removal - Protect private information\n\nImpact: Data quality directly determines fine-tuned model quality. "Garbage in, garbage out" applies strongly.',
      hint: 'Clean, relevant, high-quality training data',
      tags: ['data-curation', 'data-preparation', 'fine-tuning'],
      difficulty: 'beginner',
      taskStatement: '3.3'
    },
    {
      id: 'd3c32',
      front: 'Why are data governance and labeling important for FM training?',
      back: 'Data governance ensures training data is managed responsibly:\n\n• Compliance - Meet regulatory requirements (GDPR, HIPAA)\n• Provenance - Track data origins and lineage\n• Access control - Restrict who can use data\n• Licensing - Respect data usage rights\n• Privacy - Protect sensitive information\n\nData labeling importance:\n• Labels define what the model learns\n• Consistent labeling improves model accuracy\n• Label quality > label quantity\n• Human review ensures correctness\n• Clear labeling guidelines reduce errors\n\nPoor governance or labeling leads to biased or unreliable models.',
      hint: 'Responsible data management and accurate labels',
      tags: ['data-governance', 'data-labeling', 'compliance'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c33',
      front: 'How does dataset size and representativeness affect fine-tuning?',
      back: 'Dataset size considerations:\n• More data generally improves performance\n• Diminishing returns beyond a certain point\n• Quality matters more than quantity\n• Minimum viable dataset varies by task\n• Typically hundreds to thousands of examples for fine-tuning\n\nRepresentativeness:\n• Data should reflect real-world distribution\n• Cover edge cases and minority classes\n• Balanced across categories and demographics\n• Avoid over-representation of any group\n\nRisks of poor representativeness:\n• Biased model outputs\n• Poor performance on underrepresented cases\n• Unfair treatment of certain groups',
      hint: 'Quality, quantity, and balance all matter',
      tags: ['dataset-size', 'representativeness', 'data-preparation'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c34',
      front: 'What is Reinforcement Learning from Human Feedback (RLHF)?',
      back: 'A training technique that uses human preferences to align model outputs with human values and expectations.\n\nProcess:\n1. Generate multiple model responses\n2. Human evaluators rank/rate the responses\n3. Train a reward model on human preferences\n4. Use reinforcement learning to optimize the FM against the reward model\n\nBenefits:\n• Aligns model with human values\n• Reduces harmful outputs\n• Improves helpfulness and honesty\n• More nuanced than rule-based filtering\n\nUsed by: Most leading FMs (Claude, GPT, etc.) use RLHF for alignment.',
      hint: 'Humans teach the model what good looks like',
      tags: ['rlhf', 'alignment', 'training', 'human-feedback'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    {
      id: 'd3c35',
      front: 'What is the difference between in-context learning and fine-tuning?',
      back: 'In-context learning (prompt-based):\n• Provide examples directly in the prompt\n• No model weights are changed\n• Temporary - only affects current request\n• Zero cost for training\n• Limited by context window size\n• Quick to implement and iterate\n\nFine-tuning (weight-based):\n• Train on labeled dataset to update model weights\n• Permanent changes to model behavior\n• Requires training compute and data\n• Not limited by context window\n• Better for complex, specialized tasks\n• Longer setup time\n\nChoose in-context learning first; fine-tune only if it is insufficient.',
      hint: 'Prompt examples vs. updating model weights',
      tags: ['in-context-learning', 'fine-tuning', 'comparison'],
      difficulty: 'intermediate',
      taskStatement: '3.3'
    },
    // Task Statement 3.4: Foundation model evaluation metrics
    {
      id: 'd3c36',
      front: 'What is BLEU (Bilingual Evaluation Understudy)?',
      back: 'A metric for evaluating machine translation quality by comparing generated translations to reference translations.\n\nMeasures:\n• Precision of n-grams (1-4 grams)\n• Brevity penalty for short outputs\n• Score: 0-100 (higher is better)\n\nLimitations:\n• Doesn\'t capture meaning perfectly\n• Multiple correct translations possible\n\nUse case: Translation tasks',
      hint: 'Translation quality metric',
      tags: ['metrics', 'bleu', 'translation'],
      difficulty: 'intermediate',
      taskStatement: '3.4'
    },
    {
      id: 'd3c37',
      front: 'What is BERTScore?',
      back: 'A semantic similarity metric that uses contextual embeddings from BERT to evaluate text generation.\n\nAdvantages over ROUGE/BLEU:\n• Captures semantic meaning, not just word overlap\n• Handles paraphrasing better\n• More aligned with human judgment\n\nMeasures:\n• Precision, Recall, F1 of embeddings\n• Context-aware matching\n\nUse case: Any text generation task',
      hint: 'Semantic similarity using embeddings',
      tags: ['metrics', 'bertscore', 'evaluation'],
      difficulty: 'intermediate',
      taskStatement: '3.4'
    },
    {
      id: 'd3c38',
      front: 'How do you determine if a foundation model meets business objectives?',
      back: 'Key indicators:\n\n• Productivity - time saved, tasks completed\n• User Engagement - adoption rate, satisfaction\n• Task Engineering - successful completion rate\n• Cost Efficiency - ROI, reduced expenses\n• Quality Metrics - accuracy, error rates\n• Business KPIs - revenue, conversion, retention\n• User Feedback - surveys, ratings\n• Operational Metrics - uptime, latency',
      hint: 'Measure business impact, not just accuracy',
      tags: ['business-objectives', 'evaluation', 'metrics'],
      difficulty: 'intermediate',
      taskStatement: '3.4'
    },
    {
      id: 'd3c39',
      front: 'What is Human Evaluation for foundation models?',
      back: 'Expert reviewers manually assess model outputs on criteria like:\n\n• Accuracy and factual correctness\n• Relevance to the task\n• Coherence and fluency\n• Safety and appropriateness\n• Creativity (for creative tasks)\n• Helpfulness\n\nBenefits: Captures nuance, quality\nDrawbacks: Expensive, slow, subjective\n\nCritical for safety-critical applications',
      hint: 'Manual expert assessment',
      tags: ['evaluation', 'human-evaluation', 'quality'],
      difficulty: 'beginner',
      taskStatement: '3.4'
    },
    {
      id: 'd3c40',
      front: 'What are Benchmark Datasets in foundation model evaluation?',
      back: 'Standardized test datasets used to compare model performance:\n\nExamples:\n• MMLU (Massive Multitask Language Understanding)\n• HellaSwag (Common sense reasoning)\n• TruthfulQA (Factual accuracy)\n• HumanEval (Code generation)\n• LAMBADA (Text prediction)\n\nBenefits:\n• Consistent comparison\n• Reproducible results\n• Industry standards\n• Automated testing',
      hint: 'Standardized test sets',
      tags: ['benchmarks', 'evaluation', 'testing'],
      difficulty: 'intermediate',
      taskStatement: '3.4'
    }
  ]
};

// Helper functions
export const getAllDecks = () => Object.values({ domain3 });

export const getDeckById = (id) => ({ domain3 })[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values({ domain3 }).forEach(deck => {
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
  Object.values({ domain3 }).forEach(deck => {
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
  Object.values({ domain3 }).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
