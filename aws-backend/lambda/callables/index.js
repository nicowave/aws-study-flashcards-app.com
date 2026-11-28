// Payment functions (Stripe checkout, billing portal, webhook) on AWS Lambda.
// Callers sign in with Cognito and send their ID token. Purchases and
// entitlements live in DynamoDB; the pre-token Lambda turns ENTITLEMENTS into
// the plan/certs claims the apps read.
//
// Routes under /callable/{name} keep the request shape of the old Firebase
// callable functions, so the apps' callFunction() stayed the same:
//   request  POST {"data": ...}  (+ "Authorization: Bearer <ID token>")
//   success  200  {"result": ...}
//   failure  4xx/5xx {"error": {"status": "UNAUTHENTICATED", "message": "..."}}
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { PRODUCTS, coverageFor } = require("./coverage");

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  clientId: process.env.USER_POOL_CLIENT_ID,
  tokenUse: "id",
});

const SITE_URL = "https://aws-study-flashcards-app.com";
const ALLOWED_ORIGINS = [
  "https://aws-study-flashcards-app.com",
  "https://cloud.aws-study-flashcards-app.com",
  "https://ai.aws-study-flashcards-app.com",
  "https://saa.aws-study-flashcards-app.com",
  "https://dva.aws-study-flashcards-app.com",
  "https://architect.aws-study-flashcards-app.com",
  "https://developer.aws-study-flashcards-app.com",
  "https://bash.aws-study-flashcards-app.com",
  "https://python.aws-study-flashcards-app.com",
  "https://js.aws-study-flashcards-app.com",
  "https://typescript.aws-study-flashcards-app.com",
  "https://spanish.aws-study-flashcards-app.com",
  // Moving to levelupstudyhub.com: checkout may return buyers to the new
  // names too, while the old names above keep working during the move.
  "https://levelupstudyhub.com",
  "https://cloud.levelupstudyhub.com",
  "https://ai.levelupstudyhub.com",
  "https://architect.levelupstudyhub.com",
  "https://developer.levelupstudyhub.com",
  "https://bash.levelupstudyhub.com",
  "https://python.levelupstudyhub.com",
  "https://js.levelupstudyhub.com",
  "https://typescript.levelupstudyhub.com",
  "https://spanish.levelupstudyhub.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

// Where Stripe sends a buyer or member back: the address the page asked for when
// it is one of ours, else the old hub. Each name has its own sign-in, so coming
// back on the name the visitor opened keeps them signed in.
const returnBaseFor = (requested) => {
  const r = typeof requested === "string" ? requested : "";
  return ALLOWED_ORIGINS.find((o) => r === o || r.startsWith(`${o}/`)) ? r.replace(/\/$/, "") : SITE_URL;
};

// Every product is a subscription, monthly or yearly; Pro (all-access) is yearly only.
// Env names: STRIPE_PRICE_<X>_MONTHLY / _YEARLY per product, STRIPE_PRICE_ALL_ACCESS_YEARLY for Pro.
const PRODUCT_ENV = {
  "cloud-practitioner": "CLOUD_PRACTITIONER",
  "ai-practitioner": "AI_PRACTITIONER",
  "solutions-architect-associate": "SOLUTIONS_ARCHITECT",
  "developer-associate": "DEVELOPER_ASSOCIATE",
  "bash-for-aws": "BASH_COURSE",
  "python-for-aws": "PYTHON_COURSE",
  "javascript-for-aws": "JAVASCRIPT_COURSE",
  "typescript-for-aws": "TYPESCRIPT_COURSE",
  "tech-spanish": "TECH_SPANISH_COURSE",
};
const envPrice = (name) => process.env[name] || "";
const INTERVALS = ["month", "year"];
// What checkout sells: plan -> { month?, year? } price IDs. An empty price switches that choice off.
const PRICES = {
  ...Object.fromEntries(
    PRODUCTS.map((plan) => [
      plan,
      { month: envPrice(`STRIPE_PRICE_${PRODUCT_ENV[plan]}_MONTHLY`), year: envPrice(`STRIPE_PRICE_${PRODUCT_ENV[plan]}_YEARLY`) },
    ])
  ),
  "all-access": { year: envPrice("STRIPE_PRICE_ALL_ACCESS_YEARLY") },
};
// Recognised, never sold: the old $39/yr Pro, the old one-time product prices and the Developer
// Path bundle. Subscriptions and sessions that still use them must keep counting.
const LEGACY_PRICES = {
  "all-access": envPrice("STRIPE_PRICE_ALL_ACCESS"),
  "developer-path": envPrice("STRIPE_PRICE_DEVELOPER_PATH"),
  ...Object.fromEntries(PRODUCTS.map((plan) => [plan, envPrice(`STRIPE_PRICE_${PRODUCT_ENV[plan]}`)])),
};
// One-time bundles, no longer sold. Their owners keep everything listed here for good.
const BUNDLES = {
  "developer-path": ["bash-for-aws", "python-for-aws", "javascript-for-aws", "typescript-for-aws", "developer-associate"],
};

// Sales: during the window, checkout applies the coupon automatically (no
// code to type). The coupons also stop working on their own at redeem_by,
// and each one only applies to its own Stripe products. On a subscription a
// coupon lasts as its `duration` says (once / repeating / forever).
const PROMOTIONS = [
  {
    name: "halloween-2026", // Oct 31 00:00 to Nov 6 23:59, US Eastern
    start: Date.parse("2026-10-31T04:00:00Z"),
    end: Date.parse("2026-11-07T05:00:00Z"),
    coupons: { "all-access": "HALLOWEEN10", default: "HALLOWEEN31" },
  },
];
const promotionFor = (plan, now = Date.now()) => {
  const promo = PROMOTIONS.find((p) => now >= p.start && now < p.end);
  return promo ? { name: promo.name, coupon: promo.coupons[plan] || promo.coupons.default } : null;
};
/** The plan a Stripe price belongs to (current or legacy), or null. */
const planForPrice = (priceId) => {
  if (!priceId) return null;
  for (const [plan, byInterval] of Object.entries(PRICES)) {
    if (Object.values(byInterval).includes(priceId)) return plan;
  }
  const legacy = Object.entries(LEGACY_PRICES).find(([, p]) => p && p === priceId);
  return legacy ? legacy[0] : null;
};
/** "month" | "year" | null for a subscription: from Stripe's price, else our metadata, else our table. */
const intervalOf = (sub) => {
  const price = sub.items?.data?.[0]?.price;
  const fromTable = Object.values(PRICES)
    .flatMap((byInterval) => Object.entries(byInterval))
    .find(([, p]) => p && p === price?.id)?.[0];
  return price?.recurring?.interval || sub.metadata?.interval || fromTable || null;
};
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

// Pro starts with a free trial for anyone who hasn't had Pro before. Checkout
// still takes a card; the first yearly charge runs when the trial ends unless
// they cancel first. Products get no trial: their free modules are the trial.
// Keep in step with PRO_TRIAL_DAYS in every app's prices file.
const PRO_TRIAL_DAYS = 14;

// Shown in Checkout when someone buys Pro while paying for single products
const OVERLAP_NOTICE =
  "Pro includes every certification and course. Your other subscriptions keep billing until you cancel them in Manage billing.";

// ---------------------------------------------------------------------------
// Secrets: one Secrets Manager entry holding the Stripe key and the Stripe
// webhook signing secret. Loaded once per cold start.
// ---------------------------------------------------------------------------
let secretsPromise = null;
const loadSecrets = () => {
  if (!secretsPromise) {
    const client = new SecretsManagerClient({});
    secretsPromise = client
      .send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }))
      .then((r) => JSON.parse(r.SecretString))
      .catch((err) => {
        secretsPromise = null; // retry on the next invocation
        throw err;
      });
  }
  return secretsPromise;
};

