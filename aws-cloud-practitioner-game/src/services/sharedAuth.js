import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase.config';

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ============================================
// COOKIE CONFIGURATION - CRITICAL FOR CROSS-DOMAIN AUTH
// ============================================
const COOKIE_NAME = 'awsStudyAuth';
// IMPORTANT: This must match your ROOT domain with a leading dot
// Your sites: aws-study-flashcards-app.com, cloud.aws-study-flashcards-app.com, ai.aws-study-flashcards-app.com
const COOKIE_DOMAIN = '.aws-study-flashcards-app.com';
const COOKIE_EXPIRY_DAYS = 7;

/**
 * Set auth cookie for cross-domain persistence
 */
const setAuthCookie = (token, expirationDays = COOKIE_EXPIRY_DAYS) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + expirationDays);
  
  // Check if we're on localhost (for development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // For localhost development - no domain restriction
    document.cookie = `${COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } else {
    // For production (HTTPS required for Secure flag)
    document.cookie = `${COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; domain=${COOKIE_DOMAIN}; path=/; Secure; SameSite=Lax`;
  }
  
  console.log('[Auth] Cookie set for domain:', isLocalhost ? 'localhost' : COOKIE_DOMAIN);
};

/**
 * Get auth cookie value
 */
const getAuthCookie = () => {
  const name = COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
};

/**
 * Delete auth cookie
 */
const deleteAuthCookie = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Delete production cookie (with domain)
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${COOKIE_DOMAIN}; path=/; Secure; SameSite=Lax`;
  
  // Also delete without domain (catches any mismatched cookies)
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  
  if (isLocalhost) {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
  
  console.log('[Auth] Cookies cleared');
};

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
const getStoredUserData = () => {
  const data = localStorage.getItem('awsStudyUser');
  return data ? JSON.parse(data) : null;
};

/**
 * Register new user with REAL email and password
 * Email verification will be sent to this address
 */
export const registerUser = async (email, password, displayName = null) => {
  try {
    // Validate email is a real email address
    if (!email || !email.includes('@') || email.endsWith('@studyhub.local')) {
      return { 
        success: false, 
        error: 'Please use a real email address for verification' 
      };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Send verification email
    await sendEmailVerification(user, {
      url: 'https://aws-study-flashcards-app.com', // Redirect after verification
      handleCodeInApp: false
    });
    
    console.log('[Auth] Verification email sent to:', email);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      emailVerified: false,
      stats: {
        totalXp: 0,
        level: 1,
        totalAnswered: 0,
        totalCorrect: 0,
        maxStreak: 0,
        sessionsCompleted: 0
      },
      certProgress: {}
    });
    
    // Get ID token and set cookie
    const idToken = await user.getIdToken();
    setAuthCookie(idToken);
    storeUserData(user);
    
    return { 
      success: true, 
      user,
      message: 'Account created! Please check your email to verify your account.',
      needsVerification: true
    };
  } catch (error) {
    console.error('[Auth] Registration error:', error.code, error.message);
    
    let errorMessage = 'Failed to create account';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password must be at least 6 characters';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled. Please contact support.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      console.log('[Auth] User email not verified:', email);
      return { 
        success: false, 
        error: 'Please verify your email before signing in. Check your inbox for a verification link.',
        needsVerification: true,
        user 
      };
    }
    
    // Get ID token and set cookie for cross-domain auth
    const idToken = await user.getIdToken();
    setAuthCookie(idToken);
    storeUserData(user);
    
    console.log('[Auth] Login successful for:', email);
    
    return { success: true, user };
  } catch (error) {
    console.error('[Auth] Login error:', error.code, error.message);
    
    let errorMessage = 'Invalid email or password';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign out user from all sites
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    deleteAuthCookie();
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
 * Sign in as guest (anonymous) - progress NOT synced across devices
 */
export const signInAsGuest = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // Store guest indicator in localStorage (don't set cookie - guests don't persist across domains)
    localStorage.setItem('awsStudyGuest', 'true');
    
    console.log('[Auth] Guest sign-in successful');
    return { success: true, user, isGuest: true };
  } catch (error) {
    console.error('[Auth] Guest sign-in error:', error);
    return { success: false, error: 'Failed to sign in as guest' };
  }
};

