import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClaimsComplaintsPage = () => {
  const { isOpen, toggle } = useMobileMenu();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('claims'); // 'claims' or 'complaints'
  const [claims, setClaims] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (activeTab === 'claims') {
      fetchClaims();
    } else {
      fetchComplaints();
    }
  }, [activeTab, filterStatus, filterType]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/claims`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('claimType', filterType);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, getAuthHeaders());
      setClaims(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/complaints`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('category', filterType);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, getAuthHeaders());
      setComplaints(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleUpdateStatus = async (itemId, newStatus, type) => {
    try {
      const url = type === 'claim' ? `${API_URL}/claims/${itemId}` : `${API_URL}/complaints/${itemId}`;
      await axios.put(url, { status: newStatus }, getAuthHeaders());
      
      if (type === 'claim') {
        await fetchClaims();
      } else {
        await fetchComplaints();
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getClaimTypeLabel = (type) => {
    const labels = {
      deposit_refund: 'Deposit Refund',
      overpayment: 'Overpayment',
      damage_compensation: 'Damage Compensation',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      noise: 'Noise',
      maintenance: 'Maintenance',
      neighbor: 'Neighbor Issue',
      property_condition: 'Property Condition',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const currentItems = activeTab === 'claims' ? claims : complaints;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isOpen} onClose={toggle} />
      <div className="flex-1 lg:ml-64 w-full">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="lg:hidden text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Claims & Complaints
              </h1>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('claims')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'claims'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Claims ({claims.length})
              </button>
              <button
                onClick={() => setActiveTab('complaints')}
                className={`px-6 py-3 font-medium text-sm transition ${
                  activeTab === 'complaints'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Complaints ({complaints.length})
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All {activeTab === 'claims' ? 'Types' : 'Categories'}</option>
              {activeTab === 'claims' ? (
                <>
                  <option value="deposit_refund">Deposit Refund</option>
                  <option value="overpayment">Overpayment</option>
                  <option value="damage_compensation">Damage Compensation</option>
                  <option value="other">Other</option>
                </>
              ) : (
                <>
                  <option value="noise">Noise</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="neighbor">Neighbor Issue</option>
                  <option value="property_condition">Property Condition</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
          </div>

          {/* Content */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} found</h3>
              <p className="mt-1 text-sm text-gray-500">No {activeTab} match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{item.subject}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Tenant:</span>{' '}
                          {item.tenantId?.firstName} {item.tenantId?.lastName}
                        </p>
                        <p>
                          <span className="font-medium">Property:</span> {item.propertyId?.propertyName || 'N/A'}
                        </p>
                        {activeTab === 'claims' ? (
                          <>
                            <p>
                              <span className="font-medium">Type:</span> {getClaimTypeLabel(item.claimType)}
                            </p>
                            <p>
                              <span className="font-medium">Amount:</span> {item.currency} {item.amount?.toLocaleString() || '0'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="font-medium">Category:</span> {getCategoryLabel(item.category)}
                            </p>
                            <p>
                              <span className="font-medium">Priority:</span> {item.priority || 'N/A'}
                            </p>
                          </>
                        )}
                        <p>
                          <span className="font-medium">Submitted:</span>{' '}
                          {new Date(item.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleView(item)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                  <p className="text-gray-700 line-clamp-2">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* View Details Modal */}
          {showModal && selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {activeTab === 'claims' ? 'Claim' : 'Complaint'} Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status.replace('_', ' ')}
                      </span>
                    </div>
                    {activeTab === 'claims' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Claim Type</label>
                          <p className="mt-1 text-gray-900">{getClaimTypeLabel(selectedItem.claimType)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount</label>
                          <p className="mt-1 text-gray-900 font-semibold">
                            {selectedItem.currency} {selectedItem.amount?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <p className="mt-1 text-gray-900">{getCategoryLabel(selectedItem.category)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <p className="mt-1 text-gray-900">{selectedItem.priority || 'N/A'}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenant</label>
                      <p className="mt-1 text-gray-900">
                        {selectedItem.tenantId?.firstName} {selectedItem.tenantId?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedItem.tenantId?.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Property</label>
                      <p className="mt-1 text-gray-900">{selectedItem.propertyId?.propertyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <p className="mt-1 text-gray-900">{selectedItem.unitId?.unitId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(selectedItem.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-gray-900 font-semibold">{selectedItem.subject}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>

                  {selectedItem.response && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Response</label>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedItem.response}</p>
                    </div>
                  )}

                  {selectedItem.responseDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Response Date</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(selectedItem.responseDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Status Update Actions */}
                  {selectedItem.status === 'pending' || selectedItem.status === 'under_review' ? (
                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedItem._id, 'approved', activeTab === 'claims' ? 'claim' : 'complaint')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedItem._id, 'rejected', activeTab === 'claims' ? 'claim' : 'complaint')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                        {activeTab === 'complaints' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedItem._id, 'resolved', 'complaint')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => handleUpdateStatus(selectedItem._id, 'closed', activeTab === 'claims' ? 'claim' : 'complaint')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClaimsComplaintsPage;
