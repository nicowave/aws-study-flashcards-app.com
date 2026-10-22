// Central export for all flashcard decks
// AWS Certified Developer – Associate (DVA-C02)

import { module1 } from './module1-development';
import { module2 } from './module2-security';
import { module3 } from './module3-deployment';
import { module4 } from './module4-troubleshooting';

// Storage key for localStorage
export const FLASHCARD_STORAGE_KEY = 'aws-dva-flashcard-progress';

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
  module4
};

export const getAllDecks = () => Object.values(flashcardDecks);

export const getDeckById = (id) => flashcardDecks[id];

export const getTotalCardCount = () =>
  getAllDecks().reduce((sum, deck) => sum + deck.cards.length, 0);
