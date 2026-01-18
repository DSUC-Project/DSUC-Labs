# 🔐 Google Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for the DSUC Labs application.

## Overview

The app now supports **dual authentication**:
1. **Wallet Login** (Phantom/Solflare) - Original method
2. **Google Login** - New conventional method

Users who registered with wallet can **link their Google account** to enable email-based login.

---

## 📋 Prerequisites

1. A Google Cloud Platform account
2. Access to the Supabase database (to run migration)
3. Backend and frontend environment access

---

## 🔧 Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 1.2 Create a New Project (or use existing)
- Click "Select Project" → "New Project"
- Name: `DSUC Labs` (or your preferred name)

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - App name: `DSUC Labs`
   - User support email: Your email
   - Developer contact: Your email
4. Scopes: Add `email`, `profile`, `openid`
5. Test users: Add your test emails (if in testing mode)

### 1.4 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `DSUC Labs Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://dsuc.fun
   https://www.dsuc.fun
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3001/api/auth/google/callback
   https://your-backend-domain.com/api/auth/google/callback
   ```
7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret**

---

## 🗄️ Step 2: Run Database Migration

Execute the migration script in Supabase SQL Editor:

```sql
-- Migration: Add Google Authentication Support

ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet' 
    CHECK (auth_provider IN ('wallet', 'google', 'both')),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id);
```

Or run the file: `backend/database/migration_google_auth.sql`

---

## ⚙️ Step 3: Configure Environment Variables

### Backend (.env) - Local Development

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

### Frontend (.env.local) - Local Development

```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### Production Deployment

Set these environment variables on your deployment platform (Vercel, Render, Railway, etc.):

