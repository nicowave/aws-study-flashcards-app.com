// The emails (study plan, welcome, weekly newsletter, sale campaigns) link to levelupstudyhub.com,
// the newsletter adds its tracking tags to links on either of our names and on nothing else, and
// emails that sell describe subscriptions: prices from the one PRICES constant in leads.js, renewal
// and the Terms, and no one-time wording.
//
//   cd aws-backend/lambda/callables && npm ci     (once, for the AWS SDK)
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
// Stubs SES (and S3), recording what each client was asked to send
const { sent: sdkSent } = require("./helpers/sdk");

const leads = require("../lambda/api/leads.js");
const campaigns = require("../lambda/api/campaigns.js");
const newsletter = require("../lambda/api/newsletter.js");
/** Every email the SES stub was asked to send, as SendEmail inputs. */
const sesInputs = () => sdkSent.filter((c) => c.client === "ses").map((c) => c.input);

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

// ---------------------------------------------------------------------------
// Links: levelupstudyhub.com is the public name
// ---------------------------------------------------------------------------

const HUB = "https://levelupstudyhub.com";
const OLD_NAME = "aws-study-flashcards-app.com";
const UNSUBSCRIBE = `${HUB}/?unsubscribe=a%2Bb%40example.com&t=tok123`;
const DOMAINS = [
  { name: "Cloud Concepts", correct: 1, total: 3 },
  { name: "Security", correct: 3, total: 3 },
];
const planEmail = (certId) =>
  leads.buildEmail({ cert: leads.CERTS[certId], certId, score: 4, total: 6, domains: DOMAINS, unsubscribeUrl: UNSUBSCRIBE });
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

test("the hub and every certification site are on levelupstudyhub.com", () => {
  assert.equal(leads.HUB, HUB);
  assert.deepEqual(
    Object.fromEntries(Object.entries(leads.CERTS).map(([id, c]) => [id, c.url])),
    {
      "cloud-practitioner": "https://cloud.levelupstudyhub.com",
      "ai-practitioner": "https://ai.levelupstudyhub.com",
      "solutions-architect-associate": "https://architect.levelupstudyhub.com",
      "developer-associate": "https://developer.levelupstudyhub.com",
    }
  );
});

test("unsubscribe links: the hub on the new name, same shape as before; one-click stays on the API", () => {
  const links = leads.unsubscribeLinks("a+b@example.com", "tok123", "https://api.example.invalid");
  assert.equal(links.unsubscribeUrl, UNSUBSCRIBE);
  const u = new URL(links.unsubscribeUrl);
  assert.equal(u.origin, HUB);
  assert.equal(u.pathname, "/");
  assert.deepEqual([...u.searchParams], [["unsubscribe", "a+b@example.com"], ["t", "tok123"]]);
  assert.equal(links.oneClick, "https://api.example.invalid/v1/leads/unsubscribe?email=a%2Bb%40example.com&token=tok123");
});

for (const [certId, site] of [
  ["cloud-practitioner", "cloud"],
  ["ai-practitioner", "ai"],
  ["solutions-architect-associate", "architect"],
  ["developer-associate", "developer"],
]) {
  test(`study plan email for ${certId} sends people to ${site}.levelupstudyhub.com`, () => {
    const { text, html } = planEmail(certId);
    const start = `https://${site}.levelupstudyhub.com/?utm_source=readiness&utm_medium=email&utm_campaign=study-plan&utm_content=${certId}`;
    assert.ok(text.includes(`Start day 1: ${start}\n`));
    assert.deepEqual(hrefs(html), [start, UNSUBSCRIBE]);
    assert.ok(text.includes(`Unsubscribe: ${UNSUBSCRIBE}\n`));
    assert.ok(!text.includes(OLD_NAME) && !html.includes(OLD_NAME), "no link or text on the old name");
  });
}

test("welcome email links to the readiness check on the new hub", () => {
  const { text, html } = leads.buildWelcomeEmail(UNSUBSCRIBE);
  const check = `${HUB}/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome#readiness`;
  assert.ok(text.includes(`study first: ${check}\n`));
  assert.deepEqual(hrefs(html), [check, UNSUBSCRIBE]);
  assert.ok(!text.includes(OLD_NAME) && !html.includes(OLD_NAME));
});

// Subscribers from before the move signed up on the old address, so the footer names the product first
test("the footer says why they get the email and gives the public address", () => {
  const note = "because you signed up or took the readiness check on Level Up Study Hub (levelupstudyhub.com).";
  assert.ok(leads.footerText(UNSUBSCRIBE).includes(note));
  assert.ok(leads.emailShell("<p>Hi</p>", UNSUBSCRIBE).includes(note));
});

