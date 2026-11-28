// Tutorial 5's checks, tried the way learners will try them: for each practice
// step, wrong answers that must not pass (the starter, doing nothing, typing
// the expected output in by hand, the classic mistakes) and right answers
// written in other styles than the one shown, which must pass.
// Each case: [step id, what it is, the verdict expected, the file's text, options].
import { describe, it, expect } from 'vitest';
import { Shell } from '../../../engine/shell/shell';
import tutorial, * as T from './05-deploy-many-sites';

const step = (id) => tutorial.steps.find((s) => s.id === id);
const swap = (script, from, to) => {
  if (!script.includes(from)) throw new Error(`"${from}" is not in the script`);
  return script.split(from).join(to);
};

// One attempt, as the page makes it: the file goes into a fresh practice
// server, the Run button's command runs, and the step's check gives its verdict
const attempt = (id, text, { command } = {}) => {
  const s = step(id);
  const shell = new Shell(s.scenario());
  const [file] = s.files;
  if (text !== null) {
    shell.fs.write(file.path, text);
    shell.fs.node(file.path).mode = 0o755;
  }
  const result = shell.run(command || file.runCommand);
  const verdict = s.check({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history });
  return verdict === true ? 'PASS' : verdict === null ? 'NULL' : `FAIL: ${verdict}`;
};

