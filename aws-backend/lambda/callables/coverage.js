// Does the account already have what checkout is about to sell?
//
// Why this exists: a signed-in page reads its access from the sign-in token, and that token can be
// up to an hour old. Someone given Pro (a free year, or a purchase whose webhook just landed), or
// someone already subscribed to a product, can still see "Start Free Trial" or a paywall. Checkout
// would then charge them a second time. createCheckoutSession asks this first and sends such a
// buyer back to the site instead.
//
// Pure: no AWS or Stripe calls, so it is tested on its own (aws-backend/test/checkout-guard.test.js).

// The nine products sold one by one: the four exam games and the five courses.
// lambda/pre-token/index.js keeps a copy (it is uploaded on its own and can't require this file);
// test/pre-token.test.js checks the two lists match.
const PRODUCTS = [
  "cloud-practitioner",
  "ai-practitioner",
  "solutions-architect-associate",
  "developer-associate",
  "bash-for-aws",
  "python-for-aws",
  "javascript-for-aws",
  "typescript-for-aws",
  "tech-spanish",
];

// What a Pro subscription unlocks: the yearly plan itself and every product, courses included.
// Bundles (developer-path) are not plans Pro covers by name; alreadyCovered checks their contents.
const PRO_COVERS = new Set(["all-access", ...PRODUCTS]);

/**
 * What already gives the account `plan`, or null when nothing does.
 *   { by: "purchase" }                  a one-time purchase of the plan, or of Pro (PURCHASE# rows)
 *   { by: "bundle" }                    a one-time bundle that includes it (developer-path)
 *   { by: "pro" }                       an active Pro subscription
 *   { by: "subscription", subscription } an active subscription to this very plan. When there are
 *                                       several, one that is not monthly wins, so a monthly buyer
 *                                       asking for yearly is only offered the switch when that is
 *                                       all they have.
 * A bundle asked for by name counts as covered when everything in it is.
 *
 * @param {object}   args
 * @param {string}   args.plan           the plan the buyer asked for
 * @param {Set}      args.purchased      one-time plans recorded for the account (PURCHASE# rows)
 * @param {Array}    args.subscriptions  the account's own Stripe subscriptions as { status, plan, interval, ... }
 * @param {object}   args.bundles        BUNDLES: bundle plan -> the plans it unlocks
 * @param {string[]} args.activeStatuses subscription statuses that still give access
 */
function coverageFor({ plan, purchased, subscriptions, bundles, activeStatuses }) {
  if (bundles[plan]) {
    if (purchased.has(plan)) return { by: "purchase" };
    const parts = bundles[plan].map((p) => coverageFor({ plan: p, purchased, subscriptions, bundles, activeStatuses }));
    return parts.every(Boolean) ? { by: "bundle" } : null;
  }
  if (!PRO_COVERS.has(plan)) return null; // unknown plan
  if (purchased.has(plan) || purchased.has("all-access")) return { by: "purchase" };
  for (const owned of purchased) {
    if ((bundles[owned] || []).includes(plan)) return { by: "bundle" };
  }
  const active = subscriptions.filter((sub) => activeStatuses.includes(sub.status));
  if (active.some((sub) => sub.plan === "all-access")) return { by: "pro" };
  const same = active.filter((sub) => sub.plan === plan);
  if (!same.length) return null;
  return { by: "subscription", subscription: same.find((sub) => sub.interval !== "month") || same[0] };
}

/** True when the account already holds `plan`, or something that includes it. */
const alreadyCovered = (args) => coverageFor(args) !== null;

module.exports = { PRODUCTS, PRO_COVERS, coverageFor, alreadyCovered };
