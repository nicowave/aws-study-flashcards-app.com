// Runs a 'web' step's page in jsdom for the tests: the same page, script
// and probe as the browser preview, with the bridge called directly.
import { JSDOM, VirtualConsole } from 'jsdom';
import { buildPage } from './webPage';
import { prepareFiles } from './nodeJs';
import { TIPS } from './tips';

export const runWebPage = async ({ files, storage = {}, web = {}, probe, timeout = 8000 }) => {
  const prepared = await prepareFiles(files);
  const { html } = buildPage({ files, compiled: prepared.files, lineMaps: prepared.lineMaps, storage, web, tips: TIPS });
  const lines = [];
  const errors = [];
  let saved = { ...storage };
  let onReady;
  const ready = new Promise((r) => { onReady = r; });
  const waiting = new Map();
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://practice.local/',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      window.__practiceBridge = (msg) => {
        if (msg.type === 'console') lines.push({ level: msg.level, text: msg.text });
        if (msg.type === 'error') errors.push({ text: msg.text, file: msg.file, line: msg.line, tip: msg.tip });
        if (msg.type === 'storage') saved = msg.data;
        if (msg.type === 'ready') onReady();
        if (waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
      };
    },
  });
  const timer = (ms) => new Promise((r) => setTimeout(() => r(null), ms));
  try {
    const loaded = await Promise.race([ready.then(() => true), timer(timeout)]);
    let probeResult;
    if (probe && loaded) {
      const answer = new Promise((r) => waiting.set(1, r));
      dom.window.__practiceHandle({ type: 'probe', id: 1, body: probe });
      probeResult = await Promise.race([answer, timer(timeout)]);
    }
    return {
      result: { console: lines, errors, loaded },
      probe: probeResult?.value,
      probeError: probeResult ? probeResult.error : probe && loaded ? 'Timeout' : undefined,
      storage: saved,
      diagnostics: prepared.diagnostics,
    };
  } finally {
    dom.window.close();
  }
};
