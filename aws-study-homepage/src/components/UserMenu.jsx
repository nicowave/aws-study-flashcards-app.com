import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const UserMenu = ({ onLoginClick }) => {
  const { user, userData, isAuthenticated, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (loading) {
    return <div className="user-menu-skeleton" />;
  }

  if (!isAuthenticated) {
    return (
      <button className="login-btn" onClick={onLoginClick}>
        <UserIcon size={18} />
        <span>Sign In</span>
      </button>
    );
  }

  const displayName = user?.displayName || userData?.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">{initials}</div>
        <span className="user-name">{displayName}</span>
        <ChevronDownIcon size={14} />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-avatar large">{initials}</div>
            <div className="user-info">
              <span className="user-display-name">{displayName}</span>
              {userData?.stats && (
                <span className="user-stats">
                  Level {userData.stats.level || 1} • {userData.stats.totalXp || 0} XP
                </span>
              )}
            </div>
          </div>
          <div className="user-menu-divider" />
          <button className="user-menu-item logout" onClick={handleLogout}>
            <LogoutIcon size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
