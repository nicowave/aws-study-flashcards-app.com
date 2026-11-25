import { describe, it, expect } from 'vitest';
import { normalize, hasTerm, countWords, checkRewrite } from './rewrite';
import { registerQuestions } from './register';

describe('rewrite checks', () => {
  it('ignores case and accents, and matches whole words', () => {
    expect(normalize('Despliegue ÁGIL')).toBe('despliegue agil');
    expect(hasTerm('Hicimos el DESPLIEGUE', ['despliegue'])).toBe(true);
    expect(hasTerm('el redespliegue', ['despliegue'])).toBe(false);
    expect(hasTerm('Desplegamos ayer', ['despleg*'])).toBe(true);
    expect(hasTerm('pull request abierta', ['pull request'])).toBe(true);
    expect(hasTerm('pull   request', ['pull request'])).toBe(true);
  });

  it('accepts curly apostrophes, hyphen or space variants, and * on any word', () => {
    expect(hasTerm('We can’t create orders', ["can't create"])).toBe(true);
    expect(hasTerm('one trade off', ['trade-off*'])).toBe(true);
    expect(hasTerm('the tradeoffs', ['trade-off*'])).toBe(true);
    expect(hasTerm('we roll out today', ['roll-out*'])).toBe(true);
    expect(hasTerm('Blocking writes for an hour', ['block* writes'])).toBe(true);
    expect(hasTerm('disabled   writes', ['disable* writes'])).toBe(true);
    expect(hasTerm('unblock writes', ['block* writes'])).toBe(false);
    expect(hasTerm('3.4 GB', ['3.4'])).toBe(true);
  });

  it('counts words in both languages', () => {
    expect(countWords('Fusioné la rama y la desplegué en producción.')).toBe(8);
    expect(countWords('  ')).toBe(0);
  });

  it('reports what is missing, what to avoid, and short answers', () => {
    const step = {
      minWords: 4,
      mustUse: [{ any: ['biblioteca*'], label: 'biblioteca' }, { any: ['despleg*', 'implement*'] }],
      avoid: [{ any: ['librer*'], why: 'Library = biblioteca.' }],
    };
    expect(checkRewrite('Usamos la librería nueva', step)).toMatchObject({
      ok: false, missing: ['biblioteca', 'despleg…'], avoided: [{ term: 'librer…', why: 'Library = biblioteca.' }],
    });
    expect(checkRewrite('biblioteca', step)).toMatchObject({ ok: false, tooShort: true });
    expect(checkRewrite('Implementamos la biblioteca nueva hoy.', step).ok).toBe(true);
  });
});

describe('register steps', () => {
  it('become quiz questions with the three registers as options', () => {
    const t = (k) => ({ 'register.formal': 'F', 'register.team': 'T', 'register.slang': 'S' }[k]);
    const [q] = registerQuestions([{ text: 'Lo deployo', answer: 'team', explain: 'x', context: 'Slack' }], t);
    expect(q).toEqual({ q: '“Lo deployo” — *Slack*', options: ['F', 'T', 'S'], answer: 1, explain: 'x' });
  });
});
