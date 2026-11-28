// "Manage billing": opens the Stripe customer portal (switch monthly/yearly, card, invoices,
// cancel). A subscription bought on any Study Hub site is managed from every site, so it is offered
// to signed-in people, but only when there is billing behind the account: the server's
// billingStatus says false when there is no Stripe customer (Pro or a course given by hand, or
// nothing bought yet), and then the button, which could only fail, is not shown.
import React, { useEffect, useState } from 'react';
import { getBillingAccountStatus, openBillingPortal, portalErrorKey } from '../services/billing';
import { useT } from './i18n';

/**
 * Whether the billing portal can open: undefined while checking (or when `ask` is false), then
 * true, false (no billing to manage) or null (unknown, so the button stays).
 */
export const useBillingAccount = (ask = true) => {
  const [status, setStatus] = useState(undefined);
  useEffect(() => {
    if (!ask) { setStatus(undefined); return undefined; }
    let live = true;
    getBillingAccountStatus().then((b) => { if (live) setStatus(b); });
    return () => { live = false; };
  }, [ask]);
  return status;
};

// `item` wraps it in an <li> (the footer list), so no empty list item is left when it is hidden
const ManageBilling = ({ course, returnPath = '', className = 'link-btn', item = false }) => {
  const t = useT(course);
  const billingAccount = useBillingAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Nothing while checking, and nothing when there is no billing to manage
  if (billingAccount === undefined || billingAccount === false) return null;

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      await openBillingPortal(returnPath);
    } catch (e) {
      setBusy(false);
      setError(t(portalErrorKey(e)));
    }
  };

  const control = (
    <span className="manage-billing">
      <button type="button" className={className} onClick={open} disabled={busy}>
        {busy ? t('billing.opening') : t('billing.manage')}
      </button>
      {error && <span className="manage-billing-error" role="alert">{error}</span>}
    </span>
  );
  return item ? <li>{control}</li> : control;
};

export default ManageBilling;
