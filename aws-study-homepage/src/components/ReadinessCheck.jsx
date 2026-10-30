import React, { useEffect, useRef, useState } from 'react';
import { submitReadiness, unsubscribe, track } from '../services/leads';
import { currentPromotion } from '../services/offers';
import { ArrowRightIcon, TargetIcon, MailIcon } from './Icons';
import './ReadinessCheck.css';

// The free "Am I ready?" check: 10 questions from the certification's own
// game, then an email for the score and a 7-day study plan.
const CERTS = [
  { id: 'cloud-practitioner', name: 'Cloud Practitioner', level: 'Foundational', url: 'https://cloud.aws-study-flashcards-app.com' },
  { id: 'ai-practitioner', name: 'AI Practitioner', level: 'Foundational', url: 'https://ai.aws-study-flashcards-app.com' },
  { id: 'solutions-architect-associate', name: 'Solutions Architect', level: 'Associate', url: 'https://architect.aws-study-flashcards-app.com' },
  { id: 'developer-associate', name: 'Developer', level: 'Associate', url: 'https://developer.aws-study-flashcards-app.com' },
];
const HUB = 'https://aws-study-flashcards-app.com';

const shuffleOptions = (q) => {
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
};

const verdictFor = (pct) => {
  if (pct >= 80) return { title: 'Close to ready', note: 'You know most of this. A full timed practice exam will tell you if you can hold it for 90 minutes.' };
  if (pct >= 60) return { title: 'Getting there', note: 'A solid base with a couple of gaps. One focused week on your weakest areas can make the difference.' };
  return { title: 'Early days', note: 'Plenty to learn, and that is normal at this stage. The study plan in your email starts with your weakest areas.' };
};

const byDomain = (questions, picks) => {
  const map = new Map();
  questions.forEach((q, i) => {
    const d = map.get(q.domain) || { name: q.domain, correct: 0, total: 0 };
    d.total += 1;
    if (picks[i] === q.answer) d.correct += 1;
    map.set(q.domain, d);
  });
  return [...map.values()];
};

const shareLinks = (cert, pct) => {
  const url = `${HUB}/?check=${cert.id}&utm_source=share&utm_medium=social&utm_campaign=readiness#readiness`;
  const text = `I scored ${pct}% on the free AWS ${cert.name} readiness check. Can you beat it?`;
  return {
    url,
    text,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  };
};

