#!/usr/bin/env node
/**
 * Move Pro subscribers on the old $39/year price to the $199/year price at their next renewal.
 *
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/migrate-pro-price.mjs                         plan only: who, when, what happens
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/migrate-pro-price.mjs --apply --notice-sent   switch them
 *
 * Flags:
 *   --legacy-price <id>  the old Pro price (default STRIPE_PRICE_ALL_ACCESS in aws-backend/.env)
 *   --new-price <id>     the new Pro price (default STRIPE_PRICE_ALL_ACCESS_YEARLY in aws-backend/.env)
 *   --env-file <path>    a different .env
 *   --apply              change the subscriptions (needs --notice-sent)
 *   --notice-sent        you confirm every listed subscriber was told about the new price in advance
 *   --test-mode          allow a test key (sandbox rehearsal; pass both price flags)
 *
 * Each active, trialing or past-due subscription on the old price gets its item switched to the new
 * price with proration_behavior 'none': nothing is charged or credited now, and the next renewal
 * (or the end of a trial) charges $199. metadata.plan is set to all-access so the webhook keeps
 * treating it as Pro. Subscriptions already set to end, and ones on a subscription schedule, are left
 * alone. Run it again any time: moved subscriptions are no longer on the old price.
 *
 * Send the notice first. Stripe's rules and consumer law (for example the FTC's negative option rule
 * and state auto-renewal laws in the US, and EU consumer rules) expect subscribers to hear about a
 * price increase before the renewal that charges it, with a way to cancel.
 */
import { pathToFileURL } from 'node:url'
import { keyProblem, scrub, loadStripe, readEnvFile, listAll, DEFAULT_ENV_FILE, ACTIVE, PRO_YEARLY_CENTS } from './stripe-subscription-setup.mjs'

const usd = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`
// Dates in New York time, like grant-free-year.mjs.
const day = (unix) => (unix ? new Date(unix * 1000).toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' }) : '?')

export const NOTICE_REMINDER =
  'Reminder: email every subscriber listed above about the new price BEFORE running --apply, ' +
  'and give them time to cancel before their renewal (Stripe and consumer law expect advance notice of a price increase).'

/**
 * Lists (and with apply=true, moves) the subscriptions on `legacyPrice`. `stripe` is a Stripe
 * client or a fake with prices.retrieve, subscriptions.list and subscriptions.update.
 * Returns { rows: [{ id, email, status, renews, action, moved }], moved, skipped }.
 */
export async function migrate({ stripe, legacyPrice, newPrice, apply = false, log = console.log }) {
  if (!legacyPrice || !newPrice) throw new Error('Both the old and the new Pro price are needed (--legacy-price / --new-price, or aws-backend/.env).')
  if (legacyPrice === newPrice) throw new Error('The old and the new Pro price are the same price.')

  const target = await stripe.prices.retrieve(newPrice)
  if (!target.active) throw new Error(`${newPrice} is archived; subscriptions can't move to it.`)
  if (target.currency !== 'usd' || target.type !== 'recurring' || target.recurring?.interval !== 'year' || (target.recurring.interval_count ?? 1) !== 1) {
    throw new Error(`${newPrice} is not a USD yearly price.`)
  }
  if (target.unit_amount !== PRO_YEARLY_CENTS) {
    throw new Error(`${newPrice} is ${usd(target.unit_amount)}/year, expected ${usd(PRO_YEARLY_CENTS)}. Check the price ID.`)
  }
  const old = await stripe.prices.retrieve(legacyPrice)
  const newLabel = `${usd(target.unit_amount)}/year`

  const all = await listAll((p) => stripe.subscriptions.list(p), { price: legacyPrice, status: 'all', expand: ['data.customer'] })
  const subs = all.filter((s) => ACTIVE.includes(s.status))
  log(`${subs.length} Pro subscription(s) on the old price ${legacyPrice} (${usd(old.unit_amount ?? 0)}/year), moving to ${newPrice} (${newLabel})${apply ? '' : ' [plan only]'}`)

  const rows = []
  for (const s of subs) {
    const item = s.items.data.find((i) => i.price.id === legacyPrice)
    const email = (typeof s.customer === 'object' && s.customer?.email) || (typeof s.customer === 'string' ? s.customer : s.customer?.id) || '?'
    // API 2025-08-27.basil moved the period end to the item.
    const periodEnd = item?.current_period_end ?? s.current_period_end
    const renews = s.status === 'trialing' && s.trial_end ? s.trial_end : periodEnd
    let action
    let eligible = false
    if (!item) action = 'skipped: the old price is not on this subscription any more'
    else if (s.cancel_at_period_end || s.cancel_at) action = `skipped: set to end on ${day(s.cancel_at || periodEnd)}, will not renew`
    else if (s.schedule) action = `skipped: on subscription schedule ${typeof s.schedule === 'string' ? s.schedule : s.schedule.id}; change it in the Dashboard`
    else {
      eligible = true
      action = s.status === 'trialing'
        ? `trial ends ${day(renews)}, then ${newLabel}; nothing charged now`
        : `renews ${day(renews)} at ${newLabel} instead of ${usd(old.unit_amount ?? 0)}; nothing charged now`
      if (s.status === 'past_due') action += ' (payment is past due: the retry still charges the old amount)'
      if (s.discounts?.length || s.discount) action += ' (has a discount, which keeps applying)'
    }
    let moved = false
    if (eligible && apply) {
      await stripe.subscriptions.update(s.id, {
        items: [{ id: item.id, price: newPrice }],
        proration_behavior: 'none',
        metadata: { plan: 'all-access' },
      })
      moved = true
    }
    rows.push({ id: s.id, email, status: s.status, renews, action, moved })
    log(`  ${email.padEnd(36)} ${s.id}  ${s.status.padEnd(9)} ${moved ? 'MOVED: ' : ''}${action}`)
  }
  const moved = rows.filter((r) => r.moved).length
  const skipped = rows.filter((r) => r.action.startsWith('skipped')).length
  if (!subs.length) log('Nobody to move.')
  return { rows, moved, skipped }
}

async function main(argv) {
  const has = (f) => argv.includes(f)
  const flag = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null }
  const apply = has('--apply')
  const testMode = has('--test-mode')
  const problem = keyProblem(process.env.STRIPE_SECRET_KEY, testMode)
  if (problem) { console.error(problem); return 2 }
  if (apply && !has('--notice-sent')) {
    console.error('--apply needs --notice-sent: tell every subscriber about the new price first (run without --apply to list them).')
    return 2
  }
  // In a sandbox the live price IDs in .env don't exist, so a rehearsal names both prices.
  const env = testMode ? {} : readEnvFile(flag('--env-file') || DEFAULT_ENV_FILE)
  const legacyPrice = flag('--legacy-price') || env.STRIPE_PRICE_ALL_ACCESS
  const newPrice = flag('--new-price') || env.STRIPE_PRICE_ALL_ACCESS_YEARLY

  console.log(`${testMode ? 'TEST mode (sandbox rehearsal)' : 'LIVE mode'}, ${apply ? 'APPLYING' : 'plan only (--apply --notice-sent to act)'}\n`)
  const { rows, moved, skipped } = await migrate({ stripe: loadStripe(process.env.STRIPE_SECRET_KEY), legacyPrice, newPrice, apply })
  console.log(`\n${moved} moved, ${skipped} skipped, ${rows.length - moved - skipped} ${apply ? 'not moved' : 'to move'}.`)
  if (!apply && rows.length) console.log(`\n${NOTICE_REMINDER}`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => { console.error(`Stopped: ${scrub(err?.message || err)}`); process.exit(1) },
  )
}
