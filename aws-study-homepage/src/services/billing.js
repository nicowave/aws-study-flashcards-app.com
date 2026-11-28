// Billing service — thin client over the Stripe payment functions (AWS Lambda).
// Enabled via VITE_BILLING_ENABLED=true once Stripe products/prices exist
// (see docs/stripe-setup.md). Entitlements are read from the sign-in token's
// claims, which the server sets from Stripe webhooks — never from
// client-writable state.
import { getTokens, decodeJwt, callFunction, apiFetch } from './awsAuth';
import { onThisName } from '../config/auth.config';
import { INTERVALS, PRO_TRIAL_DAYS } from '../data/prices';

export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === 'true';

// Free trial for first-time Pro members; checkout decides who qualifies. Defined with the prices in
// src/data/prices.js; keep it in step with PRO_TRIAL_DAYS in aws-backend/lambda/callables/index.js.
export { PRO_TRIAL_DAYS };

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
 * The signed-in user's plan and unlocked products from ID token claims (set by the pre-token Lambda):
 * { plan: 'pro' | null, certs: ['developer-associate', 'bash-for-aws', ...] }, or null when the
 * token can't be read. certs mixes subscriptions and earlier one-time purchases, and for Pro it lists
 * every product; getBillingSummary() tells them apart.
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

// Subscription statuses that still give access (same as ACTIVE_STATUSES in the backend)
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

/**
 * What Settings → Plan & Billing shows: the token's { plan, certs } plus, from GET /v1/me, the
 * products owned one by one (ENTITLEMENTS.certs, without Pro's expansion) and the live
 * subscriptions ({ plan, interval, status, cancelAtPeriodEnd, currentPeriodEnd }).
 * owned / subscriptions are null when the API doesn't say, so the page never guesses which
 * unlock is a subscription and which is a lifetime purchase. null when signed out.
 */
export const getBillingSummary = async ({ forceRefresh = false } = {}) => {
  const ent = await getEntitlements({ forceRefresh });
  if (!ent) return null;
  let owned = null;
  let subscriptions = null;
  try {
    const e = (await apiFetch('/v1/me'))?.entitlements;
    if (Array.isArray(e?.certs)) owned = e.certs;
    if (Array.isArray(e?.active)) {
      subscriptions = e.active
        .filter((s) => s && s.plan && LIVE_STATUSES.has(s.status))
        .map(({ plan, interval, status, cancelAtPeriodEnd, currentPeriodEnd }) => ({
          plan,
          interval: INTERVALS.includes(interval) ? interval : null,
          status,
          cancelAtPeriodEnd: !!cancelAtPeriodEnd,
          currentPeriodEnd: currentPeriodEnd || null,
        }));
    }
  } catch (err) {
    console.warn('[billing] Subscription lookup failed:', err.message);
  }
  return { ...ent, owned, subscriptions };
};

/**
 * Starts Stripe Checkout for a plan, billed monthly or yearly ('month' | 'year'), and redirects the
 * browser. Pro (all-access) is yearly only. The server may instead answer with the page that
 * switches an active monthly subscription to yearly, or with "already owned"; either way it is a
 * URL to open.
 */
export const startCheckout = async (plan = 'all-access', interval = 'year') => {
  if (!INTERVALS.includes(interval)) throw new Error(`Unknown billing interval: ${interval}`);
  // Come back to the name the buyer paid on; the server accepts only listed Study Hub addresses.
  const { data } = await callFunction('createCheckoutSession', { plan, interval, returnUrl: window.location.origin });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

/**
 * Whether checkout would give this signed-in person the free Pro trial: true, false, or null when
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
