// Account functions for the Study Hub apps, on AWS (Cognito + StudyHub API).
// Same function names and { success, error } results the screens used with
// Firebase, so AuthContext and the components didn't have to change shape.
import {
  signInWithPassword,
  signUp,
  resendSignUpLink,
  changeAccountPassword,
  startGoogleSignIn,
  completeGoogleSignIn,
  signOutEverywhere,
  forgetSession,
  getTokens,
  userFromTokens,
  onSessionChange,
  apiFetch,
} from './awsAuth';

const PENDING_EMAIL_KEY = 'awsStudyPendingEmail';

/**
 * Store user data in localStorage for quick access
 */
const storeUserData = (user) => {
  if (user) {
    localStorage.setItem('awsStudyUser', JSON.stringify({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName
    }));
  } else {
    localStorage.removeItem('awsStudyUser');
  }
};

/**
 * Get stored user data from localStorage
 */
export const getStoredUserData = () => {
  const data = localStorage.getItem('awsStudyUser');
  return data ? JSON.parse(data) : null;
};

// Email waiting for its verification link (so "resend" knows where to send it)
const setPendingEmail = (email) => sessionStorage.setItem(PENDING_EMAIL_KEY, String(email || '').trim().toLowerCase());
const getPendingEmail = () => sessionStorage.getItem(PENDING_EMAIL_KEY);

const tooManyAttempts = (code) => code === 'TooManyRequestsException' || code === 'LimitExceededException';

/**
 * Register new user with REAL email and password
 * Cognito emails a verification link; the user signs in after clicking it
 */
