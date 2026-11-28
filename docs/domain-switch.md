# Switch to levelupstudyhub.com only

Living tracker for making `levelupstudyhub.com` the only public name of Level Up Study Hub, with every old `aws-study-flashcards-app.com` host sending a 301 to the same path on the new host.

- **Public write-up (EN/ES, no IDs):** the "Domain Switch Playbook" page. Update its step status when this file changes.
- **How to update this file:** when a step or question is done, tick it, add the date and what was seen, and move the answer into the step that needed it.

Legend: `[ ]` to do · `[x]` done · **Code** = a pull request in this repo · **Owner** = AWS console/CLI or a third-party dashboard.

## Why the old name still works

On purpose. One build is served under both names during the move (see CLAUDE.md, "Session cookie" and "Links between the sites"). Each name keeps its own sign-in. Nothing redirects the old hosts yet, and the URL that `deploy.sh` prints at the end is fixed text, not a check (since step 2 it prints the new names).

## Three rules behind the order

1. **Add the new name before removing the old one.** Cognito callbacks, API CORS, Stripe return URLs and email links must accept the new name before anything redirects.
2. **302 first, then 301.** Browsers cache a 301 for good, so test every host with a temporary 302.
3. **Keep the old domain.** Its DNS zone, certificates and registration serve the 301 forever. Never redirect `auth.aws-study-flashcards-app.com`: Google sign-in runs through it.

## Status

| # | Step | Who | State |
|---|---|---|---|
| 1 | Read-only pre-flight of the live AWS setup | Owner | [ ] in progress (10 of 11 answered; the last one, the Google OAuth app status, only matters for step 4) |
| 2 | `deploy.sh` prints the new names and invalidates both distributions | Code | [x] 2026-11-27 (in effect from the next deploy) |
| 3 | Backend fallback, email links, UTM matching; `cdk deploy` | Code + Owner | [ ] code done 2026-11-27; waiting for the owner's `cdk deploy` |
| 4 | Stripe, Google, Search Console, GA4 settings | Owner | [ ] |
| 5 | Canonical, og, sitemap, robots, llms, JSON-LD, share and course URLs | Code + Owner | [ ] code done 2026-11-27; waiting for the deploys and the redrawn share images |
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
  - **`deploy.sh` only invalidates the old-name distributions.** Non-hashed files (`robots.txt`, `sitemap.xml`, `terms.html`, share images) are uploaded with a one-year `Cache-Control`. A live check on 2026-11-26 found the same files on both hub names (same ETag; the new distribution answered `RefreshHit`, so it revalidates today), but nothing guaranteed it. Fixed 2026-11-27 (step 2): every deploy now invalidates both.
  - **`ED9BTUZG465V` has no alias** and uses the old apex certificate. It serves no name; find out what it was (probably an earlier hub) before deciding to disable it. Not part of this plan.
