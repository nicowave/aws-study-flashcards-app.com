// The coding course sites on the hub. Each course is its own subscription (bought on its site);
// Pro covers all of them.
import React from 'react';
import { currentPromotion } from '../services/offers';
import { COURSES, OTHER_COURSES } from '../data/courses';
import { PRO_YEARLY, PRO_TRIAL_DAYS } from '../data/prices';
import { ProductPrice } from './Pricing';
import { onThisName } from '../config/auth.config';

export { COURSES, OTHER_COURSES };

const CodingCourses = () => {
  const sale = currentPromotion();
  const live = sale?.live ? sale.promo : null;
  const allCourses = COURSES.length + OTHER_COURSES.length;

  return (
    <section id="courses" className="certifications-section courses-section">
      <div className="section-header">
        <h2 className="section-title">Coding Courses</h2>
        <p className="section-subtitle">
          Four coding courses for IT people who have never scripted or built a web app, ending at the
          Developer Associate certification. Real tasks from real jobs, practiced in your browser, then built on
          your own AWS account. The first tutorial of every course is free.
        </p>
      </div>
      <div className="cert-grid">
        {COURSES.map((c) => (
          <a key={c.id} href={onThisName(c.url)} className="cert-card course-card">
            <div className="cert-card-header">
              <span className="cert-icon course-mark mono" style={{ background: `${c.color}22`, color: c.color }}>{c.mark}</span>
              <span className="cert-level" style={{ color: c.color }}>{c.tutorials} tutorials · about {c.hours} hours</span>
            </div>
            <h3 className="cert-name">{c.title}</h3>
            <p className="cert-description">{c.blurb}</p>
            <p className="cert-price"><ProductPrice percent={live?.single} /></p>
            <span className="course-go">Start free →</span>
          </a>
        ))}
      </div>
      <div className="courses-pro-card">
        <div>
          <h3>Every course and every certification: Pro</h3>
          <p>
            Pro unlocks all {allCourses} coding courses and every certification for <strong className="mono">{PRO_YEARLY}</strong> a
            year, with a {PRO_TRIAL_DAYS}-day free trial for first-time members. One course on its own is billed monthly or yearly on its site.
          </p>
        </div>
        <a href="#plans" className="btn btn-primary">See Pro</a>
      </div>
      {OTHER_COURSES.length > 0 && (
        <div className="other-courses">
          <h3 className="other-courses-title">More courses</h3>
          <div className="cert-grid">
            {OTHER_COURSES.map((c) => {
              const body = (
                <>
                  <div className="cert-card-header">
                    <span className="cert-icon course-mark mono" style={{ background: `${c.color}22`, color: c.color }}>{c.mark}</span>
                    <span className="cert-level" style={{ color: c.color }}>{c.modules} modules · about {c.hours} hours</span>
                  </div>
                  <h3 className="cert-name">{c.title}</h3>
                  <p className="cert-description">{c.blurb}</p>
                  <p className="cert-price"><ProductPrice percent={live?.single} /></p>
                  <p className="course-note">Included in Pro.</p>
                  <span className="course-go">{c.live ? 'Start free →' : 'Coming soon'}</span>
                </>
              );
              // Not live yet: a card, not a link, so nobody lands on a site that doesn't answer
              return c.live
                ? <a key={c.id} href={onThisName(c.url)} className="cert-card course-card">{body}</a>
                : <div key={c.id} className="cert-card course-card coming-soon" aria-label={`${c.title}, coming soon`}>{body}</div>;
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export const PromoBanner = () => {
  const sale = currentPromotion();
  if (!sale) return null;
  const { promo, live } = sale;
  const deal = `${promo.single}% off the first payment of every course and certification, ${promo.pro}% off your first year of Pro`;
  return (
    <div className="promo-banner" role="note">
      <span aria-hidden="true">🎃</span>
      {live
        ? <span><strong>{promo.label}:</strong> {deal}, until {promo.ends}. Applied at checkout.</span>
        : <span><strong>{promo.label}</strong> starts {promo.starts}: {deal}, for one week.</span>}
    </div>
  );
};

export default CodingCourses;
