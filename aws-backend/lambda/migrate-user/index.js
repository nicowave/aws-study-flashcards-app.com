// Cognito user-migration + pre-sign-up trigger.
//
// Forgot password: moves an old Firebase email/password account that never
// signed in to the new sites. The EMAIL# link copied from Firebase (verified
// accounts only) is enough to create the Cognito user; Cognito then emails the
// reset code. Google accounts need no migration: the pre-token trigger links
// them by Google ID. (Firebase itself is retired, so old passwords can no
// longer be checked; old password users reset instead.)
//
// Firebase accounts that never verified their email are not moved (the old
// sites didn't let them in either). They sign up again, and the new verified
// account picks up their old data through the email link.
//
// Pre-sign-up: refuses a new sign-up for the email of a verified Firebase
// account that hasn't moved yet. Otherwise someone could register that email
// first and, once the owner clicked the verification link, know the password.
// The owner uses "Forgot password?" instead.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const firebaseLink = async (email) =>
  (await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `EMAIL#${email}`, SK: 'UID' } }))).Item;
const isMovableFirebaseAccount = (link) => link?.source === 'firebase' && link.firebaseVerified;

async function preSignUp(event) {
  if (event.triggerSource !== 'PreSignUp_SignUp') return event; // Google and admin-created users
  const email = (event.request?.userAttributes?.email || '').trim().toLowerCase();
  if (isMovableFirebaseAccount(await firebaseLink(email))) throw new Error('ACCOUNT_EXISTS');
  return event;
}

exports.handler = async (event) => {
  if (event.triggerSource.startsWith('PreSignUp_')) return preSignUp(event);

  // Sign-in with an old password (UserMigration_Authentication) can't be
  // checked any more: fail like a wrong password, and the app points to reset.
  const email = (event.userName || '').trim().toLowerCase();
  if (event.triggerSource !== 'UserMigration_ForgotPassword' || !isMovableFirebaseAccount(await firebaseLink(email))) {
    throw new Error('NOT_MIGRATED');
  }
  event.response = { userAttributes: { email, email_verified: 'true' }, messageAction: 'SUPPRESS' };
  console.log('[migrate-user] Moved a Firebase password account for a password reset');
  return event;
};
