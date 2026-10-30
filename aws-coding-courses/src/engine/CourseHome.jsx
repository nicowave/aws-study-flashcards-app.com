// A course site's home page: what you'll build, the tutorials, the price.
import React from 'react';
import { linkProps } from './router';
import { tutorialStats } from './progress';
import UnlockCard from './UnlockCard';
import Markdown from './Markdown';

const CourseHome = ({ course, progress, access, user, onSignIn }) => {
  const firstOpen = course.tutorials.find((t) => !tutorialStats(t, progress).complete && (t.free || access)) || course.tutorials[0];
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">{course.eyebrow}</p>
          <h1>{course.headline}</h1>
          <p className="lede">{course.lede}</p>
          <div className="hero-actions">
            <a className="btn big" {...linkProps(`/${firstOpen.slug}`)}>{Object.keys(progress.done).length ? 'Continue where you left off' : 'Start free'}</a>
            <a className="btn big ghost" href="#tutorials">See what's inside</a>
          </div>
          <p className="hero-note">{course.heroNote}</p>
        </div>
        <pre className="hero-term" aria-hidden="true">{course.heroTerminal}</pre>
      </section>

      <section className="outcomes">
        <h2>By the end, you can</h2>
        <ul>{course.outcomes.map((o) => <li key={o}><Markdown text={o} className="inline" /></li>)}</ul>
      </section>

      <section id="tutorials" className="tutorial-list">
        <h2>The tutorials</h2>
        <p className="section-lede">Each one starts with a task someone really gets asked to do at work. Read a little, try it in the practice terminal, check yourself, then build it for real on your own AWS account.</p>
        <ol>
          {course.tutorials.map((t) => {
            const stats = tutorialStats(t, progress);
            const open = t.free || access;
            return (
              <li key={t.slug} className={`tut-card ${stats.complete ? 'complete' : ''}`}>
                <a {...linkProps(`/${t.slug}`)}>
                  <span className="tut-num">{t.number === 0 ? '0' : t.number}</span>
                  <span className="tut-body">
                    <span className="tut-title">{t.title}</span>
                    <span className="tut-situation">{t.situation}</span>
                    <span className="tut-meta">
                      <span>{t.level}</span><span>~{t.hours} h</span>
                      {t.free ? <span className="tag free">Free</span> : !access && <span className="tag lock">🔒 In the full course</span>}
                      {stats.done > 0 && <span className="tag">{stats.complete ? '✓ Finished' : `${stats.done} of ${stats.total} steps`}</span>}
                    </span>
                    <span className="tut-skills">{[...(t.skills || []), ...(t.aws || [])].join(' · ')}</span>
                  </span>
                  <span className="tut-go" aria-hidden="true">{open ? '→' : '🔒'}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      {!access && (
        <section className="pricing" id="pricing">
          <div>
            <h2>The full course</h2>
            <p className="section-lede">{course.pricingLede}</p>
          </div>
          <UnlockCard course={course} user={user} onSignIn={onSignIn} returnPath="/" />
        </section>
      )}

      <section className="faq">
        <h2>Questions</h2>
        {course.faq.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <Markdown text={f.a} />
          </details>
        ))}
      </section>
    </div>
  );
};

export default CourseHome;
