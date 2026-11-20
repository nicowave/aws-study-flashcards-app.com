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
