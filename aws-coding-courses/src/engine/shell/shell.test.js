import { describe, it, expect } from 'vitest';
import { Shell } from './shell';
import { isIncomplete } from './parser';

const LOG = [
  '10.0.0.1 - - [29/Oct/2026:02:14:01 +0000] "GET / HTTP/1.1" 200 512',
  '10.0.0.2 - - [29/Oct/2026:02:14:05 +0000] "GET /login HTTP/1.1" 500 128',
  '10.0.0.1 - - [29/Oct/2026:02:15:11 +0000] "GET /api HTTP/1.1" 500 64',
  '10.0.0.3 - - [29/Oct/2026:02:15:40 +0000] "GET / HTTP/1.1" 200 512',
  '10.0.0.1 - - [29/Oct/2026:02:16:02 +0000] "GET /api HTTP/1.1" 502 64',
].join('\n') + '\n';

const sh = (scenario) => new Shell({ now: '2026-10-29T06:00:00Z', ...scenario });
const out = (shell, cmd) => shell.run(cmd).stdout;

describe('basics', () => {
  it('echo, variables and quoting', () => {
    const s = sh();
    expect(out(s, 'echo hello world')).toBe('hello world\n');
    expect(out(s, 'name="Study Hub"; echo "Hi $name"')).toBe('Hi Study Hub\n');
    expect(out(s, "echo 'no $expansion here'")).toBe('no $expansion here\n');
    expect(out(s, 'echo ${name}!')).toBe('Study Hub!\n');
    expect(out(s, 'echo ${#name}')).toBe('9\n');
    expect(out(s, 'echo ${missing:-default}')).toBe('default\n');
    expect(out(s, 'f=report.tar.gz; echo ${f%.tar.gz} ${f##*.}')).toBe('report gz\n');
    expect(out(s, 'echo -n a; echo b')).toBe('ab\n');
  });

  it('command substitution and arithmetic', () => {
    const s = sh();
    expect(out(s, 'echo "Today is $(date +%F)"')).toBe('Today is 2026-10-29\n');
    expect(out(s, 'count=3; count=$((count + 1)); echo $count')).toBe('4\n');
    expect(out(s, 'n=5; ((n++)); echo $n')).toBe('6\n');
    expect(out(s, 'echo $(( 7 / 2 )) $(( 2 ** 10 ))')).toBe('3 1024\n');
  });

  it('exit codes, && and ||', () => {
    const s = sh();
    expect(out(s, 'false; echo $?')).toBe('1\n');
    expect(out(s, 'true && echo yes || echo no')).toBe('yes\n');
    expect(out(s, 'false && echo yes || echo no')).toBe('no\n');
    expect(s.run('nosuchcmd').status).toBe(127);
  });

  it('files, redirects and pipes', () => {
    const s = sh();
    s.run('mkdir -p logs && echo one > logs/a.txt && echo two >> logs/a.txt');
    expect(out(s, 'cat logs/a.txt')).toBe('one\ntwo\n');
    expect(out(s, 'cat logs/a.txt | wc -l')).toBe('2\n');
    expect(out(s, 'ls logs')).toBe('a.txt\n');
    expect(s.run('cat nope 2>/dev/null').stderr).toBe('');
    expect(out(s, 'cd logs && pwd')).toBe('/home/learner/logs\n');
    expect(out(s, 'echo *.txt')).toBe('a.txt\n');
    expect(out(s, 'cd ~; echo logs/*')).toBe('logs/a.txt\n');
  });
});

