// The page's handle on the practice Python. One worker for the whole page:
// Python takes a few seconds to start the first time (about 10 MB, cached
// after that), so steps share it and each one resets it to its scenario.
const TIME_LIMIT_MS = 10000;

let worker = null;
let seq = 0;
const pending = new Map();
const listeners = new Set();
let status = 'idle'; // idle | starting | ready | failed
let lastScenario = null; // replayed after Python is restarted

const setStatus = (s) => { status = s; listeners.forEach((fn) => fn(s)); };

const startWorker = () => {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    clearTimeout(p.timer);
    if (data.error) p.reject(new Error(data.error));
    else p.resolve(data.response);
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(e.message || 'Python stopped')); }
    pending.clear();
    worker = null;
    setStatus('failed');
  };
};

export class TimeLimitError extends Error {}

const send = (request, timeLimit) => {
  if (!worker) startWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = timeLimit ? setTimeout(() => {
      // A loop that never ends: stop Python entirely and start fresh next time
      pending.delete(id);
      worker.terminate();
      worker = null;
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new TimeLimitError('stopped')); }
      pending.clear();
      setStatus('idle');
      reject(new TimeLimitError(`stopped after ${timeLimit / 1000} seconds`));
    }, timeLimit) : null;
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, request });
  });
};

export const python = {
  get status() { return status; },
  onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  async boot() {
    if (status === 'ready') return;
    setStatus('starting');
    try {
      await send({ op: 'boot' });
      setStatus('ready');
    } catch (e) {
      setStatus('failed');
      throw e;
    }
  },
  async reset(scenario) {
    lastScenario = scenario;
    await this.boot();
    return send({ op: 'reset', scenario });
  },
  // run a file: { path, files, probe, invoke }; a console snippet: { source, probe }
  async run(request) { await this.ensure(); return send({ op: 'run', ...request }, TIME_LIMIT_MS); },
  async cell(request) { await this.ensure(); return send({ op: 'cell', ...request }, TIME_LIMIT_MS); },
  // After a time-limit stop, Python starts over: load the step's scenario again
  async ensure() {
    if (worker && status === 'ready') return;
    await this.reset(lastScenario);
  },
  timeLimit: TIME_LIMIT_MS,
};