/**
 * Check if current user is a guest
 */
export const isGuestUser = () => {
  return localStorage.getItem('awsStudyGuest') === 'true';
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }
    
    if (user.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }
    
    await sendEmailVerification(user, {
      url: 'https://aws-study-flashcards-app.com',
      handleCodeInApp: false
    });
    
    console.log('[Auth] Verification email resent to:', user.email);
    return { success: true, message: 'Verification email sent! Check your inbox.' };
  } catch (error) {
    console.error('[Auth] Resend verification error:', error);
    
    if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Please wait before requesting another email' };
    }
    
    return { success: false, error: 'Failed to send verification email' };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Update stored user data
      storeUserData(user);
      
      // Update cookie with current token (refreshes only when expired)
      try {
        const idToken = await user.getIdToken(true);
        setAuthCookie(idToken);
      } catch (error) {
        console.error('[Auth] Failed to refresh token:', error);
      }
    } else {
      storeUserData(null);
      localStorage.removeItem('awsStudyGuest');
    }
    
    callback(user);
  });
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user stats in Firestore
 */
export const updateUserStats = async (uid, stats) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { stats });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sync local progress to Firestore
 */
export const syncProgress = async (uid, localStats, certId = null) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const cloudStats = userData.stats || {};
      
      // Merge: take the higher values
      const mergedStats = {
        totalXp: Math.max(cloudStats.totalXp || 0, localStats.xp || localStats.totalXp || 0),
        level: Math.max(cloudStats.level || 1, localStats.level || 1),
        totalAnswered: Math.max(cloudStats.totalAnswered || 0, localStats.totalAnswered || 0),
        totalCorrect: Math.max(cloudStats.totalCorrect || 0, localStats.totalCorrect || 0),
        maxStreak: Math.max(cloudStats.maxStreak || 0, localStats.maxStreak || 0),
        sessionsCompleted: Math.max(cloudStats.sessionsCompleted || 0, localStats.sessionsCompleted || 0)
      };
      
      const updateData = { stats: mergedStats };
      
      // If certId provided, also update cert-specific progress
      if (certId && localStats) {
        updateData[`certProgress.${certId}`] = {
          lastStudied: new Date().toISOString(),
          ...localStats
        };
      }
      
      await updateDoc(docRef, updateData);
      return { success: true, stats: mergedStats };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Try to auto-login from the shared cross-domain cookie.
 * Used for SSO: if a user is logged in on one subdomain,
 * other subdomains can establish their own Firebase session
 * by exchanging the ID token via a Cloud Function.
 *
 * @returns {Object|null} Firebase user object on success, null on failure
 */
export const tryAutoLoginFromCookie = async () => {
  // Skip if already signed in locally
  if (auth.currentUser) {
    console.log('[Auth] Already signed in, skipping cookie auto-login');
    return auth.currentUser;
  }

  // Check for shared cookie
  const idToken = getAuthCookie();
  if (!idToken) {
    console.log('[Auth] No auth cookie found');
    return null;
  }

  console.log('[Auth] Found auth cookie, attempting cross-domain login...');

  try {
    // Call Cloud Function to exchange ID token for a Custom Token
    const exchangeTokenFn = httpsCallable(functions, 'exchangeToken');
    const result = await exchangeTokenFn({ idToken });
    const { customToken } = result.data;

    if (!customToken) {
      console.error('[Auth] Cloud Function returned no custom token');
      deleteAuthCookie();
      return null;
    }

    // Sign in with the custom token to establish a local Firebase session
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log('[Auth] Cross-domain login successful for:', userCredential.user.email);

    // Update cookie with fresh token and store user data
    const freshToken = await userCredential.user.getIdToken();
    setAuthCookie(freshToken);
    storeUserData(userCredential.user);

    return userCredential.user;
  } catch (error) {
    console.error('[Auth] Cross-domain login failed:', error.message || error);

    // Delete stale cookie so we don't retry endlessly
    deleteAuthCookie();
    return null;
  }
};

