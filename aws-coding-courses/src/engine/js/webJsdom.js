// Runs a 'web' step's page in jsdom for the tests, the way the browser does:
// the visible page (its console, errors and saved storage) and a separate
// copy with the same files and starting storage where the probe runs.
import { JSDOM, VirtualConsole } from 'jsdom';
import { buildPage } from './webPage';
import { prepareFiles } from './nodeJs';
import { TIPS } from './tips';

const openPage = (html, storage) => {
  const page = { lines: [], errors: [], saved: { ...storage }, waiting: new Map() };
  page.ready = new Promise((r) => { page.onReady = r; });
  page.dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://practice.local/',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      window.__practiceBridge = (msg) => {
        if (msg.type === 'console') page.lines.push({ level: msg.level, text: msg.text });
        if (msg.type === 'error') page.errors.push({ text: msg.text, file: msg.file, line: msg.line, tip: msg.tip });
        if (msg.type === 'storage') page.saved = msg.data;
        if (msg.type === 'ready') page.onReady();
        if (page.waiting.has(msg.id)) { page.waiting.get(msg.id)(msg); page.waiting.delete(msg.id); }
      };
    },
  });
  return page;
};

export const runWebPage = async ({ files, storage = {}, web = {}, probe, timeout = 8000 }) => {
  const prepared = await prepareFiles(files);
  const build = (role) => buildPage({ files, compiled: prepared.files, lineMaps: prepared.lineMaps, storage, web, tips: TIPS, role }).html;
  const timer = (ms) => new Promise((r) => setTimeout(() => r(null), ms));
  const view = openPage(build('view'), storage);
  const check = probe ? openPage(build('probe'), storage) : null;
  try {
    const loaded = !!(await Promise.race([view.ready.then(() => true), timer(timeout)]));
    let probeResult;
    if (check && loaded && await Promise.race([check.ready.then(() => true), timer(timeout)])) {
      const answer = new Promise((r) => check.waiting.set(1, r));
      check.dom.window.__practiceHandle({ type: 'probe', id: 1, body: probe });
      probeResult = await Promise.race([answer, timer(timeout)]);
    }
    return {
      // Errors the check ran into count too: a click handler that throws is a bug
      result: { console: view.lines, errors: [...view.errors, ...(check ? check.errors.filter((e) => !view.errors.some((v) => v.text === e.text)) : [])], loaded },
      probe: probeResult?.value,
      probeError: probeResult ? probeResult.error : probe && loaded ? 'Timeout' : undefined,
      storage: view.saved,
      diagnostics: prepared.diagnostics,
    };
  } finally {
    view.dom.window.close();
    check?.dom.window.close();
  }
};
