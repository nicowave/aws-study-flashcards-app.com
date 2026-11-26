# Launch: Tech Spanish ↔ Tech English (spanish.)

The course site answers at **spanish.aws-study-flashcards-app.com** and **spanish.levelupstudyhub.com**, like every other site during the move. The code is ready: the backend lists the site and its plan, and `./deploy.sh spanish` deploys it. These are the steps that need your AWS and Stripe accounts, in order.

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

## 2. Sell it (Stripe + backend)

1. In Stripe (live mode), create the product **Tech Spanish ↔ Tech English** with a **one-time** price of **$19.99**.
2. Add the price to the untracked `aws-backend/.env`:
   ```
   STRIPE_PRICE_TECH_SPANISH_COURSE=price_...
   ```
3. Deploy the backend. This also adds both spanish. names to sign-in (Cognito callback URLs), CORS and checkout's return addresses:
   ```bash
   cd aws-backend && npx cdk deploy
   ```

Until this step, the site works and the free modules open, but the unlock button says purchases open soon.

## 3. The link preview image

`index.html` uses `https://aws-study-flashcards-app.com/og/tech-spanish.png`, which the hub serves. Build it (needs Google Chrome), then deploy the hub:

```bash
cd aws-study-homepage && node scripts/build-share-images.mjs && cd ..
```

```bash
./deploy.sh hub
```

## 4. Deploy the course

```bash
./deploy.sh spanish
```

It runs the course tests, builds `COURSE=tech-spanish` and uploads it.

## 5. Check it

```bash
curl -sI https://spanish.aws-study-flashcards-app.com | head -1
```

```bash
curl -sI https://spanish.levelupstudyhub.com | head -1
```

```bash
curl -s https://spanish.aws-study-flashcards-app.com/git-everyday | grep -o 'assets/index-[^"]*\.js'
```

- ✓ Both names answer `200`.
- ✓ A module's address (`/git-everyday`) returns the app, not a 404, and the bundle name matches the one in `aws-coding-courses/dist/tech-spanish/assets/`.
- ✓ In a browser: the ES | EN switch works, signing in keeps you signed in on the other study sites, and a test purchase unlocks the paid modules.

## Later (not needed to launch)

- **Link to it** from the hub (`aws-study-homepage/src/data/courses.js` lists the four Developer Path courses; Tech Spanish needs its own spot), `public/llms.txt`, and the "More courses" footers (`siblings` in each course's `index.js`).
- **Deploy the other sites** at their next regular deploy: `SITE_SUBDOMAINS` now includes `spanish`, so links to it follow the name a visitor opened.
- **Verify the pending sources** (Fundéu, RAE, Microsoft) listed at the end of `content/tech-spanish/GLOSSARY.md`.