describe('control flow', () => {
  it('if / elif / else with [ ] and [[ ]]', () => {
    const s = sh();
    const script = 'usage=91\nif [ "$usage" -ge 90 ]; then\n  echo CRITICAL\nelif [ "$usage" -ge 80 ]; then\n  echo WARNING\nelse\n  echo OK\nfi';
    expect(out(s, script)).toBe('CRITICAL\n');
    expect(out(s, 'f=app.log; [[ $f == *.log ]] && echo log file')).toBe('log file\n');
    expect(out(s, '[ -d /tmp ] && echo dir')).toBe('dir\n');
    expect(out(s, 'x=; [ -z "$x" ] && echo empty')).toBe('empty\n');
  });

  it('for and while loops, functions, read', () => {
    const s = sh();
    expect(out(s, 'for site in cloud ai; do echo "$site.example.com"; done')).toBe('cloud.example.com\nai.example.com\n');
    expect(out(s, 'i=1; while [ $i -le 3 ]; do echo $i; i=$((i+1)); done')).toBe('1\n2\n3\n');
    expect(out(s, 'greet() { local who=$1; echo "hello $who"; }; greet Nico')).toBe('hello Nico\n');
    expect(out(s, 'printf "a b\\nc d\\n" | while read first second; do echo "$second-$first"; done')).toBe('b-a\nd-c\n');
    expect(out(s, 'for n in 1 2 3 4; do [ $n -eq 3 ] && break; echo $n; done')).toBe('1\n2\n');
  });

  it('scripts with arguments, chmod and set -e', () => {
    const s = sh({ files: { 'hello.sh': '#!/bin/bash\necho "Hello, $1 ($# args)"\n' } });
    expect(out(s, 'bash hello.sh Nico')).toBe('Hello, Nico (1 args)\n');
    expect(s.run('./hello.sh').stderr).toContain('Permission denied');
    s.run('chmod +x hello.sh');
    expect(out(s, './hello.sh you')).toBe('Hello, you (1 args)\n');
    s.fs.write('/home/learner/strict.sh', 'set -e\necho start\nfalse\necho never\n');
    const r = s.run('bash strict.sh');
    expect(r.stdout).toBe('start\n');
    expect(r.status).toBe(1);
    s.fs.write('/home/learner/exit.sh', 'echo bye\nexit 3\n');
    expect(s.run('bash exit.sh; echo "code $?"').stdout).toBe('bye\ncode 3\n');
  });

  it('knows when a line is unfinished', () => {
    expect(isIncomplete('if true; then')).toBe(true);
    expect(isIncomplete('for x in a b; do')).toBe(true);
    expect(isIncomplete('echo "open')).toBe(true);
    expect(isIncomplete('echo done')).toBe(false);
  });
});

describe('text tools for log digging', () => {
  const s = sh({ files: { 'access.log': LOG } });

  it('grep', () => {
    expect(out(s, 'grep -c " 500 " access.log')).toBe('2\n');
    expect(out(s, 'grep -E "\\" 5[0-9]{2} " access.log | wc -l')).toBe('3\n');
    expect(out(s, 'grep -v " 200 " access.log | head -n 1')).toContain('/login');
    expect(s.run('grep -q teapot access.log').status).toBe(1);
  });

  it('awk, sort and uniq -c', () => {
    expect(out(s, "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -n 1")).toBe('      3 10.0.0.1\n');
    expect(out(s, "awk '$9 >= 500 {print $7}' access.log")).toBe('/login\n/api\n/api\n');
    expect(out(s, "awk '{ bytes += $10 } END { print bytes }' access.log")).toBe('1280\n');
    expect(out(s, "awk '{ hits[$9]++ } END { for (code in hits) print code, hits[code] }' access.log | sort")).toBe('200 2\n500 2\n502 1\n');
    expect(out(s, "awk -F: '{print $2\":\"$3}' access.log | sort | uniq | head -n 1")).toBe('02:14\n');
    expect(out(s, 'awk \'NR==2 {printf "%s has %d fields\\n", $1, NF}\' access.log')).toBe('10.0.0.2 has 10 fields\n');
  });

  it('cut, tr, sed, head, tail', () => {
    expect(out(s, 'head -n 1 access.log | cut -d" " -f1')).toBe('10.0.0.1\n');
    expect(out(s, 'echo "85%" | tr -d "%"')).toBe('85\n');
    expect(out(s, 'echo hello | tr a-z A-Z')).toBe('HELLO\n');
    expect(out(s, "echo 'GET /api' | sed 's/GET/POST/'")).toBe('POST /api\n');
    expect(out(s, 'tail -n 1 access.log | grep -o "[0-9]*$"')).toBe('64\n');
    expect(out(s, 'seq 10 | tail -n +8')).toBe('8\n9\n10\n');
  });
});

