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

describe('files and presigned uploads', () => {
  const BUCKET = 'https://study-photos.s3.us-east-1.amazonaws.com';
  const UPLOAD_PAGE = {
    'index.html': '<!doctype html><html><head></head><body><input id="photo" type="file"><button id="go">Upload</button><p id="out"></p><img id="preview" hidden><script src="app.js"></script></body></html>',
    'app.js': `const input = document.querySelector('#photo');
const out = document.querySelector('#out');
input.addEventListener('change', () => {
  const file = input.files[0];
  out.textContent = file ? file.name + ' ' + file.size + ' ' + file.type + ' ' + !!input.value : 'none';
  if (file) document.querySelector('#preview').src = URL.createObjectURL(file);
});
document.querySelector('#go').addEventListener('click', async () => {
  const file = input.files[0];
  const res = await fetch('https://api.example.com/uploads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentType: file.type, size: file.size }) });
  const { url } = await res.json();
  const put = await fetch(url, { method: 'PUT', headers: window.wrongType ? { 'Content-Type': 'text/html' } : {}, body: file });
  out.textContent = put.ok ? 'uploaded' : put.status + ' ' + (await put.text()).match(/<Code>(.*?)<\\/Code>/)[1];
});`,
  };
  const web = {
    [BUCKET]: { s3: { 'uploads/ana/old.jpg': { size: 1200, contentType: 'image/jpeg', modified: '2026-11-20T18:02:11Z' } } },
    'POST https://api.example.com/uploads': {
      respond: "return { json: { url: s3.presign({ bucket: 'study-photos', key: 'uploads/ana/new.jpg', contentType: request.json.contentType, contentLength: request.json.size, expiresIn: 300 }) } };",
    },
  };

  it('lets a probe choose a file, and cancel the dialog', async () => {
    const res = await runWebPage({
      files: UPLOAD_PAGE,
      web,
      probe: `const chosen = await practice.chooseFile('#photo', { name: 'whiteboard.jpg', type: 'image/jpeg', size: 2100000 });
const first = practice.text('#out');
const preview = practice.$('#preview').src;
await practice.chooseFile('#photo');
const none = practice.text('#out');
await practice.chooseFile('#photo', { name: 'notes.txt', type: 'text/plain', text: 'hello' });
return { chosen, first, preview, none, text: practice.text('#out'), count: practice.$('#photo').files.length };`,
    });
    expect(res.result.errors).toEqual([]);
    expect(res.probe).toMatchObject({
      chosen: [{ name: 'whiteboard.jpg', size: 2100000, type: 'image/jpeg' }],
      first: 'whiteboard.jpg 2100000 image/jpeg true', none: 'none', text: 'notes.txt 5 text/plain true', count: 1,
    });
    expect(res.probe.preview).toMatch(/^blob:/);
  });

  it('lets a probe choose several files at once', async () => {
    const res = await runWebPage({
      files: { ...UPLOAD_PAGE, 'app.js': "const input = document.querySelector('#photo');\ninput.addEventListener('change', () => { document.querySelector('#out').textContent = [...input.files].map((f) => f.name + ':' + f.size).join(' '); });" },
      web,
      probe: `const chosen = await practice.chooseFile('#photo', [{ name: 'a.jpg', type: 'image/jpeg', size: 10 }, { name: 'b.txt', type: 'text/plain', text: 'héllo' }]);
return { chosen, text: practice.text('#out'), count: practice.$('#photo').files.length, second: practice.$('#photo').files.item(1).name };`,
    });
    expect(res.result.errors).toEqual([]);
    expect(res.probe).toEqual({
      chosen: [{ name: 'a.jpg', size: 10, type: 'image/jpeg' }, { name: 'b.txt', size: 6, type: 'text/plain' }],
      text: 'a.jpg:10 b.txt:6', count: 2, second: 'b.txt',
    });
  });

  it('gives respond the request, answers 500 when it throws, and prefers an entry for the method', async () => {
    const res = await runWebPage({
      files: { 'index.html': '<!doctype html><html><head></head><body><script src="app.js"></script></body></html>', 'app.js': '' },
      web: {
        ...web,
        'POST https://api.example.com/x': { respond: "return { status: 201, json: { json: request.json, query: request.query, header: request.headers['x-test'], method: request.method } };" },
        'https://api.example.com/x': { json: { any: true } },
        'https://api.example.com/boom': { respond: 'throw new Error("kaput");' },
        'https://api.example.com/sign': { respond: "return { json: { get: s3.presign({ method: 'GET', bucket: 'study-photos', key: 'notes/a.txt', expiresIn: 60 }), put: s3.presign({ bucket: 'study-photos', key: 'free.bin' }), other: s3.presign({ bucket: 'not-declared', key: 'k' }), has: [s3.has('study-photos'), s3.has('not-declared')], listed: s3.list('study-photos', 'notes/').map((o) => o.key) } };" },
        'https://study-photos.s3.us-east-1.amazonaws.com': { s3: { 'notes/a.txt': 'hello', 'uploads/ana/old.jpg': { size: 1200, contentType: 'image/jpeg' } } },
      },
      probe: `const ask = async (url, init) => { try { const r = await fetch(url, init); return [r.status, await r.text(), r.headers.get('content-type')]; } catch (e) { return e.name + ': ' + e.message; } };
const out = {};
out.post = await ask('https://api.example.com/x?a=1&b=two%20words', { method: 'POST', headers: { 'X-Test': 'yes' }, body: JSON.stringify({ n: 1 }) });
out.get = await ask('https://api.example.com/x');
out.boom = await ask('https://api.example.com/boom');
const signed = JSON.parse((await ask('https://api.example.com/sign'))[1]);
out.signed = [signed.has, signed.listed];
out.read = await ask(signed.get);
out.readWithPut = (await ask(signed.get, { method: 'PUT', body: 'x' }))[0];
out.anyBody = (await ask(signed.put, { method: 'PUT', body: new Uint8Array(7) }))[0]; // nothing but the address was signed
out.twoAuths = (await ask(signed.put, { method: 'PUT', headers: { Authorization: 'Bearer abc' }, body: 'x' })).slice(0, 2).map((v) => (typeof v === 'string' ? (v.match(/<Code>(.*?)<\\/Code>/) || [])[1] : v));
out.undeclared = await ask(signed.other, { method: 'PUT', body: 'x' });
out.unsigned = (await ask('https://study-photos.s3.us-east-1.amazonaws.com/notes/a.txt'))[0];
out.failed = practice.fetchLog.filter((e) => e.failed).map((e) => [e.url, e.failed]);
out.stored = practice.s3()['study-photos']['free.bin'];
return out;`,
    });
    expect(res.result.errors).toEqual([]);
    expect(res.probe.post).toEqual([201, '{"json":{"n":1},"query":{"a":"1","b":"two words"},"header":"yes","method":"POST"}', 'application/json']);
    expect(res.probe.get).toEqual([200, '{"any":true}', 'application/json']);
    expect(res.probe.boom).toEqual([500, '{"message":"Internal Server Error"}', 'application/json']);
    expect(res.probe.failed).toEqual([['https://api.example.com/boom', 'kaput']]);
    expect(res.probe.signed).toEqual([[true, false], ['notes/a.txt']]);
    expect(res.probe.read).toEqual([200, 'hello', 'binary/octet-stream']);
    expect(res.probe.readWithPut).toBe(403);
    expect(res.probe.anyBody).toBe(200);
    expect(res.probe.twoAuths).toEqual([400, 'InvalidArgument']);
    // A page gets no readable answer from a bucket that isn't there (no CORS headers): fetch fails
    expect(res.probe.undeclared).toBe('TypeError: Failed to fetch');
    expect(res.probe.unsigned).toBe(403);
    expect(res.probe.stored).toEqual({ size: 7, contentType: 'binary/octet-stream', metadata: {} });
  });

  it('uploads a file to a presigned URL, and S3 refuses what was not signed', async () => {
    const res = await runWebPage({
      files: UPLOAD_PAGE,
      web,
      probe: `await practice.chooseFile('#photo', { name: 'whiteboard.jpg', type: 'image/jpeg', size: 48211 });
await practice.click('#go');
await practice.until(() => practice.text('#out') === 'uploaded', 2000);
const good = practice.text('#out');
const put = practice.fetchLog.find((e) => e.method === 'PUT');
window.wrongType = true;
await practice.click('#go');
await practice.until(() => /^403/.test(practice.text('#out')), 2000);
return { good, put: [put.bodySize, put.bodyType, put.fileName, put.sent['content-type'], put.result, put.body], bad: practice.text('#out'), s3: practice.s3() };`,
    });
    expect(res.result.errors).toEqual([]);
    expect(res.probe.good).toBe('uploaded');
    expect(res.probe.put).toEqual([48211, 'image/jpeg', 'whiteboard.jpg', 'image/jpeg', 200, '[body]']);
    expect(res.probe.bad).toBe('403 SignatureDoesNotMatch');
    expect(res.probe.s3).toEqual({ 'study-photos': {
      'uploads/ana/old.jpg': { size: 1200, contentType: 'image/jpeg', metadata: {} },
      'uploads/ana/new.jpg': { size: 48211, contentType: 'image/jpeg', metadata: {} },
    } });
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
