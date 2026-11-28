// Stripe webhook events -> ENTITLEMENTS. Subscriptions (any product, monthly or yearly) give access
// while they run; one-time purchases recorded before the switch to subscriptions stay for good.
// Runs the real handler and sync against a fake Stripe and an in-memory table.
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
process.env.STRIPE_PRICE_ALL_ACCESS_YEARLY = "price_pro_year";
process.env.STRIPE_PRICE_CLOUD_PRACTITIONER_MONTHLY = "price_clf_month";
process.env.STRIPE_PRICE_CLOUD_PRACTITIONER_YEARLY = "price_clf_year";
process.env.STRIPE_PRICE_PYTHON_COURSE_YEARLY = "price_py_year";

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

const { handleStripeEvent } = require(callables)._test;

const PERIOD_END = 1798761600; // 2027-01-01T00:00:00Z
function fakeStripe(subs = []) {
  const lists = [];
  return {
    lists,
    subscriptions: {
      list: async (params) => {
        lists.push(params);
        return { data: subs };
      },
    },
  };
}
// Stripe API 2025-08-27.basil: the period end lives on the item, not the subscription
const sub = ({ status = "active", price, plan, interval, uid = "u1", cancelAtPeriodEnd = false }) => ({
  id: `sub_${price}_${status}`,
  object: "subscription",
  customer: "cus_me",
  status,
  cancel_at_period_end: cancelAtPeriodEnd,
  metadata: { ...(uid && { firebaseUID: uid }), ...(plan && { plan }), ...(interval && { interval }) },
  items: { data: [{ id: `si_${price}`, current_period_end: PERIOD_END, price: { id: price, recurring: { interval } } }] },
});
const entitlements = () => table.get(key("USER#u1", "ENTITLEMENTS"));
const event = (type, object) => ({ type, data: { object } });
const fresh = () => {
  table = new Map();
};

test("checkout.session.completed for a monthly product subscription: the product is unlocked", async () => {
  fresh();
  const stripe = fakeStripe([sub({ price: "price_clf_month", plan: "cloud-practitioner", interval: "month" })]);
  await handleStripeEvent(
    stripe,
    event("checkout.session.completed", { id: "cs_1", mode: "subscription", customer: "cus_me", metadata: { firebaseUID: "u1", plan: "cloud-practitioner", interval: "month" } })
  );
  const ent = entitlements();
  assert.equal(ent.allAccess, false);
  assert.deepEqual(ent.certs, ["cloud-practitioner"]);
  assert.deepEqual(ent.active, [
    {
      plan: "cloud-practitioner",
      status: "active",
      interval: "month",
      priceId: "price_clf_month",
      stripeSubscriptionId: "sub_price_clf_month_active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: "2027-01-01T00:00:00.000Z",
    },
  ]);
  assert.equal(stripe.lists[0].limit, 100, "nine products can mean many old subscriptions");
});

test("a legacy one-time (payment) session still records the purchase for good", async () => {
  fresh();
  const stripe = fakeStripe();
  await handleStripeEvent(
    stripe,
    event("checkout.session.completed", {
      id: "cs_old",
      mode: "payment",
      payment_status: "paid",
      customer: "cus_me",
      amount_total: 999,
      metadata: { firebaseUID: "u1", plan: "ai-practitioner" },
    })
  );
  assert.equal(table.get(key("USER#u1", "PURCHASE#ai-practitioner")).sessionId, "cs_old");
  assert.deepEqual(entitlements().certs, ["ai-practitioner"]);
});

test("an unpaid payment session records nothing", async () => {
  fresh();
  await handleStripeEvent(
    fakeStripe(),
    event("checkout.session.completed", { id: "cs_x", mode: "payment", payment_status: "unpaid", customer: "cus_me", metadata: { firebaseUID: "u1", plan: "ai-practitioner" } })
  );
  assert.equal(table.size, 0);
});

