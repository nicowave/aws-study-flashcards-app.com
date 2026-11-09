// Follow-up emails to everyone who took the "Am I ready?" check, sent by
// EventBridge rules in study-hub-stack.ts (9:00 Eastern):
//   day3      Wed Nov 4  check-in: today's step of their 7-day plan
//   48-hours  Thu Nov 5  the Halloween deal ends tomorrow at midnight
//   last-day  Fri Nov 6  last day of the deal
//
// Skips unsubscribed leads, leads that signed up in the last 24 hours (they
// just got their plan email), and, for the sale emails, people who already
// own the certification. Each lead gets each campaign once: PROFILE.sent_<id>
// is claimed before sending, so a retried run picks up where it stopped.
//
// Manual run (preview to one lead, ignores the rules above, marks nothing):
//   aws lambda invoke --function-name <LeadEmailsFn> \
//     --payload '{"campaign":"day3","only":"nico@nico-tek.com","preview":true}' \
//     --cli-binary-format raw-in-base64-out /dev/stdout
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const leads = require('./leads');

const { CERTS, SALE, dollars, salePrice, studyPlan, esc, emailShell, footerText, button } = leads;
const TABLE_NAME = process.env.TABLE_NAME;
const API_URL = process.env.API_URL;
const DAY = 24 * 60 * 60 * 1000;
const FEATURES = [
  'Every quiz domain, weighted like the exam',
  'Full-length timed exam simulator with a readiness score',
  'All flashcard decks with a review queue',
  'One-time payment, yours for good',
];

const tracked = (cert, campaign) =>
  `${cert.url}/?utm_source=readiness&utm_medium=email&utm_campaign=${campaign}&utm_content=${cert.id}`;

const eyebrow = (text) =>
  `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d9620f">${esc(text)}</p>`;
const h1 = (text) => `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${esc(text)}</h1>`;
const para = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${html}</p>`;
const callout = (html) =>
  `<p style="margin:16px 0 0;padding:12px 14px;background:#fbe7d6;border-radius:8px;font-size:14px;line-height:1.5;color:#8a3d06">${html}</p>`;
const signoff = `<p style="margin:20px 0 0;font-size:15px;line-height:1.5">Stuck on something? Reply and ask. I read every one.<br><br>Nico<br><span style="color:#5d6070">AWS Study Hub</span></p>`;
const priceLine = (cert) =>
  `<strong>${salePrice(cert)}</strong> <s style="color:#7d808e">${dollars(cert.cents)}</s>`;

// ---------------------------------------------------------------------------
// The three emails. Each gets { cert, check, now } and returns { subject, text, inner }.
// ---------------------------------------------------------------------------
const CAMPAIGNS = {
  day3: {
    sale: false,
    build({ cert, check, now }) {
      const plan = studyPlan(cert, check.domains);
      const day = Math.floor((now - Date.parse(check.at)) / DAY) + 1;
      const done = day > plan.length;
      const step = done ? plan[plan.length - 1] : plan[day - 1];
      const label = done ? 'Your 7 days are up' : `Day ${day} of 7`;
      const subject = done ? `Ready for the ${cert.short} practice exam?` : `Day ${day} of your ${cert.short} plan`;
      const url = tracked(cert, 'day3');
      const sale = SALE.end > now
        ? `Halloween deal: the full ${cert.short} game is ${salePrice(cert)} instead of ${dollars(cert.cents)} until Friday at midnight Eastern.`
        : '';

      const text = `${label}

A quick check-in on the study plan from your readiness check. You scored ${check.score}/${check.total}.

${done ? 'Time to see where you stand' : "Today's step"}: ${step}

Continue: ${url}

One tip that works: answer each flashcard out loud before you flip it. Pulling the answer from memory sticks far better than rereading.
${sale ? `\n${sale}\n` : ''}
Stuck on something? Reply and ask. I read every one.

Nico
AWS Study Hub

${footerText('UNSUBSCRIBE_URL')}`;

      const inner = `${eyebrow(cert.name)}${h1(label)}
