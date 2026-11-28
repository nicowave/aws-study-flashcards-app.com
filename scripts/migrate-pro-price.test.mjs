// Tests for migrate-pro-price.mjs against a pretend Stripe client (no account needed):
//   node --test scripts/migrate-pro-price.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { migrate, NOTICE_REMINDER } from './migrate-pro-price.mjs'

const SCRIPT = fileURLToPath(new URL('./migrate-pro-price.mjs', import.meta.url))
const OLD = 'price_pro_39'
const NEW = 'price_pro_199'
const END = Date.parse('2027-03-01T17:00:00Z') / 1000

const prices = {
  [OLD]: { id: OLD, active: false, currency: 'usd', type: 'recurring', unit_amount: 3900, recurring: { interval: 'year', interval_count: 1 } },
  [NEW]: { id: NEW, active: true, currency: 'usd', type: 'recurring', unit_amount: 19900, recurring: { interval: 'year', interval_count: 1 } },
  price_cp_month: { id: 'price_cp_month', active: true, currency: 'usd', type: 'recurring', unit_amount: 1100, recurring: { interval: 'month', interval_count: 1 } },
  price_wrong: { id: 'price_wrong', active: true, currency: 'usd', type: 'recurring', unit_amount: 15000, recurring: { interval: 'year', interval_count: 1 } },
}
const sub = (id, email, extra = {}) => ({
  id, status: 'active', customer: { id: `cus_${id}`, email }, metadata: { firebaseUID: `u_${id}` },
  items: { data: [{ id: `si_${id}`, price: { id: OLD }, current_period_end: END }] },
  cancel_at_period_end: false, cancel_at: null, schedule: null, ...extra,
})

function fakeStripe(subs, pageSize = 100) {
  const calls = []
  return {
    calls,
    prices: {
      retrieve: async (id) => {
        if (!prices[id]) throw new Error(`No such price: '${id}'`)
        return prices[id]
      },
    },
    subscriptions: {
      list: async (p) => {
        calls.push({ name: 'subscriptions.list', args: [p] })
        assert.equal(p.status, 'all')
        const matching = subs.filter((s) => s.items.data.some((i) => i.price.id === p.price))
        const from = p.starting_after ? matching.findIndex((s) => s.id === p.starting_after) + 1 : 0
        const data = matching.slice(from, from + Math.min(p.limit, pageSize))
        return { data, has_more: from + data.length < matching.length }
      },
      update: async (id, p) => {
        calls.push({ name: 'subscriptions.update', args: [id, p] })
        const s = subs.find((x) => x.id === id)
        for (const it of p.items) s.items.data.find((i) => i.id === it.id).price = { id: it.price }
        s.metadata = { ...s.metadata, ...p.metadata }
        return s
      },
    },
  }
}

const account = () => [
  sub('a', 'ana@example.com'),
  sub('t', 'tom@example.com', { status: 'trialing', trial_end: END - 86400 }),
  sub('p', 'pat@example.com', { status: 'past_due' }),
  sub('c', 'cam@example.com', { cancel_at_period_end: true }),
  sub('g', 'gift@example.com', { status: 'trialing', cancel_at_period_end: true, metadata: { grant: 'free-year' } }),
  sub('s', 'sam@example.com', { schedule: 'sub_sched_1' }),
  sub('x', 'old@example.com', { status: 'canceled' }),
  { ...sub('m', 'mo@example.com'), items: { data: [{ id: 'si_m', price: { id: 'price_cp_month' }, current_period_end: END }] } },
]

