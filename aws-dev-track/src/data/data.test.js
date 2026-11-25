import { describe, it, expect } from 'vitest';
import { topics, getTopicById } from './devTrackQuestions.js';
import { chapters, getChapterById } from './devTrackGuide.js';
import { decks, getAllDecks, getDeckById, getAllTags, getExamTrapCards, getAllCards } from './devTrackCards.js';
// The block types StudyGuide can draw, read from its own switch so this list never drifts.
import studyGuideSource from '../features/StudyGuide.jsx?raw';

const RENDERED_BLOCK_TYPES = [...studyGuideSource.matchAll(/case '(\w+)':/g)].map((m) => m[1]);
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const dupes = (list) => list.filter((x, i) => list.indexOf(x) !== i);

describe('question bank', () => {
  const all = topics.flatMap((t) => t.questions.map((q) => ({ ...q, topicId: t.id })));

  it('has topics with an id, a title, a positive weight and questions', () => {
    expect(topics.length).toBeGreaterThan(0);
    for (const t of topics) {
      expect(nonEmpty(t.id), t.id).toBe(true);
      expect(nonEmpty(t.title), t.id).toBe(true);
      expect(t.weight, t.id).toBeGreaterThan(0);
      expect(t.questions.length, t.id).toBeGreaterThan(0);
    }
  });

  it('has unique topic ids, question ids and question texts', () => {
    expect(dupes(topics.map((t) => t.id))).toEqual([]);
    expect(dupes(all.map((q) => q.id))).toEqual([]);
    expect(dupes(all.map((q) => q.question))).toEqual([]);
  });

  it.each(all.map((q) => [q.id, q]))('%s has 2+ distinct options, a valid correct index and an explanation', (_, q) => {
    expect(nonEmpty(q.question)).toBe(true);
    expect(Array.isArray(q.options)).toBe(true);
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    q.options.forEach((o) => expect(nonEmpty(o)).toBe(true));
    expect(dupes(q.options)).toEqual([]);
    expect(Number.isInteger(q.correctAnswer)).toBe(true);
    expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    expect(q.correctAnswer).toBeLessThan(q.options.length);
    expect(nonEmpty(q.explanation)).toBe(true);
  });

  it('getTopicById finds every topic and returns null for an unknown id', () => {
    for (const t of topics) expect(getTopicById(t.id)).toBe(t);
    expect(getTopicById('no-such-topic')).toBeNull();
  });
});

describe('study guide', () => {
  const sections = chapters.flatMap((c) => c.sections.map((s) => ({ ...s, chapterId: c.id })));
  const blocks = sections.flatMap((s) => s.content.map((b, i) => ({ ...b, where: `${s.id}[${i}]` })));

  it('StudyGuide renders a known set of block types', () => {
    expect(RENDERED_BLOCK_TYPES).toEqual(expect.arrayContaining(['paragraph', 'table', 'code', 'examTip']));
  });

  it('has chapters with a title, a summary and sections', () => {
    expect(chapters.length).toBeGreaterThan(0);
    for (const c of chapters) {
      expect(nonEmpty(c.title), c.id).toBe(true);
      expect(nonEmpty(c.summary), c.id).toBe(true);
      expect(c.sections.length, c.id).toBeGreaterThan(0);
    }
  });

  it('has unique chapter ids and unique section ids (they are page anchors)', () => {
    expect(dupes(chapters.map((c) => c.id))).toEqual([]);
    expect(dupes(sections.map((s) => s.id))).toEqual([]);
    sections.forEach((s) => {
      expect(s.id).toMatch(/^[A-Za-z][\w-]*$/);
      expect(nonEmpty(s.title), s.id).toBe(true);
      expect(s.content.length, s.id).toBeGreaterThan(0);
    });
  });

  it('uses only block types that StudyGuide renders', () => {
    const unknown = blocks.filter((b) => !RENDERED_BLOCK_TYPES.includes(b.type)).map((b) => `${b.where}: ${b.type}`);
    expect(unknown).toEqual([]);
  });

  it('gives every block the fields its type needs', () => {
    for (const b of blocks) {
      const at = `${b.where} (${b.type})`;
      switch (b.type) {
        case 'paragraph':
        case 'examTip':
        case 'code':
          expect(nonEmpty(b.text), at).toBe(true);
          break;
        case 'keyTerm':
          expect(nonEmpty(b.term) && nonEmpty(b.definition), at).toBe(true);
          break;
        case 'awsService':
          expect(nonEmpty(b.name) && nonEmpty(b.description), at).toBe(true);
          break;
        case 'table':
          expect(b.headers.length, at).toBeGreaterThan(0);
          expect(dupes(b.headers), at).toEqual([]); // headers are React keys
          expect(b.rows.length, at).toBeGreaterThan(0);
          b.rows.forEach((r) => expect(r.length, at).toBe(b.headers.length));
          break;
        case 'comparison':
          expect(b.items.length, at).toBeGreaterThan(0);
          expect(dupes(b.items.map((it) => it.label)), at).toEqual([]); // labels are React keys
          b.items.forEach((it) => expect(nonEmpty(it.label) && nonEmpty(it.description), at).toBe(true));
          break;
        case 'bulletList':
        case 'numberedList':
          expect(b.items.length, at).toBeGreaterThan(0);
          b.items.forEach((x) => expect(nonEmpty(x), at).toBe(true));
          break;
        default:
          break;
      }
    }
  });

  it('has a chapter for every quiz topic', () => {
    for (const t of topics) expect(getChapterById(t.id), t.id).not.toBeNull();
  });

  it('getChapterById finds every chapter and returns null for an unknown id', () => {
    for (const c of chapters) expect(getChapterById(c.id)).toBe(c);
    expect(getChapterById('no-such-chapter')).toBeNull();
  });
});