${para(`A quick check-in on the study plan from your readiness check. You scored <strong>${check.score}/${check.total}</strong>.`)}
<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#2f5bd3">${done ? 'Time to see where you stand' : "Today's step"}</p>
<p style="margin:0;font-size:17px;line-height:1.45;font-weight:600">${esc(step)}</p>
${button(url, done ? 'Take the practice exam' : `Continue day ${day}`)}
${para('<strong>One tip that works:</strong> answer each flashcard out loud before you flip it. Pulling the answer from memory sticks far better than rereading.')}
${sale ? callout(`<strong>Halloween deal:</strong> the full ${esc(cert.short)} game is ${priceLine(cert)} until Friday at midnight Eastern.`) : ''}
${signoff}`;
      return { subject, text, inner };
    },
  },

  '48-hours': {
    sale: true,
    build({ cert, check }) {
      const url = tracked(cert, 'sale-48-hours');
      const subject = `Under 48 hours left: ${cert.short} for ${salePrice(cert)}`;
      const text = `The Halloween deal ends tomorrow (Friday) at midnight Eastern.

Until then the full ${cert.name} game is ${salePrice(cert)} instead of ${dollars(cert.cents)}:
${FEATURES.map((f) => `- ${f}`).join('\n')}

Your readiness check said ${check.score}/${check.total}. The timed exam simulator is the quickest way to find out if you're ready for the real thing.

Unlock it: ${url}
The discount is applied at checkout, no code needed. Already unlocked it? Thank you, and ignore this one.

Nico
AWS Study Hub

${footerText('UNSUBSCRIBE_URL')}`;

      const inner = `${eyebrow('Halloween deal · ends Friday at midnight Eastern')}${h1(`${cert.short}, 31% off for under 48 hours`)}
<p style="margin:0 0 16px;font-size:30px;line-height:1">${priceLine(cert)}</p>
${para(`The full ${esc(cert.name)} game:`)}
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6">${FEATURES.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
${para(`Your readiness check said <strong>${check.score}/${check.total}</strong>. The timed exam simulator is the quickest way to find out if you're ready for the real thing.`)}
${button(url, `Unlock for ${salePrice(cert)}`)}
<p style="margin:0;font-size:13px;line-height:1.5;color:#5d6070">The discount is applied at checkout, no code needed. Already unlocked it? Thank you, and ignore this one.</p>
${signoff}`;
      return { subject, text, inner };
    },
  },

  'last-day': {
    sale: true,
    build({ cert }) {
      const url = tracked(cert, 'sale-last-day');
      const subject = `Last day: 31% off ${cert.short} ends at midnight`;
      const text = `Today is the last day of the Halloween deal.

The full ${cert.name} game is ${salePrice(cert)} until midnight Eastern tonight. Then it goes back to ${dollars(cert.cents)}.

Unlock it: ${url}

This is the last sale email. After today it's study tips only.

Nico
AWS Study Hub

${footerText('UNSUBSCRIBE_URL')}`;

      const inner = `${eyebrow('Halloween deal · last day')}${h1('31% off ends at midnight tonight')}
${para(`The full ${esc(cert.name)} game is ${priceLine(cert)} until midnight Eastern. Then it goes back to ${dollars(cert.cents)}.`)}
${button(url, `Unlock for ${salePrice(cert)}`)}
${para('<span style="color:#5d6070">This is the last sale email. After today it\'s study tips only.</span>')}
${signoff}`;
      return { subject, text, inner };
    },
  },
};

// ---------------------------------------------------------------------------

function render(campaignId, lead, check, now) {
  const cert = { ...CERTS[check.certId], id: check.certId };
  const { subject, text, inner } = CAMPAIGNS[campaignId].build({ cert, check, now });
  const { unsubscribeUrl, oneClick } = leads.unsubscribeLinks(lead.email, lead.token, API_URL);
  return {
    subject,
    text: text.replace('UNSUBSCRIBE_URL', unsubscribeUrl),
    html: emailShell(inner, unsubscribeUrl),
    oneClick,
  };
}

async function latestCheck(ddb, email) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :c)',
      ExpressionAttributeValues: { ':pk': `LEAD#${email}`, ':c': 'CHECK#' },
      ScanIndexForward: false,
      Limit: 1,
    })
  );
  const item = res.Items?.[0];
  return item && CERTS[item.certId] ? { ...item, at: item.SK.slice('CHECK#'.length) } : null;
}

