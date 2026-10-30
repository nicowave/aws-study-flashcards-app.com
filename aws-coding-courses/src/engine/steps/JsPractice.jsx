// Practice areas for the JavaScript and TypeScript courses:
//   WebPracticeArea  — editors, a live page preview in a sandboxed frame, and
//                      a console that talks to the page (runtime: 'web')
//   NodePracticeArea — editors and a Node.js-style console, files run as
//                      scripts or as Lambda functions (runtime: 'node')
// .ts files are type-checked and compiled first; the errors show in the
// console and go to the step's check, but the code still runs.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PyConsole, { jsIncomplete } from '../PyConsole';
import Editor from './Editor';
import { TaskBox, useVerdict, scenarioOf, runLangFor } from './TaskBox';
import { jsRunner, tsCompiler, prepare, TimeLimitError } from '../js/session';
import { buildPage } from '../js/webPage';
import { guardLoops } from '../js/loopGuard';
import { TIPS } from '../js/tips';

const consoleText = (ts, where) => ({
  intro: ts
    ? `Practice TypeScript in your browser: type-checked in strict mode, then run ${where}. Nothing here touches your computer or a real AWS account.`
    : `Practice JavaScript in your browser, ${where}. Nothing here touches your computer or a real AWS account.`,
  starting: ts ? 'Loading the TypeScript compiler… The first time takes a few seconds, then your browser keeps it.' : null,
  failed: ts ? 'The TypeScript compiler couldn\'t load. Check your internet connection, then reload the page.' : 'The practice runner stopped. Reload the page.',
  hint: <>type {ts ? 'TypeScript' : 'JavaScript'} at <code>&gt;</code>, or press Run</>,
});

const showDiagnostics = (out, diagnostics) => {
  if (!diagnostics.length) return;
  for (const d of diagnostics.slice(0, 8)) {
    out?.print('err', d.text);
    if (d.tip) out?.print('tip', `Tip: ${d.tip}`);
  }
  if (diagnostics.length > 8) out?.print('err', `… and ${diagnostics.length - 8} more`);
  out?.print('info', `${diagnostics.length} type error${diagnostics.length === 1 ? '' : 's'}. The code still runs, but fix ${diagnostics.length === 1 ? 'it' : 'them'}: each is a bug waiting to happen.`);
};

// Files the learner doesn't edit (hidden: true) still go to the run
const useSources = (step) => {
  const texts = useRef({});
  useMemo(() => {
    texts.current = {};
    for (const f of step.files || []) if (f.hidden) texts.current[f.path] = f.starter ?? '';
  }, [step]);
  const writers = useMemo(() => Object.fromEntries((step.files || []).map((f) => [f.path, (text) => { texts.current[f.path] = text; }])), [step]);
  return { texts, writers };
};

const useStatus = (session) => {
  const [status, setStatus] = useState(session.status);
  useEffect(() => session.onStatus(setStatus), [session]);
  return status;
};

// Marks a page run in progress: if it's still there after a reload, that run froze the tab
const PAGE_LOAD = `${Date.now()}-${Math.random()}`;

// Resolves once the tab is in front (right away if it already is)
const visible = () => new Promise((resolve) => {
  if (typeof document === 'undefined' || !document.hidden) { resolve(); return; }
  const onChange = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', onChange); resolve(); } };
  document.addEventListener('visibilitychange', onChange);
});

// Top-level const/let in a console line would vanish after the line runs; var keeps them
const keepDeclarations = (code) => code.replace(/^(const|let)\s+(?=[A-Za-z_$])/gm, 'var ');

// ---------------------------------------------------------------------------

