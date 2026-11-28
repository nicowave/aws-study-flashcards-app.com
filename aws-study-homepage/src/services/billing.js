// Billing service — thin client over the Stripe payment functions (AWS Lambda).
// Enabled via VITE_BILLING_ENABLED=true once Stripe products/prices exist
// (see docs/stripe-setup.md). Entitlements are read from the sign-in token's
// claims, which the server sets from Stripe webhooks — never from
// client-writable state.
import { getTokens, decodeJwt, callFunction } from './awsAuth';
import { onThisName } from '../config/auth.config';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

// Optional display label for the Pro price, e.g. "$29/yr" (set in .env)
export const PRO_PRICE_LABEL = import.meta.env.VITE_PRO_PRICE_LABEL || '';

// Free week for first-time Pro members; checkout decides who qualifies.
// Keep in step with PRO_TRIAL_DAYS in aws-backend/lambda/callables/index.js.
export const PRO_TRIAL_DAYS = 7;

/**
 * Returns the signed-in user's plan from ID token claims ('pro' or null).
 * Pass { forceRefresh: true } right after checkout returns to pick up
 * freshly-set claims.
 */
export const getPlan = async ({ forceRefresh = false } = {}) => {
  try {
    const tokens = await getTokens({ forceRefresh });
    if (!tokens) return null;
    return decodeJwt(tokens.idToken).plan || null;
  } catch (err) {
    console.warn('[billing] Failed to read plan claim:', err.message);
    return null;
  }
};

/**
 * The signed-in user's plan and one-time unlocks from ID token claims (set by the pre-token Lambda):
 * { plan: 'pro' | null, certs: ['developer-associate', 'bash-for-aws', ...] }, or null when the
 * token can't be read.
 */
export const getEntitlements = async ({ forceRefresh = false } = {}) => {
  try {
    const tokens = await getTokens({ forceRefresh });
    if (!tokens) return null;
    const claims = decodeJwt(tokens.idToken);
    const certs = typeof claims.certs === 'string' ? claims.certs.split(',').map((c) => c.trim()).filter(Boolean) : [];
    return { plan: claims.plan || null, certs };
  } catch (err) {
    console.warn('[billing] Failed to read entitlements:', err.message);
    return null;
  }
};

/** Starts Stripe Checkout for the given plan and redirects the browser. */
export const startCheckout = async (plan = 'all-access') => {
  // Come back to the name the buyer paid on; the server accepts only listed Study Hub addresses.
  const { data } = await callFunction('createCheckoutSession', { plan, returnUrl: window.location.origin });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

/**
 * Whether checkout would give this signed-in person the free Pro week: true, false, or null when
 * unknown. The server uses the same rule as checkout (nobody behind this account or email has had
 * Pro), so the Pro card never promises a trial the person won't get.
 */
export const getProTrialStatus = async () => {
  try {
    const { data } = await callFunction('proTrialStatus', {});
    return typeof data?.trialAvailable === 'boolean' ? data.trialAvailable : null;
  } catch (err) {
    console.warn('[billing] Trial status lookup failed:', err.message);
    return null;
  }
};

/**
 * Whether the billing portal can open for this account: true, false, or null when unknown. False
 * means no Stripe customer (Pro given by hand, never bought), so there is nothing to manage and
 * the page shows a plain line instead of a button that can only fail. Unknown keeps the button.
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
  // Come back to the hub on the name the member opened (on the old name that is the old hub, as
  // before). The server accepts only listed Study Hub addresses and otherwise uses its own default.
  const { data } = await callFunction('createPortalSession', { returnUrl: onThisName('https://levelupstudyhub.com') });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
