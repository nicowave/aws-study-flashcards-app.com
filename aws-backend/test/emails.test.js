// The emails (study plan, welcome, weekly newsletter) link to levelupstudyhub.com, and the
// newsletter adds its tracking tags to links on either of our names and on nothing else.
//
//   cd aws-backend && npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

// leads.js and newsletter.js use the AWS SDK that Lambda provides, which isn't installed here.
// Stand-ins: every command keeps its input, and the SES client records what it was asked to send.
const sent = [];
const classes = {};
const fakeSdk = new Proxy(
  {},
  {
    get: (_, name) =>
      (classes[name] ||= class {
        constructor(input) {
          this.input = input;
        }
        async send(cmd) {
          if (name === "SESv2Client") sent.push(cmd.input);
          return {};
        }
      }),
  }
);
const realLoad = Module._load;
Module._load = function load(request, ...rest) {
  return request.startsWith("@aws-sdk/") ? fakeSdk : realLoad.call(this, request, ...rest);
};
const leads = require("../lambda/api/leads");
const newsletter = require("../lambda/api/newsletter");
Module._load = realLoad;

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
  sent.length = 0;
  // A table that accepts the new profile and returns it when the send is counted
  const ddb = { send: async (cmd) => (cmd.input.ReturnValues === "ALL_NEW" ? { Attributes: { token: "tok123" } } : {}) };
  const event = { requestContext: { domainName: "api.example.invalid" } };
  const res = await leads.subscribe(ddb, "test-table", { email: "A+B@example.com" }, event);
  assert.deepEqual(res, { status: 200, body: { ok: true } });
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
