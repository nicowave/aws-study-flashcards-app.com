import React, { useState } from 'react';
import { API_BASE_URL } from '../config/auth.config';

// Weekly newsletter sign-up (menu and results screens). Same list as the
// hub's box; the backend is POST /v1/newsletter in aws-backend/lambda/api/leads.js.
const SITE = 'solutions-architect-associate';
const DONE_KEY = 'awsHub_newsletter';

const isDone = () => {
  try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
};

// Where this visit came from, if it was a tracked link
const source = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      utm_source: q.get('utm_source') || '',
      utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '',
      referrer: document.referrer && !document.referrer.includes('aws-study-flashcards-app.com') ? document.referrer : '',
    };
  } catch {
    return {};
  }
};

const NewsletterSignup = () => {
  const [hidden] = useState(isDone); // already signed up on this site
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // bots fill this in
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // 'new' | 'already'

  if (hidden) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/v1/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), site: SITE, website, source: source() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setResult(data.already ? 'already' : 'new');
      try { localStorage.setItem(DONE_KEY, '1'); } catch { /* storage blocked */ }
      try { if (typeof window.gtag === 'function') window.gtag('event', 'newsletter_signup', { site: SITE }); } catch { /* analytics blocked */ }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="newsletter-box" role="status">
        <p className="newsletter-box-title">{result === 'already' ? "You're already on the list" : "You're on the list"}</p>
        <p className="newsletter-box-text">
          {result === 'already' ? 'Your study email keeps coming every Tuesday.' : 'Check your inbox for a welcome email. The first study email arrives on Tuesday.'}
        </p>
      </div>
    );
  }

  return (
    <form className="newsletter-box" onSubmit={submit}>
      <p className="newsletter-box-title">📬 One AWS study email a week</p>
      <p className="newsletter-box-text">Every Tuesday: an exam trap, one service in plain English, and what's new. Free.</p>
      <div className="newsletter-box-row">
        <label htmlFor={`newsletter-${SITE}`} className="newsletter-box-sr">Email</label>
        <input
          id={`newsletter-${SITE}`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={busy}>{busy ? 'Signing up…' : 'Sign me up'}</button>
      </div>
      <input
        className="newsletter-box-hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {error && <p className="newsletter-box-error" role="alert">{error}</p>}
      <p className="newsletter-box-fine">
        Unsubscribe any time. <a href="https://aws-study-flashcards-app.com/privacy.html">Privacy</a>
      </p>
    </form>
  );
};

export default NewsletterSignup;
