// A tutorial: step list on the side, the current step in the middle.
// Paid tutorials show their outline and the unlock card until bought.
import React, { useEffect } from 'react';
import { linkProps, navigate } from './router';
import { stepKey, tutorialStats } from './progress';
import StepView from './steps/StepView';
import UnlockCard from './UnlockCard';
import Markdown from './Markdown';

const KIND_ICON = { read: '📖', try: '⌨️', quiz: '✅', cards: '🃏', build: '🛠️' };

const TutorialPage = ({ course, tutorial, stepId, progress, actions, access, user, onSignIn }) => {
  const open = tutorial.free || access;
  const index = Math.max(0, tutorial.steps.findIndex((s) => s.id === stepId));
  const step = tutorial.steps[index];
  const stats = tutorialStats(tutorial, progress);
  const nextTutorial = course.tutorials[course.tutorials.indexOf(tutorial) + 1];

  useEffect(() => {
    document.title = `${open ? `${step.title} · ` : ''}${tutorial.title} · ${course.title}`;
  }, [open, step, tutorial, course]);

  // Unknown step in the address: go to the first one
  useEffect(() => {
    if (open && stepId && !tutorial.steps.some((s) => s.id === stepId)) navigate(`/${tutorial.slug}`, { replace: true });
  }, [open, stepId, tutorial]);

  if (!open) {
    return (
      <div className="tutorial locked">
        <a className="back" {...linkProps('/')}>← {course.title}</a>
        <header className="tutorial-head">
          <p className="eyebrow">Tutorial {tutorial.number} · {tutorial.level} · ~{tutorial.hours} h</p>
          <h1>{tutorial.title}</h1>
          <p className="situation">{tutorial.situation}</p>
        </header>
        <div className="locked-grid">
          <div>
            <h2>What you'll do</h2>
            <Markdown text={tutorial.overview} />
            <ol className="outline">
              {tutorial.steps.map((s) => <li key={s.id}><span>{KIND_ICON[s.kind]}</span> {s.title}</li>)}
            </ol>
          </div>
          <UnlockCard course={course} user={user} onSignIn={onSignIn} returnPath={`/${tutorial.slug}`} />
        </div>
      </div>
    );
  }

  const goTo = (i) => navigate(`/${tutorial.slug}/${tutorial.steps[i].id}`);
  const next = index < tutorial.steps.length - 1 ? () => goTo(index + 1) : nextTutorial ? () => navigate(`/${nextTutorial.slug}`) : null;
  const nextLabel = index < tutorial.steps.length - 1 ? tutorial.steps[index + 1].title : nextTutorial ? `Tutorial ${nextTutorial.number}: ${nextTutorial.title}` : '';

  return (
    <div className="tutorial">
      <aside className="steps-nav">
        <a className="back" {...linkProps('/')}>← {course.title}</a>
        <p className="eyebrow">{tutorial.number === 0 ? 'Before you begin' : `Tutorial ${tutorial.number}`}</p>
        <h1 className="steps-title">{tutorial.title}</h1>
        <div className="meter" aria-label={`${stats.done} of ${stats.total} steps done`}><span style={{ width: `${(stats.done / stats.total) * 100}%` }} /></div>
        <ol>
          {tutorial.steps.map((s, i) => {
            const done = !!progress.done[stepKey(tutorial, s)];
            return (
              <li key={s.id} className={`${i === index ? 'current' : ''} ${done ? 'done' : ''}`}>
                <a {...linkProps(`/${tutorial.slug}/${s.id}`)} aria-current={i === index ? 'step' : undefined}>
                  <span className="dot">{done ? '✓' : i + 1}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            );
          })}
        </ol>
        <label className="steps-select">
          <span>Step</span>
          <select value={step.id} onChange={(e) => navigate(`/${tutorial.slug}/${e.target.value}`)}>
            {tutorial.steps.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}{progress.done[stepKey(tutorial, s)] ? ' ✓' : ''}</option>)}
          </select>
        </label>
      </aside>
      <main className="step-main">
        {index === 0 && (
          <div className="situation-card">
            <span className="eyebrow">The situation</span>
            <p>{tutorial.situation}</p>
          </div>
        )}
        <StepView
          key={`${tutorial.slug}/${step.id}`}
          tutorial={tutorial}
          step={step}
          progressKey={stepKey(tutorial, step)}
          progress={progress}
          actions={actions}
          onNext={next}
          nextLabel={nextLabel}
        />
        {stats.complete && index === tutorial.steps.length - 1 && (
          <div className="finished">
            <h2>🎉 Tutorial finished</h2>
            <p>{nextTutorial ? `Up next: ${nextTutorial.title}.` : `That's the whole course. Well done.`}</p>
            {!nextTutorial && course.afterCourse && <Markdown text={course.afterCourse} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default TutorialPage;
