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

describe('scripts that call scripts', () => {
  // A deploy script, and a pretend aws that a test puts in front of the real one
  const DEPLOY = '#!/bin/bash\nset -euo pipefail\naws s3 sync site/ s3://my-site/ --delete\naws cloudfront create-invalidation --distribution-id E123 --paths "/*" > /dev/null\necho deployed\n';
  const FAKE_AWS = '#!/bin/bash\necho "aws $*" >> "$FAKE_AWS_LOG"\nif [ "${1:-}" = "${FAKE_AWS_FAIL:-none}" ]; then exit 1; fi\nexit 0\n';
  const files = { 'deploy.sh': { content: DEPLOY, mode: 0o755 }, 'test/bin/aws': { content: FAKE_AWS, mode: 0o755 }, 'site/index.html': 'v2' };
  const account = { buckets: { 'my-site': { 'index.html': 'v1' } }, distributions: { E123: {} } };

  it('finds a command in the folders of PATH, first match first', () => {
    const s = sh({ files, aws: account });
    expect(out(s, 'command -v aws')).toBe('/usr/bin/aws\n');
    expect(out(s, 'PATH="$PWD/test/bin:$PATH" command -v aws')).toBe('/home/learner/test/bin/aws\n');
    expect(out(s, 'command -v aws')).toBe('/usr/bin/aws\n'); // the change lasted for one command
    expect(out(s, 'PATH="$PWD/test/bin:$PATH"; type aws; which aws')).toBe('aws is /home/learner/test/bin/aws\n/home/learner/test/bin/aws\n');
    expect(out(s, 'type echo; command -v cd')).toBe('echo is a shell builtin\ncd\n'); // builtins never come from PATH
  });

  it('runs a script against a pretend aws that logs its calls', () => {
    const s = sh({ files, aws: account });
    const r = s.run('PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$PWD/calls.log" ./deploy.sh');
    expect(r.stdout).toBe('deployed\n');
    expect(s.fs.read('/home/learner/calls.log')).toBe('aws s3 sync site/ s3://my-site/ --delete\naws cloudfront create-invalidation --distribution-id E123 --paths /*\n');
    // The practice account was never reached
    expect(s.aws.calls).toEqual([]);
    expect(s.aws.objects('my-site')['index.html'].body).toBe('v1');
    // Without the folder in front, the same script uses the practice account
    s.run('./deploy.sh');
    expect(s.aws.objects('my-site')['index.html'].body).toBe('v2');
  });

  it('lets a test make the pretend aws fail', () => {
    const s = sh({ files, aws: account });
    const r = s.run('FAKE_AWS_FAIL=cloudfront PATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$PWD/calls.log" ./deploy.sh; echo "code $?"');
    expect(r.stdout).toBe('code 1\n');
    expect(s.fs.read('/home/learner/calls.log')).toContain('aws cloudfront create-invalidation');
    expect(out(s, 'echo "[${FAKE_AWS_FAIL:-unset}]"')).toBe('[unset]\n');
  });

  it('needs the file to be runnable, and the system folders to be on PATH', () => {
    const s = sh({ files: { ...files, 'test/bin/aws': FAKE_AWS } });
    expect(out(s, 'PATH="$PWD/test/bin:$PATH" command -v aws')).toBe('/usr/bin/aws\n');
    const r = s.run('PATH="$PWD/test/bin"; ls');
    expect(r.stderr).toBe('bash: ls: command not found\n');
    expect(r.status).toBe(127);
  });

  it('keeps what a function or read assigns when a variable is set in front of it', () => {
    const s = sh();
    expect(out(s, 'run() { code=7; }; MODE=test run; echo "$code [${MODE:-unset}]"')).toBe('7 [unset]\n');
    expect(out(s, 'echo "a:b" > pair.txt; IFS=: read -r left right < pair.txt; echo "$right $left"')).toBe('b a\n');
  });
});

