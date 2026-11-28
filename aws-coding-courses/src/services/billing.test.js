import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const auth = vi.hoisted(() => ({ getTokens: vi.fn(), decodeJwt: vi.fn(), callFunction: vi.fn() }));
vi.mock('./awsAuth', () => auth);

const { hasCourseAccess, startCheckout, openBillingPortal, getBillingAccountStatus, portalErrorKey } = await import('./billing');
const { PRODUCT_MONTHLY, PRODUCT_YEARLY, YEARLY_SAVINGS_PERCENT, cents } = await import('./prices');

const claims = (c) => {
  auth.getTokens.mockResolvedValue({ idToken: 'id' });
  auth.decodeJwt.mockReturnValue(c);
};

describe('prices', () => {
  it('computes the yearly saving from the two prices', () => {
    const expected = Math.round((1 - cents(PRODUCT_YEARLY) / (12 * cents(PRODUCT_MONTHLY))) * 100);
    expect(YEARLY_SAVINGS_PERCENT).toBe(expected);
    expect(YEARLY_SAVINGS_PERCENT).toBeGreaterThan(0);
  });
});

describe('hasCourseAccess', () => {
  beforeEach(() => vi.resetAllMocks());

  it('opens the course for Pro, even before the token lists every course', async () => {
    claims({ plan: 'pro', certs: '' });
    expect(await hasCourseAccess('bash-for-aws')).toBe(true);
  });

  it('opens the course when certs lists it (subscription or an earlier one-time purchase)', async () => {
    claims({ certs: 'developer-associate, bash-for-aws' });
    expect(await hasCourseAccess('bash-for-aws')).toBe(true);
    expect(await hasCourseAccess('python-for-aws')).toBe(false);
  });

  it('stays locked when signed out or the token is unreadable', async () => {
    auth.getTokens.mockResolvedValue(null);
    expect(await hasCourseAccess('bash-for-aws')).toBe(false);
    auth.getTokens.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await hasCourseAccess('bash-for-aws')).toBe(false);
  });
});

describe('checkout and the billing portal', () => {
  const assign = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('window', { location: { origin: 'https://bash.levelupstudyhub.com', assign } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the plan, the billing period and this site as the way back', async () => {
    auth.callFunction.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/x' } });
    await startCheckout('bash-for-aws', 'month', '/log-detective/');
    expect(auth.callFunction).toHaveBeenCalledWith('createCheckoutSession', {
      plan: 'bash-for-aws',
      interval: 'month',
      returnUrl: 'https://bash.levelupstudyhub.com/log-detective',
    });
    expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/x');
  });

  it('refuses an unknown period, and Pro monthly', async () => {
    await expect(startCheckout('bash-for-aws', 'week')).rejects.toThrow(/interval/);
    await expect(startCheckout('all-access', 'month')).rejects.toThrow(/yearly/);
    expect(auth.callFunction).not.toHaveBeenCalled();
  });

  it('opens whatever URL the server answers with (already owned, switch to yearly)', async () => {
    auth.callFunction.mockResolvedValue({ data: { url: 'https://bash.levelupstudyhub.com/?checkout=success&owned=1', alreadyOwned: true } });
    await startCheckout('all-access', 'year');
    expect(assign).toHaveBeenCalledWith('https://bash.levelupstudyhub.com/?checkout=success&owned=1');
  });

  it('opens the Stripe portal and comes back to this site', async () => {
    auth.callFunction.mockResolvedValue({ data: { url: 'https://billing.stripe.com/p' } });
    await openBillingPortal('/');
    expect(auth.callFunction).toHaveBeenCalledWith('createPortalSession', { returnUrl: 'https://bash.levelupstudyhub.com' });
    expect(assign).toHaveBeenCalledWith('https://billing.stripe.com/p');
  });
});

describe('getBillingAccountStatus', () => {
  beforeEach(() => vi.resetAllMocks());
  let user = 0;
  const signedIn = () => claims({ sub: `user-${++user}` }); // a new account per test, so no answer is reused

  it('asks the billingStatus function once per account and returns its true/false answer', async () => {
    signedIn();
    auth.callFunction.mockResolvedValue({ data: { hasBillingAccount: false } });
    expect(await getBillingAccountStatus()).toBe(false);
    expect(await getBillingAccountStatus()).toBe(false); // the footer and the course page share one answer
    expect(auth.callFunction).toHaveBeenCalledTimes(1);
    expect(auth.callFunction).toHaveBeenCalledWith('billingStatus', {});
    signedIn(); // someone else signed in on this page
    auth.callFunction.mockResolvedValue({ data: { hasBillingAccount: true } });
    expect(await getBillingAccountStatus()).toBe(true);
    expect(auth.callFunction).toHaveBeenCalledTimes(2);
  });

  it('null (unknown, so the button stays) when signed out, for an odd answer or a failed call, and asks again after a failure', async () => {
    auth.getTokens.mockResolvedValue(null);
    expect(await getBillingAccountStatus()).toBeNull();
    expect(auth.callFunction).not.toHaveBeenCalled();
    signedIn();
    auth.callFunction.mockResolvedValueOnce({ data: {} });
    expect(await getBillingAccountStatus()).toBeNull();
    signedIn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    auth.callFunction.mockRejectedValueOnce(Object.assign(new Error('Unknown function'), { code: 'NOT_FOUND' }));
    expect(await getBillingAccountStatus()).toBeNull();
    auth.callFunction.mockResolvedValueOnce({ data: { hasBillingAccount: true } });
    expect(await getBillingAccountStatus()).toBe(true);
  });
});

describe('portalErrorKey', () => {
  // callFunction throws the server's message with its status as `code`
  const refused = (code, message) => Object.assign(new Error(message), { code });

  it('says there is no billing to manage when the server refused for that reason', () => {
    expect(portalErrorKey(refused('FAILED_PRECONDITION', 'This account has no billing to manage: nothing on it was bought through Stripe.'))).toBe('billing.none');
  });

  it('says "try again" when offline, signed out or when the server crashed', () => {
    expect(portalErrorKey(new Error('Failed to fetch'))).toBe('billing.failed');
    expect(portalErrorKey(refused('INTERNAL', 'Internal error'))).toBe('billing.failed');
    expect(portalErrorKey(refused('UNAUTHENTICATED', 'Sign in first'))).toBe('billing.failed');
    expect(portalErrorKey(undefined)).toBe('billing.failed');
  });
});
