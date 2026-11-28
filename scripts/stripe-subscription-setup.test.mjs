// Tests for stripe-subscription-setup.mjs against a pretend Stripe client (no account needed):
//   node --test scripts/stripe-subscription-setup.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, statSync, writeFileSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  setup, mergeEnv, writeEnvFile, keyProblem, scrub, envLines, envName, parseEnv,
  PRODUCTS, PRO, PRODUCT_MONTHLY_CENTS, PRODUCT_YEARLY_CENTS, PRO_YEARLY_CENTS, WEBHOOK_EVENT, SWITCH_PORTAL_PURPOSE,
} from './stripe-subscription-setup.mjs'
import { COURSES, OTHER_COURSES } from '../aws-study-homepage/src/data/courses.js'
import * as hubPrices from '../aws-study-homepage/src/data/prices.js'

const SCRIPT = fileURLToPath(new URL('./stripe-subscription-setup.mjs', import.meta.url))
const WRITES = /\.(create|update|del)$/

// A pretend Stripe: the resources and methods the script uses, with Stripe's list pagination.
function fakeStripe(state = {}) {
  const s = { products: [], prices: [], portal: null, switchPortal: null, endpoints: [], pageSize: 100, ...state }
  const calls = []
  let n = 0
  const nextId = (prefix) => `${prefix}_new${++n}`
  const page = (items, params = {}) => {
    const from = params.starting_after ? items.findIndex((x) => x.id === params.starting_after) + 1 : 0
    const data = items.slice(from, from + Math.min(params.limit || 10, s.pageSize))
    return { data, has_more: from + data.length < items.length }
  }
  const find = (list, id) => {
    const x = list.find((i) => i.id === id)
    if (!x) throw Object.assign(new Error(`No such object: '${id}'`), { type: 'StripeInvalidRequestError' })
    return x
  }
  const merge = (x, p) => Object.assign(x, p, p.metadata ? { metadata: { ...x.metadata, ...p.metadata } } : {})
  const rec = (name, ...args) => calls.push({ name, args })
  return {
    s, calls,
    writes: () => calls.filter((c) => WRITES.test(c.name)),
    products: {
      list: async (p) => (rec('products.list', p), page(s.products, p)),
      retrieve: async (id) => find(s.products, id),
      create: async (p) => {
        rec('products.create', p)
        const x = { id: nextId('prod'), active: true, metadata: {}, ...p }
        s.products.push(x)
        return x
      },
      update: async (id, p) => (rec('products.update', id, p), merge(find(s.products, id), p)),
    },
    prices: {
      list: async (p) => page(s.prices.filter((x) => x.product === p.product && (p.active === undefined || x.active === p.active)), p),
      retrieve: async (id) => find(s.prices, id),
      create: async (p) => {
        rec('prices.create', p)
        const x = {
          id: nextId('price'), active: true, type: 'recurring', metadata: {}, ...p,
          recurring: { interval_count: 1, usage_type: 'licensed', ...p.recurring },
        }
        s.prices.push(x)
        return x
      },
      update: async (id, p) => (rec('prices.update', id, p), merge(find(s.prices, id), p)),
    },
    billingPortal: {
      configurations: {
        list: async (p) => {
          if (p.is_default) return { data: s.portal ? [s.portal] : [], has_more: false }
          return page([s.portal, s.switchPortal].filter(Boolean), p)
        },
        create: async (p) => {
          rec('portal.create', p)
          if (p.metadata?.purpose === SWITCH_PORTAL_PURPOSE) return (s.switchPortal = { id: 'bpc_switch', is_default: false, ...p })
          return (s.portal = { id: 'bpc_new', is_default: true, ...p })
        },
        update: async (id, p) => {
          rec('portal.update', id, p)
          const target = [s.portal, s.switchPortal].find((c) => c?.id === id)
          assert.ok(target, `no portal configuration ${id}`)
          target.features = { ...target.features, ...p.features }
          return target
        },
      },
    },
    webhookEndpoints: {
      list: async (p) => page(s.endpoints, p),
      update: async (id, p) => (rec('webhookEndpoints.update', id, p), merge(find(s.endpoints, id), p)),
    },
  }
}

