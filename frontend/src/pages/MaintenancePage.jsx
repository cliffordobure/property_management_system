import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest, addMaintenanceUpdate, fetchMaintenanceStats } from '../store/slices/maintenanceSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import Sidebar from '../components/Sidebar';

const MaintenancePage = () => {
  const dispatch = useDispatch();
  const { maintenanceRequests, stats, loading, error } = useSelector((state) => state.maintenance);
  const { properties } = useSelector((state) => state.properties);
  const { units } = useSelector((state) => state.units);
  const { tenants } = useSelector((state) => state.tenants);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    category: 'other',
    priority: 'medium',
    title: '',
    description: '',
    scheduledDate: '',
    estimatedCost: '',
    notes: ''
  });

  const [propertyUnits, setPropertyUnits] = useState([]);
  const [propertyTenants, setPropertyTenants] = useState([]);

  useEffect(() => {
    dispatch(fetchMaintenanceRequests());
    dispatch(fetchProperties());
    dispatch(fetchTenants());
    dispatch(fetchMaintenanceStats());
  }, [dispatch]);

  useEffect(() => {
    if (formData.propertyId) {
      dispatch(fetchUnits({ propertyId: formData.propertyId }));
    }
  }, [formData.propertyId, dispatch]);

  useEffect(() => {
    if (formData.propertyId && units) {
      const filteredUnits = units.filter(u => 
        u.propertyId === formData.propertyId || 
        (typeof u.propertyId === 'object' && u.propertyId._id === formData.propertyId)
      );
      setPropertyUnits(filteredUnits);
    } else {
      setPropertyUnits([]);
    }
  }, [formData.propertyId, units]);

  useEffect(() => {
    if (formData.propertyId && tenants) {
      const filteredTenants = tenants.filter(t => 
        (typeof t.propertyId === 'object' && t.propertyId?._id === formData.propertyId) ||
        t.propertyId === formData.propertyId
      );
      setPropertyTenants(filteredTenants);
    } else {
      setPropertyTenants([]);
    }
  }, [formData.propertyId, tenants]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset unit and tenant when property changes
    if (name === 'propertyId') {
      setFormData(prev => ({
        ...prev,
        propertyId: value,
        unitId: '',
        tenantId: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyId || !formData.category || !formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        ...formData,
        unitId: formData.unitId || null,
        tenantId: formData.tenantId || null,
        scheduledDate: formData.scheduledDate || null,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        notes: formData.notes || null
      };

      const result = await dispatch(createMaintenanceRequest(submitData));
      if (createMaintenanceRequest.rejected.match(result)) {
        alert(result.payload || 'Failed to create maintenance request');
        return;
      }

      alert('Maintenance request created successfully!');
      setShowCreateForm(false);
      setFormData({
        propertyId: '',
        unitId: '',
        tenantId: '',
        category: 'other',
        priority: 'medium',
        title: '',
        description: '',
        scheduledDate: '',
        estimatedCost: '',
        notes: ''
      });
      
      // Refresh data
      await dispatch(fetchMaintenanceRequests());
      await dispatch(fetchMaintenanceStats());
    } catch (err) {
      console.error('Maintenance request creation error:', err);
      alert('An error occurred while creating the maintenance request. Please try again.');
    }
  };

  const handleViewRequest = async (requestId) => {
    const request = maintenanceRequests.find(r => r._id === requestId);
    if (request) {
      setSelectedRequest(request);
      setUpdateStatus(request.status);
      setUpdateNotes('');
      setShowViewModal(true);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !updateStatus) {
      alert('Please select a status');
      return;
    }

    try {
      const result = await dispatch(addMaintenanceUpdate({
        id: selectedRequest._id,
        status: updateStatus,
        notes: updateNotes
      }));

      if (addMaintenanceUpdate.rejected.match(result)) {
        alert(result.payload || 'Failed to update status');
        return;
      }

      alert('Status updated successfully!');
      setUpdateStatus('');
      setUpdateNotes('');
      
      // Refresh data
      await dispatch(fetchMaintenanceRequests());
      await dispatch(fetchMaintenanceStats());

      // Update selected request
      const updatedRequest = maintenanceRequests.find(r => r._id === selectedRequest._id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('An error occurred while updating the status. Please try again.');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      hvac: 'HVAC',
      appliance: 'Appliance',
      pest_control: 'Pest Control',
      cleaning: 'Cleaning',
      painting: 'Painting',
      roofing: 'Roofing',
      flooring: 'Flooring',
      carpentry: 'Carpentry',
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
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maintenance
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : '+ Add Request'}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRequests || 0}</p>
                <p className="text-xs text-gray-500 mt-1">KES {stats.totalCost?.toLocaleString() || 0} total cost</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.byStatus?.pending || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byStatus?.in_progress || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.byStatus?.completed || 0}</p>
              </div>
            </div>
          )}

          {/* Create Request Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Maintenance Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option key={property._id} value={property._id}>
                          {property.propertyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit (Optional)</label>
                    <select
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      disabled={!formData.propertyId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">All Units</option>
                      {propertyUnits.map((unit) => (
                        <option key={unit._id} value={unit._id}>
                          {unit.unitId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenant (Optional)</label>
                  <select
                    name="tenantId"
                    value={formData.tenantId}
                    onChange={handleChange}
                    disabled={!formData.propertyId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select tenant</option>
                    {propertyTenants.map((tenant) => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))}
                  </select>
                </div>

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
                      <option value="pest_control">Pest Control</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="painting">Painting</option>
                      <option value="roofing">Roofing</option>
                      <option value="flooring">Flooring</option>
                      <option value="carpentry">Carpentry</option>
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
                    rows="4"
                    placeholder="Detailed description of the maintenance issue..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (KES)</label>
                    <input
                      type="number"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="Estimated cost"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Request'}
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Maintenance Requests ({maintenanceRequests.length})</h2>

            {loading ? (
              <p className="text-gray-600">Loading maintenance requests...</p>
            ) : maintenanceRequests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Maintenance Requests</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first maintenance request.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Request #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property/Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRequests.map((request) => (
                      <tr key={request._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{request.requestNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(request.requestedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{request.title}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">{request.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {getCategoryLabel(request.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {typeof request.propertyId === 'object' && request.propertyId 
                            ? request.propertyId.propertyName 
                            : 'N/A'}
                          {typeof request.unitId === 'object' && request.unitId 
                            ? ` / ${request.unitId.unitId}` 
                            : ''}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {typeof request.tenantId === 'object' && request.tenantId
                            ? `${request.tenantId.firstName} ${request.tenantId.lastName}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                            {request.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleViewRequest(request._id)}
                            className="text-blue-600 hover:text-blue-700"
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

          {/* View Request Modal */}
          {showViewModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Maintenance Request Details</h2>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
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
                  {/* Request Header */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Request Number</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedRequest.requestNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Requested Date</p>
                      <p className="text-gray-800">{new Date(selectedRequest.requestedDate).toLocaleDateString()}</p>
                    </div>
                    {selectedRequest.scheduledDate && (
                      <div>
                        <p className="text-sm text-gray-600">Scheduled Date</p>
                        <p className="text-gray-800">{new Date(selectedRequest.scheduledDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Property & Tenant Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Property</p>
                      <p className="text-gray-800">
                        {typeof selectedRequest.propertyId === 'object' && selectedRequest.propertyId
                          ? selectedRequest.propertyId.propertyName
                          : 'N/A'}
                      </p>
                      {typeof selectedRequest.unitId === 'object' && selectedRequest.unitId && (
                        <p className="text-sm text-gray-600 mt-1">Unit: {selectedRequest.unitId.unitId}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tenant</p>
                      <p className="text-gray-800">
                        {typeof selectedRequest.tenantId === 'object' && selectedRequest.tenantId
                          ? `${selectedRequest.tenantId.firstName} ${selectedRequest.tenantId.lastName}`
                          : 'N/A'}
                      </p>
                      {typeof selectedRequest.tenantId === 'object' && selectedRequest.tenantId?.phoneNumber && (
                        <p className="text-sm text-gray-600 mt-1">{selectedRequest.tenantId.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Category & Priority */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mt-1">
                        {getCategoryLabel(selectedRequest.category)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm mt-1 ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Title</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedRequest.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded">{selectedRequest.description}</p>
                  </div>

                  {/* Cost Information */}
                  {(selectedRequest.estimatedCost || selectedRequest.actualCost) && (
                    <div className="grid grid-cols-2 gap-6">
                      {selectedRequest.estimatedCost && (
                        <div>
                          <p className="text-sm text-gray-600">Estimated Cost</p>
                          <p className="text-gray-800 font-semibold">KES {selectedRequest.estimatedCost?.toLocaleString() || 0}</p>
                        </div>
                      )}
                      {selectedRequest.actualCost && (
                        <div>
                          <p className="text-sm text-gray-600">Actual Cost</p>
                          <p className="text-gray-800 font-semibold">KES {selectedRequest.actualCost?.toLocaleString() || 0}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assigned To */}
                  {selectedRequest.assignedTo && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned To</p>
                      <p className="text-gray-800">{selectedRequest.assignedTo}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedRequest.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {/* Updates History */}
                  {selectedRequest.updates && selectedRequest.updates.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Update History</p>
                      <div className="space-y-2">
                        {selectedRequest.updates.slice().reverse().map((update, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(update.status)}`}>
                                  {update.status.replace('_', ' ')}
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">{update.updatedBy}</p>
                                <p className="text-xs text-gray-500">{new Date(update.updatedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Update Status */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          rows="3"
                          placeholder="Add update notes..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleStatusUpdate}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
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

export default MaintenancePage;
