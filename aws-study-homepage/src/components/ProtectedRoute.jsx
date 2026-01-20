import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';

// Loading spinner component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Protected Route wrapper - requires authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authChecked } = useAuth();

  // Show loading while checking auth state
  if (loading || !authChecked) {
    return <LoadingScreen />;
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // User is authenticated, render children
  return children;
};

export default ProtectedRoute;
