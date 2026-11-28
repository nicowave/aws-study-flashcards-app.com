// Tutorial 5: one script publishes several sites, carries on after a failure,
// and reports what really happened. The sequel to Tutorial 4.
import { Shell } from '../../../engine/shell/shell';

// ---------------------------------------------------------------------------
// The practice company: three sites, each a folder, a bucket and two
// CloudFront distributions (the old address on example.com, the new one on
// example.org).
// ---------------------------------------------------------------------------
const SITES = {
  shop: { bucket: 'shop-site-prod', ids: ['E1SHOPCOM4K7Q', 'E2SHOPORG9M3X'] },
  blog: { bucket: 'blog-site-prod', ids: ['E1BLOGCOM8T2W', 'E2BLOGORG5H6R'] },
  docs: { bucket: 'docs-site-prod', ids: ['E1DOCSCOM3V9L', 'E2DOCSORG7P4N'] },
};
const NAMES = Object.keys(SITES);

// What tonight's build produced, and what is live right now
const BUILT = {
  shop: { 'index.html': '<!doctype html>\n<h1>Winter sale: 20% off</h1>\n<script src="/assets/app-7c1e90.js"></script>\n', 'prices.html': '<!doctype html>\n<h1>Winter prices</h1>\n', 'assets/app-7c1e90.js': 'console.log("shop v8");\n' },
  blog: { 'index.html': '<!doctype html>\n<h1>Five gift ideas for winter</h1>\n<script src="/assets/app-51fa3d.js"></script>\n', 'assets/app-51fa3d.js': 'console.log("blog v12");\n' },
  docs: { 'index.html': '<!doctype html>\n<h1>Returns: you have 30 days</h1>\n<script src="/assets/app-e08b72.js"></script>\n', 'assets/app-e08b72.js': 'console.log("docs v5");\n' },
};
const LIVE = {
  shop: { 'index.html': '<!doctype html>\n<h1>Autumn sale</h1>\n<script src="/assets/app-2b4d11.js"></script>\n', 'prices.html': '<!doctype html>\n<h1>Autumn prices</h1>\n', 'assets/app-2b4d11.js': 'console.log("shop v7");\n' },
  blog: { 'index.html': '<!doctype html>\n<h1>Our autumn picks</h1>\n<script src="/assets/app-0c9e44.js"></script>\n', 'assets/app-0c9e44.js': 'console.log("blog v11");\n' },
  docs: { 'index.html': '<!doctype html>\n<h1>Returns: you have 14 days</h1>\n<script src="/assets/app-9a3f60.js"></script>\n', 'assets/app-9a3f60.js': 'console.log("docs v4");\n' },
};

const LAST_DEPLOY = Date.UTC(2026, 9, 22, 16, 5, 12); // a week before tonight

const sitesTxt = (ids = {}) => NAMES.map((n) => `${n} ${SITES[n].bucket} ${(ids[n] || SITES[n].ids).join(' ')}\n`).join('');

// One practice server. `broken` sites have no index.html (their build failed),
// `ids` replaces a site's distribution IDs in sites.txt (a typo), `noBucket`
// sites point at a bucket that doesn't exist.
const world = ({ broken = [], ids = {}, noBucket = [], files = {} } = {}) => {
  const tree = { 'sites.txt': sitesTxt(ids) };
  for (const name of NAMES) {
    for (const [path, body] of Object.entries(BUILT[name])) {
      if (path === 'index.html' && broken.includes(name)) continue;
      tree[`sites/${name}/${path}`] = body;
    }
  }
  const buckets = {};
  const distributions = {};
  for (const name of NAMES) {
    if (!noBucket.includes(name)) buckets[SITES[name].bucket] = Object.fromEntries(Object.entries(LIVE[name]).map(([key, body]) => [key, { body, mtime: LAST_DEPLOY }]));
    distributions[SITES[name].ids[0]] = { aliases: [`${name}.example.com`] };
    distributions[SITES[name].ids[1]] = { aliases: [`${name}.example.org`] };
  }
  return { hostname: 'build-server', now: '2026-10-29T21:00:00Z', files: { ...tree, ...files }, aws: { buckets, distributions } };
};

const runnable = (content) => ({ content, mode: 0o755 });

// Replaces one piece of a script, and fails loudly if the piece isn't there
// (split/join, because "$'" means something special to String.replace)
const swap = (script, from, to) => {
  if (!script.includes(from)) throw new Error(`Tutorial 5: "${from}" is not in the script`);
  return script.split(from).join(to);
};

// ---------------------------------------------------------------------------
// deploy.sh, stage by stage. Each step starts from the one before.
// ---------------------------------------------------------------------------
const HEAD = `#!/bin/bash
# deploy.sh: publish the company's sites to S3 and clear their CloudFront caches.
# Usage: ./deploy.sh <site>...     for example: ./deploy.sh shop blog docs
set -euo pipefail

SITES_FILE="sites.txt"   # one line per site: name, bucket, CloudFront distribution IDs
LONG_CACHE="max-age=31536000,public"
`;

const FUNC_PLAIN = `
# deploy_site <site>: publish one site
deploy_site() {
  local site="$1"
  local dir="sites/$site"
  local line bucket dist
  line=$(grep "^$site " "$SITES_FILE")
  bucket=$(echo "$line" | awk '{print $2}')
  dist=$(echo "$line" | awk '{print $3}')

  echo "▶ $site"
  aws s3 sync "$dir/" "s3://$bucket/" --delete --exclude "index.html" --cache-control "$LONG_CACHE"
  aws s3 cp "$dir/index.html" "s3://$bucket/index.html" --cache-control "no-cache"
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null
  echo "✓ $site is live"
}
`;

const FUNC_SAFE = `
# deploy_site <site>: publish one site. Stops at its first failing step and returns 1.
deploy_site() {
  local site="$1"
  local dir="sites/$site"
  local line bucket dist
  line=$(grep "^$site " "$SITES_FILE") || return 1
  bucket=$(echo "$line" | awk '{print $2}')
  dist=$(echo "$line" | awk '{print $3}')

  echo "▶ $site"
  if [ ! -s "$dir/index.html" ]; then
    echo "✗ $site: no $dir/index.html" >&2
    return 1
  fi
  aws s3 sync "$dir/" "s3://$bucket/" --delete --exclude "index.html" --cache-control "$LONG_CACHE" || return 1
  aws s3 cp "$dir/index.html" "s3://$bucket/index.html" --cache-control "no-cache" || return 1
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null || return 1
  echo "✓ $site is live"
}
`;

export const LOOP_STARTER = `${HEAD}${FUNC_PLAIN}
# TODO: deploy every site named on the command line, in the order given
deploy_site shop
`;

export const LOOP_SOLUTION = `${HEAD}${FUNC_PLAIN}
for site in "$@"; do
  deploy_site "$site"
done
`;

export const CARRY_ON_SOLUTION = `${HEAD}${FUNC_PLAIN}
for site in "$@"; do
  deploy_site "$site" || echo "✗ $site failed, carrying on" >&2
done
`;

export const TRAP_SOLUTION = `${HEAD}${FUNC_SAFE}
for site in "$@"; do
  deploy_site "$site" || echo "✗ $site failed, carrying on" >&2
done
`;

export const COUNT_STARTER = `${HEAD}${FUNC_SAFE}
failed=0
for site in "$@"; do
  deploy_site "$site" || { echo "✗ $site failed, carrying on" >&2; ((failed++)); }
done

echo "Done: $failed of $# sites failed"
`;

export const COUNT_SOLUTION = `${HEAD}${FUNC_SAFE}
failed=0
for site in "$@"; do
  deploy_site "$site" || { echo "✗ $site failed, carrying on" >&2; failed=$((failed + 1)); }
done

echo "Done: $failed of $# sites failed"
`;

export const SUMMARY_STARTER = `${HEAD}${FUNC_SAFE}
failed=0
for site in "$@"; do
  deploy_site "$site" || { echo "✗ $site failed, carrying on" >&2; failed=$((failed + 1)); }
done

# TODO: this summary was typed by hand. Build it from what happened in the loop.
echo
echo "Summary"
echo "✓ shop"
echo "✓ blog"
echo "✓ docs"
echo "Done: $failed of $# sites failed"
`;

const SUMMARY_LOOP = `failed=0
summary=""
for site in "$@"; do
  if deploy_site "$site"; then
    summary="\${summary}✓ \${site}"$'\\n'
  else
    summary="\${summary}✗ \${site}"$'\\n'
    failed=$((failed + 1))
  fi
done
`;

export const SUMMARY_SOLUTION = `${HEAD}${FUNC_SAFE}
${SUMMARY_LOOP}
echo
echo "Summary"
printf '%s' "$summary"
echo "Done: $failed of $# sites failed"
`;

const HEAD_CODES = swap(
  HEAD,
  '# Usage: ./deploy.sh <site>...     for example: ./deploy.sh shop blog docs\n',
  '# Usage: ./deploy.sh all | <site>...\n# Exit codes: 0 = every site deployed, 1 = at least one site failed, 2 = wrong usage\n',
);

const USAGE = `
usage() {
  echo "Usage: $0 all | <site>..." >&2
  exit 2
}
`;

const ALL = `if [ "\${1:-}" = "all" ]; then
  set -- $(awk '{print $1}' "$SITES_FILE")   # replace the arguments with every site name
fi
`;

export const CODES_STARTER = `${HEAD_CODES}${USAGE}${FUNC_SAFE}
# 1. Wrong usage: stop before touching anything
# TODO: no argument at all: call usage
${ALL}# TODO: a name that isn't in sites.txt: print "Unknown site: <name>" to the error stream, then call usage

# 2. Deploy each site. One failure costs one site, not the rest.
${SUMMARY_LOOP}
# 3. Tell the truth: to people in the summary, to programs in the exit code
echo
echo "Summary"
printf '%s' "$summary"
echo "Done: $failed of $# sites failed"
exit "$failed"
`;

const CHECK_USAGE = `if [ "$#" -eq 0 ]; then
  usage
fi
${ALL}for site in "$@"; do
  if ! grep -q "^$site " "$SITES_FILE"; then
    echo "Unknown site: $site" >&2
    usage
  fi
done
`;

const ENDING = `echo
echo "Summary"
printf '%s' "$summary"
if [ "$failed" -gt 0 ]; then
  echo "$failed of $# sites failed" >&2
  exit 1
fi
echo "All sites deployed ($#)"
`;

export const CODES_SOLUTION = `${HEAD_CODES}${USAGE}${FUNC_SAFE}
# 1. Wrong usage: stop before touching anything
${CHECK_USAGE}
# 2. Deploy each site. One failure costs one site, not the rest.
${SUMMARY_LOOP}
# 3. Tell the truth: to people in the summary, to programs in the exit code
${ENDING}`;

