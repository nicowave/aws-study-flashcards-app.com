// Module 7: Networking
// Source: AWS Cloud Practitioner Exam Prep - 175+ Questions

export const module7 = {
  id: 'module7',
  name: 'Networking',
  description: 'VPC, subnets, Route 53, CloudFront, Direct Connect, and more',
  icon: '🔗',
  color: '#79c0ff',
  gradient: 'linear-gradient(135deg, #79c0ff 0%, #58a6ff 100%)',
  source: 'AWS CCP Exam Prep - 175+ Q&A',
  cards: [
    {
      id: 'net-q29',
      front: 'What is Amazon VPC?',
      back: "Virtual Private Cloud: A logically isolated section of AWS Cloud where you can launch resources in a virtual network you define.\n\nYou control IP ranges, subnets, route tables, and gateways.",
      hint: 'Your private network in AWS',
      tags: ['networking', 'vpc'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q30',
      front: 'What is the difference between public and private subnets?',
      back: "Public subnets have a route to an Internet Gateway, allowing resources to communicate with the internet.\n\nPrivate subnets have no direct internet access. Resources can access the internet via a NAT Gateway (outbound only).",
      hint: 'Internet Gateway = public, NAT Gateway = private outbound',
      tags: ['networking', 'vpc', 'subnets'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q31',
      front: 'What is an Internet Gateway?',
      back: "A horizontally scaled, redundant, highly available VPC component.\n\nAllows communication between your VPC and the internet.\nAttached to VPC to enable internet access.",
      hint: 'VPC ↔ Internet',
      tags: ['networking', 'vpc', 'internet-gateway'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q32',
      front: 'What is a NAT Gateway?',
      back: "Network Address Translation service.\n\nEnables instances inside private subnets to connect to the internet or other AWS services.\n\nPrevents inbound connections from the internet.",
      hint: 'Private subnet outbound internet',
      tags: ['networking', 'vpc', 'nat'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q33',
      front: 'What is a Security Group?',
      back: "Virtual firewall for EC2 instances.\n\nControls inbound and outbound traffic at the instance level.\nStateful: return traffic is automatically allowed.\nBy default: denies all inbound, allows all outbound.",
      hint: 'Instance-level, stateful firewall',
      tags: ['networking', 'security-groups'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q34',
      front: 'What is a Network ACL (NACL)?',
      back: "Optional layer of security at the subnet level.\n\nStateless: return traffic must be explicitly allowed.\nProcesses rules in number order.\nBy default: allows all traffic.",
      hint: 'Subnet-level, stateless firewall',
      tags: ['networking', 'nacl'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q35',
      front: 'What is the key difference between Security Groups and NACLs?',
      back: "Security Groups: stateful, instance-level, allow rules only, evaluate all rules.\n\nNACLs: stateless, subnet-level, allow AND deny rules, evaluate rules in order.",
      hint: 'SG=stateful+instance, NACL=stateless+subnet',
      tags: ['networking', 'security-groups', 'nacl'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q36',
      front: 'What is Amazon Route 53?',
      back: "Highly available and scalable DNS web service.\n\nProvides domain registration, DNS routing, and health checking.\n\nSupports routing policies: Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multi-Value.",
      hint: 'DNS service (port 53)',
      tags: ['networking', 'dns', 'route53'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q37',
      front: 'What is Amazon CloudFront?',
      back: "Content Delivery Network (CDN).\n\nDelivers data, videos, applications, and APIs globally with low latency.\nUses Edge Locations to cache content.\nIntegrates with Shield for DDoS protection.",
      hint: 'CDN via edge locations',
      tags: ['networking', 'cdn', 'cloudfront'],
      difficulty: 'beginner'
    },
    {
      id: 'net-q38',
      front: 'What is AWS Direct Connect?',
      back: "Dedicated network connection from your premises to AWS.\n\nProvides consistent network performance, reduced bandwidth costs, and private connectivity.\nDoes NOT traverse the public internet.",
      hint: 'Dedicated private line to AWS',
      tags: ['networking', 'direct-connect'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q39',
      front: 'What is a VPC Peering Connection?',
      back: "A networking connection between two VPCs.\n\nEnables routing traffic using private IP addresses.\nVPCs can be in different accounts or different Regions.\nTraffic stays on AWS backbone.",
      hint: 'Private VPC-to-VPC link',
      tags: ['networking', 'vpc-peering'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q40',
      front: 'What is AWS Transit Gateway?',
      back: "Network transit hub that connects VPCs and on-premises networks through a central hub.\n\nSimplifies network architecture by avoiding complex peering relationships.",
      hint: 'Central hub for all network connections',
      tags: ['networking', 'transit-gateway'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q41',
      front: 'What is AWS Global Accelerator?',
      back: "Networking service that improves availability and performance using the AWS global network.\n\nProvides static IP addresses as fixed entry points.\nRoutes traffic to optimal endpoints.",
      hint: 'Static IPs + optimal routing',
      tags: ['networking', 'global-accelerator'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q42',
      front: 'What is AWS PrivateLink?',
      back: "Service providing private connectivity between VPCs, AWS services, and on-premises applications.\n\nProvides private connectivity without exposing traffic to the public internet.\nCreates interface VPC endpoints.",
      hint: 'Private service endpoints',
      tags: ['networking', 'privatelink'],
      difficulty: 'intermediate'
    },
    {
      id: 'net-q43',
      front: 'What is a VPN Connection in AWS?',
      back: "Secure, encrypted connection between your on-premises network and AWS VPC over the internet.\n\nUses IPsec protocol.\nCheaper than Direct Connect but less consistent performance.",
      hint: 'Encrypted tunnel over internet',
      tags: ['networking', 'vpn'],
      difficulty: 'intermediate'
    }
  ]
};
