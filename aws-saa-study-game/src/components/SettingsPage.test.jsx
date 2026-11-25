import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { useAuth } from '../context/AuthContext';
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '../services/analytics';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/analytics', () => ({
  isAnalyticsOptedOut: vi.fn(),
  setAnalyticsOptOut: vi.fn(),
}));

const EMAIL_USER = { uid: 'u1', email: 'sam@example.com', displayName: 'Sam', emailVerified: true, providerData: [] };
const GOOGLE_USER = { ...EMAIL_USER, providerData: [{ providerId: 'google.com' }] };

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

beforeEach(() => {
  setAuth();
  isAnalyticsOptedOut.mockReturnValue(false);
  // jsdom has no canvas; the generated pattern avatar only needs something to draw on.
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({})), set: (t, k, v) => { t[k] = v; return true; } });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,PATTERN');
});

describe('SettingsPage', () => {
  it('asks guests to sign in instead of showing account settings', async () => {
    setAuth({ user: null, userData: null, isGuest: true });
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPage onBack={onBack} />);
    expect(screen.getByText(/Sign in with an email or Google account/)).toBeInTheDocument();
    expect(screen.queryByText('Account Information')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalled();
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
  });

  describe('display name', () => {
    const startEditing = (user) => user.click(screen.getByText('Sam'));

    it('saves the trimmed new name', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      const input = screen.getByPlaceholderText('Enter display name');
      expect(input).toHaveValue('Sam');
      await user.clear(input);
      await user.type(input, '  Cloud Sam  {Enter}');
      expect(auth.changeDisplayName).toHaveBeenCalledWith('Cloud Sam');
      expect(await screen.findByText('Display name updated!')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter display name')).not.toBeInTheDocument();
    });

    it('rejects a name shorter than 2 characters', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      const input = screen.getByPlaceholderText('Enter display name');
      await user.clear(input);
      await user.type(input, 'S{Enter}');
      expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument();
      expect(auth.changeDisplayName).not.toHaveBeenCalled();
    });

    it('shows the error when saving fails, and Escape cancels', async () => {
      setAuth({ changeDisplayName: vi.fn().mockResolvedValue({ success: false, error: 'Name taken' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await startEditing(user);
      await user.type(screen.getByPlaceholderText('Enter display name'), 'my{Enter}');
      expect(await screen.findByText('Name taken')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByPlaceholderText('Enter display name')).not.toBeInTheDocument();
    });
  });

  describe('avatar', () => {
    const saveAvatar = (user) => user.click(screen.getByRole('button', { name: 'Save Avatar' }));

    it('saves the chosen emoji', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: '🚀' }));
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'emoji', value: '🚀', bgColor: expect.any(String) });
      expect(await screen.findByText('Avatar saved!')).toBeInTheDocument();
    });

    it('starts from the saved avatar, so saving again keeps it', async () => {
      // a current-palette colour, so no app maps it to another colour
      setAuth({ userData: { displayName: 'Sam', avatar: { type: 'emoji', value: '🎓', bgColor: '#3fb950' } } });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'emoji', value: '🎓', bgColor: '#3fb950' });
    });

    it('saves initials on a colour from the Color tab', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Color' }));
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'initials', value: null, bgColor: expect.any(String) });
    });

    it('saves the generated pattern from the Pattern tab', async () => {
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Pattern' }));
      await saveAvatar(user);
      expect(auth.updateAvatar).toHaveBeenCalledWith({ type: 'pattern', value: 'data:image/jpeg;base64,PATTERN', bgColor: expect.any(String) });
    });

    it('shows the error when saving fails', async () => {
      setAuth({ updateAvatar: vi.fn().mockResolvedValue({ success: false, error: 'Upload failed' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await saveAvatar(user);
      expect(await screen.findByText('Upload failed')).toBeInTheDocument();
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
    });

    it('shows the error when the current password is wrong', async () => {
      setAuth({ changeUserPassword: vi.fn().mockResolvedValue({ success: false, error: 'Current password is incorrect' }) });
      const user = userEvent.setup();
      render(<SettingsPage onBack={vi.fn()} />);
      await fillPasswords(user, 'wrongpass', 'newsecret', 'newsecret');
      await submit(user);
      expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
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