let stripeClient = null;
const init = async () => {
  const secrets = await loadSecrets();
  if (!stripeClient) stripeClient = require("stripe")(secrets.stripeApiKey);
  return { stripe: stripeClient, webhookSecret: secrets.stripeWebhookSecret };
};

// ---------------------------------------------------------------------------
// Callable protocol helpers
// ---------------------------------------------------------------------------
class CallableError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const HTTP_FOR_STATUS = {
  INVALID_ARGUMENT: 400,
  FAILED_PRECONDITION: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
};
const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const rawBody = (event) =>
  event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : Buffer.from(event.body || "", "utf8");

/** Verified { uid, email } from the Authorization header, or null. */
const authFromHeader = async (event) => {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const payload = await cognitoVerifier.verify(match[1]);
    return { uid: payload.uid || payload.sub, email: payload.email || null };
  } catch {
    throw new CallableError("UNAUTHENTICATED", "Invalid or expired sign-in");
  }
};

// ---------------------------------------------------------------------------
// Billing records. DynamoDB (PK = USER#<uid>): BILLING { stripeCustomerId },
// PURCHASE#<plan>, ENTITLEMENTS; STRIPE#<customerId>/UID maps back to the uid.
// ---------------------------------------------------------------------------
const getItem = async (PK, SK) => (await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK } }))).Item;