/**
 * Generate a random username like "CloudLearner_7a3f"
 * Used for Google sign-ups when user doesn't provide one
 */
const generateRandomUsername = () => {
  const adjectives = ['Cloud', 'AWS', 'Nimbus', 'Cyber', 'Data', 'Sage', 'Tech', 'Nova', 'Flux', 'Arch'];
  const nouns = ['Learner', 'Builder', 'Pioneer', 'Explorer', 'Wizard', 'Ninja', 'Coder', 'Ace', 'Pro', 'Hero'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${adj}${noun}_${hex}`;
};

/**
 * Handle the Google user after sign-in (popup or redirect)
 * Creates Firestore doc if new user, sets cookie
 */
const handleGoogleUser = async (user) => {
  console.log('[Auth] Google sign-in successful for:', user.email || user.uid);

  // Check if user document exists in Firestore, create if new
  let isNewUser = false;
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    isNewUser = true;
    // Generate a random username for Google sign-ups
    const randomName = generateRandomUsername();
    await setDoc(userDocRef, {
      email: user.email,
      displayName: randomName,
      createdAt: new Date().toISOString(),
      emailVerified: true,
      authProvider: 'google',
      stats: {
        totalXp: 0,
        level: 1,
        totalAnswered: 0,
        totalCorrect: 0,
        maxStreak: 0,
        sessionsCompleted: 0
      },
      certProgress: {}
    });
    // Also update Firebase Auth profile with the random name
    await updateProfile(user, { displayName: randomName });
    // Reload user to pick up the new displayName in the auth object
    await user.reload();
    console.log('[Auth] Created Firestore user document for new Google user with name:', randomName);
  }

  // Get ID token and set cookie for cross-domain auth
  const idToken = await user.getIdToken(true);
  setAuthCookie(idToken);
  storeUserData(user);

  return { success: true, user, isNewUser };
};

/**
 * Check for pending Google redirect result on page load
 * Must be called once when the app initializes
 */
export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log('[Auth] Google redirect result found');
      return await handleGoogleUser(result.user);
    }
    return null;
  } catch (error) {
    console.error('[Auth] Google redirect result error:', error.code, error.message);
    return null;
  }
};

/**
 * Sign in with Google — tries popup first, falls back to redirect
 * Works for both new and existing users
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  // Try popup first (works on most desktop browsers)
  try {
    const userCredential = await signInWithPopup(auth, provider);
    return await handleGoogleUser(userCredential.user);
  } catch (error) {
    console.warn('[Auth] Google popup failed:', error.code, error.message);

    // For these errors, fall back to redirect flow
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/unauthorized-domain' ||
      error.code === 'auth/operation-not-supported-in-this-environment' ||
      error.code === 'auth/internal-error'
    ) {
      console.log('[Auth] Falling back to redirect flow...');
      try {
        await signInWithRedirect(auth, provider);
        // Page will redirect — this line won't execute
        return { success: false, error: 'Redirecting to Google...' };
      } catch (redirectError) {
        console.error('[Auth] Google redirect also failed:', redirectError.code, redirectError.message);
        return { success: false, error: 'Google sign-in failed. Please try again.' };
      }
    }

    // For user-initiated cancellations, just return the message
    let errorMessage = 'Google sign-in failed';

    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in cancelled';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with this email using a different sign-in method.';
    }

    return { success: false, error: errorMessage };
  }
};

// ============================================
// SETTINGS PAGE FUNCTIONS
// ============================================

/**
 * Re-authenticate user with email/password credential
 * Required before sensitive operations like password change or account deletion
 */
export const reauthenticateUser = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    console.log('[Auth] Re-authentication successful');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Re-authentication error:', error.code, error.message);

    let errorMessage = 'Re-authentication failed';
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later.';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Change user password
 * Requires recent authentication — call reauthenticateUser first
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }

    // Re-authenticate first
    const reauth = await reauthenticateUser(currentPassword);
    if (!reauth.success) {
      return reauth;
    }

    // Update password
    await firebaseUpdatePassword(user, newPassword);

    // Refresh token after password change
    await user.getIdToken(true);
    const freshToken = await user.getIdToken();
    setAuthCookie(freshToken);

    console.log('[Auth] Password changed successfully');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Change password error:', error.code, error.message);

    let errorMessage = 'Failed to change password';
    if (error.code === 'auth/weak-password') {
      errorMessage = 'New password must be at least 6 characters';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign out and sign back in, then try again';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Update user avatar in Firestore
 * @param {string} uid - User ID
 * @param {object} avatarData - { type: 'initials'|'emoji'|'pattern'|'image', value: string|null, bgColor: string }
 */
export const updateUserAvatar = async (uid, avatarData) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { avatar: avatarData });
    console.log('[Auth] Avatar updated for user:', uid);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Update avatar error:', error.message);
    return { success: false, error: 'Failed to update avatar' };
  }
};

/**
 * Update user display name in both Firebase Auth and Firestore
 * @param {string} uid - User ID
 * @param {string} newDisplayName - New display name
 */
export const updateDisplayName = async (uid, newDisplayName) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }

    // Validate display name
    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters' };
    }
    if (trimmed.length > 30) {
      return { success: false, error: 'Display name must be 30 characters or less' };
    }

    // Update Firebase Auth profile
    await updateProfile(user, { displayName: trimmed });

    // Update Firestore document
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { displayName: trimmed });

    // Update stored user data
    storeUserData(user);

    console.log('[Auth] Display name updated to:', trimmed);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Update display name error:', error.message);
    return { success: false, error: 'Failed to update display name' };
  }
};

/**
 * Delete user account permanently
 * For email users: requires password re-auth
 * For Google users: requires Google popup re-auth
 * Deletes Firestore doc first, then Firebase Auth account, then clears local data
 */
export const deleteAccount = async (password = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }

    // Determine auth provider
    const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

    // Re-authenticate based on provider
    if (isGoogleUser) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError) {
        if (popupError.code === 'auth/popup-closed-by-user' || popupError.code === 'auth/cancelled-popup-request') {
          return { success: false, error: 'Account deletion cancelled' };
        }
        return { success: false, error: 'Google re-authentication failed. Please try again.' };
      }
    } else {
      if (!password) {
        return { success: false, error: 'Password is required to delete your account' };
      }
      const reauth = await reauthenticateUser(password);
      if (!reauth.success) {
        return reauth;
      }
    }

    // Delete Firestore user document first (while still authenticated)
    try {
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
      console.log('[Auth] Firestore user document deleted');
    } catch (firestoreError) {
      console.error('[Auth] Firestore deletion error (continuing):', firestoreError.message);
    }

    // Delete Firebase Auth account
    await firebaseDeleteUser(user);
    console.log('[Auth] Firebase Auth account deleted');

    // Clear all local data
    deleteAuthCookie();
    storeUserData(null);
    localStorage.removeItem('awsStudyGuest');
    localStorage.removeItem('awsStudyUser');

    return { success: true };
  } catch (error) {
    console.error('[Auth] Delete account error:', error.code, error.message);

    let errorMessage = 'Failed to delete account';
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign out and sign back in, then try again';
    }

    return { success: false, error: errorMessage };
  }
};

export { auth, db, getAuthCookie, getStoredUserData };
