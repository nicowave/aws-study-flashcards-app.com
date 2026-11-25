import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from './AuthScreen';
import { useAuth } from '../context/AuthContext';

// Never reach Cognito: the auth context is a fake.
// (The hub's own sign-in lives in the modal in App.jsx; this is the full-page version.)
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

let auth;
const setAuth = (overrides = {}) => {
  auth = {
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    googleSignIn: vi.fn().mockResolvedValue({ success: true }),
    clearError: vi.fn(),
    loading: false,
    error: null,
    ...overrides,
  };
  useAuth.mockReturnValue(auth);
};

const field = {
  username: () => screen.getByLabelText('Username'),
  email: () => screen.getByLabelText(/^Email/),
  password: () => screen.getByLabelText('Password'),
  confirm: () => screen.getByLabelText('Confirm Password'),
};

const fill = async (user, { username, email, password, confirm }) => {
  if (username !== undefined) await user.type(field.username(), username);
  if (email !== undefined) await user.type(field.email(), email);
  if (password !== undefined) await user.type(field.password(), password);
  if (confirm !== undefined) await user.type(field.confirm(), confirm);
};

const goToSignUp = (user) => user.click(screen.getByRole('button', { name: 'Sign Up' }));
// "Sign In" is both the submit (sign-in mode) and the mode toggle (sign-up mode)
const submit = (user) => user.click(screen.getAllByRole('button').find((b) => b.type === 'submit'));

const VALID = { username: 'learner', email: 'me@example.com', password: 'secret123' };

beforeEach(() => {
  setAuth();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AuthScreen', () => {
  describe('modes', () => {
    it('opens in sign-in mode without a confirm-password field', () => {
      render(<AuthScreen />);
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toHaveAttribute('type', 'submit');
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });

    it('switches to sign-up and back, keeping username and email but clearing passwords', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, VALID);

      await goToSignUp(user);
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(field.confirm()).toBeInTheDocument();
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(field.username()).toHaveValue('learner');
      expect(field.email()).toHaveValue('me@example.com');
      expect(field.password()).toHaveValue('');

      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
    });

    it('shows and hides each password separately', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      const [passwordToggle, confirmToggle] = screen.getAllByRole('button', { name: 'Show password' });

      await user.click(passwordToggle);
      expect(field.password()).toHaveAttribute('type', 'text');
      expect(field.confirm()).toHaveAttribute('type', 'password');

      await user.click(confirmToggle);
      expect(field.confirm()).toHaveAttribute('type', 'text');

      await user.click(screen.getAllByRole('button', { name: 'Hide password' })[0]);
      expect(field.password()).toHaveAttribute('type', 'password');
    });

    it('asks the browser for the right saved password in each mode', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      expect(field.password()).toHaveAttribute('autocomplete', 'current-password');
      await goToSignUp(user);
      expect(field.password()).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  describe('validation', () => {
    it.each([
      ['a short username', { ...VALID, username: 'ab' }, 'Username must be at least 3 characters'],
      ['an email without a domain dot', { ...VALID, email: 'me@example' }, 'Please enter a valid email address'],
      ['a short password', { ...VALID, password: '12345' }, 'Password must be at least 6 characters'],
    ])('rejects %s without calling auth', async (_, values, message) => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, values);
      await submit(user);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('requires a username, even to sign in', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { email: 'me@example.com', password: 'secret123' });
      await submit(user);
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('requires a password', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { username: 'learner', email: 'me@example.com' });
      await submit(user);
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('on sign-up, requires the two passwords to match', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { ...VALID, confirm: 'secret124' });
      await submit(user);
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('clears the message as soon as the learner types again', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { ...VALID, username: 'ab' });
      await submit(user);
      expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();
      await user.type(field.username(), 'c');
      expect(screen.queryByText(/at least 3 characters/)).not.toBeInTheDocument();
    });

    it('clears the message when switching modes', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { ...VALID, password: '12345' });
      await submit(user);
      expect(screen.getByText(/at least 6 characters/)).toBeInTheDocument();
      await goToSignUp(user);
      expect(screen.queryByText(/at least 6 characters/)).not.toBeInTheDocument();
    });
  });

  describe('submitting', () => {
    it('signs in with the typed email and password', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, VALID);
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(auth.login).toHaveBeenCalledWith('me@example.com', 'secret123');
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('creates an account with email, password and username', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { ...VALID, confirm: 'secret123' });
      await user.click(screen.getByRole('button', { name: 'Create Account' }));
      expect(auth.register).toHaveBeenCalledWith('me@example.com', 'secret123', 'learner');
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('shows the message of a rejected sign-in', async () => {
      setAuth({ login: vi.fn().mockRejectedValue(new Error('Network down, try again')) });
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, VALID);
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(await screen.findByText('Network down, try again')).toBeInTheDocument();
    });

    it('falls back to a generic message when the rejection has none', async () => {
      setAuth({ register: vi.fn().mockRejectedValue(new Error('')) });
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { ...VALID, confirm: 'secret123' });
      await submit(user);
      expect(await screen.findByText('Authentication failed')).toBeInTheDocument();
    });

    it('shows the error the auth context reports and clears it when the learner types', async () => {
      // login() reports most failures (wrong password, unverified email) through context.error
      setAuth({ error: 'Incorrect email or password.' });
      const user = userEvent.setup();
      render(<AuthScreen />);
      expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument();
      await user.type(field.email(), 'x');
      expect(auth.clearError).toHaveBeenCalled();
    });

    it('clears the context error when switching modes', async () => {
      setAuth({ error: 'Incorrect email or password.' });
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      expect(auth.clearError).toHaveBeenCalled();
    });

    it('disables everything while auth is busy', () => {
      setAuth({ loading: true });
      render(<AuthScreen onGuestContinue={vi.fn()} />);
      expect(field.username()).toBeDisabled();
      expect(field.email()).toBeDisabled();
      expect(field.password()).toBeDisabled();
      expect(screen.getByRole('button', { name: /with Google/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Continue as Guest' })).toBeDisabled();
      // the submit button shows a spinner instead of its label
      expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled();
    });
  });

  it('starts Google sign-in, labelled for the current mode', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(auth.googleSignIn).toHaveBeenCalledTimes(1);
    await goToSignUp(user);
    expect(screen.getByRole('button', { name: 'Sign up with Google' })).toBeInTheDocument();
  });

  it('offers guest mode only when the page supports it', async () => {
    const onGuestContinue = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<AuthScreen onGuestContinue={onGuestContinue} />);
    expect(screen.getByText("Progress won't sync across devices")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue as Guest' }));
    expect(onGuestContinue).toHaveBeenCalledTimes(1);
    unmount();

    render(<AuthScreen />);
    expect(screen.queryByRole('button', { name: 'Continue as Guest' })).not.toBeInTheDocument();
  });

  it('links back to the hub only when given its address', () => {
    const { unmount } = render(<AuthScreen hubUrl="https://hub.example.com/" />);
    expect(screen.getByRole('link', { name: /Study Hub/ })).toHaveAttribute('href', 'https://hub.example.com/');
    unmount();

    render(<AuthScreen />);
    expect(screen.queryByRole('link', { name: /Study Hub/ })).not.toBeInTheDocument();
  });
});
