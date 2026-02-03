# Quick Reference Guide

## 🔥 Firebase Console URLs

- **Main Console**: https://console.firebase.google.com/
- **Authentication**: Project → Build → Authentication
- **Firestore**: Project → Build → Firestore Database
- **Settings**: Project Settings (gear icon)

---

## 📝 Common Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy to AWS
```bash
chmod +x universal-deploy.sh
./universal-deploy.sh
```

---

## 🔧 File Locations

| What | Where |
|------|-------|
| Firebase Config | `src/config/firebase.config.js` |
| Auth Service | `src/services/sharedAuth.js` |
| Auth Context | `src/context/AuthContext.jsx` |
| Auth Screen | `src/components/AuthScreen.jsx` |
| User Badge | `src/components/UserBadge.jsx` |

---

## 🌐 Your Sites

| Site | URL | Purpose |
|------|-----|---------|
| Portal | aws-study-flashcards-app.com | Landing page |
| AI App | ai.aws-study-flashcards-app.com | AI Practitioner game |
| Cloud App | cloud.aws-study-flashcards-app.com | Cloud Practitioner game |

---

## 🎨 Customization Points

### Change Site Name
```javascript
// In App.jsx for each site
<AuthScreen 
  siteName="Your Custom Name"  // ← Change this
/>
```

### Change Accent Color
```javascript
// In UserBadge.css
.user-avatar {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR 100%);
}
```

### Change Cookie Expiration
```javascript
// In sharedAuth.js
const setAuthCookie = (token, expirationDays = 7) // ← Change days
```

---

## 🐛 Debug Checklist

### Authentication Issues
1. ✅ Check browser console for errors
2. ✅ Verify Firebase config is correct
3. ✅ Check Firebase Console → Authentication → Users
4. ✅ Try incognito/private mode
5. ✅ Clear cookies and try again

### Email Not Sending
1. ✅ Check spam folder
2. ✅ Verify email template is enabled in Firebase
3. ✅ Check Firebase Console → Authentication → Templates

### Cross-Domain Not Working
1. ✅ Verify all sites use HTTPS
2. ✅ Check cookie domain is `.aws-study-flashcards-app.com`
3. ✅ Verify all sites have identical Firebase config
4. ✅ Check browser DevTools → Application → Cookies

### Build Errors
1. ✅ Run `npm install` first
2. ✅ Delete `node_modules` and reinstall
3. ✅ Check for syntax errors in copied files
4. ✅ Verify all imports are correct

---

## 📞 Testing Workflow

### Test 1: Sign Up
```
1. Go to portal
2. Click sign up
3. Enter email/password
4. Check email
5. Click verification link
6. Sign in
```

### Test 2: Cross-Domain
```
1. Sign in on portal
2. Navigate to AI app → Should be logged in
3. Navigate to Cloud app → Should be logged in
4. Sign out from any → Should be out everywhere
```

### Test 3: Guest Mode
```
1. On any site, click "Continue as Guest"
2. Verify guest warning shows
3. Navigate to another site → Should be signed out
```

---

## 🔑 Important ARNs & IDs

Keep these handy:

```bash
# Certificate ARN (us-east-1)
arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT

# CloudFront Distribution IDs
Portal:  d1234567890abc
AI App:  d0987654321xyz
Cloud:   d5678901234def

# S3 Buckets
Portal:  aws-study-portal-hosting
AI App:  aws-ai-study-game-418272768335
Cloud:   aws-ccp-flashcards-app
```

---

## 🚀 Deployment Sequence

For first-time setup:

```bash
# 1. Portal (users create accounts here)
cd portal
./universal-deploy.sh
Select: 1

# 2. AI App
cd ../ai-app
./universal-deploy.sh
Select: 2

# 3. Cloud App
cd ../cloud-app
./universal-deploy.sh
Select: 3
```

---

## 💾 Backup Before Updating

```bash
# Backup current files
cp src/App.jsx src/App.jsx.backup
cp package.json package.json.backup
cp src/index.css src/index.css.backup

# If something goes wrong, restore:
cp src/App.jsx.backup src/App.jsx
```

---

## 🔐 Security Reminders

- ✅ Never commit Firebase config with real credentials to public repos
- ✅ Use environment variables in production
- ✅ Enable Firestore security rules before going live
- ✅ Rotate Firebase API keys if exposed
- ✅ Monitor Firebase Console → Authentication for suspicious activity

---

## 📊 Firebase Quotas (Free Tier)

| Service | Free Tier Limit |
|---------|----------------|
| Auth Users | 50,000/month |
| Firestore Reads | 50,000/day |
| Firestore Writes | 20,000/day |
| Firestore Storage | 1 GB |

---

## 🆘 Emergency Rollback

If something breaks:

1. **Restore S3 files**:
   ```bash
   aws s3 sync s3://your-backup-bucket/ s3://your-live-bucket/
   ```

2. **Rollback CloudFormation**:
   ```bash
   aws cloudformation update-stack \
     --stack-name your-stack \
     --use-previous-template
   ```

3. **Invalidate CloudFront**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"
   ```

---

## 📚 Useful Links

- Firebase Auth Docs: https://firebase.google.com/docs/auth
- Firebase Console: https://console.firebase.google.com/
- AWS ACM: https://console.aws.amazon.com/acm/
- AWS S3: https://s3.console.aws.amazon.com/
- AWS CloudFront: https://console.aws.amazon.com/cloudfront/

---

**Last Updated**: January 30, 2026
