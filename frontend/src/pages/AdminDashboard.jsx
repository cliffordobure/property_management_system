import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import AdminSidebar from '../components/AdminSidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isOpen, toggle } = useMobileMenu();
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, orgsRes, usersRes, propertiesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/organizations`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/properties/pending-verification`, { headers })
      ]);

      setStats(statsRes.data);
      setOrganizations(orgsRes.data);
      setUsers(usersRes.data);
      setPendingProperties(propertiesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${API_URL}/admin/users/${userId}/status`,
        { isActive: !currentStatus },
        { headers }
      );

      // Refresh users list
      const usersRes = await axios.get(`${API_URL}/admin/users`, { headers });
      setUsers(usersRes.data);

      // Refresh stats
      const statsRes = await axios.get(`${API_URL}/admin/stats`, { headers });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleVerifyProperty = async (propertyId, verified) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${API_URL}/properties/${propertyId}/verify`,
        { verified, verificationNotes: verified ? 'Property verified by admin' : null },
        { headers }
      );

      alert(verified ? 'Property verified successfully!' : 'Property verification updated');
      
      // Refresh pending properties
      const propertiesRes = await axios.get(`${API_URL}/admin/properties/pending-verification`, { headers });
      setPendingProperties(propertiesRes.data);
      
      // Refresh stats
      const statsRes = await axios.get(`${API_URL}/admin/stats`, { headers });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error verifying property:', error);
      alert(error.response?.data?.message || 'Failed to verify property');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/80 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex">
      <AdminSidebar isOpen={isOpen} onClose={toggle} />
      <div className="flex-1 lg:ml-64 w-full min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={toggle}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 hidden sm:block">System overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="hidden md:block flex-1 sm:flex-none max-w-xs">
                <input
                  type="text"
                  placeholder="Type here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                />
              </div>
              <div className="flex items-center gap-2 pl-2 sm:pl-0">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {(user?.firstName || user?.email || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">Welcome, {user?.firstName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">Admin Dashboard</h2>
            <p className="text-slate-500">System overview and management</p>
          </div>

        {/* Statistics - metric cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 mb-8">
            <div className="card-modern p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Organizations</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalOrganizations}</p>
            </div>
            <div className="card-modern p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Users</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
            </div>
            <div className="card-modern p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Properties</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalProperties}</p>
            </div>
            <div className="card-modern p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Tenants</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalTenants}</p>
            </div>
            <div className="card-modern p-5 col-span-2 sm:col-span-1 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Expected Earnings</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 break-words">
                {stats.expectedMonthlyEarnings?.toLocaleString() || '0'} KES
              </p>
            </div>
            <div className="card-modern p-5 col-span-2 sm:col-span-1 border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-1">Month Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-primary-600 break-words">
                {stats.currentMonthRevenue?.toLocaleString() || '0'} KES
              </p>
            </div>
          </div>
        )}

        {/* Properties Pending Verification */}
        {pendingProperties.length > 0 && (
          <div className="card-modern p-6 mb-8 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Properties Pending Verification ({pendingProperties.length})</h3>
            </div>
            <div className="space-y-4">
              {pendingProperties.map((property) => (
                <div key={property._id} className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 break-words">{property.propertyName}</h4>
                      <p className="text-sm text-slate-500 mt-1 break-words">
                        {property.organizationId?.name || 'Organization'} • {property.numberOfUnits} units • {property.city}, {property.country}
                      </p>
                      {property.calculatedPricing && (
                        <p className="text-sm text-primary-600 mt-1 break-words">
                          {property.calculatedPricing.planName?.toUpperCase()} — {property.calculatedPricing.planPrice?.toLocaleString()} {property.calculatedPricing.currency || 'KES'} / {property.calculatedPricing.billingPeriod || 'month'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleVerifyProperty(property._id, true)}
                        className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm font-medium"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter rejection reason (optional):');
                          if (notes !== null) handleVerifyProperty(property._id, false);
                        }}
                        className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Created: {new Date(property.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizations */}
        <div className="card-modern p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-5">Organizations</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-slate-100 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Owner</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Units</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Plan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Price</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{org.name}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{org.ownerId?.firstName} {org.ownerId?.lastName}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{org.totalUnits || 0}</td>
                    <td className="px-4 py-3.5 text-sm hidden md:table-cell">
                      {org.detectedPlan ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs bg-primary-100 text-primary-700 font-medium">
                          {org.detectedPlan.displayName || org.detectedPlan.name?.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm hidden lg:table-cell">
                      {org.detectedPlan ? (
                        <span className="font-semibold text-emerald-600">
                          {org.detectedPlan.monthlyPrice?.toLocaleString() || org.detectedPlan.price?.toLocaleString()} {org.detectedPlan.currency || 'KES'}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${org.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users */}
        <div className="card-modern p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-5">Users</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-slate-100 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 capitalize">{u.role}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
