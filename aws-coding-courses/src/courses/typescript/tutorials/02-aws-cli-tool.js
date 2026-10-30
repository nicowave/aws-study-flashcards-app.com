// Tutorial 2: wrap the team's daily AWS commands in one typed tool, `ops`.
// The TypeScript the learner edits lives in ./aws-cli-tool/ as real .ts files
// (imported as text), so the starters and answers stay readable.
import WHOAMI_STARTER from './aws-cli-tool/whoami.start.ts?raw';
import WHOAMI_SOLUTION from './aws-cli-tool/whoami.ts?raw';
import SERVERS_STARTER from './aws-cli-tool/servers.start.ts?raw';
import SERVERS_SOLUTION from './aws-cli-tool/servers.ts?raw';
import USAGE_STARTER from './aws-cli-tool/usage.start.ts?raw';
import USAGE_SOLUTION from './aws-cli-tool/usage.ts?raw';
import COMMANDS_STARTER from './aws-cli-tool/commands.start.ts?raw';
import COMMANDS_SOLUTION from './aws-cli-tool/commands.ts?raw';
import OPS_STARTER from './aws-cli-tool/ops.start.ts?raw';
import OPS_SOLUTION from './aws-cli-tool/ops.ts?raw';

// ---------------------------------------------------------------------------
// The practice account: the team's buckets, servers and two CloudFront
// distributions. Generated the same way every time (seeded), so the checks
// work out the right answers from the same data.
// ---------------------------------------------------------------------------

const ACCOUNT = '111122223333';
const STAGING = 'E2STAGE7XQ4LM';
const PRODUCTION = 'E1PROD9KD3VZT';

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ASSET_COUNT = 2350;
const assetSizes = () => {
  const rand = rng(2026);
  return Array.from({ length: ASSET_COUNT }, () => 300 + Math.floor(rand() * 3700));
};

const INSTANCES = [
  { id: 'i-0a1b2c3d4e5f60001', state: 'running', type: 't3.small', tags: { Name: 'web-1', team: 'web' } },
  { id: 'i-0a1b2c3d4e5f60002', state: 'running', type: 't3.small', tags: { Name: 'web-2', team: 'web' } },
  { id: 'i-0a1b2c3d4e5f60003', state: 'stopped', type: 'm5.large', tags: { Name: 'batch-nightly' }, stoppedAt: '2026-09-02T22:10:00Z' },
  { id: 'i-0a1b2c3d4e5f60004', state: 'running', type: 't3.micro' }, // launched by hand, never tagged
  { id: 'i-0a1b2c3d4e5f60005', state: 'running', type: 't3.medium', tags: { team: 'data' } }, // tagged, but no Name
];
const nameOf = (i) => i.tags?.Name ?? '(no name)';

const BUCKETS = ['build-artifacts', 'marketing-site-prod', 'team-assets', 'team-logs'];

const account = () => {
  const assets = {};
  assetSizes().forEach((size, n) => {
    const folder = ['icons', 'photos', 'docs', 'thumbnails'][n % 4];
    assets[`${folder}/${String(n).padStart(4, '0')}.${folder === 'docs' ? 'pdf' : 'webp'}`] = { size, contentType: folder === 'docs' ? 'application/pdf' : 'image/webp' };
  });
  const logs = {};
  for (let d = 0; d < 140; d++) logs[`app/2026-06-${String((d % 30) + 1).padStart(2, '0')}-${d}.log`] = { size: 4000 + d * 37 };
  return {
    aws: {
      account: ACCOUNT,
      region: 'us-east-1',
      s3: {
        'team-assets': assets,
        'team-logs': logs,
        'marketing-site-prod': { 'index.html': '<!doctype html><title>Example</title>', 'css/site.css': 'body { margin: 0 }' },
        'build-artifacts': {},
      },
      s3Denied: ['partner-exports'], // exists, but in a partner's account
      cloudfront: { distributions: [STAGING, PRODUCTION] },
      ec2: { 'us-east-1': { instances: INSTANCES } },
    },
  };
};

export const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${units[unit]}`;
};
const assetsTotal = () => assetSizes().reduce((a, b) => a + b, 0);

const typeErrors = (diagnostics) => (diagnostics?.length
  ? `TypeScript still reports ${diagnostics.length} error${diagnostics.length === 1 ? '' : 's'} (${diagnostics.map((d) => `line ${d.line}`).join(', ')}). Fix ${diagnostics.length === 1 ? 'it' : 'them'} and run again.`
  : null);

// Run ops with several sets of words, through main(), and keep what each printed
const OPS_PROBE = `const runs = [];
const tries = [[], ['whoami'], ['buckets'], ['usage', 'team-assets'], ['usage', 'build-artifacts'], ['usage', 'no-such-bucket'],
  ['usage', 'partner-exports'], ['servers'], ['purge', '${STAGING}'], ['purge', '${STAGING}', '/index.html', '/css/*'],
  ['purge', 'E0NOTREAL0000'], ['purge'], ['usage'], ['dance']];
