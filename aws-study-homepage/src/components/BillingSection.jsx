import React, { useEffect, useState } from 'react';
import { PricingIcon } from './Icons';
import { getEntitlements, getBillingAccountStatus, openBillingPortal, portalErrorMessage } from '../services/billing';
import { certifications } from '../data/certifications';
import { COURSES, OTHER_COURSES } from '../data/courses';

// Purchase ids (the token's `certs` claim) to the names the hub shows: certs keep their id,
// a Developer Path course is bought as `<course id>-for-aws`, any other course by its `plan`
const PURCHASE_NAMES = new Map([
  ...certifications.map((c) => [c.id, c.name.replace(/^AWS Certified /, '')]),
  ...COURSES.map((c) => [`${c.id}-for-aws`, c.title]),
  ...OTHER_COURSES.map((c) => [c.plan, c.title]),
]);
const purchaseName = (id) => PURCHASE_NAMES.get(id) || id;

/**
 * Settings → Plan & Billing: what the signed-in person has and where to manage it. Invoices,
 * the card on file and cancelling live in the Stripe billing portal, so this only links there.
 */
const BillingSection = ({ onSeePlans }) => {
  const [ent, setEnt] = useState(undefined); // undefined = loading, null = couldn't read
  // Can the billing portal open? false = no Stripe customer (given by hand), null = unknown
  const [billingAccount, setBillingAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    getEntitlements().then((e) => {
      if (!live) return;
      setEnt(e);
      // Only someone with a plan or an unlock is offered the portal; ask whether billing is behind it
      if (e && (e.plan === 'pro' || e.certs.length > 0)) getBillingAccountStatus().then((b) => live && setBillingAccount(b));
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

  const isPro = ent?.plan === 'pro';
  const unlocks = ent?.certs ?? [];
  const hasAccess = isPro || unlocks.length > 0;
  // Anyone who paid has a Stripe customer, so the portal has their receipts. Access given by hand
  // has none: the portal could only fail, so there is no button for it.
  const given = hasAccess && billingAccount === false;
  const hasPaid = hasAccess && !given;

  return (
    <div className="settings-section billing-section">
      <h2><PricingIcon size={20} /> Plan &amp; Billing</h2>
      {ent === undefined && <p className="billing-status">Checking your plan…</p>}
      {ent === null && <p className="billing-status">We couldn't read your plan right now. Reload the page to try again.</p>}
      {ent && (
        <>
          <p className="billing-plan">
            Your plan: <strong>{isPro ? 'Pro (all access)' : 'Free'}</strong>
          </p>
          {unlocks.length > 0 && (
            <div className="billing-unlocks">
              <p>Unlocked for good:</p>
              <ul aria-label="Unlocked for good">
                {unlocks.map((id) => <li key={id}>{purchaseName(id)}</li>)}
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
            <p className="billing-note">Invoices, your payment method{isPro ? ' and cancelling' : ''} are in the Stripe billing portal.</p>
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
