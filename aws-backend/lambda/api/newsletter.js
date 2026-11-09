// The weekly newsletter. Nico writes each issue as a Markdown file in
// newsletter/issues/ (named YYYY-MM-DD-<slug>.md, the date it should go out);
// `./deploy.sh newsletter` uploads them to the newsletter bucket and emails
// him a preview. EventBridge Scheduler (study-hub-stack.ts) runs this Lambda:
//   { action: 'remind' }  Monday 9:00 Eastern: emails Nico a preview of
//                         Tuesday's issue, or a reminder that none is queued
//   { action: 'send' }    Tuesday 9:00 Eastern: sends the issue that's due
// By hand:
//   { action: 'preview', to, issue? }   one copy to one address, marks nothing
//   { action: 'send', issue }           send that issue now
//
// An issue is due when its date is today or up to 6 days ago and it hasn't
// been sent. Everyone on the list who hasn't unsubscribed gets it, once each
// (PROFILE.lastIssue is claimed before sending, so a retried run continues
// where it stopped). Sent issues are recorded as NEWSLETTER#<issue>/ISSUE.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const leads = require('./leads');

const { esc, emailShell, footerText, button, unsubscribeLinks, sendEmail, HUB } = leads;
const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET = process.env.NEWSLETTER_BUCKET;
const API_URL = process.env.API_URL;
const OWNER = 'nico@nico-tek.com';
const PREFIX = 'issues/';
const ISSUE_RE = /^(\d{4}-\d{2}-\d{2})[-\w]*$/;
const DAY = 24 * 60 * 60 * 1000;

const s3 = new S3Client({});

// YYYY-MM-DD in US Eastern, days from now
const easternDate = (now, plusDays = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(now + plusDays * DAY));

// ---------------------------------------------------------------------------
// Issue files: optional front matter (subject, preview) and a small Markdown
// subset. See newsletter/README.md.
// ---------------------------------------------------------------------------
function parseIssue(id, source) {
  const meta = {};
  let body = source.replace(/\r\n/g, '\n');
  const fm = body.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    body = body.slice(fm[0].length);
  }
  const title = body.match(/^#\s+(.+)$/m)?.[1].trim();
  const subject = meta.subject || title;
  if (!subject) throw new Error(`${id}: add "subject:" at the top or a "# Title" line`);
  return { id, date: id.slice(0, 10), subject, preview: meta.preview || '', body: body.trim() };
}

// Our own links get the newsletter's tracking tags
function trackLink(url, issueId) {
  try {
    const u = new URL(url);
    if (!/(^|\.)aws-study-flashcards-app\.com$/.test(u.hostname) || u.searchParams.has('utm_source')) return url;
    u.searchParams.set('utm_source', 'newsletter');
    u.searchParams.set('utm_medium', 'email');
    u.searchParams.set('utm_campaign', issueId);
    return u.toString();
  } catch {
    return url;
  }
}

const safeUrl = (url) => (/^(https?:|mailto:)/i.test(url) ? url : '#');

