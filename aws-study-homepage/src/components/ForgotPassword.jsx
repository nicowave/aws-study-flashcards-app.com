import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendPasswordReset, resetPassword } from '../services/sharedAuth';
import { KeyIcon } from './Icons';

// Two steps inside the hub's sign-in modal: email -> code from the email +
// new password. Signs the user in when the new password is saved.
// (The course apps have their own copy styled for AuthScreen.)
const ForgotPassword = ({ initialEmail = '', onBack, onSignedIn }) => {
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
    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }
    const signIn = await login(email, password);
    setBusy(false);
    if (signIn?.success) onSignedIn?.();
    else setError('Password saved. Please sign in with your new password.');
  };

  return (
    <>
      <div className="modal-header">
        <KeyIcon size={32} />
        <h2>Reset Password</h2>
        <p>
          {step === 'request'
            ? "Enter your account's email and we'll send you a reset code"
            : 'Enter the code from the email and choose a new password'}
        </p>
      </div>

      {error && <div className="auth-error-box">{error}</div>}
      {!error && notice && <div className="auth-notice-box">{notice}</div>}

      {step === 'request' ? (
        <form onSubmit={requestCode}>
          <div className="form-field">
            <label htmlFor="reset-email">Email</label>
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
          <button type="submit" className="submit-btn" disabled={busy}>
            {busy ? 'Please wait...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={saveNewPassword}>
          <div className="form-field">
            <label htmlFor="reset-code">Code from the email</label>
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
          <div className="form-field">
            <label htmlFor="reset-password">New password</label>
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
          <div className="form-field">
            <label htmlFor="reset-confirm">Confirm new password</label>
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
          <button type="submit" className="submit-btn" disabled={busy}>
            {busy ? 'Please wait...' : 'Save New Password'}
          </button>
          <button type="button" className="forgot-link" onClick={requestCode} disabled={busy}>
            Send a new code
          </button>
        </form>
      )}

      <div className="auth-toggle">
        <button type="button" onClick={onBack} disabled={busy}>Back to sign in</button>
      </div>
    </>
  );
};

export default ForgotPassword;
