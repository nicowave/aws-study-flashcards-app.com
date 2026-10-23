#!/bin/zsh
# Copies the payment secrets into AWS Secrets Manager (migration step 1).
#
# Builds the "study-hub/billing" secret from:
#   - STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET, read from Firebase's secret
#     store with your existing `firebase` login
#   - a Firebase service account key file you download from the Firebase
#     console (Project settings > Service accounts > Generate new private key)
#
# Nothing is printed, logged, or written to disk except into Secrets Manager.
# Usage (from the repo root):
#   ./scripts/billing-secret-to-aws.sh ~/Downloads/aws-study-hub-firebase-adminsdk-XXXX.json
set -euo pipefail

KEY_FILE="${1:-}"
SECRET_ID="study-hub/billing"

if [[ -z "$KEY_FILE" || ! -f "$KEY_FILE" ]]; then
  echo "Pass the downloaded Firebase service account file, e.g.:"
  echo "  ./scripts/billing-secret-to-aws.sh ~/Downloads/aws-study-hub-firebase-adminsdk-XXXX.json"
  exit 1
fi

echo "Reading the Stripe secrets from Firebase (values stay hidden)..."
export STRIPE_API_KEY_VALUE="$(firebase functions:secrets:access STRIPE_API_KEY)"
export STRIPE_WEBHOOK_SECRET_VALUE="$(firebase functions:secrets:access STRIPE_WEBHOOK_SECRET)"
export SA_FILE="$KEY_FILE"

[[ "$STRIPE_API_KEY_VALUE" == rk_live_* || "$STRIPE_API_KEY_VALUE" == sk_live_* ]] \
  || { echo "The Stripe key from Firebase isn't a live key. Stopping."; exit 1; }
[[ "$STRIPE_WEBHOOK_SECRET_VALUE" == whsec_* ]] \
  || { echo "The webhook secret from Firebase looks wrong. Stopping."; exit 1; }

SECRET_JSON="$(python3 -c '
import json, os
sa = json.load(open(os.environ["SA_FILE"]))
assert sa.get("type") == "service_account" and sa.get("project_id") == "aws-study-hub", "not the aws-study-hub service account file"
print(json.dumps({
  "stripeApiKey": os.environ["STRIPE_API_KEY_VALUE"],
  "stripeWebhookSecret": os.environ["STRIPE_WEBHOOK_SECRET_VALUE"],
  "firebaseServiceAccount": sa,
}))
')"

echo "Saving to AWS Secrets Manager as $SECRET_ID..."
if aws secretsmanager describe-secret --secret-id "$SECRET_ID" >/dev/null 2>&1; then
  printf '%s' "$SECRET_JSON" | aws secretsmanager put-secret-value --secret-id "$SECRET_ID" --secret-string file:///dev/stdin >/dev/null
else
  printf '%s' "$SECRET_JSON" | aws secretsmanager create-secret --name "$SECRET_ID" \
    --description "AWS Study Hub payments: Stripe key, Stripe webhook secret, Firebase service account" \
    --secret-string file:///dev/stdin >/dev/null
fi
unset STRIPE_API_KEY_VALUE STRIPE_WEBHOOK_SECRET_VALUE SECRET_JSON

rm -P "$KEY_FILE" 2>/dev/null || rm -f "$KEY_FILE"
echo "Done. The secret is stored in AWS, and the downloaded key file has been deleted."
