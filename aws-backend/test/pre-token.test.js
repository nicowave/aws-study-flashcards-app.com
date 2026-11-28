// The pre-token Lambda turns ENTITLEMENTS into the plan/certs claims every site reads. Pro unlocks
// every product, so a Pro member's certs claim lists all nine (course sites read certs).
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { lib } = require("./helpers/sdk");

process.env.TABLE_NAME = "test-table";

let table = new Map();
const key = (pk, sk) => `${pk}|${sk}`;
lib.DynamoDBDocumentClient.prototype.send = async function send(cmd) {
  const input = cmd.input;
  if (cmd instanceof lib.GetCommand) return { Item: table.get(key(input.Key.PK, input.Key.SK)) };
  if (cmd instanceof lib.PutCommand) { table.set(key(input.Item.PK, input.Item.SK), input.Item); return {}; }
  throw new Error(`unexpected command ${cmd.constructor.name}`);
};

const preToken = require("../lambda/pre-token/index.js");
const { PRO_COVERS, PRODUCTS } = require("../lambda/callables/coverage");

const signIn = async (entitlements) => {
  table = new Map();
  if (entitlements) table.set(key("USER#sub-1", "ENTITLEMENTS"), { PK: "USER#sub-1", SK: "ENTITLEMENTS", ...entitlements });
  const event = await preToken.handler({ userName: "person", request: { userAttributes: { sub: "sub-1" } } });
  return event.response.claimsOverrideDetails.claimsToAddOrOverride;
};

test("its copy of the product list equals PRO_COVERS minus all-access (it can't require coverage.js)", () => {
  const { ALL_PRODUCTS } = preToken._test;
  assert.deepEqual([...ALL_PRODUCTS].sort(), [...PRO_COVERS].filter((p) => p !== "all-access").sort());
  assert.deepEqual([...ALL_PRODUCTS].sort(), [...PRODUCTS].sort());
});

test("Pro: plan pro, and certs lists all nine products once each", async () => {
  const claims = await signIn({ allAccess: true, certs: ["cloud-practitioner"] });
  assert.equal(claims.plan, "pro");
  const certs = claims.certs.split(",");
  assert.equal(certs.length, 9);
  assert.deepEqual([...certs].sort(), [...PRODUCTS].sort());
  assert.equal(claims.uid, "sub-1");
});

test("no Pro: certs is what was owned one by one, no plan claim", async () => {
  const claims = await signIn({ allAccess: false, certs: ["python-for-aws", "tech-spanish"] });
  assert.equal(claims.plan, undefined);
  assert.equal(claims.certs, "python-for-aws,tech-spanish");
});

test("nothing owned: no paid claims", async () => {
  const claims = await signIn(null);
  assert.deepEqual(claims, { uid: "sub-1" });
});
