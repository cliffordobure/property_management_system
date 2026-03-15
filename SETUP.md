# Turbine Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up MongoDB

#### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service:
   ```bash
   mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update the `MONGODB_URI` in `backend/.env`

### 3. Configure Environment Variables

#### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/turbine
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Create Uploads Directory

```bash
mkdir -p backend/uploads/tenants
```

### 5. Start the Application

#### Option A: Run Both Together (Recommended)
From the root directory:
```bash
npm run dev
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 6. Create Super Admin User

After starting the backend, create a super admin user directly in the database:

```bash
cd backend
npm run seed-admin
```

This will create a super admin with:
- **Email**: `admin@turbine.com` (or set `SUPER_ADMIN_EMAIL` in `.env`)
- **Password**: `admin123` (or set `SUPER_ADMIN_PASSWORD` in `.env`)
- **Name**: Super Admin (or set `SUPER_ADMIN_FIRST_NAME` and `SUPER_ADMIN_LAST_NAME` in `.env`)

**Optional**: You can customize the super admin credentials by adding these to `backend/.env`:
```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-secure-password
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
```

**Alternative Method**: If you prefer using the API (after seeding the first admin):
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "newadmin@turbine.com",
    "password": "admin123",
    "firstName": "New",
    "lastName": "Admin"
  }'
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## First Steps After Setup

1. **Register/Login**: 
   - Go to http://localhost:3000
   - Click "Get Started"
   - Register as Manager/Landlord or Tenant

2. **Complete Welcome Flow**:
   - Answer first-time login questions
   - Complete or skip onboarding

3. **Start Managing**:
   - Add your first property
   - Add units to the property
   - Add tenants to units

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `backend/.env`
- Verify network access if using MongoDB Atlas

### Port Already in Use
- Change the PORT in `backend/.env`
- Update `REACT_APP_API_URL` in `frontend/.env` accordingly

### File Upload Issues
- Ensure `backend/uploads/tenants` directory exists
- Check file permissions

### CORS Errors
- Ensure backend is running on the correct port
- Check `REACT_APP_API_URL` matches backend URL

## Development Tips

- Backend uses nodemon for auto-restart on file changes
- Frontend uses React's hot reload
- Check browser console and terminal for errors
- Use Redux DevTools extension for state debugging

## Production Deployment

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Set production environment variables

3. Use a process manager like PM2 for the backend:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js
   ```

4. Serve frontend build with a web server (nginx, Apache, etc.)
