// Billing service — thin client over the Stripe payment functions (AWS Lambda).
// Enabled via VITE_BILLING_ENABLED=true. Entitlements come from the sign-in
// token's plan/certs claims, set server-side from the Stripe webhook — never
// client-writable state.
import { getTokens, decodeJwt, callFunction } from './awsAuth';
import { onThisName } from '../config/auth.config';
import { INTERVALS } from './prices';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

/**
 * True when the signed-in user may access this cert's premium content:
 * an all-access plan ('pro'), a subscription to this cert, or an earlier one-time purchase of it.
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

/**
 * True when the signed-in user has paid for anything (Pro, a subscription or an earlier purchase),
 * so Settings can offer "Manage billing". Reads the same token claims as hasCertEntitlement.
 */
export const hasPaidPlan = async () => {
  try {
    const tokens = await getTokens();
    if (!tokens) return false;
    const claims = decodeJwt(tokens.idToken);
    return claims.plan === 'pro' || (claims.certs || '').split(',').some(Boolean);
  } catch (err) {
    console.warn('[billing] Failed to read plan claims:', err.message);
    return false;
  }
};

/**
 * Starts Stripe Checkout for a plan billed monthly or yearly ('month' | 'year') and redirects.
 * Pro ('all-access') is yearly only. The server may answer instead with the billing page that
 * switches an active monthly subscription to yearly, or with "already owned"; either way it is
 * a URL to open.
 */
export const startCheckout = async (plan, interval = 'year') => {
  if (!INTERVALS.includes(interval)) throw new Error(`Unknown billing interval: ${interval}`);
  if (plan === 'all-access' && interval !== 'year') throw new Error('Pro is billed yearly');
  const { data } = await callFunction('createCheckoutSession', { plan, interval, returnUrl: window.location.origin });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

/** Opens the Stripe customer portal (manage / cancel / invoices). */
export const openBillingPortal = async () => {
  // Come back to the hub on the name the member opened (on the old name that is the old hub, as
  // before). The server accepts only listed Study Hub addresses and otherwise uses the old hub.
  const { data } = await callFunction('createPortalSession', { returnUrl: onThisName('https://aws-study-flashcards-app.com') });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
