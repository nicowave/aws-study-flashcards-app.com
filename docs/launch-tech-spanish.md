# Launch: Tech Spanish ↔ Tech English (spanish.)

The course site answers at **spanish.aws-study-flashcards-app.com**. The code is ready: the backend lists the site and its plan (under both names), `./deploy.sh spanish` deploys it, and the hub and the course footers already show it as "coming soon". These are the steps that need your AWS and Stripe accounts, in order.

Run everything from the repo root on your Mac, with the **default** AWS profile.

## 1. Create the site (S3, CloudFront, DNS)

`scripts/create-course-site.mjs` copies the live TypeScript site: the bucket settings, the CloudFront distribution (certificate, cache policy, error pages) and the Route 53 records, under both names. Without `--apply` it only prints the plan.

```bash
node scripts/create-course-site.mjs --from typescript --to spanish
```

Read the plan. If it stops at **"No issued certificate covers…"**, it prints the `aws acm request-certificate` command. Run it, add the DNS validation records it asks for, wait for `ISSUED`, then plan again. When the plan looks right:

```bash
node scripts/create-course-site.mjs --from typescript --to spanish --apply
```

It prints the new CloudFront id. Put it in `deploy.sh` (`SPANISH_DIST_ID="E…"`). Until you do, `deploy.sh` looks the id up by the site's name. A new distribution takes a few minutes to reach "Deployed".

If it reports **"No Route 53 record to copy"** for a name, that domain's DNS lives somewhere else. Point the name at the CloudFront domain it prints.

**Only the old name for now.** The TypeScript distribution answers to `typescript.aws-study-flashcards-app.com` only (the new names live elsewhere; see `docs/domain-switch.md`), so the copy answers to `spanish.aws-study-flashcards-app.com` only. That's fine: `spanish` is deliberately **not** in `SITE_SUBDOMAINS`, so links to it stay on the old name even on levelupstudyhub.com pages. When `spanish.levelupstudyhub.com` exists (built the same way as the other new names), add `'spanish'` to `SITE_SUBDOMAINS` in every `src/config/auth.config.js` (the file is identical in all 7 apps).

## 2. Sell it (Stripe + backend)

1. In Stripe (live mode), create the product **Tech Spanish ↔ Tech English** with a **one-time** price of **$19.99**.
2. Add the price to the untracked `aws-backend/.env`:
   ```
   STRIPE_PRICE_TECH_SPANISH_COURSE=price_...
   ```
3. Deploy the backend. This also adds both spanish. names to sign-in (Cognito callback URLs), CORS and checkout's return addresses:
   ```bash
   (cd aws-backend && npx cdk deploy)
   ```

Until this step, the site works and the free modules open, but the unlock button says purchases open soon.

## 3. The link preview image

`index.html` uses `https://aws-study-flashcards-app.com/og/tech-spanish.png`, which the hub serves. Build it (needs Google Chrome), then deploy the hub:

```bash
(cd aws-study-homepage && node scripts/build-share-images.mjs)
```

```bash
./deploy.sh hub
```

## 4. Deploy the course

```bash
./deploy.sh spanish
```

It runs the course tests, builds `COURSE=tech-spanish` and uploads it.

## 5. Show it

Switch the course from "coming soon" to a link, then deploy the hub and the course sites:

- `aws-study-homepage/src/data/courses.js`: `OTHER_COURSES` → Tech Spanish → `live: true` (hub card, hub footer, search-engine and crawler copy).
- `aws-coding-courses/src/shared/courseSites.js`: Tech Spanish → `live: true` (the "More courses" footer on every course site).
- `aws-study-homepage/public/llms.txt`: add under "Coding courses":
  ```
  - [Tech Spanish ↔ Tech English](https://spanish.aws-study-flashcards-app.com/): software, DevOps and AWS vocabulary in Spanish and English, with the right register for documents, the team and slang. Not part of the Developer Path bundle.
  ```

```bash
./deploy.sh hub
```

```bash
./deploy.sh all
```

## 6. Check it

```bash
curl -sI https://spanish.aws-study-flashcards-app.com | head -1
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://spanish.aws-study-flashcards-app.com/git-everyday
```

```bash
curl -s https://spanish.aws-study-flashcards-app.com/git-everyday | grep -o 'assets/index-[^"]*\.js'
```

- ✓ The site answers `200` (the levelupstudyhub.com name comes later, see step 1).
- ✓ A module's address (`/git-everyday`) answers `200` (not `404`), and its page names the same bundle as `aws-coding-courses/dist/tech-spanish/assets/`.
- ✓ In a browser: the ES | EN switch works, signing in keeps you signed in on the other study sites, and a test purchase unlocks the paid modules.

## Later (not needed to launch)

- **spanish.levelupstudyhub.com**, then `'spanish'` in `SITE_SUBDOMAINS` (step 1).
- **Verify the pending sources** (Fundéu, RAE, Microsoft) listed at the end of `content/tech-spanish/GLOSSARY.md`.
