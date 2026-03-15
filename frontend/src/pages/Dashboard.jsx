import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { properties, loading } = useSelector((state) => state.properties);
  const { isOpen, toggle } = useMobileMenu();

  useEffect(() => {
    if (user?.role === 'tenant') {
      navigate('/tenant-dashboard');
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (user?.organizationId) {
      dispatch(fetchProperties());
    }
  }, [dispatch, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50/80 flex">
      <Sidebar isOpen={isOpen} onClose={toggle} />

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
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-sm text-slate-500 hidden sm:block">Manage your portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="hidden md:block flex-1 sm:flex-none max-w-xs">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                />
              </div>
              <div className="flex items-center gap-2 pl-2 sm:pl-0">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">Welcome, {user?.firstName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-slate-500">Landlord</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">Dashboard</h2>
            <p className="text-slate-500">Manage your properties, units, and tenants</p>
          </div>

          {/* Quick Actions - Modern cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Link
              to="/properties/add"
              className="group card-modern p-6 sm:p-8 text-left block"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Add Property</h3>
              <p className="text-sm text-slate-500">Create a new property</p>
            </Link>

            <Link
              to="/units/add"
              className="group card-modern p-6 sm:p-8 text-left block"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Add Unit</h3>
              <p className="text-sm text-slate-500">Add a new unit to a property</p>
            </Link>

            <Link
              to="/tenants/add"
              className="group card-modern p-6 sm:p-8 text-left block"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Add Tenant</h3>
              <p className="text-sm text-slate-500">Register a new tenant</p>
            </Link>
          </div>

          {/* Properties Section */}
          <div className="card-modern p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Properties</h3>
              <Link
                to="/properties/add"
                className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition shadow-card"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Property
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-6">No properties yet. Get started by adding your first property.</p>
                <Link
                  to="/properties/add"
                  className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition shadow-card"
                >
                  Add Your First Property
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="text-left py-4 px-5 font-semibold text-slate-600 text-sm">Property Name</th>
                      <th className="text-left py-4 px-5 font-semibold text-slate-600 text-sm">Units</th>
                      <th className="text-left py-4 px-5 font-semibold text-slate-600 text-sm">City</th>
                      <th className="text-left py-4 px-5 font-semibold text-slate-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                        <td className="py-4 px-5 font-medium text-slate-800">{property.propertyName}</td>
                        <td className="py-4 px-5 text-slate-600">{property.numberOfUnits}</td>
                        <td className="py-4 px-5 text-slate-600">{property.city}</td>
                        <td className="py-4 px-5">
                          <button
                            onClick={() => navigate(`/properties/${property._id}`)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
