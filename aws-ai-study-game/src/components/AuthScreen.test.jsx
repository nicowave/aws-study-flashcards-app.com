import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from './AuthScreen';
import { useAuth } from '../context/AuthContext';

// Never reach Cognito: the auth context and the reset-password calls are fakes.
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/sharedAuth', () => ({
  sendPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

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
      expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument();
      // Sign-in uses only email and password, so it never asks for a username
      expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    });

    it('switches to sign-up and back, keeping the email but clearing passwords', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { email: 'me@example.com', password: 'secret123' });

      await goToSignUp(user);
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(field.confirm()).toBeInTheDocument();
      expect(field.username()).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument();
      expect(field.email()).toHaveValue('me@example.com');
      expect(field.password()).toHaveValue('');

      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    });

    it('shows and hides the password', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      expect(field.password()).toHaveAttribute('type', 'password');
      await user.click(screen.getByRole('button', { name: 'Show password' }));
      expect(field.password()).toHaveAttribute('type', 'text');
      await user.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(field.password()).toHaveAttribute('type', 'password');
    });
  });

  describe('signed out by the device limit', () => {
    it('explains why when the context has a sign-out message', () => {
      setAuth({ signOutMessage: 'You were signed out on this browser because your account signed in on another device.' });
      render(<AuthScreen />);
      expect(screen.getByRole('status')).toHaveTextContent('signed in on another device');
    });

    it('shows nothing extra after an ordinary sign-out', () => {
      render(<AuthScreen />);
      expect(screen.queryByText(/another device/)).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    // "Sign In" is both the submit (sign-in mode) and the mode toggle (sign-up mode)
    const submit = (user) => user.click(screen.getAllByRole('button').find((b) => b.type === 'submit'));

    it.each([
      ['an email without a domain dot', { email: 'me@example', password: 'secret123' }, 'Please enter a valid email address'],
      ['a short password', { email: 'me@example.com', password: '12345' }, 'Password must be at least 6 characters'],
    ])('on sign-in, rejects %s without calling auth', async (_, values, message) => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, values);
      await submit(user);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('on sign-up, requires a username and a password', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { email: 'me@example.com', password: 'secret123', confirm: 'secret123' });
      await submit(user);
      expect(screen.getByText('Username is required')).toBeInTheDocument();

      await user.clear(field.password());
      await fill(user, { username: 'learner' });
      await submit(user);
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('on sign-up, rejects a short username without calling auth', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { username: 'ab', email: 'me@example.com', password: 'secret123', confirm: 'secret123' });
      await submit(user);
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('on sign-up, requires the two passwords to match', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { username: 'learner', email: 'me@example.com', password: 'secret123', confirm: 'secret124' });
      await submit(user);
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('clears the message as soon as the learner types again', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { username: 'ab', email: 'me@example.com', password: 'secret123', confirm: 'secret123' });
      await submit(user);
      expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();
      await user.type(field.username(), 'c');
      expect(screen.queryByText(/at least 3 characters/)).not.toBeInTheDocument();
    });
  });

  describe('submitting', () => {
    // Regression: sign-in once demanded a 3+ character username that login() never used
    it('signs in with just the email and password', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { email: 'me@example.com', password: 'secret123' });
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(auth.login).toHaveBeenCalledWith('me@example.com', 'secret123');
      expect(auth.register).not.toHaveBeenCalled();
    });

    it('creates an account with email, password and username', async () => {
      const user = userEvent.setup();
      render(<AuthScreen />);
      await goToSignUp(user);
      await fill(user, { username: 'learner', email: 'me@example.com', password: 'secret123', confirm: 'secret123' });
      await user.click(screen.getByRole('button', { name: 'Create Account' }));
      expect(auth.register).toHaveBeenCalledWith('me@example.com', 'secret123', 'learner');
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('shows the message of a rejected sign-in', async () => {
      setAuth({ login: vi.fn().mockRejectedValue(new Error('Network down, try again')) });
      const user = userEvent.setup();
      render(<AuthScreen />);
      await fill(user, { email: 'me@example.com', password: 'secret123' });
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(await screen.findByText('Network down, try again')).toBeInTheDocument();
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

    it('disables everything while auth is busy', () => {
      setAuth({ loading: true });
      render(<AuthScreen onGuestContinue={vi.fn()} />);
      expect(field.email()).toBeDisabled();
      expect(field.password()).toBeDisabled();
      expect(screen.getByRole('button', { name: /with Google/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Try It Free/ })).toBeDisabled();
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

  it('offers the free guest preview only when the app supports it', async () => {
    const onGuestContinue = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<AuthScreen onGuestContinue={onGuestContinue} />);
    await user.click(screen.getByRole('button', { name: /Try It Free/ }));
    expect(onGuestContinue).toHaveBeenCalledTimes(1);
    unmount();

    render(<AuthScreen />);
    expect(screen.queryByRole('button', { name: /Try It Free/ })).not.toBeInTheDocument();
  });

  it('links back to the hub when given its address', () => {
    render(<AuthScreen hubUrl="https://hub.example.com/" />);
    expect(screen.getByRole('link', { name: /Study Hub/ })).toHaveAttribute('href', 'https://hub.example.com/');
  });

  it('opens the reset-password screen with the typed email, and comes back', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);
    await user.type(field.email(), 'me@example.com');
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('me@example.com');

    await user.click(screen.getByRole('button', { name: 'Back to Sign In' }));
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });
});
