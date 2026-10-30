// Builds the practice page for 'web' steps: the learner's HTML with their CSS
// and (compiled) scripts inlined, plus a small script that runs first and
// stands in for what a sandboxed preview can't have:
//   - console output and errors, sent to the practice console
//   - localStorage, kept by the course page between runs
//   - fetch(), answered by the step's pretend internet
//   - the check's probe: async code run inside the page (click, read the DOM)
//   - loop protection, so `while (true)` can't freeze the course page
// The page talks to its parent with postMessage, or through
// window.__practiceBridge when a test runs it in jsdom.
//
// Each run builds the page twice: the preview the learner sees (role 'view',
// which keeps its localStorage) and a hidden copy for the check (role
// 'probe', same files and starting storage, saves nothing), so a check's
// clicks never change the learner's page or saved data.
import { inspect } from './inspect';
import { makeFakeFetch } from './fakeFetch';
import { guardLoops, installLoopGuard } from './loopGuard';

export const LOOP_LIMIT_MS = 2000;

const escapeScript = (code) => code.replace(/<\/(script)/gi, '<\\/$1');

// Runs inside the page, before anything else. It's copied in as source text,
// so it may only use its parameters and the page's globals.
function pageShim(config, inspect, makeFakeFetch, installLoopGuard) {
  installLoopGuard(window, config.loopLimit);
  const formatArgs = (args) => args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
  const send = window.__practiceBridge || ((msg) => window.parent.postMessage({ __practice: true, ...msg }, '*'));
  const lines = [];
  const errors = [];
  const tipFor = (text) => {
    for (const [re, tip] of config.tips) if (new RegExp(re).test(text)) return tip;
    return null;
  };

  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      const text = formatArgs(args);
      lines.push({ level, text });
      send({ type: 'console', level, text });
      try { original(...args); } catch (e) { /* the real console may be gone */ }
    };
  }
  console.table = (data) => console.log(inspect(data, 1));

  const reportError = (message, file, line) => {
    const text = `Uncaught ${message}`;
    errors.push({ message, file, line });
    send({ type: 'error', text: file ? `${text}\n    at ${file}:${line}` : text, tip: tipFor(message), file, line });
  };
  // Which file and line? The stack names the file (each script ends with a
  // sourceURL comment); otherwise count from where each script starts in the page.
  const locate = (err, pageLine) => {
    const ranges = window.__practiceRanges || [];
    let file = null;
    let line = null;
    if (err && err.practiceFile) { file = err.practiceFile; line = err.practiceLine; } // the loop guard knows exactly
    for (const r of file ? [] : ranges) {
      const esc = r.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = err && err.stack && String(err.stack).match(new RegExp(`(?:^|[\\s(/])${esc}:(\\d+):\\d+`));
      if (m) { file = r.path; line = Number(m[1]); break; }
    }
    if (!file && pageLine) {
      const current = document.currentScript && document.currentScript.dataset.file;
      if (current && window.__practiceBridge) {
        // jsdom (the tests) counts lines from the start of the script, which begins with a newline
        file = current;
        line = pageLine - 1;
      } else {
        const r = ranges.find((x) => pageLine >= x.start && pageLine <= x.end);
        if (r) { file = r.path; line = pageLine - r.start + 1; }
      }
    }
    const map = file && ranges.find((x) => x.path === file)?.map;
    if (map && line && map[line - 1] !== undefined) line = map[line - 1] + 1;
    return [file, line];
  };
  window.addEventListener('error', (e) => {
    if (!e.error && !e.message) return;
    const [file, line] = locate(e.error, e.lineno);
    reportError(e.error ? `${e.error.name}: ${e.error.message}` : e.message, file, line);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    reportError(r instanceof Error ? `${r.name}: ${r.message}` : `(in promise) ${inspect(r, 1)}`, null, null);
  });

  // localStorage: a sandboxed page has none, so the course page keeps it
  const makeStorage = (initial, persist) => {
    const data = new Map(Object.entries(initial || {}));
    const changed = () => persist && send({ type: 'storage', data: Object.fromEntries(data) });
    const storage = {
      getItem: (k) => (data.has(String(k)) ? data.get(String(k)) : null),
      setItem: (k, v) => {
        const value = String(v);
        if (value.length > 5000000) throw new DOMException("Failed to execute 'setItem' on 'Storage': the quota has been exceeded.", 'QuotaExceededError');
        data.set(String(k), value);
        changed();
      },
      removeItem: (k) => { data.delete(String(k)); changed(); },
      clear: () => { data.clear(); changed(); },
      key: (i) => [...data.keys()][i] ?? null,
      get length() { return data.size; },
    };
    return new Proxy(storage, {
      get: (t, k) => (k in t ? t[k] : typeof k === 'string' && data.has(k) ? data.get(k) : undefined),
      set: (t, k, v) => { t.setItem(k, v); return true; },
      ownKeys: () => [...data.keys()],
      getOwnPropertyDescriptor: (t, k) => (data.has(k) ? { value: data.get(k), enumerable: true, configurable: true } : undefined),
    });
  };
  const local = makeStorage(config.storage, config.persist);
  for (const [name, value] of [['localStorage', local], ['sessionStorage', makeStorage({}, false)]]) {
    try { Object.defineProperty(window, name, { value, configurable: true }); } catch (e) { /* keep the real one */ }
  }

  const fetchLog = [];
  window.fetch = makeFakeFetch(config.web || {}, fetchLog, 0.1);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`The page has no element matching ${sel}`);
    return el;
  };
  const practice = {
    wait: sleep,
    async until(fn, timeout = 3000) {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        try { const v = await fn(); if (v) return v; } catch (e) { /* not yet */ }
        await sleep(25);
      }
      return false;
    },
    $: (sel) => document.querySelector(sel),
    all: (sel) => [...document.querySelectorAll(sel)],
    text: (sel) => { const el = document.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; },
    exists: (sel) => !!document.querySelector(sel),
    click: async (sel) => { $(sel).click(); await sleep(30); },
    type: async (sel, value) => {
      const el = $(sel);
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(10);
    },
    submit: async (sel) => {
      const form = $(sel);
      const ev = new Event('submit', { bubbles: true, cancelable: true });
      const handled = !form.dispatchEvent(ev);
      await sleep(30);
      return handled; // true when the page called preventDefault()
    },
    key: async (key, target = document.activeElement || document.body) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await sleep(30);
    },
    storage: () => Object.fromEntries(Object.keys(local).map((k) => [k, local.getItem(k)])),
    fetchLog,
    console: lines,
    errors,
  };

  const handle = async (msg) => {
    if (msg.type === 'eval') {
      try {
        let value;
        try {
          value = (0, eval)(msg.code); // eslint-disable-line no-eval
        } catch (e) {
          // Top-level await, as in the browser's own console: run it in an async function
          if (!(e instanceof SyntaxError) || !/\bawait\b/.test(msg.code)) throw e;
          try {
            value = (0, eval)(`(async () => (${msg.code.replace(/;\s*$/, '')}))()`); // eslint-disable-line no-eval
          } catch {
            // Several lines: keep their variables and functions on the page, and show the last line's value
            const lines = msg.code
              .replace(/^var\s+([A-Za-z_$][\w$]*)\s*=/gm, '$1 =')
              .replace(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)/gm, '$2 = $1function $2')
              .split('\n');
            let last = lines.length - 1;
            while (last >= 0 && !lines[last].trim()) last -= 1;
            if (last >= 0 && !/^\s*(}|\)|\]|return\b|if\b|for\b|while\b|try\b|throw\b|\/\/|[A-Za-z_$][\w$]*\s*=[^=>])/.test(lines[last])) lines[last] = `return ${lines[last]}`;
            value = (0, eval)(`(async () => {\n${lines.join('\n')}\n})()`); // eslint-disable-line no-eval
          }
        }
        if (value && typeof value.then === 'function') value = await value;
        send({ type: 'eval-result', id: msg.id, text: value === undefined ? null : inspect(value, typeof value === 'string' ? 1 : 0) });
      } catch (e) {
        send({ type: 'eval-result', id: msg.id, error: `Uncaught ${e && e.name ? `${e.name}: ${e.message}` : inspect(e, 1)}`, tip: tipFor(String(e && e.message)) });
      }
    }
    if (msg.type === 'probe') {
      const AsyncFunction = (async () => {}).constructor;
      try {
        const value = await new AsyncFunction('practice', msg.body)(practice);
        send({ type: 'probe-result', id: msg.id, value: JSON.parse(JSON.stringify(value ?? null)) });
      } catch (e) {
        send({ type: 'probe-result', id: msg.id, error: e && e.name ? e.name : 'Error', message: String(e && e.message ? e.message : e) });
      }
    }
  };
  window.__practiceHandle = handle;
  window.addEventListener('message', (e) => { if (e.data && e.data.__practiceParent) handle(e.data); });
  window.addEventListener('load', () => setTimeout(() => send({ type: 'ready', runId: config.runId, role: config.role }), 20));
}

