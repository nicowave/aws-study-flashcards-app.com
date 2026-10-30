// Shared by every practice area: the task card (task, hint, answer,
// feedback) and the hook that runs a step's check.
import React, { useCallback, useState } from 'react';
import Markdown from '../Markdown';

export const scenarioOf = (step) => (typeof step.scenario === 'function' ? step.scenario() : step.scenario);

// Which code blocks get a Run button: ```bash, ```python, ```js or ```ts
export const runLangFor = (step) => {
  if (step.runtime === 'python') return 'python';
  if (step.runtime === 'web' || step.runtime === 'node') {
    return step.lang === 'ts' || (step.files || []).some((f) => f.path.endsWith('.ts')) ? 'ts' : 'js';
  }
  return 'bash';
};

export const TaskBox = ({ step, passed, feedback, onRun }) => {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  if (!step.task) return null;
  // A solution is code for the first file, or { path: code } for several files
  const answer = typeof step.solution === 'object'
    ? Object.entries(step.solution).map(([path, code]) => `\`\`\`${path}\n${code}\n\`\`\``).join('\n\n')
    : `\`\`\`${step.files ? step.files[0].path : runLangFor(step)}\n${step.solution}\n\`\`\``;
  return (
    <div className={`task ${passed ? 'passed' : ''}`}>
      <div className="task-head">
        <span className="task-label">{passed ? '✓ Done' : 'Your task'}</span>
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
          <Markdown text={answer} onRun={onRun} runLang={runLangFor(step)} />
        </div>
      )}
      {feedback && !feedback.ok && <div className="task-feedback">{feedback.text}</div>}
      {passed && step.success && <div className="task-success"><Markdown text={step.success} /></div>}
    </div>
  );
};

export const useVerdict = (step, done, onDone) => {
  const [feedback, setFeedback] = useState(null);
  // quiet: an automatic run (not the learner's) can pass a task but never nags
  const judge = useCallback((args, { quiet = false } = {}) => {
    if (!step.check) return;
    let verdict;
    try { verdict = step.check(args); } catch { verdict = false; }
    if (verdict === true) { setFeedback({ ok: true }); onDone(); }
    else if (typeof verdict === 'string' && !quiet) setFeedback({ ok: false, text: verdict });
  }, [step, onDone]);
  return { feedback, setFeedback, judge, passed: done || !!feedback?.ok };
};
