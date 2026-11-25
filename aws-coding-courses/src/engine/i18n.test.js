import { describe, it, expect } from 'vitest';
import { STRINGS, both, isBoth, pick, join, localize, translate, initialLanguage } from './i18n';

describe('interface strings', () => {
  it('has every English string in Spanish, of the same kind', () => {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.es));
    const extra = Object.keys(STRINGS.es).filter((k) => !(k in STRINGS.en));
    const kind = Object.keys(STRINGS.en).filter((k) => k in STRINGS.es && typeof STRINGS.en[k] !== typeof STRINGS.es[k]);
    expect({ missing, extra, kind }).toEqual({ missing: [], extra: [], kind: [] });
  });

  it('fills templates, falls back to English, and lets a course reword a string', () => {
    expect(translate('es', 'cards.known', [2, 5])).toBe('2 de 5 sabidas');
    expect(translate('fr', 'nav.signIn')).toBe('Sign in');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
    expect(translate('es', 'unit.name', [], { 'unit.name': 'Módulo' })).toBe('Módulo');
  });
});

describe('both() and localize()', () => {
  it('resolves only both() values, deeply, and leaves functions alone', () => {
    const check = () => true;
    const course = {
      title: both('Module', 'Módulo'),
      example: { en: 'plain data', es: 'datos' }, // not a both(): kept as is
      steps: [{ id: 'a', body: both('Hi', 'Hola'), check, options: [both('Yes', 'Sí'), 'OK'] }],
    };
    const es = localize(course, 'es');
    expect(es.title).toBe('Módulo');
    expect(es.example).toEqual({ en: 'plain data', es: 'datos' });
    expect(es.steps[0]).toMatchObject({ id: 'a', body: 'Hola', options: ['Sí', 'OK'] });
    expect(es.steps[0].check).toBe(check);
    expect(localize(course, 'en').steps[0].body).toBe('Hi');
    expect(isBoth(course.title) && !isBoth(course.example)).toBe(true);
    expect(pick(both('a', undefined), 'es')).toBe('a');
    expect(join(both('Hi', 'Hola'), '', 'table', null)).toEqual(both('Hi\n\ntable', 'Hola\n\ntable'));
  });
});

describe('initialLanguage', () => {
  const langs = ['es', 'en'];
  it('prefers the saved choice, then the browser, then the course default', () => {
    expect(initialLanguage(langs, 'es', { stored: 'en', browser: ['es-MX'] })).toBe('en');
    expect(initialLanguage(langs, 'es', { stored: 'fr', browser: ['en-US', 'es'] })).toBe('en');
    expect(initialLanguage(langs, 'es', { browser: ['de-DE'] })).toBe('es');
    expect(initialLanguage(langs, 'xx', {})).toBe('es');
  });
});
