import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  resendVerificationEmail as resendVerification,
  signInWithGoogle,
  checkGoogleRedirectResult,
  getUserData,
  loadProgress as loadSavedProgress,
  saveProgress,
  isGuestUser,
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
  const [isGuest, setIsGuest] = useState(isGuestUser());

  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    let isMounted = true;
    let unsubscribe = () => {};

    (async () => {
      // Finish a Google sign-in first (page loaded with ?code=...), so the
      // first auth state we report is already the signed-in one
      const googleResult = await checkGoogleRedirectResult();
      if (googleResult && !googleResult.success && isMounted) {
        setError(googleResult.error);
      }
      if (!isMounted) return;

      unsubscribe = onAuthChange(async (authUser) => {
        if (!isMounted) return;

        if (authUser) {
          console.log('[AuthContext] Auth state changed: User logged in');

          // A real sign-in supersedes guest mode
          localStorage.removeItem('awsStudyGuest');
          setIsGuest(false);

          // Profile from the StudyHub API (the app's display name lives there)
          const result = await getUserData();
          if (!isMounted) return;
          if (result.success) {
            setUserData(result.data);
            setUser({ ...authUser, displayName: result.data.displayName || authUser.displayName });
          } else {
            setUser(authUser);
          }
        } else {
          console.log('[AuthContext] Auth state changed: No user');
          setUser(null);
          setUserData(null);
        }

        setLoading(false);
      });
    })();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Register — delegates to sharedAuth
  const register = async (email, password, username = '') => {
    setError(null);
    setLoading(true);

    console.log('[AuthContext] Registering user');

    try {
      const result = await registerUser(email, password, username || null);

      if (result.success) {
        // Not signed in until the email link is clicked; tell them what's next
        setError(result.message);
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

    console.log('[AuthContext] Logging in');

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

  // Logout — delegates to sharedAuth; also exits guest mode
  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      const result = await logoutUser();
      if (result.success) {
        setUser(null);
        setUserData(null);
        console.log('[AuthContext] Logout successful');
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      throw err;
    } finally {
      localStorage.removeItem('awsStudyGuest');
      setIsGuest(false);
    }
  };

  // Enter guest mode: local-only preview, no account is created.
  // Progress stays in localStorage and carries over on later sign-up.
  const continueAsGuest = () => {
    console.log('[AuthContext] Continuing as guest');
    localStorage.setItem('awsStudyGuest', 'true');
    setIsGuest(true);
  };

  // Leave guest mode and return to the auth screen (e.g. "Create Free Account")
  const exitGuest = () => {
    console.log('[AuthContext] Exiting guest mode');
    localStorage.removeItem('awsStudyGuest');
    setIsGuest(false);
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

  // Google Sign-In (leaves the page; the app finishes it on return)
  const googleSignIn = async () => {
    setError(null);
    setLoading(true);

    console.log('[AuthContext] Attempting Google sign-in...');

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
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

  // Save this game's progress to the cloud
  const syncLocalProgress = async (localStats, certId) => {
    if (!user || !localStats) return;

    try {
      await saveProgress(certId, localStats);
      console.log('[AuthContext] Progress synced for:', certId);
    } catch (err) {
      console.warn('[AuthContext] Failed to sync progress:', err.message);
    }
  };

  // Load this game's progress from the cloud
  const loadProgress = async (certId) => {
    if (!user) return null;

    try {
      const progress = await loadSavedProgress(certId);
      if (progress) {
        console.log('[AuthContext] Progress loaded for:', certId);
      }
      return progress;
    } catch (err) {
      console.warn('[AuthContext] Failed to load progress:', err.message);
    }
    return null;
  };

  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================

  // Change password
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

  // Update avatar
  const updateAvatar = async (avatarData) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    console.log('[AuthContext] Updating avatar...');
    const result = await updateUserAvatar(avatarData);
    if (result.success) {
      // Update local userData with new avatar
      setUserData(prev => prev ? { ...prev, avatar: avatarData } : prev);
      console.log('[AuthContext] Avatar updated successfully');
    }
    return result;
  };

  // Change display name
  const changeDisplayName = async (newName) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    console.log('[AuthContext] Updating display name...');
    const result = await updateDisplayName(newName);
    if (result.success) {
      const trimmed = newName.trim();
      setUserData(prev => prev ? { ...prev, displayName: trimmed } : prev);
      setUser(prev => prev ? { ...prev, displayName: trimmed } : prev);
      console.log('[AuthContext] Display name updated successfully');
    }
    return result;
  };

  // Delete account
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

  // Refresh user data from the StudyHub API
  const refreshUserData = async () => {
    if (!user) return;
    const result = await getUserData();
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
    isGuest: isGuest && !user,
    continueAsGuest,
    exitGuest,
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
