import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useAuth } from './context/AuthContext';
import { getPlan, startCheckout, openBillingPortal, PRO_TRIAL_DAYS } from './services/billing';
import { certifications, categories } from './data/certifications';
import { COURSES } from './data/courses';
import { GIS_PAGE } from './data/gis';
import { HERO_SLIDES } from './data/heroSlides';
import { PROMOTIONS } from './services/offers';

// --- Boundaries -------------------------------------------------------------
// Sign-in state comes from a fake AuthContext; each test sets what it needs.
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}));

// Billing is the money boundary: never reach Stripe. BILLING_ENABLED and the Pro
// label are build variables, so they are getters a test can flip.
const billing = vi.hoisted(() => ({ enabled: true, label: '$39/yr' }));
vi.mock('./services/billing', async (importOriginal) => {
  const { PRO_TRIAL_DAYS: days } = await importOriginal();
  return {
    get BILLING_ENABLED() { return billing.enabled; },
    get PRO_PRICE_LABEL() { return billing.label; },
    PRO_TRIAL_DAYS: days,
    getPlan: vi.fn(),
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

// Pretend the page was opened on the new name, so we can see links go through onThisName.
vi.mock('./config/auth.config', async (importOriginal) => ({
  ...(await importOriginal()),
  onThisName: (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com'),
}));

// One coming-soon cert next to the real data, so that path is covered even while
// none is coming soon. It carries a price to prove a coming-soon card never shows one.
vi.mock('./data/certifications', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    certifications: [...actual.certifications, {
      id: 'test-coming-soon', name: 'Test Coming Soon Certification', code: 'TST-C01', level: 'Professional',
      category: 'professional', description: 'A fixture.', url: 'https://test.aws-study-flashcards-app.com',
      price: '$99.99', status: 'coming-soon', color: '#888888', examLength: '1 minute', questions: '1 question',
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
const onNewName = (url) => url.replace('aws-study-flashcards-app.com', 'levelupstudyhub.com');

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
  billing.label = '$39/yr';
  setAuth();
  vi.mocked(getPlan).mockReset().mockResolvedValue(null);
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

    // BUG (data): the Solutions Architect game ships the timed exam simulator (ExamMode in
    // aws-saa-study-game), and the hero says "4 Timed Exam Simulators" and the FAQ says every
    // certification has one, but certifications.js leaves 'Exam Simulator' out of SAA's features,
    // so its card is the only live card without the tag.
    it.fails('lists the Exam Simulator on every live cert card, matching the hero count', () => {
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
      expect(card.getByText(cert.price)).toBeInTheDocument();
      expect(certCard(cert.name)).toHaveTextContent(`One-time unlock ${cert.price}`);
      for (const f of cert.features) expect(card.getByText(f)).toBeInTheDocument();
      expect(card.queryByText('Coming Soon')).not.toBeInTheDocument();
    });

    it.each(live.map((c) => [c.name, c]))('%s: "Start Free" goes to its site through onThisName; "AWS Docs" opens the official page', (_, cert) => {
      render(<App />);
      const card = within(certCard(cert.name));
      expect(card.getByRole('link', { name: /start free/i })).toHaveAttribute('href', onNewName(cert.url));
      const docs = card.getByRole('link', { name: /aws docs/i });
      expect(docs).toHaveAttribute('href', cert.officialUrl);
      expect(docs).toHaveAttribute('target', '_blank');
      expect(docs).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('gives every live cert its own site and a dollar price', () => {
      expect(new Set(live.map((c) => c.url)).size).toBe(live.length);
      for (const c of live) {
        expect(c.url).toMatch(/^https:\/\/[a-z-]+\.aws-study-flashcards-app\.com$/);
        expect(c.price).toMatch(/^\$\d+\.\d{2}$/);
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
        expect(card.queryByText(cert.price)).not.toBeInTheDocument();
        expect(el).not.toHaveTextContent(/one-time unlock/i);
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
    it('shows the four plans in order: Guest, Free account, One Certification, Pro', () => {
      render(<App />);
      const names = [...plans().querySelectorAll('.plan-name')].map((n) => n.textContent);
      expect(names).toEqual(['Guest Preview', 'Free Account', 'One Certification', 'Pro']);
    });

    it('sends Guest and Free account to the Cloud Practitioner site through onThisName', () => {
      render(<App />);
      const cloud = certifications.find((c) => c.id === 'cloud-practitioner');
      expect(within(planCard('Guest Preview')).getByRole('link', { name: /try it now/i }))
        .toHaveAttribute('href', onNewName(cloud.url));
      expect(within(planCard('Free Account')).getByRole('link', { name: /create free account/i }))
        .toHaveAttribute('href', onNewName(cloud.url));
      expect(within(planCard('Guest Preview')).getByText('Free')).toBeInTheDocument();
      expect(within(planCard('Free Account')).getByText('Free')).toBeInTheDocument();
    });

    it('prices One Certification from the cheapest to the dearest live cert, by level', () => {
      render(<App />);
      const prices = live.map((c) => cents(c.price));
      const fmt = (c) => `$${(c / 100).toFixed(2)}`;
      const card = planCard('One Certification');
      expect(within(card).getByText(`${fmt(Math.min(...prices))}–${fmt(Math.max(...prices))}`)).toBeInTheDocument();
      const byLevel = (level) => live.find((c) => c.level === level).price;
      expect(card).toHaveTextContent(`Foundational ${byLevel('Foundational')} · Associate ${byLevel('Associate')}`);
      for (const level of ['Foundational', 'Associate']) {
        expect(new Set(live.filter((c) => c.level === level).map((c) => c.price)).size).toBe(1);
      }
      expect(within(card).getByRole('link', { name: /choose a certification/i })).toHaveAttribute('href', '#certifications');
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
        expect(card.queryByText(billing.label)).not.toBeInTheDocument();
        expect(getPlan).not.toHaveBeenCalled();
      });

      it('shows the Pro price and the 7-day trial terms to a signed-out visitor', () => {
        render(<App />);
        const card = within(proCard());
        expect(card.getByText(billing.label)).toBeInTheDocument();
        expect(card.getByText(`First ${PRO_TRIAL_DAYS} days free`)).toBeInTheDocument();
        expect(proCard()).toHaveTextContent(`Card required. Cancel before day ${PRO_TRIAL_DAYS} and you pay nothing`);
        expect(proCard()).toHaveTextContent(/renews yearly\. one free trial per person/i);
        expect(getPlan).not.toHaveBeenCalled();
      });

      it('falls back to the word "Pro" when no price label is set', () => {
        billing.label = '';
        render(<App />);
        expect(within(proCard()).getAllByText('Pro')).toHaveLength(2); // name + price line
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
        await act(async () => {}); // getPlan resolves
        expect(getPlan).toHaveBeenCalledWith({ forceRefresh: false });
        expect(within(proCard()).getByText(`First ${PRO_TRIAL_DAYS} days free`)).toBeInTheDocument();
        const button = within(proCard()).getByRole('button', { name: /start free trial/i });
        await userEvent.click(button);
        expect(startCheckout).toHaveBeenCalledTimes(1);
        expect(startCheckout).toHaveBeenCalledWith('all-access');
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

      it('refreshes the plan from a fresh token when coming back from checkout', async () => {
        go('/?checkout=success');
        signIn();
        render(<App />);
        await act(async () => {});
        expect(getPlan).toHaveBeenCalledWith({ forceRefresh: true });
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

    it('shows each live cert at the sale price with its full price struck through', () => {
      at(promo.start + MINUTE);
      render(<App />);
      for (const cert of live) {
        const el = certCard(cert.name);
        expect(within(el).getByText(discounted(cert.price, promo.single))).toBeInTheDocument();
        expect(el.querySelector('s')).toHaveTextContent(cert.price);
      }
    });

    it('shows the sale range on One Certification and the bundle discount on Pro', () => {
      at(promo.start + MINUTE);
      render(<App />);
      expect(planCard('One Certification')).toHaveTextContent(
        `${promo.label}: ${promo.single}% off, so ${discounted('$9.99', promo.single)}–${discounted('$14.99', promo.single)}`,
      );
      expect(proCard()).toHaveTextContent(`${promo.label}: ${promo.bundle}% off your first year until ${promo.ends}`);
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
      for (const cert of live) expect(within(certCard(cert.name)).getByText(cert.price)).toBeInTheDocument();
    });

    it('checks out the same plan during a sale (the server applies the discount)', async () => {
      at(promo.start + MINUTE);
      signIn();
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<App />);
      await act(async () => {});
      await userEvent.click(within(proCard()).getByRole('button', { name: /start free trial/i }));
      expect(startCheckout).toHaveBeenCalledWith('all-access');
    });
  });

  describe('Developer Path on the homepage', () => {
    it('sends a signed-out visitor who wants the bundle to the sign-in box', async () => {
      render(<App />);
      await userEvent.click(within(section('The Developer Path')).getByRole('button', { name: 'Sign in to get it' }));
      expect(modal()).toBeInTheDocument();
      expect(startCheckout).not.toHaveBeenCalled();
    });

    it('starts developer-path checkout for a signed-in learner', async () => {
      signIn();
      vi.mocked(startCheckout).mockReturnValue(new Promise(() => {}));
      render(<App />);
      await userEvent.click(within(section('The Developer Path')).getByRole('button', { name: 'Get the Developer Path' }));
      expect(startCheckout).toHaveBeenCalledWith('developer-path');
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
      expect(ai).toHaveAttribute('href', onNewName(certifications.find((c) => c.id === 'ai-practitioner').url));
      const cloud = within(welcome).getByRole('link', { name: /cloud practitioner/i });
      expect(cloud).toHaveTextContent('Lvl 2 · 90%');
      expect(cloud).toHaveAttribute('href', onNewName(certifications.find((c) => c.id === 'cloud-practitioner').url));
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
      expect(hrefs.sort()).toEqual(live.map((c) => onNewName(c.url)).sort());
    });

    it('links to every coding course through onThisName, and to the GIS page', () => {
      render(<App />);
      const column = within(within(footer()).getByRole('heading', { name: 'Coding courses' }).parentElement);
      for (const c of COURSES) expect(column.getByRole('link', { name: c.title })).toHaveAttribute('href', onNewName(c.url));
      expect(column.getByRole('link', { name: /gis courses/i })).toHaveAttribute('href', `${import.meta.env.BASE_URL}gis/`);
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
});
