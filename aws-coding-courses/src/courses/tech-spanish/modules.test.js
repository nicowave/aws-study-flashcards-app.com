// Tech Spanish modules, one test each: a broken module fails only its own test,
// so modules can be written in parallel. Run one with:
//   npx vitest run src/courses/tech-spanish/modules.test.js -t git-everyday
import { describe, it, expect } from 'vitest';
import { localize } from '../../engine/i18n';
import { tutorialProblems, missingTranslations, parityProblems } from '../validate';
import { TERMS } from './glossary';

const loaders = import.meta.glob('./tutorials/*.js');

describe('Tech Spanish modules', () => {
  for (const [path, load] of Object.entries(loaders)) {
    const name = path.replace('./tutorials/', '').replace(/^\d+-/, '').replace('.js', '');
    it(`${name}: loads, has both languages, and every step is well formed`, async () => {
      const t = (await load()).default;
      const [es, en] = ['es', 'en'].map((lang) => localize(t, lang));
      expect(missingTranslations(t, name)).toEqual([]);
      expect([...tutorialProblems(es, 'es'), ...tutorialProblems(en, 'en')]).toEqual([]);
      expect(parityProblems(es, en)).toEqual([]);
    });
  }

  it('practices every glossary term in some flashcard deck', async () => {
    const practiced = new Set();
    for (const load of Object.values(loaders)) {
      const t = localize((await load()).default, 'en');
      for (const s of t.steps) if (s.kind === 'cards') for (const c of s.cards) practiced.add(c.id.replace(/-(en-es|es-en)$/, ''));
    }
    expect(TERMS.map((x) => x.id).filter((id) => !practiced.has(id))).toEqual([]);
  });
});
