// The email list. Two ways in:
//   POST /v1/leads              { email, certId, score, total, domains, source, website }
//     the homepage's "Am I ready?" check: we save the score and email it with a
//     7-day study plan
//   POST /v1/newsletter         { email, site, source, website }
//     the weekly newsletter sign-up box (hub and games): sends a welcome email
//   POST /v1/leads/unsubscribe  { email, token }   (also the one-click header)
// Everyone on the list gets the weekly newsletter (newsletter.js) until they
// unsubscribe.
//
// Items (PK = LEAD#<email>): PROFILE (token, first source, unsubscribed,
// daily send count, newsletter sign-up) and CHECK#<iso time> for each check.
const crypto = require('crypto');
const { GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({});
const FROM = 'Nico at AWS Study Hub <nico@nico-tek.com>';
const REPLY_TO = 'nico@nico-tek.com';
const HUB = 'https://aws-study-flashcards-app.com';
const ADDRESS = 'Nico Tek Solutions · 5104 Lawton Dr., Bethesda, MD 20816';
const MAX_EMAILS_PER_DAY = 3; // per address, so the form can't be used to flood someone

// Prices in cents, same as aws-study-homepage/src/data/certifications.js
const CERTS = {
  'cloud-practitioner': { name: 'AWS Certified Cloud Practitioner', short: 'Cloud Practitioner', url: 'https://cloud.aws-study-flashcards-app.com', cents: 999 },
  'ai-practitioner': { name: 'AWS Certified AI Practitioner', short: 'AI Practitioner', url: 'https://ai.aws-study-flashcards-app.com', cents: 999 },
  'solutions-architect-associate': { name: 'AWS Certified Solutions Architect – Associate', short: 'Solutions Architect', url: 'https://architect.aws-study-flashcards-app.com', cents: 1499 },
  'developer-associate': { name: 'AWS Certified Developer – Associate', short: 'Developer Associate', url: 'https://developer.aws-study-flashcards-app.com', cents: 1499 },
};

// Same window as PROMOTIONS in callables/index.js (Oct 31 – Nov 6, Eastern)
const SALE = { start: Date.parse('2026-10-31T04:00:00Z'), end: Date.parse('2026-11-07T05:00:00Z'), percent: 31 };
const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
// Rounded the way Stripe rounds the coupon (and offers.js salePrice)
const salePrice = (cert) => dollars(cert.cents - Math.round((cert.cents * SALE.percent) / 100));
const onSale = (now = Date.now()) => now >= SALE.start && now < SALE.end;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const FOOTER_NOTE = "You're on the AWS Study Hub email list (one study email a week) because you signed up or took the readiness check on aws-study-flashcards-app.com.";

const footerText = (unsubscribeUrl) => `---
${FOOTER_NOTE} Unsubscribe: ${unsubscribeUrl}
${ADDRESS}
AWS Study Hub is independent and not affiliated with Amazon Web Services.`;

// White card on a warm background, with the unsubscribe footer
const emailShell = (inner, unsubscribeUrl) => `<!doctype html><html><body style="margin:0;background:#f6f4f1;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1b1d26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4f1;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td>
${inner}
</td></tr></table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#7d808e">${FOOTER_NOTE} <a href="${esc(unsubscribeUrl)}" style="color:#7d808e">Unsubscribe</a><br>${esc(ADDRESS)}<br>AWS Study Hub is independent and not affiliated with Amazon Web Services.</p>
</td></tr></table></body></html>`;

const button = (href, label) =>
  `<p style="margin:24px 0 8px"><a href="${esc(href)}" style="display:inline-block;background:#2f5bd3;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${esc(label)}</a></p>`;

const unsubscribeLinks = (email, token, apiUrl) => ({
  unsubscribeUrl: `${HUB}/?unsubscribe=${encodeURIComponent(email)}&t=${token}`,
  oneClick: `${apiUrl}/v1/leads/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`,
});

function sendEmail({ to, subject, text, html, oneClick }) {
  return ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      ReplyToAddresses: [REPLY_TO],
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Text: { Data: text, Charset: 'UTF-8' }, Html: { Data: html, Charset: 'UTF-8' } },
          Headers: [
            { Name: 'List-Unsubscribe', Value: `<${oneClick}>` },
            { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
          ],
        },
      },
    })
  );
}

const verdictFor = (pct) => {
  if (pct >= 80) return { title: 'Close to ready', note: 'You know most of this. A full timed practice exam will tell you if you can hold it for 90 minutes.' };
  if (pct >= 60) return { title: 'Getting there', note: 'A solid base with a couple of gaps. One focused week on your weakest areas can make the difference.' };
  return { title: 'Early days', note: 'Plenty to learn, and that is normal at this stage. Follow the plan below one day at a time.' };
};

