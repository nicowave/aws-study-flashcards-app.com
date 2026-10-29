// Billing for the course sites — a thin client over the Stripe payment
// functions (AWS Lambda), like the certification games use. A course is a
// one-time purchase; access comes from the sign-in token's `certs` claim,
// which the Stripe webhook sets server-side. All-access ("Pro") doesn't
// include courses at launch.
import { getTokens, decodeJwt, callFunction } from './awsAuth';

/** True when the signed-in user bought this course. */
export const hasCourseAccess = async (courseId, { forceRefresh = false } = {}) => {
  try {
    const tokens = await getTokens({ forceRefresh });
    if (!tokens) return false;
    const claims = decodeJwt(tokens.idToken);
    return (claims.certs || '').split(',').includes(courseId);
  } catch (err) {
    console.warn('[billing] Failed to read entitlement claims:', err.message);
    return false;
  }
};

/** Starts Stripe Checkout for this course and redirects; comes back to returnPath. */
export const startCheckout = async (plan, returnPath = '') => {
  const { data } = await callFunction('createCheckoutSession', {
    plan,
    returnUrl: `${window.location.origin}${returnPath.replace(/\/$/, '')}`,
  });
  if (data?.url) {
    window.location.assign(data.url);
  } else {
    throw new Error('No checkout URL returned');
  }
};