for (const words of tries) {
  const before = practice.output().length;
  let code = null;
  let crashed = null;
  try { code = await mod.main(words); } catch (e) { crashed = (e && e.name) || String(e); }
  runs.push({ words: words.join(' '), code, crashed, out: practice.output().slice(before) });
}
return runs;`;

const checkOps = ({ diagnostics, probe, probeError, aws, result }) => {
  const types = typeErrors(diagnostics);
  if (types) return types;
  if (result?.error) return null;
  if (probeError) return `Calling main() failed: ${probeError}. Make sure ops.ts still exports main(argv).`;
  if (!Array.isArray(probe)) return null;
  const run = (words) => probe.find((r) => r.words === words);
  const said = (words) => `\`ops ${words}\``;
  const purge = run(`purge ${STAGING}`);
  if (purge.crashed || purge.code !== 0) {
    if (/not written yet/.test(purge.out) || purge.crashed) return `${said(`purge ${STAGING}`)} isn't working yet: write TODO 1, the CreateInvalidationCommand.`;
  }
  for (const words of ['usage no-such-bucket', 'usage partner-exports', 'purge E0NOTREAL0000']) {
    const r = run(words);
    if (r.crashed) return `${said(words)} crashed with ${r.crashed}. TODO 3: catch the error in main(), print "ops: " and explain(err), and return 1.`;
    if (r.code !== 1) return `${said(words)} should end with exit code 1 (AWS said no), not ${r.code}.`;
    if (/\n\s+at /.test(r.out)) return `${said(words)} printed a stack trace. Print just "ops: " and explain(err).`;
  }
  if (!/denied/i.test(run('usage partner-exports').out) || !/403/.test(run('usage partner-exports').out)) {
    return `${said('usage partner-exports')} should explain that access was denied, with the 403 from err.$metadata.httpStatusCode (TODO 2).`;
  }
  if (!/distribution/i.test(run('purge E0NOTREAL0000').out) || /AWS said/.test(run('purge E0NOTREAL0000').out)) {
    return `${said('purge E0NOTREAL0000')} should get its own friendly line about the distribution ID (TODO 2: NoSuchDistribution).`;
  }
  const invalidations = aws?.cloudfront?.[STAGING]?.invalidations || [];
  const paths = invalidations.map((i) => JSON.stringify(i.InvalidationBatch.Paths.Items));
  if (!paths.includes('["/*"]') || !paths.includes('["/index.html","/css/*"]')) {
    return 'The purges should clear /* when no paths are given, and exactly the paths given otherwise.';
  }
  if (invalidations.some((i) => i.InvalidationBatch.Paths.Quantity !== i.InvalidationBatch.Paths.Items.length)) return 'Quantity must be the number of paths.';
  const refs = invalidations.map((i) => i.InvalidationBatch.CallerReference);
  if (new Set(refs).size !== refs.length) return 'Two purges used the same CallerReference: CloudFront would treat the second as a repeat of the first. Make it new every time.';
  if (!/Invalidation \S+ started/.test(purge.out)) return `${said(`purge ${STAGING}`)} should print "Invalidation <Id> started on …".`;
  const expect = [
    ['', 0, /Usage: ops/], ['whoami', 0, new RegExp(`Account\\s+${ACCOUNT}`)], ['buckets', 0, /team-assets[\s\S]*team-logs/],
    ['usage team-assets', 0, new RegExp(`2,350 objects, ${formatBytes(assetsTotal()).replace('.', '\\.')}`)],
    ['usage build-artifacts', 0, /0 objects, 0 B/], ['servers', 0, /i-0a1b2c3d4e5f60004\s+running\s+\(no name\)/],
    ['purge', 2, /needs a distribution/], ['usage', 2, /needs a bucket/], ['dance', 2, /unknown command[\s\S]*Usage: ops/],
  ];
  for (const [words, code, pattern] of expect) {
    const r = run(words);
    if (r.crashed) return `${said(words)} crashed with ${r.crashed}.`;
    if (r.code !== code) return `${said(words)} should end with exit code ${code}, not ${r.code}.`;
    if (!pattern.test(r.out)) return `${said(words)} printed something unexpected:\n${r.out.slice(0, 300)}`;
  }
  return true;
};

