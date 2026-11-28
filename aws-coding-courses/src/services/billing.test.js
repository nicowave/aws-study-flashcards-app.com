import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const auth = vi.hoisted(() => ({ getTokens: vi.fn(), decodeJwt: vi.fn(), callFunction: vi.fn() }));
vi.mock('./awsAuth', () => auth);

const { hasCourseAccess, startCheckout, openBillingPortal } = await import('./billing');
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
