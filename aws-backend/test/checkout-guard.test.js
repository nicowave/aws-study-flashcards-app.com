// Checkout must never sell Pro, or a certificate Pro includes, to an account that already has it.
// Runs the real createCheckoutSession against a fake Stripe and an in-memory table.
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
process.env.STRIPE_PRICE_ALL_ACCESS = "price_pro";
process.env.STRIPE_PRICE_SOLUTIONS_ARCHITECT = "price_saa";
process.env.STRIPE_PRICE_DEVELOPER_ASSOCIATE = "price_dva";
process.env.STRIPE_PRICE_PYTHON_COURSE = "price_py";
process.env.STRIPE_PRICE_DEVELOPER_PATH = "price_devpath";

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

const { createCheckoutSession } = require(callables)._test;
const { alreadyCovered, PRO_COVERS } = require("../lambda/callables/coverage");

// Fake Stripe: one customer per test, its subscriptions, and a record of checkout sessions
function fakeStripe({ subs = [], otherCustomers = [], failSubscriptionList = false } = {}) {
  const calls = { sessions: [] };
  const byCustomer = { cus_me: subs };
  for (const c of otherCustomers) byCustomer[c.id] = c.subs;
  return {
    calls,
    customers: {
      retrieve: async (id) => ({ id }),
      create: async () => ({ id: "cus_me" }),
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
  };
}
const sub = (status, price, plan) => ({
  id: `sub_${status}_${price}`,
  status,
  metadata: plan ? { plan } : {},
  items: { data: [{ price: { id: price } }] },
});
const user = { uid: "u1", email: "person@example.test" };
const HUB = "https://levelupstudyhub.com";
const OLD_HUB = "https://aws-study-flashcards-app.com"; // still a listed return address during the move

function account({ customer = true, purchases = [] } = {}) {
  table = new Map();
  if (customer) table.set(key("USER#u1", "BILLING"), { PK: "USER#u1", SK: "BILLING", stripeCustomerId: "cus_me" });
  for (const plan of purchases) table.set(key("USER#u1", `PURCHASE#${plan}`), { PK: "USER#u1", SK: `PURCHASE#${plan}`, plan });
}

test("a free year in its trial is not sold Pro again: back to the site, Pro written", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("trialing", "price_old_pro", "all-access")] }); // known by metadata only
  const res = await createCheckoutSession({ plan: "all-access", returnUrl: OLD_HUB }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(res.url, `${OLD_HUB}/?checkout=success&owned=1`, "back to the name the page was opened on");
  assert.equal(stripe.calls.sessions.length, 0, "no checkout session may be created");
  assert.equal(table.get(key("USER#u1", "ENTITLEMENTS")).allAccess, true);
});

test("paid Pro is not sold a certificate that Pro includes", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_pro")] }); // plan found from the price
  const res = await createCheckoutSession(
    { plan: "solutions-architect-associate", returnUrl: "https://saa.aws-study-flashcards-app.com" },
    user,
    stripe
  );
  assert.equal(res.url, "https://saa.aws-study-flashcards-app.com/?checkout=success&owned=1");
  assert.equal(stripe.calls.sessions.length, 0);
});

test("the Developer Path bundle already covers the Developer Associate exam", async () => {
  account({ purchases: ["developer-path"] });
  const stripe = fakeStripe();
  const res = await createCheckoutSession({ plan: "developer-associate" }, user, stripe);
  assert.equal(res.alreadyOwned, true);
  assert.equal(res.url, `${HUB}/?checkout=success&owned=1`, "an unknown or missing return address falls back to the hub on levelupstudyhub.com");
});

test("ended Pro can buy again, at full price with no second trial", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("canceled", "price_pro", "all-access")] });
  const res = await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(res.url, "https://checkout.stripe.test/session");
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, undefined);
});

test("a first-time buyer still gets checkout with the free week", async () => {
  account({ customer: false });
  const stripe = fakeStripe();
  await createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
  assert.equal(stripe.calls.sessions[0].subscription_data.trial_period_days, 7);
});

test("Pro does not cover the coding courses, so they are still sold", async () => {
  account();
  const stripe = fakeStripe({ subs: [sub("active", "price_pro", "all-access")] });
  await createCheckoutSession({ plan: "python-for-aws" }, user, stripe);
  assert.equal(stripe.calls.sessions.length, 1);
});

test("Pro running on the person's other sign-in (same email) is not sold again", async () => {
  // One person, two sign-ins: Google on one account, email and password on another. The free year
  // sits on the other one, so this account shows no Pro, but selling would charge them twice.
  account();
  const stripe = fakeStripe({ otherCustomers: [{ id: "cus_other", subs: [sub("trialing", "price_pro", "all-access")] }] });
  await assert.rejects(
    createCheckoutSession({ plan: "all-access", returnUrl: HUB }, user, stripe),
    (err) => err.status === "FAILED_PRECONDITION" && /other sign-in/.test(err.message)
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

test("alreadyCovered: the rule on its own", () => {
  const base = { purchased: new Set(), subscriptions: [], bundles: { "developer-path": ["python-for-aws", "developer-associate"] }, activeStatuses: ["active", "trialing", "past_due"] };
  const pro = (status) => [{ status, plan: "all-access" }];
  assert.equal(alreadyCovered({ ...base, plan: "all-access", subscriptions: pro("past_due") }), true);
  assert.equal(alreadyCovered({ ...base, plan: "all-access", subscriptions: pro("incomplete") }), false);
  assert.equal(alreadyCovered({ ...base, plan: "cloud-practitioner", purchased: new Set(["cloud-practitioner"]) }), true);
  assert.equal(alreadyCovered({ ...base, plan: "ai-practitioner", purchased: new Set(["cloud-practitioner"]) }), false);
  assert.equal(alreadyCovered({ ...base, plan: "python-for-aws", purchased: new Set(["developer-path"]) }), false, "courses are out of scope");
  assert.equal(PRO_COVERS.has("developer-path"), false);
});
