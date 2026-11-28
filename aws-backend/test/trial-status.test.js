// The Pro card may only promise the free trial when checkout would give it.
// Runs the real proTrialStatus and createCheckoutSession against a fake Stripe and table.
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createRequire } = require("node:module");

const callables = path.join(__dirname, "../lambda/callables/index.js");
const req = createRequire(callables);

process.env.TABLE_NAME = "test-table";
process.env.USER_POOL_ID = "us-east-1_TestPool1";
process.env.USER_POOL_CLIENT_ID = "test-client";
process.env.STRIPE_PRICE_ALL_ACCESS_YEARLY = "price_pro";

const lib = req("@aws-sdk/lib-dynamodb");
let table = new Map();
const key = (pk, sk) => `${pk}|${sk}`;
lib.DynamoDBDocumentClient.prototype.send = async function send(cmd) {
  const input = cmd.input;
  if (cmd instanceof lib.GetCommand) return { Item: table.get(key(input.Key.PK, input.Key.SK)) };
  if (cmd instanceof lib.PutCommand) { table.set(key(input.Item.PK, input.Item.SK), input.Item); return {}; }
  if (cmd instanceof lib.QueryCommand) {
    const pk = input.ExpressionAttributeValues[":pk"];
    const prefix = input.ExpressionAttributeValues[":sk"];
    return { Items: [...table.values()].filter((i) => i.PK === pk && i.SK.startsWith(prefix)) };
  }
  throw new Error(`unexpected command ${cmd.constructor.name}`);
};

const { proTrialStatus, createCheckoutSession } = require(callables)._test;

function fakeStripe({ mine = [], others = [], fail = false } = {}) {
  const sessions = [];
  const byCustomer = { cus_me: mine };
  others.forEach((c) => { byCustomer[c.id] = c.subs; });
  return {
    sessions,
    customers: {
      retrieve: async (id) => ({ id }),
      create: async () => ({ id: "cus_me" }),
      list: async () => ({ data: [...(table.size ? [{ id: "cus_me" }] : []), ...others.map((c) => ({ id: c.id }))] }),
    },
    subscriptions: {
      list: async ({ customer }) => {
        if (fail) throw new Error("Stripe is down");
        if (!customer) throw new Error("customer is required"); // like the real API
        return { data: byCustomer[customer] || [] };
      },
    },
    checkout: { sessions: { create: async (p) => { sessions.push(p); return { id: "cs", url: "https://checkout.stripe.test" }; } } },
  };
}
const proSub = (status) => ({ id: `sub_${status}`, status, metadata: { plan: "all-access" }, items: { data: [{ price: { id: "price_pro" } }] } });
const user = { uid: "u1", email: "person@example.test" };
const withCustomer = () => { table = new Map([[key("USER#u1", "BILLING"), { PK: "USER#u1", SK: "BILLING", stripeCustomerId: "cus_me" }]]); };
const noCustomer = () => { table = new Map(); };

// Same answer as checkout: does the subscription checkout would create carry a trial?
async function checkoutGivesTrial(stripe) {
  await createCheckoutSession({ plan: "all-access" }, user, stripe);
  return Boolean(stripe.sessions.at(-1)?.subscription_data?.trial_period_days);
}

test("never had Pro, never reached checkout: trial available", async () => {
  noCustomer();
  assert.deepEqual(await proTrialStatus({}, user, fakeStripe()), { trialAvailable: true });
});

test("never had Pro, has a customer: trial available, and checkout agrees", async () => {
  withCustomer();
  const stripe = fakeStripe();
  assert.deepEqual(await proTrialStatus({}, user, stripe), { trialAvailable: true });
  assert.equal(await checkoutGivesTrial(stripe), true);
});

test("Pro that ended: no trial, and checkout agrees", async () => {
  withCustomer();
  const stripe = fakeStripe({ mine: [proSub("canceled")] });
  assert.deepEqual(await proTrialStatus({}, user, stripe), { trialAvailable: false });
  assert.equal(await checkoutGivesTrial(stripe), false);
});

test("Pro had under another sign-in with the same email: no trial", async () => {
  noCustomer();
  const stripe = fakeStripe({ others: [{ id: "cus_google", subs: [proSub("canceled")] }] });
  assert.deepEqual(await proTrialStatus({}, user, stripe), { trialAvailable: false });
});

test("a recorded Pro purchase counts as having had Pro", async () => {
  withCustomer();
  table.set(key("USER#u1", "PURCHASE#all-access"), { PK: "USER#u1", SK: "PURCHASE#all-access", plan: "all-access" });
  assert.deepEqual(await proTrialStatus({}, user, fakeStripe()), { trialAvailable: false });
});

test("lookup failure: unknown (null), and checkout gives no trial either", async () => {
  withCustomer();
  const stripe = fakeStripe({ fail: true });
  assert.deepEqual(await proTrialStatus({}, user, stripe), { trialAvailable: null });
  assert.equal(await checkoutGivesTrial(stripe), false);
});

test("signed out: refused", async () => {
  await assert.rejects(() => proTrialStatus({}, null, fakeStripe()), (e) => e.status === "UNAUTHENTICATED");
});
