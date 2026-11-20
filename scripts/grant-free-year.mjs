#!/usr/bin/env node
// Give one Study Hub account a free year of Pro, with no card and nothing that renews.
//
//   node grant-free-year.mjs list                           every free year given, with its end date
//   node grant-free-year.mjs check  <email> [--uid <uid>]   read-only: who is this, what do they have
//   node grant-free-year.mjs grant  <email> [--uid <uid>] [--test]
//   node grant-free-year.mjs revoke <email> [--uid <uid>]   end a free year now (dry runs, mistakes)
//
// --uid picks the account when one email leads to more than one (old accounts copied from Firebase).
//
// Why a subscription and not a coupon: Pro is the yearly Stripe price, and checkout always asks
// for a card. A 100%-off coupon would still take a card and renew at $39. Instead this makes a
// 365-day trial with no card, set to cancel at the end of that trial. Two locks keep it from ever
// charging: cancel_at_period_end ends it on its last day even if a card turns up later, and
// missing_payment_method=cancel ends it if no card is on file. The tool also refuses a customer
// who already has a saved card.
//
// Why the extra edit after creating it: the Study Hub webhook listens for
// customer.subscription.updated / .deleted, not .created. Touching the metadata sends an
// "updated" event, and the webhook then writes ENTITLEMENTS allAccess=true, which the
// sign-in trigger turns into the plan=pro claim the apps read.
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const REGION = 'us-east-1'
const FREE_DAYS = 365
const ACTIVE = ['active', 'trialing', 'past_due'] // same list as the callables Lambda

const argv = process.argv.slice(2)
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null }
const cmd = argv[0]
const email = cmd === 'list' ? '' : (argv[1] || '').trim().toLowerCase()
const forcedUid = flag('--uid')
const isTest = argv.includes('--test')
if (!['list', 'check', 'grant', 'revoke'].includes(cmd) || (cmd !== 'list' && !email.includes('@'))) {
  console.error('usage: node grant-free-year.mjs list | check|grant|revoke <email> [--uid <uid>] [--test]')
  process.exit(2)
}

// --- AWS (through the CLI, so this needs no npm install) -------------------------------
const aws = (...args) => JSON.parse(execFileSync('aws', [...args, '--region', REGION, '--output', 'json'], { encoding: 'utf8' }) || 'null')
const S = (v) => ({ S: String(v) })

// Read the live names instead of hard-coding them, so a redeploy can't point this at a stale table.
const TABLE = aws('cloudformation', 'describe-stacks', '--stack-name', 'StudyHubBackend',
  '--query', "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue|[0]")
const POOL = aws('cloudformation', 'describe-stacks', '--stack-name', 'StudyHubBackend',
  '--query', "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue|[0]")
const CALLABLES = aws('lambda', 'list-functions', '--query', "Functions[?starts_with(FunctionName,'StudyHubBackend-CallablesFn')].FunctionName|[0]")
const PRO_PRICE = aws('lambda', 'get-function-configuration', '--function-name', CALLABLES,
  '--query', 'Environment.Variables.STRIPE_PRICE_ALL_ACCESS') // all-access, $39 a year
const getItem = (PK, SK) => aws('dynamodb', 'get-item', '--consistent-read', '--table-name', TABLE, '--key', JSON.stringify({ PK: S(PK), SK: S(SK) }))?.Item || null
const putItem = (item) => aws('dynamodb', 'put-item', '--table-name', TABLE, '--item', JSON.stringify(item))

// The Study Hub Lambda has a restricted key; the full live key of the same Stripe account sits in
// the Nico Tek checkout Lambda. Read at run time, never printed or stored.
const KEY = execFileSync('aws', ['lambda', 'get-function-configuration', '--region', REGION, '--function-name', 'nico-tek-stripe-checkout',
  '--query', 'Environment.Variables.STRIPE_SECRET_KEY', '--output', 'text'], { encoding: 'utf8' }).trim()

