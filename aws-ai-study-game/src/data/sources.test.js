// Every AI Practitioner question, flashcard and study guide section must cite an official AWS page,
// checked within the last year. deploy.sh runs this before it builds the site.
import { describe, it, expect } from 'vitest';
import { getAllQuestions } from './index';
import { getAllDecks } from './flashcards';
import { studyGuides } from './studyGuide';
import { sourceProblems, MAX_SOURCE_AGE_DAYS } from './sources';

const questions = getAllQuestions();
const cards = getAllDecks().flatMap((deck) => deck.cards.map((card) => ({ ...card, deck: deck.id })));
const sections = studyGuides.flatMap((guide) => guide.sections.map((s) => ({ ...s, deck: `guide ${guide.id}` })));

// One readable line per broken item, so a failure says exactly what to fix
const report = (items) =>
  items
    .map((item) => ({ item, problems: sourceProblems(item) }))
    .filter((r) => r.problems.length)
    .map(({ item, problems }) => `${item.domain ?? item.deck} / ${item.id}: ${problems.join('; ')}`);

describe('AI Practitioner sources', () => {
  it('has content to check', () => {
    expect(questions.length).toBeGreaterThan(100);
    expect(cards.length).toBeGreaterThan(50);
    expect(sections.length).toBeGreaterThan(15);
  });

  it('every quiz question cites an official AWS page', () => {
    expect(report(questions)).toEqual([]);
  });

  it('every flashcard cites an official AWS page', () => {
    expect(report(cards)).toEqual([]);
  });

  it('every study guide section cites an official AWS page', () => {
    expect(report(sections)).toEqual([]);
  });

  it('no deck credits the third-party study guide we replaced', () => {
    const labels = getAllDecks().map((d) => `${d.id}: ${d.source ?? ''}`);
    expect(labels.filter((l) => /175\+|Exam Prep/i.test(l))).toEqual([]);
  });
});

describe('sourceProblems', () => {
  const today = new Date('2026-11-25T12:00:00Z');
  const ok = { title: 'Page', url: 'https://docs.aws.amazon.com/x.html', checked: '2026-11-25' };

  it('accepts an official, recent source', () => {
    expect(sourceProblems({ sources: [ok] }, today)).toEqual([]);
  });

  it('rejects missing sources, other sites, plain http and bad dates', () => {
    expect(sourceProblems({}, today)).toEqual(['has no sources']);
    expect(sourceProblems({ sources: [{ ...ok, url: 'https://example.com/aws' }] }, today)[0]).toMatch(/not an official AWS site/);
    expect(sourceProblems({ sources: [{ ...ok, url: 'http://docs.aws.amazon.com/x.html' }] }, today)[0]).toMatch(/not https/);
    expect(sourceProblems({ sources: [{ ...ok, checked: '2026-02-30' }] }, today)[0]).toMatch(/YYYY-MM-DD/);
    expect(sourceProblems({ sources: [ok, ok] }, today)).toContain('lists the same url twice');
  });

  it(`asks for a re-check after ${MAX_SOURCE_AGE_DAYS} days`, () => {
    const later = new Date('2027-11-27T12:00:00Z');
    expect(sourceProblems({ sources: [ok] }, later)[0]).toMatch(/re-read it/);
  });
});