async function getCustomerId(uid) {
  const billing = await getItem(`USER#${uid}`, "BILLING");
  return billing?.stripeCustomerId || null;
}

async function saveCustomerId(uid, customerId) {
  const now = new Date().toISOString();
  await ddb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: { PK: `USER#${uid}`, SK: "BILLING", stripeCustomerId: customerId, updatedAt: now } })
  );
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `STRIPE#${customerId}`, SK: "UID", uid } }));
}

async function recordPurchase(uid, plan, session) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${uid}`,
        SK: `PURCHASE#${plan}`,
        plan,
        sessionId: session.id,
        amountTotal: session.amount_total ?? null,
        purchasedAt: new Date().toISOString(),
      },
    })
  );
}

async function purchasedPlans(uid) {
  const plans = new Set();
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${uid}`, ":sk": "PURCHASE#" },
    })
  );
  for (const item of result.Items || []) plans.add(item.plan);
  return plans;
}

// ---------------------------------------------------------------------------
// Entitlements: Stripe subscriptions (any plan, monthly or yearly) + recorded
// one-time purchases (kept for good) -> DynamoDB ENTITLEMENTS (read by the
// pre-token Lambda). certs means "owned one by one"; Pro sets allAccess and
// the pre-token Lambda expands it to every product.
// ---------------------------------------------------------------------------
const subscriptionPeriodEnd = (sub) => {
  // From API version 2025-08-27.basil the period lives on the items, not the subscription
  const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
};

async function syncCustomerEntitlements(stripe, uid, customerId) {
  const subs = customerId
    ? await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })
    : { data: [] };

  let allAccess = false;
  const certs = new Set();
  const active = [];

  for (const plan of await purchasedPlans(uid)) {
    if (plan === "all-access") allAccess = true;
    else if (BUNDLES[plan]) BUNDLES[plan].forEach((c) => certs.add(c));
    else certs.add(plan);
  }

  for (const sub of subs.data) {
    if (!ACTIVE_STATUSES.includes(sub.status)) continue;
    const priceId = sub.items?.data?.[0]?.price?.id || null;
    // The price decides: the billing portal can change a subscription's price, never its metadata
    const plan = planForPrice(priceId) || sub.metadata?.plan;
    if (!plan) continue;
    if (plan === "all-access") allAccess = true;
    else if (BUNDLES[plan]) BUNDLES[plan].forEach((c) => certs.add(c));
    else certs.add(plan);
    active.push({
      plan,
      status: sub.status,
      interval: intervalOf(sub),
      priceId,
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      currentPeriodEnd: subscriptionPeriodEnd(sub),
    });
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${uid}`,
        SK: "ENTITLEMENTS",
        allAccess,
        certs: [...certs],
        active,
        updatedAt: new Date().toISOString(),
      },
    })
  );
  console.log(`[billing] Synced uid=${uid} allAccess=${allAccess} certs=${[...certs].join(",") || "none"}`);
}

