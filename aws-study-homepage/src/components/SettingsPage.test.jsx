import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { useAuth } from '../context/AuthContext';
import { getBillingSummary } from '../services/billing';
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '../services/analytics';

// Auth, analytics and billing are faked here. Plan & Billing shows only once checkout is
// switched on (BILLING_ENABLED); its own behaviour is in BillingSection.test.jsx.
const billing = vi.hoisted(() => ({ enabled: false }));
vi.mock('../services/billing', () => ({
  get BILLING_ENABLED() { return billing.enabled; },
  getBillingSummary: vi.fn(),
  getBillingAccountStatus: vi.fn(async () => true),
  openBillingPortal: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/analytics', () => ({
  isAnalyticsOptedOut: vi.fn(),
  setAnalyticsOptOut: vi.fn(),
}));

const EMAIL_USER = { uid: 'u1', email: 'sam@example.com', displayName: 'Sam', emailVerified: true, providerData: [] };
const GOOGLE_USER = { ...EMAIL_USER, providerData: [{ providerId: 'google.com' }] };
const PATTERN = 'data:image/jpeg;base64,PATTERN';

let auth;
const setAuth = (overrides = {}) => {
  auth = {
    user: EMAIL_USER,
    userData: { displayName: 'Sam', createdAt: '2024-03-15T12:00:00Z' },
    isGuest: false,
    changeUserPassword: vi.fn().mockResolvedValue({ success: true }),
    changeDisplayName: vi.fn().mockResolvedValue({ success: true }),
    updateAvatar: vi.fn().mockResolvedValue({ success: true }),
    deleteUserAccount: vi.fn().mockResolvedValue({ success: true }),
    refreshUserData: vi.fn(),
    ...overrides,
  };
  useAuth.mockReturnValue(auth);
};

// The back arrow is an icon-only button in the page header.
const backButton = () => within(screen.getByRole('heading', { level: 1 }).parentElement).getByRole('button');
// Colour swatches are unlabeled buttons painted with their colour.
const swatches = () => screen.getAllByRole('button').filter((b) => b.classList.contains('color-swatch'));
const toRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const saveAvatar = (user) => user.click(screen.getByRole('button', { name: 'Save Avatar' }));

let toDataURL;
beforeEach(() => {
  setAuth();
  isAnalyticsOptedOut.mockReturnValue(false);
  // jsdom has no canvas; the generated pattern avatar only needs something to draw on.
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({})), set: (t, k, v) => { t[k] = v; return true; } });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
  toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(PATTERN);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.__patternSalt;
});