**Backend Variables:**
- `GOOGLE_CLIENT_ID` - Same as local (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` - Your secret key (keep this private!)
- `GOOGLE_CALLBACK_URL` - Update to: `https://your-backend-domain.com/api/auth/google/callback`
- `FRONTEND_URL` - Update to: `https://your-frontend-domain.com`
- `JWT_SECRET` - Generate a strong random string (min 32 characters)
- `NODE_ENV` - Set to `production`

**Frontend Variables:**
- `VITE_GOOGLE_CLIENT_ID` - Same as backend

> ⚠️ **Important**: 
> - The `GOOGLE_CLIENT_ID` must be the same in both backend and frontend
> - Never commit `.env` files with secrets - use `.env.example` as template
> - On production platforms, set variables through the dashboard/CLI (don't hardcode in files)

---

## 🚀 How to Configure on Deployment Platforms

### For Render.com (Backend)

1. Go to your Render service dashboard
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable**
4. Add each variable:
   - Key: `GOOGLE_CLIENT_ID`
   - Value: `your_client_id.apps.googleusercontent.com`
5. Repeat for all variables listed above
6. Click **Save** - service will redeploy automatically

**Example Screenshot Path:** Dashboard → Service → Settings → Environment

---

### For Vercel (Frontend)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add variable:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: `your_client_id.apps.googleusercontent.com`
   - Environments: Select (Production, Preview, Development)
4. Click **Save**
5. Redeploy: Go to **Deployments** → Click **Redeploy** on latest

**Example Screenshot Path:** Dashboard → Project → Settings → Environment Variables

---

### For Netlify (Frontend)

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Build & deploy** → **Environment**
3. Click **Edit variables**
4. Add:
   - Key: `VITE_GOOGLE_CLIENT_ID`
   - Value: `your_client_id.apps.googleusercontent.com`
5. Click **Save**
6. Trigger redeploy: Go to **Deployments** → Click **Trigger deploy**

---

### For Railway (Backend/Frontend)

1. Open your Railway project
2. Select the service (Backend or Frontend)
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: `your_client_id.apps.googleusercontent.com`
6. Service will auto-redeploy

---

### For Supabase Hosting / Other Platforms

**General Steps (Most Platforms):**
1. Find **Environment Variables**, **Config**, or **Settings** section
2. Look for a button like "+ Add Variable", "New Variable", or "Configure"
3. Enter Key-Value pairs
4. Save and wait for automatic redeploy
5. Or manually trigger a redeploy

**Common locations:**
- Render: Settings → Environment
- Vercel: Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
- Railway: Variables tab
- Heroku: Settings → Config Vars
- AWS: Parameter Store or Secrets Manager
- DigitalOcean: App Spec or Environment tab

---

### Important: Update Google OAuth Authorized URIs

When you know your production domain, add it to Google Cloud Console:

1. Go to https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   ```
   https://your-frontend-domain.com
   ```
4. Add to **Authorized redirect URIs**:
   ```
   https://your-backend-domain.com/api/auth/google/callback
   ```
5. Click **Save**

> ⚠️ **Critical**: Your app won't work on production until you add the production domains to Google OAuth!

---

## 🚀 Step 4: Pre-populate Member Emails (Optional)

For existing wallet users to login with Google, their email must be in the database.

### Option A: Admin adds emails manually
```sql
UPDATE members 
SET email = 'user@gmail.com'
WHERE wallet_address = 'ABC...XYZ';
```

### Option B: Users link their own Google account
1. User logs in with wallet (existing flow)
2. Goes to **My Profile**
3. Clicks **"Link Google Account"**
4. Authenticates with Google
5. Email is automatically saved

---

## 🔄 Authentication Flow

### New User Flow (Google)
```
User clicks "Login with Google"
        ↓
Google OAuth popup appears
        ↓
User authenticates with Google
        ↓
Backend checks if email exists in members table
        ↓
  ├── YES → Login successful, return JWT token
  └── NO → Error: "Email not registered"
```

### Existing Wallet User - Link Google
```
User logs in with Wallet
        ↓
Goes to Profile → "Link Google Account"
        ↓
Google OAuth popup appears
        ↓
Backend links Google ID + Email to existing account
        ↓
User can now login with either Wallet OR Google
```

---

## 📁 Changed Files Summary

### Backend
| File | Changes |
|------|---------|
| `package.json` | Added passport, google-oauth20, jwt, cookie-parser |
| `src/index.ts` | Added cookie-parser and passport middleware |
| `src/middleware/auth.ts` | Added JWT auth, combined wallet+token auth |
| `src/routes/auth.ts` | Added Google OAuth routes |
| `database/migration_google_auth.sql` | New migration file |

### Frontend
| File | Changes |
|------|---------|
| `package.json` | Added @react-oauth/google, jwt-decode |
| `App.tsx` | Wrapped with GoogleOAuthProvider, checkSession |
| `types.ts` | Added email, google_id, auth_provider fields |
| `store/useStore.ts` | Added loginWithGoogle, linkGoogleAccount, checkSession |
| `components/Layout.tsx` | Added Google login button in modal |
| `pages/MyProfile.tsx` | Added "Link Google Account" section |

---

## 🧪 Testing

### Test Google Login
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Click "Connect" button
4. Click "Sign in with Google"
5. Authenticate with a pre-registered email
6. Should redirect back and show user profile

### Test Google Link
1. Login with wallet first
2. Go to "My Profile"
3. Scroll to "Link Account" section
4. Click "Sign in with Google"
5. After success, email should appear linked

---

## 🔒 Production Checklist

- [ ] Update `GOOGLE_CALLBACK_URL` to production domain
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Add production domains to Google OAuth authorized origins
- [ ] Generate a strong `JWT_SECRET` (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS on both frontend and backend
- [ ] Run database migration on production Supabase

---

## ❓ Troubleshooting

### "Email not registered" error
- The Google email is not in the members table
- Ask admin to add the email, or login with wallet first and link Google

### "Invalid token" error
- JWT_SECRET mismatch between instances
- Token expired (default 7 days)
- Clear localStorage and cookies, then re-login

### Google popup blocked
- Check browser popup settings
- Ensure authorized origins are correct in Google Console

### CORS errors
- Verify `credentials: true` in CORS config
- Check that frontend URL is in allowed origins list
