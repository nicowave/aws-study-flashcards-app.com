import { describe, it, expect, vi } from 'vitest';
import { openBillingPortal } from './billing';
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
