# Switch to levelupstudyhub.com only

Living tracker for making `levelupstudyhub.com` the only public name of Level Up Study Hub, with every old `aws-study-flashcards-app.com` host sending a 301 to the same path on the new host.

- **Public write-up (EN/ES, no IDs):** the "Domain Switch Playbook" page. Update its step status when this file changes.
- **How to update this file:** when a step or question is done, tick it, add the date and what was seen, and move the answer into the step that needed it.

Legend: `[ ]` to do · `[x]` done · **Code** = a pull request in this repo · **Owner** = AWS console/CLI or a third-party dashboard.

## Why the old name still works

On purpose. One build is served under both names during the move (see CLAUDE.md, "Session cookie" and "Links between the sites"). Each name keeps its own sign-in. Nothing redirects the old hosts yet, and the URL that `deploy.sh` prints at the end is hard-coded text (`deploy.sh:160` and the summary at `:632-641`), not a check.

## Three rules behind the order

1. **Add the new name before removing the old one.** Cognito callbacks, API CORS, Stripe return URLs and email links must accept the new name before anything redirects.
2. **302 first, then 301.** Browsers cache a 301 for good, so test every host with a temporary 302.
3. **Keep the old domain.** Its DNS zone, certificates and registration serve the 301 forever. Never redirect `auth.aws-study-flashcards-app.com`: Google sign-in runs through it.

## Status

| # | Step | Who | State |
|---|---|---|---|
| 1 | Read-only pre-flight of the live AWS setup | Owner | [ ] in progress (2 of 11 answered) |
| 2 | `deploy.sh` prints the new names | Code | [ ] |
| 3 | Backend fallback, email links, UTM matching; `cdk deploy` | Code + Owner | [ ] |
| 4 | Stripe, Google, Search Console, GA4 settings | Owner | [ ] |
| 5 | Canonical, og, sitemap, robots, llms, JSON-LD, share and course URLs | Code | [ ] |
| 6 | "We moved, sign in again" banner (or a handoff) | Code | [ ] decision pending |
| 7 | `javascript.` redirect points straight at `js.levelupstudyhub.com` | Owner | [ ] |
| 8 | Old-host CloudFront Function, as a 302 | Code (source) + Owner (publish) | [ ] |
| 9 | Switch the function to 301 | Owner | [ ] |
| 10 | Search Console sitemaps + Change of Address | Owner | [ ] |
| 11 | Docs, privacy/terms text, stale config files | Code | [ ] |
| 12 | After 30+ days: trim old origins from `SITE_ORIGINS` / `ALLOWED_ORIGINS` | Code + Owner | [ ] |
| 13 | Separate project: move sign-in to `auth.levelupstudyhub.com` | Code + Owner | [ ] |

## What is missing before switch day

These block step 8. Each has the read-only check that answers it; run them on the Mac with the DEFAULT profile.

- [x] **Which CloudFront distributions serve which names.** Answered 2026-11-26 (`aws cloudfront list-distributions`). **Each name has its own distribution**, so the old-host function goes only on the old-name ones and cannot loop:

  | Site | Old-name distribution (gets the redirect) | New-name distribution (keeps serving) |
  |---|---|---|
  | Hub | `E3D126UT3L72OL` (aws-study-flashcards-app.com; apex-only cert) | `EQQAL9UJ4QD8M` (levelupstudyhub.com + www.) |
  | Cloud Practitioner | `E6NUXKK8FTCR1` | `EDFO69NOBW3ND` |
  | AI Practitioner | `E23TPCWLVKFC65` | `E10Z4YFFKV0730` |
  | Solutions Architect | `EBOXWN6EUZHKF` (saa. + architect.) | `E2QGETZVAOUTUY` |
  | Developer | `E2UB744W5YUCTW` (dva. + developer.) | `E1AE85QV25KDPD` |
  | Bash | `EYR8XH2CLI1DT` | `E1GVBB47Y9R725` |
  | Python | `E205DY614C5Q4C` | `E3M8Y7JMGKWB6T` |
  | JavaScript | `E1JMSZCG8CKTGT` (js.); `E27Y7QTYXZD1SM` (javascript. redirect) | `E8AUAQW0X05X2` (js.) |
  | TypeScript | `E2HBJJFM265RJL` | `EYRAVLUIZ7XC4` |
  | Tutorials | `E24YKUY1M23PV0` | `E3F0ZP2LBB09SZ` |

  Old-name subdomains use the wildcard certificate `…/9c5abd7d…`, the old apex its own; every new-name distribution uses one certificate `…/57ec786c…` (covers `levelupstudyhub.com` and `*.levelupstudyhub.com`). Keep all of them.
  - **`deploy.sh` only invalidates the old-name distributions.** Non-hashed files (`robots.txt`, `sitemap.xml`, `terms.html`, share images) are uploaded with a one-year `Cache-Control`. A live check on 2026-11-26 found the same files on both hub names (same ETag; the new distribution answered `RefreshHit`, so it revalidates today), but nothing guarantees it. Step 2 adds the new IDs to every invalidation.
  - **`ED9BTUZG465V` has no alias** and uses the old apex certificate. It serves no name; find out what it was (probably an earlier hub) before deciding to disable it. Not part of this plan.
