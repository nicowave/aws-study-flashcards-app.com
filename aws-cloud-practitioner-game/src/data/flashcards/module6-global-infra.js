// Module 6: Global Infrastructure
// Source: AWS Cloud Practitioner Exam Prep - 175+ Questions

export const module6 = {
  id: 'module6',
  name: 'Global Infrastructure',
  description: 'Regions, Availability Zones, Edge Locations, Local Zones, and Outposts',
  icon: '🌍',
  color: '#a371f7',
  gradient: 'linear-gradient(135deg, #a371f7 0%, #8957e5 100%)',
  source: 'AWS CCP Exam Prep - 175+ Q&A',
  cards: [
    {
      id: 'gi-q21',
      front: 'What is an AWS Region?',
      back: "A physical geographic location with multiple Availability Zones.\n\nEach Region is completely independent and isolated for fault tolerance.\nRegions are chosen based on latency, compliance, and service availability.",
      hint: 'Geographic area with multiple AZs',
      tags: ['infrastructure', 'regions'],
      difficulty: 'beginner'
    },
    {
      id: 'gi-q22',
      front: 'What is an Availability Zone (AZ)?',
      back: "One or more discrete data centers with redundant power, networking, and connectivity – all within one Region.\n\nAZs are physically separated by meaningful distance but connected via low-latency links.",
      hint: 'Isolated data centers within a Region',
      tags: ['infrastructure', 'availability-zones'],
      difficulty: 'beginner'
    },
    {
      id: 'gi-q23',
      front: 'How many Availability Zones does each AWS Region typically have?',
      back: "Minimum of 3 AZs (most have 3-6).\n\nThis allows for high availability deployments across multiple isolated locations.",
      hint: 'Minimum 3',
      tags: ['infrastructure', 'availability-zones'],
      difficulty: 'beginner'
    },
    {
      id: 'gi-q24',
      front: 'What are AWS Edge Locations?',
      back: "Data centers used to cache content closer to users.\n\nUsed by CloudFront CDN (Content Delivery Network).\nThere are more Edge Locations than Regions.\nUsed to reduce latency for content delivery.",
      hint: 'CDN cache points worldwide',
      tags: ['infrastructure', 'edge-locations', 'cloudfront'],
      difficulty: 'beginner'
    },
    {
      id: 'gi-q25',
      front: 'What are AWS Local Zones?',
      back: "Extensions of AWS Regions that place compute, storage, and database services closer to population centers.\n\nProvide single-digit millisecond latency for latency-sensitive applications.",
      hint: 'Region extensions near cities',
      tags: ['infrastructure', 'local-zones'],
      difficulty: 'intermediate'
    },
    {
      id: 'gi-q26',
      front: 'What are AWS Wavelength Zones?',
      back: "Infrastructure deployments embedded within telecom providers' 5G networks.\n\nProvide ultra-low latency for mobile and connected devices.",
      hint: '5G edge computing',
      tags: ['infrastructure', 'wavelength'],
      difficulty: 'intermediate'
    },
    {
      id: 'gi-q27',
      front: 'What are AWS Outposts?',
      back: "Fully managed service that extends AWS infrastructure to your on-premises facility.\n\nEnables hybrid cloud with consistent AWS experience.\nComes as rack or server form factors.",
      hint: 'AWS hardware in your data center',
      tags: ['infrastructure', 'outposts', 'hybrid'],
      difficulty: 'intermediate'
    },
    {
      id: 'gi-q28',
      front: 'What factors should you consider when choosing an AWS Region?',
      back: "1) Compliance/data residency requirements\n2) Proximity to customers (latency)\n3) Available services\n4) Pricing (varies by Region)",
      hint: 'Compliance, Latency, Services, Price',
      tags: ['infrastructure', 'regions'],
      difficulty: 'beginner'
    }
  ]
};
