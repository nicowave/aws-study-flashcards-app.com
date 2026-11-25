import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadinessCheck from './ReadinessCheck';
import { READINESS_QUESTIONS } from '../data/readiness';
import { certifications } from '../data/certifications';
import { PROMOTIONS } from '../services/offers';
import { API_BASE_URL } from '../config/auth.config';

// Pretend the page was opened on the new name, so we can see which links go through onThisName.
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
});

const CERT_IDS = Object.keys(READINESS_QUESTIONS);

// --- reading the screen ------------------------------------------------------

const certButtons = () => screen.getAllByRole('button'); // the pick screen has only the cert buttons
const questionHeading = () => screen.findByRole('heading', { level: 3 });
/** The data question on screen (options are shuffled on screen; text is not). */
const currentQuestion = () => {
  const text = screen.getByRole('heading', { level: 3 }).textContent;
  for (const certId of CERT_IDS) {
    const q = READINESS_QUESTIONS[certId].find((x) => x.question === text);
    if (q) return { certId, q };
  }
  throw new Error(`question not in the data: ${text}`);
};
const radioFor = (optionText) =>
  screen.getAllByRole('radio').find((r) => within(r).queryByText(optionText, { exact: true }));
const nextButton = () => screen.getByRole('button', { name: /next|see my score/i });
const rightText = (q) => q.options[q.answer];
const wrongText = (q) => q.options[(q.answer + 1) % q.options.length];
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);

/** Pick the n-th certification and wait for its first question. Returns its cert id. */
const startCheck = async (user, n = 0) => {
  await user.click(certButtons()[n]);
  await questionHeading();
  return currentQuestion().certId;
};

/**
 * Answer every question. `isRight(q)` decides each answer (default: all right).
 * Returns the questions in the order they were shown.
 */
const answerAll = async (user, isRight = () => true) => {
  const shown = [];
  for (;;) {
    const { q } = currentQuestion();
    shown.push(q);
    await user.click(radioFor(isRight(q) ? rightText(q) : wrongText(q)));
    const last = /see my score/i.test(nextButton().textContent);
    await user.click(nextButton());
    if (last) break;
  }
  return shown;
};

const emailInput = () => screen.getByLabelText(/^email$/i);
const sendButton = () => screen.getByRole('button', { name: /show my score|sending/i });

/** Pick a cert, answer everything, give an email. Returns { certId, shown }. */
const finishCheck = async (user, { n = 0, isRight, email = 'learner@example.com' } = {}) => {
  const certId = await startCheck(user, n);
  const shown = await answerAll(user, isRight);
  await user.type(emailInput(), email);
  await user.click(sendButton());
  return { certId, shown };
};

/** Expected per-domain tally from the data, for the given answer rule. */
const tally = (certId, isRight = () => true) => {
  const map = new Map();
  for (const q of READINESS_QUESTIONS[certId]) {
    const d = map.get(q.domain) || { name: q.domain, correct: 0, total: 0 };
    d.total += 1;
    if (isRight(q)) d.correct += 1;
    map.set(q.domain, d);
  }
  return [...map.values()];
};
const byName = (a, b) => a.name.localeCompare(b.name);
const domainRow = (name) => screen.getByText(name, { selector: 'span' }).parentElement;

// -----------------------------------------------------------------------------