const quiet = () => {}
const endpoint = (extra = {}) => ({
  id: 'we_1',
  url: 'https://abc123.execute-api.us-east-1.amazonaws.com/stripe/webhook',
  enabled_events: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'],
  ...extra,
})
const price = (id, product, amount, interval, metadata = {}) => ({
  id, product, active: true, currency: 'usd', unit_amount: amount, metadata,
  type: interval ? 'recurring' : 'one_time',
  recurring: interval ? { interval, interval_count: 1, usage_type: 'licensed' } : null,
})

// Roughly the live account today: games made by the old script (tagged, one-time prices), courses
// made by hand (no metadata), Pro on $39/year, and the Developer Path bundle.
function liveLike() {
  const products = [
    { id: 'prod_cp', name: 'AWS Cloud Practitioner Prep', active: true, metadata: { plan: 'cloud-practitioner' } },
    { id: 'prod_ai', name: 'AWS AI Practitioner Prep', active: true, metadata: { plan: 'ai-practitioner' } },
    { id: 'prod_saa', name: 'AWS Solutions Architect Prep', active: true, metadata: { plan: 'solutions-architect-associate' } },
    { id: 'prod_dva', name: 'AWS Developer Associate Prep', active: true, metadata: { plan: 'developer-associate' } },
    { id: 'prod_bash', name: 'Bash for AWS', active: true, metadata: {} },
    { id: 'prod_py', name: 'Python course (Level Up)', active: true, metadata: {} }, // found through .env
    { id: 'prod_js', name: 'JavaScript for AWS', active: true, metadata: {} },
    { id: 'prod_ts', name: 'TypeScript for AWS', active: true, metadata: {} },
    { id: 'prod_pro', name: 'All-Access Bundle', active: true, metadata: { plan: 'all-access' } },
    { id: 'prod_dp', name: 'Developer Path Bundle', active: true, metadata: { plan: 'developer-path' } },
    { id: 'prod_other', name: 'Nico Tek consulting', active: true, metadata: {} },
  ]
  const prices = [
    price('price_cp_once', 'prod_cp', 999, null, { plan: 'cloud-practitioner' }),
    price('price_cp_month_hand', 'prod_cp', 1100, 'month'), // made by hand: adopted and tagged
    price('price_ai_once', 'prod_ai', 999, null, { plan: 'ai-practitioner' }),
    price('price_saa_once', 'prod_saa', 1499, null),
    price('price_dva_once', 'prod_dva', 1499, null),
    price('price_bash_once', 'prod_bash', 1999, null),
    price('price_py_once', 'prod_py', 1999, null),
    price('price_js_once', 'prod_js', 1999, null),
    price('price_ts_once', 'prod_ts', 1999, null),
    price('price_ts_eur', 'prod_ts', 1100, 'month'), // wrong currency below
    price('price_pro_39', 'prod_pro', 3900, 'year', { plan: 'all-access' }),
    price('price_dp', 'prod_dp', 5900, null, { plan: 'developer-path' }),
  ]
  prices.find((p) => p.id === 'price_ts_eur').currency = 'eur'
  return {
    products, prices, endpoints: [endpoint(), { id: 'we_other', url: 'https://example.com/hooks', enabled_events: ['invoice.paid'] }],
    portal: { id: 'bpc_1', features: { subscription_cancel: { enabled: true, mode: 'at_period_end' }, invoice_history: { enabled: true }, subscription_update: { enabled: false, products: [] } } },
  }
}
const KNOWN = { STRIPE_PRICE_PYTHON_COURSE: 'price_py_once', STRIPE_PRICE_ALL_ACCESS: 'price_pro_39', STRIPE_PRICE_DEVELOPER_PATH: 'price_dp' }

test('plan mode on an empty account changes nothing and lists every change', async () => {
  const stripe = fakeStripe({ endpoints: [endpoint()] })
  const lines = []
  const { env, problems, changes } = await setup({ stripe, log: (l) => lines.push(l) })
  assert.deepEqual(stripe.writes(), [])
  assert.deepEqual(problems, [])
  assert.ok(changes >= 10 + 19 + 3, `changes ${changes}`) // 10 products, 19 prices, 2 portal configurations, webhook
  assert.equal(Object.keys(env).length, 19)
  assert.ok(Object.values(env).every((v) => v === null))
  const out = lines.join('\n')
  assert.match(out, /WOULD create product "Bash for AWS"/)
  assert.match(out, /WOULD create price tech-spanish \$11\/month and \$69\/year/)
  assert.match(out, /WOULD create price all-access \$199\/year/)
  assert.match(out, new RegExp(`WOULD add ${WEBHOOK_EVENT} to we_1`))
  assert.ok(envLines(env).every((l) => l.startsWith('# STRIPE_PRICE_')))
})

