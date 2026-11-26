// Tests for create-course-site.mjs against a pretend AWS CLI (no account needed):
//   node --test scripts/create-course-site.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./create-course-site.mjs', import.meta.url));

// A pretend `aws`: answers from a JSON state file, logs every call, and
// remembers what was created so a second run can find it.
const FAKE_AWS = `#!/usr/bin/env node
const fs = require('fs');
const statePath = process.env.FAKE_AWS_STATE;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const args = process.argv.slice(2).filter((a, i, all) => a !== '--output' && all[i - 1] !== '--output');
fs.appendFileSync(process.env.FAKE_AWS_LOG, JSON.stringify(args) + '\\n');
const arg = (n) => args[args.indexOf('--' + n) + 1];
const readFile = (v) => JSON.parse(fs.readFileSync(v.replace('file://', ''), 'utf8'));
const out = (o) => { process.stdout.write(JSON.stringify(o)); process.exit(0); };
const err = (m) => { process.stderr.write(m); process.exit(254); };
const save = () => fs.writeFileSync(statePath, JSON.stringify(state));
const [svc, cmd] = args;
const key = svc + ' ' + cmd;
switch (key) {
  case 'sts get-caller-identity': out({ Account: state.account, Arn: 'arn:aws:iam::' + state.account + ':user/aws-cli' });
  case 'cloudfront list-distributions': out({ DistributionList: { Items: state.distributions.map((d) => ({ Id: d.Id, DomainName: d.DomainName, Aliases: d.Config.Aliases })) } });
  case 'cloudfront get-distribution-config': { const d = state.distributions.find((x) => x.Id === arg('id')); out({ ETag: 'E1', DistributionConfig: d.Config }); }
  case 'cloudfront create-distribution': {
    const Config = readFile(arg('distribution-config'));
    const d = { Id: 'ENEW' + state.distributions.length, DomainName: 'dnew' + state.distributions.length + '.cloudfront.net', Config };
    state.distributions.push(d); save(); out({ Distribution: { Id: d.Id, DomainName: d.DomainName } });
  }
  case 'acm describe-certificate': out({ Certificate: state.certs.find((c) => c.CertificateArn === arg('certificate-arn')) });
  case 'acm list-certificates': out({ CertificateSummaryList: state.certs.map((c) => ({ CertificateArn: c.CertificateArn })) });
  case 's3api head-bucket': state.buckets[arg('bucket')] ? out({}) : err('Not Found');
  case 's3api create-bucket': state.buckets[arg('bucket')] = {}; save(); out({ Location: '/' + arg('bucket') });
  case 's3api get-public-access-block': { const b = state.buckets[arg('bucket')]; b.pab ? out({ PublicAccessBlockConfiguration: b.pab }) : err('NoSuchPublicAccessBlockConfiguration'); }
  case 's3api get-bucket-ownership-controls': { const b = state.buckets[arg('bucket')]; b.own ? out({ OwnershipControls: b.own }) : err('OwnershipControlsNotFoundError'); }
  case 's3api get-bucket-encryption': { const b = state.buckets[arg('bucket')]; b.enc ? out({ ServerSideEncryptionConfiguration: b.enc }) : err('ServerSideEncryptionConfigurationNotFoundError'); }
  case 's3api get-bucket-website': { const b = state.buckets[arg('bucket')]; b.web ? out(b.web) : err('NoSuchWebsiteConfiguration'); }
  case 's3api get-bucket-policy': { const b = state.buckets[arg('bucket')]; b.policy ? out({ Policy: b.policy }) : err('NoSuchBucketPolicy'); }
  case 's3api put-public-access-block': state.buckets[arg('bucket')].pab = readFile(arg('public-access-block-configuration')); save(); out({});
  case 's3api put-bucket-ownership-controls': state.buckets[arg('bucket')].own = readFile(arg('ownership-controls')); save(); out({});
  case 's3api put-bucket-encryption': state.buckets[arg('bucket')].enc = readFile(arg('server-side-encryption-configuration')); save(); out({});
  case 's3api put-bucket-website': state.buckets[arg('bucket')].web = readFile(arg('website-configuration')); save(); out({});
  case 's3api put-bucket-policy': state.buckets[arg('bucket')].policy = arg('policy'); save(); out({});
  case 'route53 list-hosted-zones': out({ HostedZones: state.zones });
  case 'route53 list-resource-record-sets': out({ ResourceRecordSets: state.records[arg('hosted-zone-id')] || [] });
  case 'route53 change-resource-record-sets': {
    const zone = arg('hosted-zone-id');
    for (const c of readFile(arg('change-batch')).Changes) {
      state.records[zone] = (state.records[zone] || []).filter((r) => !(r.Name === c.ResourceRecordSet.Name + '.' && r.Type === c.ResourceRecordSet.Type));
      state.records[zone].push({ ...c.ResourceRecordSet, Name: c.ResourceRecordSet.Name + '.' });
    }
    save(); out({ ChangeInfo: { Status: 'PENDING' } });
  }
  default: err('fake aws: unhandled ' + key);
}
`;

