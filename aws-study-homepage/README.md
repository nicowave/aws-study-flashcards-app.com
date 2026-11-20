# Level Up Study Hub - Multi-Site Architecture

A comprehensive AWS certification study platform with a central homepage and dedicated subdomains for each certification path.

## 🏗️ Your Infrastructure

| Site | S3 Bucket | CloudFront ID | URL |
|------|-----------|---------------|-----|
| Homepage | `aws-study-flashcards-app-home` | `E3D126UT3L72OL` | https://aws-study-flashcards-app.com |
| AI Practitioner | `ai.aws-study-flashcards-app.com` | `E23TPCWLVKFC65` | https://ai.aws-study-flashcards-app.com |
| Cloud Practitioner | `cloud.aws-study-flashcards-app.com` | `E6NUXKK8FTCR1` | https://cloud.aws-study-flashcards-app.com |

**Wildcard Certificate:** `arn:aws:acm:us-east-1:418272768335:certificate/9c5abd7d-76d2-4506-9f2b-1f067e761abc`

## 🚀 Deployment

### Deploy Homepage

```bash
cd aws-study-homepage
chmod +x deploy.sh
./deploy.sh
```

Or manually:
```bash
npm install
npm run build
aws s3 sync dist/ s3://aws-study-flashcards-app-home/ --delete
aws cloudfront create-invalidation --distribution-id E3D126UT3L72OL --paths "/*"
```

### Deploy AI Practitioner

```bash
cd aws-ai-study-game
npm install
npm run build
aws s3 sync dist/ s3://ai.aws-study-flashcards-app.com/ --delete
aws cloudfront create-invalidation --distribution-id E23TPCWLVKFC65 --paths "/*"
```

### Deploy Cloud Practitioner (when ready)

```bash
cd aws-cloud-practitioner
npm install
npm run build
aws s3 sync dist/ s3://cloud.aws-study-flashcards-app.com/ --delete
aws cloudfront create-invalidation --distribution-id E6NUXKK8FTCR1 --paths "/*"
```

## 🎨 Design System

### Theme: Developer-focused Material Dark

| Element | Value |
|---------|-------|
| Background | `#0d1117` |
| Cards | `#161b22` |
| Primary Accent | `#58a6ff` (cyan-blue) |
| Secondary Accent | `#56d4dd` (teal) |
| AWS Brand | `#ff9900` (orange) |
| Font | IBM Plex Sans / IBM Plex Mono |

## 📊 Certifications Covered

| Certification | Subdomain | Status |
|--------------|-----------|--------|
| AI Practitioner | ai. | ✅ Available |
| Cloud Practitioner | cloud. | 🔜 Coming Soon |
| Solutions Architect Associate | solutions-architect. | 🔜 Coming Soon |
| Solutions Architect Professional | solutions-architect-professional. | 🔜 Coming Soon |
| + 10 more certifications | ... | 🔜 Coming Soon |

## 📁 Project Structure

```
aws-study-homepage/           # Homepage
├── src/
│   ├── App.jsx              # Main component
│   ├── data/certifications.js
│   └── styles/
├── deploy.sh                # One-click deploy
└── package.json

aws-ai-study-game/           # AI Practitioner
├── src/
│   ├── components/          # Quiz & Flashcard components
│   └── data/flashcards/     # Study content
└── deploy.sh
```

## 💰 Monthly Cost

~$2-6/month (S3 + CloudFront at low traffic)
