import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeroRotator from './HeroRotator';
import { HERO_SLIDES } from '../data/heroSlides';

// Pretend the page was opened on a third name, so a link written with either name shows it went through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example'),
}));

const BASE = import.meta.env.BASE_URL;
const ADVANCE_MS = 8000; // how long each headline shows (HeroRotator.jsx)
const total = HERO_SLIDES.length;
const titleOf = (s) => `${s.before}${s.highlight}${s.after}`;
const hrefOf = (href) => {
  if (href.startsWith('https://')) return href.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example');
  if (href.startsWith('/')) return `${BASE}${href.slice(1)}`;
  return href;
};

const slide = () => screen.getByRole('group', { name: new RegExp(`^\\d+ of ${total}: `) });
const h1 = () => screen.getByRole('heading', { level: 1 });
const playButton = () => screen.getByRole('button', { name: /(pause|play) the rotating headlines/i });
const tab = (track) => within(screen.getByRole('group', { name: /choose a study track/i })).getByRole('button', { name: track });
const showing = (s) => {
  expect(h1()).toHaveTextContent(titleOf(s));
  expect(slide()).toHaveAccessibleName(`${HERO_SLIDES.indexOf(s) + 1} of ${total}: ${s.track}`);
};
const tick = (n = 1) => act(() => { vi.advanceTimersByTime(ADVANCE_MS * n); });
// Only the interval is faked: userEvent still needs real setTimeout.
const fakeInterval = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
const reducedMotion = (matches) => vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
  matches: matches && query.includes('reduce'), media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
}));

beforeEach(() => {
  fakeInterval();
});