test('apply on an empty account creates 9 products x 2 prices plus Pro, the portal and the webhook event; a second run changes nothing', async () => {
  const stripe = fakeStripe({ endpoints: [endpoint()] })
  const { env, problems } = await setup({ stripe, apply: true, log: quiet })
  assert.deepEqual(problems, [])

  const created = stripe.calls.filter((c) => c.name === 'products.create').map((c) => c.args[0])
  assert.deepEqual(created.map((p) => p.metadata.plan), [...PRODUCTS.map((p) => p.plan), 'all-access'])
  assert.equal(created.find((p) => p.metadata.plan === 'tech-spanish').name, 'Tech Spanish ↔ Tech English')

  const prices = stripe.calls.filter((c) => c.name === 'prices.create').map((c) => c.args[0])
  assert.equal(prices.length, 19)
  for (const p of PRODUCTS) {
    const m = stripe.s.prices.find((x) => x.id === env[envName(p, 'month')])
    const y = stripe.s.prices.find((x) => x.id === env[envName(p, 'year')])
    assert.deepEqual([m.unit_amount, m.currency, m.recurring.interval, m.metadata], [1100, 'usd', 'month', { plan: p.plan, interval: 'month' }])
    assert.deepEqual([y.unit_amount, y.currency, y.recurring.interval, y.metadata], [6900, 'usd', 'year', { plan: p.plan, interval: 'year' }])
    assert.equal(m.product, y.product)
  }
  const pro = stripe.s.prices.find((x) => x.id === env.STRIPE_PRICE_ALL_ACCESS_YEARLY)
  assert.deepEqual([pro.unit_amount, pro.recurring.interval, pro.metadata], [19900, 'year', { plan: 'all-access', interval: 'year' }])

  // "Manage billing" can't switch plans: its product list would let a subscriber move to any product
  assert.equal(stripe.s.portal.features.subscription_update.enabled, false)
  assert.equal(stripe.s.switchPortal.metadata.purpose, SWITCH_PORTAL_PURPOSE)
  const su = stripe.s.switchPortal.features.subscription_update
  assert.equal(su.enabled, true)
  assert.deepEqual(su.default_allowed_updates, ['price'])
  assert.equal(su.proration_behavior, 'create_prorations')
  assert.equal(su.products.length, 9)
  assert.ok(su.products.every((p) => p.prices.length === 2))
  assert.ok(!su.products.some((p) => p.prices.includes(env.STRIPE_PRICE_ALL_ACCESS_YEARLY)), 'Pro has nothing to switch to')
  assert.deepEqual(stripe.s.portal.features.subscription_cancel, { enabled: true, mode: 'at_period_end' })
  assert.equal(stripe.s.portal.features.invoice_history.enabled, true)
  assert.match(stripe.s.portal.business_profile.terms_of_service_url, /\/terms\.html$/)

  assert.deepEqual(stripe.s.endpoints[0].enabled_events, [...endpoint().enabled_events, WEBHOOK_EVENT])
  assert.ok(envLines(env).every((l) => /^STRIPE_PRICE_[A-Z_]+=price_/.test(l)))

  const again = fakeStripe(stripe.s)
  const second = await setup({ stripe: again, apply: true, log: quiet })
  assert.deepEqual(again.writes(), [])
  assert.equal(second.changes, 0)
  assert.deepEqual(second.env, env)
})

