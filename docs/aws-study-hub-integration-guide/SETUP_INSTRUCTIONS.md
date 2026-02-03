# AWS Study Hub - Authentication Setup Guide

## 📋 Overview

This update adds Firebase-based authentication across all three AWS Study Hub sites with cross-domain persistence. Users can sign up once and stay logged in across:

- **Portal**: aws-study-flashcards-app.com
- **AI App**: ai.aws-study-flashcards-app.com  
- **Cloud App**: cloud.aws-study-flashcards-app.com

## 🎯 Features

✅ Email/Password authentication with verification
✅ Cross-domain cookie persistence (automatic login across all sites)
✅ Guest mode (local-only progress)
✅ User badge showing login status
✅ Breadcrumb navigation back to portal
✅ Progress syncing to Firestore when logged in
✅ Resend verification email option

---

## 🚀 Quick Start

### Step 1: Firebase Setup (15 minutes)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add Project"
   - Name it "aws-study-hub" (or your choice)
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Add Web App**
   - Click "Web" icon (</> symbol)
   - Register app name: "AWS Study Hub"
   - **Don't check** "Firebase Hosting"
   - Click "Register app"
   - Copy the firebaseConfig object

3. **Enable Authentication**
   - Go to **Authentication** → **Get Started**
   - Click **Email/Password** → **Enable** → **Save**
   - Go to **Settings** → **Authorized domains**
   - Add these domains:
     - `aws-study-flashcards-app.com`
     - `ai.aws-study-flashcards-app.com`
     - `cloud.aws-study-flashcards-app.com`
     - `localhost` (for development)

4. **Enable Firestore Database**
   - Go to **Firestore Database** → **Create database**
   - Start in **test mode** (for development)
   - Choose location closest to your users
   - Click **Enable**

5. **Configure Email Templates**
   - Go to **Authentication** → **Templates**
   - Click **Email address verification**
   - Customize if desired (optional)
   - Make sure it's enabled

---

### Step 2: Update Your Code

#### For All Three Sites (Portal, AI, Cloud):

1. **Copy Shared Files**
   
   Copy these files to each site's `src/` directory:
   ```
   shared/sharedAuth.js        → src/services/sharedAuth.js
   shared/AuthContext.jsx      → src/context/AuthContext.jsx
   shared/AuthScreen.jsx       → src/components/AuthScreen.jsx
   shared/AuthScreen.css       → src/components/AuthScreen.css
   shared/UserBadge.jsx        → src/components/UserBadge.jsx
   shared/UserBadge.css        → src/components/UserBadge.css
   shared/firebase.config.js   → src/config/firebase.config.js
   ```

2. **Update Firebase Config**
   
   Edit `src/config/firebase.config.js` in **each site** and paste your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",              // ← Paste from Firebase Console
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. **Update App.jsx**
   
   - **Portal**: Use `portal/App.jsx`
   - **AI App**: Use `ai-app/App.jsx` 
   - **Cloud App**: Use `cloud-app/App.jsx`

4. **Add CSS** (for AI and Cloud apps only)
   
   Append the contents of `app-additions.css` to your existing CSS file

5. **Update package.json**
   
   Replace your `package.json` with the site-specific one provided, then run:
   ```bash
   npm install
   ```

---

### Step 3: AWS Certificate Setup

1. **Go to AWS Certificate Manager** (us-east-1 region!)
   - Must be in us-east-1 for CloudFront
   
2. **Request a certificate** for:
   ```
   *.aws-study-flashcards-app.com
   aws-study-flashcards-app.com
   ```

3. **Validate via DNS** (add CNAME records to Route 53)

4. **Copy the ARN** (looks like `arn:aws:acm:us-east-1:123456789:certificate/abc-123`)

5. **Update deploy script**:
   
   Edit `universal-deploy.sh` and replace:
   ```bash
   CERTIFICATE_ARN="arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID"
   ```

---

### Step 4: Deploy

