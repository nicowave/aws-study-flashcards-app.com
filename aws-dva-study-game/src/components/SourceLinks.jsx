import React from 'react';
import { BookOpenIcon, ExternalLinkIcon } from './Icons';
import './SourceLinks.css';

// The official AWS pages that back an answer, so learners can check it themselves.
// Clicks and keys stop here: on a flashcard they would otherwise flip the card.
const stop = (e) => e.stopPropagation();

export default function SourceLinks({ sources, compact = false }) {
  if (!sources?.length) return null;
  return (
    <div className={`source-links${compact ? ' source-links--compact' : ''}`} onClick={stop} onKeyDown={stop}>
      <span className="source-links-label">
        <BookOpenIcon size={14} /> {sources.length > 1 ? 'AWS sources' : 'AWS source'}
      </span>
      {sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
          {s.title} <ExternalLinkIcon size={12} />
        </a>
      ))}
    </div>
  );
}
