import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useAuth } from './context/AuthContext';
import { getPlan, getProTrialStatus, getBillingSummary, getBillingAccountStatus, getEntitlements, startCheckout, openBillingPortal, PRO_TRIAL_DAYS } from './services/billing';
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY, YEARLY_SAVINGS_PERCENT } from './data/prices';
import { certifications, categories } from './data/certifications';
import { COURSES, OTHER_COURSES } from './data/courses';
import { GIS_PAGE } from './data/gis';
import { HERO_SLIDES } from './data/heroSlides';
import { PROMOTIONS } from './services/offers';
import { holdBrowserRestore, letGo } from './services/scrollRestore';

// --- Boundaries -------------------------------------------------------------
// Sign-in state comes from a fake AuthContext; each test sets what it needs.
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}));

// Billing is the money boundary: never reach Stripe. BILLING_ENABLED is a build
// variable, so it is a getter a test can flip.
const billing = vi.hoisted(() => ({ enabled: true }));
vi.mock('./services/billing', async (importOriginal) => {
  const { PRO_TRIAL_DAYS: days, portalErrorMessage } = await importOriginal();
  return {
    get BILLING_ENABLED() { return billing.enabled; },
    PRO_TRIAL_DAYS: days,
    portalErrorMessage, // the real one: which words reach the member is what the tests check
    getPlan: vi.fn(),
    getProTrialStatus: vi.fn(),
    getBillingSummary: vi.fn(),
    getBillingAccountStatus: vi.fn(),
    getEntitlements: vi.fn(),
    startCheckout: vi.fn(),
    openBillingPortal: vi.fn(),
  };
});

// Readiness emails and the newsletter post to our API; never from a test.
vi.mock('./services/leads', () => ({
  captureSource: vi.fn(),
  track: vi.fn(),
  submitReadiness: vi.fn(),
  unsubscribe: vi.fn(),
  subscribeNewsletter: vi.fn(),
}));
vi.mock('./services/sharedAuth', () => ({ sendPasswordReset: vi.fn(), resetPassword: vi.fn() }));

// Pretend the page was opened on a third name, so a link written with either name shows it went through onThisName.
vi.mock('./config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example'),
}));

// One coming-soon cert next to the real data, so that path is covered even while
// none is coming soon. A coming-soon card must never show a price.
vi.mock('./data/certifications', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    certifications: [...actual.certifications, {
      id: 'test-coming-soon', name: 'Test Coming Soon Certification', code: 'TST-C01', level: 'Professional',
      category: 'professional', description: 'A fixture.', url: 'https://test.levelupstudyhub.com',
      status: 'coming-soon', color: '#888888', examLength: '1 minute', questions: '1 question',
      officialUrl: 'https://aws.amazon.com/certification/', features: ['Fixture Feature'],
    }],
  };
});

// --- Helpers ----------------------------------------------------------------
const [promo] = PROMOTIONS;
const MINUTE = 60_000;
const at = (time) => {
  vi.useFakeTimers({ toFake: ['Date'] }); // only the clock; userEvent still needs real timers
  vi.setSystemTime(time);
};
// Independent of offers.js: whole cents, discount rounded to the cent (as Stripe does).
const cents = (price) => Math.round(Number(price.replace('$', '')) * 100);
const discounted = (price, percent) => {
  const c = cents(price);
  return `$${((c - Math.round((c * percent) / 100)) / 100).toFixed(2)}`;
};
const onPageName = (url) => url.replace(/aws-study-flashcards-app\.com|levelupstudyhub\.com/, 'page-name.example');

const live = certifications.filter((c) => c.status === 'available');
const hidden = certifications.filter((c) => c.status === 'hidden');
const comingSoon = certifications.filter((c) => c.status === 'coming-soon');

const auth = {};
const setAuth = (over = {}) => {
  Object.assign(auth, {
    user: null, userData: null, isAuthenticated: false, isGuest: false, authChecked: true, error: null,
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    googleSignIn: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    changeUserPassword: vi.fn(), changeDisplayName: vi.fn(), updateAvatar: vi.fn(),
    deleteUserAccount: vi.fn(), refreshUserData: vi.fn(),
    signOutMessage: null, dismissSignOutReason: vi.fn(),
  }, over);
  vi.mocked(useAuth).mockImplementation(() => auth);
};
const signIn = (over = {}) => setAuth({
  user: { email: 'alice@example.com', displayName: 'Alice' },
  userData: { isGuest: false },
  isAuthenticated: true,
  ...over,
});

const section = (title) => screen.getByRole('heading', { name: title, level: 2 }).closest('section');
const certCard = (name) => within(section('AWS Certifications')).getByRole('heading', { name, level: 3 }).parentElement;
const plans = () => section('Simple Plans');
const planCard = (name) => within(plans()).getByText(name, { selector: '.plan-name' }).parentElement;
const proCard = () => planCard('Pro');
const footer = () => screen.getByRole('contentinfo');
const header = () => screen.getByRole('banner');
const modal = () => screen.queryByRole('heading', { name: /^(welcome back|create account|reset password)$/i })?.closest('.login-modal') ?? null;
const go = (path) => window.history.pushState({}, '', path);

beforeEach(() => {
  billing.enabled = true;
  setAuth();
  vi.mocked(getPlan).mockReset().mockResolvedValue(null);
  vi.mocked(getProTrialStatus).mockReset().mockResolvedValue(true); // a first-time buyer unless a test says otherwise
  vi.mocked(getBillingSummary).mockReset().mockResolvedValue({ plan: null, certs: [], owned: [], subscriptions: [] }); // Settings → Plan & Billing
  vi.mocked(getBillingAccountStatus).mockReset().mockResolvedValue(true); // a Pro member bought it unless a test says otherwise
  vi.mocked(getEntitlements).mockReset().mockResolvedValue({ plan: null, certs: [] });
  vi.mocked(startCheckout).mockReset();
  vi.mocked(openBillingPortal).mockReset();
  at(promo.end + MINUTE); // outside any sale unless a test says otherwise
  go('/');
});

afterEach(() => {
  go('/');
});

