// Central export for all flashcard decks
// Add new module imports here as you create them

import { 
  flashcardDecks as module1Decks,
  getAllTags as getModule1Tags 
} from './module1-fundamentals';
import { module2 } from './module2-training-data';
import { module3, moduleVisuals } from './module3-inferencing';

// Combine all flashcard decks
export const flashcardDecks = {
  ...module1Decks,
  module2,
  module3
};

// Export visual data for diagrams
export { moduleVisuals };

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

// Get cards that have visual diagrams
export const getCardsWithVisuals = () => {
  const visualCards = [];
  Object.values(flashcardDecks).forEach(deck => {
    deck.cards.forEach(card => {
      if (card.hasVisual) {
        visualCards.push({ ...card, deckId: deck.id, deckName: deck.name });
      }
    });
  });
  return visualCards;
};

// Flashcard progress storage key
export const FLASHCARD_STORAGE_KEY = 'aws-ai-flashcard-progress';

// Initial progress state
export const INITIAL_FLASHCARD_PROGRESS = {
  cardsStudied: 0,
  cardsKnown: [],      // Cards marked as "Know It"
  cardsLearning: [],   // Cards marked as "Still Learning"
  deckProgress: {},    // Per-deck progress
  lastStudied: null,
  studyStreak: 0
};
