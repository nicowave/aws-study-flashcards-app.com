import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsletterSignup from './NewsletterSignup';
import { API_BASE_URL } from '../config/auth.config';

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: body === undefined ? () => Promise.reject(new SyntaxError('no body')) : () => Promise.resolve(body),
});

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(reply(200, { ok: true }));
  vi.stubGlobal('fetch', fetchMock); // never hit the real API
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const emailInput = () => screen.getByLabelText(/^email$/i);
const signUpButton = () => screen.getByRole('button', { name: /sign me up|signing up/i });
const signUp = async (user, email = 'learner@example.com') => {
  await user.type(emailInput(), email);
  await user.click(signUpButton());
};
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);
const onTheList = () => screen.findByRole('heading', { name: /on the list/i });

describe('NewsletterSignup (hub)', () => {
  it('shows the sign-up form with a privacy link', () => {
    render(<NewsletterSignup />);
    expect(emailInput()).toHaveAttribute('type', 'email');
    expect(emailInput()).toBeRequired();
    expect(signUpButton()).toBeEnabled();
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy.html');
  });

  describe('email validation', () => {
    it('does not send an empty email', async () => {
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await user.click(signUpButton());
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not send something that is not an email address', async () => {
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user, 'not-an-email');
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('submitting', () => {
    it("POSTs the trimmed email, the hub's site id, the honeypot and the visit source", async () => {
      sessionStorage.setItem('awsHub_source', JSON.stringify({ utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch', referrer: '' }));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user, '  learner@example.com  ');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_BASE_URL}/v1/newsletter`);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(sentBody()).toEqual({
        email: 'learner@example.com',
        site: 'hub',
        website: '', // honeypot left empty by a person
        source: { utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch', referrer: '' },
      });
    });

    it('sends an empty source when the visit was not tracked', async () => {
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(sentBody().source).toEqual({});
    });

    it('sends what the bot honeypot holds so the backend can drop it', async () => {
      const user = userEvent.setup();
      const { container } = render(<NewsletterSignup />);
      const honeypot = container.querySelector('input[name="website"]');
      expect(honeypot).toHaveAttribute('tabindex', '-1');
      expect(honeypot).toHaveAttribute('aria-hidden', 'true');
      await user.type(honeypot, 'http://spam.example');
      await signUp(user);
      expect(sentBody().website).toBe('http://spam.example');
    });

    it('confirms a new sign-up and hides the form', async () => {
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(await onTheList()).not.toHaveTextContent(/already/i);
      expect(screen.getByText(/welcome email/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
    });

    it('says so when the email was already on the list', async () => {
      fetchMock.mockResolvedValue(reply(200, { ok: true, already: true }));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(await onTheList()).toHaveTextContent(/already on the list/i);
      expect(screen.queryByText(/welcome email/i)).not.toBeInTheDocument();
    });

    it('records a newsletter_signup analytics event for the hub', async () => {
      const gtag = vi.fn();
      vi.stubGlobal('gtag', gtag);
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      await onTheList();
      expect(gtag).toHaveBeenCalledWith('event', 'newsletter_signup', { site: 'hub' });
    });

    it('still confirms the sign-up when analytics throws', async () => {
      vi.stubGlobal('gtag', () => { throw new Error('blocked'); });
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(await onTheList()).toBeInTheDocument();
    });
  });

  describe('remembered sign-up', () => {
    it('shows "on the list" instead of the form on later visits', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<NewsletterSignup />);
      await signUp(user);
      await onTheList();
      unmount();

      render(<NewsletterSignup />);
      expect(screen.getByRole('heading', { name: /on the list/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
    });

    // Regression: a returning subscriber (or one who was already on the list) was told to
    // "check your inbox for a welcome email" on every later visit
    it('on a later visit, says "already on the list" and no longer promises a welcome email', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<NewsletterSignup />);
      await signUp(user);
      await onTheList();
      unmount();

      render(<NewsletterSignup />);
      expect(screen.getByRole('heading', { name: /already on the list/i })).toBeInTheDocument();
      expect(screen.queryByText(/welcome email/i)).not.toBeInTheDocument();
    });

    it('still works when storage is blocked (the form shows; the sign-up is just not remembered)', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
      const user = userEvent.setup();
      const { unmount } = render(<NewsletterSignup />);
      await signUp(user);
      expect(await onTheList()).toBeInTheDocument();
      unmount();
      render(<NewsletterSignup />);
      expect(emailInput()).toBeInTheDocument();
    });
  });

  describe('no double submit', () => {
    it('shows a busy button and sends only once while the request is in flight (button or Enter)', async () => {
      let finish;
      fetchMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(signUpButton()).toBeDisabled();
      expect(signUpButton()).toHaveTextContent(/signing up/i);
      await user.click(signUpButton());
      await user.type(emailInput(), '{Enter}');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => finish(reply(200, { ok: true })));
      expect(await onTheList()).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('errors', () => {
    it("shows the server's error message and keeps the form so the visitor can fix it", async () => {
      fetchMock.mockResolvedValueOnce(reply(400, { error: 'Please enter a valid email address.' }));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email address.');
      expect(screen.queryByRole('heading', { name: /on the list/i })).not.toBeInTheDocument();
      expect(signUpButton()).toBeEnabled();
      expect(emailInput()).toHaveValue('learner@example.com');
    });

    it('falls back to a generic message when the error has no readable body', async () => {
      fetchMock.mockResolvedValueOnce(reply(502));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    });

    it('shows an error when the network request fails', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      expect((await screen.findByRole('alert')).textContent).not.toBe('');
      expect(signUpButton()).toBeEnabled();
    });

    it('a retry clears the error, and a failed sign-up is not remembered', async () => {
      fetchMock.mockResolvedValueOnce(reply(500, { error: 'Server busy' }));
      const user = userEvent.setup();
      const { unmount } = render(<NewsletterSignup />);
      await signUp(user);
      await screen.findByRole('alert');
      unmount();

      render(<NewsletterSignup />);
      await signUp(user); // next reply is the default success
      expect(await onTheList()).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('clears the old error as soon as the retry is sent', async () => {
      fetchMock.mockResolvedValueOnce(reply(500, { error: 'Server busy' }));
      let finish;
      const user = userEvent.setup();
      render(<NewsletterSignup />);
      await signUp(user);
      await screen.findByRole('alert');
      fetchMock.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
      await user.click(signUpButton());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await act(async () => finish(reply(200, { ok: true })));
      expect(await onTheList()).toBeInTheDocument();
    });
  });
});
