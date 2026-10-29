// Payment + cross-site sign-in functions, moved from Firebase Cloud Functions
// to AWS Lambda (migration step 1). Step 2 moves sign-in to Cognito: callers
// may send a Cognito ID token (new apps) or a Firebase ID token (old apps).
// Purchases and entitlements live in DynamoDB; until the old apps are retired
// they are also mirrored into Firestore + Firebase custom claims for any user
// who has a Firebase account.
//
// Routes under /callable/{name} speak the Firebase callable protocol:
//   request  POST {"data": ...}  (+ "Authorization: Bearer <ID token>")
//   success  200  {"result": ...}
//   failure  4xx/5xx {"error": {"status": "UNAUTHENTICATED", "message": "..."}}
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
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
const COGNITO_ISSUER = `https://cognito-idp.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${process.env.USER_POOL_ID}`;

const SITE_URL = "https://aws-study-flashcards-app.com";
const ALLOWED_ORIGINS = [
  "https://aws-study-flashcards-app.com",
  "https://cloud.aws-study-flashcards-app.com",
  "https://ai.aws-study-flashcards-app.com",
  "https://saa.aws-study-flashcards-app.com",
  "https://dva.aws-study-flashcards-app.com",
  "https://architect.aws-study-flashcards-app.com",
  "https://developer.aws-study-flashcards-app.com",
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
};
const planForPrice = (priceId) => {
  const hit = Object.entries(PLAN_PRICES).find(([, p]) => p && p === priceId);
  return hit ? hit[0] : null;
};
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

// ---------------------------------------------------------------------------
// Secrets: one Secrets Manager entry holding the Stripe key, the Stripe
// webhook signing secret, and the Firebase service account (JSON object).
// Loaded once per cold start.
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
  if (!getApps().length) {
    const sa =
      typeof secrets.firebaseServiceAccount === "string"
        ? JSON.parse(secrets.firebaseServiceAccount)
        : secrets.firebaseServiceAccount;
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }
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

const issuerOf = (jwt) => {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")).iss || null;
  } catch {
    return null;
  }
};

/** Verified { uid, email } from the Authorization header (Cognito or Firebase), or null. */
const authFromHeader = async (event) => {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    if (issuerOf(match[1]) === COGNITO_ISSUER) {
      const payload = await cognitoVerifier.verify(match[1]);
      return { uid: payload.uid || payload.sub, email: payload.email || null };
    }
    const decoded = await getAuth().verifyIdToken(match[1]);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch {
    throw new CallableError("UNAUTHENTICATED", "Invalid or expired sign-in");
  }
};

// ---------------------------------------------------------------------------
// Billing records. DynamoDB (PK = USER#<uid>): BILLING { stripeCustomerId },
// PURCHASE#<plan>, ENTITLEMENTS; STRIPE#<customerId>/UID maps back to the uid.
// Firestore users/{uid} is read as a fallback and kept in sync while the old
// apps are live, but only for uids that exist in Firebase.
// ---------------------------------------------------------------------------
const firebaseUserExists = async (uid) => {
  try {
    await getAuth().getUser(uid);
    return true;
  } catch (err) {
    if (err.code === "auth/user-not-found") return false;
    throw err;
  }
};

const getItem = async (PK, SK) => (await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK } }))).Item;

async function getCustomerId(uid) {
  const billing = await getItem(`USER#${uid}`, "BILLING");
  if (billing?.stripeCustomerId) return billing.stripeCustomerId;
  if (!(await firebaseUserExists(uid))) return null;
  return (await getFirestore().doc(`users/${uid}`).get()).get("stripeCustomerId") || null;
}

async function saveCustomerId(uid, customerId) {
  const now = new Date().toISOString();
  await ddb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: { PK: `USER#${uid}`, SK: "BILLING", stripeCustomerId: customerId, updatedAt: now } })
  );
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `STRIPE#${customerId}`, SK: "UID", uid } }));
  if (await firebaseUserExists(uid)) {
    await getFirestore().doc(`users/${uid}`).set({ stripeCustomerId: customerId }, { merge: true });
  }
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
  if (await firebaseUserExists(uid)) {
    await getFirestore()
      .doc(`users/${uid}`)
      .set(
        { purchases: { [plan]: { sessionId: session.id, amountTotal: session.amount_total ?? null, purchasedAt: Timestamp.now() } } },
        { merge: true }
      );
  }
}

