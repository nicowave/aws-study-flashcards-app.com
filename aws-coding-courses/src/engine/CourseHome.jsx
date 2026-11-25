// A course site's home page: what you'll build, the tutorials, the price.
import React from 'react';
import { linkProps } from './router';
import { tutorialStats } from './progress';
import UnlockCard from './UnlockCard';
import Markdown from './Markdown';
import { useT } from './i18n';

const CourseHome = ({ course, progress, access, user, onSignIn }) => {
  const t = useT(course);
  const firstOpen = course.tutorials.find((t) => !tutorialStats(t, progress).complete && (t.free || access)) || course.tutorials[0];
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">{course.eyebrow}</p>
          <h1>{course.headline}</h1>
          <p className="lede">{course.lede}</p>
          <div className="hero-actions">
            <a className="btn big" {...linkProps(`/${firstOpen.slug}`)}>{Object.keys(progress.done).length ? t('home.continue') : t('home.startFree')}</a>
            <a className="btn big ghost" href="#tutorials">{t('home.seeInside')}</a>
          </div>
          <p className="hero-note">{course.heroNote}</p>
        </div>
        <pre className="hero-term" aria-hidden="true">{course.heroTerminal}</pre>
      </section>

      <section className="outcomes">
        <h2>{t('home.outcomes')}</h2>
        <ul>{course.outcomes.map((o) => <li key={o}><Markdown text={o} className="inline" /></li>)}</ul>
      </section>

      <section id="tutorials" className="tutorial-list">
        <h2>{t('home.tutorials')}</h2>
        <p className="section-lede">{t('home.tutorialsLede')}</p>
        <ol>
          {course.tutorials.map((tut) => {
            const stats = tutorialStats(tut, progress);
            const open = tut.free || access;
            return (
              <li key={tut.slug} className={`tut-card ${stats.complete ? 'complete' : ''}`}>
                <a {...linkProps(`/${tut.slug}`)}>
                  <span className="tut-num">{tut.number === 0 ? '0' : tut.number}</span>
                  <span className="tut-body">
                    <span className="tut-title">{tut.title}</span>
                    <span className="tut-situation">{tut.situation}</span>
                    <span className="tut-meta">
                      <span>{tut.level}</span><span>~{tut.hours} h</span>
                      {tut.free ? <span className="tag free">{t('home.free')}</span> : !access && <span className="tag lock">{t('home.locked')}</span>}
                      {stats.done > 0 && <span className="tag">{stats.complete ? t('home.finished') : t('home.stepsDone', stats.done, stats.total)}</span>}
                    </span>
                    <span className="tut-skills">{[...(tut.skills || []), ...(tut.aws || [])].join(' · ')}</span>
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
            <h2>{t('home.fullCourse')}</h2>
            <p className="section-lede">{course.pricingLede}</p>
          </div>
          <UnlockCard course={course} user={user} onSignIn={onSignIn} returnPath="/" />
        </section>
      )}

      <section className="faq">
        <h2>{t('home.questions')}</h2>
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
