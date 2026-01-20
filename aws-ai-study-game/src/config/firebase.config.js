// Firebase Configuration
// Replace these values with your Firebase project config
// Get these from: Firebase Console > Project Settings > Your apps > Web app

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Click "Add app" and select Web (</>)
 * 4. Register your app with a nickname
 * 5. Copy the firebaseConfig values above
 * 6. Go to Authentication > Sign-in method
 * 7. Enable "Email/Password" provider
 * 8. (Optional) Enable "Anonymous" for guest users
 * 
 * PRICING: Firebase Auth is FREE for:
 * - Up to 50,000 monthly active users
 * - Unlimited email/password auth
 * - All authentication features
 */
