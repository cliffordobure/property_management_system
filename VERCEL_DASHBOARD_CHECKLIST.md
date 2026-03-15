# ✅ Vercel Dashboard Settings Checklist

## ⚠️ IMPORTANT: Check These Settings in Vercel Dashboard

Since we deleted `vercel.json`, Vercel will use ONLY the dashboard settings. Make sure these are correct:

### 1. Root Directory ✅
- **Location:** Settings → General → Root Directory
- **Value:** `frontend`
- **Status:** Should already be set (you selected it)

### 2. Build & Development Settings

Go to: **Settings → General → Build & Development Settings**

**Framework Preset:**
- Should be: `Vite` (or `Other`)

**Build Command:**
- ❌ WRONG: `cd frontend && npm install && npm run build`
- ✅ CORRECT: `npm run build`
- **Make sure there's NO `cd frontend` in this field!**

**Output Directory:**
- ❌ WRONG: `frontend/dist`
- ✅ CORRECT: `dist`
- **Make sure it's just `dist`, not `frontend/dist`!**

**Install Command:**
- ❌ WRONG: `cd frontend && npm install`
- ✅ CORRECT: `npm install`
- **Make sure there's NO `cd frontend` in this field!**

### 3. Environment Variables

Go to: **Settings → Environment Variables**

**Required Variable:**
- **Key:** `REACT_APP_API_URL`
- **Value:** `https://property-management-system-0qkr.onrender.com/api`
- **Environments:** Production, Preview, Development (select all)

## 🔧 How to Fix Dashboard Settings

1. **Go to Vercel Dashboard** → Your Project → **Settings**

2. **Click "General"** in left sidebar

3. **Scroll to "Build & Development Settings"**

4. **Click "Edit"** on Build Command
   - Delete any `cd frontend` part
   - Should be just: `npm run build`
   - Save

5. **Click "Edit"** on Output Directory
   - Should be just: `dist`
   - NOT `frontend/dist`
   - Save

6. **Click "Edit"** on Install Command
   - Delete any `cd frontend` part
   - Should be just: `npm install`
   - Save

7. **Go to Deployments** tab

8. **Click "..."** on latest deployment

9. **Click "Redeploy"**

## Why This Will Work

- Root Directory = `frontend` means Vercel is already in that directory
- So commands should be: `npm install` and `npm run build` (no `cd` needed)
- Output is in `dist/` relative to `frontend/` directory

## Quick Test

After fixing settings, the build should show:
```
Installing dependencies...
added 174 packages...
Running "npm run build"
✓ built in X seconds
```

NOT:
```
cd frontend && npm install...
sh: line 1: cd: frontend: No such file or directory
```

Fix the dashboard settings and redeploy! 🚀
