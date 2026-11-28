// @vitest-environment jsdom
// Delete account: a refusal the learner can act on must reach the screen as the server wrote it.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAccount } from './sharedAuth';
import { apiFetch, getTokens, userFromTokens } from './awsAuth';

vi.mock('./awsAuth', () => ({
  signInWithPassword: vi.fn(),
  verifyPassword: vi.fn(),
  takeSignOutReason: vi.fn(),
  signUp: vi.fn(),
  resendSignUpLink: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
  changeAccountPassword: vi.fn(),
  startGoogleSignIn: vi.fn(),
  completeGoogleSignIn: vi.fn(),
  signOutEverywhere: vi.fn(),
  forgetSession: vi.fn(),
  getTokens: vi.fn(),
  userFromTokens: vi.fn(),
  onSessionChange: vi.fn(),
  apiFetch: vi.fn(),
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getTokens).mockResolvedValue({ idToken: 'x' });
  vi.mocked(userFromTokens).mockReturnValue({ uid: 'u1', email: 'me@example.com', providerData: [{ providerId: 'google.com' }] });
});

describe('deleteAccount', () => {
  it('passes on "cancel your subscription first" (409) instead of a generic failure', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(
      Object.assign(new Error('Cancel your subscription in Manage billing first'), { status: 409 })
    );
    expect(await deleteAccount()).toEqual({ success: false, error: 'Cancel your subscription in Manage billing first' });
  });

  it('keeps other failures generic', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(Object.assign(new Error('Internal error'), { status: 500 }));
    expect(await deleteAccount()).toEqual({ success: false, error: 'Failed to delete account' });
  });
});