export const WebPracticeArea = forwardRef(({ step, storageId, done, onDone }, ref) => {
  const [resets, setResets] = useState(0);
  const [page, setPage] = useState(null);
  const [checkPage, setCheckPage] = useState(null); // hidden copy the check runs in
  const [busy, setBusy] = useState(false);
  const isTs = runLangFor(step) === 'ts';
  const tsStatus = useStatus(tsCompiler);
  const frame = useRef(null);
  const checkFrame = useRef(null);
  const out = useRef(null);
  const waiters = useRef(new Map());
  const log = useRef({ console: [], errors: [] });
  const seq = useRef(0);
  const latestRun = useRef(0);
  const { texts, writers } = useSources(step);
  const { feedback, setFeedback, judge, passed } = useVerdict(step, done, onDone);
  const scenario = useMemo(() => scenarioOf(step) || {}, [step, resets]); // eslint-disable-line react-hooks/exhaustive-deps

  // The page's localStorage lives here, so it survives Run and page reloads
  const storageKey = `awsCourse_webStorage_${storageId}`;
  const runningKey = `awsCourse_webRunning_${storageId}`;
  const storage = useRef(null);
  if (storage.current === null) {
    try { storage.current = JSON.parse(localStorage.getItem(storageKey) || 'null') ?? scenario.storage ?? {}; } catch { storage.current = scenario.storage ?? {}; }
  }

  useEffect(() => {
    const onMessage = (e) => {
      if (!e.data?.__practice) return;
      const msg = e.data;
      // The check's hidden copy: only its answers and errors matter, and it saves nothing
      if (checkFrame.current && e.source === checkFrame.current.contentWindow) {
        if (msg.type === 'error' && !log.current.errors.some((x) => x.text === msg.text)) {
          log.current.errors.push({ text: msg.text, file: msg.file, line: msg.line });
          out.current?.print('err', `While checking your page: ${msg.text}`);
          if (msg.tip) out.current?.print('tip', `Tip: ${msg.tip}`);
        }
        const key = msg.type === 'ready' ? `check-ready-${msg.runId}` : msg.id;
        if (waiters.current.has(key)) waiters.current.get(key)(msg);
        return;
      }
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      if (msg.type === 'console') {
        log.current.console.push({ level: msg.level, text: msg.text });
        out.current?.print(msg.level === 'error' || msg.level === 'warn' ? 'err' : 'out', msg.text);
      } else if (msg.type === 'error') {
        log.current.errors.push({ text: msg.text, file: msg.file, line: msg.line });
        out.current?.print('err', msg.text);
        if (msg.tip) out.current?.print('tip', `Tip: ${msg.tip}`);
      } else if (msg.type === 'storage') {
        storage.current = msg.data;
        try { localStorage.setItem(storageKey, JSON.stringify(msg.data)); } catch { /* private mode */ }
      }
      const key = msg.type === 'ready' ? `ready-${msg.runId}` : msg.id;
      if (waiters.current.has(key)) waiters.current.get(key)(msg);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [storageKey]);

  const waitFor = (key, ms) => new Promise((resolve) => {
    const t = setTimeout(() => { waiters.current.delete(key); resolve(null); }, ms);
    waiters.current.set(key, (msg) => { clearTimeout(t); waiters.current.delete(key); resolve(msg); });
  });
  const ask = (msg, ms, target = frame) => {
    seq.current += 1;
    const answer = waitFor(seq.current, ms);
    target.current?.contentWindow?.postMessage({ __practiceParent: true, ...msg, id: seq.current }, '*');
    return answer;
  };

  const run = useCallback(async ({ auto = false } = {}) => {
    latestRun.current += 1;
    const runId = latestRun.current;
    const stale = () => runId !== latestRun.current; // a newer run replaced this one
    setBusy(true);
    const sources = { ...texts.current };
    try {
      try { sessionStorage.setItem(runningKey, PAGE_LOAD); } catch { /* blocked */ }
      const prepared = await prepare(sources);
      if (stale()) return;
      showDiagnostics(out.current, prepared.diagnostics);
      // Both copies start from the same files and saved data
      const pageFor = (role) => buildPage({ files: sources, compiled: prepared.compiled, lineMaps: prepared.lineMaps, storage: storage.current, web: scenario.web || {}, tips: TIPS, runId, role }).html;
      const viewHtml = pageFor('view');
      const checkHtml = step.probe ? pageFor('probe') : null;
      log.current = { console: [], errors: [] };
      const ready = waitFor(`ready-${runId}`, 8000);
      setCheckPage(null);
      setPage({ html: viewHtml, id: runId });
      const loaded = !!(await ready);
      if (stale()) return;
      try { sessionStorage.removeItem(runningKey); } catch { /* blocked */ }
      if (!loaded) out.current?.print('err', 'The page didn\'t finish loading within 8 seconds. Is there a loop that never ends?');
      let probe = null;
      if (checkHtml && loaded) {
        // Browsers slow down timers in background tabs: check once the tab is in front
        await visible();
        if (stale()) return;
        const checkReady = waitFor(`check-ready-${runId}`, 8000);
        setCheckPage({ html: checkHtml, id: runId });
        if (await checkReady) {
          if (stale()) return;
          probe = await ask({ type: 'probe', body: step.probe }, 8000, checkFrame);
        }
        if (stale()) return;
        setCheckPage(null);
        if (!probe) out.current?.print('err', 'The check got no answer from the page within 8 seconds.');
      }
      judge({
        result: { console: log.current.console, errors: log.current.errors, loaded },
        probe: probe?.value, probeError: probe ? probe.error : step.probe ? 'Timeout' : undefined,
        files: sources, diagnostics: prepared.diagnostics, kind: 'run', sources,
      }, { quiet: auto });
    } catch (e) {
      out.current?.print('err', `Couldn't build the page: ${e.message}`);
    } finally {
      if (!stale()) setBusy(false);
    }
  }, [judge, runningKey, scenario, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show the page as soon as the step opens, unless the last run never finished
  useEffect(() => {
    let stuck = false;
    try {
      const mark = sessionStorage.getItem(runningKey);
      stuck = !!mark && mark !== PAGE_LOAD; // left by an earlier page load, not this one
    } catch { /* blocked */ }
    if (stuck) {
      try { sessionStorage.removeItem(runningKey); } catch { /* blocked */ }
      out.current?.print('err', 'The last run of this page never finished, so it didn\'t start again automatically. Look for a loop that never ends, fix it, then press Run.');
      return;
    }
    run({ auto: true });
  }, [resets]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluate = useCallback(async (source) => {
    if (!page) return;
    let code = source;
    try {
      if (isTs) code = await tsCompiler.transpile(source);
    } catch (e) {
      out.current?.print('err', e.message);
      return;
    }
    const answer = await ask({ type: 'eval', code: guardLoops(keepDeclarations(code), 'console') }, 5000);
    if (!answer) out.current?.print('err', 'No answer from the page. Is it still running?');
    else if (answer.error) {
      out.current?.print('err', answer.error);
      if (answer.tip) out.current?.print('tip', `Tip: ${answer.tip}`);
    } else if (answer.text !== null) out.current?.print('out', answer.text);
  }, [page, isTs]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({ run: (code) => { out.current?.echoCell(code); evaluate(code); } }), [evaluate]);

  const reset = () => {
    storage.current = scenario.storage ?? {};
    try { localStorage.removeItem(storageKey); } catch { /* private mode */ }
    out.current?.clear();
    setFeedback(null);
    setResets(resets + 1);
  };

  return (
    <div className="practice">
      <TaskBox step={step} passed={passed} feedback={feedback} onRun={(c) => { out.current?.echoCell(c); evaluate(c); }} />
      {(step.files || []).filter((f) => !f.hidden).map((f) => (
        <Editor key={`${f.path}-${resets}`} file={f} storageId={storageId} onChange={writers[f.path]} onRun={() => !busy && run()} runLabel={f.runLabel || 'Run the page'} />
      ))}
      <div className="web-preview">
        <div className="web-preview-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="web-preview-title">Page preview</span>
          <button type="button" className="code-btn run-code" onClick={() => !busy && run()}>{busy ? 'Running…' : '▶ Run'}</button>
        </div>
        {page && <iframe key={page.id} ref={frame} title="Page preview" sandbox="allow-scripts allow-modals allow-forms" srcDoc={page.html} />}
        {checkPage && <iframe key={`check-${checkPage.id}`} ref={checkFrame} className="web-check-frame" title="Page check" aria-hidden="true" tabIndex={-1} sandbox="allow-scripts allow-forms" srcDoc={checkPage.html} />}
      </div>
      <PyConsole
        ref={out} onSubmit={evaluate} busy={false} status={isTs ? tsStatus : 'ready'}
        label={isTs ? 'Page console (TypeScript)' : 'Page console'} prompt="> " more="… " incomplete={jsIncomplete}
        text={consoleText(isTs, 'as a web page')} inputLabel="Page console input"
      />
      <div className="practice-tools">
        <button type="button" className="link-btn" onClick={reset}>Start the page over (clears its saved data)</button>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------

export const NodePracticeArea = forwardRef(({ step, storageId, done, onDone }, ref) => {
  const [resets, setResets] = useState(0);
  const [busy, setBusy] = useState(false);
  const isTs = runLangFor(step) === 'ts';
  const tsStatus = useStatus(tsCompiler);
  const status = useStatus(jsRunner);
  const out = useRef(null);
  const ready = useRef(null);
  const lastFiles = useRef(null);
  const { texts, writers } = useSources(step);
  const { feedback, setFeedback, judge, passed } = useVerdict(step, done, onDone);

  useEffect(() => {
    ready.current = jsRunner.reset(scenarioOf(step) || {});
    ready.current.catch(() => {});
    lastFiles.current = null;
    if (isTs) tsCompiler.compile({}).catch(() => {}); // start loading the compiler now
  }, [step, resets, isTs]);

  const execute = useCallback(async (kind, request) => {
    setBusy(true);
    const sources = { ...texts.current };
    let diagnostics = [];
    try {
      await ready.current;
      let result;
      if (kind === 'run') {
        const prepared = await prepare(sources);
        diagnostics = prepared.diagnostics;
        showDiagnostics(out.current, diagnostics);
        lastFiles.current = prepared.files;
        result = await jsRunner.run({ ...request, files: prepared.files, lineMaps: prepared.lineMaps, probe: step.probe });
      } else {
        const code = isTs ? await tsCompiler.transpile(request.source) : request.source;
        if (!lastFiles.current && Object.keys(sources).length) lastFiles.current = (await prepare(sources)).files;
        result = await jsRunner.cell({ source: code, files: lastFiles.current || {}, probe: step.probe });
      }
      out.current?.show(result.transcript);
      judge({
        result, invoke: result.invoke, aws: result.aws, web: result.web, cdk: result.cdk,
        probe: result.probe?.value, probeError: result.probe?.error, files: sources, diagnostics, kind, sources,
      });
    } catch (e) {
      out.current?.print('err', e instanceof TimeLimitError
        ? `Stopped: the code ran for more than ${jsRunner.timeLimit / 1000} seconds. Look for a loop that never ends, or a promise that never settles. The practice account is back to the start.`
        : `The practice runner stopped: ${e.message}. Reload the page if this keeps happening.`);
    } finally {
      setBusy(false);
      out.current?.focus();
    }
  }, [judge, step, isTs]); // eslint-disable-line react-hooks/exhaustive-deps

  const runCell = useCallback((source) => execute('cell', { source }), [execute]);
  useImperativeHandle(ref, () => ({ run: (code) => { if (!busy) { out.current?.echoCell(code); runCell(code); } } }), [busy, runCell]);

  const runFile = (f) => {
    if (busy) return;
    out.current?.echoCommand(f.command || (f.invoke ? `test ${f.path} with the sample event` : f.path.endsWith('.ts') ? `npx tsx ${f.path}` : `node ${f.path}`));
    execute('run', { path: f.path, invoke: f.invoke });
  };

  return (
    <div className="practice">
      <TaskBox step={step} passed={passed} feedback={feedback} onRun={(c) => { if (!busy) { out.current?.echoCell(c); runCell(c); } }} />
      {(step.files || []).filter((f) => !f.hidden).map((f) => (
        <Editor key={`${f.path}-${resets}`} file={f} storageId={storageId} onChange={writers[f.path]} onRun={() => runFile(f)}
          runLabel={f.runLabel || (f.invoke ? 'Test with the sample event' : `Run ${f.path}`)} />
      ))}
      <PyConsole
        ref={out} onSubmit={runCell} busy={busy} status={isTs && tsStatus !== 'ready' ? tsStatus : status === 'failed' ? 'failed' : 'ready'}
        label={isTs ? 'Practice TypeScript (Node.js 22)' : 'Practice Node.js 22'} prompt="> " more="… " incomplete={jsIncomplete}
        text={consoleText(isTs, 'like Node.js 22 on AWS Lambda, with a pretend AWS account')} inputLabel="JavaScript console input"
      />
      <div className="practice-tools">
        <button type="button" className="link-btn" onClick={() => { setResets(resets + 1); setFeedback(null); out.current?.clear(); }}>Reset the practice account</button>
      </div>
    </div>
  );
});

