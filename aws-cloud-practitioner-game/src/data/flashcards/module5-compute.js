// Module 5: Compute Services
// Sources: official AWS documentation, linked on each card

export const module5 = {
  id: 'module5',
  name: 'Compute Services',
  description: 'EC2, Lambda, ECS, EKS, Fargate, Beanstalk, and more',
  icon: '⚡',
  color: '#f472b6',
  gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'comp-q9',
      front: 'What is Amazon EC2?',
      back: "Elastic Compute Cloud: Provides resizable virtual servers (instances) in the cloud.\n\nYou have full control over the OS and can choose instance type, storage, and networking.",
      hint: 'Virtual machines in the cloud',
      tags: ['compute', 'ec2'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon EC2? – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html', checked: '2026-11-25' },
        { title: 'Amazon EC2 – Secure and resizable cloud compute', url: 'https://aws.amazon.com/ec2/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q10',
      front: 'What are EC2 instance purchasing options?',
      back: "1) On-Demand – Pay by hour/second, no commitment\n2) Reserved – 1-3 year commitment, up to 72% discount\n3) Spot – Use spare EC2 capacity, up to 90% discount\n4) Dedicated Hosts – Physical servers dedicated to you\n5) Savings Plans – Flexible pricing model",
      hint: 'On-Demand, Reserved, Spot, Dedicated, Savings',
      tags: ['compute', 'ec2', 'pricing'],
      difficulty: 'beginner',
      sources: [
        { title: 'Amazon EC2 Pricing', url: 'https://aws.amazon.com/ec2/pricing/', checked: '2026-11-25' },
        { title: 'Amazon EC2 Reserved Instances', url: 'https://aws.amazon.com/ec2/pricing/reserved-instances/', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Amazon EC2 Pricing', url: 'https://aws.amazon.com/ec2/pricing/', checked: '2026-11-25' },
        { title: 'Amazon EC2 Reserved Instances', url: 'https://aws.amazon.com/ec2/pricing/reserved-instances/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q11',
      front: 'When should you use Spot Instances?',
      back: "Use Spot for fault-tolerant, flexible workloads like batch processing, data analysis, CI/CD, and containerized workloads.\n\nSpot instances are NOT suitable for critical, stateful applications as instances can be terminated with 2-minute notice.",
      hint: 'Cheap but interruptible',
      tags: ['compute', 'ec2', 'spot'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Best practices for Amazon EC2 Spot – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html', checked: '2026-11-25' },
        { title: 'Spot Instance interruption notices – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Best practices for Amazon EC2 Spot – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html', checked: '2026-11-25' },
        { title: 'Spot Instance interruption notices – Amazon EC2 User Guide', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q12',
      front: 'What is AWS Lambda?',
      back: "Serverless compute service that runs code in response to events.\n\nYou pay only for what you use: requests plus compute time (billed per millisecond).\nNo server management required.\nSupports Python, Node.js, Java, and more.",
      hint: 'Functions as a Service',
      tags: ['compute', 'serverless', 'lambda'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is AWS Lambda? – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', checked: '2026-11-25' },
        { title: 'AWS Lambda Pricing', url: 'https://aws.amazon.com/lambda/pricing/', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is AWS Lambda? – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', checked: '2026-11-25' },
        { title: 'AWS Lambda Pricing', url: 'https://aws.amazon.com/lambda/pricing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q13',
      front: 'What is the maximum execution time for a Lambda function?',
      back: "30 minutes (1,800 seconds).\n\nAWS raised this from 15 minutes (900 seconds), so older study material and some exam questions may still say 15. For longer-running workloads, consider Step Functions, EC2, or ECS/Fargate.",
      hint: '30 min max',
      tags: ['compute', 'lambda'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Lambda quotas – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Lambda quotas – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q14',
      front: 'What is Amazon ECS?',
      back: "Elastic Container Service: Fully managed container orchestration service for running Docker containers.\n\nCan run on EC2 instances or serverlessly on Fargate.",
      hint: 'Docker containers, managed',
      tags: ['compute', 'containers', 'ecs'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Amazon Elastic Container Service? – Amazon ECS Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is Amazon Elastic Container Service? – Amazon ECS Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q15',
      front: 'What is Amazon EKS?',
      back: "Elastic Kubernetes Service: Managed Kubernetes service for running containerized applications.\n\nProvides Kubernetes control plane management.",
      hint: 'Managed Kubernetes',
      tags: ['compute', 'containers', 'eks'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is Amazon EKS? – Amazon EKS User Guide', url: 'https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is Amazon EKS? – Amazon EKS User Guide', url: 'https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q16',
      front: 'What is AWS Fargate?',
      back: "Serverless compute engine for containers.\n\nWorks with ECS and EKS.\nYou don't manage servers or clusters – just define CPU and memory requirements.",
      hint: 'Serverless containers',
      tags: ['compute', 'containers', 'fargate'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Architect for AWS Fargate for Amazon ECS – Amazon ECS Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html', checked: '2026-11-25' },
        { title: 'Simplify compute management with AWS Fargate – Amazon EKS User Guide', url: 'https://docs.aws.amazon.com/eks/latest/userguide/fargate.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Architect for AWS Fargate for Amazon ECS – Amazon ECS Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html', checked: '2026-11-25' },
        { title: 'Simplify compute management with AWS Fargate – Amazon EKS User Guide', url: 'https://docs.aws.amazon.com/eks/latest/userguide/fargate.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q17',
      front: 'What is an Auto Scaling Group?',
      back: "A collection of EC2 instances treated as a logical group for automatic scaling.\n\n• Maintains desired number of instances\n• Scales based on demand\n• Replaces unhealthy instances",
      hint: 'Automatic EC2 scaling',
      tags: ['compute', 'auto-scaling'],
      difficulty: 'beginner',
      sources: [
        { title: 'Auto Scaling groups – Amazon EC2 Auto Scaling User Guide', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Auto Scaling groups – Amazon EC2 Auto Scaling User Guide', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q18',
      front: 'What is AWS Elastic Beanstalk?',
      back: "PaaS for deploying and managing web applications.\n\nAutomatically handles capacity provisioning, load balancing, scaling, and application health monitoring.\n\nYou just upload your code.",
      hint: 'Just upload code, AWS handles the rest',
      tags: ['compute', 'paas', 'beanstalk'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is AWS Elastic Beanstalk? – AWS Elastic Beanstalk Developer Guide', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is AWS Elastic Beanstalk? – AWS Elastic Beanstalk Developer Guide', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q19',
      front: 'What is Amazon Lightsail?',
      back: "Simple virtual private servers for users who don't need full EC2 complexity.\n\nIncludes compute, storage, and networking in simple monthly packages.\nGood for small applications, websites, dev/test.",
      hint: 'Simple VPS',
      tags: ['compute', 'lightsail'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Lightsail? – Amazon Lightsail User Guide', url: 'https://docs.aws.amazon.com/lightsail/latest/userguide/what-is-amazon-lightsail.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is Amazon Lightsail? – Amazon Lightsail User Guide', url: 'https://docs.aws.amazon.com/lightsail/latest/userguide/what-is-amazon-lightsail.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'comp-q20',
      front: 'What is AWS Batch?',
      back: "Fully managed batch processing service.\n\nEfficiently runs hundreds of thousands of batch computing jobs.\nDynamically provisions optimal compute resources based on job requirements.",
      hint: 'Large-scale batch jobs',
      tags: ['compute', 'batch'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is AWS Batch? – AWS Batch User Guide', url: 'https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html', checked: '2026-11-25' },
        { title: 'Efficient Batch Processing – AWS Batch', url: 'https://aws.amazon.com/batch/', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is AWS Batch? – AWS Batch User Guide', url: 'https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html', checked: '2026-11-25' },
        { title: 'Efficient Batch Processing – AWS Batch', url: 'https://aws.amazon.com/batch/', checked: '2026-11-25' }
      ]
    }
  ]
};
