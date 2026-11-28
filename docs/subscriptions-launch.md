# Launch: subscriptions everywhere + the 3-device limit

What changes for buyers: every game and every course is a subscription, **$11/month or $69/year** (they pick at checkout on our page). **Pro is $199/year**, yearly only, unlocks every game and every course, and comes with a **14-day free trial** (card required) for people who never had Pro. The Developer Path bundle is no longer sold. One-time buyers and Developer Path owners keep what they bought, for good.

What changes for every account: an account stays signed in on at most **3 devices**. A fourth sign-in works, and the device used least recently is signed out with a message.

The code is ready. These are the steps that need your AWS and Stripe accounts, in order. Run everything from the repo root on your Mac, with the **default** AWS profile. Do steps 2 and 3 on the same day, back to back.

## 0. Check the Cognito tier

The device limit needs the user pool on the **Essentials** (or Plus) feature plan. The stack sets Essentials. Check what the pool runs on today:

```bash
POOL_ID="$(aws cloudformation describe-stacks --stack-name StudyHubBackend --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)"
aws cognito-idp describe-user-pool --user-pool-id "$POOL_ID" --query UserPool.UserPoolTier --output text
```

- `ESSENTIALS`: nothing to do.
- `LITE`: the deploy in step 2 moves the pool to Essentials. Essentials is billed differently above the free monthly active users; check [Amazon Cognito pricing](https://aws.amazon.com/cognito/pricing/) against last month's active users before you go on.
- `PLUS`: stop. Change `featurePlan` in `aws-backend/lib/study-hub-stack.ts` to `cognito.FeaturePlan.PLUS` first, or the deploy downgrades the pool.

## 1. Create the prices in Stripe

`scripts/stripe-subscription-setup.mjs` makes the 18 product prices ($11/month and $69/year for each of the 9 products) and the $199/year Pro price, sets up the Customer Portal (Manage billing: cancel at period end and invoices, no plan switching; a separate configuration for the monthly-to-yearly confirm link) and adds `customer.subscription.created` to the existing webhook. It finds what already exists, so running it twice changes nothing. Without `--apply` it only reads Stripe and prints the plan.

It needs the Stripe SDK from the payment Lambda and the account's **live secret key** (`sk_live_…`: the restricted key the backend uses can't create prices). Put the key in the environment of this one shell, never in a file:

```bash
(cd aws-backend/lambda/callables && npm ci)
```

```bash
read -rs "STRIPE_SECRET_KEY?Stripe live secret key: " && export STRIPE_SECRET_KEY && echo
```

```bash
node scripts/stripe-subscription-setup.mjs
```

Read the plan: every line is `ok` (exists) or `WOULD …` (to create). If it lists **PROBLEMS** (for example two products with the same name), fix them in the Dashboard and plan again. When it looks right:

```bash
node scripts/stripe-subscription-setup.mjs --apply --write-env
```

`--write-env` puts the `STRIPE_PRICE_<X>_MONTHLY`, `STRIPE_PRICE_<X>_YEARLY` and `STRIPE_PRICE_ALL_ACCESS_YEARLY` lines into `aws-backend/.env`, replacing old values and keeping everything else. Leave the old names (`STRIPE_PRICE_ALL_ACCESS`, `STRIPE_PRICE_DEVELOPER_PATH`, the one-time `STRIPE_PRICE_<X>`) in the file: the backend reads them so old purchases and the $39 Pro subscriptions keep counting.

Rehearse first if you like: a sandbox key (`sk_test_…`) with `--test-mode`, and `--env-file <some other file>` instead of the real `.env`.

## 2. Deploy the backend

```bash
(cd aws-backend && npm test && npx cdk deploy)
```

This turns on subscription checkout (the interval is required for products), Pro covering the courses, the device limit (`maxPerUser` 3) and the "cancel first" rule for deleting an account. A warning that lists missing `STRIPE_PRICE_*` names means step 1 didn't write them all; those plans show as not available until you fix it and deploy again.

**From this moment, old pages can't sell.** The backend refuses product checkout without `interval`, and the sites still live send none. Go straight to step 3.

## 3. Deploy every site, the same day

```bash
./deploy.sh all
```

It runs each app's tests and build, then uploads the hub, the four games, the four course sites (and Tech Spanish once its site exists) and the tutorials. If one fails, fix it and deploy that one (`./deploy.sh <name>`); the others are already live.

## 4. Archive the old prices

Once the new pages are live, take the old one-time prices and the Developer Path price off sale in Stripe. Owners keep their access: the backend reads their `PURCHASE#` rows, not the prices.

```bash
node scripts/stripe-subscription-setup.mjs --archive-legacy
```

```bash
node scripts/stripe-subscription-setup.mjs --apply --archive-legacy
```

The old $39 Pro price stays active until step 5 has moved everyone off it.

## 5. Move Pro subscribers from $39 to $199

People on the old Pro price move to $199 at their next renewal, and only after you've told them. List them first (you think there are none):

```bash
node scripts/migrate-pro-price.mjs
```

If it says **Nobody to move**, you're done with this step. Otherwise:

1. Email everyone it lists: the new price, the date it first applies (their renewal date in the list), and how to cancel before then (Manage billing in Settings). Give them time before that renewal.
2. Then switch them. Nothing is charged now; the next renewal (or the end of a trial) charges $199:
   ```bash
   node scripts/migrate-pro-price.mjs --apply --notice-sent
   ```

Subscriptions already set to end, and ones on a subscription schedule, are skipped and named in the output. When nobody is left on it, you can archive the $39 price in the Dashboard.

Done with the key: `unset STRIPE_SECRET_KEY` (or close the terminal).

## 6. Check it

```bash
curl -s https://aws-study-flashcards-app.com | grep -o 'assets/index-[^"]*\.js'
```

```bash
for s in cloud ai architect developer bash python js typescript; do printf '%s ' $s; curl -s https://$s.aws-study-flashcards-app.com | grep -o 'assets/index-[^"]*\.js'; done
```

- ✓ Each bundle name matches the new build (`dist/assets/` of that app).
- ✓ The hub's plans show $11/month, $69/year (save 48%) and Pro at $199/year with the 14-day trial; nothing says one-time or Developer Path.
- ✓ **A test purchase:** on a course site, sign in with your own account, pick monthly, pay with your card. You land back with the paid lessons open, and the hub's Settings → Plan & Billing lists it. Then in the Stripe Dashboard refund the payment and cancel the subscription immediately; access drops once the webhook runs (sign out and in to see it).
- ✓ Asking for the same product again with yearly opens the billing portal to confirm the switch, not a second checkout.
- ✓ Stripe Dashboard → Webhooks: the endpoint shows recent deliveries of `checkout.session.completed` and `customer.subscription.created` with 200s.

## 7. Check the device limit

1. Sign in with one account in 4 browsers (or private windows), one after another: A, B, C, then D.
2. All four sign-ins work.
3. Go back to A (the least recently used) and reload, or switch to its tab after 10 minutes. It's signed out and says: "You were signed out on this browser because your account signed in on another device. An account can stay signed in on up to 3 devices."
4. B, C and D stay signed in. Signing out on purpose shows no such message.

Signing in again in the same browser doesn't use up a slot: the app revokes the token it replaces.
