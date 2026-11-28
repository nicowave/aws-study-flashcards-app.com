import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { certifications, categories } from './data/certifications';
import SettingsPage from './components/SettingsPage';
import ForgotPassword from './components/ForgotPassword';
import { applyAnalyticsPreference } from './services/analytics';
import { BILLING_ENABLED, PRO_TRIAL_DAYS, getPlan, getProTrialStatus, getBillingAccountStatus, startCheckout, openBillingPortal, portalErrorMessage } from './services/billing';
import { PRODUCT_PRICES, PRO_YEARLY, YEARLY_SAVINGS_PERCENT } from './data/prices';
import { ProductPrice, IntervalToggle } from './components/Pricing';
import CodingCourses, { COURSES, OTHER_COURSES, PromoBanner } from './components/CodingCourses';
import Faq from './components/Faq';
import { currentPromotion, salePrice } from './services/offers';
import ReadinessCheck from './components/ReadinessCheck';
import NewsletterSignup from './components/NewsletterSignup';
import HeroRotator from './components/HeroRotator';
import GisPage from './components/GisPage';
import { captureSource } from './services/leads';
import {
  isReturnVisit, tagEntry, saveScroll, savedScroll, jumpTo, watchVisitor, holdPlace, holdBrowserRestore,
  releaseBrowserRestore,
} from './services/scrollRestore';
import {
  CloudIcon,
  RobotIcon,
  SecurityIcon,
  GearIcon,
  PricingIcon,
  ArchitectureIcon,
  CodeIcon,
  ServerIcon,
  NetworkIcon,
  ShieldIcon,
  BookIcon,
  FlashcardIcon,
  GameIcon,
  SaveIcon,
  MobileIcon,
  GiftIcon,
  GraduationIcon,
  DocumentIcon,
  TargetIcon,
  ExternalLinkIcon,
  ClockIcon,
  ListIcon,
  ArrowRightIcon,
  MailIcon,
  KeyIcon,
  UserIcon
} from './components/Icons';
import { onThisName } from './config/auth.config';
import './styles/global.css';
import './styles/homepage.css';

// Apply analytics preference before components render
applyAnalyticsPreference();
// Remember which tracked link brought this visit (sent with readiness emails)
captureSource();
// On a reload or Back/Forward the hub puts the place back itself; keep the browser from trying first (see below)
holdBrowserRestore();

