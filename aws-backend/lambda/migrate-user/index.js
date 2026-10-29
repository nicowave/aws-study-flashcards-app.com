// Cognito user-migration + pre-sign-up trigger.
//
// Migration: moves Firebase email/password accounts the
// first time they sign in. Cognito calls this only when the email isn't in the
// user pool yet. We check the password against Firebase's REST sign-in once;
// if it's right, Cognito creates the user with that same password, confirmed.
// Google accounts need no migration: the pre-token trigger links them by Google ID.
//
// Firebase accounts that never verified their email are not moved (the old
// sites didn't let them in either). The apps tell them to sign up again, and
// the new verified account picks up their old data through the email link.
//
// Pre-sign-up: refuses a new sign-up for the email of a verified Firebase
// account that hasn't signed in yet. Otherwise someone could register that
// email first and, once the owner clicked the verification link, know the
// password. The owner just signs in with their existing password instead.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const IDENTITY_TOOLKIT = 'https://identitytoolkit.googleapis.com/v1/accounts';

const firebase = async (method, body) => {
  const res = await fetch(`${IDENTITY_TOOLKIT}:${method}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
};

async function preSignUp(event) {
  if (event.triggerSource !== 'PreSignUp_SignUp') return event; // Google and admin-created users
  const email = (event.request?.userAttributes?.email || '').trim().toLowerCase();
  const link = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `EMAIL#${email}`, SK: 'UID' } }));
  if (link.Item?.source === 'firebase' && link.Item.firebaseVerified) throw new Error('ACCOUNT_EXISTS');
  return event;
}

exports.handler = async (event) => {
  if (event.triggerSource.startsWith('PreSignUp_')) return preSignUp(event);
  if (event.triggerSource !== 'UserMigration_Authentication') {
    // Forgot-password for an account that was never moved: nothing to do.
    throw new Error('NOT_MIGRATED');
  }

  const email = (event.userName || '').trim().toLowerCase();
  const password = event.request?.password || '';

  const signIn = await firebase('signInWithPassword', { email, password, returnSecureToken: true });
  if (!signIn.ok) {
    // Wrong password, no such user, or a Google-only account. Don't say which.
    throw new Error('Bad credentials');
  }

  const lookup = await firebase('lookup', { idToken: signIn.json.idToken });
  const fbUser = lookup.json.users?.[0];
  if (!fbUser?.emailVerified) throw new Error('UNVERIFIED_ACCOUNT');

  const userAttributes = { email, email_verified: 'true' };
  if (fbUser.displayName) userAttributes.name = fbUser.displayName;

  event.response = { userAttributes, finalUserStatus: 'CONFIRMED', messageAction: 'SUPPRESS' };
  console.log('[migrate-user] Moved a Firebase password account');
  return event;
};