- [x] **Where the existing `www.levelupstudyhub.com` → apex function lives.** Answered 2026-11-27 by inference: only the new hub distribution `EQQAL9UJ4QD8M` has the `www.levelupstudyhub.com` alias, and that host answers `301` with `x-cache: FunctionGeneratedResponse`, so the function sits on a **new-name** distribution. The old-host function goes on old-name distributions only, so the two never share a cache behavior and nothing has to merge. One thing left for step 8, when the owner is in AWS anyway: confirm no old-name distribution already has a viewer-request function (`aws cloudfront list-functions`, then each distribution's behaviors).
- [x] **The deployed Cognito web client lists the new callbacks.** Answered 2026-11-26 (`describe-user-pool-client` on client `8att6q0026f6sb44qn4il7tu8`): it lists `/` and `/next/` for `levelupstudyhub.com` and its `cloud.`, `ai.`, `architect.`, `developer.`, `bash.`, `python.`, `js.` and `typescript.` subdomains, next to every old-name entry (including `saa.` and `dva.`) and `localhost:5173-5175`. Google sign-in on the new names is ready. Tutorials uses a different client (`tutorials-nicotek`), checked separately below.
- [x] **The HTTP API CORS allows the new origins.** Answered 2026-11-27 from the cloud session with CORS preflights (`OPTIONS /v1/me` with an `Origin` header): the API answers `access-control-allow-origin` for `levelupstudyhub.com` and all eight new subdomains, still for the old hub, and not for a foreign origin. No AWS access needed.
- [x] **Every new host answers 200.** Answered 2026-11-27 from the cloud session: the apex, `cloud.`, `ai.`, `architect.`, `developer.`, `bash.`, `python.`, `js.` and `typescript.levelupstudyhub.com` return 200 and serve the **same bundle** as their old-name twin (e.g. hub `index-Cr3BZU_t.js` on both). `tutorials.` returns 302 to its Cognito login, as expected.
- [x] **Tutorials on the new name.** Answered 2026-11-27: `tutorials.levelupstudyhub.com` exists, its Lambda@Edge sends visitors to the `tutorials-nicotek` login with `redirect_uri=https://tutorials.levelupstudyhub.com/callback`, and the owner's browser shows the Cognito sign-in form for that address (Cognito shows an error page instead when a callback isn't registered), so the callback is registered. For step 8: the old tutorials host gets its redirect inside `~/dev/aws/tutorials-site/edge/index.mjs`, not in the CloudFront Function, because its viewer-request slot already holds that Lambda@Edge.
- [x] **Leftover aliases.** Answered 2026-11-26: `www.aws-study-flashcards-app.com` and `javascript.levelupstudyhub.com` don't exist (no distribution has them). `saa.` and `dva.` are still aliases on the Architect and Developer old-name distributions, so the function maps them to `architect.` and `developer.levelupstudyhub.com`.
- [x] **How the `javascript.` redirect is built.** Answered 2026-11-27 (live): `https://javascript.aws-study-flashcards-app.com/some/path?a=1&b=2` → `301` from `server: AmazonS3` (an S3 website redirect behind `E27Y7QTYXZD1SM`) to `https://js.aws-study-flashcards-app.com/some/path`. It **keeps the path but drops the query string**. Step 7 points it at `js.levelupstudyhub.com`; losing the query there is acceptable (nobody links to `javascript.` with tracking tags), or the old-host CloudFront Function can take over this host too and keep the query.
- [x] **Local overrides.** Answered 2026-11-27 (owner's Mac, repo root): `grep -n "VITE_COGNITO_AUTH_URL\|VITE_API_BASE_URL" */.env*` (minus `.env.example`) prints nothing. Those are the only two build-time variables that carry a host (the others the apps read are `VITE_COGNITO_CLIENT_ID`, `VITE_BILLING_ENABLED` and the price labels), so every local build uses the defaults in `auth.config.js`.
- [ ] **Google OAuth app status.** If the app is verified, adding `levelupstudyhub.com` as an authorized domain needs the Search Console property verified first.
- [x] **http → https** on both names. Answered 2026-11-27 (owner's Mac, `curl -sI`): `http://levelupstudyhub.com/x?a=1` → `301`, `Location: https://levelupstudyhub.com/x?a=1`; `http://aws-study-flashcards-app.com/x?a=1` → `301`, `Location: https://aws-study-flashcards-app.com/x?a=1`. Same host, path and query kept (CloudFront's built-in redirect to HTTPS). So an `http://` visit to an old host will take two hops after switch day: to https on the old host, then to the new host.

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

### 2. `deploy.sh` prints the new names and invalidates both (Code) — done 2026-11-27
- `invalidate_cloudfront` clears the old-name and the new-name distribution of the site being deployed, reports a failure per distribution and fails that site's deploy (also inside `all` and `next`). The two exceptions have one distribution: Tech Spanish (old name only until `spanish.levelupstudyhub.com` exists) and the `javascript.` redirect.
- The addresses printed after a deploy and in the `all` summary are the `levelupstudyhub.com` ones. `deploy_course` takes `<course> <bucket> <distribution id> <public host> [new-name distribution id]`. `deploy_next` also clears `/next/*` on the new-name distributions, and now exits 1 whenever it prints "N failed".
- Bucket names and the old distribution IDs are unchanged. Test: `node --test scripts/deploy.test.mjs` (a pretend `aws`/`npm`; needs zsh, skips without it). CI runs it.
- First real deploy: if the `aws-cli` IAM user's policy lists distributions by ARN, it needs `cloudfront:CreateInvalidation` on the ten new-name distributions; the deploy says "CloudFront invalidation failed for <id>" if not.
- Still to add once the redirect is live: `curl -sI` checks (new host 200, old host 301).

### 3. Backend (Code + Owner `cdk deploy`) — code done 2026-11-27
- Done in code: the Stripe return fallback `SITE_URL` is `https://levelupstudyhub.com` (`aws-backend/lambda/callables/index.js`); `leads.js` links (hub, the four cert sites, the footer) use the new names; newsletter UTM tagging accepts both names and their subdomains and rejects lookalikes. Every old entry stays in `SITE_ORIGINS` and `ALLOWED_ORIGINS`. Tests: `return-url.test.js`, `checkout-guard.test.js` and the new `emails.test.js`.
- The email footer says people signed up "on Level Up Study Hub (levelupstudyhub.com)": subscribers from before the move signed up on the old address, so it names the product first.
- [ ] Owner: `cd aws-backend/lambda/callables && npm ci && cd ../.. && npx cdk deploy` with `.env` present. Nothing changes for users until this runs.
- [ ] Owner, after the deploy: `./deploy.sh newsletter` sends a preview; check the footer and that the unsubscribe link opens `https://levelupstudyhub.com/?unsubscribe=…`.

### 4. Third-party settings (Owner)
- Stripe: customer portal headline "Level Up Study Hub", default return URL `https://levelupstudyhub.com`, privacy and terms links; business website and support URL.
- Google Cloud project `aws-study-hub` (never delete it): add `levelupstudyhub.com` as an authorized domain; consent screen homepage, privacy and terms links. The OAuth redirect URI on `auth.aws-study-flashcards-app.com` stays.
- Search Console: verify a `levelupstudyhub.com` domain property.
- GA4: add the new domain; list the old one under unwanted referrals.
- nico-tek.com: link to `https://levelupstudyhub.com`.

### 5. Search and share signals (Code + Owner) — code done 2026-11-27
- Done in code, on `levelupstudyhub.com`:
  - Hub: `index.html` and `gis/index.html` tags, `vite.config.js` `SITE` (JSON-LD), `robots.txt`, `sitemap.xml` (now with `/gis/`, and agreeing with terms/privacy), `llms.txt`, the data in `certifications.js`, `courses.js` and `heroSlides.js`, the readiness share URL, the billing-portal return address.
  - Four games: `index.html` tags, `robots.txt`, `sitemap.xml`, `ShareScore.jsx`, the billing-portal return address. Shared tests `src/test/publicName.test.js` and `src/services/billing.test.js` pin them.
  - Four live courses: `meta.json` url (canonical, og, robots, sitemap), the shared `index.html` share image, `courseSites.js`, the Bash tutorial's example address.
- Left on the old name on purpose: Tech Spanish (its new-name site doesn't exist yet), link targets that are only `onThisName()` arguments (`HUB_URL`, footers, Markdown links in course text), `ROOT_DOMAINS`.
- [ ] Owner: deploy every site (`./deploy.sh all`, or one by one). After it, `curl -s https://levelupstudyhub.com/ | grep canonical` and the same on the old name both show `https://levelupstudyhub.com/`.
- [ ] Owner, share images: the nine pictures still print the old addresses at the bottom, and they are drawn with Mac fonts. On the Mac: `cd aws-study-homepage && node scripts/build-share-images.mjs` (needs Google Chrome; the script already has the new hosts), commit the PNGs, then bump `?v=4` to `?v=5` on every `og:image`/`twitter:image` tag (hub, `gis/`, four games, courses) and deploy again. Until then previews show the right link with the old address drawn on the picture.

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
