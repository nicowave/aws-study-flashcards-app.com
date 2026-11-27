// Tests for deploy.sh against pretend aws / npm / npx (no account, no build):
//   node --test scripts/deploy.test.mjs
// Skipped when zsh is not installed. deploy.sh is copied into a temp folder with
// pretend site folders, so nothing in the repo is built or changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEPLOY = fileURLToPath(new URL('../deploy.sh', import.meta.url));
const skip = spawnSync('zsh', ['--version']).status === 0 ? false : 'zsh is not installed';

const OLD = 'aws-study-flashcards-app.com';
const NEW = 'levelupstudyhub.com';

// Buckets and old-name distributions never change; the new-name ids are from docs/domain-switch.md.
const SITES = [
  { target: 'hub', bucket: 'aws-study-flashcards-app-home', oldDist: 'E3D126UT3L72OL', newDist: 'EQQAL9UJ4QD8M', url: `https://${NEW}` },
  { target: 'cloud', bucket: `cloud.${OLD}`, oldDist: 'E6NUXKK8FTCR1', newDist: 'EDFO69NOBW3ND', url: `https://cloud.${NEW}` },
  { target: 'ai', bucket: `ai.${OLD}`, oldDist: 'E23TPCWLVKFC65', newDist: 'E10Z4YFFKV0730', url: `https://ai.${NEW}` },
  { target: 'saa', bucket: `saa.${OLD}`, oldDist: 'EBOXWN6EUZHKF', newDist: 'E2QGETZVAOUTUY', url: `https://architect.${NEW}` },
  { target: 'dva', bucket: `dva.${OLD}`, oldDist: 'E2UB744W5YUCTW', newDist: 'E1AE85QV25KDPD', url: `https://developer.${NEW}` },
  { target: 'bash', bucket: `bash.${OLD}`, oldDist: 'EYR8XH2CLI1DT', newDist: 'E1GVBB47Y9R725', url: `https://bash.${NEW}` },
  { target: 'python', bucket: `python.${OLD}`, oldDist: 'E205DY614C5Q4C', newDist: 'E3M8Y7JMGKWB6T', url: `https://python.${NEW}` },
  { target: 'js', bucket: `js.${OLD}`, oldDist: 'E1JMSZCG8CKTGT', newDist: 'E8AUAQW0X05X2', url: `https://js.${NEW}` },
  { target: 'typescript', bucket: `typescript.${OLD}`, oldDist: 'E2HBJJFM265RJL', newDist: 'EYRAVLUIZ7XC4', url: `https://typescript.${NEW}` },
  { target: 'tutorials', bucket: 'tutorials-aws-study-flashcards-app-418272768335', oldDist: 'E24YKUY1M23PV0', newDist: 'E3F0ZP2LBB09SZ', url: `https://tutorials.${NEW}` },
];
// Tech Spanish has no levelupstudyhub.com site yet: one distribution, old-name address.
const SPANISH = { target: 'spanish', bucket: `spanish.${OLD}`, oldDist: 'ED5TOS0C03S4Z', url: `https://spanish.${OLD}` };
const JAVASCRIPT_REDIRECT_DIST = 'E27Y7QTYXZD1SM';
const site = (target) => SITES.find((s) => s.target === target);

