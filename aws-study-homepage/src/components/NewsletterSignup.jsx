import React, { useState } from 'react';
import { MailIcon } from './Icons';
import { subscribeNewsletter, track } from '../services/leads';
import './NewsletterSignup.css';

// Weekly newsletter sign-up (homepage). Issues are written in newsletter/
// and sent by aws-backend/lambda/api/newsletter.js.
const DONE_KEY = 'awsHub_newsletter';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // bots fill this in
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
  });
  const [already, setAlready] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await subscribeNewsletter({ email: email.trim(), website });
      setAlready(!!res.already);
      setDone(true);
      try { localStorage.setItem(DONE_KEY, '1'); } catch { /* storage blocked */ }
      track('newsletter_signup', { site: 'hub' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="newsletter" className="newsletter-section">
      <div className="newsletter-card">
        <div className="newsletter-eyebrow mono"><MailIcon size={14} /> Free weekly email</div>
        {done ? (
          <>
            <h2 className="newsletter-title">{already ? "You're already on the list" : "You're on the list"}</h2>
            <p className="newsletter-lede">
              {already
                ? 'Your weekly study email keeps coming every Tuesday.'
                : 'Check your inbox for a welcome email. The first study email arrives on Tuesday.'}
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="newsletter-title">One AWS study email a week</h2>
            <p className="newsletter-lede">
              Every Tuesday: an exam trap people fall for, one service explained in plain English, and what's new here.
              Short enough to read over coffee.
            </p>
            <label htmlFor="newsletter-email" className="sr-only">Email</label>
            <div className="newsletter-row">
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Signing up…' : 'Sign me up'}
              </button>
            </div>
            <input
              className="newsletter-hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            {error && <p className="newsletter-error" role="alert">{error}</p>}
            <p className="newsletter-fine">
              From Nico at AWS Study Hub. Unsubscribe any time. <a href="/privacy.html">Privacy</a>
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSignup;