async function uidForSubscription(subscription) {
  if (subscription.metadata?.firebaseUID) return subscription.metadata.firebaseUID;
  const mapped = await getItem(`STRIPE#${subscription.customer}`, "UID");
  return mapped?.uid || null;
}

/** False when Stripe has no such customer (or it was deleted). */
async function customerExists(stripe, customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !customer.deleted;
  } catch (err) {
    if (err.code === "resource_missing") return false;
    throw err;
  }
}

/**
 * One read of what checkout needs to know about the buyer, so every decision below rests on the
 * same answer (two separate reads could disagree when one of them fails):
 *   purchased       one-time plans recorded for this account (kept for good)
 *   own             this account's own subscriptions as { id, itemId, priceId, status, plan, interval }
 *                   (entitlements come from these; id/itemId let checkout offer a monthly -> yearly switch)
 *   hadPro          anyone behind this email has had Pro before, trial or paid: no second free trial,
 *                   even after deleting the account and signing up again
 *   elsewhere       plans with an active subscription on another customer with the same email, which
 *                   happens when one person has two sign-ins (say Google, and email with a password)
 *   activeElsewhere Pro is among them
 */
async function buyerHistory(stripe, uid, customerId, email) {
  const purchased = await purchasedPlans(uid);
  // An account that never reached checkout has no customer of its own yet (proTrialStatus)
  const customerIds = new Set(customerId ? [customerId] : []);
  if (email) {
    const sameEmail = await stripe.customers.list({ email, limit: 10 });
    sameEmail.data.forEach((c) => customerIds.add(c.id));
  }
  const own = [];
  const elsewhere = new Set();
  let hadPro = purchased.has("all-access");
  for (const customer of customerIds) {
    const subs = await stripe.subscriptions.list({ customer, status: "all", limit: 100 });
    for (const sub of subs.data) {
      const item = sub.items?.data?.[0];
      const plan = planForPrice(item?.price?.id) || sub.metadata?.plan;
      if (customer === customerId) {
        own.push({ id: sub.id, itemId: item?.id || null, priceId: item?.price?.id || null, status: sub.status, plan, interval: intervalOf(sub) });
      } else if (plan && ACTIVE_STATUSES.includes(sub.status)) {
        elsewhere.add(plan);
      }
      if (plan === "all-access") hadPro = true;
    }
  }
  return { purchased, own, hadPro, elsewhere, activeElsewhere: elsewhere.has("all-access") };
}

// The default portal ("Manage billing") has plan switching off: its product list would let a
// subscriber move to any other product. scripts/stripe-subscription-setup.mjs makes a second
// configuration, tagged with this purpose, that the monthly -> yearly confirm link uses.
const SWITCH_PORTAL_PURPOSE = "interval-switch";
let switchConfigPromise = null;
/** The interval-switch portal configuration's ID, or null (then the flow uses the default portal). */
function switchConfigurationId(stripe) {
  if (!switchConfigPromise) {
    switchConfigPromise = (async () => {
      const { data } = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
      return data.find((c) => !c.is_default && c.metadata?.purpose === SWITCH_PORTAL_PURPOSE)?.id || null;
    })().catch((err) => {
      console.error("[billing] Could not look up the interval-switch portal configuration:", err.message);
      switchConfigPromise = null; // try again on the next call
      return null;
    });
  }
  return switchConfigPromise;
}

/** Portal page that confirms moving an active monthly subscription to the plan's yearly price. */
async function intervalSwitchUrl(stripe, customerId, subscription, yearlyPrice, returnBase) {
  const params = { customer: customerId, return_url: returnBase };
  try {
    const configuration = await switchConfigurationId(stripe);
    const session = await stripe.billingPortal.sessions.create({
      ...params,
      ...(configuration && { configuration }),
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: subscription.id,
          items: [{ id: subscription.itemId, price: yearlyPrice, quantity: 1 }],
        },
        // Every site refreshes its token on ?checkout=success
        after_completion: { type: "redirect", redirect: { return_url: `${returnBase}/?checkout=success` } },
      },
    });
    return session.url;
  } catch (err) {
    // Say the switch configuration is missing: the plain portal still lets them manage or cancel it
    console.error(`[billing] Interval switch link failed for ${subscription.id}:`, err.message);
    return (await stripe.billingPortal.sessions.create(params)).url;
  }
}

