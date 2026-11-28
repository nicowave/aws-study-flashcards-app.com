// Every price this game shows comes from here (paywall, guest upsell, sale math). The same file
// is in all four games; the hub has its copy in aws-study-homepage/src/data/prices.js. Stripe holds
// the real prices (STRIPE_PRICE_<X>_MONTHLY / _YEARLY and STRIPE_PRICE_ALL_ACCESS_YEARLY in
// aws-backend/.env): keep these labels in step with them and with the hub's terms page.

// Each certification game (and each coding course) is its own subscription, monthly or yearly
export const PRODUCT_MONTHLY = '$11';
export const PRODUCT_YEARLY = '$69';
// Pro (all-access): every certification and every coding course, yearly only
export const PRO_YEARLY = '$199';
// Free trial (in days) for first-time Pro members only; checkout decides who qualifies.
// Keep in step with PRO_TRIAL_DAYS in aws-backend/lambda/callables/index.js.
export const PRO_TRIAL_DAYS = 14;

export const INTERVALS = ['month', 'year'];
export const PRODUCT_PRICES = { month: PRODUCT_MONTHLY, year: PRODUCT_YEARLY };

export const cents = (price) => Math.round(Number(String(price).replace(/[^0-9.]/g, '')) * 100);

// Yearly against twelve monthly payments ($11 x 12 = $132 vs $69 is 48%). Computed, never typed.
export const YEARLY_SAVINGS_PERCENT = Math.round((1 - cents(PRODUCT_YEARLY) / (12 * cents(PRODUCT_MONTHLY))) * 100);