describe('ReadinessCheck', () => {
  describe('picking a certification', () => {
    it('offers one button per certification that has readiness questions', () => {
      render(<ReadinessCheck />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(certButtons()).toHaveLength(CERT_IDS.length);
    });

    it('promises as many questions as every certification has', () => {
      render(<ReadinessCheck />);
      const promised = Number(screen.getByText(/\d+ questions/).textContent.match(/(\d+) questions/)[1]);
      for (const certId of CERT_IDS) expect(READINESS_QUESTIONS[certId]).toHaveLength(promised);
    });

    it("each button starts that certification's own questions, named after a live hub certification", async () => {
      const user = userEvent.setup();
      const started = [];
      for (let n = 0; n < CERT_IDS.length; n++) {
        const { unmount } = render(<ReadinessCheck />);
        const certId = await startCheck(user, n);
        started.push(certId);
        const cert = certifications.find((c) => c.id === certId);
        expect(cert?.status).toBe('available');
        expect(screen.getByText(/Question 1 of/)).toHaveTextContent(`Question 1 of ${READINESS_QUESTIONS[certId].length}`);
        unmount();
      }
      expect(new Set(started)).toEqual(new Set(CERT_IDS));
    });

    it('opens straight into a certification from a shared ?check= link', async () => {
      const certId = CERT_IDS[CERT_IDS.length - 1];
      window.history.replaceState(null, '', `/?check=${certId}`);
      render(<ReadinessCheck />);
      await questionHeading();
      expect(currentQuestion().certId).toBe(certId);
    });

    it('ignores a ?check= link for a certification it does not have', async () => {
      window.history.replaceState(null, '', '/?check=not-a-cert');
      render(<ReadinessCheck />);
      expect(certButtons()).toHaveLength(CERT_IDS.length);
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('records a readiness_start analytics event', async () => {
      const gtag = vi.fn();
      vi.stubGlobal('gtag', gtag);
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      expect(gtag).toHaveBeenCalledWith('event', 'readiness_start', { cert: certId });
    });
  });

  describe('the questions', () => {
    it("asks every one of the certification's questions once, so the domain mix is the data's", async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const shown = await answerAll(user);
      expect(shown.map((q) => q.id).sort()).toEqual(READINESS_QUESTIONS[certId].map((q) => q.id).sort());
    });

    it('shows the domain of each question', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await startCheck(user);
      expect(screen.getByText(currentQuestion().q.domain, { selector: 'p' })).toBeInTheDocument();
    });

    it("shows the question's options, with nothing picked and Next disabled", async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await startCheck(user);
      const { q } = currentQuestion();
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(q.options.length);
      for (const opt of q.options) expect(radioFor(opt)).toBeInTheDocument();
      for (const r of radios) expect(r).toHaveAttribute('aria-checked', 'false');
      expect(nextButton()).toBeDisabled();
    });

    it('marks the picked option, lets the learner change it, and enables Next', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await startCheck(user);
      const { q } = currentQuestion();
      await user.click(radioFor(wrongText(q)));
      expect(radioFor(wrongText(q))).toHaveAttribute('aria-checked', 'true');
      await user.click(radioFor(rightText(q)));
      expect(radioFor(rightText(q))).toHaveAttribute('aria-checked', 'true');
      expect(radioFor(wrongText(q))).toHaveAttribute('aria-checked', 'false');
      expect(nextButton()).toBeEnabled();
    });

    it('moves on with Next and counts the questions', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const total = READINESS_QUESTIONS[certId].length;
      const first = currentQuestion().q;
      await user.click(radioFor(rightText(first)));
      await user.click(nextButton());
      expect(screen.getByText(/Question \d+ of/)).toHaveTextContent(`Question 2 of ${total}`);
      expect(currentQuestion().q.id).not.toBe(first.id);
      expect(nextButton()).toBeDisabled(); // a new question starts unanswered
    });

    it('goes Back to the previous question with its answer kept (no Back on the first)', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await startCheck(user);
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
      const first = currentQuestion().q;
      await user.click(radioFor(wrongText(first)));
      await user.click(nextButton());
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(currentQuestion().q.id).toBe(first.id);
      expect(radioFor(wrongText(first))).toHaveAttribute('aria-checked', 'true');
      expect(nextButton()).toBeEnabled();
    });

    it('shuffles the options but still grades the right answer as right', async () => {
      // With Math.random() = 0 the shuffle moves every option (A becomes the last one).
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await startCheck(user);
      const { q } = currentQuestion();
      const onScreen = screen.getAllByRole('radio').map((r) => q.options.find((o) => within(r).queryByText(o, { exact: true })));
      expect(onScreen).not.toEqual(q.options);
      expect(new Set(onScreen)).toEqual(new Set(q.options));

      const certId = currentQuestion().certId;
      await answerAll(user); // all right
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      await screen.findByText(/on its way to/i);
      expect(sentBody().score).toBe(READINESS_QUESTIONS[certId].length);
    });

    it('ends on a "See my score" button, then asks for an email, and records readiness_complete', async () => {
      const gtag = vi.fn();
      vi.stubGlobal('gtag', gtag);
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      await answerAll(user);
      expect(emailInput()).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled(); // nothing is sent before the email
      expect(gtag).toHaveBeenCalledWith('event', 'readiness_complete', { cert: certId });
    });
  });

  describe('the email step', () => {
    const toEmailStep = async (user) => {
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      await answerAll(user);
      return certId;
    };

    it('does not send without an email', async () => {
      const user = userEvent.setup();
      await toEmailStep(user);
      expect(emailInput()).toBeRequired();
      await user.click(sendButton());
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not send something that is not an email address', async () => {
      const user = userEvent.setup();
      await toEmailStep(user);
      await user.type(emailInput(), 'not-an-email');
      await user.click(sendButton());
      expect(emailInput()).toBeInvalid();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.queryByText(/on its way to/i)).not.toBeInTheDocument();
    });

    it('POSTs the email, certification, score, total, per-domain results, honeypot and visit source', async () => {
      sessionStorage.setItem('awsHub_source', JSON.stringify({ utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch', referrer: '' }));
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const shownCert = await startCheck(user);
      // Get every question of one domain wrong: that domain is the weakest area.
      const weakest = READINESS_QUESTIONS[shownCert][0].domain;
      const rule = (q) => q.domain !== weakest;
      await answerAll(user, rule);
      await user.type(emailInput(), '  learner@example.com  ');
      await user.click(sendButton());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_BASE_URL}/v1/leads`);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = sentBody();
      const questions = READINESS_QUESTIONS[shownCert];
      const expected = tally(shownCert, rule);
      expect(body).toEqual({
        email: 'learner@example.com',
        certId: shownCert,
        score: questions.filter(rule).length,
        total: questions.length,
        domains: expect.any(Array),
        website: '',
        source: { utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch', referrer: '' },
      });
      expect([...body.domains].sort(byName)).toEqual([...expected].sort(byName));
      // the weakest area is reported with nothing right, so the plan can start there
      const weak = body.domains.find((d) => d.name === weakest);
      expect(weak.correct).toBe(0);
      expect(weak.total).toBeGreaterThan(0);
    });

    it('sends what the bot honeypot holds so the backend can drop it', async () => {
      const user = userEvent.setup();
      await toEmailStep(user);
      const honeypot = document.querySelector('input[name="website"]');
      expect(honeypot).toHaveAttribute('tabindex', '-1');
      expect(honeypot).toHaveAttribute('aria-hidden', 'true');
      await user.type(honeypot, 'http://spam.example');
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      expect(sentBody().website).toBe('http://spam.example');
    });

    it('sends only once while the request is in flight (button or Enter)', async () => {
      let finish;
      fetchMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      const user = userEvent.setup();
      await toEmailStep(user);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      expect(sendButton()).toBeDisabled();
      expect(sendButton()).toHaveTextContent(/sending/i);
      await user.click(sendButton());
      await user.type(emailInput(), '{Enter}');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => finish(reply(200, { ok: true })));
      expect(await screen.findByText(/on its way to/i)).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("shows the server's error, keeps the email, and a retry clears the error", async () => {
      fetchMock.mockResolvedValueOnce(reply(400, { error: 'Please enter a valid email address.' }));
      const user = userEvent.setup();
      await toEmailStep(user);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email address.');
      expect(screen.queryByText(/on its way to/i)).not.toBeInTheDocument();
      expect(emailInput()).toHaveValue('learner@example.com');
      expect(sendButton()).toBeEnabled();

      await user.click(sendButton()); // next reply is the default success
      expect(await screen.findByText(/on its way to/i)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('falls back to a generic message when the error has no readable body', async () => {
      fetchMock.mockResolvedValueOnce(reply(502));
      const user = userEvent.setup();
      await toEmailStep(user);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    });

    it('shows an error when the network request fails, and does not show the score', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const user = userEvent.setup();
      await toEmailStep(user);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      expect((await screen.findByRole('alert')).textContent).not.toBe('');
      expect(screen.queryByText(/on its way to/i)).not.toBeInTheDocument();
      expect(sendButton()).toBeEnabled();
    });
  });

  describe('the result', () => {
    it('shows the score, the per-domain results and where the plan was sent', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const weakest = READINESS_QUESTIONS[certId][0].domain;
      const isRight = (q) => q.domain !== weakest;
      await answerAll(user, isRight);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());

      expect(await screen.findByText(/on its way to/i)).toHaveTextContent('learner@example.com');
      const questions = READINESS_QUESTIONS[certId];
      const score = questions.filter(isRight).length;
      expect(screen.getByText(`/${questions.length}`).parentElement).toHaveTextContent(`${score}/${questions.length}`);
      for (const d of tally(certId, isRight)) expect(domainRow(d.name)).toHaveTextContent(`${d.correct}/${d.total}`);
      const weak = tally(certId, isRight).find((d) => d.name === weakest);
      expect(domainRow(weakest)).toHaveTextContent(`0/${weak.total}`);
    });

    it.each([
      ['every answer right', 1, /close to ready/i],
      ['80% right', 0.8, /close to ready/i],
      ['60% right', 0.6, /getting there/i],
      ['50% right', 0.5, /early days/i],
      ['nothing right', 0, /early days/i],
    ])('gives a verdict for %s', async (_, share, verdict) => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const ids = READINESS_QUESTIONS[certId].map((q) => q.id);
      const right = new Set(ids.slice(0, Math.round(ids.length * share)));
      await answerAll(user, (q) => right.has(q.id));
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      await screen.findByText(/on its way to/i);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(verdict);
      expect(sentBody().score).toBe(right.size);
    });

    it('records a generate_lead event with the score in percent', async () => {
      const gtag = vi.fn();
      vi.stubGlobal('gtag', gtag);
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const ids = READINESS_QUESTIONS[certId].map((q) => q.id);
      const right = new Set(ids.slice(0, 3));
      await answerAll(user, (q) => right.has(q.id));
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      await screen.findByText(/on its way to/i);
      expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { cert: certId, score: Math.round((3 / ids.length) * 100) });
    });

    it("links to that certification's site on the name the page was opened on, with tracking tags", async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const { certId } = await finishCheck(user);
      await screen.findByText(/on its way to/i);
      const site = certifications.find((c) => c.id === certId).url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com');
      const link = screen.getByRole('link', { name: /start studying/i });
      expect(link).toHaveAttribute('href', `${site}/?utm_source=readiness&utm_medium=web&utm_campaign=study-plan`);
    });

    it('share links reopen this check on the public name, with the score in the text', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      await answerAll(user);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      await screen.findByText(/on its way to/i);

      const linkedin = new URL(screen.getByRole('link', { name: 'LinkedIn' }).href);
      const x = new URL(screen.getByRole('link', { name: 'X' }).href);
      for (const a of [screen.getByRole('link', { name: 'LinkedIn' }), screen.getByRole('link', { name: 'X' })]) {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toMatch(/noopener/);
      }
      for (const shared of [new URL(linkedin.searchParams.get('url')), new URL(x.searchParams.get('url'))]) {
        expect(shared.hostname).toBe('aws-study-flashcards-app.com'); // share links keep the public name
        expect(shared.searchParams.get('check')).toBe(certId);
        expect(shared.hash).toBe('#readiness');
      }
      expect(x.searchParams.get('text')).toContain('100%');
    });

    it('copies the share text and link, then the button goes back to normal', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const { certId } = await finishCheck(user);
      await screen.findByText(/on its way to/i);

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }); // only the "Copied" timer
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /copy link/i })); });
      const copied = await navigator.clipboard.readText();
      expect(copied).toMatch(/\d+%/);
      expect(copied).toContain(`check=${certId}`);
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      await act(async () => vi.advanceTimersByTime(2000));
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    it('lets the learner review every question with the right answer and what they chose', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      const certId = await startCheck(user);
      const first = currentQuestion().q;
      await answerAll(user, (q) => q.id !== first.id);
      await user.type(emailInput(), 'learner@example.com');
      await user.click(sendButton());
      await screen.findByText(/on its way to/i);

      const items = within(screen.getByRole('list')).getAllByRole('listitem');
      expect(items).toHaveLength(READINESS_QUESTIONS[certId].length);
      const missed = items.find((li) => within(li).queryByText(first.question));
      expect(missed).toHaveTextContent(`You chose "${wrongText(first)}"`);
      expect(missed).toHaveTextContent(rightText(first));
      const got = items.find((li) => li !== missed);
      expect(got).toHaveTextContent(/Correct:/);
    });

    it('shows the running sale next to the study link, and nothing outside the sale', async () => {
      const [promo] = PROMOTIONS;
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(promo.start + 60_000);
      const user = userEvent.setup();
      const { unmount } = render(<ReadinessCheck />);
      await finishCheck(user);
      await screen.findByText(/on its way to/i);
      expect(screen.getByText(new RegExp(`${promo.single}% off`))).toHaveTextContent(`${promo.label}: ${promo.single}% off the full game until ${promo.ends}`);
      unmount();

      vi.setSystemTime(promo.end);
      render(<ReadinessCheck />);
      await finishCheck(user);
      await screen.findByText(/on its way to/i);
      expect(screen.queryByText(new RegExp(`${promo.single}% off`))).not.toBeInTheDocument();
    });
  });

  describe('restarting', () => {
    it('"Try another certification" goes back to the picker and a new check starts fresh', async () => {
      const user = userEvent.setup();
      render(<ReadinessCheck />);
      await finishCheck(user);
      await screen.findByText(/on its way to/i);
      await user.click(screen.getByRole('button', { name: /try another certification/i }));
      expect(certButtons()).toHaveLength(CERT_IDS.length);

      const certId = await startCheck(user, 1);
      expect(screen.getByText(/Question \d+ of/)).toHaveTextContent('Question 1 of');
      for (const r of screen.getAllByRole('radio')) expect(r).toHaveAttribute('aria-checked', 'false');
      expect(nextButton()).toBeDisabled();

      await answerAll(user, () => false);
      await user.click(sendButton()); // the email is kept from the first check
      await screen.findByText(/on its way to/i);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(sentBody(1)).toMatchObject({ email: 'learner@example.com', certId, score: 0 });
    });
  });

  describe('unsubscribe links', () => {
    it('unsubscribes the email from the link and confirms it', async () => {
      window.history.replaceState(null, '', '/?unsubscribe=learner%40example.com&t=tok123');
      render(<ReadinessCheck />);
      expect(screen.getByRole('status')).toHaveTextContent(/unsubscribing/i);
      expect(await screen.findByText(/won't get any more/i)).toHaveTextContent('learner@example.com');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_BASE_URL}/v1/leads/unsubscribe`);
      expect(JSON.parse(init.body)).toEqual({ email: 'learner@example.com', token: 'tok123' });
    });

    it("shows the server's error when the link is not valid", async () => {
      fetchMock.mockResolvedValueOnce(reply(400, { error: 'This unsubscribe link is not valid.' }));
      window.history.replaceState(null, '', '/?unsubscribe=learner%40example.com&t=bad');
      render(<ReadinessCheck />);
      expect(await screen.findByText('This unsubscribe link is not valid.')).toBeInTheDocument();
    });

    it('does nothing without both the email and the token', () => {
      window.history.replaceState(null, '', '/?unsubscribe=learner%40example.com');
      render(<ReadinessCheck />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