// From here on deploy_site clears every distribution of the site
const FUNC_ALL_IDS = [
  ['  local line bucket dist\n', '  local line bucket ids\n'],
  ['  dist=$(echo "$line" | awk \'{print $3}\')\n', '  ids=$(echo "$line" | cut -d\' \' -f3-)   # everything from the third word on\n'],
  ['  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null || return 1\n', '  clear_cache $ids || return 1   # no quotes on purpose: each ID becomes its own argument\n'],
].reduce((script, [from, to]) => swap(script, from, to), FUNC_SAFE);

const CLEAR_STARTER = `
# clear_cache <id>...: clear "/*" in every distribution listed
clear_cache() {
  # TODO: today only the first ID is cleared. Loop over "$@": try every ID, even
  #       after one fails, and return 1 at the end if any of them failed.
  aws cloudfront create-invalidation --distribution-id "$1" --paths "/*" > /dev/null
}
`;

const CLEAR_SOLUTION = `
# clear_cache <id>...: clear "/*" in every distribution listed, even after one fails
clear_cache() {
  local id problems=0
  for id in "$@"; do
    if ! aws cloudfront create-invalidation --distribution-id "$id" --paths "/*" > /dev/null; then
      echo "✗ $id: cache not cleared" >&2
      problems=$((problems + 1))
    fi
  done
  [ "$problems" -eq 0 ]
}
`;

const finished = (clearCache) => `${HEAD_CODES}${USAGE}${clearCache}${FUNC_ALL_IDS}
# 1. Wrong usage: stop before touching anything
${CHECK_USAGE}
# 2. Deploy each site. One failure costs one site, not the rest.
${SUMMARY_LOOP}
# 3. Tell the truth: to people in the summary, to programs in the exit code
${ENDING}`;

export const CACHES_STARTER = finished(CLEAR_STARTER);
export const DEPLOY_SOLUTION = finished(CLEAR_SOLUTION);

// ---------------------------------------------------------------------------
// Testing: a pretend aws, and a test script that uses it
// ---------------------------------------------------------------------------
export const FAKE_AWS_STARTER = `#!/bin/bash
# test/bin/aws: a pretend aws for tests. It does nothing in the cloud: it only
# writes down how it was called, and fails when a test asks it to.
#   FAKE_AWS_LOG    the file each call is written to
#   FAKE_AWS_FAIL   a service name (s3, cloudfront): calls to that service fail

# TODO 1: add one line to the file "$FAKE_AWS_LOG": the word aws, then every argument

# TODO 2: when the first argument is the service named in $FAKE_AWS_FAIL,
#         print a message to the error stream and exit 1

exit 0
`;

export const FAKE_AWS_SOLUTION = `#!/bin/bash
# test/bin/aws: a pretend aws for tests. It does nothing in the cloud: it only
# writes down how it was called, and fails when a test asks it to.
#   FAKE_AWS_LOG    the file each call is written to
#   FAKE_AWS_FAIL   a service name (s3, cloudfront): calls to that service fail

echo "aws $*" >> "$FAKE_AWS_LOG"

if [ "\${1:-}" = "\${FAKE_AWS_FAIL:-none}" ]; then
  echo "pretend aws: $1 failed on purpose" >&2
  exit 1
fi

exit 0
`;

const TEST_HEAD = `#!/bin/bash
# test-deploy.sh: run deploy.sh against the pretend aws and check what it did.
# Nothing here touches AWS. Exit codes: 0 = every check passed, 1 = a check failed.
set -u

LOG="$PWD/test/calls.log"     # every call the pretend aws received
OUT="$PWD/test/output.txt"    # everything deploy.sh printed
failed=0

# check <exit code> <what should be true>: one ✓ or ✗ line per fact
check() {
  if [ "$1" -eq 0 ]; then
    echo "  ✓ $2"
  else
    echo "  ✗ $2"
    failed=$((failed + 1))
  fi
}

# run_deploy <arguments for deploy.sh>: run it with the pretend aws first on PATH.
# Afterwards $code is its exit code, $OUT what it printed, $LOG the aws calls.
run_deploy() {
  rm -f "$LOG"
  code=0
  PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$LOG" ./deploy.sh "$@" > "$OUT" 2>&1 || code=$?
}

echo "Test 1: everything works"
run_deploy shop
[ "$code" -eq 0 ];                                                      check $? "exit code is 0 (it was $code)"
grep -q "s3 sync sites/shop/ s3://${SITES.shop.bucket}/ --delete" "$LOG";    check $? "the upload removes old files (--delete)"
[ "$(grep -c "create-invalidation" "$LOG")" -eq 2 ];                    check $? "both distributions are cleared"
grep -q "✓ shop" "$OUT";                                                check $? "the summary says ✓ shop"

echo "Test 2: CloudFront fails"
`;

const TEST_TAIL = `
echo
if [ "$failed" -gt 0 ]; then
  echo "$failed check(s) failed"
  exit 1
fi
echo "All checks passed"
`;

export const TEST_STARTER = `${TEST_HEAD}# TODO: run the deploy for shop while the pretend aws fails every cloudfront call,
#       then check two facts: the exit code is 1, and the summary says ✗ shop
${TEST_TAIL}`;

export const TEST_SOLUTION = `${TEST_HEAD}export FAKE_AWS_FAIL=cloudfront
run_deploy shop
unset FAKE_AWS_FAIL
[ "$code" -eq 1 ];                                                      check $? "exit code is 1 (it was $code)"
grep -q "✗ shop" "$OUT";                                                check $? "the summary says ✗ shop"
! grep -q "✓ shop" "$OUT";                                              check $? "nothing claims shop is live"
${TEST_TAIL}`;

// The same pretend aws, for the check of the test step: it also notes each
// failure it was asked for, so the check can tell that Test 2 produced one
const NOTING_AWS = swap(FAKE_AWS_SOLUTION, '  exit 1\n', '  echo "$1" >> /tmp/pretend-failures\n  exit 1\n');

const NIGHTLY = `#!/bin/bash
# nightly.sh: what the scheduler runs at 2 a.m. It can't read a summary,
# so it decides what to do from deploy.sh's exit code alone.
code=0
./deploy.sh all > deploy.log 2>&1 || code=$?

if [ "$code" -eq 0 ]; then
  echo "$(date '+%F %T') all sites deployed"
elif [ "$code" -eq 1 ]; then
  echo "$(date '+%F %T') a site failed: message the person on duty (details in deploy.log)"
else
  echo "$(date '+%F %T') deploy.sh was called wrong (exit code $code): fix this script, don't wake anyone"
fi
`;

// Two broken copies of the finished script. A good test must fail on each.
const LYING_SUMMARY = swap(DEPLOY_SOLUTION, 'summary="${summary}✗ ${site}"', 'summary="${summary}✓ ${site}"');
const ALWAYS_ZERO = swap(DEPLOY_SOLUTION, '  exit 1\nfi\necho "All', '  exit 0\nfi\necho "All');

// ---------------------------------------------------------------------------
// Helpers for the checks. A check never trusts what happens to be in the
// learner's practice account: it runs the learner's file in a fresh practice
// server, in situations the learner may not have tried.
// ---------------------------------------------------------------------------
const HOME = '/home/learner';
const fileText = (fs, path) => (fs.isFile(`${HOME}/${path}`) ? fs.read(`${HOME}/${path}`) : '');
// Was the script run (./deploy.sh, bash deploy.sh)? Reading it with cat doesn't count.
const ran = (history, name) => {
  const file = name.replace(/\./g, '\\.');
  const started = new RegExp(`(^|[\\s;&|("'])(\\./|~/|/\\S*/)${file}(?![\\w.-])|\\b(bash|sh|zsh|source)\\s+(-\\S+\\s+)*(\\S*/)?${file}(?![\\w.-])`);
  return history.some((h) => started.test(h.command));
};

const trial = (files, command, situation = {}) => {
  const shell = new Shell(world({ ...situation, files: { ...(situation.files || {}), ...Object.fromEntries(Object.entries(files).map(([p, text]) => [p, runnable(text)])) } }));
  const result = shell.run(command);
  const output = result.transcript.map((c) => c.text).join('');
  return { aws: shell.aws, fs: shell.fs, status: result.status, output, stderr: result.stderr };
};
const deploy = (script, args, situation) => trial({ 'deploy.sh': script }, `./deploy.sh ${args}`, situation);

// The script still has set -e (and doesn't switch it off again with set +e)
const keepsSetE = (script) => /^\s*set\s+-[a-z]*e/m.test(script) && !/^\s*set\s+\+[a-z]*e/m.test(script);

// The learner's script with deploy_site swapped for a stand-in that fails for
// one site and works for the others (null when the function can't be found).
// It shows what the loop does with a failure, whatever the function is like.
const withStandIn = (script, failing) => {
  const found = script.match(/^deploy_site\s*\(\)\s*\{[ \t]*\n[\s\S]*?\n\}[ \t]*$/m);
  if (!found) return null;
  const standIn = `deploy_site() {\n  echo "stand-in for $1"\n  [ "$1" != "${failing}" ]\n}`;
  return script.slice(0, found.index) + standIn + script.slice(found.index + found[0].length);
};

// A pretend aws for the checks: it records each call's first two words and
// fails the calls that start with FAIL_STEP (for example "s3 cp")
const FAILING_AWS = `#!/bin/bash
echo "$1 $2" >> /tmp/aws-steps
[ "$1 $2" != "$FAIL_STEP" ]
`;
const withFailingStep = (script, step, args) => {
  const t = trial({ 'deploy.sh': script, 'check-bin/aws': FAILING_AWS }, `FAIL_STEP="${step}" PATH="$PWD/check-bin:$PATH" ./deploy.sh ${args}`);
  const steps = t.fs.isFile('/tmp/aws-steps') ? t.fs.read('/tmp/aws-steps').split('\n').filter(Boolean) : [];
  return { ...t, steps };
};

// A script Bash can't even read: say so first, with Bash's own message
const unreadable = (t) => {
  const m = t.stderr.match(/^.*(syntax error|unexpected end of input)[^\n]*/m);
  return m ? `Bash can't read the script yet: ${m[0].trim()}` : null;
};

const isLive = (aws, name) => {
  const objects = aws.objects(SITES[name].bucket);
  return Object.entries(BUILT[name]).every(([key, body]) => objects[key]?.body === body) && Object.keys(objects).length === Object.keys(BUILT[name]).length;
};
const isUntouched = (aws, name) => {
  const objects = aws.objects(SITES[name].bucket);
  return Object.entries(LIVE[name]).every(([key, body]) => objects[key]?.body === body) && Object.keys(objects).length === Object.keys(LIVE[name]).length;
};
const cleared = (aws, id) => (aws.distributions[id]?.invalidations || []).some((i) => i.InvalidationBatch.Paths.Items.includes('/*'));

