// The web runtime: the page gets its CSS and scripts, console output and
// errors come back, localStorage persists, fetch is pretend, probes work.
import { describe, it, expect } from 'vitest';
import { runWebPage } from './webJsdom';

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
    expect(res.storage).toEqual({ n: '5' });
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
