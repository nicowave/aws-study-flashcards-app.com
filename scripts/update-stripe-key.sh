#!/bin/zsh
# Swaps the live Stripe key inside the existing AWS secret "study-hub/billing"
# (the webhook secret and Firebase service account are left untouched), then
# makes the payment Lambda pick up the new key right away.
#
# Nothing is printed except the key's length and first characters.
# Usage (from the repo root):  ./scripts/update-stripe-key.sh
set -euo pipefail

SECRET_ID="study-hub/billing"

echo "Paste the new live restricted Stripe key (starts with rk_live_), then press Enter."
echo "Nothing will appear while you paste; that's expected."
read -rs "NEW_KEY?Stripe key: "
echo
if [[ "$NEW_KEY" != rk_live_* || ${#NEW_KEY} -lt 60 ]]; then
  echo "That doesn't look like a complete live restricted key (got ${#NEW_KEY} characters). Nothing was changed."
  exit 1
fi
echo "Got a ${#NEW_KEY}-character key starting with ${NEW_KEY[1,8]}."

export NEW_KEY
CURRENT="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text)"
UPDATED="$(printf '%s' "$CURRENT" | python3 -c '
import json, os, sys
d = json.load(sys.stdin)
d["stripeApiKey"] = os.environ["NEW_KEY"]
print(json.dumps(d))
')"
printf '%s' "$UPDATED" | aws secretsmanager put-secret-value --secret-id "$SECRET_ID" --secret-string file:///dev/stdin >/dev/null
unset NEW_KEY CURRENT UPDATED
echo "Saved to AWS."

# Lambda caches the secret per running copy; a configuration change starts
# fresh copies that load the new key.
FN="$(aws cloudformation describe-stack-resources --stack-name StudyHubBackend \
  --query "StackResources[?ResourceType=='AWS::Lambda::Function' && starts_with(LogicalResourceId, 'CallablesFn')].PhysicalResourceId" --output text)"
ENV_JSON="$(aws lambda get-function-configuration --function-name "$FN" --query 'Environment.Variables' --output json \
  | python3 -c 'import json,sys,time; v=json.load(sys.stdin); v["KEY_ROTATED_AT"]=str(int(time.time())); print(json.dumps({"Variables": v}))')"
aws lambda update-function-configuration --function-name "$FN" --environment "$ENV_JSON" >/dev/null
echo "Done. The payment functions will use the new key from now on."