describe('functions under set -e', () => {
  it('ignores set -e inside a function called before || or as an if test', () => {
    const s = sh({ files: {
      'plain.sh': 'set -e\nbuild() { false; echo "carried on"; }\nbuild\necho end\n',
      'or.sh': 'set -e\nbuild() { false; echo "carried on"; }\nbuild || echo "build failed"\necho end\n',
      'if.sh': 'set -e\nbuild() { false; echo "carried on"; }\nif build; then echo ok; fi\n',
      'return.sh': 'set -e\nbuild() { false || return 1; echo "carried on"; }\nbuild || echo "build failed"\necho end\n',
    } });
    expect(s.run('bash plain.sh; echo "code $?"').stdout).toBe('code 1\n');
    expect(out(s, 'bash or.sh')).toBe('carried on\nend\n');
    expect(out(s, 'bash if.sh')).toBe('carried on\nok\n');
    expect(out(s, 'bash return.sh')).toBe('build failed\nend\n');
  });

  it('((failed++)) from 0 ends a script under set -e; failed=$((failed + 1)) does not', () => {
    const s = sh({ files: {
      'bad.sh': 'set -e\nfailed=0\nfalse || ((failed++))\necho "failed: $failed"\n',
      'good.sh': 'set -e\nfailed=0\nfalse || failed=$((failed + 1))\necho "failed: $failed"\n',
    } });
    const bad = s.run('bash bad.sh');
    expect(bad.stdout).toBe('');
    expect(bad.status).toBe(1);
    expect(out(s, 'bash good.sh')).toBe('failed: 1\n');
  });
});

