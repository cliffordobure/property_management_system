# 🚨 CRITICAL: Fix Vercel Dashboard Settings - Step by Step

## The Problem

Vercel is using **cached dashboard settings** that have `cd frontend` in the build command. Even with `vercel.json`, you MUST fix the dashboard.

## ⚠️ DO THIS NOW - Step by Step

### Step 1: Open Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click on your project: `property-management-system`

### Step 2: Go to Settings
1. Click **"Settings"** tab (top navigation)
2. Click **"General"** in the left sidebar

### Step 3: Find Build & Development Settings
1. Scroll down to **"Build & Development Settings"** section
2. You'll see three fields that need to be fixed

### Step 4: Fix Build Command
1. Find **"Build Command"** field
2. Click the **pencil/edit icon** next to it
3. **DELETE** the entire current value
4. Type exactly: `npm run build`
5. Click **"Save"** or press Enter

**Current (WRONG):** `cd frontend && npm install && npm run build`  
**Should be (CORRECT):** `npm run build`

### Step 5: Fix Output Directory
1. Find **"Output Directory"** field
2. Click the **pencil/edit icon** next to it
3. **DELETE** the entire current value
4. Type exactly: `dist`
5. Click **"Save"** or press Enter

**Current (WRONG):** `frontend/dist`  
**Should be (CORRECT):** `dist`

### Step 6: Fix Install Command
1. Find **"Install Command"** field
2. Click the **pencil/edit icon** next to it
3. **DELETE** the entire current value
4. Type exactly: `npm install`
5. Click **"Save"** or press Enter

**Current (WRONG):** `cd frontend && npm install`  
**Should be (CORRECT):** `npm install`

### Step 7: Verify Root Directory
1. Still in General settings
2. Find **"Root Directory"** field
3. Should show: `frontend`
4. If it's empty or wrong, click **"Edit"** and select `frontend` folder
5. Click **"Save"**

### Step 8: Clear Cache and Redeploy
1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu on the right
4. Click **"Redeploy"**
5. **IMPORTANT:** Uncheck **"Use existing Build Cache"** (to clear cache)
6. Click **"Redeploy"**

## ✅ What Should Happen

After fixing and redeploying, the build logs should show:

```
Installing dependencies...
added 174 packages in 8s
Running "npm run build"
vite v5.x.x building for production...
✓ built in X seconds
```

**NOT:**
```
cd frontend && npm install...
sh: cd: frontend: No such file or directory
```

## 📸 Visual Guide

If you can't find the settings:
1. Settings → General → Scroll down
2. Look for section: **"Build & Development Settings"**
3. You'll see three editable fields with pencil icons
4. Click each pencil icon to edit

## ⚠️ Why This Keeps Happening

Vercel caches dashboard settings. Even when you:
- Update `vercel.json`
- Push new commits
- The dashboard settings might still have the old `cd frontend` command

**The ONLY way to fix it is to manually edit the dashboard settings.**

## After Fixing

1. Wait for deployment to complete
2. Check build logs - should show success
3. Visit your Vercel URL
4. Test the app

**This WILL work once you fix the dashboard settings!** 🚀
