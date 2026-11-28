// @vitest-environment jsdom
// "Manage billing" only where there is billing behind the account (the server's billingStatus), and
// the right words when the portal refuses. Same rule as the hub and the games.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// The API and Stripe are the boundary: never reach them. portalErrorKey is the real one.
const billing = vi.hoisted(() => ({ getBillingAccountStatus: vi.fn(), openBillingPortal: vi.fn() }));
vi.mock('../services/billing', async (importOriginal) => ({
  ...billing,
  portalErrorKey: (await importOriginal()).portalErrorKey,
}));

const { default: ManageBilling } = await import('./ManageBilling');
const { default: CourseHome } = await import('./CourseHome');
const { LangProvider, STRINGS, localize } = await import('./i18n');
const { default: bash } = await import('../courses/bash');
const { default: spanish } = await import('../courses/tech-spanish');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container;
let root;
const render = async (element, lang = 'en') => {
  await act(async () => {
    root.render(React.createElement(LangProvider, { languages: [lang], defaultLanguage: lang }, element));
  });
};
const button = () => container.querySelector('.manage-billing button');
const alertText = () => container.querySelector('[role="alert"]')?.textContent;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  billing.getBillingAccountStatus.mockReset().mockResolvedValue(true);
  billing.openBillingPortal.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ManageBilling', () => {
  it('offers the button when billing is behind the account, and when that is unknown', async () => {
    await render(React.createElement(ManageBilling, { course: bash }));
    expect(button().textContent).toBe(STRINGS.en['billing.manage']);
    billing.getBillingAccountStatus.mockResolvedValue(null);
    await act(async () => root.unmount());
    root = createRoot(container);
    await render(React.createElement(ManageBilling, { course: bash }));
    expect(button()).not.toBeNull();
  });

  it('shows nothing, and leaves no empty footer item, when there is no billing to manage', async () => {
    billing.getBillingAccountStatus.mockResolvedValue(false);
    await render(React.createElement('ul', null, React.createElement(ManageBilling, { course: bash, item: true })));
    expect(button()).toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it("says there is no billing to manage when the server refuses for that reason, in the course's language", async () => {
    billing.openBillingPortal.mockRejectedValue(
      Object.assign(new Error('This account has no billing to manage: nothing on it was bought through Stripe.'), { code: 'FAILED_PRECONDITION' }),
    );
    await render(React.createElement(ManageBilling, { course: localize(spanish, 'es') }), 'es');
    await act(async () => button().click());
    expect(alertText()).toBe(STRINGS.es['billing.none']);
    expect(button().disabled).toBe(false);
  });

  it('says "try again" when the portal fails for any other reason', async () => {
    billing.openBillingPortal.mockRejectedValue(new Error('Failed to fetch'));
    await render(React.createElement(ManageBilling, { course: bash }));
    await act(async () => button().click());
    expect(alertText()).toBe(STRINGS.en['billing.failed']);
  });
});

describe('CourseHome for someone who has the course', () => {
  const home = () => React.createElement(CourseHome, {
    course: bash, progress: { done: {} }, access: true, user: { email: 'a@example.com' }, onSignIn: () => {},
  });

  it('points at Manage billing when billing is behind the account', async () => {
    await render(home());
    const section = container.querySelector('.have-access');
    expect(section.textContent).toContain(STRINGS.en['home.manageHint']);
    expect(button()).not.toBeNull();
  });

  it('given by hand: says there is no billing to manage, with no button that can only fail', async () => {
    billing.getBillingAccountStatus.mockResolvedValue(false);
    await render(home());
    const section = container.querySelector('.have-access');
    expect(section.textContent).toContain(STRINGS.en['billing.given']);
    expect(section.textContent).not.toContain(STRINGS.en['home.manageHint']);
    expect(button()).toBeNull();
  });
});
