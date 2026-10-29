import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendPasswordReset, resetPassword } from '../services/sharedAuth';
import { MailIcon, KeyIcon } from './Icons';

// Two steps: email -> code from the email + new password. Signs the user in
// when the new password is saved. Uses the AuthScreen styles.
const ForgotPassword = ({ initialEmail = '', onBack }) => {
  const { login } = useAuth();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    const result = await sendPasswordReset(email);
    setBusy(false);
    if (result.success) {
      setNotice(result.message);
      setStep('confirm');
    } else {
      setError(result.error);
    }
  };

  const saveNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter the code from the email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    const result = await resetPassword(email, code, password);
    if (result.success) {
      await login(email, password);
    } else {
      setError(result.error);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {step === 'request'
            ? "Enter your account's email and we'll send you a reset code"
            : 'Enter the code from the email and choose a new password'}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={requestCode} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">
              <MailIcon size={18} />
              <span>Email</span>
            </label>
            <input
              type="email"
              id="reset-email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
              disabled={busy}
            />
          </div>
          {error && <div className="auth-error"><span>⚠️</span><span>{error}</span></div>}
          <button type="submit" className="auth-submit-btn" disabled={busy}>
            {busy ? <span className="loading-spinner">⏳</span> : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={saveNewPassword} className="auth-form">
          {notice && <div className="auth-notice"><span>✉️</span><span>{notice}</span></div>}
          <div className="form-group">
            <label htmlFor="reset-code">
              <KeyIcon size={18} />
              <span>Code from the email</span>
            </label>
            <input
              type="text"
              id="reset-code"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={busy}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reset-password">
              <KeyIcon size={18} />
              <span>New password</span>
            </label>
            <input
              type="password"
              id="reset-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reset-confirm">
              <KeyIcon size={18} />
              <span>Confirm new password</span>
            </label>
            <input
              type="password"
              id="reset-confirm"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Type it again"
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          {error && <div className="auth-error"><span>⚠️</span><span>{error}</span></div>}
          <button type="submit" className="auth-submit-btn" disabled={busy}>
            {busy ? <span className="loading-spinner">⏳</span> : 'Save New Password'}
          </button>
          <button type="button" className="forgot-link" onClick={requestCode} disabled={busy}>
            Send a new code
          </button>
        </form>
      )}

      <div className="auth-toggle">
        <span>Remembered it?</span>
        <button type="button" onClick={onBack} disabled={busy}>Back to Sign In</button>
      </div>
    </>
  );
};

export default ForgotPassword;
