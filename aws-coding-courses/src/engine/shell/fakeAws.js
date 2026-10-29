// A pretend AWS account for the practice shell. `aws s3 ...`,
// `aws cloudfront ...`, `aws secretsmanager ...` and `aws sts ...` behave
// like the real AWS command line (same output shapes), but everything lives
// in memory. Tutorials check this state to see if a step worked.
import { globToRegex, baseOf } from './fs';

const pad = (n, w = 2) => String(n).padStart(w, '0');
const stamp = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+00:00');

class AwsError extends Error {
  constructor(code, operation, message, status = 254) {
    super(`An error occurred (${code}) when calling the ${operation} operation: ${message}`);
    this.status = status;
  }
}

const parseS3 = (uri) => {
  const m = uri.match(/^s3:\/\/([^/]+)\/?(.*)$/);
  return m ? { bucket: m[1], key: m[2] } : null;
};

// Tiny JMESPath: a.b, a[0], a[], a[*].b, length(...)? no. Enough for --query
function query(value, expr) {
  if (!expr) return value;
  const segments = expr.replace(/^\s+|\s+$/g, '').match(/[^.[\]]+|\[\*?\]|\[\d+\]/g) || [];
  let cur = value;
  let projected = false;
  for (const seg of segments) {
    if (seg === '[]' || seg === '[*]') {
      cur = projected ? cur.flat() : Array.isArray(cur) ? cur : [];
      projected = true;
      continue;
    }
    const pick = (v) => {
      if (v == null) return null;
      if (/^\[\d+\]$/.test(seg)) return Array.isArray(v) ? v[Number(seg.slice(1, -1))] ?? null : null;
      return v[seg] ?? null;
    };
    cur = projected ? cur.map(pick).filter((x) => x !== null) : pick(cur);
  }
  return cur;
}

const asText = (v) => {
  if (v == null) return 'None';
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' ? Object.values(x).join('\t') : String(x))).join('\t');
  if (typeof v === 'object') return Object.values(v).map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('\t');
  return String(v);
};

export class FakeAws {
  constructor(seed = {}) {
    this.account = seed.account || '123456789012';
    this.configured = seed.configured !== false;
    this.buckets = {};
    for (const [name, objects] of Object.entries(seed.buckets || {})) {
      this.buckets[name] = { created: Date.now() - 30 * 864e5, objects: {} };
      for (const [key, spec] of Object.entries(objects || {})) {
        const o = typeof spec === 'string' ? { body: spec } : spec;
        this.buckets[name].objects[key] = { body: o.body ?? '', size: o.size ?? (o.body ?? '').length, mtime: o.mtime ?? Date.now(), cacheControl: o.cacheControl, contentType: o.contentType };
      }
    }
    this.distributions = {};
    for (const [id, d] of Object.entries(seed.distributions || {})) {
      this.distributions[id] = { domain: d.domain || `${id.toLowerCase()}.cloudfront.net`, aliases: d.aliases || [], origin: d.origin || '', invalidations: [] };
    }
    this.secrets = { ...(seed.secrets || {}) };
    this.calls = []; // every aws command run, for tutorial checks
    this.counter = 0;
  }