// /gis/ is its own page (gis/index.html) but the same app: header, footer and sign-in are shared.
// Read from the address bar each time, minus the site root ('/' or '/next/' for the test build),
// because a Google sign-in comes back to the root and then moves the address to the page it left from.
const BASE = import.meta.env.BASE_URL;
const pageNow = () => {
  const p = typeof window === 'undefined' ? '/' : window.location.pathname;
  return p.startsWith(BASE) ? `/${p.slice(BASE.length)}` : p;
};
const isGisPath = () => /^\/gis(\/|\/index\.html)?$/.test(pageNow());
// Re-renders when awsAuth.js moves the address after a Google sign-in ('hub:locationchange').
const useIsGisPage = () => {
  const [gis, setGis] = useState(isGisPath);
  useEffect(() => {
    const sync = () => setGis(isGisPath());
    window.addEventListener('hub:locationchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hub:locationchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  return gis;
};
// Home-page anchors need the site root in front when we are on another page.
const homeLink = (hash, onGis) => (onGis ? `${BASE}${hash}` : hash);

// Icon mapping for certifications
const certIconMap = {
  'cloud-practitioner': CloudIcon,
  'ai-practitioner': RobotIcon,
  'solutions-architect-associate': ArchitectureIcon,
  'developer-associate': CodeIcon,
  'sysops-administrator': GearIcon,
  'data-engineer-associate': ServerIcon,
  'machine-learning-engineer-associate': RobotIcon,
  'solutions-architect-professional': ArchitectureIcon,
  'devops-engineer-professional': GearIcon,
  'security-specialty': ShieldIcon,
  'machine-learning-specialty': RobotIcon,
  'database-specialty': ServerIcon,
  'advanced-networking-specialty': NetworkIcon,
  'sap-on-aws-specialty': ServerIcon
};

// Eye icons for password visibility
const EyeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// Header Component - Now handles both logged in and logged out states
const Header = ({ onShowLogin, onNavigateSettings, onGis = false }) => {
  const { user, userData, isAuthenticated, logout } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Avatar rendering
  const getAvatarContent = () => {
    const avatar = userData?.avatar;
    if (avatar) {
      if ((avatar.type === 'emoji') && avatar.value) {
        return { text: avatar.value, bgColor: avatar.bgColor || '#a78bfa', isImg: false };
      }
      if ((avatar.type === 'pattern' || avatar.type === 'image') && avatar.value) {
        return { imgSrc: avatar.value, bgColor: avatar.bgColor || '#a78bfa', isImg: true };
      }
      if (avatar.bgColor) {
        return { text: (displayName[0] || 'U').toUpperCase(), bgColor: avatar.bgColor, isImg: false };
      }
    }
    return { text: displayName ? displayName.slice(0, 2).toUpperCase() : 'U', bgColor: null, isImg: false };
  };

  const avatarInfo = getAvatarContent();

  const handleLogout = async () => {
    await logout();
  };

  // The header wraps onto one to three rows (more on phones and with long member names), so no fixed number can
  // say how much of the page it covers. Publish its real height for scroll-padding-top in global.css: in-page
  // jumps and keyboard focus then stop just below it instead of under it.
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    const el = headerRef.current;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--hub-header-height', `${el.getBoundingClientRect().height}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Firefox only moves the page for a newly focused control when none of it is visible, so a control half under the
  // header stays half hidden. And in a short window (a phone held sideways) a course card can be taller than the room
  // left under the header; Chrome and Firefox then leave its top under the header. When keyboard focus lands on the
  // page under the header (or close enough that its focus ring would be), bring the control out, from its top if it
  // cannot fit; scroll-padding makes it stop below the header. Clicks on links and buttons (not :focus-visible) and
  // the sign-in dialog are left alone; a clicked text field counts as :focus-visible, so a half-hidden one is brought
  // out too.
  useEffect(() => {
    const onFocusIn = (e) => {
      const target = e.target;
      const header = headerRef.current;
      if (!header || !target.closest || !target.closest('main, footer')) return;
      try { if (!target.matches(':focus-visible')) return; } catch { return; } // no :focus-visible: leave focus alone
      const box = target.getBoundingClientRect();
      const below = header.getBoundingClientRect().bottom;
      if (box.top >= below + 8) return; // 8 px: room for the widest focus ring here (2 px outline, 4 px apart)
      target.scrollIntoView({ block: box.height + 16 > window.innerHeight - below ? 'start' : 'nearest' });
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <div className="header-content">
        <div className="logo">
          {/* The Level Up Study Hub lockup. 28 px tall = one third of its 84-unit drawing, so its edges land on whole pixels.
              The animation lives in the SVG: the meter fills, then a spark sweeps across Study Hub, once per page load (WCAG 2.2.2: an img cannot be paused; still for reduced motion). */}
          <img src="/brand/level-up-study-hub-horizontal-reverse-animated.svg?v=5" alt="Level Up Study Hub" className="logo-lockup" width="268" height="28" />
        </div>
        <nav className="nav">
          <a href={homeLink('#certifications', onGis)} className="nav-link">Certifications</a>
          <a href={homeLink('#courses', onGis)} className="nav-link">Courses</a>
          <a href={homeLink('#about', onGis)} className="nav-link">About</a>
          <a href={homeLink('#plans', onGis)} className="nav-link">Plans</a>
          <a href={homeLink('#resources', onGis)} className="nav-link">Resources</a>
          <a
            href="https://aws.amazon.com/certification/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link external"
          >
            Official AWS Certs <ExternalLinkIcon size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          <div className="nav-divider" />

          {isAuthenticated ? (
            <div className="user-menu-header">
              <button
                className="settings-link-header"
                onClick={onNavigateSettings}
                title="Account Settings"
              >
                {avatarInfo.isImg ? (
                  <div
                    className="user-avatar-small"
                    style={avatarInfo.bgColor ? { background: avatarInfo.bgColor } : {}}
                  >
                    <img src={avatarInfo.imgSrc} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div
                    className="user-avatar-small"
                    style={avatarInfo.bgColor ? { background: avatarInfo.bgColor } : {}}
                  >
                    {avatarInfo.text}
                  </div>
                )}
                <span className="user-name-header" title={displayName}>{displayName}</span>
              </button>
              <button className="settings-icon-btn" onClick={onNavigateSettings} title="Settings">
                <GearIcon size={16} />
              </button>
              <button className="logout-btn-header" onClick={handleLogout}>Sign Out</button>
            </div>
          ) : (
            <button className="signin-btn-header" onClick={onShowLogin}>
              <UserIcon size={16} />
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

// User Stats Panel (shown inside hero-welcome for signed-in users)
// Reads from userData.progress — a map of certId -> game stats from the
// Firestore subcollection /users/{uid}/progress/{certId}
const UserStatsPanel = ({ userData }) => {
  // progress is a map like { 'ai-practitioner': { xp, level, totalAnswered, ... }, ... }
  const progress = userData?.progress || {};

  // If userData is missing entirely (guest or not loaded), don't show
  if (!userData || userData.isGuest) return null;

  // Get list of certs the user has actually played
  const certEntries = Object.entries(progress);
  if (certEntries.length === 0) return null;

  // Aggregate stats across all certs
  let totalXp = 0, totalAnswered = 0, totalCorrect = 0, maxStreak = 0, totalSessions = 0;
  for (const [, p] of certEntries) {
    totalXp += (p.xp || 0);
    totalAnswered += (p.totalAnswered || 0);
    totalCorrect += (p.totalCorrect || 0);
    maxStreak = Math.max(maxStreak, p.maxStreak || 0);
    totalSessions += (p.totalSessions || 0);
  }

  const XP_PER_LEVEL = 100;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const accuracy = totalAnswered > 0
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;

  // One card per live cert the learner has progress in. Built from the cert data (each game saves
  // progress under its cert id), so a new cert gets its card without touching this list.
  const certMeta = certifications
    .filter((c) => c.status === 'available')
    .map((c) => ({ id: c.id, name: c.name.replace(/^AWS Certified /, ''), icon: c.icon, color: c.color, url: onThisName(c.url) }));
  const activeCerts = certMeta.filter(cert => progress[cert.id]);

  return (
    <div className="user-stats-panel">
      <div className="user-stats-row">
        <div className="user-stat-item">
          <span className="user-stat-value mono">{level}</span>
          <span className="user-stat-label">Level</span>
        </div>
        <div className="user-stat-divider" />
        <div className="user-stat-item">
          <span className="user-stat-value mono">{totalXp.toLocaleString()}</span>
          <span className="user-stat-label">Total XP</span>
        </div>
        <div className="user-stat-divider" />
        <div className="user-stat-item">
          <span className="user-stat-value mono">{accuracy}%</span>
          <span className="user-stat-label">Accuracy</span>
        </div>
        <div className="user-stat-divider" />
        <div className="user-stat-item">
          <span className="user-stat-value mono">{maxStreak}</span>
          <span className="user-stat-label">Best Streak</span>
        </div>
        <div className="user-stat-divider" />
        <div className="user-stat-item">
          <span className="user-stat-value mono">{totalSessions}</span>
          <span className="user-stat-label">Sessions</span>
        </div>
      </div>

      {activeCerts.length > 0 && (
        <div className="user-cert-cards">
          {activeCerts.map(cert => {
            const cp = progress[cert.id];
            const certAccuracy = cp.totalAnswered > 0
              ? Math.round((cp.totalCorrect / cp.totalAnswered) * 100)
              : 0;
            const certLevel = cp.xp != null ? Math.floor((cp.xp || 0) / XP_PER_LEVEL) + 1 : (cp.level || 1);
            return (
              <a key={cert.id} href={cert.url} className="user-cert-card" style={{ borderColor: cert.color + '40' }}>
                <span className="cert-card-icon">{cert.icon}</span>
                <span className="cert-card-name">{cert.name}</span>
                <span className="cert-card-stat mono" style={{ color: cert.color }}>
                  Lvl {certLevel} · {certAccuracy}%
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Hero Section - Works for both authenticated and unauthenticated users
const Hero = () => {
  const { user, userData, isAuthenticated } = useAuth();

  return (
    <section className="hero">
      <div className="hero-content">
        {/* One headline per study track; the AWS one comes first and is the h1 */}
        <HeroRotator />
        {isAuthenticated && (
          <div className="hero-welcome">
            Welcome back, <strong>{user?.displayName || user?.email?.split('@')[0] || 'Learner'}</strong>! Ready to continue your AWS journey?
            <UserStatsPanel userData={userData} />
          </div>
        )}
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value mono">4</span>
            <span className="stat-label">Certifications Live</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value mono">950+</span>
            <span className="stat-label">Questions & Flashcards</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value mono">4</span>
            <span className="stat-label">Timed Exam Simulators</span>
          </div>
        </div>
      </div>
      <div className="hero-glow"></div>
    </section>
  );
};

// Certification Card
const CertCard = ({ cert }) => {
  const isAvailable = cert.status === 'available';
  const IconComponent = certIconMap[cert.id] || CloudIcon;

  return (
    <div className={`cert-card ${!isAvailable ? 'coming-soon' : ''}`}>
      {!isAvailable && <div className="coming-soon-badge">Coming Soon</div>}
      <div className="cert-card-header">
        <span className="cert-icon" style={{ background: `${cert.color}15`, color: cert.color }}>
          <IconComponent size={24} />
        </span>
        <span className="cert-level" style={{ color: cert.color }}>{cert.level}</span>
      </div>
      <h3 className="cert-name">{cert.name}</h3>
      <p className="cert-code mono">{cert.code}</p>
      <p className="cert-description">{cert.description}</p>

      {isAvailable && (
        <p className="cert-price">
          <ProductPrice percent={liveSale()?.single} />
        </p>
      )}

      <div className="cert-details">
        <span className="cert-detail">
          <ClockIcon size={14} />
          {cert.examLength}
        </span>
        <span className="cert-detail">
          <ListIcon size={14} />
          {cert.questions}
        </span>
      </div>

      <div className="cert-features">
        {cert.features.map((feature, idx) => (
          <span key={idx} className="feature-tag">{feature}</span>
        ))}
      </div>

      <div className="cert-actions">
        {isAvailable ? (
          <a href={onThisName(cert.url)} className="btn btn-card-primary">
            Start Free <ArrowRightIcon size={16} />
          </a>
        ) : (
          <button className="btn btn-card-disabled" disabled>
            Coming Soon
          </button>
        )}
        <a
          href={cert.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-card-secondary"
        >
          AWS Docs <ExternalLinkIcon size={14} />
        </a>
      </div>
    </div>
  );
};

// The sale running right now, if any (checkout applies its discount itself)
const liveSale = () => { const s = currentPromotion(); return s?.live ? s.promo : null; };

// Every coding course, live or coming soon: Pro includes them all
const courseCount = COURSES.length + OTHER_COURSES.length;

// Certifications Section
const Certifications = () => (
  <section id="certifications" className="certifications-section">
    <div className="section-header">
      <h2 className="section-title">AWS Certifications</h2>
      <p className="section-subtitle">
        Four certifications live today, from foundational to Associate level.
        Every live cert has a free preview — no account needed.
      </p>
    </div>

    {categories.map(category => {
      const certs = certifications.filter(c => c.category === category.id && c.status !== 'hidden');
      if (certs.length === 0) return null;
      return (
        <div key={category.id} className="category-group">
          <div className="category-header">
            <h3 className="category-title">{category.name}</h3>
            <p className="category-description">{category.description}</p>
          </div>
          <div className="cert-grid">
            {certs.map(cert => (
              <CertCard key={cert.id} cert={cert} />
            ))}
          </div>
        </div>
      );
    })}
  </section>
);

// About Section
const About = () => (
  <section id="about" className="about-section">
    <div className="about-content">
      <h2 className="section-title">Why Level Up Study Hub?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <TargetIcon size={32} />
          </div>
          <h3>Timed Exam Simulator</h3>
          <p>Full-length 65-question mocks with a 90-minute countdown, scored on the real 100–1000 scale against the 700 pass line, with a per-domain readiness breakdown.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <GameIcon size={32} />
          </div>
          <h3>Quiz Games</h3>
          <p>Gamified quizzes with XP, levels, streaks, and achievements. Every question comes with an explanation so wrong answers teach you something.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <FlashcardIcon size={32} />
          </div>
          <h3>Interactive Flashcards</h3>
          <p>Nearly 300 cards mapped to the official exam guides. Mark cards "Know It" or "Still Learning" and review your weak spots in one queue.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <BookIcon size={32} />
          </div>
          <h3>Study Guides</h3>
          <p>In-depth guides covering key concepts, AWS services, comparison tables, and exam tips for every domain on the exam blueprint.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <SaveIcon size={32} />
          </div>
          <h3>Cloud Sync</h3>
          <p>Sign in to sync your progress across your devices (up to 3 signed in at once). Your stats, achievements, and study streaks are saved securely in the cloud.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <GiftIcon size={32} />
          </div>
          <h3>Free to Start</h3>
          <p>Study guides are free for everyone. Try the first quiz domain and flashcard deck with no account, then subscribe to a certification, monthly or yearly, for every quiz domain and the full-length exam simulator.</p>
        </div>
      </div>
    </div>
  </section>
);

// Pro tier card: static "Coming Soon" until VITE_BILLING_ENABLED=true, then a
// live upgrade/manage flow backed by the Stripe Cloud Functions.
const ProPlanCard = ({ onShowLogin }) => {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState(null);
  // Signed in: does checkout give this person the free trial? (true / false / null = unknown yet)
  const [trial, setTrial] = useState(null);
  // Pro member: can the billing portal open? (false = Pro given by hand, nothing to manage; null = unknown)
  const [billingAccount, setBillingAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    let live = true;
    if (BILLING_ENABLED && isAuthenticated) {
      // Refresh claims when returning from checkout so the new plan shows up
      const fromCheckout = new URLSearchParams(window.location.search).get('checkout') === 'success';
      getPlan({ forceRefresh: fromCheckout }).then((p) => {
        if (!live) return;
        setPlan(p);
        // Only people without Pro are offered it; ask the server whether they'd get the trial
        if (p !== 'pro') getProTrialStatus().then((t) => live && setTrial(t));
        // Only Pro members get a Manage button; ask whether there is any billing behind it
        else getBillingAccountStatus().then((b) => live && setBillingAccount(b));
      });
    } else {
      setPlan(null);
      setTrial(null);
      setBillingAccount(null);
    }
    return () => { live = false; };
  }, [isAuthenticated]);

  const handleUpgrade = async () => {
    setBillingError('');
    setBusy(true);
    try {
      await startCheckout('all-access', 'year'); // Pro is yearly only
    } catch (err) {
      console.error('[Plans] Checkout failed:', err);
      // Pro on the person's other sign-in: say so, or they would retry forever
      setBillingError(/other sign-in/i.test(err?.message || '')
        ? 'Pro is already on for your email under your other sign-in. Sign out, then sign in the other way (for example with Google).'
        : /not available/i.test(err?.message || '')
          ? 'Pro opens very soon. Please check back shortly.'
          : 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  const handleManage = async () => {
    setBillingError('');
    setBusy(true);
    try {
      await openBillingPortal();
    } catch (err) {
      console.error('[Plans] Portal failed:', err);
      setBillingError(portalErrorMessage(err, 'Could not open billing portal. Please try again.'));
      setBusy(false);
    }
  };

  const sale = liveSale();
  // Signed out, the card shows the trial ("One free trial per person"); signed in, only when the
  // server says checkout would give it, so a former Pro member is never promised a free trial
  const offerTrial = BILLING_ENABLED && plan !== 'pro' && (!isAuthenticated || trial === true);
  const hadProBefore = BILLING_ENABLED && isAuthenticated && plan !== 'pro' && trial === false;
  // Back from buying Pro while paying for single products (checkout adds overlap=1): those keep
  // billing until cancelled, and nothing cancels them for the buyer
  const overlap = BILLING_ENABLED && plan === 'pro' && new URLSearchParams(window.location.search).get('overlap') === '1';
  return (
    <div className={`plan-card ${BILLING_ENABLED ? 'plan-featured' : 'plan-dimmed'}`}>
      {BILLING_ENABLED && plan === 'pro' && <div className="plan-badge">Your Plan</div>}
      <div className="plan-name">Pro</div>
      <div className="plan-price mono">
        {BILLING_ENABLED ? <>{PRO_YEARLY}<span className="plan-per">/year</span></> : 'Coming Soon'}
      </div>
      {offerTrial && <div className="plan-trial">First {PRO_TRIAL_DAYS} days free</div>}
      {BILLING_ENABLED && sale && <div className="sale-pill">{sale.label}: {sale.pro}% off your first year until {sale.ends}</div>}
      <div className="plan-tagline">Everything, billed yearly</div>
      <ul className="plan-features">
        <li>Every live certification unlocked</li>
        <li>All {courseCount} coding courses included</li>
        <li>All quiz domains &amp; flashcard decks</li>
        <li>Full-length timed exam simulators with readiness scores</li>
        <li>New certifications and courses as they ship</li>
      </ul>
      {/* Above the button so it lines up with the other cards' buttons */}
      {offerTrial ? (
        <p className="plan-trial-note">
          Card required. Cancel before day {PRO_TRIAL_DAYS} and you pay nothing; otherwise Pro
          renews yearly. One free trial per person.
        </p>
      ) : BILLING_ENABLED && plan !== 'pro' && (
        <p className="plan-trial-note">Renews yearly until you cancel in Manage billing.</p>
      )}
      {!BILLING_ENABLED ? (
        <button className="btn btn-card-disabled plan-cta" disabled>
          Coming Soon
        </button>
      ) : plan === 'pro' && billingAccount === false ? (
        // No Stripe customer: the portal could only fail, so say why there is nothing to manage
        <p className="plan-trial-note">Pro was given to this account, not bought, so there is no billing to manage.</p>
      ) : plan === 'pro' ? (
        <button className="btn btn-card-primary plan-cta" onClick={handleManage} disabled={busy}>
          {busy ? 'Opening…' : 'Manage Subscription'}
        </button>
      ) : isAuthenticated ? (
        <button className="btn btn-card-primary plan-cta" onClick={handleUpgrade} disabled={busy}>
          {busy ? 'Redirecting…' : offerTrial ? 'Start Free Trial' : 'Get Pro'} {!busy && <ArrowRightIcon size={16} />}
        </button>
      ) : (
        <button className="btn btn-card-primary plan-cta" onClick={onShowLogin}>
          Sign In to Start Free Trial
        </button>
      )}
      {/* Points at the Manage button, which is not there when no billing is behind the account */}
      {overlap && billingAccount !== false && (
        <p className="plan-trial-note plan-overlap-note" role="status">
          Pro now includes every certification and course. Your other subscriptions keep billing until you
          cancel them: use Manage Subscription above.
        </p>
      )}
      {hadProBefore && (
        <p className="plan-trial-note">You've had Pro before, so there's no trial this time: Pro starts today.</p>
      )}
      {billingError && <p className="plan-error">{billingError}</p>}
    </div>
  );
};

// One certification or course: a subscription bought on that product's own site. The buyer
// picks monthly or yearly there; here the toggle shows what each costs.
const ProductPlanCard = () => {
  const [interval, setBillingInterval] = useState('year');
  const sale = liveSale();
  const price = PRODUCT_PRICES[interval];
  return (
    <div className="plan-card">
      <div className="plan-name">One Certification or Course</div>
      <IntervalToggle value={interval} onChange={setBillingInterval} />
      <div className="plan-price mono" aria-live="polite">
        {price}<span className="plan-per">/{interval}</span>
      </div>
      {sale && (
        <div className="sale-pill">
          {sale.label}: {sale.single}% off your first {interval}, so {salePrice(price, sale.single)}
        </div>
      )}
      <div className="plan-tagline">
        {interval === 'year'
          ? `Save ${YEARLY_SAVINGS_PERCENT}% against ${PRODUCT_PRICES.month} a month`
          : `Or ${PRODUCT_PRICES.year} a year, ${YEARLY_SAVINGS_PERCENT}% less`}
      </div>
      <ul className="plan-features">
        <li>Every quiz domain &amp; flashcard deck for one certification</li>
        <li>Its full-length timed exam simulator</li>
        <li>Or every tutorial of one coding course</li>
        <li>Renews automatically; cancel anytime</li>
      </ul>
      <a href="#certifications" className="btn btn-card-primary plan-cta">
        Choose a Certification <ArrowRightIcon size={16} />
      </a>
    </div>
  );
};

// Plans Section — guest preview, free account, one certification or course (a monthly or yearly
// subscription, bought on its own site), Pro (all-access, yearly)
const Plans = ({ onShowLogin }) => (
  <section id="plans" className="plans-section">
    <div className="section-header">
      <h2 className="section-title">Simple Plans</h2>
      <p className="section-subtitle">
        Start free in seconds. Subscribe to one certification or course, monthly or yearly, or get everything with Pro.
      </p>
    </div>
    <div className="plans-grid">
      <div className="plan-card">
        <div className="plan-name">Guest Preview</div>
        <div className="plan-price mono">Free</div>
        <div className="plan-tagline">No account needed</div>
        <ul className="plan-features">
          <li>First quiz domain of every live cert</li>
          <li>First flashcard deck</li>
          <li>Full study guides</li>
          <li>Progress saved on this device</li>
        </ul>
        <a href={onThisName('https://cloud.aws-study-flashcards-app.com')} className="btn btn-card-primary plan-cta">
          Try It Now <ArrowRightIcon size={16} />
        </a>
      </div>
      <div className="plan-card">
        <div className="plan-name">Free Account</div>
        <div className="plan-price mono">Free</div>
        <div className="plan-tagline">Save your progress</div>
        <ul className="plan-features">
          <li>Every flashcard deck</li>
          <li>Your first full quiz, any domain</li>
          <li>Full study guides</li>
          <li>Cloud sync on up to 3 devices</li>
        </ul>
        <a href={onThisName('https://cloud.aws-study-flashcards-app.com')} className="btn btn-card-primary plan-cta">
          Create Free Account <ArrowRightIcon size={16} />
        </a>
      </div>
      <ProductPlanCard />
      <ProPlanCard onShowLogin={onShowLogin} />
    </div>
    <p className="plans-fine-print">
      Prices are in US dollars. Subscriptions renew automatically; cancel anytime in Manage billing (Settings, Plan &amp; Billing).
      Applicable sales tax and any card processing fee are shown at checkout before you pay. Payments are processed
      securely by Stripe for Nico Tek Solutions. Unlocks bought before subscriptions keep their lifetime access.{' '}
      <a href="/terms.html">Terms of Service</a>
    </p>
  </section>
);

// Resources Section
const Resources = () => (
  <section id="resources" className="resources-section">
    <h2 className="section-title">Official AWS Resources</h2>
    <p className="section-subtitle">
      Supplement your studies with these official AWS learning resources
    </p>
    <div className="resources-grid">
      <a
        href="https://aws.amazon.com/certification/"
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
      >
        <div className="resource-icon">
          <GraduationIcon size={28} />
        </div>
        <h3>AWS Certification</h3>
        <p>Official certification portal with exam guides, pricing, and registration</p>
        <span className="resource-link">aws.amazon.com/certification <ExternalLinkIcon size={12} /></span>
      </a>
      <a
        href="https://explore.skillbuilder.aws/"
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
      >
        <div className="resource-icon">
          <BookIcon size={28} />
        </div>
        <h3>AWS Skill Builder</h3>
        <p>Free and paid courses, labs, and learning paths from AWS</p>
        <span className="resource-link">explore.skillbuilder.aws <ExternalLinkIcon size={12} /></span>
      </a>
      <a
        href="https://docs.aws.amazon.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
      >
        <div className="resource-icon">
          <DocumentIcon size={28} />
        </div>
        <h3>AWS Documentation</h3>
        <p>Complete technical documentation for all AWS services</p>
        <span className="resource-link">docs.aws.amazon.com <ExternalLinkIcon size={12} /></span>
      </a>
      <a
        href="https://aws.amazon.com/free/"
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
      >
        <div className="resource-icon">
          <GiftIcon size={28} />
        </div>
        <h3>AWS Free Tier</h3>
        <p>Get hands-on experience with AWS services at no cost</p>
        <span className="resource-link">aws.amazon.com/free <ExternalLinkIcon size={12} /></span>
      </a>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-main">
        <div className="footer-brand">
          <img src="/brand/level-up-study-hub-horizontal-reverse.svg?v=4" alt="Level Up Study Hub" className="logo-lockup" width="268" height="28" />
        </div>
        <p className="footer-tagline">
          Game-based study tools for AWS certification exams
        </p>
      </div>
      <div className="footer-links">
        <div className="footer-column">
          <h4>Certifications</h4>
          <a href={onThisName('https://cloud.aws-study-flashcards-app.com')}>Cloud Practitioner</a>
          <a href={onThisName('https://ai.aws-study-flashcards-app.com')}>AI Practitioner</a>
          <a href={onThisName('https://architect.aws-study-flashcards-app.com')}>Solutions Architect</a>
          <a href={onThisName('https://developer.aws-study-flashcards-app.com')}>Developer</a>
        </div>
        <div className="footer-column">
          <h4>Coding courses</h4>
          {COURSES.map((c) => <a key={c.id} href={onThisName(c.url)}>{c.title}</a>)}
          {OTHER_COURSES.map((c) => (c.live
            ? <a key={c.id} href={onThisName(c.url)}>{c.title}</a>
            : <a key={c.id} href={`${BASE}#courses`}>{c.title} (coming soon)</a>))}
          <a href={`${BASE}gis/`}>GIS courses (coming soon)</a>
        </div>
        <div className="footer-column">
          <h4>Resources</h4>
          <a href="https://aws.amazon.com/certification/" target="_blank" rel="noopener noreferrer">AWS Certification</a>
          <a href="https://explore.skillbuilder.aws/" target="_blank" rel="noopener noreferrer">AWS Skill Builder</a>
          <a href="https://docs.aws.amazon.com/" target="_blank" rel="noopener noreferrer">AWS Documentation</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p className="mono">
        Not affiliated with Amazon Web Services. AWS and all related marks are trademarks of Amazon.com, Inc.
        {' '}Level Up Study Hub is not affiliated with, endorsed by, or sponsored by Google LLC. Google Cloud and the names of Google Cloud certifications are trademarks of Google LLC, used here only to identify the exams.
      </p>
      <p className="footer-legal-links">
        Made by <a href="https://nico-tek.com/study-hub">Nico Tek Solutions</a>
        <span aria-hidden="true"> · </span>
        <a href="/terms.html">Terms of Service</a>
        <span aria-hidden="true"> · </span>
        <a href="/privacy.html">Privacy Policy</a>
      </p>
    </div>
  </footer>
);

// Loading Screen
const LoadingScreen = () => (
  <div className="loading-screen-hub">
    <div className="loading-content">
      <img src="/brand/level-up-study-hub-mark-reverse.svg?v=4" alt="" width="48" height="48" />
      <div className="loading-spinner"></div>
      <p>Loading Level Up Study Hub...</p>
    </div>
  </div>
);

// Google SVG icon component
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Login Modal (Optional sign-in from hub)
const LoginModal = ({ onClose }) => {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showReset, setShowReset] = useState(false);

  const { login, register, googleSignIn, error, clearError, signOutMessage } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
    if (error) clearError();
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (error) clearError();

    const { username, email, password, confirmPassword } = formData;

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'register') {
      if (!username.trim() || username.length < 3) {
        setLocalError('Username must be at least 3 characters');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Results carry { success, error }; keep the modal open on failure so
      // the message shows, and after sign-up so "check your email" shows.
      if (mode === 'login') {
        const result = await login(email, password);
        if (result?.success) onClose();
      } else {
        await register(email, password, username);
      }
    } catch (err) {
      setLocalError(err.message);
    }
    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    if (error) clearError();
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const displayError = localError || error;

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    if (error) clearError();
    setIsSubmitting(true);
    const result = await googleSignIn();
    setIsSubmitting(false);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {showReset ? (
          <ForgotPassword
            initialEmail={formData.email}
            onBack={() => { setShowReset(false); if (error) clearError(); }}
            onSignedIn={onClose}
          />
        ) : (<>
        <div className="modal-header">
          <img src="/brand/level-up-study-hub-mark-reverse.svg?v=4" alt="" width="32" height="32" />
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{mode === 'login' ? 'Sign in to sync your progress' : 'Start your AWS journey today'}</p>
        </div>

        {signOutMessage && (
          <div className="auth-info-box" role="status">{signOutMessage}</div>
        )}

        {displayError && (
          <div className="auth-error-box">{displayError}</div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          className="google-sign-in-btn"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <GoogleIcon />
          <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        <div className="modal-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>
              <MailIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              disabled={isSubmitting}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label>
                <UserIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-field">
            <label>
              <KeyIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            {mode === 'login' && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => { setShowReset(true); setLocalError(null); if (error) clearError(); }}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            )}
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label>
                <KeyIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            {!isSubmitting && <ArrowRightIcon size={18} />}
          </button>
        </form>

        <div className="auth-toggle">
          <button onClick={toggleMode}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
        </>)}
      </div>
    </div>
  );
};

// Main Homepage Content (no auth required)
function HomepageContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, signOutMessage, dismissSignOutReason } = useAuth();
  const onGis = useIsGisPage();

  // Auto-redirect to home if user logs out while on settings
  useEffect(() => {
    if (!isAuthenticated && currentPage === 'settings') {
      setCurrentPage('home');
    }
  }, [isAuthenticated, currentPage]);

  // A bookmark or a link can open the hub at a section (/#plans). The sections only exist once React has drawn
  // them, after the browser looked for the #hash and found nothing, so jump there once ourselves: after the fonts
  // have settled the header's height, and only if the visitor has not scrolled in the meantime.
  // #readiness is left to ReadinessCheck, which already handles it. A reload or Back/Forward is left to the
  // place-keeping below: jumping to the section there would throw away the place the visitor had reached.
  useEffect(() => {
    if (isReturnVisit()) return undefined;
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return undefined; }
    const section = id && id !== 'readiness' ? document.getElementById(id) : null;
    if (!section || section.tagName !== 'SECTION') return undefined;
    let cancelled = false;
    const twoFrames = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));
    twoFrames(() => Promise.resolve(document.fonts?.ready).then(() => twoFrames(() => {
      if (!cancelled && window.scrollY === 0) section.scrollIntoView({ block: 'start' });
    })));
    return () => { cancelled = true; };
  }, []);

  // A reload or Back/Forward puts the visitor back where they were. The browser tries this itself, but while the
  // loading screen shows the page is too short, so it lands at the top (see services/scrollRestore.js). We save the
  // place as the page is left and put it back once the sections are drawn, unless the visitor has moved meanwhile;
  // the browser is kept out of the way until then (holdBrowserRestore at the top of this file). For two seconds
  // after that the place is held, because Safari on iOS 27 slides the page off it by itself (holdPlace).
  const viewRef = useRef(currentPage);
  viewRef.current = currentPage;
  useLayoutEffect(() => {
    tagEntry();
    // An in-page link (#plans) or a Google sign-in moving the address makes a new history entry: give it an id too
    window.addEventListener('hashchange', tagEntry);
    window.addEventListener('hub:locationchange', tagEntry);
    // Settings is not in the address, so a reload opens the homepage, where the Settings position means nothing
    const onLeave = () => saveScroll(viewRef.current === 'settings' ? null : window.scrollY);
    window.addEventListener('pagehide', onLeave);

    let cancelled = false;
    let visitor = null;
    let hold = null;
    const saved = isReturnVisit() ? savedScroll() : null;
    if (saved > 0) {
      visitor = watchVisitor();
      const putBack = () => {
        if (cancelled || visitor.moved() || hold?.interrupted()) return;
        if (Math.abs(window.scrollY - saved) > 1) jumpTo(saved);
      };
      putBack(); // before the first paint, so the top of the page never flashes up
      hold = holdPlace(saved); // undoes any scroll the visitor did not make, until they act or two seconds pass
      // Once more after the web fonts: they can rewrap the header and the text, which moves the page under us
      const twoFrames = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));
      twoFrames(() => Promise.resolve(document.fonts?.ready).then(() => twoFrames(() => {
        putBack();
        visitor.stop();
        releaseBrowserRestore(); // the browser's own restore is needed again for Back between #section jumps
      })));
    } else {
      releaseBrowserRestore();
    }
    return () => {
      cancelled = true;
      visitor?.stop();
      hold?.stop();
      releaseBrowserRestore();
      window.removeEventListener('hashchange', tagEntry);
      window.removeEventListener('hub:locationchange', tagEntry);
      window.removeEventListener('pagehide', onLeave);
    };
  }, []);

  const handleNavigateSettings = () => {
    if (isAuthenticated) {
      setCurrentPage('settings');
      window.scrollTo(0, 0);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  // Settings → "See plans": back to the homepage, at the plans section
  const handleSeePlans = () => {
    setCurrentPage('home');
    // No behavior given: the page's scroll-behavior decides, smooth unless the visitor asked for reduced motion
    setTimeout(() => document.getElementById('plans')?.scrollIntoView({ block: 'start' }), 0);
  };

  return (
    <div className="app">
      <PromoBanner />
      <Header
        onShowLogin={() => setShowLoginModal(true)}
        onNavigateSettings={handleNavigateSettings}
        onGis={onGis}
      />

      {/* Cognito signed this browser out because the account signed in on another device */}
      {signOutMessage && !isAuthenticated && !showLoginModal && (
        <div className="signed-out-banner" role="status">
          <span>{signOutMessage}</span>
          <button type="button" className="signed-out-banner-signin" onClick={() => setShowLoginModal(true)}>Sign in</button>
          <button type="button" className="signed-out-banner-close" onClick={dismissSignOutReason} aria-label="Dismiss">×</button>
        </div>
      )}

      {currentPage === 'settings' && isAuthenticated ? (
        <main>
          <SettingsPage onBack={handleBackToHome} onSeePlans={handleSeePlans} />
        </main>
      ) : (
        <>
          {onGis ? (
            <main>
              <GisPage />
            </main>
          ) : (
            <main>
              <Hero />
              <ReadinessCheck />
              <Certifications />
              <CodingCourses />
              <About />
              <Plans onShowLogin={() => setShowLoginModal(true)} />
              <Faq />
              <Resources />
              <NewsletterSignup />
            </main>
          )}
          <Footer />
        </>
      )}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

// Main App Content - NO AUTH REQUIRED for hub
function AppContent() {
  const { authChecked } = useAuth();

  // Loading screen only until the first sign-in check. (Gating on `loading`
  // also fired during sign-in attempts and unmounted the sign-in modal.)
  if (!authChecked) {
    return <LoadingScreen />;
  }

  // Show homepage regardless of auth state
  return <HomepageContent />;
}

// App with Auth Provider (but not requiring auth)
function App() {
  return (
    <AuthProvider requireAuth={false}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