// ---------------------------------------------------------------------------
// createCheckoutSession — { plan, interval: "month" | "year", returnUrl } ->
//   { url }                         Stripe Checkout
//   { url, alreadyOwned: true }     back to the site (?checkout=success&owned=1)
//   { url, switchInterval: true }   billing portal: confirm moving monthly to yearly
// ---------------------------------------------------------------------------
async function createCheckoutSession(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in to upgrade");
  const plan = data?.plan || "all-access";
  if (!PRICES[plan] && !BUNDLES[plan]) throw new CallableError("FAILED_PRECONDITION", `Plan not available: ${plan}`);
  // Pro is yearly only, so pages that send no interval for Pro still work
  const interval = plan === "all-access" ? data?.interval ?? "year" : data?.interval;

  // "firebaseUID" is the app user ID; the name predates the move to AWS.
  const uid = user.uid;
  let customerId = await getCustomerId(uid);
  if (customerId && !(await customerExists(stripe, customerId))) {
    // Saved while Stripe was in test mode (or deleted since): the live key
    // can't see it, so checkout would fail with "No such customer".
    console.warn(`[billing] Replacing missing Stripe customer ${customerId} for uid=${uid}`);
    customerId = null;
  }

  const returnBase = returnBaseFor(data?.returnUrl);

  let history = null;
  try {
    history = await buyerHistory(stripe, uid, customerId, user.email);
  } catch (err) {
    // A failed lookup must never block a sale: check out, without the trial. It could sell a
    // subscription the buyer already has; they can cancel the extra one in Manage billing.
    console.error(`[billing] Buyer history lookup failed for uid=${uid}:`, err.message);
  }

  // Never sell what the account already has. A page's sign-in token can be an hour old, so it can
  // still offer "Start Free Trial" or a paywall to someone who just got access. This runs before the
  // interval and "still sold?" checks, so owners on old pages (no interval, or a bundle) get owned=1.
  if (history) {
    const covered = coverageFor({
      plan,
      purchased: history.purchased,
      subscriptions: history.own,
      bundles: BUNDLES,
      activeStatuses: ACTIVE_STATUSES,
    });
    const current = covered?.subscription;
    if (current && current.interval === "month" && interval === "year" && current.itemId) {
      // Monthly, asking for yearly: a second checkout would bill them twice. The portal confirms the
      // change (with proration) on the subscription they have; customer.subscription.updated re-syncs.
      const yearly = PRICES[plan]?.year;
      if (!yearly) throw new CallableError("FAILED_PRECONDITION", `Plan not available: ${plan} (yearly)`);
      console.log(`[billing] uid=${uid} switching ${plan} from monthly to yearly in the portal`);
      return { url: await intervalSwitchUrl(stripe, customerId, current, yearly, returnBase), switchInterval: true };
    }
    if (covered) {
      try {
        // Write ENTITLEMENTS now, so the token the site asks for next carries access even if the
        // webhook hasn't run yet
        await syncCustomerEntitlements(stripe, uid, customerId);
      } catch (err) {
        console.error(`[billing] Entitlement sync failed for uid=${uid}:`, err.message);
      }
      console.log(`[billing] uid=${uid} already has ${plan} (${covered.by}); no checkout`);
      // Back to the site as if checkout had finished: every site refreshes its token on
      // ?checkout=success, so access shows up. owned=1 tells it apart from a real sale.
      return { url: `${returnBase}/?checkout=success&owned=1`, alreadyOwned: true };
    }
    const proElsewhere = history.elsewhere.has("all-access");
    if (proElsewhere || history.elsewhere.has(plan)) {
      // It runs on this person's other sign-in. Selling here would charge them a second time.
      console.log(`[billing] uid=${uid} has ${proElsewhere ? "Pro" : plan} on another sign-in with the same email; no checkout`);
      throw new CallableError(
        "FAILED_PRECONDITION",
        `${proElsewhere ? "Pro is" : "This subscription is"} already on for this email under your other sign-in. Sign out, then sign in the other way, for example with Google.`
      );
    }
  }

  if (BUNDLES[plan]) throw new CallableError("FAILED_PRECONDITION", "The Developer Path bundle is no longer sold");
  if (plan === "all-access" && interval !== "year") throw new CallableError("INVALID_ARGUMENT", "Pro is yearly only");
  if (!INTERVALS.includes(interval)) throw new CallableError("INVALID_ARGUMENT", "Choose monthly or yearly");
  const priceId = PRICES[plan][interval];
  if (!priceId) throw new CallableError("FAILED_PRECONDITION", `Plan not available: ${plan} (${interval})`);

  // Pro includes every product, but their own subscriptions keep billing until cancelled in Manage
  // billing. Nothing cancels them for the buyer (a cancelled Pro trial would take the products with
  // it), so Checkout and the page they return to both tell them.
  const overlap =
    plan === "all-access" && Boolean(history?.own.some((s) => s.plan !== "all-access" && ACTIVE_STATUSES.includes(s.status)));
  if (overlap) console.log(`[billing] uid=${uid} is buying Pro while subscribed to single products`);

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { firebaseUID: uid },
    });
    customerId = customer.id;
    await saveCustomerId(uid, customerId);
  }

  // Always a subscription (derived from the plan, not a Stripe price lookup, so the restricted
  // API key needs no Prices read permission). Only Pro gets the free trial.
  const trial = plan === "all-access" && history !== null && !history.hadPro;
  const metadata = { firebaseUID: uid, plan, interval };
  const params = {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Card up front, even when a coupon or the trial makes today $0
    payment_method_collection: "always",
    subscription_data: {
      metadata,
      ...(trial && {
        trial_period_days: PRO_TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      }),
    },
    metadata,
    allow_promotion_codes: true,
    success_url: `${returnBase}/?checkout=success${overlap ? "&overlap=1" : ""}`,
    cancel_url: `${returnBase}/?checkout=cancelled`,
    ...(overlap && { custom_text: { submit: { message: OVERLAP_NOTICE } } }),
  };
  // Stripe allows a discount or promotion codes, not both
  const promo = promotionFor(plan);
  if (promo) {
    try {
      const { allow_promotion_codes: _codes, ...withoutCodes } = params;
      const session = await stripe.checkout.sessions.create({
        ...withoutCodes,
        discounts: [{ coupon: promo.coupon }],
        metadata: { ...params.metadata, promotion: promo.name },
      });
      return { url: session.url };
    } catch (err) {
      // An expired or mistyped coupon must never block a sale: charge full price
      console.error(`[billing] ${promo.coupon} not applied for ${plan}:`, err.message);
    }
  }
  const session = await stripe.checkout.sessions.create(params);
  return { url: session.url };
}

