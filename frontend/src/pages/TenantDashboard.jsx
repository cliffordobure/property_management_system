import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import TenantSidebar from '../components/TenantSidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const { isOpen, toggle } = useMobileMenu();

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tenants/my-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantInfo(response.data);
      setError(null);
      setErrorCode(null);
    } catch (err) {
      console.error('Error fetching tenant info:', err);
      const errorData = err.response?.data || {};
      setError(errorData.message || 'Failed to load tenant information');
      setErrorCode(errorData.code);
      setUserEmail(errorData.userEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <TenantSidebar isOpen={isOpen} onClose={toggle} />
        <div className="flex-1 lg:ml-64 w-full">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggle}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm sm:text-base text-gray-700">Welcome, {user?.firstName || user?.email}</span>
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {errorCode === 'NO_TENANT_RECORD' ? (
                <>
                  {/* Alert Section */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-yellow-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-100 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Account Not Linked</h3>
                        <p className="text-yellow-800 mb-3">{error}</p>
                        {userEmail && (
                          <div className="bg-white rounded-lg p-3 border border-yellow-200">
                            <p className="text-sm text-yellow-700 mb-1">Your registered email:</p>
                            <p className="font-semibold text-yellow-900 break-all">{userEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Instructions Section */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3">What to do next:</h4>
                        <ol className="space-y-3">
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">1</span>
                            <span className="text-blue-800">Contact your property manager or landlord</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">2</span>
                            <span className="text-blue-800">
                              Provide them with your registered email: <strong className="text-blue-900">{userEmail || user?.email}</strong>
                            </span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">3</span>
                            <span className="text-blue-800">Ask them to add you as a tenant to a property using this email</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">4</span>
                            <span className="text-blue-800">Once added, refresh this page or log out and log back in</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={fetchTenantInfo}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : errorCode === 'EMAIL_MISMATCH' ? (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-100 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-900 mb-2">Account Mismatch</h3>
                        <p className="text-orange-800 mb-4">{error}</p>
                        <p className="text-orange-700 text-sm">
                          Please contact your property manager to resolve this issue.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <button
                      onClick={handleLogout}
                      className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                        <p className="text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={fetchTenantInfo}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <TenantSidebar isOpen={isOpen} onClose={toggle} />
        <div className="flex-1 lg:ml-64 w-full">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggle}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </h1>
              </div>
            </div>
          </header>
          <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 rounded-full p-3 flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Tenant Information</h3>
                    <p className="text-yellow-800">No tenant information found. Please contact your property manager to set up your account.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const daysUntilExpiry = tenantInfo.leaseExpiryDate ? getDaysUntilExpiry(tenantInfo.leaseExpiryDate) : null;
  const isLeaseExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  const isLeaseExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TenantSidebar isOpen={isOpen} onClose={toggle} />
      <div className="flex-1 lg:ml-64 w-full">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                My Dashboard
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">My Dashboard</h2>
          <p className="text-gray-600 text-lg">View your property and lease information</p>
        </div>

        {/* Lease Expiry Warning */}
        {isLeaseExpiring && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold">Lease Expiring Soon</p>
            </div>
            <p className="mt-1">Your lease expires in {daysUntilExpiry} day(s). Please contact your property manager to renew.</p>
          </div>
        )}

        {isLeaseExpired && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold">Lease Expired</p>
            </div>
            <p className="mt-1">Your lease expired {Math.abs(daysUntilExpiry)} day(s) ago. Please contact your property manager immediately.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Property Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Property Name</p>
                <p className="font-semibold text-lg text-gray-800">
                  {typeof tenantInfo.propertyId === 'object' 
                    ? tenantInfo.propertyId.propertyName 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">City</p>
                <p className="font-semibold text-gray-800">
                  {typeof tenantInfo.propertyId === 'object' && tenantInfo.propertyId.city
                    ? tenantInfo.propertyId.city
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Unit</p>
                <p className="font-semibold text-lg text-gray-800">
                  {typeof tenantInfo.unitId === 'object' 
                    ? tenantInfo.unitId.unitId 
                    : 'N/A'}
                </p>
              </div>
              {typeof tenantInfo.unitId === 'object' && tenantInfo.unitId.rentAmount && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                  <p className="font-semibold text-2xl text-blue-600">
                    KES {tenantInfo.unitId.rentAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-semibold text-lg text-gray-800">
                  {tenantInfo.firstName} {tenantInfo.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">
                  {tenantInfo.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-800">
                  {tenantInfo.phoneNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Lease Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lease Information
            </h3>
            <div className="space-y-4">
              {tenantInfo.moveInDate ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Move In Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(tenantInfo.moveInDate)}</p>
                </div>
              ) : null}
              {tenantInfo.leaseStartDate ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lease Start Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(tenantInfo.leaseStartDate)}</p>
                </div>
              ) : null}
              {tenantInfo.leaseExpiryDate ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lease Expiry Date</p>
                  <p className={`font-semibold text-lg ${isLeaseExpired ? 'text-red-600' : isLeaseExpiring ? 'text-yellow-600' : 'text-gray-800'}`}>
                    {formatDate(tenantInfo.leaseExpiryDate)}
                    {daysUntilExpiry !== null && (
                      <span className="text-sm font-normal ml-2 block mt-1">
                        {daysUntilExpiry > 0 ? `(${daysUntilExpiry} days remaining)` : '(Expired)'}
                      </span>
                    )}
                  </p>
                </div>
              ) : null}
              {!tenantInfo.moveInDate && !tenantInfo.leaseStartDate && !tenantInfo.leaseExpiryDate && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No lease information available</p>
                </div>
              )}
            </div>
          </div>

          {/* Deposit Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Deposit Information
            </h3>
            {tenantInfo.deposit ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deposit Type</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {tenantInfo.deposit.type || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                  <p className="font-semibold text-lg text-gray-800">
                    KES {(tenantInfo.deposit.paid || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deposit Amount</p>
                  <p className="font-semibold text-lg text-gray-800">
                    KES {(tenantInfo.deposit.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount Returned</p>
                  <p className="font-semibold text-lg text-gray-800">
                    KES {(tenantInfo.deposit.amountReturned || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No deposit information available</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information Section */}
        {(typeof tenantInfo.propertyId === 'object' || tenantInfo.notes) && (
          <div className="mt-6 grid grid-cols-1 gap-6">
            {/* Property Details Card (if needed) */}
            {typeof tenantInfo.propertyId === 'object' && 
             (tenantInfo.propertyId.streetName || 
              tenantInfo.propertyId.companyName || 
              tenantInfo.propertyId.mpesaPaybill || 
              tenantInfo.propertyId.mpesaTill ||
              tenantInfo.propertyId.paymentInstructions) && (
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Additional Property Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {tenantInfo.propertyId.streetName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Street Name</p>
                      <p className="font-semibold text-gray-800">{tenantInfo.propertyId.streetName}</p>
                    </div>
                  )}
                  {tenantInfo.propertyId.companyName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Company Name</p>
                      <p className="font-semibold text-gray-800">{tenantInfo.propertyId.companyName}</p>
                    </div>
                  )}
                  {tenantInfo.propertyId.mpesaPaybill && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">MPESA Paybill</p>
                      <p className="font-semibold text-gray-800">{tenantInfo.propertyId.mpesaPaybill}</p>
                    </div>
                  )}
                  {tenantInfo.propertyId.mpesaTill && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">MPESA Till</p>
                      <p className="font-semibold text-gray-800">{tenantInfo.propertyId.mpesaTill}</p>
                    </div>
                  )}
                  {tenantInfo.propertyId.paymentInstructions && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Payment Instructions</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded">{tenantInfo.propertyId.paymentInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {tenantInfo.notes && (
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </h3>
                <p className="text-gray-800 bg-gray-50 p-4 rounded">{tenantInfo.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Uploaded Files Section */}
        {tenantInfo.uploadedFiles && tenantInfo.uploadedFiles.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Uploaded Documents
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {tenantInfo.uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-800 font-medium">{file.originalName}</span>
                  </div>
                  <a
                    href={`${API_URL.replace('/api', '')}/uploads/tenants/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default TenantDashboard;