describe('flashcards (Study Hub module shape)', () => {
  const cards = decks.flatMap((d) => d.cards);

  it('every card is exactly {id, front, back, hint, tags, difficulty}', () => {
    for (const c of cards) {
      expect(Object.keys(c).sort(), c.id).toEqual(['back', 'difficulty', 'front', 'hint', 'id', 'tags']);
      expect(nonEmpty(c.id) && nonEmpty(c.front) && nonEmpty(c.back), c.id).toBe(true);
      expect(typeof c.hint, c.id).toBe('string');
      expect(Array.isArray(c.tags) && c.tags.length > 0, c.id).toBe(true);
      c.tags.forEach((t) => expect(nonEmpty(t), c.id).toBe(true));
      expect(dupes(c.tags), c.id).toEqual([]);
      expect([1, 2, 3], c.id).toContain(c.difficulty);
    }
  });

  it('has unique deck ids and card ids, and no empty deck', () => {
    expect(dupes(decks.map((d) => d.id))).toEqual([]);
    expect(dupes(cards.map((c) => c.id))).toEqual([]);
    decks.forEach((d) => {
      expect(nonEmpty(d.title), d.id).toBe(true);
      expect(d.cards.length, d.id).toBeGreaterThan(0);
    });
  });

  it('getAllDecks and getDeckById return the decks', () => {
    expect(getAllDecks()).toBe(decks);
    for (const d of decks) expect(getDeckById(d.id)).toBe(d);
    expect(getDeckById('no-such-deck')).toBeNull();
  });

  it('getAllTags lists every tag once, sorted', () => {
    const expected = [...new Set(cards.flatMap((c) => c.tags))].sort();
    expect(getAllTags()).toEqual(expected);
  });

  it('getExamTrapCards returns exactly the exam-trap cards, with their deck id', () => {
    const traps = getExamTrapCards();
    expect(traps.length).toBeGreaterThan(0);
    expect(traps.map((c) => c.id).sort()).toEqual(cards.filter((c) => c.tags.includes('exam-trap')).map((c) => c.id).sort());
    for (const t of traps) expect(getDeckById(t.deckId).cards.some((c) => c.id === t.id)).toBe(true);
  });

  it('getAllCards returns every card once with its deck id and title, without changing the data', () => {
    const all = getAllCards();
    expect(all.map((c) => c.id)).toEqual(cards.map((c) => c.id));
    for (const c of all) expect(getDeckById(c.deckId).title).toBe(c.deckTitle);
    cards.forEach((c) => expect(c).not.toHaveProperty('deckId'));
  });
});
