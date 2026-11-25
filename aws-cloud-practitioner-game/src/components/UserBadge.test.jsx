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
    userData: { displayName: 'Sam' },
    isAuthenticated: true,
    isGuest: false,
    logout,
    ...overrides,
  });
};

const openMenu = (user) => user.click(screen.getByRole('button', { expanded: false }));

beforeEach(() => signedIn());

describe('UserBadge', () => {
  it('renders nothing when signed out and not a guest', () => {
    useAuth.mockReturnValue({ user: null, userData: null, isAuthenticated: false, isGuest: false, logout: vi.fn() });
    const { container } = render(<UserBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('guest', () => {
    beforeEach(() => signedIn({ user: null, userData: null, isAuthenticated: false, isGuest: true }));

    it('says progress is not saved', () => {
      render(<UserBadge />);
      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.getByText('Progress not saved')).toBeInTheDocument();
    });

    it('leaves guest mode through logout', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();
      render(<UserBadge onLogout={onLogout} />);
      await user.click(screen.getByTitle('Exit guest mode'));
      expect(logout).toHaveBeenCalledTimes(1);
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('signed in', () => {
    it('shows the display name, its initial and the verified mark', () => {
      render(<UserBadge />);
      const button = screen.getByRole('button', { expanded: false });
      expect(button).toHaveTextContent('Sam');
      expect(button).toHaveTextContent('Verified');
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('falls back to the part of the email before the @ when there is no name', () => {
      signedIn({ userData: {} });
      render(<UserBadge />);
      expect(screen.getByText('sam.learner')).toBeInTheDocument();
    });

    it('shows an emoji avatar on its saved background colour', () => {
      // a current-palette colour (not one of the pre-repaint colours) is shown unchanged
      signedIn({ userData: { displayName: 'Sam', avatar: { type: 'emoji', value: '🚀', bgColor: '#3fb950' } } });
      render(<UserBadge />);
      expect(screen.getByText('🚀')).toHaveStyle({ backgroundColor: '#3fb950' });
    });

    it('shows an initials avatar on its saved background colour', () => {
      signedIn({ userData: { displayName: 'sam', avatar: { type: 'initials', value: null, bgColor: '#3fb950' } } });
      render(<UserBadge />);
      expect(screen.getByText('S')).toHaveStyle({ backgroundColor: '#3fb950' });
    });

    it('shows an uploaded or pattern avatar as an image', () => {
      signedIn({ userData: { displayName: 'Sam', avatar: { type: 'image', value: 'data:image/jpeg;base64,AAAA', bgColor: '#3fb950' } } });
      render(<UserBadge />);
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', 'data:image/jpeg;base64,AAAA');
    });

    it('opens a menu with the email and verification state, and closes it again', async () => {
      const user = userEvent.setup();
      render(<UserBadge />);
      expect(screen.queryByText('sam.learner@example.com')).not.toBeInTheDocument();

      await openMenu(user);
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
      expect(screen.getByText('sam.learner@example.com')).toBeInTheDocument();
      expect(screen.getByText('Email Verified')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { expanded: true }));
      expect(screen.queryByText('sam.learner@example.com')).not.toBeInTheDocument();
    });

    it('marks an unverified email in the menu', async () => {
      signedIn({ user: { uid: 'u1', email: 'sam@example.com', emailVerified: false } });
      const user = userEvent.setup();
      render(<UserBadge />);
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
      await openMenu(user);
      expect(screen.getByText('Not Verified')).toBeInTheDocument();
    });

    it('offers Settings and View Stats only when the app handles them, closing the menu', async () => {
      const onOpenSettings = vi.fn();
      const onViewStats = vi.fn();
      const user = userEvent.setup();
      const { unmount } = render(<UserBadge onOpenSettings={onOpenSettings} onViewStats={onViewStats} />);

      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Settings/ }));
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: /Settings/ })).not.toBeInTheDocument();

      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /View Stats/ }));
      expect(onViewStats).toHaveBeenCalledTimes(1);
      unmount();

      render(<UserBadge />);
      await openMenu(user);
      expect(screen.queryByRole('button', { name: /Settings/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View Stats/ })).not.toBeInTheDocument();
    });

    it('signs out, then tells the app', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();
      render(<UserBadge onLogout={onLogout} />);
      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Sign Out/ }));
      expect(logout).toHaveBeenCalledTimes(1);
      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: /Sign Out/ })).not.toBeInTheDocument();
    });
  });
});