test("customer.subscription.created syncs (subscriptions made outside Checkout)", async () => {
  fresh();
  const created = sub({ price: "price_pro_year", plan: "all-access", interval: "year", status: "trialing" });
  await handleStripeEvent(fakeStripe([created]), event("customer.subscription.created", created));
  assert.equal(entitlements().allAccess, true);
  assert.equal(entitlements().active[0].interval, "year");
});

test("customer.subscription.updated with no uid in metadata finds it through STRIPE#<customer>", async () => {
  fresh();
  table.set(key("STRIPE#cus_me", "UID"), { PK: "STRIPE#cus_me", SK: "UID", uid: "u1" });
  const s = sub({ price: "price_py_year", uid: null, interval: "year" }); // plan from the price table
  await handleStripeEvent(fakeStripe([s]), event("customer.subscription.updated", s));
  assert.deepEqual(entitlements().certs, ["python-for-aws"]);
});

test("a subscription that ends (canceled or unpaid) drops the product; one-time purchases stay", async () => {
  for (const status of ["canceled", "unpaid", "incomplete_expired"]) {
    fresh();
    table.set(key("USER#u1", "PURCHASE#developer-path"), { PK: "USER#u1", SK: "PURCHASE#developer-path", plan: "developer-path" });
    const ended = sub({ price: "price_clf_month", plan: "cloud-practitioner", interval: "month", status });
    await handleStripeEvent(fakeStripe([ended]), event("customer.subscription.deleted", ended));
    const ent = entitlements();
    assert.equal(ent.certs.includes("cloud-practitioner"), false, status);
    assert.deepEqual(ent.active, [], status);
    assert.deepEqual(
      ent.certs.sort(),
      ["bash-for-aws", "developer-associate", "javascript-for-aws", "python-for-aws", "typescript-for-aws"],
      "the bundle bought once stays"
    );
  }
});

test("past_due still gives access, and cancel-at-period-end is recorded", async () => {
  fresh();
  const late = sub({ price: "price_clf_year", plan: "cloud-practitioner", interval: "year", status: "past_due", cancelAtPeriodEnd: true });
  await handleStripeEvent(fakeStripe([late]), event("customer.subscription.updated", late));
  assert.deepEqual(entitlements().certs, ["cloud-practitioner"]);
  assert.equal(entitlements().active[0].cancelAtPeriodEnd, true);
});

test("Pro keeps certs to what was owned one by one (the pre-token Lambda expands Pro)", async () => {
  fresh();
  table.set(key("USER#u1", "PURCHASE#cloud-practitioner"), { PK: "USER#u1", SK: "PURCHASE#cloud-practitioner", plan: "cloud-practitioner" });
  const pro = sub({ price: "price_pro_year", plan: "all-access", interval: "year" });
  await handleStripeEvent(fakeStripe([pro]), event("customer.subscription.updated", pro));
  assert.equal(entitlements().allAccess, true);
  assert.deepEqual(entitlements().certs, ["cloud-practitioner"]);
});

test("older subscriptions without an item period still read the subscription's own field", async () => {
  fresh();
  const old = sub({ price: "price_clf_month", plan: "cloud-practitioner", interval: "month" });
  delete old.items.data[0].current_period_end;
  old.current_period_end = PERIOD_END;
  await handleStripeEvent(fakeStripe([old]), event("customer.subscription.updated", old));
  assert.equal(entitlements().active[0].currentPeriodEnd, "2027-01-01T00:00:00.000Z");
});

test("a portal switch to another product's price grants the new product, not the stale metadata plan", async () => {
  fresh();
  // The portal changed the price to Python yearly; metadata still says cloud-practitioner
  const switched = sub({ price: "price_py_year", plan: "cloud-practitioner", interval: "year" });
  await handleStripeEvent(fakeStripe([switched]), event("customer.subscription.updated", switched));
  assert.deepEqual(entitlements().certs, ["python-for-aws"]);
  assert.equal(entitlements().active[0].plan, "python-for-aws");
});
