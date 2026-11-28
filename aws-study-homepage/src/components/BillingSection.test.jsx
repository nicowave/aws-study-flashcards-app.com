import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingSection from './BillingSection';
import { getBillingSummary, openBillingPortal } from '../services/billing';
import { certifications } from '../data/certifications';
import { COURSES, OTHER_COURSES } from '../data/courses';

// The token claims, the API and Stripe are the boundary: never reach Cognito or the API from a test
vi.mock('../services/billing', () => ({ getBillingSummary: vi.fn(), openBillingPortal: vi.fn() }));

const [cert, otherCert] = certifications.filter((c) => c.status === 'available');
const course = COURSES[0];
const label = (c) => c.name.replace(/^AWS Certified /, '');
// Every product id Pro's token lists
const ALL_PRODUCTS = [
  ...certifications.filter((c) => c.status === 'available').map((c) => c.id),
  ...COURSES.map((c) => `${c.id}-for-aws`),
  ...OTHER_COURSES.map((c) => c.plan),
];

const sub = (plan, over = {}) => ({
  plan, interval: 'month', status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: '2027-01-15T12:00:00.000Z', ...over,
});

const show = async (summary, onSeePlans = vi.fn()) => {
  vi.mocked(getBillingSummary).mockResolvedValue(summary);
  render(<BillingSection onSeePlans={onSeePlans} />);
  await screen.findByText(summary ? /Your plan:/ : /couldn't read your plan/i);
  return onSeePlans;
};
const list = (name) => screen.queryByRole('list', { name });
const items = (name) => within(list(name)).getAllByRole('listitem').map((li) => li.textContent);
const manage = () => screen.queryByRole('button', { name: /manage billing|opening/i });
const seePlans = () => screen.queryByRole('button', { name: 'See plans' });
const note = () => screen.getByText(/billing portal/i);

describe('BillingSection (hub Settings)', () => {
  beforeEach(() => {
    vi.mocked(getBillingSummary).mockReset();
    vi.mocked(openBillingPortal).mockReset();
  });

  it('says it is checking while the plan loads', () => {
    vi.mocked(getBillingSummary).mockReturnValue(new Promise(() => {}));
    render(<BillingSection onSeePlans={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /plan & billing/i })).toBeInTheDocument();
    expect(screen.getByText(/checking your plan/i)).toBeInTheDocument();
  });

  it('free account: says Free, offers the plans and no billing portal (there is nothing to bill)', async () => {
    const onSeePlans = await show({ plan: null, certs: [], owned: [], subscriptions: [] });
    expect(screen.getByText(/Your plan:/)).toHaveTextContent('Your plan: Free');
    expect(manage()).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await userEvent.click(seePlans());
    expect(onSeePlans).toHaveBeenCalledTimes(1);
  });

  it('subscriber: lists each subscription with monthly or yearly and when it renews, and can cancel in the portal', async () => {
    await show({
      plan: null,
      certs: [cert.id, `${course.id}-for-aws`],
      owned: [cert.id, `${course.id}-for-aws`],
      subscriptions: [sub(cert.id), sub(`${course.id}-for-aws`, { interval: 'year' })],
    });
    expect(items('Subscriptions')).toEqual([
      `${label(cert)} (Monthly, renews January 15, 2027)`,
      `${course.title} (Yearly, renews January 15, 2027)`,
    ]);
    // A subscription is not a lifetime purchase
    expect(list('Purchased (lifetime access)')).not.toBeInTheDocument();
    expect(manage()).toBeInTheDocument();
    expect(seePlans()).toBeInTheDocument();
    expect(note()).toHaveTextContent(/cancelling/);
  });

  it('says when a subscription is cancelled, in its free trial, or behind on payment', async () => {
    await show({
      plan: null,
      certs: [cert.id, otherCert.id, course.id],
      owned: [cert.id, otherCert.id],
      subscriptions: [
        sub(cert.id, { cancelAtPeriodEnd: true }),
        sub(otherCert.id, { status: 'past_due', interval: 'year' }),
        sub(`${course.id}-for-aws`, { status: 'trialing', currentPeriodEnd: null }),
      ],
    });
    expect(items('Subscriptions')).toEqual([
      `${label(cert)} (Monthly, cancelled, access until January 15, 2027)`,
      `${label(otherCert)} (Yearly, payment failed: update your card in Manage billing)`,
      `${course.title} (Monthly, free trial)`,
    ]);
  });

  it('earlier one-time purchases: listed as "Purchased (lifetime access)", apart from subscriptions', async () => {
    await show({
      plan: null,
      certs: [cert.id, otherCert.id, OTHER_COURSES[0].plan, 'something-new'],
      owned: [cert.id, otherCert.id, OTHER_COURSES[0].plan, 'something-new'],
      subscriptions: [sub(otherCert.id)],
    });
    expect(items('Purchased (lifetime access)')).toEqual([label(cert), OTHER_COURSES[0].title, 'something-new']);
    expect(items('Subscriptions')).toEqual([expect.stringContaining(label(otherCert))]);
    expect(manage()).toBeInTheDocument();
  });

  it('only lifetime purchases: portal for receipts, nothing to cancel', async () => {
    await show({ plan: null, certs: [cert.id], owned: [cert.id], subscriptions: [] });
    expect(items('Purchased (lifetime access)')).toEqual([label(cert)]);
    expect(list('Subscriptions')).not.toBeInTheDocument();
    expect(manage()).toBeInTheDocument();
    expect(note()).not.toHaveTextContent(/cancelling/);
  });

  it('Pro member: says Pro, shows the Pro subscription, never lists every product Pro unlocks, and does not sell plans', async () => {
    await show({ plan: 'pro', certs: ALL_PRODUCTS, owned: [], subscriptions: [sub('all-access', { interval: 'year' })] });
    expect(screen.getByText(/Your plan:/)).toHaveTextContent('Pro (all access)');
    expect(items('Subscriptions')).toEqual(['Pro (all access) (Yearly, renews January 15, 2027)']);
    expect(list('Purchased (lifetime access)')).not.toBeInTheDocument();
    expect(list('Unlocked')).not.toBeInTheDocument();
    expect(seePlans()).not.toBeInTheDocument();
    expect(note()).toHaveTextContent(/cancelling/);
    await userEvent.click(manage());
    expect(openBillingPortal).toHaveBeenCalledTimes(1);
  });

  it('Pro member who also bought something for good: keeps that purchase listed', async () => {
    await show({ plan: 'pro', certs: ALL_PRODUCTS, owned: [cert.id], subscriptions: [sub('all-access', { interval: 'year' })] });
    expect(items('Purchased (lifetime access)')).toEqual([label(cert)]);
  });

  it('when the API does not say which unlock is which: lists them as "Unlocked", promising neither', async () => {
    await show({ plan: null, certs: [cert.id, `${course.id}-for-aws`], owned: null, subscriptions: null });
    expect(items('Unlocked')).toEqual([label(cert), course.title]);
    expect(list('Purchased (lifetime access)')).not.toBeInTheDocument();
    expect(list('Subscriptions')).not.toBeInTheDocument();
    expect(manage()).toBeInTheDocument();
    expect(note()).toHaveTextContent(/cancelling/); // could be a subscription
  });

  it("when the API does not answer for a Pro member: says Pro, and doesn't list the token's every product", async () => {
    await show({ plan: 'pro', certs: ALL_PRODUCTS, owned: null, subscriptions: null });
    expect(screen.getByText(/Your plan:/)).toHaveTextContent('Pro (all access)');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(manage()).toBeInTheDocument();
  });

  it('shows a busy button while the portal opens, and sends only once', async () => {
    let fail;
    vi.mocked(openBillingPortal).mockReturnValue(new Promise((_, reject) => { fail = reject; }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    await show({ plan: 'pro', certs: ALL_PRODUCTS, owned: [], subscriptions: [] });
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
    await show({ plan: 'pro', certs: ALL_PRODUCTS, owned: [], subscriptions: [] });
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
