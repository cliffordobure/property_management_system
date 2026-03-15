import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClaimType, setFilterClaimType] = useState('');

  const [formData, setFormData] = useState({
    claimType: 'other',
    subject: '',
    description: '',
    amount: ''
  });

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_URL}/claims`;
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterClaimType) params.append('claimType', filterClaimType);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterClaimType]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.description || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/claims`, {
        ...formData,
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Claim submitted successfully!');
      setShowForm(false);
      setFormData({
        claimType: 'other',
        subject: '',
        description: '',
        amount: ''
      });
      fetchClaims();
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleView = (claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
  };

  const getClaimTypeLabel = (type) => {
    const labels = {
      deposit_refund: 'Deposit Refund',
      overpayment_refund: 'Overpayment Refund',
      damage_compensation: 'Damage Compensation',
      maintenance_compensation: 'Maintenance Compensation',
      utility_refund: 'Utility Refund',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                My Claims
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterClaimType}
                onChange={(e) => setFilterClaimType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="deposit_refund">Deposit Refund</option>
                <option value="overpayment_refund">Overpayment Refund</option>
                <option value="damage_compensation">Damage Compensation</option>
                <option value="maintenance_compensation">Maintenance Compensation</option>
                <option value="utility_refund">Utility Refund</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showForm ? 'Cancel' : '+ Raise Claim'}
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
                  <p className="text-sm text-gray-600 mb-1">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-800">{claims.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    KES {claims.reduce((sum, claim) => sum + (claim.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {claims.filter(c => c.status === 'approved').length}
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
                  <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
                  <p className="text-2xl font-bold text-purple-600">
                    KES {claims.filter(c => c.status === 'paid').reduce((sum, claim) => sum + (claim.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Submit Claim Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Raise a Claim</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claim Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="claimType"
                      value={formData.claimType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="deposit_refund">Deposit Refund</option>
                      <option value="overpayment_refund">Overpayment Refund</option>
                      <option value="damage_compensation">Damage Compensation</option>
                      <option value="maintenance_compensation">Maintenance Compensation</option>
                      <option value="utility_refund">Utility Refund</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                    placeholder="Brief description of the claim"
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
                    placeholder="Please provide detailed information about your claim..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        claimType: 'other',
                        subject: '',
                        description: '',
                        amount: ''
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
                    Submit Claim
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

          {/* Claims List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              My Claims ({claims.filter(c => (!filterStatus || c.status === filterStatus) && (!filterClaimType || c.claimType === filterClaimType)).length})
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims</h3>
                <p className="text-gray-500 mb-4">You haven't raised any claims yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Raise Your First Claim
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{claim.subject}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(claim.status)}`}>
                            {claim.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Type:</span> {getClaimTypeLabel(claim.claimType)}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Amount:</span> {claim.currency} {claim.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Submitted:</span> {new Date(claim.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleView(claim)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{claim.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Claim Modal */}
          {showModal && selectedClaim && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Claim Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedClaim(null);
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
                      <p className="text-sm text-gray-600">Claim Number</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedClaim.claimNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mt-1 ${getStatusColor(selectedClaim.status)}`}>
                        {selectedClaim.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Claim Type</p>
                      <p className="font-semibold text-gray-800">{getClaimTypeLabel(selectedClaim.claimType)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-2xl text-blue-600">{selectedClaim.currency} {selectedClaim.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Subject</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedClaim.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded">{selectedClaim.description}</p>
                  </div>

                  {selectedClaim.approvalNotes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Approval Notes</p>
                      <p className="text-gray-800 bg-green-50 p-4 rounded">{selectedClaim.approvalNotes}</p>
                    </div>
                  )}

                  {selectedClaim.rejectionReason && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Rejection Reason</p>
                      <p className="text-gray-800 bg-red-50 p-4 rounded">{selectedClaim.rejectionReason}</p>
                    </div>
                  )}

                  {selectedClaim.updates && selectedClaim.updates.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Update History</p>
                      <div className="space-y-2">
                        {selectedClaim.updates.slice().reverse().map((update, index) => (
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
                      setSelectedClaim(null);
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

export default TenantClaimsPage;
