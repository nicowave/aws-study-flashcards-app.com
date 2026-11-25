import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureSource, track, submitReadiness, unsubscribe, subscribeNewsletter } from './leads';
import { API_BASE_URL } from '../config/auth.config';

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: body === undefined ? () => Promise.reject(new SyntaxError('no body')) : () => Promise.resolve(body),
});

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(reply(200, { ok: true }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
  delete document.referrer; // drop a per-test override, if any
});

const openPage = (search, referrer = '') => {
  window.history.replaceState(null, '', `/${search}`);
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
};
const sent = (call = 0) => ({ url: fetchMock.mock.calls[call][0], body: JSON.parse(fetchMock.mock.calls[call][1].body) });
/** The source the next request carries. */
const sourceSent = async () => {
  fetchMock.mockClear();
  await subscribeNewsletter({ email: 'a@example.com', website: '' });
  return sent().body.source;
};

describe('captureSource: where a visit came from', () => {
  it('records the campaign tags and an outside referrer', async () => {
    openPage('?utm_source=reddit&utm_medium=social&utm_campaign=launch&other=1', 'https://www.reddit.com/r/AWSCertifications/');
    captureSource();
    expect(await sourceSent()).toEqual({
      utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch', referrer: 'https://www.reddit.com/r/AWSCertifications/',
    });
  });

  it.each([
    ['the hub on the old name', 'https://aws-study-flashcards-app.com/'],
    ['a game on the new name', 'https://cloud.levelupstudyhub.com/quiz'],
  ])('does not count our own sites as a referrer (%s)', async (_, referrer) => {
    openPage('', referrer);
    captureSource();
    expect((await sourceSent()).referrer).toBe('');
  });

  it('counts a look-alike address as an outside referrer', async () => {
    openPage('', 'https://aws-study-flashcards-app.com.evil.example/');
    captureSource();
    expect((await sourceSent()).referrer).toBe('https://aws-study-flashcards-app.com.evil.example/');
  });

  it('fills missing tags with empty strings', async () => {
    openPage('?utm_source=newsletter');
    captureSource();
    expect(await sourceSent()).toEqual({ utm_source: 'newsletter', utm_medium: '', utm_campaign: '', referrer: '' });
  });

  it('keeps the first source of the visit when later pages have no tags', async () => {
    openPage('?utm_source=reddit&utm_medium=social&utm_campaign=launch');
    captureSource();
    openPage('', 'https://www.google.com/');
    captureSource();
    expect((await sourceSent()).utm_source).toBe('reddit');
  });

  it('switches to a new tracked link opened in the same visit', async () => {
    openPage('?utm_source=reddit');
    captureSource();
    openPage('?utm_source=share&utm_medium=social&utm_campaign=readiness');
    captureSource();
    expect(await sourceSent()).toMatchObject({ utm_source: 'share', utm_campaign: 'readiness' });
  });

  it('sends an empty source when nothing was captured, or when storage is blocked', async () => {
    expect(await sourceSent()).toEqual({});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    openPage('?utm_source=reddit');
    expect(() => captureSource()).not.toThrow();
    expect(await sourceSent()).toEqual({});
  });
});

describe('track', () => {
  it('sends a Google Analytics event when analytics is loaded', () => {
    const gtag = vi.fn();
    vi.stubGlobal('gtag', gtag);
    track('readiness_start', { cert: 'x' });
    expect(gtag).toHaveBeenCalledWith('event', 'readiness_start', { cert: 'x' });
  });

  it('does nothing without analytics, and never throws', () => {
    expect(() => track('x')).not.toThrow();
    vi.stubGlobal('gtag', () => { throw new Error('blocked'); });
    expect(() => track('x')).not.toThrow();
  });
});

describe('API calls', () => {
  it('submitReadiness POSTs the lead with the visit source', async () => {
    openPage('?utm_source=reddit');
    captureSource();
    const domains = [{ name: 'D1', correct: 1, total: 2 }];
    await submitReadiness({ email: 'a@example.com', certId: 'c', score: 1, total: 2, domains, website: '' });
    const { url, body } = sent();
    expect(url).toBe(`${API_BASE_URL}/v1/leads`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } });
    expect(body).toEqual({
      email: 'a@example.com', certId: 'c', score: 1, total: 2, domains, website: '',
      source: { utm_source: 'reddit', utm_medium: '', utm_campaign: '', referrer: '' },
    });
  });

  it('unsubscribe POSTs the email and token', async () => {
    await unsubscribe('a@example.com', 'tok');
    expect(sent()).toEqual({ url: `${API_BASE_URL}/v1/leads/unsubscribe`, body: { email: 'a@example.com', token: 'tok' } });
  });

  it("subscribeNewsletter POSTs the email as the hub's sign-up and returns the reply", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { ok: true, already: true }));
    await expect(subscribeNewsletter({ email: 'a@example.com', website: 'bot' })).resolves.toEqual({ ok: true, already: true });
    expect(sent()).toEqual({ url: `${API_BASE_URL}/v1/newsletter`, body: { email: 'a@example.com', site: 'hub', website: 'bot', source: {} } });
  });

  it("rejects with the server's error message", async () => {
    fetchMock.mockResolvedValueOnce(reply(429, { error: 'Too many emails today.' }));
    await expect(unsubscribe('a@example.com', 'tok')).rejects.toThrow('Too many emails today.');
  });

  it('rejects with a generic message when the error has no message or no body', async () => {
    fetchMock.mockResolvedValueOnce(reply(500, {}));
    await expect(unsubscribe('a@example.com', 'tok')).rejects.toThrow(/something went wrong/i);
    fetchMock.mockResolvedValueOnce(reply(502));
    await expect(unsubscribe('a@example.com', 'tok')).rejects.toThrow(/something went wrong/i);
  });

  it('resolves to an empty object when a success has no body', async () => {
    fetchMock.mockResolvedValueOnce(reply(204));
    await expect(unsubscribe('a@example.com', 'tok')).resolves.toEqual({});
  });
});
