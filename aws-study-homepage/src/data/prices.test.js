import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY, PRO_TRIAL_DAYS, PRODUCT_PRICES, INTERVALS, YEARLY_SAVINGS_PERCENT, cents,
} from './prices';

// Tests run from the app folder (npm test); jsdom's import.meta.url isn't a file path
const publicFile = (name) => readFileSync(join(process.cwd(), 'public', name), 'utf8');
const dollarAmounts = (text) => [...new Set(text.match(/\$\d[\d,.]*/g) || [])].map((d) => d.replace(/[.,]$/, ''));

describe('prices', () => {
  it('are whole-dollar labels the cards can print as they are', () => {
    for (const p of [PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY]) expect(p).toMatch(/^\$\d+$/);
    expect(PRODUCT_PRICES).toEqual({ month: PRODUCT_MONTHLY, year: PRODUCT_YEARLY });
    expect(INTERVALS).toEqual(Object.keys(PRODUCT_PRICES));
    expect(Number.isInteger(PRO_TRIAL_DAYS) && PRO_TRIAL_DAYS > 0).toBe(true);
  });

  it('works out the yearly saving from the two prices, never more than it really is', () => {
    const twelveMonths = 12 * cents(PRODUCT_MONTHLY);
    const exact = (1 - cents(PRODUCT_YEARLY) / twelveMonths) * 100;
    expect(YEARLY_SAVINGS_PERCENT).toBe(Math.round(exact));
    expect(Math.abs(YEARLY_SAVINGS_PERCENT - exact)).toBeLessThan(0.5);
    expect(YEARLY_SAVINGS_PERCENT).toBeGreaterThan(0); // yearly must be the better deal
  });

  it('costs Pro less than every product bought yearly one by one', () => {
    // 4 certifications + 5 courses
    expect(cents(PRO_YEARLY)).toBeLessThan(9 * cents(PRODUCT_YEARLY));
    expect(cents(PRO_YEARLY)).toBeGreaterThan(cents(PRODUCT_YEARLY));
  });

  // The two static files can't import prices.js, so they are checked against it
  it.each(['terms.html', 'llms.txt'])('public/%s names only today\'s prices', (name) => {
    const text = publicFile(name);
    const allowed = [PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY];
    expect(dollarAmounts(text).filter((d) => !allowed.includes(d))).toEqual([]);
    for (const p of allowed) expect(text).toContain(p);
  });

  it('terms say subscriptions renew automatically, how to cancel, and that old one-time purchases stay', () => {
    const text = publicFile('terms.html').replace(/\s+/g, ' ');
    expect(text).toMatch(/renews automatically/i);
    expect(text).toMatch(/Cancel any subscription anytime/i);
    expect(text).toMatch(/keep their lifetime access/i);
    expect(text).toMatch(new RegExp(`first ${PRO_TRIAL_DAYS} days of Pro are free`));
    expect(text).toMatch(new RegExp(`before the ${PRO_TRIAL_DAYS} days end`));
    expect(text).toMatch(/prorates/i);
  });

  it('the Pro trial matches what checkout gives, here and in llms.txt', () => {
    // Checkout sets trial_period_days from this constant; the page must promise the same length
    const backend = readFileSync(join(process.cwd(), '..', 'aws-backend', 'lambda', 'callables', 'index.js'), 'utf8');
    expect(Number(backend.match(/const PRO_TRIAL_DAYS = (\d+);/)[1])).toBe(PRO_TRIAL_DAYS);
    expect(publicFile('llms.txt')).toContain(`${PRO_TRIAL_DAYS}-day free trial`);
  });
});