  run(ctx) {
    const argv = [...ctx.args];
    const global = { output: 'json', query: null };
    const rest = [];
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--output') global.output = argv[++i];
      else if (a === '--query') global.query = argv[++i];
      else if (a === '--region' || a === '--profile' || a === '--endpoint-url') i++;
      else if (a === '--no-cli-pager' || a === '--no-paginate') continue;
      else rest.push(a);
    }
    if (rest[0] === '--version') { ctx.out('aws-cli/2.17.0 Python/3.11.9 Linux/6.1.0-amzn exe/x86_64 (practice shell)\n'); return 0; }
    const [service, command, ...args] = rest;
    if (!service || service === 'help') {
      ctx.err('usage: aws [options] <command> <subcommand> [parameters]\nThis practice account supports: s3, cloudfront, secretsmanager, sts\n');
      return 252;
    }
    this.calls.push({ service, command, args });
    if (!this.configured && service !== 'configure') {
      ctx.err('Unable to locate credentials. You can configure credentials by running "aws configure".\n');
      return 253;
    }
    const opts = parseOptions(args);
    const now = ctx.shell.now().getTime();
    const print = (value) => {
      const v = query(value, global.query);
      if (global.output === 'text') ctx.out(`${asText(v)}\n`);
      else ctx.out(`${JSON.stringify(v, null, 4)}\n`);
      return 0;
    };
    try {
      switch (`${service} ${command}`) {
        case 'sts get-caller-identity':
          return print({ UserId: 'AIDAPRACTICELEARNER', Account: this.account, Arn: `arn:aws:iam::${this.account}:user/learner` });
        case 'configure list':
        case 'configure undefined':
          ctx.out(`      Name                    Value             Type    Location\n      ----                    -----             ----    --------\n   profile                <not set>             None    None\naccess_key     ****************LRNR shared-credentials-file\nsecret_key     ****************LRNR shared-credentials-file\n    region                us-east-1      config-file    ~/.aws/config\n`);
          return 0;
        case 's3 ls': return this.s3ls(ctx, opts, now);
        case 's3 mb': {
          const t = parseS3(opts._[0] || '');
          if (!t) throw new UsageErr('aws s3 mb s3://bucket-name');
          if (this.buckets[t.bucket]) throw new AwsError('BucketAlreadyOwnedByYou', 'CreateBucket', 'Your previous request to create the named bucket succeeded and you already own it.', 1);
          this.buckets[t.bucket] = { created: now, objects: {} };
          ctx.out(`make_bucket: ${t.bucket}\n`);
          return 0;
        }
        case 's3 cp': return this.s3cp(ctx, opts, now);
        case 's3 mv': {
          const status = this.s3cp(ctx, opts, now, 'move');
          return status;
        }
        case 's3 sync': return this.s3sync(ctx, opts, now);
        case 's3 rm': return this.s3rm(ctx, opts);
        case 'cloudfront create-invalidation': {
          const d = this.distribution(opts['distribution-id'], 'CreateInvalidation');
          const paths = opts.paths ? [].concat(opts.paths).flatMap((p) => p.split(/\s+/)).filter(Boolean) : [];
          if (!paths.length) throw new UsageErr('aws cloudfront create-invalidation --distribution-id ID --paths "/*"');
          const id = `I${(++this.counter).toString().padStart(3, '0')}PRACTICE${Math.floor(now / 1000) % 100000}`;
          const inv = { Id: id, Status: 'InProgress', CreateTime: iso(now), InvalidationBatch: { Paths: { Quantity: paths.length, Items: paths }, CallerReference: `cli-${Math.floor(now / 1000)}` } };
          d.invalidations.push(inv);
          return print({ Location: `https://cloudfront.amazonaws.com/2020-05-31/distribution/${opts['distribution-id']}/invalidation/${id}`, Invalidation: inv });
        }
        case 'cloudfront get-invalidation': {
          const d = this.distribution(opts['distribution-id'], 'GetInvalidation');
          const inv = d.invalidations.find((x) => x.Id === opts.id);
          if (!inv) throw new AwsError('NoSuchInvalidation', 'GetInvalidation', 'The specified invalidation does not exist.');
          inv.Status = 'Completed';
          return print({ Invalidation: inv });
        }
        case 'cloudfront list-distributions':
          return print({ DistributionList: { Items: Object.entries(this.distributions).map(([Id, d]) => ({ Id, DomainName: d.domain, Aliases: { Quantity: d.aliases.length, Items: d.aliases }, Status: 'Deployed' })) } });
        case 'secretsmanager get-secret-value': {
          const id = opts['secret-id'];
          if (!(id in this.secrets)) throw new AwsError('ResourceNotFoundException', 'GetSecretValue', "Secrets Manager can't find the specified secret.");
          return print({ ARN: `arn:aws:secretsmanager:us-east-1:${this.account}:secret:${id}-AbCdEf`, Name: id, VersionId: 'practice-v1', SecretString: this.secrets[id], VersionStages: ['AWSCURRENT'], CreatedDate: iso(now) });
        }
        case 'secretsmanager create-secret': {
          const name = opts.name;
          if (!name) throw new UsageErr('aws secretsmanager create-secret --name NAME --secret-string VALUE');
          if (name in this.secrets) throw new AwsError('ResourceExistsException', 'CreateSecret', `The operation failed because the secret ${name} already exists.`);
          this.secrets[name] = opts['secret-string'] ?? '';
          return print({ ARN: `arn:aws:secretsmanager:us-east-1:${this.account}:secret:${name}-AbCdEf`, Name: name, VersionId: 'practice-v1' });
        }
        case 'secretsmanager put-secret-value': {
          const id = opts['secret-id'];
          if (!(id in this.secrets)) throw new AwsError('ResourceNotFoundException', 'PutSecretValue', "Secrets Manager can't find the specified secret.");
          this.secrets[id] = opts['secret-string'] ?? '';
          return print({ ARN: `arn:aws:secretsmanager:us-east-1:${this.account}:secret:${id}-AbCdEf`, Name: id, VersionId: 'practice-v2', VersionStages: ['AWSCURRENT'] });
        }
        case 'secretsmanager list-secrets':
          return print({ SecretList: Object.keys(this.secrets).map((Name) => ({ Name })) });
        default:
          ctx.err(`aws: (practice shell) "aws ${service} ${command ?? ''}" isn't in this pretend account. It supports s3 (ls, mb, cp, mv, sync, rm), cloudfront (create-invalidation, get-invalidation, list-distributions), secretsmanager (get-secret-value, create-secret, put-secret-value, list-secrets) and sts get-caller-identity.\n`);
          return 252;
      }
    } catch (e) {
      if (e instanceof AwsError) { ctx.err(`\n${e.message}\n`); return e.status; }
      if (e instanceof UsageErr) { ctx.err(`usage: ${e.message}\n`); return 252; }
      throw e;
    }
  }

  distribution(id, op) {
    const d = this.distributions[id];
    if (!d) throw new AwsError('NoSuchDistribution', op, 'The specified distribution does not exist.');
    return d;
  }

  bucket(name, op) {
    const b = this.buckets[name];
    if (!b) throw new AwsError('NoSuchBucket', op, 'The specified bucket does not exist', 1);
    return b;
  }

  s3ls(ctx, opts, now) {
    const target = opts._[0];
    if (!target) {
      for (const [name, b] of Object.entries(this.buckets).sort()) ctx.out(`${stamp(b.created)} ${name}\n`);
      return 0;
    }
    const t = parseS3(target);
    if (!t) throw new UsageErr('aws s3 ls s3://bucket/prefix/');
    const b = this.bucket(t.bucket, 'ListObjectsV2');
    const keys = Object.keys(b.objects).filter((k) => k.startsWith(t.key)).sort();
    const human = (n) => (n < 1024 ? `${n} Bytes` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KiB` : `${(n / 1024 ** 2).toFixed(1)} MiB`);
    const size = (n) => (opts['human-readable'] ? human(n).padStart(10) : String(n).padStart(10));
    let total = 0;
    if (opts.recursive) {
      for (const k of keys) { const o = b.objects[k]; total += o.size; ctx.out(`${stamp(o.mtime)} ${size(o.size)} ${k}\n`); }
    } else {
      const prefixLen = t.key.endsWith('/') || !t.key ? t.key.length : t.key.lastIndexOf('/') + 1;
      const dirs = new Set();
      const files = [];
      for (const k of keys) {
        const tail = k.slice(prefixLen);
        if (tail.includes('/')) dirs.add(tail.slice(0, tail.indexOf('/') + 1));
        else files.push(k);
      }
      for (const d of [...dirs].sort()) ctx.out(`                           PRE ${d}\n`);
      for (const k of files) { const o = b.objects[k]; total += o.size; ctx.out(`${stamp(o.mtime)} ${size(o.size)} ${k.slice(prefixLen)}\n`); }
      if (!keys.length && t.key) return 1;
    }
    if (opts.summarize) ctx.out(`\nTotal Objects: ${keys.length}\n   Total Size: ${opts['human-readable'] ? human(total) : total}\n`);
    void now;
    return 0;
  }

  putObject(t, body, opts, now) {
    const b = this.bucket(t.bucket, 'PutObject');
    b.objects[t.key] = { body, size: body.length, mtime: now, cacheControl: opts['cache-control'], contentType: opts['content-type'] };
  }

  s3cp(ctx, opts, now, mode = 'copy') {
    const [src, dest] = opts._;
    if (!src || !dest) throw new UsageErr(`aws s3 ${mode === 'move' ? 'mv' : 'cp'} <LocalPath> <S3Uri> or <S3Uri> <LocalPath>`);
    const { fs } = ctx;
    const s3Src = parseS3(src);
    const s3Dest = parseS3(dest);
    const verb = (v) => (opts.dryrun ? `(dryrun) ${v}` : v);
    const say = (s) => { if (!opts.quiet && !opts['only-show-errors']) ctx.out(`${s}\n`); };
    if (!s3Src && s3Dest) {
      if (!fs.exists(src)) { ctx.err(`\nThe user-provided path ${src} does not exist.\n`); return 255; }
      if (fs.isDir(src)) {
        if (!opts.recursive) { ctx.err(`\nupload failed: ${src} to ${dest} [Errno 21] Is a directory: '${src}'\n`); return 1; }
        const base = fs.resolve(src);
        for (const { path, node } of fs.walk(src)) {
          if (node.type !== 'file') continue;
          const rel = path.slice(base.length + 1);
          const key = `${s3Dest.key.replace(/\/?$/, s3Dest.key ? '/' : '')}${rel}`;
          if (!opts.dryrun) this.putObject({ bucket: s3Dest.bucket, key }, node.content, opts, now);
          say(verb(`upload: ${src.replace(/\/$/, '')}/${rel} to s3://${s3Dest.bucket}/${key}`));
        }
        if (mode === 'move' && !opts.dryrun) fs.remove(src, { recursive: true });
        return 0;
      }
      this.bucket(s3Dest.bucket, 'PutObject');
      const key = !s3Dest.key || s3Dest.key.endsWith('/') ? `${s3Dest.key}${baseOf(fs.resolve(src))}` : s3Dest.key;
      if (!opts.dryrun) this.putObject({ bucket: s3Dest.bucket, key }, fs.read(src), opts, now);
      say(verb(`${mode === 'move' ? 'move' : 'upload'}: ${src.startsWith('/') || src.startsWith('.') ? src : `./${src}`} to s3://${s3Dest.bucket}/${key}`));
      if (mode === 'move' && !opts.dryrun) fs.remove(src);
      return 0;
    }
    if (s3Src && !s3Dest) {
      const b = this.bucket(s3Src.bucket, 'GetObject');
      const o = b.objects[s3Src.key];
      if (!o) { ctx.err('fatal error: An error occurred (404) when calling the HeadObject operation: Key "' + s3Src.key + '" does not exist\n'); return 1; }
      const target = dest === '-' ? null : fs.isDir(dest) ? `${dest.replace(/\/$/, '')}/${baseOf('/' + s3Src.key)}` : dest;
      if (target === null) { ctx.out(o.body); return 0; }
      if (!opts.dryrun) fs.write(target, o.body);
      say(verb(`download: ${src} to ${target}`));
      return 0;
    }
    if (s3Src && s3Dest) {
      const o = this.bucket(s3Src.bucket, 'CopyObject').objects[s3Src.key];
      if (!o) { ctx.err(`fatal error: Key "${s3Src.key}" does not exist\n`); return 1; }
      if (!opts.dryrun) this.putObject(s3Dest, o.body, opts, now);
      say(verb(`copy: ${src} to ${dest}`));
      return 0;
    }
    throw new UsageErr('aws s3 cp <LocalPath> <S3Uri> or <S3Uri> <LocalPath>');
  }

  s3sync(ctx, opts, now) {
    const [src, dest] = opts._;
    const { fs } = ctx;
    const s3Dest = parseS3(dest || '');
    if (!src || !s3Dest || parseS3(src)) throw new UsageErr('aws s3 sync <LocalPath> <S3Uri> (this practice shell syncs local folders up to S3)');
    if (!fs.isDir(src)) { ctx.err(`\nThe user-provided path ${src} does not exist.\n`); return 255; }
    const b = this.bucket(s3Dest.bucket, 'ListObjectsV2');
    const prefix = s3Dest.key ? s3Dest.key.replace(/\/?$/, '/') : '';
    const excludes = [].concat(opts.exclude || []).map((p) => new RegExp(globToRegex(p).source.replace(/\[\^\/\]\*/g, '.*')));
    const includes = [].concat(opts.include || []).map((p) => new RegExp(globToRegex(p).source.replace(/\[\^\/\]\*/g, '.*')));
    const skipped = (rel) => excludes.some((r) => r.test(rel)) && !includes.some((r) => r.test(rel));
    const base = fs.resolve(src);
    const seen = new Set();
    const say = (s) => { if (!opts.quiet && !opts['only-show-errors']) ctx.out(`${opts.dryrun ? '(dryrun) ' : ''}${s}\n`); };
    for (const { path, node } of fs.walk(src)) {
      if (node.type !== 'file') continue;
      const rel = path.slice(base.length + 1);
      if (skipped(rel)) continue;
      const key = prefix + rel;
      seen.add(key);
      const existing = b.objects[key];
      if (existing && existing.body === node.content) continue;
      if (!opts.dryrun) this.putObject({ bucket: s3Dest.bucket, key }, node.content, opts, now);
      say(`upload: ${src.replace(/\/$/, '')}/${rel} to s3://${s3Dest.bucket}/${key}`);
    }
    if (opts.delete) {
      for (const key of Object.keys(b.objects).sort()) {
        if (!key.startsWith(prefix) || seen.has(key) || skipped(key.slice(prefix.length))) continue;
        if (!opts.dryrun) delete b.objects[key];
        say(`delete: s3://${s3Dest.bucket}/${key}`);
      }
    }
    return 0;
  }

  s3rm(ctx, opts) {
    const t = parseS3(opts._[0] || '');
    if (!t) throw new UsageErr('aws s3 rm s3://bucket/key');
    const b = this.bucket(t.bucket, 'DeleteObject');
    const keys = opts.recursive ? Object.keys(b.objects).filter((k) => k.startsWith(t.key)).sort() : [t.key];
    for (const k of keys) {
      if (!opts.dryrun) delete b.objects[k];
      if (!opts.quiet) ctx.out(`${opts.dryrun ? '(dryrun) ' : ''}delete: s3://${t.bucket}/${k}\n`);
    }
    return 0;
  }

  // Helpers for tutorial checks
  objects(bucket) { return this.buckets[bucket]?.objects ?? {}; }
  keys(bucket, prefix = '') { return Object.keys(this.objects(bucket)).filter((k) => k.startsWith(prefix)).sort(); }
}

class UsageErr extends Error {}

// --flag value / --flag=value / --boolean, positional in _
function parseOptions(args) {
  const BOOL = new Set(['recursive', 'delete', 'dryrun', 'quiet', 'only-show-errors', 'human-readable', 'summarize', 'exact-timestamps', 'no-progress']);
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split(/=(.*)/s);
      if (BOOL.has(k)) { out[k] = true; continue; }
      let v = inline ?? args[++i];
      // --paths takes several values: --paths /index.html /about.html
      if (k === 'paths') {
        const vals = [v];
        while (args[i + 1] && !args[i + 1].startsWith('--')) vals.push(args[++i]);
        v = vals;
      }
      if (k in out && (k === 'exclude' || k === 'include')) out[k] = [].concat(out[k], v);
      else out[k] = v;
    } else out._.push(a);
  }
  return out;
}
