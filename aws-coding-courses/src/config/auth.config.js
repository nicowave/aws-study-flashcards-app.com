// AWS sign-in (Amazon Cognito) + API settings for AWS Study Hub.
// None of these are secret: they ship in every app bundle. Override per build
// with VITE_* variables if the backend is ever redeployed elsewhere.

export const AWS_REGION = 'us-east-1';

// Cognito user pool app client (public, no secret)
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '8att6q0026f6sb44qn4il7tu8';

// Branded sign-in domain (Google sign-in and the token endpoint)
export const COGNITO_AUTH_URL = import.meta.env.VITE_COGNITO_AUTH_URL || 'https://auth.aws-study-flashcards-app.com';

// HTTP API: /v1/* (profile, progress) and /callable/* (payments)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://vaj7alg0f6.execute-api.us-east-1.amazonaws.com';
export const CALLABLE_BASE_URL = `${API_BASE_URL}/callable`;

// One sign-in for every subdomain: the session cookie lives on the root domain.
// The same build is served under both names while Study Hub moves to
// levelupstudyhub.com, so the root domain is read from the address the page
// was opened on, never fixed at build time.
export const ROOT_DOMAINS = ['levelupstudyhub.com', 'aws-study-flashcards-app.com'];

/**
 * Cookie domain for a host name: '.levelupstudyhub.com' for that name and its
 * subdomains, '.aws-study-flashcards-app.com' likewise, and null for any other
 * host (preview or CloudFront addresses, or a name ending in a dot), which then
 * gets a host-only cookie.
 */
export const cookieDomainFor = (hostname) => {
  const host = String(hostname || '').toLowerCase();
  // The browser treats 'levelupstudyhub.com.' as a host of its own and refuses
  // domain=.levelupstudyhub.com there, so keep that cookie on the exact host.
  if (host.endsWith('.')) return null;
  const root = ROOT_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`));
  return root ? `.${root}` : null;
};