const tracked = (url, content) =>
  `${url}/?utm_source=readiness&utm_medium=email&utm_campaign=study-plan&utm_content=${content}`;

// Weakest domains first, so the plan starts where the points are
function studyPlan(cert, domains) {
  const byWeakness = [...domains].sort((a, b) => a.correct / a.total - b.correct / b.total);
  const weak1 = byWeakness[0]?.name || 'your weakest exam domain';
  const weak2 = byWeakness[1]?.name || 'your second-weakest domain';
  return [
    `Take the quiz for ${weak1} and read its study guide.`,
    `Go through the flashcards for ${weak1}. Mark the ones you miss and repeat them.`,
    `Quiz and flashcards for ${weak2}.`,
    'Run through the flashcards for every domain, fast. Set aside any card you hesitate on and repeat those.',
    'Quiz yourself on the remaining domains. Aim for 80% or better in each.',
    `Take the full timed practice exam (65 questions) on ${cert.short}.`,
    'Review every question you missed, then decide: book the exam, or repeat days 1–3 on your new weakest area.',
  ];
}

function buildEmail({ cert, certId, score, total, domains, unsubscribeUrl }) {
  const pct = Math.round((score / total) * 100);
  const verdict = verdictFor(pct);
  const plan = studyPlan(cert, domains);
  const studyUrl = tracked(cert.url, certId);
  const saleOn = onSale();
  const subject = `Your ${cert.short} readiness: ${score}/${total}`;

  const domainLines = domains.map((d) => `- ${d.name}: ${d.correct}/${d.total}`).join('\n');
  const planLines = plan.map((p, i) => `Day ${i + 1}: ${p}`).join('\n');
  const saleText = saleOn
    ? '\nHalloween deal: 31% off the full certification game until November 6, already applied at checkout.\n'
    : '';

  const text = `Your ${cert.name} readiness check

Score: ${score}/${total} (${pct}%) – ${verdict.title}
${verdict.note}

By exam area:
${domainLines}

YOUR 7-DAY STUDY PLAN
${planLines}

Start day 1: ${studyUrl}
${saleText}
Reply to this email if you have a question. I read every one.

Nico
AWS Study Hub

${footerText(unsubscribeUrl)}`;

  const bar = (d) => {
    const w = Math.round((d.correct / d.total) * 100);
    return `<tr><td style="padding:6px 0;font-size:14px;color:#1b1d26">${esc(d.name)}</td><td style="padding:6px 0 6px 12px;font-size:14px;color:#5d6070;text-align:right;white-space:nowrap">${d.correct}/${d.total}</td></tr>
<tr><td colspan="2" style="padding:0 0 8px"><div style="background:#e8e4dd;border-radius:4px;height:6px"><div style="background:${w >= 70 ? '#1f8a5b' : w >= 50 ? '#d9620f' : '#c0392b'};width:${Math.max(w, 3)}%;height:6px;border-radius:4px"></div></div></td></tr>`;
  };

  const html = emailShell(`<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d9620f">${esc(cert.name)}</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2">Your readiness check</h1>
<p style="margin:0;font-size:44px;font-weight:800;line-height:1">${score}<span style="font-size:22px;color:#5d6070">/${total}</span></p>
<p style="margin:8px 0 4px;font-size:18px;font-weight:700">${verdict.title}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#5d6070">${verdict.note}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${domains.map(bar).join('')}</table>
<h2 style="margin:24px 0 10px;font-size:18px">Your 7-day study plan</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${plan.map((p, i) => `<tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-size:13px;font-weight:700;color:#2f5bd3;white-space:nowrap">Day ${i + 1}</td><td style="padding:6px 0;font-size:15px;line-height:1.45">${esc(p)}</td></tr>`).join('\n')}
</table>
${button(studyUrl, 'Start day 1')}
${saleOn ? '<p style="margin:16px 0 0;padding:12px 14px;background:#fbe7d6;border-radius:8px;font-size:14px;color:#8a3d06"><strong>Halloween deal:</strong> 31% off the full certification game until November 6, already applied at checkout.</p>' : ''}
<p style="margin:20px 0 0;font-size:15px;line-height:1.5">Reply to this email if you have a question. I read every one.<br><br>Nico<br><span style="color:#5d6070">AWS Study Hub</span></p>
`, unsubscribeUrl);

  return { subject, text, html };
}

const validDomains = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 8) return null;
  const out = [];
  for (const d of raw) {
    const name = clean(d?.name, 80);
    const correct = Number(d?.correct);
    const total = Number(d?.total);
    if (!name || !Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || total > 20 || correct < 0 || correct > total) return null;
    out.push({ name, correct, total });
  }
  return out;
};

const cleanSource = (raw) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    utm_source: clean(src.utm_source, 60) || 'direct',
    utm_medium: clean(src.utm_medium, 60),
    utm_campaign: clean(src.utm_campaign, 60),
    referrer: clean(src.referrer, 200),
  };
};

const newToken = () => crypto.randomBytes(16).toString('hex');

// Count today's emails to this address; returns the profile when one more may
// be sent (not past the cap, not unsubscribed), otherwise null. The first
// email of the day restarts the count, later ones add to it. `set` is saved
// either way it succeeds.
async function claimDailySend(ddb, table, pk, now, set = {}) {
  const names = {};
  const values = { ':today': now.toISOString().slice(0, 10), ':one': 1, ':f': false };
  const sets = Object.entries(set).map(([k, v], i) => {
    names[`#s${i}`] = k;
    values[`:s${i}`] = v;
    return `#s${i} = :s${i}`;
  });
  const extra = sets.length ? `${sets.join(', ')}, ` : '';
  const attempts = [
    {
      UpdateExpression: `SET ${extra}sendDay = :today, sendCount = :one`,
      ConditionExpression: 'unsubscribed = :f AND (attribute_not_exists(sendDay) OR sendDay <> :today)',
      ExpressionAttributeValues: values,
    },
    {
      UpdateExpression: `SET ${extra}sendCount = sendCount + :one`,
      ConditionExpression: 'unsubscribed = :f AND sendDay = :today AND sendCount < :max',
      ExpressionAttributeValues: { ...values, ':max': MAX_EMAILS_PER_DAY },
    },
  ];
  for (const update of attempts) {
    try {
      const res = await ddb.send(
        new UpdateCommand({
          TableName: table,
          Key: { PK: pk, SK: 'PROFILE' },
          ReturnValues: 'ALL_NEW',
          ...(sets.length ? { ExpressionAttributeNames: names } : {}),
          ...update,
        })
      );
      return res.Attributes;
    } catch (err) {
      if (err.name !== 'ConditionalCheckFailedException') throw err;
    }
  }
  return null;
}

