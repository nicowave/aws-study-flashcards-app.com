// "Manage billing": opens the Stripe customer portal (switch monthly/yearly, card, invoices,
// cancel). Shown to signed-in people, since a subscription bought on any Study Hub site is managed
// from every site.
import React, { useState } from 'react';
import { openBillingPortal } from '../services/billing';
import { useT } from './i18n';

const ManageBilling = ({ course, returnPath = '', className = 'link-btn' }) => {
  const t = useT(course);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      await openBillingPortal(returnPath);
    } catch (e) {
      setBusy(false);
      setError(/no billing account/i.test(e.message) ? t('billing.none') : t('billing.failed'));
    }
  };

  return (
    <span className="manage-billing">
      <button type="button" className={className} onClick={open} disabled={busy}>
        {busy ? t('billing.opening') : t('billing.manage')}
      </button>
      {error && <span className="manage-billing-error" role="alert">{error}</span>}
    </span>
  );
};

export default ManageBilling;
