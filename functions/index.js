const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

// Initialize Firebase Admin SDK
initializeApp();

// ---------------------------------------------------------------------------
// Billing configuration
// Secrets are set with:  firebase functions:secrets:set STRIPE_API_KEY
//                        firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// (Use a restricted API key — see docs/stripe-setup.md.)
// The price ID is not secret; set it in functions/.env as STRIPE_PRICE_ALL_ACCESS.
// ---------------------------------------------------------------------------
const stripeApiKey = defineSecret("STRIPE_API_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const priceAllAccess = defineString("STRIPE_PRICE_ALL_ACCESS", { default: "" });
const priceCloudPractitioner = defineString("STRIPE_PRICE_CLOUD_PRACTITIONER", { default: "" });
const priceAiPractitioner = defineString("STRIPE_PRICE_AI_PRACTITIONER", { default: "" });

const SITE_URL = "https://aws-study-flashcards-app.com";
const ALLOWED_ORIGINS = [
  "https://aws-study-flashcards-app.com",
  "https://cloud.aws-study-flashcards-app.com",
  "https://ai.aws-study-flashcards-app.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

let stripeClient = null;
const getStripe = () => {
  if (!stripeClient) {
    // Lazy require so functions that don't use Stripe cold-start faster
    stripeClient = require("stripe")(stripeApiKey.value());
  }
  return stripeClient;
};

// Plans a checkout can be started for. Maps plan id -> Stripe price ID param.
// Per-cert plans ($10.99/mo each) plus an all-access bundle.
const PLAN_PRICES = () => ({
  "all-access": priceAllAccess.value(),
  "cloud-practitioner": priceCloudPractitioner.value(),
  "ai-practitioner": priceAiPractitioner.value(),
});

// Reverse lookup: Stripe price ID -> plan id
const planForPrice = (priceId) => {
  const entries = Object.entries(PLAN_PRICES());
  const hit = entries.find(([, p]) => p && p === priceId);
  return hit ? hit[0] : null;
};

// A subscription in one of these Stripe statuses grants the "pro" plan.
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/**
 * exchangeToken - Validates a Firebase ID token and returns a Custom Token.
 * Used for cross-subdomain SSO: when a user is logged in on one subdomain,
 * other subdomains can use the shared cookie (ID token) to establish
 * their own Firebase session via signInWithCustomToken().
 */
exports.exchangeToken = onCall(
  {
    cors: ALLOWED_ORIGINS,
    // No authentication required - we validate the ID token manually
    enforceAppCheck: false,
  },
  async (request) => {
    const { idToken } = request.data;

    if (!idToken || typeof idToken !== "string") {
      throw new HttpsError("invalid-argument", "ID token is required");
    }

    try {
      // Verify the ID token with Firebase Admin SDK
      const decodedToken = await getAuth().verifyIdToken(idToken);

      // Ensure email is verified (matches existing app requirement)
      if (!decodedToken.email_verified && decodedToken.provider_id !== "anonymous") {
        throw new HttpsError(
          "permission-denied",
          "Email must be verified before cross-domain login"
        );
      }

      // Create a custom token for this user, carrying their custom claims
      // (e.g. plan entitlements) so they survive the cross-subdomain hop.
      const userRecord = await getAuth().getUser(decodedToken.uid);
      const customToken = await getAuth().createCustomToken(
        decodedToken.uid,
        userRecord.customClaims || {}
      );

      return { customToken };
    } catch (error) {
      // Handle specific Firebase auth errors
      if (error.code === "auth/id-token-expired") {
        throw new HttpsError("unauthenticated", "Token expired");
      }
      if (error.code === "auth/id-token-revoked") {
        throw new HttpsError("unauthenticated", "Token revoked");
      }
      if (error.code === "auth/argument-error") {
        throw new HttpsError("invalid-argument", "Invalid token format");
      }

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("exchangeToken error:", error);
      throw new HttpsError("internal", "Failed to exchange token");
    }
  }
);

// ===========================================================================
// Billing (Stripe)
// ===========================================================================

/**
 * Recomputes a user's entitlements from ALL of their Stripe subscriptions
 * (a user may hold one subscription per certification), writes a display
 * summary to Firestore, and mirrors entitlements into Firebase custom
 * claims. Claims are the enforcement surface (tamper-proof, survive SSO via
 * exchangeToken); the Firestore field is for display only.
 *
 * Claims shape: { plan: 'pro' }            for an active all-access sub
 *               { certs: 'ccp-id,aif-id' } for active per-cert subs
 */
async function syncCustomerEntitlements(uid, customerId) {
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  let allAccess = false;
  const certs = new Set();
  const active = [];
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
      currentPeriodEnd: sub.current_period_end
        ? Timestamp.fromMillis(sub.current_period_end * 1000)
        : null,
    });
  }

  await getFirestore().doc(`users/${uid}`).set(
    {
      subscription: {
        provider: "stripe",
        allAccess,
        certs: [...certs],
        active,
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
  console.log(
    `[billing] Synced uid=${uid} allAccess=${allAccess} certs=${claims.certs || "none"}`
  );
}

/** Resolve a Firebase UID from a Stripe subscription (metadata, then customer lookup). */
async function uidForSubscription(subscription) {
  if (subscription.metadata?.firebaseUID) return subscription.metadata.firebaseUID;
  const snap = await getFirestore()
    .collection("users")
    .where("stripeCustomerId", "==", subscription.customer)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * createCheckoutSession - Starts a Stripe Checkout for the signed-in user.
 * Input: { plan: 'all-access' }. Returns: { url } to redirect the browser to.
 */
exports.createCheckoutSession = onCall(
  { cors: ALLOWED_ORIGINS, secrets: [stripeApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to upgrade");
    }
    const plan = request.data?.plan || "all-access";
    const priceId = PLAN_PRICES()[plan];
    if (!priceId) {
      throw new HttpsError("failed-precondition", `Plan not available: ${plan}`);
    }

    const uid = request.auth.uid;
    const stripe = getStripe();
    const userRef = getFirestore().doc(`users/${uid}`);
    const userDoc = await userRef.get();
    let customerId = userDoc.get("stripeCustomerId");

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.auth.token.email || undefined,
        metadata: { firebaseUID: uid },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    // Return the buyer to the site they started from (e.g. a game subdomain),
    // but only if it's one of ours.
    const requestedReturn = typeof request.data?.returnUrl === "string" ? request.data.returnUrl : "";
    const returnBase = ALLOWED_ORIGINS.find((o) => requestedReturn === o || requestedReturn.startsWith(`${o}/`))
      ? requestedReturn.replace(/\/$/, "")
      : SITE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { firebaseUID: uid, plan } },
      metadata: { firebaseUID: uid, plan },
      allow_promotion_codes: true,
      success_url: `${returnBase}/?checkout=success`,
      cancel_url: `${returnBase}/?checkout=cancelled`,
    });

    return { url: session.url };
  }
);