async function createLead(ddb, table, body, event) {
  // Bots fill the hidden "website" field; pretend it worked
  if (body.website) return { status: 200, body: { ok: true } };

  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: 400, body: { error: 'Please enter a valid email address.' } };
  const certId = clean(body.certId, 60);
  const cert = CERTS[certId];
  if (!cert) return { status: 400, body: { error: 'Unknown certification' } };
  const score = Number(body.score);
  const total = Number(body.total);
  const domains = validDomains(body.domains);
  if (!Number.isInteger(total) || total < 1 || total > 30 || !Number.isInteger(score) || score < 0 || score > total || !domains) {
    return { status: 400, body: { error: 'Invalid score' } };
  }
  const source = cleanSource(body.source);

  const now = new Date();
  const pk = `LEAD#${email}`;

  // Profile: created once (keeps the first source and the unsubscribe token)
  await ddb
    .send(
      new PutCommand({
        TableName: table,
        Item: { PK: pk, SK: 'PROFILE', email, token: newToken(), createdAt: now.toISOString(), source, unsubscribed: false },
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    )
    .catch((err) => {
      if (err.name !== 'ConditionalCheckFailedException') throw err;
    });

  await ddb.send(
    new PutCommand({
      TableName: table,
      Item: { PK: pk, SK: `CHECK#${now.toISOString()}`, certId, score, total, domains, source, ip: event.requestContext?.http?.sourceIp },
    })
  );

  const profile = await claimDailySend(ddb, table, pk, now, { lastCheckAt: now.toISOString(), lastCertId: certId });
  if (!profile) return { status: 200, body: { ok: true, emailed: false } };

  const { unsubscribeUrl, oneClick } = unsubscribeLinks(email, profile.token, `https://${event.requestContext?.domainName}`);
  const { subject, text, html } = buildEmail({ cert, certId, score, total, domains, unsubscribeUrl });
  await sendEmail({ to: email, subject, text, html, oneClick });
  console.log('[leads] Sent readiness email', certId, `${score}/${total}`, source.utm_source);
  return { status: 200, body: { ok: true, emailed: true } };
}

function buildWelcomeEmail(unsubscribeUrl) {
  const checkUrl = `${HUB}/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome#readiness`;
  const subject = "You're in: one AWS study email a week";
  const text = `You're on the list.

Every Tuesday morning I send one short email to help you pass your AWS certification: an exam trap people fall for, one service explained in plain English, and what's new on AWS Study Hub. That's it.

While you wait for the first one, take the free 10-question readiness check. It shows which exam areas to study first: ${checkUrl}

Reply any time with a question. I read every one.

Nico
AWS Study Hub

${footerText(unsubscribeUrl)}`;
  const html = emailShell(`<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d9620f">AWS Study Hub · Weekly</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">You're on the list</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55">Every Tuesday morning I send one short email to help you pass your AWS certification:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6"><li>an exam trap people fall for</li><li>one service explained in plain English</li><li>what's new on AWS Study Hub</li></ul>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55">While you wait for the first one, take the free 10-question readiness check. It shows which exam areas to study first.</p>
${button(checkUrl, 'Take the readiness check')}
<p style="margin:20px 0 0;font-size:15px;line-height:1.5">Reply any time with a question. I read every one.<br><br>Nico<br><span style="color:#5d6070">AWS Study Hub</span></p>`, unsubscribeUrl);
  return { subject, text, html };
}

// Newsletter sign-up box. New people and people who unsubscribed before get a
// welcome email; anyone already on the list just gets "you're on the list".
async function subscribe(ddb, table, body, event) {
  if (body.website) return { status: 200, body: { ok: true } };
  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: 400, body: { error: 'Please enter a valid email address.' } };
  const site = clean(body.site, 40) || 'hub';
  const source = cleanSource(body.source);
  const now = new Date();
  const pk = `LEAD#${email}`;

  let welcome = true;
  try {
    await ddb.send(
      new PutCommand({
        TableName: table,
        Item: { PK: pk, SK: 'PROFILE', email, token: newToken(), createdAt: now.toISOString(), source, unsubscribed: false, newsletter: true, newsletterAt: now.toISOString(), newsletterSite: site },
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') throw err;
    // Already on the list (from the readiness check or an earlier sign-up)
    const res = await ddb.send(
      new UpdateCommand({
        TableName: table,
        Key: { PK: pk, SK: 'PROFILE' },
        UpdateExpression: 'SET newsletter = :t, newsletterAt = if_not_exists(newsletterAt, :now), newsletterSite = if_not_exists(newsletterSite, :site), unsubscribed = :f REMOVE unsubscribedAt',
        ExpressionAttributeValues: { ':t': true, ':f': false, ':now': now.toISOString(), ':site': site },
        ReturnValues: 'ALL_OLD',
      })
    );
    welcome = res.Attributes?.unsubscribed === true;
  }
  if (!welcome) return { status: 200, body: { ok: true, already: true } };

  const profile = await claimDailySend(ddb, table, pk, now);
  if (!profile) return { status: 200, body: { ok: true } };
  const { unsubscribeUrl, oneClick } = unsubscribeLinks(email, profile.token, `https://${event.requestContext?.domainName}`);
  await sendEmail({ to: email, ...buildWelcomeEmail(unsubscribeUrl), oneClick });
  console.log('[leads] Newsletter sign-up', site, source.utm_source);
  return { status: 200, body: { ok: true } };
}

async function unsubscribe(ddb, table, email, token) {
  email = clean(email, 254).toLowerCase();
  token = clean(token, 64);
  if (!email || !token) return { status: 400, body: { error: 'Missing email or token' } };
  const res = await ddb.send(new GetCommand({ TableName: table, Key: { PK: `LEAD#${email}`, SK: 'PROFILE' } }));
  if (!res.Item || res.Item.token !== token) return { status: 404, body: { error: 'That unsubscribe link is not valid.' } };
  await ddb.send(
    new UpdateCommand({
      TableName: table,
      Key: { PK: `LEAD#${email}`, SK: 'PROFILE' },
      UpdateExpression: 'SET unsubscribed = :t, unsubscribedAt = :now',
      ExpressionAttributeValues: { ':t': true, ':now': new Date().toISOString() },
    })
  );
  console.log('[leads] Unsubscribed');
  return { status: 200, body: { ok: true } };
}

module.exports = {
  createLead,
  subscribe,
  unsubscribe,
  buildWelcomeEmail,
  HUB,
  buildEmail,
  CERTS,
  SALE,
  onSale,
  dollars,
  salePrice,
  studyPlan,
  esc,
  emailShell,
  footerText,
  button,
  unsubscribeLinks,
  sendEmail,
};
