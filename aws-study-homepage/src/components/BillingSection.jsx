import React, { useEffect, useState } from 'react';
import { PricingIcon } from './Icons';
import { getBillingSummary, getBillingAccountStatus, openBillingPortal, portalErrorMessage } from '../services/billing';
import { certifications } from '../data/certifications';
import { COURSES, OTHER_COURSES } from '../data/courses';

// Plan ids (the token's `certs`, the backend's subscriptions) to the names the hub shows: certs keep
// their id, a coding course is bought as `<course id>-for-aws`, any other course by its `plan`
const PLAN_NAMES = new Map([
  ['all-access', 'Pro (all access)'],
  ['developer-path', 'Developer Path bundle'],
  ...certifications.map((c) => [c.id, c.name.replace(/^AWS Certified /, '')]),
  ...COURSES.map((c) => [`${c.id}-for-aws`, c.title]),
  ...OTHER_COURSES.map((c) => [c.plan, c.title]),
]);
const planName = (id) => PLAN_NAMES.get(id) || id;

const INTERVAL_NAMES = { month: 'Monthly', year: 'Yearly' };
const dateText = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : null;
};

/** "Monthly, renews March 3, 2027" and the like, from what Stripe last told the backend. */
const subscriptionStatus = (s) => {
  const when = dateText(s.currentPeriodEnd);
  const parts = [INTERVAL_NAMES[s.interval]].filter(Boolean);
  if (s.status === 'past_due') parts.push('payment failed: update your card in Manage billing');
  else if (s.cancelAtPeriodEnd) parts.push(when ? `cancelled, access until ${when}` : 'cancelled, access until the period ends');
  else if (s.status === 'trialing') parts.push(when ? `free trial, first charge ${when}` : 'free trial');
  else parts.push(when ? `renews ${when}` : 'renews automatically');
  return parts.join(', ');
};

/**
 * Settings → Plan & Billing: what the signed-in person has and where to manage it. Invoices,
 * the card on file and cancelling live in the Stripe billing portal, so this only links there.
 * Subscriptions and earlier one-time purchases (kept for good) are listed apart; when the API
 * doesn't say which is which, the unlocks are listed without claiming either.
 */
const BillingSection = ({ onSeePlans }) => {
  const [summary, setSummary] = useState(undefined); // undefined = loading, null = couldn't read
  // Can the billing portal open? false = no Stripe customer (given by hand), null = unknown
  const [billingAccount, setBillingAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    getBillingSummary().then((s) => {
      if (!live) return;
      setSummary(s);
      // Only someone with a plan, a subscription or an unlock is offered the portal; ask whether billing is behind it
      if (s && (s.plan === 'pro' || s.certs?.length > 0 || s.owned?.length > 0 || s.subscriptions?.length > 0)) {
        getBillingAccountStatus().then((b) => live && setBillingAccount(b));
      }
    });
    return () => { live = false; };
  }, []);

  const handleManage = async () => {
    setError('');
    setBusy(true);
    try {
      await openBillingPortal(); // leaves the page on success
    } catch (err) {
      console.error('[Settings] Portal failed:', err);
      setError(portalErrorMessage(err, 'Could not open the billing portal. Please try again.'));
      setBusy(false);
    }
  };

  const isPro = summary?.plan === 'pro';
  const subscriptions = summary?.subscriptions ?? null;
  const known = Array.isArray(subscriptions) && Array.isArray(summary?.owned);
  // Bought for good: owned one by one, minus whatever a live subscription covers
  const lifetime = known
    ? summary.owned.filter((id) => !subscriptions.some((s) => s.plan === id))
    : [];
  // Not told apart: the token's list, except for Pro, whose token lists every product
  const unlocks = !known && !isPro ? summary?.certs ?? [] : [];
  const hasAccess = isPro || (subscriptions?.length ?? 0) > 0 || lifetime.length > 0 || unlocks.length > 0
    || (summary?.certs?.length ?? 0) > 0;
  // Anyone who paid has a Stripe customer, so the portal has their receipts. Access given by hand
  // has none: the portal could only fail, so there is no button for it.
  const given = hasAccess && billingAccount === false;
  const hasPaid = hasAccess && !given;
  const mayCancel = !known || subscriptions.length > 0 || isPro;

  return (
    <div className="settings-section billing-section">
      <h2><PricingIcon size={20} /> Plan &amp; Billing</h2>
      {summary === undefined && <p className="billing-status">Checking your plan…</p>}
      {summary === null && <p className="billing-status">We couldn't read your plan right now. Reload the page to try again.</p>}
      {summary && (
        <>
          <p className="billing-plan">
            Your plan: <strong>{isPro ? 'Pro (all access)' : 'Free'}</strong>
          </p>
          {subscriptions?.length > 0 && (
            <div className="billing-unlocks">
              <p>Subscriptions:</p>
              <ul aria-label="Subscriptions">
                {subscriptions.map((s) => (
                  <li key={`${s.plan}-${s.interval}`}>
                    {planName(s.plan)} <span className="billing-detail">({subscriptionStatus(s)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lifetime.length > 0 && (
            <div className="billing-unlocks">
              <p>Purchased (lifetime access):</p>
              <ul aria-label="Purchased (lifetime access)">
                {lifetime.map((id) => <li key={id}>{planName(id)}</li>)}
              </ul>
            </div>
          )}
          {unlocks.length > 0 && (
            <div className="billing-unlocks">
              <p>Unlocked:</p>
              <ul aria-label="Unlocked">
                {unlocks.map((id) => <li key={id}>{planName(id)}</li>)}
              </ul>
            </div>
          )}
          <div className="billing-actions">
            {hasPaid && (
              <button type="button" className="billing-btn" onClick={handleManage} disabled={busy}>
                {busy ? 'Opening…' : 'Manage billing'}
              </button>
            )}
            {!isPro && (
              <button type="button" className="billing-btn secondary" onClick={onSeePlans}>
                See plans
              </button>
            )}
          </div>
          {hasPaid && (
            <p className="billing-note">
              Invoices, your payment method{mayCancel ? ' and cancelling' : ''} are in the Stripe billing portal.
            </p>
          )}
          {given && (
            <p className="billing-note">
              {isPro ? 'Pro was' : 'Your unlocks were'} given to this account, not bought, so there is no billing to manage.
            </p>
          )}
          {error && <p className="settings-error" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
};

export default BillingSection;
