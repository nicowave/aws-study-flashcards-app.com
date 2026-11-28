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

/**
 * Whether the billing portal can open for this account: true, false, or null when unknown. False
 * means no Stripe customer (Pro or an unlock given by hand, never bought), so there is nothing to
 * manage and Settings shows a plain line instead of a button that can only fail. Unknown keeps the
 * button. Same rule as the hub.
 */
export const getBillingAccountStatus = async () => {
  try {
    const { data } = await callFunction('billingStatus', {});
    return typeof data?.hasBillingAccount === 'boolean' ? data.hasBillingAccount : null;
  } catch (err) {
    // Includes a backend that predates billingStatus (NOT_FOUND): keep the button, as before
    console.warn('[billing] Billing status lookup failed:', err.message);
    return null;
  }
};

/**
 * What to show when the portal will not open: the server's own reason when it refused on purpose
 * (no billing to manage, an expired sign-in), else the fallback (offline, or a crash on our side).
 */
export const portalErrorMessage = (err, fallback) =>
  err?.code && err.code !== 'INTERNAL' && err.message ? err.message : fallback;

/** Opens the Stripe customer portal (manage / cancel / invoices). */
export const openBillingPortal = async () => {
  // Come back to the hub on the name the member opened (on the old name that is still the old
  // hub). The server accepts only listed Study Hub addresses and otherwise uses its default hub.
  const { data } = await callFunction('createPortalSession', { returnUrl: onThisName('https://levelupstudyhub.com') });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
