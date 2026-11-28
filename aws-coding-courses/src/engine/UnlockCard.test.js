import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../services/billing', () => ({ startCheckout: vi.fn() }));

const { default: UnlockCard } = await import('./UnlockCard');
const { LangProvider, STRINGS } = await import('./i18n');
const { PRODUCT_YEARLY, PRO_YEARLY, PRO_TRIAL_DAYS, YEARLY_SAVINGS_PERCENT } = await import('../services/prices');
const { default: bash } = await import('../courses/bash');
const { default: spanish } = await import('../courses/tech-spanish');
const { localize } = await import('./i18n');

const render = (course, lang = 'en') => renderToStaticMarkup(
  React.createElement(LangProvider, { languages: [lang], defaultLanguage: lang },
    React.createElement(UnlockCard, { course: localize(course, lang), user: { email: 'a@example.com' }, onSignIn: () => {}, returnPath: '/' })),
);

describe('UnlockCard', () => {
  it('sells the course monthly or yearly, and Pro, with prices from prices.js', () => {
    const html = render(bash);
    expect(html).toContain('Monthly');
    expect(html).toContain('Yearly');
    expect(html).toContain(`save ${YEARLY_SAVINGS_PERCENT}%`);
    expect(html).toContain(PRODUCT_YEARLY); // yearly is picked first
    expect(html).toContain(PRO_YEARLY);
    expect(html).toContain(`${PRO_TRIAL_DAYS}-day free trial`);
  });

  it('says it renews and links the Terms', () => {
    const html = render(bash);
    expect(html).toMatch(/renew automatically/i);
    expect(html).toContain('href="https://aws-study-flashcards-app.com/terms.html"');
    expect(html).toContain('Manage billing');
  });

  it('never sells the retired bundle or promises a one-time purchase', () => {
    for (const html of [render(bash), render(spanish, 'es'), render(spanish, 'en')]) {
      expect(html).not.toMatch(/Developer Path|bundle|paquete|one[- ]time|pay once|yours to keep|pago único|para siempre/i);
    }
  });

  it('speaks Spanish on the bilingual course', () => {
    const html = render(spanish, 'es');
    expect(html).toContain('Mensual');
    expect(html).toContain('Anual');
    expect(html).toContain('Términos');
    expect(html).toContain(STRINGS.es['unlock.fine'].slice(0, 30));
  });
});

describe('course copy', () => {
  it('has no one-time wording or bundle in any course text about buying', async () => {
    const courses = await Promise.all(['bash', 'python', 'javascript', 'typescript', 'tech-spanish']
      .map((id) => import(`../courses/${id}/index.js`).then((m) => m.default)));
    for (const course of courses) {
      for (const lang of ['en', 'es']) {
        const c = localize(course, lang);
        const selling = JSON.stringify({ lede: c.pricingLede, labels: c.labels });
        expect(selling).not.toMatch(/Developer Path|one[- ]time|pay once|keep it|\byours\b|pago único|es tuyo|son tuyos/i);
        // The FAQ may mention earlier one-time purchases (they stay unlocked), never sell one
        expect(JSON.stringify(c.faq)).not.toMatch(/Developer Path|pay once|keep it|\byours\b|es tuyo|son tuyos/i);
      }
      expect(course.price).toBeUndefined(); // prices come from services/prices.js
    }
  });
});