- [ ] **Where the existing `www.levelupstudyhub.com` → apex function lives.** A cache behavior holds one viewer-request function, so the old-host logic may have to merge into it.
  ```bash
  aws cloudfront list-functions --query "FunctionList.Items[].{name:Name,stage:FunctionMetadata.Stage}" --output table
  ```
- [ ] **The deployed Cognito web client lists the new callbacks** (`https://*.levelupstudyhub.com/` and `/next/`). Code has them (`aws-backend/lib/study-hub-stack.ts:35-43`, `:230-234`); the deploy is unverified.
  ```bash
  aws cognito-idp list-user-pools --max-results 20 --query "UserPools[].[Id,Name]" --output table
  ```
  ```bash
  aws cognito-idp describe-user-pool-client --user-pool-id POOL_ID --client-id 8att6q0026f6sb44qn4il7tu8 --query "UserPoolClient.CallbackURLs"
  ```
- [ ] **The HTTP API CORS allows the new origins** (`study-hub-stack.ts:258`).
  ```bash
  aws apigatewayv2 get-api --api-id vaj7alg0f6 --query "CorsConfiguration.AllowOrigins"
  ```
- [ ] **Every new host answers 200.** From this cloud session only the apex and `cloud.` could be reached.
  ```bash
  for h in "" cloud. ai. architect. developer. bash. python. js. typescript. tutorials.; do printf '%-14s ' "${h:-apex}"; curl -s -o /dev/null -w '%{http_code}\n' "https://${h}levelupstudyhub.com/"; done
  ```
- [ ] **Tutorials on the new name.** `tutorials.levelupstudyhub.com` exists and is a callback in the `tutorials-nicotek` Cognito client. Its viewer-request slot is the Lambda@Edge auth function, so its redirect goes inside `~/dev/aws/tutorials-site/edge/index.mjs`, not in the CloudFront Function.
- [x] **Leftover aliases.** Answered 2026-11-26: `www.aws-study-flashcards-app.com` and `javascript.levelupstudyhub.com` don't exist (no distribution has them). `saa.` and `dva.` are still aliases on the Architect and Developer old-name distributions, so the function maps them to `architect.` and `developer.levelupstudyhub.com`.
- [ ] **How the `javascript.` redirect is built.** Check whether its bucket uses `RedirectAllRequestsTo` and whether path and query survive.
  ```bash
  aws s3api get-bucket-website --bucket javascript.aws-study-flashcards-app.com
  ```
- [ ] **Local overrides.** Do the Mac's `.env` files set `VITE_COGNITO_AUTH_URL` or other host overrides? Only `.env.example` is in the repo.
- [ ] **Google OAuth app status.** If the app is verified, adding `levelupstudyhub.com` as an authorized domain needs the Search Console property verified first.
- [ ] **http → https** on both names (expect a redirect to https).

## Owner decisions

- [ ] **Sessions across the move.** Plain 301 plus a "we moved, sign in again" banner (recommended: simple, nothing new to secure), or a one-time handoff page that carries the session and local-only data (needs new backend code). A plain 301 can't carry localStorage: guest progress, local flashcard/exam history, course editor code and the analytics opt-out stay on the old origin.
- [ ] **When to move `auth.`** Recommended: later, in its own short window (step 13). A user pool has one custom domain, so Google sign-in pauses while it is replaced.
- [ ] **Email sender.** Keep `nico@nico-tek.com`, or move to a `levelupstudyhub.com` address (needs SES domain verification). Not required for the switch.

## Already known

- 2026-11-25: the hub deploy (bundle `index-Cr3BZU_t.js`) is live and identical on both names.
- 2026-11-25: `www.levelupstudyhub.com` already 301s to the apex with path and query kept (a CloudFront Function not in the repo).
- 2026-11-25: the backend code already allows the new names in `SITE_ORIGINS` (`study-hub-stack.ts:35-43`) and `ALLOWED_ORIGINS` (`callables/index.js:42-50`). The Stripe webhook points at the API Gateway URL, so the domain change doesn't touch it.
- 2026-11-25, Stripe (read-only key): the customer portal still says **"AWS Study Hub"**, its default return URL is the old hub, and it has no privacy or terms links. Fix in Dashboard → Settings → Billing → Customer portal (step 4). The account's business name and statement descriptor say Nico Tek Solutions, which is correct. A second webhook points at a different API; confirm it isn't part of the Study Hub.

## Step details

### 1. Pre-flight (Owner, no changes)
Answer every item under "What is missing" above. **Done when** there is a host → distribution → certificate table here, every new host returns 200, and the Cognito client and API CORS list the new names.

