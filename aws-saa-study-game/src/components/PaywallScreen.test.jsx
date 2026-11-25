import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaywallScreen from './PaywallScreen';
import { startCheckout } from '../services/billing';
import { PROMOTIONS, currentPromotion } from '../services/offers';

// Billing is the money boundary: never reach Stripe. The label is a fixture,
// not any app's real price, so the same file works in every game.
const billing = vi.hoisted(() => ({ label: '$19.99 one-time' }));
vi.mock('../services/billing', () => ({
  startCheckout: vi.fn(),
  BILLING_ENABLED: true,
  get CERT_PRICE_LABEL() { return billing.label; },
}));

// Pretend the page was opened on the new name, so we can see links go through onThisName.
vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com'),
}));

const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] }); // only the clock; userEvent still needs real timers
  vi.setSystemTime(time);
};

// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const discounted = (price, percent) => {
  const cents = Math.round(Number(price.replace('$', '')) * 100);
  return `$${((cents - Math.round((cents * percent) / 100)) / 100).toFixed(2)}`;
};

const props = { certId: 'test-cert', certName: 'Test Certification', onBack: vi.fn() };
const unlockButton = () => screen.getByRole('button', { name: /unlock/i });

beforeEach(() => {
  billing.label = '$19.99 one-time';
  vi.mocked(startCheckout).mockReset();
  props.onBack = vi.fn();
  at(promo.end + MINUTE); // outside any sale unless a test says otherwise
});

describe('PaywallScreen', () => {
  it('names the certification and lists what the unlock includes', () => {
    render(<PaywallScreen {...props} />);
    expect(screen.getByText(props.certName)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /free quiz is complete/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.getByText(/one-time payment/i)).toBeInTheDocument();
  });

  describe('price', () => {
    it('shows the full price label, with no strike-through, outside a sale', () => {
      expect(currentPromotion()).toBeNull();
      const { container } = render(<PaywallScreen {...props} />);
      expect(screen.getByText(billing.label)).toBeInTheDocument();
      expect(screen.getByText(/for this certification/i)).toBeInTheDocument();
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(promo.label, { exact: false })).not.toBeInTheDocument();
    });

    it('shows the sale price and strikes through the normal price while a sale runs', () => {
      at(promo.start + MINUTE);
      const { container } = render(<PaywallScreen {...props} />);
      expect(screen.getByText(discounted('$19.99', promo.single))).toBeInTheDocument();
      const was = container.querySelector('s');
      expect(was).toHaveTextContent('$19.99');
      expect(screen.getByText(new RegExp(`${promo.label}, until ${promo.ends}`))).toBeInTheDocument();
      // the full label is replaced, not shown next to the sale price
      expect(screen.queryByText(billing.label)).not.toBeInTheDocument();
    });

    it('still charges full price while the sale is only being teased', () => {
      at(promo.teaseFrom + MINUTE);
      const { container } = render(<PaywallScreen {...props} />);
      expect(screen.getByText(billing.label)).toBeInTheDocument();
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(discounted('$19.99', promo.single))).not.toBeInTheDocument();
    });

    it('goes back to full price the moment the sale ends', () => {
      at(promo.end);
      const { container } = render(<PaywallScreen {...props} />);
      expect(screen.getByText(billing.label)).toBeInTheDocument();
      expect(container.querySelector('s')).toBeNull();
    });

    it('shows the label as is during a sale when it has no dollar amount (unset build variable)', () => {
      billing.label = 'one-time purchase';
      at(promo.start + MINUTE);
      const { container } = render(<PaywallScreen {...props} />);
      expect(screen.getByText('one-time purchase')).toBeInTheDocument();
      expect(container.querySelector('s')).toBeNull();
    });
  });

  describe('checkout', () => {
    it('starts checkout for this certification when Unlock is clicked', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {})); // redirecting
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());
      expect(startCheckout).toHaveBeenCalledTimes(1);
      expect(startCheckout).toHaveBeenCalledWith(props.certId);
      expect(props.onBack).not.toHaveBeenCalled();
    });

    it('shows a loading state and locks both buttons while redirecting', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());
      const busy = screen.getByRole('button', { name: /redirecting to secure checkout/i });
      expect(busy).toBeDisabled();
      expect(screen.getByRole('button', { name: /back to menu/i })).toBeDisabled();
    });

    it('does not start a second checkout on a double click', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      const button = unlockButton();
      await userEvent.dblClick(button);
      await userEvent.click(button);
      expect(startCheckout).toHaveBeenCalledTimes(1);
    });

    it('shows an error and lets the learner try again when checkout fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(startCheckout).mockRejectedValueOnce(new Error('network down'));
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());

      expect(await screen.findByText(/could not start checkout/i)).toBeInTheDocument();
      expect(unlockButton()).toBeEnabled();
      expect(screen.getByRole('button', { name: /back to menu/i })).toBeEnabled();

      // retry clears the old error
      vi.mocked(startCheckout).mockReturnValueOnce(new Promise(() => {}));
      await userEvent.click(unlockButton());
      expect(startCheckout).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/could not start checkout/i)).not.toBeInTheDocument();
    });

    it('Back to Menu calls onBack without starting checkout', async () => {
      render(<PaywallScreen {...props} />);
      await userEvent.click(screen.getByRole('button', { name: /back to menu/i }));
      expect(props.onBack).toHaveBeenCalledTimes(1);
      expect(startCheckout).not.toHaveBeenCalled();
    });
  });

  it('links Terms and Privacy on the name the page was opened on, in a new tab', () => {
    render(<PaywallScreen {...props} />);
    for (const [name, page] of [['Terms', 'terms.html'], ['Privacy', 'privacy.html']]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', `https://levelupstudyhub.com/${page}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });
});
