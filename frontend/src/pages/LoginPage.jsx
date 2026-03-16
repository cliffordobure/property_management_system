import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, register, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState('manager'); // manager/landlord or tenant
  const [landlordListingType, setLandlordListingType] = useState('full_management'); // full_management | advertise_only
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    confirmPassword: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      // Check if user needs to complete welcome flow
      if (user?.isFirstTimeLogin) {
        navigate('/welcome');
      } else if (user?.role === 'tenant') {
        navigate('/tenant-dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (isLogin) {
      const role = loginType === 'manager' ? 'manager' : loginType === 'landlord' ? 'landlord' : 'tenant';
      await dispatch(login({ email: formData.email, password: formData.password, role }));
    } else {
      // Registration - managers cannot register themselves
      // When "Manager/Landlord/Admin" is selected for registration, it means "landlord"
      // because managers must be created by landlords and admins are created by super admin
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Only allow landlord and tenant registration
      // loginType 'manager' in registration context means 'landlord'
      const role = (loginType === 'manager' || loginType === 'landlord') ? 'landlord' : 'tenant';
      const payload = {
        email: formData.email,
        password: formData.password,
        role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      if (role === 'landlord') payload.listingType = landlordListingType;
      await dispatch(register(payload));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Fancyfy</h1>
          <p className="text-gray-600">Property Management System</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">{isLogin ? 'Login as:' : 'Register as:'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLoginType('manager')}
                className={`py-2 px-4 rounded-lg font-semibold transition ${
                  loginType === 'manager'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manager/Landlord/Admin
              </button>
              <button
                onClick={() => setLoginType('tenant')}
                className={`py-2 px-4 rounded-lg font-semibold transition ${
                  loginType === 'tenant'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tenant
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isLogin 
                ? 'Note: Admins can login using "Manager/Landlord/Admin" option'
                : 'Note: Managers must be created by landlords. Only Landlords and Tenants can register.'
              }
            </p>
            {!isLogin && (loginType === 'manager' || loginType === 'landlord') && (
              <>
                <p className="text-sm text-gray-600 mt-3 mb-1">How do you want to use Fancyfy?</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setLandlordListingType('full_management')}
                    className={`text-left py-2 px-4 rounded-lg border-2 font-medium transition ${
                      landlordListingType === 'full_management'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Manage my properties — Use the full system (tenants, invoices, reports).
                  </button>
                  <button
                    type="button"
                    onClick={() => setLandlordListingType('advertise_only')}
                    className={`text-left py-2 px-4 rounded-lg border-2 font-medium transition ${
                      landlordListingType === 'advertise_only'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Just list properties — Advertise only. Pay a one-time fee per property to list on Fancyfy.
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {landlordListingType === 'full_management'
                    ? 'You can create properties, add tenants, and use invoices & reports. Managers can be added from your dashboard.'
                    : 'You only list properties for visibility. No tenant or invoice management. A payment is required to list each property.'}
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {loginType !== 'tenant' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-600 hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
