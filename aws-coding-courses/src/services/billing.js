// Billing for the course sites: a thin client over the Stripe payment functions (AWS Lambda), like
// the certification games and the hub use. A course is a subscription, monthly or yearly; Pro
// (all-access, yearly) includes every course. Access comes from the sign-in token's claims, which
// the server sets from Stripe webhooks, never from client-writable state.
import { getTokens, decodeJwt, callFunction } from './awsAuth';
import { INTERVALS, PRO_PLAN } from './prices';

/**
 * True when the signed-in user has this course: Pro (plan 'pro'), or the course id in `certs`
 * (a subscription, or an earlier one-time purchase that stays valid for good). The server already
 * lists every course in `certs` for Pro; checking `plan` too covers a token issued before that.
 */
export const hasCourseAccess = async (courseId, { forceRefresh = false } = {}) => {
  try {
    const tokens = await getTokens({ forceRefresh });
    if (!tokens) return false;
    const claims = decodeJwt(tokens.idToken);
    if (claims.plan === 'pro') return true;
    return String(claims.certs || '').split(',').map((c) => c.trim()).includes(courseId);
  } catch (err) {
    console.warn('[billing] Failed to read entitlement claims:', err.message);
    return false;
  }
};

/**
 * Starts Stripe Checkout for a course billed monthly or yearly ('month' | 'year'), or for Pro
 * ('all-access', yearly only), and redirects; comes back to returnPath on this site. The server may
 * answer instead with the billing page that switches an active monthly subscription to yearly, or
 * with "already owned"; either way it is a URL to open.
 */
export const startCheckout = async (plan, interval = 'year', returnPath = '') => {
  if (!INTERVALS.includes(interval)) throw new Error(`Unknown billing interval: ${interval}`);
  if (plan === PRO_PLAN && interval !== 'year') throw new Error('Pro is billed yearly');
  const { data } = await callFunction('createCheckoutSession', {
    plan,
    interval,
    // Back to the name the buyer paid on; the server accepts only listed Study Hub addresses.
    returnUrl: `${window.location.origin}${returnPath.replace(/\/$/, '')}`,
  });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};

// One answer per signed-in account per page: the footer and the course page both ask
let billingStatusFor = { sub: null, answer: null };

/**
 * Whether the billing portal can open for the signed-in account: true, false, or null when
 * unknown. False means no Stripe customer (Pro or a course given by hand, or nothing bought yet),
 * so "Manage billing" could only fail and is not offered. Unknown keeps the button. Same rule as
 * the hub and the games.
 */
export const getBillingAccountStatus = async () => {
  let sub = null;
  try {
    const tokens = await getTokens();
    if (!tokens) return null;
    sub = decodeJwt(tokens.idToken)?.sub ?? null;
    if (sub && billingStatusFor.sub === sub) return await billingStatusFor.answer;
    const answer = callFunction('billingStatus', {})
      .then(({ data }) => (typeof data?.hasBillingAccount === 'boolean' ? data.hasBillingAccount : null));
    if (sub) billingStatusFor = { sub, answer };
    return await answer;
  } catch (err) {
    // Includes a backend that predates billingStatus (NOT_FOUND): keep the button, as before
    console.warn('[billing] Billing status lookup failed:', err.message);
    if (sub && billingStatusFor.sub === sub) billingStatusFor = { sub: null, answer: null }; // ask again next time
    return null;
  }
};

/**
 * Which message to show when the portal will not open: 'billing.none' when the server refused
 * because there is no billing behind the account (FAILED_PRECONDITION), else 'billing.failed'.
 * A key, not the server's words, so the bilingual course can say it in Spanish too.
 */
export const portalErrorKey = (err) =>
  err?.code === 'FAILED_PRECONDITION' || /no billing/i.test(err?.message || '') ? 'billing.none' : 'billing.failed';

/** Opens the Stripe customer portal (switch monthly/yearly, card, invoices, cancel); returns here. */
export const openBillingPortal = async (returnPath = '') => {
  const { data } = await callFunction('createPortalSession', {
    returnUrl: `${window.location.origin}${returnPath.replace(/\/$/, '')}`,
  });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No portal URL returned');
  }
};
