// Firebase Configuration for AWS Study Hub
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnVfqneLET0uUE_wnDXtqH7yh2qfBZWq4",
  authDomain: "aws-study-hub.firebaseapp.com",
  projectId: "aws-study-hub",
  storageBucket: "aws-study-hub.firebasestorage.app",
  messagingSenderId: "134626511244",
  appId: "1:134626511244:web:ee0abcbd73191bc38b2ea9",
  // measurementId: "G-GQHQG5PP10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;


/*
 * IMPORTANT: Ensure these settings in Firebase Console:
 *
 * 1. Authentication → Sign-in method:
 *    - Email/Password: ENABLED
 *
 * 2. Authentication → Settings → Authorized domains:
 *    - aws-study-flashcards-app.com
 *    - cloud.aws-study-flashcards-app.com
 *    - ai.aws-study-flashcards-app.com
 *    - localhost
 *
 * 3. Authentication → Templates:
 *    - Email address verification: ENABLED
 */