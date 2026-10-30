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
| Python for AWS (coding course) | `aws-coding-courses/` (`COURSE=python`) | python.aws-study-flashcards-app.com | `python.aws-study-flashcards-app.com` | `E205DY614C5Q4C` |
| JavaScript for AWS (coding course) | `aws-coding-courses/` (`COURSE=javascript`) | js.aws-study-flashcards-app.com (javascript. redirects here) | `js.aws-study-flashcards-app.com` | `E1JMSZCG8CKTGT` (redirect: `E27Y7QTYXZD1SM`) |
| TypeScript for AWS (coding course) | `aws-coding-courses/` (`COURSE=typescript`) | typescript.aws-study-flashcards-app.com | `typescript.aws-study-flashcards-app.com` | `E2HBJJFM265RJL` |
| Tutorials (static, Cognito-gated) | `~/dev/aws/tutorials-site/site/` | tutorials.aws-study-flashcards-app.com | `tutorials-aws-study-flashcards-app-418272768335` | `E24YKUY1M23PV0` |

Stack: Vite + React for the apps, Cognito for sign-in, DynamoDB + API Gateway/Lambda (`aws-backend/`, CDK) for profiles, progress and payments, S3 + CloudFront hosting. Firebase is fully retired (data archived in `s3://study-hub-archive-418272768335/firebase/`). AWS account `418272768335`, region `us-east-1`.

## Deploying
`./deploy.sh [all|hub|cloud|ai|saa|dva|bash|python|js|typescript|tutorials]` from repo root.
- React apps: `npm run build`, sync `dist/` (long cache), `index.html` no-cache, invalidate `/*`.
- Course sites (`bash`): `deploy_course` runs `npm test` first, then builds `COURSE=<id>` into `dist/<id>/`.
- Tutorials: no build. Uploads `site/index.html` plus every `site/<slug>/index.html`.
- Newsletter: `./deploy.sh newsletter` uploads `newsletter/issues/*.md` and emails Nico a preview of the next issue. Issues go out Tuesdays 9:00 Eastern to everyone on the email list (`LEAD#<email>` items). See `newsletter/README.md`.
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
- One React app (the tutorial engine) built once per course site: `src/courses/<id>/` holds the content (`meta.json` + `index.js` + `tutorials/*.js`), `src/shared/startHere.js` is the free setup tutorial every course shows. All four are live: bash., python., js., typescript. (javascript. redirects to js.; never other short forms like sh. or ts.).
- The practice terminal is our own Bash subset in `src/engine/shell/` (parser, interpreter, commands, awk, a pretend AWS account). Nothing runs on a server. If a tutorial needs a command it lacks, add it there plus a test in `shell.test.js`.
- Python steps (`runtime: 'python'`) run real Python 3.13 in the browser through Pyodide, in a Web Worker (`src/engine/python/`). The page loads Pyodide from jsDelivr; the tests load the same version from npm. Bump `PYODIDE_VERSION` in `runtime.js` and the exact `pyodide` version in package.json together.
  - `practice_aws.py` is a pretend boto3 (STS, EC2, S3, SNS, the DynamoDB table resource) with real response shapes, error classes and parameter checks. `practice_net.py` fakes `urlopen`, sockets, `ssl` certificates and the clock. `practice_sandbox.py` runs files, console cells and Lambda-style invocations (`invoke`), and returns output, errors with plain-English tips, files and the AWS state for the checks.
  - A Python step's `check` gets `{ result, probe, probeError, files, aws, web, kind, sources }`. `probe` is Python evaluated in the learner's namespace after each run. Scenario dates are relative to today, so checks compute expectations from the same data.
  - Runs stop after 10 seconds (the worker is restarted). Add `?unlocked` to a dev URL to preview paid tutorials (dev builds only).
  - `npm run dev:python` serves the Python site locally.
