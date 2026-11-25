import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { getAllDecks, getAllCards, getExamTrapCards } from './data/devTrackCards.js';

const setup = () => {
  const user = userEvent.setup();
  render(<App />);
  return { user };
};
const nav = () => screen.getByRole('navigation', { name: 'Sections' });
const tabs = () => within(nav()).getAllByRole('button');
const tab = (name) => within(nav()).getByRole('button', { name });
const currentTabs = () => tabs().filter((b) => b.getAttribute('aria-current') === 'page');
const sectionHeading = () => screen.getAllByRole('heading', { level: 2 })[0].textContent;
const openTab = (user, name) => user.click(tab(name));

describe('App: shell and tabs', () => {
  it('shows the title and links back to the Study Hub', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dev Track');
    const hub = screen.getByRole('link', { name: 'Level Up Study Hub' });
    expect(new URL(hub.getAttribute('href')).hostname).toBe('aws-study-flashcards-app.com');
  });

  it('opens on the study guide tab', () => {
    setup();
    expect(currentTabs()).toEqual([tab('Study guide')]);
    expect(screen.getByRole('heading', { level: 2, name: 'Study guide' })).toBeInTheDocument();
  });

  it('every tab switches to its own section and is the only one marked current', async () => {
    const { user } = setup();
    const seen = new Set();
    for (const b of tabs()) {
      const label = b.textContent;
      await user.click(b);
      expect(currentTabs(), label).toEqual([tab(label)]);
      const heading = sectionHeading();
      expect(heading, label).toBeTruthy();
      expect(seen.has(heading), `${label} shows a section another tab already showed`).toBe(false);
      seen.add(heading);
    }
    expect(seen.size).toBe(tabs().length);
  });

  it.each([
    ['Quiz game', 'Quiz game'],
    ['Practice exam', 'Practice exam'],
    ['Flashcards', 'Flashcards'],
    ['Study guide', 'Study guide'],
  ])('the %s tab shows the %s section', async (label, heading) => {
    const { user } = setup();
    await openTab(user, 'Reference');
    await openTab(user, label);
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
  });

  it('switching tabs and back starts the section over', async () => {
    const { user } = setup();
    const firstChapter = within(screen.getByRole('list')).getAllByRole('button')[0];
    await user.click(firstChapter);
    expect(screen.getByRole('button', { name: 'All chapters' })).toBeInTheDocument();
    await openTab(user, 'Quiz game');
    await openTab(user, 'Study guide');
    expect(screen.getByRole('heading', { level: 2, name: 'Study guide' })).toBeInTheDocument();
  });
});

describe('App: flashcards', () => {
  const card = () => screen.getByRole('button', { name: /Click to (reveal answer|see question)$/ });
  const counter = () => screen.getByText(/^\d+ \/ \d+$/).textContent;
  const deckSelect = () => screen.getByRole('combobox');
  const open = async () => {
    const { user } = setup();
    await openTab(user, 'Flashcards');
    return { user };
  };

  it('lists all decks, exam traps and each deck with their card counts', async () => {
    await open();
    const opts = within(deckSelect()).getAllByRole('option');
    const decks = getAllDecks();
    expect(opts).toHaveLength(decks.length + 2);
    expect(opts[0]).toHaveTextContent(`(${getAllCards().length})`);
    expect(opts[1]).toHaveTextContent(`(${getExamTrapCards().length})`);
    decks.forEach((d, k) => expect(opts[k + 2]).toHaveTextContent(`${d.title} (${d.cards.length})`));
    expect(deckSelect()).toHaveValue('all');
  });

  it('starts on the first card, front side, with its hint', async () => {
    await open();
    const first = getAllCards()[0];
    expect(counter()).toBe(`1 / ${getAllCards().length}`);
    expect(card()).toHaveAccessibleName('Question. Click to reveal answer');
    expect(card()).toHaveTextContent(first.front);
    expect(card()).toHaveTextContent(`Hint: ${first.hint}`);
    expect(card()).not.toHaveTextContent(first.back);
  });

  it('flips to the answer with its tags and difficulty, and back', async () => {
    const { user } = await open();
    const first = getAllCards()[0];
    await user.click(card());
    expect(card()).toHaveAccessibleName('Answer. Click to see question');
    expect(card()).toHaveTextContent(first.back);
    first.tags.forEach((t) => expect(within(card()).getByText(t)).toBeInTheDocument());
    expect(card()).toHaveTextContent(`difficulty ${first.difficulty}/3`);
    expect(card()).not.toHaveTextContent('Hint:');
    expect(screen.getByRole('button', { name: 'Show question' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show question' }));
    expect(card()).toHaveTextContent(first.front);
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(card()).toHaveTextContent(first.back);
  });

  it('Space on the focused card flips it', async () => {
    const { user } = await open();
    card().focus();
    await user.keyboard(' ');
    expect(card()).toHaveTextContent(getAllCards()[0].back);
  });

  it('Next and Previous move through the cards, wrap around, and show the front again', async () => {
    const { user } = await open();
    const all = getAllCards();
    await user.click(card());
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(counter()).toBe(`2 / ${all.length}`);
    expect(card()).toHaveTextContent(all[1].front);
    expect(card()).toHaveAccessibleName('Question. Click to reveal answer');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(counter()).toBe(`${all.length} / ${all.length}`);
    expect(card()).toHaveTextContent(all[all.length - 1].front);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(counter()).toBe(`1 / ${all.length}`);
  });

  it('arrow keys on the card move to the next and previous card', async () => {
    const { user } = await open();
    const all = getAllCards();
    card().focus();
    await user.keyboard('{ArrowRight}');
    expect(card()).toHaveTextContent(all[1].front);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(card()).toHaveTextContent(all[all.length - 1].front);
  });

  it('picking a deck shows only its cards, starting from the first', async () => {
    const { user } = await open();
    const deck = getAllDecks()[2];
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.selectOptions(deckSelect(), deck.id);
    expect(counter()).toBe(`1 / ${deck.cards.length}`);
    for (const c of deck.cards) {
      expect(card()).toHaveTextContent(c.front);
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(card()).toHaveTextContent(deck.cards[0].front); // wrapped round within the deck
  });

  it('the exam-traps deck shows only exam-trap cards, with the trap tag on the back', async () => {
    const { user } = await open();
    const traps = getExamTrapCards();
    await user.selectOptions(deckSelect(), 'traps');
    expect(counter()).toBe(`1 / ${traps.length}`);
    for (const c of traps) {
      expect(card()).toHaveTextContent(c.front);
      await user.click(card());
      expect(within(card()).getByText('exam-trap')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
  });
});

describe('App: reference', () => {
  it('shows the acronym list, the commands and the practice project', async () => {
    const { user } = setup();
    await openTab(user, 'Reference');
    expect(screen.getByRole('heading', { level: 2, name: /Reference/ })).toBeInTheDocument();
    const terms = document.querySelectorAll('dl dt');
    const defs = document.querySelectorAll('dl dd');
    expect(terms.length).toBeGreaterThan(0);
    expect(defs).toHaveLength(terms.length);
    expect(screen.getByRole('heading', { level: 2, name: /Commands/ }).nextElementSibling.tagName).toBe('PRE');
    expect(within(screen.getByRole('heading', { level: 2, name: /Practice project/ }).nextElementSibling).getAllByRole('listitem').length).toBeGreaterThan(0);
  });
});
