import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    userRole: '',
    resourceType: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API_URL}/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(response.data.logs);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/admin/audit-logs/stats/overview?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data);
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleView = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      user: 'bg-purple-100 text-purple-800',
      organization: 'bg-green-100 text-green-800',
      property: 'bg-yellow-100 text-yellow-800',
      tenant: 'bg-orange-100 text-orange-800',
      invoice: 'bg-indigo-100 text-indigo-800',
      payment: 'bg-teal-100 text-teal-800',
      expense: 'bg-pink-100 text-pink-800',
      maintenance: 'bg-cyan-100 text-cyan-800',
      complaint: 'bg-red-100 text-red-800',
      claim: 'bg-amber-100 text-amber-800',
      system: 'bg-gray-100 text-gray-800',
      admin: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Logs
              </h1>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalLogs}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Success</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.byStatus?.find(s => s._id === 'success')?.count || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.byStatus?.find(s => s._id === 'failed')?.count || 0}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.byCategory?.length || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="auth">Auth</option>
                  <option value="user">User</option>
                  <option value="organization">Organization</option>
                  <option value="property">Property</option>
                  <option value="tenant">Tenant</option>
                  <option value="invoice">Invoice</option>
                  <option value="payment">Payment</option>
                  <option value="expense">Expense</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="complaint">Complaint</option>
                  <option value="claim">Claim</option>
                  <option value="system">System</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                <select
                  value={filters.userRole}
                  onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="landlord">Landlord</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Property">Property</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Payment">Payment</option>
                  <option value="Expense">Expense</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Claim">Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action (Search)</label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  placeholder="Search actions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({
                      category: '',
                      status: '',
                      userRole: '',
                      resourceType: '',
                      action: '',
                      startDate: '',
                      endDate: ''
                    });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Audit Logs List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Audit Logs ({pagination.total})
              </h2>
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs</h3>
                <p className="text-gray-500">No audit logs found matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(log.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {log.userId?.firstName && log.userId?.lastName
                                ? `${log.userId.firstName} ${log.userId.lastName}`
                                : log.userEmail || 'System'}
                            </div>
                            {log.userRole && (
                              <div className="text-xs text-gray-500 capitalize">{log.userRole}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(log.category)}`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{log.action}</div>
                            {log.resourceType && (
                              <div className="text-xs text-gray-500">
                                {log.resourceType}
                                {log.resourceId && ` #${log.resourceId.toString().slice(-6)}`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleView(log)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* View Log Details Modal */}
          {showModal && selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Audit Log Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedLog(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                      <p className="font-semibold text-gray-800">{formatDate(selectedLog.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusColor(selectedLog.status)}`}>
                        {selectedLog.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Action</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedLog.action}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getCategoryColor(selectedLog.category)}`}>
                        {selectedLog.category}
                      </span>
                    </div>
                    {selectedLog.userRole && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">User Role</p>
                        <p className="font-semibold text-gray-800 capitalize">{selectedLog.userRole}</p>
                      </div>
                    )}
                  </div>

                  {selectedLog.userId && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">User</p>
                      <p className="font-semibold text-gray-800">
                        {selectedLog.userId?.firstName && selectedLog.userId?.lastName
                          ? `${selectedLog.userId.firstName} ${selectedLog.userId.lastName}`
                          : selectedLog.userEmail || 'N/A'}
                      </p>
                      {selectedLog.userEmail && (
                        <p className="text-sm text-gray-600">{selectedLog.userEmail}</p>
                      )}
                    </div>
                  )}

                  {selectedLog.organizationId && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Organization</p>
                      <p className="font-semibold text-gray-800">
                        {typeof selectedLog.organizationId === 'object'
                          ? selectedLog.organizationId.name
                          : 'N/A'}
                      </p>
                    </div>
                  )}

                  {selectedLog.resourceType && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Resource Type</p>
                        <p className="font-semibold text-gray-800">{selectedLog.resourceType}</p>
                      </div>
                      {selectedLog.resourceId && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Resource ID</p>
                          <p className="font-semibold text-gray-800 font-mono text-sm">
                            {selectedLog.resourceId.toString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedLog.details && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Details</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedLog.details}</p>
                    </div>
                  )}

                  {selectedLog.errorMessage && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Error Message</p>
                      <p className="text-red-800 bg-red-50 p-4 rounded">{selectedLog.errorMessage}</p>
                    </div>
                  )}

                  {(selectedLog.ipAddress || selectedLog.userAgent) && (
                    <div className="grid grid-cols-1 gap-6">
                      {selectedLog.ipAddress && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">IP Address</p>
                          <p className="font-semibold text-gray-800 font-mono text-sm">{selectedLog.ipAddress}</p>
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">User Agent</p>
                          <p className="font-semibold text-gray-800 text-sm">{selectedLog.userAgent}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Metadata</p>
                      <pre className="text-gray-800 bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedLog(null);
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
