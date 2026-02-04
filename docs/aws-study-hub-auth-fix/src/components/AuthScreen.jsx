import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthScreen.css';

const AuthScreen = ({ 
  siteName = 'AWS Study Hub', 
  onClose = null,
  showGuestOption = true 
}) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const { login, register, loginAsGuest, resendVerification, error, needsVerification, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    // Validate email
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Check for fake email patterns
    if (email.endsWith('@studyhub.local') || email.endsWith('@example.com')) {
      setLocalError('Please use your real email address for account verification');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    // Validate confirm password for registration
    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        onClose?.();
      } else if (result.needsVerification) {
        setMode('verify');
      }
    } else {
      const result = await register(email, password, displayName || null);
      if (result.success) {
        setSuccessMessage(result.message);
        setMode('verify');
      }
    }
    
    setIsSubmitting(false);
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    
    const result = await resendVerification();
    
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setLocalError(result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    const result = await loginAsGuest();
    setIsSubmitting(false);
    
    if (result.success) {
      onClose?.();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
  };

  const displayError = localError || error;

  // Verification pending screen
  if (mode === 'verify' || needsVerification) {
    return (
      <div className="auth-screen">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>📧 Check Your Email</h2>
          </div>
          
          <div className="auth-body verification-body">
            <div className="verification-icon">✉️</div>
            
            <p className="verification-text">
              We've sent a verification link to:
            </p>
            <p className="verification-email">{email}</p>
            
            <p className="verification-instructions">
              Click the link in your email to verify your account, then return here to sign in.
            </p>
            
            {successMessage && (
              <div className="auth-success">{successMessage}</div>
            )}
            
            {displayError && (
              <div className="auth-error">{displayError}</div>
            )}
            
            <div className="verification-actions">
              <button 
                onClick={handleResendVerification}
                disabled={isSubmitting}
                className="btn-resend"
              >
                {isSubmitting ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <button 
                onClick={() => {
                  setMode('login');
                  setSuccessMessage(null);
                  clearError();
                }}
                className="btn-back"
              >
                Back to Sign In
              </button>
            </div>
            
            <div className="verification-tips">
              <p><strong>Didn't receive the email?</strong></p>
              <ul>
                <li>Check your spam/junk folder</li>
                <li>Make sure {email} is correct</li>
                <li>Wait a few minutes and try resending</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? `Sign in to ${siteName}` 
              : 'Start your AWS certification journey'}
          </p>
        </div>

        <div className="auth-body">
          {displayError && (
            <div className="auth-error">{displayError}</div>
          )}
          
          {successMessage && (
            <div className="auth-success">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="displayName">Display Name (optional)</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                required
                autoComplete="email"
              />
              {mode === 'register' && (
                <span className="form-hint">
                  We'll send a verification link to this email
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={isSubmitting}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={isSubmitting}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Please wait...' 
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            onClick={toggleMode}
            className="btn-toggle"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>

          {showGuestOption && (
            <button 
              onClick={handleGuestLogin}
              className="btn-guest"
              disabled={isSubmitting}
            >
              Continue as Guest
            </button>
          )}
          
          {showGuestOption && (
            <p className="guest-warning">
              ⚠️ Guest progress is not saved across devices
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
