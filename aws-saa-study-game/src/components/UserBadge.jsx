import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GearIcon, StatsIcon } from './Icons';
import './UserBadge.css';

const CheckmarkIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const GuestIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SignOutIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Render avatar based on Firestore userData
const AvatarDisplay = ({ userData, user, size = 32, fontSize = 13 }) => {
  const avatar = userData?.avatar;
  const displayName = userData?.displayName || user?.displayName || user?.email || '?';
  const initial = displayName[0]?.toUpperCase() || '?';

  if (avatar?.type === 'emoji' && avatar.value) {
    return (
      <div className="user-avatar" style={{ backgroundColor: avatar.bgColor || '#FF9900', fontSize: Math.round(size * 0.55) }}>
        {avatar.value}
      </div>
    );
  }

  if ((avatar?.type === 'pattern' || avatar?.type === 'image') && avatar.value) {
    return (
      <div className="user-avatar" style={{ backgroundColor: avatar.bgColor || '#FF9900' }}>
        <img src={avatar.value} alt="Avatar" />
      </div>
    );
  }

  if (avatar?.type === 'initials' && avatar.bgColor) {
    return (
      <div className="user-avatar" style={{ backgroundColor: avatar.bgColor, fontSize }}>
        {initial}
      </div>
    );
  }

  // Default: orange gradient with initials
  return (
    <div className="user-avatar" style={{ fontSize }}>
      {initial}
    </div>
  );
};

const UserBadge = ({ onLogout, onOpenSettings, onViewStats }) => {
  const { user, userData, isAuthenticated, isGuest, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated && !isGuest) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    onLogout?.();
  };

  // Guest mode
  if (isGuest) {
    return (
      <div className="user-badge guest-mode">
        <div className="user-badge-content">
          <div className="user-avatar guest">
            <GuestIcon size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">Guest</span>
            <span className="user-status guest">Progress not saved</span>
          </div>
        </div>
        <button
          className="btn-sign-out-small"
          onClick={handleLogout}
          title="Exit guest mode"
        >
          <SignOutIcon size={14} />
        </button>
      </div>
    );
  }

  // Authenticated user
  const email = user?.email || '';
  const displayName = userData?.displayName || user?.displayName || email.split('@')[0];
  const isVerified = user?.emailVerified;

  return (
    <div className="user-badge">
      <button
        className="user-badge-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <AvatarDisplay userData={userData} user={user} size={32} fontSize={13} />
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          {isVerified && (
            <span className="user-status verified">
              <CheckmarkIcon size={12} />
              Verified
            </span>
          )}
        </div>
        <ChevronDownIcon size={16} />
      </button>

      {isOpen && (
        <>
          <div className="user-badge-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-badge-dropdown">
            <div className="dropdown-header">
              <AvatarDisplay userData={userData} user={user} size={40} fontSize={16} />
              <div className="dropdown-info">
                <div className="dropdown-name">{displayName}</div>
                <div className="dropdown-email">{email}</div>
                {isVerified ? (
                  <div className="dropdown-status verified">
                    <CheckmarkIcon size={12} />
                    Email Verified
                  </div>
                ) : (
                  <div className="dropdown-status unverified">
                    Not Verified
                  </div>
                )}
              </div>
            </div>
            <div className="dropdown-divider" />
            {onOpenSettings && (
              <button
                className="dropdown-item"
                onClick={() => { setIsOpen(false); onOpenSettings(); }}
              >
                <GearIcon size={16} />
                Settings
              </button>
            )}
            {onViewStats && (
              <button
                className="dropdown-item"
                onClick={() => { setIsOpen(false); onViewStats(); }}
              >
                <StatsIcon size={16} />
                View Stats
              </button>
            )}
            {(onOpenSettings || onViewStats) && <div className="dropdown-divider" />}
            <button
              className="dropdown-item"
              onClick={handleLogout}
            >
              <SignOutIcon size={16} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserBadge;
