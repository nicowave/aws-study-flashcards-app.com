import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudyGuide from './StudyGuide';
import { studyGuides } from '../data/studyGuide';

// Tested against the app's own study guides, so every block type the data really uses
// is rendered. (Cloud Practitioner's StudyGuide is a different component; this file is for
// the apps whose guides come from src/data/studyGuide.)

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const guideButton = (guide) => screen.getByRole('button', { name: new RegExp(escape(guide.name)) });
// textContent with whitespace collapsed, the way a reader sees it
const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const texts = (els) => Array.from(els, text);

const openGuide = async (guide) => {
  const user = userEvent.setup();
  render(<StudyGuide onBack={vi.fn()} />);
  await user.click(guideButton(guide));
  return user;
};

const sectionEl = (section) => document.getElementById(section.id);

// What a reader must see for each block type the guides use.
const expectBlockRendered = (sectionNode, block) => {
  const content = text(sectionNode);
  const shows = (s) => expect(content).toContain(norm(s));
  switch (block.type) {
    case 'paragraph':
    case 'examTip':
      shows(block.text);
      break;
    case 'keyTerm':
      shows(block.term);
      shows(block.definition);
      break;
    case 'awsService':
      shows(block.name);
      shows(block.description);
      break;
    case 'bulletList':
    case 'numberedList': {
      if (block.title) shows(block.title);
      // bullets are an unordered list, numbered steps an ordered one, items in order
      const lists = sectionNode.querySelectorAll(block.type === 'bulletList' ? 'ul' : 'ol');
      const wanted = block.items.map(norm);
      const match = Array.from(lists).some((l) => JSON.stringify(texts(l.querySelectorAll(':scope > li'))) === JSON.stringify(wanted));
      expect(match, `${block.type} ${block.title ?? ''}`).toBe(true);
      break;
    }
    case 'comparison':
      if (block.title) shows(block.title);
      block.items.forEach((item) => { shows(item.label); shows(item.description); });
      break;
    case 'table': {
      // a real table: header row plus one row per data row, cells in order
      const wantedHead = block.headers.map(norm);
      const wantedRows = block.rows.map((r) => r.map(norm));
      const match = Array.from(sectionNode.querySelectorAll('table')).some((t) => (
        JSON.stringify(texts(t.querySelectorAll('thead th'))) === JSON.stringify(wantedHead)
        && JSON.stringify(Array.from(t.querySelectorAll('tbody tr'), (tr) => texts(tr.querySelectorAll('td')))) === JSON.stringify(wantedRows)
      ));
      expect(match, `table ${block.headers.join(' | ')}`).toBe(true);
      break;
    }
    default:
      throw new Error(`StudyGuide test doesn't know block type "${block.type}"; add it here and to the component`);
  }
};

describe('StudyGuide', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists every study guide with its exam weight and description', () => {
    render(<StudyGuide onBack={vi.fn()} />);
    expect(studyGuides.length).toBeGreaterThan(0);
    for (const guide of studyGuides) {
      const button = guideButton(guide);
      expect(button).toHaveTextContent(guide.weight);
      expect(button).toHaveTextContent(norm(guide.description));
    }
  });

  it('every block type in the data is one the component can render', () => {
    const known = ['paragraph', 'keyTerm', 'awsService', 'table', 'bulletList', 'numberedList', 'comparison', 'examTip'];
    const used = new Set(studyGuides.flatMap((g) => g.sections.flatMap((s) => s.content.map((b) => b.type))));
    expect([...used].filter((t) => !known.includes(t))).toEqual([]);
  });

  describe.each(studyGuides.map((g) => [g.name, g]))('%s', (_name, guide) => {
    it('opens with its title and the sections in order, in the contents and the article', async () => {
      await openGuide(guide);
      expect(screen.getByRole('heading', { level: 2, name: guide.name })).toBeInTheDocument();
      const titles = guide.sections.map((s) => norm(s.title));
      expect(texts(screen.getAllByRole('heading', { level: 3 }))).toEqual(titles);
      const toc = screen.getByRole('navigation');
      expect(texts(within(toc).getAllByRole('button'))).toEqual(titles);
    });

    it('renders every content block of every section', async () => {
      await openGuide(guide);
      for (const section of guide.sections) {
        const node = sectionEl(section);
        expect(node, section.id).not.toBeNull();
        section.content.forEach((block) => expectBlockRendered(node, block));
      }
    });

    it('shows each section\'s AWS sources as links', async () => {
      await openGuide(guide);
      for (const section of guide.sections) {
        expect(section.sources?.length, `${section.id} has no sources`).toBeGreaterThan(0);
        const hrefs = within(sectionEl(section)).getAllByRole('link').map((a) => a.getAttribute('href'));
        section.sources.forEach((s) => expect(hrefs).toContain(s.url));
      }
    });
  });

  it('the table of contents scrolls to the chosen section', async () => {
    const guide = studyGuides[0];
    const target = guide.sections[guide.sections.length - 1];
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const user = await openGuide(guide);
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: norm(target.title) }));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(sectionEl(target));
  });

  it('highlights the section being read in the table of contents', async () => {
    // Capture the observer so the test can say which section scrolled into view
    let fire;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb) { fire = cb; }
      observe() {}
      disconnect() {}
    });
    const guide = studyGuides.find((g) => g.sections.length > 1) ?? studyGuides[0];
    const target = guide.sections[guide.sections.length - 1];
    await openGuide(guide);
    const tocItem = (s) => within(screen.getByRole('navigation')).getByRole('button', { name: norm(s.title) });
    expect(tocItem(guide.sections[0])).toHaveClass('active');
    act(() => fire([{ isIntersecting: true, target: sectionEl(target) }]));
    expect(tocItem(target)).toHaveClass('active');
    if (target !== guide.sections[0]) expect(tocItem(guide.sections[0])).not.toHaveClass('active');
  });

  it('the back button returns to the list of guides', async () => {
    const [first] = studyGuides;
    const user = await openGuide(first);
    await user.click(screen.getByRole('button', { name: /topics/i }));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    studyGuides.forEach((g) => expect(guideButton(g)).toBeInTheDocument());
  });
});
