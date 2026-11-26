import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodingCourses, { PromoBanner, COURSES as EXPORTED, OTHER_COURSES as OTHER_EXPORTED } from './CodingCourses';
import { COURSES, OTHER_COURSES, COURSE_PRICE, BUNDLE_PRICE } from '../data/courses';
import { certifications } from '../data/certifications';
import { useAuth } from '../context/AuthContext';
import { startCheckout } from '../services/billing';
import { PROMOTIONS } from '../services/offers';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
// Billing is the money boundary: never reach Stripe.
vi.mock('../services/billing', () => ({ startCheckout: vi.fn() }));
// Pretend the page was opened on the new name, so we can see links go through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com'),
}));

const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] }); // only the clock; userEvent still needs real timers
  vi.setSystemTime(time);
};
// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const cents = (price) => Math.round(Number(price.replace('$', '')) * 100);
const discounted = (price, percent) => {
  const c = cents(price);
  return `$${((c - Math.round((c * percent) / 100)) / 100).toFixed(2)}`;
};
const onNewName = (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com');

const signedIn = (yes) => vi.mocked(useAuth).mockReturnValue({ isAuthenticated: yes, user: yes ? { email: 'a@example.com' } : null });
const courseCard = (title) => screen.getByRole('heading', { name: title, level: 3 }).closest('a');
const bundle = () => screen.getByRole('heading', { name: /developer path bundle/i }).closest('div').parentElement;
const bundleButton = () => within(bundle()).getByRole('button');

let onShowLogin;
beforeEach(() => {
  signedIn(false);
  vi.mocked(startCheckout).mockReset();
  onShowLogin = vi.fn();
  at(promo.end + MINUTE); // outside any sale unless a test says otherwise
});

describe('CodingCourses', () => {
  it('re-exports the course list from the data module (the hub footer reads it)', () => {
    expect(EXPORTED).toBe(COURSES);
  });

  it('is the #courses section', () => {
    render(<CodingCourses onShowLogin={onShowLogin} />);
    expect(screen.getByRole('heading', { level: 2 }).closest('section')).toHaveAttribute('id', 'courses');
  });

  describe('course cards', () => {
    it('shows one card per course from courses.js, in order', () => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles.slice(0, COURSES.length)).toEqual(COURSES.map((c) => c.title));
    });

    it.each(COURSES.map((c) => [c.title, c]))('%s: tutorials, hours, blurb, mark and price', (_, c) => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      const card = within(courseCard(c.title));
      expect(card.getByText(`${c.tutorials} tutorials · about ${c.hours} hours`)).toBeInTheDocument();
      expect(card.getByText(c.blurb)).toBeInTheDocument();
      expect(card.getByText(c.mark)).toBeInTheDocument();
      expect(card.getByText(COURSE_PRICE)).toBeInTheDocument();
      expect(courseCard(c.title)).toHaveTextContent(/one-time unlock/i);
      expect(card.getByText(/start free/i)).toBeInTheDocument();
    });

    it.each(COURSES.map((c) => [c.title, c]))('%s: the whole card links to its site through onThisName', (_, c) => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(courseCard(c.title)).toHaveAttribute('href', onNewName(c.url));
    });

    it('keeps each course on its own site with whole tutorial and hour counts', () => {
      expect(new Set(COURSES.map((c) => c.url)).size).toBe(COURSES.length);
      for (const c of COURSES) {
        expect(c.url).toMatch(/^https:\/\/[a-z]+\.aws-study-flashcards-app\.com$/);
        expect(Number.isInteger(c.tutorials) && c.tutorials > 0).toBe(true);
        expect(Number.isInteger(c.hours) && c.hours > 0).toBe(true);
      }
    });

    it('never strikes a price through outside a sale', () => {
      const { container } = render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(new RegExp(promo.label))).not.toBeInTheDocument();
    });
  });

  describe('more courses (outside the Developer Path)', () => {
    const other = OTHER_COURSES[0];
    const card = () => screen.getByRole('heading', { name: other.title, level: 3 }).closest('.course-card');
    const withLive = (live, fn) => { const was = other.live; other.live = live; try { fn(); } finally { other.live = was; } };

    it('re-exports the list and keeps the Developer Path list at four courses', () => {
      expect(OTHER_EXPORTED).toBe(OTHER_COURSES);
      expect(OTHER_COURSES.length).toBeGreaterThan(0);
      expect(COURSES.map((c) => c.id)).not.toContain(other.id);
    });

    it('shows modules, hours, blurb and price, and says it is not in the bundle', () => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      const c = within(card());
      expect(c.getByText(`${other.modules} modules · about ${other.hours} hours`)).toBeInTheDocument();
      expect(c.getByText(other.blurb)).toBeInTheDocument();
      expect(c.getByText(COURSE_PRICE)).toBeInTheDocument();
      expect(c.getByText(/not part of the developer path bundle/i)).toBeInTheDocument();
    });

    it('is a card without a link while its site is not live', () => {
      withLive(false, () => {
        render(<CodingCourses onShowLogin={onShowLogin} />);
        expect(card().tagName).toBe('DIV');
        expect(within(card()).getByText('Coming soon')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: new RegExp(other.title) })).not.toBeInTheDocument();
      });
    });

    it('links to its site through onThisName once live', () => {
      withLive(true, () => {
        render(<CodingCourses onShowLogin={onShowLogin} />);
        expect(card()).toHaveAttribute('href', onNewName(other.url));
        expect(within(card()).getByText(/start free/i)).toBeInTheDocument();
      });
    });

    it('takes part in sales like the other courses', () => {
      at(promo.start + MINUTE);
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(within(card()).getByText(discounted(COURSE_PRICE, promo.single))).toBeInTheDocument();
    });
  });

  describe('Developer Path bundle', () => {
    it('offers all four courses plus the Developer Associate game for the bundle price', () => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(within(bundle()).getByText(BUNDLE_PRICE)).toBeInTheDocument();
      expect(bundle()).toHaveTextContent(/all four courses plus the developer associate study game/i);
      expect(COURSES).toHaveLength(4);
    });

    it('states the one-by-one total that matches the real prices, and the bundle saves money', () => {
      const dva = certifications.find((c) => c.id === 'developer-associate');
      const total = COURSES.length * cents(COURSE_PRICE) + cents(dva.price);
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(bundle()).toHaveTextContent(`$${(total / 100).toFixed(2)} if bought one by one`);
      expect(cents(BUNDLE_PRICE)).toBeLessThan(total);
    });

    it('asks a signed-out visitor to sign in instead of starting checkout', async () => {
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(bundleButton()).toHaveTextContent('Sign in to get it');
      await userEvent.click(bundleButton());
      expect(onShowLogin).toHaveBeenCalledTimes(1);
      expect(startCheckout).not.toHaveBeenCalled();
    });

    it('starts checkout for the developer-path plan when a signed-in learner clicks', async () => {
      signedIn(true);
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {})); // redirecting
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(bundleButton()).toHaveTextContent('Get the Developer Path');
      await userEvent.click(bundleButton());
      expect(startCheckout).toHaveBeenCalledTimes(1);
      expect(startCheckout).toHaveBeenCalledWith('developer-path');
      expect(onShowLogin).not.toHaveBeenCalled();
    });

    it('locks the button while redirecting so a double click cannot start two checkouts', async () => {
      signedIn(true);
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<CodingCourses onShowLogin={onShowLogin} />);
      await userEvent.dblClick(bundleButton());
      expect(bundleButton()).toHaveTextContent('Redirecting…');
      expect(bundleButton()).toBeDisabled();
      expect(startCheckout).toHaveBeenCalledTimes(1);
    });

    it('shows an error and lets the learner try again when checkout fails', async () => {
      signedIn(true);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(startCheckout).mockRejectedValueOnce(new Error('network down'));
      render(<CodingCourses onShowLogin={onShowLogin} />);
      await userEvent.click(bundleButton());
      expect(await screen.findByText('Could not start checkout. Please try again.')).toBeInTheDocument();
      expect(bundleButton()).toBeEnabled();
      expect(bundleButton()).toHaveTextContent('Get the Developer Path');

      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      await userEvent.click(bundleButton());
      expect(startCheckout).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Could not start checkout. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('during a sale', () => {
    it('shows each course at the sale price with the full price struck through', () => {
      at(promo.start + MINUTE);
      render(<CodingCourses onShowLogin={onShowLogin} />);
      for (const c of COURSES) {
        const card = courseCard(c.title);
        expect(within(card).getByText(discounted(COURSE_PRICE, promo.single))).toBeInTheDocument();
        expect(card.querySelector('s')).toHaveTextContent(COURSE_PRICE);
      }
    });

    it('shows the bundle at its own (bundle) discount, with the sale pill', () => {
      at(promo.start + MINUTE);
      render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(within(bundle()).getByText(discounted(BUNDLE_PRICE, promo.bundle))).toBeInTheDocument();
      expect(bundle().querySelector('s')).toHaveTextContent(BUNDLE_PRICE);
      expect(bundle()).toHaveTextContent(`${promo.label}: ${promo.bundle}% off until ${promo.ends}`);
    });

    it('keeps full prices while the sale is only being teased', () => {
      at(promo.teaseFrom + MINUTE);
      const { container } = render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.getAllByText(COURSE_PRICE)).toHaveLength(COURSES.length + OTHER_COURSES.length);
      expect(within(bundle()).getByText(BUNDLE_PRICE)).toBeInTheDocument();
    });

    it('goes back to full price the moment the sale ends', () => {
      at(promo.end);
      const { container } = render(<CodingCourses onShowLogin={onShowLogin} />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(discounted(COURSE_PRICE, promo.single))).not.toBeInTheDocument();
    });

    it('still checks out the same plan (the server applies the discount)', async () => {
      at(promo.start + MINUTE);
      signedIn(true);
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<CodingCourses onShowLogin={onShowLogin} />);
      await userEvent.click(bundleButton());
      expect(startCheckout).toHaveBeenCalledWith('developer-path');
    });
  });
});

