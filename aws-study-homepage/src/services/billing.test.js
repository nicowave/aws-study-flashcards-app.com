import { describe, it, expect, vi, beforeEach } from 'vitest';

// The server call is the boundary: never reach the API from a test
vi.mock('./awsAuth', () => ({ callFunction: vi.fn(), getTokens: vi.fn(), decodeJwt: vi.fn() }));
// Pretend the page was opened on a third name, so we can see the hub address go through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example'),
}));
import { callFunction, getTokens, decodeJwt } from './awsAuth';
import { getProTrialStatus, getEntitlements, getBillingAccountStatus, openBillingPortal, portalErrorMessage } from './billing';

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

describe('getBillingAccountStatus', () => {
  beforeEach(() => vi.mocked(callFunction).mockReset());

  it('asks the billingStatus function and returns its true/false answer', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { hasBillingAccount: false } });
    await expect(getBillingAccountStatus()).resolves.toBe(false);
    expect(callFunction).toHaveBeenCalledWith('billingStatus', {});
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { hasBillingAccount: true } });
    await expect(getBillingAccountStatus()).resolves.toBe(true);
  });

  it('null (unknown, so the Manage button stays) for an odd answer or a failed call, an older backend included', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: {} });
    await expect(getBillingAccountStatus()).resolves.toBeNull();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(callFunction).mockRejectedValueOnce(Object.assign(new Error('Unknown function'), { code: 'NOT_FOUND' }));
    await expect(getBillingAccountStatus()).resolves.toBeNull();
    vi.mocked(callFunction).mockRejectedValueOnce(new Error('offline'));
    await expect(getBillingAccountStatus()).resolves.toBeNull();
  });
});

describe('portalErrorMessage', () => {
  const fallback = 'Could not open billing portal. Please try again.';
  // callFunction throws the server's message with its status as `code`
  const refused = (code, message) => Object.assign(new Error(message), { code });

  it("shows the server's own reason when it refused on purpose", () => {
    expect(portalErrorMessage(refused('FAILED_PRECONDITION', 'This account has no billing to manage.'), fallback)).toBe('This account has no billing to manage.');
    expect(portalErrorMessage(refused('UNAUTHENTICATED', 'Invalid or expired sign-in'), fallback)).toBe('Invalid or expired sign-in');
  });

  it('falls back to "try again" when offline or when the server crashed', () => {
    expect(portalErrorMessage(new Error('Failed to fetch'), fallback)).toBe(fallback);
    expect(portalErrorMessage(refused('INTERNAL', 'Internal error'), fallback)).toBe(fallback);
    expect(portalErrorMessage(refused('FAILED_PRECONDITION', ''), fallback)).toBe(fallback);
    expect(portalErrorMessage(undefined, fallback)).toBe(fallback);
  });
});

describe('openBillingPortal', () => {
  beforeEach(() => vi.mocked(callFunction).mockReset());

  it('asks Stripe to send the member back to the hub on the name the page was opened on', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: {} }); // no portal address, so nothing navigates
    await expect(openBillingPortal()).rejects.toThrow('No portal URL returned');
    expect(callFunction).toHaveBeenCalledTimes(1);
    expect(callFunction).toHaveBeenCalledWith('createPortalSession', { returnUrl: 'https://page-name.example' });
  });
});