/**
 * files: the learner's sources ({ 'index.html', 'style.css', 'app.js' or 'app.ts' }).
 * compiled: JavaScript for .ts files ({ 'app.ts': '...' }).
 * Returns the full HTML for the preview frame.
 */
export const buildPage = ({ files, compiled = {}, lineMaps = {}, storage = {}, web = {}, tips = [], runId = 0, role = 'view' }) => {
  const compiledOrSource = (path) => (path.endsWith('.ts') ? compiled[path] ?? '' : files[path] ?? '');
  const htmlPath = Object.keys(files).find((p) => p === 'index.html') || Object.keys(files).find((p) => p.endsWith('.html'));
  const scriptFiles = [];
  const scriptFor = (src) => {
    const name = src.replace(/^\.?\//, '');
    const stem = name.replace(/\.(js|ts|mjs)$/, '');
    const path = [name, `${stem}.ts`, `${stem}.js`].find((p) => p in files);
    if (!path) return null;
    scriptFiles.push(path);
    return { path, code: `${guardLoops(compiledOrSource(path), path)}\n//# sourceURL=${path}` };
  };

  let html = htmlPath ? files[htmlPath] : '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
  html = html.replace(/<link\b[^>]*\bhref=["']([^"']+\.css)["'][^>]*>/gi, (tag, href) => {
    const name = href.replace(/^\.?\//, '');
    return name in files ? `<style data-file="${name}">\n${files[name]}\n</style>` : tag;
  });
  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, before, src, after) => {
    const s = scriptFor(src);
    if (!s) return tag;
    const attrs = `${before} ${after}`.replace(/\s+/g, ' ').trim();
    return `<script ${attrs} data-file="${s.path}">\n${escapeScript(s.code)}\n</script>`;
  });
  if (!htmlPath) {
    for (const path of Object.keys(files).filter((p) => /\.(js|ts)$/.test(p))) {
      const s = scriptFor(path);
      html = html.replace('</body>', `<script data-file="${s.path}">\n${escapeScript(s.code)}\n</script></body>`);
    }
  }

  const config = { storage, web, runId, role, persist: role === 'view', loopLimit: LOOP_LIMIT_MS, tips: tips.map(([re, tip]) => [re.source, tip]) };
  const shim = `<script>(${pageShim})(${JSON.stringify(config).replace(/<\//g, '<\\/')}, ${inspect}, ${makeFakeFetch}, ${installLoopGuard});</script>`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${shim}`) : `${shim}\n${html}`;

  // Where each script starts in the final page, for errors that only know the page line
  const ranges = [];
  for (const m of html.matchAll(/<script[^>]*data-file="([^"]+)"[^>]*>\n/g)) {
    const start = html.slice(0, m.index + m[0].length).split('\n').length;
    const lines = (compiledOrSource(m[1]).match(/\n/g) || []).length + 1;
    ranges.push({ path: m[1], start, end: start + lines - 1, map: lineMaps[m[1]] || null });
  }
  const rangesTag = `<script>window.__practiceRanges = ${JSON.stringify(ranges)};</script>`;
  html = /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${rangesTag}</body>`) : `${html}${rangesTag}`;
  return { html, scripts: scriptFiles };
};
