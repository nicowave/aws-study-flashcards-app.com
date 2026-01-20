// AWS Certification data
// Status: 'available' | 'coming-soon'

export const certifications = [
  // Foundational
  {
    id: 'cloud-practitioner',
    name: 'AWS Certified Cloud Practitioner',
    code: 'CLF-C02',
    level: 'Foundational',
    category: 'foundational',
    description: 'Validate your overall understanding of AWS Cloud fundamentals, including core services, security, architecture, pricing, and support.',
    subdomain: 'cloud',
    url: 'https://cloud.aws-study-flashcards-app.com',
    status: 'available',
    icon: '☁️',
    color: '#3fb950',
    examLength: '90 minutes',
    questions: '65 questions',
    passingScore: '700/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'ai-practitioner',
    name: 'AWS Certified AI Practitioner',
    code: 'AIF-C01',
    level: 'Foundational',
    category: 'foundational',
    description: 'Demonstrate foundational knowledge of AI/ML concepts, generative AI, and AWS AI services including Amazon Bedrock, SageMaker, and more.',
    subdomain: 'ai',
    url: 'https://ai.aws-study-flashcards-app.com',
    status: 'available',
    icon: '🤖',
    color: '#58a6ff',
    examLength: '90 minutes',
    questions: '65 questions',
    passingScore: '700/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-ai-practitioner/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  
  // Associate
  {
    id: 'solutions-architect-associate',
    name: 'AWS Certified Solutions Architect – Associate',
    code: 'SAA-C03',
    level: 'Associate',
    category: 'associate',
    description: 'Validate your ability to design distributed systems on AWS, covering compute, networking, storage, and database services.',
    subdomain: 'solutions-architect',
    url: 'https://solutions-architect.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🏗️',
    color: '#d29922',
    examLength: '130 minutes',
    questions: '65 questions',
    passingScore: '720/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'developer-associate',
    name: 'AWS Certified Developer – Associate',
    code: 'DVA-C02',
    level: 'Associate',
    category: 'associate',
    description: 'Prove your proficiency in developing, deploying, and debugging cloud-based applications using AWS services.',
    subdomain: 'developer',
    url: 'https://developer.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '👨‍💻',
    color: '#a371f7',
    examLength: '130 minutes',
    questions: '65 questions',
    passingScore: '720/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-developer-associate/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'sysops-administrator',
    name: 'AWS Certified SysOps Administrator – Associate',
    code: 'SOA-C02',
    level: 'Associate',
    category: 'associate',
    description: 'Demonstrate your skills in deploying, managing, and operating workloads on AWS.',
    subdomain: 'sysops',
    url: 'https://sysops.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '⚙️',
    color: '#f78166',
    examLength: '180 minutes',
    questions: '65 questions',
    passingScore: '720/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-sysops-admin-associate/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'data-engineer-associate',
    name: 'AWS Certified Data Engineer – Associate',
    code: 'DEA-C01',
    level: 'Associate',
    category: 'associate',
    description: 'Validate your ability to design and implement data pipelines, data stores, and data processing solutions.',
    subdomain: 'data-engineer',
    url: 'https://data-engineer.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '📊',
    color: '#56d4dd',
    examLength: '170 minutes',
    questions: '65 questions',
    passingScore: '720/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-data-engineer-associate/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'machine-learning-engineer-associate',
    name: 'AWS Certified Machine Learning Engineer – Associate',
    code: 'MLA-C01',
    level: 'Associate',
    category: 'associate',
    description: 'Prove your skills in building, training, tuning, and deploying ML models using AWS services.',
    subdomain: 'ml-engineer',
    url: 'https://ml-engineer.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🧠',
    color: '#e85aad',
    examLength: '170 minutes',
    questions: '65 questions',
    passingScore: '720/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  
  // Professional
  {
    id: 'solutions-architect-professional',
    name: 'AWS Certified Solutions Architect – Professional',
    code: 'SAP-C02',
    level: 'Professional',
    category: 'professional',
    description: 'Validate advanced skills in designing distributed applications and systems on AWS for complex requirements.',
    subdomain: 'solutions-architect-professional',
    url: 'https://solutions-architect-professional.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🏛️',
    color: '#ff9900',
    examLength: '180 minutes',
    questions: '75 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'devops-engineer-professional',
    name: 'AWS Certified DevOps Engineer – Professional',
    code: 'DOP-C02',
    level: 'Professional',
    category: 'professional',
    description: 'Demonstrate expertise in provisioning, operating, and managing distributed systems on AWS.',
    subdomain: 'devops',
    url: 'https://devops.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🔄',
    color: '#db61a2',
    examLength: '180 minutes',
    questions: '75 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  
  // Specialty
  {
    id: 'security-specialty',
    name: 'AWS Certified Security – Specialty',
    code: 'SCS-C02',
    level: 'Specialty',
    category: 'specialty',
    description: 'Validate your expertise in securing AWS workloads and architectures.',
    subdomain: 'security',
    url: 'https://security.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🔒',
    color: '#f85149',
    examLength: '170 minutes',
    questions: '65 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-security-specialty/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'machine-learning-specialty',
    name: 'AWS Certified Machine Learning – Specialty',
    code: 'MLS-C01',
    level: 'Specialty',
    category: 'specialty',
    description: 'Prove advanced skills in building, training, tuning, and deploying ML models on AWS.',
    subdomain: 'ml-specialty',
    url: 'https://ml-specialty.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🔬',
    color: '#a5d6ff',
    examLength: '180 minutes',
    questions: '65 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'database-specialty',
    name: 'AWS Certified Database – Specialty',
    code: 'DBS-C01',
    level: 'Specialty',
    category: 'specialty',
    description: 'Validate your expertise in recommending, designing, and maintaining optimal AWS database solutions.',
    subdomain: 'database',
    url: 'https://database.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🗄️',
    color: '#7ee787',
    examLength: '180 minutes',
    questions: '65 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-database-specialty/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'advanced-networking-specialty',
    name: 'AWS Certified Advanced Networking – Specialty',
    code: 'ANS-C01',
    level: 'Specialty',
    category: 'specialty',
    description: 'Demonstrate expertise in designing and implementing AWS and hybrid IT network architectures.',
    subdomain: 'networking',
    url: 'https://networking.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '🌐',
    color: '#79c0ff',
    examLength: '170 minutes',
    questions: '65 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-advanced-networking-specialty/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  },
  {
    id: 'sap-on-aws-specialty',
    name: 'AWS Certified SAP on AWS – Specialty',
    code: 'PAS-C01',
    level: 'Specialty',
    category: 'specialty',
    description: 'Validate your expertise in designing, implementing, and operating SAP workloads on AWS.',
    subdomain: 'sap',
    url: 'https://sap.aws-study-flashcards-app.com',
    status: 'coming-soon',
    icon: '💼',
    color: '#ffa657',
    examLength: '170 minutes',
    questions: '65 questions',
    passingScore: '750/1000',
    officialUrl: 'https://aws.amazon.com/certification/certified-sap-on-aws-specialty/',
    features: ['Flashcards', 'Quiz Game', 'Study Guide']
  }
];

export const getCertificationsByCategory = (category) => {
  return certifications.filter(cert => cert.category === category);
};

export const getAvailableCertifications = () => {
  return certifications.filter(cert => cert.status === 'available');
};

export const getCertificationById = (id) => {
  return certifications.find(cert => cert.id === id);
};

export const categories = [
  { id: 'foundational', name: 'Foundational', description: 'Start your AWS journey' },
  { id: 'associate', name: 'Associate', description: 'Build practical skills' },
  { id: 'professional', name: 'Professional', description: 'Demonstrate advanced expertise' },
  { id: 'specialty', name: 'Specialty', description: 'Deep dive into specific domains' }
];
