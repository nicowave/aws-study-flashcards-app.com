import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CloseIcon } from './Icons';
import './AuthScreen.css';

const UserBadge = ({ onLogout }) => {
  const { user, userData, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  const displayName = user?.displayName || userData?.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <div className="user-badge">
      <div className="avatar">{initials}</div>
      <span className="username">{displayName}</span>
      <button 
        className="logout-btn" 
        onClick={handleLogout}
        title="Sign out"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
};

export default UserBadge;
