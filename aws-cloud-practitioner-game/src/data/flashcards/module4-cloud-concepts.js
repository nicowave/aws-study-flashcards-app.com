// Module 4: Cloud Computing Fundamentals
// Sources: official AWS documentation, linked on each card

export const module4 = {
  id: 'module4',
  name: 'Cloud Concepts',
  description: 'Cloud computing fundamentals, deployment models, and design principles',
  icon: '☁️',
  color: '#3fb950',
  gradient: 'linear-gradient(135deg, #3fb950 0%, #238636 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'cc-q1',
      front: "What are the 'six advantages of cloud computing' according to AWS?",
      back: "1) Trade fixed expense for variable expense\n2) Benefit from massive economies of scale\n3) Stop guessing capacity\n4) Increase speed and agility\n5) Stop spending money running and maintaining data centers\n6) Go global in minutes",
      hint: 'The 6 pillars of why cloud wins',
      tags: ['cloud-concepts', 'advantages'],
      difficulty: 'beginner',
      sources: [
        { title: 'Six advantages of cloud computing – Overview of Amazon Web Services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q2',
      front: "What is the difference between CapEx and OpEx in cloud computing?",
      back: "CapEx (Capital Expenditure) is upfront investment in physical infrastructure.\n\nOpEx (Operational Expenditure) is pay-as-you-go spending for cloud services.\n\nCloud shifts spending from CapEx to OpEx (AWS: \"trade fixed expense for variable expense\").",
      hint: 'Upfront vs. ongoing',
      tags: ['cloud-concepts', 'pricing'],
      difficulty: 'beginner',
      sources: [
        { title: 'Six advantages of cloud computing – Overview of Amazon Web Services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html', checked: '2026-11-25' },
        { title: 'What is cloud computing? – Overview of Amazon Web Services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/what-is-cloud-computing.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q3',
      front: "What are the three cloud computing deployment models?",
      back: "1) Cloud - all parts of the application run in the cloud (e.g., AWS)\n2) On-premises (private cloud) - resources in your own data center, using virtualization and resource management tools\n3) Hybrid - connects cloud resources with existing resources that aren't in the cloud, usually on-premises",
      hint: 'Cloud, On-premises (private), Hybrid',
      tags: ['cloud-concepts', 'deployment-models'],
      difficulty: 'beginner',
      sources: [
        { title: 'Types of cloud computing – Overview of Amazon Web Services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/types-of-cloud-computing.html', checked: '2026-11-25' },
        { title: 'SaaS vs PaaS vs IaaS – Types of Cloud Computing – AWS', url: 'https://aws.amazon.com/types-of-cloud-computing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q4',
      front: "What are the three cloud service models?",
      back: "IaaS (Infrastructure as a Service) – provides virtualized computing resources\nPaaS (Platform as a Service) – provides a platform for developing applications\nSaaS (Software as a Service) – provides complete software applications",
      hint: 'IaaS, PaaS, SaaS',
      tags: ['cloud-concepts', 'service-models'],
      difficulty: 'beginner',
      sources: [
        { title: 'SaaS vs PaaS vs IaaS – Types of Cloud Computing – AWS', url: 'https://aws.amazon.com/types-of-cloud-computing/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q5',
      front: "Which AWS service model gives the most control over infrastructure?",
      back: "IaaS (Infrastructure as a Service; e.g., EC2) gives the most control.\n\nYou manage: OS, middleware, runtime, data, and applications.\nAWS manages: virtualization, servers, storage, and networking.",
      hint: 'Think EC2',
      tags: ['cloud-concepts', 'service-models'],
      difficulty: 'beginner',
      sources: [
        { title: 'SaaS vs PaaS vs IaaS – Types of Cloud Computing – AWS', url: 'https://aws.amazon.com/types-of-cloud-computing/', checked: '2026-11-25' },
        { title: 'Shared Responsibility Model – AWS', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q6',
      front: "What does 'elasticity' mean in cloud computing?",
      back: "Elasticity is the ability to automatically acquire and release resources based on demand.\n\nResources scale out (add) when demand increases.\nResources scale in (remove) when demand decreases.",
      hint: 'Scale up and down automatically',
      tags: ['cloud-concepts', 'elasticity'],
      difficulty: 'beginner',
      sources: [
        { title: 'PERF02-BP04 Scale your compute resources dynamically – AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/perf02-bp04.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q7',
      front: "What is 'high availability' in AWS?",
      back: "High availability means designing systems to operate continuously with minimal downtime, even when individual components fail.\n\nAchieved by removing single points of failure: deploy across multiple Availability Zones and use redundant components with automatic failover.",
      hint: 'Multi-AZ = HA',
      tags: ['cloud-concepts', 'high-availability'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is High Availability? – AWS', url: 'https://aws.amazon.com/what-is/high-availability/', checked: '2026-11-25' },
        { title: 'REL10-BP01 Deploy the workload to multiple locations – Reliability Pillar (AWS Well-Architected Framework)', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_multiaz_region_system.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'cc-q8',
      front: "What is 'fault tolerance'?",
      back: "Fault tolerance is the ability of a system to continue operating without interruption when one or more components fail.\n\nBuilt through redundancy and automated failover mechanisms.",
      hint: 'Zero downtime even during failures',
      tags: ['cloud-concepts', 'fault-tolerance'],
      difficulty: 'beginner',
      sources: [
        { title: 'Fault tolerance and fault isolation – Availability and Beyond (AWS Whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/fault-tolerance-and-fault-isolation.html', checked: '2026-11-25' }
      ]
    }
  ]
};
