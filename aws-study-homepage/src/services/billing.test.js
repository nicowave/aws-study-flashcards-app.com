import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The server call is the boundary: never reach the API from a test
vi.mock('./awsAuth', () => ({ callFunction: vi.fn(), getTokens: vi.fn(), decodeJwt: vi.fn(), apiFetch: vi.fn() }));
import { callFunction, getTokens, decodeJwt, apiFetch } from './awsAuth';
import { getProTrialStatus, getEntitlements, getBillingSummary, startCheckout, PRO_TRIAL_DAYS } from './billing';
import { PRO_TRIAL_DAYS as TRIAL_FROM_PRICES } from '../data/prices';

describe('startCheckout', () => {
  let assign;
  beforeEach(() => {
    vi.mocked(callFunction).mockReset().mockResolvedValue({ data: { url: 'https://checkout.stripe.com/c/s1' } });
    assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, origin: 'https://levelupstudyhub.com', assign });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(['month', 'year'])('sends the plan, the %sly interval and the page origin, then opens the URL', async (interval) => {
    await startCheckout('cloud-practitioner', interval);
    expect(callFunction).toHaveBeenCalledWith('createCheckoutSession', {
      plan: 'cloud-practitioner', interval, returnUrl: 'https://levelupstudyhub.com',
    });
    expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/s1');
  });

  it('Pro by default, yearly', async () => {
    await startCheckout();
    expect(callFunction).toHaveBeenCalledWith('createCheckoutSession', expect.objectContaining({ plan: 'all-access', interval: 'year' }));
  });

  it('opens whatever URL the server sends back (an "already owned" return or the monthly-to-yearly switch page)', async () => {
    vi.mocked(callFunction).mockResolvedValueOnce({ data: { url: 'https://billing.stripe.com/p/session/x', switchInterval: true } });
    await startCheckout('python-for-aws', 'year');
    expect(assign).toHaveBeenCalledWith('https://billing.stripe.com/p/session/x');
  });

  it('refuses an unknown interval before calling the server, and fails when no URL comes back', async () => {
    await expect(startCheckout('cloud-practitioner', 'week')).rejects.toThrow(/interval/);
    expect(callFunction).not.toHaveBeenCalled();
    vi.mocked(callFunction).mockResolvedValueOnce({ data: {} });
    await expect(startCheckout('cloud-practitioner', 'month')).rejects.toThrow(/no checkout url/i);
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('PRO_TRIAL_DAYS', () => {
  it('is the one in prices.js', () => {
    expect(PRO_TRIAL_DAYS).toBe(TRIAL_FROM_PRICES);
  });
});

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

describe('getBillingSummary', () => {
  beforeEach(() => {
    vi.mocked(getTokens).mockReset().mockResolvedValue({ idToken: 'id-token' });
    vi.mocked(decodeJwt).mockReset().mockReturnValue({ plan: 'pro', certs: 'cloud-practitioner,bash-for-aws' });
    vi.mocked(apiFetch).mockReset();
  });

  it('adds what the API says is owned one by one and the live subscriptions, with their interval', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      entitlements: {
        allAccess: true,
        certs: ['cloud-practitioner'],
        active: [
          { plan: 'all-access', status: 'active', interval: 'year', cancelAtPeriodEnd: false, currentPeriodEnd: '2027-11-28T00:00:00.000Z', priceId: 'p1', stripeSubscriptionId: 's1' },
          { plan: 'bash-for-aws', status: 'trialing', interval: 'month' },
          { plan: 'python-for-aws', status: 'canceled', interval: 'month' }, // gone: not listed
          { plan: 'tech-spanish', status: 'active', interval: 'fortnight' },
        ],
      },
    });
    await expect(getBillingSummary()).resolves.toEqual({
      plan: 'pro',
      certs: ['cloud-practitioner', 'bash-for-aws'],
      owned: ['cloud-practitioner'],
      subscriptions: [
        { plan: 'all-access', interval: 'year', status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: '2027-11-28T00:00:00.000Z' },
        { plan: 'bash-for-aws', interval: 'month', status: 'trialing', cancelAtPeriodEnd: false, currentPeriodEnd: null },
        { plan: 'tech-spanish', interval: null, status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: null },
      ],
    });
    expect(apiFetch).toHaveBeenCalledWith('/v1/me');
  });

  it('leaves owned and subscriptions unknown (null) when the API leaves them out or fails', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ entitlements: { allAccess: false, certs: ['cloud-practitioner'] } });
    await expect(getBillingSummary()).resolves.toMatchObject({ owned: ['cloud-practitioner'], subscriptions: null });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('offline'));
    await expect(getBillingSummary()).resolves.toMatchObject({ plan: 'pro', owned: null, subscriptions: null });
  });

  it('null when signed out, without asking the API', async () => {
    vi.mocked(getTokens).mockResolvedValueOnce(null);
    await expect(getBillingSummary()).resolves.toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
