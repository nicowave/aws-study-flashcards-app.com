# AWS Study Hub Authentication Fix

## 🚨 Issues Found

### Issue 1: Cookie Domain Mismatch (CRITICAL)
**File:** `sharedAuth.js` line 32

**Problem:**
```javascript
const COOKIE_DOMAIN = '.aws-study-flashcards.app';  // ❌ WRONG
```

**Your actual domains:**
- `aws-study-flashcards-app.com` (portal)
- `cloud.aws-study-flashcards-app.com` (cloud)
- `ai.aws-study-flashcards-app.com` (AI)

**Fix:**
```javascript
const COOKIE_DOMAIN = '.aws-study-flashcards-app.com';  // ✅ CORRECT
```

**Why this matters:** Cookies set on `.aws-study-flashcards.app` are completely invisible to `.aws-study-flashcards-app.com`. They're different domains!

---

### Issue 2: Domain Inconsistency in sites.config.js
**File:** `sites.config.js`

**Problem:**
```javascript
hub: { url: 'https://aws-study-flashcards.app' }              // ❌ Wrong
cloudPractitioner: { url: 'https://cloud.aws-study-flashcards.app' }  // ❌ Wrong
aiPractitioner: { url: 'https://ai.aws-study-flashcards-app.com' }    // ✅ Correct
```

**Fix:** All sites should use consistent `.aws-study-flashcards-app.com` domain.

---

### Issue 3: Email Verification Impossible with Fake Emails
**File:** `App.jsx` and old `firebase.js`

**Problem:** The old authentication pattern creates accounts like:
```javascript
const authEmail = `${username}@studyhub.local`;  // ❌ Fake email!
```

Firebase **cannot** send verification emails to fake addresses like `john@studyhub.local`.

**Fix:** Require real email addresses for registration.

---

## 📋 Firebase Console Checklist

### Step 1: Verify Email/Password Authentication is Enabled
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **aws-study-hub**
3. Go to **Build** → **Authentication** → **Sign-in method**
4. Ensure **Email/Password** is **Enabled**

### Step 2: Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains (if not already present):
   - `aws-study-flashcards-app.com`
   - `cloud.aws-study-flashcards-app.com`
   - `ai.aws-study-flashcards-app.com`
   - `localhost` (for development)

### Step 3: Configure Email Templates
1. Go to **Authentication** → **Templates**
2. Click on **Email address verification**
3. Ensure it's enabled (should show a template preview)
4. Optionally customize:
   - Subject line
   - Sender name
   - Action URL (should be `https://aws-study-flashcards-app.com`)

### Step 4: Check Firestore Rules (if using progress sync)
1. Go to **Firestore Database** → **Rules**
2. Ensure authenticated users can read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔧 Files to Replace

Replace these files in **all three sites** (portal, AI, cloud):

| Old File | New File |
|----------|----------|
| `src/services/sharedAuth.js` | Use the corrected version |
| `src/config/sites.config.js` | Use the corrected version |
| `src/context/AuthContext.jsx` | Use the corrected version |
| `src/components/AuthScreen.jsx` | Use the corrected version |
| `src/components/AuthScreen.css` | Use the corrected version |

---

## 🧪 Testing After Fix

### Test 1: Registration with Real Email
1. Go to `aws-study-flashcards-app.com`
2. Click "Create Account"
3. Enter a **real email address** you have access to
4. Enter a password (6+ characters)
5. Click "Create Account"
6. **Check your email inbox** for verification link
7. Click the verification link
8. Return to site and sign in

### Test 2: Cross-Domain Persistence
1. Sign in on `aws-study-flashcards-app.com`
2. Open `cloud.aws-study-flashcards-app.com` in a new tab
3. You should **automatically be logged in**
4. Open `ai.aws-study-flashcards-app.com` in another tab
5. You should **automatically be logged in**

### Test 3: Sign Out Everywhere
1. Sign out from any site
2. Refresh all three sites
3. You should be **signed out on all sites**

---

## 🔍 Debug: Check Cookies

In Chrome DevTools (F12):
1. Go to **Application** tab
2. Click **Cookies** in the left sidebar
3. Select your domain

**What to look for:**
- Cookie name: `awsStudyAuth`
- Domain: `.aws-study-flashcards-app.com` (with leading dot)
- Secure: ✓ (checked)
- SameSite: Lax

If the cookie domain shows `.aws-study-flashcards.app` (without `-app`), the old incorrect code is still deployed.

---

## 🔍 Debug: Check Console Logs

Open browser console (F12 → Console) and look for:
- `[Auth] Cookie set for domain: .aws-study-flashcards-app.com`
- `[Auth] Verification email sent to: your@email.com`
- `[Auth] Login successful for: your@email.com`

If you see errors like:
- `auth/unauthorized-domain` → Add domain to Firebase authorized domains
- `auth/operation-not-allowed` → Enable Email/Password in Firebase
- `auth/invalid-email` → User entered fake email

---

## 📁 Deployment Order

After updating files:

```bash
# 1. Deploy Portal first (users create accounts here)
cd portal
npm install
npm run build
aws s3 sync dist/ s3://your-portal-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# 2. Deploy Cloud Practitioner site
cd ../cloud
npm install
npm run build
aws s3 sync dist/ s3://your-cloud-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# 3. Deploy AI Practitioner site
cd ../ai
npm install
npm run build
aws s3 sync dist/ s3://your-ai-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## ✅ Success Criteria

- [ ] Users can register with real email addresses
- [ ] Verification emails are received within 1-2 minutes
- [ ] Clicking verification link verifies the account
- [ ] Users can sign in after verification
- [ ] Signing in on one site logs you in on all three
- [ ] Signing out on one site logs you out of all three
- [ ] Guest mode works but doesn't persist across sites

---

## 🆘 Still Having Issues?

1. **Clear all cookies** for your domains and try again
2. **Try incognito mode** to rule out cached issues
3. **Check Firebase Console** → Authentication → Users to see if accounts are being created
4. **Check the browser console** for specific error messages
5. **Verify HTTPS** is working on all three sites (cookies require Secure flag)
