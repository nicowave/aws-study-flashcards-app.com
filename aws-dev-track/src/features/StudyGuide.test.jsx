import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudyGuide from './StudyGuide.jsx';
import { chapters } from '../data/devTrackGuide.js';
import studyGuideSource from './StudyGuide.jsx?raw';

const norm = (s) => s.replace(/\s+/g, ' ').trim();
// Elements of `tag` whose whole text is `text` (whitespace-insensitive, so code blocks match too).
const byTagText = (scope, tag, text) =>
  within(scope).queryAllByText((_, el) => el.tagName === tag && norm(el.textContent) === norm(text));
const expectShown = (scope, tag, text, where) => {
  expect(byTagText(scope, tag, text).length, `${where}: <${tag.toLowerCase()}> "${text.slice(0, 60)}"`).toBeGreaterThan(0);
};

// What each block type must put on the page, from its data.
const expectBlock = (scope, b, where) => {
  switch (b.type) {
    case 'paragraph':
      return expectShown(scope, 'P', b.text, where);
    case 'keyTerm':
      expectShown(scope, 'DT', b.term, where);
      return expectShown(scope, 'DD', b.definition, where);
    case 'awsService':
      expectShown(scope, 'STRONG', b.name, where);
      return expectShown(scope, 'P', b.description, where);
    case 'table': {
      const tables = within(scope).getAllByRole('table');
      const table = tables.find((t) => within(t).queryAllByRole('columnheader').map((h) => h.textContent).join('|') === b.headers.join('|'));
      expect(table, `${where}: table with headers ${b.headers.join(', ')}`).toBeDefined();
      const rows = within(table).getAllByRole('row').slice(1);
      expect(rows).toHaveLength(b.rows.length);
      b.rows.forEach((r, i) => {
        const cells = [...rows[i].children];
        expect(cells.map((c) => c.textContent)).toEqual(r);
        expect(within(rows[i]).getByRole('rowheader')).toBe(cells[0]); // first column labels the row
        cells.slice(1).forEach((c) => expect(c.tagName).toBe('TD'));
      });
      return;
    }
    case 'comparison':
      if (b.title) expectShown(scope, 'H4', b.title, where);
      return b.items.forEach((it) => {
        expectShown(scope, 'STRONG', it.label, where);
        expectShown(scope, 'P', it.description, where);
      });
    case 'bulletList':
    case 'numberedList': {
      if (b.title) expectShown(scope, 'H4', b.title, where);
      const lists = within(scope).getAllByRole('list').filter((l) => l.tagName === (b.type === 'bulletList' ? 'UL' : 'OL'));
      const list = lists.find((l) => within(l).queryAllByRole('listitem').map((li) => li.textContent).join('|') === b.items.join('|'));
      expect(list, `${where}: ${b.type} ${b.items[0]}`).toBeDefined();
      return;
    }
    case 'code':
      if (b.title) expectShown(scope, 'H4', b.title, where);
      expect(within(scope).queryAllByText((_, el) => el.tagName === 'PRE' && el.textContent === b.text).length, `${where}: code`).toBe(1);
      return;
    case 'examTip':
      return expectShown(scope, 'ASIDE', `Tip ${b.text}`, where);
    default:
      throw new Error(`${where}: no expectation for block type ${b.type}`);
  }
};

const setup = () => {
  const user = userEvent.setup();
  render(<StudyGuide />);
  return { user };
};
const chapterButton = (c) => screen.getByRole('button', { name: (n) => n.includes(c.title) });
const openChapter = (user, c) => user.click(chapterButton(c));

describe('StudyGuide: chapter list', () => {
  it('lists every chapter in order with its number, title and summary', () => {
    setup();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(chapters.length);
    chapters.forEach((c, i) => {
      const item = items[i];
      expect(item).toHaveTextContent(String(i + 1).padStart(2, '0'));
      expect(within(item).getByText(c.title)).toBeInTheDocument();
      expect(within(item).getByText(c.summary)).toBeInTheDocument();
    });
  });

  it('opens a chapter and goes back to the list', async () => {
    const { user } = setup();
    const c = chapters[1];
    await openChapter(user, c);
    expect(screen.getByRole('heading', { level: 2, name: c.title })).toBeInTheDocument();
    expect(screen.getByText(`Chapter 2 of ${chapters.length}`)).toBeInTheDocument();
    expect(screen.getByText(c.summary)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All chapters' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Study guide' })).toBeInTheDocument();
    expect(chapterButton(chapters[0])).toBeInTheDocument();
  });
});

describe('StudyGuide: a chapter', () => {
  it('has a table of contents linking to every section, in order', async () => {
    const { user } = setup();
    const c = chapters[0];
    await openChapter(user, c);
    const toc = screen.getByRole('navigation', { name: 'Sections in this chapter' });
    const links = within(toc).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(c.sections.map((s) => s.title));
    links.forEach((a, i) => {
      const id = c.sections[i].id;
      expect(a).toHaveAttribute('href', `#${id}`);
      const target = document.getElementById(id);
      expect(target).toBeInTheDocument();
      expect(within(target).getByRole('heading', { level: 3 })).toHaveTextContent(c.sections[i].title);
    });
  });

  it('Previous is off on the first chapter and Next is off on the last', async () => {
    const { user } = setup();
    await openChapter(user, chapters[0]);
    expect(screen.getByRole('button', { name: 'Previous chapter' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next chapter' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'All chapters' }));
    await openChapter(user, chapters[chapters.length - 1]);
    expect(screen.getByRole('button', { name: 'Next chapter' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous chapter' })).toBeEnabled();
  });

  it('Next and Previous move one chapter and scroll back to the top', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const { user } = setup();
    await openChapter(user, chapters[0]);
    await user.click(screen.getByRole('button', { name: 'Next chapter' }));
    expect(screen.getByRole('heading', { level: 2, name: chapters[1].title })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
    await user.click(screen.getByRole('button', { name: 'Previous chapter' }));
    expect(screen.getByRole('heading', { level: 2, name: chapters[0].title })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });

  it('renders every section and every content block of every chapter', async () => {
    const { user } = setup();
    await openChapter(user, chapters[0]);
    for (let ci = 0; ci < chapters.length; ci++) {
      const c = chapters[ci];
      expect(screen.getByRole('heading', { level: 2, name: c.title })).toBeInTheDocument();
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(c.sections.length);
      c.sections.forEach((s, si) => {
        const article = articles[si];
        expect(article).toHaveAttribute('id', s.id);
        expect(within(article).getByRole('heading', { level: 3 })).toHaveTextContent(s.title);
        s.content.forEach((b, bi) => expectBlock(article, b, `${s.id}[${bi}]`));
      });
      if (ci < chapters.length - 1) await user.click(screen.getByRole('button', { name: 'Next chapter' }));
    }
  });

  it('the guide uses every block type StudyGuide knows (so the test above covers them all)', () => {
    const used = new Set(chapters.flatMap((c) => c.sections.flatMap((s) => s.content.map((b) => b.type))));
    const rendered = [...studyGuideSource.matchAll(/case '(\w+)':/g)].map((m) => m[1]);
    expect([...used].sort()).toEqual([...rendered].sort());
  });
});
