import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminOrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, [filterStatus, filterPlan]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.response?.data?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (orgId, newPlan) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/organizations/${orgId}`,
        { subscriptionPlan: newPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Organization plan updated successfully!');
      fetchOrganizations();
    } catch (err) {
      console.error('Error updating organization:', err);
      alert(err.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleToggleStatus = async (orgId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/organizations/${orgId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Organization status updated successfully!');
      fetchOrganizations();
    } catch (err) {
      console.error('Error updating organization:', err);
      alert(err.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This will delete all related data (properties, units, tenants, etc.).')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Organization deleted successfully!');
      fetchOrganizations();
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert(err.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleView = (org) => {
    setSelectedOrg(org);
    setShowModal(true);
  };

  const filteredOrgs = organizations.filter(org => {
    if (filterStatus && org.isActive !== (filterStatus === 'active')) return false;
    if (filterPlan && org.subscriptionPlan !== filterPlan) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organizations
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Organizations List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Organizations ({filteredOrgs.length})</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading organizations...</p>
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations</h3>
                <p className="text-gray-500">No organizations found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrgs.map((org) => (
                      <tr key={org._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {org.ownerId?.firstName} {org.ownerId?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{org.ownerId?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {org.detectedPlan ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {org.detectedPlan.displayName || org.detectedPlan.name.toUpperCase()} (Auto)
                              </span>
                              <select
                                value={org.subscriptionPlan}
                                onChange={(e) => handleUpdatePlan(org._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                title="Manually override detected plan"
                              >
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                              </select>
                            </div>
                          ) : (
                            <select
                              value={org.subscriptionPlan}
                              onChange={(e) => handleUpdatePlan(org._id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="free">Free</option>
                              <option value="basic">Basic</option>
                              <option value="premium">Premium</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleToggleStatus(org._id, org.isActive)}
                            className={`${org.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {org.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleView(org)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(org._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* View Organization Modal */}
          {showModal && selectedOrg && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Organization Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedOrg(null);
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
                      <p className="text-sm text-gray-600 mb-1">Organization Name</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedOrg.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedOrg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Owner</p>
                    <p className="font-semibold text-gray-800">
                      {selectedOrg.ownerId?.firstName} {selectedOrg.ownerId?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrg.ownerId?.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Subscription Plan</p>
                    <p className="font-semibold text-gray-800 capitalize">{selectedOrg.subscriptionPlan}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Created At</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedOrg.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Updated At</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedOrg.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedOrg(null);
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

export default AdminOrganizationsPage;
