// The TypeScript compiler, in its own worker: about 9 MB of JavaScript that
// takes a moment to load, so it loads once and never blocks the page.
import { createCompiler, loadLibs, TS_CDN } from './compiler';

let ready = null;

const boot = async () => {
  const text = await (await fetch(`${TS_CDN}typescript.js`)).text();
  const ts = new Function(`${text}\nreturn ts;`)(); // eslint-disable-line no-new-func
  const libs = await loadLibs(async (name) => {
    const res = await fetch(`${TS_CDN}${name}`);
    if (!res.ok) throw new Error(`Couldn't load ${name}`);
    return res.text();
  });
  return { ts, compiler: createCompiler(ts, libs) };
};

self.onmessage = async ({ data: { id, request } }) => {
  try {
    ready = ready || boot();
    const { ts, compiler } = await ready;
    let response;
    if (request.op === 'boot') response = { ok: true };
    else if (request.op === 'compile') response = compiler.compile(request.files);
    else if (request.op === 'transpile') {
      // Console lines: types removed, no checking
      response = { code: ts.transpileModule(request.source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText };
    }
    self.postMessage({ id, response });
  } catch (e) {
    ready = null;
    self.postMessage({ id, error: String(e?.message || e) });
  }
};
