// ops.ts: the team's daily AWS commands, in one typed tool.
// On your computer: npx tsx ops.ts usage team-assets
import { randomUUID } from 'node:crypto';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { S3Client, ListBucketsCommand, paginateListObjectsV2 } from '@aws-sdk/client-s3';
import { EC2Client, paginateDescribeInstances, type Instance } from '@aws-sdk/client-ec2';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

const sts = new STSClient({});
const s3 = new S3Client({});
const ec2 = new EC2Client({});
const cloudfront = new CloudFrontClient({});

const HELP = `ops: the team's daily AWS commands

Usage: ops <command> [arguments]

  whoami                        the account and user you're signed in as
  buckets                       list the S3 buckets
  usage <bucket>                how many objects a bucket holds, and their total size
  servers                       list the EC2 servers, with their state and name
  purge <distribution> [path…]  clear CloudFront's cache (no paths: everything, /*)
  help                          show this help

Exit codes: 0 done, 1 AWS said no, 2 the command was typed wrong.`;

// --- What the words after "ops" mean -------------------------------------

export type Command =
  | { kind: 'help' }
  | { kind: 'whoami' }
  | { kind: 'buckets' }
  | { kind: 'usage'; bucket: string }
  | { kind: 'servers' }
  | { kind: 'purge'; distributionId: string; paths: string[] };

export type Parsed = Command | { kind: 'mistake'; message: string };

export function parseArgs(argv: string[]): Parsed {
  const [name, ...rest] = argv;
  switch (name) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      return { kind: 'help' };
    case 'whoami':
    case 'buckets':
    case 'servers':
      return { kind: name };
    case 'usage':
      if (!rest[0]) return { kind: 'mistake', message: 'usage needs a bucket name: ops usage <bucket>' };
      return { kind: 'usage', bucket: rest[0] };
    case 'purge': {
      const [distributionId, ...paths] = rest;
      if (!distributionId) return { kind: 'mistake', message: 'purge needs a distribution ID: ops purge <distribution> [path...]' };
      const wrong = paths.find((p) => !p.startsWith('/'));
      if (wrong) return { kind: 'mistake', message: `paths start with a slash, like /index.html (not "${wrong}")` };
      return { kind: 'purge', distributionId, paths: paths.length ? paths : ['/*'] };
    }
    default:
      return { kind: 'mistake', message: `unknown command "${name}"` };
  }
}

// --- Helpers from the earlier steps --------------------------------------

export async function collect<Page, Item>(pages: AsyncIterable<Page>, pick: (page: Page) => Item[] | undefined): Promise<Item[]> {
  const all: Item[] = [];
  for await (const page of pages) {
    all.push(...(pick(page) ?? []));
  }
  return all;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${units[unit]}`;
}

export function nameOf(instance: Instance): string {
  return instance.Tags?.find((tag) => tag.Key === 'Name')?.Value ?? '(no name)';
}

// --- The commands --------------------------------------------------------

async function whoami(): Promise<void> {
  const me = await sts.send(new GetCallerIdentityCommand({}));
  console.log(`Account  ${me.Account ?? 'unknown'}`);
  console.log(`User     ${me.Arn ?? 'unknown'}`);
}

async function buckets(): Promise<void> {
  const out = await s3.send(new ListBucketsCommand({}));
  for (const bucket of out.Buckets ?? []) {
    const created = bucket.CreationDate?.toISOString().slice(0, 10) ?? '?';
    console.log(`${(bucket.Name ?? '?').padEnd(30)}created ${created}`);
  }
}

async function usage(bucket: string): Promise<void> {
  const objects = await collect(paginateListObjectsV2({ client: s3 }, { Bucket: bucket }), (page) => page.Contents);
  const bytes = objects.reduce((sum, o) => sum + (o.Size ?? 0), 0);
  console.log(`${bucket}: ${objects.length.toLocaleString('en-US')} objects, ${formatBytes(bytes)}`);
}

async function servers(): Promise<void> {
  const pages = paginateDescribeInstances({ client: ec2 }, {});
  const instances = await collect(pages, (page) => page.Reservations?.flatMap((r) => r.Instances ?? []));
  console.log(`${'ID'.padEnd(21)}${'STATE'.padEnd(10)}NAME`);
  for (const instance of instances) {
    console.log(`${(instance.InstanceId ?? '?').padEnd(21)}${(instance.State?.Name ?? '?').padEnd(10)}${nameOf(instance)}`);
  }
}

async function purge(distributionId: string, paths: string[]): Promise<void> {
  // TODO 1: send a CreateInvalidationCommand for distributionId with these paths.
  //   InvalidationBatch: { CallerReference: a new value every time (ops-${randomUUID()}),
  //                        Paths: { Quantity: how many, Items: the paths } }
  //   Then print: Invalidation <its Id> started on <distributionId> for <the paths>
  throw new Error('purge is not written yet');
}

async function run(cmd: Command): Promise<void> {
  switch (cmd.kind) {
    case 'help':
      console.log(HELP);
      return;
    case 'whoami':
      return whoami();
    case 'buckets':
      return buckets();
    case 'usage':
      return usage(cmd.bucket);
    case 'servers':
      return servers();
    case 'purge':
      return purge(cmd.distributionId, cmd.paths);
    default: {
      const unhandled: never = cmd;
      throw new Error(`no code for ${JSON.stringify(unhandled)}`);
    }
  }
}

// --- When AWS says no ----------------------------------------------------

/** What every error from the AWS SDK has: a name, a message and $metadata */
interface AwsError {
  name: string;
  message: string;
  $metadata: { httpStatusCode?: number; requestId?: string };
}

function isAwsError(err: unknown): err is AwsError {
  return err instanceof Error && '$metadata' in err;
}

export function explain(err: unknown): string {
  if (err instanceof Error && err.name === 'CredentialsProviderError') {
    return 'no AWS credentials found. Sign in first: aws configure, or aws sso login.';
  }
  if (!isAwsError(err)) return err instanceof Error ? err.message : String(err);
  switch (err.name) {
    case 'NoSuchBucket':
      return "there's no bucket with that name. See yours with: ops buckets";
    // TODO 2: a friendly line for AccessDenied (S3's name for it; other services say
    //         AccessDeniedException or UnauthorizedOperation), with the HTTP status
    //         from err.$metadata.httpStatusCode, and one for NoSuchDistribution
    default:
      return `AWS said ${err.name}: ${err.message}`;
  }
}

export async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.kind === 'mistake') {
    console.error(`ops: ${parsed.message}\n\n${HELP}`);
    return 2;
  }
  // TODO 3: when run() throws, print "ops: " plus explain(err) to stderr and
  //         return 1, instead of crashing with a stack trace
  await run(parsed);
  return 0;
}

process.exitCode = await main(process.argv.slice(2));