// --- Stripe REST ----------------------------------------------------------------------
const form = (obj, prefix = '', out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v && typeof v === 'object') form(v, key, out)
    else if (v !== undefined) out.append(key, String(v))
  }
  return out
}
async function stripe(method, path, body, idempotencyKey) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }),
      ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
    },
    body: body ? form(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${json.error?.message || res.status}`)
  return json
}

// --- Helpers --------------------------------------------------------------------------
// Dates in New York time: an evening grant in UTC would otherwise print tomorrow's date.
const day = (unix) => (unix ? new Date(unix * 1000).toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' }) : '—')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const endOf = (s) => s.cancel_at || s.trial_end || s.current_period_end
const isPro = (s) => (s.metadata?.plan || (s.items.data[0]?.price.id === PRO_PRICE && 'all-access')) === 'all-access'

/** A saved card on the customer, the one thing that could make Stripe charge. */
async function cardOnFile(customer) {
  if (customer.invoice_settings?.default_payment_method || customer.default_source) return true
  const pms = await stripe('GET', `customers/${customer.id}/payment_methods?limit=1`)
  return pms.data.length > 0
}

// --- list -------------------------------------------------------------------------------
if (cmd === 'list') {
  const found = await stripe('GET', `subscriptions/search?query=${encodeURIComponent("metadata['grant']:'free-year'")}&limit=100&expand[]=data.customer`)
  const rows = found.data.sort((a, b) => a.created - b.created)
  // Stripe's search index runs up to about a minute behind, so a grant made seconds ago may be missing.
  if (!rows.length) console.log('No free years given yet.')
  for (const s of rows) {
    const c = s.customer
    const card = typeof c === 'object' && !c.deleted ? await cardOnFile(c) : false
    const ends = s.status === 'canceled' ? `ended ${day(s.ended_at)}` : `ends ${day(endOf(s))}${s.cancel_at_period_end || s.cancel_at ? '' : '  NOT SET TO END'}`
    console.log(`${(c?.email || '?').padEnd(40)} ${s.status.padEnd(9)} ${ends}${card ? '  CARD ON FILE' : ''}${s.metadata?.test ? '  (test)' : ''}`)
  }
  console.log('(Stripe search can run about a minute behind the latest grant.)')
  process.exit(0)
}

// --- Who is this --------------------------------------------------------------------------
// The sign-in trigger decides which account (uid) a person lands in: an old Google sign-in copied
// from Firebase goes through GOOGLE#<google id>; everyone else through EMAIL#<email>, written on
// the first verified sign-in. Granting to the wrong uid would do nothing they can see, so collect
// every uid this email can reach and insist on exactly one.
function candidateUids() {
  const emailUid = getItem(`EMAIL#${email}`, 'UID')?.uid?.S || null
  const users = aws('cognito-idp', 'list-users', '--user-pool-id', POOL, '--filter', `email = "${email}"`)?.Users || []
  const uids = new Map()
  for (const u of users) {
    const googleId = u.Username.match(/^google_(.+)$/i)?.[1]
    const uid = (googleId && getItem(`GOOGLE#${googleId}`, 'UID')?.uid?.S) || emailUid
    if (uid) uids.set(uid, googleId ? 'Google sign-in' : 'email and password')
  }
  // An old Firebase account that has not signed in since the move still has its email link;
  // Pro granted there shows up the first time they sign in.
  if (!users.length && emailUid) uids.set(emailUid, 'old account, not signed in since the move')
  return uids
}

async function lookup(uid) {
  const ent = getItem(`USER#${uid}`, 'ENTITLEMENTS')
  const billing = getItem(`USER#${uid}`, 'BILLING')
  let customer = null
  let subs = []
  if (billing?.stripeCustomerId?.S) {
    customer = await stripe('GET', `customers/${billing.stripeCustomerId.S}`).catch(() => null)
    if (customer?.deleted) customer = null
    if (customer) subs = (await stripe('GET', `subscriptions?customer=${customer.id}&status=all&limit=100`)).data
  }
  const pro = subs.filter(isPro)
  return {
    uid,
    customer,
    card: customer ? await cardOnFile(customer) : false,
    allAccess: ent?.allAccess?.BOOL === true,
    certs: (ent?.certs?.L || []).map((c) => c.S),
    pro,
    activePro: pro.find((s) => ACTIVE.includes(s.status)) || null,
  }
}

function show(who, how) {
  console.log(`account     ${email}  (uid ${who.uid.slice(0, 6)}…, ${how})`)
  console.log(`Pro now     ${who.allAccess ? 'yes' : 'no'}${who.certs.length ? `   one-time unlocks: ${who.certs.join(', ')}` : ''}`)
  console.log(`Stripe      ${who.customer?.id || 'no customer yet'}${who.card ? '   CARD ON FILE' : ''}`)
  for (const s of who.pro) {
    const ends = s.status === 'canceled' ? `ended ${day(s.ended_at)}` : `ends ${day(endOf(s))}${s.cancel_at_period_end || s.cancel_at ? '' : ' (not set to end)'}`
    console.log(`  Pro sub   ${s.id}  ${s.status}  ${ends}  ${s.metadata?.grant || ''}`)
  }
}

async function waitForPro(uid, want, subId) {
  for (let i = 0; i < 30; i++) {
    const ent = getItem(`USER#${uid}`, 'ENTITLEMENTS')
    const on = ent?.allAccess?.BOOL === true
    const listed = (ent?.active?.L || []).some((a) => a.M?.stripeSubscriptionId?.S === subId)
    if (on === want && (!want || listed)) return true
    await sleep(3000)
  }
  return false
}

