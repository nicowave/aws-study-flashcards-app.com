import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestBanner, GuestUpsell } from './GuestPrompts';
import { PROMOTIONS } from '../services/offers';
import { PRODUCT_PRICES } from '../services/prices';

// The build variable behind billing, switched per test. Prices come from the shared prices module.
const billing = vi.hoisted(() => ({ enabled: true }));
vi.mock('../services/billing', () => ({
  startCheckout: vi.fn(),
  get BILLING_ENABLED() { return billing.enabled; },
}));

const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(time);
};
const discounted = (price, percent) => {
  const cents = Math.round(Number(price.replace('$', '')) * 100);
  return `$${((cents - Math.round((cents * percent) / 100)) / 100).toFixed(2)}`;
};

const { month, year } = PRODUCT_PRICES;
const normal = `${month}/month or ${year}/year`;

const bullets = ['Timed mock exam', 'Readiness breakdown', 'Every quiz domain'];
const renderUpsell = (overrides = {}) => {
  const props = { feature: 'The Practice Feature', bullets, onSignUp: vi.fn(), onBack: vi.fn(), ...overrides };
  render(<GuestUpsell {...props} />);
  return props;
};

beforeEach(() => {
  billing.enabled = true;
  at(promo.end + MINUTE); // no sale unless a test sets one
});

describe('GuestBanner', () => {
  it('tells guests what is free and signs them up from the button', async () => {
    const onSignUp = vi.fn();
    render(<GuestBanner onSignUp={onSignUp} />);
    expect(screen.getByText(/previewing as a guest/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /create free account/i }));
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });
});

describe('GuestUpsell', () => {
  it('lists every bullet it is given, in order', () => {
    renderUpsell();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(bullets);
  });

  it('renders an empty list when there are no bullets', () => {
    renderUpsell({ bullets: [] });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('Create Free Account calls onSignUp and Back to Menu calls onBack', async () => {
    const props = renderUpsell();
    await userEvent.click(screen.getByRole('button', { name: /create free account/i }));
    expect(props.onSignUp).toHaveBeenCalledTimes(1);
    expect(props.onBack).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /back to menu/i }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(props.onSignUp).toHaveBeenCalledTimes(1);
  });

  describe('with billing on', () => {
    it('offers to unlock the feature and names the monthly and yearly price', () => {
      const { feature } = renderUpsell();
      expect(screen.getByRole('heading', { name: `Unlock ${feature}` })).toBeInTheDocument();
      const note = screen.getByText(/no card needed/i);
      expect(note).toHaveTextContent(`subscription to this certification (${normal}, cancel anytime) or with Pro`);
      expect(note).not.toHaveTextContent(/one-time|lifetime/i);
    });

    it('quotes the first payment at the sale price, and the normal price, while a sale runs', () => {
      at(promo.start + MINUTE);
      renderUpsell();
      const sale = `${discounted(month, promo.single)}/month or ${discounted(year, promo.single)}/year`;
      expect(screen.getByText(/no card needed/i)).toHaveTextContent(
        `(${sale} for the first payment during the ${promo.label}, normally ${normal}, cancel anytime)`,
      );
    });

    it('quotes the normal price while the sale is only teased', () => {
      at(promo.teaseFrom + MINUTE);
      renderUpsell();
      const note = screen.getByText(/no card needed/i);
      expect(note).toHaveTextContent(`(${normal}, cancel anytime)`);
      expect(note).not.toHaveTextContent(promo.label);
    });
  });

  describe('with billing off', () => {
    beforeEach(() => { billing.enabled = false; });

    it('says the feature is free with an account and mentions no price', () => {
      const { feature } = renderUpsell();
      expect(screen.getByRole('heading', { name: `${feature} is free with an account` })).toBeInTheDocument();
      expect(screen.getByText(/creating an account is free/i)).toBeInTheDocument();
      expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
      expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
    });

    it('mentions no sale even while one runs', () => {
      at(promo.start + MINUTE);
      renderUpsell();
      expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
      expect(screen.queryByText(promo.label, { exact: false })).not.toBeInTheDocument();
    });
  });
});