const UnsubscribeNotice = () => {
  const [state, setState] = useState(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const email = q.get('unsubscribe');
    const token = q.get('t');
    if (!email || !token) return;
    setState({ status: 'working' });
    unsubscribe(email, token)
      .then(() => setState({ status: 'done', email }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, []);
  if (!state) return null;
  return (
    <div className={`readiness-unsub ${state.status}`} role="status">
      {state.status === 'working' && 'Unsubscribing…'}
      {state.status === 'done' && <>Done. <strong>{state.email}</strong> won't get any more study emails.</>}
      {state.status === 'error' && state.message}
    </div>
  );
};

const ReadinessCheck = () => {
  const [step, setStep] = useState('pick'); // pick | quiz | email | result
  const [cert, setCert] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState([]);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef(null);

  // Bring the check into view below the sticky header (tall on phones)
  const scrollToCheck = () => {
    const el = sectionRef.current;
    if (!el) return;
    const header = document.querySelector('header');
    const offset = header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  };

  const start = async (c) => {
    setError('');
    const { READINESS_QUESTIONS } = await import('../data/readiness.js');
    setCert(c);
    // Mix the domains like the real exam does
    const mixed = READINESS_QUESTIONS[c.id].map((q) => [Math.random(), shuffleOptions(q)]);
    setQuestions(mixed.sort((a, b) => a[0] - b[0]).map(([, q]) => q));
    setPicks([]);
    setIndex(0);
    setStep('quiz');
    track('readiness_start', { cert: c.id });
    // After the page has laid out (matters when a shared link opens the check)
    setTimeout(scrollToCheck, 150);
  };

  // ?check=<cert id> (from shared scores) opens the check for that cert;
  // #readiness links (the hero button) land below the sticky header
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('check');
    const c = CERTS.find((x) => x.id === id);
    if (c) start(c);
    else if (window.location.hash === '#readiness') setTimeout(scrollToCheck, 300);
    const onHash = () => window.location.hash === '#readiness' && setTimeout(scrollToCheck, 0);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (i) => {
    const next = [...picks];
    next[index] = i;
    setPicks(next);
  };

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setStep('email');
      track('readiness_complete', { cert: cert.id });
    }
  };

  const score = questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const domains = byDomain(questions, picks);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitReadiness({ email: email.trim(), certId: cert.id, score, total: questions.length, domains, website });
      track('generate_lead', { cert: cert.id, score: pct });
      setStep('result');
      scrollToCheck();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
    track('share', { method: 'copy', content_type: 'readiness', item_id: cert.id });
  };

  const sale = currentPromotion();
  const q = questions[index];

  return (
    <section className="readiness-section" id="readiness" ref={sectionRef}>
      <UnsubscribeNotice />
      <div className="readiness-card">
        {step === 'pick' && (
          <>
            <div className="readiness-eyebrow mono"><TargetIcon size={14} /> Free · 10 questions · about 5 minutes</div>
            <h2 className="readiness-title">Am I ready for the exam?</h2>
            <p className="readiness-lede">
              Ten real exam-style questions, weighted like the real exam's domains. At the end, enter your email to get
              your score, your weakest areas and a 7-day study plan.
            </p>
            <div className="readiness-certs">
              {CERTS.map((c) => (
                <button key={c.id} className="readiness-cert" onClick={() => start(c)}>
                  <span className="readiness-cert-level mono">{c.level}</span>
                  <span className="readiness-cert-name">{c.name}</span>
                  <ArrowRightIcon size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'quiz' && q && (
          <>
            <div className="readiness-progress">
              <span className="mono">{cert.name} · Question {index + 1} of {questions.length}</span>
              <div className="readiness-bar"><div style={{ width: `${(index / questions.length) * 100}%` }} /></div>
            </div>
            <p className="readiness-domain mono">{q.domain}</p>
            <h3 className="readiness-question">{q.question}</h3>
            <div className="readiness-options" role="radiogroup">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={picks[index] === i}
                  className={`readiness-option ${picks[index] === i ? 'selected' : ''}`}
                  onClick={() => choose(i)}
                >
                  <span className="readiness-letter mono">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div className="readiness-nav">
              {index > 0 && <button className="btn btn-secondary" onClick={() => setIndex(index - 1)}>Back</button>}
              <button className="btn btn-primary" disabled={picks[index] === undefined} onClick={advance}>
                {index + 1 < questions.length ? 'Next' : 'See my score'} <ArrowRightIcon size={16} />
              </button>
            </div>
          </>
        )}

        {step === 'email' && (
          <form className="readiness-email" onSubmit={submit}>
            <div className="readiness-eyebrow mono"><MailIcon size={14} /> Your score is ready</div>
            <h2 className="readiness-title">Where should I send it?</h2>
            <p className="readiness-lede">
              You'll see your score here right away, and get it by email with a 7-day {cert.name} study plan built
              around your weakest areas. A few study tips may follow this week. Unsubscribe any time.
            </p>
            <label htmlFor="readiness-email" className="sr-only">Email</label>
            <div className="readiness-email-row">
              <input
                id="readiness-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Show my score'}
              </button>
            </div>
            {/* Hidden from people; bots fill it in */}
            <input
              className="readiness-hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            {error && <p className="readiness-error" role="alert">{error}</p>}
            <p className="readiness-fine">
              Sent by Nico at AWS Study Hub. <a href="/privacy.html">Privacy</a>
            </p>
          </form>
        )}

        {step === 'result' && (() => {
          const verdict = verdictFor(pct);
          const share = shareLinks(cert, pct);
          const studyUrl = `${cert.url}/?utm_source=readiness&utm_medium=web&utm_campaign=study-plan`;
          return (
            <div className="readiness-result">
              <div className="readiness-eyebrow mono">AWS {cert.name}</div>
              <div className="readiness-score">
                <span className="readiness-score-num mono">{score}<small>/{questions.length}</small></span>
                <div>
                  <h2 className="readiness-title">{verdict.title}</h2>
                  <p className="readiness-lede">{verdict.note}</p>
                </div>
              </div>
              <div className="readiness-domains">
                {domains.map((d) => {
                  const w = Math.round((d.correct / d.total) * 100);
                  return (
                    <div key={d.name} className="readiness-domain-row">
                      <span>{d.name}</span>
                      <span className="mono">{d.correct}/{d.total}</span>
                      <div className="readiness-bar"><div className={w >= 70 ? 'good' : w >= 50 ? 'mid' : 'low'} style={{ width: `${Math.max(w, 4)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <p className="readiness-sent">Your 7-day study plan is on its way to <strong>{email}</strong>.</p>

              <div className="readiness-next">
                <a href={studyUrl} className="btn btn-primary">Start studying {cert.name} <ArrowRightIcon size={16} /></a>
                {sale?.live && <span className="readiness-sale">{sale.promo.label}: {sale.promo.single}% off the full game until {sale.promo.ends}</span>}
              </div>

              <div className="readiness-share">
                <p className="readiness-share-label">Studying with friends? Challenge them:</p>
                <div className="readiness-share-buttons">
                  <a href={share.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => track('share', { method: 'linkedin', content_type: 'readiness', item_id: cert.id })}>LinkedIn</a>
                  <a href={share.x} target="_blank" rel="noopener noreferrer" onClick={() => track('share', { method: 'x', content_type: 'readiness', item_id: cert.id })}>X</a>
                  <button onClick={() => copyLink(`${share.text} ${share.url}`)}>{copied ? 'Copied' : 'Copy link'}</button>
                </div>
              </div>

              <details className="readiness-review">
                <summary>Review the 10 questions</summary>
                <ol>
                  {questions.map((item, i) => (
                    <li key={item.id} className={picks[i] === item.answer ? 'right' : 'wrong'}>
                      <p className="readiness-review-q">{item.question}</p>
                      <p className="readiness-review-a">
                        {picks[i] === item.answer ? 'Correct: ' : `You chose "${item.options[picks[i]]}". Answer: `}
                        <strong>{item.options[item.answer]}</strong>
                      </p>
                      <p className="readiness-review-x">{item.explanation}</p>
                    </li>
                  ))}
                </ol>
              </details>

              <button className="readiness-again" onClick={() => setStep('pick')}>Try another certification</button>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default ReadinessCheck;
