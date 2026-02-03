// Firebase Configuration for AWS Study Hub
// Your Firebase project: aws-study-hub

const firebaseConfig = {
  apiKey: "AIzaSyCnVfqneLET0uUE_wnDXtqH7yh2qfBZWq4",
  authDomain: "aws-study-hub.firebaseapp.com",
  projectId: "aws-study-hub",
  storageBucket: "aws-study-hub.firebasestorage.app",
  messagingSenderId: "134626511244",
  appId: "1:134626511244:web:ee0abcbd73191bc38b2ea9",
  measurementId: "G-GQHQG5PP10"
};

export default firebaseConfig;

/*
 * IMPORTANT: Ensure these settings in Firebase Console:
 * 
 * 1. Authentication → Sign-in method:
 *    - Email/Password: ENABLED
 *    - Anonymous: ENABLED (for guest mode)
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