const OLD = 'aws-study-flashcards-app.com';
const NEW = 'levelupstudyhub.com';
const tsConfig = () => ({
  CallerReference: 'ts-1',
  Aliases: { Quantity: 2, Items: [`typescript.${OLD}`, `typescript.${NEW}`] },
  DefaultRootObject: 'index.html',
  Comment: 'typescript course site',
  Origins: { Quantity: 1, Items: [{ Id: `typescript.${OLD}.s3-website-us-east-1.amazonaws.com`, DomainName: `typescript.${OLD}.s3-website-us-east-1.amazonaws.com`, CustomOriginConfig: { OriginProtocolPolicy: 'http-only' } }] },
  DefaultCacheBehavior: { TargetOriginId: `typescript.${OLD}.s3-website-us-east-1.amazonaws.com`, ViewerProtocolPolicy: 'redirect-to-https', CachePolicyId: 'cp-1' },
  CacheBehaviors: { Quantity: 0 },
  CustomErrorResponses: { Quantity: 1, Items: [{ ErrorCode: 404, ResponsePagePath: '/index.html', ResponseCode: '200' }] },
  ViewerCertificate: { ACMCertificateArn: 'arn:cert-old', Certificate: 'arn:cert-old', CertificateSource: 'acm', SSLSupportMethod: 'sni-only', MinimumProtocolVersion: 'TLSv1.2_2021' },
  Logging: { Enabled: false, Bucket: '', Prefix: '' },
  Enabled: true,
});

const baseState = (overrides = {}) => ({
  account: '418272768335',
  distributions: [{ Id: 'E2HBJJFM265RJL', DomainName: 'dts.cloudfront.net', Config: tsConfig() }],
  certs: [
    { CertificateArn: 'arn:cert-old', SubjectAlternativeNames: [`*.${OLD}`, OLD, `*.${NEW}`, NEW], Status: 'ISSUED' },
  ],
  buckets: {
    [`typescript.${OLD}`]: {
      pab: { BlockPublicAcls: false, IgnorePublicAcls: false, BlockPublicPolicy: false, RestrictPublicBuckets: false },
      own: { Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }] },
      web: { IndexDocument: { Suffix: 'index.html' }, ErrorDocument: { Key: 'index.html' } },
      policy: JSON.stringify({ Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: `arn:aws:s3:::typescript.${OLD}/*` }] }),
    },
  },
  zones: [
    { Id: '/hostedzone/ZOLD', Name: `${OLD}.`, Config: { PrivateZone: false } },
    { Id: '/hostedzone/ZNEW', Name: `${NEW}.`, Config: { PrivateZone: false } },
  ],
  records: {
    ZOLD: [
      { Name: `typescript.${OLD}.`, Type: 'A', AliasTarget: { DNSName: 'dts.cloudfront.net', HostedZoneId: 'Z2FDTNDATAQYW2' } },
      { Name: `typescript.${OLD}.`, Type: 'AAAA', AliasTarget: { DNSName: 'dts.cloudfront.net', HostedZoneId: 'Z2FDTNDATAQYW2' } },
    ],
    ZNEW: [{ Name: `typescript.${NEW}.`, Type: 'A', AliasTarget: { DNSName: 'dts.cloudfront.net', HostedZoneId: 'Z2FDTNDATAQYW2' } }],
  },
  ...overrides,
});

