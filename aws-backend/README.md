# AWS Study Hub — Serverless Backend (CDK)

The AWS-native replacement for the Firebase backend, built to run *on the
services the site teaches*: Cognito, DynamoDB, Lambda, API Gateway. Deploys
alongside Firebase with zero disruption; the frontends switch over in later
phases.

## Architecture (Phase 1)

```
Browser (S3/CloudFront SPAs)
   │  JWT (Cognito)
   ▼
API Gateway (HTTP API) ── JWT authorizer ──► Lambda (api)
   │                                            │
   │   Cognito User Pool                        ▼
   │      └─ pre-token-generation Lambda ──► DynamoDB (single table)
   ▼                                            PK=USER#<sub>
Hosted UI (Cognito domain)                      SK=PROFILE | PROGRESS#<cert> | ENTITLEMENTS
```

- **Entitlements** live in DynamoDB (`SK=ENTITLEMENTS`, `certs: [...]`) and
  are injected into every JWT by the pre-token Lambda — same tamper-proof
  model as Firebase custom claims. The Stripe webhook writes them (Phase 3).
- **Table** is `RemovalPolicy.RETAIN` + point-in-time recovery: customer
  data survives stack mistakes.

## Deploy

```bash
cd aws-backend
npm install
npx cdk bootstrap        # once per account/region
npm run deploy
```

Outputs to note for Phase 2: `UserPoolId`, `UserPoolClientId`,
`HostedUiBaseUrl`, `ApiUrl`.

If the Cognito domain prefix `aws-study-hub-auth` is taken, pass another:
`npx cdk deploy -c cognitoDomainPrefix=<something-unique>`.

## Smoke test after deploy

```bash
curl <ApiUrl>/v1/health          # → {"ok":true,...}
curl <ApiUrl>/v1/me              # → 401 (authorizer works)
```

## Phase plan

1. **This stack** — Cognito + DynamoDB + API skeleton. ✅
2. **Auth swap** — replace `sharedAuth.js` with Cognito in the three apps;
   custom auth domain; **Google federation** (owner creates the Google
   OAuth client in Google Cloud console and adds the IdP — the client
   secret must not go in this repo); JIT user migration from Firebase.
3. **Data + billing** — Firestore→DynamoDB progress migration; port the
   three Stripe functions to Lambda (webhook writes ENTITLEMENTS items).
   Per-cert $10.99/mo products map to `certs: ['cloud-practitioner', ...]`.
4. **Content API + paywall** — question banks into DynamoDB, served per
   entitlement; first quiz free for any signed-in user.
5. **Cutover** — decommission Firebase.
