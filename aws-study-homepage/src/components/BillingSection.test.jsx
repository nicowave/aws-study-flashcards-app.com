import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingSection from './BillingSection';
import { getEntitlements, openBillingPortal } from '../services/billing';
import { certifications } from '../data/certifications';
import { COURSES } from '../data/courses';

// The token claims and Stripe are the boundary: never reach Cognito or the API from a test
vi.mock('../services/billing', () => ({ getEntitlements: vi.fn(), openBillingPortal: vi.fn() }));

const cert = certifications.find((c) => c.status === 'available');
const course = COURSES[0];
const certLabel = cert.name.replace(/^AWS Certified /, '');

const show = async (entitlements, onSeePlans = vi.fn()) => {
  vi.mocked(getEntitlements).mockResolvedValue(entitlements);
  render(<BillingSection onSeePlans={onSeePlans} />);
  await screen.findByText(entitlements ? /Your plan:/ : /couldn't read your plan/i);
  return onSeePlans;
};
const manage = () => screen.queryByRole('button', { name: /manage billing|opening/i });
const seePlans = () => screen.queryByRole('button', { name: 'See plans' });

describe('BillingSection (hub Settings)', () => {
  beforeEach(() => {
    vi.mocked(getEntitlements).mockReset();
    vi.mocked(openBillingPortal).mockReset();
  });

  it('says it is checking while the plan loads', () => {
    vi.mocked(getEntitlements).mockReturnValue(new Promise(() => {}));
    render(<BillingSection onSeePlans={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /plan & billing/i })).toBeInTheDocument();
    expect(screen.getByText(/checking your plan/i)).toBeInTheDocument();
  });

  it('free account: says Free, offers the plans and no billing portal (there is nothing to bill)', async () => {
    const onSeePlans = await show({ plan: null, certs: [] });
    expect(screen.getByText(/Your plan:/)).toHaveTextContent('Your plan: Free');
    expect(manage()).not.toBeInTheDocument();
    await userEvent.click(seePlans());
    expect(onSeePlans).toHaveBeenCalledTimes(1);
  });

  it('Pro member: says Pro, opens the billing portal, and does not sell plans again', async () => {
    await show({ plan: 'pro', certs: [] });
    expect(screen.getByText(/Your plan:/)).toHaveTextContent('Pro (all access)');
    expect(seePlans()).not.toBeInTheDocument();
    expect(screen.getByText(/billing portal/i)).toHaveTextContent(/cancelling/);
    await userEvent.click(manage());
    expect(openBillingPortal).toHaveBeenCalledTimes(1);
  });

  it('one-time unlocks: lists each by its name, with the portal for receipts and the plans to upgrade', async () => {
    await show({ plan: null, certs: [cert.id, `${course.id}-for-aws`, 'something-new'] });
    const list = screen.getByRole('list', { name: /unlocked/i });
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual([certLabel, course.title, 'something-new']);
    expect(manage()).toBeInTheDocument();
    expect(seePlans()).toBeInTheDocument();
    // Only Pro is a subscription, so only Pro is told about cancelling
    expect(screen.getByText(/billing portal/i)).not.toHaveTextContent(/cancelling/);
  });

  it('shows a busy button while the portal opens, and sends only once', async () => {
    let fail;
    vi.mocked(openBillingPortal).mockReturnValue(new Promise((_, reject) => { fail = reject; }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    await show({ plan: 'pro', certs: [] });
    await user.click(manage());
    expect(manage()).toBeDisabled();
    expect(manage()).toHaveTextContent('Opening…');
    await user.click(manage());
    expect(openBillingPortal).toHaveBeenCalledTimes(1);

    await act(async () => fail(new Error('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent(/could not open the billing portal/i);
    expect(manage()).toBeEnabled();
    expect(manage()).toHaveTextContent('Manage billing');
  });

  it('a retry clears the old error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(openBillingPortal).mockRejectedValueOnce(new Error('offline')).mockReturnValueOnce(new Promise(() => {}));
    const user = userEvent.setup();
    await show({ plan: 'pro', certs: [] });
    await user.click(manage());
    await screen.findByRole('alert');
    await user.click(manage());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("when the plan can't be read, says so and offers no buttons", async () => {
    await show(null);
    expect(manage()).not.toBeInTheDocument();
    expect(seePlans()).not.toBeInTheDocument();
  });
});
