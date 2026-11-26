// Stripe sends a buyer (checkout) or member (billing portal) back to the name they opened,
// when that name is listed in ALLOWED_ORIGINS; anything else goes back to the old hub.
// Each name has its own sign-in, so coming back on the other name would look signed out.
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

// Every user already has a Stripe customer; nothing else is stored
const lib = req("@aws-sdk/lib-dynamodb");
lib.DynamoDBDocumentClient.prototype.send = async (cmd) =>
  cmd instanceof lib.GetCommand ? { Item: { stripeCustomerId: "cus_me" } } : cmd instanceof lib.QueryCommand ? { Items: [] } : {};

const { createCheckoutSession, createPortalSession } = require(callables)._test;
const OLD_HUB = "https://aws-study-flashcards-app.com";
const user = { uid: "user-1", email: "person@example.invalid" };

function fakeStripe() {
  const calls = { checkout: [], portal: [] };
  return {
    calls,
    customers: { retrieve: async (id) => ({ id }), create: async () => ({ id: "cus_me" }), list: async () => ({ data: [{ id: "cus_me" }] }) },
    subscriptions: { list: async () => ({ data: [] }) },
    checkout: { sessions: { create: async (p) => { calls.checkout.push(p); return { id: "cs_1", url: "https://checkout.stripe.example.invalid/1" }; } } },
    billingPortal: { sessions: { create: async (p) => { calls.portal.push(p); return { url: "https://billing.stripe.example.invalid/1" }; } } },
  };
}

const CASES = [
  // [page sent, where Stripe returns]
  ["https://levelupstudyhub.com", "https://levelupstudyhub.com"],
  ["https://cloud.levelupstudyhub.com", "https://cloud.levelupstudyhub.com"],
  ["https://aws-study-flashcards-app.com", OLD_HUB],
  ["https://bash.aws-study-flashcards-app.com", "https://bash.aws-study-flashcards-app.com"],
  // Tech Spanish, under both names
  ["https://spanish.aws-study-flashcards-app.com", "https://spanish.aws-study-flashcards-app.com"],
  ["https://spanish.levelupstudyhub.com", "https://spanish.levelupstudyhub.com"],
  [undefined, OLD_HUB], // clients that send nothing keep today's behaviour
  ["https://levelupstudyhub.com.evil.example", OLD_HUB],
  ["https://levelupstudyhub.com@evil.example", OLD_HUB],
  ["https://evil.example", OLD_HUB],
];

for (const [sent, expected] of CASES) {
  test(`portal returns ${sent} to ${expected}`, async () => {
    const stripe = fakeStripe();
    await createPortalSession(sent === undefined ? null : { returnUrl: sent }, user, stripe);
    assert.equal(stripe.calls.portal[0].return_url, expected);
  });
  test(`checkout returns ${sent} to ${expected}`, async () => {
    const stripe = fakeStripe();
    await createCheckoutSession({ plan: "all-access", ...(sent !== undefined && { returnUrl: sent }) }, user, stripe);
    assert.equal(stripe.calls.checkout[0].success_url, `${expected}/?checkout=success`);
    assert.equal(stripe.calls.checkout[0].cancel_url, `${expected}/?checkout=cancelled`);
  });
}
