import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GisPage from './GisPage';
import { GIS_PAGE, GIS_WHY, GIS_COURSES, GIS_FOR, GIS_FAQ, GIS_DISCLAIMER } from '../data/gis';
import { COURSES } from '../data/courses';

// Pretend the page was opened on a third name, so a link written with either name shows it went through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example'),
}));

const BASE = import.meta.env.BASE_URL;
const PRICE = /\$\s?\d|\d+(\.\d{2})?\s?(usd|dollars)|free trial|buy now/i;
// A month name followed by a day or year, e.g. "March 3" or "June 2027"
const DATE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d/i;
const section = (title) => screen.getByRole('heading', { name: title, level: 2 }).closest('section');
const courseList = () => within(section('The GIS Courses')).getByRole('list');

describe('GisPage', () => {
  it('has one h1 with the GIS headline and the lede', () => {
    render(<GisPage />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    const { before, highlight, after } = GIS_PAGE.headline;
    expect(h1s[0]).toHaveTextContent(`${before}${highlight}${after}`.trim());
    expect(screen.getByText(GIS_PAGE.lede)).toBeInTheDocument();
    expect(screen.getByText(GIS_PAGE.eyebrow)).toBeInTheDocument();
    expect(GIS_PAGE.eyebrow).toMatch(/coming soon/i);
  });

  it('jumps to the course list from the hero', () => {
    render(<GisPage />);
    const link = screen.getByRole('link', { name: /see the gis courses/i });
    expect(link).toHaveAttribute('href', '#gis-courses');
    expect(section('The GIS Courses')).toHaveAttribute('id', 'gis-courses');
  });

  it('links to the live JavaScript course on the name the page was opened on', () => {
    render(<GisPage />);
    const js = COURSES.find((c) => c.id === 'javascript');
    const link = screen.getByRole('link', { name: /start javascript free/i });
    expect(link).toHaveAttribute('href', js.url.replace('levelupstudyhub.com', 'page-name.example'));
  });

  it('points to the live coding courses on the home page, under the site root', () => {
    render(<GisPage />);
    expect(screen.getByRole('link', { name: /see the live coding courses/i })).toHaveAttribute('href', `${BASE}#courses`);
  });

  it('shows every reason from GIS_WHY', () => {
    render(<GisPage />);
    const why = within(section('Why GIS'));
    for (const w of GIS_WHY) {
      expect(why.getByRole('heading', { name: w.title, level: 3 })).toBeInTheDocument();
      expect(why.getByText(w.text)).toBeInTheDocument();
    }
  });

  describe('courses', () => {
    it('lists every course from gis.js, in order and numbered', () => {
      render(<GisPage />);
      const items = within(courseList()).getAllByRole('listitem');
      expect(items).toHaveLength(GIS_COURSES.length);
      GIS_COURSES.forEach((c, i) => {
        const item = within(items[i]);
        expect(item.getByRole('heading', { name: c.title, level: 3 })).toBeInTheDocument();
        expect(item.getByText(c.level)).toBeInTheDocument();
        expect(item.getByText(c.blurb)).toBeInTheDocument();
        expect(items[i]).toHaveTextContent(`Course ${String(i + 1).padStart(2, '0')}`);
        for (const tool of c.tools) expect(item.getByText(tool)).toBeInTheDocument();
      });
    });

    it('marks every course as coming soon', () => {
      render(<GisPage />);
      for (const item of within(courseList()).getAllByRole('listitem')) {
        expect(within(item).getByText(/^coming soon$/i)).toBeInTheDocument();
      }
    });

    it('never shows a price, a date, a buy button or a link to buy on the page', () => {
      const { container } = render(<GisPage />);
      expect(container.textContent).not.toMatch(PRICE);
      expect(container.textContent).not.toMatch(DATE);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(within(courseList()).queryAllByRole('link')).toHaveLength(0);
    });

    it('keeps the GIS data itself free of prices and dates', () => {
      const text = JSON.stringify({ GIS_PAGE, GIS_WHY, GIS_COURSES, GIS_FOR, GIS_FAQ });
      expect(text).not.toMatch(PRICE);
      expect(text).not.toMatch(DATE);
    });
  });

  it('lists who the track is for', () => {
    render(<GisPage />);
    const list = within(section('Who It Is For')).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.textContent.trim())).toEqual(GIS_FOR);
  });

  describe('FAQ', () => {
    it('shows every GIS question, collapsed', () => {
      render(<GisPage />);
      const faq = section('Questions People Ask');
      const summaries = [...faq.querySelectorAll('summary')].map((s) => s.textContent);
      expect(summaries).toEqual(GIS_FAQ.map(({ q }) => q));
      for (const { a } of GIS_FAQ) expect(within(faq).getByText(a)).not.toBeVisible();
    });

    it('opens and closes an answer when its question is clicked', async () => {
      const user = userEvent.setup();
      render(<GisPage />);
      const { q, a } = GIS_FAQ[0];
      const summary = screen.getByText(q, { selector: 'summary' });
      await user.click(summary);
      expect(summary.closest('details')).toHaveAttribute('open');
      expect(screen.getByText(a)).toBeVisible();
      await user.click(summary);
      expect(screen.getByText(a)).not.toBeVisible();
    });

    it('says plainly that nothing can be bought yet', () => {
      render(<GisPage />);
      expect(GIS_FAQ.some(({ a }) => /nothing to buy|not yet/i.test(a))).toBe(true);
    });

    it('ends with the not-affiliated disclaimer', () => {
      render(<GisPage />);
      expect(screen.getByText(GIS_DISCLAIMER)).toBeInTheDocument();
      expect(GIS_DISCLAIMER).toMatch(/not affiliated/i);
    });
  });
});
