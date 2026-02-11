import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase.config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  resendVerificationEmail as resendVerification,
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    let isMounted = true;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        console.log('[AuthContext] Auth state changed: User logged in -', firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log('[AuthContext] Auth state changed: No user');

        // Try cross-domain auto-login from shared cookie (only once)
        if (!autoLoginAttempted.current) {
          autoLoginAttempted.current = true;
          console.log('[AuthContext] Attempting cross-domain auto-login...');
          const cookieUser = await tryAutoLoginFromCookie();
          if (cookieUser && isMounted) {
            // signInWithCustomToken succeeded — onAuthChange will fire again with the user
            console.log('[AuthContext] Cross-domain auto-login succeeded');
            return; // Don't setLoading(false) yet — wait for the next onAuthChange
          }
        }

        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Register — delegates to sharedAuth
  const register = async (email, password, username = '') => {
    setError(null);
    setLoading(true);

    console.log('[AuthContext] Registering user with email:', email);

    try {
      const result = await registerUser(email, password, username || null);

      if (result.success) {
        console.log('[AuthContext] Registration successful, verification email sent');
      } else {
        setError(result.error);
        console.log('[AuthContext] Registration failed:', result.error);
      }

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  // Login — delegates to sharedAuth
  const login = async (email, password) => {
    setError(null);
    setLoading(true);

    console.log('[AuthContext] Logging in user:', email);

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        console.log('[AuthContext] Login successful');
      } else {
        setError(result.error);
        console.log('[AuthContext] Login failed:', result.error);
      }

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  // Logout — delegates to sharedAuth
  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      const result = await logoutUser();
      if (result.success) {
        setUser(null);
        autoLoginAttempted.current = false; // Reset for next session
        console.log('[AuthContext] Logout successful');
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      throw err;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      const result = await resendVerification();
      if (result.success) {
        console.log('[AuthContext] Verification email resent');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] Failed to resend verification:', err);
      throw err;
    }
  };

  // Google Sign-In
  const googleSignIn = async () => {
    setError(null);
    setLoading(true);

    console.log('[AuthContext] Attempting Google sign-in...');

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        console.log('[AuthContext] Google sign-in successful', result.isNewUser ? '(new user)' : '');
      } else {
        setError(result.error);
        console.log('[AuthContext] Google sign-in failed:', result.error);
      }

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Google sign-in failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Sync local progress to Firestore (game-specific)
  const syncLocalProgress = async (localStats, certId) => {
    if (!user || !localStats) return;

    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', certId);
      await setDoc(progressRef, {
        ...localStats,
        certId,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      console.log('[AuthContext] Progress synced for:', certId);
    } catch (err) {
      console.warn('[AuthContext] Failed to sync progress:', err.message);
    }
  };

  // Load progress from Firestore (game-specific)
  const loadProgress = async (certId) => {
    if (!user) return null;

    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', certId);
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        console.log('[AuthContext] Progress loaded for:', certId);
        return progressDoc.data();
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to load progress:', err.message);
    }
    return null;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    googleSignIn,
    clearError,
    resendVerificationEmail,
    syncLocalProgress,
    loadProgress,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    isGuest: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