test('on the live-like account it reuses every product, adopts a hand-made price and leaves legacy prices alone', async () => {
  const stripe = fakeStripe(liveLike())
  const { env, problems } = await setup({ stripe, apply: true, known: KNOWN, log: quiet })
  assert.deepEqual(problems, [])

  // Only Tech Spanish is new.
  assert.deepEqual(stripe.calls.filter((c) => c.name === 'products.create').map((c) => c.args[0].metadata.plan), ['tech-spanish'])
  // Hand-made course products get their plan tag; Python is found through its .env price.
  const tagged = Object.fromEntries(stripe.calls.filter((c) => c.name === 'products.update').map((c) => [c.args[0], c.args[1].metadata.plan]))
  assert.deepEqual(tagged, { prod_bash: 'bash-for-aws', prod_py: 'python-for-aws', prod_js: 'javascript-for-aws', prod_ts: 'typescript-for-aws' })
  assert.equal(stripe.s.prices.find((p) => p.id === env.STRIPE_PRICE_PYTHON_COURSE_MONTHLY).product, 'prod_py')

  // The hand-made $11/month price is reused and tagged, not duplicated; the EUR one is ignored.
  assert.equal(env.STRIPE_PRICE_CLOUD_PRACTITIONER_MONTHLY, 'price_cp_month_hand')
  assert.deepEqual(stripe.s.prices.find((p) => p.id === 'price_cp_month_hand').metadata, { plan: 'cloud-practitioner', interval: 'month' })
  assert.notEqual(env.STRIPE_PRICE_TYPESCRIPT_COURSE_MONTHLY, 'price_ts_eur')

  // Pro: a new $199 price on the existing product; the $39 one is untouched.
  const pro = stripe.s.prices.find((p) => p.id === env.STRIPE_PRICE_ALL_ACCESS_YEARLY)
  assert.equal(pro.product, 'prod_pro')
  assert.equal(pro.unit_amount, PRO_YEARLY_CENTS)
  assert.equal(stripe.s.prices.find((p) => p.id === 'price_pro_39').active, true)

  // Without --archive-legacy nothing is archived.
  assert.ok(stripe.s.prices.every((p) => p.active))
  assert.ok(!stripe.calls.some((c) => c.name === 'prices.update' && c.args[1].active === false))

  // The default portal already has no switching, so it stays; only the switch configuration is new.
  // The other webhook endpoint is not touched.
  assert.equal(stripe.calls.filter((c) => c.name === 'portal.update').length, 0)
  assert.deepEqual(stripe.calls.filter((c) => c.name === 'portal.create').map((c) => c.args[0].metadata?.purpose), [SWITCH_PORTAL_PURPOSE])
  assert.deepEqual(stripe.s.endpoints[1].enabled_events, ['invoice.paid'])
  assert.ok(stripe.s.endpoints[0].enabled_events.includes(WEBHOOK_EVENT))
})

test('--archive-legacy archives the one-time prices and the Developer Path price, never the $39 Pro price', async () => {
  const stripe = fakeStripe(liveLike())
  await setup({ stripe, apply: true, archiveLegacy: true, known: KNOWN, log: quiet })
  const archived = stripe.calls.filter((c) => c.name === 'prices.update' && c.args[1].active === false).map((c) => c.args[0]).sort()
  assert.deepEqual(archived, [
    'price_ai_once', 'price_bash_once', 'price_cp_once', 'price_dp', 'price_dva_once',
    'price_js_once', 'price_py_once', 'price_saa_once', 'price_ts_once',
  ])
  assert.equal(stripe.s.prices.find((p) => p.id === 'price_pro_39').active, true)

  // Plan mode with the flag only lists them.
  const plan = fakeStripe(liveLike())
  const lines = []
  await setup({ stripe: plan, archiveLegacy: true, known: KNOWN, log: (l) => lines.push(l) })
  assert.deepEqual(plan.writes(), [])
  assert.match(lines.join('\n'), /WOULD archive price_dp \(developer-path \$59\)/)
})

test('a stale tagged price (wrong amount from an earlier run) is replaced, and archived only with --archive-legacy', async () => {
  const state = liveLike()
  state.prices.push(price('price_pro_old_run', 'prod_pro', 15000, 'year', { plan: 'all-access', interval: 'year' }))
  const stripe = fakeStripe(state)
  const { env } = await setup({ stripe, apply: true, archiveLegacy: true, known: KNOWN, log: quiet })
  assert.notEqual(env.STRIPE_PRICE_ALL_ACCESS_YEARLY, 'price_pro_old_run')
  assert.equal(stripe.s.prices.find((p) => p.id === 'price_pro_old_run').active, false)
})

test('a portal that already matches and an endpoint sending every event are left alone', async () => {
  const first = fakeStripe({ endpoints: [endpoint({ enabled_events: ['*'] })] })
  await setup({ stripe: first, apply: true, log: quiet })
  assert.ok(!first.calls.some((c) => c.name === 'webhookEndpoints.update'))
  // Same products listed in another order still match.
  first.s.switchPortal.features.subscription_update.products.reverse()
  const again = fakeStripe(first.s)
  await setup({ stripe: again, apply: true, log: quiet })
  assert.deepEqual(again.writes(), [])
})

