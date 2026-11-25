// Domain 2: Fundamentals of Generative AI (24%)
export const domain2Guide = {
  id: 'domain2',
  name: 'Fundamentals of Generative AI',
  icon: '\u2728',
  color: '#a78bfa',
  weight: '24%',
  description: 'Foundation models, transformer architecture, generative AI concepts, Amazon Bedrock, and model training approaches.',
  sections: [
    {
      id: 'd2s1',
      title: 'Foundation Models',
      sources: [
        { title: 'What are Foundation Models? – AWS', url: 'https://aws.amazon.com/what-is/foundation-models/', checked: '2026-11-25' },
        { title: 'What are Transformers? – AWS', url: 'https://aws.amazon.com/what-is/transformers-in-artificial-intelligence/', checked: '2026-11-25' },
        { title: 'What is LLM? – AWS', url: 'https://aws.amazon.com/what-is/large-language-model/', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Foundation models are large AI models trained on massive, diverse datasets that can be adapted to a wide variety of downstream tasks. Unlike traditional ML models built for a single purpose, foundation models learn general-purpose representations that transfer across domains.' },
        { type: 'keyTerm', term: 'Foundation Model (FM)', definition: 'A large AI model pre-trained on broad data at scale, designed to be adapted (fine-tuned or prompted) for a wide range of tasks. Examples include GPT, Claude, Llama, Stable Diffusion, and Amazon Nova.' },
        { type: 'keyTerm', term: 'Transformer Architecture', definition: 'The neural network architecture behind most modern foundation models. Introduced in the 2017 paper "Attention Is All You Need." Transformers use self-attention mechanisms to process entire sequences in parallel, making them highly efficient for language and other sequential tasks.' },
        { type: 'keyTerm', term: 'Self-Attention Mechanism', definition: 'The core innovation of transformers. Self-attention allows each element in a sequence to attend to (consider the relevance of) every other element. This captures long-range dependencies far better than RNNs, which process tokens sequentially.' },
        { type: 'keyTerm', term: 'Large Language Model (LLM)', definition: 'A type of foundation model specifically trained on text data to understand and generate human language. LLMs are trained to predict the next token in a sequence, which gives them broad language understanding and generation capabilities.' },
        { type: 'bulletList', title: 'Key properties of foundation models:', items: [
          'Pre-trained on massive datasets (billions of tokens or images)',
          'Transfer learning — knowledge transfers to new tasks',
          'Emergent capabilities — abilities that appear at scale (reasoning, in-context learning)',
          'Multi-task capable — one model handles many different tasks',
          'Adaptable via prompting, fine-tuning, or RAG'
        ]},
        { type: 'examTip', text: 'Foundation models are general-purpose, pre-trained on diverse data, and adaptable to many tasks. This distinguishes them from traditional ML models that are trained from scratch for a single task.' }
      ]
    },
    {
      id: 'd2s2',
      title: 'Tokens, Embeddings, and Context Windows',
      sources: [
        { title: 'Key terminology – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/key-definitions.html', checked: '2026-11-25' },
        { title: 'Monitor your token usage by counting tokens before running inference – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/count-tokens.html', checked: '2026-11-25' },
        { title: 'How content chunking works for knowledge bases – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Understanding how LLMs process text is fundamental. Text is broken into tokens, converted to embeddings, and processed within a fixed context window. These concepts affect both model capabilities and pricing.' },
        { type: 'keyTerm', term: 'Token', definition: 'A sequence of characters treated as a single unit of meaning by the model. Tokens can be whole words, subwords, or individual characters. For example, "unhappiness" might be tokenized as ["un", "happiness"]. Each model has its own tokenizer, so the same text can count as a different number of tokens on different models; to know the real count, ask the model (for example, with the Amazon Bedrock CountTokens API) instead of using a rule of thumb.' },
        { type: 'keyTerm', term: 'Embedding', definition: 'A numerical vector representation of a token or piece of content. Embeddings capture semantic meaning — similar concepts have embeddings that are close together in vector space. They are how models internally represent and compare meaning.' },
        { type: 'keyTerm', term: 'Context Window', definition: 'The maximum number of tokens a model can process in a single request (input + output combined). Larger context windows allow the model to consider more information at once. Context window sizes vary widely by model, from a few thousand tokens to hundreds of thousands or more.' },
        { type: 'keyTerm', term: 'Chunking', definition: 'The process of splitting large documents into smaller pieces that fit within a model\'s context window. Used in RAG pipelines to index and retrieve relevant portions of documents.' },
        { type: 'table', headers: ['Concept', 'What It Is', 'Why It Matters'], rows: [
          ['Token', 'Basic unit of text for the model', 'Determines pricing (cost per token) and context limits'],
          ['Embedding', 'Vector representation of meaning', 'Enables semantic search and similarity comparison'],
          ['Context Window', 'Max tokens per request', 'Limits how much info the model can use at once'],
          ['Chunking', 'Splitting docs into smaller pieces', 'Required for processing docs larger than context window']
        ]},
        { type: 'examTip', text: 'Token count affects both cost and context limits. Pricing for Bedrock and other LLM services is typically based on input tokens + output tokens. Know that tokens are not always whole words.' }
      ]
    },
    {
      id: 'd2s3',
      title: 'Model Training Approaches',
      sources: [
        { title: 'Customize your model to improve its performance for your use case – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/custom-models.html', checked: '2026-11-25' },
        { title: 'Amazon Bedrock FAQs – AWS', url: 'https://aws.amazon.com/bedrock/faqs/', checked: '2026-11-25' },
        { title: 'What is RLHF? – AWS', url: 'https://aws.amazon.com/what-is/reinforcement-learning-from-human-feedback/', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Foundation models can be customized through several approaches, each with different tradeoffs in cost, complexity, data requirements, and effectiveness. Understanding this spectrum is critical for the exam.' },
        { type: 'keyTerm', term: 'Pre-training', definition: 'The initial training of a foundation model on massive datasets. This is extremely expensive (millions of dollars) and typically done by model providers like Anthropic, Meta, or Amazon. It creates the base knowledge and capabilities of the model.' },
        { type: 'keyTerm', term: 'Fine-tuning', definition: 'Adjusting a pre-trained model\'s parameters using labeled, task-specific data (input-output pairs). Fine-tuning specializes the model for a particular domain or task. Less expensive than pre-training but requires curated labeled data.' },
        { type: 'keyTerm', term: 'Continued Pre-training', definition: 'Further training a model on unlabeled, domain-specific data to teach it new knowledge. Unlike fine-tuning, it does not require labeled pairs — just raw text. Used when you want the model to understand proprietary or domain-specific terminology.' },
        { type: 'keyTerm', term: 'RLHF (Reinforcement Learning from Human Feedback)', definition: 'A training technique where human evaluators rank model outputs by quality. A reward model is trained on these rankings, then used to fine-tune the LLM via reinforcement learning. RLHF aligns models with human preferences for helpfulness, harmlessness, and honesty.' },
        { type: 'keyTerm', term: 'PEFT / LoRA', definition: 'Parameter-Efficient Fine-Tuning techniques that update only a small subset of model parameters instead of the entire model. LoRA (Low-Rank Adaptation) adds small trainable matrices to existing layers. This dramatically reduces training cost and memory while achieving comparable results to full fine-tuning.' },
        { type: 'comparison', title: 'Customization Approaches (Least to Most Complex)', items: [
          { label: 'Prompt Engineering', description: 'No training. Craft effective prompts to guide model behavior. Zero cost, instant. Best starting point.' },
          { label: 'RAG', description: 'No training. Augment prompts with retrieved external data. Moderate setup. Great for adding current/proprietary knowledge.' },
          { label: 'Fine-tuning', description: 'Requires labeled data pairs. Adjusts model parameters. Higher cost, hours to days. Best for consistent style/format changes.' },
          { label: 'Continued Pre-training', description: 'Uses unlabeled domain data. Teaches new knowledge to the model. Highest cost. Best for domain-specific terminology.' }
        ]},
        { type: 'examTip', text: 'Critical distinction: Fine-tuning uses LABELED data (input-output pairs). Continued pre-training uses UNLABELED data (raw text). RLHF uses human preference rankings. Know which approach to recommend based on data availability and goals.' }
      ]
    },
    {
      id: 'd2s4',
      title: 'Amazon Bedrock Key Concepts',
      sources: [
        { title: 'Overview – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html', checked: '2026-11-25' },
        { title: 'Key terminology – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/key-definitions.html', checked: '2026-11-25' },
        { title: 'Increase model invocation capacity with Provisioned Throughput in Amazon Bedrock – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Amazon Bedrock is the primary AWS service for accessing and using foundation models. It provides a fully managed, serverless experience — you do not need to manage infrastructure, and your data is not used to train the base models.' },
        { type: 'awsService', name: 'Amazon Bedrock', description: 'A fully managed service for building generative AI applications. Provides API access to more than 100 foundation models from leading providers such as Amazon (Nova), Anthropic (Claude), DeepSeek, OpenAI, and others. Includes features for model customization, RAG, agents, guardrails, and evaluation.' },
        { type: 'keyTerm', term: 'Base Model', definition: 'A provider-packaged foundation model that is ready to use in Bedrock without any customization. You interact with base models through the Bedrock API or console playground.' },
        { type: 'keyTerm', term: 'Model Inference', definition: 'The process of sending a prompt to a model and receiving a generated response. This is the core interaction — input goes in, output comes out.' },
        { type: 'keyTerm', term: 'Inference Parameters', definition: 'User-adjustable settings that control response generation. These include temperature, top-p, top-k, max tokens, and stop sequences. They do not change the model — they control how the model generates each response.' },
        { type: 'keyTerm', term: 'Model Parameters', definition: 'The internal weights and biases of the model that define its behavior. These are learned during training and can only be changed through fine-tuning or continued pre-training.' },
        { type: 'keyTerm', term: 'Hyperparameters', definition: 'Settings that control the training/customization process itself (not the model\'s inference). Examples: learning rate, batch size, number of epochs. These are set before training begins.' },
        { type: 'keyTerm', term: 'Provisioned Throughput', definition: 'A purchased level of throughput for a Bedrock model that guarantees a specific rate of token processing. Used for production workloads that need consistent performance, billed per hour per model unit. Generally required to run custom models (some customized Amazon Nova models can also use on-demand pricing).' },
        { type: 'keyTerm', term: 'Playground', definition: 'A GUI in the AWS Console for experimenting with model inference without writing code. You can test different models, prompts, and inference parameters interactively.' },
        { type: 'examTip', text: 'Know the three types of parameters: Model parameters (internal weights, changed by training), Inference parameters (control generation, set per request), and Hyperparameters (control the training process). The exam tests this distinction.' }
      ]
    },
    {
      id: 'd2s5',
      title: 'SageMaker JumpStart vs. Amazon Bedrock',
      sources: [
        { title: 'Amazon SageMaker JumpStart Foundation Models – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/jumpstart-foundation-models.html', checked: '2026-11-25' },
        { title: 'SageMaker JumpStart pretrained models – Amazon SageMaker AI', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jumpstart.html', checked: '2026-11-25' },
        { title: 'Amazon Bedrock Pricing – AWS', url: 'https://aws.amazon.com/bedrock/pricing/', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'AWS offers two main services for accessing foundation models: Amazon Bedrock and SageMaker JumpStart. Understanding the differences is important for choosing the right approach.' },
        { type: 'comparison', title: 'Bedrock vs. JumpStart', items: [
          { label: 'Amazon Bedrock', description: 'Fully managed, serverless. No infrastructure to manage. Access models via API. Pay per token. Best for: applications that need quick API access to FMs without infrastructure concerns.' },
          { label: 'SageMaker JumpStart', description: 'Deploy models to SageMaker endpoints. You manage the instance type and scaling. Access both open-source and proprietary models. Best for: ML teams who need full control over the deployment environment and want to fine-tune open-source models.' }
        ]},
        { type: 'awsService', name: 'SageMaker JumpStart', description: 'A feature of SageMaker AI that provides a catalog of pre-trained foundation models, both publicly available and proprietary (for example Llama, BLOOM, FLAN-T5, GPT-J). Models are deployed to SageMaker endpoints. Accessible through SageMaker Studio (GUI) or the SageMaker Python SDK.' },
        { type: 'table', headers: ['Feature', 'Amazon Bedrock', 'SageMaker JumpStart'], rows: [
          ['Infrastructure', 'Fully managed/serverless', 'You manage endpoints'],
          ['Pricing', 'Per token (on-demand or batch), or per hour with Provisioned Throughput', 'Per endpoint instance hour'],
          ['Model Access', 'Curated set via API', 'Broad catalog of publicly available + proprietary models'],
          ['Customization', 'Supervised fine-tuning, reinforcement fine-tuning, distillation', 'Full fine-tuning with your own training jobs'],
          ['Best For', 'App developers, quick prototyping', 'ML engineers, custom deployments']
        ]},
        { type: 'examTip', text: 'Bedrock = serverless, pay-per-token, no infrastructure. JumpStart = you deploy to endpoints, you control infrastructure. If the question emphasizes "no infrastructure management" or "serverless," the answer is Bedrock.' }
      ]
    },
    {
      id: 'd2s6',
      title: 'Diffusion Models and Multimodal AI',
      sources: [
        { title: 'What is Generative AI? – AWS', url: 'https://aws.amazon.com/what-is/generative-ai/', checked: '2026-11-25' },
        { title: 'Use contextual grounding check to filter hallucinations in responses – Amazon Bedrock', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html', checked: '2026-11-25' },
        { title: 'What is Amazon Q Developer? – Amazon Q Developer', url: 'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html', checked: '2026-11-25' }
      ],
      content: [
        { type: 'paragraph', text: 'Generative AI is not limited to text. Diffusion models generate images, and multimodal models can process and generate across multiple data types (text, images, audio, video).' },
        { type: 'keyTerm', term: 'Diffusion Model', definition: 'A generative model that creates images by gradually removing noise from a random starting point. During training, the model learns to reverse a process that progressively adds noise to images. At inference time, it starts with pure noise and iteratively denoises it into a coherent image. Examples: Stable Diffusion, DALL-E.' },
        { type: 'keyTerm', term: 'Multimodal Model', definition: 'A model that can process and/or generate multiple types of data — text, images, audio, or video. For example, a multimodal model can take an image as input and generate a text description, or take text and generate an image.' },
        { type: 'keyTerm', term: 'Hallucination', definition: 'When a generative AI model produces output that sounds plausible but is factually incorrect, fabricated, or inconsistent with the input. Hallucinations are a fundamental challenge because LLMs generate text based on statistical patterns, not factual verification.' },
        { type: 'bulletList', title: 'Strategies to mitigate hallucination:', items: [
          'RAG — Ground responses in retrieved factual data',
          'Temperature reduction — Lower randomness for more deterministic outputs',
          'Guardrails — Filter or validate outputs against known facts',
          'Human-in-the-loop — Have humans review critical outputs',
          'Prompt engineering — Be specific and provide context to constrain the model'
        ]},
        { type: 'awsService', name: 'Amazon Q Developer', description: 'An AI-powered assistant for software development. Provides code suggestions, answers questions about code, generates code from natural language descriptions, and helps with debugging and optimization. Works in IDEs and on the command line (AWS ends support for the Q Developer IDE plugins on April 30, 2027 and points to Kiro). In the AWS Management Console, the Q Developer chat is now called the AWS assistant.' },
        { type: 'examTip', text: 'Know what hallucination is and how to mitigate it. RAG is the most commonly recommended approach for grounding responses in factual data. The exam frequently asks about hallucination prevention strategies.' }
      ]
    }
  ]
};
