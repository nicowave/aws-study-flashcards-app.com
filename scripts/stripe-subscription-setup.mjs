#!/usr/bin/env node
/**
 * Stripe setup for the subscription model: every product $11/month or $69/year, Pro $199/year.
 * Replaces scripts/stripe-go-live.mjs (Firebase era).
 *
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-subscription-setup.mjs              plan only (reads Stripe, changes nothing)
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-subscription-setup.mjs --apply      make the changes
 *
 * Flags:
 *   --apply            create/tag prices, configure the Customer Portal, add the webhook event
 *   --archive-legacy   also archive (active:false) the old one-time product prices and the Developer Path
 *                      price. Existing buyers keep their access: the backend reads PURCHASE# rows, not prices.
 *   --write-env        put the STRIPE_PRICE_* lines into aws-backend/.env (replaces old values, no duplicates)
 *   --env-file <path>  a different .env (default aws-backend/.env)
 *   --test-mode        allow a test key (sandbox rehearsal). Without it only live keys run.
 *
 * What it does, idempotently (a second run finds everything and changes nothing):
 *   1. For each of the 9 products: finds the Stripe product (metadata.plan, else the product of a price
 *      already in .env, else the exact name; creates it if missing), then makes sure it has an active
 *      USD price of $11/month and $69/year tagged metadata { plan, interval }.
 *   2. Pro (all-access): makes sure the existing Pro product has a $199/year price tagged
 *      { plan: 'all-access', interval: 'year' }. The old $39 price stays (move people with
 *      scripts/migrate-pro-price.mjs).
 *   3. Customer Portal. The default configuration ("Manage billing"): cancel at period end, invoice
 *      history, NO plan switching (its product list would let a subscriber move to any other
 *      product), and members may change their email, billing address and tax ID (renewals are taxed
 *      from the saved address). A second configuration tagged metadata.purpose=interval-switch lists each product's
 *      monthly and yearly price (prorated; yearly to monthly waits for the end of the paid year); the
 *      backend uses it only for the monthly -> yearly confirm link, which shows that one change.
 *   4. Adds customer.subscription.created to the existing webhook endpoint (URL ending /stripe/webhook).
 *      It never creates an endpoint: the signing secret lives in the backend's secret.
 *   5. Checks Stripe Tax, read only: active, a default tax behavior chosen (our prices set none, so
 *      that one setting decides "plus tax" or "tax included" for all of them), and where the account
 *      is registered to collect. Without these, checkout sells without sales tax. It never changes
 *      them: they are Dashboard settings and the tax behavior is the owner's decision.
 *   6. Prints the aws-backend/.env lines.
 *
 * The key is read from the environment only and never printed. The setup key needs write access to
 * Products, Prices, Billing Portal and Webhook Endpoints, and read access to Tax settings and
 * registrations (the account's standard secret key has them); the backend's runtime key stays the
 * restricted one (scripts/update-stripe-key.sh).
 */
import { createRequire } from 'node:module'
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Prices in cents. Display copies live in each app's prices file (hub: src/data/prices.js);
// the test checks the hub's labels match these.
export const PRODUCT_MONTHLY_CENTS = 1100
export const PRODUCT_YEARLY_CENTS = 6900
export const PRO_YEARLY_CENTS = 19900

// plan id -> env name part and Stripe product name. Games keep the names the live products were
// created with; courses use their titles from the hub's src/data/courses.js. `aliases` are other
// names an existing product may have, used only to find it.
export const PRODUCTS = [
  { plan: 'cloud-practitioner', env: 'CLOUD_PRACTITIONER', name: 'AWS Cloud Practitioner Prep', aliases: ['AWS Certified Cloud Practitioner'] },
  { plan: 'ai-practitioner', env: 'AI_PRACTITIONER', name: 'AWS AI Practitioner Prep', aliases: ['AWS Certified AI Practitioner'] },
  { plan: 'solutions-architect-associate', env: 'SOLUTIONS_ARCHITECT', name: 'AWS Solutions Architect Prep', aliases: ['AWS Certified Solutions Architect – Associate'] },
  { plan: 'developer-associate', env: 'DEVELOPER_ASSOCIATE', name: 'AWS Developer Associate Prep', aliases: ['AWS Certified Developer – Associate'] },
  { plan: 'bash-for-aws', env: 'BASH_COURSE', name: 'Bash for AWS', aliases: [] },
  { plan: 'python-for-aws', env: 'PYTHON_COURSE', name: 'Python for AWS', aliases: [] },
  { plan: 'javascript-for-aws', env: 'JAVASCRIPT_COURSE', name: 'JavaScript for AWS', aliases: [] },
  { plan: 'typescript-for-aws', env: 'TYPESCRIPT_COURSE', name: 'TypeScript for AWS', aliases: [] },
  { plan: 'tech-spanish', env: 'TECH_SPANISH_COURSE', name: 'Tech Spanish ↔ Tech English', aliases: [] },
]
export const PRO = { plan: 'all-access', env: 'ALL_ACCESS', name: 'Level Up Study Hub Pro', aliases: ['All-Access Bundle', 'All-Access', 'Pro'] }
const DEVELOPER_PATH = { plan: 'developer-path', aliases: ['Developer Path', 'Developer Path Bundle'] }

