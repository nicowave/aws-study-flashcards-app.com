// Billing service — thin client over the Stripe payment functions (AWS Lambda).
// Enabled via VITE_BILLING_ENABLED=true. Entitlements come from the sign-in
// token's plan/certs claims, set server-side from the Stripe webhook — never
// client-writable state.
import { getTokens, decodeJwt, callFunction } from './awsAuth';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

// Display label for this cert's one-time price (set per app at build time)
export const CERT_PRICE_LABEL = import.meta.env.VITE_CERT_PRICE_LABEL || 'one-time purchase';

/**
 * True when the signed-in user may access this cert's premium content:
 * an all-access plan ('pro') or a purchase of this cert.
 * Pass { forceRefresh: true } right after checkout to pick up a new purchase.
 */
export const hasCertEntitlement = async (certId, { forceRefresh = false } = {}) => {
  try {
    const tokens = await getTokens({ forceRefresh });
    if (!tokens) return false;
    const claims = decodeJwt(tokens.idToken);
    if (claims.plan === 'pro') return true;
    return (claims.certs || '').split(',').includes(certId);
  } catch (err) {
    console.warn('[billing] Failed to read entitlement claims:', err.message);
    return false;
  }
};

/** Starts Stripe Checkout for this plan (one-time or subscription) and redirects. */
export const startCheckout = async (plan) => {
  const { data } = await callFunction('createCheckoutSession', { plan, returnUrl: window.location.origin });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

/** Opens the Stripe customer portal (manage / cancel / invoices). */
export const openBillingPortal = async () => {
  const { data } = await callFunction('createPortalSession');
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
