import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsletterSignup from './NewsletterSignup';
import { API_BASE_URL } from '../config/auth.config';

// Pretend the page was opened on the new name, so we can see the link goes through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com'),
}));

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
  window.history.replaceState(null, '', '/');
  delete document.referrer; // drop the per-test override below, if any
});

const emailInput = () => screen.getByLabelText(/^email$/i);
const signUpButton = () => screen.getByRole('button', { name: /sign me up|signing up/i });
const signUp = async (email = 'learner@example.com') => {
  await userEvent.type(emailInput(), email);
  await userEvent.click(signUpButton());
};
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);

describe('NewsletterSignup', () => {
  it('shows the sign-up form with a privacy link on the name the page was opened on', () => {
    render(<NewsletterSignup />);
    expect(emailInput()).toHaveAttribute('type', 'email');
    expect(emailInput()).toBeRequired();
    expect(signUpButton()).toBeEnabled();
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', 'https://levelupstudyhub.com/privacy.html');
  });

  describe('email validation', () => {
    it('does not send an empty email', async () => {
      render(<NewsletterSignup />);
      await userEvent.click(signUpButton());
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not send something that is not an email address', async () => {
      render(<NewsletterSignup />);
      await signUp('not-an-email');
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('accepts a valid address', async () => {
      render(<NewsletterSignup />);
      await userEvent.type(emailInput(), 'learner@example.com');
      expect(emailInput()).toBeValid();
    });
  });

  describe('submitting', () => {
    it('POSTs the trimmed email and this site to the newsletter endpoint', async () => {
      render(<NewsletterSignup />);
      const inputId = emailInput().id;
      await signUp('  learner@example.com  ');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_BASE_URL}/v1/newsletter`);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = sentBody();
      expect(body.email).toBe('learner@example.com');
      expect(body.site).toEqual(expect.any(String));
      expect(body.site).not.toBe('');
      // the input id carries the same site id, so each game's box is distinct
      expect(inputId).toBe(`newsletter-${body.site}`);
      expect(body.website).toBe(''); // honeypot left empty by a person
    });

    it('confirms a new sign-up, and hides the form on later visits', async () => {
      const { unmount } = render(<NewsletterSignup />);
      await signUp();
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent(/you're on the list/i);
      expect(status).toHaveTextContent(/welcome email/i);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      unmount();
      const { container } = render(<NewsletterSignup />);
      expect(container).toBeEmptyDOMElement();
    });

    it('says so when the email was already on the list', async () => {
      fetchMock.mockResolvedValue(reply(200, { ok: true, already: true }));
      render(<NewsletterSignup />);
      await signUp();
      expect(await screen.findByRole('status')).toHaveTextContent(/already on the list/i);
    });

    it('records a newsletter_signup analytics event when analytics is loaded', async () => {
      const gtag = vi.fn();
      vi.stubGlobal('gtag', gtag);
      render(<NewsletterSignup />);
      await signUp();
      await screen.findByRole('status');
      expect(gtag).toHaveBeenCalledWith('event', 'newsletter_signup', { site: sentBody().site });
    });

    it('still confirms the sign-up when analytics throws', async () => {
      vi.stubGlobal('gtag', () => { throw new Error('blocked'); });
      render(<NewsletterSignup />);
      await signUp();
      expect(await screen.findByRole('status')).toHaveTextContent(/on the list/i);
    });

    it('sends what the bot honeypot holds so the backend can drop it', async () => {
      const { container } = render(<NewsletterSignup />);
      const honeypot = container.querySelector('input[name="website"]');
      expect(honeypot).toHaveAttribute('tabindex', '-1');
      await userEvent.type(honeypot, 'http://spam.example');
      await signUp();
      expect(sentBody().website).toBe('http://spam.example');
    });

    it('sends the campaign tags and an outside referrer, but not our own sites as referrer', async () => {
      window.history.replaceState(null, '', '/?utm_source=reddit&utm_medium=social&utm_campaign=launch');
      Object.defineProperty(document, 'referrer', { value: 'https://www.reddit.com/r/AWSCertifications/', configurable: true });
      const { unmount } = render(<NewsletterSignup />);
      await signUp();
      expect(sentBody().source).toEqual({
        utm_source: 'reddit',
        utm_medium: 'social',
        utm_campaign: 'launch',
        referrer: 'https://www.reddit.com/r/AWSCertifications/',
      });

      unmount();
      localStorage.clear();
      Object.defineProperty(document, 'referrer', { value: 'https://levelupstudyhub.com/', configurable: true });
      render(<NewsletterSignup />);
      await signUp();
      expect(sentBody(1).source.referrer).toBe('');
    });
  });

  describe('no double submit', () => {
    it('shows a busy button and sends only once while the request is in flight', async () => {
      let finish;
      fetchMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      render(<NewsletterSignup />);
      await signUp();
      expect(signUpButton()).toBeDisabled();
      expect(signUpButton()).toHaveTextContent(/signing up/i);
      await userEvent.click(signUpButton());
      expect(fetchMock).toHaveBeenCalledTimes(1);

      finish(reply(200, { ok: true }));
      expect(await screen.findByRole('status')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('errors', () => {
    it("shows the server's error message and keeps the form so the learner can fix it", async () => {
      fetchMock.mockResolvedValueOnce(reply(400, { error: 'Please enter a valid email address.' }));
      render(<NewsletterSignup />);
      await signUp();
      expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email address.');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(signUpButton()).toBeEnabled();
      expect(emailInput()).toHaveValue('learner@example.com');
    });

    it('falls back to a generic message when the error has no readable body', async () => {
      fetchMock.mockResolvedValueOnce(reply(502));
      render(<NewsletterSignup />);
      await signUp();
      expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    });

    it('shows an error when the network request fails', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      render(<NewsletterSignup />);
      await signUp();
      // the browser's own message is shown as is (e.g. "Failed to fetch"); only require an error
      expect((await screen.findByRole('alert')).textContent).not.toBe('');
      expect(signUpButton()).toBeEnabled();
    });

    it('does not remember a failed sign-up, and a retry clears the error', async () => {
      fetchMock.mockResolvedValueOnce(reply(500, { error: 'Server busy' }));
      const { unmount } = render(<NewsletterSignup />);
      await signUp();
      await screen.findByRole('alert');

      await userEvent.click(signUpButton()); // next reply is the default success
      expect(await screen.findByRole('status')).toHaveTextContent(/on the list/i);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      unmount();
    });

    it('a failed sign-up leaves the form showing on the next visit', async () => {
      fetchMock.mockResolvedValueOnce(reply(500, { error: 'Server busy' }));
      const { unmount } = render(<NewsletterSignup />);
      await signUp();
      await screen.findByRole('alert');
      unmount();
      render(<NewsletterSignup />);
      expect(emailInput()).toBeInTheDocument();
    });
  });
});
