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