### 2. `deploy.sh` prints the new names and invalidates both (Code)
Every deploy also invalidates the new-name distribution of the same site (IDs in the table above). Change the echo lines: `:160`, `:229`, `:298`, `:367`, `:436`, `:527` (tutorials, after step 1 confirms it), and the summary `:632-641`. `deploy_course` (`:479`) gets a public-host argument instead of echoing `https://${bucket}`; `deploy_next` (`:537-541`) changes only its host field. Bucket names and distribution IDs stay. Add `curl -sI` checks once the redirect is live.

### 3. Backend (Code + Owner `cdk deploy`)
- `SITE_URL` → `https://levelupstudyhub.com` (`aws-backend/lambda/callables/index.js:27`) and its tests (`return-url.test.js`, `checkout-guard.test.js`).
- `leads.js`: `HUB` (`:20`), `CERTS` (`:24-30`), `FOOTER_NOTE` (`:43`) to the new name.
- `newsletter.js:61`: UTM matching accepts both names.
- Keep every old entry in `SITE_ORIGINS` and `ALLOWED_ORIGINS`.
- Owner: `cd aws-backend/lambda/callables && npm ci && cd ../.. && npx cdk deploy` with `.env` present.

### 4. Third-party settings (Owner)
- Stripe: customer portal headline "Level Up Study Hub", default return URL `https://levelupstudyhub.com`, privacy and terms links; business website and support URL.
- Google Cloud project `aws-study-hub` (never delete it): add `levelupstudyhub.com` as an authorized domain; consent screen homepage, privacy and terms links. The OAuth redirect URI on `auth.aws-study-flashcards-app.com` stays.
- Search Console: verify a `levelupstudyhub.com` domain property.
- GA4: add the new domain; list the old one under unwanted referrals.
- nico-tek.com: link to `https://levelupstudyhub.com`.

### 5. Search and share signals (Code)
Hub `index.html`, `vite.config.js` (`SITE`), `public/robots.txt`, `sitemap.xml` (also fix terms/privacy, which are already canonical on the new name, and add `/gis/`), `llms.txt`, data in `certifications.js`, `courses.js`, `heroSlides.js`, `ReadinessCheck.jsx` share URL; each game's `index.html`, `robots.txt`, `sitemap.xml`, `ShareScore.jsx`; each course's `meta.json` url and `aws-coding-courses/index.html`; share images (`scripts/build-share-images.mjs`, rerun on the Mac). Keep `aws-study-flashcards-app.com` in `ROOT_DOMAINS`. Run every app's tests, then deploy all.

### 6. Banner or handoff (Code, after the decision)
Banner on the new name only: "We moved to levelupstudyhub.com. Sign in again; your purchases and synced progress are kept." Remove it 30 days after step 9.

### 7. `javascript.` redirect (Owner)
Point it straight at `https://js.levelupstudyhub.com`, then invalidate its distribution. One hop, path and query kept.

### 8. Old-host function, 302 (Code drafts, Owner publishes)
CloudFront Function, viewer-request: if the host ends in `aws-study-flashcards-app.com`, redirect to the mapped new host with the same URI and query (apex → apex, `www.` → apex, `saa.` → `architect.`, `dva.` → `developer.`, `javascript.` → `js.`, other site subdomains → same name); pass every other host through. Attach it only to old-name distributions from step 1, on every cache behavior. Never touch `auth.`. Tutorials: add the same check at the top of its Lambda@Edge auth function. The source gets committed to this repo.
**Done when** every old host returns 302 to the right new host with path and query kept (test an unsubscribe link and `?checkout=success`), new hosts still return 200, and Google sign-in works on the new name.

### 9. 301 (Owner)
After a short soak with no loops, change the status to 301 and publish. Keep the old aliases, certificates (with their DNS validation records), the Route 53 zone and the registration.

### 10. Search engines (Owner)
Submit the new sitemaps, then run Change of Address from the old property to the new one. Same in Bing if used.

### 11. Docs and leftovers (Code)
CLAUDE.md Apps table and the "Links between the sites" note, privacy and terms text, READMEs, `docs/marketing.md`, newsletter README and example issue, the legacy per-app `deploy.sh` files, stale `cf-config.json` / `cf-update.json` in the Cloud Practitioner app (applying `cf-update.json` would remove the new alias), `scripts/stripe-go-live.mjs`. New sites launch on the new name only.

### 12. Trim allowlists (after 30+ days)
Remove the old entries from `SITE_ORIGINS` and `ALLOWED_ORIGINS` and their tests, then `cdk deploy`. Keep `ROOT_DOMAINS` and everything about `auth.`.

### 13. Move sign-in (separate project)
ACM cert for `auth.levelupstudyhub.com` in us-east-1; add its `/oauth2/idpresponse` to the Google OAuth client (keep the old one); change the Cognito custom domain in `study-hub-stack.ts:176-197`; change `COGNITO_AUTH_URL` in all seven `auth.config.js` copies and redeploy every site in the same window.

## Rollback

Before the 301: detach the function; the old names serve pages again right away. After the 301: detaching stops new redirects, and browsers that cached it keep landing on the new name, which serves the same build. Code steps are ordinary commits: revert and redeploy.
