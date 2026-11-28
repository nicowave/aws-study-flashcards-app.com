// Emails that sell (readiness plan during a sale, the sale campaigns) describe subscriptions: prices
// from the one PRICES constant in leads.js, renewal and the Terms, and no one-time wording.
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/sdk"); // stubs SES

const leads = require("../lambda/api/leads.js");
const campaigns = require("../lambda/api/campaigns.js");

const ONE_TIME = /one-time|one time|pay once|yours for good|yours forever|keep it forever|lifetime/i;
const DURING_SALE = Date.parse("2026-11-04T14:00:00Z");
const check = {
  certId: "solutions-architect-associate",
  score: 6,
  total: 10,
  at: "2026-11-01T12:00:00.000Z",
  domains: [
    { name: "Design Secure Architectures", correct: 1, total: 3 },
    { name: "Design Resilient Architectures", correct: 3, total: 3 },
  ],
};
const lead = { email: "person@example.test", token: "t0ken" };

test("prices come from one constant: $11 a month, $69 a year, Pro $199 a year", () => {
  assert.deepEqual(leads.PRICES, { productMonthly: 1100, productYearly: 6900, proYearly: 19900 });
  assert.equal(leads.PRICE_TEXT, "$11/month or $69/year");
  assert.equal(leads.dollars(leads.PRICES.proYearly), "$199");
  assert.equal(leads.salePrice(leads.PRICES.productYearly), "$47.61");
  for (const cert of Object.values(leads.CERTS)) assert.equal(cert.cents, undefined, "no per-cert price copies");
});

for (const id of Object.keys(campaigns.CAMPAIGNS)) {
  test(`campaign ${id}: subscription wording, no one-time wording, no old prices`, () => {
    const email = campaigns.render(id, lead, check, DURING_SALE);
    for (const part of [email.subject, email.text, email.html]) {
      assert.doesNotMatch(part, ONE_TIME);
      assert.doesNotMatch(part, /\$9\.99|\$14\.99|\$6\.89|\$10\.34/);
    }
    if (campaigns.CAMPAIGNS[id].sale || id === "day3") {
      assert.match(email.text, /renew automatically/);
      assert.match(email.text, /terms\.html/);
      assert.match(email.html, /terms\.html/);
      assert.match(email.text, /\$47\.61/);
      assert.match(email.text, /\$69/);
    }
  });
}

test("the sale features list says monthly or yearly", () => {
  const email = campaigns.render("48-hours", lead, check, DURING_SALE);
  assert.match(email.text, /\$11\/month or \$69\/year/);
});

test("readiness email during a sale: renewal note and Terms; outside it, no sale text", () => {
  const args = { cert: leads.CERTS["cloud-practitioner"], certId: "cloud-practitioner", score: 7, total: 10, domains: check.domains, unsubscribeUrl: "https://example.test/u" };
  const realNow = Date.now;
  try {
    Date.now = () => DURING_SALE;
    const during = leads.buildEmail(args);
    assert.match(during.text, /renew automatically/);
    assert.match(during.html, /terms\.html/);
    assert.doesNotMatch(during.text + during.html, ONE_TIME);
    Date.now = () => Date.parse("2026-11-28T12:00:00Z");
    const after = leads.buildEmail(args);
    assert.doesNotMatch(after.text, /Halloween|renew/);
  } finally {
    Date.now = realNow;
  }
});
