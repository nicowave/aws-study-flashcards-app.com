// One step of a tutorial. Every step can have text; the kind adds the rest:
//   read  — text (and an optional practice area to follow along)
//   try   — a task in the practice area, checked automatically
// The practice area comes from step.runtime: the shell (default), 'python',
// 'web' (a page preview) or 'node' (server-side JavaScript, like Lambda).
//   quiz  — multiple-choice questions
//   cards — flashcards
//   build — do it for real on your computer and AWS account, with a checklist
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Markdown from '../Markdown';
import Terminal from '../Terminal';
import PyConsole from '../PyConsole';
import { Shell } from '../shell/shell';
import { python, TimeLimitError } from '../python/session';
import Editor from './Editor';
import { TaskBox, useVerdict, scenarioOf, runLangFor } from './TaskBox';
import { WebPracticeArea, NodePracticeArea } from './JsPractice';
import Quiz from './Quiz';
import Cards from './Cards';
import Checklist from './Checklist';

const saveFile = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const WELCOME = 'Practice shell: a pretend Linux server in your browser. Nothing here touches your computer or a real AWS account.';

const ShellPracticeArea = forwardRef(({ step, storageId, done, onDone }, ref) => {
  const [resets, setResets] = useState(0);
  const shell = useMemo(() => new Shell(scenarioOf(step)), [step, resets]); // eslint-disable-line react-hooks/exhaustive-deps
  const term = useRef(null);
  const { feedback, setFeedback, judge, passed } = useVerdict(step, done, onDone);
  useImperativeHandle(ref, () => ({ run: (code) => term.current?.run(code) }), []);

  const onCommand = useCallback((result) => {
    judge({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history });
  }, [judge, shell]);

  const writers = useMemo(() => Object.fromEntries((step.files || []).map((f) => [f.path, (text) => {
    shell.fs.write(f.path, text);
    if (f.executable) shell.fs.node(f.path).mode = 0o755;
  }])), [step, shell]);

  return (
    <div className="practice">
      <TaskBox step={step} passed={passed} feedback={feedback} onRun={(c) => term.current?.run(c)} />
      {(step.files || []).map((f) => (
        <Editor key={`${f.path}-${resets}`} file={f} storageId={storageId} onChange={writers[f.path]}
          onRun={() => term.current?.run(f.runCommand || `bash ${f.path}`)} runLabel={f.runLabel || `Run bash ${f.path}`} />
      ))}
      <Terminal key={resets} ref={term} shell={shell} onCommand={onCommand} welcome={WELCOME} />
      <div className="practice-tools">
        <button type="button" className="link-btn" onClick={() => { setResets(resets + 1); setFeedback(null); }}>Reset the practice server</button>
      </div>
    </div>
  );
});

const PythonPracticeArea = forwardRef(({ step, storageId, done, onDone }, ref) => {
  const [resets, setResets] = useState(0);
  const [status, setStatus] = useState(python.status);
  const [busy, setBusy] = useState(false);
  const consoleRef = useRef(null);
  const texts = useRef({});
  const ready = useRef(null);
  const { feedback, setFeedback, judge, passed } = useVerdict(step, done, onDone);

  useEffect(() => python.onStatus(setStatus), []);
  useEffect(() => {
    ready.current = python.reset(scenarioOf(step));
    ready.current.catch(() => {});
  }, [step, resets]);

  const execute = useCallback(async (request, kind) => {
    setBusy(true);
    try {
      await ready.current;
      const result = await (kind === 'cell' ? python.cell(request) : python.run(request));
      consoleRef.current?.show(result.transcript);
      judge({ result, probe: result.probe?.value, probeError: result.probe?.error, files: result.files, aws: result.aws,
        web: result.web, kind, sources: { ...texts.current } });
    } catch (e) {
      consoleRef.current?.print('err', e instanceof TimeLimitError
        ? `Stopped: the program ran for more than ${python.timeLimit / 1000} seconds. Look for a loop that never ends. Python restarted, with the practice account and files back to the start.`
        : `Python stopped: ${e.message}. Reload the page if this keeps happening.`);
    } finally {
      setBusy(false);
      consoleRef.current?.focus();
    }
  }, [judge]);

  const runCell = useCallback((source) => {
    execute({ source, files: { ...texts.current }, probe: step.probe }, 'cell');
  }, [execute, step]);

  useImperativeHandle(ref, () => ({
    run: (code) => { if (busy) return; consoleRef.current?.echoCell(code); runCell(code); },
  }), [busy, runCell]);

  const runFile = (f) => {
    if (busy) return;
    consoleRef.current?.echoCommand(f.invoke ? `test ${f.path} with the sample event` : `python ${f.path}`);
    execute({ path: f.path, files: { ...texts.current }, probe: step.probe, invoke: f.invoke }, 'run');
  };

  const writers = useMemo(() => Object.fromEntries((step.files || []).map((f) => [f.path, (text) => { texts.current[f.path] = text; }])), [step]);

  return (
    <div className="practice">
      <TaskBox step={step} passed={passed} feedback={feedback} onRun={(c) => { if (!busy) { consoleRef.current?.echoCell(c); runCell(c); } }} />
      {(step.files || []).map((f) => (
        <Editor key={`${f.path}-${resets}`} file={f} storageId={storageId} onChange={writers[f.path]}
          onRun={() => runFile(f)} runLabel={f.runLabel || (f.invoke ? 'Test with the sample event' : `Run ${f.path}`)} />
      ))}
      <PyConsole key={resets} ref={consoleRef} onSubmit={runCell} busy={busy} status={status} />
      <div className="practice-tools">
        <button type="button" className="link-btn" onClick={() => { setResets(resets + 1); setFeedback(null); }}>Reset the practice account</button>
      </div>
    </div>
  );
});

