// Sales shown in the certification games. Checkout applies a sale's discount on
// its own (PROMOTIONS in aws-backend/lambda/callables/index.js, with Stripe
// coupons that expire by themselves); this file only shows it. Keep the
// copies in step: this one (the same in all four games), the hub's
// aws-study-homepage/src/services/offers.js, and the backend.

export const PROMOTIONS = [
  {
    name: 'halloween-2026',
    label: 'Halloween deal',
    // Oct 31 00:00 to Nov 6 23:59, US Eastern
    start: Date.parse('2026-10-31T04:00:00Z'),
    end: Date.parse('2026-11-07T05:00:00Z'),
    single: 31, // % off each course or certification
    bundle: 10, // % off the Developer Path and Pro
    starts: 'Saturday, October 31',
    ends: 'November 6',
    teaseFrom: Date.parse('2026-10-28T04:00:00Z'),
  },
];

// Local development only: ?promo=on or ?promo=soon previews the banners
const previewNow = (promo) => {
  if (!import.meta.env.DEV) return null;
  try {
    const q = new URLSearchParams(window.location.search).get('promo');
    if (q) sessionStorage.setItem('awsGame_promoPreview', q);
    const mode = sessionStorage.getItem('awsGame_promoPreview');
    if (mode === 'on') return promo.start + 1;
    if (mode === 'soon') return promo.start - 1;
  } catch { /* storage blocked */ }
  return null;
};

/** { promo, live } for a sale that's running (live) or about to start; or null. */
export const currentPromotion = (now = Date.now()) => {
  for (const promo of PROMOTIONS) {
    const t = previewNow(promo) ?? now;
    if (t >= promo.start && t < promo.end) return { promo, live: true };
    if (t >= promo.teaseFrom && t < promo.start) return { promo, live: false };
  }
  return null;
};

/** '$19.99' less 31%, rounded the way Stripe rounds the discount: '$13.79'. */
export const salePrice = (price, percent) => {
  const cents = Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) * 100);
  const off = Math.round((cents * percent) / 100);
  return `$${((cents - off) / 100).toFixed(2)}`;
};
