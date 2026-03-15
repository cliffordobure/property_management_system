# Vite Migration - Quick Start Guide

## ✅ Migration Complete!

Your app has been migrated from Create React App to Vite. Here's what to do next:

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install Vite and all required dependencies.

## Step 2: Test Locally

```bash
npm run dev
```

Your app will start on `http://localhost:3000` - much faster than before! ⚡

## Step 3: Update Vercel Settings ⚠️ CRITICAL

Go to your Vercel project dashboard and update:

1. **Root Directory:** `frontend` ⚠️ **MUST BE SET FIRST!**
   - Go to Settings → General → Root Directory
   - Click Edit → Select `frontend` folder → Save
   - **This is the most important step!**

2. **Framework Preset:** Select "Vite" (or "Other" if Vite isn't listed)
3. **Build Command:** `npm run build` (NOT `cd frontend && npm run build`)
4. **Output Directory:** `dist` (NOT `frontend/dist`)
5. **Install Command:** `npm install` (NOT `cd frontend && npm install`)

**Why?** When Root Directory is set to `frontend`, Vercel automatically runs all commands from that directory, so you don't need `cd frontend` in the commands.

## Step 4: Environment Variable

Make sure you have this environment variable set in Vercel:

- **Key:** `REACT_APP_API_URL`
- **Value:** `https://property-management-system-0qkr.onrender.com/api`
- **Environments:** Production, Preview, Development (all)

## Step 5: Deploy

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Migrate from CRA to Vite"
   git push
   ```

2. Vercel will automatically detect the changes and redeploy

3. Or manually trigger deployment from Vercel dashboard

## What's Different?

### Commands Changed:
- ❌ Old: `npm start` → ✅ New: `npm run dev`
- ❌ Old: `npm run build` → ✅ New: `npm run build` (same, but faster!)
- ✅ New: `npm run preview` (preview production build)

### Build Output:
- ❌ Old: `frontend/build/` → ✅ New: `frontend/dist/`

### Dev Server:
- Much faster startup
- Instant Hot Module Replacement (HMR)
- Better error messages

## Troubleshooting

### "Cannot find module 'vite'"
Run: `cd frontend && npm install`

### "Port 3000 already in use"
Vite will automatically try the next port, or change it in `vite.config.js`

### Build fails on Vercel
- Make sure Framework is set to "Vite"
- Verify Output Directory is `dist`
- Check Build Command is `npm run build`

### Styles not loading
- Make sure `tailwind.config.js` includes `"./index.html"` in content array
- Verify `postcss.config.js` exists

## Benefits You'll Notice

✅ **Faster builds** - Build time reduced significantly
✅ **Faster dev server** - Starts in milliseconds
✅ **Better Vercel support** - Vite is officially supported
✅ **Simpler config** - Less complexity
✅ **Smaller bundles** - Better optimization

Enjoy your faster development experience! 🚀
