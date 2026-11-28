import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openBillingPortal, getBillingAccountStatus, portalErrorMessage } from './billing';
import { callFunction } from './awsAuth';

// The API is the money boundary: never reach it.
vi.mock('./awsAuth', () => ({ getTokens: vi.fn(), decodeJwt: vi.fn(), callFunction: vi.fn() }));

// Pretend the page was opened on the old name, so we can see the return address go through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('levelupstudyhub.com', 'aws-study-flashcards-app.com'),
}));

describe('openBillingPortal', () => {
  it('asks to come back to the hub on the name the page was opened on', async () => {
    callFunction.mockResolvedValue({ data: {} }); // no portal address, so the page stays put
    await expect(openBillingPortal()).rejects.toThrow('No portal URL returned');
    expect(callFunction).toHaveBeenCalledWith('createPortalSession', { returnUrl: 'https://aws-study-flashcards-app.com' });
  });
});

describe('getBillingAccountStatus', () => {
  beforeEach(() => callFunction.mockReset());

  it('asks the billingStatus function and returns its true/false answer', async () => {
    callFunction.mockResolvedValueOnce({ data: { hasBillingAccount: false } });
    await expect(getBillingAccountStatus()).resolves.toBe(false);
    expect(callFunction).toHaveBeenCalledWith('billingStatus', {});
    callFunction.mockResolvedValueOnce({ data: { hasBillingAccount: true } });
    await expect(getBillingAccountStatus()).resolves.toBe(true);
  });

  it('null (unknown, so the Manage button stays) for an odd answer or a failed call, an older backend included', async () => {
    callFunction.mockResolvedValueOnce({ data: {} });
    await expect(getBillingAccountStatus()).resolves.toBeNull();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callFunction.mockRejectedValueOnce(Object.assign(new Error('Unknown function'), { code: 'NOT_FOUND' }));
    await expect(getBillingAccountStatus()).resolves.toBeNull();
    callFunction.mockRejectedValueOnce(new Error('offline'));
    await expect(getBillingAccountStatus()).resolves.toBeNull();
  });
});

describe('portalErrorMessage', () => {
  const fallback = 'Could not open billing. Please try again.';
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
