import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  isGuestUser,
  resendVerificationEmail,
  getUserData,
  saveProgress,
  signInWithGoogle,
  checkGoogleRedirectResult,
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

export const AuthProvider = ({ children, requireAuth = false }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    let isMounted = true;
    let unsubscribe = () => {};

    (async () => {
      // Finish a Google sign-in first (page loaded with ?code=...)
      const googleResult = await checkGoogleRedirectResult();
      if (googleResult && !googleResult.success && isMounted) {
        setError(googleResult.error);
      }
      if (!isMounted) return;

      unsubscribe = onAuthChange(async (authUser) => {
        if (!isMounted) return;
        console.log('[AuthContext] Auth state changed:', authUser ? 'User logged in' : 'No user');

        if (authUser) {
          // Profile + game progress from the StudyHub API
          const result = await getUserData();
          if (!isMounted) return;
          if (result.success) {
            setUserData(result.data);
            setUser({ ...authUser, displayName: result.data.displayName || authUser.displayName });
            console.log('[AuthContext] Progress loaded:', Object.keys(result.data.progress || {}));
          } else {
            setUser(authUser);
          }
        } else {
          setUser(null);
          setUserData(null);
        }

        setLoading(false);
        setAuthChecked(true);
      });
    })();

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

    console.log('[AuthContext] Registering user');

    const result = await registerUser(email, password, displayName);

    if (result.success) {
      setNeedsVerification(true);
      setError(result.message);
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

    console.log('[AuthContext] Logging in');

    const result = await loginUser(email, password);

    if (result.success) {
      console.log('[AuthContext] Login successful');
    } else {
      setError(result.error);
      if (result.needsVerification) {
        setNeedsVerification(true);
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

  // Google Sign-In (leaves the page; the app finishes it on return)
  const googleSignIn = async () => {
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    console.log('[AuthContext] Attempting Google sign-in...');

    const result = await signInWithGoogle();

    if (!result.success) {
      setError(result.error);
      console.log('[AuthContext] Google sign-in failed:', result.error);
    }

    setLoading(false);
    return result;
  };

  // Guest mode: local-only, no account is created
  const loginAsGuest = async () => {
    console.log('[AuthContext] Continuing as guest');
    localStorage.setItem('awsStudyGuest', 'true');
    setUserData({ isGuest: true });
    return { success: true, isGuest: true };
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

  // Save one certification's progress to the cloud
  const syncUserProgress = async (localStats, certId = null) => {
    if (!user || !certId) {
      console.log('[AuthContext] Cannot sync - no authenticated user or certification');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await saveProgress(certId, localStats);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Re-authenticate user (for sensitive operations)
  const reauthenticate = async (password) => {
    return await reauthenticateUser(password);
  };

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

  // Update display name
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

  // Refresh user data (profile + progress) from the StudyHub API
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
    authChecked,
    error,
    needsVerification,
    isAuthenticated: !!user && (user.emailVerified || isGuestUser() || user.providerData?.some(p => p.providerId === 'google.com')),
    isGuest: isGuestUser(),
    register,
    login,
    logout,
    googleSignIn,
    loginAsGuest,
    resendVerification,
    clearError,
    syncUserProgress,
    reauthenticate,
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
