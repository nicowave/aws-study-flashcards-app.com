// Runs the practice Python off the page's main thread, so a long loop can't
// freeze the page (the page stops this worker after a time limit instead).
import { installPractice, PYODIDE_CDN } from './runtime';

let ready = null;

const boot = async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);
  const pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
  return installPractice(pyodide);
};

self.onmessage = async ({ data: { id, request } }) => {
  try {
    ready = ready || boot();
    const handle = await ready;
    self.postMessage({ id, response: request.op === 'boot' ? { ok: true } : handle(request) });
  } catch (e) {
    ready = null;
    self.postMessage({ id, error: String(e?.message || e) });
  }
};
