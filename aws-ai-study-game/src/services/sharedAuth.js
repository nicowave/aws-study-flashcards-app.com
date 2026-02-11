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
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc
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
 * Sign in with Google using Firebase popup
 * Works for both new and existing users
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log('[Auth] Google sign-in successful for:', user.email);

    // Check if user document exists in Firestore, create if new
    let isNewUser = false;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      isNewUser = true;
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
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
      console.log('[Auth] Created Firestore user document for new Google user');
    }

    // Get ID token and set cookie for cross-domain auth
    const idToken = await user.getIdToken();
    setAuthCookie(idToken);
    storeUserData(user);

    return { success: true, user, isNewUser };
  } catch (error) {
    console.error('[Auth] Google sign-in error:', error.code, error.message);

    let errorMessage = 'Google sign-in failed';

    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with this email using a different sign-in method.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in cancelled';
    }

    return { success: false, error: errorMessage };
  }
};

export { auth, db, getAuthCookie, getStoredUserData };
