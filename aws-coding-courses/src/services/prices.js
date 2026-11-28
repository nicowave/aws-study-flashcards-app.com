// Every price the course sites show comes from here (unlock card, sale math). The games have the
// same file (src/services/prices.js) and the hub has its copy in aws-study-homepage/src/data/prices.js.
// Stripe holds the real prices (STRIPE_PRICE_<X>_COURSE_MONTHLY / _YEARLY and
// STRIPE_PRICE_ALL_ACCESS_YEARLY in aws-backend/.env): keep these labels in step with them and with
// the hub's terms page.

// Each coding course (and each certification game) is its own subscription, monthly or yearly
export const PRODUCT_MONTHLY = '$11';
export const PRODUCT_YEARLY = '$69';
// Pro (all-access): every coding course and every certification game, yearly only
export const PRO_YEARLY = '$199';
// Free trial for first-time Pro members only; checkout decides who qualifies.
// Keep in step with PRO_TRIAL_DAYS in aws-backend/lambda/callables/index.js.
export const PRO_TRIAL_DAYS = 14;

export const PRO_PLAN = 'all-access';
export const INTERVALS = ['month', 'year'];
export const PRODUCT_PRICES = { month: PRODUCT_MONTHLY, year: PRODUCT_YEARLY };

export const cents = (price) => Math.round(Number(String(price).replace(/[^0-9.]/g, '')) * 100);

// Yearly against twelve monthly payments ($11 x 12 = $132 vs $69 is 48%). Computed, never typed.
export const YEARLY_SAVINGS_PERCENT = Math.round((1 - cents(PRODUCT_YEARLY) / (12 * cents(PRODUCT_MONTHLY))) * 100);