const setup = (state) => {
  const dir = mkdtempSync(join(tmpdir(), 'fake-aws-'));
  writeFileSync(join(dir, 'aws'), FAKE_AWS);
  chmodSync(join(dir, 'aws'), 0o755);
  writeFileSync(join(dir, 'state.json'), JSON.stringify(state));
  writeFileSync(join(dir, 'log'), '');
  const run = (...extra) => {
    try {
      const stdout = execFileSync('node', [SCRIPT, '--from', 'typescript', '--to', 'spanish', ...extra], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAKE_AWS_STATE: join(dir, 'state.json'), FAKE_AWS_LOG: join(dir, 'log') },
      });
      return { code: 0, stdout };
    } catch (e) { return { code: e.status, stdout: String(e.stdout), stderr: String(e.stderr) }; }
  };
  const calls = () => readFileSync(join(dir, 'log'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const state_ = () => JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'));
  return { run, calls, state: state_ };
};

const WRITES = /^(create-|put-|change-)/;

test('without --apply it plans and changes nothing', () => {
  const t = setup(baseState());
  const r = t.run();
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /Plan only: \d+ change/);
  assert.match(r.stdout, /spanish\.aws-study-flashcards-app\.com, spanish\.levelupstudyhub\.com/);
  assert.deepEqual(t.calls().filter(([, cmd]) => WRITES.test(cmd)), []);
});

test('with --apply it copies the bucket, the distribution and the DNS records', () => {
  const t = setup(baseState());
  const r = t.run('--apply');
  assert.equal(r.code, 0, r.stderr);
  const s = t.state();
  const bucket = s.buckets[`spanish.${OLD}`];
  assert.deepEqual(bucket.web, { IndexDocument: { Suffix: 'index.html' }, ErrorDocument: { Key: 'index.html' } });
  assert.deepEqual(bucket.own, { Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }] });
  assert.match(bucket.policy, /arn:aws:s3:::spanish\.aws-study-flashcards-app\.com\/\*/);
  assert.doesNotMatch(bucket.policy, /typescript/);

  const created = s.distributions.find((d) => d.Id !== 'E2HBJJFM265RJL');
  const c = created.Config;
  assert.deepEqual(c.Aliases, { Quantity: 2, Items: [`spanish.${OLD}`, `spanish.${NEW}`] });
  assert.equal(c.Origins.Items[0].DomainName, `spanish.${OLD}.s3-website-us-east-1.amazonaws.com`);
  assert.equal(c.DefaultCacheBehavior.TargetOriginId, c.Origins.Items[0].Id);
  assert.deepEqual(c.CustomErrorResponses, tsConfig().CustomErrorResponses);
  assert.equal(c.ViewerCertificate.ACMCertificateArn, 'arn:cert-old');
  assert.notEqual(c.CallerReference, 'ts-1');

  const alias = (zone, name, type) => s.records[zone].find((x) => x.Name === name && x.Type === type);
  assert.equal(alias('ZOLD', `spanish.${OLD}.`, 'A').AliasTarget.DNSName, created.DomainName);
  assert.equal(alias('ZOLD', `spanish.${OLD}.`, 'AAAA').AliasTarget.DNSName, created.DomainName);
  assert.equal(alias('ZNEW', `spanish.${NEW}.`, 'A').AliasTarget.DNSName, created.DomainName);
  assert.equal(alias('ZNEW', `spanish.${NEW}.`, 'AAAA'), undefined); // the source had no AAAA there
  assert.match(r.stdout, new RegExp(`CloudFront id: ${created.Id}`));
});

