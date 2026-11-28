// Checkout sells every product as a monthly or yearly subscription and Pro as yearly only, and must
// never sell something the account already has. Runs the real createCheckoutSession against a fake
// Stripe and an in-memory table.
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createRequire } = require("node:module");

const callables = path.join(__dirname, "../lambda/callables/index.js");
const req = createRequire(callables); // resolves the SDK from the function's own node_modules

// The module reads these when it loads; any well-formed values will do
process.env.TABLE_NAME = "test-table";
process.env.USER_POOL_ID = "us-east-1_TestPool1";
process.env.USER_POOL_CLIENT_ID = "test-client";
process.env.STRIPE_PRICE_ALL_ACCESS_YEARLY = "price_pro_year";
process.env.STRIPE_PRICE_ALL_ACCESS = "price_pro"; // the old $39/yr Pro: recognised, never sold
process.env.STRIPE_PRICE_CLOUD_PRACTITIONER_MONTHLY = "price_clf_month";
process.env.STRIPE_PRICE_CLOUD_PRACTITIONER_YEARLY = "price_clf_year";
process.env.STRIPE_PRICE_SOLUTIONS_ARCHITECT_MONTHLY = "price_saa_month";
process.env.STRIPE_PRICE_SOLUTIONS_ARCHITECT_YEARLY = "price_saa_year";
process.env.STRIPE_PRICE_DEVELOPER_ASSOCIATE_MONTHLY = "price_dva_month";
process.env.STRIPE_PRICE_DEVELOPER_ASSOCIATE_YEARLY = "price_dva_year";
process.env.STRIPE_PRICE_PYTHON_COURSE_MONTHLY = "price_py_month";
process.env.STRIPE_PRICE_PYTHON_COURSE_YEARLY = "price_py_year";
process.env.STRIPE_PRICE_TECH_SPANISH_COURSE_MONTHLY = "price_es_month";
process.env.STRIPE_PRICE_TECH_SPANISH_COURSE_YEARLY = "price_es_year";
process.env.STRIPE_PRICE_PYTHON_COURSE = "price_py_once"; // legacy one-time
process.env.STRIPE_PRICE_DEVELOPER_PATH = "price_devpath"; // legacy bundle

// In-memory table behind the DynamoDB document client
const lib = req("@aws-sdk/lib-dynamodb");
let table = new Map();
const key = (pk, sk) => `${pk}|${sk}`;
lib.DynamoDBDocumentClient.prototype.send = async function send(cmd) {
  const input = cmd.input;
  if (cmd instanceof lib.GetCommand) return { Item: table.get(key(input.Key.PK, input.Key.SK)) };
  if (cmd instanceof lib.PutCommand) {
    table.set(key(input.Item.PK, input.Item.SK), input.Item);
    return {};
  }
  if (cmd instanceof lib.QueryCommand) {
    const pk = input.ExpressionAttributeValues[":pk"];
    const prefix = input.ExpressionAttributeValues[":sk"];
    return { Items: [...table.values()].filter((i) => i.PK === pk && i.SK.startsWith(prefix)) };
  }
  throw new Error(`unexpected command ${cmd.constructor.name}`);
};

const { createCheckoutSession, planForPrice, resetSwitchConfiguration } = require(callables)._test;
const { alreadyCovered, coverageFor, PRO_COVERS, PRODUCTS } = require("../lambda/callables/coverage");

// Fake Stripe: one customer per test, its subscriptions, and a record of checkout and portal sessions
function fakeStripe({ subs = [], otherCustomers = [], failSubscriptionList = false, failPortalFlow = false, portalConfigs = [] } = {}) {
  const calls = { sessions: [], portal: [], customersCreated: 0 };
  const byCustomer = { cus_me: subs };
  for (const c of otherCustomers) byCustomer[c.id] = c.subs;
  return {
    calls,
    customers: {
      retrieve: async (id) => ({ id }),
      create: async () => {
        calls.customersCreated += 1;
        return { id: "cus_me" };
      },
      list: async () => ({ data: [{ id: "cus_me" }, ...otherCustomers.map((c) => ({ id: c.id }))] }),
    },
    subscriptions: {
      list: async ({ customer }) => {
        if (failSubscriptionList) throw new Error("Stripe is down");
        return { data: byCustomer[customer] || [] };
      },
    },
    checkout: {
      sessions: {
        create: async (params) => {
          calls.sessions.push(params);
          return { id: "cs_test", url: "https://checkout.stripe.test/session" };
        },
      },
    },
    billingPortal: {
      configurations: { list: async () => ({ data: portalConfigs, has_more: false }) },
      sessions: {
        create: async (params) => {
          if (failPortalFlow && params.flow_data) throw new Error("subscription_update is not enabled");
          calls.portal.push(params);
          return { url: params.flow_data ? "https://billing.stripe.test/switch" : "https://billing.stripe.test/home" };
        },
      },
    },
  };
}
// A Stripe subscription; `interval` sets the price's recurring interval as Stripe reports it
const sub = (status, price, plan, interval) => ({
  id: `sub_${status}_${price}`,
  status,
  metadata: plan ? { plan } : {},
  items: { data: [{ id: `si_${price}`, price: { id: price, ...(interval && { recurring: { interval } }) } }] },
});
const user = { uid: "u1", email: "person@example.test" };
const HUB = "https://levelupstudyhub.com";
const OLD_HUB = "https://aws-study-flashcards-app.com"; // still a listed return address during the move
const OWNED = `${HUB}/?checkout=success&owned=1`;

