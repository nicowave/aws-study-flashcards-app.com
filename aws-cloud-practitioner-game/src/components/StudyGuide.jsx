import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllDecks, 
  getDeckById,
  getAllTags,
  FLASHCARD_STORAGE_KEY, 
  INITIAL_FLASHCARD_PROGRESS 
} from '../data/flashcards';
import { 
  BookIcon, 
  LightbulbIcon, 
  RefreshIcon, 
  CheckIcon, 
  SecurityIcon,
  RobotIcon,
  GearIcon,
  CloudIcon
} from './Icons';
import './StudyGuide.css';

// Map deck IDs to icons
const deckIconMap = {
  'module1': GearIcon,
  'module2': SecurityIcon,
  'module3': CloudIcon,
};

// Shuffle utility
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Single Flashcard Component
const FlashCard = ({ card, isFlipped, onFlip, onKnow, onLearning, showHint }) => {
  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
      <div className="flashcard-inner">
        {/* Front of card */}
        <div className="flashcard-front">
          <div className="card-label">Question</div>
          <div className="card-content">{card.front}</div>
          {showHint && card.hint && (
            <div className="card-hint">
              <span className="hint-icon"><LightbulbIcon size={16} /></span> {card.hint}
            </div>
          )}
          <div className="card-tags">
            {card.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <div className="flip-instruction">Click to flip</div>
        </div>
        
        {/* Back of card */}
        <div className="flashcard-back">
          <div className="card-label">Answer</div>
          <div className="card-content">{card.back}</div>
          <div className="card-actions">
            <button 
              className="action-btn learning"
              onClick={(e) => { e.stopPropagation(); onLearning(); }}
            >
              <RefreshIcon size={16} /> Still Learning
            </button>
            <button 
              className="action-btn know"
              onClick={(e) => { e.stopPropagation(); onKnow(); }}
            >
              <CheckIcon size={16} /> Know It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Deck Selection Component
const DeckSelector = ({ decks, progress, onSelectDeck }) => {
  return (
    <div className="deck-selector">
      <h2 className="section-title"><BookIcon size={24} /> Study Guide</h2>
      <p className="section-subtitle">Select a module to study</p>
      
      <div className="deck-grid">
        {decks.map(deck => {
          const deckProgress = progress.deckProgress[deck.id] || { known: 0, learning: 0 };
          const totalCards = deck.cards.length;
          const masteryPercent = Math.round((deckProgress.known / totalCards) * 100) || 0;
          const IconComponent = deckIconMap[deck.id] || BookIcon;
          
          return (
            <button
              key={deck.id}
              className="deck-card"
              onClick={() => onSelectDeck(deck.id)}
              style={{ '--deck-color': deck.color, '--deck-gradient': deck.gradient }}
            >
              <div className="deck-icon"><IconComponent size={28} /></div>
              <div className="deck-name">{deck.name}</div>
              <div className="deck-card-count">{totalCards} cards</div>
              <div className="deck-progress-bar">
                <div 
                  className="deck-progress-fill known"
                  style={{ width: `${masteryPercent}%` }}
                />
              </div>
              <div className="deck-stats">
                <span className="stat-known"><CheckIcon size={14} /> {deckProgress.known || 0}</span>
                <span className="stat-learning"><RefreshIcon size={14} /> {deckProgress.learning || 0}</span>
              </div>
              <div className="deck-source">{deck.source}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Study Session Component
const StudySession = ({ 
  deck, 
  cards, 
  currentIndex, 
  isFlipped, 
  showHint,
  progress,
  onFlip, 
  onKnow, 
  onLearning, 
  onToggleHint,
  onBack,
  onShuffle,
  onRestart
}) => {
  const currentCard = cards[currentIndex];
  const deckProgress = progress.deckProgress[deck.id] || { known: 0, learning: 0 };
  const IconComponent = deckIconMap[deck.id] || BookIcon;
  
  return (
    <div className="study-session" style={{ '--deck-color': deck.color }}>
      <div className="session-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="deck-badge" style={{ background: deck.gradient }}>
          <IconComponent size={18} /> {deck.name}
        </div>
        <div className="session-controls">
          <button className="control-btn" onClick={onToggleHint} title="Toggle hints">
            <LightbulbIcon size={18} style={{ opacity: showHint ? 1 : 0.4 }} />
          </button>
          <button className="control-btn" onClick={onShuffle} title="Shuffle cards">
            <RefreshIcon size={18} />
          </button>
        </div>
      </div>

      <div className="progress-info">
        <div className="card-counter">
          Card {currentIndex + 1} of {cards.length}
        </div>
        <div className="mastery-stats">
          <span className="stat-known"><CheckIcon size={14} /> {deckProgress.known || 0}</span>
          <span className="stat-learning"><RefreshIcon size={14} /> {deckProgress.learning || 0}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${((currentIndex + 1) / cards.length) * 100}%`,
            background: deck.gradient 
          }}
        />
      </div>

      <FlashCard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={onFlip}
        onKnow={onKnow}
        onLearning={onLearning}
        showHint={showHint}
      />

      <div className="navigation-dots">
        {cards.map((_, idx) => (
          <span 
            key={idx} 
            className={`dot ${idx === currentIndex ? 'active' : ''} ${
              progress.cardsKnown.includes(cards[idx].id) ? 'known' : 
              progress.cardsLearning.includes(cards[idx].id) ? 'learning' : ''
            }`}
          />
        ))}
      </div>

      {currentIndex >= cards.length - 1 && isFlipped && (
        <div className="session-complete">
          <button className="restart-btn" onClick={onRestart}>
            <RefreshIcon size={18} /> Study Again
          </button>
        </div>
      )}
    </div>
  );
};

// Main Study Guide Component
const StudyGuide = ({ onBack }) => {
  const [view, setView] = useState('decks'); // decks, studying
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentCards, setCurrentCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARD_PROGRESS;
    } catch {
      return INITIAL_FLASHCARD_PROGRESS;
    }
  });

  const decks = getAllDecks();

  // Save progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save flashcard progress:', e);
    }
  }, [progress]);

  // Select a deck and start studying
  const handleSelectDeck = useCallback((deckId) => {
    const deck = getDeckById(deckId);
    setSelectedDeck(deck);
    setCurrentCards(shuffleArray(deck.cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setView('studying');
  }, []);

  // Flip the current card
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Mark card as known
  const handleKnow = useCallback(() => {
    const cardId = currentCards[currentIndex].id;
    
    setProgress(prev => {
      const newKnown = prev.cardsKnown.includes(cardId) 
        ? prev.cardsKnown 
        : [...prev.cardsKnown, cardId];
      const newLearning = prev.cardsLearning.filter(id => id !== cardId);
      
      // Update deck progress
      const deckProgress = { ...prev.deckProgress };
      if (!deckProgress[selectedDeck.id]) {
        deckProgress[selectedDeck.id] = { known: 0, learning: 0 };
      }
      deckProgress[selectedDeck.id] = {
        known: newKnown.filter(id => 
          selectedDeck.cards.some(c => c.id === id)
        ).length,
        learning: newLearning.filter(id => 
          selectedDeck.cards.some(c => c.id === id)
        ).length
      };

      return {
        ...prev,
        cardsStudied: prev.cardsStudied + 1,
        cardsKnown: newKnown,
        cardsLearning: newLearning,
        deckProgress,
        lastStudied: new Date().toISOString()
      };
    });

    // Move to next card
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentCards, currentIndex, selectedDeck]);

  // Mark card as still learning
  const handleLearning = useCallback(() => {
    const cardId = currentCards[currentIndex].id;
    
    setProgress(prev => {
      const newLearning = prev.cardsLearning.includes(cardId) 
        ? prev.cardsLearning 
        : [...prev.cardsLearning, cardId];
      const newKnown = prev.cardsKnown.filter(id => id !== cardId);
      
      // Update deck progress
      const deckProgress = { ...prev.deckProgress };
      if (!deckProgress[selectedDeck.id]) {
        deckProgress[selectedDeck.id] = { known: 0, learning: 0 };
      }
      deckProgress[selectedDeck.id] = {
        known: newKnown.filter(id => 
          selectedDeck.cards.some(c => c.id === id)
        ).length,
        learning: newLearning.filter(id => 
          selectedDeck.cards.some(c => c.id === id)
        ).length
      };

      return {
        ...prev,
        cardsStudied: prev.cardsStudied + 1,
        cardsKnown: newKnown,
        cardsLearning: newLearning,
        deckProgress,
        lastStudied: new Date().toISOString()
      };
    });

    // Move to next card
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentCards, currentIndex, selectedDeck]);

  // Shuffle current deck
  const handleShuffle = useCallback(() => {
    setCurrentCards(shuffleArray(currentCards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [currentCards]);

  // Restart current deck
  const handleRestart = useCallback(() => {
    setCurrentCards(shuffleArray(selectedDeck.cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedDeck]);

  // Go back to deck selection
  const handleBackToDecks = useCallback(() => {
    setView('decks');
    setSelectedDeck(null);
    setCurrentCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  return (
    <div className="study-guide">
      {view === 'decks' && (
        <>
          <button className="main-back-btn" onClick={onBack}>
            ← Back to Menu
          </button>
          <DeckSelector 
            decks={decks} 
            progress={progress}
            onSelectDeck={handleSelectDeck} 
          />
          
          <div className="overall-stats">
            <h3>Your Progress</h3>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{progress.cardsStudied}</span>
                <span className="stat-label">Cards Studied</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{progress.cardsKnown.length}</span>
                <span className="stat-label">Mastered</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{progress.cardsLearning.length}</span>
                <span className="stat-label">Learning</span>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'studying' && selectedDeck && currentCards.length > 0 && (
        <StudySession
          deck={selectedDeck}
          cards={currentCards}
          currentIndex={currentIndex}
          isFlipped={isFlipped}
          showHint={showHint}
          progress={progress}
          onFlip={handleFlip}
          onKnow={handleKnow}
          onLearning={handleLearning}
          onToggleHint={() => setShowHint(prev => !prev)}
          onBack={handleBackToDecks}
          onShuffle={handleShuffle}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default StudyGuide;