1. **Make script executable**:
   ```bash
   chmod +x universal-deploy.sh
   ```

2. **Deploy each site**:
   ```bash
   # From portal directory
   ./universal-deploy.sh
   # Select: 1 (Portal)
   
   # From AI app directory  
   ./universal-deploy.sh
   # Select: 2 (AI App)
   
   # From cloud app directory
   ./universal-deploy.sh
   # Select: 3 (Cloud App)
   ```

---

## 🧪 Testing Checklist

### ✅ Sign Up Flow
1. Go to portal: aws-study-flashcards-app.com
2. Create account with email/password
3. Check email inbox for verification link
4. Click verification link
5. Return to portal and sign in
6. Should see UserBadge in top-right

### ✅ Cross-Domain Persistence
1. Sign in on portal
2. Navigate to ai.aws-study-flashcards-app.com
3. Should **automatically** be logged in (no sign-in required)
4. UserBadge should show your email
5. Navigate to cloud.aws-study-flashcards-app.com  
6. Should **automatically** be logged in

### ✅ Sign Out
1. Sign out from any site (click UserBadge → Sign Out)
2. Refresh all three sites
3. Should be signed out on all sites

### ✅ Guest Mode
1. On any site, click "Continue as Guest"
2. Should see warning: "Progress not saved"
3. Navigate to another site
4. Should be signed out (guest mode doesn't persist)

### ✅ Email Verification
1. Try to sign in before verifying email
2. Should see error: "Please verify your email"
3. Can click "Resend verification email"

---

## 📁 File Structure

```
your-project/
├── src/
│   ├── config/
│   │   └── firebase.config.js       ← Firebase credentials
│   ├── services/
│   │   └── sharedAuth.js            ← Auth logic with cookies
│   ├── context/
│   │   └── AuthContext.jsx          ← React auth state
│   ├── components/
│   │   ├── AuthScreen.jsx           ← Login/signup modal
│   │   ├── AuthScreen.css
│   │   ├── UserBadge.jsx            ← User menu badge
│   │   └── UserBadge.css
│   └── App.jsx                      ← Updated with auth
├── package.json                      ← Updated with Firebase
└── universal-deploy.sh              ← Deploy script
```

---

## 🔒 Security Notes

- Firebase Auth is **free** for up to 50,000 monthly active users
- Email verification prevents fake accounts
- Cookies are `Secure` and `SameSite=Lax`
- Auth tokens expire automatically
- Root domain cookie (`.aws-study-flashcards-app.com`) enables cross-subdomain auth

---

## 🐛 Troubleshooting

### Problem: Emails not sending
**Solution**: 
- Check Firebase Console → Authentication → Templates
- Verify email verification is enabled
- Check spam folder

### Problem: Not staying logged in across sites
**Solution**:
- Verify all sites use HTTPS (required for secure cookies)
- Check cookie domain is `.aws-study-flashcards-app.com` (with leading dot)
- Ensure all sites have same Firebase config

### Problem: "Firebase: Error (auth/unauthorized-domain)"
**Solution**:
- Add domain to Firebase Console → Authentication → Settings → Authorized domains

### Problem: Can't sign in after verification
**Solution**:
- Clear browser cookies
- Try incognito mode
- Check Firebase Console → Authentication → Users to see if email is verified

---

## 💰 Cost Estimate

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Firebase Auth | 50k MAU | $0 |
| Firestore | 50k reads/day | $0 - $5/month |
| S3 | 5GB storage | $0.50/month |
| CloudFront | 1TB transfer | $0 - $10/month |
| **Total** | | **< $15/month** |

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Firebase configuration
3. Check AWS CloudWatch logs
4. Test in incognito mode

---

## 🎉 You're Done!

Your AWS Study Hub now has:
- ✅ Unified authentication across all sites
- ✅ Email verification for security
- ✅ Cross-domain login persistence
- ✅ Guest mode for quick access
- ✅ Progress syncing to cloud

Users only need to create one account to access all your study games!
