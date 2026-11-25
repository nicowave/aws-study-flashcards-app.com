import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserBadge from './UserBadge';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

let logout;
const signedIn = (overrides = {}) => {
  logout = vi.fn().mockResolvedValue(undefined);
  useAuth.mockReturnValue({
    user: { uid: 'u1', email: 'sam.learner@example.com', emailVerified: true },
    isAuthenticated: true,
    isGuest: false,
    logout,
    ...overrides,
  });
};

const badgeButton = () => screen.getByRole('button', { expanded: false });
const openMenu = (user) => user.click(badgeButton());

beforeEach(() => signedIn());

describe('UserBadge', () => {
  it('renders nothing when signed out and not a guest', () => {
    signedIn({ user: null, isAuthenticated: false, isGuest: false });
    const { container } = render(<UserBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('guest', () => {
    beforeEach(() => signedIn({ user: null, isAuthenticated: false, isGuest: true }));

    it('says progress is not saved, with no account menu', () => {
      render(<UserBadge />);
      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.getByText('Progress not saved')).toBeInTheDocument();
      expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    });

    it('leaves guest mode through logout, then tells the page', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();
      render(<UserBadge onLogout={onLogout} />);
      await user.click(screen.getByTitle('Exit guest mode'));
      expect(logout).toHaveBeenCalledTimes(1);
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('signed in', () => {
    it('shows the email, two-letter initials from it and the verified mark', () => {
      render(<UserBadge />);
      const button = badgeButton();
      expect(button).toHaveTextContent('sam.learner@example.com');
      expect(button).toHaveTextContent('SA');
      expect(button).toHaveTextContent('Verified');
    });

    it('shows no verified mark on the badge for an unverified email', () => {
      signedIn({ user: { uid: 'u1', email: 'sam@example.com', emailVerified: false } });
      render(<UserBadge />);
      expect(badgeButton()).not.toHaveTextContent('Verified');
    });

    it('copes with a user that has no email yet', () => {
      signedIn({ user: { uid: 'u1' } });
      render(<UserBadge />);
      expect(badgeButton()).toBeInTheDocument();
    });

    it('opens a menu with the email and verification state, and closes it again', async () => {
      const user = userEvent.setup();
      render(<UserBadge />);
      expect(screen.queryByText('Email Verified')).not.toBeInTheDocument();

      await openMenu(user);
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
      expect(screen.getByText('Email Verified')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Out/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { expanded: true }));
      expect(screen.queryByText('Email Verified')).not.toBeInTheDocument();
    });

    it('closes the menu when clicking outside it', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserBadge />);
      await openMenu(user);
      // the full-screen overlay behind the menu has no role; clicking it is "clicking outside"
      await user.click(container.querySelector('.user-badge-overlay'));
      expect(screen.queryByRole('button', { name: /Sign Out/ })).not.toBeInTheDocument();
      expect(logout).not.toHaveBeenCalled();
    });

    it('marks an unverified email in the menu', async () => {
      signedIn({ user: { uid: 'u1', email: 'sam@example.com', emailVerified: false } });
      const user = userEvent.setup();
      render(<UserBadge />);
      await openMenu(user);
      expect(screen.getByText('Not Verified')).toBeInTheDocument();
      expect(screen.queryByText('Email Verified')).not.toBeInTheDocument();
    });

    it('signs out, closes the menu, then tells the page', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();
      render(<UserBadge onLogout={onLogout} />);
      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Sign Out/ }));
      expect(logout).toHaveBeenCalledTimes(1);
      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: /Sign Out/ })).not.toBeInTheDocument();
    });

    it('signs out without a page callback', async () => {
      const user = userEvent.setup();
      render(<UserBadge />);
      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Sign Out/ }));
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});
