#!/usr/bin/env node
// Give one Study Hub account a free year of Pro, with no card and nothing that renews.
//
//   node grant-free-year.mjs check  <email>          read-only: who is this, what do they have
//   node grant-free-year.mjs grant  <email> [--test] give the free year
//   node grant-free-year.mjs revoke <email>          end a free year now (dry runs, mistakes)
//
// Why a subscription and not a coupon: Pro is the yearly Stripe price, and checkout always asks
// for a card. A 100%-off coupon would still take a card and renew at $39. A 365-day trial with
// no payment method, set to cancel when it ends, costs $0 and simply stops after a year.
//
// Why the extra edit after creating it: the Study Hub webhook listens for
// customer.subscription.updated / .deleted, not .created. Touching the metadata sends an
// "updated" event, and the webhook then writes ENTITLEMENTS allAccess=true, which the
// sign-in trigger turns into the plan=pro claim the apps read.
import { execFileSync } from 'node:child_process'

const REGION = 'us-east-1'
const FREE_DAYS = 365
const ACTIVE = ['active', 'trialing', 'past_due'] // same list as the callables Lambda

const [cmd, rawEmail, ...flags] = process.argv.slice(2)
const email = (rawEmail || '').trim().toLowerCase()
const isTest = flags.includes('--test')
if (!['check', 'grant', 'revoke'].includes(cmd) || !email.includes('@')) {
  console.error('usage: node grant-free-year.mjs check|grant|revoke <email> [--test]')
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

// --- Who is this --------------------------------------------------------------------------
const day = (unix) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : '—')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function lookup() {
  // The sign-in trigger writes EMAIL#<email> -> uid on the first verified sign-in.
  const link = getItem(`EMAIL#${email}`, 'UID')
  if (!link) return null
  const uid = link.uid.S
  // Accounts copied from Firebase can sign in with Google under a different uid than the email
  // link holds (the sign-in trigger checks GOOGLE#<id> first). Granting to the wrong uid would
  // do nothing visible, so stop and sort it out by hand.
  const users = aws('cognito-idp', 'list-users', '--user-pool-id', POOL, '--filter', `email = "${email}"`)?.Users || []
  for (const u of users) {
    const googleId = u.Username.match(/^google_(.+)$/i)?.[1]
    const googleUid = googleId && getItem(`GOOGLE#${googleId}`, 'UID')?.uid?.S
    if (googleUid && googleUid !== uid) {
      console.log(`Stopped: ${email} signs in with Google as a different account (uid ${googleUid.slice(0, 6)}…) than its email link (uid ${uid.slice(0, 6)}…). Grant by hand.`)
      process.exit(1)
    }
  }
  const ent = getItem(`USER#${uid}`, 'ENTITLEMENTS')
  const billing = getItem(`USER#${uid}`, 'BILLING')
  let customerId = billing?.stripeCustomerId?.S || null
  let subs = []
  if (customerId) {
    const customer = await stripe('GET', `customers/${customerId}`).catch(() => null)
    if (!customer || customer.deleted) customerId = null
    else subs = (await stripe('GET', `subscriptions?customer=${customerId}&status=all&limit=100`)).data
  }
  const pro = subs.filter((s) => (s.metadata?.plan || (s.items.data[0]?.price.id === PRO_PRICE && 'all-access')) === 'all-access')
  return {
    uid,
    customerId,
    allAccess: ent?.allAccess?.BOOL === true,
    certs: (ent?.certs?.L || []).map((c) => c.S),
    pro,
    activePro: pro.find((s) => ACTIVE.includes(s.status)) || null,
  }
}

function show(who) {
  console.log(`account     ${email}  (uid ${who.uid.slice(0, 6)}…)`)
  console.log(`Pro now     ${who.allAccess ? 'yes' : 'no'}${who.certs.length ? `   one-time unlocks: ${who.certs.join(', ')}` : ''}`)
  console.log(`Stripe      ${who.customerId || 'no customer yet'}`)
  for (const s of who.pro) console.log(`  Pro sub   ${s.id}  ${s.status}  ends ${day(s.trial_end || s.current_period_end)}  ${s.metadata?.grant || ''}`)
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

// --- Commands -------------------------------------------------------------------------
const who = await lookup()
if (!who) {
  console.log(`No Study Hub account has signed in with ${email} yet. Ask them to create the free account and sign in once.`)
  process.exit(1)
}
show(who)

if (cmd === 'grant') {
  if (who.activePro) { console.log('\nStopped: this account already has a Pro subscription.'); process.exit(1) }
  if (who.allAccess) { console.log('\nStopped: Pro is already on for this account (set by hand, not by Stripe).'); process.exit(1) }

  let customerId = who.customerId
  if (!customerId) {
    // Same record the checkout code makes, so a later purchase reuses this customer
    // and the webhook keeps seeing the free year.
    const customer = await stripe('POST', 'customers', {
      email,
      description: isTest ? 'Study Hub free-year dry run (test account)' : 'Study Hub free year of Pro',
      metadata: { firebaseUID: who.uid, ...(isTest && { test: 'true' }) },
    }, `free-year-customer-${who.uid}`)
    customerId = customer.id
    const now = new Date().toISOString()
    putItem({ PK: S(`USER#${who.uid}`), SK: S('BILLING'), stripeCustomerId: S(customerId), updatedAt: S(now) })
    putItem({ PK: S(`STRIPE#${customerId}`), SK: S('UID'), uid: S(who.uid) })
    console.log(`\ncreated Stripe customer ${customerId}`)
  }

  const sub = await stripe('POST', 'subscriptions', {
    customer: customerId,
    items: { 0: { price: PRO_PRICE } },
    trial_period_days: FREE_DAYS,
    // No card on file, so when the year is up Stripe cancels instead of billing.
    trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    description: 'Free year of AWS Study Hub Pro from Nicolas Roldos. Ends by itself, never billed.',
    metadata: { firebaseUID: who.uid, plan: 'all-access', grant: 'free-year', ...(isTest && { test: 'true' }) },
  }, `free-year-sub-${who.uid}-${new Date().toISOString().slice(0, 10)}`)
  console.log(`created subscription ${sub.id}  ${sub.status}  free until ${day(sub.trial_end)}`)

  // The edit that sends customer.subscription.updated to the Study Hub webhook.
  await stripe('POST', `subscriptions/${sub.id}`, { metadata: { granted_at: new Date().toISOString() } })
  const ok = await waitForPro(who.uid, true, sub.id)
  console.log(ok ? 'Pro is ON in Study Hub. They see it on their next sign-in or page reload.' : 'WARNING: Study Hub has not switched Pro on after 90 s. Check the webhook.')
  process.exit(ok ? 0 : 1)
}

if (cmd === 'revoke') {
  const free = who.pro.find((s) => ACTIVE.includes(s.status) && s.metadata?.grant === 'free-year')
  if (!free) { console.log('\nNo running free year on this account.'); process.exit(1) }
  await stripe('DELETE', `subscriptions/${free.id}`)
  console.log(`\ncancelled ${free.id}`)
  const ok = await waitForPro(who.uid, false, free.id)
  console.log(ok ? 'Pro is OFF in Study Hub.' : 'WARNING: Study Hub still shows Pro after 90 s. Check the webhook.')
  process.exit(ok ? 0 : 1)
}