// Pretend commands: log their arguments (tab-separated) and succeed. The pretend aws fails
// create-invalidation for the distribution named in FAKE_AWS_FAIL.
const FAKE = (name, extra = '') => `#!/bin/sh
IFS='\t'
printf '${name}\\t%s\\n' "$*" >> "$FAKE_LOG"
${extra}exit 0
`;
const FAKE_AWS = FAKE('aws', `if [ -n "$FAKE_AWS_FAIL" ]; then
  case "\t$*\t" in *"\tcreate-invalidation\t"*"\t$FAKE_AWS_FAIL\t"*) echo "fake aws: AccessDenied" >&2; exit 254;; esac
fi
`);

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'deploy-test-'));
  const write = (path, text = 'x') => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  copyFileSync(DEPLOY, join(root, 'deploy.sh'));
  for (const [name, body] of [['aws', FAKE_AWS], ['npm', FAKE('npm')], ['npx', FAKE('npx')]]) {
    write(`bin/${name}`, body);
    chmodSync(join(root, 'bin', name), 0o755);
  }
  for (const app of ['aws-study-homepage', 'aws-cloud-practitioner-game', 'aws-ai-study-game', 'aws-saa-study-game', 'aws-dva-study-game']) {
    write(`${app}/package.json`, '{}');
    write(`${app}/.env`);
    write(`${app}/node_modules/.package-lock.json`, '{}');
    for (const out of ['dist', 'dist-next']) {
      write(`${app}/${out}/index.html`);
      write(`${app}/${out}/robots.txt`);
      write(`${app}/${out}/assets/app.js`);
    }
  }
  write('aws-coding-courses/node_modules/.package-lock.json', '{}');
  for (const course of ['bash', 'python', 'javascript', 'typescript', 'tech-spanish']) {
    write(`aws-coding-courses/dist/${course}/index.html`);
    write(`aws-coding-courses/dist/${course}/robots.txt`);
  }
  write('home/dev/aws/tutorials-site/site/index.html');
  write('home/dev/aws/tutorials-site/site/python-training/index.html');
  return root;
}

