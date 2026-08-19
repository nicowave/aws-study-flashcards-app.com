// Module 4: Cloud Computing Fundamentals
// Source: AWS Cloud Practitioner Exam Prep - 175+ Questions

export const module4 = {
  id: 'module4',
  name: 'Cloud Concepts',
  description: 'Cloud computing fundamentals, deployment models, and design principles',
  icon: '☁️',
  color: '#3fb950',
  gradient: 'linear-gradient(135deg, #3fb950 0%, #238636 100%)',
  source: 'AWS CCP Exam Prep - 175+ Q&A',
  cards: [
    {
      id: 'cc-q1',
      front: "What are the 'six advantages of cloud computing' according to AWS?",
      back: "1) Trade capital expense for variable expense\n2) Benefit from massive economies of scale\n3) Stop guessing capacity\n4) Increase speed and agility\n5) Stop spending money running data centers\n6) Go global in minutes",
      hint: 'The 6 pillars of why cloud wins',
      tags: ['cloud-concepts', 'advantages'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q2',
      front: "What is the difference between CapEx and OpEx in cloud computing?",
      back: "CapEx (Capital Expenditure) is upfront investment in physical infrastructure.\n\nOpEx (Operational Expenditure) is pay-as-you-go spending for cloud services.\n\nCloud converts CapEx to OpEx.",
      hint: 'Upfront vs. ongoing',
      tags: ['cloud-concepts', 'pricing'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q3',
      front: "What are the three cloud computing deployment models?",
      back: "1) Public Cloud - resources owned and operated by a third-party provider (AWS)\n2) Private Cloud - resources used exclusively by one organization\n3) Hybrid Cloud - combination of public and private clouds",
      hint: 'Public, Private, Hybrid',
      tags: ['cloud-concepts', 'deployment-models'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q4',
      front: "What are the three cloud service models?",
      back: "IaaS (Infrastructure as a Service) – provides virtualized computing resources\nPaaS (Platform as a Service) – provides a platform for developing applications\nSaaS (Software as a Service) – provides complete software applications",
      hint: 'IaaS, PaaS, SaaS',
      tags: ['cloud-concepts', 'service-models'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q5',
      front: "Which AWS service model gives the most control over infrastructure?",
      back: "IaaS (Infrastructure as a Service; e.g., EC2) gives the most control.\n\nYou manage: OS, middleware, runtime, data, and applications.\nAWS manages: virtualization, servers, storage, and networking.",
      hint: 'Think EC2',
      tags: ['cloud-concepts', 'service-models'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q6',
      front: "What does 'elasticity' mean in cloud computing?",
      back: "Elasticity is the ability to automatically acquire and release resources based on demand.\n\nResources scale out (add) when demand increases.\nResources scale in (remove) when demand decreases.",
      hint: 'Scale up and down automatically',
      tags: ['cloud-concepts', 'elasticity'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q7',
      front: "What is 'high availability' in AWS?",
      back: "High availability means designing systems to operate continuously without failure for a long time.\n\nAchieved by deploying across multiple Availability Zones and using redundant components.",
      hint: 'Multi-AZ = HA',
      tags: ['cloud-concepts', 'high-availability'],
      difficulty: 'beginner'
    },
    {
      id: 'cc-q8',
      front: "What is 'fault tolerance'?",
      back: "Fault tolerance is the ability of a system to continue operating without interruption when one or more components fail.\n\nBuilt through redundancy and automated failover mechanisms.",
      hint: 'Zero downtime even during failures',
      tags: ['cloud-concepts', 'fault-tolerance'],
      difficulty: 'beginner'
    }
  ]
};
