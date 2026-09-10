import React, { useState } from 'react';
import { startCheckout, CERT_PRICE_LABEL } from '../services/billing';
import { LockIcon, CheckCircleIcon } from './Icons';
import './PaywallScreen.css';

/**
 * Shown after the free first quiz when billing is enabled and the signed-in
 * user has no entitlement for this certification.
 */
const PaywallScreen = ({ certId, certName, onBack }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');
    setBusy(true);
    try {
      await startCheckout(certId);
    } catch (err) {
      console.error('[Paywall] Checkout failed:', err);
      setError('Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="paywall-screen">
      <div className="paywall-lock">
        <LockIcon size={40} />
      </div>
      <h2>Your free quiz is complete — nice work! 🎉</h2>
      <p className="paywall-sub">
        Keep going with the full <strong>{certName}</strong> prep suite:
      </p>
      <ul className="paywall-features">
        <li><CheckCircleIcon size={16} /> Every quiz domain, exam-weighted</li>
        <li><CheckCircleIcon size={16} /> Full-length timed exam simulator with the 700/1000 pass line</li>
        <li><CheckCircleIcon size={16} /> All flashcard decks with review queue</li>
        <li><CheckCircleIcon size={16} /> Progress synced across devices</li>
        <li><CheckCircleIcon size={16} /> Cancel anytime</li>
      </ul>
      <div className="paywall-price">
        <span className="paywall-price-value mono">{CERT_PRICE_LABEL}</span>
        <span className="paywall-price-note">for this certification</span>
      </div>
      <div className="paywall-actions">
        <button className="paywall-subscribe-btn" onClick={handleSubscribe} disabled={busy}>
          {busy ? 'Redirecting to secure checkout…' : 'Subscribe & Continue'}
        </button>
        <button className="paywall-back-btn" onClick={onBack} disabled={busy}>
          Back to Menu
        </button>
      </div>
      {error && <p className="paywall-error">{error}</p>}
      <p className="paywall-fine-print">
        Secure payment by Stripe. The study guide stays free forever.{' '}
        <a href="https://aws-study-flashcards-app.com/terms.html" target="_blank" rel="noopener noreferrer">Terms</a>
        {' · '}
        <a href="https://aws-study-flashcards-app.com/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</a>
      </p>
    </div>
  );
};

export default PaywallScreen;
