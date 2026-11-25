import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from './ForgotPassword';
import { useAuth } from '../context/AuthContext';
import { sendPasswordReset, resetPassword } from '../services/sharedAuth';

// Never reach Cognito: the reset calls and the sign-in that follows are fakes.
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/sharedAuth', () => ({
  sendPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

const SENT = 'We sent you a code.';
let login;

beforeEach(() => {
  login = vi.fn().mockResolvedValue({ success: true });
  useAuth.mockReturnValue({ login });
  sendPasswordReset.mockResolvedValue({ success: true, message: SENT });
  resetPassword.mockResolvedValue({ success: true });
});

const send = (user) => user.click(screen.getByRole('button', { name: 'Send Reset Code' }));
const save = (user) => user.click(screen.getByRole('button', { name: 'Save New Password' }));
const backButton = () => screen.getByRole('button', { name: 'Back to sign in' });

// Gets to step two (code + new password) for me@example.com.
const toConfirmStep = async (user, props = {}) => {
  render(<ForgotPassword initialEmail="me@example.com" onBack={vi.fn()} {...props} />);
  await send(user);
  await screen.findByText(SENT);
};

const fillConfirm = async (user, { code, password, confirm }) => {
  if (code) await user.type(screen.getByLabelText('Code from the email'), code);
  if (password) await user.type(screen.getByLabelText('New password'), password);
  if (confirm) await user.type(screen.getByLabelText('Confirm new password'), confirm);
};

const GOOD = { code: '123456', password: 'newsecret', confirm: 'newsecret' };

describe('ForgotPassword', () => {
  describe('step 1: request a code', () => {
    it('starts with the email passed in', () => {
      render(<ForgotPassword initialEmail="me@example.com" onBack={vi.fn()} />);
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(screen.getByText(/we'll send you a reset code/)).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveValue('me@example.com');
    });

    it('rejects an invalid email without sending anything', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword onBack={vi.fn()} />);
      await user.type(screen.getByLabelText('Email'), 'me@example');
      await send(user);
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(sendPasswordReset).not.toHaveBeenCalled();

      await user.type(screen.getByLabelText('Email'), '.com');
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('sends the code to the typed email and moves to step 2 with the notice', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword onBack={vi.fn()} />);
      await user.type(screen.getByLabelText('Email'), 'me@example.com');
      await send(user);
      expect(sendPasswordReset).toHaveBeenCalledWith('me@example.com');
      expect(await screen.findByText(SENT)).toBeInTheDocument();
      expect(screen.getByText(/Enter the code from the email and choose a new password/)).toBeInTheDocument();
      expect(screen.getByLabelText('Code from the email')).toBeInTheDocument();
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    });

    it('stays on step 1 and shows the error when sending fails', async () => {
      sendPasswordReset.mockResolvedValue({ success: false, error: 'Too many requests.' });
      const user = userEvent.setup();
      render(<ForgotPassword initialEmail="me@example.com" onBack={vi.fn()} />);
      await send(user);
      expect(await screen.findByText('Too many requests.')).toBeInTheDocument();
      expect(screen.queryByLabelText('Code from the email')).not.toBeInTheDocument();
    });

    it('disables the form and says so while the code is being sent', async () => {
      let finish;
      sendPasswordReset.mockReturnValue(new Promise((r) => { finish = r; }));
      const user = userEvent.setup();
      render(<ForgotPassword initialEmail="me@example.com" onBack={vi.fn()} />);
      await send(user);
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
      expect(backButton()).toBeDisabled();
      finish({ success: true, message: SENT });
      expect(await screen.findByText(SENT)).toBeInTheDocument();
      expect(backButton()).toBeEnabled();
    });
  });

  describe('step 2: code and new password', () => {
    it.each([
      ['a missing code', {}, 'Enter the code from the email'],
      ['a blank code', { code: '   ', password: 'newsecret', confirm: 'newsecret' }, 'Enter the code from the email'],
      ['a short password', { code: '123456', password: '12345', confirm: '12345' }, 'Password must be at least 6 characters'],
      ['passwords that differ', { code: '123456', password: 'secret123', confirm: 'secret124' }, 'Passwords do not match'],
    ])('rejects %s without calling Cognito', async (_, values, message) => {
      const user = userEvent.setup();
      await toConfirmStep(user);
      await fillConfirm(user, values);
      await save(user);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(resetPassword).not.toHaveBeenCalled();
    });

    it('hides the sent notice while an error is shown, and brings it back on typing', async () => {
      const user = userEvent.setup();
      await toConfirmStep(user);
      await save(user);
      expect(screen.getByText('Enter the code from the email')).toBeInTheDocument();
      expect(screen.queryByText(SENT)).not.toBeInTheDocument();
      await user.type(screen.getByLabelText('Code from the email'), '1');
      expect(screen.getByText(SENT)).toBeInTheDocument();
    });

    it('saves the new password, signs in with it, and tells the page', async () => {
      const onSignedIn = vi.fn();
      const user = userEvent.setup();
      await toConfirmStep(user, { onSignedIn });
      await fillConfirm(user, GOOD);
      await save(user);
      expect(resetPassword).toHaveBeenCalledWith('me@example.com', '123456', 'newsecret');
      expect(login).toHaveBeenCalledWith('me@example.com', 'newsecret');
      expect(onSignedIn).toHaveBeenCalledTimes(1);
    });

    it('asks the learner to sign in themselves when the automatic sign-in fails', async () => {
      login.mockResolvedValue({ success: false, error: 'Something went wrong' });
      const onSignedIn = vi.fn();
      const user = userEvent.setup();
      await toConfirmStep(user, { onSignedIn });
      await fillConfirm(user, GOOD);
      await save(user);
      expect(await screen.findByText('Password saved. Please sign in with your new password.')).toBeInTheDocument();
      expect(onSignedIn).not.toHaveBeenCalled();
      expect(backButton()).toBeEnabled();
    });

    it('shows the error and does not sign in when the code is wrong', async () => {
      resetPassword.mockResolvedValue({ success: false, error: "That code doesn't match." });
      const user = userEvent.setup();
      await toConfirmStep(user);
      await fillConfirm(user, { ...GOOD, code: '000000' });
      await save(user);
      expect(await screen.findByText("That code doesn't match.")).toBeInTheDocument();
      expect(login).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Save New Password' })).toBeEnabled();
    });

    it('disables the form while the new password is being saved', async () => {
      let finish;
      resetPassword.mockReturnValue(new Promise((r) => { finish = r; }));
      const user = userEvent.setup();
      await toConfirmStep(user);
      await fillConfirm(user, GOOD);
      await save(user);
      expect(screen.getByLabelText('Code from the email')).toBeDisabled();
      expect(screen.getByLabelText('New password')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Send a new code' })).toBeDisabled();
      expect(backButton()).toBeDisabled();
      finish({ success: false, error: 'That code has expired.' });
      expect(await screen.findByText('That code has expired.')).toBeInTheDocument();
    });

    it('can send a new code to the same email', async () => {
      const user = userEvent.setup();
      await toConfirmStep(user);
      await user.click(screen.getByRole('button', { name: 'Send a new code' }));
      expect(sendPasswordReset).toHaveBeenCalledTimes(2);
      expect(sendPasswordReset).toHaveBeenLastCalledWith('me@example.com');
      expect(screen.getByLabelText('Code from the email')).toBeInTheDocument();
    });
  });

  it('goes back to sign-in', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<ForgotPassword onBack={onBack} />);
    await user.click(backButton());
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