function account({ customer = true, purchases = [] } = {}) {
  table = new Map();
  resetSwitchConfiguration();
  if (customer) table.set(key("USER#u1", "BILLING"), { PK: "USER#u1", SK: "BILLING", stripeCustomerId: "cus_me" });
  for (const plan of purchases) table.set(key("USER#u1", `PURCHASE#${plan}`), { PK: "USER#u1", SK: `PURCHASE#${plan}`, plan });
}
const rejectsWith = (status, pattern) => (err) => err.status === status && pattern.test(err.message);

// ---------------------------------------------------------------------------
// Pro
// ---------------------------------------------------------------------------

test("a free year in its trial is not sold Pro again: back to the site, Pro written", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("trialing", "price_old_pro", "all-access")] }); // known by metadata only
  const res = await createCheckoutSession({ plan: "all-access", returnUrl: OLD_HUB }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(res.url, `${OLD_HUB}/?checkout=success&owned=1`, "back to the name the page was opened on");
  assert.equal(stripe.calls.sessions.length, 0, "no checkout session may be created");
  assert.equal(table.get(key("USER#u1", "ENTITLEMENTS")).allAccess, true);
});

test("paid Pro on the old $39 price is not sold a certificate that Pro includes", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_pro")] }); // plan found from the legacy price
  const res = await createCheckoutSession(
    { plan: "solutions-architect-associate", interval: "month", returnUrl: "https://saa.aws-study-flashcards-app.com" },
    user,
    stripe
  );
  assert.equal(res.url, "https://saa.aws-study-flashcards-app.com/?checkout=success&owned=1");
  assert.equal(stripe.calls.sessions.length, 0);
});

test("Pro covers every coding course too (and Tech Spanish)", async () => {
  for (const plan of ["bash-for-aws", "python-for-aws", "javascript-for-aws", "typescript-for-aws", "tech-spanish"]) {
    account();
    const stripe = fakeStripe({ subs: [sub("active", "price_pro_year", "all-access", "year")] });
    const res = await createCheckoutSession({ plan, interval: "year" }, user, stripe);
    assert.equal(res.alreadyOwned, true, plan);
    assert.equal(stripe.calls.sessions.length, 0, plan);
  }
});

test("ended Pro can buy again, at full price with no second trial", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("canceled", "price_pro", "all-access")] });
  const res = await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(res.url, "https://checkout.stripe.test/session");
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, undefined);
});

test("a first-time buyer still gets checkout with the 14-day free trial, on the new yearly Pro price", async () => {
  account({ customer: false });
  const stripe = fakeStripe();
  await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  const s = stripe.calls.sessions[0];
  assert.equal(s.subscription_data.trial_period_days, 14);
  assert.equal(s.custom_text, undefined, "no overlap notice without product subscriptions");
  assert.equal(s.success_url, `${HUB}/?checkout=success`);
  assert.equal(s.mode, "subscription");
  assert.deepEqual(s.line_items, [{ price: "price_pro_year", quantity: 1 }]);
  assert.deepEqual(s.metadata, { firebaseUID: "u1", plan: "all-access", interval: "year" });
  assert.deepEqual(s.subscription_data.metadata, s.metadata);
});

