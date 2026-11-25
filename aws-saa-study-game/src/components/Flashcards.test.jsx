import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Flashcards from './Flashcards';
import * as flashcardData from '../data/flashcards';

const { FLASHCARD_STORAGE_KEY, INITIAL_FLASHCARD_PROGRESS } = flashcardData;

// Most tests study small fake decks so they don't depend on any app's content;
// with `fixture.decks` left null the component sees the app's real decks.
const fixture = vi.hoisted(() => ({ decks: null }));
vi.mock('../data/flashcards', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    getAllDecks: () => fixture.decks ?? real.getAllDecks(),
    getDeckById: (id) => (fixture.decks ? fixture.decks.find((d) => d.id === id) : real.getDeckById(id)),
  };
});

const source = { title: 'Fake AWS page', url: 'https://docs.aws.amazon.com/fake/page.html', checked: '2026-01-01' };
const deckA = {
  id: 'deckA', name: 'Alpha Deck', description: 'First fake deck', icon: 'A', color: '#111111',
  cards: [
    { id: 'a1', front: 'Alpha one front', back: 'Alpha one back', hint: 'Alpha one hint', sources: [source] },
    { id: 'a2', front: 'Alpha two front', back: 'Alpha two back' },
    { id: 'a3', front: 'Alpha three front', back: 'Alpha three back', hint: 'Alpha three hint' },
  ],
};
const deckB = {
  id: 'deckB', name: 'Bravo Deck', description: 'Second fake deck', icon: 'B', color: '#222222',
  cards: [{ id: 'b1', front: 'Bravo one front', back: 'Bravo one back' }],
};

const saved = () => JSON.parse(localStorage.getItem(FLASHCARD_STORAGE_KEY));
const deckButton = (name) => screen.getByRole('button', { name: new RegExp(name) });
const counter = () => screen.getByText(/^\d+ \/ \d+$/).textContent;
// The back face is always in the DOM (CSS hides it), so "flipped" shows as the marking buttons.
const isFlipped = () => screen.queryByRole('button', { name: /know it/i }) !== null;
const flashcard = () => screen.getByRole('button', { name: /^Question/ });

const renderFlashcards = (props = {}) => {
  const user = userEvent.setup();
  const onBack = vi.fn();
  const onGuestUnlock = vi.fn();
  render(<Flashcards onBack={onBack} onGuestUnlock={onGuestUnlock} {...props} />);
  return { user, onBack, onGuestUnlock };
};

const openDeckA = async (props) => {
  const ctx = renderFlashcards(props);
  await ctx.user.click(deckButton('Alpha Deck'));
  return ctx;
};

