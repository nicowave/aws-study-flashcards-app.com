import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LockIcon, 
  CheckCircleIcon, 
  ArrowRightIcon,
  BookIcon,
  HomeIcon
} from './Icons';

const CloseIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AuthScreen = ({ 
  onSuccess, 
  onGuestMode,
  hubUrl = 'https://aws-study-flashcards.app',
  showGuestOption = false,
  siteName = 'AWS Study Hub'
}) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  const { login, register, loginAsGuest, resendVerification, error, clearError } = useAuth();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setShowVerificationMessage(false);

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    let result;
    if (mode === 'login') {
      result = await login(email, password);
      
      // Handle email verification needed
      if (result.needsVerification) {
        setShowVerificationMessage(true);
        setVerificationEmail(email);
        setIsSubmitting(false);
        return;
      }
    } else {
      result = await register(email, password);
      
      if (result.success) {
        setShowVerificationMessage(true);
        setVerificationEmail(email);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
    }
  };

  const handleResendVerification = async () => {
    const result = await resendVerification();
    if (result.success) {
      setLocalError(null);
      setShowVerificationMessage(true);
    }
  };

  const handleGuestMode = async () => {
    setIsSubmitting(true);
    const result = await loginAsGuest();
    setIsSubmitting(false);
    
    if (result.success) {
      onGuestMode?.();
      onSuccess?.();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    clearError();
    setConfirmPassword('');
    setShowVerificationMessage(false);
  };

  const displayError = localError || error;

  return (
    <div className="auth-screen-full">
      <div className="auth-screen-container">
        {/* Header with back to hub link */}
        <div className="auth-header-nav">
          <a href={hubUrl} className="back-to-hub">
            <HomeIcon size={16} />
            <span>Back to Study Hub</span>
          </a>
        </div>

        <div className="auth-card-full">
          <div className="auth-brand">
            <BookIcon size={32} />
            <span className="brand-text">
              <span className="brand-aws">AWS</span> Study Hub
            </span>
          </div>

          <div className="auth-header">
            <div className="auth-icon">
              <LockIcon size={28} />
            </div>
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login' 
                ? `Sign in to access ${siteName}` 
                : 'Create an account to save your progress'}
            </p>
          </div>

          {/* Email Verification Message */}
          {showVerificationMessage && (
            <div className="auth-success">
              <MailIcon size={20} />
              <div className="success-content">
                <strong>Verification Email Sent!</strong>
                <p>We sent a verification link to <strong>{verificationEmail}</strong></p>
                <p className="small">Please check your email and click the link to verify your account.</p>
                <button 
                  type="button"
                  className="resend-btn"
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {displayError && !showVerificationMessage && (
            <div className="auth-error">
              <CloseIcon size={16} />
              <span>{displayError}</span>
              {displayError.includes('verify your email') && (
                <button 
                  type="button"
                  className="resend-btn-inline"
                  onClick={handleResendVerification}
                >
                  Resend verification
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isSubmitting}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Please wait...'
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          {/* Guest Mode Button */}
          {showGuestOption && (
            <>
              <div className="auth-divider">
                <span>OR</span>
              </div>
              <button 
                className="guest-mode-btn"
                onClick={handleGuestMode}
                disabled={isSubmitting}
              >
                <UserIcon size={20} />
                Continue as Guest
                <span className="guest-note">(Progress not saved)</span>
              </button>
            </>
          )}

          <div className="auth-footer">
            <button className="toggle-mode-btn" onClick={toggleMode}>
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="auth-benefits">
            <h4>Account Benefits</h4>
            <ul>
              <li><CheckCircleIcon size={14} /> Access all AWS certification study materials</li>
              <li><CheckCircleIcon size={14} /> Track progress across all certifications</li>
              <li><CheckCircleIcon size={14} /> Sync your stats across devices</li>
              <li><CheckCircleIcon size={14} /> Email verification for account security</li>
            </ul>
          </div>
        </div>

        <div className="auth-footer-text">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
