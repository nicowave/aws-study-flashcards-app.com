# Stripe setup: Level Up Study Hub

How payments are wired, and what only the account owner can do in Stripe and AWS. **Never paste keys into source files, chat, or anything that gets committed.** The backend's key lives in AWS Secrets Manager; scripts read a key from the shell environment only.

To switch the live site to subscriptions, follow [subscriptions-launch.md](subscriptions-launch.md). This page is the reference.

## The model

| What | Price | Plan id | Stripe price env names (`aws-backend/.env`) |
|---|---|---|---|
| Each certification game (4) | $11/month or $69/year | `cloud-practitioner`, `ai-practitioner`, `solutions-architect-associate`, `developer-associate` | `STRIPE_PRICE_<X>_MONTHLY`, `STRIPE_PRICE_<X>_YEARLY` |
| Each course (5) | $11/month or $69/year | `bash-for-aws`, `python-for-aws`, `javascript-for-aws`, `typescript-for-aws`, `tech-spanish` | same |
| Pro (everything above) | $199/year, 14-day free trial for first-time Pro | `all-access` | `STRIPE_PRICE_ALL_ACCESS_YEARLY` |

`<X>` is `CLOUD_PRACTITIONER`, `AI_PRACTITIONER`, `SOLUTIONS_ARCHITECT`, `DEVELOPER_ASSOCIATE`, `BASH_COURSE`, `PYTHON_COURSE`, `JAVASCRIPT_COURSE`, `TYPESCRIPT_COURSE`, `TECH_SPANISH_COURSE`. An empty or missing price shows that choice as not available (`cdk deploy` warns).

- **Everything is a subscription.** The buyer picks monthly or yearly on our page; checkout is always `mode: 'subscription'`. Products get no trial (their free modules are the trial). Pro's trial needs a card and is only for people who never had Pro (`buyerHistory` checks their purchases and every Stripe customer with their email; the hub asks the same through `proTrialStatus`).
- **Legacy, recognised but never sold:** `STRIPE_PRICE_ALL_ACCESS` (the old $39/year Pro), `STRIPE_PRICE_DEVELOPER_PATH` (the old bundle) and the one-time `STRIPE_PRICE_<X>`. Keep them in `.env`: the webhook uses them to recognise old subscriptions and sessions. Buyers of one-time unlocks and the Developer Path keep access for good (`PURCHASE#<plan>` rows; `BUNDLES` expands the bundle).
- **Display prices** are one constant file per app, never literals in components: hub `src/data/prices.js`, each game's and the courses' `src/services/prices.js` (`PRODUCT_MONTHLY`, `PRODUCT_YEARLY`, `PRO_YEARLY`, `PRO_TRIAL_DAYS`; the yearly saving is computed). The setup script's cents (`scripts/stripe-subscription-setup.mjs`) are the Stripe side. Change a price in all of them, plus `public/terms.html` and `public/llms.txt` in the hub (`prices.test.js` checks those two).

## Where things live

| Piece | Where |
|---|---|
| Checkout, portal, trial status, webhook | `aws-backend/lambda/callables/index.js` (the `CallablesFn` Lambda) |
| Who already has what | `aws-backend/lambda/callables/coverage.js` |
| Token claims (`plan: 'pro'`, `certs`) | `aws-backend/lambda/pre-token/index.js` |
| Keys | Secrets Manager `study-hub/billing` = `{ stripeApiKey, stripeWebhookSecret }` |
| Webhook URL | stack output `StripeWebhookUrl` (`<ApiUrl>/stripe/webhook`) |
| Price IDs | untracked `aws-backend/.env` (not secret; `cdk deploy` refuses to run without the file) |

## The backend's API key

The Lambda uses a **restricted key** (`rk_live_…`) with only:

| Resource | Permission |
|---|---|
| Checkout Sessions | Write |
| Customers | Write |
| Subscriptions | Read |
| Customer portal | Write |

Swap it with `./scripts/update-stripe-key.sh` (asks for the key without echoing it, saves it into the secret, restarts the Lambda). The setup and migration scripts need more (Products, Prices, Billing Portal configuration, Webhook Endpoints, and read access to Tax settings and registrations): give them the account's standard secret key (`sk_live_…`) in the shell environment for that run only.

Sales tax adds no permission: Stripe asks only for write access to the object that carries `automatic_tax` (Checkout Sessions), and Checkout itself saves the address and tax ID onto the customer. If a refusal ever names a permission, checkout still sells (without tax, see below) and the log names it; add that permission to the key.

## Webhook

Endpoint: the `StripeWebhookUrl` output. Events:

- `checkout.session.completed` (subscriptions, and legacy one-time sessions)
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

The signing secret (`whsec_…`) is `stripeWebhookSecret` in `study-hub/billing`. `stripe-subscription-setup.mjs --apply` adds `customer.subscription.created` to the existing endpoint; it never creates an endpoint. For a new endpoint: Dashboard → Developers → Webhooks → Add endpoint, the URL and events above, then put its signing secret into the secret (Secrets Manager console, or `aws secretsmanager put-secret-value` with the full JSON).

## Customer portal

`stripe-subscription-setup.mjs --apply` configures two portal configurations. The default one ("Manage billing", `createPortalSession`, linked from every app that sells): cancel at period end, invoice history, email, billing address and tax ID updates (renewals are taxed from the saved address), and no plan switching, because its product list would let a subscriber move to any other product while access followed the old one. A second configuration tagged `metadata.purpose=interval-switch` lists each product's monthly and yearly price (prorated; yearly to monthly waits for the end of the paid year); checkout uses it only for the monthly -> yearly confirm link, which shows just that change. Entitlements read the plan from the subscription's price first, so a changed price always wins over stale metadata.

