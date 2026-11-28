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
const { PRO_COVERS, alreadyCovered } = require("./coverage");

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  clientId: process.env.USER_POOL_CLIENT_ID,
  tokenUse: "id",
});

const SITE_URL = "https://levelupstudyhub.com";
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
// it is one of ours, else the hub on levelupstudyhub.com. Each name has its own
// sign-in, so coming back on the name the visitor opened keeps them signed in.
const returnBaseFor = (requested) => {
  const r = typeof requested === "string" ? requested : "";
  return ALLOWED_ORIGINS.find((o) => r === o || r.startsWith(`${o}/`)) ? r.replace(/\/$/, "") : SITE_URL;
};

// Per-cert plans are ONE-TIME prices; all-access is a yearly subscription.
const PLAN_PRICES = {
  "all-access": process.env.STRIPE_PRICE_ALL_ACCESS || "",
  "cloud-practitioner": process.env.STRIPE_PRICE_CLOUD_PRACTITIONER || "",
  "ai-practitioner": process.env.STRIPE_PRICE_AI_PRACTITIONER || "",
  "solutions-architect-associate": process.env.STRIPE_PRICE_SOLUTIONS_ARCHITECT || "",
  "developer-associate": process.env.STRIPE_PRICE_DEVELOPER_ASSOCIATE || "",
  // Coding courses: one-time, NOT included in all-access (the course sites
  // check `certs` only)
  "bash-for-aws": process.env.STRIPE_PRICE_BASH_COURSE || "",
  "python-for-aws": process.env.STRIPE_PRICE_PYTHON_COURSE || "",
  "javascript-for-aws": process.env.STRIPE_PRICE_JAVASCRIPT_COURSE || "",
  "typescript-for-aws": process.env.STRIPE_PRICE_TYPESCRIPT_COURSE || "",
  // Tech Spanish ↔ Tech English: not part of the Developer Path bundle
  "tech-spanish": process.env.STRIPE_PRICE_TECH_SPANISH_COURSE || "",
  // One-time bundle: unlocks everything in BUNDLES["developer-path"]
  "developer-path": process.env.STRIPE_PRICE_DEVELOPER_PATH || "",
};
const BUNDLES = {
  "developer-path": ["bash-for-aws", "python-for-aws", "javascript-for-aws", "typescript-for-aws", "developer-associate"],
};

// Sales: during the window, checkout applies the coupon automatically (no
// code to type). The coupons also stop working on their own at redeem_by,
// and each one only applies to its own Stripe products.
const PROMOTIONS = [
  {
    name: "halloween-2026", // Oct 31 00:00 to Nov 6 23:59, US Eastern
    start: Date.parse("2026-10-31T04:00:00Z"),
    end: Date.parse("2026-11-07T05:00:00Z"),
    coupons: { "all-access": "HALLOWEEN10", "developer-path": "HALLOWEEN10", default: "HALLOWEEN31" },
  },
];
const promotionFor = (plan, now = Date.now()) => {
  const promo = PROMOTIONS.find((p) => now >= p.start && now < p.end);
  return promo ? { name: promo.name, coupon: promo.coupons[plan] || promo.coupons.default } : null;
};
const planForPrice = (priceId) => {
  const hit = Object.entries(PLAN_PRICES).find(([, p]) => p && p === priceId);
  return hit ? hit[0] : null;
};
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