describe('system and web', () => {
  it('df and the disk usage pipeline', () => {
    const s = sh({ disk: [{ fs: '/dev/xvda1', size: 20, used: 17, mount: '/' }] });
    expect(out(s, 'df -h /')).toContain('85% /');
    expect(out(s, "df -h / | awk 'NR==2 {print $5}' | tr -d '%'")).toBe('85\n');
  });

  it('curl status codes and failures', () => {
    const s = sh({ web: { 'https://example.com': { status: 200, body: '<title>Hi</title>' }, 'https://down.example.com': { status: 503 }, 'https://slow.example.com': { ms: 9000 } } });
    expect(out(s, 'curl -s -o /dev/null -w "%{http_code}" https://example.com')).toBe('200');
    expect(out(s, 'curl -s https://example.com | grep -c "<title>"')).toBe('1\n');
    expect(s.run('curl -sf https://down.example.com').status).toBe(22);
    expect(s.run('curl -s --max-time 5 https://slow.example.com').status).toBe(28);
    expect(s.run('curl -s https://nowhere.example').status).toBe(6);
  });

  it('tar and find', () => {
    const s = sh({ files: { 'projects/site/index.html': '<h1>hi</h1>', 'projects/notes.txt': 'notes' } });
    s.run('tar -czf backup.tar.gz projects');
    expect(out(s, 'tar -tzf backup.tar.gz')).toContain('projects/site/index.html');
    expect(out(s, 'find projects -name "*.html"')).toBe('projects/site/index.html\n');
    expect(out(s, 'find projects -type f | wc -l')).toBe('2\n');
  });

  it('crontab', () => {
    const s = sh();
    s.fs.write('/home/learner/jobs', '0 2 * * * /home/learner/backup.sh\n');
    expect(s.run('crontab jobs').status).toBe(0);
    expect(out(s, 'crontab -l')).toBe('0 2 * * * /home/learner/backup.sh\n');
    s.fs.write('/home/learner/bad', 'every night run it\n');
    expect(s.run('crontab bad').status).toBe(1);
  });
});

describe('pretend AWS', () => {
  it('s3 cp, ls, rm and sync', () => {
    const s = sh({ files: { 'site/index.html': 'v1', 'site/app.js': 'js', 'backup.tar.gz': 'zip' }, aws: { buckets: { 'study-backups': {}, 'my-site': { 'old.html': 'x' } } } });
    expect(out(s, 'aws s3 cp backup.tar.gz s3://study-backups/backups/')).toBe('upload: ./backup.tar.gz to s3://study-backups/backups/backup.tar.gz\n');
    expect(out(s, 'aws s3 ls s3://study-backups/backups/')).toMatch(/backup\.tar\.gz\n$/);
    expect(out(s, 'aws s3 ls s3://study-backups/')).toContain('PRE backups/');
    s.run('aws s3 sync site/ s3://my-site --delete');
    expect(s.aws.keys('my-site')).toEqual(['app.js', 'index.html']);
    expect(out(s, 'aws s3 rm s3://study-backups/backups/backup.tar.gz')).toBe('delete: s3://study-backups/backups/backup.tar.gz\n');
    expect(s.run('aws s3 ls s3://nope').status).toBe(1);
  });

  it('cloudfront and secrets manager', () => {
    const s = sh({ aws: { distributions: { E123: {} }, secrets: { 'deploy/config': '{"bucket":"my-site","distribution":"E123"}' } } });
    expect(out(s, 'aws cloudfront create-invalidation --distribution-id E123 --paths "/*" --query Invalidation.Status --output text')).toBe('InProgress\n');
    expect(s.aws.distributions.E123.invalidations).toHaveLength(1);
    expect(out(s, 'aws secretsmanager get-secret-value --secret-id deploy/config --query SecretString --output text | jq -r .bucket')).toBe('my-site\n');
    expect(s.run('aws secretsmanager get-secret-value --secret-id missing').status).toBe(254);
  });

  it('keep only the newest 7 backups', () => {
    const objects = {};
    for (let d = 1; d <= 10; d++) objects[`backups/projects-2026-10-${String(d).padStart(2, '0')}.tar.gz`] = { body: 'x', mtime: Date.UTC(2026, 9, d) };
    const s = sh({ aws: { buckets: { 'study-backups': objects } } });
    s.run("aws s3 ls s3://study-backups/backups/ | awk '{print $4}' | sort -r | tail -n +8 | while read old; do aws s3 rm \"s3://study-backups/backups/$old\"; done");
    expect(s.aws.keys('study-backups')).toHaveLength(7);
    expect(s.aws.keys('study-backups')[0]).toBe('backups/projects-2026-10-04.tar.gz');
  });
});