describe('SettingsPage', () => {
  it('asks guests to sign in instead of showing account settings', async () => {
    setAuth({ user: null, userData: null, isGuest: true });
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPage onBack={onBack} />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText(/Sign in with an email or Google account/)).toBeInTheDocument();
    expect(screen.queryByText('Account Information')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete My Account' })).not.toBeInTheDocument();
    await user.click(backButton());
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('goes back from the account settings', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPage onBack={onBack} />);
    expect(screen.getByRole('heading', { name: 'Account Settings' })).toBeInTheDocument();
    await user.click(backButton());
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('account information', () => {
    it('shows the email, name, provider, join date and verification', () => {
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByText('sam@example.com')).toBeInTheDocument();
      expect(screen.getByText('Sam')).toBeInTheDocument();
      expect(screen.getByText('Email / Password')).toBeInTheDocument();
      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('says Google for a Google account, and hides the password form', () => {
      setAuth({ user: { ...GOOGLE_USER, emailVerified: false } });
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Not Verified')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Change Password' })).not.toBeInTheDocument();
    });

    it('falls back when the profile has no name or join date', () => {
      setAuth({ user: { ...EMAIL_USER, displayName: undefined }, userData: {} });
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('display name', () => {
    const startEditing = (user) => user.click(screen.getByText('Sam'));
    const nameInput = () => screen.getByPlaceholderText('Enter display name');

    it('saves the trimmed new name', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      expect(nameInput()).toHaveValue('Sam');
      expect(nameInput()).toHaveAttribute('maxlength', '30');
      await user.clear(nameInput());
      await user.type(nameInput(), '  Cloud Sam  {Enter}');
      expect(auth.changeDisplayName).toHaveBeenCalledWith('Cloud Sam');
      expect(await screen.findByText('Display name updated!')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter display name')).not.toBeInTheDocument();
    });

    it('saves with the check button too', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.type(nameInput(), 'my');
      // the save button is the icon-only button next to the input, before the × cancel
      const [saveBtn] = within(nameInput().parentElement).getAllByRole('button');
      await user.click(saveBtn);
      expect(auth.changeDisplayName).toHaveBeenCalledWith('Sammy');
    });

    it.each([
      ['a single character', 'S'],
      ['only spaces', '   '],
    ])('rejects %s', async (_, typed) => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.clear(nameInput());
      await user.type(nameInput(), `${typed}{Enter}`);
      expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument();
      expect(auth.changeDisplayName).not.toHaveBeenCalled();
    });

    it('shows the error when saving fails, and Escape cancels', async () => {
      setAuth({ changeDisplayName: vi.fn().mockResolvedValue({ success: false, error: 'Name taken' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.type(nameInput(), 'my{Enter}');
      expect(await screen.findByText('Name taken')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByPlaceholderText('Enter display name')).not.toBeInTheDocument();
      expect(screen.getByText('Sam')).toBeInTheDocument();
    });

    it('cancels with × and clears the message', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.clear(nameInput());
      await user.type(nameInput(), 'S{Enter}');
      await user.click(screen.getByRole('button', { name: '×' }));
      expect(screen.queryByPlaceholderText('Enter display name')).not.toBeInTheDocument();
      expect(screen.queryByText(/at least 2 characters/)).not.toBeInTheDocument();
      expect(auth.changeDisplayName).not.toHaveBeenCalled();
    });

    it('hides the success message after 3 seconds', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.type(nameInput(), 'my');
      // Fake setTimeout for the 3 s reset. userEvent waits on setTimeout itself, so save with fireEvent.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      await act(async () => { fireEvent.keyDown(nameInput(), { key: 'Enter' }); });
      expect(screen.getByText('Display name updated!')).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(2999); });
      expect(screen.getByText('Display name updated!')).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.queryByText('Display name updated!')).not.toBeInTheDocument();
    });
  });

  describe('avatar', () => {
    it('shows the first letter of the name until an avatar is chosen', () => {
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByText('Preview').previousSibling).toHaveTextContent(/^S$/);
    });

    it('saves the chosen emoji on the chosen background colour', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: '🚀' }));
      const swatch = swatches()[2];
      await user.click(swatch);
      expect(screen.getByText('Preview').previousSibling).toHaveTextContent('🚀');
      await saveAvatar(user);
      const saved = auth.updateAvatar.mock.calls[0][0];
      expect(saved).toEqual({ type: 'emoji', value: '🚀', bgColor: expect.any(String) });
      expect(toRgb(saved.bgColor)).toBe(swatch.style.backgroundColor);
      expect(await screen.findByText('Avatar saved!')).toBeInTheDocument();
    });

    it('disables Save Avatar while saving', async () => {
      let finish;
      setAuth({ updateAvatar: vi.fn().mockReturnValue(new Promise((r) => { finish = r; })) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
      finish({ success: true });
      expect(await screen.findByText('Avatar saved!')).toBeInTheDocument();
    });

    it('starts from the saved emoji avatar, so saving again keeps it', async () => {
      setAuth({ userData: { displayName: 'Sam', avatar: { type: 'emoji', value: '🎓', bgColor: '#3fb950' } } });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'emoji', value: '🎓', bgColor: '#3fb950' });
    });

    it('keeps a saved colour that is not in this palette (e.g. chosen in a game)', async () => {
      const notInPalette = '#818cf8';
      const { unmount } = render(<SettingsPage onBack={vi.fn()} />);
      expect(swatches().map((s) => s.style.backgroundColor)).not.toContain(toRgb(notInPalette));
      unmount();
      setAuth({ userData: { displayName: 'Sam', avatar: { type: 'emoji', value: '🎓', bgColor: notInPalette } } });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'emoji', value: '🎓', bgColor: notInPalette });
    });

    it('opens on the Upload tab with the saved photo', () => {
      setAuth({ userData: { displayName: 'Sam', avatar: { type: 'image', value: 'data:image/jpeg;base64,PHOTO', bgColor: '#3fb950' } } });
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByText('Click to upload an image')).toBeInTheDocument();
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', 'data:image/jpeg;base64,PHOTO');
    });

    it('saves initials on a colour from the Color tab', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: '🚀' }));
      await user.click(screen.getByRole('button', { name: 'Color' }));
      expect(screen.getByText('Preview').previousSibling).toHaveTextContent(/^S$/);
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'initials', value: null, bgColor: expect.any(String) });
    });

    it('saves the generated pattern from the Pattern tab, and can regenerate it', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Pattern' }));
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', PATTERN);

      toDataURL.mockReturnValue('data:image/jpeg;base64,PATTERN2');
      await user.click(screen.getByRole('button', { name: 'Regenerate' }));
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', 'data:image/jpeg;base64,PATTERN2');

      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'pattern', value: 'data:image/jpeg;base64,PATTERN2', bgColor: expect.any(String) });
    });

    it('shows the error when saving fails', async () => {
      setAuth({ updateAvatar: vi.fn().mockResolvedValue({ success: false, error: 'Upload failed' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(await screen.findByText('Upload failed')).toBeInTheDocument();
    });

    describe('uploading a photo', () => {
      const fileInput = (container) => container.querySelector('input[type="file"]');

      it('only accepts images', async () => {
        const user = userEvent.setup();
        const { container } = render(<SettingsPage onBack={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Upload' }));
        expect(fileInput(container)).toHaveAttribute('accept', 'image/*');
      });

      it('rejects a file that is not an image', async () => {
        const user = userEvent.setup({ applyAccept: false });
        const { container } = render(<SettingsPage onBack={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Upload' }));
        await user.upload(fileInput(container), new File(['hello'], 'notes.txt', { type: 'text/plain' }));
        expect(screen.getByText('Please select an image file')).toBeInTheDocument();
      });

      it('rejects an image over 5MB', async () => {
        const user = userEvent.setup();
        const { container } = render(<SettingsPage onBack={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Upload' }));
        const big = new File(['x'], 'big.png', { type: 'image/png' });
        Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
        await user.upload(fileInput(container), big);
        expect(screen.getByText('Image must be under 5MB')).toBeInTheDocument();
      });

      it('crops the photo, previews it and saves it', async () => {
        // jsdom never loads images; this one "loads" as soon as it gets a src.
        vi.stubGlobal('Image', class {
          width = 300;
          height = 200;
          set src(_v) { setTimeout(() => this.onload()); }
        });
        toDataURL.mockReturnValue('data:image/jpeg;base64,CROPPED');
        const user = userEvent.setup();
        const { container } = render(<SettingsPage onBack={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Upload' }));
        await user.upload(fileInput(container), new File(['png'], 'me.png', { type: 'image/png' }));
        expect(await screen.findByAltText('Avatar')).toHaveAttribute('src', 'data:image/jpeg;base64,CROPPED');
        await saveAvatar(user);
        expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'image', value: 'data:image/jpeg;base64,CROPPED', bgColor: expect.any(String) });
      });
    });
  });

  describe('change password', () => {
    const fillPasswords = async (user, current, next, confirm) => {
      await user.type(screen.getByPlaceholderText('Enter current password'), current);
      await user.type(screen.getByPlaceholderText(/^Enter new password/), next);
      await user.type(screen.getByPlaceholderText('Re-enter new password'), confirm);
    };
    const submit = (user) => user.click(screen.getByRole('button', { name: 'Change Password' }));

    it('stays disabled until all three fields are filled', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeDisabled();
      await fillPasswords(user, 'oldsecret', 'newsecret', 'newsecret');
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeEnabled();
    });

    it.each([
      ['new passwords that differ', ['oldsecret', 'newsecret', 'newsecreX'], 'New passwords do not match'],
      ['a short new password', ['oldsecret', '12345', '12345'], 'New password must be at least 6 characters'],
      ['the same password again', ['oldsecret', 'oldsecret', 'oldsecret'], 'New password must be different from current password'],
    ])('rejects %s without calling auth', async (_, values, message) => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await fillPasswords(user, ...values);
      await submit(user);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(auth.changeUserPassword).not.toHaveBeenCalled();
    });

    it('changes the password and clears the form', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await fillPasswords(user, 'oldsecret', 'newsecret', 'newsecret');
      await submit(user);
      expect(auth.changeUserPassword).toHaveBeenCalledWith('oldsecret', 'newsecret');
      expect(await screen.findByText('Password changed successfully!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter current password')).toHaveValue('');
      expect(screen.getByPlaceholderText(/^Enter new password/)).toHaveValue('');
      expect(screen.getByPlaceholderText('Re-enter new password')).toHaveValue('');
    });

    it('shows the error and keeps the typed passwords when the current one is wrong', async () => {
      setAuth({ changeUserPassword: vi.fn().mockResolvedValue({ success: false, error: 'Current password is incorrect' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await fillPasswords(user, 'wrongpass', 'newsecret', 'newsecret');
      await submit(user);
      expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter current password')).toHaveValue('wrongpass');
    });
  });

  describe('analytics opt-out', () => {
    it('reflects and saves the opt-out choice', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).not.toBeChecked();
      await user.click(toggle);
      expect(setAnalyticsOptOut).toHaveBeenLastCalledWith(true);
      expect(toggle).toBeChecked();
    });

    it('lets someone who opted out opt back in', async () => {
      isAnalyticsOptedOut.mockReturnValue(true);
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeChecked();
      await user.click(toggle);
      expect(setAnalyticsOptOut).toHaveBeenLastCalledWith(false);
      expect(toggle).not.toBeChecked();
    });
  });

  describe('delete account', () => {
    const deleteButton = () => screen.getByRole('button', { name: 'Delete My Account' });
    const confirmInput = () => screen.getByPlaceholderText('Type "DELETE"');

    it('needs DELETE typed exactly and the password before it can be pressed', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      expect(deleteButton()).toBeDisabled();
      await user.type(confirmInput(), 'delete');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'oldsecret');
      expect(deleteButton()).toBeDisabled();
      await user.clear(confirmInput());
      await user.type(confirmInput(), 'DELETE');
      expect(deleteButton()).toBeEnabled();
      await user.clear(screen.getByPlaceholderText('Enter your password'));
      expect(deleteButton()).toBeDisabled();
    });

    it('deletes an email account with its password, then leaves the page', async () => {
      const onBack = vi.fn();
      const user = userEvent.setup();
      render(<SettingsPage onBack={onBack} />);
      await user.type(confirmInput(), 'DELETE');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'oldsecret');
      await user.click(deleteButton());
      expect(auth.deleteUserAccount).toHaveBeenCalledWith('oldsecret');
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('deletes a Google account without asking for a password', async () => {
      setAuth({ user: GOOGLE_USER });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      expect(screen.queryByPlaceholderText('Enter your password')).not.toBeInTheDocument();
      await user.type(confirmInput(), 'DELETE');
      await user.click(deleteButton());
      expect(auth.deleteUserAccount).toHaveBeenCalledWith(null);
    });

    it('disables the button while deleting', async () => {
      let finish;
      setAuth({ deleteUserAccount: vi.fn().mockReturnValue(new Promise((r) => { finish = r; })) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.type(confirmInput(), 'DELETE');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'oldsecret');
      await user.click(deleteButton());
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
      expect(auth.deleteUserAccount).toHaveBeenCalledTimes(1);
      finish({ success: false, error: 'Incorrect password' });
      expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
    });

    it('stays on the page and shows the error when deletion fails', async () => {
      setAuth({ deleteUserAccount: vi.fn().mockResolvedValue({ success: false, error: 'Incorrect password' }) });
      const onBack = vi.fn();
      const user = userEvent.setup();
      render(<SettingsPage onBack={onBack} />);
      await user.type(confirmInput(), 'DELETE');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass');
      await user.click(deleteButton());
      expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
      expect(onBack).not.toHaveBeenCalled();
    });
  });
});

describe('SettingsPage: Plan & Billing', () => {
  afterEach(() => { billing.enabled = false; });

  it('is hidden while checkout is switched off', () => {
    setAuth();
    render(<SettingsPage onBack={vi.fn()} />);
    expect(screen.queryByRole('heading', { name: /plan & billing/i })).not.toBeInTheDocument();
  });

  it('shows once checkout is on, and "See plans" calls onSeePlans', async () => {
    billing.enabled = true;
    vi.mocked(getBillingSummary).mockResolvedValue({ plan: null, certs: [], owned: [], subscriptions: [] });
    setAuth();
    const onSeePlans = vi.fn();
    render(<SettingsPage onBack={vi.fn()} onSeePlans={onSeePlans} />);
    expect(screen.getByRole('heading', { name: /plan & billing/i })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'See plans' }));
    expect(onSeePlans).toHaveBeenCalledTimes(1);
  });
});
