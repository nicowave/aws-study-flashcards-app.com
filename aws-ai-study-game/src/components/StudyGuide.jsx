import React, { useState, useEffect } from 'react';
import { domains } from '../data';
import { ArrowLeftIcon, ArrowRightIcon, RefreshIcon, BookOpenIcon } from './Icons';

const StudyGuide = ({ onBack }) => {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState([]);

  // Load cards when domain is selected
  useEffect(() => {
    if (selectedDomain) {
      // Get domain and convert questions to flashcard format
      const domain = domains.find(d => d.id === selectedDomain);
      
      if (domain?.questions && domain.questions.length > 0) {
        // Convert questions to flashcard format
        const questionCards = domain.questions.map(q => ({
          front: q.question,
          back: q.options[q.correct] + (q.explanation ? `\n\n${q.explanation}` : '')
        }));
        setCards(questionCards);
      } else {
        setCards([]);
      }
      
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [selectedDomain]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Domain selection view
  if (!selectedDomain) {
    return (
      <div className="study-guide">
        <div className="study-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeftIcon size={20} />
            <span>Back</span>
          </button>
          <h2>Study Guide</h2>
          <p className="study-subtitle">Select a topic to review flashcards</p>
        </div>

        <div className="study-domain-grid">
          {domains.map((domain) => (
            <button
              key={domain.id}
              className="study-domain-card"
              onClick={() => setSelectedDomain(domain.id)}
            >
              <span className="domain-icon">{domain.icon || '📚'}</span>
              <span className="domain-name">{domain.name}</span>
              <span className="card-count">
                {domain.questions?.length || 0} cards
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Flashcard view
  const currentCard = cards[currentCardIndex];
  const domain = domains.find(d => d.id === selectedDomain);

  return (
    <div className="study-guide">
      <div className="study-header">
        <button className="back-btn" onClick={() => setSelectedDomain(null)}>
          <ArrowLeftIcon size={20} />
          <span>Topics</span>
        </button>
        <div className="study-title">
          <span className="domain-icon">{domain?.icon || '📚'}</span>
          <span>{domain?.name || 'Study'}</span>
        </div>
        <span className="card-counter">
          {currentCardIndex + 1} / {cards.length}
        </span>
      </div>

      {cards.length > 0 ? (
        <>
          {/* Flashcard */}
          <div 
            className={`flashcard ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <BookOpenIcon size={24} className="card-icon" />
                <p className="card-content">{currentCard?.front}</p>
                <span className="flip-hint">Tap to reveal answer</span>
              </div>
              <div className="flashcard-back">
                <p className="card-content">{currentCard?.back}</p>
                <span className="flip-hint">Tap to see question</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flashcard-nav">
            <button 
              className="nav-btn"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
            >
              <ArrowLeftIcon size={20} />
              <span>Previous</span>
            </button>

            <button className="shuffle-btn" onClick={handleShuffle}>
              <RefreshIcon size={18} />
              <span>Shuffle</span>
            </button>

            <button 
              className="nav-btn"
              onClick={handleNext}
              disabled={currentCardIndex === cards.length - 1}
            >
              <span>Next</span>
              <ArrowRightIcon size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="study-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="no-cards">
          <p>No flashcards available for this topic.</p>
          <button className="back-btn" onClick={() => setSelectedDomain(null)}>
            Choose another topic
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyGuide;