// --- check / grant / revoke -----------------------------------------------------------
const uids = candidateUids()
let uid = forcedUid
if (uid && !uids.has(uid)) console.log(`Note: --uid ${uid.slice(0, 6)}… is not one this email reaches; using it because you asked.`)
if (!uid) {
  if (uids.size === 0) {
    console.log(`No Study Hub account has signed in with ${email} yet. Ask them to sign in once (Sign In, then Sign in with Google), or to confirm the email they used.`)
    process.exit(1)
  }
  if (uids.size > 1) {
    console.log(`Stopped: ${email} reaches more than one account. Pick one with --uid:`)
    for (const [u, how] of uids) console.log(`  --uid ${u}   (${how})`)
    process.exit(1)
  }
  uid = [...uids.keys()][0]
}
const who = await lookup(uid)
show(who, uids.get(uid) || 'chosen with --uid')

if (cmd === 'grant') {
  if (who.activePro) { console.log('\nStopped: this account already has a Pro subscription. A "trialing" one without "free-year" is the paid card trial: cancel it in Stripe first.'); process.exit(1) }
  if (who.allAccess) { console.log('\nStopped: Pro is already on for this account (set by hand, not by Stripe).'); process.exit(1) }
  if (who.card) { console.log('\nStopped: this customer has a saved card. Remove it in the Stripe Dashboard first, so the free year can never turn into a charge.'); process.exit(1) }

  let customerId = who.customer?.id
  if (!customerId) {
    // Same record the checkout code makes, so a later purchase reuses this customer
    // and the webhook keeps seeing the free year.
    const customer = await stripe('POST', 'customers', {
      email,
      description: isTest ? 'Study Hub free-year dry run (test account)' : 'Study Hub free year of Pro',
      metadata: { firebaseUID: uid, ...(isTest && { test: 'true' }) },
    }, `free-year-customer-${uid}-${randomUUID()}`)
    customerId = customer.id
    const now = new Date().toISOString()
    putItem({ PK: S(`USER#${uid}`), SK: S('BILLING'), stripeCustomerId: S(customerId), updatedAt: S(now) })
    putItem({ PK: S(`STRIPE#${customerId}`), SK: S('UID'), uid: S(uid) })
    console.log(`\ncreated Stripe customer ${customerId}`)
  }

  const sub = await stripe('POST', 'subscriptions', {
    customer: customerId,
    items: { 0: { price: PRO_PRICE } },
    trial_period_days: FREE_DAYS,
    // Lock 1: the subscription ends on the trial's last day, card or no card.
    cancel_at_period_end: true,
    // Lock 2: with no card on file, Stripe cancels instead of trying to bill.
    trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    description: 'Free year of AWS Study Hub Pro from Nicolas Roldos. Ends by itself, never billed.',
    metadata: { firebaseUID: uid, plan: 'all-access', grant: 'free-year', ...(isTest && { test: 'true' }) },
  }, `free-year-sub-${uid}-${randomUUID()}`) // unique per run, so a re-grant after a revoke works the same day
  console.log(`created subscription ${sub.id}  ${sub.status}  free until ${day(endOf(sub))}  set to end: ${sub.cancel_at_period_end ? 'yes' : 'NO'}`)
  if (!sub.cancel_at_period_end) console.log('WARNING: Stripe did not set the subscription to end. Check it in the Dashboard before telling anyone.')

  // The edit that sends customer.subscription.updated to the Study Hub webhook.
  await stripe('POST', `subscriptions/${sub.id}`, { metadata: { granted_at: new Date().toISOString() } })
  const ok = await waitForPro(uid, true, sub.id)
  console.log(ok
    ? `Pro is ON in Study Hub until ${day(endOf(sub))}. They see it after signing out and back in once, or within an hour.`
    : 'WARNING: Study Hub has not switched Pro on after 90 s. Check the webhook.')
  process.exit(ok ? 0 : 1)
}

if (cmd === 'revoke') {
  const free = who.pro.find((s) => ACTIVE.includes(s.status) && s.metadata?.grant === 'free-year')
  if (!free) { console.log('\nNo running free year on this account.'); process.exit(1) }
  await stripe('DELETE', `subscriptions/${free.id}`)
  console.log(`\ncancelled ${free.id}`)
  const ok = await waitForPro(uid, false, free.id)
  console.log(ok ? 'Pro is OFF in Study Hub.' : 'WARNING: Study Hub still shows Pro after 90 s. Check the webhook.')
  process.exit(ok ? 0 : 1)
}
