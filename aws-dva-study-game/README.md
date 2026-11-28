# AWS Developer Associate Study Game

Interactive quizzes, flashcards, a study guide and a timed practice exam for the AWS Certified Developer – Associate (DVA-C02) exam.

## Exam Domains (DVA-C02)

| Domain | Weight |
|---|---|
| 1. Development with AWS Services | 32% |
| 2. Security | 26% |
| 3. Deployment | 24% |
| 4. Troubleshooting and Optimization | 18% |

The practice exam draws 65 questions weighted by domain, with a 130-minute countdown, scored on the 100–1000 scale against the 720 pass line.

## Develop

```bash
cp .env.example .env   # fill in the Firebase values (same project as the other apps)
npm install
npm run dev
npm run build          # dist/
```

## Content

- `src/data/domains/*.js`: practice questions (`correctAnswer` field)
- `src/data/flashcards/module*.js`: flashcard decks
- `src/data/studyGuide/*.js`: study guide chapters

## Billing

Sold as a subscription, monthly or yearly (plan id `developer-associate`), or as part of Pro. The prices shown come from
`src/services/prices.js` (the same in all four games); the Stripe prices are `STRIPE_PRICE_DEVELOPER_ASSOCIATE_MONTHLY` and
`STRIPE_PRICE_DEVELOPER_ASSOCIATE_YEARLY` in `aws-backend/.env`. Deploy with `./deploy.sh dva` from the repo root.
