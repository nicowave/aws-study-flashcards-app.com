import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  SecurityIcon, 
  CheckIcon, 
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

const AuthScreen = ({ onSuccess, hubUrl = 'https://aws-study-flashcards.app' }) => {
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

    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
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
      result = await login(username, password);
    } else {
      result = await register(username, password, email || null);
    }

    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    clearError();
    setConfirmPassword('');
    setEmail('');
    setShowEmail(false);
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
              <SecurityIcon size={28} />
            </div>
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login' 
                ? 'Sign in to access your study materials' 
                : 'Create an account to start studying'}
            </p>
          </div>

          {displayError && (
            <div className="auth-error">
              <CloseIcon size={16} />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isSubmitting}
              />
            </div>

            {mode === 'register' && (
              <>
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
                  />
                </div>

                <div className="form-group optional">
                  <button 
                    type="button" 
                    className="toggle-email-btn"
                    onClick={() => setShowEmail(!showEmail)}
                  >
                    {showEmail ? '− Hide email (optional)' : '+ Add email (optional)'}
                  </button>
                  
                  {showEmail && (
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                    />
                  )}
                  <span className="helper-text">
                    Email allows password recovery
                  </span>
                </div>
              </>
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
              <li><CheckIcon size={14} /> Access all AWS certification study materials</li>
              <li><CheckIcon size={14} /> Track progress across all certifications</li>
              <li><CheckIcon size={14} /> Sync your stats across devices</li>
              <li><CheckIcon size={14} /> Earn achievements and compete on leaderboards</li>
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