// Pro starts with a free week for anyone who hasn't had Pro before. Checkout
// still takes a card; the first yearly charge runs when the trial ends unless
// they cancel first. One-time plans have no trial (the free tier is the trial).
// Keep in step with PRO_TRIAL_DAYS in aws-study-homepage/src/services/billing.js.
const PRO_TRIAL_DAYS = 7;

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
// Entitlements: Stripe subscriptions (all-access) + recorded one-time cert
// purchases -> DynamoDB ENTITLEMENTS (read by the pre-token Lambda).
// ---------------------------------------------------------------------------
async function syncCustomerEntitlements(stripe, uid, customerId) {
  const subs = customerId
    ? await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 })
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
    const plan = sub.metadata?.plan || planForPrice(priceId);
    if (!plan) continue;
    if (plan === "all-access") allAccess = true;
    else certs.add(plan);
    active.push({
      plan,
      status: sub.status,
      priceId,
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
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
 *   purchased       one-time plans recorded for this account
 *   own             this account's own subscriptions as { status, plan } (entitlements come from these)
 *   hadPro          anyone behind this email has had Pro before, trial or paid: no second free week,
 *                   even after deleting the account and signing up again
 *   activeElsewhere Pro is running on another customer with the same email, which happens when one
 *                   person has two sign-ins (say Google, and email with a password)
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
  let hadPro = purchased.has("all-access");
  let activeElsewhere = false;
  for (const customer of customerIds) {
    const subs = await stripe.subscriptions.list({ customer, status: "all", limit: 100 });
    for (const sub of subs.data) {
      const plan = sub.metadata?.plan || planForPrice(sub.items?.data?.[0]?.price?.id);
      if (customer === customerId) own.push({ status: sub.status, plan });
      if (plan !== "all-access") continue;
      hadPro = true;
      if (customer !== customerId && ACTIVE_STATUSES.includes(sub.status)) activeElsewhere = true;
    }
  }
  return { purchased, own, hadPro, activeElsewhere };
}

// ---------------------------------------------------------------------------
// createCheckoutSession — { plan, returnUrl } -> { url }
// ---------------------------------------------------------------------------
async function createCheckoutSession(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in to upgrade");
  const plan = data?.plan || "all-access";
  const priceId = PLAN_PRICES[plan];
  if (!priceId) throw new CallableError("FAILED_PRECONDITION", `Plan not available: ${plan}`);

  // "firebaseUID" is the app user ID; the name predates the move to AWS.
  const uid = user.uid;
  let customerId = await getCustomerId(uid);
  if (customerId && !(await customerExists(stripe, customerId))) {
    // Saved while Stripe was in test mode (or deleted since): the live key
    // can't see it, so checkout would fail with "No such customer".
    console.warn(`[billing] Replacing missing Stripe customer ${customerId} for uid=${uid}`);
    customerId = null;
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { firebaseUID: uid },
    });
    customerId = customer.id;
    await saveCustomerId(uid, customerId);
  }

  const returnBase = returnBaseFor(data?.returnUrl);

  // One-time cert prices check out in payment mode; the all-access yearly
  // plan in subscription mode. Derived from the plan (not a Stripe price
  // lookup) so the restricted API key needs no Prices read permission.
  const mode = plan === "all-access" ? "subscription" : "payment";

  let history = null;
  if (mode === "subscription" || PRO_COVERS.has(plan)) {
    try {
      history = await buyerHistory(stripe, uid, customerId, user.email);
    } catch (err) {
      // A failed lookup must never block a sale: check out, without the trial
      console.error(`[billing] Buyer history lookup failed for uid=${uid}:`, err.message);
    }
  }

  // Never sell Pro, or a certificate Pro includes, to someone who already has it. A page's
  // sign-in token can be an hour old, so it can still offer "Start Free Trial" to a person just
  // given Pro. They no longer qualify for the trial, so checkout would charge them at once.
  if (history && PRO_COVERS.has(plan)) {
    const covered = alreadyCovered({
      plan,
      purchased: history.purchased,
      subscriptions: history.own,
      bundles: BUNDLES,
      activeStatuses: ACTIVE_STATUSES,
    });
    if (covered) {
      try {
        // Write ENTITLEMENTS now, so the token the site asks for next carries Pro even if the
        // webhook hasn't run yet
        await syncCustomerEntitlements(stripe, uid, customerId);
      } catch (err) {
        console.error(`[billing] Entitlement sync failed for uid=${uid}:`, err.message);
      }
      console.log(`[billing] uid=${uid} already has ${plan}; no checkout`);
      // Back to the site as if checkout had finished: every site refreshes its token on
      // ?checkout=success, so access shows up. owned=1 tells it apart from a real sale.
      return { url: `${returnBase}/?checkout=success&owned=1`, alreadyOwned: true };
    }
    if (history.activeElsewhere) {
      // Pro runs on this person's other sign-in. Selling here would charge them a second time.
      console.log(`[billing] uid=${uid} has Pro on another sign-in with the same email; no checkout`);
      throw new CallableError(
        "FAILED_PRECONDITION",
        "Pro is already on for this email under your other sign-in. Sign out, then sign in the other way, for example with Google."
      );
    }
  }
  const trial = mode === "subscription" && history !== null && !history.hadPro;
  const params = {
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(mode === "subscription"
      ? {
          // Card up front, even when a coupon or the trial makes today $0
          payment_method_collection: "always",
          subscription_data: {
            metadata: { firebaseUID: uid, plan },
            ...(trial && {
              trial_period_days: PRO_TRIAL_DAYS,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
            }),
          },
        }
      : { invoice_creation: { enabled: true } }),
    metadata: { firebaseUID: uid, plan },
    allow_promotion_codes: true,
    success_url: `${returnBase}/?checkout=success`,
    cancel_url: `${returnBase}/?checkout=cancelled`,
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
// What the Pro card may promise a signed-in person: the free week only if checkout would give it,
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
// billingStatus — () -> { hasBillingAccount: true | false }
// Whether the billing portal can open for this account: it needs a Stripe customer, which checkout
// creates. Pro given by hand (ENTITLEMENTS written without checkout) has none, so the sites show a
// plain line instead of a "Manage" button that can only fail. Reads the table only, no Stripe call.
// ---------------------------------------------------------------------------
async function billingStatus(data, user) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in first");
  return { hasBillingAccount: Boolean(await getCustomerId(user.uid)) };
}

