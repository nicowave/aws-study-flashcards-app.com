// Sign-in on AWS (Amazon Cognito), shared by every Study Hub site.
//
// One sign-in covers all subdomains: the refresh token lives in a cookie on
// .aws-study-flashcards-app.com, and each site trades it for its own
// short-lived ID token (cached in localStorage). Signing out anywhere deletes
// the cookie, which signs you out everywhere.
//
// Email/password calls Cognito's public API directly (USER_PASSWORD_AUTH, so
// old Firebase passwords can be checked once on first sign-in). Google uses
// the hosted sign-in page with the authorization-code flow + PKCE.
import { AWS_REGION, COGNITO_CLIENT_ID, COGNITO_AUTH_URL, API_BASE_URL, COOKIE_DOMAIN } from '../config/auth.config';

const IDP_URL = `https://cognito-idp.${AWS_REGION}.amazonaws.com/`;
const SESSION_COOKIE = 'studyHubSession';
const TOKENS_KEY = 'studyHubTokens';
const OAUTH_KEY = 'studyHubOAuth';
const SESSION_DAYS = 30; // matches the refresh token lifetime

const isLocalhost = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

// ============================================
// SESSION COOKIE (refresh token, shared across subdomains)
// ============================================
const cookieScope = () =>
  isLocalhost() ? 'path=/; SameSite=Lax' : `domain=${COOKIE_DOMAIN}; path=/; Secure; SameSite=Lax`;

const setSessionCookie = (refreshToken) => {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(refreshToken)}; max-age=${SESSION_DAYS * 86400}; ${cookieScope()}`;
};

const getSessionCookie = () => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const clearSessionCookie = () => {
  document.cookie = `${SESSION_COOKIE}=; max-age=0; ${cookieScope()}`;
};

// ============================================
// TOKENS
// ============================================
export const decodeJwt = (jwt) => {
  const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
};

// Which refresh token a cached ID token came from (to notice a different sign-in elsewhere)
const tagOf = (refreshToken) => refreshToken.slice(-24);

let tokens = null; // { idToken, accessToken, expiresAt, tag }
let refreshing = null;

const saveTokens = ({ IdToken, AccessToken, RefreshToken }) => {
  if (RefreshToken) setSessionCookie(RefreshToken);
  const refreshToken = RefreshToken || getSessionCookie();
  tokens = {
    idToken: IdToken,
    accessToken: AccessToken,
    expiresAt: decodeJwt(IdToken).exp * 1000,
    tag: tagOf(refreshToken),
  };
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // private mode: the in-memory copy still works for this page
  }
  return tokens;
};

const dropLocalTokens = () => {
  tokens = null;
  try {
    localStorage.removeItem(TOKENS_KEY);
  } catch {
    // ignore
  }
};

// ============================================
// LISTENERS
// ============================================
const listeners = new Set();
let lastTag = undefined;

const notify = () => {
  const cookie = getSessionCookie();
  lastTag = cookie ? tagOf(cookie) : null;
  listeners.forEach((cb) => cb());
};

/** Calls `cb` whenever this site signs in or out, or another subdomain did. */
export const onSessionChange = (cb) => {
  if (lastTag === undefined) {
    const cookie = getSessionCookie();
    lastTag = cookie ? tagOf(cookie) : null;
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// Pick up a sign-in or sign-out that happened on another subdomain or tab
const checkForOutsideChange = () => {
  if (document.visibilityState !== 'visible' || lastTag === undefined) return;
  const cookie = getSessionCookie();
  if ((cookie ? tagOf(cookie) : null) !== lastTag) notify();
};
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', checkForOutsideChange);
  window.addEventListener('focus', checkForOutsideChange);
}

// ============================================
// COGNITO API
// ============================================
const idp = async (action, body) => {
  const res = await fetch(IDP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || `${action} failed`);
    err.code = String(json.__type || '').split('#').pop();
    throw err;
  }
  return json;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/**
 * The current tokens, refreshed when close to expiry; null when signed out.
 * Throws only on network errors (the session is kept for the next try).
 */
export const getTokens = async ({ forceRefresh = false } = {}) => {
  const refreshToken = getSessionCookie();
  if (!refreshToken) {
    dropLocalTokens();
    return null;
  }

  if (!tokens) {
    try {
      tokens = JSON.parse(localStorage.getItem(TOKENS_KEY));
    } catch {
      tokens = null;
    }
  }
  const fresh = tokens && tokens.tag === tagOf(refreshToken) && tokens.expiresAt - Date.now() > 60_000;
  if (fresh && !forceRefresh) return tokens;

  if (!refreshing) {
    refreshing = idp('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
      .then((res) => saveTokens(res.AuthenticationResult))
      .catch((err) => {
        if (err.code === 'NotAuthorizedException') {
          // Expired or revoked (signed out, password changed, account deleted)
          clearSessionCookie();
          dropLocalTokens();
          return null;
        }
        throw err;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

/** The signed-in user in the shape the apps already use, or null. */
export const userFromTokens = (t) => {
  if (!t) return null;
  const claims = decodeJwt(t.idToken);
  const identities = Array.isArray(claims.identities) ? claims.identities : [];
  const google =
    identities.some((i) => i.providerName === 'Google') || /^google_/i.test(claims['cognito:username'] || '');
  return {
    uid: claims.uid || claims.sub,
    email: claims.email || null,
    emailVerified: google || claims.email_verified === true || claims.email_verified === 'true',
    displayName: claims.name || null,
    providerData: [{ providerId: google ? 'google.com' : 'password' }],
    isAnonymous: false,
    claims,
  };
};

// ============================================
// EMAIL + PASSWORD
// ============================================
export const signInWithPassword = async (email, password) => {
  const res = await idp('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: normalizeEmail(email), PASSWORD: password },
  });
  if (!res.AuthenticationResult) {
    const err = new Error('This account needs an extra sign-in step that the app does not support');
    err.code = res.ChallengeName || 'ChallengeRequired';
    throw err;
  }
  const t = saveTokens(res.AuthenticationResult);
  notify();
  return userFromTokens(t);
};

/** Creates the account; Cognito emails a verification link. Not signed in yet. */
export const signUp = (email, password, displayName) =>
  idp('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: normalizeEmail(email),
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: normalizeEmail(email) },
      ...(displayName ? [{ Name: 'name', Value: displayName }] : []),
    ],
  });

export const resendSignUpLink = (email) =>
  idp('ResendConfirmationCode', { ClientId: COGNITO_CLIENT_ID, Username: normalizeEmail(email) });

/** Emails a reset code. Cognito answers the same way when the email is unknown. */
export const requestPasswordReset = (email) =>
  idp('ForgotPassword', { ClientId: COGNITO_CLIENT_ID, Username: normalizeEmail(email) });

export const confirmPasswordReset = (email, code, newPassword) =>
  idp('ConfirmForgotPassword', {
    ClientId: COGNITO_CLIENT_ID,
    Username: normalizeEmail(email),
    ConfirmationCode: String(code).trim(),
    Password: newPassword,
  });

export const changeAccountPassword = async (previousPassword, proposedPassword) => {
  const t = await getTokens();
  if (!t) throw Object.assign(new Error('No user signed in'), { code: 'NotSignedIn' });
  await idp('ChangePassword', {
    AccessToken: t.accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword,
  });
};

// ============================================
// GOOGLE (hosted sign-in page, code flow + PKCE)
// ============================================
const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Must match a callback URL on the app client: the site root ('/' or '/next/')
const redirectUri = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

/** Leaves the page for Google; completeGoogleSignIn() finishes on return. */
export const startGoogleSignIn = async () => {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challenge = b64url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  );
  sessionStorage.setItem(
    OAUTH_KEY,
    JSON.stringify({ verifier, state, returnTo: window.location.pathname + window.location.search })
  );
  const params = new URLSearchParams({
    identity_provider: 'Google',
    client_id: COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri(),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  window.location.assign(`${COGNITO_AUTH_URL}/oauth2/authorize?${params}`);
};

/**
 * Finishes a Google sign-in when the page loads with ?code=...&state=...
 * Returns the user, or null when this page load isn't a Google return.
 */
export const completeGoogleSignIn = async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (!code && !error) return null;

  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(OAUTH_KEY));
  } catch {
    saved = null;
  }
  if (!saved || saved.state !== url.searchParams.get('state')) return null;
  sessionStorage.removeItem(OAUTH_KEY);
  window.history.replaceState(null, '', saved.returnTo || import.meta.env.BASE_URL);

  if (error) {
    throw Object.assign(new Error('Google sign-in was cancelled'), { code: error });
  }

  const res = await fetch(`${COGNITO_AUTH_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: COGNITO_CLIENT_ID,
      code,
      redirect_uri: redirectUri(),
      code_verifier: saved.verifier,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('Google sign-in failed'), { code: json.error });

  const t = saveTokens({ IdToken: json.id_token, AccessToken: json.access_token, RefreshToken: json.refresh_token });
  notify();
  return userFromTokens(t);
};

