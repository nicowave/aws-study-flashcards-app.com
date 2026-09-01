# Stripe Setup Runbook — AWS Study Hub

The code (Cloud Functions + homepage wiring) is already in the repo. This
runbook covers the parts only the account owner can do: creating keys,
products, and the webhook in the Stripe Dashboard, and storing secrets in
Firebase. **Never paste keys into source files, chat, or anything that gets
committed** — keys go only into Firebase Secrets / `functions/.env`.

Do everything in a **sandbox** first (`rk_test_...` keys, test cards), then
repeat with live keys when ready.

## 1. Create a restricted API key (sandbox)

Dashboard → Developers → [API keys](https://dashboard.stripe.com/test/apikeys)
→ Create restricted key. Per Stripe's current guidance, use a **restricted
key (RAK)**, not the unrestricted secret key. Grant only:

| Resource            | Permission |
|---------------------|------------|
| Checkout Sessions   | Write      |
| Customers           | Write      |
| Subscriptions       | Read       |
| Billing Portal      | Write      |

Name it e.g. `aws-study-hub-functions`. Copy the `rk_test_...` value once —
you can't reveal it again after saving.

## 2. Store the key as a Firebase secret

```bash
firebase functions:secrets:set STRIPE_API_KEY
```

Paste the `rk_test_...` value when prompted. (Firebase Secret Manager is the
"secrets vault" here; the functions declare the secret and never see it in
code or env files.)

## 3. Create the products and prices

Dashboard → Product catalog → Add product. The chosen model is **$10.99/mo
per certification** (first quiz free), with an optional all-access bundle:

| Product | Price | Plan id in code |
|---|---|---|
| AWS Cloud Practitioner Prep | $10.99/mo recurring | `cloud-practitioner` |
| AWS AI Practitioner Prep | $10.99/mo recurring | `ai-practitioner` |
| All-Access (optional bundle) | e.g. $16.99/mo or $49/yr | `all-access` |

Copy each price ID (`price_...`) into `functions/.env` (price IDs are not
secrets):

```bash
cat >> functions/.env <<'ENV'
STRIPE_PRICE_CLOUD_PRACTITIONER=price_XXXXXXXX
STRIPE_PRICE_AI_PRACTITIONER=price_XXXXXXXX
STRIPE_PRICE_ALL_ACCESS=price_XXXXXXXX
ENV
```

(Leave any plan you don't sell as an empty value — checkout for it is
rejected server-side.)

## 4. Deploy functions, then create the webhook

```bash
firebase deploy --only functions
```

The deploy output prints the `stripeWebhook` URL
(`https://<region>-aws-study-hub.cloudfunctions.net/stripeWebhook` or a
`run.app` URL). Then Dashboard → Developers →
[Webhooks](https://dashboard.stripe.com/webhooks) → Add endpoint:

- **URL**: the `stripeWebhook` function URL
- **Events**: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Copy the endpoint's **signing secret** (`whsec_...` — separate from API
keys) and store it:

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase deploy --only functions
```

(The second deploy binds the new secret version.)

## 5. Enable the customer portal

Dashboard → Settings → Billing → [Customer portal](https://dashboard.stripe.com/settings/billing/portal):
enable it, allow subscription cancel, and save. `createPortalSession` fails
until this is configured once.

## 6. Lock down Firestore

The webhook writes `subscription` and `stripeCustomerId` onto
`/users/{uid}`. Clients must NOT be able to write those fields (claims are
the real enforcement surface, but don't let the display state lie). In
Firebase Console → Firestore → Rules, users' self-writes should exclude
them:

```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['subscription', 'stripeCustomerId']);
}
match /users/{userId}/progress/{certId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## 7. Turn the UI on and test end-to-end (sandbox)

In `aws-study-homepage/.env` AND each game's `.env`
(`aws-cloud-practitioner-game/.env`, `aws-ai-study-game/.env`):

```
VITE_BILLING_ENABLED=true
VITE_CERT_PRICE_LABEL=$10.99/mo
VITE_PRO_PRICE_LABEL=$16.99/mo
```

Then test the first-quiz-free funnel in a game (local or deployed):

1. Sign in with a fresh account, play one full 5-question quiz — free.
2. Start a second quiz → the **paywall screen** appears ($10.99/mo for
   this cert). The Exam Simulator paywalls immediately.
3. Subscribe with test card `4242 4242 4242 4242` → redirected back to the
   game with `?checkout=success` → quizzes and exam unlock.
4. Check Firestore `/users/{uid}.subscription` shows the cert under
   `certs`, and the other game is still paywalled (per-cert isolation) —
   unless the sub is all-access, which unlocks both.
5. Cancel via the homepage Pro card → Manage Subscription (Stripe portal);
   the webhook clears the claim at period end.

## 8. Go live (later, when ready)

1. Repeat steps 1–5 in **live mode** (`rk_live_...` key, live product/price,
   live webhook + its own `whsec_...`).
2. Update the two secrets and `functions/.env` with live values; redeploy
   functions.
3. Set `VITE_BILLING_ENABLED=true` in the homepage's production build env
   and deploy the homepage.
4. Stripe also requires public **Terms of Service** and **Privacy Policy**
   pages — add them before flipping live.
5. Recommended hardening from Stripe's key docs: add an access policy to
   the live RAK, and rotate keys if anyone with access leaves.

## Design notes (for whoever touches this next)

- **Entitlement source of truth**: Firebase custom claims (`plan: 'pro'`),
  set only by the webhook. `exchangeToken` forwards claims into the custom
  token so entitlements survive cross-subdomain SSO. The Firestore
  `subscription` map is display-only.
- `past_due` still counts as entitled (grace period); `canceled`/`unpaid`
  drop the claim.
- Clients read the plan via `getIdTokenResult()` (`billing.js#getPlan`),
  with a forced refresh after checkout returns.
- The games don't gate anything on `plan` yet — premium gating lands with
  the expanded question banks (which must be served from
  Firestore/functions, not bundled JS, to be enforceable).
