import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareScore from './ShareScore';

const brag = 'I scored 87% on the Storage quiz';
const campaign = 'quiz-score';

// userEvent.setup() installs its own clipboard; replace it with ours afterwards.
const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
const mockClipboard = (value) => Object.defineProperty(window.navigator, 'clipboard', { value, configurable: true });

const renderShare = (props = {}) => {
  const user = userEvent.setup();
  render(<ShareScore brag={brag} campaign={campaign} {...props} />);
  return user;
};

// The page the share points to, as encoded in the LinkedIn link.
const sharedUrl = () => new URL(screen.getByRole('link', { name: /LinkedIn/ }).href).searchParams.get('url');

beforeEach(() => {
  window.gtag = vi.fn();
});

afterEach(() => {
  delete window.gtag;
  if (originalClipboard) Object.defineProperty(window.navigator, 'clipboard', originalClipboard);
  else delete window.navigator.clipboard;
});

describe('ShareScore', () => {
  it('shows the label, defaulting to "Challenge a friend"', () => {
    const { rerender } = render(<ShareScore brag={brag} campaign={campaign} />);
    expect(screen.getByText('Challenge a friend')).toBeInTheDocument();
    rerender(<ShareScore brag={brag} campaign={campaign} label="Passed! Share your score" />);
    expect(screen.getByText('Passed! Share your score')).toBeInTheDocument();
  });

  it("links to the hub's readiness check for this cert, tagged with the campaign", () => {
    renderShare();
    const url = new URL(sharedUrl());
    expect(url.origin).toBe('https://levelupstudyhub.com'); // shared links carry the public name
    expect(url.searchParams.get('check')).toMatch(/\S/);
    expect(url.searchParams.get('utm_source')).toBe('share');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe(campaign);
    expect(url.hash).toBe('#readiness');
  });

  it('builds LinkedIn, X and Facebook share links that open in a new tab', () => {
    renderShare();
    const url = sharedUrl();
    const x = new URL(screen.getByRole('link', { name: /^X$/ }).href);
    expect(x.searchParams.get('url')).toBe(url);
    expect(x.searchParams.get('text')).toMatch(new RegExp(`^${brag} for AWS .+\\. Can you beat it\\?`));
    expect(x.searchParams.get('hashtags')).toMatch(/^AWS,\w+$/);
    const fb = new URL(screen.getByRole('link', { name: /Facebook/ }).href);
    expect(fb.searchParams.get('u')).toBe(url);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('copies the brag and link to the clipboard, says "Copied", then resets', async () => {
    renderShare();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });
    // Fake setTimeout for the 2 s "Copied" reset. userEvent waits on setTimeout itself, so click with fireEvent here.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy link' })); });

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0][0];
    expect(copied.startsWith(`${brag} for AWS `)).toBe(true);
    expect(copied.endsWith(` ${sharedUrl()}`)).toBe(true);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(window.gtag).toHaveBeenCalledWith('event', 'share', expect.objectContaining({ method: 'copy', content_type: campaign }));

    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('stays quiet when the clipboard refuses', async () => {
    const user = renderShare();
    mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it("doesn't crash when the browser has no clipboard API", async () => {
    const user = renderShare();
    mockClipboard(undefined);
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('tracks which network was used, and still works without analytics', async () => {
    const user = renderShare();
    const link = screen.getByRole('link', { name: /LinkedIn/ });
    link.addEventListener('click', (e) => e.preventDefault()); // jsdom can't open the new tab
    await user.click(link);
    expect(window.gtag).toHaveBeenCalledWith('event', 'share', expect.objectContaining({ method: 'linkedin', content_type: campaign }));

    window.gtag = () => { throw new Error('blocked'); };
    await user.click(link);
    delete window.gtag;
    await user.click(link);
  });
});
