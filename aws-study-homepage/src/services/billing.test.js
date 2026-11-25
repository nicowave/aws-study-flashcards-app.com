import { describe, it, expect, vi, beforeEach } from 'vitest';

// The server call is the boundary: never reach the API from a test
vi.mock('./awsAuth', () => ({ callFunction: vi.fn(), getTokens: vi.fn(), decodeJwt: vi.fn() }));
import { callFunction, getTokens, decodeJwt } from './awsAuth';
import { getProTrialStatus, getEntitlements } from './billing';

describe('getProTrialStatus', () => {
  beforeEach(() => vi.mocked(callFunction).mockReset());

  it('asks the proTrialStatus function and returns its true/false answer', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { trialAvailable: true } });
    await expect(getProTrialStatus()).resolves.toBe(true);
    expect(callFunction).toHaveBeenCalledWith('proTrialStatus', {});
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { trialAvailable: false } });
    await expect(getProTrialStatus()).resolves.toBe(false);
  });

  it('returns null (unknown) when the server does not know or the call fails, so the card promises nothing', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { trialAvailable: null } });
    await expect(getProTrialStatus()).resolves.toBeNull();
    vi.mocked(callFunction).mockResolvedValueOnce({ data: {} });
    await expect(getProTrialStatus()).resolves.toBeNull();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(callFunction).mockRejectedValueOnce(new Error('offline'));
    await expect(getProTrialStatus()).resolves.toBeNull();
  });
});

describe('getEntitlements', () => {
  beforeEach(() => {
    vi.mocked(getTokens).mockReset().mockResolvedValue({ idToken: 'id-token' });
    vi.mocked(decodeJwt).mockReset();
  });

  it('reads the plan and the comma-separated certs claim from the ID token', async () => {
    vi.mocked(decodeJwt).mockReturnValue({ plan: 'pro', certs: 'developer-associate, bash-for-aws' });
    await expect(getEntitlements()).resolves.toEqual({ plan: 'pro', certs: ['developer-associate', 'bash-for-aws'] });
    expect(decodeJwt).toHaveBeenCalledWith('id-token');
  });

  it('no plan and no purchases: plan null and an empty list', async () => {
    vi.mocked(decodeJwt).mockReturnValue({ sub: 'u1' });
    await expect(getEntitlements()).resolves.toEqual({ plan: null, certs: [] });
  });

  it('null when signed out or the token cannot be read', async () => {
    vi.mocked(getTokens).mockResolvedValueOnce(null);
    await expect(getEntitlements()).resolves.toBeNull();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(getTokens).mockRejectedValueOnce(new Error('expired'));
    await expect(getEntitlements()).resolves.toBeNull();
  });
});