// --- Tests ------------------------------------------------------------------
describe('App', () => {
  describe('loading', () => {
    it('shows only the loading screen until the first sign-in check finishes', () => {
      setAuth({ authChecked: false });
      render(<App />);
      expect(screen.getByText(/loading level up study hub/i)).toBeInTheDocument();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });

    it('shows the homepage to signed-out visitors (no sign-in required)', () => {
      render(<App />);
      expect(screen.queryByText(/loading level up study hub/i)).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(section('AWS Certifications')).toBeInTheDocument();
    });
  });

  describe('homepage sections', () => {
    it('has the anchors the header links to, in page order', () => {
      render(<App />);
      const navTargets = within(header()).getAllByRole('link')
        .map((a) => a.getAttribute('href')).filter((h) => h.startsWith('#'));
      expect(navTargets).toEqual(['#certifications', '#courses', '#about', '#plans', '#resources']);
      for (const hash of navTargets) expect(document.querySelector(hash)).toBeInTheDocument();
      expect(document.querySelector('#faq')).toBeInTheDocument();
    });

    it('opens with the hero rotator on the AWS slide as the only h1', () => {
      render(<App />);
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(HERO_SLIDES[0].highlight);
    });

    it('counts the live certifications correctly in the hero', () => {
      render(<App />);
      expect(screen.getByText('Certifications Live').previousSibling).toHaveTextContent(String(live.length));
    });

    // Regression: the Solutions Architect card once left out 'Exam Simulator', although the game
    // ships it and the hero and FAQ say every certification has one.
    it('lists the Exam Simulator on every live cert card, matching the hero count', () => {
      render(<App />);
      const simulators = screen.getByText('Timed Exam Simulators').previousSibling.textContent;
      for (const cert of live) expect(within(certCard(cert.name)).getByText('Exam Simulator')).toBeInTheDocument();
      expect(Number(simulators)).toBe(live.filter((c) => c.features.includes('Exam Simulator')).length);
    });
  });

  describe('certification grid', () => {
    it('shows a card for every live certification', () => {
      render(<App />);
      expect(live.length).toBeGreaterThan(0);
      for (const cert of live) expect(certCard(cert.name)).toBeInTheDocument();
    });

    it.each(live.map((c) => [c.name, c]))('%s: code, level, description, exam facts, price and features', (_, cert) => {
      render(<App />);
      const card = within(certCard(cert.name));
      expect(card.getByText(cert.code)).toBeInTheDocument();
      expect(card.getByText(cert.level)).toBeInTheDocument();
      expect(card.getByText(cert.description)).toBeInTheDocument();
      expect(card.getByText(cert.examLength)).toBeInTheDocument();
      expect(card.getByText(cert.questions)).toBeInTheDocument();
      expect(certCard(cert.name)).toHaveTextContent(`${PRODUCT_MONTHLY}/month or ${PRODUCT_YEARLY}/year`);
      expect(certCard(cert.name)).not.toHaveTextContent(/one-time|once\b/i);
      for (const f of cert.features) expect(card.getByText(f)).toBeInTheDocument();
      expect(card.queryByText('Coming Soon')).not.toBeInTheDocument();
    });

    it.each(live.map((c) => [c.name, c]))('%s: "Start Free" goes to its site through onThisName; "AWS Docs" opens the official page', (_, cert) => {
      render(<App />);
      const card = within(certCard(cert.name));
      expect(card.getByRole('link', { name: /start free/i })).toHaveAttribute('href', onPageName(cert.url));
      const docs = card.getByRole('link', { name: /aws docs/i });
      expect(docs).toHaveAttribute('href', cert.officialUrl);
      expect(docs).toHaveAttribute('target', '_blank');
      expect(docs).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('gives every live cert its own site, and no price of its own (every product costs the same, from prices.js)', () => {
      expect(new Set(live.map((c) => c.url)).size).toBe(live.length);
      for (const c of live) {
        expect(c.url).toMatch(/^https:\/\/[a-z-]+\.levelupstudyhub\.com$/);
        expect(c).not.toHaveProperty('price');
      }
    });

    it('never shows a hidden certification', () => {
      render(<App />);
      expect(hidden.length).toBeGreaterThan(0);
      const grid = within(section('AWS Certifications'));
      for (const cert of hidden) {
        expect(grid.queryByRole('heading', { name: cert.name })).not.toBeInTheDocument();
        expect(grid.queryByText(cert.code)).not.toBeInTheDocument();
      }
    });

    it('shows a coming-soon cert with a badge and a disabled button, without a price or a link to its site', () => {
      render(<App />);
      expect(comingSoon.length).toBeGreaterThan(0);
      for (const cert of comingSoon) {
        const el = certCard(cert.name);
        const card = within(el);
        expect(card.getAllByText('Coming Soon')).toHaveLength(2); // badge + button
        expect(card.getByRole('button', { name: 'Coming Soon' })).toBeDisabled();
        expect(card.queryByRole('link', { name: /start free/i })).not.toBeInTheDocument();
        expect(el).not.toHaveTextContent(PRODUCT_MONTHLY);
        expect(el).not.toHaveTextContent('/month');
      }
    });

    it('groups cards by category and leaves out a category with nothing to show', () => {
      render(<App />);
      const grid = within(section('AWS Certifications'));
      for (const cat of categories) {
        const shown = certifications.filter((c) => c.category === cat.id && c.status !== 'hidden');
        const heading = grid.queryByRole('heading', { name: cat.name, level: 3 });
        if (shown.length === 0) {
          expect(heading).not.toBeInTheDocument();
        } else {
          const group = heading.closest('.category-group');
          const names = within(group).getAllByRole('heading', { level: 3 }).slice(1).map((h) => h.textContent);
          expect(names).toEqual(shown.map((c) => c.name));
        }
      }
    });
  });

  describe('plans', () => {
    it('shows the four plans in order: Guest, Free account, One Certification or Course, Pro', () => {
      render(<App />);
      const names = [...plans().querySelectorAll('.plan-name')].map((n) => n.textContent);
      expect(names).toEqual(['Guest Preview', 'Free Account', 'One Certification or Course', 'Pro']);
    });

    it('sends Guest and Free account to the Cloud Practitioner site through onThisName', () => {
      render(<App />);
      const cloud = certifications.find((c) => c.id === 'cloud-practitioner');
      expect(within(planCard('Guest Preview')).getByRole('link', { name: /try it now/i }))
        .toHaveAttribute('href', onPageName(cloud.url));
      expect(within(planCard('Free Account')).getByRole('link', { name: /create free account/i }))
        .toHaveAttribute('href', onPageName(cloud.url));
      expect(within(planCard('Guest Preview')).getByText('Free')).toBeInTheDocument();
      expect(within(planCard('Free Account')).getByText('Free')).toBeInTheDocument();
    });

    describe('One Certification or Course', () => {
      const card = () => planCard('One Certification or Course');
      const period = () => within(card()).getByRole('group', { name: 'Billing period' });
      const price = () => card().querySelector('.plan-price');

      it('lets the buyer pick monthly or yearly with two named radio buttons, yearly first chosen', () => {
        render(<App />);
        const monthly = within(period()).getByRole('radio', { name: 'Monthly' });
        const yearly = within(period()).getByRole('radio', { name: `Yearly save ${YEARLY_SAVINGS_PERCENT}%` });
        expect(yearly).toBeChecked();
        expect(monthly).not.toBeChecked();
        expect(price()).toHaveTextContent(`${PRODUCT_YEARLY}/year`);
        expect(card()).toHaveTextContent(`Save ${YEARLY_SAVINGS_PERCENT}% against ${PRODUCT_MONTHLY} a month`);
      });

      it('shows the monthly price when Monthly is picked, and back', async () => {
        const user = userEvent.setup();
        render(<App />);
        await user.click(within(period()).getByRole('radio', { name: 'Monthly' }));
        expect(within(period()).getByRole('radio', { name: 'Monthly' })).toBeChecked();
        expect(price()).toHaveTextContent(`${PRODUCT_MONTHLY}/month`);
        expect(card()).toHaveTextContent(`Or ${PRODUCT_YEARLY} a year, ${YEARLY_SAVINGS_PERCENT}% less`);
        await user.click(within(period()).getByRole('radio', { name: /yearly/i }));
        expect(price()).toHaveTextContent(`${PRODUCT_YEARLY}/year`);
      });

      it('works from the keyboard: arrow keys move between the two periods', async () => {
        const user = userEvent.setup();
        render(<App />);
        within(period()).getByRole('radio', { name: /yearly/i }).focus();
        await user.keyboard('{ArrowLeft}');
        expect(within(period()).getByRole('radio', { name: 'Monthly' })).toBeChecked();
        expect(price()).toHaveTextContent(`${PRODUCT_MONTHLY}/month`);
      });

      it('says it renews and can be cancelled, never "one-time", and sends buyers to the certifications', () => {
        render(<App />);
        expect(card()).toHaveTextContent(/renews automatically; cancel anytime/i);
        expect(card()).not.toHaveTextContent(/one-time|pay once|keep it/i);
        expect(within(card()).getByRole('link', { name: /choose a certification/i })).toHaveAttribute('href', '#certifications');
      });
    });

    it('says in the fine print that subscriptions renew automatically, with the cancel route', () => {
      render(<App />);
      const fine = plans().querySelector('.plans-fine-print');
      expect(fine).toHaveTextContent(/subscriptions renew automatically; cancel anytime in manage billing/i);
      expect(fine).toHaveTextContent(/keep their lifetime access/i);
    });

    it('links the fine print to the Terms of Service', () => {
      render(<App />);
      expect(within(plans()).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms.html');
    });

    describe('Pro card', () => {
      it('shows "Coming Soon" and no trial while billing is off, and never asks for a plan', () => {
        billing.enabled = false;
        signIn();
        render(<App />);
        const card = within(proCard());
        expect(card.getAllByText('Coming Soon')[0]).toBeInTheDocument();
        expect(card.getByRole('button', { name: 'Coming Soon' })).toBeDisabled();
        expect(proCard()).not.toHaveTextContent(/days free|free trial|card required/i);
        expect(proCard()).not.toHaveTextContent(PRO_YEARLY);
        expect(getPlan).not.toHaveBeenCalled();
      });

      it('shows the Pro price and the free trial terms to a signed-out visitor', () => {
        render(<App />);
        const card = within(proCard());
        expect(proCard().querySelector('.plan-price')).toHaveTextContent(`${PRO_YEARLY}/year`);
        expect(card.getByText(`First ${PRO_TRIAL_DAYS} days free`)).toBeInTheDocument();
        expect(proCard()).toHaveTextContent(`Card required. Cancel before day ${PRO_TRIAL_DAYS} and you pay nothing`);
        expect(proCard()).toHaveTextContent(/renews yearly\. one free trial per person/i);
        expect(getPlan).not.toHaveBeenCalled();
      });

      it('includes every coding course, live or coming, and every certification', () => {
        render(<App />);
        const card = within(proCard());
        expect(card.getByText(`All ${COURSES.length + OTHER_COURSES.length} coding courses included`)).toBeInTheDocument();
        expect(card.getByText('Every live certification unlocked')).toBeInTheDocument();
      });

      it('tells a signed-in member with no trial that Pro renews yearly', async () => {
        signIn();
        vi.mocked(getProTrialStatus).mockResolvedValue(null);
        render(<App />);
        await act(async () => {});
        expect(proCard()).toHaveTextContent(/renews yearly until you cancel in manage billing/i);
      });

      it('asks a signed-out visitor to sign in (opens the sign-in box), without starting checkout', async () => {
        render(<App />);
        await userEvent.click(within(proCard()).getByRole('button', { name: 'Sign In to Start Free Trial' }));
        expect(modal()).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
        expect(startCheckout).not.toHaveBeenCalled();
      });

      it('offers a signed-in member without Pro the trial and starts all-access checkout', async () => {
        signIn();
        vi.mocked(startCheckout).mockReturnValue(new Promise(() => {})); // redirecting
        render(<App />);
        await act(async () => {}); // getPlan, then the trial status, resolve
        expect(getPlan).toHaveBeenCalledWith({ forceRefresh: false });
        expect(getProTrialStatus).toHaveBeenCalledTimes(1);
        expect(within(proCard()).getByText(`First ${PRO_TRIAL_DAYS} days free`)).toBeInTheDocument();
        const button = within(proCard()).getByRole('button', { name: /start free trial/i });
        await userEvent.click(button);
        expect(startCheckout).toHaveBeenCalledTimes(1);
        expect(startCheckout).toHaveBeenCalledWith('all-access', 'year');
        expect(within(proCard()).getByRole('button', { name: /redirecting/i })).toBeDisabled();
      });

      it('does not start two checkouts on a double click', async () => {
        signIn();
        vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
        render(<App />);
        await act(async () => {});
        await userEvent.dblClick(within(proCard()).getByRole('button', { name: /start free trial/i }));
        expect(startCheckout).toHaveBeenCalledTimes(1);
      });

      it('shows an error and re-enables the button when checkout fails', async () => {
        signIn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(startCheckout).mockRejectedValueOnce(new Error('declined'));
        render(<App />);
        await act(async () => {});
        await userEvent.click(within(proCard()).getByRole('button', { name: /start free trial/i }));
        expect(await within(proCard()).findByText('Could not start checkout. Please try again.')).toBeInTheDocument();
        const again = within(proCard()).getByRole('button', { name: /start free trial/i });
        expect(again).toBeEnabled();
        vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
        await userEvent.click(again);
        expect(startCheckout).toHaveBeenCalledTimes(2);
        expect(within(proCard()).queryByText(/could not start checkout/i)).not.toBeInTheDocument();
      });

      // The server gives the free trial only to people who never had Pro; the card must not
      // promise it to a former member, who checkout charges from day one
      it('does not promise the trial to someone who had Pro before: "Get Pro" and a clear note', async () => {
        signIn();
        vi.mocked(getProTrialStatus).mockResolvedValue(false);
        vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
        render(<App />);
        await act(async () => {});
        expect(proCard()).not.toHaveTextContent(/days free|free trial|card required/i);
        expect(proCard()).toHaveTextContent(/had Pro before.*no trial.*starts today/i);
        await userEvent.click(within(proCard()).getByRole('button', { name: /get pro/i }));
        expect(startCheckout).toHaveBeenCalledWith('all-access', 'year');
      });

      it('does not promise the trial while the answer is unknown (lookup failed)', async () => {
        signIn();
        vi.mocked(getProTrialStatus).mockResolvedValue(null);
        render(<App />);
        await act(async () => {});
        expect(proCard()).not.toHaveTextContent(/days free|free trial|card required|had Pro before/i);
        expect(within(proCard()).getByRole('button', { name: /get pro/i })).toBeEnabled();
      });

      it("never asks for the trial status of a Pro member", async () => {
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        render(<App />);
        await within(proCard()).findByText('Your Plan');
        expect(getProTrialStatus).not.toHaveBeenCalled();
      });

      it('refreshes the plan from a fresh token when coming back from checkout', async () => {
        go('/?checkout=success');
        signIn();
        render(<App />);
        await act(async () => {});
        expect(getPlan).toHaveBeenCalledWith({ forceRefresh: true });
      });

      it('explains a checkout refused because Pro runs on the other sign-in', async () => {
        signIn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(startCheckout).mockRejectedValueOnce(
          new Error('Pro is already on for this email under your other sign-in. Sign out, then sign in the other way, for example with Google.')
        );
        render(<App />);
        await act(async () => {});
        await userEvent.click(within(proCard()).getByRole('button', { name: /start free trial/i }));
        expect(await within(proCard()).findByText(/already on for your email under your other sign-in/i)).toBeInTheDocument();
        expect(within(proCard()).queryByText(/could not start checkout/i)).not.toBeInTheDocument();
      });

      it('after buying Pro on top of single subscriptions, says those keep billing until cancelled', async () => {
        go('/?checkout=success&overlap=1');
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        render(<App />);
        expect(await within(proCard()).findByText(/other subscriptions keep billing until you\s+cancel them/i)).toBeInTheDocument();
        expect(within(proCard()).getByRole('button', { name: 'Manage Subscription' })).toBeEnabled();
      });

      it('shows a Pro member "Your Plan" and Manage Subscription, with no trial offer', async () => {
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        vi.mocked(openBillingPortal).mockReturnValue(new Promise(() => {}));
        render(<App />);
        expect(await within(proCard()).findByText('Your Plan')).toBeInTheDocument();
        expect(proCard()).not.toHaveTextContent(/days free|free trial|card required/i);
        await userEvent.click(within(proCard()).getByRole('button', { name: 'Manage Subscription' }));
        expect(openBillingPortal).toHaveBeenCalledTimes(1);
        expect(startCheckout).not.toHaveBeenCalled();
        expect(within(proCard()).getByRole('button', { name: /opening/i })).toBeDisabled();
      });

      it('shows an error when the billing portal will not open', async () => {
        signIn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(getPlan).mockResolvedValue('pro');
        vi.mocked(openBillingPortal).mockRejectedValueOnce(new Error('nope'));
        render(<App />);
        await userEvent.click(await within(proCard()).findByRole('button', { name: 'Manage Subscription' }));
        expect(await within(proCard()).findByText('Could not open billing portal. Please try again.')).toBeInTheDocument();
        expect(within(proCard()).getByRole('button', { name: 'Manage Subscription' })).toBeEnabled();
      });

      it("shows the server's reason when it refuses to open the portal, not a generic retry", async () => {
        signIn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(getPlan).mockResolvedValue('pro');
        vi.mocked(openBillingPortal).mockRejectedValueOnce(
          Object.assign(new Error('This account has no billing to manage.'), { code: 'FAILED_PRECONDITION' })
        );
        render(<App />);
        await userEvent.click(await within(proCard()).findByRole('button', { name: 'Manage Subscription' }));
        expect(await within(proCard()).findByText('This account has no billing to manage.')).toBeInTheDocument();
        expect(proCard()).not.toHaveTextContent(/try again/i);
      });

      it('Pro given by hand (no billing account): a plain line instead of a Manage button that can only fail', async () => {
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        vi.mocked(getBillingAccountStatus).mockResolvedValue(false);
        render(<App />);
        expect(await within(proCard()).findByText('Pro was given to this account, not bought, so there is no billing to manage.')).toBeInTheDocument();
        expect(within(proCard()).getByText('Your Plan')).toBeInTheDocument();
        expect(within(proCard()).queryByRole('button')).not.toBeInTheDocument();
        expect(openBillingPortal).not.toHaveBeenCalled();
      });

      it('keeps Manage Subscription when the billing check cannot answer, and asks it only for Pro members', async () => {
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        vi.mocked(getBillingAccountStatus).mockResolvedValue(null);
        const { unmount } = render(<App />);
        expect(await within(proCard()).findByRole('button', { name: 'Manage Subscription' })).toBeEnabled();
        await act(async () => {});
        expect(getBillingAccountStatus).toHaveBeenCalledTimes(1);
        expect(within(proCard()).getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
        unmount();

        vi.mocked(getBillingAccountStatus).mockClear();
        vi.mocked(getPlan).mockResolvedValue(null);
        render(<App />);
        await within(proCard()).findByRole('button', { name: /start free trial|get pro/i });
        expect(getBillingAccountStatus).not.toHaveBeenCalled();
      });

      it('forgets the plan when the member signs out', async () => {
        signIn();
        vi.mocked(getPlan).mockResolvedValue('pro');
        const { rerender } = render(<App />);
        expect(await within(proCard()).findByText('Your Plan')).toBeInTheDocument();
        setAuth();
        rerender(<App />);
        expect(within(proCard()).queryByText('Your Plan')).not.toBeInTheDocument();
        expect(within(proCard()).getByRole('button', { name: 'Sign In to Start Free Trial' })).toBeInTheDocument();
      });
    });
  });

  describe('sales', () => {
    it('shows full prices and no sale pills outside a sale', () => {
      render(<App />);
      expect(section('AWS Certifications').querySelector('s')).toBeNull();
      expect(plans()).not.toHaveTextContent(promo.label);
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    it('shows each live cert at the sale prices with the full monthly and yearly prices struck through', () => {
      at(promo.start + MINUTE);
      render(<App />);
      for (const cert of live) {
        const el = certCard(cert.name);
        expect(within(el).getByText(discounted(PRODUCT_MONTHLY, promo.single))).toBeInTheDocument();
        expect(within(el).getByText(discounted(PRODUCT_YEARLY, promo.single))).toBeInTheDocument();
        expect([...el.querySelectorAll('s')].map((x) => x.textContent)).toEqual([PRODUCT_MONTHLY, PRODUCT_YEARLY]);
      }
    });

    it('shows the first-payment sale on the product plan for the chosen period, and the Pro discount on Pro', async () => {
      at(promo.start + MINUTE);
      render(<App />);
      const product = planCard('One Certification or Course');
      expect(product).toHaveTextContent(`${promo.label}: ${promo.single}% off your first year, so ${discounted(PRODUCT_YEARLY, promo.single)}`);
      await userEvent.click(within(product).getByRole('radio', { name: 'Monthly' }));
      expect(product).toHaveTextContent(`${promo.label}: ${promo.single}% off your first month, so ${discounted(PRODUCT_MONTHLY, promo.single)}`);
      expect(proCard()).toHaveTextContent(`${promo.label}: ${promo.pro}% off your first year until ${promo.ends}`);
      // the trial is still offered during a sale
      expect(within(proCard()).getByText(`First ${PRO_TRIAL_DAYS} days free`)).toBeInTheDocument();
    });

    it('shows no Pro sale pill while billing is off', () => {
      at(promo.start + MINUTE);
      billing.enabled = false;
      render(<App />);
      expect(proCard()).not.toHaveTextContent(promo.label);
    });

    it('shows the sale banner at the top of the page while it runs', () => {
      at(promo.start + MINUTE);
      render(<App />);
      expect(screen.getByRole('note')).toHaveTextContent(/applied at checkout/i);
    });

    it('keeps full prices during the teaser, with only the "starts" banner', () => {
      at(promo.teaseFrom + MINUTE);
      render(<App />);
      expect(section('AWS Certifications').querySelector('s')).toBeNull();
      expect(plans()).not.toHaveTextContent(promo.label);
      expect(screen.getByRole('note')).toHaveTextContent(`${promo.label} starts ${promo.starts}`);
    });

    it('goes back to full price the moment the sale ends', () => {
      at(promo.end);
      render(<App />);
      expect(section('AWS Certifications').querySelector('s')).toBeNull();
      for (const cert of live) expect(certCard(cert.name)).toHaveTextContent(`${PRODUCT_MONTHLY}/month or ${PRODUCT_YEARLY}/year`);
    });

    it('checks out the same plan during a sale (the server applies the discount)', async () => {
      at(promo.start + MINUTE);
      signIn();
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<App />);
      await act(async () => {});
      await userEvent.click(within(proCard()).getByRole('button', { name: /start free trial/i }));
      expect(startCheckout).toHaveBeenCalledWith('all-access', 'year');
    });
  });

  describe('no bundle and no one-time wording on the homepage', () => {
    it('never offers the Developer Path bundle or a one-time unlock', () => {
      render(<App />);
      const main = screen.getByRole('main');
      expect(main).not.toHaveTextContent(/developer path|bundle|one-time|pay once|keep it\b/i);
      expect(within(section('Coding Courses')).queryByRole('button')).not.toBeInTheDocument();
      expect(startCheckout).not.toHaveBeenCalled();
    });
  });

  describe('header and signed-in state', () => {
    it('shows Sign In to a visitor, and opens the sign-in box', async () => {
      render(<App />);
      expect(within(header()).queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument();
      await userEvent.click(within(header()).getByRole('button', { name: 'Sign In' }));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });

    it('shows the member name and Sign Out, which signs out', async () => {
      signIn();
      render(<App />);
      expect(within(header()).getByText('Alice')).toBeInTheDocument();
      expect(within(header()).queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
      await userEvent.click(within(header()).getByRole('button', { name: 'Sign Out' }));
      expect(auth.logout).toHaveBeenCalledTimes(1);
    });

    it('falls back to the email name when there is no display name, and shows an emoji avatar', () => {
      signIn({ user: { email: 'bob.smith@example.com' }, userData: { avatar: { type: 'emoji', value: '🦊' } } });
      render(<App />);
      expect(within(header()).getByText('bob.smith')).toBeInTheDocument();
      expect(within(header()).getByText('🦊')).toBeInTheDocument();
      expect(screen.getByText(/welcome back,/i)).toHaveTextContent('Welcome back, bob.smith!');
    });

    it('welcomes a member back in the hero and adds up their progress across certs', () => {
      const progress = {
        'ai-practitioner': { xp: 250, totalAnswered: 10, totalCorrect: 7, maxStreak: 4, totalSessions: 2 },
        'cloud-practitioner': { xp: 100, totalAnswered: 10, totalCorrect: 9, maxStreak: 6, totalSessions: 3 },
      };
      signIn({ userData: { isGuest: false, progress } });
      render(<App />);
      const welcome = screen.getByText(/welcome back,/i);
      expect(welcome).toHaveTextContent('Welcome back, Alice!');
      const stat = (label) => within(welcome).getByText(label).previousSibling.textContent;
      expect(stat('Total XP')).toBe('350');
      expect(stat('Level')).toBe('4'); // 100 XP per level
      expect(stat('Accuracy')).toBe('80%');
      expect(stat('Best Streak')).toBe('6');
      expect(stat('Sessions')).toBe('5');

      const ai = within(welcome).getByRole('link', { name: /ai practitioner/i });
      expect(ai).toHaveTextContent('Lvl 3 · 70%');
      expect(ai).toHaveAttribute('href', onPageName(certifications.find((c) => c.id === 'ai-practitioner').url));
      const cloud = within(welcome).getByRole('link', { name: /cloud practitioner/i });
      expect(cloud).toHaveTextContent('Lvl 2 · 90%');
      expect(cloud).toHaveAttribute('href', onPageName(certifications.find((c) => c.id === 'cloud-practitioner').url));
    });

    // Regression: the panel once had cards for AI and Cloud Practitioner only, so Solutions
    // Architect and Developer progress counted toward the totals but never got a card
    it('gives every live cert the learner has played its own progress card', () => {
      const live = certifications.filter((c) => c.status === 'available');
      const progress = Object.fromEntries(live.map((c) => [c.id, { xp: 150, totalAnswered: 4, totalCorrect: 3 }]));
      signIn({ userData: { isGuest: false, progress } });
      render(<App />);
      const welcome = screen.getByText(/welcome back,/i);
      for (const c of live) {
        const short = c.name.replace(/^AWS Certified /, '');
        const card = within(welcome).getByRole('link', { name: new RegExp(short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
        expect(card).toHaveTextContent('Lvl 2 · 75%');
        expect(card).toHaveAttribute('href', onPageName(c.url));
      }
    });

    it('shows no stats panel for a member who has not played yet', () => {
      signIn({ userData: { isGuest: false, progress: {} } });
      render(<App />);
      expect(within(screen.getByText(/welcome back,/i)).queryByText('Total XP')).not.toBeInTheDocument();
    });

    it('opens Account Settings for a member, and Back returns home', async () => {
      signIn();
      const { container } = render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('heading', { name: 'Account Settings', level: 1 })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'AWS Certifications' })).not.toBeInTheDocument();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      // The back button is icon-only, with no accessible name (SettingsPage), so find it by class
      await userEvent.click(container.querySelector('.settings-back-btn'));
      expect(section('AWS Certifications')).toBeInTheDocument();
    });

    it('Settings → Plan & Billing → "See plans" goes back home, to the plans section', async () => {
      signIn();
      const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
      render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Settings' }));
      expect(await screen.findByText(/Your plan:/)).toHaveTextContent('Free');
      await userEvent.click(screen.getByRole('button', { name: 'See plans' }));
      expect(screen.queryByRole('heading', { name: 'Account Settings' })).not.toBeInTheDocument();
      await waitFor(() => expect(scrolled.mock.contexts.some((el) => el.id === 'plans')).toBe(true));
    });

    it('goes back to the homepage if the member signs out while on Settings', async () => {
      signIn();
      const { rerender } = render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('heading', { name: 'Account Settings' })).toBeInTheDocument();
      setAuth();
      rerender(<App />);
      expect(screen.queryByRole('heading', { name: 'Account Settings' })).not.toBeInTheDocument();
      expect(section('AWS Certifications')).toBeInTheDocument();
      // signing back in does not jump back into Settings
      signIn();
      rerender(<App />);
      expect(screen.queryByRole('heading', { name: 'Account Settings' })).not.toBeInTheDocument();
    });
  });

  describe('sign-in box', () => {
    const open = async (user) => {
      render(<App />);
      await user.click(within(header()).getByRole('button', { name: 'Sign In' }));
      return within(modal());
    };
    const email = () => within(modal()).getByPlaceholderText('your.email@example.com');
    const password = () => within(modal()).getByPlaceholderText('Enter password');
    const submit = () => within(modal()).getByRole('button', { name: /^(sign in|create account)$/i });

    it('signs in with email and password and closes', async () => {
      const user = userEvent.setup();
      await open(user);
      await user.type(email(), 'alice@example.com');
      await user.type(password(), 'secret123');
      await user.click(submit());
      expect(auth.login).toHaveBeenCalledWith('alice@example.com', 'secret123');
      expect(modal()).toBeNull();
    });

    it('stays open when sign-in fails, showing the error from sign-in', async () => {
      const user = userEvent.setup();
      auth.login.mockResolvedValue({ success: false, error: 'Incorrect email or password' });
      const { rerender } = render(<App />);
      await user.click(within(header()).getByRole('button', { name: 'Sign In' }));
      await user.type(email(), 'alice@example.com');
      await user.type(password(), 'wrongpass');
      await user.click(submit());
      expect(modal()).toBeInTheDocument();
      auth.error = 'Incorrect email or password'; // AuthContext sets this on failure
      rerender(<App />);
      expect(within(modal()).getByText('Incorrect email or password')).toBeInTheDocument();
      await user.type(password(), 'x');
      expect(auth.clearError).toHaveBeenCalled();
    });

    it('shows a thrown error message', async () => {
      const user = userEvent.setup();
      auth.login.mockRejectedValue(new Error('Network trouble'));
      await open(user);
      await user.type(email(), 'alice@example.com');
      await user.type(password(), 'secret123');
      await user.click(submit());
      expect(await within(modal()).findByText('Network trouble')).toBeInTheDocument();
      expect(submit()).toBeEnabled();
    });

    it.each([
      ['an email without a domain', 'alice@', 'secret123', 'Please enter a valid email address'],
      ['a password under 6 characters', 'alice@example.com', '12345', 'Password must be at least 6 characters'],
    ])('rejects %s before calling sign-in', async (_, mail, pass, message) => {
      const user = userEvent.setup();
      await open(user);
      await user.type(email(), mail);
      if (pass) await user.type(password(), pass);
      fireEvent.submit(submit().closest('form')); // past the browser's own checks, to reach ours
      expect(within(modal()).getByText(message)).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('requires an email', async () => {
      const user = userEvent.setup();
      await open(user);
      fireEvent.submit(submit().closest('form'));
      expect(within(modal()).getByText('Email is required')).toBeInTheDocument();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('clears a validation message as soon as the visitor types', async () => {
      const user = userEvent.setup();
      await open(user);
      fireEvent.submit(submit().closest('form'));
      expect(within(modal()).getByText('Email is required')).toBeInTheDocument();
      await user.type(email(), 'a');
      expect(within(modal()).queryByText('Email is required')).not.toBeInTheDocument();
    });

    describe('create account', () => {
      const toRegister = async (user) => {
        const box = await open(user);
        await user.click(box.getByRole('button', { name: /don't have an account\? sign up/i }));
        expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      };
      const username = () => within(modal()).getByPlaceholderText('Choose a username');
      const confirm = () => within(modal()).getByPlaceholderText('Confirm password');

      it('registers with email, password and username and stays open (to say "check your email")', async () => {
        const user = userEvent.setup();
        await toRegister(user);
        await user.type(email(), 'new@example.com');
        await user.type(username(), 'newbie');
        await user.type(password(), 'secret123');
        await user.type(confirm(), 'secret123');
        await user.click(submit());
        expect(auth.register).toHaveBeenCalledWith('new@example.com', 'secret123', 'newbie');
        expect(modal()).toBeInTheDocument();
      });

      it.each([
        ['a username under 3 characters', 'ab', 'secret123', 'Username must be at least 3 characters'],
        ['passwords that do not match', 'newbie', 'different1', 'Passwords do not match'],
      ])('rejects %s', async (_, name, confirmation, message) => {
        const user = userEvent.setup();
        await toRegister(user);
        await user.type(email(), 'new@example.com');
        await user.type(username(), name);
        await user.type(password(), 'secret123');
        await user.type(confirm(), confirmation);
        await user.click(submit());
        expect(within(modal()).getByText(message)).toBeInTheDocument();
        expect(auth.register).not.toHaveBeenCalled();
      });

      it('clears the passwords but keeps the email when switching between sign-in and sign-up', async () => {
        const user = userEvent.setup();
        const box = await open(user);
        await user.type(email(), 'keep@example.com');
        await user.type(password(), 'secret123');
        await user.click(box.getByRole('button', { name: /sign up/i }));
        expect(email()).toHaveValue('keep@example.com');
        expect(password()).toHaveValue('');
        await user.click(within(modal()).getByRole('button', { name: /already have an account\? sign in/i }));
        expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
        expect(within(modal()).queryByPlaceholderText('Choose a username')).not.toBeInTheDocument();
      });
    });

    it('shows and hides the password', async () => {
      const user = userEvent.setup();
      await open(user);
      expect(password()).toHaveAttribute('type', 'password');
      await user.click(password().nextElementSibling);
      expect(password()).toHaveAttribute('type', 'text');
      await user.click(password().nextElementSibling);
      expect(password()).toHaveAttribute('type', 'password');
    });

    it('signs in with Google and closes on success', async () => {
      const user = userEvent.setup();
      const box = await open(user);
      await user.click(box.getByRole('button', { name: 'Sign in with Google' }));
      expect(auth.googleSignIn).toHaveBeenCalledTimes(1);
      expect(modal()).toBeNull();
    });

    it('stays open when Google sign-in does not finish', async () => {
      const user = userEvent.setup();
      auth.googleSignIn.mockResolvedValue({ success: false });
      const box = await open(user);
      await user.click(box.getByRole('button', { name: 'Sign in with Google' }));
      expect(modal()).toBeInTheDocument();
      expect(within(modal()).getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    });

    it('opens the password reset with the email already filled in, and comes back', async () => {
      const user = userEvent.setup();
      const box = await open(user);
      await user.type(email(), 'alice@example.com');
      await user.click(box.getByRole('button', { name: 'Forgot password?' }));
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(within(modal()).getByLabelText('Email')).toHaveValue('alice@example.com');
      await user.click(within(modal()).getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });

    it('closes with the × button or a click outside, but not a click inside', async () => {
      const user = userEvent.setup();
      await open(user);
      await user.click(within(modal()).getByRole('heading', { name: 'Welcome Back' }));
      expect(modal()).toBeInTheDocument();
      await user.click(within(modal()).getByRole('button', { name: '×' }));
      expect(modal()).toBeNull();

      await user.click(within(header()).getByRole('button', { name: 'Sign In' }));
      await user.click(modal().parentElement); // the dimmed overlay
      expect(modal()).toBeNull();
    });
  });

  describe('footer', () => {
    it('links to every live certification site through onThisName', () => {
      render(<App />);
      const column = within(footer()).getByRole('heading', { name: 'Certifications' }).parentElement;
      const hrefs = within(column).getAllByRole('link').map((a) => a.getAttribute('href'));
      expect(hrefs.sort()).toEqual(live.map((c) => onPageName(c.url)).sort());
    });

    it('links to every coding course through onThisName, and to the GIS page', () => {
      render(<App />);
      const column = within(within(footer()).getByRole('heading', { name: 'Coding courses' }).parentElement);
      for (const c of COURSES) expect(column.getByRole('link', { name: c.title })).toHaveAttribute('href', onPageName(c.url));
      expect(column.getByRole('link', { name: /gis courses/i })).toHaveAttribute('href', `${import.meta.env.BASE_URL}gis/`);
    });

    it('lists the other courses: a link to the site once live, to the #courses card until then', () => {
      render(<App />);
      const column = within(within(footer()).getByRole('heading', { name: 'Coding courses' }).parentElement);
      for (const c of OTHER_COURSES) {
        if (c.live) expect(column.getByRole('link', { name: c.title })).toHaveAttribute('href', onPageName(c.url));
        else expect(column.getByRole('link', { name: `${c.title} (coming soon)` })).toHaveAttribute('href', `${import.meta.env.BASE_URL}#courses`);
      }
    });

    it('links to the terms and privacy pages and says it is not affiliated with AWS', () => {
      render(<App />);
      expect(within(footer()).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms.html');
      expect(within(footer()).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy.html');
      expect(footer()).toHaveTextContent(/not affiliated with amazon web services/i);
    });
  });

  describe('the /gis/ page', () => {
    const gisH1 = () => screen.queryByRole('heading', { level: 1, name: new RegExp(GIS_PAGE.headline.highlight) });
    const onHome = () => screen.queryByRole('heading', { name: 'AWS Certifications', level: 2 });

    it.each(['/gis/', '/gis', '/gis/index.html'])('shows the GIS page instead of the homepage at %s', (path) => {
      go(path);
      render(<App />);
      expect(gisH1()).toBeInTheDocument();
      expect(onHome()).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Simple Plans' })).not.toBeInTheDocument();
      // header and footer are shared
      expect(header()).toBeInTheDocument();
      expect(footer()).toBeInTheDocument();
    });

    it.each(['/gisx', '/gis/other', '/about/gis/'])('stays on the homepage at %s', (path) => {
      go(path);
      render(<App />);
      expect(onHome()).toBeInTheDocument();
      expect(gisH1()).not.toBeInTheDocument();
    });

    it('points the header links at the homepage sections from the GIS page', () => {
      go('/gis/');
      render(<App />);
      const base = import.meta.env.BASE_URL;
      expect(within(header()).getByRole('link', { name: 'Certifications' })).toHaveAttribute('href', `${base}#certifications`);
      expect(within(header()).getByRole('link', { name: 'Plans' })).toHaveAttribute('href', `${base}#plans`);
    });

    it('follows the address when the browser goes back, or a Google sign-in moves it', () => {
      render(<App />);
      expect(onHome()).toBeInTheDocument();

      go('/gis/');
      act(() => { window.dispatchEvent(new Event('hub:locationchange')); });
      expect(gisH1()).toBeInTheDocument();

      go('/');
      act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
      expect(onHome()).toBeInTheDocument();
      expect(gisH1()).not.toBeInTheDocument();
    });

    it('still lets a visitor sign in from the GIS page', async () => {
      go('/gis/');
      render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Sign In' }));
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });
  });

  describe('signed out by the device limit', () => {
    const MESSAGE = 'You were signed out on this browser because your account signed in on another device.';

    it('says why under the header, and again in the sign-in modal', async () => {
      const user = userEvent.setup();
      setAuth({ signOutMessage: MESSAGE });
      render(<App />);
      const banner = screen.getByText(MESSAGE).closest('.signed-out-banner');
      expect(banner).toBeInTheDocument();
      await user.click(within(banner).getByRole('button', { name: 'Sign in' }));
      expect(within(modal()).getByText(MESSAGE)).toBeInTheDocument();
    });

    it('can be dismissed', async () => {
      const user = userEvent.setup();
      setAuth({ signOutMessage: MESSAGE });
      render(<App />);
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(auth.dismissSignOutReason).toHaveBeenCalledTimes(1);
    });

    it('shows nothing after an ordinary sign-out', () => {
      render(<App />);
      expect(screen.queryByText(/another device/)).not.toBeInTheDocument();
    });
  });

  // The header wraps onto one to three rows, so its height is measured, never assumed: html's scroll-padding-top
  // (global.css) reads --hub-header-height, and every jump and keyboard-focus scroll stops below the header.
  describe('room below the sticky header', () => {
    let headerHeight;
    const root = document.documentElement;
    const published = () => root.style.getPropertyValue('--hub-header-height');
    beforeEach(() => {
      headerHeight = 71;
      // jsdom has no layout: give the header a height and everything else none
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
        const height = this.tagName === 'HEADER' ? headerHeight : 0;
        return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON() {} };
      });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      root.style.removeProperty('--hub-header-height');
    });

    it('publishes the header height, follows it when the header re-wraps, and stops watching when it goes away', () => {
      const observers = [];
      vi.stubGlobal('ResizeObserver', class {
        constructor(callback) { this.callback = callback; this.watched = []; this.live = true; observers.push(this); }
        observe(el) { this.watched.push(el); }
        disconnect() { this.live = false; }
      });
      const { unmount } = render(<App />);
      expect(published()).toBe('71px');
      const watcher = observers.find((o) => o.live && o.watched.includes(header()));
      expect(watcher).toBeDefined();

      headerHeight = 151; // signed in on a laptop: two rows
      act(() => watcher.callback([]));
      expect(published()).toBe('151px');

      unmount();
      expect(observers.filter((o) => o.watched.length).every((o) => !o.live)).toBe(true);
    });

    it('still publishes the height once in a browser without ResizeObserver', () => {
      vi.stubGlobal('ResizeObserver', undefined);
      render(<App />);
      expect(published()).toBe('71px');
    });

    it('Settings → "See plans" leaves the motion to the page, so reduced-motion visitors get no glide', async () => {
      signIn();
      const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
      render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Settings' }));
      expect(await screen.findByText(/Your plan:/)).toHaveTextContent('Free');
      await userEvent.click(screen.getByRole('button', { name: 'See plans' }));
      await waitFor(() => expect(scrolled.mock.contexts.some((el) => el.id === 'plans')).toBe(true));
      for (const [options] of scrolled.mock.calls) expect(options?.behavior).toBeUndefined();
    });
  });

  // The sections are drawn after the browser has looked for the #hash, so the page jumps there itself, once.
  describe('opening the page at a section (/#plans)', () => {
    let scrolled;
    beforeEach(() => {
      scrolled = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    });
    const jumpedTo = () => scrolled.mock.contexts.map((el) => el.id);
    // Longer than the two frames + fonts + two frames the page waits before jumping
    const settle = () => act(() => new Promise((resolve) => { setTimeout(resolve, 150); }));
    // jsdom has no navigation timing; stand one in for a reload or a Back/Forward visit
    const visitType = (type) => {
      const real = Object.getOwnPropertyDescriptor(performance, 'getEntriesByType');
      Object.defineProperty(performance, 'getEntriesByType', {
        configurable: true, writable: true, value: (kind) => (kind === 'navigation' ? [{ type }] : []),
      });
      return () => (real ? Object.defineProperty(performance, 'getEntriesByType', real) : delete performance.getEntriesByType);
    };

    it.each(['certifications', 'courses', 'about', 'plans', 'faq', 'resources', 'newsletter'])(
      'lands on #%s, from its top, once',
      async (id) => {
        go(`/#${id}`);
        render(<App />);
        await waitFor(() => expect(jumpedTo()).toContain(id));
        await settle();
        expect(jumpedTo()).toEqual([id]);
        expect(scrolled.mock.calls[0][0]).toEqual({ block: 'start' });
      },
    );

    it.each([
      ['a name that is not on the page', '/#nothing-here'],
      ['#readiness, which the readiness check scrolls to itself', '/#readiness'],
      ['a broken address', '/#%E0%A4%A'],
      ['no hash at all', '/'],
    ])('does nothing for %s', async (_, path) => {
      go(path);
      render(<App />);
      await settle();
      expect(jumpedTo()).toEqual([]);
    });

    it('does nothing when the visitor has already scrolled', async () => {
      go('/#plans');
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 400 });
      try {
        render(<App />);
        await settle();
        expect(jumpedTo()).toEqual([]);
      } finally {
        Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
      }
    });

    it.each(['reload', 'back_forward'])("leaves a %s visit to the browser's own scroll restore", async (type) => {
      go('/#plans');
      const restore = visitType(type);
      try {
        render(<App />);
        await settle();
        expect(jumpedTo()).toEqual([]);
      } finally {
        restore();
      }
    });

    it('still lands on the section after a link from another page (a plain visit)', async () => {
      go('/#plans');
      const restore = visitType('navigate');
      try {
        render(<App />);
        await waitFor(() => expect(jumpedTo()).toEqual(['plans']));
      } finally {
        restore();
      }
    });
  });

  // While the loading screen shows, the page is too short for the browser's own scroll restore, so a reload or a
  // Back/Forward visit used to land at the top. The page now keeps the place for each history entry itself.
  describe('coming back to the page (reload, Back/Forward)', () => {
    const STORE = 'hub:scrollY';
    const html = document.documentElement;
    let jumps;
    let undoVisit = () => {};
    const setScrollY = (y) => Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
    // jsdom has no navigation timing; stand one in for the kind of visit
    const visitType = (type) => {
      const real = Object.getOwnPropertyDescriptor(performance, 'getEntriesByType');
      Object.defineProperty(performance, 'getEntriesByType', {
        configurable: true, writable: true, value: (kind) => (kind === 'navigation' ? [{ type }] : []),
      });
      undoVisit = () => (real ? Object.defineProperty(performance, 'getEntriesByType', real) : delete performance.getEntriesByType);
    };
    // Longer than the two frames + fonts + two frames the page waits before its second look
    const settle = () => act(() => new Promise((resolve) => { setTimeout(resolve, 150); }));
    const leave = () => act(() => { window.dispatchEvent(new Event('pagehide')); });
    const saved = () => Object.values(JSON.parse(sessionStorage.getItem(STORE) || '{}'));
    // Open the hub, scroll to y, leave; then come back on a visit of the given type, with the browser at the top.
    const leaveAt = (y) => {
      const first = render(<App />);
      setScrollY(y);
      leave();
      first.unmount();
      setScrollY(0);
    };
    const comeBack = (type) => {
      visitType(type);
      jumps.mockClear();
      return render(<App />);
    };

    beforeEach(() => {
      // jsdom does not scroll: record each jump and move scrollY like a browser would
      jumps = vi.spyOn(window, 'scrollTo').mockImplementation(function scrollTo(a, b) {
        setScrollY(typeof a === 'object' ? a.top : b);
      });
      // jsdom has no history.scrollRestoration either; browsers start every page on 'auto'
      Object.defineProperty(window.history, 'scrollRestoration', { configurable: true, writable: true, value: 'auto' });
    });
    afterEach(() => {
      undoVisit();
      undoVisit = () => {};
      setScrollY(0);
      html.style.scrollBehavior = '';
      delete window.history.scrollRestoration;
    });

    // When its own restore comes up short, Chrome falls back to the #section in the address and glides off there
    it("keeps the browser's own restore out of the way meanwhile, then hands it back", async () => {
      leaveAt(2000);
      visitType('reload');
      holdBrowserRestore(); // what the app does as it loads, before the page has finished parsing
      expect(window.history.scrollRestoration).toBe('manual');
      jumps.mockClear();
      render(<App />);
      expect(window.scrollY).toBe(2000);
      await settle();
      // Back on 'auto': the browser's restore is what makes Back between in-page #section jumps work
      expect(window.history.scrollRestoration).toBe('auto');
    });

    it.each([
      ['a plain visit', 'navigate', 2000],
      ['a reload with no place saved', 'reload', null],
    ])("leaves the browser's own restore alone on %s", (_, type, y) => {
      if (y != null) leaveAt(y);
      visitType(type);
      holdBrowserRestore();
      expect(window.history.scrollRestoration).toBe('auto');
    });

    it.each(['reload', 'back_forward'])('saves the place as the page is left and puts it back on a %s', async (type) => {
      leaveAt(2000);
      expect(saved()).toEqual([2000]);
      comeBack(type);
      // At once, before the first paint, so the top of the page never flashes up
      expect(jumps).toHaveBeenCalledWith({ top: 2000, left: 0, behavior: 'instant' });
      await settle();
      expect(jumps).toHaveBeenCalledTimes(1); // the second look finds the visitor in place
      expect(window.scrollY).toBe(2000);
    });

    it('puts the place back on the /gis/ page too', async () => {
      go('/gis/');
      leaveAt(900);
      comeBack('back_forward');
      expect(jumps).toHaveBeenCalledWith({ top: 900, left: 0, behavior: 'instant' });
    });

    it('jumps straight there, with no glide, even when the page scrolls smoothly', () => {
      html.style.scrollBehavior = 'smooth';
      let during = null;
      leaveAt(1200);
      jumps.mockImplementation(function scrollTo(a) {
        during = html.style.scrollBehavior;
        setScrollY(a.top);
      });
      comeBack('reload');
      expect(jumps.mock.calls[0][0].behavior).toBe('instant');
      expect(during).toBe('auto');
      expect(html.style.scrollBehavior).toBe('smooth'); // the page's own setting comes back
    });

    it('looks again after the fonts, in case the page moved under the visitor', async () => {
      leaveAt(2000);
      // The first jump is undone (the browser put the page at the top again, say); the second look fixes it
      jumps.mockImplementationOnce(() => {});
      comeBack('reload');
      expect(window.scrollY).toBe(0);
      await settle();
      expect(jumps).toHaveBeenCalledTimes(2);
      expect(window.scrollY).toBe(2000);
    });

    it.each([
      ['the wheel', () => new WheelEvent('wheel', { deltaY: 120 })],
      ['a touch drag', () => new Event('touchmove')],
      ['a press on the scrollbar', () => new MouseEvent('mousedown')],
      ['Page Down', () => new KeyboardEvent('keydown', { key: 'PageDown' })],
      ['the space bar', () => new KeyboardEvent('keydown', { key: ' ' })],
    ])('stops once the visitor scrolls themselves (%s)', async (_, event) => {
      leaveAt(2000);
      jumps.mockImplementationOnce(() => {});
      comeBack('reload');
      act(() => { window.dispatchEvent(event()); });
      await settle();
      expect(jumps).toHaveBeenCalledTimes(1); // no second jump over the visitor's own scrolling
    });

    // Moving focus can scroll the focused element into view; pulling the page back would hide it again
    it("stops at a Tab press too, so a keyboard visitor's focus is never pulled out of view", async () => {
      leaveAt(2000);
      jumps.mockImplementationOnce(() => {});
      comeBack('reload');
      act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })); });
      await settle();
      expect(jumps).toHaveBeenCalledTimes(1);
    });

    // Safari on iOS 27 slides the page by itself a moment after a reload, after the second look
    describe('holding the place for a moment', () => {
      const slide = (y) => act(() => {
        setScrollY(y);
        window.dispatchEvent(new Event('scroll'));
      });

      it('undoes a slide the visitor did not make, after the second look', async () => {
        leaveAt(2000);
        comeBack('reload');
        await settle();
        jumps.mockClear();
        slide(2052);
        expect(jumps).toHaveBeenCalledWith({ top: 2000, left: 0, behavior: 'instant' });
        expect(window.scrollY).toBe(2000);
        slide(7600); // all the way to the #section in the address
        expect(window.scrollY).toBe(2000);
      });

      it('undoes one that comes before the second look too', () => {
        leaveAt(2000);
        comeBack('back_forward');
        jumps.mockClear();
        slide(2030);
        expect(window.scrollY).toBe(2000);
      });

      it.each([
        ['the wheel', () => new WheelEvent('wheel', { deltaY: 120 })],
        ['a touch', () => new Event('touchstart')],
        ['a tap or click', () => new Event('pointerdown')],
        ['any key', () => new KeyboardEvent('keydown', { key: 'Tab' })],
        ['a #section link', () => new HashChangeEvent('hashchange')],
      ])('lets go the moment the visitor acts (%s)', async (_, event) => {
        leaveAt(2000);
        comeBack('reload');
        await settle();
        act(() => { window.dispatchEvent(event()); });
        jumps.mockClear();
        slide(2600);
        expect(jumps).not.toHaveBeenCalled();
        expect(window.scrollY).toBe(2600);
      });

      it('lets go when focus moves (a screen reader or a script focusing a field)', async () => {
        leaveAt(2000);
        comeBack('reload');
        await settle();
        act(() => { document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); });
        jumps.mockClear();
        slide(2600);
        expect(jumps).not.toHaveBeenCalled();
      });

      it('lets go when the app scrolls on purpose (the readiness check bringing itself into view)', async () => {
        leaveAt(2000);
        comeBack('reload');
        await settle();
        letGo();
        jumps.mockClear();
        slide(3400);
        expect(jumps).not.toHaveBeenCalled();
      });

      it('lets go after two seconds', async () => {
        leaveAt(2000);
        comeBack('reload');
        await act(() => new Promise((resolve) => { setTimeout(resolve, 2100); }));
        jumps.mockClear();
        slide(2600);
        expect(jumps).not.toHaveBeenCalled();
      });

      it('lets go when the page goes away', () => {
        leaveAt(2000);
        const page = comeBack('reload');
        page.unmount();
        jumps.mockClear();
        slide(2600);
        expect(jumps).not.toHaveBeenCalled();
      });

      it('holds nothing on a plain visit', async () => {
        leaveAt(2000);
        comeBack('navigate');
        await settle();
        slide(2600);
        expect(jumps).not.toHaveBeenCalled();
      });

      // Safari's scroll anchoring moves the page as the sections above finish drawing. A scroll event reports that a
      // frame late, after it is painted, so the hold also puts the place back from a ResizeObserver, before the paint.
      describe('as the page grows', () => {
        let observers;
        beforeEach(() => {
          observers = [];
          vi.stubGlobal('ResizeObserver', class {
            constructor(callback) { this.callback = callback; this.watched = []; this.live = true; observers.push(this); }
            observe(el) { this.watched.push(el); }
            disconnect() { this.live = false; }
          });
        });
        afterEach(() => { vi.unstubAllGlobals(); });
        const bodyWatchers = () => observers.filter((o) => o.watched.includes(document.body));
        // the page grew and the browser moved it (no scroll event yet)
        const grow = (y) => act(() => {
          setScrollY(y);
          for (const o of bodyWatchers()) if (o.live) o.callback([]);
        });

        it('puts the place back as soon as the page grows, without waiting for a scroll event', async () => {
          leaveAt(2000);
          comeBack('reload');
          await settle();
          jumps.mockClear();
          grow(2052);
          expect(jumps).toHaveBeenCalledWith({ top: 2000, left: 0, behavior: 'instant' });
          expect(window.scrollY).toBe(2000);
        });

        it('stops watching the moment it lets go', async () => {
          leaveAt(2000);
          comeBack('reload');
          await settle();
          expect(bodyWatchers().filter((o) => o.live)).toHaveLength(1);
          act(() => { window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 })); });
          expect(bodyWatchers().filter((o) => o.live)).toHaveLength(0);
          jumps.mockClear();
          grow(2600);
          expect(jumps).not.toHaveBeenCalled();
        });

        it('stops watching when the page goes away', () => {
          leaveAt(2000);
          const page = comeBack('reload');
          page.unmount();
          expect(bodyWatchers().filter((o) => o.live)).toHaveLength(0);
        });

        it('watches nothing on a plain visit', async () => {
          leaveAt(2000);
          comeBack('navigate');
          await settle();
          expect(bodyWatchers()).toHaveLength(0);
        });

        // With a #section in the address, holding anchoring's move off this early sets Safari gliding to the section,
        // so there the scroll events alone hold the place.
        it('leaves a reload of a #section address to the scroll events', async () => {
          go('/#plans');
          leaveAt(2000);
          comeBack('reload');
          await settle();
          expect(bodyWatchers()).toHaveLength(0);
          slide(2052);
          expect(window.scrollY).toBe(2000);
        });

        it('still holds the place by scroll events in a browser without ResizeObserver', async () => {
          vi.stubGlobal('ResizeObserver', undefined);
          leaveAt(2000);
          comeBack('reload');
          await settle();
          slide(2052);
          expect(window.scrollY).toBe(2000);
        });
      });
    });

    it('does nothing when the browser already put the visitor back', async () => {
      leaveAt(2000);
      setScrollY(2000);
      comeBack('reload');
      await settle();
      expect(jumps).not.toHaveBeenCalled();
    });

    it('leaves a plain visit (a link, a typed address) at the top, even with a place saved', async () => {
      leaveAt(2000);
      comeBack('navigate');
      await settle();
      expect(jumps).not.toHaveBeenCalled();
    });

    it('does nothing on a return visit with no place saved', async () => {
      comeBack('reload');
      await settle();
      expect(jumps).not.toHaveBeenCalled();
    });

    it('keeps a place for each history entry, even two with the same address', async () => {
      const page = render(<App />);
      setScrollY(2000);
      leave();
      // A new entry for the same page (an in-page link, here back to the same address), left further up
      window.history.pushState({}, '', '/');
      act(() => { window.dispatchEvent(new Event('hashchange')); });
      setScrollY(500);
      leave();
      expect(saved().sort()).toEqual([2000, 500].sort());
      // Back to the first entry, then reload it: it gets its own place, not the newer one
      await act(() => new Promise((resolve) => {
        window.addEventListener('popstate', resolve, { once: true });
        window.history.back();
      }));
      page.unmount();
      setScrollY(0);
      comeBack('reload');
      expect(jumps).toHaveBeenCalledWith({ top: 2000, left: 0, behavior: 'instant' });
    });

    it('forgets the place when the page is left from Settings, which a reload does not reopen', async () => {
      signIn();
      leaveAt(2000);
      const page = render(<App />);
      await userEvent.click(within(header()).getByRole('button', { name: 'Settings' }));
      setScrollY(700);
      leave();
      expect(saved()).toEqual([]);
      page.unmount();
      setScrollY(0);
      comeBack('reload');
      await settle();
      expect(jumps).not.toHaveBeenCalled();
    });

    it('never keeps more than 30 places', () => {
      const old = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`old${i}`, i]));
      sessionStorage.setItem(STORE, JSON.stringify(old));
      leaveAt(2000);
      const store = JSON.parse(sessionStorage.getItem(STORE));
      expect(Object.keys(store)).toHaveLength(30);
      expect(Object.values(store)).toContain(2000); // this page's place is the newest, so it stays
      expect(store.old0).toBeUndefined(); // the oldest go first
    });

    it('carries on without a fuss when the browser blocks storage', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
      expect(() => leaveAt(2000)).not.toThrow();
      comeBack('reload');
      await settle();
      expect(jumps).not.toHaveBeenCalled();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    describe('#readiness in the address', () => {
      const readinessWait = () => act(() => new Promise((resolve) => { setTimeout(resolve, 400); }));

      it('a plain visit still scrolls to the readiness check', async () => {
        go('/#readiness');
        visitType('navigate');
        render(<App />);
        await readinessWait();
        expect(jumps).toHaveBeenCalled();
      });

      it.each(['reload', 'back_forward'])('a %s does not pull the visitor back up to the check', async (type) => {
        go('/#readiness');
        leaveAt(3000);
        comeBack(type);
        await readinessWait();
        expect(jumps.mock.calls.map(([a]) => a.top)).toEqual([3000]);
      });
    });
  });
});
