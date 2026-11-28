// DELETE /v1/me must not delete an account while one of its subscriptions still bills: Stripe would
// keep charging someone we can no longer give access to. Runs the real API handler against an
// in-memory table and a stubbed Cognito.
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { lib, sent } = require("./helpers/sdk");

process.env.TABLE_NAME = "test-table";
process.env.USER_POOL_ID = "us-east-1_TestPool1";

let table = new Map();
const key = (pk, sk) => `${pk}|${sk}`;
lib.DynamoDBDocumentClient.prototype.send = async function send(cmd) {
  const input = cmd.input;
  if (cmd instanceof lib.QueryCommand) {
    const pk = input.ExpressionAttributeValues[":pk"];
    return { Items: [...table.values()].filter((i) => i.PK === pk) };
  }
  if (cmd instanceof lib.BatchWriteCommand) {
    for (const r of input.RequestItems[process.env.TABLE_NAME]) table.delete(key(r.DeleteRequest.Key.PK, r.DeleteRequest.Key.SK));
    return {};
  }
  if (cmd instanceof lib.DeleteCommand) {
    table.delete(key(input.Key.PK, input.Key.SK));
    return {};
  }
  throw new Error(`unexpected command ${cmd.constructor.name}`);
};

const api = require("../lambda/api/index.js");

const put = (item) => table.set(key(item.PK, item.SK), item);
function account(active) {
  table = new Map();
  sent.length = 0;
  put({ PK: "USER#u1", SK: "PROFILE", email: "person@example.test" });
  put({ PK: "USER#u1", SK: "PURCHASE#cloud-practitioner", plan: "cloud-practitioner" });
  if (active) put({ PK: "USER#u1", SK: "ENTITLEMENTS", allAccess: false, certs: [], active });
}
const deleteMe = () =>
  api.handler({
    routeKey: "DELETE /v1/me",
    requestContext: { authorizer: { jwt: { claims: { uid: "u1", email: "person@example.test", "cognito:username": "person" } } } },
  });
const subscription = (status, extra = {}) => ({ plan: "python-for-aws", status, interval: "month", cancelAtPeriodEnd: false, ...extra });

for (const status of ["active", "trialing", "past_due"]) {
  test(`a ${status} subscription: 409, nothing deleted`, async () => {
    account([subscription(status)]);
    const res = await deleteMe();
    assert.equal(res.statusCode, 409);
    assert.equal(JSON.parse(res.body).error, "Cancel your subscription in Manage billing first");
    assert.equal(table.size, 3, "every item is still there");
    assert.equal(sent.length, 0, "the Cognito user is not deleted");
  });
}

test("a subscription already set to end (cancelled in Manage billing) does not block", async () => {
  account([subscription("active", { cancelAtPeriodEnd: true })]);
  const res = await deleteMe();
  assert.equal(res.statusCode, 200);
  assert.equal(table.size, 0);
});

test("no running subscription (none, or ended ones, or one-time purchases only): deleted", async () => {
  for (const active of [null, [], [subscription("canceled")], [subscription("incomplete")]]) {
    account(active);
    const res = await deleteMe();
    assert.equal(res.statusCode, 200, JSON.stringify(active));
    assert.equal(table.size, 0);
    assert.deepEqual(sent.map((s) => s.command), ["AdminDeleteUserCommand"]);
    assert.equal(sent[0].input.Username, "person");
  }
});
