// Billing service — thin client over the Stripe Cloud Functions.
// Enabled via VITE_BILLING_ENABLED=true. Entitlements come from Firebase
// custom claims set by the Stripe webhook — never client-writable state.
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../config/firebase.config';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

// Display label for the per-cert subscription price
export const CERT_PRICE_LABEL = import.meta.env.VITE_CERT_PRICE_LABEL || '$10.99/mo';

/**
 * True when the signed-in user may access this cert's premium content:
 * an all-access plan ('pro') or a per-cert subscription claim.
 */
export const hasCertEntitlement = async (certId, { forceRefresh = false } = {}) => {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const { claims } = await user.getIdTokenResult(forceRefresh);
    if (claims.plan === 'pro') return true;
    return (claims.certs || '').split(',').includes(certId);
  } catch (err) {
    console.warn('[billing] Failed to read entitlement claims:', err.message);
    return false;
  }
};

/** Starts Stripe Checkout for this cert's subscription and redirects. */
export const startCheckout = async (plan) => {
  const call = httpsCallable(functions, 'createCheckoutSession');
  const { data } = await call({ plan, returnUrl: window.location.origin });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

/** Opens the Stripe customer portal (manage / cancel / invoices). */
export const openBillingPortal = async () => {
  const call = httpsCallable(functions, 'createPortalSession');
  const { data } = await call();
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
