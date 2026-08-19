import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllDecks,
  getDeckById,
  FLASHCARD_STORAGE_KEY,
  INITIAL_FLASHCARD_PROGRESS
} from '../data/flashcards';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightbulbIcon,
  CheckCircleIcon,
  RefreshIcon,
  FlashcardIcon
} from './Icons';
import './Flashcards.css';

const REVIEW_DECK_ID = '__review__';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (saved) {
      return { ...INITIAL_FLASHCARD_PROGRESS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('[Flashcards] Failed to load progress:', e);
  }
  return { ...INITIAL_FLASHCARD_PROGRESS };
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const Flashcards = ({ onBack }) => {
  const decks = useMemo(() => getAllDecks(), []);
  const [progress, setProgress] = useState(loadProgress);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Persist progress on every change
  useEffect(() => {
    try {
      localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('[Flashcards] Failed to save progress:', e);
    }
  }, [progress]);

  const knownSet = useMemo(() => new Set(progress.cardsKnown), [progress.cardsKnown]);
  const learningSet = useMemo(() => new Set(progress.cardsLearning), [progress.cardsLearning]);

  const learningCards = useMemo(() => {
    const all = [];
    decks.forEach((deck) => {
      deck.cards.forEach((card) => {
        if (learningSet.has(card.id)) {
          all.push({ ...card, deckName: deck.name, deckColor: deck.color });
        }
      });
    });
    return all;
  }, [decks, learningSet]);

  const openDeck = useCallback((deckId) => {
    const deckCards =
      deckId === REVIEW_DECK_ID
        ? learningCards
        : (getDeckById(deckId)?.cards || []);
    if (deckCards.length === 0) return;
    setActiveDeckId(deckId);
    setCards(deckCards);
    setCardIndex(0);
    setFlipped(false);
    setShowHint(false);
  }, [learningCards]);

  const closeDeck = useCallback(() => {
    setActiveDeckId(null);
    setCards([]);
    setCardIndex(0);
    setFlipped(false);
    setShowHint(false);
  }, []);

  const goTo = useCallback((index, total) => {
    setCardIndex(((index % total) + total) % total);
    setFlipped(false);
    setShowHint(false);
  }, []);

  const recordStudied = useCallback(() => {
    setProgress((prev) => {
      const today = todayKey();
      let streak = prev.studyStreak || 0;
      if (prev.lastStudied !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = prev.lastStudied === yesterday ? streak + 1 : 1;
      }
      return {
        ...prev,
        cardsStudied: (prev.cardsStudied || 0) + 1,
        lastStudied: today,
        studyStreak: streak
      };
    });
  }, []);

  const markCard = useCallback((cardId, known) => {
    setProgress((prev) => {
      const cardsKnown = new Set(prev.cardsKnown);
      const cardsLearning = new Set(prev.cardsLearning);
      if (known) {
        cardsKnown.add(cardId);
        cardsLearning.delete(cardId);
      } else {
        cardsLearning.add(cardId);
        cardsKnown.delete(cardId);
      }
      return {
        ...prev,
        cardsKnown: Array.from(cardsKnown),
        cardsLearning: Array.from(cardsLearning)
      };
    });
    recordStudied();
    // Advance to the next card after marking
    if (cardIndex < cards.length - 1) {
      goTo(cardIndex + 1, cards.length);
    } else {
      setFlipped(false);
      setShowHint(false);
    }
  }, [cardIndex, cards.length, goTo, recordStudied]);

  const shuffleDeck = useCallback(() => {
    setCards((prev) => shuffleArray(prev));
    setCardIndex(0);
    setFlipped(false);
    setShowHint(false);
  }, []);

  // Keyboard navigation while studying
  useEffect(() => {
    if (!activeDeckId) return undefined;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') goTo(cardIndex + 1, cards.length);
      else if (e.key === 'ArrowLeft') goTo(cardIndex - 1, cards.length);
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeDeckId, cardIndex, cards.length, goTo]);

  // ---------- Deck grid view ----------
  if (!activeDeckId) {
    return (
      <div className="flashcards-screen">
        <div className="flashcards-header">
          <button className="flashcards-back-btn" onClick={onBack}>
            <ArrowLeftIcon size={18} />
            <span>Back</span>
          </button>
          <h2 className="flashcards-title">
            <FlashcardIcon size={24} />
            Flashcards
          </h2>
          <div className="flashcards-header-stats">
            <span title="Cards marked Know It">
              <CheckCircleIcon size={16} /> {progress.cardsKnown.length} known
            </span>
            {progress.studyStreak > 1 && (
              <span title="Consecutive study days">🔥 {progress.studyStreak}-day streak</span>
            )}
          </div>
        </div>

        {learningCards.length > 0 && (
          <button
            className="review-deck-banner"
            onClick={() => openDeck(REVIEW_DECK_ID)}
          >
            <span className="review-deck-icon">🎯</span>
            <span className="review-deck-text">
              <strong>Review Still Learning</strong>
              <small>{learningCards.length} card{learningCards.length === 1 ? '' : 's'} you marked for review, across all decks</small>
            </span>
            <ChevronRightIcon size={20} />
          </button>
        )}

        <div className="deck-grid">
          {decks.map((deck) => {
            const known = deck.cards.filter((c) => knownSet.has(c.id)).length;
            const pct = deck.cards.length > 0 ? Math.round((known / deck.cards.length) * 100) : 0;
            return (
              <button
                key={deck.id}
                className="deck-card"
                onClick={() => openDeck(deck.id)}
                style={{ '--deck-color': deck.color }}
              >
                <div className="deck-card-top">
                  <span className="deck-icon">{deck.icon}</span>
                  {deck.examWeight && <span className="deck-weight">{deck.examWeight} of exam</span>}
                </div>
                <div className="deck-name">{deck.name}</div>
                <div className="deck-description">{deck.description}</div>
                <div className="deck-progress">
                  <div className="deck-progress-bar">
                    <div className="deck-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="deck-progress-label">
                    {known}/{deck.cards.length} known
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Card study view ----------
  const isReview = activeDeckId === REVIEW_DECK_ID;
  const deck = isReview ? null : getDeckById(activeDeckId);
  const card = cards[cardIndex];
  const deckColor = (isReview ? card?.deckColor : deck?.color) || 'var(--md-primary)';

  if (!card) {
    // Review deck emptied out mid-session
    return (
      <div className="flashcards-screen">
        <div className="flashcards-empty">
          <p>🎉 Nothing left to review!</p>
          <button className="flashcards-back-btn" onClick={closeDeck}>
            <ArrowLeftIcon size={18} />
            <span>All decks</span>
          </button>
        </div>
      </div>
    );
  }

  const isKnown = knownSet.has(card.id);
  const isLearning = learningSet.has(card.id);

  return (
    <div className="flashcards-screen">
      <div className="flashcards-header">
        <button className="flashcards-back-btn" onClick={closeDeck}>
          <ArrowLeftIcon size={18} />
          <span>All decks</span>
        </button>
        <h2 className="flashcards-title" style={{ color: deckColor }}>
          {isReview ? '🎯 Review' : `${deck.icon} ${deck.name}`}
        </h2>
        <button className="flashcards-shuffle-btn" onClick={shuffleDeck} title="Shuffle deck">
          <RefreshIcon size={18} />
        </button>
      </div>

      <div className="flashcard-progress-row">
        <span>{cardIndex + 1} / {cards.length}</span>
        {isReview && card.deckName && <span className="flashcard-deck-tag">{card.deckName}</span>}
        {card.taskStatement && <span className="flashcard-task-tag">Task {card.taskStatement}</span>}
      </div>

      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        style={{ '--deck-color': deckColor }}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <div className="flashcard-face-label">Question</div>
            <div className="flashcard-content">{card.front}</div>
            <div className="flashcard-flip-hint">Click or press Space to flip</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-face-label">Answer</div>
            <div className="flashcard-content">{card.back}</div>
          </div>
        </div>
      </div>

      {!flipped && card.hint && (
        <div className="flashcard-hint-row">
          {showHint ? (
            <div className="flashcard-hint">
              <LightbulbIcon size={16} /> {card.hint}
            </div>
          ) : (
            <button className="flashcard-hint-btn" onClick={() => setShowHint(true)}>
              <LightbulbIcon size={16} /> Show hint
            </button>
          )}
        </div>
      )}

      {flipped && (
        <div className="flashcard-mark-row">
          <button
            className={`mark-btn mark-learning ${isLearning ? 'active' : ''}`}
            onClick={() => markCard(card.id, false)}
          >
            Still Learning
          </button>
          <button
            className={`mark-btn mark-known ${isKnown ? 'active' : ''}`}
            onClick={() => markCard(card.id, true)}
          >
            <CheckCircleIcon size={16} /> Know It
          </button>
        </div>
      )}

      <div className="flashcard-nav-row">
        <button className="flashcard-nav-btn" onClick={() => goTo(cardIndex - 1, cards.length)}>
          <ChevronLeftIcon size={20} />
          <span>Prev</span>
        </button>
        <button className="flashcard-nav-btn" onClick={() => goTo(cardIndex + 1, cards.length)}>
          <span>Next</span>
          <ChevronRightIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
