import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromoBanner, { certSale } from './PromoBanner';
import { PROMOTIONS } from '../services/offers';

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
    expect(banner()).toHaveTextContent(`${promo.single}% off this certification`);
    expect(banner()).toHaveTextContent(`${promo.bundle}% off Pro`);
    expect(banner()).not.toHaveTextContent(/applied at checkout/i);
  });

  it.each([
    ['from the first moment of the sale', () => promo.start],
    ['in the middle of it', () => (promo.start + promo.end) / 2],
    ['until its last moment', () => promo.end - 1],
  ])('shows the running sale %s', (_, time) => {
    at(time());
    render(<PromoBanner />);
    expect(banner()).toHaveTextContent(`${promo.label}: ${promo.single}% off this certification`);
    expect(banner()).toHaveTextContent(`${promo.bundle}% off Pro, until ${promo.ends}`);
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

describe('certSale', () => {
  it('is null outside a sale', () => {
    at(promo.end + MINUTE);
    expect(certSale('$19.99 one-time')).toBeNull();
    at(promo.teaseFrom - MINUTE);
    expect(certSale('$19.99 one-time')).toBeNull();
  });

  it('is null while the sale is only teased (no discount at checkout yet)', () => {
    at(promo.teaseFrom + MINUTE);
    expect(certSale('$19.99 one-time')).toBeNull();
  });

  it('gives the promotion, the normal price and the sale price while the sale runs', () => {
    at(promo.start + MINUTE);
    expect(certSale('$19.99 one-time')).toEqual({
      promo,
      price: '$19.99',
      salePrice: discounted('$19.99', promo.single),
    });
  });

  it.each(['$9.99 one-time', '$14.99', '$29.99 lifetime', '$20 one-time', '$0.99'])(
    'rounds the sale price of %s to the cent, below the normal price',
    (label) => {
      at(promo.start + MINUTE);
      const price = label.match(/\$[\d.]+/)[0];
      const sale = certSale(label);
      expect(sale.price).toBe(price);
      expect(sale.salePrice).toBe(discounted(price, promo.single));
      expect(sale.salePrice).toMatch(/^\$\d+\.\d{2}$/);
      expect(Number(sale.salePrice.slice(1))).toBeLessThan(Number(price.slice(1)));
    },
  );

  it('uses the first dollar amount in the label', () => {
    at(promo.start + MINUTE);
    expect(certSale('$19.99 now, was $29.99').price).toBe('$19.99');
  });

  it('is null during a sale when the label has no dollar amount', () => {
    at(promo.start + MINUTE);
    expect(certSale('one-time purchase')).toBeNull();
    expect(certSale('')).toBeNull();
  });
});
