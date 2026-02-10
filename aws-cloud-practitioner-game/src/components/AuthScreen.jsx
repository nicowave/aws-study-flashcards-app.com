import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MailIcon, KeyIcon, UserIcon } from './Icons';
import './AuthScreen.css';

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

const AuthScreen = ({ onGuestContinue, hubUrl }) => {
  const { login, register, loading, error, clearError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    if (error) clearError();
  };

  const validateEmail = (email) => {
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { username, email, password, confirmPassword } = formData;

    // Validation
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }

    if (username.length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }

    // Email is REQUIRED for both login and register
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }

    try {
      if (isLogin) {
        console.log('[AuthScreen] Attempting login with email:', email);
        await login(email, password);
      } else {
        console.log('[AuthScreen] Attempting registration with email:', email, 'username:', username);
        await register(email, password, username);
      }
    } catch (err) {
      console.error('[AuthScreen] Auth error:', err);
      setFormError(err.message || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormError('');
    if (error) clearError();
    // Keep email and username when switching modes
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
  };

  const displayError = formError || error;

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {hubUrl && (
          <a href={hubUrl} className="back-to-hub-link auth-hub-link">&larr; Study Hub</a>
        )}
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to sync your progress across devices' 
              : 'Sign up to save your progress and achievements'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">
              <UserIcon size={18} />
              <span>Username</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Email Field - REQUIRED */}
          <div className="form-group">
            <label htmlFor="email">
              <MailIcon size={18} />
              <span>Email <span className="required-star">*</span></span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
            <span className="field-hint">Required for account verification</span>
          </div>

          {/* Password Field with Toggle */}
          <div className="form-group">
            <label htmlFor="password">
              <KeyIcon size={18} />
              <span>Password</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <KeyIcon size={18} />
                <span>Confirm Password</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {displayError && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="auth-toggle">
          <span>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button 
            type="button" 
            onClick={toggleMode}
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        {/* Guest Option */}
        {onGuestContinue && (
          <div className="guest-option">
            <div className="divider">
              <span>or</span>
            </div>
            <button 
              type="button"
              className="guest-btn"
              onClick={onGuestContinue}
              disabled={loading}
            >
              Continue as Guest
            </button>
            <p className="guest-hint">
              Progress won't sync across devices
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
