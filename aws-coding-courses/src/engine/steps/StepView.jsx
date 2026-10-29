// One step of a tutorial. Every step can have text; the kind adds the rest:
//   read  — text (and an optional practice terminal to follow along)
//   try   — a task in the practice terminal, checked automatically
//   quiz  — multiple-choice questions
//   cards — flashcards
//   build — do it for real on your computer and AWS account, with a checklist
import React, { useCallback, useMemo, useRef, useState } from 'react';
import Markdown from '../Markdown';
import Terminal from '../Terminal';
import { Shell } from '../shell/shell';
import Editor from './Editor';
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

const runCheck = (step, shell, result) => {
  if (!step.check) return null;
  try {
    return step.check({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history });
  } catch {
    return false;
  }
};

const PracticeArea = ({ step, storageId, done, onDone, term }) => {
  const [resets, setResets] = useState(0);
  const shell = useMemo(() => new Shell(typeof step.scenario === 'function' ? step.scenario() : step.scenario), [step, resets]); // eslint-disable-line react-hooks/exhaustive-deps
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const onCommand = useCallback((result) => {
    const verdict = runCheck(step, shell, result);
    if (verdict === true) { setFeedback({ ok: true }); onDone(); }
    else if (typeof verdict === 'string') setFeedback({ ok: false, text: verdict });
  }, [step, shell, onDone]);

  const runFile = (file) => term.current?.run(file.runCommand || `bash ${file.path}`);

  return (
    <div className="practice">
      {step.task && (
        <div className={`task ${done || feedback?.ok ? 'passed' : ''}`}>
          <div className="task-head">
            <span className="task-label">{done || feedback?.ok ? '✓ Done' : 'Your task'}</span>
            <span className="task-tools">
              {step.hint && <button type="button" className="link-btn" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide hint' : 'Hint'}</button>}
              {step.solution && <button type="button" className="link-btn" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? 'Hide answer' : 'Show an answer'}</button>}
            </span>
          </div>
          <Markdown text={step.task} />
          {showHint && <div className="task-hint"><Markdown text={step.hint} /></div>}
          {showAnswer && (
            <div className="task-answer">
              {/* A whole-file answer is for the editor, so it gets Copy, not Run */}
              <Markdown text={'```' + (step.files ? step.files[0].path : 'bash') + '\n' + step.solution + '\n```'} onRun={(c) => term.current?.run(c)} />
            </div>
          )}
          {feedback && !feedback.ok && <div className="task-feedback">{feedback.text}</div>}
          {(done || feedback?.ok) && step.success && <div className="task-success"><Markdown text={step.success} /></div>}
        </div>
      )}
      {(step.files || []).map((f) => (
        <Editor key={`${f.path}-${resets}`} shell={shell} file={f} storageId={storageId} onRun={() => runFile(f)} />
      ))}
      <Terminal key={resets} ref={term} shell={shell} onCommand={onCommand} welcome={WELCOME} />
      <div className="practice-tools">
        <button type="button" className="link-btn" onClick={() => { setResets(resets + 1); setFeedback(null); }}>Reset the practice server</button>
      </div>
    </div>
  );
};

const StepView = ({ tutorial, step, progressKey, progress, actions, onNext, nextLabel }) => {
  const done = !!progress.done[progressKey];
  const markDone = useCallback(() => actions.markDone(progressKey), [actions, progressKey]);
  const termRef = useRef(null);
  const storageId = `${tutorial.slug}_${step.id}`;
  const hasPractice = !!step.scenario;

  // "Run" buttons in the text send commands to this step's terminal
  const onRun = useMemo(() => (hasPractice ? (code) => termRef.current?.run(code) : undefined), [hasPractice]);

  return (
    <article className={`step step-${step.kind}`}>
      <header className="step-head">
        <span className={`kind kind-${step.kind}`}>{{ read: 'Read', try: 'Try it', quiz: 'Check', cards: 'Flashcards', build: 'Build it' }[step.kind]}</span>
        <h2>{step.title}</h2>
        {step.minutes && <span className="step-time">{step.minutes} min</span>}
      </header>

      {step.body && <Markdown text={step.body} onRun={onRun} />}

      {hasPractice && (
        <PracticeArea step={step} storageId={storageId} done={done} onDone={markDone} term={termRef} />
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

      {step.after && <Markdown text={step.after} onRun={onRun} />}

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
