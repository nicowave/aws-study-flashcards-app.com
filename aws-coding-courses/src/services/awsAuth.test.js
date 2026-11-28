// @vitest-environment jsdom
// The device limit on the client: a revoked refresh token leaves a one-time
// "signed out because of the device limit" reason, and this browser never
// keeps two of the account's sessions. awsAuth.js is identical in every app
// (the hub adds two lines), so this one test covers all six copies.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fakeJwt = (claims = {}) =>
  `${b64url({ alg: 'none' })}.${b64url({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600, ...claims })}.sig`;

const cookieValue = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};
const setCookie = (name, value) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
};
const clearCookies = () => {
  for (const part of document.cookie.split('; ')) {
    const name = part.split('=')[0];
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  }
};

const ok = (json) => ({ ok: true, json: async () => json });
const fail = (type, message) => ({ ok: false, json: async () => ({ __type: type, message }) });
const tokensResult = (refreshToken) => ({
  AuthenticationResult: { IdToken: fakeJwt(), AccessToken: 'access', ...(refreshToken ? { RefreshToken: refreshToken } : {}) },
});

// Each call: { target: 'InitiateAuth' | 'RevokeToken' | ..., body }
const callsOf = (fetchMock) =>
  fetchMock.mock.calls.map(([, init]) => ({
    target: String(init.headers['X-Amz-Target'] || '').split('.').pop(),
    body: JSON.parse(init.body),
  }));

let auth;
let fetchMock;