describe('HeroRotator', () => {
  describe('slides', () => {
    it('opens on the AWS slide, as the one and only h1', () => {
      render(<HeroRotator />);
      expect(HERO_SLIDES[0].id).toBe('aws');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      showing(HERO_SLIDES[0]);
      expect(within(slide()).getByText(HERO_SLIDES[0].badge)).toBeInTheDocument();
      expect(within(slide()).getByText(HERO_SLIDES[0].subtitle)).toBeInTheDocument();
    });

    it('has one track button per slide, in order, with the current one marked', () => {
      render(<HeroRotator />);
      const tabs = within(screen.getByRole('group', { name: /choose a study track/i })).getAllByRole('button');
      expect(tabs.map((t) => t.textContent)).toEqual(HERO_SLIDES.map((s) => s.track));
      expect(tabs[0]).toHaveAttribute('aria-current', 'true');
      tabs.slice(1).forEach((t) => expect(t).not.toHaveAttribute('aria-current'));
    });

    it('keeps a hidden copy of every slide (for height) out of the accessibility tree', () => {
      const { container } = render(<HeroRotator />);
      const sizers = container.querySelectorAll('[aria-hidden="true"][inert]');
      expect(sizers).toHaveLength(total);
      sizers.forEach((el, i) => expect(el).toHaveTextContent(titleOf(HERO_SLIDES[i])));
      // the copies never add a heading or a link to what assistive tech sees
      expect(screen.getAllByRole('heading')).toHaveLength(1);
      expect(screen.getAllByRole('link')).toHaveLength(HERO_SLIDES[0].actions.length);
    });

    it.each(HERO_SLIDES.map((s) => [s.track, s]))('%s: picking the track shows its headline, subtitle and buttons', async (_, s) => {
      const user = userEvent.setup();
      render(<HeroRotator />);
      await user.click(tab(s.track));
      showing(s);
      expect(tab(s.track)).toHaveAttribute('aria-current', 'true');
      const view = within(slide());
      expect(view.getByText(s.badge)).toBeInTheDocument();
      expect(view.getByText(s.subtitle)).toBeInTheDocument();
      const links = view.getAllByRole('link');
      expect(links.map((a) => a.textContent)).toEqual(s.actions.map((a) => a.label));
      links.forEach((a, i) => expect(a).toHaveAttribute('href', hrefOf(s.actions[i].href)));
    });

    it('sends site links through onThisName and page paths under the site root', () => {
      const full = HERO_SLIDES.flatMap((s) => s.actions).filter((a) => a.href.startsWith('https://'));
      const paths = HERO_SLIDES.flatMap((s) => s.actions).filter((a) => a.href.startsWith('/'));
      expect(full.length).toBeGreaterThan(0);
      expect(paths.length).toBeGreaterThan(0);
      render(<HeroRotator />);
      const aws = HERO_SLIDES[0].actions.find((a) => a.href.startsWith('https://'));
      expect(screen.getByRole('link', { name: aws.label })).toHaveAttribute('href', hrefOf(aws.href));
      expect(hrefOf(aws.href)).toContain('page-name.example');
    });
  });

  describe('"soon" tracks', () => {
    const soon = HERO_SLIDES.filter((s) => s.soon);

    it('exist in the data (so these checks mean something)', () => {
      expect(soon.length).toBeGreaterThan(0);
    });

    it.each(soon.map((s) => [s.track, s]))('%s never shows a price and says it is coming soon', async (_, s) => {
      const user = userEvent.setup();
      render(<HeroRotator />);
      await user.click(tab(s.track));
      showing(s);
      expect(slide().textContent).not.toMatch(/\$\s?\d|\d+\s?(usd|dollars)|per month|\/mo\b|\/yr\b/i);
      expect(within(slide()).getByText(s.badge)).toHaveTextContent(/soon/i);
    });

    it('keeps the soon slides free of prices in the data too', () => {
      for (const s of soon) expect(JSON.stringify(s)).not.toMatch(/\$\s?\d/);
    });
  });

  describe('rotation', () => {
    it(`moves to the next track every ${ADVANCE_MS / 1000} seconds`, () => {
      render(<HeroRotator />);
      act(() => { vi.advanceTimersByTime(ADVANCE_MS - 1); });
      showing(HERO_SLIDES[0]);
      act(() => { vi.advanceTimersByTime(1); });
      showing(HERO_SLIDES[1]);
      tick();
      showing(HERO_SLIDES[2]);
    });

    it('makes one pass through every track, then rests on the AWS slide and stops', () => {
      render(<HeroRotator />);
      for (let i = 1; i < total; i += 1) {
        tick();
        showing(HERO_SLIDES[i]);
      }
      tick();
      showing(HERO_SLIDES[0]);
      expect(playButton()).toHaveAccessibleName('Play the rotating headlines');
      tick(total * 3);
      showing(HERO_SLIDES[0]);
    });

    it('keeps rotation silent for screen readers (aria-live off)', () => {
      render(<HeroRotator />);
      expect(slide()).toHaveAttribute('aria-live', 'off');
      tick();
      expect(slide()).toHaveAttribute('aria-live', 'off');
    });

    it('holds while the pointer is over the slide and resumes when it leaves', () => {
      render(<HeroRotator />);
      fireEvent.mouseEnter(slide());
      tick(3);
      showing(HERO_SLIDES[0]);
      fireEvent.mouseLeave(slide());
      tick();
      showing(HERO_SLIDES[1]);
    });

    it('holds while keyboard focus is inside the slide', () => {
      render(<HeroRotator />);
      act(() => { within(slide()).getAllByRole('link')[0].focus(); });
      tick(3);
      showing(HERO_SLIDES[0]);
    });

    it('does not advance while the tab is hidden', () => {
      const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      render(<HeroRotator />);
      tick(3);
      showing(HERO_SLIDES[0]);
      hidden.mockReturnValue(false);
      tick();
      showing(HERO_SLIDES[1]);
    });

    it('never starts when the visitor prefers reduced motion', () => {
      reducedMotion(true);
      render(<HeroRotator />);
      expect(playButton()).toHaveAccessibleName('Play the rotating headlines');
      tick(total);
      showing(HERO_SLIDES[0]);
    });
  });

  describe('pause and play', () => {
    it('comes before the track buttons and the slide in reading order', () => {
      render(<HeroRotator />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBe(playButton());
    });

    it('pauses the rotation, and announces changes from then on', async () => {
      const user = userEvent.setup();
      render(<HeroRotator />);
      expect(playButton()).toHaveAccessibleName('Pause the rotating headlines');
      await user.click(playButton());
      expect(playButton()).toHaveAccessibleName('Play the rotating headlines');
      expect(slide()).toHaveAttribute('aria-live', 'polite');
      tick(total);
      showing(HERO_SLIDES[0]);
    });

    it('plays again from where it was, for another full pass', async () => {
      const user = userEvent.setup();
      render(<HeroRotator />);
      tick(2);
      showing(HERO_SLIDES[2]);
      await user.click(playButton()); // pause
      tick(2);
      showing(HERO_SLIDES[2]);
      await user.click(playButton()); // play
      expect(playButton()).toHaveAccessibleName('Pause the rotating headlines');
      expect(slide()).toHaveAttribute('aria-live', 'off');
      tick();
      showing(HERO_SLIDES[3]);
      // the step count restarts, so it runs a full pass of `total` steps before resting on AWS
      tick(total - 2);
      expect(playButton()).toHaveAccessibleName('Pause the rotating headlines');
      tick();
      showing(HERO_SLIDES[0]);
      expect(playButton()).toHaveAccessibleName('Play the rotating headlines');
    });

    it('picking a track stops the rotation on it and announces it', async () => {
      const user = userEvent.setup();
      render(<HeroRotator />);
      const pick = HERO_SLIDES[total - 1];
      await user.click(tab(pick.track));
      showing(pick);
      expect(playButton()).toHaveAccessibleName('Play the rotating headlines');
      expect(slide()).toHaveAttribute('aria-live', 'polite');
      tick(total);
      showing(pick);
    });

    it('can be played under reduced motion if the visitor asks', async () => {
      reducedMotion(true);
      const user = userEvent.setup();
      render(<HeroRotator />);
      await user.click(playButton());
      tick();
      showing(HERO_SLIDES[1]);
    });
  });
});
