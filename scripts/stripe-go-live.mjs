#!/usr/bin/env node
/**
 * One-shot Stripe LIVE-mode setup for AWS Study Hub.
 *
 * Automates everything the dashboard clicking did in sandbox:
 *   1. Creates the 4 products + prices (idempotent — finds existing by
 *      plan metadata before creating).
 *   2. Creates the webhook endpoint (idempotent by URL) and captures its
 *      signing secret from the creation response.
 *   3. Writes the price IDs to functions/.env.
 *   4. Stores STRIPE_WEBHOOK_SECRET (and optionally STRIPE_API_KEY) as
 *      Firebase secrets.
 *   5. Reminds you to deploy functions (or pass --deploy to do it).
 *
 * Usage (run from the repo root):
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-go-live.mjs [--dry-run] [--deploy]
 *
 * The setup key needs write access to Products, Prices, Webhook Endpoints,
 * and Billing Portal configurations — the account's standard secret key has
 * all of these. For the RUNTIME key (what the functions use), still create
 * a restricted key in the dashboard per docs/stripe-setup.md and store it:
 *   firebase functions:secrets:set STRIPE_API_KEY
 *
 * The key is read from the environment only; it is never written to disk,
 * logged, or echoed.
 */
import { execFileSync, execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Reuse the Stripe SDK already installed for the Cloud Functions
const Stripe = require("../functions/node_modules/stripe");

const DRY = process.argv.includes("--dry-run");
const DEPLOY = process.argv.includes("--deploy");
const WEBHOOK_URL =
  "https://us-central1-aws-study-hub.cloudfunctions.net/stripeWebhook";
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const PLANS = [
  { plan: "cloud-practitioner", name: "AWS Cloud Practitioner Prep", cents: 999, recurring: null, env: "STRIPE_PRICE_CLOUD_PRACTITIONER" },
  { plan: "ai-practitioner", name: "AWS AI Practitioner Prep", cents: 999, recurring: null, env: "STRIPE_PRICE_AI_PRACTITIONER" },
  { plan: "solutions-architect-associate", name: "AWS Solutions Architect Prep", cents: 1499, recurring: null, env: "STRIPE_PRICE_SOLUTIONS_ARCHITECT" },
  { plan: "all-access", name: "All-Access Bundle", cents: 3900, recurring: { interval: "year" }, env: "STRIPE_PRICE_ALL_ACCESS" },
];

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in the environment (never paste it into files or chat).");
  process.exit(1);
}
if (!/^(sk|rk)_live_/.test(key) && !DRY) {
  console.error(
    `This key is ${/^(sk|rk)_test_/.test(key) ? "a TEST key" : "unrecognized"} — this script targets LIVE mode.\n` +
    "Pass --dry-run to rehearse with a test key, or supply the live secret key."
  );
  process.exit(1);
}

const stripe = Stripe(key);
const log = (...a) => console.log(...a);

async function ensurePrice({ plan, name, cents, recurring, env }) {
  // Idempotency: a price tagged with our plan metadata wins.
  const existing = await stripe.prices.search({
    query: `metadata['plan']:'${plan}' AND active:'true'`,
    limit: 1,
  });
  if (existing.data.length > 0) {
    log(`✓ ${name}: existing price ${existing.data[0].id}`);
    return { env, id: existing.data[0].id };
  }
  if (DRY) {
    log(`[dry-run] would create product "${name}" with ${recurring ? "yearly" : "one-time"} price $${(cents / 100).toFixed(2)}`);
    return { env, id: "price_DRYRUN" };
  }
  const product = await stripe.products.create({ name, metadata: { plan } });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: cents,
    currency: "usd",
    ...(recurring ? { recurring } : {}),
    metadata: { plan },
  });
  log(`✓ ${name}: created ${price.id} (${recurring ? "yearly" : "one-time"} $${(cents / 100).toFixed(2)})`);
  return { env, id: price.id };
}

async function ensureWebhook() {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === WEBHOOK_URL);
  if (existing) {
    log(`✓ Webhook endpoint exists (${existing.id}). NOTE: its signing secret is only revealed at creation —`);
    log("  if the STRIPE_WEBHOOK_SECRET Firebase secret is stale, delete the endpoint in the dashboard and re-run.");
    return null;
  }
  if (DRY) {
    log(`[dry-run] would create webhook endpoint ${WEBHOOK_URL}`);
    return null;
  }
  const ep = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: "AWS Study Hub entitlement sync",
  });
  log(`✓ Webhook endpoint created (${ep.id}); capturing signing secret`);
  return ep.secret; // only available on the creation response
}

async function ensurePortal() {
  const configs = await stripe.billingPortal.configurations.list({ limit: 1, is_default: true });
  if (configs.data.length > 0) {
    log("✓ Customer portal already configured");
    return;
  }
  if (DRY) {
    log("[dry-run] would create default customer portal configuration");
    return;
  }
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: "AWS Study Hub" },
    default_return_url: "https://aws-study-flashcards-app.com",
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  log("✓ Customer portal configuration created (subscription cancel enabled)");
}

let prices = [];
let whsec = null;
try {
  for (const p of PLANS) prices.push(await ensurePrice(p));
  whsec = await ensureWebhook();
  await ensurePortal();
} catch (err) {
  if (err?.type === "StripeAuthenticationError") {
    console.error("\nStripe rejected the key (StripeAuthenticationError). Check STRIPE_SECRET_KEY and try again.");
    process.exit(1);
  }
  if (err?.type === "StripePermissionError") {
    console.error(`\nThe key lacks a permission this script needs: ${err.message}\nUse the account's standard secret key for setup (the runtime key stays restricted).`);
    process.exit(1);
  }
  throw err;
}

// functions/.env
const envPath = "functions/.env";
const lines = existsSync(envPath)
  ? readFileSync(envPath, "utf8").split("\n").filter((l) => l && !/^STRIPE_PRICE_/.test(l))
  : [];
for (const { env, id } of prices) lines.push(`${env}=${id}`);
if (DRY) {
  log(`[dry-run] would write ${envPath} with ${prices.length} price IDs`);
} else {
  writeFileSync(envPath, lines.join("\n") + "\n");
  log(`✓ ${envPath} updated with live price IDs`);
}

// Firebase secrets
if (whsec && !DRY) {
  execFileSync("firebase", ["functions:secrets:set", "STRIPE_WEBHOOK_SECRET", "--data-file", "-"], {
    input: whsec,
    stdio: ["pipe", "inherit", "inherit"],
  });
  log("✓ STRIPE_WEBHOOK_SECRET stored in Firebase");
}

log("\nRemaining steps:");
log("  1. Runtime key (if not done): create a restricted LIVE key in the dashboard");
log("     (Checkout Sessions W, Customers W, Subscriptions R, Customer portal W), then:");
log("       firebase functions:secrets:set STRIPE_API_KEY");
if (DEPLOY && !DRY) {
  log("  2. Deploying functions now (--deploy)...");
  execSync("firebase deploy --only functions --non-interactive --force", { stdio: "inherit" });
} else {
  log("  2. Deploy:  firebase deploy --only functions");
}
log("Done.");
