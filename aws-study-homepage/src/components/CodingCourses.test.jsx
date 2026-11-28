import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CodingCourses, { PromoBanner, COURSES as EXPORTED, OTHER_COURSES as OTHER_EXPORTED } from './CodingCourses';
import { COURSES, OTHER_COURSES } from '../data/courses';
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY } from '../data/prices';
import { PROMOTIONS } from '../services/offers';
import { SITE_SUBDOMAINS } from '../config/auth.config';

// Pretend the page was opened on a third name, so a link written with either name shows it went through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example'),
}));

const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] }); // only the clock
  vi.setSystemTime(time);
};
// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const cents = (price) => Math.round(Number(price.replace('$', '')) * 100);
const discounted = (price, percent) => {
  const c = cents(price);
  return `$${((c - Math.round((c * percent) / 100)) / 100).toFixed(2)}`;
};
const onPageName = (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example');

const courseCard = (title) => screen.getByRole('heading', { name: title, level: 3 }).closest('.course-card');
const proCallout = () => screen.getByRole('heading', { name: /every course and every certification/i }).closest('div').parentElement;
const ALL_COURSES = COURSES.length + OTHER_COURSES.length;

beforeEach(() => {
  at(promo.end + MINUTE); // outside any sale unless a test says otherwise
});

describe('CodingCourses', () => {
  it('re-exports the course list from the data module (the hub footer reads it)', () => {
    expect(EXPORTED).toBe(COURSES);
  });

  it('is the #courses section, and the bundle is gone', () => {
    render(<CodingCourses />);
    const section = screen.getByRole('heading', { level: 2 }).closest('section');
    expect(section).toHaveAttribute('id', 'courses');
    expect(section).not.toHaveTextContent(/developer path|bundle|one-time|once\b/i);
    expect(screen.queryByRole('button')).not.toBeInTheDocument(); // nothing is bought here
  });

  describe('course cards', () => {
    it('shows one card per course from courses.js, in order', () => {
      render(<CodingCourses />);
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles.slice(0, COURSES.length)).toEqual(COURSES.map((c) => c.title));
    });

    it.each(COURSES.map((c) => [c.title, c]))('%s: tutorials, hours, blurb, mark and the monthly and yearly price', (_, c) => {
      render(<CodingCourses />);
      const card = within(courseCard(c.title));
      expect(card.getByText(`${c.tutorials} tutorials · about ${c.hours} hours`)).toBeInTheDocument();
      expect(card.getByText(c.blurb)).toBeInTheDocument();
      expect(card.getByText(c.mark)).toBeInTheDocument();
      expect(courseCard(c.title)).toHaveTextContent(`${PRODUCT_MONTHLY}/month or ${PRODUCT_YEARLY}/year`);
      expect(card.getByText(/start free/i)).toBeInTheDocument();
    });

    it.each(COURSES.map((c) => [c.title, c]))('%s: the whole card links to its site through onThisName', (_, c) => {
      render(<CodingCourses />);
      expect(courseCard(c.title)).toHaveAttribute('href', onPageName(c.url));
    });

    it('keeps each course on its own site with whole tutorial and hour counts', () => {
      expect(new Set(COURSES.map((c) => c.url)).size).toBe(COURSES.length);
      for (const c of COURSES) {
        expect(c.url).toMatch(/^https:\/\/[a-z]+\.levelupstudyhub\.com$/);
        expect(Number.isInteger(c.tutorials) && c.tutorials > 0).toBe(true);
        expect(Number.isInteger(c.hours) && c.hours > 0).toBe(true);
      }
    });

    // A site outside SITE_SUBDOMAINS has no door on the new name yet, and onThisName leaves its link as written.
    it('writes a course on the new name only once its site answers there', () => {
      for (const c of [...COURSES, ...OTHER_COURSES]) {
        const [sub, ...root] = new URL(c.url).hostname.split('.');
        if (SITE_SUBDOMAINS.includes(sub)) expect(root.join('.')).toBe('levelupstudyhub.com');
        else expect(root.join('.')).toBe('aws-study-flashcards-app.com');
      }
    });

    it('never strikes a price through outside a sale', () => {
      const { container } = render(<CodingCourses />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(new RegExp(promo.label))).not.toBeInTheDocument();
    });
  });

  describe('Pro call-out (in place of the old bundle)', () => {
    it('says Pro covers every course and certification, for the Pro price, and links to the plans', () => {
      render(<CodingCourses />);
      expect(within(proCallout()).getByText(PRO_YEARLY)).toBeInTheDocument();
      expect(proCallout()).toHaveTextContent(`all ${ALL_COURSES} coding courses and every certification`);
      expect(within(proCallout()).getByRole('link', { name: 'See Pro' })).toHaveAttribute('href', '#plans');
    });
  });

  describe('more courses', () => {
    const other = OTHER_COURSES[0];
    const card = () => courseCard(other.title);
    const withLive = (live, fn) => { const was = other.live; other.live = live; try { fn(); } finally { other.live = was; } };

    it('re-exports the list and keeps it apart from the four main courses', () => {
      expect(OTHER_EXPORTED).toBe(OTHER_COURSES);
      expect(OTHER_COURSES.length).toBeGreaterThan(0);
      expect(COURSES.map((c) => c.id)).not.toContain(other.id);
    });

    it('shows modules, hours, blurb and price, and says Pro includes it', () => {
      render(<CodingCourses />);
      const c = within(card());
      expect(c.getByText(`${other.modules} modules · about ${other.hours} hours`)).toBeInTheDocument();
      expect(c.getByText(other.blurb)).toBeInTheDocument();
      expect(card()).toHaveTextContent(`${PRODUCT_MONTHLY}/month or ${PRODUCT_YEARLY}/year`);
      expect(c.getByText(/included in pro/i)).toBeInTheDocument();
    });

    it('is a card without a link while its site is not live', () => {
      withLive(false, () => {
        render(<CodingCourses />);
        expect(card().tagName).toBe('DIV');
        expect(within(card()).getByText('Coming soon')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: new RegExp(other.title) })).not.toBeInTheDocument();
      });
    });

    it('links to its site through onThisName once live', () => {
      withLive(true, () => {
        render(<CodingCourses />);
        expect(card()).toHaveAttribute('href', onPageName(other.url));
        expect(within(card()).getByText(/start free/i)).toBeInTheDocument();
      });
    });

    it('takes part in sales like the other courses', () => {
      at(promo.start + MINUTE);
      render(<CodingCourses />);
      expect(within(card()).getByText(discounted(PRODUCT_MONTHLY, promo.single))).toBeInTheDocument();
    });
  });

  describe('during a sale', () => {
    it('shows each course at the sale price, monthly and yearly, with the full prices struck through', () => {
      at(promo.start + MINUTE);
      render(<CodingCourses />);
      for (const c of COURSES) {
        const card = courseCard(c.title);
        expect(within(card).getByText(discounted(PRODUCT_MONTHLY, promo.single))).toBeInTheDocument();
        expect(within(card).getByText(discounted(PRODUCT_YEARLY, promo.single))).toBeInTheDocument();
        expect([...card.querySelectorAll('s')].map((s) => s.textContent)).toEqual([PRODUCT_MONTHLY, PRODUCT_YEARLY]);
      }
    });

    it('keeps full prices while the sale is only being teased', () => {
      at(promo.teaseFrom + MINUTE);
      const { container } = render(<CodingCourses />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.getAllByText(PRODUCT_MONTHLY)).toHaveLength(ALL_COURSES);
    });

    it('goes back to full price the moment the sale ends', () => {
      at(promo.end);
      const { container } = render(<CodingCourses />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(discounted(PRODUCT_MONTHLY, promo.single))).not.toBeInTheDocument();
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
    expect(banner()).toHaveTextContent(`${promo.single}% off the first payment of every course and certification`);
    expect(banner()).toHaveTextContent(`${promo.pro}% off your first year of Pro`);
    expect(banner()).not.toHaveTextContent(/bundle|developer path/i);
    expect(banner()).not.toHaveTextContent(/applied at checkout/i);
  });

  it.each([
    ['from its first moment', () => promo.start],
    ['until its last moment', () => promo.end - 1],
  ])('shows the running sale %s', (_, time) => {
    at(time());
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label}: ${promo.single}% off the first payment of every course and certification`);
    expect(banner()).toHaveTextContent(`until ${promo.ends}`);
    expect(banner()).toHaveTextContent(/applied at checkout/i);
    expect(banner()).not.toHaveTextContent(/starts/i);
  });
});
