import { describe, it, expect, vi } from 'vitest';
import { load, save, shuffle, withShuffledOptions } from './store.js';

const KEY = 'store-test-key';
const FALLBACK = { xp: 0, best: {}, attempts: [] };

describe('store: load', () => {
  it('returns the fallback when nothing is saved', () => {
    expect(load(KEY, FALLBACK)).toEqual(FALLBACK);
  });

  it('reads back what save wrote', () => {
    const value = { xp: 120, best: { tls: 80 }, attempts: [{ pct: 75, at: 1 }] };
    save(KEY, value);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(value);
    expect(load(KEY, FALLBACK)).toEqual(value);
  });

  it('fills fields missing from older saved data with the fallback values', () => {
    localStorage.setItem(KEY, JSON.stringify({ xp: 30 }));
    expect(load(KEY, FALLBACK)).toEqual({ ...FALLBACK, xp: 30 });
  });

  it.each([
    ['not JSON', '{not json'],
    ['truncated JSON', '{"xp": 1'],
    ['JSON null', 'null'],
    ['a number', '42'],
  ])('falls back safely on corrupt saved data (%s)', (_, raw) => {
    localStorage.setItem(KEY, raw);
    const loaded = load(KEY, FALLBACK);
    expect(loaded.xp).toBe(0);
    expect(loaded.best).toEqual({});
    expect(loaded.attempts).toEqual([]);
  });

  it('replaces saved fields whose shape does not match the fallback, keeping the rest', () => {
    localStorage.setItem(KEY, JSON.stringify({ xp: 5, best: null, attempts: 'oops' }));
    expect(load(KEY, FALLBACK)).toEqual({ ...FALLBACK, xp: 5 });
    localStorage.setItem(KEY, JSON.stringify([1, 2]));
    expect(load(KEY, FALLBACK)).toEqual(FALLBACK);
  });

  it('returns the fallback when storage cannot be read (private mode, blocked site data)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(load(KEY, FALLBACK)).toEqual(FALLBACK);
  });
});

describe('store: save', () => {
  it('does not throw when storage is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(() => save(KEY, { xp: 1 })).not.toThrow();
  });
});

describe('store: shuffle', () => {
  it('returns a new array with the same items and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('can put any item first (not a fixed order)', () => {
    const firsts = new Set();
    for (let n = 0; n < 200; n++) firsts.add(shuffle([1, 2, 3, 4])[0]);
    expect(firsts).toEqual(new Set([1, 2, 3, 4]));
  });
});

describe('store: withShuffledOptions', () => {
  const q = { id: 'q1', question: 'Which?', options: ['right', 'w1', 'w2', 'w3'], correctAnswer: 0, explanation: 'Because.' };

  it('keeps the same options and points correctAnswer at the same option text', () => {
    for (let n = 0; n < 50; n++) {
      const s = withShuffledOptions(q);
      expect([...s.options].sort()).toEqual([...q.options].sort());
      expect(s.options[s.correctAnswer]).toBe('right');
      expect(s.question).toBe(q.question);
      expect(s.explanation).toBe(q.explanation);
    }
    expect(q.options).toEqual(['right', 'w1', 'w2', 'w3']);
    expect(q.correctAnswer).toBe(0);
  });

  it('moves the right answer around so its position is never a tell', () => {
    const positions = new Set();
    for (let n = 0; n < 200; n++) positions.add(withShuffledOptions(q).correctAnswer);
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });
});