export const WEBHOOK_EVENT = 'customer.subscription.created'
const WEBHOOK_PATH = /\/stripe\/webhook\/?$/
const HUB_URL = 'https://aws-study-flashcards-app.com'
// The backend finds the switch configuration by this tag (callables/index.js, SWITCH_PORTAL_PURPOSE)
export const SWITCH_PORTAL_PURPOSE = 'interval-switch'
// What members may change in Manage billing. The address matters for sales tax: renewals use it.
export const PORTAL_CUSTOMER_UPDATES = ['email', 'address', 'tax_id']
export const ACTIVE = ['active', 'trialing', 'past_due'] // same list as the callables Lambda

export const envName = (p, interval) => `STRIPE_PRICE_${p.env}_${interval === 'month' ? 'MONTHLY' : 'YEARLY'}`
const dollars = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`

// --- Small shared helpers (migrate-pro-price.mjs uses them too) ---------------------------------

/** Why this key must not be used, or null. Live keys only, unless --test-mode (then test keys only). */
export function keyProblem(key, testMode) {
  if (!key) return 'Set STRIPE_SECRET_KEY in the environment (never paste it into files or chat).'
  const live = /^(sk|rk)_live_/.test(key)
  const test = /^(sk|rk)_test_/.test(key)
  if (testMode) return test ? null : '--test-mode needs a test key (sk_test_ / rk_test_).'
  if (live) return null
  return test ? 'This is a TEST key. Pass --test-mode to rehearse in a sandbox, or use the live secret key.' : 'STRIPE_SECRET_KEY is not a Stripe secret key.'
}

/** Error text with anything that looks like a key removed. */
export const scrub = (text) => String(text).replace(/\b(sk|rk|whsec)_[A-Za-z0-9_*]+/g, '[redacted]')

/** The Stripe SDK the callables Lambda already installs (no npm install here). */
export function loadStripe(key) {
  const require = createRequire(import.meta.url)
  let mod
  try {
    mod = require('../aws-backend/lambda/callables/node_modules/stripe')
  } catch {
    throw new Error('Stripe SDK not found: run `npm ci` in aws-backend/lambda/callables first.')
  }
  const Stripe = mod.default || mod
  return new Stripe(key, { maxNetworkRetries: 2 })
}

/** KEY=value lines of a .env file (no quotes, comments skipped). */
export function parseEnv(text) {
  const out = {}
  for (const line of String(text).split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

export const DEFAULT_ENV_FILE = fileURLToPath(new URL('../aws-backend/.env', import.meta.url))
export const readEnvFile = (path) => (existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {})

/** Every item of a Stripe list call, following has_more. */
export async function listAll(list, params = {}) {
  const out = []
  let startingAfter
  for (;;) {
    const page = await list({ ...params, limit: 100, ...(startingAfter && { starting_after: startingAfter }) })
    out.push(...page.data)
    if (!page.has_more || !page.data.length) return out
    startingAfter = page.data[page.data.length - 1].id
  }
}

/**
 * .env text with `values` set: an existing KEY= line is replaced in place, later duplicates are
 * dropped, missing keys are appended under one comment. Other lines are kept as they are.
 */
export function mergeEnv(text, values) {
  for (const [k, v] of Object.entries(values)) {
    if (!/^STRIPE_PRICE_[A-Z_]+$/.test(k) || !/^price_[A-Za-z0-9]+$/.test(v)) throw new Error(`Refusing to write ${k}=${v}`)
  }
  const seen = new Set()
  const out = []
  for (const line of String(text).split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (m && Object.hasOwn(values, m[1])) {
      if (!seen.has(m[1])) out.push(`${m[1]}=${values[m[1]]}`)
      seen.add(m[1])
    } else out.push(line)
  }
  const missing = Object.keys(values).filter((k) => !seen.has(k))
  while (out.length && out[out.length - 1].trim() === '') out.pop()
  if (missing.length) out.push('', '# Subscription prices (scripts/stripe-subscription-setup.mjs)', ...missing.map((k) => `${k}=${values[k]}`))
  return out.join('\n') + '\n'
}

/** Rewrite the .env file through a temp file and a rename, keeping its permissions. */
export function writeEnvFile(path, values) {
  if (!existsSync(path)) throw new Error(`${path} does not exist. Copy aws-backend/.env from the main checkout first (it holds the other settings).`)
  const before = readFileSync(path, 'utf8')
  const after = mergeEnv(before, values)
  if (after === before) return false
  const tmp = `${path}.tmp-${process.pid}`
  writeFileSync(tmp, after, { mode: statSync(path).mode & 0o777 })
  renameSync(tmp, path)
  return true
}

// --- The setup ---------------------------------------------------------------------------------

/**
 * Plans (apply=false) or makes (apply=true) the Stripe changes. `stripe` is a Stripe client (or a
 * fake with the same methods). `known` is the parsed aws-backend/.env, used to find products whose
 * prices are already in use. Returns { env: { NAME: priceId | null }, problems: [text], changes: n }.
 */
export async function setup({ stripe, apply = false, archiveLegacy = false, known = {}, log = console.log }) {
  const problems = []
  let changes = 0
  // Every change goes through here: printed in plan mode, made in apply mode.
  const change = async (text, fn) => {
    changes++
    if (!apply) {
      log(`  WOULD ${text}`)
      return null
    }
    const result = await fn()
    log(`  DONE  ${text}`)
    return result
  }
  const ok = (text) => log(`  ok    ${text}`)

  const products = await listAll((p) => stripe.products.list(p))
  const productById = new Map(products.map((p) => [p.id, p]))
  const priceCache = new Map()
  const productOfPrice = async (priceId) => {
    if (!priceId) return null
    if (!priceCache.has(priceId)) {
      try {
        priceCache.set(priceId, await stripe.prices.retrieve(priceId))
      } catch (err) {
        log(`  note  ${priceId} from .env was not found in this Stripe account (${scrub(err.message)})`)
        priceCache.set(priceId, null)
      }
    }
    const price = priceCache.get(priceId)
    if (!price) return null
    const id = typeof price.product === 'string' ? price.product : price.product?.id
    if (!productById.has(id)) {
      const p = await stripe.products.retrieve(id)
      productById.set(id, p)
      products.push(p)
    }
    return productById.get(id)
  }
  const used = new Map() // product id -> plan, so two plans never share a product

  async function findProduct(spec, envNames) {
    const byMeta = products.filter((p) => p.metadata?.plan === spec.plan)
    let product = byMeta.find((p) => p.active) || byMeta[0]
    let how = 'metadata.plan'
    if (!product) {
      for (const name of envNames) {
        product = await productOfPrice(known[name])
        if (product) { how = `price in .env ${name}`; break }
      }
    }
    if (!product) {
      const names = [spec.name, ...spec.aliases].filter(Boolean)
      const byName = products.filter((p) => names.includes(p.name))
      product = byName.find((p) => p.active) || byName[0]
      how = 'name'
    }
    if (product && used.has(product.id)) {
      problems.push(`${spec.plan}: product ${product.id} already belongs to ${used.get(product.id)}; fix its metadata.plan in Stripe`)
      return null
    }
    if (product) used.set(product.id, spec.plan)
    return product ? { product, how } : null
  }

  async function ensureProduct(spec, envNames) {
    const found = await findProduct(spec, envNames)
    if (!found) {
      if (problems.some((p) => p.startsWith(`${spec.plan}:`))) return null
      const created = await change(`create product "${spec.name}" (metadata.plan=${spec.plan})`, () =>
        stripe.products.create({ name: spec.name, metadata: { plan: spec.plan } }))
      if (created) { products.push(created); productById.set(created.id, created); used.set(created.id, spec.plan) }
      return created
    }
    const { product, how } = found
    ok(`product ${product.id} "${product.name}" (found by ${how})`)
    if (product.metadata?.plan !== spec.plan) {
      await change(`tag product ${product.id} with metadata.plan=${spec.plan}`, () =>
        stripe.products.update(product.id, { metadata: { plan: spec.plan } }))
    }
    if (product.active === false) {
      await change(`reactivate archived product ${product.id}`, () => stripe.products.update(product.id, { active: true }))
    }
    return product
  }

  /** Active prices of a product ([] for a product that only exists in plan mode). */
  const activePrices = (product) =>
    product ? listAll((p) => stripe.prices.list(p), { product: product.id, active: true }) : Promise.resolve([])

  const fits = (pr, interval, cents) =>
    pr.active !== false && pr.currency === 'usd' && pr.type === 'recurring' &&
    pr.recurring?.interval === interval && (pr.recurring.interval_count ?? 1) === 1 &&
    (pr.recurring.usage_type ?? 'licensed') === 'licensed' && pr.unit_amount === cents

  async function ensurePrice(spec, product, prices, interval, cents) {
    const label = `${spec.plan} ${dollars(cents)}/${interval}`
    const candidates = prices.filter((pr) => fits(pr, interval, cents))
    const tagged = candidates.find((pr) => pr.metadata?.plan === spec.plan && pr.metadata?.interval === interval)
    const price = tagged || candidates[0]
    if (price) {
      ok(`${label}: ${price.id}`)
      taxBehaviors.push(price.tax_behavior || 'unspecified')
      if (!tagged) {
        await change(`tag ${price.id} with metadata plan=${spec.plan} interval=${interval}`, () =>
          stripe.prices.update(price.id, { metadata: { plan: spec.plan, interval } }))
      }
      return price.id
    }
    taxBehaviors.push('unspecified')
    const created = await change(`create price ${label} on ${product?.id || `the new "${spec.name}" product`}`, () =>
      // No tax_behavior on purpose: the default in Stripe's Tax settings decides for every price
      // ("plus tax" or "tax included"), and once set on a price it can never be changed.
      stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: cents,
        recurring: { interval },
        nickname: interval === 'month' ? 'Monthly' : 'Yearly',
        metadata: { plan: spec.plan, interval },
      }))
    return created?.id || null
  }

  const env = {}
  const legacy = [] // { price, why } to archive with --archive-legacy
  const portalProducts = []
  const taxBehaviors = [] // each sold price's own tax_behavior, 'unspecified' when the Tax default decides

  // 1. Products
  for (const spec of PRODUCTS) {
    log(`\n${spec.plan}`)
    const product = await ensureProduct(spec, [envName(spec, 'month'), envName(spec, 'year'), `STRIPE_PRICE_${spec.env}`])
    if (!product && !apply && !problems.some((p) => p.startsWith(`${spec.plan}:`))) {
      env[envName(spec, 'month')] = null
      env[envName(spec, 'year')] = null
      log(`  WOULD create price ${spec.plan} ${dollars(PRODUCT_MONTHLY_CENTS)}/month and ${dollars(PRODUCT_YEARLY_CENTS)}/year`)
      changes += 2
      taxBehaviors.push('unspecified', 'unspecified')
      continue
    }
    if (!product) continue
    const prices = await activePrices(product)
    const month = await ensurePrice(spec, product, prices, 'month', PRODUCT_MONTHLY_CENTS)
    const year = await ensurePrice(spec, product, prices, 'year', PRODUCT_YEARLY_CENTS)
    env[envName(spec, 'month')] = month
    env[envName(spec, 'year')] = year
    if (month && year) portalProducts.push({ product: product.id, prices: [month, year] })
    for (const pr of prices) {
      if (pr.type === 'one_time') legacy.push({ price: pr, why: `${spec.plan} one-time ${dollars(pr.unit_amount ?? 0)}` })
      else if (pr.metadata?.plan === spec.plan && pr.metadata?.interval && pr.id !== month && pr.id !== year) {
        legacy.push({ price: pr, why: `${spec.plan} stale ${dollars(pr.unit_amount ?? 0)}/${pr.recurring?.interval}` })
      }
    }
  }

  // 2. Pro: the existing product, a new yearly price. The old $39 price stays for its subscribers.
  log('\nall-access (Pro)')
  const proName = 'STRIPE_PRICE_ALL_ACCESS_YEARLY'
  const pro = await ensureProduct(PRO, [proName, 'STRIPE_PRICE_ALL_ACCESS'])
  if (pro) {
    const prices = await activePrices(pro)
    env[proName] = await ensurePrice(PRO, pro, prices, 'year', PRO_YEARLY_CENTS)
    for (const pr of prices) {
      if (pr.metadata?.plan === PRO.plan && pr.metadata?.interval && pr.id !== env[proName]) {
        legacy.push({ price: pr, why: `all-access stale ${dollars(pr.unit_amount ?? 0)}/${pr.recurring?.interval}` })
      }
    }
  } else {
    env[proName] = null
    if (!apply) { log(`  WOULD create price all-access ${dollars(PRO_YEARLY_CENTS)}/year`); changes++; taxBehaviors.push('unspecified') }
  }

  // Developer Path: no longer sold. Its owners keep access through PURCHASE# rows and BUNDLES.
  log('\ndeveloper-path (no longer sold)')
  const dp = (await findProduct({ ...DEVELOPER_PATH, name: null }, ['STRIPE_PRICE_DEVELOPER_PATH']))?.product
  if (dp) {
    ok(`product ${dp.id} "${dp.name}"`)
    for (const pr of await activePrices(dp)) legacy.push({ price: pr, why: `developer-path ${dollars(pr.unit_amount ?? 0)}` })
  } else ok('no Developer Path product found')

  // 3. Archive legacy prices (only when asked)
  log('\nlegacy prices')
  if (!legacy.length) ok('none active')
  for (const { price, why } of legacy) {
    if (archiveLegacy) await change(`archive ${price.id} (${why})`, () => stripe.prices.update(price.id, { active: false }))
    else log(`  keep  ${price.id} (${why}) still active; --archive-legacy archives it`)
  }

  // 4. Customer Portal
  log('\nCustomer Portal')
  if (portalProducts.length > 10) problems.push('The portal allows at most 10 products in subscription_update')
  const businessProfile = { headline: 'Level Up Study Hub', privacy_policy_url: `${HUB_URL}/privacy.html`, terms_of_service_url: `${HUB_URL}/terms.html` }
  // "Manage billing": no switching, so nobody can move a subscription to a different product
  const wantDefault = {
    subscription_update: { enabled: false },
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
    invoice_history: { enabled: true },
  }
  const [current] = (await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })).data
  // Members can correct their billing address and add a tax ID: renewals are taxed from the saved
  // address. Anything else the portal already lets them change stays.
  const customerUpdate = (have = []) => ({ enabled: true, allowed_updates: [...new Set([...have, ...PORTAL_CUSTOMER_UPDATES])] })
  if (!current) {
    await change('create the default Customer Portal configuration (cancel at period end, invoices, no plan switching, address and tax ID updates)', () =>
      stripe.billingPortal.configurations.create({
        business_profile: businessProfile,
        default_return_url: HUB_URL,
        features: { ...wantDefault, customer_update: customerUpdate() },
      }))
  } else if (defaultPortalMatches(current.features)) {
    ok(`${current.id} (default) cancels at period end, shows invoices, has no plan switching, lets members update address and tax ID`)
  } else {
    await change(`update portal ${current.id} (default): cancel at period end, invoice history, no plan switching, address and tax ID updates`, () =>
      stripe.billingPortal.configurations.update(current.id, {
        features: { ...wantDefault, customer_update: customerUpdate(current.features?.customer_update?.allowed_updates) },
      }))
  }

  // Only reached through the monthly -> yearly confirm link, which shows the one change it names
  const wantSwitch = {
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: portalProducts,
      // Yearly to monthly waits until the paid year ends, instead of a prorated credit.
      schedule_at_period_end: { conditions: [{ type: 'shortening_interval' }] },
    },
  }
  const portalReady = portalProducts.length === PRODUCTS.length
  const configs = await listAll((p) => stripe.billingPortal.configurations.list({ ...p, active: true }))
  const switcher = configs.find((c) => !c.is_default && c.metadata?.purpose === SWITCH_PORTAL_PURPOSE)
  if (!switcher) {
    if (!portalReady && apply) problems.push('Interval-switch portal configuration not created: some product prices are missing')
    else await change(`create the interval-switch portal configuration (monthly/yearly for ${PRODUCTS.length} products)`, () =>
      stripe.billingPortal.configurations.create({
        business_profile: businessProfile,
        default_return_url: HUB_URL,
        metadata: { purpose: SWITCH_PORTAL_PURPOSE },
        features: wantSwitch,
      }))
  } else if (switchPortalMatches(switcher.features, wantSwitch)) {
    ok(`${switcher.id} (interval switch) switches monthly/yearly for ${PRODUCTS.length} products`)
  } else if (!portalReady && apply) {
    problems.push('Interval-switch portal configuration not updated: some product prices are missing')
  } else {
    await change(`update portal ${switcher.id} (interval switch): monthly/yearly switching for ${PRODUCTS.length} products`, () =>
      stripe.billingPortal.configurations.update(switcher.id, { features: wantSwitch }))
  }

  // 5. Webhook event
  log('\nWebhook')
  const endpoints = (await listAll((p) => stripe.webhookEndpoints.list(p))).filter((e) => WEBHOOK_PATH.test(e.url))
  if (!endpoints.length) {
    problems.push('No webhook endpoint ending in /stripe/webhook. Not creating one: see docs/stripe-setup.md (its signing secret must go into the backend secret).')
  }
  for (const ep of endpoints) {
    const events = ep.enabled_events || []
    if (events.includes('*') || events.includes(WEBHOOK_EVENT)) ok(`${ep.id} ${ep.url} sends ${WEBHOOK_EVENT}`)
    else await change(`add ${WEBHOOK_EVENT} to ${ep.id} ${ep.url}`, () =>
      stripe.webhookEndpoints.update(ep.id, { enabled_events: [...events, WEBHOOK_EVENT] }))
  }

  // 6. Stripe Tax: read only. Checkout asks for sales tax on every sale; without these settings it
  // sells without tax (the backend falls back rather than block a sale). Dashboard → Settings → Tax.
  log('\nStripe Tax')
  let taxSettings = null
  let registrations = []
  try {
    taxSettings = await stripe.tax.settings.retrieve()
    registrations = await listAll((p) => stripe.tax.registrations.list({ ...p, status: 'active' }))
  } catch (err) {
    problems.push(`Could not read the Stripe Tax settings (${scrub(err.message)}): check Dashboard → Settings → Tax by hand.`)
  }
  if (taxSettings) {
    if (taxSettings.status === 'active') ok('Stripe Tax is active')
    else problems.push(`Stripe Tax is ${taxSettings.status || 'not set up'}, not active: checkout sells without sales tax until it is (Dashboard → Settings → Tax).`)
    const behavior = taxSettings.defaults?.tax_behavior
    if (behavior) ok(`default tax behavior: ${TAX_BEHAVIOR_WORDS[behavior] || behavior}`)
    else problems.push('Stripe Tax has no default tax behavior, and our prices set none: checkout sells without sales tax until one is chosen (Dashboard → Settings → Tax → Include tax in prices).')
    const places = registrations.map((r) => [r.country, r.country_options?.[r.country?.toLowerCase()]?.state].filter(Boolean).join('-'))
    if (places.length) ok(`registered to collect in ${places.join(', ')}`)
    else problems.push('No active Stripe Tax registration: checkout charges no sales tax anywhere (Dashboard → Tax → Registrations).')
  }
  const own = taxBehaviors.filter((b) => b !== 'unspecified').length
  log(`  note  ${taxBehaviors.length - own} of ${taxBehaviors.length} prices follow the default tax behavior${own ? `, ${own} set their own` : ''}.` +
    ' Stripe\'s tool that turns tax on for existing subscriptions needs it set on each price (docs/stripe-setup.md).')

  return { env, problems, changes }
}

// Stripe Tax's default tax behavior, in the words the Dashboard and the sites use
const TAX_BEHAVIOR_WORDS = {
  exclusive: 'exclusive (tax added on top of the price)',
  inclusive: 'inclusive (tax included in the price)',
  inferred_by_currency: 'automatic (USD prices: tax added on top)',
}

/** True when the default portal cancels at period end, shows invoices, cannot switch plans and lets
 * members update their billing address and tax ID. */
function defaultPortalMatches(features) {
  return features?.subscription_update?.enabled === false &&
    features.subscription_cancel?.enabled === true && features.subscription_cancel?.mode === 'at_period_end' &&
    features.invoice_history?.enabled === true &&
    features.customer_update?.enabled === true &&
    PORTAL_CUSTOMER_UPDATES.every((u) => features.customer_update.allowed_updates?.includes(u))
}

/** True when the switch portal already has what `want` asks for (product order does not matter). */
function switchPortalMatches(features, want) {
  const su = features?.subscription_update
  const norm = (list) => JSON.stringify((list || []).map((p) => [p.product, [...p.prices].sort()]).sort())
  const conds = (s) => JSON.stringify((s?.schedule_at_period_end?.conditions || []).map((c) => c.type).sort())
  return !!su?.enabled &&
    JSON.stringify([...(su.default_allowed_updates || [])].sort()) === JSON.stringify(['price']) &&
    su.proration_behavior === want.subscription_update.proration_behavior &&
    norm(su.products) === norm(want.subscription_update.products) &&
    conds(su) === conds(want.subscription_update)
}

/** The .env lines, in a fixed order. Unknown prices (plan mode) show as a comment. */
export function envLines(env) {
  const names = [...PRODUCTS.flatMap((p) => [envName(p, 'month'), envName(p, 'year')]), 'STRIPE_PRICE_ALL_ACCESS_YEARLY']
  return names.map((n) => (env[n] ? `${n}=${env[n]}` : `# ${n}=   (created on --apply)`))
}

