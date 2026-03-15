import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OverdueItemsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isOpen, toggle } = useMobileMenu();
  const [overdueData, setOverdueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'payments', 'maintenance'

  useEffect(() => {
    if (user?.role !== 'landlord' && user?.role !== 'manager' && user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchOverdueItems();
  }, [user, navigate, activeTab]);

  const fetchOverdueItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let response;

      if (activeTab === 'all') {
        response = await axios.get(`${API_URL}/overdue/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (activeTab === 'payments') {
        response = await axios.get(`${API_URL}/overdue/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.get(`${API_URL}/overdue/maintenance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setOverdueData(response.data);
    } catch (error) {
      console.error('Error fetching overdue items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-gray-800">Overdue Items</h1>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-8">
          {/* Summary Cards */}
          {overdueData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-red-800 mb-2">Overdue Invoices</h3>
                <p className="text-3xl font-bold text-red-600">{overdueData.summary.totalOverdueInvoices}</p>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-red-800 mb-2">Total Overdue Amount</h3>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(overdueData.summary.totalOverdueAmount)}</p>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-orange-800 mb-2">Overdue Maintenance</h3>
                <p className="text-3xl font-bold text-orange-600">{overdueData.summary.totalOverdueMaintenance}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Overdue
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overdue Payments
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'maintenance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overdue Maintenance
                </button>
              </nav>
            </div>
          </div>

          {/* Overdue Invoices */}
          {(activeTab === 'all' || activeTab === 'payments') && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Overdue Invoices ({activeTab === 'all' ? overdueData?.overdueInvoices?.length || 0 : overdueData?.count || 0})
              </h2>
              {(!overdueData?.overdueInvoices || overdueData.overdueInvoices.length === 0) && (!overdueData?.invoices || overdueData.invoices.length === 0) ? (
                <p className="text-gray-600">No overdue invoices found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Overdue</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount Owed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'all' ? overdueData?.overdueInvoices : overdueData?.invoices)?.map((invoice) => (
                        <tr key={invoice._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4">
                            {invoice.tenantId?.firstName} {invoice.tenantId?.lastName}
                            {invoice.tenantId?.phoneNumber && (
                              <p className="text-xs text-gray-500">{invoice.tenantId.phoneNumber}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {invoice.propertyId?.propertyName}
                            {invoice.unitId && (
                              <p className="text-xs text-gray-500">Unit {invoice.unitId.unitId}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">{formatDate(invoice.dueDate)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                              {invoice.daysOverdue} days
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-red-600">
                            {formatCurrency(invoice.amountOwed || (invoice.total - (invoice.paidAmount || 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Overdue Maintenance */}
          {(activeTab === 'all' || activeTab === 'maintenance') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Overdue Maintenance ({activeTab === 'all' ? overdueData?.overdueMaintenance?.length || 0 : overdueData?.count || 0})
              </h2>
              {(!overdueData?.overdueMaintenance || overdueData.overdueMaintenance.length === 0) && (!overdueData?.maintenance || overdueData.maintenance.length === 0) ? (
                <p className="text-gray-600">No overdue maintenance requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Request #</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Scheduled Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Overdue</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'all' ? overdueData?.overdueMaintenance : overdueData?.maintenance)?.map((maintenance) => (
                        <tr key={maintenance._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{maintenance.requestNumber}</td>
                          <td className="py-3 px-4">{maintenance.title}</td>
                          <td className="py-3 px-4">
                            {maintenance.propertyId?.propertyName}
                            {maintenance.unitId && (
                              <p className="text-xs text-gray-500">Unit {maintenance.unitId.unitId}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">{formatDate(maintenance.scheduledDate)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                              {maintenance.daysOverdue} days
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              maintenance.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              maintenance.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              maintenance.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {maintenance.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              maintenance.status === 'completed' ? 'bg-green-100 text-green-800' :
                              maintenance.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              maintenance.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {maintenance.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OverdueItemsPage;