test('no webhook endpoint: reported as a problem, never created', async () => {
  const stripe = fakeStripe({ endpoints: [{ id: 'we_fb', url: 'https://us-central1-x.cloudfunctions.net/stripeWebhook', enabled_events: [] }] })
  const { problems } = await setup({ stripe, apply: true, log: quiet })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /No webhook endpoint ending in \/stripe\/webhook/)
  assert.ok(!stripe.calls.some((c) => c.name.startsWith('webhookEndpoints')))
})

test('two plans pointing at one product is a problem, not a silent merge', async () => {
  const state = liveLike()
  state.products.find((p) => p.id === 'prod_js').name = 'Bash for AWS' // misnamed by hand
  state.products.find((p) => p.id === 'prod_bash').metadata = { plan: 'bash-for-aws' }
  state.products.find((p) => p.id === 'prod_js').metadata = { plan: 'bash-for-aws' }
  const stripe = fakeStripe(state)
  const { problems } = await setup({ stripe, known: KNOWN, log: quiet })
  assert.deepEqual(stripe.writes(), [])
  // prod_bash wins for bash; javascript finds nothing of its own and is planned as new, not merged.
  assert.deepEqual(problems, [])
  const both = fakeStripe(state)
  const { problems: p2 } = await setup({ stripe: both, known: { ...KNOWN, STRIPE_PRICE_JAVASCRIPT_COURSE: 'price_bash_once' }, log: quiet })
  assert.equal(p2.length, 1)
  assert.match(p2[0], /^javascript-for-aws: product prod_bash already belongs to bash-for-aws/)
})

test('follows Stripe pagination', async () => {
  const state = liveLike()
  for (let i = 0; i < 7; i++) state.products.unshift({ id: `prod_x${i}`, name: `Other ${i}`, active: true, metadata: {} })
  const stripe = fakeStripe({ ...state, pageSize: 2 })
  const { env } = await setup({ stripe, apply: true, known: KNOWN, log: quiet })
  assert.deepEqual(stripe.calls.filter((c) => c.name === 'products.create').map((c) => c.args[0].metadata.plan), ['tech-spanish'])
  assert.ok(stripe.calls.filter((c) => c.name === 'products.list').length >= 9)
  assert.equal(env.STRIPE_PRICE_CLOUD_PRACTITIONER_MONTHLY, 'price_cp_month_hand')
})

test('prices and names stay in step with the hub', () => {
  assert.equal(hubPrices.cents(hubPrices.PRODUCT_MONTHLY), PRODUCT_MONTHLY_CENTS)
  assert.equal(hubPrices.cents(hubPrices.PRODUCT_YEARLY), PRODUCT_YEARLY_CENTS)
  assert.equal(hubPrices.cents(hubPrices.PRO_YEARLY), PRO_YEARLY_CENTS)
  assert.deepEqual([PRODUCT_MONTHLY_CENTS, PRODUCT_YEARLY_CENTS, PRO_YEARLY_CENTS], [1100, 6900, 19900])
  const courseTitles = [...COURSES.map((c) => [`${c.id}-for-aws`, c.title]), ...OTHER_COURSES.map((c) => [c.plan, c.title])]
  for (const [plan, title] of courseTitles) assert.equal(PRODUCTS.find((p) => p.plan === plan)?.name, title, plan)
  assert.equal(PRODUCTS.length, 9)
  assert.equal(PRO.plan, 'all-access')
})

test('keyProblem: live keys only, test keys only with --test-mode', () => {
  assert.match(keyProblem(undefined, false), /Set STRIPE_SECRET_KEY/)
  assert.equal(keyProblem('sk_live_abc', false), null)
  assert.equal(keyProblem('rk_live_abc', false), null)
  assert.match(keyProblem('sk_test_abc', false), /TEST key/)
  assert.equal(keyProblem('sk_test_abc', true), null)
  assert.match(keyProblem('sk_live_abc', true), /--test-mode needs a test key/)
  assert.match(keyProblem('pk_live_abc', false), /not a Stripe secret key/)
  assert.equal(scrub('Invalid API Key provided: sk_live_****wxyz and whsec_abc'), 'Invalid API Key provided: [redacted] and [redacted]')
})