## How checkout behaves

`createCheckoutSession` takes `{ plan, interval: 'month' | 'year', returnUrl }`:

- Products need `interval` ("Choose monthly or yearly" otherwise). Pro defaults to `year`; `month` is refused. `developer-path` answers "The Developer Path bundle is no longer sold".
- Answers `{ url }` (Stripe Checkout), `{ url, alreadyOwned: true }` (the account already has it: one-time purchase, bundle, Pro, or the same subscription; back to `?checkout=success&owned=1`) or `{ url, switchInterval: true }` (an active monthly subscription asking for yearly: the portal confirms the switch, so nobody pays twice). Clients just go to `url`.
- Refuses when the same email has it under another sign-in (Google vs password).
- `returnUrl` is honoured only if it is in `ALLOWED_ORIGINS`, else the old hub.
- Sales: `PROMOTIONS` applies a Stripe coupon automatically during its window (display copies in each app's `src/services/offers.js`).
- Sales tax on every session, sale price included (`CHECKOUT_TAX`): see Sales tax below.
- Metadata `{ firebaseUID, plan, interval }` goes on the session and the subscription (`firebaseUID` is our user id; the name predates AWS).

## Sales tax

Every Checkout Session asks Stripe Tax to add sales tax (`CHECKOUT_TAX` in `callables/index.js`):

- `automatic_tax: { enabled: true }`. Stripe works the tax out from the buyer's address and the product's tax code (every Study Hub product carries `txcd_20060058`, "Training Services - Self-study Web-based"; `PRODUCT_TAX_CODE` in the setup script sets it on new products and corrects any that differ. Not the generic `txcd_10000000`, which Stripe says not to use for US sales), and charges it only where the account has an active registration (Maryland and DC today). The subscription keeps automatic tax, so **every renewal is taxed** too, from the address saved on the customer.
- `billing_address_collection: 'auto'`: Checkout asks for as much address as the tax needs. Maryland and DC each have one rate, so a ZIP code is enough; `'required'` would make every buyer type a street address for nothing. Switch to `'required'` if the account registers where local rates differ inside a ZIP code.
- `customer_update: { address: 'auto', name: 'auto' }`: checkout creates customers with an email only, so this saves the address (and name) Checkout collects. Stripe refuses automatic tax for an existing customer without a saved address unless this is set.
- `tax_id_collection: { enabled: true }`: a business buyer can add its legal name and tax ID, printed on its invoices. In the US this changes no tax; an exemption is set by hand on the customer (`tax_exempt`) after the accountant has the certificate.

Prices carry no `tax_behavior` on purpose: the default in Dashboard → Settings → Tax ("Include tax in prices") decides whether $11 means $11 plus tax (exclusive, what "Automatic" picks for USD) or $11 including tax (inclusive), for every price at once. Once set on a price, a tax behavior can never be changed.

**Never blocks a sale.** If Stripe refuses the taxed session (Tax not active, no default tax behavior, a missing key permission) and the same session without tax works, the buyer checks out without tax. The subscription gets `metadata.salesTax = off` (Dashboard search: `metadata["salesTax"]:"off"`) and CloudWatch logs `SALES TAX OFF` with the reason. Turn tax on for those subscriptions once the setting is fixed. A network error or outage is thrown as before, never retried without tax.

**Before turning it on:** `STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-subscription-setup.mjs` (plan only) checks Stripe Tax read-only: active, a default tax behavior, the active registrations, and how many prices follow the default. It also plans the portal change above; `--apply` makes it.

**Subscriptions that already exist** keep billing without tax: Checkout settings only reach new sessions. To tax their renewals, use Dashboard → Tax → [Migrations](https://dashboard.stripe.com/tax/migrations) (live mode only). It needs each price's tax behavior set on the price itself and an address or an inferred location for each customer; changes start at the next billing cycle, not prorated. Or edit a subscription by hand and turn on "Collect tax automatically".

**Cost:** Stripe Tax charges per transaction (0.5% of the amount, tax included, on the pay-as-you-go plan as of November 2026), on each first payment and **each renewal**, but only where the account is registered and the amount is above zero. Free trials ($0 invoices) and buyers outside Maryland and DC cost nothing.

Entitlements: the webhook writes `USER#<uid>` / `ENTITLEMENTS` (`allAccess`, `certs` = products held one by one, bought or subscribed, `active` = the running subscriptions). The pre-token Lambda turns that into `plan: 'pro'` and, for Pro, `certs` listing all nine products. `past_due` still counts; `canceled` and `unpaid` don't. Deleting an account (`DELETE /v1/me`) answers 409 while a subscription is active, trialing or past due: cancel it in Manage billing first.

## Testing in a sandbox

1. Make a sandbox restricted key (same permissions) and a sandbox secret key.
2. Rehearse the setup: `STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-subscription-setup.mjs --test-mode --apply --write-env --env-file /tmp/sandbox.env`.
3. Script tests (fake Stripe, no network): `node --test scripts/stripe-subscription-setup.test.mjs scripts/migrate-pro-price.test.mjs`.
4. Backend tests (fake Stripe and table): `(cd aws-backend && npm test)`.
5. End to end, with a sandbox stack or after the live launch: card `4242 4242 4242 4242`, then cancel in Manage billing.

## Superseded

`scripts/stripe-go-live.mjs` is the Firebase-era setup (one-time prices, `functions/.env`). It exits without touching Stripe; use `scripts/stripe-subscription-setup.mjs`.