describe('more Bash', () => {
  it("$'...' strings: a line break inside a command", () => {
    const s = sh();
    expect(out(s, `summary=""; summary="\${summary}✓ shop"$'\\n'; summary="\${summary}✗ blog"$'\\n'; printf '%s' "$summary"`)).toBe('✓ shop\n✗ blog\n');
    expect(out(s, `echo $'a\\tb' $'it\\'s' "$'kept'"`)).toBe("a\tb it's $'kept'\n");
    expect(isIncomplete("echo $'open")).toBe(true);
  });

  it('indexed arrays', () => {
    const s = sh({ files: { 'a.txt': '', 'b.txt': '' } });
    expect(out(s, 'sites=(shop blog docs); echo "${#sites[@]}: ${sites[0]} ${sites[-1]}"')).toBe('3: shop docs\n');
    expect(out(s, 'lines=(); lines+=("✓ shop"); lines+=("✗ the blog"); printf "%s\\n" "${lines[@]}"')).toBe('✓ shop\n✗ the blog\n');
    expect(out(s, 'for l in "${lines[@]}"; do echo "<$l>"; done')).toBe('<✓ shop>\n<✗ the blog>\n');
    expect(out(s, 'files=(*.txt); echo "${files[*]}"; n=1; files[n]=c.txt; echo "${files[1]} ${!files[@]}"')).toBe('a.txt b.txt\nc.txt 0 1\n');
    expect(out(s, 'f() { local mine=(); mine+=("a b"); echo "${#mine[@]}"; }; f; echo "[${#mine[@]}]"')).toBe('1\n[0]\n');
    expect(out(s, 'g() { local two=("a b" c) note="(draft)"; echo "${#two[@]} ${two[0]} $note"; }; g')).toBe('2 a b (draft)\n');
    // An empty list is no word at all, also for "$@"
    expect(out(s, 'none=(); for x in "${none[@]}"; do echo never; done; set --; for x in "$@"; do echo never; done; echo "$#"')).toBe('0\n');
    expect(out(s, 'for x in "" "a"; do echo "<$x>"; done')).toBe('<>\n<a>\n');
    expect(isIncomplete('sites=(shop blog')).toBe(true);
  });

  it('case ... esac', () => {
    const s = sh();
    const pick = 'pick() { case "$1" in all) echo every ;; shop|blog) echo "one: $1" ;; *.txt) echo text ;; *) echo "unknown: $1"; return 2 ;; esac; }';
    s.run(pick);
    expect(out(s, 'pick all; pick blog; pick notes/a.txt')).toBe('every\none: blog\ntext\n');
    expect(s.run('pick zzz').status).toBe(2);
    expect(out(s, 'case "$HOME" in\n  /home/*)\n    echo home\n    ;;\n  (*) echo other ;;\nesac')).toBe('home\n');
    expect(s.run('case x in y) echo no ;; esac').status).toBe(0);
    expect(isIncomplete('case "$1" in')).toBe(true);
    expect(isIncomplete('case "$1" in all) echo a ;; esac')).toBe(false);
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

// Everything below was compared with real Bash 5.2, line for line.
describe('exported variables', () => {
  const CHILD = '#!/bin/bash\necho "A=${A:-unset} B=${B:-unset} C=${C:-unset}"\n';
  const files = { 'child.sh': { content: CHILD, mode: 0o755 } };

  it('hands a program only the variables that were exported', () => {
    const s = sh({ files });
    expect(out(s, 'A=1; export B=2; C=3 ./child.sh')).toBe('A=unset B=2 C=3\n');
    expect(out(s, './child.sh')).toBe('A=unset B=2 C=unset\n');
    expect(out(s, 'export A; ./child.sh')).toBe('A=1 B=2 C=unset\n');
    expect(out(s, 'bash child.sh; bash -c \'echo "${A:-unset} ${C:-unset}"\'')).toBe('A=1 B=2 C=unset\n1 unset\n');
  });

  it('export -n, unset and declare -x', () => {
    const s = sh({ files });
    expect(out(s, 'export A=1; export -n A; ./child.sh; echo "$A"')).toBe('A=unset B=unset C=unset\n1\n');
    expect(out(s, 'export B=2; unset B; B=again; ./child.sh')).toBe('A=unset B=unset C=unset\n');
    expect(out(s, 'declare -x C=3; ./child.sh')).toBe('A=unset B=unset C=3\n');
  });

  it('reaches a program two levels down, and a function called with a variable in front', () => {
    const s = sh({ files: { ...files, 'middle.sh': { content: '#!/bin/bash\n./child.sh\n', mode: 0o755 } } });
    expect(out(s, 'A=plain; ./middle.sh; export A; ./middle.sh')).toBe('A=unset B=unset C=unset\nA=plain B=unset C=unset\n');
    // B=2 in front of a function: the programs it starts see B, and B is gone afterwards
    expect(out(s, 'run() { ./middle.sh; }; B=2 run; ./middle.sh')).toBe('A=plain B=2 C=unset\nA=plain B=unset C=unset\n');
  });

  it('keeps plain variables in ( ), $( ) and pipes, which are copies of this shell', () => {
    const s = sh();
    expect(out(s, 'V=plain; ( echo "sub $V" ); echo "subst $(echo $V)"; echo x | while read _; do echo "pipe $V"; done')).toBe('sub plain\nsubst plain\npipe plain\n');
  });

  it('env and printenv list what a program would receive', () => {
    const s = sh();
    expect(out(s, 'ZZ_PLAIN=1; export ZZ_EXP=2; env | grep "^ZZ_"')).toBe('ZZ_EXP=2\n');
    expect(s.run('printenv ZZ_PLAIN').status).toBe(1);
    expect(out(s, 'printenv ZZ_EXP')).toBe('2\n');
  });

  it('a program does not inherit set -e, functions or arrays', () => {
    const s = sh({ files: { 'child.sh': { content: '#!/bin/bash\nfalse\necho "survived: $(type -t helper || echo no helper), ${#list[@]} items"\n', mode: 0o755 } } });
    expect(out(s, 'set -e; helper() { :; }; list=(a b); ./child.sh')).toBe('survived: no helper, 0 items\n');
    const t = sh();
    expect(out(t, 'set -e; V=plain; bash -c \'false; echo "survived [${V:-unset}]"\'')).toBe('survived [unset]\n');
  });
});

describe('set -e and compound commands', () => {
  const run = (script) => { const r = sh().run(script); return `${r.stdout}[${r.status}]`; };

  it('carries on after a loop, if, case or { } whose last command was an ignored failure', () => {
    expect(run('set -e\nfor x in a b; do [ "$x" = a ] && echo "is a"; done\necho "reached $?"')).toBe('is a\nreached 1\n[0]');
    expect(run('set -e\ni=0\nwhile [ $i -lt 2 ]; do i=$((i+1)); [ $i -eq 5 ] && echo five; done\necho "reached $?"')).toBe('reached 1\n[0]');
    expect(run('set -e\nif true; then [ 1 -eq 2 ] && echo x; fi\necho "reached $?"')).toBe('reached 1\n[0]');
    expect(run('set -e\n{ [ 1 -eq 2 ] && echo x; }\necho "reached $?"')).toBe('reached 1\n[0]');
    expect(run('set -e\ncase x in x) [ 1 -eq 2 ] && echo x ;; esac\necho "reached $?"')).toBe('reached 1\n[0]');
  });

  it('still stops for a plain failure inside them, for ( ) and for a function that ends that way', () => {
    expect(run('set -e\nfor x in a b; do echo $x; false; done\necho "not reached"')).toBe('a\n[1]');
    expect(run('set -e\nif true; then false; fi\necho "not reached"')).toBe('[1]');
    expect(run('set -e\n( [ 1 -eq 2 ] && echo x )\necho "not reached"')).toBe('[1]');
    expect(run('set -e\nf() { for x in a b; do [ "$x" = a ] && echo "is a"; done; }\nf\necho "not reached"')).toBe('is a\n[1]');
  });

  it('counts the ways to add one', () => {
    expect(run('set -e\nn=0\n((++n)); ((n += 1)); : $((n++)); ((n++)) || true; n=$((n + 1)); let "n += 1"; echo $n')).toBe('6\n[0]');
    expect(run('set -e\nn=0\n((n++))\necho "not reached"')).toBe('[1]');
    expect(run('set -e\nn=0\nlet n++\necho "not reached"')).toBe('[1]');
  });
});

describe('more Bash, second pass', () => {
  it('[[ ]] right before ; && || and )', () => {
    const s = sh();
    expect(out(s, 'if [[ -f nofile ]]; then echo y; else echo n; fi')).toBe('n\n');
    expect(out(s, 'set -- a b; while [[ $# -gt 0 ]]; do echo "$1"; shift; done')).toBe('a\nb\n');
    expect(out(s, 'x=abc; if [[ -n $x && $x != b* ]]; then echo and; fi; [[ $x == a* ]]&& echo tight; ( [[ a == a ]] ) && echo sub')).toBe('and\ntight\nsub\n');
    expect(isIncomplete('if [[ -f x ]]; then')).toBe(true);
  });

  it('let', () => {
    const s = sh();
    expect(out(s, 'n=0; let "n += 1"; echo "$? $n"; let n++; echo "$? $n"; z=0; let z++; echo "$? $z"')).toBe('0 1\n0 2\n1 1\n');
    expect(out(s, 'let "a = 3 * 4" "b = a + 1"; echo "$a $b"')).toBe('12 13\n');
    expect(s.run('let').status).toBe(1);
  });

  it('here-strings', () => {
    const s = sh();
    expect(out(s, 'line="shop shop-site-prod E1 E2"; read -r name bucket ids <<< "$line"; echo "$name $bucket [$ids]"')).toBe('shop shop-site-prod [E1 E2]\n');
    expect(out(s, 'while read -r w; do echo "w=$w"; done <<< "x"; grep -c o <<< "foo"')).toBe('w=x\n1\n');
  });

  it('says that here-documents are missing, instead of pointing at a stray <', () => {
    const r = sh().run('cat << EOF\nhello\nEOF');
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('here-documents (<< EOF) are not part of this practice shell');
  });

  it('a variable in front of a builtin lasts for that command only', () => {
    const s = sh();
    expect(out(s, 'IFS=, read -r a b <<< "1,2"; echo "$a-$b"; set -- x y; echo "$*"')).toBe('1-2\nx y\n');
  });

  it('"$*" and "${list[*]}" join with the first character of IFS', () => {
    const s = sh();
    expect(out(s, 'set -- a b c; list=(1 2 3); IFS=,; echo "$*" "${list[*]}"; unset IFS; echo "$*"')).toBe('a,b,c 1,2,3\na b c\n');
  });

  it('array defaults and slices', () => {
    const s = sh();
    expect(out(s, 'set -u; a=(); echo "[${a[@]:-none}] [${a[0]:-none}]"')).toBe('[none] [none]\n');
    expect(out(s, 'a=(x y z); echo "[${a[@]:-none}] [${a[@]:1}] [${a[@]:1:1}] [${a[@]:+some}] [${a[5]:-five}] [${a[1]:-def}]"')).toBe('[x y z] [y z] [y] [some] [five] [y]\n');
    expect(out(s, 'a=(x y z); for i in "${a[@]:1}"; do echo "i=$i"; done')).toBe('i=y\ni=z\n');
  });

  it("$'...' with octal, hex and unicode escapes", () => {
    const s = sh();
    expect(out(s, "RED=$'\\033[0;31m'; NC=$'\\e[0m'; printf '%s' \"${RED}x${NC}\"")).toBe('\u001b[0;31mx\u001b[0m');
    expect(out(s, "echo $'\\x41\\101\\u00e9'")).toBe('AAé\n');
  });

  it('type -t', () => {
    const s = sh();
    expect(out(s, 'f() { :; }; type -t f; type -t echo; type -t grep')).toBe('function\nbuiltin\nfile\n');
    expect(s.run('type -t nothing-here').status).toBe(1);
  });
});

describe('commands found through PATH: the edges', () => {
  const tool = (text) => ({ content: `#!/bin/bash\necho "${text}"\n`, mode: 0o755 });

  it('skips a file that is not runnable, and a folder with the name', () => {
    const s = sh({ files: { 'bin/cat': '#!/bin/bash\necho fake\n', 'bin2/cat/keep': 'x', 'f.txt': 'real\n' } });
    expect(out(s, 'PATH="$PWD/bin:$PWD/bin2:$PATH" cat f.txt')).toBe('real\n');
  });

  it('a folder later in the list loses, a relative folder works', () => {
    const s = sh({ files: { 'bin/cat': tool('fake cat'), 'f.txt': 'real\n' } });
    expect(out(s, 'PATH="$PATH:$PWD/bin" cat f.txt')).toBe('real\n');
    expect(out(s, 'PATH="bin:$PATH" cat f.txt')).toBe('fake cat\n');
    expect(out(s, 'cd /tmp; PATH="bin:$PATH" cat /home/learner/f.txt')).toBe('real\n');
  });

  it('a function wins over a file, and a builtin can not be replaced', () => {
    const s = sh({ files: { 'bin/tool': tool('file'), 'bin/echo': { content: '#!/bin/bash\nprintf "FAKE\\n"\n', mode: 0o755 } } });
    expect(out(s, 'PATH="$PWD/bin:$PATH"; tool() { echo function; }; tool; unset -f tool; tool; echo real')).toBe('function\nfile\nreal\n');
  });

  it('passes the arguments and the exit code, also to the script that called it', () => {
    const s = sh({ files: { 'bin/date': { content: '#!/bin/bash\necho "fake date $*"\nexit 3\n', mode: 0o755 }, 'run.sh': { content: '#!/bin/bash\ndate +%F\necho "code $?"\n', mode: 0o755 } } });
    expect(out(s, 'PATH="$PWD/bin:$PATH" ./run.sh')).toBe('fake date +%F\ncode 3\n');
    expect(out(s, './run.sh')).toMatch(/^\d{4}-\d\d-\d\d\ncode 0\n$/);
  });

  it('with an empty PATH only builtins are left', () => {
    const s = sh();
    const r = s.run('PATH=""; echo builtin; ls; echo "code $?"; command -v grep; echo "code $?"');
    expect(r.stdout).toBe('builtin\ncode 127\ncode 1\n');
  });
});

describe('pretend AWS: failing the way the real command line does', () => {
  const account = { buckets: { 'my-site': { 'index.html': 'v1' } }, distributions: { E123: {} } };

  it('a wrong distribution ID is an error from the service: 254', () => {
    const s = sh({ aws: account });
    const r = s.run('aws cloudfront create-invalidation --distribution-id E12 --paths "/*"');
    expect(r.status).toBe(254);
    expect(r.stderr).toContain('An error occurred (NoSuchDistribution) when calling the CreateInvalidation operation');
    expect(r.stdout).toBe('');
  });

  it('a missing parameter is refused before AWS is asked: 252', () => {
    const s = sh({ aws: account });
    const noId = s.run('aws cloudfront create-invalidation --paths "/*"');
    expect(noId.status).toBe(252);
    expect(noId.stderr).toContain('the following arguments are required: --distribution-id');
    const noPaths = s.run('aws cloudfront create-invalidation --distribution-id E123');
    expect(noPaths.status).toBe(252);
    expect(noPaths.stderr).toContain('Missing required parameter in input: "InvalidationBatch"');
    expect(s.run('aws cloudfront get-invalidation --distribution-id E123').status).toBe(252);
    expect(s.run('aws').status).toBe(252);
    expect(s.aws.distributions.E123.invalidations).toHaveLength(0);
  });

  it('a local file that is not there: 255, and nothing is uploaded', () => {
    const s = sh({ aws: account });
    const r = s.run('aws s3 cp site/index.html s3://my-site/index.html');
    expect(r.status).toBe(255);
    expect(r.stderr).toContain('The user-provided path site/index.html does not exist.');
    expect(s.aws.objects('my-site')['index.html'].body).toBe('v1');
    expect(s.run('aws s3 sync nowhere/ s3://my-site/').status).toBe(255);
  });

  it('a bucket that does not exist stops sync and cp', () => {
    const s = sh({ files: { 'site/index.html': 'v2' }, aws: account });
    const r = s.run('aws s3 sync site/ s3://no-such-bucket/ --delete');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('(NoSuchBucket)');
    expect(s.run('aws s3 cp site/index.html s3://no-such-bucket/index.html').status).toBe(1);
  });

  it('several invalidation paths, and /* left without quotes', () => {
    const s = sh({ aws: account });
    s.run('aws cloudfront create-invalidation --distribution-id E123 --paths /index.html /prices.html > /dev/null');
    expect(s.aws.distributions.E123.invalidations[0].InvalidationBatch.Paths.Items).toEqual(['/index.html', '/prices.html']);
    // Without quotes the shell replaces /* with the top folders of the disk: not the path that was meant
    s.run('aws cloudfront create-invalidation --distribution-id E123 --paths /* > /dev/null');
    expect(s.aws.distributions.E123.invalidations[1].InvalidationBatch.Paths.Items).not.toContain('/*');
  });
});