// Only people who signed in with this email can be matched to a purchase
async function ownsCert(ddb, email, certId) {
  const link = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `EMAIL#${email}`, SK: 'UID' } }));
  if (!link.Item?.uid) return false;
  const ent = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${link.Item.uid}`, SK: 'ENTITLEMENTS' } }));
  return !!ent.Item && (!!ent.Item.allAccess || (ent.Item.certs || []).includes(certId));
}

async function* subscribedLeads(ddb, only) {
  if (only) {
    const res = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `LEAD#${only.toLowerCase()}`, SK: 'PROFILE' } }));
    if (res.Item) yield res.Item;
    return;
  }
  let ExclusiveStartKey;
  do {
    const page = await ddb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :p) AND SK = :s AND unsubscribed = :f',
        ExpressionAttributeValues: { ':p': 'LEAD#', ':s': 'PROFILE', ':f': false },
        ExclusiveStartKey,
      })
    );
    for (const item of page.Items || []) yield item;
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
}

// Claim the send so a retried run never sends twice
async function claim(ddb, email, field, now) {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `LEAD#${email}`, SK: 'PROFILE' },
        UpdateExpression: 'SET #sent = :now',
        ConditionExpression: 'attribute_not_exists(#sent) AND unsubscribed = :f',
        ExpressionAttributeNames: { '#sent': field },
        ExpressionAttributeValues: { ':now': new Date(now).toISOString(), ':f': false },
      })
    );
    return true;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false;
    throw err;
  }
}

const release = (ddb, email, field) =>
  ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `LEAD#${email}`, SK: 'PROFILE' },
      UpdateExpression: 'REMOVE #sent',
      ExpressionAttributeNames: { '#sent': field },
    })
  );

async function run(ddb, { campaign: campaignId, only, preview = false }, now = Date.now()) {
  const campaign = CAMPAIGNS[campaignId];
  if (!campaign) throw new Error(`Unknown campaign: ${campaignId}`);
  if (preview && !only) throw new Error('A preview needs "only" (one email address)');
  if (campaign.sale && !preview && !(now >= SALE.start && now < SALE.end)) {
    console.log('[campaigns] Sale is not running; nothing sent', campaignId);
    return { campaign: campaignId, sent: 0, skipped: {} };
  }

  const field = `sent_${campaignId.replace(/-/g, '_')}`;
  const skipped = {};
  const skip = (why) => (skipped[why] = (skipped[why] || 0) + 1);
  let sent = 0;

  for await (const lead of subscribedLeads(ddb, only)) {
    if (!preview) {
      if (lead.unsubscribed !== false) { skip('unsubscribed'); continue; }
      if (lead[field]) { skip('already sent'); continue; }
      if (now - Date.parse(lead.createdAt) < DAY) { skip('signed up today'); continue; }
    }
    const check = await latestCheck(ddb, lead.email);
    if (!check) { skip('no check'); continue; }
    if (campaign.sale && !preview && (await ownsCert(ddb, lead.email, check.certId))) { skip('already owns it'); continue; }
    if (!preview && !(await claim(ddb, lead.email, field, now))) { skip('already sent'); continue; }

    const email = render(campaignId, lead, check, now);
    try {
      await leads.sendEmail({ to: lead.email, ...email });
      sent += 1;
    } catch (err) {
      console.error('[campaigns] Send failed', campaignId, err.name, err.message);
      skip('send failed');
      if (!preview) await release(ddb, lead.email, field).catch(() => {});
    }
  }
  console.log('[campaigns] Done', campaignId, JSON.stringify({ sent, skipped, preview }));
  return { campaign: campaignId, sent, skipped };
}

let ddbClient;
exports.handler = async (event) => {
  ddbClient ||= DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return run(ddbClient, event || {});
};
exports.run = run;
exports.render = render;
exports.CAMPAIGNS = CAMPAIGNS;