// ============================================
// SIGN OUT
// ============================================
export const signOutEverywhere = async () => {
  const refreshToken = getSessionCookie();
  clearSessionCookie();
  dropLocalTokens();
  notify();
  if (refreshToken) {
    // Also invalidate the token server-side; signing out locally already worked
    await idp('RevokeToken', { ClientId: COGNITO_CLIENT_ID, Token: refreshToken }).catch(() => {});
  }
};

/** Forgets the session locally (e.g. after the account was deleted). */
export const forgetSession = () => {
  clearSessionCookie();
  dropLocalTokens();
  notify();
};

// ============================================
// STUDY HUB API
// ============================================
/** Calls the StudyHub API (/v1/...) as the signed-in user. */
export const apiFetch = async (path, { method = 'GET', body } = {}) => {
  const t = await getTokens();
  if (!t) throw Object.assign(new Error('Not signed in'), { status: 401 });
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${t.idToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(json?.error || `Request failed (${res.status})`), { status: res.status });
  return json;
};

/** Calls a payments function (/callable/{name}, Firebase callable protocol). */
export const callFunction = async (name, data) => {
  const t = await getTokens();
  const res = await fetch(`${API_BASE_URL}/callable/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t.idToken}` } : {}),
    },
    body: JSON.stringify({ data: data ?? null }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw Object.assign(new Error(json.error?.message || 'Request failed'), { code: json.error?.status });
  }
  return { data: json.result };
};
