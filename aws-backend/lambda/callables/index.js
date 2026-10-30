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
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

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
};
const planForPrice = (priceId) => {
  const hit = Object.entries(PLAN_PRICES).find(([, p]) => p && p === priceId);
  return hit ? hit[0] : null;
};
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

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

  const requestedReturn = typeof data?.returnUrl === "string" ? data.returnUrl : "";
  const returnBase = ALLOWED_ORIGINS.find((o) => requestedReturn === o || requestedReturn.startsWith(`${o}/`))
    ? requestedReturn.replace(/\/$/, "")
    : SITE_URL;

  // One-time cert prices check out in payment mode; the all-access yearly
  // plan in subscription mode. Derived from the plan (not a Stripe price
  // lookup) so the restricted API key needs no Prices read permission.
  const mode = plan === "all-access" ? "subscription" : "payment";
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(mode === "subscription"
      ? { subscription_data: { metadata: { firebaseUID: uid, plan } } }
      : { invoice_creation: { enabled: true } }),
    metadata: { firebaseUID: uid, plan },
    allow_promotion_codes: true,
    success_url: `${returnBase}/?checkout=success`,
    cancel_url: `${returnBase}/?checkout=cancelled`,
  });
  return { url: session.url };
}

// ---------------------------------------------------------------------------
// createPortalSession — () -> { url }
// ---------------------------------------------------------------------------
async function createPortalSession(data, user, stripe) {
  if (!user) throw new CallableError("UNAUTHENTICATED", "Sign in first");
  const customerId = await getCustomerId(user.uid);
  if (!customerId) throw new CallableError("FAILED_PRECONDITION", "No billing account yet");
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: SITE_URL });
  return { url: session.url };
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
const CALLABLES = { createCheckoutSession, createPortalSession };

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