describe('PromoBanner', () => {
  const banner = () => screen.queryByRole('note');

  it('is hidden before the sale is teased and after it ends', () => {
    at(promo.teaseFrom - MINUTE);
    const { container, unmount } = render(<PromoBanner />);
    expect(container).toBeEmptyDOMElement();
    unmount();
    at(promo.end);
    const again = render(<PromoBanner />);
    expect(again.container).toBeEmptyDOMElement();
  });

  it('announces the coming sale during the teaser, without saying it is applied yet', () => {
    at(promo.teaseFrom + MINUTE);
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label} starts ${promo.starts}`);
    expect(banner()).toHaveTextContent(`${promo.single}% off every course and certification`);
    expect(banner()).toHaveTextContent(`${promo.bundle}% off the Developer Path bundle and Pro`);
    expect(banner()).not.toHaveTextContent(/applied at checkout/i);
  });

  it.each([
    ['from its first moment', () => promo.start],
    ['until its last moment', () => promo.end - 1],
  ])('shows the running sale %s', (_, time) => {
    at(time());
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label}: ${promo.single}% off every course and certification`);
    expect(banner()).toHaveTextContent(`until ${promo.ends}`);
    expect(banner()).toHaveTextContent(/applied at checkout/i);
    expect(banner()).not.toHaveTextContent(/starts/i);
  });
});
