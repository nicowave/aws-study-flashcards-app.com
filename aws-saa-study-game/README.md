# AWS Solutions Architect Associate Study Game

Interactive flashcards and quiz games for the AWS Certified Solutions Architect Associate (SAA-C03) exam.

## 🎯 Features

- **Quiz Game**: Domain-based quizzes with XP, levels, and achievements
- **Flashcards**: 34 cards covering core services, security, and pricing
- **Progress Tracking**: LocalStorage persistence

## 📚 Exam Domains (SAA-C03)

| Domain | Weight | Questions |
|--------|--------|-----------|
| Cloud Concepts | 24% | 15 |
| Security & Compliance | 30% | 15 |
| Cloud Technology & Services | 34% | 20 |
| Billing, Pricing & Support | 12% | 15 |

## 🚀 Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
npm install
npm run build
aws s3 sync dist/ s3://saa.aws-study-flashcards-app.com/ --delete
aws cloudfront create-invalidation --distribution-id E6NUXKK8FTCR1 --paths "/*"
```

## 🔗 Links

- **Live Site**: https://saa.aws-study-flashcards-app.com
- **Homepage**: https://aws-study-flashcards-app.com
- **AI Practitioner**: https://ai.aws-study-flashcards-app.com