describe('Flashcards with the app\'s own decks', () => {
  beforeEach(() => { fixture.decks = null; });

  it('lists every deck with its name and card count', () => {
    renderFlashcards();
    const decks = flashcardData.getAllDecks();
    expect(decks.length).toBeGreaterThan(0);
    for (const deck of decks) {
      const button = screen.getByRole('button', { name: new RegExp(deck.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
      expect(within(button).getByText(`0/${deck.cards.length} known`)).toBeInTheDocument();
    }
  });

  it('opens the first deck on its first card', async () => {
    const { user } = renderFlashcards();
    const [first] = flashcardData.getAllDecks();
    await user.click(screen.getAllByRole('button', { name: /known$/ })[0]);
    expect(counter()).toBe(`1 / ${first.cards.length}`);
    expect(screen.getAllByText(first.cards[0].front).length).toBeGreaterThan(0);
  });
});

describe('Flashcards', () => {
  beforeEach(() => { fixture.decks = [deckA, deckB]; });

  it('Back calls onBack from the deck list; "All decks" returns from a deck', async () => {
    const { user, onBack } = await openDeckA();
    await user.click(screen.getByRole('button', { name: /all decks/i }));
    expect(deckButton('Bravo Deck')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opening a deck shows its name and first card, unflipped', async () => {
    await openDeckA();
    expect(screen.getByRole('heading', { name: /Alpha Deck/ })).toBeInTheDocument();
    expect(counter()).toBe('1 / 3');
    expect(screen.getByText('Alpha one front')).toBeInTheDocument();
    expect(isFlipped()).toBe(false);
  });

  it('flips back and forth when the card is clicked', async () => {
    const { user } = await openDeckA();
    await user.click(flashcard());
    expect(isFlipped()).toBe(true);
    await user.click(flashcard());
    expect(isFlipped()).toBe(false);
  });

  it('flips with Space and with Enter', async () => {
    const { user } = await openDeckA();
    await user.keyboard(' ');
    expect(isFlipped()).toBe(true);
    await user.keyboard(' ');
    expect(isFlipped()).toBe(false);
    await user.keyboard('{Enter}');
    expect(isFlipped()).toBe(true);
  });

  it('shows the hint only when asked, and hides it again on the next card', async () => {
    const { user } = await openDeckA();
    expect(screen.queryByText('Alpha one hint')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show hint/i }));
    expect(screen.getByText('Alpha one hint')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    // a2 has no hint, so no hint button at all
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /prev/i }));
    expect(screen.queryByText('Alpha one hint')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show hint/i })).toBeInTheDocument();
  });

  it('hides the hint row once the card is flipped', async () => {
    const { user } = await openDeckA();
    await user.click(screen.getByRole('button', { name: /show hint/i }));
    await user.click(flashcard());
    expect(screen.queryByText('Alpha one hint')).not.toBeInTheDocument();
  });

  it('Next and Prev move through the deck and wrap around at both ends', async () => {
    const { user } = await openDeckA();
    await user.click(screen.getByRole('button', { name: /prev/i }));
    expect(counter()).toBe('3 / 3');
    expect(screen.getByText('Alpha three front')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(counter()).toBe('1 / 3');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(counter()).toBe('2 / 3');
  });

  it('arrow keys navigate too, and moving unflips the card', async () => {
    const { user } = await openDeckA();
    await user.keyboard(' ');
    await user.keyboard('{ArrowRight}');
    expect(counter()).toBe('2 / 3');
    expect(isFlipped()).toBe(false);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(counter()).toBe('3 / 3');
  });

  it('shows AWS source links only on the flipped face', async () => {
    const { user } = await openDeckA();
    expect(screen.queryByRole('link', { name: /Fake AWS page/ })).not.toBeInTheDocument();
    await user.click(flashcard());
    expect(screen.getByRole('link', { name: /Fake AWS page/ })).toHaveAttribute('href', source.url);
  });

  it('"Know It" saves the card as known and moves to the next card', async () => {
    const { user } = await openDeckA();
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    expect(saved().cardsKnown).toEqual(['a1']);
    expect(saved().cardsLearning).toEqual([]);
    expect(saved().cardsStudied).toBe(1);
    expect(counter()).toBe('2 / 3');
    expect(isFlipped()).toBe(false);
  });

  it('"Still Learning" saves the card for review; changing your mind moves it between lists', async () => {
    const { user } = await openDeckA();
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /still learning/i }));
    expect(saved().cardsLearning).toEqual(['a1']);

    await user.click(screen.getByRole('button', { name: /prev/i })); // marking moved on to card 2; back to 1
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    expect(saved().cardsKnown).toEqual(['a1']);
    expect(saved().cardsLearning).toEqual([]);
  });

  it('marking the last card stays on it (no wrap) and unflips it', async () => {
    const { user } = await openDeckA();
    await user.click(screen.getByRole('button', { name: /prev/i }));
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    expect(counter()).toBe('3 / 3');
    expect(isFlipped()).toBe(false);
  });

  it('known cards show on the deck list progress', async () => {
    const { user } = await openDeckA();
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    await user.click(screen.getByRole('button', { name: /all decks/i }));
    expect(within(deckButton('Alpha Deck')).getByText('1/3 known')).toBeInTheDocument();
    expect(screen.getByTitle('Cards marked Know It')).toHaveTextContent('1 known');
  });

  it('loads saved progress from localStorage', () => {
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify({ ...INITIAL_FLASHCARD_PROGRESS, cardsKnown: ['a1', 'a2', 'b1'] }));
    renderFlashcards();
    expect(within(deckButton('Alpha Deck')).getByText('2/3 known')).toBeInTheDocument();
    expect(within(deckButton('Bravo Deck')).getByText('1/1 known')).toBeInTheDocument();
  });

  it('builds a review deck from "Still Learning" cards across all decks', async () => {
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify({ ...INITIAL_FLASHCARD_PROGRESS, cardsLearning: ['a2', 'b1'] }));
    const { user } = renderFlashcards();
    const review = screen.getByRole('button', { name: /review still learning/i });
    expect(review).toHaveTextContent('2 cards');
    await user.click(review);
    expect(counter()).toBe('1 / 2');
    expect(screen.getByText('Alpha two front')).toBeInTheDocument();
    expect(screen.getByText('Alpha Deck')).toBeInTheDocument(); // which deck the card came from
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Bravo one front')).toBeInTheDocument();
    expect(screen.getByText('Bravo Deck')).toBeInTheDocument();
  });

  it('the review banner goes away once nothing is left to review', async () => {
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify({ ...INITIAL_FLASHCARD_PROGRESS, cardsLearning: ['b1'] }));
    const { user } = renderFlashcards();
    expect(screen.getByRole('button', { name: /review still learning/i })).toHaveTextContent('1 card ');
    await user.click(screen.getByRole('button', { name: /review still learning/i }));
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    await user.click(screen.getByRole('button', { name: /all decks/i }));
    expect(screen.queryByRole('button', { name: /review still learning/i })).not.toBeInTheDocument();
  });

  it('shuffle reorders the cards and starts again from card 1, unflipped', async () => {
    const { user } = await openDeckA();
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(flashcard());
    // With random() always 0, Fisher-Yates turns [a1, a2, a3] into [a2, a3, a1]
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await user.click(screen.getByRole('button', { name: /shuffle/i }));
    expect(counter()).toBe('1 / 3');
    expect(isFlipped()).toBe(false);
    expect(screen.getByText('Alpha two front')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Alpha three front')).toBeInTheDocument();
  });

  it('counts a study streak across consecutive days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify({
      ...INITIAL_FLASHCARD_PROGRESS, lastStudied: '2026-03-09', studyStreak: 2,
    }));
    const { user } = await openDeckA();
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /know it/i }));
    expect(saved()).toMatchObject({ lastStudied: '2026-03-10', studyStreak: 3 });
    await user.click(screen.getByRole('button', { name: /all decks/i }));
    expect(screen.getByText(/3-day streak/)).toBeInTheDocument();
  });

  it('a missed day resets the streak to 1', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify({
      ...INITIAL_FLASHCARD_PROGRESS, lastStudied: '2026-03-05', studyStreak: 4,
    }));
    const { user } = await openDeckA();
    await user.click(flashcard());
    await user.click(screen.getByRole('button', { name: /still learning/i }));
    expect(saved().studyStreak).toBe(1);
  });

  describe('as a guest', () => {
    it('can open the first deck', async () => {
      const { onGuestUnlock } = await openDeckA({ isGuest: true });
      expect(counter()).toBe('1 / 3');
      expect(onGuestUnlock).not.toHaveBeenCalled();
    });

    it('other decks are locked and ask the guest to sign in instead of opening', async () => {
      const { user, onGuestUnlock } = renderFlashcards({ isGuest: true });
      const locked = deckButton('Bravo Deck');
      expect(within(locked).getByText(/sign in free to unlock/i)).toBeInTheDocument();
      expect(within(deckButton('Alpha Deck')).queryByText(/sign in free to unlock/i)).not.toBeInTheDocument();
      await user.click(locked);
      expect(onGuestUnlock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Bravo one front')).not.toBeInTheDocument();
    });

    it('signed-in users can open every deck', async () => {
      const { user, onGuestUnlock } = renderFlashcards();
      expect(screen.queryByText(/sign in free to unlock/i)).not.toBeInTheDocument();
      await user.click(deckButton('Bravo Deck'));
      expect(screen.getByText('Bravo one front')).toBeInTheDocument();
      expect(onGuestUnlock).not.toHaveBeenCalled();
    });
  });
});
