import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '../config/firebase.config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to local (survives browser restarts)
setPersistence(auth, browserLocalPersistence);

// Auth functions
export const registerUser = async (username, password, email = null) => {
  try {
    // Use username as email if no email provided (username@studyhub.local)
    const authEmail = email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@studyhub.local`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: username });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username,
      email: email || null,
      createdAt: new Date().toISOString(),
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
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (username, password) => {
  try {
    // Try with username as email first
    const authEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@studyhub.local`;
    
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    } catch {
      // If that fails, try with the input as actual email
      userCredential = await signInWithEmailAndPassword(auth, username, password);
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// User data functions
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

export const updateUserStats = async (uid, stats) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { stats });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCertProgress = async (uid, certId, progress) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { 
      [`certProgress.${certId}`]: progress 
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const syncProgress = async (uid, localStats, certId = null) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const cloudStats = userData.stats || {};
      
      // Merge: take the higher values
      const mergedStats = {
        totalXp: Math.max(cloudStats.totalXp || 0, localStats.xp || 0),
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

export { auth, db };
