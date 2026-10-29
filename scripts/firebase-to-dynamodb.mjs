#!/usr/bin/env node
// Copies AWS Study Hub user data from Firebase (Auth + Firestore) into the
// StudyHubBackend DynamoDB table (migration step 2). Safe to re-run: Firebase
// is the source of truth until the apps switch to AWS sign-in, so every run
// overwrites the copied items with Firebase's current data.
//
// Writes, per Firebase user (uid kept as-is so links stay stable):
//   GOOGLE#<googleId>/UID    -> { uid }   links Google sign-ins to this uid
//   EMAIL#<email>/UID        -> { uid }   links password sign-ins to this uid
//   USER#<uid>/PROFILE       users/{uid} fields (displayName, avatar, stats...)
//   USER#<uid>/PROGRESS#<id> users/{uid}/progress/{certId}
//   USER#<uid>/PURCHASE#<p>  users/{uid}.purchases
//   USER#<uid>/BILLING + STRIPE#<customer>/UID   users/{uid}.stripeCustomerId
//   USER#<uid>/ENTITLEMENTS  users/{uid}.subscription + custom claims
//
// Usage (from the repo root; needs the default AWS profile):
//   node scripts/firebase-to-dynamodb.mjs --dry-run   # counts only
//   node scripts/firebase-to-dynamodb.mjs
// Prints counts only, never emails or names.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// firebase-admin and the AWS SDK come from the payments Lambda's node_modules
const require = createRequire(path.join(root, 'aws-backend/lambda/callables/index.js'));
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const REGION = 'us-east-1';
const TABLE_NAME = process.env.TABLE_NAME || 'StudyHubBackend-StudyHubTable0A6EDC4C-SNDMF3DHW662';
const DRY_RUN = process.argv.includes('--dry-run');

// Firestore Timestamps -> ISO strings, recursively
const plain = (value) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  }
  return value;
};

const emailOf = (authUser, doc) =>
  (authUser.email || authUser.providerData.find((p) => p.email)?.email || doc?.email || '').trim().toLowerCase();

async function main() {
  const secrets = JSON.parse(
    (await new SecretsManagerClient({ region: REGION }).send(new GetSecretValueCommand({ SecretId: 'study-hub/billing' })))
      .SecretString
  );
  const sa =
    typeof secrets.firebaseServiceAccount === 'string'
      ? JSON.parse(secrets.firebaseServiceAccount)
      : secrets.firebaseServiceAccount;
  initializeApp({ credential: cert(sa), projectId: sa.project_id });

  const authUsers = [];
  let pageToken;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    authUsers.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const items = [];
  const counts = { users: 0, googleIds: 0, emails: 0, profiles: 0, progress: 0, purchases: 0, billing: 0, entitlements: 0, noEmail: 0 };

  for (const authUser of authUsers) {
    counts.users++;
    const uid = authUser.uid;
    const PK = `USER#${uid}`;
    const ref = getFirestore().doc(`users/${uid}`);
    const snap = await ref.get();
    const doc = snap.exists ? plain(snap.data()) : null;

    // Firebase kept no email for Google sign-ins, so link those by Google ID
    const googleId = authUser.providerData.find((p) => p.providerId === 'google.com')?.uid;
    if (googleId) {
      items.push({ PK: `GOOGLE#${googleId}`, SK: 'UID', uid, source: 'firebase' });
      counts.googleIds++;
    }

    const email = emailOf(authUser, doc);
    if (email) {
      items.push({ PK: `EMAIL#${email}`, SK: 'UID', uid, source: 'firebase' });
      counts.emails++;
    } else if (!googleId) {
      counts.noEmail++;
    }

    if (doc) {
      const { purchases, subscription, stripeCustomerId, uid: _uid, ...profile } = doc;
      const google = authUser.providerData.some((p) => p.providerId === 'google.com');
      items.push({
        PK,
        SK: 'PROFILE',
        ...profile,
        email: profile.email || email,
        displayName: profile.displayName || profile.username || (email ? email.split('@')[0] : 'Learner'),
        createdAt: profile.createdAt || authUser.metadata.creationTime,
        authProvider: profile.authProvider || (google ? 'google' : 'password'),
        copiedFromFirebaseAt: new Date().toISOString(),
      });
      counts.profiles++;

      for (const [plan, p] of Object.entries(purchases || {})) {
        items.push({
          PK,
          SK: `PURCHASE#${plan}`,
          plan,
          sessionId: p.sessionId || null,
          amountTotal: p.amountTotal ?? null,
          purchasedAt: p.purchasedAt || null,
        });
        counts.purchases++;
      }

      if (stripeCustomerId) {
        items.push({ PK, SK: 'BILLING', stripeCustomerId, updatedAt: new Date().toISOString() });
        items.push({ PK: `STRIPE#${stripeCustomerId}`, SK: 'UID', uid });
        counts.billing++;
      }

      // Entitlements: the webhook's summary, plus whatever the claims grant
      const claims = authUser.customClaims || {};
      const certs = new Set([...(subscription?.certs || []), ...String(claims.certs || '').split(',').filter(Boolean)]);
      for (const plan of Object.keys(purchases || {})) if (plan !== 'all-access') certs.add(plan);
      const allAccess = !!subscription?.allAccess || claims.plan === 'pro' || 'all-access' in (purchases || {});
      if (allAccess || certs.size) {
        items.push({
          PK,
          SK: 'ENTITLEMENTS',
          allAccess,
          certs: [...certs],
          active: subscription?.active || [],
          updatedAt: new Date().toISOString(),
        });
        counts.entitlements++;
      }
    }

    for (const p of (await ref.collection('progress').get()).docs) {
      const { certId: _c, lastUpdated, ...stats } = plain(p.data());
      items.push({ PK, SK: `PROGRESS#${p.id}`, certId: p.id, stats, updatedAt: lastUpdated || new Date().toISOString() });
      counts.progress++;
    }
  }

  console.log(`${DRY_RUN ? '[dry run] would write' : 'Writing'} ${items.length} items:`, counts);
  if (DRY_RUN) return;

  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  for (let i = 0; i < items.length; i += 25) {
    let request = { [TABLE_NAME]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) };
    for (let attempt = 0; request && Object.keys(request).length; attempt++) {
      if (attempt > 5) throw new Error('DynamoDB kept throttling; re-run the script');
      if (attempt) await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
      const result = await ddb.send(new BatchWriteCommand({ RequestItems: request }));
      request = result.UnprocessedItems;
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('Copy failed:', err.message);
  process.exit(1);
});
