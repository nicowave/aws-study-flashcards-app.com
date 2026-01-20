import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { certifications, categories } from './data/certifications';
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
  ArrowRightIcon
} from './components/Icons';
import './styles/global.css';
import './styles/homepage.css';

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

// Header Component
const Header = ({ onLogout }) => {
  const { user, userData } = useAuth();
  const displayName = user?.displayName || userData?.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

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
          <div className="user-menu-header">
            <div className="user-avatar-small">{initials}</div>
            <span className="user-name-header">{displayName}</span>
            <button className="logout-btn-header" onClick={onLogout}>Sign Out</button>
          </div>
        </nav>
      </div>
    </header>
  );
};

// Hero Section (always authenticated when shown)
const Hero = () => {
  const { user } = useAuth();
  
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <TargetIcon size={16} className="badge-icon" />
          <span className="badge-text mono">Free Study Materials</span>
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
            href="https://cloud.aws-study-flashcards.app" 
            className="btn btn-secondary"
          >
            <CloudIcon size={20} />
            Start Cloud Practitioner
          </a>
        </div>
        <div className="hero-welcome">
          Welcome back, <strong>{user?.displayName || 'Learner'}</strong>! Ready to continue your AWS journey?
        </div>
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

// Auth Screen for Homepage (full page)
const HomepageAuthScreen = () => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  const { login, register, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!username.trim() || username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = mode === 'login' 
      ? await login(username, password)
      : await register(username, password, email || null);
    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="homepage-auth">
      <div className="homepage-auth-container">
        <div className="auth-hero">
          <div className="auth-brand-large">
            <BookIcon size={48} />
            <h1><span className="aws-orange">AWS</span> Study Hub</h1>
          </div>
          <p className="auth-tagline">
            Master your AWS certification with interactive flashcards, quiz games, and comprehensive study guides.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <FlashcardIcon size={24} />
              <span>Interactive Flashcards</span>
            </div>
            <div className="auth-feature">
              <GameIcon size={24} />
              <span>Quiz Games</span>
            </div>
            <div className="auth-feature">
              <TargetIcon size={24} />
              <span>Progress Tracking</span>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-card">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue studying' : 'Start your AWS journey today'}</p>

            {displayError && (
              <div className="auth-error-box">{displayError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="form-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-field optional">
                    <button type="button" className="toggle-optional" onClick={() => setShowEmail(!showEmail)}>
                      {showEmail ? '− Hide email' : '+ Add email (optional)'}
                    </button>
                    {showEmail && (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        disabled={isSubmitting}
                      />
                    )}
                    <span className="helper">Email allows password recovery</span>
                  </div>
                </>
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

          <p className="auth-footer-text">
            Free forever • No credit card required • 14 certifications
          </p>
        </div>
      </div>
    </div>
  );
};

// Authenticated Homepage Content
function AuthenticatedContent() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="app">
      <Header onLogout={handleLogout} />
      <main>
        <Hero />
        <Certifications />
        <About />
        <Resources />
      </main>
      <Footer />
    </div>
  );
}

// Main App Content with Auth Gate
function AppContent() {
  const { isAuthenticated, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <HomepageAuthScreen />;
  }

  return <AuthenticatedContent />;
}

// App with Auth Provider
function App() {
  return (
    <AuthProvider requireAuth={true}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