// ---------------------------------------------------------------------------
// proTrialStatus — () -> { trialAvailable: true | false | null }
// What the Pro card may promise a signed-in person: the free trial only if checkout would give it,
// by the same rule (buyerHistory: nobody behind this account or email has had Pro). null when the
// lookup fails; checkout gives no trial then either, so the card shouldn't promise one.
// ---------------------------------------------------------------------------
async function proTrialStatus(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in first");
  try {
    const customerId = await getCustomerId(user.uid);
    const history = await buyerHistory(stripe, user.uid, customerId, user.email);
    return { trialAvailable: !history.hadPro };
  } catch (err) {
    console.error(`[billing] Trial status lookup failed for uid=${user.uid}:`, err.message);
    return { trialAvailable: null };
  }
}

// ---------------------------------------------------------------------------
// createPortalSession — ({ returnUrl? }) -> { url }
// ---------------------------------------------------------------------------
async function createPortalSession(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in first");
  const customerId = await getCustomerId(user.uid);
  if (!customerId) throw new CallableError("FAILED_PRECONDITION", "No billing account yet");
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnBaseFor(data?.returnUrl) });
  return { url: session.url };
}

// ---------------------------------------------------------------------------
// stripeWebhook — signature-verified Stripe events -> entitlement sync.
// Events: checkout.session.completed, customer.subscription.created/.updated/.deleted
// (created covers subscriptions made outside Checkout: grant scripts, the Dashboard)
// ---------------------------------------------------------------------------
async function handleStripeEvent(stripe, stripeEvent) {
  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      if (session.mode === "subscription" && session.customer) {
        const uid =
          session.metadata?.firebaseUID || (await uidForSubscription({ metadata: {}, customer: session.customer }));
        if (uid) await syncCustomerEntitlements(stripe, uid, session.customer);
        else console.error("[billing] No UID for checkout session", session.id);
      } else if (
        session.mode === "payment" &&
        // A 100%-off promotion code completes with "no_payment_required"
        ["paid", "no_payment_required"].includes(session.payment_status)
      ) {
        // Legacy one-time purchase (nothing new is sold this way, but a session opened before
        // the switch to subscriptions can still complete): record it for good, keyed by plan so
        // webhook retries stay idempotent, then resync claims.
        const uid = session.metadata?.firebaseUID;
        const plan = session.metadata?.plan;
        if (uid && plan) {
          await recordPurchase(uid, plan, session);
          await syncCustomerEntitlements(stripe, uid, session.customer);
        } else {
          console.error("[billing] Paid session missing uid/plan metadata", session.id);
        }
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = stripeEvent.data.object;
      const uid = await uidForSubscription(subscription);
      if (uid) await syncCustomerEntitlements(stripe, uid, subscription.customer);
      else console.error("[billing] No UID for subscription", subscription.id);
      break;
    }
    default:
      break;
  }
}