function deploy(target, { fail = '' } = {}) {
  const root = makeRoot();
  const log = join(root, 'calls.log');
  const run = spawnSync('zsh', ['-f', join(root, 'deploy.sh'), target], {
    encoding: 'utf8',
    // Only these variables: no real AWS credentials or profile can reach the script.
    env: { PATH: join(root, 'bin') + delimiter + process.env.PATH, HOME: join(root, 'home'), FAKE_LOG: log, FAKE_AWS_FAIL: fail },
  });
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map((line) => line.split('\t')) : [];
  rmSync(root, { recursive: true, force: true });
  const aws = calls.filter((c) => c[0] === 'aws');
  const output = (run.stdout + run.stderr).replace(/\x1b\[[0-9;]*m/g, '');
  return {
    status: run.status,
    output,
    urls: output.match(/https:\/\/\S+/g) || [],
    buckets: [...new Set(aws.flatMap((c) => c.map((a) => /^s3:\/\/([^/]+)/.exec(a)?.[1]).filter(Boolean)))],
    uploads: aws.filter((c) => c[1] === 's3').length,
    invalidations: aws.filter((c) => c.includes('create-invalidation'))
      .map((c) => [c[c.indexOf('--distribution-id') + 1], c[c.indexOf('--paths') + 1]]),
  };
}

for (const { target, bucket, oldDist, newDist, url } of SITES) {
  test(`${target}: same bucket, both distributions invalidated, new-name address printed`, { skip }, () => {
    const r = deploy(target);
    assert.equal(r.status, 0, r.output);
    assert.deepEqual(r.buckets, [bucket]);
    assert.deepEqual(r.invalidations, [[oldDist, '/*'], [newDist, '/*']]);
    assert.deepEqual(r.urls, [url]);
  });
}

test('spanish: one distribution and the old-name address until its new-name site exists', { skip }, () => {
  const r = deploy('spanish');
  assert.equal(r.status, 0, r.output);
  assert.deepEqual(r.buckets, [SPANISH.bucket]);
  assert.deepEqual(r.invalidations, [[SPANISH.oldDist, '/*']]);
  assert.deepEqual(r.urls, [SPANISH.url]);
});

test('all: every site once, the javascript. redirect never, and a summary on the new name', { skip }, () => {
  const r = deploy('all');
  assert.equal(r.status, 0, r.output);
  assert.match(r.output, /Deployment Complete!/);
  assert.match(r.output, /All sites deployed successfully/);
  assert.doesNotMatch(r.output, /NOT deployed/);
  assert.deepEqual(r.buckets.sort(), [...SITES, SPANISH].map((s) => s.bucket).sort());
  const expected = [...SITES.flatMap((s) => [[s.oldDist, '/*'], [s.newDist, '/*']]), [SPANISH.oldDist, '/*']];
  const byId = (a, b) => a[0].localeCompare(b[0]);
  assert.deepEqual([...r.invalidations].sort(byId), expected.sort(byId));
  assert.ok(!r.invalidations.some(([id]) => id === JAVASCRIPT_REDIRECT_DIST));
  const summary = r.output.slice(r.output.indexOf('Deployment Complete!')).match(/https:\/\/\S+/g);
  assert.deepEqual(summary.sort(), [...SITES, SPANISH].map((s) => s.url).sort());
});

test('a failed new-name invalidation is reported and fails the deploy, after the upload', { skip }, () => {
  const { oldDist, newDist } = site('hub');
  const r = deploy('hub', { fail: newDist });
  assert.notEqual(r.status, 0);
  assert.match(r.output, new RegExp(`CloudFront invalidation failed for ${newDist}`));
  assert.doesNotMatch(r.output, /deployed!/);
  assert.ok(r.uploads > 0);
  assert.deepEqual(r.invalidations.map(([id]) => id), [oldDist, newDist]);
});

test('a failed old-name invalidation is reported the same way, and the new name is still cleared', { skip }, () => {
  const { oldDist, newDist } = site('bash');
  const r = deploy('bash', { fail: oldDist });
  assert.notEqual(r.status, 0);
  assert.match(r.output, new RegExp(`CloudFront invalidation failed for ${oldDist}`));
  assert.doesNotMatch(r.output, /deployed!/);
  assert.deepEqual(r.invalidations.map(([id]) => id), [oldDist, newDist]);
});

test('all: a failed invalidation counts as one failed deployment and the other sites still deploy', { skip }, () => {
  const r = deploy('all', { fail: site('cloud').newDist });
  assert.match(r.output, /1 deployment\(s\) failed/);
  assert.doesNotMatch(r.output, /All sites deployed successfully/);
  assert.equal(r.invalidations.length, SITES.length * 2 + 1);
});

// Regression: the summary listed every address under "Deployment Complete!" even when sites had failed
test('all: the summary marks a failed site as not deployed, and the run exits non-zero', { skip }, () => {
  const cloud = site('cloud');
  const r = deploy('all', { fail: cloud.newDist });
  assert.notEqual(r.status, 0);
  assert.doesNotMatch(r.output, /Deployment Complete!/);
  const summary = r.output.slice(r.output.indexOf('Deployment finished with failures')).split('\n').filter((l) => l.includes('https://'));
  assert.equal(summary.length, SITES.length + 1);
  for (const line of summary) {
    const failed = line.includes(`${cloud.url} `);
    assert.equal(/NOT deployed/.test(line), failed, line);
    assert.equal(line.includes('✓'), !failed, line);
  }
});

test('next: test builds go to the same buckets and clear /next/ on both distributions', { skip }, () => {
  const apps = ['hub', 'cloud', 'ai', 'saa', 'dva'].map(site);
  const r = deploy('next');
  assert.equal(r.status, 0, r.output);
  assert.match(r.output, /All 5 test versions deployed/);
  assert.deepEqual(r.buckets, apps.map((s) => s.bucket));
  assert.deepEqual(r.invalidations, apps.flatMap((s) => [[s.oldDist, '/next/*'], [s.newDist, '/next/*']]));
  assert.deepEqual(r.urls, apps.map((s) => `${s.url}/next/`));
});

test('next: a failed invalidation is counted, not printed as deployed', { skip }, () => {
  const r = deploy('next', { fail: site('ai').newDist });
  assert.notEqual(r.status, 0);
  assert.match(r.output, /1 failed/);
  assert.doesNotMatch(r.output, /All 5 test versions deployed/);
  assert.doesNotMatch(r.output, /✓ ai\.levelupstudyhub\.com\/next\//);
  assert.equal(r.invalidations.length, 10);
});
