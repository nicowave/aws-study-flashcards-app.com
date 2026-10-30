// The practice runner for server-side JavaScript and TypeScript: runs the
// learner's files as ES modules (like Node.js 22 on Lambda), as a script or
// as a Lambda invocation with a test event, plus a console that remembers
// variables between lines. Shared by the browser worker and the Node tests.
//
// Requests and results are plain objects:
//   reset({ scenario })               scenario: { aws, web, env }
//   run({ path, files, lineMaps, probe, invoke })
//   cell({ source, files })
// Files arrive as JavaScript (TypeScript is compiled first, see compiler.js).
import { linkModules, cellImports, SDK_URL, CDK_URL, ModuleError } from './modules';
import { inspect, formatArgs } from './inspect';
import { makeFakeFetch } from './fakeFetch';
import { TIPS } from './tips';

export { TIPS };

const AsyncFunction = (async () => {}).constructor;
const MAX_OUTPUT = 200000;

class ExitSignal {
  constructor(code) { this.code = code; }
}

const tipFor = (text) => TIPS.find(([re]) => re.test(text))?.[1];

// Node.js on Lambda has Buffer; a browser worker doesn't. Enough of it for
// request bodies: Buffer.from(text, 'base64' | 'utf8'), .toString('utf8' | 'base64').
class MiniBuffer extends Uint8Array {
  static from(value, encoding = 'utf8') {
    let bytes;
    if (typeof value === 'string') {
      bytes = encoding === 'base64'
        ? Uint8Array.from(atob(value.replace(/[^A-Za-z0-9+/=]/g, '')), (c) => c.charCodeAt(0))
        : new TextEncoder().encode(value);
    } else bytes = Uint8Array.from(value);
    const buf = new MiniBuffer(bytes.length);
    buf.set(bytes);
    return buf;
  }

  static byteLength(text) { return new TextEncoder().encode(String(text)).length; }

  static isBuffer(value) { return value instanceof MiniBuffer; }

  toString(encoding = 'utf8') {
    if (encoding === 'base64') {
      let binary = '';
      for (let i = 0; i < this.length; i += 0x8000) binary += String.fromCharCode(...this.subarray(i, i + 0x8000));
      return btoa(binary);
    }
    return new TextDecoder().decode(this);
  }
}
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = MiniBuffer;