test('plan mode lists who moves and when, and changes nothing', async () => {
  const subs = account()
  const stripe = fakeStripe(subs)
  const lines = []
  const { rows, moved, skipped } = await migrate({ stripe, legacyPrice: OLD, newPrice: NEW, log: (l) => lines.push(l) })
  assert.ok(!stripe.calls.some((c) => c.name === 'subscriptions.update'))
  assert.equal(moved, 0)
  assert.deepEqual(rows.map((r) => r.email), ['ana@example.com', 'tom@example.com', 'pat@example.com', 'cam@example.com', 'gift@example.com', 'sam@example.com'])
  assert.equal(skipped, 3)
  const out = lines.join('\n')
  assert.match(out, /6 Pro subscription\(s\) on the old price price_pro_39 \(\$39\/year\), moving to price_pro_199 \(\$199\/year\) \[plan only\]/)
  assert.match(out, /ana@example\.com .* renews March 1, 2027 at \$199\/year instead of \$39; nothing charged now/)
  assert.match(out, /tom@example\.com .* trial ends February 28, 2027, then \$199\/year/)
  assert.match(out, /pat@example\.com .* past due/)
  assert.match(out, /cam@example\.com .* skipped: set to end/)
  assert.match(out, /sam@example\.com .* skipped: on subscription schedule sub_sched_1/)
  assert.ok(!out.includes('old@example.com'), 'canceled subscriptions are not listed')
  assert.ok(!out.includes('mo@example.com'), 'other prices are not listed')
  assert.match(NOTICE_REMINDER, /BEFORE running --apply/)
})

test('apply switches the item to the new price with no proration and tags the plan; a second run finds nobody', async () => {
  const subs = account()
  const stripe = fakeStripe(subs, 2) // and follows pagination
  const { moved, skipped } = await migrate({ stripe, legacyPrice: OLD, newPrice: NEW, apply: true, log: () => {} })
  assert.equal(moved, 3)
  assert.equal(skipped, 3)
  const updates = stripe.calls.filter((c) => c.name === 'subscriptions.update')
  assert.deepEqual(updates.map((c) => c.args[0]), ['a', 't', 'p'])
  assert.deepEqual(updates[0].args[1], { items: [{ id: 'si_a', price: NEW }], proration_behavior: 'none', metadata: { plan: 'all-access' } })
  assert.equal(subs.find((s) => s.id === 'a').metadata.firebaseUID, 'u_a', 'other metadata kept')
  assert.equal(subs.find((s) => s.id === 'c').items.data[0].price.id, OLD, 'ending subscriptions untouched')

  const again = fakeStripe(subs)
  const second = await migrate({ stripe: again, legacyPrice: OLD, newPrice: NEW, apply: true, log: () => {} })
  assert.equal(second.moved, 0)
  assert.deepEqual(second.rows.map((r) => r.id), ['c', 'g', 's'])
})

test('refuses a missing, equal, archived or wrong new price', async () => {
  const stripe = fakeStripe(account())
  await assert.rejects(migrate({ stripe, legacyPrice: OLD, newPrice: undefined, log: () => {} }), /Both the old and the new/)
  await assert.rejects(migrate({ stripe, legacyPrice: NEW, newPrice: NEW, log: () => {} }), /same price/)
  await assert.rejects(migrate({ stripe, legacyPrice: NEW, newPrice: OLD, log: () => {} }), /archived/)
  await assert.rejects(migrate({ stripe, legacyPrice: OLD, newPrice: 'price_cp_month', log: () => {} }), /not a USD yearly price/)
  await assert.rejects(migrate({ stripe, legacyPrice: OLD, newPrice: 'price_wrong', log: () => {} }), /\$150\/year, expected \$199/)
  assert.ok(!stripe.calls.some((c) => c.name === 'subscriptions.update'))
})

test('the command needs a live key (or --test-mode) and --notice-sent before --apply', () => {
  const run = (env, args = []) => {
    try {
      execFileSync(process.execPath, [SCRIPT, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8', stdio: 'pipe' })
      return { code: 0 }
    } catch (err) {
      return { code: err.status, out: `${err.stdout}${err.stderr}` }
    }
  }
  const secret = 'sk_test_51SecretValueDoNotPrint'
  const noKey = run({})
  assert.equal(noKey.code, 2)
  const test = run({ STRIPE_SECRET_KEY: secret })
  assert.equal(test.code, 2)
  assert.ok(!test.out.includes(secret))
  const noNotice = run({ STRIPE_SECRET_KEY: secret }, ['--test-mode', '--apply'])
  assert.equal(noNotice.code, 2)
  assert.match(noNotice.out, /--notice-sent/)
})
