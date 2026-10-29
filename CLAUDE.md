# AWS Study Hub — CLAUDE.md

Multi-app AWS certification study platform. Owner: Nico (Nico Tek Solutions).
Keep answers direct, no fluff.

## Where things live
- Repo root (this dir): `~/dev/sites/my-sites/aws-study-flashcards.com/`
  - GitHub: `nicowave/aws-study-flashcards-app.com` (branch `main`)
  - Stale copy exists at `~/Downloads/dev/sites/aws-study-flashcards/` — ignore it, don't edit it.
- Tutorials site is NOT in this repo: `~/dev/aws/tutorials-site/` (no git; contains secrets, see below)

## Apps
| App | Folder | URL | S3 bucket | CloudFront |
|---|---|---|---|---|
| Hub homepage | `aws-study-homepage/` | aws-study-flashcards-app.com | `aws-study-flashcards-app-home` | `E3D126UT3L72OL` |
| Cloud Practitioner (CLF-C02) | `aws-cloud-practitioner-game/` | cloud.aws-study-flashcards-app.com | `cloud.aws-study-flashcards-app.com` | `E6NUXKK8FTCR1` |
| AI Practitioner (AIF-C01) | `aws-ai-study-game/` | ai.aws-study-flashcards-app.com | `ai.aws-study-flashcards-app.com` | `E23TPCWLVKFC65` |
| Solutions Architect (SAA-C03) | `aws-saa-study-game/` | architect.aws-study-flashcards-app.com (old: saa.) | `saa.aws-study-flashcards-app.com` | `EBOXWN6EUZHKF` |
| Developer Associate (DVA-C02) | `aws-dva-study-game/` | developer.aws-study-flashcards-app.com (old: dva.) | `dva.aws-study-flashcards-app.com` | `E2UB744W5YUCTW` |
| Bash for AWS (coding course) | `aws-coding-courses/` (`COURSE=bash`) | bash.aws-study-flashcards-app.com | `bash.aws-study-flashcards-app.com` | `EYR8XH2CLI1DT` |
| Tutorials (static, Cognito-gated) | `~/dev/aws/tutorials-site/site/` | tutorials.aws-study-flashcards-app.com | `tutorials-aws-study-flashcards-app-418272768335` | `E24YKUY1M23PV0` |

Stack: Vite + React for the apps, Cognito for sign-in, DynamoDB + API Gateway/Lambda (`aws-backend/`, CDK) for profiles, progress and payments, S3 + CloudFront hosting. Firebase is fully retired (data archived in `s3://study-hub-archive-418272768335/firebase/`). AWS account `418272768335`, region `us-east-1`.

## Deploying
`./deploy.sh [all|hub|cloud|ai|saa|dva|bash|tutorials]` from repo root.
- React apps: `npm run build`, sync `dist/` (long cache), `index.html` no-cache, invalidate `/*`.
- Course sites (`bash`): `deploy_course` runs `npm test` first, then builds `COURSE=<id>` into `dist/<id>/`.
- Tutorials: no build. Uploads `site/index.html` plus every `site/<slug>/index.html`.
- Verify a deploy: `curl` the page and check the bundle hash changed. Tutorials returns a 302 to Cognito for unauthenticated requests — that's expected, not a failure.

## AWS CLI
- Use the DEFAULT profile (IAM user `aws-cli`).
- The `nico-aws` profile has invalid credentials. Don't use it until the keys are rotated.

## Gotchas that have bitten us
- **Don't delete the Google Cloud project `aws-study-hub` (number 134626511244).** Firebase in it is emptied, but it holds the OAuth client behind "Sign in with Google" (secret `study-hub/google-oauth`). Deleting it breaks Google sign-in for most users.
- **Stripe price IDs** live in the untracked `aws-backend/.env` (`STRIPE_PRICE_*`). `cdk deploy` refuses to run without it; copy it from the main checkout into a worktree.
- **Sign-in:** `src/services/awsAuth.js` and `sharedAuth.js` are identical across all the apps, `aws-coding-courses` included. Change one, copy to all. Old Firebase users keep their uid through the `GOOGLE#`/`EMAIL#` links in DynamoDB (pre-token Lambda).
- **Answer field names differ on purpose:** Cloud Practitioner data uses `correctAnswer`, AI Game uses `correct`. Each app uses its own. Don't "fix" this.
- **Flashcard module API:** cards are `{id, front, back, hint, tags, difficulty}`. Both games use the helpers `getAllDecks`, `getDeckById`, `getAllTags`, `getExamTrapCards`, and the AI game also has `getExamSimulationCards()`. New content ships as drop-in data modules, with data kept separate from UI.
- **`HUB_URL` in each game's `App.jsx`** must point to `https://aws-study-flashcards-app.com`.
- **Tutorials clean URLs:** the bucket is private (OAC, REST origin), so CloudFront won't map `/slug` to `/slug/index.html`. `deploy.sh` uploads each page twice: `slug/index.html` and a bare `slug` key with `Content-Type: text/html`. Keep doing that.

## Coding courses (`aws-coding-courses/`)
- One React app (the tutorial engine) built once per course site: `src/courses/<id>/` holds the content (`meta.json` + `index.js` + `tutorials/*.js`), `src/shared/startHere.js` is the free setup tutorial every course shows. Plan: bash. (live), python., js., typescript.; never short forms like sh. or ts.
- The practice terminal is our own Bash subset in `src/engine/shell/` (parser, interpreter, commands, awk, a pretend AWS account). Nothing runs on a server. If a tutorial needs a command it lacks, add it there plus a test in `shell.test.js`.
- `courses.test.js` runs every "try" step's answer through its own check. Keep it green; `deploy_course` refuses to deploy otherwise.
- **Course access is `certs` only** (`bash-for-aws`), never `plan: pro`: courses are not part of all-access. Progress saves to `/v1/progress/bash-for-aws`.
- **Purchases switch on** when `STRIPE_PRICE_BASH_COURSE` is in `aws-backend/.env` and the backend is redeployed. Until then the unlock button says purchases open soon.
- Paid lesson text ships in the public bundle (same as the games' premium content). Fine for now; serve paid tutorials from the API if leaking becomes a problem.

## Tutorials site
- Auth: the Lambda@Edge function `tutorials-edge-auth` (viewer-request) redirects to the Cognito Hosted UI (`tutorials-nicotek`, user pool `us-east-1_56zx8ifeC`). Full details, including how to add users, are in `~/dev/aws/tutorials-site/README.md`.
- `edge/index.mjs` has the Cognito client secret baked in, and `.credentials` is there too. Never commit or copy that dir into a public repo.
- Pages are single self-contained HTML files. To add a tutorial, create `site/<slug>/index.html`, link it from the header in `site/index.html`, then run `./deploy.sh tutorials`.
- Current pages: `/` (.NET & ASP.NET Core crash course), `/python-training` (Python quiz: beginner, intermediate, and advanced, 10 questions each).

## Open work
- Integrate the AIF-C01 modules into `aws-ai-study-game/src/data/flashcards/`, then confirm with `tree -L 3 src/`.
- Integrate the Study Activities Hub (`aws-study-hub.jsx`: Scenario Lab, Service Sort, Speed Round, Match Up) into the Cloud Practitioner app.
- Unit tests for every component across all three React apps.
