import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Faq from './Faq';
import { FAQ } from '../data/faq';

// Questions and answers come from data/faq.js (the build prints the same words as
// FAQPage structured data), so expectations are read from there, not copied.
const question = (q) => screen.getByText(q, { selector: 'summary' });
const answer = (a) => screen.getByText(a, { selector: 'p' });

describe('Faq', () => {
  it('has a section heading and lives at #faq', () => {
    render(<Faq />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/questions/i);
    expect(heading.closest('section')).toHaveAttribute('id', 'faq');
  });

  it('shows every question from the FAQ data, in order, once each', () => {
    const { container } = render(<Faq />);
    const summaries = [...container.querySelectorAll('summary')].map((s) => s.textContent);
    expect(summaries).toEqual(FAQ.map(({ q }) => q));
  });

  it('keeps the questions unique (they are the list keys and the structured-data names)', () => {
    expect(new Set(FAQ.map(({ q }) => q)).size).toBe(FAQ.length);
    expect(FAQ.every(({ q, a }) => q.trim() && a.trim())).toBe(true);
  });

  it('starts with every answer collapsed', () => {
    render(<Faq />);
    for (const { q, a } of FAQ) {
      expect(question(q).closest('details')).not.toHaveAttribute('open');
      expect(answer(a)).not.toBeVisible();
    }
  });

  it('expands an answer when its question is clicked, and collapses it on a second click', async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const { q, a } = FAQ[1];
    const details = question(q).closest('details');

    await user.click(question(q));
    expect(details).toHaveAttribute('open');
    expect(within(details).getByText(a)).toBeVisible();

    await user.click(question(q));
    expect(details).not.toHaveAttribute('open');
    expect(within(details).getByText(a)).not.toBeVisible();
  });

  it('opens each question independently of the others', async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const [first, second] = FAQ;
    await user.click(question(first.q));
    expect(answer(first.a)).toBeVisible();
    expect(answer(second.a)).not.toBeVisible();

    // every answer can be reached
    for (const { q, a } of FAQ.slice(1)) {
      await user.click(question(q));
      expect(answer(a)).toBeVisible();
    }
  });
});
