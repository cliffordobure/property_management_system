# Turbine - Property Management System

<!-- Updated to trigger Vercel deployment -->

A comprehensive SaaS property management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Redux Toolkit.

## Features

- **Multi-tenant SaaS Architecture**: Support for multiple organizations
- **User Roles**: Admin, Manager/Landlord, and Tenant
- **Property Management**: Add and manage properties with detailed information
- **Unit Management**: Create and manage units within properties
- **Tenant Management**: Comprehensive tenant registration and tracking
- **Onboarding Flow**: First-time login welcome and onboarding screens
- **File Uploads**: Support for tenant document uploads
- **Modern UI**: Built with TailwindCSS for a beautiful, responsive interface

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- bcryptjs for password hashing

### Frontend
- React.js 18
- Redux Toolkit for state management
- React Router for navigation
- TailwindCSS for styling
- Axios for API calls

## Project Structure

```
turbine/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── store/       # Redux store and slices
│   │   ├── utils/       # Utility functions
│   │   └── App.js       # Main app component
│   └── public/
└── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd turbine
   ```

2. **Install dependencies**
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

3. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/turbine
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   
   From the root directory:
   ```bash
   npm run dev
   ```
   
   This will start both the backend server (port 5000) and frontend development server (port 3000).

   Or run them separately:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## Usage

### Creating an Admin User

To create an admin user, you can use the admin API endpoint:

```bash
POST http://localhost:5000/api/admin/create-admin
Content-Type: application/json

{
  "email": "admin@turbine.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User"
}
```

### User Registration Flow

1. **Landing Page**: Welcome page with system overview
2. **Login/Register**: Choose between Manager/Landlord or Tenant
3. **Welcome Page**: First-time login questions
4. **Onboarding**: Optional onboarding screens (can be skipped)
5. **Dashboard**: Main management interface

### Adding Properties

1. Navigate to Dashboard
2. Click "Add Property"
3. Fill in required fields:
   - Property Name
   - Number of Units
   - City
4. Optionally fill in additional fields (water rate, electricity rate, MPESA details, etc.)
5. Add recurring bills if needed
6. Submit the form

### Adding Units

1. Navigate to Dashboard
2. Click "Add Unit"
3. Select a property
4. Enter unit ID/name and rent amount
5. Optionally set tax rate and recurring bills (inherited from property, editable)
6. Submit the form

### Adding Tenants

1. Navigate to Dashboard
2. Click "Add Tenant"
3. Select property and unit
4. Fill in required information:
   - First Name
   - Last Name
   - Phone Number
5. Optionally add deposit information, contact details, lease dates, and upload files
6. Submit the form

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/welcome` - Update welcome information
- `PUT /api/auth/onboarding/complete` - Complete onboarding
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Units
- `GET /api/units` - Get all units (optional: ?propertyId=)
- `GET /api/units/:id` - Get single unit
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Tenants
- `GET /api/tenants` - Get all tenants (optional: ?propertyId=, ?unitId=)
- `GET /api/tenants/:id` - Get single tenant
- `POST /api/tenants` - Create tenant (multipart/form-data for file uploads)
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/organizations` - Get all organizations
- `GET /api/admin/users` - Get all users
- `POST /api/admin/create-admin` - Create admin user
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/organizations/:id` - Delete organization

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # Starts React development server
```

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

The build folder will contain the production-ready static files.

### Backend
```bash
cd backend
npm start
```

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- Protected routes require valid authentication tokens
- File uploads are stored in the `uploads/tenants` directory
- Environment variables should be kept secure and not committed to version control

## License

This project is licensed under the ISC License.

## Support

For support, please contact the development team or create an issue in the repository.
