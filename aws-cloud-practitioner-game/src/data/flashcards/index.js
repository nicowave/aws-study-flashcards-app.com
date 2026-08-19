// Central export for all flashcard decks
// AWS Cloud Practitioner (CLF-C02)

import { module1 } from './module1-core-services';
import { module2 } from './module2-security';
import { module3 } from './module3-pricing';
import { module4 } from './module4-cloud-concepts';
import { module5 } from './module5-compute';
import { module6 } from './module6-global-infra';
import { module7 } from './module7-networking';

// Storage key for localStorage
export const FLASHCARD_STORAGE_KEY = 'aws-ccp-flashcard-progress';

// Initial progress state
export const INITIAL_FLASHCARD_PROGRESS = {
  cardsStudied: 0,
  cardsKnown: [],
  cardsLearning: [],
  deckProgress: {},
  lastStudied: null
};

// Combine all flashcard decks
export const flashcardDecks = {
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7
};

export const getAllDecks = () => Object.values(flashcardDecks);

export const getDeckById = (id) => flashcardDecks[id];

export const getCardsByTag = (tag) => {
  const allCards = [];
  Object.values(flashcardDecks).forEach(deck => {
    deck.cards.forEach(card => {
      if (card.tags.includes(tag)) {
        allCards.push({ ...card, deckId: deck.id, deckName: deck.name });
      }
    });
  });
  return allCards;
};

export const getCardsByDifficulty = (difficulty) => {
  const allCards = [];
  Object.values(flashcardDecks).forEach(deck => {
    deck.cards.forEach(card => {
      if (card.difficulty === difficulty) {
        allCards.push({ ...card, deckId: deck.id, deckName: deck.name });
      }
    });
  });
  return allCards;
};

export const getAllTags = () => {
  const tags = new Set();
  Object.values(flashcardDecks).forEach(deck => {
    deck.cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
  });
  return Array.from(tags).sort();
};