test("signing up for the newsletter: sent from the same address, with both unsubscribe links", async () => {
  sdkSent.length = 0;
  // A table that accepts the new profile and returns it when the send is counted
  const ddb = { send: async (cmd) => (cmd.input.ReturnValues === "ALL_NEW" ? { Attributes: { token: "tok123" } } : {}) };
  const event = { requestContext: { domainName: "api.example.invalid" } };
  const res = await leads.subscribe(ddb, "test-table", { email: "A+B@example.com" }, event);
  assert.deepEqual(res, { status: 200, body: { ok: true } });
  const sent = sesInputs();
  assert.equal(sent.length, 1);
  const mail = sent[0];
  assert.equal(mail.FromEmailAddress, "Nico at Level Up Study Hub <nico@nico-tek.com>");
  assert.deepEqual(mail.ReplyToAddresses, ["nico@nico-tek.com"]);
  assert.deepEqual(mail.Destination.ToAddresses, ["a+b@example.com"]);
  assert.ok(mail.Content.Simple.Body.Text.Data.includes(`Unsubscribe: ${UNSUBSCRIBE}\n`));
  assert.ok(hrefs(mail.Content.Simple.Body.Html.Data).includes(UNSUBSCRIBE));
  assert.deepEqual(mail.Content.Simple.Headers, [
    { Name: "List-Unsubscribe", Value: "<https://api.example.invalid/v1/leads/unsubscribe?email=a%2Bb%40example.com&token=tok123>" },
    { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
  ]);
});

const TAGS = "utm_source=newsletter&utm_medium=email&utm_campaign=2026-12-01-traps";
const track = (url) => newsletter.trackLink(url, "2026-12-01-traps");

test("newsletter links to our sites get tracking tags, under both names", () => {
  const ours = [
    ["https://levelupstudyhub.com/#readiness", `https://levelupstudyhub.com/?${TAGS}#readiness`],
    ["https://cloud.levelupstudyhub.com/", `https://cloud.levelupstudyhub.com/?${TAGS}`],
    ["https://bash.levelupstudyhub.com/lesson?step=2", `https://bash.levelupstudyhub.com/lesson?step=2&${TAGS}`],
    ["https://LevelUpStudyHub.com/", `https://levelupstudyhub.com/?${TAGS}`],
    // Issues written before the move
    ["https://aws-study-flashcards-app.com/#readiness", `https://aws-study-flashcards-app.com/?${TAGS}#readiness`],
    ["https://architect.aws-study-flashcards-app.com/", `https://architect.aws-study-flashcards-app.com/?${TAGS}`],
  ];
  for (const [url, expected] of ours) assert.equal(track(url), expected);
});

test("newsletter links to any other host are left alone, lookalikes included", () => {
  const others = [
    "https://levelupstudyhub.com.evil.example/",
    "https://aws-study-flashcards-app.com.evil.example/",
    "https://evil-levelupstudyhub.com/",
    "https://notaws-study-flashcards-app.com/",
    "https://levelupstudyhub.com@evil.example/",
    "https://evil.example/levelupstudyhub.com",
    "https://evil.example/?next=https://levelupstudyhub.com",
    "https://levelupstudyhub.co/",
    "https://docs.aws.amazon.com/lambda/",
    "mailto:nico@levelupstudyhub.com",
    "not a link",
  ];
  for (const url of others) assert.equal(track(url), url);
});

test("a link that already carries its own tags keeps them", () => {
  const url = "https://levelupstudyhub.com/?utm_source=partner";
  assert.equal(track(url), url);
});

test("a rendered issue: our links tagged in HTML and text, others not, footer on the new name", () => {
  const issue = newsletter.parseIssue(
    "2026-12-01-traps",
    [
      "---",
      "subject: Three exam traps",
      "---",
      "# Three exam traps",
      "",
      "Try the [readiness check](https://levelupstudyhub.com/#readiness), an [older link](https://cloud.aws-study-flashcards-app.com/) and the [AWS docs](https://docs.aws.amazon.com/lambda/).",
      "",
      "A [lookalike](https://levelupstudyhub.com.evil.example/) stays as written.",
      "",
      "[button: Open the Architect game](https://architect.levelupstudyhub.com/)",
    ].join("\n")
  );
  const { subject, text, html } = newsletter.renderIssue(issue, UNSUBSCRIBE);
  assert.equal(subject, "Three exam traps");
  assert.deepEqual(hrefs(html), [
    `https://levelupstudyhub.com/?${TAGS}#readiness`,
    `https://cloud.aws-study-flashcards-app.com/?${TAGS}`,
    "https://docs.aws.amazon.com/lambda/",
    "https://levelupstudyhub.com.evil.example/",
    `https://architect.levelupstudyhub.com/?${TAGS}`,
    UNSUBSCRIBE,
  ]);
  assert.ok(text.includes(`readiness check (https://levelupstudyhub.com/?${TAGS}#readiness)`));
  assert.ok(text.includes("lookalike (https://levelupstudyhub.com.evil.example/)"));
  assert.ok(text.includes(`Open the Architect game: https://architect.levelupstudyhub.com/?${TAGS}`));
  assert.ok(text.includes("readiness check on Level Up Study Hub (levelupstudyhub.com)."));
});