const StepView = ({ tutorial, step, progressKey, progress, actions, onNext, nextLabel }) => {
  const done = !!progress.done[progressKey];
  const markDone = useCallback(() => actions.markDone(progressKey), [actions, progressKey]);
  const practiceRef = useRef(null);
  const storageId = `${tutorial.slug}_${step.id}`;
  const hasPractice = !!step.scenario;
  const PracticeArea = { python: PythonPracticeArea, web: WebPracticeArea, node: NodePracticeArea }[step.runtime] || ShellPracticeArea;
  const runLang = runLangFor(step);

  // "Run" buttons in the text send code to this step's terminal or console
  const onRun = useMemo(() => (hasPractice ? (code) => practiceRef.current?.run(code) : undefined), [hasPractice]);

  return (
    <article className={`step step-${step.kind}`}>
      <header className="step-head">
        <span className={`kind kind-${step.kind}`}>{{ read: 'Read', try: 'Try it', quiz: 'Check', cards: 'Flashcards', build: 'Build it' }[step.kind]}</span>
        <h2>{step.title}</h2>
        {step.minutes && <span className="step-time">{step.minutes} min</span>}
      </header>

      {step.body && <Markdown text={step.body} onRun={onRun} runLang={runLang} />}

      {hasPractice && (
        <PracticeArea key={step.id} ref={practiceRef} step={step} storageId={storageId} done={done} onDone={markDone} />
      )}

      {step.kind === 'quiz' && (
        <Quiz
          questions={step.questions}
          best={progress.quiz[progressKey]}
          onFinish={(score, total) => { actions.setQuiz(progressKey, score, total); markDone(); }}
        />
      )}

      {step.kind === 'cards' && <Cards cards={step.cards} onFinish={markDone} />}

      {step.kind === 'build' && step.checklist && (
        <Checklist
          items={step.checklist}
          checked={progress.checklist[progressKey] || []}
          onChange={(items) => {
            actions.setChecklist(progressKey, items);
            if (items.length === step.checklist.length) markDone();
          }}
        />
      )}

      {step.downloads && (
        <div className="downloads">
          {step.downloads.map((d) => (
            <button type="button" key={d.filename} className="btn ghost" onClick={() => saveFile(d.filename, d.content())}>⬇ {d.label}</button>
          ))}
        </div>
      )}

      {step.after && <Markdown text={step.after} onRun={onRun} runLang={runLang} />}

      <footer className="step-foot">
        {(step.kind === 'read' || (step.kind === 'build' && !step.checklist)) && !done ? (
          <button type="button" className="btn" onClick={() => { markDone(); onNext?.(); }}>{onNext ? `Done, next: ${nextLabel}` : 'Mark as done'}</button>
        ) : onNext ? (
          <button type="button" className={`btn ${done ? '' : 'ghost'}`} onClick={onNext}>{done ? `Next: ${nextLabel}` : `Skip to: ${nextLabel}`}</button>
        ) : null}
      </footer>
    </article>
  );
};

export default StepView;
