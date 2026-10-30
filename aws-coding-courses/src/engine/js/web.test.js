// The web runtime: the page gets its CSS and scripts, console output and
// errors come back, localStorage persists, fetch is pretend, probes work.
import { describe, it, expect } from 'vitest';
import { runWebPage } from './webJsdom';
import { guardLoops } from './loopGuard';

const PAGE = {
  'index.html': '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><button id="go">Go</button><p id="out"></p><script src="app.js"></script></body></html>',
  'style.css': 'p { color: red; }',
};

describe('web pages', () => {
  it('runs the script, reports console output, and answers a probe', async () => {
    const res = await runWebPage({
      files: { ...PAGE, 'app.js': "let n = Number(localStorage.getItem('n') || 0);\ndocument.querySelector('#go').addEventListener('click', () => { n += 1; localStorage.setItem('n', n); document.querySelector('#out').textContent = `Clicked ${n}`; });\nconsole.log('ready', { n });" },
      storage: { n: '4' },
      probe: "await practice.click('#go'); return { text: practice.text('#out'), saved: practice.storage().n, css: !!document.querySelector('style[data-file=\"style.css\"]') };",
    });
    expect(res.result.console).toEqual([{ level: 'log', text: 'ready { n: 4 }' }]);
    expect(res.probe).toEqual({ text: 'Clicked 5', saved: '5', css: true });
    // The check ran in its own copy: the learner's saved data is untouched
    expect(res.storage).toEqual({ n: '4' });
  });

  it('keeps the visible page\'s own saves', async () => {
    const res = await runWebPage({ files: { ...PAGE, 'app.js': "localStorage.setItem('seen', 'yes');" } });
    expect(res.storage).toEqual({ seen: 'yes' });
  });

  it('counts errors the check runs into', async () => {
    const res = await runWebPage({
      files: { ...PAGE, 'app.js': "document.querySelector('#go').addEventListener('click', () => { missing(); });" },
      probe: "await practice.click('#go'); return 1;",
    });
    expect(res.result.errors[0].text).toMatch(/ReferenceError/);
  });

  it('reports uncaught errors with the file and line, and a tip', async () => {
    const res = await runWebPage({ files: { ...PAGE, 'app.js': "const cards = [];\n\ndocument.querySelector('#nope').textContent = 'x';" } });
    expect(res.result.errors[0]).toMatchObject({ file: 'app.js', line: 3 });
    expect(res.result.errors[0].text).toMatch(/TypeError/);
    expect(res.result.errors[0].tip).toBeTruthy();
  });

  it('answers fetch from the pretend internet, with timeouts', async () => {
    const res = await runWebPage({
      files: { ...PAGE, 'app.js': "async function load() {\n  const r = await fetch('https://status.example.com/summary.json');\n  const data = await r.json();\n  document.querySelector('#out').textContent = data.status;\n  try { await fetch('https://slow.example.com', { signal: AbortSignal.timeout(100) }); } catch (e) { console.log(e.name); }\n}\nload();" },
      web: { 'https://status.example.com/summary.json': { json: { status: 'All good' }, ms: 200 }, 'https://slow.example.com': { hang: true } },
      probe: "await practice.until(() => practice.console.length); return [practice.text('#out'), practice.fetchLog.length];",
    });
    expect(res.probe).toEqual(['All good', 2]);
    expect(res.result.console[0].text).toBe('TimeoutError');
  });

  it('compiles TypeScript for the page and passes on its type errors', async () => {
    const res = await runWebPage({
      files: { ...PAGE, 'index.html': PAGE['index.html'], 'app.ts': "interface Card { front: string }\nconst card: Card = { front: 'S3' };\nconsole.log(card.fornt ?? 'missing');" },
      probe: 'return practice.console.map((l) => l.text);',
    });
    expect(res.diagnostics.map((d) => d.code)).toEqual([2551]);
    expect(res.probe).toEqual(['missing']);
  });
});

describe('loop protection', () => {
  it('stops an endless while loop and the page keeps working', async () => {
    const started = Date.now();
    const res = await runWebPage({
      files: { ...PAGE, 'app.js': "console.log('before');\nwhile (true) {}\n" },
      probe: "return practice.console.map((l) => l.text);",
    });
    expect(Date.now() - started).toBeLessThan(7000);
    expect(res.result.loaded).toBe(true);
    expect(res.result.errors[0]).toMatchObject({ file: 'app.js', line: 2 });
    expect(res.result.errors[0].text).toMatch(/Stopped a loop that ran for more than 2 seconds/);
    expect(res.probe).toEqual(['before']);
  }, 20000);

  it('stops for(;;) and do-while loops written without braces', async () => {
    const res = await runWebPage({ files: { ...PAGE, 'app.js': "let i = 0;\nfunction spin() { for (;;) i++; }\ntry { spin(); } catch (e) { console.log(e.message); }\ndo i--; while (i !== -0.5)" } });
    expect(res.result.console[0].text).toMatch(/Stopped a loop/);
    expect(res.result.errors[0].text).toMatch(/Stopped a loop/);
  }, 20000);

  it('lets long but finite loops, and loops that wait, finish', async () => {
    const res = await runWebPage({
      files: { ...PAGE, 'app.js': "let total = 0;\nfor (let i = 0; i < 3000000; i++) { total += i % 7; }\nconsole.log(total);\nasync function poll() { let n = 0; while (n < 30) { n++; await new Promise((r) => setTimeout(r, 5)); } console.log('polled', n); }\npoll();" },
      probe: "await practice.until(() => practice.console.length > 1); return practice.console.map((l) => l.text);",
    });
    expect(res.result.errors).toEqual([]);
    expect(res.probe).toEqual(['8999994', 'polled 30']);
  });

  it('rewrites only loop conditions, keeping lines, strings, regexes and for-of', () => {
    const src = [
      "const s = 'while (x)'; const t = `for (;;) ${a.map((x) => { while (y) {} })}`;",
      "// while (comment)",
      'const r = /for\\(;;\\)/g; const half = a / 2 / b;',
      'for (const k of list) {}',
      'for (let i = 0; i < n; i++) {}',
      'while (x = next()) go(x);',
      'obj.for(1); obj.while(2);',
    ].join('\n');
    const out = guardLoops(src, 'app.js');
    expect(out.split('\n')).toHaveLength(7);
    const lines = out.split('\n');
    expect(lines[0]).toContain("'while (x)'");
    expect(lines[0]).not.toContain('__practiceLoop'); // inside strings and templates: left alone
    expect(lines[1]).toBe('// while (comment)');
    expect(lines[2]).toBe('const r = /for\\(;;\\)/g; const half = a / 2 / b;');
    expect(lines[3]).toBe('for (const k of list) {}');
    expect(lines[4]).toBe('for (let i = 0; __practiceLoop("app.js", 5) && ( i < n); i++) {}');
    expect(lines[5]).toBe('while (__practiceLoop("app.js", 6) && (x = next())) go(x);');
    expect(lines[6]).toBe('obj.for(1); obj.while(2);');
  });
});