function inlineHtml(text, issueId) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code style="font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;background:#f1eee9;padding:1px 5px;border-radius:4px">${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      const href = esc(safeUrl(trackLink(url.replace(/&amp;/g, '&'), issueId)));
      return `<a href="${href}" style="color:#2f5bd3">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])[*_]([^*_]+)[*_](?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
}

const inlineText = (text, issueId) =>
  text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => `${label} (${trackLink(url, issueId)})`)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

const P = 'margin:0 0 14px;font-size:15px;line-height:1.55';

// Returns { html, text } for the issue body
function renderMarkdown(body, issueId) {
  const html = [];
  const text = [];
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trimEnd()).filter(Boolean);
    if (!lines.length) continue;
    const first = lines[0];
    let m;
    if ((m = first.match(/^(#{1,3})\s+(.+)$/)) && lines.length === 1) {
      const size = { 1: 24, 2: 19, 3: 16 }[m[1].length];
      const tag = `h${m[1].length}`;
      html.push(`<${tag} style="margin:${m[1].length === 1 ? 0 : 22}px 0 12px;font-size:${size}px;line-height:1.25">${inlineHtml(m[2], issueId)}</${tag}>`);
      text.push(m[1].length === 1 ? m[2] : m[2].toUpperCase());
    } else if ((m = first.match(/^\[button:\s*([^\]]+)\]\(([^)\s]+)\)$/i)) && lines.length === 1) {
      const url = safeUrl(trackLink(m[2], issueId));
      html.push(button(url, m[1].trim()));
      text.push(`${m[1].trim()}: ${url}`);
    } else if ((m = first.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)) && lines.length === 1) {
      html.push(`<p style="margin:0 0 14px"><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" style="max-width:100%;height:auto;border-radius:8px"></p>`);
    } else if (/^(-{3,}|\*{3,})$/.test(first) && lines.length === 1) {
      html.push('<hr style="border:0;border-top:1px solid #e8e4dd;margin:22px 0">');
      text.push('---');
    } else if (lines.every((l) => /^[-*]\s+/.test(l))) {
      const items = lines.map((l) => l.replace(/^[-*]\s+/, ''));
      html.push(`<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6">${items.map((i) => `<li>${inlineHtml(i, issueId)}</li>`).join('')}</ul>`);
      text.push(items.map((i) => `- ${inlineText(i, issueId)}`).join('\n'));
    } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      const items = lines.map((l) => l.replace(/^\d+[.)]\s+/, ''));
      html.push(`<ol style="margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.6">${items.map((i) => `<li>${inlineHtml(i, issueId)}</li>`).join('')}</ol>`);
      text.push(items.map((i, n) => `${n + 1}. ${inlineText(i, issueId)}`).join('\n'));
    } else if (lines.every((l) => l.startsWith('>'))) {
      const quote = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
      html.push(`<p style="margin:0 0 14px;padding:12px 14px;background:#fbe7d6;border-radius:8px;font-size:14px;line-height:1.5;color:#8a3d06">${inlineHtml(quote, issueId)}</p>`);
      text.push(inlineText(quote, issueId));
    } else {
      const para = lines.join(' ');
      html.push(`<p style="${P}">${inlineHtml(para, issueId)}</p>`);
      text.push(inlineText(para, issueId));
    }
  }
  return { html: html.join('\n'), text: text.join('\n\n') };
}

function renderIssue(issue, unsubscribeUrl) {
  const { html, text } = renderMarkdown(issue.body, issue.id);
  // Preview text: what inboxes show after the subject
  const preheader = issue.preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(issue.preview)}${'&#8199;&#65279;&#847; '.repeat(30)}</div>`
    : '';
  return {
    subject: issue.subject,
    text: `${text}\n\n${footerText(unsubscribeUrl)}`,
    html: emailShell(
      `${preheader}<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d9620f">AWS Study Hub · Weekly</p>\n${html}`,
      unsubscribeUrl
    ),
  };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
async function listIssueIds() {
  const ids = [];
  let ContinuationToken;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken }));
    for (const o of page.Contents || []) {
      const id = o.Key.slice(PREFIX.length).replace(/\.md$/, '');
      if (o.Key.endsWith('.md') && ISSUE_RE.test(id)) ids.push(id);
    }
    ContinuationToken = page.NextContinuationToken;
  } while (ContinuationToken);
  return ids.sort();
}

async function loadIssue(id) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}${id}.md` }));
  return parseIssue(id, await res.Body.transformToString('utf-8'));
}

const issueRecord = async (ddb, id) =>
  (await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `NEWSLETTER#${id}`, SK: 'ISSUE' } }))).Item;

// The unsent issue due on `day` (its date is that day or up to 6 days before)
async function dueIssueId(ddb, day) {
  const from = easternDate(Date.parse(`${day}T12:00:00Z`), -6);
  for (const id of await listIssueIds()) {
    const date = id.slice(0, 10);
    if (date < from || date > day) continue;
    if ((await issueRecord(ddb, id))?.status !== 'sent') return id;
  }
  return null;
}

async function* subscribers(ddb) {
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

async function claim(ddb, email, issueId, now) {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `LEAD#${email}`, SK: 'PROFILE' },
        UpdateExpression: 'SET lastIssue = :id, lastIssueAt = :now',
        ConditionExpression: 'unsubscribed = :f AND (attribute_not_exists(lastIssue) OR lastIssue <> :id)',
        ExpressionAttributeValues: { ':id': issueId, ':now': new Date(now).toISOString(), ':f': false },
      })
    );
    return true;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false;
    throw err;
  }
}

const unclaim = (ddb, email, issueId) =>
  ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `LEAD#${email}`, SK: 'PROFILE' },
      UpdateExpression: 'REMOVE lastIssue, lastIssueAt',
      ConditionExpression: 'lastIssue = :id',
      ExpressionAttributeValues: { ':id': issueId },
    })
  );

// Unsubscribe links for one address (a placeholder if it isn't on the list)
async function linksFor(ddb, email) {
  const res = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `LEAD#${email}`, SK: 'PROFILE' } }));
  return res.Item ? unsubscribeLinks(email, res.Item.token, API_URL) : { unsubscribeUrl: HUB, oneClick: `${API_URL}/v1/leads/unsubscribe` };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
