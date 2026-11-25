// Module 7: Networking
// Sources: official AWS documentation, linked on each card

export const module7 = {
  id: 'module7',
  name: 'Networking',
  description: 'VPC, subnets, Route 53, CloudFront, Direct Connect, and more',
  icon: '🔗',
  color: '#22d3ee',
  gradient: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'net-q29',
      front: 'What is Amazon VPC?',
      back: "Virtual Private Cloud: A logically isolated section of AWS Cloud where you can launch resources in a virtual network you define.\n\nYou control IP ranges, subnets, route tables, and gateways.",
      hint: 'Your private network in AWS',
      tags: ['networking', 'vpc'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon VPC? – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q30',
      front: 'What is the difference between public and private subnets?',
      back: "Public subnets have a route to an Internet Gateway, allowing resources to communicate with the internet.\n\nPrivate subnets have no direct internet access. Resources can access the internet via a NAT Gateway (outbound only).",
      hint: 'Internet Gateway = public, NAT Gateway = private outbound',
      tags: ['networking', 'vpc', 'subnets'],
      difficulty: 'beginner',
      sources: [
        { title: 'Subnets for your VPC – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', checked: '2026-11-25' },
        { title: 'NAT gateways – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Subnets for your VPC – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', checked: '2026-11-25' },
        { title: 'NAT gateways – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q31',
      front: 'What is an Internet Gateway?',
      back: "A horizontally scaled, redundant, highly available VPC component.\n\nAllows communication between your VPC and the internet.\nAttached to VPC to enable internet access.",
      hint: 'VPC ↔ Internet',
      tags: ['networking', 'vpc', 'internet-gateway'],
      difficulty: 'beginner',
      sources: [
        { title: 'Enable internet access for a VPC using an internet gateway – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Enable internet access for a VPC using an internet gateway – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q32',
      front: 'What is a NAT Gateway?',
      back: "Network Address Translation service.\n\nEnables instances inside private subnets to connect to the internet or other AWS services.\n\nPrevents inbound connections from the internet.",
      hint: 'Private subnet outbound internet',
      tags: ['networking', 'vpc', 'nat'],
      difficulty: 'intermediate',
      sources: [
        { title: 'NAT gateways – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'NAT gateways – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q33',
      front: 'What is a Security Group?',
      back: "Virtual firewall for EC2 instances.\n\nControls inbound and outbound traffic at the instance level.\nStateful: return traffic is automatically allowed.\nBy default: denies all inbound, allows all outbound.",
      hint: 'Instance-level, stateful firewall',
      tags: ['networking', 'security-groups'],
      difficulty: 'beginner',
      sources: [
        { title: 'Control traffic to your AWS resources using security groups – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html', checked: '2026-11-25' },
        { title: 'Security group rules – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Control traffic to your AWS resources using security groups – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html', checked: '2026-11-25' },
        { title: 'Security group rules – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q34',
      front: 'What is a Network ACL (NACL)?',
      back: "Optional layer of security at the subnet level.\n\nStateless: return traffic must be explicitly allowed.\nProcesses rules in number order.\nThe default NACL allows all traffic; a custom NACL denies all traffic until you add rules.",
      hint: 'Subnet-level, stateless firewall',
      tags: ['networking', 'nacl'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Control subnet traffic with network access control lists – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html', checked: '2026-11-25' },
        { title: 'Default network ACL for a VPC – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/default-network-acl.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Control subnet traffic with network access control lists – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html', checked: '2026-11-25' },
        { title: 'Default network ACL for a VPC – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/default-network-acl.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q35',
      front: 'What is the key difference between Security Groups and NACLs?',
      back: "Security Groups: stateful, instance-level, allow rules only, evaluate all rules.\n\nNACLs: stateless, subnet-level, allow AND deny rules, evaluate rules in order.",
      hint: 'SG=stateful+instance, NACL=stateless+subnet',
      tags: ['networking', 'security-groups', 'nacl'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Infrastructure security in Amazon VPC (Compare security groups and network ACLs) – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'Infrastructure security in Amazon VPC (Compare security groups and network ACLs) – Amazon VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q36',
      front: 'What is Amazon Route 53?',
      back: "Highly available and scalable DNS web service.\n\nProvides domain registration, DNS routing, and health checking.\n\nSupports routing policies: Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, IP-based, Multivalue answer.",
      hint: 'DNS service (port 53)',
      tags: ['networking', 'dns', 'route53'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Route 53? – Amazon Route 53 Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', checked: '2026-11-25' },
        { title: 'Choosing a routing policy – Amazon Route 53 Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is Amazon Route 53? – Amazon Route 53 Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', checked: '2026-11-25' },
        { title: 'Choosing a routing policy – Amazon Route 53 Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q37',
      front: 'What is Amazon CloudFront?',
      back: "Content Delivery Network (CDN).\n\nDelivers data, videos, applications, and APIs globally with low latency.\nUses Edge Locations to cache content.\nIntegrates with Shield for DDoS protection.",
      hint: 'CDN via edge locations',
      tags: ['networking', 'cdn', 'cloudfront'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon CloudFront? – Amazon CloudFront Developer Guide', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', checked: '2026-11-25' },
        { title: 'Amazon CloudFront Key Features', url: 'https://aws.amazon.com/cloudfront/features/', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is Amazon CloudFront? – Amazon CloudFront Developer Guide', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html', checked: '2026-11-25' },
        { title: 'Key Features of a Content Delivery Network – Amazon CloudFront', url: 'https://aws.amazon.com/cloudfront/features/', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q38',
      front: 'What is AWS Direct Connect?',
      back: "Dedicated network connection from your premises to AWS.\n\nProvides consistent network performance, reduced bandwidth costs, and private connectivity.\nDoes NOT traverse the public internet.",
      hint: 'Dedicated private line to AWS',
      tags: ['networking', 'direct-connect'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Direct Connect – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-direct-connect.html', checked: '2026-11-25' },
        { title: 'What is Direct Connect? – AWS Direct Connect User Guide', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'AWS Direct Connect – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-direct-connect.html', checked: '2026-11-25' },
        { title: 'What is Direct Connect? – AWS Direct Connect User Guide', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q39',
      front: 'What is a VPC Peering Connection?',
      back: "A networking connection between two VPCs.\n\nEnables routing traffic using private IP addresses.\nVPCs can be in different accounts or different Regions.\nTraffic stays on AWS backbone.",
      hint: 'Private VPC-to-VPC link',
      tags: ['networking', 'vpc-peering'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is VPC peering? – Amazon VPC Peering Guide', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is VPC peering? – Amazon VPC Peering Guide', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q40',
      front: 'What is AWS Transit Gateway?',
      back: "Network transit hub that connects VPCs and on-premises networks through a central hub.\n\nSimplifies network architecture by avoiding complex peering relationships.",
      hint: 'Central hub for all network connections',
      tags: ['networking', 'transit-gateway'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is AWS Transit Gateway for Amazon VPC? – Amazon VPC Transit Gateways', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is AWS Transit Gateway for Amazon VPC? – Amazon VPC Transit Gateways', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q41',
      front: 'What is AWS Global Accelerator?',
      back: "Networking service that improves availability and performance using the AWS global network.\n\nProvides static IP addresses as fixed entry points.\nRoutes traffic to optimal endpoints.",
      hint: 'Static IPs + optimal routing',
      tags: ['networking', 'global-accelerator'],
      difficulty: 'intermediate',
      sources: [
        { title: 'What is AWS Global Accelerator? – AWS Global Accelerator Developer Guide', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'What is AWS Global Accelerator? – AWS Global Accelerator Developer Guide', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q42',
      front: 'What is AWS PrivateLink?',
      back: "Service providing private connectivity between VPCs, AWS services, and on-premises applications.\n\nProvides private connectivity without exposing traffic to the public internet.\nCreates interface VPC endpoints.",
      hint: 'Private service endpoints',
      tags: ['networking', 'privatelink'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS PrivateLink', url: 'https://aws.amazon.com/privatelink/', checked: '2026-11-25' },
        { title: 'What is AWS PrivateLink? – Amazon VPC', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'AWS PrivateLink', url: 'https://aws.amazon.com/privatelink/', checked: '2026-11-25' },
        { title: 'What is AWS PrivateLink? – Amazon VPC', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'net-q43',
      front: 'What is a VPN Connection in AWS?',
      back: "Secure, encrypted connection between your on-premises network and AWS VPC over the internet.\n\nUses IPsec protocol.\nTraffic crosses the public internet, so performance is less consistent than Direct Connect.",
      hint: 'Encrypted tunnel over internet',
      tags: ['networking', 'vpn'],
      difficulty: 'intermediate',
      sources: [
        { title: 'AWS Site-to-Site VPN – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-site-to-site-vpn.html', checked: '2026-11-25' },
        { title: 'AWS Direct Connect – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-direct-connect.html', checked: '2026-11-25' }
      ],
      sources: [
        { title: 'AWS Site-to-Site VPN – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-site-to-site-vpn.html', checked: '2026-11-25' },
        { title: 'AWS Direct Connect – Amazon Virtual Private Cloud Connectivity Options', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-direct-connect.html', checked: '2026-11-25' }
      ]
    }
  ]
};
