// Runs server-side JavaScript off the page's main thread; the page stops
// this worker if a run goes past its time limit.
import { createJsRunner } from './runner';

const runner = createJsRunner();
self.addEventListener('unhandledrejection', (e) => e.preventDefault()); // reported by the runner

self.onmessage = async ({ data: { id, request } }) => {
  try {
    const response = request.op === 'boot' ? { ok: true } : await runner[request.op](request);
    self.postMessage({ id, response });
  } catch (e) {
    self.postMessage({ id, error: String(e?.message || e) });
  }
};
