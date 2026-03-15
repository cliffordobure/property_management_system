# Vercel Deployment Fix Guide

## Issues Found and Solutions

### Issue 1: Environment Variable Value is Truncated
**Problem:** The `REACT_APP_API_URL` value appears incomplete in the Vercel dashboard.

**Solution:** 
1. In Vercel dashboard, go to Environment Variables
2. Edit the `REACT_APP_API_URL` variable
3. Set the **complete** value:
   ```
   https://property-management-system-0qkr.onrender.com/api
   ```
4. Make sure there are no spaces or line breaks
5. Save and redeploy

### Issue 2: Build Command
**Problem:** Build command shows `react-scripts build` but should be `npm run build`

**Solution:**
1. In Vercel dashboard, go to Settings → General
2. Under "Build & Development Settings"
3. Change **Build Command** to: `npm run build`
4. Keep **Output Directory** as: `build`
5. Keep **Install Command** as: `npm install`

### Issue 3: Root Directory
**Current:** `frontend` ✓ (This is correct)

### Issue 4: Framework Preset
**Current:** Create React App ✓ (This is correct)

## Step-by-Step Fix

### 1. Fix Environment Variable
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Find `REACT_APP_API_URL`
4. Click **Edit** (or delete and recreate)
5. Set value to: `https://property-management-system-0qkr.onrender.com/api`
6. Make sure it's enabled for **Production**, **Preview**, and **Development**
7. Click **Save**

### 2. Fix Build Settings
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Update:
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
4. Click **Save**

### 3. Deploy
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Alternative: Use Vercel CLI

If dashboard doesn't work, you can use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add REACT_APP_API_URL production
# When prompted, enter: https://property-management-system-0qkr.onrender.com/api

# Deploy
vercel --prod
```

## Verify Configuration

After deployment, check:

1. **Build Logs:**
   - Go to Deployments → Click on deployment → View Build Logs
   - Should see: "Build completed successfully"

2. **Environment Variables:**
   - Settings → Environment Variables
   - Verify `REACT_APP_API_URL` shows complete URL

3. **Test in Browser:**
   - Visit your Vercel URL
   - Open browser console (F12)
   - Check Network tab
   - API calls should go to: `https://property-management-system-0qkr.onrender.com/api`

## Common Build Errors

### Error: "Module not found"
- **Fix:** Make sure Root Directory is set to `frontend`
- **Fix:** Ensure all dependencies are in `frontend/package.json`

### Error: "Build command failed"
- **Fix:** Change Build Command to `npm run build` (not `react-scripts build`)
- **Fix:** Check that Node.js version is compatible (Vercel auto-detects)

### Error: "Environment variable not found"
- **Fix:** Make sure variable name is exactly `REACT_APP_API_URL` (case-sensitive)
- **Fix:** Ensure it's enabled for the environment you're deploying to

### Error: ESLint errors
- **Fix:** We've already fixed all ESLint errors in the code
- **Fix:** If still seeing errors, check the build logs for specific file/line

## Quick Checklist

- [ ] Environment variable `REACT_APP_API_URL` is set correctly (complete URL)
- [ ] Build Command is `npm run build`
- [ ] Output Directory is `build`
- [ ] Root Directory is `frontend`
- [ ] Framework Preset is "Create React App"
- [ ] All ESLint errors are fixed (we did this already)
- [ ] Code is pushed to GitHub
- [ ] Vercel is connected to GitHub repo

## Still Having Issues?

1. **Check Build Logs:**
   - Go to Deployments → Click deployment → View full build logs
   - Look for specific error messages

2. **Try Manual Build Locally:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   If this works locally, the issue is with Vercel configuration

3. **Contact Support:**
   - Share the specific error from build logs
   - Include your `vercel.json` and `package.json` files
