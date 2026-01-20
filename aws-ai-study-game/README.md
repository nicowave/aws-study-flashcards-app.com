# AWS AI Practitioner Study Game 🎮

A gamified study application for the AWS Certified AI Practitioner (AIF-C01) exam. Built with React and designed for ultra-low-cost hosting on AWS.

![AWS AI Study Game](https://img.shields.io/badge/AWS-AI%20Practitioner-FF9900?style=for-the-badge&logo=amazon-aws)

## Features

- 🧠 **5 Exam Domains** covering all AIF-C01 topics with proper weighting
- 🎮 **Gamification** - XP, levels, achievements, and streaks
- 📊 **Progress Tracking** - Per-domain scores and statistics
- 🔊 **Sound Effects** - Audio feedback for answers
- 💾 **Persistent Progress** - Stats saved to localStorage
- 📱 **Responsive Design** - Works on desktop and mobile

## Project Structure

```
aws-ai-study-game/
├── src/
│   ├── components/          # React UI components
│   │   ├── MenuScreen.jsx
│   │   ├── DomainSelect.jsx
│   │   ├── QuestionScreen.jsx
│   │   ├── ResultsScreen.jsx
│   │   ├── StatsScreen.jsx
│   │   └── ...
│   ├── data/                # Question data and config
│   │   ├── domains/         # Separated by exam domain
│   │   │   ├── fundamentals.js
│   │   │   ├── applications.js
│   │   │   └── governance.js
│   │   ├── achievements.js
│   │   ├── constants.js
│   │   └── index.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useSound.js
│   │   └── useGameStats.js
│   ├── styles/              # Global styles
│   ├── App.jsx
│   └── index.jsx
├── infrastructure/          # AWS deployment files
│   └── cloudformation-template.yaml
├── public/
├── deploy.sh
├── package.json
└── README.md
```

## Exam Domains Covered

| Domain | Weight | Topics |
|--------|--------|--------|
| 🧠 Fundamentals of AI and ML | 20% | ML types, neural networks, inference, overfitting |
| ✨ Fundamentals of Generative AI | 24% | Bedrock, RAG, prompting, fine-tuning, tokens |
| 🚀 Applications of Foundation Models | 28% | Polly, Lex, Rekognition, Comprehend, Textract |
| ⚖️ Guidelines for Responsible AI | 14% | Bias, explainability, guardrails, governance |
| 🔒 Security, Compliance & Governance | 14% | Data privacy, KMS, IAM, CloudTrail |

---

## 🚀 Deployment Guide

### Cheapest AWS Hosting Option: S3 + CloudFront

**Estimated Monthly Cost: $0.50 - $2.00** (for low-moderate traffic)

| Service | Cost |
|---------|------|
| S3 Storage | ~$0.023/GB (first 50TB) |
| CloudFront | Free tier: 1TB/month, then $0.085/GB |
| Route 53 (optional) | $0.50/hosted zone/month |

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 18+** and npm

### Quick Deploy (Automated)

```bash
# Clone or download the project
cd aws-ai-study-game

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. Install dependencies
2. Build the React app
3. Create/update CloudFormation stack
4. Upload files to S3
5. Invalidate CloudFront cache

### Manual Deployment Steps

#### Step 1: Build the Application

```bash
npm install
npm run build
```

#### Step 2: Deploy Infrastructure

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name aws-ai-study-game \
  --template-body file://infrastructure/cloudformation-template.yaml \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name aws-ai-study-game \
  --region us-east-1
```

#### Step 3: Get Deployment Info

```bash
# Get bucket name
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name aws-ai-study-game \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

# Get CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name aws-ai-study-game \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)
```

#### Step 4: Upload Files

```bash
# Sync build files to S3
aws s3 sync dist/ s3://$BUCKET/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

### Custom Domain Setup

To use a custom domain (e.g., `ai-study.aws-study-flashcards-app.com`):

1. **Request ACM Certificate** (must be in us-east-1):
```bash
aws acm request-certificate \
  --domain-name ai-study.aws-study-flashcards-app.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Validate the certificate** via DNS (add CNAME records)

3. **Update stack with domain parameters**:
```bash
aws cloudformation update-stack \
  --stack-name aws-ai-study-game \
  --template-body file://infrastructure/cloudformation-template.yaml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=ai-study.aws-study-flashcards-app.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --region us-east-1
```

4. **Add DNS record** in Route 53 or your DNS provider:
   - Type: CNAME
   - Name: ai-study
   - Value: [CloudFront distribution domain]

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📈 Adding More Questions

Questions are organized by domain in `src/data/domains/`. To add questions:

1. Open the appropriate domain file (e.g., `fundamentals.js`)
2. Add a new question object:

```javascript
{
  id: 'd1q9',  // Unique ID
  question: 'Your question here?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correct: 1,  // 0-indexed correct answer
  explanation: 'Explanation of why this is correct.'
}
```

---

## 🎯 Expanding to Other Certifications

This architecture is designed to easily support additional AWS certifications:

1. Create new domain files in `src/data/domains/`
2. Add an exam selector screen
3. Store per-exam progress in localStorage

Planned certifications:
- [ ] AWS Cloud Practitioner (CLF-C02)
- [ ] AWS Solutions Architect Associate (SAA-C03)
- [ ] AWS Solutions Architect Professional (SAP-C02)

---

## 📝 Cost Optimization Tips

1. **Use PriceClass_100** - Only US, Canada, Europe edge locations
2. **Enable S3 Intelligent Tiering** for infrequent access files
3. **Set aggressive cache headers** for static assets
4. **Monitor with CloudWatch** and set billing alerts

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add questions or features
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🔗 Related Resources

- [AWS AI Practitioner Exam Guide](https://aws.amazon.com/certification/certified-ai-practitioner/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
