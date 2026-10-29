// Tutorial 4: publish a static website to S3 + CloudFront with one command.

const STAGING = { bucket: 'marketing-site-staging', distribution: 'E2STAGE7XQ4LM', url: 'https://staging.example.com' };
const PRODUCTION = { bucket: 'marketing-site-prod', distribution: 'E1PROD9KD3VZT', url: 'https://www.example.com' };

const SITE = {
  'site/index.html': '<!doctype html>\n<link rel="stylesheet" href="/assets/style-81b0d4.css">\n<h1>Spring sale</h1>\n<script src="/assets/app-3f9c2a.js"></script>\n',
  'site/about.html': '<!doctype html>\n<h1>About us</h1>\n',
  'site/assets/app-3f9c2a.js': 'console.log("v2");\n',
  'site/assets/style-81b0d4.css': 'h1 { color: tomato; }\n',
  'site/images/logo.png': 'PNG-IMAGE-DATA',
};
const SITE_KEYS = Object.keys(SITE).map((k) => k.replace(/^site\//, '')).sort();

const scenario = () => ({
  hostname: 'build-server',
  now: '2026-10-29T15:00:00Z',
  files: SITE,
  aws: {
    buckets: {
      [STAGING.bucket]: { 'index.html': '<h1>Winter sale</h1>', 'old-promo.html': '<h1>Old</h1>', 'assets/app-1a2b3c.js': 'console.log("v1")' },
      [PRODUCTION.bucket]: { 'index.html': '<h1>Winter sale</h1>', 'assets/app-1a2b3c.js': 'console.log("v1")' },
    },
    distributions: {
      [STAGING.distribution]: { aliases: ['staging.example.com'] },
      [PRODUCTION.distribution]: { aliases: ['www.example.com'] },
    },
    secrets: {
      'deploy/staging': JSON.stringify(STAGING),
      'deploy/production': JSON.stringify(PRODUCTION),
    },
  },
});

export const DEPLOY_STARTER = `#!/bin/bash
# deploy.sh: publish the website to S3 and clear the CloudFront cache.
# Usage: ./deploy.sh staging|production
set -euo pipefail

ENVIRONMENT="\${1:-}"
SITE_DIR="site"
LONG_CACHE="max-age=31536000,public"

usage() {
  echo "Usage: $0 staging|production" >&2
  exit 2
}

# 1. Check the input before touching anything
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  usage
fi
if [ ! -f "$SITE_DIR/index.html" ]; then
  echo "No $SITE_DIR/index.html: build the site first" >&2
  exit 1
fi

# 2. Settings come from Secrets Manager, never from the script
config=$(aws secretsmanager get-secret-value --secret-id "deploy/$ENVIRONMENT" --query SecretString --output text)
BUCKET=$(echo "$config" | jq -r .bucket)
DISTRIBUTION=$(echo "$config" | jq -r .distribution)
URL=$(echo "$config" | jq -r .url)

echo "Deploying $SITE_DIR to $ENVIRONMENT (s3://$BUCKET)"

# 3. Upload
# TODO: sync everything except index.html, cached for a year, deleting old files
# TODO: upload index.html with --cache-control "no-cache"

# 4. Clear the CDN cache
# TODO: invalidate "/*" on $DISTRIBUTION and print the invalidation ID

echo "Live at $URL"
`;

export const DEPLOY_SOLUTION = `#!/bin/bash
# deploy.sh: publish the website to S3 and clear the CloudFront cache.
# Usage: ./deploy.sh staging|production
set -euo pipefail

ENVIRONMENT="\${1:-}"
SITE_DIR="site"
LONG_CACHE="max-age=31536000,public"

usage() {
  echo "Usage: $0 staging|production" >&2
  exit 2
}

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  usage
fi
if [ ! -f "$SITE_DIR/index.html" ]; then
  echo "No $SITE_DIR/index.html: build the site first" >&2
  exit 1
fi

config=$(aws secretsmanager get-secret-value --secret-id "deploy/$ENVIRONMENT" --query SecretString --output text)
BUCKET=$(echo "$config" | jq -r .bucket)
DISTRIBUTION=$(echo "$config" | jq -r .distribution)
URL=$(echo "$config" | jq -r .url)

echo "Deploying $SITE_DIR to $ENVIRONMENT (s3://$BUCKET)"

aws s3 sync "$SITE_DIR/" "s3://$BUCKET/" --delete --exclude "index.html" --cache-control "$LONG_CACHE"
aws s3 cp "$SITE_DIR/index.html" "s3://$BUCKET/index.html" --cache-control "no-cache"

invalidation=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*" --query Invalidation.Id --output text)
echo "Cache clear started: $invalidation"

echo "Live at $URL"`;

const tutorial = {
  slug: 'one-command-deploy',
  number: 4,
  title: 'One-command website deploy',
  situation: 'Deploying the marketing site is a checklist in a wiki: upload the files, set the cache headers, clear the CDN, check the right account. Someone always forgets a step. You write the script that does it all with one command, with its settings kept in a vault. It\'s the same kind of script that deploys this Study Hub.',
  level: 'Intermediate',
  hours: 3,
  free: false,
  skills: ['arguments', 'input checks', 'functions', 'jq', 'exit codes'],
  aws: ['Amazon S3', 'Amazon CloudFront', 'AWS Secrets Manager', 'cache headers'],
  overview: 'You\'ll learn how a static site is served by S3 and CloudFront, sync files with the right cache headers, clear the CloudFront cache, and read deploy settings from AWS Secrets Manager. Then you write `deploy.sh staging|production` with input checks, and see how the real Study Hub deploy script works.',
  steps: [
    {
      id: 'how-sites-are-served',
      kind: 'read',
      title: 'How a static site is served: S3 + CloudFront',
      minutes: 10,
      body: `A *static* site is just files: HTML, CSS, JavaScript, images. Most modern front ends (React, Vue, plain HTML) build into static files. The cheap, fast way to host them on AWS:

\`\`\`text
visitor ──▶ CloudFront (copies cached in 600+ locations) ──▶ S3 bucket (the original files)
\`\`\`

- **Amazon S3** holds the files.
- **Amazon CloudFront** is a *content delivery network* (CDN): it keeps copies close to visitors, so pages load fast everywhere, and serves your domain over HTTPS.

The catch is **caching**. CloudFront and browsers keep copies so they don't ask S3 every time. Great for speed, but after a deploy, visitors might keep seeing the old site. Two tools fix that:

| Tool | What it does |
|---|---|
| \`Cache-Control\` header on each file | tells browsers and CloudFront how long they may keep it |
| CloudFront **invalidation** | tells CloudFront "throw away your copies of these paths now" |

The standard pattern:

- Build tools put a fingerprint in asset names: \`app-3f9c2a.js\`. A new version gets a **new name**, so assets can be cached for a year: \`max-age=31536000\`.
- \`index.html\` keeps its name and points to the current assets, so it must **never** be cached: \`no-cache\`.
- After uploading, invalidate \`/*\` so CloudFront picks up the new \`index.html\` right away.

> **For the Developer Associate exam:** invalidations, \`Cache-Control\`/TTLs, and *Origin Access Control* (letting only CloudFront read a private bucket) all show up.`,
    },
    {
      id: 'sync',
      kind: 'try',
      title: 'Sync a folder to S3',
      minutes: 15,
      body: `\`aws s3 sync\` makes a bucket match a folder: it uploads only new or changed files. With \`--delete\`, it also removes files from the bucket that are no longer in the folder.

Look at what you're about to publish, and what's live on staging now:

\`\`\`bash
find site -type f
\`\`\`

\`\`\`bash
aws s3 ls s3://${STAGING.bucket}/ --recursive
\`\`\`

**Always do a dry run first.** \`--dryrun\` prints what *would* happen and changes nothing:

\`\`\`bash
aws s3 sync site/ s3://${STAGING.bucket}/ --delete --dryrun
\`\`\`

See the \`delete:\` lines? Those old files would be removed, which is what you want here. On the wrong bucket, it could wipe a site: that's why dry runs exist.`,
      task: `Sync \`site/\` to \`s3://${STAGING.bucket}/\` for real, removing files that are no longer in \`site/\`. Then list the bucket to confirm.`,
      hint: 'The dry run command, without `--dryrun`.',
      solution: `aws s3 sync site/ s3://${STAGING.bucket}/ --delete\naws s3 ls s3://${STAGING.bucket}/ --recursive`,
      scenario,
      check: ({ aws }) => {
        const keys = aws.keys(STAGING.bucket);
        if (keys.includes('assets/style-81b0d4.css') && JSON.stringify(keys) === JSON.stringify(SITE_KEYS)) return true;
        if (keys.includes('assets/style-81b0d4.css')) return 'Uploaded, but the old files are still there. Add `--delete`.';
        return null;
      },
      success: 'The bucket now matches the folder exactly: new files in, old promo gone.',
    },
    {
      id: 'cache-headers',
      kind: 'try',
      title: 'Cache rules: a year for assets, none for index.html',
      minutes: 15,
      body: `Now upload with the right \`Cache-Control\` headers. It takes two commands:

1. Everything **except** \`index.html\`, cached for a year:

\`\`\`bash
aws s3 sync site/ s3://${STAGING.bucket}/ --delete --exclude "index.html" --cache-control "max-age=31536000,public"
\`\`\`

2. \`index.html\` on its own, never cached:

\`\`\`bash
aws s3 cp site/index.html s3://${STAGING.bucket}/index.html --cache-control "no-cache"
\`\`\`

\`--exclude\` skips matching files (and, with \`--delete\`, protects them from deletion too).

> Why not just set \`no-cache\` on everything? It works, but every visit then re-downloads every file: slower pages and higher bills. The two-rule pattern gives you instant updates **and** fast pages.`,
      task: `Upload the site to staging so the assets have \`max-age=31536000\` and \`index.html\` has \`no-cache\`.`,
      hint: 'Run both boxes above, in order.',
      solution: `aws s3 sync site/ s3://${STAGING.bucket}/ --delete --exclude "index.html" --cache-control "max-age=31536000,public"\naws s3 cp site/index.html s3://${STAGING.bucket}/index.html --cache-control "no-cache"`,
      scenario,
      check: ({ aws }) => {
        const objs = aws.objects(STAGING.bucket);
        const asset = objs['assets/app-3f9c2a.js'];
        const index = objs['index.html'];
        if (!asset?.cacheControl && !/no-cache/.test(index?.cacheControl || '')) return null;
        if (!/max-age=31536000/.test(asset?.cacheControl || '')) return 'index.html looks right. Now the assets need `--cache-control "max-age=31536000,public"`.';
        if (!/no-cache/.test(index?.cacheControl || '')) return 'Assets are cached for a year. Now upload index.html with `--cache-control "no-cache"`.';
        if (objs['old-promo.html']) return 'Headers are right. Add `--delete` to the sync so old files go away.';
        return true;
      },
    },
    {
      id: 'invalidate',
      kind: 'try',
      title: 'Clear the CloudFront cache',
      minutes: 10,
      body: `CloudFront may still be holding yesterday's \`index.html\`. Tell it to drop its copies:

\`\`\`bash
aws cloudfront create-invalidation --distribution-id ${STAGING.distribution} --paths "/*"
\`\`\`

The answer is JSON. In a script, you usually want just the invalidation's ID, to print or to check on later. Use \`--query\` with the path to the value, and \`--output text\`:

\`\`\`bash
aws cloudfront create-invalidation --distribution-id ${STAGING.distribution} --paths "/*" --query Invalidation.Id --output text
\`\`\`

Invalidations take a minute or two. \`aws cloudfront get-invalidation --distribution-id ID --id INVALIDATION_ID\` shows when the status is *Completed*.

> **Cost:** the first 1,000 invalidation paths each month are free, and \`/*\` counts as **one** path, no matter how many files.`,
      task: `Create an invalidation for \`/*\` on the staging distribution, \`${STAGING.distribution}\`, and save **just its ID** in a variable called \`invalidation\`. Print it.`,
      hint: '`invalidation=$(aws cloudfront create-invalidation ... --query Invalidation.Id --output text)` then `echo "$invalidation"`',
      solution: `invalidation=$(aws cloudfront create-invalidation --distribution-id ${STAGING.distribution} --paths "/*" --query Invalidation.Id --output text)\necho "$invalidation"`,
      scenario,
      check: ({ aws, shell }) => {
        const invs = aws.distributions[STAGING.distribution].invalidations;
        if (!invs.length) return null;
        if (!invs.some((i) => i.InvalidationBatch.Paths.Items.includes('/*'))) return 'Invalidate `"/*"` (in quotes, so Bash doesn\'t expand the `*`).';
        if (!invs.some((i) => i.Id === shell.vars.invalidation)) return 'Invalidation created. Now save just its ID in `invalidation`, using `--query Invalidation.Id --output text`.';
        return true;
      },
    },
    {
      id: 'secrets',
      kind: 'try',
      title: 'Settings in a vault: AWS Secrets Manager',
      minutes: 15,
      body: `Bucket names and distribution IDs differ between staging and production, and real deploys also need things like API keys. Writing them into the script means they end up on GitHub, and changing one means editing code.

**AWS Secrets Manager** stores them encrypted, controls who can read them with IAM, and keeps a history. This account has one secret per environment:

\`\`\`bash
aws secretsmanager get-secret-value --secret-id deploy/staging
\`\`\`

The value is in \`SecretString\`, as JSON. Pull it out, then pick fields with \`jq\`:

\`\`\`bash
config=$(aws secretsmanager get-secret-value --secret-id deploy/staging --query SecretString --output text)
echo "$config" | jq -r .bucket
\`\`\`

\`jq -r\` prints **r**aw text, without the JSON quotes.

> **Free alternative:** for settings that aren't truly secret, *AWS Systems Manager Parameter Store* is free for standard parameters: \`aws ssm get-parameter --name /deploy/staging/bucket\`. Knowing when to use which is a classic exam question: Secrets Manager adds automatic rotation and costs $0.40 per secret per month.`,
      task: 'Read the **production** settings from the secret `deploy/production`, and save its distribution ID in a variable called `DIST_ID`. Print it.',
      hint: 'Save the SecretString in `config`, then `DIST_ID=$(echo "$config" | jq -r .distribution)`.',
      solution: 'config=$(aws secretsmanager get-secret-value --secret-id deploy/production --query SecretString --output text)\nDIST_ID=$(echo "$config" | jq -r .distribution)\necho "$DIST_ID"',
      scenario,
      check: ({ shell }) => {
        if (shell.vars.DIST_ID === PRODUCTION.distribution) return true;
        if (shell.vars.DIST_ID === STAGING.distribution) return 'That\'s staging\'s. Read `deploy/production` instead.';
        if (shell.vars.DIST_ID) return '`DIST_ID` should hold only the ID, like E1..., with no quotes or braces. Use `jq -r .distribution`.';
        return null;
      },
    },
    {
      id: 'deploy-script',
      kind: 'try',
      title: 'The deploy script',
      minutes: 30,
      body: `Put it together in \`deploy.sh\`. Read the top half first:

- \`ENVIRONMENT="\${1:-}"\`: the first argument, or empty if none was given. The \`:-\` matters under \`set -u\`: without it, a missing argument would stop the script with a confusing error.
- **Check inputs before touching anything.** Anything other than \`staging\` or \`production\` prints how to use the script and stops with exit code 2.
- **No settings in the script:** everything environment-specific comes from Secrets Manager.

Fill in the three TODOs with what you practiced. The editor marks the file runnable (\`chmod +x\`), so you can run it as \`./deploy.sh staging\`.`,
      task: 'Finish `deploy.sh` and deploy to **staging**: `./deploy.sh staging`. Staging should get the new files with the right cache headers and a fresh invalidation. **Production must not change.** Also try `./deploy.sh` with no argument: it should refuse.',
      hint: 'The sync and cp commands from the cache step, using `"$SITE_DIR/"`, `"s3://$BUCKET/"` and `"$LONG_CACHE"`. Then the invalidation from the step before, using `"$DISTRIBUTION"`.',
      solution: DEPLOY_SOLUTION,
      files: [{ path: 'deploy.sh', starter: DEPLOY_STARTER, executable: true, runCommand: './deploy.sh staging', runLabel: 'Run ./deploy.sh staging' }],
      scenario,
      check: ({ aws, history }) => {
        if (!history.some((h) => /deploy\.sh/.test(h.command))) return null;
        const prod = aws.objects(PRODUCTION.bucket);
        if (prod['assets/app-3f9c2a.js'] || aws.distributions[PRODUCTION.distribution].invalidations.length) return 'Careful: production changed. Press "Reset the practice server" and deploy to staging only.';
        const objs = aws.objects(STAGING.bucket);
        if (!objs['assets/app-3f9c2a.js']) return 'Staging doesn\'t have the new files yet (the first TODO).';
        if (!/max-age=31536000/.test(objs['assets/app-3f9c2a.js'].cacheControl || '')) return 'Files are up, but the assets need the long cache header.';
        if (!/no-cache/.test(objs['index.html']?.cacheControl || '')) return 'Assets are right. index.html needs `no-cache` (the second TODO).';
        if (objs['old-promo.html']) return 'Old files are still on staging: add `--delete` to the sync.';
        if (!aws.distributions[STAGING.distribution].invalidations.length) return 'Files are perfect. Now clear the CloudFront cache (the third TODO).';
        return true;
      },
      success: 'One command, every step, every time. Try the guard rails: `./deploy.sh` and `./deploy.sh prod` both stop before touching AWS. Then `echo $?` shows exit code 2.',
    },
    {
      id: 'real-world',
      kind: 'read',
      title: 'How the AWS Study Hub deploys',
      minutes: 8,
      body: `The site you're on is deployed by a Bash script very much like yours. Here's the part that publishes the Developer Associate game, slightly shortened:

\`\`\`sh
deploy_dva() {
    local bucket="dva.aws-study-flashcards-app.com"
    local dist_id="E2UB744W5YUCTW"

    # Guard: building without the settings file ships a broken site
    if [ ! -f .env ]; then
        print_error ".env missing — aborting."
        return 1
    fi

    npm run build

    aws s3 sync dist/ "s3://\${bucket}/" \\
        --delete \\
        --exclude "index.html" \\
        --cache-control "max-age=31536000,public"

    aws s3 cp dist/index.html "s3://\${bucket}/index.html" \\
        --cache-control "no-cache,no-store,must-revalidate"

    aws cloudfront create-invalidation \\
        --distribution-id "$dist_id" \\
        --paths "/*" > /dev/null
}
\`\`\`

Same pattern: a guard check, a build, assets with a long cache, \`index.html\` with no cache, then an invalidation. A backslash \`\\\` at the end of a line continues the command on the next line, which keeps long commands readable.

That \`.env\` guard exists because of a real mistake: one deploy ran without the settings file and shipped a site where sign-in didn't work. One \`if\` now makes that impossible. **Every guard in a deploy script is a lesson someone learned the hard way.**

### Where to go from here

- Run the script from **GitHub Actions** on every push, so nobody deploys by hand. (The TypeScript course does this with infrastructure as code.)
- Keep production behind a manual approval, and deploy staging automatically.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'After a deploy, visitors still see the old page. What clears CloudFront\'s copies?', options: ['Deleting the bucket', 'A CloudFront invalidation, such as for `/*`', 'Renaming index.html', 'Waiting is the only option'], answer: 1, explain: 'An invalidation tells CloudFront to drop cached copies of those paths, so the next request fetches the new files from S3.' },
        { q: 'Why can `app-3f9c2a.js` be cached for a year, but not `index.html`?', options: ['JavaScript files are smaller', 'A new version of the asset gets a new name; index.html keeps its name', 'CloudFront can\'t cache HTML', 'Browsers ignore headers on HTML'], answer: 1, explain: 'Fingerprinted names change with every build, so a cached old copy is never used by the new index.html.' },
        { q: 'What does `aws s3 sync site/ s3://bucket/ --delete` do with a file that\'s in the bucket but not in `site/`?', options: ['Keeps it', 'Deletes it from the bucket', 'Downloads it', 'Renames it'], answer: 1, explain: '`--delete` makes the destination match the source exactly. Always try `--dryrun` first.' },
        { q: 'In a script with `set -u`, why write `"${1:-}"` instead of `"$1"`?', options: ['It\'s faster', 'So a missing argument becomes an empty string instead of stopping the script with an error', 'It reads the second argument', '`$1` doesn\'t work in scripts'], answer: 1, explain: '`${1:-default}` gives a default value when `$1` is unset. Here the default is empty, and the script then prints its own clear usage message.' },
        { q: 'Which is the free choice for storing a plain setting like a bucket name, according to AWS pricing?', options: ['AWS Secrets Manager', 'Systems Manager Parameter Store (standard parameters)', 'A public S3 file', 'An environment variable in GitHub'], answer: 1, explain: 'Standard parameters in Parameter Store are free. Secrets Manager adds rotation and costs per secret, so use it for real secrets.' },
        { q: 'Your deploy script is run with `./deploy.sh prod` (a typo). What should it do?', options: ['Guess "production" and deploy', 'Print the usage and exit with a non-zero code, before touching AWS', 'Deploy to staging', 'Delete the bucket'], answer: 1, explain: 'Validate inputs first and fail loudly. Guessing in a deploy script is how outages happen.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'b4-sync', front: 'Make bucket `my-site` match the folder `dist/`, removing extra files', back: '`aws s3 sync dist/ s3://my-site/ --delete` (try `--dryrun` first)', tags: ['s3'], difficulty: 'medium' },
        { id: 'b4-inv', front: 'Clear all of CloudFront\'s cached copies for distribution `E123`', back: '`aws cloudfront create-invalidation --distribution-id E123 --paths "/*"`', tags: ['cloudfront'], difficulty: 'medium' },
        { id: 'b4-cache', front: 'Cache-Control for fingerprinted assets vs index.html', back: 'Assets: `max-age=31536000,public` (a year). index.html: `no-cache`.', tags: ['caching'], difficulty: 'medium' },
        { id: 'b4-query', front: 'Print just one value from an AWS command line answer', back: '`--query Path.To.Value --output text`', tags: ['aws cli'], difficulty: 'easy' },
        { id: 'b4-secret', front: 'Read the value of secret `deploy/staging`', back: '`aws secretsmanager get-secret-value --secret-id deploy/staging --query SecretString --output text`', tags: ['secrets manager'], difficulty: 'medium' },
        { id: 'b4-jq', front: 'Print the `bucket` field of JSON without quotes', back: '`jq -r .bucket`', tags: ['jq'], difficulty: 'easy' },
        { id: 'b4-default', front: 'First argument, or empty if there isn\'t one (safe with `set -u`)', back: '`"${1:-}"`', tags: ['scripts'], difficulty: 'hard' },
        { id: 'b4-oac', front: 'How do you keep the S3 bucket private but still serve it through CloudFront?', back: 'Origin Access Control (OAC): a bucket policy that lets only your CloudFront distribution read it.', tags: ['cloudfront', 's3'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 45,
      body: `Publish a real site with your script. You'll create the hosting once in the console, then deploy with one command forever after.

1. **A site to publish.** Any folder with an \`index.html\` works. Make one in \`~/aws-study-projects/bash/deploy/site/\`, or use the flashcard page you'll build in the JavaScript course.

2. **A private bucket:** \`aws s3 mb s3://my-site-yourname-2026\` (leave *Block all public access* on).

3. **A CloudFront distribution** in the console: *Create distribution* → origin = your bucket → **Origin access: Origin access control settings** → *Create new OAC* → default root object \`index.html\`. After it's created, copy the bucket policy CloudFront offers and paste it into the bucket's *Permissions* tab. Note the distribution ID and its \`https://xxxx.cloudfront.net\` address.

4. **The settings secret:**

\`\`\`sh
aws secretsmanager create-secret --name deploy/staging \\
  --secret-string '{"bucket":"my-site-yourname-2026","distribution":"YOUR_ID","url":"https://xxxx.cloudfront.net"}'
\`\`\`

5. **Deploy:**

\`\`\`sh
chmod +x deploy.sh
./deploy.sh staging
\`\`\`

Open the CloudFront address. Change a word in \`index.html\`, deploy again, and refresh: the change shows up within a minute or two.

6. Push \`deploy.sh\` to GitHub. It contains no bucket names, IDs or keys, so it's safe to share. That's the point.

**Cost:** S3 and CloudFront fit in the free tier for a small site. Secrets Manager is free for 30 days, then $0.40 a month per secret. To clean up: disable and delete the distribution, \`aws s3 rb s3://my-site-yourname-2026 --force\`, and \`aws secretsmanager delete-secret --secret-id deploy/staging\`.`,
      checklist: [
        'My site is live at its CloudFront address, from a private bucket',
        'The deploy settings are in Secrets Manager, not in the script',
        'A second deploy showed my change within a couple of minutes',
        '`./deploy.sh` with no argument refuses to run',
        'deploy.sh is on GitHub',
      ],
    },
  ],
};

export default tutorial;
