#!/usr/bin/env node
// Creates the hosting for a new course site by copying a site that already
// works: its S3 bucket settings, its CloudFront distribution (certificate,
// cache policy, error pages, logging) and its Route 53 records, under every
// name it answers to (aws-study-flashcards-app.com and levelupstudyhub.com).
//
//   node scripts/create-course-site.mjs --from typescript --to spanish          # plan only, changes nothing
//   node scripts/create-course-site.mjs --from typescript --to spanish --apply  # create it
//
// Why copy instead of a template: the course sites were set up by hand, so the
// live TypeScript site is the only exact record of how they are configured.
// Copying it gives the new site the same behaviour without guessing.
//
// Safe to run again: an existing bucket, distribution or DNS record is reused.
// Uses the AWS CLI with your default profile (CLAUDE.md: never the nico-aws one).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = 'aws-study-flashcards-app.com';
const ACCOUNT = '418272768335';
const CLOUDFRONT_ZONE = 'Z2FDTNDATAQYW2'; // the fixed hosted zone id of every CloudFront domain

// ---------- arguments ----------
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
const FROM = opt('from');
const TO = opt('to');
const APPLY = argv.includes('--apply');
const SUB = /^[a-z0-9-]+$/;
if (!SUB.test(FROM || '') || !SUB.test(TO || '') || FROM === TO) {
  console.error('Usage: node scripts/create-course-site.mjs --from <existing subdomain> --to <new subdomain> [--apply]');
  console.error('Example: node scripts/create-course-site.mjs --from typescript --to spanish');
  process.exit(64);
}

