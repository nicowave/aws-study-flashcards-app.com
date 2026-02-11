import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  registerUser,
  loginUser,
  logoutUser,
  signInAsGuest,
  isGuestUser,
  resendVerificationEmail,
  onAuthChange,
  getUserData,
  getStoredUserData,
  syncProgress,
  tryAutoLoginFromCookie,
  signInWithGoogle
} from '../services/sharedAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, requireAuth = false }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const autoLoginAttempted = useRef(false);

  // Listen for auth state changes
  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    let isMounted = true;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;
      console.log('[AuthContext] Auth state changed:', firebaseUser?.email || 'No user');

      if (firebaseUser) {
        setUser(firebaseUser);

        // Check if this is a guest user
        if (firebaseUser.isAnonymous || isGuestUser()) {
          setUserData({ isGuest: true });
        } else {
          // Fetch user data from Firestore
          const result = await getUserData(firebaseUser.uid);
          if (result.success && isMounted) {
            setUserData(result.data);
          }
        }
      } else {
        // Try cross-domain auto-login from shared cookie (only once)
        if (!autoLoginAttempted.current) {
          autoLoginAttempted.current = true;
          const cookieUser = await tryAutoLoginFromCookie();
          if (cookieUser && isMounted) {
            return; // onAuthChange will fire again with the signed-in user
          }
        }
        if (isMounted) {
          setUser(null);
          setUserData(null);
        }
      }

      if (isMounted) {
        setLoading(false);
        setAuthChecked(true);
      }
    });

    // Check for stored user data on mount (for faster initial render)
    const storedUser = getStoredUserData();
    if (storedUser) {
      console.log('[AuthContext] Found stored user:', storedUser.email);
    }

    return () => { isMounted = false; unsubscribe(); };
  }, []);

  // Clear error
  const clearError = () => {
    setError(null);
    setNeedsVerification(false);
  };

  // Register with REAL email (required for verification)
  const register = async (email, password, displayName = null) => {
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    
    console.log('[AuthContext] Registering user:', email);
    
    const result = await registerUser(email, password, displayName);
    
    if (result.success) {
      setNeedsVerification(true);
      console.log('[AuthContext] Registration successful, verification email sent');
    } else {
      setError(result.error);
      console.log('[AuthContext] Registration failed:', result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Login with email
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    
    console.log('[AuthContext] Logging in user:', email);
    
    const result = await loginUser(email, password);
    
    if (result.success) {
      console.log('[AuthContext] Login successful');
    } else {
      setError(result.error);
      if (result.needsVerification) {
        setNeedsVerification(true);
        setUser(result.user); // Store user for resend verification
      }
      console.log('[AuthContext] Login failed:', result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    console.log('[AuthContext] Logging out...');
    
    const result = await logoutUser();
    
    if (result.success) {
      setUser(null);
      setUserData(null);
      console.log('[AuthContext] Logout successful');
    }
    
    setLoading(false);
    return result;
  };

  // Google Sign-In
  const googleSignIn = async () => {
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    console.log('[AuthContext] Attempting Google sign-in...');

    const result = await signInWithGoogle();

    if (result.success) {
      console.log('[AuthContext] Google sign-in successful', result.isNewUser ? '(new user)' : '');
    } else {
      setError(result.error);
      console.log('[AuthContext] Google sign-in failed:', result.error);
    }

    setLoading(false);
    return result;
  };

  // Guest login
  const loginAsGuest = async () => {
    setLoading(true);
    setError(null);
    
    console.log('[AuthContext] Signing in as guest...');
    
    const result = await signInAsGuest();
    
    if (result.success) {
      setUserData({ isGuest: true });
      console.log('[AuthContext] Guest login successful');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Resend verification email
  const resendVerification = async () => {
    console.log('[AuthContext] Resending verification email...');
    const result = await resendVerificationEmail();
    
    if (!result.success) {
      setError(result.error);
    }
    
    return result;
  };

  // Sync progress to cloud
  const syncUserProgress = async (localStats, certId = null) => {
    if (!user || isGuestUser()) {
      console.log('[AuthContext] Cannot sync - no authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    return await syncProgress(user.uid, localStats, certId);
  };

  const value = {
    user,
    userData,
    loading,
    authChecked,
    error,
    needsVerification,
    isAuthenticated: !!user && (user.emailVerified || user.isAnonymous || isGuestUser()),
    isGuest: isGuestUser(),
    register,
    login,
    logout,
    googleSignIn,
    loginAsGuest,
    resendVerification,
    clearError,
    syncUserProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
