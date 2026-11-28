// The billing portal only opens for an account with a Stripe customer. Pro given by hand (no
// checkout, so no customer) has nothing to manage: the sites ask billingStatus first and show a
// plain line instead of a button that can only fail, and the portal call says why in words.
// Every refusal is logged, so the next one is visible in CloudWatch (2026-11-28: a click that got
// "No billing account yet" back left no line at all).
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
process.env.STRIPE_PRICE_ALL_ACCESS = "price_pro";
process.env.SECRET_ID = "test-secret";

// A pretend table: tests put in only the records they need
const lib = req("@aws-sdk/lib-dynamodb");
let table = new Map();
const key = (pk, sk) => `${pk}|${sk}`;
lib.DynamoDBDocumentClient.prototype.send = async function send(cmd) {
  const input = cmd.input;
  if (cmd instanceof lib.GetCommand) return { Item: table.get(key(input.Key.PK, input.Key.SK)) };
  throw new Error(`unexpected command ${cmd.constructor.name}`);
};
const user = { uid: "u1", email: "person@example.test" };
const granted = () => { // Pro written by hand: ENTITLEMENTS only, no BILLING
  table = new Map([[key("USER#u1", "ENTITLEMENTS"), { PK: "USER#u1", SK: "ENTITLEMENTS", allAccess: true, certs: [], active: [] }]]);
};
const paying = () => {
  table = new Map([[key("USER#u1", "BILLING"), { PK: "USER#u1", SK: "BILLING", stripeCustomerId: "cus_me" }]]);
};

// For the handler: the Stripe secret and the sign-in check, without AWS or Cognito
const { SecretsManagerClient } = req("@aws-sdk/client-secrets-manager");
SecretsManagerClient.prototype.send = async () => ({ SecretString: JSON.stringify({ stripeApiKey: "sk_test_fake", stripeWebhookSecret: "whsec_fake" }) });
const { CognitoJwtVerifier } = req("aws-jwt-verify");
CognitoJwtVerifier.prototype.verify = async (token) => {
  if (token !== "good-token") throw new Error("bad token");
  return { sub: "u1", uid: "u1", email: user.email };
};

const index = require(callables);
const { createPortalSession, billingStatus } = index._test;

function fakeStripe({ missingCustomer = false } = {}) {
  const portal = [];
  return {
    portal,
    billingPortal: {
      sessions: {
        create: async (p) => {
          if (missingCustomer) throw Object.assign(new Error(`No such customer: '${p.customer}'`), { code: "resource_missing", param: "customer" });
          portal.push(p);
          return { url: "https://billing.stripe.example.invalid/1" };
        },
      },
    },
  };
}

const callEvent = (name, { token = "good-token", data = {} } = {}) => ({
  rawPath: `/callable/${name}`,
  pathParameters: { name },
  headers: token ? { authorization: `Bearer ${token}` } : {},
  body: JSON.stringify({ data }),
  isBase64Encoded: false,
});

// Collects console.warn lines for one test
function captureWarnings(t) {
  const lines = [];
  t.mock.method(console, "warn", (...args) => lines.push(args.join(" ")));
  return lines;
}

test("billingStatus: Pro given by hand has no billing account", async () => {
  granted();
  assert.deepEqual(await billingStatus({}, user), { hasBillingAccount: false });
});

test("billingStatus: anyone who reached checkout has one", async () => {
  paying();
  assert.deepEqual(await billingStatus({}, user), { hasBillingAccount: true });
});

test("billingStatus: signed out is refused", async () => {
  await assert.rejects(billingStatus({}, null), { status: "UNAUTHENTICATED" });
});

test("portal without a billing account: refused in plain words, Stripe never called", async () => {
  granted();
  const stripe = fakeStripe();
  await assert.rejects(createPortalSession({}, user, stripe), (err) => {
    assert.equal(err.status, "FAILED_PRECONDITION");
    assert.match(err.message, /no billing to manage/i);
    return true;
  });
  assert.equal(stripe.portal.length, 0);
});

test("portal for a paying member opens on their customer", async () => {
  paying();
  const stripe = fakeStripe();
  assert.deepEqual(await createPortalSession({}, user, stripe), { url: "https://billing.stripe.example.invalid/1" });
  assert.equal(stripe.portal[0].customer, "cus_me");
});

test("portal for a customer Stripe no longer has (test mode, deleted): the same plain refusal", async () => {
  paying();
  await assert.rejects(createPortalSession({}, user, fakeStripe({ missingCustomer: true })), (err) => {
    assert.equal(err.status, "FAILED_PRECONDITION");
    assert.match(err.message, /no billing to manage/i);
    return true;
  });
});

test("handler: a refused portal call answers 400 with the reason and logs it", async (t) => {
  granted();
  const warnings = captureWarnings(t);
  const res = await index.handler(callEvent("createPortalSession"));
  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.error.status, "FAILED_PRECONDITION");
  assert.match(body.error.message, /no billing to manage/i);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /\[createPortalSession\] FAILED_PRECONDITION uid=u1/);
});

test("handler: a bad sign-in answers 401 and is logged too", async (t) => {
  const warnings = captureWarnings(t);
  const res = await index.handler(callEvent("createPortalSession", { token: "expired" }));
  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(res.body).error.status, "UNAUTHENTICATED");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /\[createPortalSession\] UNAUTHENTICATED uid=none/);
});

test("handler: billingStatus is routed and answers 200", async (t) => {
  granted();
  captureWarnings(t);
  const res = await index.handler(callEvent("billingStatus"));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { result: { hasBillingAccount: false } });
});