// ---------- the AWS CLI ----------
const work = mkdtempSync(join(tmpdir(), 'course-site-'));
const aws = (args, { allowFail = false } = {}) => {
  try {
    const out = execFileSync('aws', [...args, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return out.trim() ? JSON.parse(out) : {};
  } catch (e) {
    if (allowFail) return null;
    const msg = String(e.stderr || e.message).trim();
    throw new Error(`aws ${args.slice(0, 2).join(' ')} failed: ${msg}`);
  }
};
const file = (name, data) => { const p = join(work, name); writeFileSync(p, JSON.stringify(data, null, 2)); return `file://${p}`; };

const planned = [];
// A change: printed in a plan, run with --apply
const change = (what, args) => {
  planned.push(what);
  if (!APPLY) { console.log(`  [plan] ${what}`); return null; }
  console.log(`  ✓ ${what}`);
  return aws(args);
};

const step = (s) => console.log(`\n▸ ${s}`);
const fail = (msg) => { console.error(`\n✗ ${msg}`); process.exit(1); };
const rename = (s) => s.split(`${FROM}.`).join(`${TO}.`);

// ---------- 1. who am I ----------
step('AWS account');
const me = aws(['sts', 'get-caller-identity']);
if (me.Account !== ACCOUNT) fail(`These credentials are for account ${me.Account}, not ${ACCOUNT}. Use the default profile.`);
console.log(`  ${me.Arn}`);

// ---------- 2. the site to copy ----------
step(`The site to copy: ${FROM}.${ROOT}`);
const listDistributions = () => aws(['cloudfront', 'list-distributions']).DistributionList?.Items || [];
const distributions = listDistributions();
const hasAlias = (d, name) => (d.Aliases?.Items || []).includes(name);
const source = distributions.find((d) => hasAlias(d, `${FROM}.${ROOT}`));
if (!source) fail(`No CloudFront distribution answers to ${FROM}.${ROOT}.`);
const { DistributionConfig: sourceConfig } = aws(['cloudfront', 'get-distribution-config', '--id', source.Id]);
const sourceNames = sourceConfig.Aliases?.Items || [];
const names = sourceNames.filter((n) => n.startsWith(`${FROM}.`)).map(rename);
console.log(`  ${source.Id} answers to ${sourceNames.join(', ')}`);
console.log(`  The new site will answer to ${names.join(', ')}`);

// ---------- 3. a certificate for the new names ----------
step('Certificate (us-east-1, for CloudFront)');
const covers = (sans, name) => sans.some((san) => san === name || (san.startsWith('*.') && name.split('.').slice(1).join('.') === san.slice(2)));
const describeCert = (arn) => aws(['acm', 'describe-certificate', '--region', 'us-east-1', '--certificate-arn', arn]).Certificate;
let certArn = sourceConfig.ViewerCertificate?.ACMCertificateArn;
let cert = certArn ? describeCert(certArn) : null;
if (!cert || !names.every((n) => covers(cert.SubjectAlternativeNames || [], n))) {
  const issued = aws(['acm', 'list-certificates', '--region', 'us-east-1', '--certificate-statuses', 'ISSUED']).CertificateSummaryList || [];
  cert = issued.map((c) => describeCert(c.CertificateArn)).find((c) => names.every((n) => covers(c.SubjectAlternativeNames || [], n)));
  if (!cert) {
    const [first, ...rest] = names;
    fail(`No issued certificate covers ${names.join(' and ')}. Request one, add its DNS validation records, wait until it is ISSUED, then run this again:\n\n` +
      `  aws acm request-certificate --region us-east-1 --validation-method DNS --domain-name ${first}` +
      (rest.length ? ` --subject-alternative-names ${rest.join(' ')}` : ''));
  }
  certArn = cert.CertificateArn;
}
console.log(`  ${certArn} covers ${names.join(', ')}`);

// ---------- 4. the bucket ----------
step('S3 bucket');
const bucketOf = (domain) => (domain.match(/^(.+?)\.s3([.-]website)?[.-]/) || [])[1];
const s3Origins = (sourceConfig.Origins?.Items || []).filter((o) => bucketOf(o.DomainName));
if (s3Origins.length !== 1) fail(`Expected one S3 origin on ${source.Id}, found ${s3Origins.length}. Copy this site by hand.`);
const sourceBucket = bucketOf(s3Origins[0].DomainName);
const bucket = sourceBucket.startsWith(`${FROM}.`) ? rename(sourceBucket) : `${TO}.${ROOT}`;
console.log(`  copy the settings of ${sourceBucket} to ${bucket}`);

const bucketExists = aws(['s3api', 'head-bucket', '--bucket', bucket], { allowFail: true }) !== null;
if (bucketExists) console.log(`  ${bucket} already exists: keeping it`);
else change(`create bucket ${bucket}`, ['s3api', 'create-bucket', '--bucket', bucket, '--region', 'us-east-1']);

// Each setting is copied only when the source bucket has it
const copySetting = (getArgs, putArgs, pick, label) => {
  const got = aws(['s3api', ...getArgs, '--bucket', sourceBucket], { allowFail: true });
  if (!got) return;
  change(`${label} on ${bucket}`, ['s3api', ...putArgs, '--bucket', bucket, ...pick(got)]);
};
copySetting(['get-public-access-block'], ['put-public-access-block'],
  (g) => ['--public-access-block-configuration', file('public-access.json', g.PublicAccessBlockConfiguration)], 'block public access (as the source)');
copySetting(['get-bucket-ownership-controls'], ['put-bucket-ownership-controls'],
  (g) => ['--ownership-controls', file('ownership.json', g.OwnershipControls)], 'object ownership (as the source)');
copySetting(['get-bucket-encryption'], ['put-bucket-encryption'],
  (g) => ['--server-side-encryption-configuration', file('encryption.json', g.ServerSideEncryptionConfiguration)], 'default encryption (as the source)');
copySetting(['get-bucket-website'], ['put-bucket-website'],
  (g) => ['--website-configuration', file('website.json', { IndexDocument: g.IndexDocument, ErrorDocument: g.ErrorDocument, RoutingRules: g.RoutingRules })], 'static website hosting (as the source)');

// ---------- 5. the distribution ----------
step('CloudFront distribution');
const existing = distributions.find((d) => names.some((n) => hasAlias(d, n)));
let distId;
let distDomain;
if (existing) {
  distId = existing.Id;
  distDomain = existing.DomainName;
  console.log(`  ${distId} already answers to ${(existing.Aliases?.Items || []).join(', ')}: keeping it`);
} else {
  const config = JSON.parse(JSON.stringify(sourceConfig));
  config.CallerReference = `${TO}-site-${Date.now()}`;
  config.Aliases = { Quantity: names.length, Items: names };
  config.Comment = rename(config.Comment || '') || `${TO}.${ROOT}`;
  const originIds = {};
  for (const o of config.Origins.Items) {
    if (!bucketOf(o.DomainName)) continue;
    const newId = o.Id.split(sourceBucket).join(bucket);
    originIds[o.Id] = newId;
    o.Id = newId;
    o.DomainName = o.DomainName.split(sourceBucket).join(bucket);
  }
  const retarget = (b) => { if (b && originIds[b.TargetOriginId]) b.TargetOriginId = originIds[b.TargetOriginId]; };
  retarget(config.DefaultCacheBehavior);
  (config.CacheBehaviors?.Items || []).forEach(retarget);
  if (config.Logging?.Enabled && config.Logging.Prefix) config.Logging.Prefix = rename(config.Logging.Prefix);
  config.ViewerCertificate = { ...config.ViewerCertificate, ACMCertificateArn: certArn, Certificate: certArn, CertificateSource: 'acm', CloudFrontDefaultCertificate: false };
  const created = change(`create a distribution for ${names.join(', ')} (copy of ${source.Id})`,
    ['cloudfront', 'create-distribution', '--distribution-config', file('distribution.json', config)]);
  distId = created?.Distribution?.Id || '<new distribution id>';
  distDomain = created?.Distribution?.DomainName || '<new distribution>.cloudfront.net';
}

// The bucket policy names the bucket and, for a private bucket, the distribution allowed to read it
const policy = aws(['s3api', 'get-bucket-policy', '--bucket', sourceBucket], { allowFail: true });
if (policy?.Policy) {
  const text = policy.Policy.split(sourceBucket).join(bucket).split(`distribution/${source.Id}`).join(`distribution/${distId}`);
  change(`bucket policy on ${bucket} (as the source, for ${distId})`, ['s3api', 'put-bucket-policy', '--bucket', bucket, '--policy', text]);
}

// ---------- 6. DNS ----------
step('DNS (Route 53)');
const zones = aws(['route53', 'list-hosted-zones']).HostedZones || [];
const zoneFor = (name) => zones
  .filter((z) => !z.Config?.PrivateZone && `${name}.`.endsWith(`.${z.Name}`))
  .sort((a, b) => b.Name.length - a.Name.length)[0];
const manual = [];
for (const name of names) {
  const zone = zoneFor(name);
  const sourceName = name.replace(new RegExp(`^${TO}\\.`), `${FROM}.`);
  if (!zone) { manual.push(name); continue; }
  const zoneId = zone.Id.replace('/hostedzone/', '');
  const records = aws(['route53', 'list-resource-record-sets', '--hosted-zone-id', zoneId, '--start-record-name', sourceName, '--max-items', '10']).ResourceRecordSets || [];
  const types = records.filter((r) => r.Name === `${sourceName}.` && r.AliasTarget && ['A', 'AAAA'].includes(r.Type)).map((r) => r.Type);
  if (!types.length) { manual.push(name); continue; }
  const batch = {
    Comment: `${name} → CloudFront (copied from ${sourceName})`,
    Changes: types.map((Type) => ({
      Action: 'UPSERT',
      ResourceRecordSet: { Name: name, Type, AliasTarget: { HostedZoneId: CLOUDFRONT_ZONE, DNSName: distDomain, EvaluateTargetHealth: false } },
    })),
  };
  change(`${types.join(' + ')} alias ${name} → ${distDomain}`, ['route53', 'change-resource-record-sets', '--hosted-zone-id', zoneId, '--change-batch', file(`dns-${name}.json`, batch)]);
}

// ---------- done ----------
console.log('');
if (manual.length) {
  console.log(`⚠ No Route 53 record to copy for ${manual.join(', ')}. Point ${manual.length > 1 ? 'them' : 'it'} at ${distDomain} where that domain's DNS lives (a CNAME, or an alias if the provider supports it).`);
}
if (!APPLY) {
  console.log(`Plan only: ${planned.length} change(s) above, nothing was changed. Run again with --apply to make them.`);
} else {
  console.log(`Done. CloudFront id: ${distId}`);
  console.log(`Next: put it in deploy.sh (${TO.toUpperCase()}_DIST_ID="${distId}" or the matching deploy_ function), then ./deploy.sh ${TO}`);
  console.log('A new distribution takes a few minutes to deploy; the site answers once its status is "Deployed".');
}
