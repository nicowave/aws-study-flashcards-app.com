// Flashcards ({ id, front, back, hint, tags, difficulty }, the Study Hub card
// format). Flip, then "Again" puts the card back at the end of the deck.
import React, { useState } from 'react';
import Markdown from '../Markdown';
import { useT } from '../i18n';

const Cards = ({ cards, onFinish }) => {
  const t = useT();
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
        <p><strong>{t('cards.deckFinished')}</strong> {t('cards.allCards', cards.length)}</p>
        <button type="button" className="btn ghost" onClick={() => { setQueue(cards.map((c) => c.id)); setKnown(0); }}>{t('cards.again')}</button>
      </div>
    );
  }

  return (
    <div className="cards">
      <div className="cards-meta">
        <span>{t('cards.known', known, cards.length)}</span>
        {card.tags?.length ? <span className="tags">{card.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</span> : null}
      </div>
      <button type="button" className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? t('cards.showQuestion') : t('cards.showAnswer')}>
        <span className="flashcard-side">{flipped ? t('cards.answer') : t('cards.question')}</span>
        <Markdown text={flipped ? card.back : card.front} />
        {!flipped && <span className="flashcard-tap">{t('cards.tap')}</span>}
      </button>
      <div className="cards-actions">
        {!flipped && card.hint && (showHint
          ? <span className="cards-hint">{t('cards.hintLabel', card.hint)}</span>
          : <button type="button" className="btn ghost" onClick={() => setShowHint(true)}>{t('cards.hint')}</button>)}
        {flipped && (
          <>
            <button type="button" className="btn ghost" onClick={() => answer(false)}>{t('cards.notYet')}</button>
            <button type="button" className="btn" onClick={() => answer(true)}>{t('cards.gotIt')}</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Cards;