const tutorial = {
  slug: 'aws-cli-tool',
  number: 2,
  title: 'Your own AWS command-line tool',
  situation: 'Your team runs the same five AWS commands every day, copying long flags from a wiki page and squinting at the JSON that comes back. One typo hits the wrong bucket; one forgotten flag misses half the servers. You wrap them in one typed tool, `ops`, with short commands, readable output, clear errors and help text.',
  level: 'Intermediate',
  hours: 5,
  skills: ['AWS SDK for JavaScript v3', 'optional properties', 'narrowing', 'generics', 'async iteration', 'union types', 'exhaustive switch', 'error handling', 'exit codes'],
  aws: ['AWS STS', 'Amazon S3', 'Amazon EC2', 'Amazon CloudFront', 'IAM'],
  overview: 'You\'ll call AWS from TypeScript with the AWS SDK for JavaScript (version 3), and let the types catch the mistakes AWS answers can cause: fields that aren\'t always there, lists that come in pages, errors with names. Then you\'ll build `ops`: `whoami`, `buckets`, `usage <bucket>`, `servers` and `purge <distribution>`, with help text and proper exit codes, and install it on your computer.',
  steps: [
    {
      id: 'sdk-v3',
      kind: 'read',
      runtime: 'node',
      lang: 'ts',
      title: 'Calling AWS from TypeScript',
      minutes: 12,
      body: `Every AWS command line call is a request to an AWS service. The **AWS SDK for JavaScript, version 3**, sends the same requests from your own code. It's split into one small package per service, so a tool only installs what it uses:

| Package | Service |
|---|---|
| \`@aws-sdk/client-sts\` | AWS Security Token Service (STS): who am I? |
| \`@aws-sdk/client-s3\` | Amazon S3: buckets and files |
| \`@aws-sdk/client-ec2\` | Amazon EC2: servers |
| \`@aws-sdk/client-cloudfront\` | Amazon CloudFront: the content delivery network |

Every call has the same three parts: a **client** for the service, a **command** with its input, and \`send\`:

\`\`\`ts
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const sts = new STSClient({});
const me = await sts.send(new GetCallerIdentityCommand({}));
me
\`\`\`

\`send\` goes over the network, so it returns a **Promise**: \`await\` waits for the answer. The answer is a plain object, and \`$metadata\` tells you how the request went:

\`\`\`ts
me.$metadata.httpStatusCode
\`\`\`

The console below runs TypeScript against a **pretend AWS account** (number ${ACCOUNT}), so nothing here touches a real one. Try S3 too:

\`\`\`ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const list = await s3.send(new ListBucketsCommand({}));
list.Buckets?.map((b) => b.Name)
\`\`\`

### Where the credentials come from

The code above never mentions a password or key, and it shouldn't. The SDK looks for credentials in a fixed order, the **credential provider chain**: environment variables, then your \`aws configure\` or \`aws sso login\` profile, then the role of the place it runs (a Lambda function, a container, an EC2 server). The same code works on your laptop and in AWS without changes.

> **Never put access keys in code.** Anything committed to Git can be found forever. Let the chain find them.`,
      scenario: account,
    },
    {
      id: 'whoami',
      kind: 'try',
      runtime: 'node',
      title: 'Who am I? (and what TypeScript knows)',
      minutes: 12,
      body: `Press **Run whoami.ts**. The program runs, but TypeScript checks it first and prints an error in the console.

The SDK's types say exactly what an answer can contain, and almost every field is **optional**: \`Account?: string\`. The \`?\` means "a string, or missing". So \`me.Account\` has the type \`string | undefined\`, and TypeScript won't let you put it in a \`string\` variable without saying what happens when it's missing.

That isn't fussiness. AWS leaves fields out all the time: an untagged server has no \`Tags\` at all, an empty bucket listing has no \`Contents\`. Code that assumes they're there crashes on the first odd case, usually in production.

The quickest fix is \`??\`, "or else": \`me.Account ?? 'unknown'\` is the account when there is one, and \`'unknown'\` when there isn't.`,
      task: 'Fix the type error, then print the user\'s ARN on a second line so the program prints `Account  111122223333` and `User     arn:aws:iam::…`, with **zero type errors**.',
      hint: '`const account: string = me.Account ?? \'unknown\';` then `console.log(`User     ${me.Arn ?? \'unknown\'}`);` (five spaces after User, so the values line up).',
      solution: WHOAMI_SOLUTION,
      files: [{ path: 'whoami.ts', starter: WHOAMI_STARTER, runLabel: 'Run whoami.ts', command: 'npx tsx whoami.ts' }],
      scenario: account,
      check: ({ diagnostics, result }) => {
        if (result?.error) return null;
        const types = typeErrors(diagnostics);
        if (types) return types;
        if (!new RegExp(`Account\\s+${ACCOUNT}`).test(result.stdout)) return null;
        if (!new RegExp(`User\\s+arn:aws:iam::${ACCOUNT}:user/`).test(result.stdout)) return 'No type errors. Now add the second line: `User` and the ARN, from `me.Arn`.';
        return true;
      },
      success: 'That\'s `aws sts get-caller-identity` in four lines. It\'s also the first thing to run when something says "access denied": it shows which identity you\'re really using.',
    },
    {
      id: 'optional-everything',
      kind: 'read',
      runtime: 'node',
      lang: 'ts',
      title: 'Optional fields: narrowing, ?. and ??',
      minutes: 12,
      body: `Three tools handle \`string | undefined\` and its cousins. Each one **narrows** the type: after it, TypeScript knows more.

| You write | Means | Type afterwards |
|---|---|---|
| \`if (x) { … }\` | only when it's there | inside the braces: \`string\` |
| \`x?.length\` | if \`x\` is missing, stop and give \`undefined\` | \`number \\| undefined\` |
| \`x ?? 'none'\` | if \`x\` is missing, use \`'none'\` | \`string\` |

They chain. Here is a server the way EC2 describes it:

\`\`\`ts
const server = { InstanceId: 'i-0abc', Tags: [{ Key: 'team', Value: 'web' }] };
server.Tags?.find((t) => t.Key === 'Name')?.Value ?? '(no name)'
\`\`\`

Read it left to right: the tags if there are any, then the one whose key is \`Name\` if there is one, then its value, and if anything along the way was missing, \`'(no name)'\`.

> **The \`!\` shortcut.** \`x!\` tells TypeScript "trust me, it's there". It removes the error, not the bug: when you're wrong, the program crashes exactly where TypeScript warned you. Use \`?.\` and \`??\` instead.

### The answer types have names

The SDK exports a type for every shape it returns. Import them with \`type\`, so TypeScript uses them for checking only:

\`\`\`ts
import { type Instance } from '@aws-sdk/client-ec2';

function isRunning(i: Instance): boolean {
  return i.State?.Name === 'running';
}
isRunning({ State: { Name: 'stopped' } })
\`\`\`

In Visual Studio Code, hold ⌘ or Ctrl and click a type's name to see every field it has. Reading types is half of working with an SDK.`,
      scenario: account,
    },
    {
      id: 'servers',
      kind: 'try',
      runtime: 'node',
      title: 'List the servers',
      minutes: 15,
      body: `\`servers.ts\` asks EC2 for every instance and prints one line each. TypeScript has found two real bugs in \`nameOf\`, on the same line, and reports them as three messages. Press **Run** and read them:

- \`'instance.Tags' is possibly 'undefined'\`: servers launched without tags have no \`Tags\` field at all. The practice account has one.
- \`Object is possibly 'undefined'\`: \`find\` gives \`undefined\` when no tag matches. Another server has tags, but no \`Name\`.
- \`Type 'string | undefined' is not assignable to type 'string'\`: the same problem seen from the return type. Even a tag's \`Value\` is optional in the SDK's types.

Then make the table readable. \`padEnd(n)\` adds spaces to the end of a string until it's \`n\` characters long, which lines up columns:

\`\`\`ts
'web-1'.padEnd(10) + '|'
\`\`\``,
      task: 'Fix `nameOf` so it returns the `Name` tag, or `(no name)` when there isn\'t one, with **zero type errors**. Then print each server\'s ID, state and name on one line, padded to the same columns as the header.',
      hint: '`return instance.Tags?.find((tag) => tag.Key === \'Name\')?.Value ?? \'(no name)\';`, and in the loop: ``console.log(`${id.padEnd(21)}${state.padEnd(10)}${nameOf(instance)}`)`` with `id` and `state` from `instance.InstanceId ?? \'?\'` and `instance.State?.Name ?? \'?\'`.',
      solution: SERVERS_SOLUTION,
      files: [{ path: 'servers.ts', starter: SERVERS_STARTER, runLabel: 'Run servers.ts', command: 'npx tsx servers.ts' }],
      scenario: account,
      probe: `return [mod.nameOf({ Tags: [{ Key: 'Name', Value: 'web-1' }] }), mod.nameOf({}), mod.nameOf({ Tags: [{ Key: 'team', Value: 'data' }] })];`,
      check: ({ diagnostics, probe, result }) => {
        const types = typeErrors(diagnostics);
        if (types) return types;
        if (result?.error) return null;
        if (!Array.isArray(probe) || probe[0] !== 'web-1') return null;
        if (probe[1] !== '(no name)' || probe[2] !== '(no name)') return 'nameOf should return "(no name)" for a server with no tags, and for one with tags but no Name.';
        for (const i of INSTANCES) {
          if (!new RegExp(`${i.id}\\s+${i.state}\\s+${nameOf(i).replace(/[()]/g, '\\$&')}`).test(result.stdout)) {
            return `Print each server as ID, state, name: ${i.id} should show ${i.state} and ${nameOf(i)}.`;
          }
        }
        return true;
      },
      success: 'Five servers, one tidy table, and the two that would have crashed the wiki script (no tags, no Name) handled.',
    },
    {
      id: 'pages-and-generics',
      kind: 'read',
      runtime: 'node',
      lang: 'ts',
      title: 'Pages, and a helper that works for any of them',
      minutes: 15,
      body: `Ask S3 for the objects in a bucket and you get **at most 1,000** per answer. The practice bucket \`team-assets\` has more:

\`\`\`ts
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const page = await s3.send(new ListObjectsV2Command({ Bucket: 'team-assets' }));
[page.Contents?.length, page.IsTruncated]
\`\`\`

\`IsTruncated: true\` means "there's more": the answer includes a token for the next page. You could loop on the tokens yourself, but the SDK has a **paginator** that does it for you. It's an async iterable: \`for await\` gets one page at a time.

\`\`\`ts
import { paginateListObjectsV2 } from '@aws-sdk/client-s3';

let count = 0;
for await (const p of paginateListObjectsV2({ client: s3 }, { Bucket: 'team-assets' })) {
  count += p.Contents?.length ?? 0;
}
count
\`\`\`

Most AWS list calls page like this, and many services have a \`paginate…\` helper. A tool that skips pages gives wrong answers the day the account grows, which is the worst kind of bug: it looks fine in testing.

### Generics: one helper, many types

Every paginator gives pages, and every kind of page keeps its list in a different field: \`Contents\`, \`Reservations\`, \`Items\`. A **generic** function takes the types as parameters, in angle brackets, so one helper fits all of them:

\`\`\`ts
async function collect<Page, Item>(pages: AsyncIterable<Page>, pick: (page: Page) => Item[] | undefined): Promise<Item[]> {
  const all: Item[] = [];
  for await (const page of pages) all.push(...(pick(page) ?? []));
  return all;
}
\`\`\`

You don't write the types when you call it: TypeScript works them out from the arguments. Given S3 pages and \`(page) => page.Contents\`, it knows \`Item\` is an S3 object, so the result is a list of objects with \`Key\` and \`Size\`.`,
      scenario: account,
    },
    {
      id: 'usage',
      kind: 'try',
      runtime: 'node',
      title: 'How big is that bucket?',
      minutes: 20,
      body: `\`usage.ts\` counts a bucket's objects and adds up their sizes, but it only looks at the first page. Finish its helpers:

- \`collect\` loops over every page and gathers the items.
- \`formatBytes\` turns \`5400000\` into \`5.1 MB\`: divide by 1,024 until the number is under 1,024, and count how many times you divided.
- \`measure\` uses \`collect\` with the paginator.

\`toLocaleString('en-US')\` adds the thousands commas, so 2350 prints as \`2,350\`.`,
      task: 'Make `usage.ts` print the real total for `team-assets` (all 2,350 objects and their size), with `formatBytes` giving `512 B`, `1.5 KB` and `5.1 MB` style answers, and an empty bucket counting as 0 objects, 0 B.',
      hint: '`for await (const page of pages) { all.push(...(pick(page) ?? [])); }`. In `formatBytes`, keep `value` and `unit`, then `while (value >= 1024 && unit < 4) { value /= 1024; unit += 1; }` and `value.toFixed(1)`. In `measure`: `await collect(paginateListObjectsV2({ client: s3 }, { Bucket: bucket }), (page) => page.Contents)`.',
      solution: USAGE_SOLUTION,
      files: [{ path: 'usage.ts', starter: USAGE_STARTER, runLabel: 'Run usage.ts', command: 'npx tsx usage.ts' }],
      scenario: account,
      probe: `return { assets: await mod.measure('team-assets'), empty: await mod.measure('build-artifacts'), sizes: [512, 1536, 5400000, 3 * 1024 ** 3].map((n) => mod.formatBytes(n)) };`,
      check: ({ diagnostics, probe, result }) => {
        const types = typeErrors(diagnostics);
        if (types) return types;
        if (result?.error || !probe?.assets) return null;
        if (probe.assets.objects === 1000) return 'Exactly 1,000 objects: that\'s one page. Use collect() with paginateListObjectsV2 so every page counts.';
        if (probe.assets.objects === 0) return null;
        if (probe.assets.objects !== ASSET_COUNT || probe.assets.bytes !== assetsTotal()) return `team-assets has ${ASSET_COUNT.toLocaleString('en-US')} objects, ${assetsTotal()} bytes in all.`;
        if (probe.empty?.objects !== 0 || probe.empty?.bytes !== 0) return 'An empty bucket has no Contents at all: count it as 0 objects and 0 bytes (?? [] in collect).';
        const want = ['512 B', '1.5 KB', '5.1 MB', '3.0 GB'];
        if (JSON.stringify(probe.sizes) !== JSON.stringify(want)) return `formatBytes gives ${probe.sizes.join(', ')} for 512, 1536, 5400000 and 3 GB; it should give ${want.join(', ')}.`;
        if (!result.stdout.includes(`2,350 objects, ${formatBytes(assetsTotal())}`)) return `The numbers are right; the printed line should read \`team-assets: 2,350 objects, ${formatBytes(assetsTotal())}\`.`;
        return true;
      },
      success: `All ${ASSET_COUNT.toLocaleString('en-US')} objects, ${formatBytes(assetsTotal())}. The first-page version said 1,000 and looked perfectly believable: that's why paginators are a habit, not an optimization.`,
    },
    {
      id: 'typed-commands',
      kind: 'read',
      runtime: 'node',
      lang: 'ts',
      title: 'Commands as types',
      minutes: 15,
      body: `A command-line tool gets its instructions as words: \`ops usage team-assets\`. Node.js puts them in \`process.argv\`, after two entries for Node itself and the script, so the words are \`process.argv.slice(2)\`.

Words are easy to get wrong, so the tool's first job is to turn them into something typed. A **discriminated union** is a type that is one of several shapes, told apart by a field they all share, here \`kind\`:

\`\`\`ts
type Command =
  | { kind: 'whoami' }
  | { kind: 'usage'; bucket: string }
  | { kind: 'purge'; distributionId: string; paths: string[] };
\`\`\`

After \`if (cmd.kind === 'usage')\`, TypeScript knows \`cmd.bucket\` exists. Outside that \`if\`, \`cmd.bucket\` is an error: a \`whoami\` command has no bucket.

### Never forget a case

A \`switch\` over \`cmd.kind\` can prove it handles every kind. In the \`default\` branch, every kind has been handled, so \`cmd\` has the special type **never**, "this can't happen":

\`\`\`ts
function label(cmd: Command): string {
  switch (cmd.kind) {
    case 'whoami': return 'who am I';
    case 'usage': return \`size of \${cmd.bucket}\`;
    case 'purge': return \`clear \${cmd.distributionId}\`;
    default: {
      const unhandled: never = cmd;
      return unhandled;
    }
  }
}
label({ kind: 'usage', bucket: 'team-assets' })
\`\`\`

Add a sixth kind of command next month and forget its case, and the \`never\` line turns red: TypeScript lists the kind you missed. The bug can't reach a teammate.

### Exit codes

When a command-line program ends, it reports a number to whoever ran it: \`0\` for success, anything else for failure. Scripts and pipelines rely on it (\`ops usage team-assets && echo done\` only says done after a \`0\`). \`ops\` uses three: **0** done, **1** AWS said no, **2** the command was typed wrong. In Node.js, set \`process.exitCode\` rather than calling \`process.exit()\`, so output still being written isn't cut off.`,
      scenario: account,
    },
    {
      id: 'commands',
      kind: 'try',
      runtime: 'node',
      title: 'Turn words into commands',
      minutes: 20,
      body: '`commands.ts` has the `Command` union and a `parseArgs` that handles every command but one. Press **Run**: the `never` line in `describe` is already red, because `purge` is part of `Command` but has no case.',
      task: 'Make `parseArgs` handle `purge <distribution> [path…]`: a distribution ID is required, no paths means `[\'/*\']`, and a path that doesn\'t start with `/` is a mistake. Add the `purge` case to `describe` so there are **zero type errors**.',
      hint: '`case \'purge\': { const [distributionId, ...paths] = rest; if (!distributionId) return { kind: \'mistake\', message: \'…\' }; …; return { kind: \'purge\', distributionId, paths: paths.length ? paths : [\'/*\'] }; }`. Find a bad path with `paths.find((p) => !p.startsWith(\'/\'))`.',
      solution: COMMANDS_SOLUTION,
      files: [{ path: 'commands.ts', starter: COMMANDS_STARTER, runLabel: 'Run commands.ts', command: 'npx tsx commands.ts' }],
      scenario: account,
      probe: `const words = [[], ['help'], ['usage'], ['usage', 'b'], ['purge'], ['purge', 'E1'], ['purge', 'E1', '/index.html', '/css/*'], ['purge', 'E1', 'index.html'], ['nope']];
return { parsed: words.map((w) => mod.parseArgs(w)), described: mod.describe({ kind: 'purge', distributionId: 'E1', paths: ['/*'] }) };`,
      check: ({ diagnostics, probe, result }) => {
        if (result?.error || !probe?.parsed) return null;
        const p = probe.parsed;
        const purgeHandled = p[5]?.kind === 'purge';
        if (!purgeHandled) return 'parseArgs still calls purge an unknown command. Add `case \'purge\'` to it, then to describe().';
        const types = typeErrors(diagnostics);
        if (types) return `${types} The never line needs a \`case 'purge'\` in describe().`;
        if (JSON.stringify(p[5].paths) !== '["/*"]') return '`ops purge E1` with no paths should mean everything: paths `[\'/*\']`.';
        if (p[5].distributionId !== 'E1') return 'The first word after purge is the distribution ID.';
        if (JSON.stringify(p[6].paths) !== '["/index.html","/css/*"]') return 'Paths after the ID should be kept as given.';
        if (p[4]?.kind !== 'mistake') return '`ops purge` with no distribution ID should be a mistake, with a message saying what\'s missing.';
        if (p[7]?.kind !== 'mistake') return '`ops purge E1 index.html` should be a mistake: CloudFront paths start with a slash.';
        if (p[0]?.kind !== 'help' || p[2]?.kind !== 'mistake' || p[3]?.bucket !== 'b' || p[8]?.kind !== 'mistake') return 'The other commands should still parse as before.';
        if (typeof probe.described !== 'string' || !probe.described) return 'describe() should return a line for purge too.';
        return true;
      },
      success: 'Every command the tool understands is now a type. The rest of the program can\'t confuse a bucket with a distribution ID, and can\'t forget a command.',
    },
    {
      id: 'errors',
      kind: 'read',
      runtime: 'node',
      lang: 'ts',
      title: 'When AWS says no',
      minutes: 12,
      body: `AWS refuses requests all the time, for good reasons: the bucket doesn't exist, you're not allowed, you asked too often. The SDK turns each refusal into an error you can \`catch\`, and every one has:

| Field | Example |
|---|---|
| \`name\` | \`NoSuchBucket\`, \`AccessDenied\`, \`ThrottlingException\` |
| \`message\` | \`The specified bucket does not exist\` |
| \`$metadata.httpStatusCode\` | \`404\`, \`403\`, \`400\` |
| \`$metadata.requestId\` | what AWS Support asks for |

\`\`\`ts
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
try {
  await s3.send(new ListObjectsV2Command({ Bucket: 'partner-exports' }));
} catch (err) {
  console.log(err instanceof Error ? [err.name, err.message] : err);
}
\`\`\`

\`partner-exports\` exists, but in a partner's account, so S3 says **AccessDenied (403)**, not "no such bucket". A bucket name that nobody owns gives **NoSuchBucket (404)**.

### \`unknown\`, and type guards

In strict TypeScript, the error in \`catch (err)\` has the type **unknown**: JavaScript lets code throw anything, not just errors. Before reading \`err.name\`, narrow it. A **type guard** is a function whose return type says what it proved:

\`\`\`ts
function isAwsError(err: unknown): err is Error & { $metadata: { httpStatusCode?: number } } {
  return err instanceof Error && '$metadata' in err;
}
\`\`\`

After \`if (isAwsError(err))\`, TypeScript lets you read \`err.$metadata.httpStatusCode\`.

### What a good tool does with an error

- Says what went wrong in one line, in plain words, and what to try. Not a stack trace.
- Writes it to **stderr** (\`console.error\`), so it doesn't mix with real output when someone pipes the tool into another program.
- Ends with a non-zero exit code.

Some errors aren't from AWS at all: with no credentials, the SDK throws \`CredentialsProviderError\` before any request is sent. And some are worth waiting out: the SDK already **retries** throttling and server errors for you, up to 3 attempts by default, with growing pauses in between.`,
      scenario: account,
    },
    {
      id: 'ops',
      kind: 'try',
      runtime: 'node',
      title: 'The whole tool: ops',
      minutes: 30,
      body: `\`ops.ts\` puts it all together: \`parseArgs\`, the helpers from the earlier steps, one function per command, and \`main(argv)\`, which returns the exit code. Three TODOs are left: \`purge\`, the friendly messages, and catching errors in \`main\`.

In the practice console there are no command-line words, so pressing **Run** shows the help. To try a command, call \`main\` yourself in the console after a run:

\`\`\`ts
await main(['usage', 'team-assets'])
\`\`\`

\`\`\`ts
await main(['purge', '${STAGING}'])
\`\`\`

\`\`\`ts
await main(['usage', 'partner-exports'])
\`\`\`

On your computer, the same thing is \`npx tsx ops.ts usage team-assets\`.`,
      task: `Finish the TODOs so every command works: \`purge\` creates an invalidation (\`/*\` by default) with a new CallerReference each time; AccessDenied (with its status code) and NoSuchDistribution get friendly one-line messages; and any AWS error ends with \`ops: …\` on stderr and exit code **1**, never a stack trace.`,
      hint: 'TODO 1: `const out = await cloudfront.send(new CreateInvalidationCommand({ DistributionId: distributionId, InvalidationBatch: { CallerReference: `ops-${randomUUID()}`, Paths: { Quantity: paths.length, Items: paths } } }));`. TODO 2: `case \'AccessDenied\': return `access denied (${err.$metadata.httpStatusCode ?? 403}): …`;`. TODO 3: wrap `await run(parsed); return 0;` in `try { … } catch (err) { console.error(`ops: ${explain(err)}`); return 1; }`.',
      solution: OPS_SOLUTION,
      files: [{ path: 'ops.ts', starter: OPS_STARTER, runLabel: 'Run ops.ts', command: 'npx tsx ops.ts' }],
      scenario: account,
      probe: OPS_PROBE,
      check: checkOps,
      success: 'That\'s `ops`: five commands the whole team can remember, answers that fit on a screen, and errors that say what to do. Next, install it on your computer and point it at your own account.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'For the exam: the SDK, credentials, pages and retries',
      minutes: 8,
      body: `The AWS Certified Developer – Associate exam asks about exactly what \`ops\` does. Remember:

- **SDK v3 is modular.** One package per service and a \`send(new XCommand(input))\` call. Importing only what you use keeps Lambda packages small, which shortens cold starts.
- **The credential provider chain.** Environment variables, then the shared profile files (\`~/.aws/credentials\` and \`~/.aws/config\`, including IAM Identity Center sign-in), then the role of the compute it runs on: a container role, or the EC2 instance profile through the instance metadata service. On Lambda, the execution role's temporary keys arrive as environment variables. **Never hard-code keys**, and prefer roles to long-lived access keys.
- **Pagination.** S3 \`ListObjectsV2\` returns up to 1,000 keys per call with a continuation token; DynamoDB \`Query\` and \`Scan\` return up to 1 MB per call with \`LastEvaluatedKey\`. "The report is missing items in a big account" usually means pages were ignored.
- **Retries and throttling.** The SDK retries throttling errors (\`ThrottlingException\`, \`ProvisionedThroughputExceededException\`, HTTP 429) and server errors (5xx) with **exponential backoff and jitter**, 3 attempts by default. Raise \`maxAttempts\`, or set \`retryMode: 'adaptive'\`, when an answer mentions throttling. Don't retry 4xx errors like AccessDenied: they won't fix themselves.
- **Error metadata.** \`$metadata.httpStatusCode\` and \`$metadata.requestId\`: log the request ID, it's what AWS Support needs.
- **Least privilege for list calls.** \`ListBuckets\` needs \`s3:ListAllMyBuckets\`; listing a bucket's objects needs \`s3:ListBucket\` on the **bucket** ARN (\`arn:aws:s3:::name\`); reading objects needs \`s3:GetObject\` on \`arn:aws:s3:::name/*\`. \`sts:GetCallerIdentity\` needs no permission at all.
- **CloudFront.** Invalidations need a unique \`CallerReference\`; the first 1,000 paths a month are free. For files that change often, versioned file names (like \`app.3f2a1c.js\`) are the cheaper, faster answer.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'What does `instance.Tags?.find((t) => t.Key === \'Name\')?.Value ?? \'(no name)\'` give for a server with no tags?', options: ['A TypeError', '`undefined`', '`\'(no name)\'`', 'An empty string'], answer: 2, explain: '`?.` stops at the missing `Tags` and gives `undefined`, then `??` replaces `undefined` with `\'(no name)\'`.' },
        { q: 'You send one `ListObjectsV2Command` for a bucket with 2,350 objects. What comes back?', options: ['All 2,350', 'Up to 1,000, with IsTruncated: true and a continuation token', 'An error: too many objects', 'The newest 100'], answer: 1, explain: 'S3 lists at most 1,000 keys per call. Use `paginateListObjectsV2` (or the token) to get the rest.' },
        { q: 'Why put `const unhandled: never = cmd;` in a switch\'s default branch?', options: ['It makes the code faster', 'It turns a forgotten case into a type error when someone adds a new kind of command', 'It catches runtime errors', 'TypeScript requires a default branch'], answer: 1, explain: 'When every kind is handled, `cmd` is `never` there. Add a kind without a case and it isn\'t, so the line fails to compile.' },
        { q: 'In strict TypeScript, what is the type of `err` in `catch (err) { … }`?', options: ['`Error`', '`any`', '`unknown`: narrow it before using it', '`AwsError`'], answer: 2, explain: 'JavaScript can throw anything. Check with `instanceof Error` or a type guard before reading `err.name`.' },
        { q: 'Which IAM permission does `ListBucketsCommand` need?', options: ['`s3:ListBucket` on each bucket', '`s3:ListAllMyBuckets`', '`s3:GetObject`', 'None'], answer: 1, explain: '`s3:ListAllMyBuckets` lists the buckets; `s3:ListBucket` lists what\'s inside one bucket.' },
        { q: 'A script runs `ops usage team-assets && notify-team`. When does `notify-team` run?', options: ['Always', 'Only when ops exits with code 0', 'Only when ops exits with code 1', 'Never'], answer: 1, explain: '`&&` runs the next command only after a success, exit code 0. That\'s why errors must end with a non-zero code.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'ts2-send', front: 'The three parts of every AWS SDK for JavaScript v3 call', back: 'A client, a command with its input, and `await client.send(command)`', tags: ['sdk'], difficulty: 'easy' },
        { id: 'ts2-nullish', front: 'A value, or a fallback when it\'s `undefined` or `null`', back: '`value ?? fallback`', hint: 'nullish coalescing', tags: ['typescript'], difficulty: 'easy' },
        { id: 'ts2-optional', front: 'Read `a.b.c` without crashing when `b` might be missing', back: '`a.b?.c`: stops and gives `undefined` if `b` is missing', hint: 'optional chaining', tags: ['typescript'], difficulty: 'easy' },
        { id: 'ts2-paginate', front: 'Count every object in an S3 bucket, past 1,000', back: '`for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket }))` and add up `page.Contents?.length ?? 0`', tags: ['s3', 'sdk'], difficulty: 'medium' },
        { id: 'ts2-union', front: 'A type that is one of several shapes, told apart by a shared field', back: 'A discriminated union: `{ kind: \'usage\'; bucket: string } | { kind: \'whoami\' }`', tags: ['typescript'], difficulty: 'medium' },
        { id: 'ts2-never', front: 'Make TypeScript catch a forgotten case in a switch', back: 'In `default`: `const unhandled: never = value;`', tags: ['typescript'], difficulty: 'hard' },
        { id: 'ts2-error', front: 'Where an AWS SDK v3 error keeps its HTTP status', back: '`err.$metadata.httpStatusCode` (and `err.name` says which error, like `AccessDenied`)', tags: ['sdk', 'errors'], difficulty: 'medium' },
        { id: 'ts2-retry', front: 'What the AWS SDK does with throttling errors, by default', back: 'Retries with exponential backoff and jitter, 3 attempts in all (`maxAttempts`)', tags: ['sdk', 'exam'], difficulty: 'medium' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 45,
      body: `Install \`ops\` on your computer and point it at your own AWS account. You'll need the AWS command line signed in (*Start here*).

1. **Node.js 22.** Check with \`node --version\`. If it's missing or older, install it with the Node Version Manager:

\`\`\`sh
touch ~/.zshrc   # Mac only: the installer needs this file to exist
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
\`\`\`

Close and reopen the terminal, then:

\`\`\`sh
nvm install 22
\`\`\`

2. **A project with the four SDK packages, and TypeScript:**

\`\`\`sh
mkdir -p ~/aws-study-projects/typescript/ops-tool
cd ~/aws-study-projects/typescript/ops-tool
npm init -y
npm pkg set type=module
npm install @aws-sdk/client-sts @aws-sdk/client-s3 @aws-sdk/client-ec2 @aws-sdk/client-cloudfront
npm install --save-dev typescript tsx @types/node
\`\`\`

\`"type": "module"\` makes Node.js treat the files as ES modules, which allows \`import\` and the top-level \`await\` at the end of \`ops.ts\`. \`tsx\` runs TypeScript directly, without a build step.

3. **TypeScript's settings.** Save this as \`tsconfig.json\`:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["ops.ts"]
}
\`\`\`

4. **Copy your \`ops.ts\`** from the last step, then run it against your account:

\`\`\`sh
npx tsx ops.ts whoami
npx tsx ops.ts buckets
npx tsx ops.ts servers
\`\`\`

Check the types the way an editor or a pipeline would: \`npx tsc --noEmit\` prints nothing when there are no errors.

> **A bucket in another Region?** The S3 client works in your default Region. For a bucket elsewhere, S3 answers with a redirect error. Create the client with \`new S3Client({ followRegionRedirects: true })\` and it follows the bucket to its Region.

5. **The permissions it needs, and no more.** This is the policy to give the teammates who'll use \`ops\` (your own administrator sign-in already allows it). Save it as \`ops-policy.json\`, replacing \`YOUR_ACCOUNT_ID\` (from \`ops whoami\`):

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ListBuckets", "Effect": "Allow", "Action": "s3:ListAllMyBuckets", "Resource": "*" },
    { "Sid": "ListObjects", "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::*" },
    { "Sid": "Servers", "Effect": "Allow", "Action": "ec2:DescribeInstances", "Resource": "*" },
    { "Sid": "Purge", "Effect": "Allow", "Action": "cloudfront:CreateInvalidation", "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/*" }
  ]
}
\`\`\`

\`\`\`sh
aws iam create-policy --policy-name ops-tool --policy-document file://ops-policy.json
\`\`\`

Attach it to the team's group, role or IAM Identity Center permission set. \`sts:GetCallerIdentity\` isn't listed because it never needs permission. To tighten it further, list only the team's buckets and distributions instead of \`*\`.

6. **Make \`ops\` a real command.** Add \`#!/usr/bin/env node\` as the very first line of \`ops.ts\` (it tells the system to run the file with Node.js), then build it and link it:

\`\`\`sh
npm pkg set bin.ops=dist/ops.js scripts.build=tsc
npm run build
npm link
ops usage YOUR_BUCKET
\`\`\`

\`npm link\` puts \`ops\` on your path, pointing at this folder: run \`npm run build\` again after each change. To remove it: \`npm uninstall -g ops-tool\`.

7. **Purge for real**, if you have a CloudFront distribution (the Bash course's deploy tutorial makes one): \`ops purge YOUR_DISTRIBUTION_ID\`, then watch it finish in the CloudFront console under *Invalidations*.

8. **Push it to GitHub.** Add a \`.gitignore\` with \`node_modules/\` and \`dist/\`. There are no keys or account IDs in the code, which is the point.

**Cost:** STS and EC2 describe calls are free. S3 charges $0.005 per 1,000 list requests in us-east-1: \`ops usage\` on a 2,350-object bucket makes 3. CloudFront's first 1,000 invalidation paths each month are free, then $0.005 per path; \`/*\` counts as one path.`,
      checklist: [
        '`npx tsx ops.ts whoami` shows my real account',
        '`npx tsc --noEmit` reports no errors',
        '`ops` works as a command after `npm link`',
        'The ops-tool policy exists, with only the four permissions it needs',
        'It\'s on GitHub, with node_modules and dist in .gitignore',
      ],
    },
  ],
};

export default tutorial;