// --- Command line ------------------------------------------------------------------------------

async function main(argv) {
  const has = (f) => argv.includes(f)
  const flag = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null }
  if (has('--help') || has('-h')) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\*\n?/, '').replace(/^ \* ?/gm, ''))
    return 0
  }
  const apply = has('--apply')
  const testMode = has('--test-mode')
  const envFile = flag('--env-file') || DEFAULT_ENV_FILE
  const problem = keyProblem(process.env.STRIPE_SECRET_KEY, testMode)
  if (problem) { console.error(problem); return 2 }
  if (has('--write-env') && testMode && !flag('--env-file')) {
    console.error('--write-env with --test-mode would put sandbox prices into aws-backend/.env. Pass --env-file <other file>.')
    return 2
  }

  const stripe = loadStripe(process.env.STRIPE_SECRET_KEY)
  // Sandbox price IDs never match the live ones in .env, so a rehearsal ignores them.
  const known = testMode ? {} : readEnvFile(envFile)
  console.log(`${testMode ? 'TEST mode (sandbox rehearsal)' : 'LIVE mode'}, ${apply ? 'APPLYING changes' : 'plan only (nothing changes; --apply to act)'}`)

  const { env, problems, changes } = await setup({ stripe, apply, archiveLegacy: has('--archive-legacy'), known })

  console.log(`\naws-backend/.env lines (prices only; the old STRIPE_PRICE_ALL_ACCESS, STRIPE_PRICE_DEVELOPER_PATH and one-time names stay, read as legacy):`)
  for (const line of envLines(env)) console.log(line)

  if (has('--write-env')) {
    const values = Object.fromEntries(Object.entries(env).filter(([, v]) => v))
    if (Object.keys(values).length !== Object.keys(env).length) console.log(`\nNot writing ${envFile}: some prices don't exist yet (run with --apply).`)
    else console.log(writeEnvFile(envFile, values) ? `\nWrote ${Object.keys(values).length} lines to ${envFile}` : `\n${envFile} already has these values`)
  }

  if (problems.length) {
    console.log('\nPROBLEMS')
    for (const p of problems) console.log(`  - ${p}`)
  }
  console.log(apply
    ? '\nNext: put the lines in aws-backend/.env (or --write-env), then `cd aws-backend && npx cdk deploy`.'
    : `\n${changes} change(s) planned. Run again with --apply to make them.`)
  return problems.length ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      const hint = err?.type === 'StripeAuthenticationError' ? ' (Stripe rejected the key)'
        : err?.type === 'StripePermissionError' ? ' (this key lacks a permission; use the standard secret key for setup)' : ''
      console.error(`\nStopped: ${scrub(err?.message || err)}${hint}`)
      process.exit(1)
    },
  )
}
