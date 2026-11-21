import React from 'react';
import { GIS_PAGE, GIS_WHY, GIS_COURSES, GIS_FOR, GIS_DISCLAIMER } from '../data/gis';
import { COURSES } from '../data/courses';
import { onThisName } from '../config/auth.config';
import { ArrowRightIcon, CodeIcon, CheckIcon } from './Icons';

// The GIS track page, served at /gis/ (gis/index.html). All courses are coming soon:
// no prices, no dates, no sign-up form yet (the hub newsletter is an AWS email).
const js = COURSES.find((c) => c.id === 'javascript');

const GisPage = () => {
  const { headline } = GIS_PAGE;
  return (
    <>
      <section className="hero gis-hero">
        <div className="hero-content">
          <div className="hero-badge hero-badge-soon">
            <span className="badge-text mono">{GIS_PAGE.eyebrow}</span>
          </div>
          <h1 className="hero-title">
            {headline.before}<span className="highlight">{headline.highlight}</span>{headline.after}
          </h1>
          <p className="hero-subtitle">{GIS_PAGE.lede}</p>
          <div className="hero-actions">
            <a href="#gis-courses" className="btn btn-primary">
              <ArrowRightIcon size={20} />
              See the GIS Courses
            </a>
            {js && (
              <a href={onThisName(js.url)} className="btn btn-secondary">
                <CodeIcon size={20} />
                Learn JavaScript for Web Maps Now
              </a>
            )}
          </div>
        </div>
        <div className="hero-glow"></div>
      </section>

      <section className="gis-section" aria-labelledby="gis-why-title">
        <h2 id="gis-why-title" className="section-title">Why GIS</h2>
        <div className="gis-why-grid">
          {GIS_WHY.map((w) => (
            <div key={w.title} className="gis-why-card">
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gis-courses" className="gis-section" aria-labelledby="gis-courses-title">
        <div className="section-header">
          <h2 id="gis-courses-title" className="section-title">The GIS Courses</h2>
          <p className="section-subtitle">Five courses, from your first map to a web map app. All are being built now.</p>
        </div>
        <ol className="gis-course-list">
          {GIS_COURSES.map((c, i) => (
            <li key={c.id} className="gis-course-card">
              <div className="gis-course-top">
                <span className="gis-course-num mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="gis-course-soon mono">Coming soon</span>
              </div>
              <h3 className="gis-course-title">{c.title}</h3>
              <p className="gis-course-level mono">{c.level}</p>
              <p className="gis-course-blurb">{c.blurb}</p>
              <p className="gis-course-tools">
                <span className="sr-only">Tools: </span>
                {c.tools.map((t) => <span key={t} className="gis-tool mono">{t}</span>)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="gis-section" aria-labelledby="gis-for-title">
        <h2 id="gis-for-title" className="section-title">Who It Is For</h2>
        <ul className="gis-for-list">
          {GIS_FOR.map((f) => (
            <li key={f}><CheckIcon size={18} /> <span>{f}</span></li>
          ))}
        </ul>
        <div className="gis-next">
          <p>While the GIS courses are built, you can start on the skills they use. Web maps run on JavaScript, and data work runs on Python.</p>
          <a href="/#courses" className="btn btn-secondary">
            <CodeIcon size={20} />
            See the Live Coding Courses
          </a>
        </div>
        <p className="gis-disclaimer">{GIS_DISCLAIMER}</p>
      </section>
    </>
  );
};

export default GisPage;
