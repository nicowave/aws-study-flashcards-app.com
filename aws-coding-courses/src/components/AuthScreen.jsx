import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MailIcon, KeyIcon, UserIcon } from './Icons';
import ForgotPassword from './ForgotPassword';
import { useT } from '../engine/i18n';
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
  const t = useT();
  const { login, register, googleSignIn, loading, error, clearError, signOutReason } = useAuth();
  
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
  const [showReset, setShowReset] = useState(false);

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
      setFormError(t('auth.usernameRequired'));
      return;
    }

    if (username.length < 3) {
      setFormError(t('auth.usernameShort'));
      return;
    }

    // Email is REQUIRED for both login and register
    if (!email.trim()) {
      setFormError(t('auth.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setFormError(t('auth.emailInvalid'));
      return;
    }

    if (!password) {
      setFormError(t('auth.passwordRequired'));
      return;
    }

    if (password.length < 6) {
      setFormError(t('auth.passwordShort'));
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setFormError(t('auth.passwordsDiffer'));
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
      setFormError(err.message || t('auth.failed'));
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

  if (showReset) {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <ForgotPassword
            initialEmail={formData.email}
            onBack={() => { setShowReset(false); if (error) clearError(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {hubUrl && (
          <a href={hubUrl} className="back-to-hub-link auth-hub-link">&larr; Study Hub</a>
        )}
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? t('auth.signInLede')
              : t('auth.signUpLede')}
          </p>
        </div>

        {/* Cognito signed this browser out because the account signed in on another device */}
        {signOutReason === 'device-limit' && (
          <div className="auth-notice auth-signed-out" role="status">
            <span>{t('auth.signedOutDeviceLimit')}</span>
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          className="google-sign-in-btn"
          onClick={googleSignIn}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{isLogin ? t('auth.googleSignIn') : t('auth.googleSignUp')}</span>
        </button>

        <div className="divider auth-divider">
          <span>{t('auth.or')}</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">
              <UserIcon size={18} />
              <span>{t('auth.username')}</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t('auth.usernamePlaceholder')}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Email Field - REQUIRED */}
          <div className="form-group">
            <label htmlFor="email">
              <MailIcon size={18} />
              <span>{t('auth.email')} <span className="required-star">*</span></span>
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
            <span className="field-hint">{t('auth.emailHint')}</span>
          </div>

          {/* Password Field with Toggle */}
          <div className="form-group">
            <label htmlFor="password">
              <KeyIcon size={18} />
              <span>{t('auth.password')}</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            {isLogin && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => { setShowReset(true); setFormError(''); if (error) clearError(); }}
                disabled={loading}
              >
                {t('auth.forgot')}
              </button>
            )}
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <KeyIcon size={18} />
                <span>{t('auth.confirmPassword')}</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t('auth.confirmPlaceholder')}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
              isLogin ? t('auth.signInButton') : t('auth.createAccount')
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="auth-toggle">
          <span>
            {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
          </span>
          <button 
            type="button" 
            onClick={toggleMode}
            disabled={loading}
          >
            {isLogin ? t('auth.signUpButton') : t('auth.signInButton')}
          </button>
        </div>

        {/* Guest Option */}
        {onGuestContinue && (
          <div className="guest-option">
            <div className="divider">
              <span>{t('auth.or')}</span>
            </div>
            <button 
              type="button"
              className="guest-btn"
              onClick={onGuestContinue}
              disabled={loading}
            >
              {t('auth.guest')}
            </button>
            <p className="guest-hint">
              {t('auth.guestHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
