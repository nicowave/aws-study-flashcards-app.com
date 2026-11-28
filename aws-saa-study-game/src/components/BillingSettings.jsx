import React, { useEffect, useState } from 'react';
import {
  BILLING_ENABLED, hasPaidPlan, getBillingAccountStatus, openBillingPortal, portalErrorMessage,
} from '../services/billing';
import { PricingIcon } from './Icons';
import { onThisName } from '../config/auth.config';
import './BillingSettings.css';

/**
 * Settings → Plan & Billing: a way into the Stripe portal (switch monthly/yearly, card, invoices,
 * cancel) for anyone who has paid for something. Hidden while billing is off or for free accounts.
 * Access given by hand has no Stripe customer behind it, so the portal could only fail: those
 * accounts get a plain line instead of the button (same rule as the hub).
 */
const BillingSettings = () => {
  const [paid, setPaid] = useState(false);
  // Can the billing portal open? false = no Stripe customer (given by hand), null = unknown
  const [billingAccount, setBillingAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!BILLING_ENABLED) return undefined;
    let live = true;
    hasPaidPlan().then((p) => {
      if (!live) return;
      setPaid(p);
      if (p) getBillingAccountStatus().then((b) => live && setBillingAccount(b));
    });
    return () => { live = false; };
  }, []);

  if (!BILLING_ENABLED || !paid) return null;
  const given = billingAccount === false;

  const manage = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await openBillingPortal();
    } catch (err) {
      console.error('[Billing] Portal failed:', err);
      setError(portalErrorMessage(err, 'Could not open billing. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <div className="settings-section billing-settings">
      <h2><PricingIcon size={20} /> Plan &amp; Billing</h2>
      {given ? (
        <p className="billing-settings-text">
          Your access was given to this account, not bought, so there is no billing to manage.
        </p>
      ) : (
        <>
          <p className="billing-settings-text">
            Switch between monthly and yearly, update your card, download invoices or cancel.
            Subscriptions renew automatically until you cancel.
          </p>
          <button className="billing-settings-btn" onClick={manage} disabled={busy}>
            {busy ? 'Opening billing…' : 'Manage billing'}
          </button>
        </>
      )}
      {error && <p className="settings-error" role="alert">{error}</p>}
      <p className="billing-settings-fine">
        <a href={onThisName('https://aws-study-flashcards-app.com/terms.html')} target="_blank" rel="noopener noreferrer">Terms</a>
      </p>
    </div>
  );
};

export default BillingSettings;
