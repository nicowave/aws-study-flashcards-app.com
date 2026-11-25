// Cloud Practitioner's StudyGuide is its own component: it turns each domain's quiz
// questions into flip cards (question on the front, right answer + explanation on the back).
// The other three games share a different, article-style StudyGuide with its own test.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudyGuide from './StudyGuide';
import { domains } from '../data';
import { correctIndex } from '../test/examConfig';

const openDomain = async (domain) => {
  await userEvent.click(screen.getByRole('button', { name: new RegExp(domain.name) }));
};
const counter = () => screen.getByText(/^\d+ \/ \d+$/);
// The card's front and back paragraphs both exist in the DOM; the flip is CSS
const cardTexts = () => [...document.querySelectorAll('.flashcard .card-content')].map((p) => p.textContent);

describe('StudyGuide (Cloud Practitioner)', () => {
  it('lists every domain with its number of cards, and Back calls onBack', async () => {
    const onBack = vi.fn();
    render(<StudyGuide onBack={onBack} />);
    for (const d of domains) {
      const card = screen.getByRole('button', { name: new RegExp(d.name) });
      expect(within(card).getByText(`${d.questions.length} cards`)).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("builds each card from a question: the question in front, the right answer and explanation behind", async () => {
    const domain = domains[0];
    const q = domain.questions[0];
    render(<StudyGuide onBack={() => {}} />);
    await openDomain(domain);
    expect(counter()).toHaveTextContent(`1 / ${domain.questions.length}`);
    const [front, back] = cardTexts();
    expect(front).toBe(q.question);
    expect(back.startsWith(q.options[correctIndex(q)])).toBe(true);
    expect(back).toContain(q.explanation);
  });

  it('shows the AWS source links only once the card is flipped, and a click flips it back', async () => {
    const domain = domains[0];
    render(<StudyGuide onBack={() => {}} />);
    await openDomain(domain);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const card = document.querySelector('.flashcard');
    await userEvent.click(card);
    expect(card).toHaveClass('flipped');
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(domain.questions[0].sources.map((s) => s.url));
    await userEvent.click(card);
    expect(card).not.toHaveClass('flipped');
  });

  it('moves with Previous/Next, stops at both ends, and unflips on every move', async () => {
    const domain = domains[0];
    const n = domain.questions.length;
    render(<StudyGuide onBack={() => {}} />);
    await openDomain(domain);
    const prev = screen.getByRole('button', { name: /Previous/ });
    const next = screen.getByRole('button', { name: /Next/ });
    expect(prev).toBeDisabled();

    await userEvent.click(document.querySelector('.flashcard'));
    await userEvent.click(next);
    expect(counter()).toHaveTextContent(`2 / ${n}`);
    expect(document.querySelector('.flashcard')).not.toHaveClass('flipped');
    expect(cardTexts()[0]).toBe(domain.questions[1].question);

    for (let i = 2; i < n; i++) await userEvent.click(next);
    expect(counter()).toHaveTextContent(`${n} / ${n}`);
    expect(next).toBeDisabled();
    await userEvent.click(prev);
    expect(counter()).toHaveTextContent(`${n - 1} / ${n}`);
  });

  it('shuffles the cards and starts again from the first one', async () => {
    const domain = domains[0];
    render(<StudyGuide onBack={() => {}} />);
    await openDomain(domain);
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    // Math.random() = 0 makes the sort comparator always negative, which reverses the deck: a predictable "shuffle"
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await userEvent.click(screen.getByRole('button', { name: /Shuffle/ }));
    expect(counter()).toHaveTextContent(`1 / ${domain.questions.length}`);
    const shownFirst = cardTexts()[0];
    expect(domain.questions.map((q) => q.question)).toContain(shownFirst);
    expect(shownFirst).not.toBe(domain.questions[0].question);
  });

  it('"Topics" goes back to the domain list', async () => {
    render(<StudyGuide onBack={() => {}} />);
    await openDomain(domains[1]);
    await userEvent.click(screen.getByRole('button', { name: /Topics/ }));
    for (const d of domains) expect(screen.getByRole('button', { name: new RegExp(d.name) })).toBeInTheDocument();
  });
});