const loopCarryTrap = () => {
  const L = T.LOOP_SOLUTION; const loopOf = (body) => swap(L, 'for site in "$@"; do\n  deploy_site "$site"\ndone\n', body);
  const C = T.CARRY_ON_SOLUTION; const carry = (body) => swap(C, 'for site in "$@"; do\n  deploy_site "$site" || echo "✗ $site failed, carrying on" >&2\ndone\n', body);
  const TR = T.TRAP_SOLUTION;
  const plainFn = (script, newFn) => {
    const a = script.indexOf('\n# deploy_site <site>'); const b = script.indexOf('\n}\n', a) + 3;
    return script.slice(0, a) + newFn + script.slice(b);
  };
  return [
    // ---------------- loop
    ['loop', 'solution', 'PASS', L],
    ['loop', 'starter', 'FAIL', T.LOOP_STARTER],
    ['loop', 'do nothing (ls)', 'NULL', null, { command: 'ls' }],
        ['loop', 'hard-coded three calls', 'FAIL', loopOf('deploy_site shop\ndeploy_site blog\ndeploy_site docs\n')],
    ['loop', 'prints the lines only', 'FAIL', loopOf('echo "✓ shop is live"\necho "✓ blog is live"\necho "✓ docs is live"\n')],
    ['loop', 'mistake: "$*"', 'FAIL', loopOf('for site in "$*"; do\n  deploy_site "$site"\ndone\n')],
    ['loop', 'mistake: kept deploy_site shop line too', 'FAIL', loopOf('deploy_site shop\nfor site in "$@"; do\n  deploy_site "$site"\ndone\n')],
    ['loop', 'mistake: for site in $1', 'FAIL', loopOf('for site in "$1"; do\n  deploy_site "$site"\ndone\n')],
    ['loop', 'mistake: missing done (syntax)', 'FAIL', loopOf('for site in "$@"; do\n  deploy_site "$site"\n')],
    ['loop', 'mistake: deploy_site $@', 'FAIL', loopOf('deploy_site "$@"\n')],
    ['loop', 'style: while/shift', 'PASS', loopOf('while [ "$#" -gt 0 ]; do\n  deploy_site "$1"\n  shift\ndone\n')],
    ['loop', 'style: for site; do', 'PASS', loopOf('for site; do deploy_site "$site"; done\n')],
    ['loop', 'style: unquoted $@ one line', 'PASS', loopOf('for s in $@; do deploy_site $s; done\n')],
    ['loop', 'style: braces and do on its own line', 'PASS', loopOf('for name in "${@}"\ndo\n    deploy_site "${name}"\ndone\n')],
    // ---------------- carry-on
    ['carry-on', 'solution', 'PASS', C],
    ['carry-on', 'starter', 'FAIL', L],
    ['carry-on', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['carry-on', 'mistake: removed set -e', 'FAIL', swap(L, 'set -euo pipefail', 'set -uo pipefail')],
    ['carry-on', 'mistake: removed set line', 'FAIL', swap(L, 'set -euo pipefail\n', '')],
    ['carry-on', 'mistake: commented set', 'FAIL', swap(L, 'set -euo pipefail', '# set -euo pipefail')],
    ['carry-on', 'fake: || true (no message)', 'FAIL', carry('for site in "$@"; do\n  deploy_site "$site" || true\ndone\n')],
    ['carry-on', 'fake: set +e around loop', 'FAIL', carry('set +e\nfor site in "$@"; do\n  deploy_site "$site"\ndone\nset -e\n')],
    ['carry-on', 'fake: skip blog by name', 'FAIL', carry('for site in "$@"; do\n  if [ "$site" = blog ]; then echo "✗ blog failed, carrying on" >&2; continue; fi\n  deploy_site "$site"\ndone\n')],
    ['carry-on', 'mistake: message to stdout', 'FAIL', carry('for site in "$@"; do\n  deploy_site "$site" || echo "✗ $site failed, carrying on"\ndone\n')],
    ['carry-on', 'mistake: && instead of ||', 'FAIL', carry('for site in "$@"; do\n  deploy_site "$site" && echo "✗ $site failed, carrying on" >&2\ndone\n')],
    ['carry-on', 'style: if ! then', 'PASS', carry('for site in "$@"; do\n  if ! deploy_site "$site"; then\n    echo "✗ $site failed, carrying on" >&2\n  fi\ndone\n')],
    ['carry-on', 'style: || { ...; }', 'PASS', carry('for site in "$@"; do\n  deploy_site "$site" || { echo "✗ $site failed, carrying on" 1>&2; }\ndone\n')],
    ['carry-on', 'style: || with printf and continue', 'PASS', carry('for site in "$@"; do\n  deploy_site "$site" || { printf \'✗ %s failed, carrying on\\n\' "$site" >&2; continue; }\ndone\n')],
    // ---------------- the-trap
    ['the-trap', 'solution', 'PASS', TR],
    ['the-trap', 'starter', 'FAIL', C],
    ['the-trap', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['the-trap', 'mistake: guard only', 'FAIL', swap(C, '  echo "▶ $site"\n', '  echo "▶ $site"\n  if [ ! -s "$dir/index.html" ]; then\n    echo "✗ $site: no $dir/index.html" >&2\n    return 1\n  fi\n')],
    ['the-trap', 'mistake: || return 1 only, no guard', 'FAIL', swap(swap(swap(C, '--cache-control "$LONG_CACHE"\n', '--cache-control "$LONG_CACHE" || return 1\n'), '--cache-control "no-cache"\n', '--cache-control "no-cache" || return 1\n'), '> /dev/null\n', '> /dev/null || return 1\n')],
    ['the-trap', 'mistake: exit 1 in guard', 'FAIL', swap(TR, '    return 1\n  fi', '    exit 1\n  fi')],
    ['the-trap', 'mistake: set -e inside function', 'FAIL', swap(C, '  local site="$1"\n', '  set -e\n  local site="$1"\n')],
    ['the-trap', 'mistake: guard after sync', 'FAIL', (() => { let s = swap(TR, '  if [ ! -s "$dir/index.html" ]; then\n    echo "✗ $site: no $dir/index.html" >&2\n    return 1\n  fi\n', ''); return swap(s, '  aws s3 cp', '  if [ ! -s "$dir/index.html" ]; then\n    echo "✗ $site: no $dir/index.html" >&2\n    return 1\n  fi\n  aws s3 cp'); })()],
    ['the-trap', 'mistake: sync lacks || return 1', 'FAIL', swap(TR, '--cache-control "$LONG_CACHE" || return 1', '--cache-control "$LONG_CACHE"')],
    ['the-trap', 'mistake: cp lacks || return 1', 'FAIL', swap(TR, '--cache-control "no-cache" || return 1', '--cache-control "no-cache"')],
    ['the-trap', 'mistake: invalidation lacks || return 1', 'FAIL', swap(TR, '> /dev/null || return 1', '> /dev/null')],
    ['the-trap', 'mistake: loop message removed', 'FAIL', swap(swap(TR, ' || echo "✗ $site failed, carrying on" >&2', ' || true'), '    echo "✗ $site: no $dir/index.html" >&2\n', '')],
    ['the-trap', 'fake: guard hard-coded to blog', 'FAIL', swap(TR, '  if [ ! -s "$dir/index.html" ]; then', '  if [ "$site" = "blog" ]; then')],
    ['the-trap', 'mistake: guard with -f (empty file passes)', 'FAIL', swap(TR, '[ ! -s "$dir/index.html" ]', '[ ! -f "$dir/index.html" ]')],
    ['the-trap', 'mistake: guard with -e', 'FAIL', swap(TR, '[ ! -s "$dir/index.html" ]', '[ ! -e "$dir/index.html" ]')],
    ['the-trap', 'style: [ -s ] || { }, if ! aws', 'PASS', plainFn(C, `
deploy_site() {
  local site="$1"
  local dir="sites/$site"
  local line bucket dist
  line=$(grep "^$site " "$SITES_FILE")
  bucket=$(echo "$line" | awk '{print $2}')
  dist=$(echo "$line" | awk '{print $3}')

  echo "▶ $site"
  [ -s "$dir/index.html" ] || { echo "✗ $site: no index.html" >&2; return 1; }
  if ! aws s3 sync "$dir/" "s3://$bucket/" --delete --exclude "index.html" --cache-control "$LONG_CACHE"; then
    return 1
  fi
  if ! aws s3 cp "$dir/index.html" "s3://$bucket/index.html" --cache-control "no-cache"; then return 1; fi
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null || { return 1; }
  echo "✓ $site is live"
}
`)],
    ['the-trap', 'style: && chain', 'PASS', plainFn(C, `
deploy_site() {
  local site="$1"
  local dir="sites/$site"
  local line bucket dist
  line=$(grep "^$site " "$SITES_FILE")
  bucket=$(echo "$line" | awk '{print $2}')
  dist=$(echo "$line" | awk '{print $3}')

  echo "▶ $site"
  if [[ ! -s $dir/index.html ]]
  then
    echo "✗ $site: no index.html" >&2
    return 1
  fi
  aws s3 sync "$dir/" "s3://$bucket/" --delete --exclude "index.html" --cache-control "$LONG_CACHE" &&
  aws s3 cp "$dir/index.html" "s3://$bucket/index.html" --cache-control "no-cache" &&
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null &&
  echo "✓ $site is live"
}
`)],
    ['the-trap', 'style: return $? and test -s', 'PASS', plainFn(C, `
deploy_site() {
  local site="$1"
  local dir="sites/$site"
  local line bucket dist
  line=$(grep "^$site " "$SITES_FILE")
  bucket=$(echo "$line" | awk '{print $2}')
  dist=$(echo "$line" | awk '{print $3}')

  echo "▶ $site"
  if ! test -s "$dir/index.html"; then
    echo "✗ $site: no index.html" >&2
    return 1
  fi
  aws s3 sync "$dir/" "s3://$bucket/" --delete --exclude "index.html" --cache-control "$LONG_CACHE" || return $?
  aws s3 cp "$dir/index.html" "s3://$bucket/index.html" --cache-control "no-cache" || return 2
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" > /dev/null || return
  echo "✓ $site is live"
}
`)],
  ];
};

const countSummaryCodes = () => {
  const CS = T.COUNT_STARTER; const cnt = (to) => swap(CS, '((failed++))', to);
  const SS = T.SUMMARY_STARTER; const SOL = T.SUMMARY_SOLUTION;
  const tailFrom = (script, marker) => script.slice(0, script.indexOf(marker));
  const sumHead = tailFrom(SS, 'failed=0\nfor site');
  const X = T.CODES_STARTER; const XS = T.CODES_SOLUTION;
  const xs = (a, b) => swap(XS, a, b);
  const CHECK = 'if [ "$#" -eq 0 ]; then\n  usage\nfi\n';
  const NAMES = 'for site in "$@"; do\n  if ! grep -q "^$site " "$SITES_FILE"; then\n    echo "Unknown site: $site" >&2\n    usage\n  fi\ndone\n';
  const ENDING = 'if [ "$failed" -gt 0 ]; then\n  echo "$failed of $# sites failed" >&2\n  exit 1\nfi\necho "All sites deployed ($#)"\n';
  return [
    // ---------------- count
    ['count', 'solution', 'PASS', T.COUNT_SOLUTION],
    ['count', 'starter', 'FAIL', CS],
    ['count', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['count', 'fake: hard-coded Done line', 'FAIL', swap(cnt('true'), 'echo "Done: $failed of $# sites failed"', 'echo "Done: 1 of 3 sites failed"')],
    ['count', 'mistake: removed the counter', 'FAIL', cnt('true')],
    ['count', 'mistake: failed=failed+1', 'FAIL', cnt('failed=failed+1')],
    ['count', 'mistake: failed=$failed+1', 'FAIL', cnt('failed=$failed+1')],
    ['count', 'mistake: failed = $((failed + 1)) spaces', 'FAIL', cnt('failed = $((failed + 1))')],
    ['count', 'mistake: removed set -e', 'FAIL', swap(CS, 'set -euo pipefail', 'set -uo pipefail')],
    ['count', 'mistake: $((failed++)) as a command', 'FAIL', cnt('$((failed++))')],
    ['count', 'style: ((failed++)) || true', 'PASS', cnt('((failed++)) || true')],
    ['count', 'style: ((++failed))', 'PASS', cnt('((++failed))')],
    ['count', 'style: ((failed += 1))', 'PASS', cnt('((failed += 1))')],
    ['count', 'style: failed=$((failed+1)) no spaces', 'PASS', cnt('failed=$((failed+1))')],
    ['count', 'style: failed=$(( $failed + 1 ))', 'PASS', cnt('failed=$(( $failed + 1 ))')],
    ['count', 'style: let "failed += 1"', 'PASS', cnt('let "failed += 1"')],
    ['count', 'style: failed=$(expr $failed + 1)', 'PASS', cnt('failed=$(expr $failed + 1)')],
    ['count', 'style: : $((failed++))', 'PASS', cnt(': $((failed++))')],
    ['count', 'style: if ! then with counter', 'PASS', swap(CS, '  deploy_site "$site" || { echo "✗ $site failed, carrying on" >&2; ((failed++)); }\n', '  if ! deploy_site "$site"; then\n    echo "✗ $site failed, carrying on" >&2\n    failed=$(( failed + 1 ))\n  fi\n')],
    // ---------------- summary
    ['summary', 'solution', 'PASS', SOL],
    ['summary', 'starter', 'FAIL', SS],
    ['summary', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['summary', 'fake: hand-typed with ✗ blog', 'FAIL', swap(SS, 'echo "✓ blog"', 'echo "✗ blog"')],
    ['summary', 'mistake: no line breaks', 'FAIL', swap(swap(SOL, '✓ ${site}"$\'\\n\'', '✓ ${site}"'), '✗ ${site}"$\'\\n\'', '✗ ${site}"')],
    ['summary', 'mistake: "\\n" inside double quotes, printf %s', 'FAIL', swap(swap(SOL, '✓ ${site}"$\'\\n\'', '✓ ${site}\\n"'), '✗ ${site}"$\'\\n\'', '✗ ${site}\\n"')],
    ['summary', 'mistake: summary overwritten each time', 'FAIL', swap(swap(SOL, 'summary="${summary}✓', 'summary="✓'), 'summary="${summary}✗', 'summary="✗')],
    ['summary', 'mistake: summary printed before heading', 'FAIL', swap(SOL, 'echo "Summary"\nprintf \'%s\' "$summary"\n', 'printf \'%s\' "$summary"\necho "Summary"\n')],
    ['summary', 'mistake: both branches ✓', 'FAIL', swap(SOL, 'summary="${summary}✗', 'summary="${summary}✓')],
    ['summary', 'mistake: stopped counting', 'FAIL', swap(SOL, '    failed=$((failed + 1))\n', '')],
    ['summary', 'mistake: heading removed', 'FAIL', swap(SOL, 'echo "Summary"\n', '')],
    ['summary', 'mistake: unquoted $summary with echo', 'FAIL', swap(SOL, 'printf \'%s\' "$summary"', 'echo $summary')],
    ['summary', 'style: arrays', 'PASS', sumHead + 'failed=0\nlines=()\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    lines+=("✓ $site")\n  else\n    lines+=("✗ $site")\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary"\nprintf \'%s\\n\' "${lines[@]}"\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: += with \\n and printf "$summary"', 'PASS', sumHead + 'failed=0\nsummary=""\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    summary+="✓ $site\\n"\n  else\n    summary+="✗ $site\\n"\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary"\nprintf "$summary"\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: echo -e', 'PASS', sumHead + 'failed=0\nsummary=""\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    summary="$summary✓ $site\\n"\n  else\n    summary="$summary✗ $site\\n"\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary"\necho -e "$summary"\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: || with summary, real newline in quotes, echo "$summary"', 'PASS', sumHead + 'failed=0\nsummary=""\nfor site in "$@"; do\n  deploy_site "$site" && summary="$summary✓ $site\n" || { summary="$summary✗ $site\n"; failed=$((failed + 1)); }\ndone\n\necho\necho "Summary"\necho "$summary"\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: two lists, ok and bad words then loop', 'PASS', sumHead + 'failed=0\nresults=""\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    results="$results ok:$site"\n  else\n    results="$results bad:$site"\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary"\nfor r in $results; do\n  case "$r" in\n    ok:*) echo "✓ ${r#ok:}" ;;\n    *) echo "✗ ${r#bad:}" ;;\n  esac\ndone\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: temp file', 'PASS', sumHead + 'failed=0\n: > /tmp/summary.txt\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    echo "✓ $site" >> /tmp/summary.txt\n  else\n    echo "✗ $site" >> /tmp/summary.txt\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary"\ncat /tmp/summary.txt\nrm -f /tmp/summary.txt\necho "Done: $failed of $# sites failed"\n'],
    ['summary', 'style: extra words on each line, heading with colon', 'PASS', sumHead + 'failed=0\nsummary=""\nfor site in "$@"; do\n  if deploy_site "$site"; then\n    summary="${summary}  ✓ ${site} deployed"$\'\\n\'\n  else\n    summary="${summary}  ✗ ${site} NOT deployed"$\'\\n\'\n    failed=$((failed + 1))\n  fi\ndone\n\necho\necho "Summary:"\nprintf \'%s\' "$summary"\necho "Done: $failed of $# sites failed"\n'],
    // ---------------- exit-codes
    ['exit-codes', 'solution', 'PASS', XS],
    ['exit-codes', 'starter', 'FAIL', X],
    ['exit-codes', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['exit-codes', 'solution via nightly.sh', 'PASS', XS, { command: 'bash nightly.sh' }],
    ['exit-codes', 'mistake: kept exit "$failed"', 'FAIL', xs(ENDING, 'echo "Done: $failed of $# sites failed"\nexit "$failed"\n')],
    ['exit-codes', 'mistake: no usage check for no args', 'FAIL', xs(CHECK, '')],
    ['exit-codes', 'mistake: no-arg check with exit 1', 'FAIL', xs(CHECK, 'if [ "$#" -eq 0 ]; then\n  echo "Usage: $0 all | <site>..." >&2\n  exit 1\nfi\n')],
    ['exit-codes', 'mistake: name check inside deploy loop', 'FAIL', swap(xs(NAMES, ''), '  if deploy_site "$site"; then', '  if ! grep -q "^$site " "$SITES_FILE"; then\n    echo "Unknown site: $site" >&2\n    usage\n  fi\n  if deploy_site "$site"; then')],
    ['exit-codes', 'mistake: name check before the all lines', 'FAIL', (() => { const ALL = XS.slice(XS.indexOf('if [ "${1:-}" = "all" ]'), XS.indexOf('for site in "$@"; do\n  if ! grep')); return swap(swap(XS, ALL, ''), NAMES, NAMES + ALL); })()],
    ['exit-codes', 'mistake: unknown name, no message', 'FAIL', xs('    echo "Unknown site: $site" >&2\n', '')],
    ['exit-codes', 'mistake: unknown name message to stdout', 'FAIL', xs('    echo "Unknown site: $site" >&2\n', '    echo "Unknown site: $site"\n')],
    ['exit-codes', 'mistake: grep without ^ and space (prefix sho passes)', 'FAIL', xs('grep -q "^$site " "$SITES_FILE"', 'grep -q "$site" "$SITES_FILE"')],
    ['exit-codes', 'mistake: always exit 1', 'FAIL', xs(ENDING, 'exit 1\n')],
    ['exit-codes', 'style: one-line if for the exit code', 'PASS', xs(ENDING, 'if [ "$failed" -gt 0 ]; then exit 1; fi\n')],
    ['exit-codes', 'mistake: [ $failed -gt 0 ] && exit 1 as last line', 'FAIL', xs(ENDING, '[ "$failed" -gt 0 ] && exit 1\n')],
    ['exit-codes', 'mistake: unknown name ends with exit 1', 'FAIL', xs('    echo "Unknown site: $site" >&2\n    usage\n', '    echo "Unknown site: $site" >&2\n    exit 1\n')],
    ['exit-codes', 'style: [ ] || usage, exit with arithmetic', 'PASS', xs(CHECK, '[ "$#" -gt 0 ] || usage\n').replace(ENDING, 'exit $(( failed > 0 ? 1 : 0 ))\n')],
    ['exit-codes', 'style: [ $# -eq 0 ] && usage; awk test; exit', 'PASS', swap(xs(CHECK, '[ $# -eq 0 ] && usage\n'), 'if ! grep -q "^$site " "$SITES_FILE"; then', 'if [ -z "$(awk -v s="$site" \'$1 == s\' "$SITES_FILE")" ]; then').replace(ENDING, 'if [ "$failed" -ne 0 ]; then\n  exit 1\nelse\n  exit 0\nfi\n')],
    ['exit-codes', 'style: [[ ]], cut | grep -qx, a test as the last line', 'PASS', swap(xs(CHECK, 'if [[ $# -lt 1 ]]; then usage; fi\n'), 'if ! grep -q "^$site " "$SITES_FILE"; then', 'if ! cut -d" " -f1 "$SITES_FILE" | grep -qx "$site"; then').replace(ENDING, '[ "$failed" -eq 0 ]\n')],
    ['exit-codes', 'style: known flag loop', 'PASS', xs(NAMES, 'for site in "$@"; do\n  known=no\n  for name in $(awk \'{print $1}\' "$SITES_FILE"); do\n    [ "$name" = "$site" ] && known=yes\n  done\n  if [ "$known" = no ]; then\n    echo "Unknown site: $site" >&2\n    usage\n  fi\ndone\n')],
  ];
};

const cachesPretendTest = () => {
  const D = T.DEPLOY_SOLUTION; const CS = T.CACHES_STARTER;
  const a = CS.indexOf('\n# clear_cache <id>'); const b = CS.indexOf('\n}\n', a) + 3;
  const cc = (body) => CS.slice(0, a) + `\n# clear_cache\nclear_cache() {\n${body}\n}\n` + CS.slice(b);
  const INV = 'aws cloudfront create-invalidation --distribution-id "$id" --paths "/*" > /dev/null';
  const F = T.FAKE_AWS_SOLUTION; const FS = T.FAKE_AWS_STARTER;
  const fake = (body) => `#!/bin/bash\n${body}\n`;
  const TS = T.TEST_STARTER; const TSOL = T.TEST_SOLUTION;
  const t2 = (body) => swap(TS, '# TODO: run the deploy for shop while the pretend aws fails every cloudfront call,\n#       then check two facts: the exit code is 1, and the summary says ✗ shop\n', body);
  return [
    // ---------------- two-caches
    ['two-caches', 'solution', 'PASS', D],
    ['two-caches', 'starter', 'FAIL', CS],
    ['two-caches', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['two-caches', 'mistake: loop, || return 1 at first failure', 'FAIL', cc(`  local id\n  for id in "$@"; do\n    ${INV} || return 1\n  done`)],
    ['two-caches', 'mistake: loop, no failure tracking', 'FAIL', cc(`  local id\n  for id in "$@"; do\n    ${INV}\n  done`)],
    ['two-caches', 'mistake: message but no failure', 'FAIL', cc(`  local id\n  for id in "$@"; do\n    ${INV} || echo "✗ $id: cache not cleared" >&2\n  done`)],
    ['two-caches', 'mistake: fails but no message', 'FAIL', cc(`  local id problems=0\n  for id in "$@"; do\n    ${INV} || problems=1\n  done\n  [ "$problems" -eq 0 ]`)],
    ['two-caches', 'mistake: message to stdout', 'FAIL', cc(`  local id problems=0\n  for id in "$@"; do\n    ${INV} || { echo "✗ $id: cache not cleared"; problems=1; }\n  done\n  [ "$problems" -eq 0 ]`)],
    ['two-caches', 'mistake: return $problems inverted ([ -gt 0 ])', 'FAIL', cc(`  local id problems=0\n  for id in "$@"; do\n    ${INV} || { echo "✗ $id: cache not cleared" >&2; problems=1; }\n  done\n  [ "$problems" -gt 0 ]`)],
    ['two-caches', 'mistake: "$*" loop', 'FAIL', cc(`  local id problems=0\n  for id in "$*"; do\n    ${INV} || { echo "✗ $id: cache not cleared" >&2; problems=1; }\n  done\n  [ "$problems" -eq 0 ]`)],
    ['two-caches', 'style: ((problems++)) then return $problems (set -e is off in there)', 'PASS', cc(`  local id problems=0\n  for id in "$@"; do\n    ${INV} || { echo "✗ $id: cache not cleared" >&2; ((problems++)); }\n  done\n  return $problems`)],
    ['two-caches', 'fake: $1 and $2 hard-coded', 'FAIL', cc(`  local problems=0\n  aws cloudfront create-invalidation --distribution-id "$1" --paths "/*" > /dev/null || { echo "✗ $1: cache not cleared" >&2; problems=1; }\n  aws cloudfront create-invalidation --distribution-id "$2" --paths "/*" > /dev/null || { echo "✗ $2: cache not cleared" >&2; problems=1; }\n  [ "$problems" -eq 0 ]`)],
    ['two-caches', 'fake: one call with both ids', 'FAIL', cc(`  aws cloudfront create-invalidation --distribution-id "$@" --paths "/*" > /dev/null`)],
    ['two-caches', 'style: for id; return $problems', 'PASS', cc(`  local id\n  local problems=0\n  for id; do\n    if aws cloudfront create-invalidation --distribution-id "$id" --paths '/*' >/dev/null; then\n      :\n    else\n      echo "✗ $id: cache not cleared" >&2\n      problems=1\n    fi\n  done\n  return $problems`)],
    ['two-caches', 'style: while shift, status var', 'PASS', cc(`  local status=0\n  while [ $# -gt 0 ]; do\n    aws cloudfront create-invalidation --distribution-id "$1" --paths "/*" > /dev/null || { echo "✗ $1: cache not cleared" >&2; status=1; }\n    shift\n  done\n  return "$status"`)],
    ['two-caches', 'style: if [ -gt 0 ]; then return 1; fi', 'PASS', cc(`  local id failed_ids=""\n  for id in "$@"; do\n    ${INV} || failed_ids="$failed_ids $id"\n  done\n  if [ -n "$failed_ids" ]; then\n    for id in $failed_ids; do echo "✗ $id: cache not cleared" >&2; done\n    return 1\n  fi`)],
    ['two-caches', 'style: [[ ]] and (( )) last', 'PASS', cc(`  local id problems=0\n  for id in "$@"; do\n    if ! ${INV}; then\n      echo "✗ $id: cache not cleared" >&2\n      problems=$((problems + 1))\n    fi\n  done\n  [[ $problems -eq 0 ]]`)],
    ['two-caches', 'style: (( problems == 0 )) last', 'PASS', cc(`  local id problems=0\n  for id in "$@"; do\n    ${INV} || { echo "✗ $id: cache not cleared" >&2; problems=$((problems + 1)); }\n  done\n  (( problems == 0 ))`)],
    // ---------------- pretend-aws
    ['pretend-aws', 'solution', 'PASS', F],
    ['pretend-aws', 'starter', 'FAIL', FS],
    ['pretend-aws', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['pretend-aws', 'solution, started without the Run button', 'PASS', F, { command: './deploy.sh shop' }],
    ['pretend-aws', 'mistake: > instead of >>', 'FAIL', swap(F, '>> "$FAKE_AWS_LOG"', '> "$FAKE_AWS_LOG"')],
    ['pretend-aws', 'mistake: unquoted $*', 'FAIL', swap(F, 'echo "aws $*"', 'echo aws $*')],
    ['pretend-aws', 'mistake: no aws word', 'FAIL', swap(F, 'echo "aws $*"', 'echo "$*"')],
    ['pretend-aws', 'mistake: log only', 'FAIL', fake('echo "aws $*" >> "$FAKE_AWS_LOG"\nexit 0')],
    ['pretend-aws', 'mistake: fail check before log', 'FAIL', fake('if [ "${1:-}" = "${FAKE_AWS_FAIL:-none}" ]; then\n  echo "failed" >&2\n  exit 1\nfi\necho "aws $*" >> "$FAKE_AWS_LOG"\nexit 0')],
    ['pretend-aws', 'mistake: always fails cloudfront', 'FAIL', fake('echo "aws $*" >> "$FAKE_AWS_LOG"\nif [ "$1" = cloudfront ]; then exit 1; fi\nexit 0')],
    ['pretend-aws', 'fake: only cloudfront can be made to fail', 'FAIL', fake('echo "aws $*" >> "$FAKE_AWS_LOG"\nif [ "${FAKE_AWS_FAIL:-}" = cloudfront ] && [ "$1" = cloudfront ]; then exit 1; fi\nexit 0')],
    ['pretend-aws', 'mistake: fails when FAKE_AWS_FAIL set at all', 'FAIL', fake('echo "aws $*" >> "$FAKE_AWS_LOG"\nif [ -n "${FAKE_AWS_FAIL:-}" ]; then exit 1; fi\nexit 0')],
    ['pretend-aws', 'mistake: logs to a fixed file name', 'FAIL', fake('echo "aws $*" >> calls.log\nif [ "${1:-}" = "${FAKE_AWS_FAIL:-none}" ]; then exit 1; fi\nexit 0')],
    ['pretend-aws', 'mistake: logs only $1', 'FAIL', fake('echo "aws $1" >> "$FAKE_AWS_LOG"\nif [ "${1:-}" = "${FAKE_AWS_FAIL:-none}" ]; then exit 1; fi\nexit 0')],
    ['pretend-aws', 'style: tee -a for the log', 'PASS', fake('echo "aws $*" | tee -a "$FAKE_AWS_LOG" > /dev/null\n[ "$1" = "${FAKE_AWS_FAIL:-}" ] && exit 1\nexit 0')],
    ['pretend-aws', 'style: echo aws "$@"', 'PASS', fake('echo aws "$@" >> "$FAKE_AWS_LOG"\n[ "$1" = "$FAKE_AWS_FAIL" ] && exit 1\nexit 0')],
    ['pretend-aws', 'style: printf, case', 'PASS', fake('printf \'aws %s\\n\' "$*" >> "$FAKE_AWS_LOG"\ncase "$1" in\n  "${FAKE_AWS_FAIL:-}") echo "pretend failure" >&2; exit 1 ;;\nesac\nexit 0')],
    ['pretend-aws', 'style: set -u, if/else exit', 'PASS', fake('set -u\necho "aws $@" >> "${FAKE_AWS_LOG}"\nif [[ "${FAKE_AWS_FAIL:-}" == "$1" ]]; then\n  exit 1\nelse\n  exit 0\nfi')],
    ['pretend-aws', 'style: no final exit, test last', 'PASS', fake('echo "aws $*" >> "$FAKE_AWS_LOG"\n[ "$1" != "${FAKE_AWS_FAIL:-}" ]')],
    // ---------------- test-script
    ['test-script', 'solution', 'PASS', TSOL],
    ['test-script', 'starter', 'FAIL', TS],
    ['test-script', 'do nothing', 'NULL', null, { command: 'ls' }],
    ['test-script', 'fake: exit 0 at top', 'FAIL', swap(TSOL, 'set -u\n', 'set -u\necho "All checks passed"; exit 0\n')],
    ['test-script', 'fake: checks that are always true', 'FAIL', t2('true; check $? "exit code is 1"\ntrue; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'fake: only echo', 'FAIL', t2('echo "  ✓ exit code is 1"\necho "  ✓ the summary says ✗ shop"\n')],
    ['test-script', 'mistake: no export (plain assignment)', 'FAIL', t2('FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]; check $? "exit code is 1 (it was $code)"\ngrep -q "✗ shop" "$OUT"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'mistake: forgot to run deploy again', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\n[ "$code" -eq 1 ]; check $? "exit code is 1 (it was $code)"\ngrep -q "✗ shop" "$OUT"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'mistake: only checks exit code', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]; check $? "exit code is 1 (it was $code)"\n')],
    ['test-script', 'mistake: only checks summary', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\ngrep -q "✗ shop" "$OUT"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'style: exit code is not 0, and grep for the cross', 'PASS', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -ne 0 ]; check $? "exit code is not 0"\ngrep -q "✗ shop" "$OUT"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'mistake: check args swapped', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]; check "exit code is 1" $?\ngrep -q "✗ shop" "$OUT"; check "the summary says ✗ shop" $?\n')],
    ['test-script', 'mistake: check without $?', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\ncheck [ "$code" -eq 1 ] "exit code is 1"\ncheck grep -q "✗ shop" "$OUT"\n')],
    ['test-script', 'mistake: echo between test and check (always 0)', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]\necho "checking exit code"\ncheck $? "exit code is 1"\ngrep -q "✗ shop" "$OUT"\necho "checking summary"\ncheck $? "the summary says ✗ shop"\n')],
    ['test-script', 'mistake: grep for ✗ in LOG not OUT', 'FAIL', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]; check $? "exit code is 1 (it was $code)"\ngrep -q "✗ shop" "$LOG"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'style: prefix assignment on run_deploy', 'PASS', t2('FAKE_AWS_FAIL=cloudfront run_deploy shop\n[ "$code" -eq 1 ]; check $? "exit code is 1 (it was $code)"\ngrep -q "✗ shop" "$OUT"; check $? "the summary says ✗ shop"\n')],
    ['test-script', 'style: no check(), own ifs', 'PASS', t2('export FAKE_AWS_FAIL=cloudfront\nrun_deploy shop\nunset FAKE_AWS_FAIL\nif [ "$code" -ne 1 ]; then\n  echo "  ✗ exit code should be 1, was $code"\n  failed=$((failed + 1))\nfi\nif ! grep -q "✗ shop" "$OUT"; then\n  echo "  ✗ summary should say ✗ shop"\n  failed=$((failed + 1))\nfi\n')],
    ['test-script', 'style: test(1), grep -c, export then export -n', 'PASS', t2('FAKE_AWS_FAIL=cloudfront\nexport FAKE_AWS_FAIL\nrun_deploy shop\nexport -n FAKE_AWS_FAIL\ntest "$code" = 1; check $? "exit code is 1"\n[ "$(grep -c "✗ shop" "$OUT")" -ge 1 ]; check $? "summary has ✗ shop"\n! grep -q "✓ shop" "$OUT"; check $? "no ✓ shop anywhere"\n')],
    ['test-script', 'style: s3 fails instead', 'PASS', t2('export FAKE_AWS_FAIL=s3\nrun_deploy shop\nunset FAKE_AWS_FAIL\n[ "$code" -eq 1 ]; check $? "exit code is 1"\ngrep -q "✗ shop" "$OUT"; check $? "summary has ✗ shop"\n')],
    ['test-script', 'style: own run with env on the command line', 'PASS', t2('rm -f "$LOG"\ncode=0\nPATH="$PWD/test/bin:$PATH" FAKE_AWS_LOG="$LOG" FAKE_AWS_FAIL=cloudfront ./deploy.sh shop > "$OUT" 2>&1 || code=$?\n[ "$code" -eq 1 ]; check $? "exit code is 1"\ngrep -q "^✗ shop" "$OUT"; check $? "summary has ✗ shop"\n')],
  ];
};

describe('Tutorial 5: what the checks accept and refuse', () => {
  for (const [id, label, expected, text, options] of [...loopCarryTrap(), ...countSummaryCodes(), ...cachesPretendTest()]) {
    it(`${id}: ${label}`, () => {
      const verdict = attempt(id, text, options);
      if (expected === 'FAIL') {
        // Refused, with something to say: feedback is a sentence, never a bare "no"
        expect(verdict).toMatch(/^FAIL: .{30,}/s);
        expect(verdict).not.toMatch(/undefined|\[object|NaN/);
      } else {
        expect(verdict).toBe(expected);
      }
    });
  }

  it('reading the script is not running it', () => {
    const s = step('loop');
    const shell = new Shell(s.scenario());
    shell.fs.write('deploy.sh', T.LOOP_SOLUTION);
    for (const command of ['cat deploy.sh', 'ls -l deploy.sh', 'grep -n deploy_site deploy.sh', 'chmod +x deploy.sh']) {
      const result = shell.run(command);
      expect(s.check({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history })).toBe(null);
    }
    for (const command of ['bash deploy.sh shop blog docs', './deploy.sh shop blog docs', 'bash -x ./deploy.sh shop blog docs > /dev/null 2>&1']) {
      const fresh = new Shell(s.scenario());
      fresh.fs.write('deploy.sh', T.LOOP_SOLUTION);
      fresh.fs.node('deploy.sh').mode = 0o755;
      const result = fresh.run(command);
      expect(s.check({ shell: fresh, fs: fresh.fs, aws: fresh.aws, result, history: fresh.history })).toBe(true);
    }
  });

  it('every hint leaves the answer to the learner', () => {
    // A hint may name the pieces; it must not hold a whole long line of the answer
    for (const s of tutorial.steps.filter((x) => x.kind === 'try')) {
      const starter = new Set(s.files[0].starter.split('\n').map((l) => l.trim()));
      const added = s.solution.split('\n').map((l) => l.trim()).filter((l) => l.length > 30 && !starter.has(l));
      for (const line of added) expect(s.hint, `${s.id}: the hint gives away "${line}"`).not.toContain(line);
    }
  });
});
