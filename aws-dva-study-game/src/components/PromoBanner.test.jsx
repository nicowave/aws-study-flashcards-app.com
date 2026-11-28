import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromoBanner, { saleFor } from './PromoBanner';
import { PROMOTIONS } from '../services/offers';
import { PRODUCT_PRICES, PRO_YEARLY } from '../services/prices';

// The real sale windows from offers.js are exercised; only the clock is faked.
const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(time);
};
// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const discounted = (price, percent) => {
  const cents = Math.round(Number(price.replace('$', '')) * 100);
  return `$${((cents - Math.round((cents * percent) / 100)) / 100).toFixed(2)}`;
};

const banner = () => screen.queryByRole('note');

describe('PromoBanner', () => {
  it('is hidden before the sale is teased', () => {
    at(promo.teaseFrom - MINUTE);
    const { container } = render(<PromoBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['from the first moment of the teaser', () => promo.teaseFrom],
    ['until just before the sale starts', () => promo.start - 1],
  ])('announces the coming sale %s', (_, time) => {
    at(time());
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label} starts ${promo.starts}`);
    expect(banner()).toHaveTextContent(`${promo.single}% off your first month or year of this certification`);
    expect(banner()).toHaveTextContent(`${promo.pro}% off your first year of Pro`);
    expect(banner()).not.toHaveTextContent(/applied at checkout/i);
  });

  it.each([
    ['from the first moment of the sale', () => promo.start],
    ['in the middle of it', () => (promo.start + promo.end) / 2],
    ['until its last moment', () => promo.end - 1],
  ])('shows the running sale %s', (_, time) => {
    at(time());
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label}: ${promo.single}% off your first month or year of this certification`);
    expect(banner()).toHaveTextContent(`${promo.pro}% off your first year of Pro, until ${promo.ends}`);
    expect(banner()).toHaveTextContent(/applied at checkout/i);
    expect(banner()).not.toHaveTextContent(/starts/i);
  });

  it.each([
    ['the moment the sale ends', () => promo.end],
    ['after it', () => promo.end + 30 * 24 * 60 * MINUTE],
  ])('is hidden %s', (_, time) => {
    at(time());
    const { container } = render(<PromoBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('can be previewed in dev builds with ?promo=on and ?promo=soon', () => {
    if (!import.meta.env.DEV) return; // the preview only exists in dev builds
    at(promo.end + MINUTE);
    const before = window.location.href;
    try {
      window.history.replaceState(null, '', '/?promo=on');
      const { unmount } = render(<PromoBanner />);
      expect(banner()).toHaveTextContent(/applied at checkout/i);
      unmount();
      window.history.replaceState(null, '', '/?promo=soon');
      render(<PromoBanner />);
      expect(banner()).toHaveTextContent(`starts ${promo.starts}`);
    } finally {
      window.history.replaceState(null, '', before);
    }
  });
});

describe('saleFor', () => {
  it('is null outside a sale', () => {
    at(promo.end + MINUTE);
    expect(saleFor(PRODUCT_PRICES.month)).toBeNull();
    at(promo.teaseFrom - MINUTE);
    expect(saleFor(PRODUCT_PRICES.month)).toBeNull();
  });

  it('is null while the sale is only teased (no discount at checkout yet)', () => {
    at(promo.teaseFrom + MINUTE);
    expect(saleFor(PRODUCT_PRICES.year)).toBeNull();
    expect(saleFor(PRO_YEARLY, 'pro')).toBeNull();
  });

  it('gives the promotion, the normal price and the sale price while the sale runs', () => {
    at(promo.start + MINUTE);
    for (const price of Object.values(PRODUCT_PRICES)) {
      expect(saleFor(price)).toEqual({ promo, price, salePrice: discounted(price, promo.single) });
    }
  });

  it("uses the Pro discount for Pro", () => {
    at(promo.start + MINUTE);
    expect(saleFor(PRO_YEARLY, 'pro')).toEqual({
      promo,
      price: PRO_YEARLY,
      salePrice: discounted(PRO_YEARLY, promo.pro),
    });
  });

  it.each(['$11', '$69', '$199', '$9.99', '$0.99'])(
    'rounds the sale price of %s to the cent, below the normal price',
    (price) => {
      at(promo.start + MINUTE);
      const sale = saleFor(price);
      expect(sale.price).toBe(price);
      expect(sale.salePrice).toBe(discounted(price, promo.single));
      expect(sale.salePrice).toMatch(/^\$\d+\.\d{2}$/);
      expect(Number(sale.salePrice.slice(1))).toBeLessThan(Number(price.slice(1)));
    },
  );

  it('is null during a sale for a price with no dollar amount, or a kind the sale does not cover', () => {
    at(promo.start + MINUTE);
    expect(saleFor('')).toBeNull();
    expect(saleFor(undefined)).toBeNull();
    expect(saleFor(PRODUCT_PRICES.month, 'nothing')).toBeNull();
  });
});
