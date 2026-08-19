// Module 5: Compute Services
// Source: AWS Cloud Practitioner Exam Prep - 175+ Questions

export const module5 = {
  id: 'module5',
  name: 'Compute Services',
  description: 'EC2, Lambda, ECS, EKS, Fargate, Beanstalk, and more',
  icon: '⚡',
  color: '#f0883e',
  gradient: 'linear-gradient(135deg, #f0883e 0%, #d68200 100%)',
  source: 'AWS CCP Exam Prep - 175+ Q&A',
  cards: [
    {
      id: 'comp-q9',
      front: 'What is Amazon EC2?',
      back: "Elastic Compute Cloud: Provides resizable virtual servers (instances) in the cloud.\n\nYou have full control over the OS and can choose instance type, storage, and networking.",
      hint: 'Virtual machines in the cloud',
      tags: ['compute', 'ec2'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q10',
      front: 'What are EC2 instance purchasing options?',
      back: "1) On-Demand – Pay by hour/second, no commitment\n2) Reserved – 1-3 year commitment, up to 72% discount\n3) Spot – Bid on unused capacity, up to 90% discount\n4) Dedicated Hosts – Physical servers dedicated to you\n5) Savings Plans – Flexible pricing model",
      hint: 'On-Demand, Reserved, Spot, Dedicated, Savings',
      tags: ['compute', 'ec2', 'pricing'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q11',
      front: 'When should you use Spot Instances?',
      back: "Use Spot for fault-tolerant, flexible workloads like batch processing, data analysis, CI/CD, and containerized workloads.\n\nSpot instances are NOT suitable for critical, stateful applications as instances can be terminated with 2-minute notice.",
      hint: 'Cheap but interruptible',
      tags: ['compute', 'ec2', 'spot'],
      difficulty: 'intermediate'
    },
    {
      id: 'comp-q12',
      front: 'What is AWS Lambda?',
      back: "Serverless compute service that runs code in response to events.\n\nYou pay only for compute time consumed (per millisecond).\nNo server management required.\nSupports Python, Node.js, Java, and more.",
      hint: 'Functions as a Service',
      tags: ['compute', 'serverless', 'lambda'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q13',
      front: 'What is the maximum execution time for a Lambda function?',
      back: "15 minutes (900 seconds).\n\nFor longer-running workloads, consider Step Functions, EC2, or ECS/Fargate.",
      hint: '15 min max',
      tags: ['compute', 'lambda'],
      difficulty: 'intermediate'
    },
    {
      id: 'comp-q14',
      front: 'What is Amazon ECS?',
      back: "Elastic Container Service: Fully managed container orchestration service for running Docker containers.\n\nCan run on EC2 instances or serverlessly on Fargate.",
      hint: 'Docker containers, managed',
      tags: ['compute', 'containers', 'ecs'],
      difficulty: 'intermediate'
    },
    {
      id: 'comp-q15',
      front: 'What is Amazon EKS?',
      back: "Elastic Kubernetes Service: Managed Kubernetes service for running containerized applications.\n\nProvides Kubernetes control plane management.",
      hint: 'Managed Kubernetes',
      tags: ['compute', 'containers', 'eks'],
      difficulty: 'intermediate'
    },
    {
      id: 'comp-q16',
      front: 'What is AWS Fargate?',
      back: "Serverless compute engine for containers.\n\nWorks with ECS and EKS.\nYou don't manage servers or clusters – just define CPU and memory requirements.",
      hint: 'Serverless containers',
      tags: ['compute', 'containers', 'fargate'],
      difficulty: 'intermediate'
    },
    {
      id: 'comp-q17',
      front: 'What is an Auto Scaling Group?',
      back: "A collection of EC2 instances treated as a logical group for automatic scaling.\n\n• Maintains desired number of instances\n• Scales based on demand\n• Replaces unhealthy instances",
      hint: 'Automatic EC2 scaling',
      tags: ['compute', 'auto-scaling'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q18',
      front: 'What is AWS Elastic Beanstalk?',
      back: "PaaS for deploying and managing web applications.\n\nAutomatically handles capacity provisioning, load balancing, scaling, and application health monitoring.\n\nYou just upload your code.",
      hint: 'Just upload code, AWS handles the rest',
      tags: ['compute', 'paas', 'beanstalk'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q19',
      front: 'What is Amazon Lightsail?',
      back: "Simple virtual private servers for users who don't need full EC2 complexity.\n\nIncludes compute, storage, and networking in simple monthly packages.\nGood for small applications, websites, dev/test.",
      hint: 'Simple VPS',
      tags: ['compute', 'lightsail'],
      difficulty: 'beginner'
    },
    {
      id: 'comp-q20',
      front: 'What is AWS Batch?',
      back: "Fully managed batch processing service.\n\nEfficiently runs hundreds of thousands of batch computing jobs.\nDynamically provisions optimal compute resources based on job requirements.",
      hint: 'Large-scale batch jobs',
      tags: ['compute', 'batch'],
      difficulty: 'intermediate'
    }
  ]
};