beforeEach(async () => {
  clearCookies();
  localStorage.clear();
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  auth = await import('./awsAuth.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('takeSignOutReason', () => {
  it('is null when nothing signed this browser out', () => {
    expect(auth.takeSignOutReason()).toBeNull();
  });

  it('returns the reason once, then forgets it', () => {
    setCookie('studyHubSignedOut', 'device-limit');
    expect(auth.takeSignOutReason()).toBe('device-limit');
    expect(cookieValue('studyHubSignedOut')).toBeNull();
    expect(auth.takeSignOutReason()).toBeNull();
  });
});

describe('isRevokedRefreshError', () => {
  it('matches Cognito\'s "Refresh Token has been revoked" only', () => {
    const err = (code, message) => Object.assign(new Error(message), { code });
    expect(auth.isRevokedRefreshError(err('NotAuthorizedException', 'Refresh Token has been revoked'))).toBe(true);
    expect(auth.isRevokedRefreshError(err('NotAuthorizedException', 'refresh token has been REVOKED.'))).toBe(true);
    expect(auth.isRevokedRefreshError(err('NotAuthorizedException', 'Refresh Token has expired'))).toBe(false);
    expect(auth.isRevokedRefreshError(err('NotAuthorizedException', 'Invalid Refresh Token'))).toBe(false);
    expect(auth.isRevokedRefreshError(err('TooManyRequestsException', 'revoked'))).toBe(false);
    expect(auth.isRevokedRefreshError(null)).toBe(false);
  });
});

describe('getTokens when Cognito refuses the refresh token', () => {
  it('signs out and leaves the device-limit reason when the token was revoked', async () => {
    setCookie('studyHubSession', 'rt-evicted');
    fetchMock.mockResolvedValueOnce(fail('NotAuthorizedException', 'Refresh Token has been revoked'));
    const changed = vi.fn();
    auth.onSessionChange(changed);

    await expect(auth.getTokens()).resolves.toBeNull();

    expect(cookieValue('studyHubSession')).toBeNull();
    expect(changed).toHaveBeenCalled(); // the page hears about it right away
    expect(auth.takeSignOutReason()).toBe('device-limit');
  });

  it('signs out without a reason when the token merely expired', async () => {
    setCookie('studyHubSession', 'rt-old');
    fetchMock.mockResolvedValueOnce(fail('NotAuthorizedException', 'Refresh Token has expired'));

    await expect(auth.getTokens()).resolves.toBeNull();

    expect(cookieValue('studyHubSession')).toBeNull();
    expect(auth.takeSignOutReason()).toBeNull();
  });

  it('keeps the session on other errors', async () => {
    setCookie('studyHubSession', 'rt-1');
    fetchMock.mockResolvedValueOnce(fail('InternalErrorException', 'try again'));

    await expect(auth.getTokens()).rejects.toThrow('try again');

    expect(cookieValue('studyHubSession')).toBe('rt-1');
    expect(auth.takeSignOutReason()).toBeNull();
  });

  it('moves on to the new session when this browser signed in again during the refresh', async () => {
    setCookie('studyHubSession', 'rt-replaced');
    fetchMock
      .mockImplementationOnce(async () => {
        // Another tab signed in meanwhile, which revoked the token this refresh sent
        setCookie('studyHubSession', 'rt-new');
        return fail('NotAuthorizedException', 'Refresh Token has been revoked');
      })
      .mockResolvedValueOnce(ok(tokensResult()));

    const t = await auth.getTokens();

    expect(t).not.toBeNull();
    expect(cookieValue('studyHubSession')).toBe('rt-new');
    expect(auth.takeSignOutReason()).toBeNull();
    const calls = callsOf(fetchMock);
    expect(calls.map((c) => c.body.AuthParameters?.REFRESH_TOKEN)).toEqual(['rt-replaced', 'rt-new']);
  });
});

describe('one browser, one session', () => {
  it('a new sign-in revokes the refresh token it replaces and clears an old notice', async () => {
    setCookie('studyHubSession', 'rt-before');
    setCookie('studyHubSignedOut', 'device-limit');
    fetchMock.mockImplementation(async (url, init) =>
      init.headers['X-Amz-Target'].endsWith('InitiateAuth') ? ok(tokensResult('rt-after')) : ok({})
    );

    await auth.signInWithPassword('Me@Example.com', 'secret1');

    expect(cookieValue('studyHubSession')).toBe('rt-after');
    expect(cookieValue('studyHubSignedOut')).toBeNull();
    const revokes = callsOf(fetchMock).filter((c) => c.target === 'RevokeToken');
    expect(revokes.map((c) => c.body.Token)).toEqual(['rt-before']);
  });

  it('signing in on a signed-out browser revokes nothing', async () => {
    fetchMock.mockResolvedValue(ok(tokensResult('rt-first')));

    await auth.signInWithPassword('me@example.com', 'secret1');

    expect(callsOf(fetchMock).some((c) => c.target === 'RevokeToken')).toBe(false);
  });

  it('verifyPassword keeps the session the check created and revokes the one it replaces', async () => {
    // At the device cap the check can evict this browser's old session, so the new one must stay
    setCookie('studyHubSession', 'rt-mine');
    fetchMock.mockImplementation(async (url, init) =>
      init.headers['X-Amz-Target'].endsWith('InitiateAuth') ? ok(tokensResult('rt-check')) : ok({})
    );

    await auth.verifyPassword('me@example.com', 'secret1');
    await vi.waitFor(() => expect(callsOf(fetchMock).some((c) => c.target === 'RevokeToken')).toBe(true));

    expect(cookieValue('studyHubSession')).toBe('rt-check');
    const revokes = callsOf(fetchMock).filter((c) => c.target === 'RevokeToken');
    expect(revokes.map((c) => c.body.Token)).toEqual(['rt-mine']);
  });

  it('verifyPassword rejects a wrong password', async () => {
    setCookie('studyHubSession', 'rt-mine');
    fetchMock.mockResolvedValueOnce(fail('NotAuthorizedException', 'Incorrect username or password.'));

    await expect(auth.verifyPassword('me@example.com', 'nope')).rejects.toMatchObject({ code: 'NotAuthorizedException' });
    expect(cookieValue('studyHubSession')).toBe('rt-mine');
  });
});

describe('signing out yourself', () => {
  it('never leaves the device-limit notice', async () => {
    setCookie('studyHubSession', 'rt-1');
    setCookie('studyHubSignedOut', 'device-limit');
    fetchMock.mockResolvedValue(ok({}));

    await auth.signOutEverywhere();

    expect(cookieValue('studyHubSession')).toBeNull();
    expect(auth.takeSignOutReason()).toBeNull();
    expect(callsOf(fetchMock).map((c) => c.target)).toEqual(['RevokeToken']);
  });
});

describe('refresh on focus', () => {
  it('re-checks a session last refreshed over 10 minutes ago, so an evicted device signs out', async () => {
    setCookie('studyHubSession', 'rt-stale');
    // Cached tokens, still valid, but last refreshed 11 minutes ago
    localStorage.setItem('studyHubTokens', JSON.stringify({
      idToken: fakeJwt(), accessToken: 'a', expiresAt: Date.now() + 30 * 60_000,
      tag: 'rt-stale'.slice(-24), refreshedAt: Date.now() - 11 * 60_000,
    }));
    await auth.getTokens(); // loads the cache without calling Cognito
    expect(fetchMock).not.toHaveBeenCalled();

    const changed = vi.fn();
    auth.onSessionChange(changed);
    fetchMock.mockResolvedValueOnce(fail('NotAuthorizedException', 'Refresh Token has been revoked'));

    window.dispatchEvent(new Event('focus'));
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());

    expect(cookieValue('studyHubSession')).toBeNull();
    expect(auth.takeSignOutReason()).toBe('device-limit');
  });

  it('leaves a recently refreshed session alone', async () => {
    setCookie('studyHubSession', 'rt-fresh');
    fetchMock.mockResolvedValueOnce(ok(tokensResult()));
    await auth.getTokens({ forceRefresh: true });
    auth.onSessionChange(() => {});
    fetchMock.mockClear();

    window.dispatchEvent(new Event('focus'));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the message', () => {
  it('reads the same on course sites (through t()) as on the hub and games', async () => {
    const { SIGN_OUT_MESSAGES } = await import('./sharedAuth.js');
    const { STRINGS } = await import('../engine/i18n.js');
    expect(STRINGS.en['auth.signedOutDeviceLimit']).toBe(SIGN_OUT_MESSAGES['device-limit']);
    expect(STRINGS.es['auth.signedOutDeviceLimit']).toMatch(/otro dispositivo/);
  });
});
