import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { certifications, categories } from './data/certifications';
import SettingsPage from './components/SettingsPage';
import { applyAnalyticsPreference } from './services/analytics';
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
import './styles/global.css';
import './styles/homepage.css';

// Apply analytics preference before components render
applyAnalyticsPreference();

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
const Header = ({ onShowLogin, onNavigateSettings }) => {
  const { user, userData, isAuthenticated, logout } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Avatar rendering
  const getAvatarContent = () => {
    const avatar = userData?.avatar;
    if (avatar) {
      if ((avatar.type === 'emoji') && avatar.value) {
        return { text: avatar.value, bgColor: avatar.bgColor || '#58a6ff', isImg: false };
      }
      if ((avatar.type === 'pattern' || avatar.type === 'image') && avatar.value) {
        return { imgSrc: avatar.value, bgColor: avatar.bgColor || '#58a6ff', isImg: true };
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

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <BookIcon size={28} className="logo-icon" />
          <span className="logo-text">
            <span className="logo-aws">AWS</span> Study Hub
          </span>
        </div>
        <nav className="nav">
          <a href="#certifications" className="nav-link">Certifications</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#resources" className="nav-link">Resources</a>
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
                <span className="user-name-header">{displayName}</span>
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

// Hero Section - Works for both authenticated and unauthenticated users
const Hero = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <TargetIcon size={16} className="badge-icon" />
          <span className="badge-text mono">Free Study Materials - Beta Version 1.0</span>
        </div>
        <h1 className="hero-title">
          Master Your <span className="highlight">AWS Certification</span>
        </h1>
        <p className="hero-subtitle">
          Interactive flashcards, quiz games, and study guides for every AWS certification path.
          Built by developers, for developers.
        </p>
        <div className="hero-actions">
          <a href="#certifications" className="btn btn-primary">
            Browse Certifications
          </a>
          <a
            href="https://cloud.aws-study-flashcards-app.com"
            className="btn btn-secondary"
          >
            <CloudIcon size={20} />
            Start Cloud Practitioner
          </a>
        </div>
        {isAuthenticated && (
          <div className="hero-welcome">
            Welcome back, <strong>{user?.displayName || user?.email?.split('@')[0] || 'Learner'}</strong>! Ready to continue your AWS journey?
          </div>
        )}
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value mono">14</span>
            <span className="stat-label">Certifications</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value mono">500+</span>
            <span className="stat-label">Flashcards</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value mono">100%</span>
            <span className="stat-label">Free</span>
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
          <a href={cert.url} className="btn btn-card-primary">
            Start Studying <ArrowRightIcon size={16} />
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

// Certifications Section
const Certifications = () => (
  <section id="certifications" className="certifications-section">
    <div className="section-header">
      <h2 className="section-title">AWS Certifications</h2>
      <p className="section-subtitle">
        Choose your certification path and start preparing with our interactive study tools
      </p>
    </div>

    {categories.map(category => {
      const certs = certifications.filter(c => c.category === category.id);
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
      <h2 className="section-title">Why AWS Study Hub?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FlashcardIcon size={32} />
          </div>
          <h3>Interactive Flashcards</h3>
          <p>Spaced repetition learning with progress tracking. Mark cards as "Know It" or "Still Learning" to focus your study time.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <GameIcon size={32} />
          </div>
          <h3>Quiz Games</h3>
          <p>Gamified quizzes with XP, levels, and achievements. Make studying fun while testing your knowledge across all exam domains.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <BookIcon size={32} />
          </div>
          <h3>Study Guides</h3>
          <p>Comprehensive guides covering key concepts, AWS services, and exam tips extracted from official AWS Skill Builder content.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <SaveIcon size={32} />
          </div>
          <h3>Cloud Sync</h3>
          <p>Sign in to sync your progress across all devices. Your stats, achievements, and study streaks are saved securely in the cloud.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <MobileIcon size={32} />
          </div>
          <h3>Mobile Friendly</h3>
          <p>Study anywhere with a fully responsive design. Perfect for quick review sessions during your commute or coffee break.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <GiftIcon size={32} />
          </div>
          <h3>100% Free</h3>
          <p>All study materials are completely free. No subscriptions, no paywalls, no hidden costs. Ever.</p>
        </div>
      </div>
    </div>
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
          <BookIcon size={24} className="logo-icon" />
          <span className="logo-text">
            <span className="logo-aws">AWS</span> Study Hub
          </span>
        </div>
        <p className="footer-tagline">
          Free study materials for AWS certification exams
        </p>
      </div>
      <div className="footer-links">
        <div className="footer-column">
          <h4>Certifications</h4>
          <a href="https://ai.aws-study-flashcards-app.com">AI Practitioner</a>
          <a href="https://cloud.aws-study-flashcards-app.com">Cloud Practitioner</a>
          <span className="muted">Solutions Architect (Soon)</span>
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
      </p>
    </div>
  </footer>
);

// Loading Screen
const LoadingScreen = () => (
  <div className="loading-screen-hub">
    <div className="loading-content">
      <BookIcon size={48} />
      <div className="loading-spinner"></div>
      <p>Loading AWS Study Hub...</p>
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

  const { login, register, googleSignIn, error, clearError } = useAuth();

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
      if (mode === 'login') {
        await login(email, password);
        onClose(); // Close modal on success
      } else {
        await register(email, password, username);
        onClose(); // Close modal on success
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

        <div className="modal-header">
          <BookIcon size={32} />
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{mode === 'login' ? 'Sign in to sync your progress' : 'Start your AWS journey today'}</p>
        </div>

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
      </div>
    </div>
  );
};

// Main Homepage Content (no auth required)
function HomepageContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated } = useAuth();

  // Auto-redirect to home if user logs out while on settings
  useEffect(() => {
    if (!isAuthenticated && currentPage === 'settings') {
      setCurrentPage('home');
    }
  }, [isAuthenticated, currentPage]);

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

  return (
    <div className="app">
      <Header
        onShowLogin={() => setShowLoginModal(true)}
        onNavigateSettings={handleNavigateSettings}
      />

      {currentPage === 'settings' && isAuthenticated ? (
        <main>
          <SettingsPage onBack={handleBackToHome} />
        </main>
      ) : (
        <>
          <main>
            <Hero />
            <Certifications />
            <About />
            <Resources />
          </main>
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
  const { loading } = useAuth();

  // Show loading while Firebase initializes
  if (loading) {
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
