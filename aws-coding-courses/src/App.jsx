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
import { currentPromotion } from './services/offers';
import { onThisName } from './config/auth.config';
import { LangProvider, useLang, useLocalized, useT } from './engine/i18n';

// Written with the old name; onThisName keeps a visitor on the name they opened.
const HUB_URL = onThisName('https://aws-study-flashcards-app.com');

const useCourseAccess = (user) => {
  const [access, setAccess] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let live = true;
    if (!user) { setAccess(false); return undefined; }
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout) window.history.replaceState(null, '', window.location.pathname);
    if (checkout === 'cancelled') setNotice({ kind: 'info', key: 'app.checkoutCancelled' });

    (async () => {
      if (checkout !== 'success') {
        const ok = await hasCourseAccess(course.id);
        if (live) setAccess(ok);
        return;
      }
      // Stripe's webhook can take a few seconds; refresh the token until the purchase shows
      setNotice({ kind: 'info', key: 'app.unlocking' });
      for (let attempt = 0; attempt < 8 && live; attempt++) {
        if (await hasCourseAccess(course.id, { forceRefresh: true })) {
          setAccess(true);
          setNotice({ kind: 'success', key: 'app.unlocked' });
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (live) setNotice({ kind: 'info', key: 'app.unlockSlow' });
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

// ES | EN switch, only on courses written in more than one language
const LangSwitch = ({ t }) => {
  const { lang, languages, setLang } = useLang();
  if (languages.length < 2) return null;
  return (
    <span className="lang-switch" role="group" aria-label={t('nav.language')}>
      {languages.map((l) => (
        <button type="button" key={l} lang={l} aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
      ))}
    </span>
  );
};

const Header = ({ course, t, user, onSignIn, onSignOut }) => (
  <header className="site-header">
    <a className="brand" {...linkProps('/')}>
      <span className="brand-mark" aria-hidden="true">{course.mark}</span>
      <span className="brand-text">{course.title}<small>Level Up Study Hub</small></span>
    </a>
    <nav>
      <a href="/#tutorials" className="nav-link hide-sm" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById('tutorials')?.scrollIntoView(), 0); }}>{t('nav.tutorials')}</a>
      <a href={HUB_URL} className="nav-link hide-sm">{t('nav.hub')}</a>
      <LangSwitch t={t} />
      {user ? (
        <span className="user-chip">
          <span className="avatar" aria-hidden="true">{(user.displayName || user.email || '?').charAt(0).toUpperCase()}</span>
          <span className="hide-sm">{user.displayName || user.email}</span>
          <button type="button" className="link-btn" onClick={onSignOut}>{t('nav.signOut')}</button>
        </span>
      ) : (
        <button type="button" className="btn small" onClick={() => onSignIn()}>{t('nav.signIn')}</button>
      )}
    </nav>
  </header>
);

// A sale about to start, or running: one line above every page
const PromoBanner = ({ access, t }) => {
  const sale = currentPromotion();
  if (!sale) return null;
  const { promo, live } = sale;
  const deal = t('promo.deal', promo.single, promo.bundle);
  return (
    <div className="promo-banner" role="note">
      <span aria-hidden="true">🎃</span>
      {live
        ? <span><strong>{promo.label}:</strong> {deal}, {t('promo.until', promo.ends)}</span>
        : <span><strong>{promo.label}</strong> {t('promo.starts', promo.starts)} {deal}, {t('promo.oneWeek')}</span>}
      {live && !access && <a href="/#pricing" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView(), 0); }}>{t('promo.seePrices')}</a>}
    </div>
  );
};

const Footer = ({ course, t }) => (
  <footer className="site-footer">
    <div>
      <strong>{t('footer.moreCourses')}</strong>
      <ul>
        {course.siblings.map((s) => (
          <li key={s.url}>{s.live ? <a href={onThisName(s.url)}>{s.title}</a> : <span>{s.title} <em>({t('footer.comingSoon')})</em></span>}</li>
        ))}
      </ul>
    </div>
    <div>
      <strong>{t('footer.games')}</strong>
      <ul>
        <li><a href={onThisName('https://developer.aws-study-flashcards-app.com')}>{t('footer.devAssociate')}</a></li>
        <li><a href={onThisName('https://cloud.aws-study-flashcards-app.com')}>{t('footer.cloudPractitioner')}</a></li>
        <li><a href={HUB_URL}>{t('footer.allHub')}</a></li>
      </ul>
    </div>
    <p className="fine">{t('footer.fine', new Date().getFullYear())}</p>
  </footer>
);

const Content = () => {
  const { user, logout, loading } = useAuth();
  const path = usePath();
  const localized = useLocalized(course);
  const t = useT(localized);
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
  const tutorial = slug ? localized.tutorials.find((x) => x.slug === slug) : null;

  useEffect(() => {
    if (!slug) document.title = localized.pageTitle;
    else if (!tutorial) document.title = t('app.pageNotFound', localized.title);
  }, [slug, tutorial, localized, t]);

  if (authNote !== null && !user) {
    return (
      <div className="auth-wrap">
        <button type="button" className="auth-back" onClick={() => setAuthNote(null)}>{t('app.backTo', localized.title)}</button>
        {authNote && <p className="auth-note">{authNote}</p>}
        <AuthScreen />
      </div>
    );
  }

  return (
    <div className="site" style={{ '--accent': course.accent }}>
      <PromoBanner access={access} t={t} />
      <Header course={localized} t={t} user={user} onSignIn={openSignIn} onSignOut={logout} />
      {notice && (
        <div className={`notice ${notice.kind}`} role="status">
          <span>{t(notice.key, localized.language)}</span>
          <button type="button" className="link-btn" onClick={clearNotice} aria-label={t('app.dismiss')}>✕</button>
        </div>
      )}
      <div className="page">
        {!slug && <CourseHome course={localized} progress={progress} access={access} user={user} onSignIn={openSignIn} />}
        {tutorial && (
          <TutorialPage course={localized} tutorial={tutorial} stepId={stepId} progress={progress} actions={actions} access={access} user={user} onSignIn={openSignIn} />
        )}
        {slug && !tutorial && (
          <div className="not-found">
            <h1>{t('app.notFoundTitle')}</h1>
            <p><a {...linkProps('/')}>{t('app.notFoundLink', localized.title)}</a></p>
          </div>
        )}
      </div>
      <Footer course={localized} t={t} />
      {loading && <span className="sr-only">{t('app.checkingSignIn')}</span>}
    </div>
  );
};

const App = () => (
  <LangProvider languages={course.languages} defaultLanguage={course.defaultLanguage}>
    <AuthProvider>
      <Content />
    </AuthProvider>
  </LangProvider>
);

export default App;