export const createJsRunner = ({ importModule = (url) => import(/* @vite-ignore */ url) } = {}) => {
  let sdk = null;
  let cdk = null;
  let scenario = {};
  let transcript = [];
  let size = 0;
  let webLog = [];
  let lastFiles = {};
  let lineMaps = {};
  let scope = null;
  let pendingTimers = 0;
  let activity = 0;

  const proc = {
    env: {},
    argv: ['/usr/local/bin/node', '/var/task/index.mjs'],
    exitCode: undefined,
    platform: 'linux',
    version: 'v22.12.0',
    versions: { node: '22.12.0' },
    cwd: () => '/var/task',
    exit(code = 0) { throw new ExitSignal(code); },
    memoryUsage: () => ({ rss: 52428800, heapUsed: 8388608, heapTotal: 16777216 }),
  };
  globalThis.__practiceProcess = proc;

  const write = (stream, text) => {
    activity += 1;
    if (size > MAX_OUTPUT) return;
    size += text.length;
    if (size > MAX_OUTPUT) text = `${text.slice(0, Math.max(0, text.length - (size - MAX_OUTPUT)))}\n... (output cut off after 200,000 characters)\n`;
    const last = transcript[transcript.length - 1];
    if (last && last.stream === stream) last.text += text;
    else transcript.push({ stream, text });
  };
  const say = (stream, text) => write(stream, text.endsWith('\n') ? text : `${text}\n`);

  const makeConsole = () => {
    const counts = {};
    const timers = {};
    const line = (stream) => (...args) => say(stream, formatArgs(args));
    return {
      log: line('out'), info: line('out'), debug: line('out'), trace: line('err'), warn: line('err'), error: line('err'),
      dir: (v) => say('out', inspect(v, 1).replace(/^/, '')),
      table: (v) => say('out', inspect(v, 1)),
      assert: (ok, ...args) => { if (!ok) say('err', `Assertion failed${args.length ? `: ${formatArgs(args)}` : ''}`); },
      count: (label = 'default') => { counts[label] = (counts[label] || 0) + 1; say('out', `${label}: ${counts[label]}`); },
      time: (label = 'default') => { timers[label] = performance.now(); },
      timeEnd: (label = 'default') => { if (timers[label] !== undefined) say('out', `${label}: ${(performance.now() - timers[label]).toFixed(3)}ms`); delete timers[label]; },
      group: line('out'), groupEnd: () => {},
    };
  };

  // Timers the learner's code starts, so a run waits for them like Node does
  const timerApi = () => ({
    setTimeout: (fn, ms, ...args) => {
      pendingTimers += 1;
      const id = setTimeout(() => { pendingTimers -= 1; activity += 1; fn(...args); }, ms);
      return id;
    },
    clearTimeout: (id) => { if (id !== undefined) { clearTimeout(id); pendingTimers = Math.max(0, pendingTimers - 1); } },
  });

  const install = () => {
    const fetchFn = makeFakeFetch(scenario.web || {}, webLog, 0.1);
    const trackedFetch = (...args) => {
      activity += 1;
      pendingTimers += 1;
      const p = fetchFn(...args);
      p.finally(() => { pendingTimers -= 1; activity += 1; }).catch(() => {});
      return p;
    };
    globalThis.__practice = { console: makeConsole(), fetch: trackedFetch, process: proc, ...timerApi() };
    return globalThis.__practice;
  };

  // Wait for timers, fetches and AWS calls started by the code, like Node waits for its event loop
  const settle = async (limitMs) => {
    const start = Date.now();
    let quiet = 0;
    let seen = -1;
    while (Date.now() - start < limitMs) {
      await new Promise((r) => setTimeout(r, pendingTimers ? 5 : 0));
      const now = activity + (sdk ? sdk.state.calls.length : 0);
      if (pendingTimers === 0 && now === seen) quiet += 1;
      else quiet = 0;
      seen = now;
      if (quiet >= 4) return true;
    }
    return false;
  };

  const mapLine = (file, line) => {
    const map = lineMaps[file];
    return map && map[line - 1] !== undefined ? map[line - 1] + 1 : line;
  };

  // "TypeError: x (index.mjs:3:12)" with only the learner's own frames
  const report = (e, label = '') => {
    if (e instanceof ExitSignal) return null;
    if (!(e instanceof Error)) {
      say('err', `${label}Uncaught ${inspect(e, 1)}`);
      return { type: typeof e, message: String(e), line: null };
    }
    const fileNames = Object.keys(lastFiles).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const frameRe = fileNames ? new RegExp(`(${fileNames}|<console>):(\\d+):(\\d+)`) : null;
    let line = null;
    let file = null;
    const frames = [];
    for (const raw of String(e.stack || '').split('\n').slice(1)) {
      // A module's top-level frames show its data: URL; its sourceURL comment names the file
      const inline = raw.match(/data:text\/javascript\S*?sourceURL%3D([^%\s]+)%0A\S*?:(\d+):(\d+)\)?$/); // (encoded code can contain ")")
      const m = inline || (frameRe && raw.match(frameRe));
      if (!m) continue;
      const mapped = m[1] === '<console>' ? Number(m[2]) : mapLine(m[1], Number(m[2]));
      if (line === null) { line = mapped; file = m[1]; }
      const fn = raw.trim().replace(/^at\s+/, '').replace(/\s*\(?(data:|[\w./<>-]+:\d+:\d+).*$/, '');
      frames.push(`    at ${fn ? `${fn} ` : ''}(${m[1]}:${mapped}:${m[3]})`);
    }
    const head = e.$metadata
      ? `${e.name}: ${e.message}\n  $metadata: { httpStatusCode: ${e.$metadata.httpStatusCode}, requestId: '${e.$metadata.requestId}' }`
      : `${e.name}: ${e.message}`;
    say('err', `${label}${head}${frames.length ? `\n${frames.slice(0, 6).join('\n')}` : ''}`);
    const tip = e.$metadata
      ? 'AWS answered with an error. err.name says which (here ' + e.name + '): catch it with try/catch and decide what to do.'
      : e instanceof ModuleError ? null : tipFor(`${e.name}: ${e.message}`);
    if (tip) say('tip', `Tip: ${tip}`);
    return { type: e.name, message: e.message, line, file, aws: !!e.$metadata };
  };

  const load = async () => {
    sdk = sdk || await importModule(SDK_URL);
    cdk = cdk || await importModule(CDK_URL);
  };

  const begin = () => {
    transcript = [];
    size = 0;
    pendingTimers = 0;
  };

  const snapshot = () => {
    const last = cdk.practice.synths[cdk.practice.synths.length - 1];
    return {
      aws: sdk.snapshot(),
      web: { log: webLog.map((e) => ({ ...e })) },
      cdk: last ? { stacks: Object.fromEntries(last.stacks.map((s) => [s.stackName, s.template])) } : null,
    };
  };

  const finish = (result) => ({
    ...result,
    transcript,
    stdout: transcript.filter((c) => c.stream === 'out').map((c) => c.text).join(''),
    stderr: transcript.filter((c) => c.stream === 'err').map((c) => c.text).join(''),
    ...snapshot(),
  });

  const newScope = () => {
    const base = Object.create(null);
    const p = globalThis.__practice || install();
    Object.assign(base, { console: p.console, fetch: p.fetch, process: proc });
    return base;
  };

  const runProbe = async (body, mod) => {
    if (!body) return undefined;
    const saved = transcript;
    const savedSize = size;
    transcript = [];
    try {
      const fn = new AsyncFunction('mod', 'practice', body);
      const value = await Promise.race([
        fn(mod || {}, practiceHelper()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('The check timed out')), 8000)),
      ]);
      return { value: JSON.parse(JSON.stringify(value ?? null)) };
    } catch (e) {
      return { error: e?.name || 'Error', message: String(e?.message || e) };
    } finally {
      transcript = saved;
      size = savedSize;
    }
  };

  const practiceHelper = () => ({
    aws: () => sdk.snapshot(),
    state: sdk.state,
    resetAws: (aws) => sdk.reset(aws),
    web: scenario.web || {},
    webLog,
    setSite: (url, entry) => { (scenario.web = scenario.web || {})[url] = entry; },
    context: lambdaContext,
    apiEvent,
    cdk: () => snapshot().cdk,
    output: () => transcript.map((c) => c.text).join(''),
  });

  // An API Gateway HTTP API event (payload format 2.0), optionally signed in through Cognito
  const apiEvent = ({ method = 'GET', path = '/', body, headers = {}, query, pathParameters, claims, routeKey } = {}) => {
    const now = new Date();
    const qs = query ? new URLSearchParams(query).toString() : '';
    const event = {
      version: '2.0',
      routeKey: routeKey || `${method} ${path}`,
      rawPath: path,
      rawQueryString: qs,
      headers: { 'content-type': 'application/json', host: 'abc123.execute-api.us-east-1.amazonaws.com', 'user-agent': 'Mozilla/5.0', ...headers },
      requestContext: {
        accountId: scenario.aws?.account || '111122223333', apiId: 'abc123', domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
        http: { method, path, protocol: 'HTTP/1.1', sourceIp: '203.0.113.20', userAgent: 'Mozilla/5.0' },
        requestId: 'JKJaXmPLvHcESHA=', routeKey: routeKey || `${method} ${path}`, stage: '$default',
        time: now.toUTCString(), timeEpoch: now.getTime(),
      },
      isBase64Encoded: false,
    };
    if (query) event.queryStringParameters = { ...query };
    if (pathParameters) event.pathParameters = { ...pathParameters };
    if (body !== undefined) event.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (claims) {
      event.requestContext.authorizer = { jwt: { claims: { iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_EXAMPLE', token_use: 'id', ...claims }, scopes: null } };
    }
    return event;
  };

  const lambdaContext = (timeoutMs = 30000, name = 'practice-function') => {
    const started = Date.now();
    const id = globalThis.crypto.randomUUID();
    return {
      functionName: name,
      functionVersion: '$LATEST',
      invokedFunctionArn: `arn:aws:lambda:${scenario.aws?.region || 'us-east-1'}:${scenario.aws?.account || '111122223333'}:function:${name}`,
      memoryLimitInMB: '128',
      awsRequestId: id,
      logGroupName: `/aws/lambda/${name}`,
      logStreamName: `2026/10/30/[$LATEST]${id.replace(/-/g, '')}`,
      getRemainingTimeInMillis: () => Math.max(0, timeoutMs - (Date.now() - started)),
      callbackWaitsForEmptyEventLoop: true,
    };
  };

  const invokeHandler = async (mod, invoke) => {
    const name = invoke.handler || 'handler';
    const fn = mod?.[name];
    if (typeof fn !== 'function') {
      say('err', `Runtime.HandlerNotFound: index.${name} is undefined or not exported`);
      say('tip', `Tip: Lambda calls the function the file exports as "${name}": export const ${name} = async (event) => { ... }`);
      return { error: { type: 'Runtime.HandlerNotFound', message: `${name} is undefined or not exported` } };
    }
    const timeoutS = invoke.timeout || 3;
    const ctx = lambdaContext(timeoutS * 1000, invoke.function);
    const event = JSON.parse(JSON.stringify(invoke.event ?? {}));
    say('info', `START RequestId: ${ctx.awsRequestId} Version: $LATEST`);
    const started = performance.now();
    const out = {};
    const limit = Math.min(timeoutS * 1000, 8000);
    try {
      const response = await Promise.race([
        Promise.resolve().then(() => fn(event, ctx)),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(`Task timed out after ${timeoutS.toFixed(2)} seconds`), { name: 'Sandbox.Timedout' })), limit)),
      ]);
      try {
        const text = JSON.stringify(response === undefined ? null : response, null, 2);
        out.response = JSON.parse(text);
        out.text = text;
      } catch (e) {
        out.error = { type: 'Runtime.MarshalError', message: `Unable to marshal response: ${e.message}` };
      }
    } catch (e) {
      if (e?.name === 'Sandbox.Timedout') {
        say('err', e.message);
        out.error = { type: 'Sandbox.Timedout', message: e.message };
      } else {
        out.error = report(e, '') || { type: 'Error', message: 'exit' };
      }
    }
    const took = performance.now() - started;
    say('info', `END RequestId: ${ctx.awsRequestId}`);
    say('info', `REPORT RequestId: ${ctx.awsRequestId}\tDuration: ${took.toFixed(2)} ms\tBilled Duration: ${Math.ceil(took)} ms\tMemory Size: 128 MB`);
    if (out.error) say('info', `Response:\n${JSON.stringify({ errorType: out.error.type, errorMessage: out.error.message }, null, 2)}`);
    else say('info', `Response:\n${out.text}`);
    delete out.text;
    return out;
  };

  return {
    async reset({ scenario: next = {} } = {}) {
      await load();
      scenario = JSON.parse(JSON.stringify(next || {}));
      sdk.reset(scenario.aws || {});
      cdk.practice.reset();
      webLog = [];
      for (const k of Object.keys(proc.env)) delete proc.env[k];
      Object.assign(proc.env, { AWS_REGION: scenario.aws?.region || 'us-east-1', AWS_LAMBDA_FUNCTION_NAME: 'practice-function', ...(scenario.env || {}) });
      install();
      scope = newScope();
      lastFiles = {};
      return { ok: true };
    },

    async run({ path, files, lineMaps: maps = {}, probe, invoke }) {
      await load();
      begin();
      lastFiles = files;
      lineMaps = maps;
      install();
      cdk.practice.reset();
      let mod = null;
      let error = null;
      let exitCode = 0;
      try {
        mod = await importModule(linkModules(files).url(path));
      } catch (e) {
        if (e instanceof ExitSignal) exitCode = e.code;
        else { error = report(e); exitCode = 1; }
      }
      if (!error) {
        const settled = await settle(invoke ? 1000 : 7000);
        if (!settled && !invoke) say('info', '(still waiting on timers or requests after 7 seconds: stopped waiting)');
      }
      if (proc.exitCode !== undefined) { exitCode = proc.exitCode; proc.exitCode = undefined; }
      const result = { error, exitCode };
      if (mod && invoke) {
        result.invoke = await invokeHandler(mod, invoke);
        await settle(500);
      }
      if (!invoke && cdk.practice.synths.length) {
        for (const stack of cdk.practice.synths[cdk.practice.synths.length - 1].stacks) {
          say('info', `Synthesized stack ${stack.stackName} (CloudFormation template):\n${JSON.stringify(stack.template, null, 2)}`);
        }
      }
      result.probe = await runProbe(probe, mod);
      // The console can use what the file exported, as `mod` and by name
      scope = newScope();
      if (mod) { scope.mod = mod; Object.assign(scope, mod); }
      return finish(result);
    },

    async cell({ source, files = lastFiles, probe }) {
      await load();
      begin();
      if (!scope) scope = newScope();
      const p = globalThis.__practice;
      Object.assign(scope, { console: p.console, fetch: p.fetch });
      const proxy = new Proxy(scope, {
        has: (t, k) => typeof k === 'string' && !['__scope', '__import', 'arguments'].includes(k),
        get: (t, k) => {
          if (k === Symbol.unscopables) return undefined;
          if (k in t) return t[k];
          if (k in globalThis) {
            // Called through `with`, a global function's `this` would be the scope, and the
            // browser refuses (atob, setTimeout: "Illegal invocation"). Classes keep their statics.
            const v = globalThis[k];
            return typeof v === 'function' && /^[a-z]/.test(k) ? v.bind(globalThis) : v;
          }
          throw new ReferenceError(`${String(k)} is not defined`);
        },
        set: (t, k, v) => { t[k] = v; return true; },
      });
      let error = null;
      try {
        let code = cellImports(source, files);
        // Top-level declarations become console variables that last between lines
        code = code
          .replace(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm, '$1 =')
          .replace(/^(async\s+)?function\s*(\*?)\s*([A-Za-z_$][\w$]*)\s*\(/gm, (m, a, star, name) => `${name} = ${a || ''}function${star} ${name}(`)
          .replace(/^class\s+([A-Za-z_$][\w$]*)/gm, '$1 = class $1');
        let fn;
        try {
          fn = new AsyncFunction('__scope', '__import', `with (__scope) { return (${code}\n) }`);
        } catch {
          const lines = code.trimEnd().split('\n');
          const last = lines.pop();
          try {
            fn = new AsyncFunction('__scope', '__import', `with (__scope) { ${lines.join('\n')}\n; return (${last.replace(/;\s*$/, '')}\n) }`);
          } catch {
            fn = new AsyncFunction('__scope', '__import', `with (__scope) { ${code}\n }`);
          }
        }
        const value = await fn(proxy, importModule);
        await settle(3000);
        if (value !== undefined) say('out', inspect(value, typeof value === 'string' ? 1 : 0)); // strings in quotes, like Node's console
      } catch (e) {
        if (e instanceof ExitSignal) say('info', `(process.exit(${e.code}) ends a program; in the console it does nothing)`);
        else error = report(e, 'Uncaught ');
      }
      return finish({ error, exitCode: error ? 1 : 0, probe: await runProbe(probe, scope.mod) });
    },
  };
};
