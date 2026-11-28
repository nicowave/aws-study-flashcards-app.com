import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingSettings from './BillingSettings';
import { hasPaidPlan, getBillingAccountStatus, openBillingPortal } from '../services/billing';

// Billing is the money boundary: never reach Stripe. BILLING_ENABLED is switched per test.
// portalErrorMessage is the real one: which words reach the member is what these tests check
const billing = vi.hoisted(() => ({ enabled: true }));
vi.mock('../services/billing', async (importOriginal) => ({
  get BILLING_ENABLED() { return billing.enabled; },
  hasPaidPlan: vi.fn(),
  getBillingAccountStatus: vi.fn(),
  openBillingPortal: vi.fn(),
  portalErrorMessage: (await importOriginal()).portalErrorMessage,
}));

vi.mock('../config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com'),
}));

const manageButton = () => screen.findByRole('button', { name: /manage billing/i });

beforeEach(() => {
  billing.enabled = true;
  vi.mocked(hasPaidPlan).mockReset().mockResolvedValue(true);
  vi.mocked(getBillingAccountStatus).mockReset().mockResolvedValue(true); // bought through Stripe unless a test says otherwise
  vi.mocked(openBillingPortal).mockReset();
});

describe('BillingSettings', () => {
  it('offers Manage billing to anyone who has paid, says it renews and links the Terms', async () => {
    render(<BillingSettings />);
    expect(await manageButton()).toBeEnabled();
    expect(screen.getByRole('heading', { name: /plan & billing/i })).toBeInTheDocument();
    expect(screen.getByText(/renew automatically until you cancel/i)).toBeInTheDocument();
    const terms = screen.getByRole('link', { name: 'Terms' });
    expect(terms).toHaveAttribute('href', 'https://levelupstudyhub.com/terms.html');
    expect(terms).toHaveAttribute('target', '_blank');
  });

  it('opens the billing portal, and locks the button while it opens', async () => {
    vi.mocked(openBillingPortal).mockReturnValue(new Promise(() => {})); // redirecting
    render(<BillingSettings />);
    await userEvent.click(await manageButton());
    expect(openBillingPortal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /opening billing/i })).toBeDisabled();
  });

  it('shows an error and lets the member try again when the portal fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(openBillingPortal).mockRejectedValueOnce(new Error('network down'));
    render(<BillingSettings />);
    await userEvent.click(await manageButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not open billing/i);
    expect(await manageButton()).toBeEnabled();
  });

  it("shows the server's reason when it refuses to open the portal on purpose", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(openBillingPortal).mockRejectedValueOnce(
      Object.assign(new Error('This account has no billing to manage.'), { code: 'FAILED_PRECONDITION' }),
    );
    render(<BillingSettings />);
    await userEvent.click(await manageButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('This account has no billing to manage.');
  });

  it('access given by hand (no Stripe customer): says there is no billing to manage, and no button that can only fail', async () => {
    vi.mocked(getBillingAccountStatus).mockResolvedValue(false);
    render(<BillingSettings />);
    expect(await screen.findByText(/no billing to manage/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manage billing/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /plan & billing/i })).toBeInTheDocument();
  });

  it('keeps the button when it cannot tell whether billing is behind the account', async () => {
    vi.mocked(getBillingAccountStatus).mockResolvedValue(null);
    render(<BillingSettings />);
    await vi.waitFor(() => expect(getBillingAccountStatus).toHaveBeenCalledTimes(1));
    expect(await manageButton()).toBeEnabled();
    expect(screen.queryByText(/no billing to manage/i)).not.toBeInTheDocument();
  });

  it('shows nothing for an account that has never paid', async () => {
    vi.mocked(hasPaidPlan).mockResolvedValue(false);
    const { container } = render(<BillingSettings />);
    await vi.waitFor(() => expect(hasPaidPlan).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(getBillingAccountStatus).not.toHaveBeenCalled();
  });

  it('shows nothing and asks nothing while billing is off', () => {
    billing.enabled = false;
    const { container } = render(<BillingSettings />);
    expect(container).toBeEmptyDOMElement();
    expect(hasPaidPlan).not.toHaveBeenCalled();
  });
});
