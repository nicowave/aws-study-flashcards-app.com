import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendPasswordReset, resetPassword } from '../services/sharedAuth';
import { MailIcon, KeyIcon } from './Icons';
import { useT } from '../engine/i18n';

// Two steps: email -> code from the email + new password. Signs the user in
// when the new password is saved. Uses the AuthScreen styles.
const ForgotPassword = ({ initialEmail = '', onBack }) => {
  const t = useT();
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
      setError(t('auth.emailInvalid'));
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
      setError(t('reset.codeMissing'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDiffer'));
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
        <h1 className="auth-title">{t('reset.title')}</h1>
        <p className="auth-subtitle">
          {step === 'request'
            ? t('reset.requestLede')
            : t('reset.confirmLede')}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={requestCode} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">
              <MailIcon size={18} />
              <span>{t('auth.email')}</span>
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
            {busy ? <span className="loading-spinner">⏳</span> : t('reset.send')}
          </button>
        </form>
      ) : (
        <form onSubmit={saveNewPassword} className="auth-form">
          {notice && <div className="auth-notice"><span>✉️</span><span>{notice}</span></div>}
          <div className="form-group">
            <label htmlFor="reset-code">
              <KeyIcon size={18} />
              <span>{t('reset.code')}</span>
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
              <span>{t('reset.newPassword')}</span>
            </label>
            <input
              type="password"
              id="reset-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={t('reset.newPlaceholder')}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reset-confirm">
              <KeyIcon size={18} />
              <span>{t('reset.confirm')}</span>
            </label>
            <input
              type="password"
              id="reset-confirm"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder={t('reset.confirmPlaceholder')}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          {error && <div className="auth-error"><span>⚠️</span><span>{error}</span></div>}
          <button type="submit" className="auth-submit-btn" disabled={busy}>
            {busy ? <span className="loading-spinner">⏳</span> : t('reset.save')}
          </button>
          <button type="button" className="forgot-link" onClick={requestCode} disabled={busy}>
            Send a new code
          </button>
        </form>
      )}

      <div className="auth-toggle">
        <span>{t('reset.remembered')}</span>
        <button type="button" onClick={onBack} disabled={busy}>{t('reset.back')}</button>
      </div>
    </>
  );
};

export default ForgotPassword;