test("Pro: interval defaults to yearly, yearly is accepted, monthly is refused", async () => {
  account();
  let stripe = fakeStripe();
  await createCheckoutSession({ plan: "all-access", interval: "year" }, user, stripe);
  assert.equal(stripe.calls.sessions[0].line_items[0].price, "price_pro_year");
  stripe = fakeStripe();
  await assert.rejects(createCheckoutSession({ plan: "all-access", interval: "month" }, user, stripe), rejectsWith("INVALID_ARGUMENT", /yearly/));
  assert.equal(stripe.calls.sessions.length, 0);
});

test("Pro running on the person's other sign-in (same email) is not sold again", async () => {
  // One person, two sign-ins: Google on one account, email and password on another. The free year
  // sits on the other one, so this account shows no Pro, but selling would charge them twice.
  account();
  const stripe = fakeStripe({ otherCustomers: [{ id: "cus_other", subs: [sub("trialing", "price_pro", "all-access")] }] });
  await assert.rejects(
    createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe),
    rejectsWith("FAILED_PRECONDITION", /other sign-in/)
  );
  assert.equal(stripe.calls.sessions.length, 0);
});

test("Pro that ended on another sign-in still sells, with no second trial", async () => {
  account();
  const stripe = fakeStripe({ otherCustomers: [{ id: "cus_other", subs: [sub("canceled", "price_pro", "all-access")] }] });
  await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, undefined);
});

test("statuses: a late payment (past_due) still counts as Pro, an unfinished one (incomplete) does not", async () => {
  account();
  let stripe = fakeStripe({ subs: [sub("past_due", "price_pro", "all-access")] });
  assert.equal((await createCheckoutSession({ plan: "all-access" }, user, stripe)).alreadyOwned, true);
  account();
  stripe = fakeStripe({ subs: [sub("incomplete", "price_pro", "all-access")] });
  await createCheckoutSession({ plan: "all-access" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, undefined, "they have had Pro");
});

test("if Stripe can't be read, the sale still goes ahead", async () => {
  account();
  const stripe = fakeStripe({ failSubscriptionList: true });
  await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, undefined, "no trial when history is unknown");
});

// ---------------------------------------------------------------------------
// Products: monthly or yearly, always a subscription, never a trial
// ---------------------------------------------------------------------------

test("a product sells monthly or yearly at the matching price, as a subscription with no trial", async () => {
  for (const [interval, price] of [["month", "price_clf_month"], ["year", "price_clf_year"]]) {
    account({ customer: false }); // a first-time buyer: never had Pro, still no trial on a product
    const stripe = fakeStripe();
    const res = await createCheckoutSession({ plan: "cloud-practitioner", interval, returnUrl: HUB }, user, stripe);
    assert.equal(res.url, "https://checkout.stripe.test/session");
    const s = stripe.calls.sessions[0];
    assert.equal(s.mode, "subscription");
    assert.deepEqual(s.line_items, [{ price, quantity: 1 }]);
    assert.equal(s.subscription_data.trial_period_days, undefined, "products never get the trial");
    assert.equal(s.subscription_data.trial_settings, undefined);
    assert.equal(s.payment_method_collection, "always");
    assert.equal(s.invoice_creation, undefined, "payment mode only");
    assert.deepEqual(s.metadata, { firebaseUID: "u1", plan: "cloud-practitioner", interval });
    assert.deepEqual(s.subscription_data.metadata, s.metadata);
  }
});

test("every product and Pro check out in subscription mode; only Pro carries a trial", async () => {
  const env = { "cloud-practitioner": 1, "solutions-architect-associate": 1, "developer-associate": 1, "python-for-aws": 1, "tech-spanish": 1 };
  for (const plan of [...Object.keys(env), "all-access"]) {
    account({ customer: false });
    const stripe = fakeStripe();
    await createCheckoutSession({ plan, interval: "year" }, user, stripe);
    const s = stripe.calls.sessions[0];
    assert.equal(s.mode, "subscription", plan);
    assert.equal(Boolean(s.subscription_data.trial_period_days), plan === "all-access", plan);
  }
});

test("a product needs monthly or yearly: missing or invalid interval is refused", async () => {
  for (const interval of [undefined, null, "week", "yearly", 12]) {
    account();
    const stripe = fakeStripe();
    await assert.rejects(
      createCheckoutSession({ plan: "python-for-aws", interval }, user, stripe),
      rejectsWith("INVALID_ARGUMENT", /Choose monthly or yearly/),
      String(interval)
    );
    assert.equal(stripe.calls.sessions.length, 0);
  }
});

