// Course site shell: header, routing, sign-in and course access.
// The course itself (text, tasks, quizzes) comes from @course, picked at
// build time: COURSE=bash npm run build.
import React, { useCallback, useEffect, useState } from 'react';
import course from '@course';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import { usePath, linkProps, navigate } from './engine/router';
import { useProgress } from './engine/progress';
import { hasCourseAccess } from './services/billing';
import CourseHome from './engine/CourseHome';
import TutorialPage from './engine/TutorialPage';

const HUB_URL = 'https://aws-study-flashcards-app.com';

const useCourseAccess = (user) => {
  const [access, setAccess] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let live = true;
    if (!user) { setAccess(false); return undefined; }
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout) window.history.replaceState(null, '', window.location.pathname);
    if (checkout === 'cancelled') setNotice({ kind: 'info', text: 'Checkout cancelled. Nothing was charged.' });

    (async () => {
      if (checkout !== 'success') {
        const ok = await hasCourseAccess(course.id);
        if (live) setAccess(ok);
        return;
      }
      // Stripe's webhook can take a few seconds; refresh the token until the purchase shows
      setNotice({ kind: 'info', text: 'Payment received. Unlocking your course…' });
      for (let attempt = 0; attempt < 8 && live; attempt++) {
        if (await hasCourseAccess(course.id, { forceRefresh: true })) {
          setAccess(true);
          setNotice({ kind: 'success', text: `Unlocked. Every ${course.language} tutorial is yours. Enjoy!` });
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (live) setNotice({ kind: 'info', text: 'Payment received. It can take a minute to unlock: refresh this page shortly.' });
    })();
    return () => { live = false; };
  }, [user]);

  // Local development only: add ?unlocked to the address to preview paid tutorials
  if (import.meta.env.DEV) {
    try {
      if (new URLSearchParams(window.location.search).has('unlocked')) sessionStorage.setItem('awsCourse_devUnlocked', '1');
      if (sessionStorage.getItem('awsCourse_devUnlocked')) return { access: true, notice, clearNotice: () => setNotice(null) };
    } catch { /* storage blocked */ }
  }
  return { access, notice, clearNotice: () => setNotice(null) };
};

const Header = ({ user, onSignIn, onSignOut }) => (
  <header className="site-header">
    <a className="brand" {...linkProps('/')}>
      <span className="brand-mark" aria-hidden="true">{course.mark}</span>
      <span className="brand-text">{course.title}<small>AWS Study Hub</small></span>
    </a>
    <nav>
      <a href="/#tutorials" className="nav-link hide-sm" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById('tutorials')?.scrollIntoView(), 0); }}>Tutorials</a>
      <a href={HUB_URL} className="nav-link hide-sm">Study Hub</a>
      {user ? (
        <span className="user-chip">
          <span className="avatar" aria-hidden="true">{(user.displayName || user.email || '?').charAt(0).toUpperCase()}</span>
          <span className="hide-sm">{user.displayName || user.email}</span>
          <button type="button" className="link-btn" onClick={onSignOut}>Sign out</button>
        </span>
      ) : (
        <button type="button" className="btn small" onClick={() => onSignIn()}>Sign in</button>
      )}
    </nav>
  </header>
);

const Footer = () => (
  <footer className="site-footer">
    <div>
      <strong>More coding courses</strong>
      <ul>
        {course.siblings.map((s) => (
          <li key={s.url}>{s.live ? <a href={s.url}>{s.title}</a> : <span>{s.title} <em>(coming soon)</em></span>}</li>
        ))}
      </ul>
    </div>
    <div>
      <strong>Certification games</strong>
      <ul>
        <li><a href="https://developer.aws-study-flashcards-app.com">Developer Associate</a></li>
        <li><a href="https://cloud.aws-study-flashcards-app.com">Cloud Practitioner</a></li>
        <li><a href={HUB_URL}>All of AWS Study Hub</a></li>
      </ul>
    </div>
    <p className="fine">© {new Date().getFullYear()} Nico Tek Solutions. Not affiliated with Amazon Web Services. AWS is a trademark of Amazon.com, Inc.</p>
  </footer>
);

const Content = () => {
  const { user, logout, loading } = useAuth();
  const path = usePath();
  const [authNote, setAuthNote] = useState(null); // null = closed, string = open with a note
  const { progress, markDone, setQuiz, setChecklist } = useProgress(course.id, user);
  const { access, notice, clearNotice } = useCourseAccess(user);
  const actions = { markDone, setQuiz, setChecklist };

  const openSignIn = useCallback((note = '') => setAuthNote(note), []);
  useEffect(() => { if (user) setAuthNote(null); }, [user]);

  useEffect(() => {
    window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href });
  }, [path]);

  const [, slug, stepId] = path.split('/');
  const tutorial = slug ? course.tutorials.find((t) => t.slug === slug) : null;

  useEffect(() => {
    if (!slug) document.title = course.pageTitle;
    else if (!tutorial) document.title = `Page not found · ${course.title}`;
  }, [slug, tutorial]);

  if (authNote !== null && !user) {
    return (
      <div className="auth-wrap">
        <button type="button" className="auth-back" onClick={() => setAuthNote(null)}>← Back to {course.title}</button>
        {authNote && <p className="auth-note">{authNote}</p>}
        <AuthScreen />
      </div>
    );
  }

  return (
    <div className="site" style={{ '--accent': course.accent }}>
      <Header user={user} onSignIn={openSignIn} onSignOut={logout} />
      {notice && (
        <div className={`notice ${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button type="button" className="link-btn" onClick={clearNotice} aria-label="Dismiss">✕</button>
        </div>
      )}
      <div className="page">
        {!slug && <CourseHome course={course} progress={progress} access={access} user={user} onSignIn={openSignIn} />}
        {tutorial && (
          <TutorialPage course={course} tutorial={tutorial} stepId={stepId} progress={progress} actions={actions} access={access} user={user} onSignIn={openSignIn} />
        )}
        {slug && !tutorial && (
          <div className="not-found">
            <h1>That page isn't here</h1>
            <p><a {...linkProps('/')}>Go to {course.title}</a></p>
          </div>
        )}
      </div>
      <Footer />
      {loading && <span className="sr-only">Checking sign-in…</span>}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Content />
  </AuthProvider>
);

export default App;