async function send(ddb, issueId, now) {
  const id = issueId || (await dueIssueId(ddb, easternDate(now)));
  if (!id) {
    console.log('[newsletter] No issue due; nothing sent');
    return { sent: 0 };
  }
  const issue = await loadIssue(id);
  const key = { PK: `NEWSLETTER#${id}`, SK: 'ISSUE' };
  if ((await issueRecord(ddb, id))?.status === 'sent') {
    console.log('[newsletter] Already sent', id);
    return { issue: id, sent: 0 };
  }
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: 'SET #st = :sending, subject = :subject, startedAt = if_not_exists(startedAt, :now)',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':sending': 'sending', ':subject': issue.subject, ':now': new Date(now).toISOString() },
    })
  );

  let sent = 0;
  let failed = 0;
  for await (const person of subscribers(ddb)) {
    if (!(await claim(ddb, person.email, id, now))) continue;
    const { unsubscribeUrl, oneClick } = unsubscribeLinks(person.email, person.token, API_URL);
    try {
      await sendEmail({ to: person.email, ...renderIssue(issue, unsubscribeUrl), oneClick });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error('[newsletter] Send failed', err.name, err.message);
      await unclaim(ddb, person.email, id).catch(() => {});
    }
  }
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: 'SET #st = :sent, sentAt = :now ADD recipients :n',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':sent': 'sent', ':now': new Date().toISOString(), ':n': sent },
    })
  );
  console.log('[newsletter] Sent', id, JSON.stringify({ sent, failed }));
  return { issue: id, sent, failed };
}

async function preview(ddb, to, issueId, now) {
  if (!to) throw new Error('A preview needs "to" (an email address)');
  let id = issueId;
  if (!id) {
    // The next issue to go out: due now, or the earliest upcoming one
    const today = easternDate(now);
    id = (await dueIssueId(ddb, today)) || (await listIssueIds()).find((i) => i.slice(0, 10) > today);
  }
  if (!id) return { sent: 0, note: 'No issue queued' };
  const issue = await loadIssue(id);
  const { unsubscribeUrl, oneClick } = await linksFor(ddb, to.toLowerCase());
  const email = renderIssue(issue, unsubscribeUrl);
  await sendEmail({ to, ...email, subject: `[Preview] ${email.subject}`, oneClick });
  console.log('[newsletter] Preview sent', id);
  return { issue: id, sent: 1 };
}

// Monday: preview Tuesday's issue to Nico, or remind him there isn't one
async function remind(ddb, now) {
  const tomorrow = easternDate(now, 1);
  const id = await dueIssueId(ddb, tomorrow);
  if (id) return preview(ddb, OWNER, id, now);

  const file = `newsletter/issues/${tomorrow}-your-topic.md`;
  const text = `No newsletter is queued for tomorrow (${tomorrow}), so nothing will go out.

To send one:
1. Copy newsletter/issues/_example.md to ${file} and write it.
2. Run ./deploy.sh newsletter (it uploads the issue and emails you a preview).

It goes out Tuesday at 9:00 Eastern.`;
  const { unsubscribeUrl, oneClick } = await linksFor(ddb, OWNER);
  await sendEmail({
    to: OWNER,
    subject: 'Reminder: no newsletter queued for tomorrow',
    text,
    html: emailShell(
      `<h1 style="margin:0 0 16px;font-size:22px">No newsletter queued for tomorrow</h1>
<p style="${P}">Nothing will go out on ${esc(tomorrow)} unless you add an issue.</p>
<ol style="margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.6"><li>Copy <code>newsletter/issues/_example.md</code> to <code>${esc(file)}</code> and write it.</li><li>Run <code>./deploy.sh newsletter</code>. It uploads the issue and emails you a preview.</li></ol>
<p style="${P}">It goes out Tuesday at 9:00 Eastern.</p>`,
      unsubscribeUrl
    ),
    oneClick,
  });
  console.log('[newsletter] Reminder sent: nothing queued for', tomorrow);
  return { sent: 0, reminded: true };
}

async function run(ddb, event = {}, now = Date.now()) {
  if (event.action === 'send') return send(ddb, event.issue, now);
  if (event.action === 'preview') return preview(ddb, event.to, event.issue, now);
  if (event.action === 'remind') return remind(ddb, now);
  throw new Error(`Unknown action: ${event.action}`);
}

let ddbClient;
exports.handler = async (event) => {
  ddbClient ||= DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return run(ddbClient, event || {});
};
Object.assign(exports, { run, parseIssue, renderIssue, renderMarkdown, easternDate });