// The ✓ / ✗ lines under the "Summary" heading, as "✓ shop" strings
const summaryOf = (output) => {
  const lines = output.split('\n');
  const at = lines.map((l) => /^\s*summary\b/i.test(l)).lastIndexOf(true);
  if (at === -1) return null;
  return lines.slice(at + 1).map((l) => l.match(/^\s*([✓✗])\s*([\w-]+)/)).filter(Boolean).map((m) => `${m[1]} ${m[2]}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const tutorial = {
  slug: 'deploy-many-sites',
  number: 5,
  title: 'Deploy many sites, and tell the truth',
  situation: 'Your one-command deploy worked so well that the company now runs it for three sites in a loop. Then one night a build broke: one site never deployed, another was reported as live while it was broken, and half the visitors kept seeing last week\'s prices. You rebuild the script so one failure costs one site, and so its summary and its exit code can\'t lie. The traps in this tutorial were found in the script that deploys Level Up Study Hub.',
  level: 'Advanced',
  hours: 4,
  free: false,
  skills: ['functions', 'return codes', '"$@"', 'set -e traps', 'exit codes', 'PATH', 'testing scripts'],
  aws: ['Amazon S3', 'Amazon CloudFront', 'cache invalidation', 'the AWS command line'],
  overview: 'You\'ll turn the deploy from Tutorial 4 into `deploy.sh all`: a `deploy_site` function called once per site, a loop that carries on after a failure, a counter and a summary built from what happened, and exit codes other programs can act on. You\'ll clear the cache of both CloudFront distributions of each site, then test the whole script against a pretend `aws` that logs every call and fails when you tell it to.',
  steps: [
    {
      id: 'the-bad-night',
      kind: 'read',
      title: 'Three sites, one bad night',
      minutes: 8,
      body: `In Tutorial 4 you wrote \`deploy.sh\` for one site. The company now has three: the **shop**, the **blog** and the **docs** (its help pages). Each one is a folder of files, a bucket in Amazon S3, and Amazon CloudFront in front of the bucket. Somebody put your deploy in a loop, and for a few weeks it worked.

Then came one bad night. Three things went wrong, each because of a line that looks harmless:

| What people saw | What the script did |
|---|---|
| The blog's build broke. The **docs**, with a correction that had to go out that night, were never published. | It stopped at the first failure. Everything after the blog was skipped. |
| After a quick "fix", the script printed \`✓\` for a site whose deploy had failed, and finished as if all was well. Nobody was told. | It carried on after the failure, *inside* the broken site too. |
| Customers on the company's new web address kept seeing last week's prices. | Each site has **two** CloudFront caches. It cleared one. |

None of this is invented for the lesson. These traps were found in the script that deploys Level Up Study Hub, and the fixes you'll write are the ones in that script today.

A deploy script has two jobs: publish the sites, and **tell the truth about what happened**. To the person watching the screen, with a summary. And to the programs that run it at night, which can't read: they only get the **exit code**, the number every command hands back when it ends (\`0\` for success, anything else for a problem).

### Look around

The practice server holds tonight's builds. \`sites.txt\` is the list the script will read:

\`\`\`bash
cat sites.txt
\`\`\`

One line per site: its name, its S3 bucket, and the IDs of its CloudFront **distributions**. A distribution is CloudFront's word for one set-up: a web address, where the files come from, and its own cache of copies. Each site here has two, because the company is moving from \`example.com\` to \`example.org\` and serves every site under both addresses for now.

In Tutorial 4 these settings came from AWS Secrets Manager. Here they are in a plain file, so the lesson can stay on the script. That's acceptable for bucket names and distribution IDs: they are not passwords, and knowing them gives nobody access. Keep the file out of a public repository all the same, and never put a key or a password in it.

The built sites are in the \`sites\` folder, one folder per site:

\`\`\`bash
find sites -type f
\`\`\`

And this is what visitors of the docs see right now. The \`-\` at the end tells \`aws s3 cp\` to print the file instead of saving it:

\`\`\`bash
aws s3 cp s3://${SITES.docs.bucket}/index.html -
\`\`\`

Fourteen days is wrong: the policy is thirty. That's the correction that has to go out tonight.

### What you'll build

One script, \`./deploy.sh all\`, that:

- publishes each site with one **function**, called in a loop
- carries on when a site fails, without lying about that site
- prints one \`✓\` or \`✗\` line per site, taken from what happened
- ends with \`0\` when all is well, \`1\` when a site failed, \`2\` when it was called wrong
- clears **both** caches of every site
- can be tested in two seconds, without touching AWS`,
      scenario: () => world(),
    },
    {
      id: 'loop',
      kind: 'try',
      title: 'One function, a list of sites',
      minutes: 15,
      body: `Open \`deploy.sh\` in the editor and read it from the top. Most of it is Tutorial 4's deploy, moved into a **function**: a named group of commands, like \`log()\` in Tutorial 1 and \`usage()\` in Tutorial 4.

- \`deploy_site() { ... }\` only *defines* the function. Nothing runs until a later line calls it: \`deploy_site shop\`.
- Inside the function, \`$1\` is the first word after the function's name. So one function serves any site.
- \`local\` makes a variable that exists only inside the function. Without it, \`bucket\` would be shared by the whole script, and a value left over from one site could be used for the next.
- The three lines after \`local\` look the site up: \`grep "^$site "\` finds the line of \`sites.txt\` that starts with the site's name (\`^\` means "the start of the line", and the space after the name ends the word), and \`awk '{print $2}'\` takes its second word, the bucket.

The last line of the script deploys one site, with its name typed in. You want every site named on the command line. Bash keeps those names in **\`"$@"\`**: every argument the script was started with, each one kept whole. \`$#\` is how many there are.

Try it in the terminal. \`set --\` gives your terminal session a list of arguments, as if it were a script started with them:

\`\`\`bash
set -- shop blog docs
echo "$# arguments"
for site in "$@"; do echo "would deploy $site"; done
\`\`\`

> **Always write \`"$@"\` with the quotes.** Without them, an argument with a space in it is cut into two.`,
      task: 'Replace the last line of `deploy.sh` with a loop that calls `deploy_site` once for every site named on the command line, in the order given. Then run `./deploy.sh shop blog docs`: all three sites should go live.',
      hint: 'A `for` loop over `"$@"`, like the one in the box above, with `deploy_site "$site"` inside.',
      solution: LOOP_SOLUTION,
      files: [{ path: 'deploy.sh', starter: LOOP_STARTER, executable: true, runCommand: './deploy.sh shop blog docs', runLabel: 'Run ./deploy.sh shop blog docs' }],
      scenario: () => world(),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const all = deploy(script, 'shop blog docs');
        const problem = unreadable(all);
        if (problem) return problem;
        const live = NAMES.filter((n) => isLive(all.aws, n));
        if (live.length < 3) return `\`./deploy.sh shop blog docs\` published ${live.length} of the 3 sites${live.length ? ` (${live.join(', ')})` : ''}. Call \`deploy_site\` once for each name in \`"$@"\`.`;
        const one = deploy(script, 'docs');
        if (!isLive(one.aws, 'docs') || !isUntouched(one.aws, 'shop')) return 'All three went live. But `./deploy.sh docs` should publish only the docs: take the names from `"$@"`, not from a list typed into the script.';
        return true;
      },
      success: 'Three sites, one function, one loop. Check the correction went out: `aws s3 cp s3://docs-site-prod/index.html -` now says 30 days. And `./deploy.sh docs` publishes just the docs.',
    },
    {
      id: 'carry-on',
      kind: 'try',
      title: 'One broken site must not stop the rest',
      minutes: 15,
      body: `Tonight is the bad night. The blog's build failed halfway and left **no \`index.html\`** in \`sites/blog/\`. The shop and the docs are fine, and the docs still carry the correction that must go out.

Press **Run** on the editor before you change anything, and read where the output ends.

The script stopped inside the blog, and the docs were never tried. The line responsible is at the top: \`set -euo pipefail\`. Its \`-e\` means "stop the whole script at the first command that fails". In Tutorial 3 that was exactly right: if the upload fails, don't go on to delete old backups. For a **list** of independent sites it's wrong. One failure should cost one site.

Taking \`set -e\` out would be worse: then *nothing* stops the script, anywhere. Keep it, and say at the one place where a failure is expected what should happen instead. That's what \`||\` is for. It means **or else**: the command on its right runs only when the one on its left failed.

\`\`\`bash
ls /no/such/folder || echo "that failed, but I'm still here"
\`\`\`

A failure that is followed by \`||\` counts as handled, so \`set -e\` doesn't stop the script for it.`,
      task: 'Change the loop so a failed site doesn\'t end the script: when `deploy_site` fails, print `✗ <site> failed, carrying on` to the error stream (`>&2`) and go on to the next site. Keep `set -euo pipefail`. After `./deploy.sh shop blog docs`, the docs should be live.',
      hint: 'Only the line inside the loop changes. Right after `deploy_site "$site"` write `||`, then the `echo` that reports the failure, ending with `>&2`.',
      solution: CARRY_ON_SOLUTION,
      files: [{ path: 'deploy.sh', starter: LOOP_SOLUTION, executable: true, runCommand: './deploy.sh shop blog docs', runLabel: 'Run ./deploy.sh shop blog docs' }],
      scenario: () => world({ broken: ['blog'] }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const t = deploy(script, 'shop blog docs', { broken: ['blog'] });
        const problem = unreadable(t);
        if (problem) return problem;
        if (!keepsSetE(script)) return 'Keep `set -euo pipefail` at the top, and don\'t switch it off with `set +e`. The rest of the script still needs it: handle the failure at the call with `||` instead.';
        if (!isLive(t.aws, 'docs')) return 'The docs still aren\'t live: the script ends at the blog. Put `||` and what to do instead right after `deploy_site "$site"`.';
        if (!isLive(t.aws, 'shop')) return 'The docs are live, but now the shop isn\'t. The loop should still deploy every site in `"$@"`.';
        // What does the loop do when deploy_site really reports a failure? (The
        // function in the file can't yet: that is the next step.)
        const standIn = withStandIn(script, 'shop');
        if (standIn) {
          const s = deploy(standIn, 'shop docs');
          const tested = 'To test your loop, I ran it with a stand-in `deploy_site` that fails for the shop and works for the docs.';
          if (!/stand-in for docs/.test(s.output)) return `The docs are live tonight. ${tested} The script stopped at the shop. Any site can be the one that fails: put the \`||\` right after \`deploy_site "$site"\`, with no site name typed in.`;
          if (/✗.*docs/.test(s.output)) return `${tested} Your message appeared for the docs, the site that worked. \`&&\` runs what follows when the command worked; you want \`||\`, which runs it when the command failed.`;
          if (!/✗.*shop/.test(s.output)) return `The docs are live. ${tested} The script carried on, but it never said that the shop failed. After the \`||\`, print \`✗ $site failed, carrying on\`.`;
          if (!/✗.*shop/.test(s.stderr)) return 'Nearly: the message is printed, but as normal output. Send it to the error stream by ending the `echo` with `>&2`.';
        }
        return true;
      },
      success: 'The docs are live: one broken site no longer blocks the others. Now scroll up and read the blog\'s lines again. An error from `aws s3 cp`, and right below it: `✓ blog is live`. Your `✗ blog failed` message never appeared, and `echo $?` says `0`. The script lied to you. The next step shows why.',
    },
    {
      id: 'the-trap',
      kind: 'try',
      title: 'The trap: || switches set -e off inside the function',
      minutes: 20,
      body: `Run the script once more and look at what it did to the live blog:

\`\`\`bash
./deploy.sh shop blog docs
\`\`\`

\`\`\`bash
aws s3 ls s3://${SITES.blog.bucket}/ --recursive
\`\`\`

\`\`\`bash
aws s3 cp s3://${SITES.blog.bucket}/index.html -
\`\`\`

The old page is still there, and it asks for \`app-0c9e44.js\`, a file the sync just deleted. The blog is now broken for every visitor, and the script said \`✓ blog is live\` and ended with exit code 0.

Here is the rule behind it, and it surprises almost everyone:

> **When a function is called on the left of \`||\` (or \`&&\`, or as the test of an \`if\`), Bash ignores \`set -e\` for every line inside that function.** A step fails, and the function runs its next line.

(\`&&\` is the opposite of \`||\`: the command on its right runs only when the one on its left worked.)

See it with a four-line script. \`bash -c '...'\` starts a second Bash and runs the text between the single quotes as a script of its own, so your terminal session stays as it is. \`false\` is a command that does nothing and fails. First, \`build\` called on a line of its own:

\`\`\`bash
bash -c '
set -e
build() { false; echo "build carried on after a failure"; }
build
echo "the script reached its end"
'
echo "exit code: $?"
\`\`\`

Nothing is printed and the exit code is 1: \`set -e\` stopped the script at \`false\`. Now the same script with \`||\` after the call:

\`\`\`bash
bash -c '
set -e
build() { false; echo "build carried on after a failure"; }
build || echo "build failed"
echo "the script reached its end"
'
echo "exit code: $?"
\`\`\`

\`build\` ran past its failure, and "build failed" was never printed: the function's last command, an \`echo\`, worked, so the function as a whole counted as a success.

Writing \`set -e\` again inside the function changes nothing. The fix is to make the function look after itself. **Every step that can fail gets its own \`|| return 1\`:**

\`\`\`text
aws s3 sync ... || return 1
\`\`\`

\`return 1\` ends the *function* and hands \`1\` to whoever called it, where your \`||\` is waiting. Don't write \`exit 1\` here: \`exit\` ends the whole *script*, and you'd be back to the docs never being published.

The \`grep\` that looks the site up can fail too, when a name isn't in \`sites.txt\`. From the next step on, the script in the editor ends that line the same way: \`line=$(grep "^$site " "$SITES_FILE") || return 1\`.

One more thing. Stopping at the failed \`aws s3 cp\` is still too late: the sync before it had already deleted the old files. So the function's **first** step should be a guard, like in Tutorial 4: no \`index.html\`, no deploy. \`[ -s file ]\` is true when the file exists and is not empty.`,
      task: 'Fix `deploy_site`: (1) as its first step after `echo "▶ $site"`, when the site\'s `index.html` is missing or empty, print a line that starts with `✗ <site>:` to the error stream (for example `✗ blog: no sites/blog/index.html`) and `return 1`, before any `aws` command; (2) make every `aws` step end the function with `return 1` when it fails. After a run, the blog\'s bucket must be untouched, and the docs live.',
      hint: 'The guard is an `if` whose test is `[ ! -s "$dir/index.html" ]`, with an `echo ... >&2` and `return 1` inside. Then each of the three `aws` lines gets `|| return 1` at its very end. On the invalidation line that is after `> /dev/null`.',
      solution: TRAP_SOLUTION,
      files: [{ path: 'deploy.sh', starter: CARRY_ON_SOLUTION, executable: true, runCommand: './deploy.sh shop blog docs', runLabel: 'Run ./deploy.sh shop blog docs' }],
      scenario: () => world({ broken: ['blog'] }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const t = deploy(script, 'shop blog docs', { broken: ['blog'] });
        const problem = unreadable(t);
        if (problem) return problem;
        if (!isLive(t.aws, 'docs')) return 'The docs weren\'t published. Inside the function use `return 1`, not `exit 1`: `exit` ends the whole script.';
        if (/✓\s*blog/.test(t.output)) return 'The script still prints `✓ blog is live` for a site with no index.html. The function has to end with `return 1` before it gets to that line.';
        if (!isUntouched(t.aws, 'blog')) return 'The blog is reported as failed, which is honest. But its bucket was still changed before the script noticed: old files are gone. Put the guard before the first `aws` command.';
        if (!/✗.*blog/.test(t.output)) return 'The blog failed quietly. Keep the `|| echo "✗ $site failed, carrying on" >&2` in the loop so the failure is said out loud.';
        // Another night, another broken site: the guard must look at the site it was given
        const otherNight = deploy(script, 'shop docs', { broken: ['docs'] });
        if (!isUntouched(otherNight.aws, 'docs') || /✓\s*docs/.test(otherNight.output)) return 'The guard caught the blog. On a night when the docs were the site with no index.html, their deploy went ahead. Test the folder of the site being deployed, `"$dir/index.html"`, not one site\'s name.';
        // A build that died halfway can leave an empty index.html
        const empty = deploy(script, 'shop docs', { files: { 'sites/docs/index.html': '' } });
        if (!isUntouched(empty.aws, 'docs') || /✓\s*docs/.test(empty.output)) return 'A build that dies halfway can leave an index.html with nothing in it. I gave the docs an empty one, and the script deployed it. `[ -s file ]` is true only when the file exists and has something in it; `-f` and `-e` accept an empty file.';
        // A step that fails in the middle: the docs' distribution ID is mistyped
        const typo = deploy(script, 'shop docs', { ids: { docs: ['E1DOCSCOM3V9', SITES.docs.ids[1]] } });
        if (/✓\s*docs/.test(typo.output)) return 'The guard works. Now the other steps: I gave the docs a mistyped distribution ID, the cache clear failed, and the script still printed `✓ docs is live`. Every `aws` line needs its own `|| return 1`.';
        // A failed upload: the shop's bucket doesn't exist
        const gone = deploy(script, 'shop docs', { noBucket: ['shop'] });
        if (gone.aws.calls.some((c) => c.command === 'cp' && c.args.join(' ').includes(SITES.shop.bucket))) return 'Nearly. When `aws s3 sync` fails (I pointed the shop at a bucket that doesn\'t exist), the function still goes on to `aws s3 cp`. The sync line needs `|| return 1` too.';
        if (/✓\s*shop/.test(gone.output)) return 'When the upload fails, the function still ends with `✓ shop is live`. Check that each `aws` line ends with `|| return 1`.';
        // The step in the middle: aws s3 cp fails after a sync that worked
        const cut = withFailingStep(script, 's3 cp', 'shop');
        if (cut.steps.includes('cloudfront create-invalidation') || /✓\s*shop/.test(cut.output)) return 'One line left. I made `aws s3 cp` fail on its own (an upload cut off halfway), and the function carried on past it. The `aws s3 cp` line needs `|| return 1` too.';
        return true;
      },
      success: 'Now the blog fails before anything is touched, the failure is reported, and the docs still go out. In this practice account the blog\'s bucket may still be damaged from your earlier runs: press **Reset the practice server** and run the script again to see a clean night.',
    },
    {
      id: 'count',
      kind: 'try',
      title: 'Count the failures, safely',
      minutes: 10,
      body: `The script should end by saying how many sites failed. A colleague added a counter the way you'd write it in most languages: \`((failed++))\`. Press **Run** on the editor and watch: the blog fails, and then the script ends. No error message, no docs, no last line.

\`(( ... ))\` is Bash's command for arithmetic, and like every command it ends with an exit code. Its rule: **a result of 0 counts as a failure.** That's handy in tests like \`if ((count > 5))\`, and a trap here. \`failed++\` adds one but hands back the value from *before*, which is 0 the first time. Try it:

\`\`\`bash
failed=0
((failed++))
echo "exit code: $?, failed: $failed"
\`\`\`

The counter went up to 1, and the command "failed". Under \`set -e\`, that ends the script: silently, at the very moment it's recording its first problem.

> **It depends on the version, which makes it worse.** Bash has applied \`set -e\` to \`(( ))\` since version 4.1, which is what Linux servers and build machines run. The much older Bash 3.2 that a Mac still ships as \`/bin/bash\` lets the line pass. So this script can work on a laptop and stop on the server.

The form you used in Tutorial 1 has no such surprise. It's an assignment, and an assignment succeeds whatever the number is:

\`\`\`bash
failed=0
failed=$((failed + 1))
echo "exit code: $?, failed: $failed"
\`\`\``,
      task: 'Repair the counter in `deploy.sh` so that `./deploy.sh shop blog docs` reaches its last line and prints `Done: 1 of 3 sites failed`, with the docs live.',
      hint: 'One line changes: the one with `((failed++))`. The lesson shows a second way to add 1, which starts with `failed=`. Leave `set -euo pipefail` alone.',
      solution: COUNT_SOLUTION,
      files: [{ path: 'deploy.sh', starter: COUNT_STARTER, executable: true, runCommand: './deploy.sh shop blog docs', runLabel: 'Run ./deploy.sh shop blog docs' }],
      scenario: () => world({ broken: ['blog'] }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const one = deploy(script, 'shop blog docs', { broken: ['blog'] });
        const problem = unreadable(one);
        if (problem) return problem;
        if (!keepsSetE(script)) return 'Keep `set -euo pipefail`. Without it the counter works, and so does every mistake `set -e` was there to catch. Change the line that counts instead.';
        if (!isLive(one.aws, 'docs')) return 'The script still ends right after the blog fails, and the docs are never tried. Look at the line that counts.';
        if (!/\b1 of 3\b/.test(one.output)) return 'The docs are live. The last line should read `Done: 1 of 3 sites failed`.';
        const two = deploy(script, 'shop blog docs', { broken: ['blog', 'docs'] });
        if (!/\b2 of 3\b/.test(two.output)) return 'One failure is counted. With two broken sites the last line should say `2 of 3`: the counter must go up by one for each failed site.';
        const none = deploy(script, 'shop blog docs');
        if (!/\b0 of 3\b/.test(none.output)) return 'With no broken site the last line should say `0 of 3`.';
        return true;
      },
      success: 'A counter that can\'t end your script, on any version of Bash. `((failed++))` is fine in a script without `set -e`, which is why this bug is so easy to carry in from somewhere else.',
    },
    {
      id: 'summary',
      kind: 'try',
      title: 'A summary that can\'t lie',
      minutes: 20,
      body: `After three sites, the lines that matter have scrolled away. So the script ends with a summary, and the summary is the part people read. Often it's the only part.

Press **Run** on the editor and read the summary. \`✓ blog\`, right under the error that says the blog failed. Someone typed those three lines on a day when everything worked, and the count below them is the only honest line.

**A summary must be built from what happened, never written in advance.** Collect one line per site at the moment you know its result, and print the collection at the end:

\`\`\`text
summary=""
...
summary="\${summary}✓ \${site}"$'\\n'
\`\`\`

- \`"\${summary}✓ \${site}"\` is the summary so far, plus one new line. The braces show Bash where each name ends.
- \`$'\\n'\` is how you write a **line break** inside a command. Try \`echo "one"$'\\n'"two"\` in the terminal.
- At the end, \`printf '%s' "$summary"\` prints the text exactly as it is. \`printf\` is \`echo\` without the automatic line break; \`%s\` marks where the text goes.

An \`if\` has room for both outcomes, which reads better than \`||\` once each branch has two things to do:

\`\`\`text
if deploy_site "$site"; then
  ...the line for a site that worked
else
  ...the line for a site that failed, and the counter
fi
\`\`\`

A function call as the test of an \`if\` is the same situation as a call before \`||\`: \`set -e\` is off inside it. Your \`|| return 1\` lines are what keep it honest.

> **Know arrays already?** \`lines+=("✓ $site")\` in the loop and \`printf '%s\\n' "\${lines[@]}"\` at the end do the same job. Any way of collecting the lines is fine, as long as they come from the loop.`,
      task: 'Replace the hand-typed summary. Under the `Summary` heading, print one line per site in the order they were given: `✓ <site>` if it deployed, `✗ <site>` if it failed. Keep the `Done:` line.',
      hint: 'Three places change. Before the loop, start an empty `summary`. In the loop, replace the `||` line with `if deploy_site "$site"; then ... else ... fi`: each branch adds its `✓` or `✗` line to `summary`, and the `else` also counts the failure. After the heading, `printf \'%s\' "$summary"` takes the place of the three typed lines.',
      solution: SUMMARY_SOLUTION,
      files: [{ path: 'deploy.sh', starter: SUMMARY_STARTER, executable: true, runCommand: './deploy.sh shop blog docs', runLabel: 'Run ./deploy.sh shop blog docs' }],
      scenario: () => world({ broken: ['blog'] }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const t = deploy(script, 'shop blog docs', { broken: ['blog'] });
        const problem = unreadable(t);
        if (problem) return problem;
        const lines = summaryOf(t.output);
        if (!lines) return 'Keep the `Summary` heading on a line of its own, with the ✓ / ✗ lines under it.';
        if (lines.includes('✓ blog')) return 'The summary still shows `✓ blog`, and the blog failed. Each line has to come from the result of `deploy_site` for that site.';
        if (!same(lines, ['✓ shop', '✗ blog', '✓ docs'])) {
          const after = t.output.slice(t.output.search(/^\s*summary\b/im));
          if (/[✓✗][^\n]*[✓✗]/.test(after)) return 'The summary\'s lines came out joined on one line. Either the line breaks were never added: end each line with `$\'\\n\'`, written right after the closing double quote (inside double quotes, `\\n` stays two characters). Or they were lost on the way out: print with `printf \'%s\' "$summary"`, double quotes included.';
          return `Under \`Summary\` I expected three lines, \`✓ shop\`, \`✗ blog\`, \`✓ docs\`, and found: ${lines.length ? lines.map((l) => `\`${l}\``).join(', ') : 'none'}.`;
        }
        if (!/\b1 of 3\b/.test(t.output) || !isLive(t.aws, 'docs')) return 'The summary is right. Keep counting the failures too: the last line should still say `1 of 3`, and the docs should be live.';
        // Another night: other sites, another order, another failure
        const other = deploy(script, 'docs shop', { broken: ['shop'] });
        const otherLines = summaryOf(other.output) || [];
        if (!same(otherLines, ['✓ docs', '✗ shop'])) return `That's right for tonight. Then I ran \`./deploy.sh docs shop\` on a night when the shop was the broken one, and the summary showed: ${otherLines.length ? otherLines.map((l) => `\`${l}\``).join(', ') : 'nothing'}. It should be \`✓ docs\`, \`✗ shop\`: built in the loop, for the sites that were asked for.`;
        return true;
      },
      success: 'The summary and the loop can no longer disagree, because the summary *is* what the loop saw. Run `echo $?` now: the script still ends with 0 after a failed site. People get the truth; programs don\'t yet.',
    },
    {
      id: 'exit-codes',
      kind: 'try',
      title: 'Exit codes with meaning: 0, 1, 2',
      minutes: 20,
      body: `At 2 a.m. nobody reads your summary. A scheduler such as cron (Tutorial 1) runs the script, and all it gets back is the exit code. So the code has to say **which kind** of ending this was, because the reactions differ:

| Exit code | Meaning | What the caller should do |
|---|---|---|
| \`0\` | every site deployed | nothing |
| \`1\` | at least one site failed | tell a person: something is wrong with a site |
| \`2\` | the script was called wrong | fix the command: no site was touched |

Using \`2\` for "you called me wrong" is an old habit: Bash's own built-in commands do it. The AWS command line (version 2) gives its codes meanings too. Its documentation lists, among others:

| \`aws\` exit code | Meaning |
|---|---|
| \`0\` | the command worked |
| \`1\` | only from \`aws s3\` commands: one or more transfers failed |
| \`252\` | the command was written wrong: bad syntax, an unknown option, a required one left out |
| \`253\` | configuration or credentials are missing |
| \`254\` | the command was fine, but the AWS service answered with an error |
| \`255\` | the command failed for another reason, in the \`aws\` program or at AWS |

Your script doesn't need to tell these apart: any code other than 0 from \`aws\` fails the site. The table is for the day you read a log and want to know which kind of failure it was.

\`nightly.sh\` is in your folder: it's the caller. Read it, it's short:

\`\`\`bash
cat nightly.sh
\`\`\`

### What's in the editor

The script got its \`usage\` function back from Tutorial 4, and one new feature: \`./deploy.sh all\`. The \`set --\` line replaces the script's arguments with the first word of every line of \`sites.txt\`, so the loop below it doesn't care whether you typed names or \`all\`. \`"\${1:-}"\` means "the first argument, or nothing if there is none", which \`set -u\` insists on.

For the second TODO you need a yes-or-no question: is this name in \`sites.txt\`? \`grep -q\` asks it. \`-q\` is for quiet: \`grep\` prints nothing and only sets its exit code, 0 when it found a line. A \`!\` in front of a command turns its answer around, so this reads "if the name is **not** there":

\`\`\`text
if ! grep -q "^$site " "$SITES_FILE"; then
\`\`\`

The last line of the script is a colleague's idea: \`exit "$failed"\`. It looks clever, and it's wrong: with two failed sites the script ends with \`2\`, and the scheduler reads "wrong usage, don't wake anyone". **A failure is always \`1\`**, however many sites failed.

> **For the Developer Associate exam:** AWS deployment tools read exit codes the same way. When AWS CodeDeploy deploys to EC2 instances or to your own servers, it runs your scripts as *lifecycle event hooks*. A hook has failed when its script ends with an exit code other than 0, or runs longer than its timeout. A script that prints an error and still ends with 0 counts as a success.`,
      task: 'Finish `deploy.sh`: (1) with no argument, call `usage` (exit code 2); (2) for a name that isn\'t in `sites.txt`, print `Unknown site: <name>` to the error stream and call `usage`, before **any** site is deployed; (3) end with exit code 1 when one or more sites failed, and 0 when none did.',
      hint: '(1) An `if` that tests `[ "$#" -eq 0 ]`. (2) A second `for` loop over `"$@"`, placed after the `all` lines and before the loop that deploys, with the `if ! grep -q ...` test from the lesson inside it. (3) The last line: `exit 1` only when `$failed` is greater than 0.',
      solution: CODES_SOLUTION,
      files: [{ path: 'deploy.sh', starter: CODES_STARTER, executable: true, runCommand: './deploy.sh all', runLabel: 'Run ./deploy.sh all' }],
      scenario: () => world({ broken: ['blog'], files: { 'nightly.sh': NIGHTLY } }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh') && !ran(history, 'nightly.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const none = deploy(script, '');
        const problem = unreadable(none);
        if (problem) return problem;
        if (none.status !== 2) return `\`./deploy.sh\` with no argument should end with exit code 2. It ended with ${none.status}.`;
        if (!/usage/i.test(none.stderr)) return 'With no argument, the usage line should be printed (to the error stream). Call `usage`.';
        const wrong = deploy(script, 'shop blgo');
        if (wrong.status !== 2) return `\`./deploy.sh shop blgo\` has a misspelled site, so it should end with exit code 2. It ended with ${wrong.status}.`;
        if (!isUntouched(wrong.aws, 'shop')) return 'With `./deploy.sh shop blgo`, the shop was deployed before the script noticed the misspelled name. Check every name first, in a loop of its own, before the loop that deploys.';
        if (!/blgo/.test(wrong.stderr)) return 'Say which name is wrong: print `Unknown site: blgo` to the error stream before calling `usage`.';
        // Words that are in sites.txt without being a site's name
        for (const word of ['sho', 'prod']) {
          const part = deploy(script, word);
          if (part.status !== 2) return `\`./deploy.sh ${word}\` should end with exit code 2, and it ended with ${part.status}. \`${word}\` can be found in sites.txt, but it isn't the name of a site. Compare with the whole first word of a line: \`grep -q "^$site " "$SITES_FILE"\` (\`^\` is the start of the line, and the space ends the word).`;
        }
        const one = deploy(script, 'all', { broken: ['blog'] });
        if (one.status === 2 && /unknown site:?\s*all/i.test(one.stderr)) return '`./deploy.sh all` ended with exit code 2: the script took `all` for a site name. Check the names after the lines that replace `all` with the list from sites.txt.';
        if (one.status !== 1) return `With one failed site, \`./deploy.sh all\` should end with exit code 1. It ended with ${one.status}.`;
        const two = deploy(script, 'all', { broken: ['blog', 'docs'] });
        if (two.status !== 1) return `With two failed sites the exit code was ${two.status}. A caller reads 2 as "called wrong". Any number of failures is exit code 1.`;
        if (!isLive(two.aws, 'shop') || !same(summaryOf(two.output), ['✓ shop', '✗ blog', '✗ docs'])) return 'The exit codes are right. Keep the deploy loop and the summary as they were: with the blog and the docs broken, `./deploy.sh all` should still publish the shop and show all three lines.';
        const fine = deploy(script, 'all');
        if (fine.status !== 0 || !NAMES.every((n) => isLive(fine.aws, n))) return `On a night with no broken site, \`./deploy.sh all\` should publish all three and end with exit code 0. It ended with ${fine.status}.`;
        return true;
      },
      success: 'Now the caller can act without reading a word. Try it: `bash nightly.sh`, then `./deploy.sh shop blgo; echo "exit code: $?"` and `./deploy.sh; echo "exit code: $?"`.',
    },
    {
      id: 'two-caches',
      kind: 'try',
      title: 'Two names, two caches',
      minutes: 20,
      body: `Morning. The summary said \`✓ shop\`, and customers on the new address, \`shop.example.org\`, still see the autumn prices.

Look at \`sites.txt\` again: every site has **two** distribution IDs. The company answers on \`example.com\` and \`example.org\`, each address has its own CloudFront distribution, and both read the same bucket. The upload reaches both, because there's only one bucket. The cache clear doesn't: an invalidation is sent to **one** distribution (that's what \`--distribution-id\` says), and each distribution keeps its own copies. The script cleared the first ID on each line and never looked at the second.

Why the prices page? Everything except \`index.html\` is uploaded with a one-year cache. \`prices.html\` keeps its name from one deploy to the next, so a distribution goes on handing out its saved copy until that copy expires or an invalidation removes it. (A one-year cache is right for files whose names change with every build, like \`app-7c1e90.js\`. For a page that keeps its name, the invalidation is the only thing that gets the new version out.)

The real script is in the same situation: Level Up Study Hub is served under two names while it moves to a new one, with two distributions for most of its sites.

In the editor, \`deploy_site\` now takes **every** ID from the site's line: \`cut -d' ' -f3-\` splits the line at its spaces and keeps everything from the third word on. It hands them to a new function, \`clear_cache\`, each as its own argument. That is why \`$ids\` has no quotes on that line: without quotes, Bash cuts the text at its spaces, and each ID becomes one argument. With quotes, both IDs would arrive as one argument with a space in it. This is one of the few places where leaving the quotes off is right, and the comment on the line says so.

\`clear_cache\` still clears only its first argument. Your job is its loop, and two decisions come with it:

- **Try every distribution, even after one fails.** If the first call fails, clearing the second still helps half your visitors.
- **Fail the site if any call failed.** Visitors on that address still get old pages, so \`✓\` would be a lie.

\`clear_cache\` is called with \`|| return 1\` after it. You know what that means by now: \`set -e\` is off inside, so the function has to keep its own count of problems and \`return\` it. A neat last line for that is a test on its own: \`[ "$problems" -eq 0 ]\` succeeds when there were none, and a function's result is the result of its last command.

Tonight's surprise is in \`sites.txt\`: someone retyped the docs' first ID by hand and dropped its last letter.

> **Cost:** the first 1,000 invalidation paths a month are free, counted across all the distributions in the account, and \`/*\` is one path however many files it covers. Three sites with two distributions each use 6 paths per deploy.`,
      task: 'Finish `clear_cache` so it creates an invalidation for `/*` in **every** distribution it is given. It must try them all even if one fails, print `✗ <id>: cache not cleared` to the error stream for each failure, and end with a failure when any of them failed. Run `./deploy.sh all`: the shop and blog should be cleared under both names, and the docs reported as `✗` with their second distribution still cleared.',
      hint: 'Start with `local id problems=0`, then a `for` loop over `"$@"`. In the loop, run the same `aws` line with `"$id"` in place of `"$1"`, as the test of an `if !` (or with `||` after it): on a failure, print the message and add one to `problems`. Don\'t `return` inside the loop. The last line of the function is the test `[ "$problems" -eq 0 ]`.',
      solution: DEPLOY_SOLUTION,
      files: [{ path: 'deploy.sh', starter: CACHES_STARTER, executable: true, runCommand: './deploy.sh all', runLabel: 'Run ./deploy.sh all' }],
      scenario: () => world({ ids: { docs: ['E1DOCSCOM3V9', SITES.docs.ids[1]] } }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const script = fileText(fs, 'deploy.sh');
        const fine = deploy(script, 'all');
        const problem = unreadable(fine);
        if (problem) return problem;
        const missed = NAMES.flatMap((n) => SITES[n].ids).filter((id) => !cleared(fine.aws, id));
        if (missed.length) return `On a good night, ${missed.length} of the 6 distributions got no invalidation for \`/*\` (for example \`${missed[0]}\`). \`clear_cache\` has to loop over every ID in \`"$@"\`.`;
        if (fine.status !== 0) return `With every ID right, \`./deploy.sh all\` should end with exit code 0. It ended with ${fine.status}: does \`clear_cache\` end with a success when nothing failed?`;
        // The first ID of the docs is wrong: the second must still be cleared, and the site must fail
        const first = deploy(script, 'all', { ids: { docs: ['E1DOCSCOM3V9', SITES.docs.ids[1]] } });
        if (!cleared(first.aws, SITES.docs.ids[1])) return 'When the docs\' first ID is wrong, their second distribution is never cleared. Don\'t leave the loop at the first failure: note it, and go on to the next ID.';
        if (!same(summaryOf(first.output), ['✓ shop', '✓ blog', '✗ docs'])) return 'One of the docs\' two caches wasn\'t cleared, and the summary still says `✓ docs`. `clear_cache` has to end with a failure when any ID failed, not only the last one.';
        if (!/✗.*E1DOCSCOM3V9/.test(first.stderr)) return 'Say which distribution failed: print `✗ <id>: cache not cleared` to the error stream.';
        // The second ID wrong instead
        const second = deploy(script, 'all', { ids: { docs: [SITES.docs.ids[0], 'E2DOCSORG7P4'] } });
        if (!same(summaryOf(second.output), ['✓ shop', '✓ blog', '✗ docs']) || second.status !== 1) return 'When the docs\' second ID is the wrong one, the docs should be `✗` and the exit code 1.';
        // A site with a single distribution
        const single = deploy(script, 'all', { ids: { blog: [SITES.blog.ids[0]] } });
        if (single.status !== 0 || !same(summaryOf(single.output), ['✓ shop', '✓ blog', '✓ docs']) || !cleared(single.aws, SITES.blog.ids[0])) return 'Not every site has two distributions. I gave the blog a single ID in sites.txt, and its deploy no longer ended with `✓`. Loop over `"$@"`, however many IDs there are, instead of naming `$1` and `$2`.';
        return true;
      },
      success: 'Both names, every site, and a failed cache clear can\'t hide behind a `✓`. On a night when every ID is right, all three sites get their `✓` and all six caches are cleared: the check behind this task tried that too.',
    },
    {
      id: 'pretend-aws',
      kind: 'try',
      title: 'Test without AWS: a pretend aws first on PATH',
      minutes: 20,
      body: `So far, every bug showed itself the expensive way: during a deploy, with live sites at stake. You can't rehearse "what if CloudFront fails?" against the real AWS, because you can't ask it to fail. And trying a changed deploy script on live sites is how a live site loses its files.

So give the script a **pretend \`aws\`**: a small script of your own, with the same name, that touches nothing and writes down every call it gets. Then you can read exactly what the deploy *would* have done, and make any step fail whenever you like.

### How Bash finds a command

When you type \`aws\`, Bash looks through a list of folders, in order, and runs the first file named \`aws\` it finds. The list is in a variable called **\`PATH\`**, with colons between the folders:

\`\`\`bash
echo "$PATH"
\`\`\`

\`command -v\` shows which file a name leads to:

\`\`\`bash
command -v aws
\`\`\`

Put a folder of your own at the **front** of that list, and Bash finds your \`aws\` first. Writing a variable in front of a command changes it for that one command only:

\`\`\`text
PATH="$PWD/test/bin:$PATH" ./deploy.sh shop
\`\`\`

\`$PWD\` is the folder you're in; \`:$PATH\` keeps the rest of the list, so \`grep\`, \`awk\` and the others are still found. \`deploy.sh\` doesn't change at all, and doesn't know.

### The pretend aws

It lives in \`test/bin/aws\` (open in the editor) and is told what to do through two variables:

- \`FAKE_AWS_LOG\`: the file to write each call to. One line per call: the word \`aws\`, then every argument. \`"$*"\` is all the arguments joined into one piece of text, and \`>>\` adds a line to the end of a file.
- \`FAKE_AWS_FAIL\`: a service name, like \`cloudfront\`. When the first argument (\`$1\`, the service) matches, exit with 1. Any other call exits 0. Write to the log **first**, so a call that fails still shows in it.

> Quote \`"$*"\`. Without the quotes, Bash replaces the argument \`/*\` with the names of the folders at the top of the disk, and your log would show a call the deploy never made.`,
      task: 'Complete `test/bin/aws`: log every call to `$FAKE_AWS_LOG` as `aws <arguments>`, and exit 1 when its first argument equals `$FAKE_AWS_FAIL`. Then press Run: the deploy of the shop runs against your pretend aws and the log is printed. It should show four calls, and the practice AWS account must stay untouched.',
      hint: 'Logging is one `echo` of `"aws $*"`, added to the file with `>> "$FAKE_AWS_LOG"`. Failing is an `if` that compares `"${1:-}"` with `"${FAKE_AWS_FAIL:-none}"`, with a message to the error stream and `exit 1` inside. The `:-none` gives the variable a value when no test has set it.',
      solution: FAKE_AWS_SOLUTION,
      files: [{
        path: 'test/bin/aws', starter: FAKE_AWS_STARTER, executable: true,
        runCommand: 'rm -f test/calls.log; PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$PWD/test/calls.log" ./deploy.sh shop; cat test/calls.log',
        runLabel: 'Deploy the shop with the pretend aws',
      }],
      // The starter is here too, so the folder test/bin exists before the editor writes to it
      scenario: () => world({ files: { 'deploy.sh': runnable(DEPLOY_SOLUTION), 'test/bin/aws': runnable(FAKE_AWS_STARTER) } }),
      check: ({ fs, history }) => {
        if (!ran(history, 'deploy.sh')) return null;
        const files = { 'deploy.sh': DEPLOY_SOLUTION, 'test/bin/aws': fileText(fs, 'test/bin/aws') };
        const run = (prefix = '') => trial(files, `${prefix}PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$PWD/test/calls.log" ./deploy.sh shop`);
        const t = run();
        const problem = unreadable(t);
        if (problem) return problem;
        if (t.aws.calls.length) return 'The deploy reached the practice AWS account, so your pretend `aws` wasn\'t the one that ran. Start the deploy with the Run button on the editor (it puts `test/bin` first on `PATH`).';
        const log = t.fs.isFile(`${HOME}/test/calls.log`) ? t.fs.read(`${HOME}/test/calls.log`).split('\n').filter(Boolean) : [];
        if (!log.length) return 'Nothing was written to the log yet. Add one line to the file `"$FAKE_AWS_LOG"` for every call (the first TODO).';
        if (log.some((l) => !l.startsWith('aws '))) return 'Start each log line with the word `aws`, then the arguments, so the log reads like the commands that were run.';
        if (t.status !== 0 && log.length < 4) return 'With nothing told to fail, every call should end with exit code 0. The deploy gave up after a call that failed: check when your pretend `aws` exits with 1.';
        if (log.length !== 4) return `Deploying the shop makes 4 calls to \`aws\` (sync, cp, and two invalidations). The log has ${log.length === 1 ? '1 line' : `${log.length} lines`}. Use \`>>\` so each call adds a line instead of replacing the file.`;
        if (!log.includes(`aws s3 sync sites/shop/ s3://${SITES.shop.bucket}/ --delete --exclude index.html --cache-control max-age=31536000,public`)) return 'The log should hold every argument of each call, in order: `aws s3 sync sites/shop/ ...` and so on. Use `"$*"`.';
        if (!log.some((l) => l.endsWith('--paths /*'))) return 'Look at the invalidation lines in the log: `/*` has been replaced by folder names. Put `$*` inside double quotes.';
        if (t.status !== 0) return `With nothing told to fail, every call should exit 0 and the deploy should end with 0. It ended with ${t.status}.`;
        const failing = run('FAKE_AWS_FAIL=cloudfront ');
        if (failing.status !== 1) return 'Logging works. Now the second TODO: with `FAKE_AWS_FAIL=cloudfront`, calls whose first argument is `cloudfront` should exit 1, and the deploy should then fail.';
        const failLog = failing.fs.read(`${HOME}/test/calls.log`).split('\n').filter(Boolean);
        if (failLog.filter((l) => l.startsWith('aws s3 ')).length !== 2) return 'With `FAKE_AWS_FAIL=cloudfront`, only the cloudfront calls should fail. The two `s3` calls should still succeed and be in the log.';
        if (failLog.filter((l) => l.startsWith('aws cloudfront ')).length !== 2) return 'Write the call to the log before deciding to fail, so the log shows the calls that failed too.';
        const upload = run('FAKE_AWS_FAIL=s3 ');
        if (upload.status !== 1 || upload.fs.read(`${HOME}/test/calls.log`).includes('cloudfront')) return 'CloudFront can be made to fail. With `FAKE_AWS_FAIL=s3`, the `s3` calls should fail instead, and the deploy should stop at the first one. Compare the first argument with the variable itself, not with the word `cloudfront`.';
        return true;
      },
      success: 'Read the log: that\'s the whole deploy, as four lines of text, and nothing was touched. Now make CloudFront fail: `FAKE_AWS_FAIL=cloudfront PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$PWD/test/calls.log" ./deploy.sh shop; echo "exit code: $?"`. `✗ shop`, exit code 1: your script tells the truth about a failure you could never have produced on demand.',
    },
    {
      id: 'test-script',
      kind: 'try',
      title: 'A test that can fail',
      minutes: 25,
      body: `Typing that long command and reading the output by eye works once. A **test** is a script that does the running *and* the reading, and says \`✓\` or \`✗\` for each fact it checked. Run it after every change to \`deploy.sh\`: it takes two seconds and costs nothing.

\`test-deploy.sh\` is in the editor. Read its three parts:

- \`check\` takes an exit code and a sentence. It prints \`✓\` when the code is 0, \`✗\` otherwise, and counts the failures. You call it right after the command that tests the fact: \`grep -q "✓ shop" "$OUT"; check $? "the summary says ✓ shop"\`. \`$?\` is the exit code of the command just before it.
- \`run_deploy\` runs \`deploy.sh\` with the pretend \`aws\` in front. \`> "$OUT" 2>&1\` saves everything the deploy prints, messages and errors, in a file. \`|| code=$?\` keeps the deploy's exit code.
- **Test 1** deploys the shop and checks four facts.

This script has \`set -u\` but no \`-e\`, on purpose: commands like \`grep -q\` are *supposed* to fail here sometimes, and the script's job is to report that, not to stop.

**Test 2** is yours. To make the pretend \`aws\` fail, the variable has to reach it, two programs down: your test starts \`deploy.sh\`, which starts \`aws\`. A plain \`NAME=value\` line stays inside the script that wrote it. \`export\` marks the variable to be handed on to every program started from here, and to the programs those start. (A variable written in front of a command, like \`FAKE_AWS_LOG\` in \`run_deploy\`, is handed on the same way, for that one command.) \`unset\` removes the variable again so later tests aren't affected:

\`\`\`text
export FAKE_AWS_FAIL=cloudfront
run_deploy shop
unset FAKE_AWS_FAIL
\`\`\`

To check that something is **not** there, put \`!\` in front: \`! grep -q "text" file\` succeeds when the text is missing.

One rule for every test you write: **a test that can't fail proves nothing.** The check behind this task runs your test against two broken copies of \`deploy.sh\`: one that prints \`✓\` after a failure, one that always ends with exit code 0. A good test says \`✗\` to both.`,
      task: 'Write Test 2 in `test-deploy.sh`: deploy the shop while every `cloudfront` call fails, then check at least two facts with `check`: the exit code is 1, and the summary says `✗ shop`. The whole test script must pass against your finished `deploy.sh`.',
      hint: 'Start with the three lines from the last box. Then copy the pattern of Test 1: a test, a semicolon, `check $? "what should be true"`. One test compares `"$code"` with 1; the other looks for `✗ shop` in `"$OUT"` with `grep -q`.',
      solution: TEST_SOLUTION,
      files: [{ path: 'test-deploy.sh', starter: TEST_STARTER, executable: true, runCommand: './test-deploy.sh', runLabel: 'Run ./test-deploy.sh' }],
      scenario: () => world({ files: { 'deploy.sh': runnable(DEPLOY_SOLUTION), 'test/bin/aws': runnable(FAKE_AWS_SOLUTION) } }),
      check: ({ fs, history }) => {
        if (!ran(history, 'test-deploy.sh')) return null;
        const test = fileText(fs, 'test-deploy.sh');
        const against = (deployScript) => trial({ 'deploy.sh': deployScript, 'test/bin/aws': NOTING_AWS, 'test-deploy.sh': test }, './test-deploy.sh');
        const good = against(DEPLOY_SOLUTION);
        const problem = unreadable(good);
        if (problem) return problem;
        if (good.aws.calls.length) return 'Your test reached the practice AWS account. Run the deploy through `run_deploy`, which puts the pretend `aws` first on `PATH`.';
        if (!good.fs.isFile('/tmp/pretend-failures')) {
          if (/^\s*FAKE_AWS_FAIL=\S+\s*$/m.test(test) && !/\b(export|declare\s+-x)\s+FAKE_AWS_FAIL\b/.test(test)) return '`FAKE_AWS_FAIL=cloudfront` on a line of its own stays inside the test script. `deploy.sh` and the pretend `aws` are separate programs, and they only receive variables that were exported: write `export FAKE_AWS_FAIL=cloudfront`.';
          return 'In Test 2, no call to the pretend `aws` failed yet. Write `export FAKE_AWS_FAIL=cloudfront`, then run the deploy again with `run_deploy shop`, and check that second run.';
        }
        if (good.status !== 0) {
          const firstFail = good.output.split('\n').find((l) => /✗/.test(l));
          return `Against the finished \`deploy.sh\` every check should pass. ${firstFail ? `This one didn't: "${firstFail.trim()}".` : `The test ended with exit code ${good.status}.`}`;
        }
        if (against(LYING_SUMMARY).status === 0) return 'I gave your test a broken `deploy.sh` that prints `✓ shop` after CloudFront failed, and your test passed it. Check what the summary in `"$OUT"` says about the shop.';
        if (against(ALWAYS_ZERO).status === 0) return 'I gave your test a broken `deploy.sh` that ends with exit code 0 after a failure, and your test passed it. Check `$code` after the failing run.';
        return true;
      },
      success: 'Your test passed on the good script and said ✗ to both broken ones. That\'s what makes its ✓ worth something. From now on the order is: change `deploy.sh`, run `./test-deploy.sh`, and only then go near a real account.',
    },
    {
      id: 'real-world',
      kind: 'read',
      title: 'How Level Up Study Hub\'s deploy does it',
      minutes: 8,
      body: `The script that publishes this site deploys up to eleven sites with \`./deploy.sh all\`. Here are the parts you just wrote, as they are in that script today (slightly shortened). It runs under zsh, a close relative of Bash: the two traps you met here, \`set -e\` switched off inside a function and \`((failed++))\`, behave the same in both.

**Every step looks after itself**, because each site's function is called where \`set -e\` is switched off. \`npm test\` runs the site's tests and \`npm run build\` builds it; \`print_error\` is the script's own function for a message in red:

\`\`\`sh
npm test || { print_error "Tests failed: not deploying"; cd "$SCRIPT_DIR"; return 1; }
npm run build || { print_error "Build failed: not deploying"; cd "$SCRIPT_DIR"; return 1; }
\`\`\`

**Both caches, every time, and a failure fails the site:**

\`\`\`sh
# invalidate_cloudfront <paths> <id>...: each site has an old-name and a new-name
# distribution on one bucket; clear every one, even after a failure
invalidate_cloudfront() {
    local paths="$1" dist_id failed=0
    shift
    for dist_id in "$@"; do
        aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "$paths" > /dev/null \\
            || { print_error "CloudFront invalidation failed for \${dist_id}."; failed=$((failed + 1)); }
    done
    [ $failed -eq 0 ] || return 1
}
\`\`\`

\`shift\` drops the first argument (the paths), so \`"$@"\` is the list of IDs: your \`clear_cache\`, with one more parameter.

**The result of each site is recorded when it is known**, and the summary is printed from that record. \`site_status\` is a table with one entry per site, and \`"$2"\` runs the function whose name was passed in:

\`\`\`sh
# run_site <key> <function>: deploy one site and remember how it ended
run_site() {
    if "$2"; then
        site_status[$1]=ok
    else
        site_status[$1]=failed
        failed=$((failed + 1))
    fi
}
\`\`\`

A failed site's summary line reads \`✗ ... NOT deployed: still the previous version\`, and the last line of the function is \`[ $failed -eq 0 ] || return 1\`, so "all" ends with a non-zero exit code when any site failed.

**And it has a test** that runs automatically: a temporary folder with a pretend \`aws\` and a pretend \`npm\` first on \`PATH\`, a log of their calls, and a variable that makes the pretend \`aws\` fail one invalidation. The same three ideas you used, with more sites.

### Where to go from here

- Run \`./test-deploy.sh\` automatically on every push with **GitHub Actions**: a workflow step fails when its command ends with a non-zero exit code, which your test now does.
- Give \`deploy_site\` a build step (\`npm run build || return 1\`) once your sites need building.
- Keep a deploy log with timestamps, like the \`log()\` function from Tutorial 3.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'A script has `set -e`. It calls `deploy_site shop || echo "failed"`. `deploy_site` is five plain commands, none of them followed by `|| return 1`, and the second one fails. What happens?', options: ['The script stops at once', 'The function stops and "failed" is printed', 'The function runs its remaining commands; its result is that of its last command', 'Bash prints a warning and retries the command'], answer: 2, explain: 'A function called before `||` (or `&&`, or as an `if` test) runs with `set -e` ignored for every line inside it. That\'s why each step needs its own `|| return 1`.' },
        { q: 'Inside `deploy_site`, a step fails. Which line stops this site and lets the loop go on to the next one?', options: ['`exit 1`', '`return 1`', '`break`', '`set -e`'], answer: 1, explain: '`return` ends the function and hands its code to the caller. `exit` would end the whole script, so the remaining sites would never be tried.' },
        { q: 'On a Linux server (Bash 4.1 or newer), under `set -e` and with `failed=0`, what does `((failed++))` do?', options: ['Sets failed to 1 and carries on', 'Sets failed to 1, then ends the script', 'Nothing: `++` isn\'t valid in Bash', 'Ends the script before changing failed'], answer: 1, explain: '`(( ))` reports a failure when its result is 0, and `failed++` hands back the old value, 0. Bash 3.2 on a Mac lets the line pass, which is how the bug hides. The safe form everywhere is `failed=$((failed + 1))`.' },
        { q: 'Why build the summary inside the loop instead of typing its lines at the end?', options: ['So each line comes from the real result of that site and can\'t claim a success that didn\'t happen', 'It runs faster', 'Bash can\'t print after a loop', 'To use less memory'], answer: 0, explain: 'A summary written in advance is a guess. One collected at the moment each result is known can\'t disagree with what happened.' },
        { q: 'Two sites failed. Why is `exit "$failed"` a mistake in this script?', options: ['It would exit with 2, which this script uses for "called wrong"', 'Exit codes must be 0 or 1', '`exit` can\'t take a variable', 'It would exit with 0'], answer: 0, explain: 'Callers act on the meaning of the number. Any number of failed sites is one kind of ending: exit code 1.' },
        { q: 'A site is served by two CloudFront distributions that read the same S3 bucket. After an upload, you invalidate `/*` on one of them. What do visitors see?', options: ['Everyone sees the new files', 'Nobody sees the new files', 'Visitors of the other distribution may keep getting its cached old copies', 'The invalidation fails'], answer: 2, explain: 'An invalidation is sent to one distribution, named by `--distribution-id`, and each distribution has its own cache. Clear every one that serves the site.' },
        { q: 'How does `PATH="$PWD/test/bin:$PATH" ./deploy.sh` make the script use a pretend `aws`?', options: ['It renames the real aws', 'It uninstalls the AWS command line for a moment', 'deploy.sh checks a setting called test', 'Bash searches the folders in PATH in order and runs the first `aws` it finds: the one in test/bin'], answer: 3, explain: 'PATH is a list of folders, searched left to right. Putting a folder in front, for one command, changes which file a name leads to. The script itself doesn\'t change.' },
        { q: 'Your test passes. What makes that result worth trusting?', options: ['It printed ✓', 'It ran quickly', 'You have seen it fail on a script that is really broken', 'It has more than ten checks'], answer: 2, explain: 'A test that passes on broken scripts too proves nothing. Break the script on purpose (make it lie in the summary, make it exit 0) and see the test say ✗.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'b5-args', front: 'Loop over every argument the script was started with', back: '`for site in "$@"; do ... done` (keep the quotes; `$#` is how many there are)', tags: ['scripts', 'loops'], difficulty: 'easy' },
        { id: 'b5-return', front: '`return 1` vs `exit 1` inside a function', back: '`return` ends the function and hands 1 to its caller. `exit` ends the whole script.', tags: ['functions'], difficulty: 'easy' },
        { id: 'b5-trap', front: 'What happens to `set -e` inside a function called as `f || ...`?', back: 'It is ignored for every line in the function. Give each step its own `|| return 1`.', hint: 'also true for `if f; then` and `f && ...`', tags: ['set -e'], difficulty: 'hard' },
        { id: 'b5-count', front: 'Add 1 to a counter safely under `set -e`', back: '`failed=$((failed + 1))`. `((failed++))` fails when the old value is 0 and ends the script.', tags: ['set -e', 'arithmetic'], difficulty: 'medium' },
        { id: 'b5-newline', front: 'Add a line to a text variable, with a line break after it', back: '`summary="${summary}✓ ${site}"$\'\\n\'`, then print with `printf \'%s\' "$summary"`', tags: ['variables'], difficulty: 'medium' },
        { id: 'b5-codes', front: 'The three exit codes of the deploy script', back: '0: every site deployed. 1: at least one site failed. 2: the script was called wrong, nothing was touched.', tags: ['exit codes'], difficulty: 'easy' },
        { id: 'b5-two', front: 'One bucket, two CloudFront distributions. What must a deploy do after the upload?', back: 'Invalidate `/*` on **each** distribution: `aws cloudfront create-invalidation --distribution-id ID --paths "/*"`, once per ID.', tags: ['cloudfront'], difficulty: 'medium' },
        { id: 'b5-path', front: 'Run `deploy.sh` with a pretend `aws` from `test/bin`, for this one command', back: '`PATH="$PWD/test/bin:$PATH" ./deploy.sh shop`', hint: 'the first match in PATH wins', tags: ['PATH', 'testing'], difficulty: 'medium' },
        { id: 'b5-keepcode', front: 'Keep a command\'s exit code without `set -e` stopping the script', back: '`code=0; ./deploy.sh shop || code=$?`', tags: ['exit codes', 'testing'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 45,
      body: `Deploy two real sites with one command, and prove with a test that the script tells the truth. You need the AWS command line and the admin sign-in from *Start here*.

1. **Two sites to publish.** Each site is a private bucket with a CloudFront distribution in front of it. If your site from Tutorial 4 still exists, it's your first one. For each site you still need, make a bucket (new buckets are private):

\`\`\`sh
aws s3 mb s3://blog-yourname-2026
\`\`\`

Then make its distribution in the CloudFront console: *Create distribution* → give it a name → **Single website or app** → *Next* → origin type **Amazon S3** → *Browse S3* and choose the bucket → keep **Use recommended origin settings** → *Next* → on the **Enable security protections** page, choose not to enable them → *Next* → *Create distribution*. If a page offers pricing plans, choose **Pay as you go**. With the recommended settings, CloudFront sets up origin access control (OAC) and adds the bucket policy for you: the bucket stays private and only this distribution can read it. Last, on the distribution's *General* tab, choose *Edit* in the *Settings* pane and set **Default root object** to \`index.html\`.

2. **The project folder**, with a small page for each site:

\`\`\`sh
mkdir -p ~/aws-study-projects/bash/multi-deploy
cd ~/aws-study-projects/bash/multi-deploy
mkdir -p test/bin sites/shop sites/blog
echo '<h1>My shop</h1>' > sites/shop/index.html
echo '<h1>My blog</h1>' > sites/blog/index.html
\`\`\`

The buttons at the bottom of this page download the three finished scripts of this tutorial and an example \`sites.txt\`. Move them in so the folder looks like this. The pretend \`aws\` must be named \`aws\`, with no ending: if your browser saves it as \`aws.txt\`, rename it. Put it in \`test/bin/\`, never in a folder that is on your real \`PATH\`.

\`\`\`text
~/aws-study-projects/bash/multi-deploy/
  deploy.sh
  test-deploy.sh
  sites.txt
  test/bin/aws
  sites/shop/index.html
  sites/blog/index.html
\`\`\`

3. **Your \`sites.txt\`.** Replace the three example lines with your two. One line per site, with **one space** between the words: name, bucket, then one or more distribution IDs. Name the sites \`shop\` and \`blog\`, like the folders.

\`\`\`text
shop my-site-yourname-2026 E1ABCDEFGHIJKL
blog blog-yourname-2026 E2MNOPQRSTUVWX
\`\`\`

This prints the IDs and addresses of your distributions:

\`\`\`sh
aws cloudfront list-distributions --query "DistributionList.Items[].[Id,DomainName]" --output text
\`\`\`

4. **Test first, with no AWS involved.** In Test 1 of \`test-deploy.sh\`, change the bucket name \`${SITES.shop.bucket}\` to your shop's bucket. If your shop has one distribution, also change the expected number of invalidations from 2 to 1. Then run the test. It should end with \`All checks passed\`:

\`\`\`sh
chmod +x deploy.sh test-deploy.sh test/bin/aws
./test-deploy.sh
\`\`\`

5. **Deploy both sites**, and read the exit code. Then open both \`cloudfront.net\` addresses in a browser:

\`\`\`sh
./deploy.sh all
echo "exit code: $?"
\`\`\`

6. **Break one on purpose.** Move the blog's page away and deploy again. You should see \`✗ blog\`, \`✓ shop\` and exit code 1, with the live blog untouched. Then put the page back:

\`\`\`sh
mv sites/blog/index.html /tmp/
./deploy.sh all; echo "exit code: $?"
mv /tmp/index.html sites/blog/
\`\`\`

7. **Optional: two caches for one site.** Create a second distribution with the *same* bucket as its origin, the same way as in step 1. Then read the bucket policy (S3 console → the bucket → *Permissions* → *Bucket policy*). It has to allow both distributions. If it names only one, list both distribution ARNs in its \`Condition\`:

\`\`\`json
"Condition": {
  "StringEquals": {
    "AWS:SourceArn": [
      "arn:aws:cloudfront::111122223333:distribution/FIRST_ID",
      "arn:aws:cloudfront::111122223333:distribution/SECOND_ID"
    ]
  }
}
\`\`\`

Add the second ID to that site's line in \`sites.txt\`. Change a word in the page, deploy, and open both \`cloudfront.net\` addresses: both show the change.

8. **Push it to GitHub** with a README that shows a summary with a \`✗\` in it. Your real \`sites.txt\` stays on your computer: add the line \`sites.txt\` to a file named \`.gitignore\`, and commit a copy named \`sites.example.txt\` with made-up bucket names and IDs.

> **Permissions.** Your admin sign-in can do every step here. A deploy that runs on its own, from cron or GitHub Actions, should get credentials of its own with only what \`deploy.sh\` uses, as in Tutorial 3: \`s3:ListBucket\` on each bucket, \`s3:PutObject\` and \`s3:DeleteObject\` on the objects in it, and \`cloudfront:CreateInvalidation\` on each distribution.

**On a Mac,** the built-in \`/bin/bash\` is the older version 3.2. This script sticks to features that version has.

**Cost:** with pay-as-you-go pricing, CloudFront's always-free tier covers 1 TB of data sent to visitors and 10,000,000 requests a month, and the first 1,000 invalidation paths a month are free. A few small files in S3 cost well under a cent a month. The security protections in step 1 are AWS WAF, which is billed separately: that's why this exercise leaves them off. A real site with visitors should have them.

**Clean up** when you're done, in this order:

- In the CloudFront console, select each distribution you made and choose *Disable*. Wait until its *Last modified* column shows a new date and time, then choose *Delete*. (A distribution on one of CloudFront's flat-rate pricing plans can't be deleted until you cancel the plan. The Free plan ends at once; a paid plan ends with its billing cycle.)
- In the CloudFront console, under *Origin access*, delete the origin access controls that were made for those distributions: nothing uses them any more.
- Then remove each bucket with everything in it: \`aws s3 rb s3://blog-yourname-2026 --force\`.`,
      downloads: [
        { label: 'Download deploy.sh', filename: 'deploy.sh', content: () => DEPLOY_SOLUTION },
        { label: 'Download test-deploy.sh', filename: 'test-deploy.sh', content: () => TEST_SOLUTION },
        { label: 'Download the pretend aws (for test/bin/)', filename: 'aws', content: () => FAKE_AWS_SOLUTION },
        { label: 'Download an example sites.txt', filename: 'sites.txt', content: () => sitesTxt() },
      ],
      checklist: [
        '`./test-deploy.sh` passes on my computer, without touching AWS',
        '`./deploy.sh all` published two real sites and ended with exit code 0',
        'With one site broken on purpose, I saw its ✗, the other site\'s ✓, and exit code 1',
        '`./deploy.sh` with no argument, or with a misspelled site, ends with exit code 2',
        'The scripts are on GitHub, with no bucket names or IDs of mine in them',
      ],
    },
  ],
};

export default tutorial;
