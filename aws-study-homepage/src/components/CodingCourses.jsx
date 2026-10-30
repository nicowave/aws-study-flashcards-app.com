// The Developer Path on the hub: four coding course sites, and the bundle.
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { startCheckout } from '../services/billing';
import { currentPromotion, salePrice } from '../services/offers';

export const COURSES = [
  { id: 'bash', title: 'Bash for AWS', url: 'https://bash.aws-study-flashcards-app.com', mark: '$_', color: '#89d185',
    blurb: 'Health checks, log digging, backups to Amazon S3 and one-command website deploys.', tutorials: 4, hours: 10 },
  { id: 'python', title: 'Python for AWS', url: 'https://python.aws-study-flashcards-app.com', mark: '>>>', color: '#7db6e4',
    blurb: 'Spreadsheet reports, the AWS bill, certificate alerts and an upload pipeline with Lambda and DynamoDB.', tutorials: 4, hours: 16 },
  { id: 'javascript', title: 'JavaScript for AWS', url: 'https://js.aws-study-flashcards-app.com', mark: 'JS', color: '#eed65a',
    blurb: 'Web pages, live dashboards, a serverless contact form and a study tracker with sign-in.', tutorials: 4, hours: 18 },
  { id: 'typescript', title: 'TypeScript for AWS', url: 'https://typescript.aws-study-flashcards-app.com', mark: 'TS', color: '#93a8f4',
    blurb: 'Bug-proof code, your own AWS command-line tool, and infrastructure as code with the Cloud Development Kit.', tutorials: 3, hours: 14 },
];
const COURSE_PRICE = '$19.99';
const BUNDLE_PRICE = '$59';

const Price = ({ price, percent }) => (percent ? (
  <><strong className="mono">{salePrice(price, percent)}</strong> <s className="mono price-was">{price}</s></>
) : <strong className="mono">{price}</strong>);

const CodingCourses = ({ onShowLogin }) => {
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sale = currentPromotion();
  const live = sale?.live ? sale.promo : null;

  const buyBundle = async () => {
    if (!isAuthenticated) { onShowLogin(); return; }
    setBusy(true);
    setError('');
    try {
      await startCheckout('developer-path');
    } catch (err) {
      console.error('[Courses] Checkout failed:', err);
      setError('Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section id="courses" className="certifications-section courses-section">
      <div className="section-header">
        <h2 className="section-title">The Developer Path</h2>
        <p className="section-subtitle">
          Four coding courses for IT people who have never scripted or built a web app, ending at the
          Developer Associate certification. Real tasks from real jobs, practiced in your browser, then built on
          your own AWS account. The first tutorial of every course is free.
        </p>
      </div>
      <div className="cert-grid">
        {COURSES.map((c) => (
          <a key={c.id} href={c.url} className="cert-card course-card">
            <div className="cert-card-header">
              <span className="cert-icon course-mark mono" style={{ background: `${c.color}22`, color: c.color }}>{c.mark}</span>
              <span className="cert-level" style={{ color: c.color }}>{c.tutorials} tutorials · about {c.hours} hours</span>
            </div>
            <h3 className="cert-name">{c.title}</h3>
            <p className="cert-description">{c.blurb}</p>
            <p className="cert-price">One-time unlock <Price price={COURSE_PRICE} percent={live?.single} /></p>
            <span className="course-go">Start free →</span>
          </a>
        ))}
      </div>
      <div className="bundle-card">
        <div>
          {live && <span className="sale-pill">{live.label}: {live.bundle}% off until {live.ends}</span>}
          <h3>All of it: the Developer Path bundle</h3>
          <p>All four courses plus the Developer Associate study game, for <Price price={BUNDLE_PRICE} percent={live?.bundle} /> once. $94.95 if bought one by one.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={buyBundle} disabled={busy}>
          {busy ? 'Redirecting…' : isAuthenticated ? 'Get the Developer Path' : 'Sign in to get it'}
        </button>
        {error && <p className="plan-error">{error}</p>}
      </div>
    </section>
  );
};

export const PromoBanner = () => {
  const sale = currentPromotion();
  if (!sale) return null;
  const { promo, live } = sale;
  const deal = `${promo.single}% off every course and certification, ${promo.bundle}% off the Developer Path bundle and Pro`;
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