test('running it again reuses what exists instead of creating a second distribution', () => {
  const t = setup(baseState());
  assert.equal(t.run('--apply').code, 0);
  const before = t.state().distributions.length;
  const again = t.run('--apply');
  assert.equal(again.code, 0, again.stderr);
  assert.equal(t.state().distributions.length, before);
  assert.match(again.stdout, /already exists: keeping it/);
  assert.match(again.stdout, /already answers to/);
});

test('a private bucket read through CloudFront gets a policy for the new distribution', () => {
  const state = baseState();
  const src = state.buckets[`typescript.${OLD}`];
  delete src.web;
  src.policy = JSON.stringify({ Statement: [{ Principal: { Service: 'cloudfront.amazonaws.com' }, Resource: `arn:aws:s3:::typescript.${OLD}/*`, Condition: { StringEquals: { 'AWS:SourceArn': 'arn:aws:cloudfront::418272768335:distribution/E2HBJJFM265RJL' } } }] });
  const t = setup(state);
  assert.equal(t.run('--apply').code, 0);
  const s = t.state();
  const created = s.distributions.find((d) => d.Id !== 'E2HBJJFM265RJL');
  assert.match(s.buckets[`spanish.${OLD}`].policy, new RegExp(`distribution/${created.Id}`));
  assert.doesNotMatch(s.buckets[`spanish.${OLD}`].policy, /E2HBJJFM265RJL/);
});

test('it stops before changing anything when no certificate covers the new names', () => {
  const t = setup(baseState({ certs: [{ CertificateArn: 'arn:cert-old', SubjectAlternativeNames: [`typescript.${OLD}`, `typescript.${NEW}`], Status: 'ISSUED' }] }));
  const r = t.run('--apply');
  assert.equal(r.code, 1);
  assert.match(r.stderr, /aws acm request-certificate --region us-east-1 --validation-method DNS --domain-name spanish\.aws-study-flashcards-app\.com --subject-alternative-names spanish\.levelupstudyhub\.com/);
  assert.deepEqual(t.calls().filter(([, cmd]) => WRITES.test(cmd)), []);
});

test('it uses another issued certificate when the source one does not cover the new names', () => {
  const t = setup(baseState({ certs: [
    { CertificateArn: 'arn:cert-old', SubjectAlternativeNames: [`typescript.${OLD}`, `typescript.${NEW}`] },
    { CertificateArn: 'arn:cert-wild', SubjectAlternativeNames: [`*.${OLD}`, `*.${NEW}`] },
  ] }));
  assert.equal(t.run('--apply').code, 0);
  const created = t.state().distributions.find((d) => d.Id !== 'E2HBJJFM265RJL');
  assert.equal(created.Config.ViewerCertificate.ACMCertificateArn, 'arn:cert-wild');
});

test('it refuses other AWS accounts', () => {
  const t = setup(baseState({ account: '111122223333' }));
  const r = t.run();
  assert.equal(r.code, 1);
  assert.match(r.stderr, /not 418272768335/);
});

test('a name whose DNS is not in Route 53 is reported, not guessed', () => {
  const t = setup(baseState({ zones: [{ Id: '/hostedzone/ZOLD', Name: `${OLD}.`, Config: { PrivateZone: false } }] }));
  const r = t.run('--apply');
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /No Route 53 record to copy for spanish\.levelupstudyhub\.com/);
});

test('bad arguments print the usage', () => {
  let status;
  let stderr;
  try { execFileSync('node', [SCRIPT, '--from', 'typescript'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { status = e.status; stderr = String(e.stderr); }
  assert.equal(status, 64);
  assert.match(stderr, /Usage: node scripts\/create-course-site\.mjs --from/);
});
