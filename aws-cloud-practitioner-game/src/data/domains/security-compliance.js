// Domain 2: Security and Compliance (30% of exam)
// CLF-C02 Exam Content

export const securityCompliance = {
  id: 'security-compliance',
  name: 'Security & Compliance',
  icon: '🔒',
  weight: '30%',
  color: '#f85149',
  description: 'AWS shared responsibility model, security services, and compliance concepts',
  questions: [
    {
      id: 'sc1',
      question: 'In the AWS Shared Responsibility Model, what is AWS responsible for?',
      options: [
        'Customer data encryption',
        'Security OF the cloud (hardware, software, networking, facilities)',
        'IAM user management',
        'Application-level security'
      ],
      correctAnswer: 1,
      explanation: 'AWS is responsible for security OF the cloud, including the physical infrastructure, hardware, software, networking, and facilities that run AWS Cloud services.'
    },
    {
      id: 'sc2',
      question: 'Which AWS service enables you to manage access to AWS services and resources securely?',
      options: [
        'Amazon GuardDuty',
        'AWS Shield',
        'AWS Identity and Access Management (IAM)',
        'Amazon Inspector'
      ],
      correctAnswer: 2,
      explanation: 'AWS IAM enables you to manage access to AWS services and resources securely. You can create and manage users, groups, and roles, and use permissions to allow or deny access.'
    },
    {
      id: 'sc3',
      question: 'What is Multi-Factor Authentication (MFA)?',
      options: [
        'Using multiple passwords for the same account',
        'An additional layer of security requiring multiple verification methods',
        'Encrypting data with multiple keys',
        'Backing up data to multiple locations'
      ],
      correctAnswer: 1,
      explanation: 'MFA adds an extra layer of protection by requiring users to provide multiple verification factors (something you know + something you have) to access AWS resources.'
    },
    {
      id: 'sc4',
      question: 'Which AWS service provides DDoS protection?',
      options: [
        'AWS WAF',
        'AWS Shield',
        'Amazon GuardDuty',
        'AWS Config'
      ],
      correctAnswer: 1,
      explanation: 'AWS Shield provides DDoS protection. Shield Standard is automatically enabled for all AWS customers at no cost. Shield Advanced provides enhanced DDoS protection for an additional fee.'
    },
    {
      id: 'sc5',
      question: 'What is the principle of least privilege?',
      options: [
        'Giving users the maximum permissions possible',
        'Giving users only the permissions they need to perform their job',
        'Removing all permissions from users by default',
        'Sharing credentials among team members'
      ],
      correctAnswer: 1,
      explanation: 'The principle of least privilege means granting only the minimum permissions necessary for users to perform their required tasks. This reduces the risk of accidental or malicious actions.'
    },
    {
      id: 'sc6',
      question: 'Which service provides intelligent threat detection for your AWS account?',
      options: [
        'AWS WAF',
        'Amazon GuardDuty',
        'AWS Shield',
        'AWS Firewall Manager'
      ],
      correctAnswer: 1,
      explanation: 'Amazon GuardDuty is a threat detection service that continuously monitors for malicious activity and unauthorized behavior to protect your AWS accounts, workloads, and data.'
    },
    {
      id: 'sc7',
      question: 'What is AWS Artifact?',
      options: [
        'A code repository service',
        'A service that provides access to AWS compliance reports and agreements',
        'A container registry',
        'A build automation service'
      ],
      correctAnswer: 1,
      explanation: 'AWS Artifact provides on-demand access to AWS security and compliance documents, such as SOC reports, PCI reports, and other certifications, as well as AWS agreements.'
    },
    {
      id: 'sc8',
      question: 'Which AWS service helps you assess the security and compliance of your AWS resources?',
      options: [
        'AWS Trusted Advisor',
        'Amazon Inspector',
        'AWS Config',
        'All of the above'
      ],
      correctAnswer: 3,
      explanation: 'All three services help with security assessment: Trusted Advisor provides best practice recommendations, Inspector assesses applications for vulnerabilities, and Config tracks resource configurations.'
    },
    {
      id: 'sc9',
      question: 'What is an IAM Role?',
      options: [
        'A permanent user account',
        'An identity with permissions that can be assumed by trusted entities',
        'A group of users',
        'A password policy'
      ],
      correctAnswer: 1,
      explanation: 'An IAM Role is an identity with specific permissions that can be assumed by users, applications, or AWS services. Roles provide temporary security credentials instead of long-term credentials.'
    },
    {
      id: 'sc10',
      question: 'Which AWS service allows you to create and manage encryption keys?',
      options: [
        'AWS Secrets Manager',
        'AWS Key Management Service (KMS)',
        'AWS Certificate Manager',
        'AWS CloudHSM'
      ],
      correctAnswer: 1,
      explanation: 'AWS KMS allows you to create and manage cryptographic keys and control their use across AWS services and applications. It integrates with most AWS services for encryption.'
    },
    {
      id: 'sc11',
      question: 'In the Shared Responsibility Model, who is responsible for patching the guest operating system on an EC2 instance?',
      options: [
        'AWS',
        'The customer',
        'Shared between AWS and customer',
        'It depends on the instance type'
      ],
      correctAnswer: 1,
      explanation: 'The customer is responsible for patching the guest operating system and any applications running on EC2 instances. AWS is responsible for patching the underlying infrastructure.'
    },
    {
      id: 'sc12',
      question: 'What is AWS WAF?',
      options: [
        'A firewall for VPCs',
        'A web application firewall that protects web applications from common exploits',
        'A DDoS protection service',
        'A network monitoring tool'
      ],
      correctAnswer: 1,
      explanation: 'AWS WAF (Web Application Firewall) helps protect web applications from common web exploits like SQL injection and cross-site scripting (XSS) that could affect availability or security.'
    },
    {
      id: 'sc13',
      question: 'What is the AWS root user?',
      options: [
        'The default Linux user on EC2',
        'The first identity created when you create an AWS account with complete access',
        'An IAM administrator role',
        'A service account'
      ],
      correctAnswer: 1,
      explanation: 'The root user is the identity created when you first create an AWS account. It has complete access to all AWS services and resources. Best practice is to lock away root user credentials and use IAM users instead.'
    },
    {
      id: 'sc14',
      question: 'Which service helps you centrally manage security policies across multiple AWS accounts?',
      options: [
        'AWS Organizations',
        'AWS Security Hub',
        'AWS Firewall Manager',
        'All of the above'
      ],
      correctAnswer: 3,
      explanation: 'All three help with centralized management: Organizations for account management and SCPs, Security Hub for aggregating security findings, and Firewall Manager for managing firewall rules across accounts.'
    },
    {
      id: 'sc15',
      question: 'What are Security Groups in AWS?',
      options: [
        'Groups of IAM users',
        'Virtual firewalls that control inbound and outbound traffic for EC2 instances',
        'Encryption key groups',
        'Compliance requirement categories'
      ],
      correctAnswer: 1,
      explanation: 'Security Groups act as virtual firewalls for EC2 instances, controlling inbound and outbound traffic at the instance level. They are stateful, meaning return traffic is automatically allowed.'
    }
  ]
};
