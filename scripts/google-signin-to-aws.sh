#!/bin/zsh
# Stores the "Sign in with Google" credentials for AWS sign-in (migration step 2).
#
# Takes the JSON file Google Cloud lets you download after creating the OAuth
# client (APIs & Services > Credentials), saves its client ID and client secret
# to AWS Secrets Manager as "study-hub/google-oauth", then deletes the file.
# Nothing secret is printed.
#
# Usage (from the repo root):
#   ./scripts/google-signin-to-aws.sh ~/Downloads/client_secret_XXXX.apps.googleusercontent.com.json
set -euo pipefail

FILE="${1:-}"
SECRET_ID="study-hub/google-oauth"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Pass the file you downloaded from Google, e.g.:"
  echo "  ./scripts/google-signin-to-aws.sh ~/Downloads/client_secret_XXXX.apps.googleusercontent.com.json"
  exit 1
fi

export GFILE="$FILE"
SECRET_JSON="$(python3 -c '
import json, os, sys
d = json.load(open(os.environ["GFILE"]))
web = d.get("web") or {}
cid, csec = web.get("client_id", ""), web.get("client_secret", "")
if not cid.endswith(".apps.googleusercontent.com") or len(csec) < 20:
    sys.exit("This does not look like a Google web OAuth client file. Nothing was saved.")
redirects = web.get("redirect_uris", [])
if "https://auth.aws-study-flashcards-app.com/oauth2/idpresponse" not in redirects:
    print("Warning: the redirect address https://auth.aws-study-flashcards-app.com/oauth2/idpresponse is missing in Google; add it there.", file=sys.stderr)
print(json.dumps({"clientId": cid, "clientSecret": csec}))
')"
CLIENT_ID_SHOWN="$(printf '%s' "$SECRET_JSON" | python3 -c 'import json,sys; c=json.load(sys.stdin)["clientId"]; print(c[:12] + "…")')"

if aws secretsmanager describe-secret --secret-id "$SECRET_ID" >/dev/null 2>&1; then
  printf '%s' "$SECRET_JSON" | aws secretsmanager put-secret-value --secret-id "$SECRET_ID" --secret-string file:///dev/stdin >/dev/null
else
  printf '%s' "$SECRET_JSON" | aws secretsmanager create-secret --name "$SECRET_ID" \
    --description "AWS Study Hub: Google OAuth client for Cognito sign-in" \
    --secret-string file:///dev/stdin >/dev/null
fi
unset SECRET_JSON

rm -f "$FILE"
echo "Done. Google sign-in client ($CLIENT_ID_SHOWN) is stored in AWS, and the downloaded file has been deleted."