test("a refused request creates no Stripe customer", async () => {
  account({ customer: false });
  const stripe = fakeStripe();
  await assert.rejects(createCheckoutSession({ plan: "python-for-aws" }, user, stripe), rejectsWith("INVALID_ARGUMENT", /monthly/));
  assert.equal(stripe.calls.customersCreated, 0);
});

test("a product whose price for that interval is not set up is not available", async () => {
  account();
  const stripe = fakeStripe();
  await assert.rejects(
    createCheckoutSession({ plan: "bash-for-aws", interval: "month" }, user, stripe),
    rejectsWith("FAILED_PRECONDITION", /Plan not available/)
  );
  await assert.rejects(createCheckoutSession({ plan: "no-such-plan", interval: "month" }, user, stripe), rejectsWith("FAILED_PRECONDITION", /Plan not available/));
});

test("a one-time purchase covers the product for good, whatever interval is asked for", async () => {
  for (const interval of ["month", "year", undefined]) {
    account({ purchases: ["cloud-practitioner"] });
    const stripe = fakeStripe();
    const res = await createCheckoutSession({ plan: "cloud-practitioner", interval }, user, stripe);
    assert.equal(res.alreadyOwned, true, String(interval));
    assert.equal(res.url, OWNED);
    assert.equal(stripe.calls.sessions.length, 0);
  }
});

test("a one-time Pro purchase covers every product", async () => {
  account({ purchases: ["all-access"] });
  const stripe = fakeStripe();
  assert.equal((await createCheckoutSession({ plan: "tech-spanish", interval: "month" }, user, stripe)).alreadyOwned, true);
});

test("the same subscription, same interval: owned, no second checkout", async () => {
  for (const interval of ["month", "year"]) {
    account();
    const stripe = fakeStripe({ subs: [sub("active", `price_clf_${interval}`, "cloud-practitioner", interval)] });
    const res = await createCheckoutSession({ plan: "cloud-practitioner", interval }, user, stripe);
    assert.equal(res.alreadyOwned, true, interval);
    assert.equal(stripe.calls.sessions.length + stripe.calls.portal.length, 0);
  }
});

test("active monthly, asking for yearly: a portal page confirms the switch, no checkout", async () => {
  account();
  const monthly = sub("active", "price_clf_month", "cloud-practitioner", "month");
  const stripe = fakeStripe({ subs: [monthly] });
  const res = await createCheckoutSession(
    { plan: "cloud-practitioner", interval: "year", returnUrl: "https://cloud.levelupstudyhub.com" },
    user,
    stripe
  );
  assert.deepEqual(res, { url: "https://billing.stripe.test/switch", switchInterval: true });
  assert.equal(stripe.calls.sessions.length, 0, "no second subscription");
  const portal = stripe.calls.portal[0];
  assert.equal(portal.customer, "cus_me");
  assert.equal(portal.return_url, "https://cloud.levelupstudyhub.com");
  assert.equal(portal.flow_data.type, "subscription_update_confirm");
  assert.deepEqual(portal.flow_data.subscription_update_confirm, {
    subscription: monthly.id,
    items: [{ id: "si_price_clf_month", price: "price_clf_year", quantity: 1 }],
  });
  assert.equal(portal.flow_data.after_completion.redirect.return_url, "https://cloud.levelupstudyhub.com/?checkout=success");
  assert.equal(portal.configuration, undefined, "no switch configuration set up: the default portal");
});

test("the switch link uses the interval-switch portal configuration, never the default one", async () => {
  // The default portal has plan switching off, so "Manage billing" can't move a subscription to another product
  account();
  const portalConfigs = [
    { id: "bpc_default", is_default: true, metadata: {} },
    { id: "bpc_switch", is_default: false, metadata: { purpose: "interval-switch" } },
  ];
  const stripe = fakeStripe({ subs: [sub("active", "price_clf_month", "cloud-practitioner", "month")], portalConfigs });
  const res = await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe);
  assert.equal(res.switchInterval, true);
  assert.equal(stripe.calls.portal[0].configuration, "bpc_switch");
});

test("the monthly interval is also known from our metadata or our price table", async () => {
  // No recurring interval on the price object: metadata, then the table, tell it is monthly
  account();
  const byMeta = { ...sub("active", "price_custom", "cloud-practitioner"), metadata: { plan: "cloud-practitioner", interval: "month" } };
  let stripe = fakeStripe({ subs: [byMeta] });
  assert.equal((await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe)).switchInterval, true);
  account();
  stripe = fakeStripe({ subs: [sub("active", "price_clf_month")] });
  assert.equal((await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe)).switchInterval, true);
});

