import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import Sidebar from '../components/Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';

const TenantsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenants, loading } = useSelector((state) => state.tenants);
  const { properties } = useSelector((state) => state.properties);
  const { isOpen, toggle } = useMobileMenu();
  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchTenants());
  }, [dispatch]);

  const filteredTenants = tenants.filter(tenant => {
    const matchesProperty = !selectedProperty || 
      tenant.propertyId?._id === selectedProperty || 
      tenant.propertyId === selectedProperty;
    
    const matchesSearch = !searchQuery || 
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phoneNumber?.includes(searchQuery) ||
      (typeof tenant.propertyId === 'object' && tenant.propertyId?.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProperty && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.isActive !== false).length,
    inactive: tenants.filter(t => t.isActive === false).length,
    withEmail: tenants.filter(t => t.email).length
  };

  const getStatusColor = (isActive) => {
    return isActive !== false 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isOpen} onClose={toggle} />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Tenants
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/tenants/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Tenant
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 sm:py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm">Total Tenants</p>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm">Active Tenants</p>
                <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-100 text-sm">Inactive Tenants</p>
                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.inactive}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100 text-sm">With Email</p>
                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.withEmail}</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Tenants
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, or property..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Property</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Properties</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.propertyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      viewMode === 'cards'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Table
                  </button>
                </div>
              </div>
            </div>
            {selectedProperty || searchQuery ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredTenants.length} of {tenants.length} tenants</span>
                {(selectedProperty || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedProperty('');
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Tenants Display */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading tenants...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedProperty 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by adding your first tenant.'}
              </p>
              {!searchQuery && !selectedProperty && (
                <Link
                  to="/tenants/add"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First Tenant
                </Link>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTenants.map((tenant) => {
                const propertyName = typeof tenant.propertyId === 'object' 
                  ? tenant.propertyId?.propertyName 
                  : 'N/A';
                const unitId = typeof tenant.unitId === 'object' 
                  ? tenant.unitId?.unitId 
                  : 'N/A';
                const initials = `${tenant.firstName?.[0] || ''}${tenant.lastName?.[0] || ''}`.toUpperCase();

                return (
                  <div
                    key={tenant._id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden border border-gray-200"
                  >
                    {/* Card Header with Avatar */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative">
                      <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                          {initials || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">
                            {tenant.firstName} {tenant.lastName}
                          </h3>
                          <p className="text-blue-100 text-sm">{propertyName}</p>
                        </div>
                      </div>
                      <span className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-medium ${getStatusColor(tenant.isActive)}`}>
                        {tenant.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-gray-500">Property</p>
                            <p className="font-medium text-gray-800">{propertyName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-gray-500">Unit</p>
                            <p className="font-medium text-gray-800">{unitId}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium text-gray-800">{tenant.phoneNumber || 'N/A'}</p>
                          </div>
                        </div>

                        {tenant.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-gray-500">Email</p>
                              <p className="font-medium text-gray-800 truncate">{tenant.email}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => navigate(`/tenants/${tenant._id}`)}
                          className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100 transition mb-2"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Property</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Unit</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant) => {
                      const propertyName = typeof tenant.propertyId === 'object' 
                        ? tenant.propertyId?.propertyName 
                        : 'N/A';
                      const unitId = typeof tenant.unitId === 'object' 
                        ? tenant.unitId?.unitId 
                        : 'N/A';
                      const initials = `${tenant.firstName?.[0] || ''}${tenant.lastName?.[0] || ''}`.toUpperCase();

                      return (
                        <tr key={tenant._id} className="border-b hover:bg-gray-50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center text-blue-700 font-semibold">
                                {initials || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {tenant.firstName} {tenant.lastName}
                                </p>
                                {tenant.email && (
                                  <p className="text-sm text-gray-500">{tenant.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <span className="text-gray-700">{propertyName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-gray-700">{unitId}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-gray-700">{tenant.phoneNumber || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tenant.isActive)}`}>
                              {tenant.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => navigate(`/tenants/${tenant._id}`)}
                              className="text-blue-600 hover:text-blue-700 font-medium transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TenantsPage;
