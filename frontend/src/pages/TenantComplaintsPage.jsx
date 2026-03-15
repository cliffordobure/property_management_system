import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    category: 'other',
    priority: 'medium',
    subject: '',
    description: ''
  });

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_URL}/complaints`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.description) {
      alert('Please fill in subject and description');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/complaints`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Complaint submitted successfully!');
      setShowForm(false);
      setFormData({
        category: 'other',
        priority: 'medium',
        subject: '',
        description: ''
      });
      fetchComplaints();
    } catch (err) {
      console.error('Error submitting complaint:', err);
      alert(err.response?.data?.message || 'Failed to submit complaint');
    }
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      noise: 'Noise',
      maintenance: 'Maintenance',
      security: 'Security',
      billing: 'Billing',
      neighbor: 'Neighbor Issue',
      property_condition: 'Property Condition',
      management: 'Management',
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
      acknowledged: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TenantSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                My Complaints
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="noise">Noise</option>
                <option value="maintenance">Maintenance</option>
                <option value="security">Security</option>
                <option value="billing">Billing</option>
                <option value="neighbor">Neighbor Issue</option>
                <option value="property_condition">Property Condition</option>
                <option value="management">Management</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showForm ? 'Cancel' : '+ Submit Complaint'}
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
                  <p className="text-sm text-gray-600 mb-1">Total Complaints</p>
                  <p className="text-2xl font-bold text-gray-800">{complaints.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {complaints.filter(c => c.status === 'pending').length}
                  </p>
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
                  <p className="text-2xl font-bold text-purple-600">
                    {complaints.filter(c => c.status === 'in_progress').length}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {complaints.filter(c => c.status === 'resolved').length}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Submit Complaint Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit a Complaint</h2>
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
                      <option value="noise">Noise</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="security">Security</option>
                      <option value="billing">Billing</option>
                      <option value="neighbor">Neighbor Issue</option>
                      <option value="property_condition">Property Condition</option>
                      <option value="management">Management</option>
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
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief description of the complaint"
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
                    placeholder="Please provide detailed information about your complaint..."
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
                        subject: '',
                        description: ''
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
                    Submit Complaint
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

          {/* Complaints List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Complaints ({complaints.filter(c => (!filterStatus || c.status === filterStatus) && (!filterCategory || c.category === filterCategory)).length})</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Complaints</h3>
                <p className="text-gray-500 mb-4">You haven't submitted any complaints yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Your First Complaint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{complaint.subject}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Category:</span> {getCategoryLabel(complaint.category)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Submitted:</span> {new Date(complaint.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleView(complaint)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{complaint.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Complaint Modal */}
          {showModal && selectedComplaint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedComplaint(null);
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
                      <p className="text-sm text-gray-600">Complaint Number</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedComplaint.complaintNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mt-1 ${getStatusColor(selectedComplaint.status)}`}>
                        {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold text-gray-800">{getCategoryLabel(selectedComplaint.category)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Subject</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedComplaint.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedComplaint.description}</p>
                  </div>

                  {selectedComplaint.resolution && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Resolution</p>
                      <p className="text-gray-800 bg-green-50 p-4 rounded">{selectedComplaint.resolution}</p>
                    </div>
                  )}

                  {selectedComplaint.resolutionNotes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Resolution Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedComplaint.resolutionNotes}</p>
                    </div>
                  )}

                  {selectedComplaint.updates && selectedComplaint.updates.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Update History</p>
                      <div className="space-y-2">
                        {selectedComplaint.updates.slice().reverse().map((update, index) => (
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
                                <p className="text-xs text-gray-500">{new Date(update.updatedAt).toLocaleDateString()}</p>
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
                      setSelectedComplaint(null);
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

export default TenantComplaintsPage;
