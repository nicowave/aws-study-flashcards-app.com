# AWS Cloud Practitioner Study Game

Interactive flashcards and quiz games for the AWS Certified Cloud Practitioner (CLF-C02) exam.

## 🎯 Features

- **Quiz Game**: Domain-based quizzes with XP, levels, and achievements
- **Flashcards**: 34 cards covering core services, security, and pricing
- **Progress Tracking**: LocalStorage persistence

## 📚 Exam Domains (CLF-C02)

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
aws s3 sync dist/ s3://cloud.aws-study-flashcards-app.com/ --delete
aws cloudfront create-invalidation --distribution-id E6NUXKK8FTCR1 --paths "/*"
```

## 🔗 Links

- **Live Site**: https://cloud.aws-study-flashcards-app.com
- **Homepage**: https://aws-study-flashcards-app.com
- **AI Practitioner**: https://ai.aws-study-flashcards-app.com
