# Dev Track: Protocols & Backend — AWS Study Hub module

Interactive labs + flashcards for the networking/backend vocabulary in Sr. Software Engineer postings
(TCP/UDP handshake, TLS, DNS, HTTP/REST idempotency, ASP.NET Core vocabulary, MQTT, WMTS).

Same shape as the other Study Hub apps: Vite + React, static build, S3 + CloudFront.

## Run locally
    npm install
    npm run dev          # http://localhost:5173
    npm run build        # dist/

## Deploying (not wired yet)
The module lives in the repo at `aws-dev-track/` and CI builds it. To publish it, add a `dev` target to deploy.sh pointing at `aws-dev-track/dist` and a new S3 bucket + CloudFront distribution
for `private.aws-study-flashcards-app.com` (same pattern as cloud./ai.). Route 53: A record, alias to the
distribution. ACM cert in us-east-1 must cover the new subdomain (or use a wildcard *.aws-study-flashcards-app.com).

`HUB_URL` in src/App.jsx points back at the homepage. Firebase is not wired: if you want per-user progress,
import the pre-initialized `auth`/`db` from firebase.config.js (never call initializeApp again).

## Flashcard module
src/data/devTrackCards.js follows the Study Hub convention: cards are {id, front, back, hint, tags, difficulty}
with getAllDecks / getDeckById / getAllTags / getExamTrapCards. Add a deck by appending to `decks`.

## Labs (src/labs)
HandshakeLab — TCP vs UDP simulator with adjustable packet loss
TlsLab — certificate chain verification with breakable scenarios, mTLS toggle
DnsLab — recursive resolution trace, TTL/caching
IdempotencyLab — at-least-once delivery vs conditional-write handler
PickerAndTiles — protocol-picker scenario quiz; WMTS lon/lat -> z/x/y
