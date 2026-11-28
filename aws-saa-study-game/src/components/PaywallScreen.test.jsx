import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaywallScreen from './PaywallScreen';
import { startCheckout } from '../services/billing';
import { PROMOTIONS, currentPromotion } from '../services/offers';
import { PRODUCT_PRICES, PRO_YEARLY, PRO_TRIAL_DAYS, YEARLY_SAVINGS_PERCENT } from '../services/prices';

// Billing is the money boundary: never reach Stripe. Prices come from the shared prices module,
// the same in every game, so this file works in all four.
vi.mock('../services/billing', () => ({
  startCheckout: vi.fn(),
  BILLING_ENABLED: true,
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
const proButton = () => screen.getByRole('button', { name: /get pro/i });
const backButton = () => screen.getByRole('button', { name: /back to menu/i });
const monthly = () => screen.getByRole('radio', { name: /monthly/i });
const yearly = () => screen.getByRole('radio', { name: /yearly/i });
const proBox = (container) => container.querySelector('.paywall-pro');
// The certification's price block (the first one; Pro has its own inside .paywall-pro)
const certPrice = (container) => container.querySelector('.paywall-screen > .paywall-price');

beforeEach(() => {
  vi.mocked(startCheckout).mockReset();
  props.onBack = vi.fn();
  at(promo.end + MINUTE); // outside any sale unless a test says otherwise
});

describe('PaywallScreen', () => {
  it('names the certification and lists what the subscription includes', () => {
    render(<PaywallScreen {...props} />);
    expect(screen.getByText(props.certName)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /free quiz is complete/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toContainEqual(expect.stringMatching(/monthly or yearly, cancel anytime/i));
  });

  it('never sells a one-time or lifetime unlock', () => {
    const { container } = render(<PaywallScreen {...props} />);
    expect(container).not.toHaveTextContent(/one-time|lifetime|pay once|yours forever/i);
  });

  describe('monthly or yearly', () => {
    it('starts on yearly and shows the yearly price with the computed saving', () => {
      const { container } = render(<PaywallScreen {...props} />);
      expect(yearly()).toBeChecked();
      expect(monthly()).not.toBeChecked();
      expect(certPrice(container)).toHaveTextContent(PRODUCT_PRICES.year);
      expect(certPrice(container)).toHaveTextContent(/per year/i);
      expect(screen.getByText(`save ${YEARLY_SAVINGS_PERCENT}%`)).toBeInTheDocument();
    });

    it('the saving is yearly against twelve monthly payments', () => {
      const n = (p) => Number(p.replace('$', ''));
      const expected = Math.round((1 - n(PRODUCT_PRICES.year) / (12 * n(PRODUCT_PRICES.month))) * 100);
      expect(YEARLY_SAVINGS_PERCENT).toBe(expected);
      expect(YEARLY_SAVINGS_PERCENT).toBeGreaterThan(0);
    });

    it('switches to the monthly price', async () => {
      const { container } = render(<PaywallScreen {...props} />);
      await userEvent.click(monthly());
      expect(monthly()).toBeChecked();
      expect(certPrice(container)).toHaveTextContent(PRODUCT_PRICES.month);
      expect(certPrice(container)).toHaveTextContent(/per month/i);
      expect(certPrice(container)).not.toHaveTextContent(PRODUCT_PRICES.year);
    });
  });

  describe('Pro', () => {
    it('offers Pro yearly, covering every certification and the coding courses, with the free trial', () => {
      const { container } = render(<PaywallScreen {...props} />);
      const pro = proBox(container);
      expect(pro).toHaveTextContent(PRO_YEARLY);
      expect(pro).toHaveTextContent(/per year/i);
      expect(pro).toHaveTextContent(/every certification/i);
      expect(pro).toHaveTextContent(/coding courses/i);
      expect(pro).toHaveTextContent(`${PRO_TRIAL_DAYS}-day free trial`);
      expect(pro).not.toHaveTextContent(/per month/i);
    });

    it('starts a yearly Pro checkout, whatever the toggle says', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      await userEvent.click(monthly());
      await userEvent.click(proButton());
      expect(startCheckout).toHaveBeenCalledTimes(1);
      expect(startCheckout).toHaveBeenCalledWith('all-access', 'year');
    });
  });

  describe('price during a sale', () => {
    it('shows full prices, with no strike-through, outside a sale', () => {
      expect(currentPromotion()).toBeNull();
      const { container } = render(<PaywallScreen {...props} />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(promo.label, { exact: false })).not.toBeInTheDocument();
    });

    it('shows the first payment at the sale price and strikes through the normal one', async () => {
      at(promo.start + MINUTE);
      const { container } = render(<PaywallScreen {...props} />);
      const cert = certPrice(container);
      expect(cert).toHaveTextContent(discounted(PRODUCT_PRICES.year, promo.single));
      expect(cert.querySelector('s')).toHaveTextContent(PRODUCT_PRICES.year);
      expect(cert).toHaveTextContent(new RegExp(`first year: ${promo.label}, until ${promo.ends}`));

      const pro = proBox(container);
      expect(pro).toHaveTextContent(discounted(PRO_YEARLY, promo.pro));
      expect(pro.querySelector('s')).toHaveTextContent(PRO_YEARLY);

      await userEvent.click(monthly());
      expect(certPrice(container)).toHaveTextContent(discounted(PRODUCT_PRICES.month, promo.single));
      expect(certPrice(container)).toHaveTextContent(/first month/i);
    });

    it('still charges full price while the sale is only being teased', () => {
      at(promo.teaseFrom + MINUTE);
      const { container } = render(<PaywallScreen {...props} />);
      expect(container.querySelector('s')).toBeNull();
      expect(screen.queryByText(discounted(PRODUCT_PRICES.year, promo.single))).not.toBeInTheDocument();
    });

    it('goes back to full price the moment the sale ends', () => {
      at(promo.end);
      const { container } = render(<PaywallScreen {...props} />);
      expect(container.querySelector('s')).toBeNull();
      expect(certPrice(container)).toHaveTextContent(PRODUCT_PRICES.year);
    });
  });

  describe('checkout', () => {
    it('starts a yearly checkout for this certification by default', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {})); // redirecting
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());
      expect(startCheckout).toHaveBeenCalledTimes(1);
      expect(startCheckout).toHaveBeenCalledWith(props.certId, 'year');
      expect(props.onBack).not.toHaveBeenCalled();
    });

    it('starts a monthly checkout when monthly is picked', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      await userEvent.click(monthly());
      await userEvent.click(unlockButton());
      expect(startCheckout).toHaveBeenCalledWith(props.certId, 'month');
    });

    it('shows a loading state and locks every button while redirecting', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());
      const busy = screen.getByRole('button', { name: /redirecting to secure checkout/i });
      expect(busy).toBeDisabled();
      expect(proButton()).toBeDisabled();
      expect(backButton()).toBeDisabled();
      expect(monthly()).toBeDisabled();
    });

    it('does not start a second checkout on a double click', async () => {
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<PaywallScreen {...props} />);
      const button = unlockButton();
      await userEvent.dblClick(button);
      await userEvent.click(button);
      await userEvent.click(proButton());
      expect(startCheckout).toHaveBeenCalledTimes(1);
    });

    it('shows an error and lets the learner try again when checkout fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(startCheckout).mockRejectedValueOnce(new Error('network down'));
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());

      expect(await screen.findByText(/could not start checkout/i)).toBeInTheDocument();
      expect(unlockButton()).toBeEnabled();
      expect(proButton()).toBeEnabled();
      expect(backButton()).toBeEnabled();

      // retry clears the old error
      vi.mocked(startCheckout).mockReturnValueOnce(new Promise(() => {}));
      await userEvent.click(unlockButton());
      expect(startCheckout).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/could not start checkout/i)).not.toBeInTheDocument();
    });

    it('explains when the subscription is on the learner\'s other sign-in, or purchases are not open yet', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(startCheckout).mockRejectedValueOnce(
        new Error('This subscription is already on for this email under your other sign-in. Sign out, then sign in the other way, for example with Google.')
      );
      render(<PaywallScreen {...props} />);
      await userEvent.click(unlockButton());
      expect(await screen.findByText(/already on for your email under your other sign-in/i)).toBeInTheDocument();
      expect(screen.queryByText(/could not start checkout/i)).not.toBeInTheDocument();

      vi.mocked(startCheckout).mockRejectedValueOnce(new Error('Plan not available: test-cert (year)'));
      await userEvent.click(unlockButton());
      expect(await screen.findByText(/purchases open very soon/i)).toBeInTheDocument();
    });

    it('Back to Menu calls onBack without starting checkout', async () => {
      render(<PaywallScreen {...props} />);
      await userEvent.click(backButton());
      expect(props.onBack).toHaveBeenCalledTimes(1);
      expect(startCheckout).not.toHaveBeenCalled();
    });
  });

  it('says subscriptions renew automatically and where to cancel', () => {
    const { container } = render(<PaywallScreen {...props} />);
    const fine = container.querySelector('.paywall-fine-print');
    expect(fine).toHaveTextContent(/renew automatically/i);
    expect(fine).toHaveTextContent(/cancel anytime in manage billing/i);
  });

  it('links Terms and Privacy on the name the page was opened on, in a new tab', () => {
    const { container } = render(<PaywallScreen {...props} />);
    const fine = container.querySelector('.paywall-fine-print');
    for (const [name, page] of [['Terms', 'terms.html'], ['Privacy', 'privacy.html']]) {
      const link = within(fine).getByRole('link', { name });
      expect(link).toHaveAttribute('href', `https://levelupstudyhub.com/${page}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });
});