export const registerUser = async (email, password, displayName = null) => {
  if (!email || !email.includes('@') || email.endsWith('@studyhub.local')) {
    return {
      success: false,
      error: 'Please use a real email address for verification'
    };
  }

  try {
    await signUp(email, password, displayName);
    setPendingEmail(email);
    console.log('[Auth] Verification link sent');
    return {
      success: true,
      user: null,
      message: 'Account created! Check your email for a verification link, then sign in.',
      needsVerification: true
    };
  } catch (error) {
    console.error('[Auth] Registration error:', error.code, error.message);

    let errorMessage = 'Failed to create account';
    if (error.code === 'UsernameExistsException') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'UserLambdaValidationException' && /ACCOUNT_EXISTS/.test(error.message)) {
      errorMessage = 'You already have an account with this email. Sign in with your existing password.';
    } else if (error.code === 'InvalidPasswordException') {
      errorMessage = 'Password must be at least 6 characters';
    } else if (error.code === 'InvalidParameterException') {
      errorMessage = 'Please enter a valid email address';
    } else if (tooManyAttempts(error.code)) {
      errorMessage = 'Too many attempts. Please try again later.';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const user = await signInWithPassword(email, password);
    storeUserData(user);
    console.log('[Auth] Login successful');
    return { success: true, user };
  } catch (error) {
    console.error('[Auth] Login error:', error.code, error.message);

    if (error.code === 'UserNotConfirmedException') {
      setPendingEmail(email);
      return {
        success: false,
        error: 'Please verify your email before signing in. Check your inbox for a verification link.',
        needsVerification: true,
        user: { email, emailVerified: false }
      };
    }

    let errorMessage = 'Incorrect email or password';
    if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password. Never verified your email? Create an account with the same address.';
    } else if (tooManyAttempts(error.code)) {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'PasswordResetRequiredException') {
      errorMessage = 'Your password needs to be reset. Please contact support.';
    } else if (error instanceof TypeError) {
      errorMessage = 'Network error. Check your connection and try again.';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Sign out user from all sites
 */
export const logoutUser = async () => {
  try {
    await signOutEverywhere();
    storeUserData(null);
    localStorage.removeItem('awsStudyGuest');
    console.log('[Auth] User signed out');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if current user is a guest
 */
export const isGuestUser = () => {
  return localStorage.getItem('awsStudyGuest') === 'true';
};

/**
 * Resend the verification link to the email that just signed up or tried to sign in
 */
export const resendVerificationEmail = async () => {
  const email = getPendingEmail();
  if (!email) {
    return { success: false, error: 'Sign in again, then request a new link' };
  }
  try {
    await resendSignUpLink(email);
    return { success: true, message: 'Verification email sent! Check your inbox.' };
  } catch (error) {
    console.error('[Auth] Resend verification error:', error.code);
    if (tooManyAttempts(error.code)) {
      return { success: false, error: 'Please wait before requesting another email' };
    }
    if (error.code === 'InvalidParameterException') {
      return { success: false, error: 'Email is already verified' };
    }
    return { success: false, error: 'Failed to send verification email' };
  }
};

/**
 * Get current user (null while signed out or still loading)
 */
export const getCurrentUser = async () => userFromTokens(await getTokens().catch(() => null));

/**
 * Listen to auth state changes. Fires once on start, then on every sign-in
 * or sign-out (here, on another subdomain, or in another tab).
 */
export const onAuthChange = (callback) => {
  let active = true;
  const emit = async () => {
    let user = null;
    try {
      user = userFromTokens(await getTokens());
    } catch (error) {
      console.warn('[Auth] Could not refresh the session:', error.message);
    }
    if (!active) return;
    storeUserData(user);
    callback(user);
  };
  emit();
  const unsubscribe = onSessionChange(emit);
  return () => {
    active = false;
    unsubscribe();
  };
};

/**
 * Get profile + all progress ({ ...profile, progress: { certId: stats } })
 */
export const getUserData = async () => {
  try {
    const me = await apiFetch('/v1/me');
    return { success: true, data: { ...me.profile, progress: me.progress, entitlements: me.entitlements } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Load one certification's saved game stats (null if none yet)
 */
export const loadProgress = async (certId) => {
  const result = await apiFetch(`/v1/progress/${encodeURIComponent(certId)}`);
  return result.progress;
};

/**
 * Save one certification's game stats
 */
export const saveProgress = async (certId, stats) => {
  await apiFetch(`/v1/progress/${encodeURIComponent(certId)}`, { method: 'PUT', body: stats });
};

/**
 * Finish a Google sign-in on page load (the browser returns with ?code=...)
 * Must be called once when the app initializes
 */
export const checkGoogleRedirectResult = async () => {
  try {
    const user = await completeGoogleSignIn();
    if (!user) return null;
    storeUserData(user);
    console.log('[Auth] Google sign-in completed');
    return { success: true, user };
  } catch (error) {
    console.error('[Auth] Google redirect result error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google: goes to Google, then comes back to this site
 * (checkGoogleRedirectResult finishes it). Works for new and existing users.
 */
export const signInWithGoogle = async () => {
  try {
    await startGoogleSignIn();
    // The page is navigating away; stay "loading" until it does
    return await new Promise(() => {});
  } catch (error) {
    console.error('[Auth] Google sign-in error:', error);
    return { success: false, error: 'Google sign-in failed. Please try again.' };
  }
};

// ============================================
// SETTINGS PAGE FUNCTIONS
// ============================================

/**
 * Confirm the current user's password
 * Required before sensitive operations like password change or account deletion
 */
export const reauthenticateUser = async (password) => {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'No user signed in' };
  }
  try {
    await signInWithPassword(user.email, password);
    console.log('[Auth] Re-authentication successful');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Re-authentication error:', error.code);
    if (tooManyAttempts(error.code)) {
      return { success: false, error: 'Too many attempts. Please try again later.' };
    }
    return { success: false, error: 'Incorrect password' };
  }
};

/**
 * Change user password (checks the current password first)
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await changeAccountPassword(currentPassword, newPassword);
    console.log('[Auth] Password changed successfully');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Change password error:', error.code);

    let errorMessage = 'Failed to change password';
    if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'InvalidPasswordException' || error.code === 'InvalidParameterException') {
      errorMessage = 'New password must be at least 6 characters';
    } else if (tooManyAttempts(error.code)) {
      errorMessage = 'Too many attempts. Please try again later.';
    } else if (error.code === 'NotSignedIn') {
      errorMessage = 'No user signed in';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Update user avatar
 * @param {object} avatarData - { type: 'initials'|'emoji'|'pattern'|'image', value: string|null, bgColor: string }
 */
export const updateUserAvatar = async (avatarData) => {
  try {
    await apiFetch('/v1/me', { method: 'PATCH', body: { avatar: avatarData } });
    console.log('[Auth] Avatar updated');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Update avatar error:', error.message);
    return { success: false, error: 'Failed to update avatar' };
  }
};

/**
 * Update user display name
 */
export const updateDisplayName = async (newDisplayName) => {
  const trimmed = newDisplayName.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters' };
  }
  if (trimmed.length > 30) {
    return { success: false, error: 'Display name must be 30 characters or less' };
  }

  try {
    await apiFetch('/v1/me', { method: 'PATCH', body: { displayName: trimmed } });
    console.log('[Auth] Display name updated to:', trimmed);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Update display name error:', error.message);
    return { success: false, error: 'Failed to update display name' };
  }
};

/**
 * Delete user account permanently
 * Email users confirm their password first; Google users confirm by typing DELETE
 * The server deletes all study data and the sign-in account
 */
export const deleteAccount = async (password = null) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }

    const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');
    if (!isGoogleUser) {
      if (!password) {
        return { success: false, error: 'Password is required to delete your account' };
      }
      const reauth = await reauthenticateUser(password);
      if (!reauth.success) {
        return reauth;
      }
    }

    await apiFetch('/v1/me', { method: 'DELETE' });
    console.log('[Auth] Account deleted');

    forgetSession();
    storeUserData(null);
    localStorage.removeItem('awsStudyGuest');

    return { success: true };
  } catch (error) {
    console.error('[Auth] Delete account error:', error.message);
    return { success: false, error: 'Failed to delete account' };
  }
};