async function stripeWebhook(event) {
  const { stripe, webhookSecret } = await init();
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody(event),
      event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"],
      webhookSecret
    );
  } catch (err) {
    console.error("[billing] Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: "Invalid signature" };
  }

  try {
    await handleStripeEvent(stripe, stripeEvent);
    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("[billing] Webhook handler error:", err);
    return { statusCode: 500, body: "Handler error" }; // 500 so Stripe retries
  }
}

// ---------------------------------------------------------------------------
// Router (API Gateway HTTP API, payload format 2.0)
// ---------------------------------------------------------------------------
const CALLABLES = { createCheckoutSession, createPortalSession, proTrialStatus };

// For aws-backend/test only: lets the tests run checkout and the webhook against a fake Stripe and table.
exports._test = {
  createCheckoutSession,
  createPortalSession,
  proTrialStatus,
  handleStripeEvent,
  syncCustomerEntitlements,
  planForPrice,
  PRICES,
  resetSwitchConfiguration: () => {
    switchConfigPromise = null;
  },
};

exports.handler = async (event) => {
  const path = event.rawPath || "";
  if (path === "/stripe/webhook") return stripeWebhook(event);

  const name = event.pathParameters?.name;
  const fn = CALLABLES[name];
  if (!fn) return json(404, { error: { status: "NOT_FOUND", message: "Unknown function" } });

  try {
    const { stripe } = await init();
    let payload;
    try {
      payload = JSON.parse(rawBody(event).toString("utf8") || "{}");
    } catch {
      throw new CallableError("INVALID_ARGUMENT", "Request body must be JSON");
    }
    const user = await authFromHeader(event);
    const result = await fn(payload.data, user, stripe);
    return json(200, { result });
  } catch (err) {
    if (err instanceof CallableError) {
      return json(HTTP_FOR_STATUS[err.status] || 500, { error: { status: err.status, message: err.message } });
    }
    console.error(`[${name}] error:`, err);
    return json(500, { error: { status: "INTERNAL", message: "Internal error" } });
  }
};
