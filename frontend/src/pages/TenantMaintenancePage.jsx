import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantMaintenancePage = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);

  const [formData, setFormData] = useState({
    category: 'other',
    priority: 'medium',
    title: '',
    description: '',
    scheduledDate: '',
    notes: ''
  });

  const fetchTenantInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tenants/my-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantInfo(response.data);
    } catch (err) {
      console.error('Error fetching tenant info:', err);
    }
  }, []);

  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_URL}/maintenance`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterPriority) params.append('priority', filterPriority);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaintenanceRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      setError(err.response?.data?.message || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterPriority]);

  useEffect(() => {
    fetchTenantInfo();
    fetchMaintenanceRequests();
  }, [fetchTenantInfo, fetchMaintenanceRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    if (!tenantInfo || !tenantInfo.propertyId) {
      alert('Tenant information not found. Please contact support.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        propertyId: typeof tenantInfo.propertyId === 'object' ? tenantInfo.propertyId._id : tenantInfo.propertyId,
        unitId: typeof tenantInfo.unitId === 'object' ? tenantInfo.unitId?._id : tenantInfo.unitId,
        category: formData.category,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        scheduledDate: formData.scheduledDate || null,
        notes: formData.notes || null
      };

      await axios.post(`${API_URL}/maintenance`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Maintenance request submitted successfully!');
      setShowForm(false);
      setFormData({
        category: 'other',
        priority: 'medium',
        title: '',
        description: '',
        scheduledDate: '',
        notes: ''
      });
      fetchMaintenanceRequests();
    } catch (err) {
      console.error('Error submitting maintenance request:', err);
      alert(err.response?.data?.message || 'Failed to submit maintenance request');
    }
  };

  const handleView = async (request) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/maintenance/${request._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRequest(response.data);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching maintenance details:', err);
      alert(err.response?.data?.message || 'Failed to load maintenance details');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      hvac: 'HVAC',
      appliance: 'Appliance',
      structural: 'Structural',
      cleaning: 'Cleaning',
      landscaping: 'Landscaping',
      security: 'Security',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredRequests = maintenanceRequests || [];

  // Calculate stats
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
  const inProgressRequests = filteredRequests.filter(r => r.status === 'in_progress').length;
  const completedRequests = filteredRequests.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TenantSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maintenance Requests
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="cleaning">Cleaning</option>
                <option value="landscaping">Landscaping</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on_hold">On Hold</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showForm ? 'Cancel' : '+ Request Maintenance'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-800">{totalRequests}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{inProgressRequests}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedRequests}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Maintenance Request Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit Maintenance Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="hvac">HVAC</option>
                      <option value="appliance">Appliance</option>
                      <option value="structural">Structural</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Please provide detailed information about the maintenance issue..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Scheduled Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any additional information..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        category: 'other',
                        priority: 'medium',
                        title: '',
                        description: '',
                        scheduledDate: '',
                        notes: ''
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Maintenance Requests List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Maintenance Requests ({filteredRequests.filter(r => (!filterStatus || r.status === filterStatus) && (!filterCategory || r.category === filterCategory) && (!filterPriority || r.priority === filterPriority)).length})
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading maintenance requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
                <p className="text-gray-500 mb-4">You haven't submitted any maintenance requests yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{request.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Category:</span> {getCategoryLabel(request.category)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Requested:</span> {formatDate(request.requestedDate)}
                        </p>
                        {request.scheduledDate && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Scheduled:</span> {formatDate(request.scheduledDate)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleView(request)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{request.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Maintenance Request Modal */}
          {showModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Maintenance Request Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
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
                      <p className="text-sm text-gray-600">Request Number</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedRequest.requestNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mt-1 ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold text-gray-800">{getCategoryLabel(selectedRequest.category)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Title</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedRequest.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.propertyId && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Property</p>
                        <p className="font-semibold text-gray-800">
                          {typeof selectedRequest.propertyId === 'object' 
                            ? selectedRequest.propertyId.propertyName 
                            : 'N/A'}
                        </p>
                      </div>
                      {selectedRequest.unitId && (
                        <div>
                          <p className="text-sm text-gray-600">Unit</p>
                          <p className="font-semibold text-gray-800">
                            {typeof selectedRequest.unitId === 'object' 
                              ? selectedRequest.unitId.unitId 
                              : 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.scheduledDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Scheduled Date</p>
                      <p className="font-semibold text-gray-800">{formatDate(selectedRequest.scheduledDate)}</p>
                    </div>
                  )}

                  {(selectedRequest.estimatedCost || selectedRequest.actualCost) && (
                    <div className="grid grid-cols-2 gap-6">
                      {selectedRequest.estimatedCost && (
                        <div>
                          <p className="text-sm text-gray-600">Estimated Cost</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(selectedRequest.estimatedCost)}</p>
                        </div>
                      )}
                      {selectedRequest.actualCost && (
                        <div>
                          <p className="text-sm text-gray-600">Actual Cost</p>
                          <p className="font-semibold text-green-600">{formatCurrency(selectedRequest.actualCost)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {selectedRequest.updates && selectedRequest.updates.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Update History</p>
                      <div className="space-y-2">
                        {selectedRequest.updates.slice().reverse().map((update, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(update.status)}`}>
                                  {update.status.replace('_', ' ')}
                                </span>
                                <p className="text-sm text-gray-700 mt-2">{update.notes}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">{update.updatedBy}</p>
                                <p className="text-xs text-gray-500">{formatDate(update.updatedAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
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

export default TenantMaintenancePage;
