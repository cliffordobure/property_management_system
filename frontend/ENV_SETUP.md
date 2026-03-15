# Frontend Environment Variables Setup

## For Local Development

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## For Production (Vercel)

Set the following environment variable in your Vercel project settings:

**Variable Name:** `REACT_APP_API_URL`  
**Value:** `https://property-management-system-0qkr.onrender.com/api`

### How to Set in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Go to "Environment Variables"
4. Click "Add New"
5. Add:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://property-management-system-0qkr.onrender.com/api`
   - **Environment:** Production (and Preview if needed)
6. Click "Save"
7. Redeploy your application

## Current Backend URL

Your backend is deployed at: `https://property-management-system-0qkr.onrender.com`

API Base URL: `https://property-management-system-0qkr.onrender.com/api`

## Testing

After setting the environment variable, test the connection:

1. Visit your Vercel frontend URL
2. Open browser console (F12)
3. Check for any API connection errors
4. Try logging in

If you see CORS errors, make sure your backend has the frontend URL whitelisted in the CORS settings.
