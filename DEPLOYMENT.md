# Deployment Guide - Turbine Property Management System

This guide will help you deploy the Turbine application:
- **Backend**: Render.com
- **Frontend**: Vercel.com
- **Database**: MongoDB Atlas (Cloud)

---

## Prerequisites

1. **GitHub Account**: Push your code to GitHub
2. **MongoDB Atlas Account**: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Render Account**: [https://render.com](https://render.com)
4. **Vercel Account**: [https://vercel.com](https://vercel.com)

---

## Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select a cloud provider and region (choose closest to your users)
   - Name your cluster (e.g., "turbine-cluster")
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password (SAVE THESE!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Addresses**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Add Current IP Address"
   - For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `turbine` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/turbine?retryWrites=true&w=majority`
   - **SAVE THIS STRING** - You'll need it for Render

---

## Step 2: Deploy Backend to Render

### 2.1 Prepare Backend for Deployment

1. **Update CORS Settings** (if needed)
   - The backend already has CORS enabled, but we'll verify it works with Vercel

2. **Create `render.yaml`** (Optional - for infrastructure as code)
   - See `render.yaml` file in the root directory

### 2.2 Deploy via Render Dashboard

1. **Connect GitHub Repository**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository

2. **Configure Web Service**
   - **Name**: `turbine-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or upgrade for better performance)

3. **Add Environment Variables**
   Click "Add Environment Variable" and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/turbine?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
   PORT=10000
   NODE_ENV=production
   ENCRYPTION_KEY=your_32_character_encryption_key_for_bank_credentials
   ```

   **Optional (for SMS):**
   ```
   AFRICAS_TALKING_API_KEY=your_api_key
   AFRICAS_TALKING_USERNAME=your_username
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete (usually 2-5 minutes)
   - **Copy your service URL** (e.g., `https://turbine-backend.onrender.com`)

### 2.3 Important Notes for Render

- **Free Tier Limitations**:
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down takes ~30 seconds
  - Consider upgrading to paid plan for production

- **File Uploads**:
  - Render's filesystem is ephemeral (files are lost on restart)
  - For production, consider using:
    - AWS S3
    - Cloudinary
    - Google Cloud Storage
  - For now, uploads will work but won't persist across deployments

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend

1. **Update API URL**
   - Create `.env.production` in the `frontend` directory:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

2. **Update CORS** (if needed)
   - The backend CORS should already allow all origins
   - If you have issues, we'll update the backend CORS settings

### 3.2 Deploy via Vercel Dashboard

1. **Connect GitHub Repository**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Add Environment Variables**
   Click "Add" and add:
   ```
   REACT_APP_API_URL=https://property-management-system-0qkr.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Wait for deployment (usually 1-3 minutes)
   - **Copy your frontend URL** (e.g., `https://turbine.vercel.app`)

### 3.3 Update Backend CORS (if needed)

If you encounter CORS errors, update `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true
}));
```

Or for development, you can temporarily allow all origins:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```

---

## Step 4: Post-Deployment Checklist

### 4.1 Backend (Render)

- [ ] Backend is accessible at Render URL
- [ ] MongoDB connection is working (check Render logs)
- [ ] Environment variables are set correctly
- [ ] API endpoints are responding
- [ ] Test: `https://your-backend.onrender.com/api/subscription-plans/public`

### 4.2 Frontend (Vercel)

- [ ] Frontend is accessible at Vercel URL
- [ ] Environment variable `REACT_APP_API_URL` is set
- [ ] Frontend can connect to backend API
- [ ] Test login functionality
- [ ] Test API calls from frontend

### 4.3 Database

- [ ] MongoDB Atlas cluster is running
- [ ] Database user has correct permissions
- [ ] IP whitelist includes Render's IPs (or 0.0.0.0/0)
- [ ] Connection string is correct

### 4.4 Create Super Admin

After deployment, you need to create the super admin:

1. **Option 1: Via Render Shell**
   - Go to Render Dashboard → Your Service → "Shell"
   - Run: `node scripts/seed-admin.js`

2. **Option 2: Via API** (if you have a registration endpoint)
   - Or manually create via MongoDB Atlas

3. **Option 3: Local Script**
   - Update `MONGODB_URI` in your local `.env` to point to Atlas
   - Run: `cd backend && node scripts/seed-admin.js`

---

## Step 5: Update Frontend API URL

After deployment, update the frontend to use the production API:

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Environment Variables
   - Update `REACT_APP_API_URL` to your Render backend URL
   - Redeploy

2. **Or create `.env.production` locally**:
   ```env
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```
   Then commit and push to trigger a new deployment

---

## Step 6: Custom Domain (Optional)

### Backend (Render)
- Go to your service → Settings → Custom Domains
- Add your domain
- Update DNS records as instructed

### Frontend (Vercel)
- Go to your project → Settings → Domains
- Add your domain
- Update DNS records as instructed

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- **Solution**: Check Render logs for errors
- Verify all environment variables are set
- Check MongoDB connection string

**Problem**: CORS errors
- **Solution**: Update CORS settings in `server.js` to include your Vercel URL

**Problem**: Slow first request
- **Solution**: This is normal on Render free tier (spins down after inactivity)
- Consider upgrading to paid plan

### Frontend Issues

**Problem**: API calls failing
- **Solution**: 
  - Verify `REACT_APP_API_URL` is set correctly
  - Check browser console for errors
  - Verify backend is accessible

**Problem**: Build fails
- **Solution**: 
  - Check Vercel build logs
  - Ensure all dependencies are in `package.json`
  - Check for TypeScript/ESLint errors

### Database Issues

**Problem**: Connection timeout
- **Solution**: 
  - Verify IP whitelist in MongoDB Atlas
  - Check connection string format
  - Verify database user credentials

---

## Security Checklist

- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Use strong ENCRYPTION_KEY (32 characters)
- [ ] MongoDB Atlas user has strong password
- [ ] IP whitelist is configured (consider restricting to Render IPs)
- [ ] Environment variables are not committed to Git
- [ ] HTTPS is enabled (automatic on Render and Vercel)
- [ ] CORS is configured correctly (not too permissive)

---

## Monitoring

### Render
- View logs: Dashboard → Your Service → Logs
- Monitor uptime: Dashboard → Your Service → Metrics

### Vercel
- View logs: Dashboard → Your Project → Deployments → Click deployment → Logs
- Monitor analytics: Dashboard → Your Project → Analytics

### MongoDB Atlas
- Monitor cluster: Atlas Dashboard → Your Cluster → Metrics
- View logs: Atlas Dashboard → Your Cluster → Logs

---

## Next Steps

1. **Set up monitoring** (optional)
   - Consider adding error tracking (Sentry, LogRocket)
   - Set up uptime monitoring (UptimeRobot, Pingdom)

2. **File storage** (for production)
   - Set up AWS S3 or Cloudinary for file uploads
   - Update file upload logic to use cloud storage

3. **Email service** (optional)
   - Set up SendGrid, Mailgun, or AWS SES
   - Add email notifications

4. **Backup strategy**
   - Set up MongoDB Atlas automated backups
   - Consider daily database exports

---

## Support

If you encounter issues:
1. Check the logs in Render and Vercel dashboards
2. Verify all environment variables are set correctly
3. Test API endpoints directly using Postman or curl
4. Check MongoDB Atlas connection status

Good luck with your deployment! 🚀
