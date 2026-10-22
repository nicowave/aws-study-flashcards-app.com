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

## Not deployed yet

Publishing needs an S3 bucket and CloudFront distribution for `dva.aws-study-flashcards-app.com`, a Route 53 alias, ACM coverage,
a `dva` target in `deploy.sh`, and a Stripe price set as `STRIPE_PRICE_DEVELOPER_ASSOCIATE` in `functions/.env`.