// ---------------------------------------------------------------------------
// createPortalSession — ({ returnUrl? }) -> { url }
// ---------------------------------------------------------------------------
// Shown to the member as is, so it says what is true in plain words, not "try again"
const NO_BILLING_MESSAGE = "This account has no billing to manage: nothing on it was bought through Stripe, so there are no payments, invoices or card on file.";

async function createPortalSession(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in first");
  const customerId = await getCustomerId(user.uid);
  if (!customerId) throw new CallableError("FAILED_PRECONDITION", NO_BILLING_MESSAGE);
  try {
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnBaseFor(data?.returnUrl) });
    return { url: session.url };
  } catch (err) {
    // A customer saved while Stripe was in test mode, or deleted since: the live key can't see it,
    // so there is no billing here either (checkout replaces such a customer on the next purchase)
    if (err.code === "resource_missing" && err.param === "customer") {
      console.warn(`[billing] Portal: Stripe has no customer ${customerId} for uid=${user.uid}`);
      throw new CallableError("FAILED_PRECONDITION", NO_BILLING_MESSAGE);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// stripeWebhook — signature-verified Stripe events -> entitlement sync.
// Events: checkout.session.completed, customer.subscription.updated/.deleted
// ---------------------------------------------------------------------------
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
          // One-time cert purchase: record it permanently, keyed by plan so
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
    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("[billing] Webhook handler error:", err);
    return { statusCode: 500, body: "Handler error" }; // 500 so Stripe retries
  }
}

// ---------------------------------------------------------------------------
// Router (API Gateway HTTP API, payload format 2.0)
// ---------------------------------------------------------------------------
const CALLABLES = { createCheckoutSession, createPortalSession, proTrialStatus, billingStatus };

// For aws-backend/test only: lets the tests run checkout against a fake Stripe and table.
exports._test = { createCheckoutSession, createPortalSession, proTrialStatus, billingStatus };

exports.handler = async (event) => {
  const path = event.rawPath || "";
  if (path === "/stripe/webhook") return stripeWebhook(event);

  const name = event.pathParameters?.name;
  const fn = CALLABLES[name];
  if (!fn) return json(404, { error: { status: "NOT_FOUND", message: "Unknown function" } });

  let user = null;
  try {
    const { stripe } = await init();
    let payload;
    try {
      payload = JSON.parse(rawBody(event).toString("utf8") || "{}");
    } catch {
      throw new CallableError("INVALID_ARGUMENT", "Request body must be JSON");
    }
    user = await authFromHeader(event);
    const result = await fn(payload.data, user, stripe);
    return json(200, { result });
  } catch (err) {
    if (err instanceof CallableError) {
      // An expected refusal, not a crash, but still one line in CloudWatch: without it a member's
      // failed click leaves no trace (2026-11-28, the portal for Pro given by hand)
      console.warn(`[${name}] ${err.status} uid=${user?.uid || "none"}: ${err.message}`);
      return json(HTTP_FOR_STATUS[err.status] || 500, { error: { status: err.status, message: err.message } });
    }
    console.error(`[${name}] error:`, err);
    return json(500, { error: { status: "INTERNAL", message: "Internal error" } });
  }
};
