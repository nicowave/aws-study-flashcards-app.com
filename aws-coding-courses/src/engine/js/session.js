// The page's handles on the JavaScript runner and the TypeScript compiler,
// each in its own worker, shared by every step on the page (like Python's).
export class TimeLimitError extends Error {}

const workerSession = (create, { timeLimit } = {}) => {
  let worker = null;
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  let status = 'idle'; // idle | starting | ready | failed
  const setStatus = (s) => { status = s; listeners.forEach((fn) => fn(s)); };

  const start = () => {
    worker = create();
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
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(e.message || 'stopped')); }
      pending.clear();
      worker = null;
      setStatus('failed');
    };
  };

  const send = (request, limit) => {
    if (!worker) start();
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = limit ? setTimeout(() => {
        // Code that never finishes: stop the worker entirely and start fresh next time
        pending.delete(id);
        worker.terminate();
        worker = null;
        for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new TimeLimitError('stopped')); }
        pending.clear();
        setStatus('idle');
        reject(new TimeLimitError(`stopped after ${limit / 1000} seconds`));
      }, limit) : null;
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, request });
    });
  };

  return {
    get status() { return status; },
    onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async boot() {
      if (status === 'ready' && worker) return;
      setStatus('starting');
      try {
        await send({ op: 'boot' });
        setStatus('ready');
      } catch (e) {
        setStatus('failed');
        throw e;
      }
    },
    send,
    timeLimit,
  };
};

const runnerWorker = workerSession(() => new Worker(new URL('./nodeWorker.js', import.meta.url), { type: 'module' }), { timeLimit: 10000 });
let lastScenario = null; // replayed after the runner is restarted

export const jsRunner = {
  get status() { return runnerWorker.status; },
  onStatus: (fn) => runnerWorker.onStatus(fn),
  timeLimit: runnerWorker.timeLimit,
  async reset(scenario) {
    lastScenario = scenario;
    await runnerWorker.boot();
    return runnerWorker.send({ op: 'reset', scenario });
  },
  async ensure() {
    if (runnerWorker.status !== 'ready') await this.reset(lastScenario);
  },
  async run(request) { await this.ensure(); return runnerWorker.send({ op: 'run', ...request }, runnerWorker.timeLimit); },
  async cell(request) { await this.ensure(); return runnerWorker.send({ op: 'cell', ...request }, runnerWorker.timeLimit); },
};

const compilerWorker = workerSession(() => new Worker(new URL('./compilerWorker.js', import.meta.url), { type: 'module' }));

export const tsCompiler = {
  get status() { return compilerWorker.status; },
  onStatus: (fn) => compilerWorker.onStatus(fn),
  async compile(files) { await compilerWorker.boot(); return compilerWorker.send({ op: 'compile', files }); },
  async transpile(source) { await compilerWorker.boot(); return (await compilerWorker.send({ op: 'transpile', source })).code; },
};

/** Compile any .ts files: { files (with JavaScript for .ts paths), lineMaps, diagnostics }. */
export const prepare = async (sources) => {
  if (!Object.keys(sources).some((p) => p.endsWith('.ts'))) return { files: sources, compiled: {}, lineMaps: {}, diagnostics: [] };
  const { outputs, lineMaps, diagnostics } = await tsCompiler.compile(sources);
  return { files: { ...sources, ...outputs }, compiled: outputs, lineMaps, diagnostics };
};