test('mergeEnv replaces in place, drops duplicates, appends the rest, keeps everything else', () => {
  const before = [
    '# Stripe',
    'STRIPE_PRICE_ALL_ACCESS=price_old39',
    'STRIPE_PRICE_BASH_COURSE_MONTHLY=price_wrong',
    'OTHER=1',
    'STRIPE_PRICE_BASH_COURSE_MONTHLY=price_dupe',
    '',
  ].join('\n')
  const after = mergeEnv(before, { STRIPE_PRICE_BASH_COURSE_MONTHLY: 'price_m', STRIPE_PRICE_ALL_ACCESS_YEARLY: 'price_y' })
  assert.equal(after, [
    '# Stripe',
    'STRIPE_PRICE_ALL_ACCESS=price_old39',
    'STRIPE_PRICE_BASH_COURSE_MONTHLY=price_m',
    'OTHER=1',
    '',
    '# Subscription prices (scripts/stripe-subscription-setup.mjs)',
    'STRIPE_PRICE_ALL_ACCESS_YEARLY=price_y',
    '',
  ].join('\n'))
  assert.equal(mergeEnv(after, { STRIPE_PRICE_BASH_COURSE_MONTHLY: 'price_m', STRIPE_PRICE_ALL_ACCESS_YEARLY: 'price_y' }), after)
  assert.deepEqual(parseEnv(after), { STRIPE_PRICE_ALL_ACCESS: 'price_old39', STRIPE_PRICE_BASH_COURSE_MONTHLY: 'price_m', OTHER: '1', STRIPE_PRICE_ALL_ACCESS_YEARLY: 'price_y' })
  assert.throws(() => mergeEnv('', { STRIPE_PRICE_X: '"price_q"' }), /Refusing/)
  assert.throws(() => mergeEnv('', { STRIPE_PRICE_X: 'price_a\nEVIL=1' }), /Refusing/)
  assert.throws(() => mergeEnv('', { PATH: 'price_a' }), /Refusing/)
})

test('writeEnvFile keeps the file mode and refuses a missing file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stripe-setup-'))
  const file = join(dir, '.env')
  writeFileSync(file, 'STRIPE_SECRET=x\n')
  chmodSync(file, 0o600)
  assert.equal(writeEnvFile(file, { STRIPE_PRICE_A_MONTHLY: 'price_1' }), true)
  assert.equal(readFileSync(file, 'utf8'), 'STRIPE_SECRET=x\n\n# Subscription prices (scripts/stripe-subscription-setup.mjs)\nSTRIPE_PRICE_A_MONTHLY=price_1\n')
  assert.equal(statSync(file).mode & 0o777, 0o600)
  assert.equal(writeEnvFile(file, { STRIPE_PRICE_A_MONTHLY: 'price_1' }), false)
  assert.throws(() => writeEnvFile(join(dir, 'missing.env'), { STRIPE_PRICE_A_MONTHLY: 'price_1' }), /does not exist/)
})

test('the command refuses a test key without --test-mode and never prints the key', () => {
  const run = (env, args = []) => {
    try {
      execFileSync(process.execPath, [SCRIPT, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8', stdio: 'pipe' })
      return { code: 0 }
    } catch (err) {
      return { code: err.status, out: `${err.stdout}${err.stderr}` }
    }
  }
  const secret = 'sk_test_51SecretValueDoNotPrint'
  const r = run({ STRIPE_SECRET_KEY: secret })
  assert.equal(r.code, 2)
  assert.match(r.out, /TEST key/)
  assert.ok(!r.out.includes(secret))
  assert.equal(run({}).code, 2)
  const w = run({ STRIPE_SECRET_KEY: secret }, ['--test-mode', '--write-env'])
  assert.equal(w.code, 2)
  assert.match(w.out, /--env-file/)
})

test('a default portal that still switches plans gets switching turned off', async () => {
  const first = fakeStripe({ endpoints: [endpoint()] })
  await setup({ stripe: first, apply: true, log: quiet })
  first.s.portal.features.subscription_update = { ...first.s.switchPortal.features.subscription_update }
  const again = fakeStripe(first.s)
  await setup({ stripe: again, apply: true, log: quiet })
  assert.deepEqual(again.writes().map((c) => [c.name, c.args[0]]), [['portal.update', first.s.portal.id]])
  assert.equal(again.s.portal.features.subscription_update.enabled, false)
})
