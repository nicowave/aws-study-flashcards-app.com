import React, { useId, useState } from 'react';
import { startCheckout } from '../services/billing';
import { PRODUCT_PRICES, PRO_YEARLY, PRO_TRIAL_DAYS, YEARLY_SAVINGS_PERCENT } from '../services/prices';
import { LockIcon, CheckCircleIcon } from './Icons';
import { saleFor } from './PromoBanner';
import { onThisName } from '../config/auth.config';
import './PaywallScreen.css';

const PRO_PLAN = 'all-access';

// The backend's reasons a buyer can act on; anything else is a plain "try again"
const checkoutErrorText = (err) => {
  const message = err?.message || '';
  if (/other sign-in/i.test(message)) {
    return 'This is already on for your email under your other sign-in. Sign out, then sign in the other way (for example with Google).';
  }
  if (/not available/i.test(message)) return 'Purchases open very soon. Please check back shortly.';
  return 'Could not start checkout. Please try again.';
};

/** A price, at the sale price with the full one struck through while a sale runs. */
const Price = ({ price, sale, per, note }) => (
  <div className="paywall-price">
    {sale ? (
      <>
        <span className="paywall-price-value mono">{sale.salePrice}</span>
        <s className="paywall-price-note price-was mono">{sale.price}</s>
        <span className="paywall-price-note">
          first {per}: {sale.promo.label}, until {sale.promo.ends}
        </span>
      </>
    ) : (
      <>
        <span className="paywall-price-value mono">{price}</span>
        <span className="paywall-price-note">per {per}{note ? `, ${note}` : ''}</span>
      </>
    )}
  </div>
);

/**
 * Shown after the free first quiz when billing is enabled and the signed-in
 * user has no entitlement for this certification. Offers this certification
 * monthly or yearly, or Pro (everything) yearly.
 */
const PaywallScreen = ({ certId, certName, onBack }) => {
  const [interval, setBillingInterval] = useState('year');
  const [busy, setBusy] = useState(null); // the plan whose checkout is opening
  const [error, setError] = useState('');
  const name = useId();
  const productPrice = PRODUCT_PRICES[interval];

  const checkout = async (plan, billing) => {
    if (busy) return;
    setError('');
    setBusy(plan);
    try {
      await startCheckout(plan, billing);
    } catch (err) {
      console.error('[Paywall] Checkout failed:', err);
      setError(checkoutErrorText(err));
      setBusy(null);
    }
  };

  const redirecting = 'Redirecting to secure checkout…';

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
        <li><CheckCircleIcon size={16} /> Full-length timed exam simulator with a personalized readiness score</li>
        <li><CheckCircleIcon size={16} /> All flashcard decks with review queue</li>
        <li><CheckCircleIcon size={16} /> Progress synced across your devices</li>
        <li><CheckCircleIcon size={16} /> Pay monthly or yearly, cancel anytime</li>
      </ul>

      <fieldset className="paywall-interval">
        <legend className="paywall-sr-only">Billing period</legend>
        {[
          ['month', 'Monthly', null],
          ['year', 'Yearly', `save ${YEARLY_SAVINGS_PERCENT}%`],
        ].map(([value, label, save]) => (
          <label key={value} className={`paywall-interval-option${interval === value ? ' selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={interval === value}
              onChange={() => setBillingInterval(value)}
              disabled={!!busy}
            />
            <span>{label}</span>
            {save && <span className="paywall-interval-save">{save}</span>}
          </label>
        ))}
      </fieldset>
      <Price price={productPrice} sale={saleFor(productPrice)} per={interval} note="this certification" />

      <div className="paywall-actions">
        <button className="paywall-subscribe-btn" onClick={() => checkout(certId, interval)} disabled={!!busy}>
          {busy === certId ? redirecting : 'Unlock & Continue'}
        </button>
      </div>

      <div className="paywall-pro">
        <p className="paywall-pro-title"><strong>Or get Pro:</strong> every certification and all 5 coding courses</p>
        <Price price={PRO_YEARLY} sale={saleFor(PRO_YEARLY, 'pro')} per="year" note="billed yearly" />
        <p className="paywall-pro-note">
          {PRO_TRIAL_DAYS}-day free trial if you have never had Pro (card required; you are charged
          when the trial ends unless you cancel).
        </p>
        <button className="paywall-pro-btn" onClick={() => checkout(PRO_PLAN, 'year')} disabled={!!busy}>
          {busy === PRO_PLAN ? redirecting : 'Get Pro'}
        </button>
      </div>

      <button className="paywall-back-btn" onClick={onBack} disabled={!!busy}>
        Back to Menu
      </button>
      {error && <p className="paywall-error" role="alert">{error}</p>}
      <p className="paywall-fine-print">
        Subscriptions renew automatically at the price shown until you cancel. Cancel anytime in
        Manage billing (Settings). Secure payment by Stripe. Applicable sales tax and any card
        processing fee are shown at checkout before you pay. The study guide stays free forever.{' '}
        <a href={onThisName('https://aws-study-flashcards-app.com/terms.html')} target="_blank" rel="noopener noreferrer">Terms</a>
        {' · '}
        <a href={onThisName('https://aws-study-flashcards-app.com/privacy.html')} target="_blank" rel="noopener noreferrer">Privacy</a>
      </p>
    </div>
  );
};

export default PaywallScreen;
