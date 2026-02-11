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
  signInWithGoogle,
  checkGoogleRedirectResult,
  getUserData,
  getStoredUserData,
  isGuestUser,
  reauthenticateUser,
  changePassword,
  updateUserAvatar,
  updateDisplayName,
  deleteAccount
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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    let isMounted = true;

    // Check for pending Google redirect result (from signInWithRedirect fallback)
    checkGoogleRedirectResult().then((result) => {
      if (result && result.success) {
        console.log('[AuthContext] Google redirect sign-in completed');
      }
    });

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        console.log('[AuthContext] Auth state changed: User logged in -', firebaseUser.email);
        setUser(firebaseUser);

        // Fetch user data from Firestore
        const result = await getUserData(firebaseUser.uid);
        if (result.success && isMounted) {
          setUserData(result.data);
        }
      } else {
        console.log('[AuthContext] Auth state changed: No user');

        // Try cross-domain auto-login from shared cookie (only once)
        if (!autoLoginAttempted.current) {
          autoLoginAttempted.current = true;
          console.log('[AuthContext] Attempting cross-domain auto-login...');
          const cookieUser = await tryAutoLoginFromCookie();
          if (cookieUser && isMounted) {
            console.log('[AuthContext] Cross-domain auto-login succeeded');
            return;
          }
        }

        if (isMounted) {
          setUser(null);
          setUserData(null);
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

  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      const result = await logoutUser();
      if (result.success) {
        setUser(null);
        setUserData(null);
        autoLoginAttempted.current = false;
        console.log('[AuthContext] Logout successful');
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      throw err;
    }
  };

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

  const clearError = () => setError(null);

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

  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================

  const changeUserPassword = async (currentPassword, newPassword) => {
    console.log('[AuthContext] Changing password...');
    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      console.log('[AuthContext] Password changed successfully');
    } else {
      console.log('[AuthContext] Password change failed:', result.error);
    }
    return result;
  };

  const updateAvatar = async (avatarData) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    console.log('[AuthContext] Updating avatar...');
    const result = await updateUserAvatar(user.uid, avatarData);
    if (result.success) {
      setUserData(prev => prev ? { ...prev, avatar: avatarData } : prev);
      console.log('[AuthContext] Avatar updated successfully');
    }
    return result;
  };

  const changeDisplayName = async (newName) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    console.log('[AuthContext] Updating display name...');
    const result = await updateDisplayName(user.uid, newName);
    if (result.success) {
      setUserData(prev => prev ? { ...prev, displayName: newName.trim() } : prev);
      console.log('[AuthContext] Display name updated successfully');
    }
    return result;
  };

  const deleteUserAccount = async (password = null) => {
    console.log('[AuthContext] Deleting account...');
    const result = await deleteAccount(password);
    if (result.success) {
      setUser(null);
      setUserData(null);
      console.log('[AuthContext] Account deleted successfully');
    }
    return result;
  };

  const refreshUserData = async () => {
    if (!user) return;
    const result = await getUserData(user.uid);
    if (result.success) {
      setUserData(result.data);
    }
    return result;
  };

  const value = {
    user,
    userData,
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
    isAuthenticated: !!user && (user.emailVerified || user.providerData?.some(p => p.providerId === 'google.com')),
    isEmailVerified: user?.emailVerified || false,
    isGuest: false,
    changeUserPassword,
    changeDisplayName,
    updateAvatar,
    deleteUserAccount,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
