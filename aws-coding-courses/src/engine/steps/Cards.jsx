// Flashcards ({ id, front, back, hint, tags, difficulty }, the Study Hub card
// format). Flip, then "Again" puts the card back at the end of the deck.
import React, { useState } from 'react';
import Markdown from '../Markdown';

const Cards = ({ cards, onFinish }) => {
  const [queue, setQueue] = useState(() => cards.map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [known, setKnown] = useState(0);
  const card = cards.find((c) => c.id === queue[0]);

  const answer = (gotIt) => {
    const [first, ...rest] = queue;
    const next = gotIt ? rest : [...rest, first];
    if (gotIt) setKnown(known + 1);
    setQueue(next);
    setFlipped(false);
    setShowHint(false);
    if (!next.length) onFinish();
  };

  if (!card) {
    return (
      <div className="cards-done">
        <p><strong>Deck finished:</strong> all {cards.length} cards.</p>
        <button type="button" className="btn ghost" onClick={() => { setQueue(cards.map((c) => c.id)); setKnown(0); }}>Go through them again</button>
      </div>
    );
  }

  return (
    <div className="cards">
      <div className="cards-meta">
        <span>{known} of {cards.length} known</span>
        {card.tags?.length ? <span className="tags">{card.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span> : null}
      </div>
      <button type="button" className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Show the question' : 'Show the answer'}>
        <span className="flashcard-side">{flipped ? 'Answer' : 'Question'}</span>
        <Markdown text={flipped ? card.back : card.front} />
        {!flipped && <span className="flashcard-tap">Tap to flip</span>}
      </button>
      <div className="cards-actions">
        {!flipped && card.hint && (showHint
          ? <span className="cards-hint">Hint: {card.hint}</span>
          : <button type="button" className="btn ghost" onClick={() => setShowHint(true)}>Hint</button>)}
        {flipped && (
          <>
            <button type="button" className="btn ghost" onClick={() => answer(false)}>Again</button>
            <button type="button" className="btn" onClick={() => answer(true)}>Got it</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Cards;