async function purchasedPlans(uid, inFirebase) {
  const plans = new Set();
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${uid}`, ":sk": "PURCHASE#" },
    })
  );
  for (const item of result.Items || []) plans.add(item.plan);
  if (inFirebase) {
    const purchases = (await getFirestore().doc(`users/${uid}`).get()).get("purchases") || {};
    for (const plan of Object.keys(purchases)) plans.add(plan);
  }
  return plans;
}

// ---------------------------------------------------------------------------
// exchangeToken — cross-subdomain sign-in: Firebase ID token -> custom token
// carrying the user's custom claims (entitlements).
// ---------------------------------------------------------------------------
async function exchangeToken(data) {
  const idToken = data?.idToken;
  if (!idToken || typeof idToken !== "string") {
    throw new CallableError("INVALID_ARGUMENT", "ID token is required");
  }
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    if (error.code === "auth/id-token-expired") throw new CallableError("UNAUTHENTICATED", "Token expired");
    if (error.code === "auth/id-token-revoked") throw new CallableError("UNAUTHENTICATED", "Token revoked");
    if (error.code === "auth/argument-error") throw new CallableError("INVALID_ARGUMENT", "Invalid token format");
    throw error;
  }
  if (!decoded.email_verified && decoded.provider_id !== "anonymous") {
    throw new CallableError("PERMISSION_DENIED", "Email must be verified before cross-domain login");
  }
  const userRecord = await getAuth().getUser(decoded.uid);
  const customToken = await getAuth().createCustomToken(decoded.uid, userRecord.customClaims || {});
  return { customToken };
}

// ---------------------------------------------------------------------------
// Entitlements: Stripe subscriptions (all-access) + recorded one-time cert
// purchases -> Firestore display summary + Firebase custom claims.
//   claims: { plan: 'pro' } and/or { certs: 'cert-a,cert-b' }
// ---------------------------------------------------------------------------
async function syncCustomerEntitlements(stripe, uid, customerId) {
  const subs = customerId
    ? await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 })
    : { data: [] };

  let allAccess = false;
  const certs = new Set();
  const active = [];

  const inFirebase = await firebaseUserExists(uid);
  for (const plan of await purchasedPlans(uid, inFirebase)) {
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
  if (!inFirebase) return;

  // Mirror for the old Firebase apps
  const firestoreActive = active.map((a) => ({
    ...a,
    currentPeriodEnd: a.currentPeriodEnd ? Timestamp.fromDate(new Date(a.currentPeriodEnd)) : null,
  }));
  await getFirestore().doc(`users/${uid}`).set(
    {
      subscription: {
        provider: "stripe",
        allAccess,
        certs: [...certs],
        active: firestoreActive,
        updatedAt: Timestamp.now(),
      },
    },
    { merge: true }
  );

  const auth = getAuth();
  const userRecord = await auth.getUser(uid);
  const claims = { ...(userRecord.customClaims || {}) };
  if (allAccess) claims.plan = "pro";
  else delete claims.plan;
  if (certs.size > 0) claims.certs = [...certs].join(",");
  else delete claims.certs;
  await auth.setCustomUserClaims(uid, claims);
}

async function uidForSubscription(subscription) {
  if (subscription.metadata?.firebaseUID) return subscription.metadata.firebaseUID;
  const mapped = await getItem(`STRIPE#${subscription.customer}`, "UID");
  if (mapped?.uid) return mapped.uid;
  const snap = await getFirestore()
    .collection("users")
    .where("stripeCustomerId", "==", subscription.customer)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
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
const CALLABLES = { exchangeToken, createCheckoutSession, createPortalSession };

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
    const user = name === "exchangeToken" ? null : await authFromHeader(event);
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