- JavaScript and TypeScript steps (`src/engine/js/`, UI in `steps/JsPractice.jsx`) use `runtime: 'web'` or `runtime: 'node'`. A step is TypeScript when a file ends in `.ts` (or `lang: 'ts'` for console-only steps). `npm run dev:javascript` / `dev:typescript` serve the sites locally.
  - **web**: `files` (e.g. `app.js` first, then `index.html`, `style.css`) are built into one page in a sandboxed iframe: `<link href="style.css">` and `<script src="app.js">` are inlined, and `app.js` also finds `app.ts` (compiled). Use classic scripts: no `type="module"`, no import/export (jsdom in the tests can't run modules). The page gets a localStorage the course keeps between runs and reloads (seed it with `scenario.storage`), and a pretend `fetch` from `scenario.web` (same shape as Python: `{ url: { status, json | body, ms, hang, error: 'dns' } }`, delays run at a tenth of `ms`, AbortSignal.timeout works). The page runs once when the step opens; that automatic run can pass a task but never shows "not yet" feedback.
  - **web probe**: an async function body run after the page loads, in a hidden copy of the page built from the same files and the same starting storage (role `'probe'`; it never saves storage back), so a check's clicks never change the learner's preview or saved progress. It waits until the tab is in front (background tabs slow timers). It gets `practice` = `{ click(sel), type(sel, text), submit(sel)` (returns true if the page called preventDefault)`, key(key), text(sel), all(sel), $(sel), exists(sel), wait(ms), until(fn, ms), storage(), fetchLog, console, errors }`. Use `textContent`, not `innerText` (jsdom). Its JSON return value is `probe`.
  - **web check** gets `{ result: { console: [{ level, text }], errors: [{ text, file, line }], loaded }, probe, probeError, files, diagnostics, kind: 'run', sources }`. `console` is the visible page's; `errors` also includes errors the check's copy ran into (printed as "While checking your page: …"). `webJsdom.js` runs tests the same way, with two DOMs.
  - **Loop guard** (`loopGuard.js`): page scripts and page-console code get a guard in every while / do-while / classic for condition (`while (__practiceLoop("app.js", 12) && (x))`, no new lines). A loop that runs for 2 s without the page reaching its timers throws "Stopped a loop that ran for more than 2 seconds. Does it ever end?" at its own file and line; loops that `await` timers or fetch are never stopped. for-of / for-in and loops inside template literals aren't guarded.
  - **node**: files are ES modules run like Node.js 22 on Lambda. Imports that work: relative files (`./cards.js` also finds `cards.ts`), `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/util-dynamodb`, `@aws-sdk/client-sesv2`, `@aws-sdk/client-s3`, `@aws-sdk/client-sts`, `@aws-sdk/client-cloudfront`, `@aws-sdk/client-ec2`, `aws-cdk-lib` (+ `aws-cdk-lib/aws-*` subpaths), `constructs`, `node:process`, `node:crypto`; `import type ... from 'aws-lambda'` for event types. Anything else fails with a clear message. `process.env` comes from `scenario.env`; `fetch` from `scenario.web`. A file with `invoke: { event, handler: 'handler', timeout }` runs as a Lambda test (START/END/REPORT/Response); otherwise as a script (the run waits for timers, fetches and AWS calls to finish). Optional per file: `runLabel`, `command` (what the console echoes, e.g. `npx cdk synth`), `hidden: true` (sent to the run but no editor).
  - **node probe**: async function body with `mod` (the file's exports) and `practice` = `{ apiEvent({ method, path, body, query, pathParameters, headers, claims }), context(), aws() (snapshot), state, resetAws(aws), webLog, setSite(url, entry), cdk(), output() }`. `apiEvent` builds an API Gateway HTTP API (payload 2.0) event; `claims` adds `requestContext.authorizer.jwt.claims` as a Cognito authorizer would.
  - **node check** gets `{ result: { stdout, stderr, error: { type, message, line, file }, transcript }, invoke: { response, error }, aws, web: { log }, cdk: { stacks: { name: template } }, probe, probeError, files, diagnostics, kind: 'run' | 'cell', sources }`. `aws` = `{ dynamodb: { Table: [items] }, s3: { bucket: { key: { size, text, contentType, metadata } } }, ses: { sent: [{ from, to, subject, text, html }] }, cloudfront: { id: { invalidations } }, calls: [{ service, command, input }] }`.
  - **Pretend AWS (scenario.aws)**: `{ account, region, dynamodb: { Name: { key: ['pk', 'sk'], types: { pk: 'S' }, items } }, s3: { bucket: { key: 'text' } }, ses: { verified: ['team@example.com' or a domain], sandbox: true }, cloudfront: { distributions: ['E123'] }, ec2: { region: { instances } } }`. It behaves like SDK v3: `client.send(new XCommand(input))`, `$metadata`, errors with the real `.name` and classes (`ConditionalCheckFailedException`, `NoSuchKey`, `NotFound` from HeadObject, `MessageRejected` for unverified SES addresses, `ResourceNotFoundException`), ListObjectsV2 pages of 1,000 plus `paginateListObjectsV2`, DynamoDB expressions (conditions, `begins_with`, `BETWEEN`, `SET a = a + :n`, `if_not_exists`, `list_append`, `REMOVE`, `ADD`), the document client's "removeUndefinedValues" error, untagged EC2 instances with no `Tags` key.
  - **TypeScript**: the real compiler (TypeScript 6.0.3; 7 has no JavaScript API) runs in a worker, strict mode, ES2022 + DOM libs, with typings for the pretend SDK, CDK, `aws-lambda` and a little of Node in `src/engine/js/typings/`. Errors print like `app.ts(16,30): error TS2551: …` with a tip, the code **still runs**, and the check gets `diagnostics` (`[{ file, line, column, code, message, text }]`), so a task can require `diagnostics.length === 0`. Runtime errors are mapped back to `.ts` lines. Console lines are transpiled without checking. Bump `TS_VERSION` in `compiler.js` and the `typescript` devDependency together.
  - **CDK**: `aws-cdk-lib` is pretend but typed like the real one (App, Stack, Duration, RemovalPolicy, CfnOutput, s3.Bucket, dynamodb.Table, lambda.Function/Code/Runtime, NodejsFunction, apigatewayv2.HttpApi + HttpLambdaIntegration + HttpUserPoolAuthorizer, cognito.UserPool/UserPoolClient, iam.PolicyStatement, cloudfront.Distribution + S3BucketOrigin, s3deployment.BucketDeployment, and grants). `app.synth()` prints the CloudFormation template and the check reads it from `cdk.stacks`.
  - **Solutions**: code for the first file, or `{ path: code }` for several. The harness also runs every starter (`files[0].starter` etc.) and expects it not to pass. Runs stop after 10 s (node worker restarts); web pages are protected by the loop guard, and a page that still froze the tab isn't auto-run again after a reload.
- `courses.test.js` runs every "try" step's answer through its own check. Keep it green; `deploy_course` refuses to deploy otherwise.
- **Course access is `certs` only** (`bash-for-aws`, `python-for-aws`), never `plan: pro`: courses are not part of all-access. Progress saves to `/v1/progress/<course id>`.
- **Purchases switch on** when the course's price (`STRIPE_PRICE_BASH_COURSE`, `STRIPE_PRICE_PYTHON_COURSE`) is in `aws-backend/.env` and the backend is redeployed. Until then the unlock button says purchases open soon. A new course also needs its plan in `callables/index.js` (`PLAN_PRICES`, `ALLOWED_ORIGINS`), its ID in `api/index.js` (`CERT_IDS`), and its site in `SITE_ORIGINS` (`study-hub-stack.ts`).
- **Developer Path bundle** (`developer-path`, $59 one-time): `BUNDLES` in `callables/index.js` expands it into all four course certs plus `developer-associate` when entitlements sync.
- **Sales:** `PROMOTIONS` in `callables/index.js` applies a Stripe coupon at checkout automatically during its window (falls back to full price if the coupon fails). Display copies of the window live in `aws-coding-courses/src/services/offers.js`, `aws-study-homepage/src/services/offers.js` and each game's `src/services/offers.js`; keep them in step. Halloween 2026: `HALLOWEEN31` (31% off single courses and games) and `HALLOWEEN10` (10% off the bundle and All-Access), Oct 31–Nov 6 Eastern; the coupons expire on their own (`redeem_by`). `?promo=on` / `?promo=soon` previews banners in dev builds.
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
