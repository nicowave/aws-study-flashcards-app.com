// Billing service — thin client over the Stripe Cloud Functions.
// Enabled via VITE_BILLING_ENABLED=true once Stripe products/prices exist
// (see docs/stripe-setup.md). Entitlements are read from Firebase custom
// claims, which the server sets from Stripe webhooks — never from
// client-writable state.
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../config/firebase.config';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

// Optional display label for the Pro price, e.g. "$29/yr" (set in .env)
export const PRO_PRICE_LABEL = import.meta.env.VITE_PRO_PRICE_LABEL || '';

/**
 * Returns the signed-in user's plan from ID token claims ('pro' or null).
 * Pass { forceRefresh: true } right after checkout returns to pick up
 * freshly-set claims.
 */
export const getPlan = async ({ forceRefresh = false } = {}) => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const { claims } = await user.getIdTokenResult(forceRefresh);
    return claims.plan || null;
  } catch (err) {
    console.warn('[billing] Failed to read plan claim:', err.message);
    return null;
  }
};

/** Starts Stripe Checkout for the given plan and redirects the browser. */
export const startCheckout = async (plan = 'all-access') => {
  const call = httpsCallable(functions, 'createCheckoutSession');
  const { data } = await call({ plan });
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
