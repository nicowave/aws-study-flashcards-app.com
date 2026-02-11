// GA4 Analytics Opt-out Service
const GA_MEASUREMENT_ID = 'G-GQHQG5PP10';
const STORAGE_KEY = 'awsStudy_gaOptOut';

/**
 * Check if user has opted out of analytics
 */
export const isAnalyticsOptedOut = () => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

/**
 * Apply the current opt-out preference.
 * Must be called on app initialization (before any tracking fires).
 */
export const applyAnalyticsPreference = () => {
  const optedOut = isAnalyticsOptedOut();
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = optedOut;

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: optedOut ? 'denied' : 'granted',
    });
  }
};

/**
 * Set the analytics opt-out preference
 */
export const setAnalyticsOptOut = (optOut) => {
  localStorage.setItem(STORAGE_KEY, optOut ? 'true' : 'false');
  applyAnalyticsPreference();
};
