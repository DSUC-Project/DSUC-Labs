# 🚀 Render Deployment with render.yaml

This guide helps you deploy the DSUC Labs backend using Render's infrastructure-as-code approach.

## Prerequisites

1. GitHub account with DSUC-Labs repository
2. Render account (https://render.com)
3. Google OAuth credentials
4. Supabase project credentials

---

## Step 1: Push render.yaml to GitHub

The `render.yaml` file is already in your repo. Commit and push it:

```bash
git add render.yaml
git commit -m "Add render.yaml for backend deployment"
git push origin main
```

---

## Step 2: Connect GitHub to Render

1. Go to **https://dashboard.render.com**
2. Click **"New +"** → **"Blueprint"**
3. Select **"Public Git repository"**
4. Paste your repo URL: `https://github.com/DSUC-Project/DSUC-Labs`
5. Click **"Connect"**

---

## Step 3: Configure Blueprint

1. **Blueprint Name**: `DSUC Labs Backend` (or your preferred name)
2. **Branch**: `main` (or your branch with render.yaml)
3. Click **"Create Blueprint"**

Render will parse the `render.yaml` file automatically.

---

## Step 4: Set Environment Variables

After Render loads the blueprint, it will show the services to deploy.

Click on the **"dsuc-lab-backend"** service and set the following environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase project settings |
| `SUPABASE_ANON_KEY` | `your-anon-key` | From Supabase project settings |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `your-secret-key` | Keep this SECRET! From Google Cloud |
| `GOOGLE_CALLBACK_URL` | See Step 5 below | You'll get this after first deploy |
| `JWT_SECRET` | Generate random 32+ char string | Use: `openssl rand -base64 32` |
| `FRONTEND_URL` | `https://dsuc.fun` | Your frontend domain |

> ⚠️ **IMPORTANT**: Do NOT commit sensitive values to GitHub. Set them only in Render dashboard.

---

## Step 5: Deploy

1. After setting all environment variables, click **"Deploy"**
2. Render will:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Start the service (`npm start`)
3. Monitor the deployment in the **"Events"** tab

---

## Step 6: Get Your Render Domain

Once deployed successfully:

1. Go to your service page
2. Look for **"Rendering Subdomain"** or **"Internal Address"**
3. Your backend will be at: `https://dsuc-lab-backend.onrender.com`

---

## Step 7: Update Google OAuth URIs

Now that you have your Render domain:

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized redirect URIs**:
   ```
   https://dsuc-lab-backend.onrender.com/api/auth/google/callback
   ```
4. Save changes

5. **Update Render Environment Variable**:
   - Go back to Render dashboard
   - Edit the service
   - Update `GOOGLE_CALLBACK_URL` to:
     ```
     https://dsuc-lab-backend.onrender.com/api/auth/google/callback
     ```
   - Save and redeploy

---

## Updating render.yaml

When you update `render.yaml`, commit and push to GitHub:

```bash
git add render.yaml
git commit -m "Update render.yaml config"
git push origin main
```

Then redeploy from Render:
1. Go to your Blueprint
2. Click **"Deploy latest"**

---

## Troubleshooting

### Build fails
- Check logs in **Events** tab
- Verify `rootDir: backend` in render.yaml
- Ensure `npm run build` works locally: `cd backend && npm run build`

### App crashes after deploy
- Check **Logs** tab for errors
- Verify all environment variables are set
- Check that Supabase credentials are correct

### Google OAuth not working
- Verify `GOOGLE_CALLBACK_URL` matches exactly in both Render and Google Console
- Check frontend CORS settings include your domain

### Service keeps redeploying
- This is normal on free tier during cold starts
- Consider upgrading to paid tier for stable deployment

---

## render.yaml Reference

The `render.yaml` defines:
- **Service type**: `web` (HTTP service)
- **Runtime**: `node` (Node.js environment)
- **Build command**: Installs deps and compiles TypeScript
- **Start command**: Runs the compiled JavaScript
- **Root directory**: `backend` (where package.json is)
- **Environment variables**: Needed for the app to run
- **Repository**: Points to your GitHub repo

For more details: https://render.com/docs/yaml-specification

