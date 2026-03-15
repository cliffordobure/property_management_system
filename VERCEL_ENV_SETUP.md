# Vercel Environment Variable Setup

## Quick Setup Instructions

Your backend is deployed at: **https://property-management-system-0qkr.onrender.com**

### Step 1: Go to Vercel Dashboard
1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project

### Step 2: Add Environment Variable
1. Click **"Settings"** tab
2. Click **"Environment Variables"** in the left sidebar
3. Click **"Add New"** button
4. Fill in:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://property-management-system-0qkr.onrender.com/api`
   - **Environment:** Select all (Production, Preview, Development)
5. Click **"Save"**

### Step 3: Redeploy
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Test
1. Visit your Vercel frontend URL
2. Open browser console (F12 → Console)
3. Check that API calls are going to: `https://property-management-system-0qkr.onrender.com/api`
4. Try logging in

## Troubleshooting

**If API calls still go to localhost:**
- Make sure you redeployed after adding the environment variable
- Check that the variable name is exactly: `REACT_APP_API_URL` (case-sensitive)
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**If you see CORS errors:**
- The backend CORS is configured to allow all origins in production
- If issues persist, add your Vercel frontend URL to Render environment variables as `FRONTEND_URL`

## Current Configuration

- **Backend URL:** https://property-management-system-0qkr.onrender.com
- **API Base URL:** https://property-management-system-0qkr.onrender.com/api
- **Frontend:** Your Vercel deployment URL