test("when the portal can't open the switch, it opens Manage billing instead", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_clf_month", "cloud-practitioner", "month")], failPortalFlow: true });
  const res = await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe);
  assert.deepEqual(res, { url: "https://billing.stripe.test/home", switchInterval: true });
  assert.equal(stripe.calls.sessions.length, 0);
});

test("active yearly, asking for monthly: owned (switching down happens in Manage billing)", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_clf_year", "cloud-practitioner", "year")] });
  const res = await createCheckoutSession({ plan: "cloud-practitioner", interval: "month" }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(stripe.calls.sessions.length + stripe.calls.portal.length, 0);
});

test("monthly and yearly both running: owned, not offered a switch", async () => {
  account();
  const stripe = fakeStripe({
    subs: [sub("active", "price_clf_month", "cloud-practitioner", "month"), sub("active", "price_clf_year", "cloud-practitioner", "year")],
  });
  assert.equal((await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe)).alreadyOwned, true);
});

test("an ended subscription to the product sells again", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("canceled", "price_clf_month", "cloud-practitioner", "month")] });
  await createCheckoutSession({ plan: "cloud-practitioner", interval: "year" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
});

test("another product's subscription does not cover this one", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_clf_month", "cloud-practitioner", "month")] });
  await createCheckoutSession({ plan: "solutions-architect-associate", interval: "month" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
});

test("the same product running on the person's other sign-in is not sold again", async () => {
  account();
  const stripe = fakeStripe({
    otherCustomers: [{ id: "cus_other", subs: [sub("active", "price_py_month", "python-for-aws", "month")] }],
  });
  await assert.rejects(
    createCheckoutSession({ plan: "python-for-aws", interval: "year" }, user, stripe),
    rejectsWith("FAILED_PRECONDITION", /other sign-in/)
  );
  assert.equal(stripe.calls.sessions.length, 0);
});

test("Pro on the other sign-in also blocks buying a product here", async () => {
  account();
  const stripe = fakeStripe({ otherCustomers: [{ id: "cus_other", subs: [sub("active", "price_pro_year", "all-access", "year")] }] });
  await assert.rejects(
    createCheckoutSession({ plan: "tech-spanish", interval: "month" }, user, stripe),
    rejectsWith("FAILED_PRECONDITION", /^Pro is already on/)
  );
});

test("a different product on the other sign-in does not block", async () => {
  account();
  const stripe = fakeStripe({ otherCustomers: [{ id: "cus_other", subs: [sub("active", "price_py_month", "python-for-aws", "month")] }] });
  await createCheckoutSession({ plan: "cloud-practitioner", interval: "month" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
});

// ---------------------------------------------------------------------------
// Developer Path: no longer sold, its owners keep everything in it
// ---------------------------------------------------------------------------

test("the Developer Path bundle already covers the Developer Associate exam (even from an old page)", async () => {
  account({ purchases: ["developer-path"] });
  const stripe = fakeStripe();
  const res = await createCheckoutSession({ plan: "developer-associate" }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(res.url, OWNED, "an unknown or missing return address falls back to the hub on levelupstudyhub.com");
});

test("the Developer Path bundle covers its four courses but not Tech Spanish", async () => {
  for (const plan of ["bash-for-aws", "python-for-aws", "javascript-for-aws", "typescript-for-aws"]) {
    account({ purchases: ["developer-path"] });
    assert.equal((await createCheckoutSession({ plan, interval: "month" }, user, fakeStripe())).alreadyOwned, true, plan);
  }
  account({ purchases: ["developer-path"] });
  const stripe = fakeStripe();
  await createCheckoutSession({ plan: "tech-spanish", interval: "month" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
});

test("the Developer Path bundle is no longer sold", async () => {
  account();
  const stripe = fakeStripe();
  await assert.rejects(
    createCheckoutSession({ plan: "developer-path" }, user, stripe),
    rejectsWith("FAILED_PRECONDITION", /no longer sold/)
  );
  assert.equal(stripe.calls.sessions.length, 0);
});

test("...but its owners asking for it again (or Pro members) are sent back as owners", async () => {
  account({ purchases: ["developer-path"] });
  assert.equal((await createCheckoutSession({ plan: "developer-path" }, user, fakeStripe())).alreadyOwned, true);
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_pro_year", "all-access", "year")] });
  assert.equal((await createCheckoutSession({ plan: "developer-path" }, user, stripe)).alreadyOwned, true);
});

// ---------------------------------------------------------------------------
// The rule on its own, and the price table
// ---------------------------------------------------------------------------

test("alreadyCovered: the rule on its own", () => {
  const base = { purchased: new Set(), subscriptions: [], bundles: { "developer-path": ["python-for-aws", "developer-associate"] }, activeStatuses: ["active", "trialing", "past_due"] };
  const pro = (status) => [{ status, plan: "all-access" }];
  assert.equal(alreadyCovered({ ...base, plan: "all-access", subscriptions: pro("past_due") }), true);
  assert.equal(alreadyCovered({ ...base, plan: "all-access", subscriptions: pro("incomplete") }), false);
  assert.equal(alreadyCovered({ ...base, plan: "cloud-practitioner", purchased: new Set(["cloud-practitioner"]) }), true);
  assert.equal(alreadyCovered({ ...base, plan: "ai-practitioner", purchased: new Set(["cloud-practitioner"]) }), false);
  assert.equal(alreadyCovered({ ...base, plan: "python-for-aws", purchased: new Set(["developer-path"]) }), true, "the bundle covers its courses");
  assert.equal(alreadyCovered({ ...base, plan: "python-for-aws", subscriptions: pro("active") }), true, "Pro covers the courses");
  assert.equal(alreadyCovered({ ...base, plan: "tech-spanish", subscriptions: [{ status: "active", plan: "tech-spanish" }] }), true);
  assert.equal(alreadyCovered({ ...base, plan: "no-such-plan", purchased: new Set(["all-access"]) }), false);
  assert.equal(PRO_COVERS.has("developer-path"), false);
});

test("coverageFor: says why, and prefers a yearly subscription over a monthly one", () => {
  const base = { purchased: new Set(), bundles: {}, activeStatuses: ["active"] };
  const monthly = { status: "active", plan: "cloud-practitioner", interval: "month" };
  const yearly = { status: "active", plan: "cloud-practitioner", interval: "year" };
  assert.deepEqual(coverageFor({ ...base, plan: "cloud-practitioner", subscriptions: [monthly] }), { by: "subscription", subscription: monthly });
  assert.deepEqual(coverageFor({ ...base, plan: "cloud-practitioner", subscriptions: [monthly, yearly] }), { by: "subscription", subscription: yearly });
  assert.deepEqual(coverageFor({ ...base, plan: "cloud-practitioner", subscriptions: [monthly], purchased: new Set(["cloud-practitioner"]) }), { by: "purchase" });
  assert.equal(coverageFor({ ...base, plan: "cloud-practitioner", subscriptions: [] }), null);
});

test("PRO_COVERS is Pro plus all nine products", () => {
  assert.equal(PRODUCTS.length, 9);
  assert.deepEqual([...PRO_COVERS].sort(), ["all-access", ...PRODUCTS].sort());
});

test("planForPrice knows the new prices and the legacy ones", () => {
  assert.equal(planForPrice("price_clf_month"), "cloud-practitioner");
  assert.equal(planForPrice("price_clf_year"), "cloud-practitioner");
  assert.equal(planForPrice("price_pro_year"), "all-access");
  assert.equal(planForPrice("price_pro"), "all-access");
  assert.equal(planForPrice("price_py_once"), "python-for-aws");
  assert.equal(planForPrice("price_devpath"), "developer-path");
  assert.equal(planForPrice(""), null);
  assert.equal(planForPrice(undefined), null);
  assert.equal(planForPrice("price_unknown"), null);
});

test("buying Pro while paying for a product: Checkout and the return page say the product keeps billing", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_clf_month", "cloud-practitioner", "month")] });
  await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  const s = stripe.calls.sessions[0];
  assert.match(s.custom_text.submit.message, /keep billing until you cancel them in Manage billing/);
  assert.equal(s.success_url, `${HUB}/?checkout=success&overlap=1`);
});

test("the price decides the plan: a portal switch to another product's price is not read from stale metadata", async () => {
  // Metadata still says cloud-practitioner, but the subscription now bills the Python course
  account();
  let stripe = fakeStripe({ subs: [sub("active", "price_py_month", "cloud-practitioner", "month")] });
  const res = await createCheckoutSession({ plan: "python-for-aws", interval: "month" }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(stripe.calls.sessions.length, 0);
  stripe = fakeStripe({ subs: [sub("active", "price_py_month", "cloud-practitioner", "month")] });
  await createCheckoutSession({ plan: "cloud-practitioner", interval: "month" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1, "Cloud Practitioner is no longer paid for, so it sells");
});
