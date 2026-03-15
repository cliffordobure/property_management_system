# Quick Deployment Checklist

## 🚀 Quick Start Guide

### 1. MongoDB Atlas Setup (5 minutes)
- [ ] Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create free cluster (M0)
- [ ] Create database user (save username/password)
- [ ] Whitelist IP: `0.0.0.0/0` (allow all)
- [ ] Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/turbine`

### 2. Backend on Render (10 minutes)
- [ ] Push code to GitHub
- [ ] Go to [render.com](https://render.com) → New Web Service
- [ ] Connect GitHub repo
- [ ] Settings:
  - **Name**: `turbine-backend`
  - **Root Directory**: `backend`
  - **Build**: `npm install`
  - **Start**: `npm start`
- [ ] Add Environment Variables:
  ```
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/turbine
  JWT_SECRET=your_32_character_secret_key_here
  PORT=10000
  NODE_ENV=production
  ENCRYPTION_KEY=your_32_character_encryption_key
  ```
- [ ] Deploy and copy URL: `https://turbine-backend.onrender.com`

### 3. Frontend on Vercel (5 minutes)
- [ ] Go to [vercel.com](https://vercel.com) → Add New Project
- [ ] Import GitHub repo
- [ ] Settings:
  - **Root Directory**: `frontend`
  - **Framework**: Create React App
- [ ] Add Environment Variable:
  ```
  REACT_APP_API_URL=https://property-management-system-0qkr.onrender.com/api
  ```
- [ ] Deploy and copy URL: `https://turbine.vercel.app`

### 4. Create Super Admin
- [ ] Go to Render → Your Service → Shell
- [ ] Run: `node scripts/seed-admin.js`
- [ ] Or update local `.env` with Atlas URI and run locally

### 5. Test
- [ ] Visit frontend URL
- [ ] Try logging in with super admin
- [ ] Check browser console for errors
- [ ] Test API: `https://your-backend.onrender.com/api/subscription-plans/public`

## ⚠️ Common Issues

**CORS Error?**
- Add `FRONTEND_URL=https://your-frontend.vercel.app` to Render env vars
- Or update `backend/server.js` CORS settings

**Backend not starting?**
- Check Render logs
- Verify MongoDB connection string
- Ensure all env vars are set

**Frontend can't connect?**
- Verify `REACT_APP_API_URL` in Vercel
- Check backend is running (visit backend URL)
- Check browser console for errors

**Database connection failed?**
- Verify IP whitelist in MongoDB Atlas
- Check connection string format
- Verify database user credentials

## 📝 Environment Variables Summary

### Render (Backend)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=10000
NODE_ENV=production
ENCRYPTION_KEY=...
FRONTEND_URL=https://your-frontend.vercel.app (optional)
```

### Vercel (Frontend)
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

## 🎉 Done!
Your app should now be live!
