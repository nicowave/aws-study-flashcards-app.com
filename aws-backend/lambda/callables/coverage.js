// Does the account already have what checkout is about to sell?
//
// Why this exists: a signed-in page reads Pro from the sign-in token, and that token can be up to an
// hour old. Someone given Pro (a free year, or a purchase whose webhook just landed) can still see
// "Start Free Trial" or a certificate's paywall. They have had Pro, so the trial no longer applies,
// and checkout would charge a second Pro year, or a certificate Pro already includes, at once.
// createCheckoutSession asks this first and sends such a buyer back to the site instead.
//
// Pure: no AWS or Stripe calls, so it is tested on its own (aws-backend/test/checkout-guard.test.js).

// What a Pro subscription unlocks: the yearly plan itself and the four exam certificates.
// The coding courses and the Developer Path bundle are sold separately (the course sites read
// `certs` only), so they are never treated as covered by Pro.
const PRO_COVERS = new Set([
  "all-access",
  "cloud-practitioner",
  "ai-practitioner",
  "solutions-architect-associate",
  "developer-associate",
]);

/**
 * True when the account already holds `plan`, or something that includes it.
 *
 * @param {object}   args
 * @param {string}   args.plan           the plan the buyer asked for
 * @param {Set}      args.purchased      one-time plans recorded for the account (PURCHASE# rows)
 * @param {Array}    args.subscriptions  the account's own Stripe subscriptions as { status, plan }
 * @param {object}   args.bundles        BUNDLES: bundle plan -> the plans it unlocks
 * @param {string[]} args.activeStatuses subscription statuses that still give access
 */
function alreadyCovered({ plan, purchased, subscriptions, bundles, activeStatuses }) {
  // Courses and bundles keep their old behaviour: this guard is about Pro.
  if (!PRO_COVERS.has(plan)) return false;
  if (purchased.has(plan) || purchased.has("all-access")) return true;
  for (const owned of purchased) {
    if ((bundles[owned] || []).includes(plan)) return true;
  }
  return subscriptions.some(
    (sub) => activeStatuses.includes(sub.status) && (sub.plan === "all-access" || sub.plan === plan)
  );
}

module.exports = { PRO_COVERS, alreadyCovered };
