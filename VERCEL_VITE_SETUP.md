# Vercel Setup for Vite - Correct Configuration

## ⚠️ Important: Root Directory Must Be Set!

When using Vercel with a monorepo (frontend in a subdirectory), you **MUST** set the Root Directory in Vercel dashboard.

## Step-by-Step Vercel Configuration

### 1. Go to Vercel Project Settings

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `property-management-system`
3. Click **Settings** tab

### 2. Set Root Directory

1. Go to **Settings** → **General**
2. Scroll to **Root Directory**
3. Click **Edit**
4. Select **`frontend`** folder
5. Click **Save**

**This is CRITICAL!** Without this, Vercel won't know where your frontend code is.

### 3. Configure Build Settings

After setting Root Directory, go to **Build & Development Settings**:

- **Framework Preset:** `Vite` (or `Other` if Vite not listed)
- **Build Command:** `npm run build` (NOT `cd frontend && npm run build`)
- **Output Directory:** `dist` (NOT `frontend/dist`)
- **Install Command:** `npm install` (NOT `cd frontend && npm install`)

### 4. Environment Variables

Go to **Settings** → **Environment Variables**:

Add:
- **Key:** `REACT_APP_API_URL`
- **Value:** `https://property-management-system-0qkr.onrender.com/api`
- **Environments:** Production, Preview, Development (all)

### 5. Deploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

## Why This Happens

When Root Directory is set to `frontend`, Vercel:
- Changes into the `frontend` directory automatically
- Runs all commands from that directory
- So you DON'T need `cd frontend` in build commands

## Current vercel.json

The `vercel.json` is now configured correctly:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Note:** If Root Directory is set in dashboard, these commands run from `frontend/` automatically.

## Alternative: If Root Directory Not Set

If you can't set Root Directory, update `vercel.json` to:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

But **recommended approach** is to set Root Directory to `frontend` in dashboard.

## Quick Checklist

- [ ] Root Directory set to `frontend` in Vercel dashboard
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Environment Variable `REACT_APP_API_URL` is set
- [ ] Code is pushed to GitHub

## Test Locally First

Before deploying, test locally:

```bash
cd frontend
npm install
npm run build
```

If this works locally, Vercel should work too (once Root Directory is set correctly).