/**
 * createPortalSession - Opens the Stripe customer portal (manage/cancel/invoices).
 * Returns: { url }.
 */
exports.createPortalSession = onCall(
  { cors: ALLOWED_ORIGINS, secrets: [stripeApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in first");
    }
    const userDoc = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const customerId = userDoc.get("stripeCustomerId");
    if (!customerId) {
      throw new HttpsError("failed-precondition", "No billing account yet");
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: SITE_URL,
    });
    return { url: session.url };
  }
);

/**
 * stripeWebhook - Receives Stripe events and syncs entitlements.
 * Configure the endpoint in the Stripe dashboard with events:
 *   checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */
exports.stripeWebhook = onRequest(
  { secrets: [stripeApiKey, stripeWebhookSecret] },
  async (req, res) => {
    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error("[billing] Webhook signature verification failed:", err.message);
      res.status(400).send("Invalid signature");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.mode === "subscription" && session.customer) {
            const uid =
              session.metadata?.firebaseUID ||
              (await uidForSubscription({ metadata: {}, customer: session.customer }));
            if (uid) await syncCustomerEntitlements(uid, session.customer);
            else console.error("[billing] No UID for checkout session", session.id);
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const uid = await uidForSubscription(subscription);
          if (uid) await syncCustomerEntitlements(uid, subscription.customer);
          else console.error("[billing] No UID for subscription", subscription.id);
          break;
        }
        default:
          break;
      }
      res.status(200).send("ok");
    } catch (err) {
      console.error("[billing] Webhook handler error:", err);
      // 500 so Stripe retries
      res.status(500).send("Handler error");
    }
  }
);
