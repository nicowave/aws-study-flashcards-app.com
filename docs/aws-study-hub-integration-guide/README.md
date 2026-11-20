# Level Up Study Hub - Authentication Update Package

## 📦 What's Included

This package contains all the files needed to add Firebase authentication with cross-domain persistence to your Level Up Study Hub (aws-study-flashcards-app.com).

---

## 📂 Directory Structure

```
aws-study-hub-auth-update/
│
├── 📁 shared/                          # Files used by ALL sites
│   ├── sharedAuth.js                   # Core auth service with cookie management
│   ├── AuthContext.jsx                 # React context for auth state
│   ├── AuthScreen.jsx                  # Login/signup modal component
│   ├── AuthScreen.css                  # Styling for auth modal
│   ├── UserBadge.jsx                   # User menu badge component
│   ├── UserBadge.css                   # Styling for user badge
│   └── firebase.config.js              # Firebase config template
│
├── 📁 portal/                          # Portal-specific files
│   ├── App.jsx                         # Updated portal App.jsx
│   └── package.json                    # Portal dependencies
│
├── 📁 ai-app/                          # AI App-specific files
│   ├── App.jsx                         # Updated AI App.jsx with breadcrumbs
│   ├── app-additions.css               # Additional CSS for breadcrumbs/prompts
│   └── package.json                    # AI App dependencies
│
├── 📁 cloud-app/                       # Cloud App-specific files
│   ├── App.jsx                         # Updated Cloud App.jsx with breadcrumbs
│   ├── app-additions.css               # Additional CSS for breadcrumbs/prompts
│   └── package.json                    # Cloud App dependencies
│
├── 📁 deploy/                          # Deployment files
│   └── universal-deploy.sh             # One script to deploy all sites
│
├── SETUP_INSTRUCTIONS.md               # Detailed setup guide
└── README.md                           # This file
```

---

## 🚀 Quick Start (5 Steps)

1. **Set up Firebase** (see SETUP_INSTRUCTIONS.md)
   - Create Firebase project
   - Enable Email/Password authentication
   - Enable Firestore database
   - Copy your Firebase config

2. **Copy shared files** to each site:
   ```
   shared/* → each-site/src/
   ```

3. **Update Firebase config** in each site:
   ```javascript
   // src/config/firebase.config.js
   const firebaseConfig = { ... }; // Paste your config
   ```

4. **Update App.jsx** for each site:
   - Portal: Use portal/App.jsx
   - AI: Use ai-app/App.jsx  
   - Cloud: Use cloud-app/App.jsx

5. **Deploy** using the universal script:
   ```bash
   chmod +x deploy/universal-deploy.sh
   ./deploy/universal-deploy.sh
   ```

---

## 🎯 What This Fixes

### Before ❌
- No authentication
- No progress syncing across devices
- No way to track user progress
- Each site operates independently

### After ✅
- Email/password authentication with verification
- Single sign-on across all three sites
- Progress syncs to Firestore
- Guest mode for quick access
- User badge showing login status
- Cross-domain cookie persistence

---

## 📋 Site-Specific Changes

### Portal (aws-study-flashcards-app.com)
- Wraps app in `AuthProvider`
- Adds `UserBadge` in top-right corner
- No auth screen (users create accounts here)

### AI App (ai.aws-study-flashcards-app.com)
- Wraps app in `AuthProvider`
- Shows auth screen on first visit
- Adds breadcrumb navigation to portal
- Adds `UserBadge` in breadcrumb
- Shows guest mode warning

### Cloud App (cloud.aws-study-flashcards-app.com)
- Same as AI App but with "Cloud Practitioner" branding
- Orange accent color for breadcrumb (matching AWS orange)

---

## 🔑 Key Files Explained

### `sharedAuth.js`
- Handles sign up, sign in, sign out
- Creates cross-domain cookies
- Manages email verification
- Stores user data in localStorage

### `AuthContext.jsx`
- Provides React context for auth state
- Checks auth status on app load
- Listens for Firebase auth changes

### `AuthScreen.jsx`
- Login/signup modal
- Email verification flow
- Guest mode option
- Resend verification email

### `UserBadge.jsx`
- Shows logged-in user
- Dropdown with sign out option
- Guest mode warning

### `universal-deploy.sh`
- One script to deploy all three sites
- Handles build, S3 upload, CloudFront invalidation
- Validates Firebase config

---

## 🛠️ Firebase Setup Checklist

- [ ] Create Firebase project
- [ ] Add Web app
- [ ] Enable Email/Password authentication
- [ ] Enable Firestore database
- [ ] Add authorized domains (all three subdomains + localhost)
- [ ] Configure email verification template
- [ ] Copy Firebase config to all three sites

---

## 📊 File Comparison Workflow

For each site, compare these files with your existing code:

1. **App.jsx** - Main app component
   - Compare structure
   - Merge any custom logic you have
   - Keep your existing components

2. **package.json** - Dependencies
   - Note the Firebase dependencies added
   - Keep your other dependencies
   - Run `npm install` after merging

3. **CSS files** - Styling
   - Add the new styles (don't replace your existing styles)
   - CSS for auth components is isolated

---

## 🔒 Security Features

✅ Email verification required before sign-in
✅ Secure, HttpOnly-like cookies (with SameSite)
✅ Automatic token refresh
✅ Cross-domain authentication
✅ Guest mode doesn't persist (privacy)

---

## 💡 Tips

- **Development**: Use `localhost` in Firebase authorized domains
- **Production**: All sites must use HTTPS for cookies to work
- **Testing**: Use incognito mode to test fresh user experience
- **Debugging**: Check browser console and Firebase Console → Authentication → Users

---

## 📖 Documentation

- **Full Setup Guide**: See `SETUP_INSTRUCTIONS.md`
- **Firebase Docs**: https://firebase.google.com/docs/auth
- **AWS CloudFront**: https://docs.aws.amazon.com/cloudfront/

---

## 🆘 Need Help?

1. Read `SETUP_INSTRUCTIONS.md` thoroughly
2. Check the Troubleshooting section
3. Verify Firebase configuration in Console
4. Test in incognito mode to rule out cache issues

---

## 📝 Notes

- Firebase Auth free tier: 50,000 monthly active users
- Firestore free tier: 50k reads/day, 20k writes/day
- Cross-domain cookies require leading dot: `.aws-study-flashcards-app.com`
- Auth tokens stored in cookies, user data in localStorage

---

**Version**: 1.0.0  
**Last Updated**: January 30, 2026  
**Compatibility**: React 18+, Firebase 10+, Vite 5+
