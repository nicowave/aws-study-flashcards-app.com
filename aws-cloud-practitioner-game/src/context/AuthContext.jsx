import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase.config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cookie helpers for cross-domain auth
const COOKIE_NAME = 'awsStudyAuth';
const COOKIE_DOMAIN = window.location.hostname === 'localhost' 
  ? '' 
  : '.aws-study-flashcards-app.com';

const setCookie = (userData) => {
  const cookieData = JSON.stringify({
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName,
    timestamp: Date.now()
  });
  
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days
  
  const cookieString = COOKIE_DOMAIN
    ? `${COOKIE_NAME}=${encodeURIComponent(cookieData)}; expires=${expires.toUTCString()}; path=/; domain=${COOKIE_DOMAIN}; Secure; SameSite=Lax`
    : `${COOKIE_NAME}=${encodeURIComponent(cookieData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  
  document.cookie = cookieString;
  console.log('[Auth] Cookie set for domain:', COOKIE_DOMAIN || 'localhost');
};

const clearCookie = () => {
  const cookieString = COOKIE_DOMAIN
    ? `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${COOKIE_DOMAIN}`
    : `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  
  document.cookie = cookieString;
  console.log('[Auth] Cookie cleared');
};

const getCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME && value) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        console.error('[Auth] Failed to parse cookie:', e);
        return null;
      }
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthContext] Auth state changed: User logged in -', firebaseUser.email);
        
        // Create user object
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          emailVerified: firebaseUser.emailVerified
        };
        
        setUser(userData);
        setCookie(userData);
        
        // Warn if email not verified
        if (!firebaseUser.emailVerified) {
          console.log('[AuthContext] Email not verified for:', firebaseUser.email);
        }
      } else {
        console.log('[AuthContext] Auth state changed: No user');
        setUser(null);
        
        // Check for cross-domain cookie
        const cookieData = getCookie();
        if (cookieData) {
          console.log('[AuthContext] Found cookie, user may be logged in on another domain');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with EMAIL (primary), password, and optional username
  const register = async (email, password, username = '') => {
    setError(null);
    setLoading(true);
    
    console.log('[AuthContext] Registering user with email:', email);
    
    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      const errorMsg = 'Please enter a valid email address';
      console.log('[AuthContext] Registration failed:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
    
    // Block fake email patterns
    const fakePatterns = ['@studyhub.local', '@fake.', '@test.local', '@example.local'];
    if (fakePatterns.some(pattern => email.toLowerCase().includes(pattern))) {
      const errorMsg = 'Please use a real email address for verification';
      console.log('[AuthContext] Registration failed:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }

    try {
      // Create user with Firebase
      console.log('[AuthContext] Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('[AuthContext] User created:', firebaseUser.uid);

      // Set display name
      const displayName = username || email.split('@')[0];
      await updateProfile(firebaseUser, { displayName });
      console.log('[AuthContext] Display name set:', displayName);

      // Send verification email
      try {
        await sendEmailVerification(firebaseUser, {
          url: window.location.origin,
          handleCodeInApp: false
        });
        console.log('[AuthContext] Verification email sent to:', email);
      } catch (emailErr) {
        console.warn('[AuthContext] Could not send verification email:', emailErr.message);
      }

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: email,
          username: displayName,
          createdAt: serverTimestamp(),
          emailVerified: false
        });
        console.log('[AuthContext] User document created in Firestore');
      } catch (dbErr) {
        console.warn('[AuthContext] Could not save to Firestore:', dbErr.message);
      }

      setLoading(false);
      return firebaseUser;
      
    } catch (err) {
      console.error('[AuthContext] Registration error:', err.code, err.message);
      
      let errorMessage = 'Registration failed';
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Try signing in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password must be at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password sign-up is not enabled. Please contact support.';
          break;
        default:
          errorMessage = err.message || 'Registration failed';
      }
      
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Login with EMAIL and password
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    
    console.log('[AuthContext] Logging in user:', email);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Login successful for:', email);
      setLoading(false);
      return userCredential.user;
      
    } catch (err) {
      console.error('[AuthContext] Login error:', err.code, err.message);
      
      let errorMessage = 'Login failed';
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = err.message || 'Login failed';
      }
      
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      await signOut(auth);
      clearCookie();
      setUser(null);
      console.log('[AuthContext] Logout successful');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      throw err;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      try {
        await sendEmailVerification(auth.currentUser);
        console.log('[AuthContext] Verification email resent');
        return true;
      } catch (err) {
        console.error('[AuthContext] Failed to resend verification:', err);
        throw err;
      }
    }
    return false;
  };

  // Clear error
  const clearError = () => setError(null);

  // Sync local progress to Firestore
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

  // Load progress from Firestore
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
    clearError,
    resendVerificationEmail,
    syncLocalProgress,
    loadProgress,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
