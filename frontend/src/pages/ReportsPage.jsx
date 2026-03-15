import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayments, fetchPaymentStats } from '../store/slices/paymentSlice';
import { fetchExpenses, fetchExpenseStats } from '../store/slices/expenseSlice';
import { fetchUtilities, fetchUtilityStats } from '../store/slices/utilitySlice';
import { fetchMaintenanceRequests, fetchMaintenanceStats } from '../store/slices/maintenanceSlice';
import { fetchInvoices } from '../store/slices/invoiceSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchTenants } from '../store/slices/tenantSlice';
import Sidebar from '../components/Sidebar';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { payments, stats: paymentStats } = useSelector((state) => state.payments);
  const { expenses, stats: expenseStats } = useSelector((state) => state.expenses);
  const { utilities, stats: utilityStats } = useSelector((state) => state.utilities);
  const { maintenanceRequests, stats: maintenanceStats } = useSelector((state) => state.maintenance);
  const { invoices } = useSelector((state) => state.invoices);
  const { properties } = useSelector((state) => state.properties);
  const { tenants } = useSelector((state) => state.tenants);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadAllStats();
    }
  }, [startDate, endDate]);

  const loadAllStats = async () => {
    const params = { startDate, endDate };
    await Promise.all([
      dispatch(fetchPayments(params)),
      dispatch(fetchPaymentStats(params)),
      dispatch(fetchExpenses(params)),
      dispatch(fetchExpenseStats(params)),
      dispatch(fetchUtilities(params)),
      dispatch(fetchUtilityStats(params)),
      dispatch(fetchMaintenanceRequests(params)),
      dispatch(fetchMaintenanceStats(params)),
      dispatch(fetchInvoices()),
      dispatch(fetchProperties()),
      dispatch(fetchTenants())
    ]);
  };

  const calculateInvoiceStats = () => {
    const filteredInvoices = invoices.filter(inv => {
      if (!startDate || !endDate) return true;
      const invDate = new Date(inv.invoiceDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return invDate >= start && invDate <= end;
    });

    const stats = {
      total: filteredInvoices.length,
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
      paidAmount: filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
      open: filteredInvoices.filter(inv => inv.status === 'open').length,
      openAmount: filteredInvoices.filter(inv => inv.status === 'open').reduce((sum, inv) => sum + (inv.total || 0), 0),
      overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length,
      overdueAmount: filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0)
    };

    return stats;
  };

  const invoiceStats = calculateInvoiceStats();

  const calculateRevenue = () => {
    return paymentStats?.totalAmount || 0;
  };

  const calculateExpenses = () => {
    return (expenseStats?.totalAmount || 0) + (utilityStats?.totalAmount || 0) + (maintenanceStats?.totalCost || 0);
  };

  const calculateProfit = () => {
    return calculateRevenue() - calculateExpenses();
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial' },
    { id: 'properties', label: 'Properties' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'maintenance', label: 'Maintenance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </header>

        <main className="px-6 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculateRevenue())}</p>
                  <p className="text-xs text-gray-500 mt-2">{paymentStats?.count || 0} payments</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                  <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculateExpenses())}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Expenses: {formatCurrency(expenseStats?.totalAmount || 0)}<br />
                    Utilities: {formatCurrency(utilityStats?.totalAmount || 0)}<br />
                    Maintenance: {formatCurrency(maintenanceStats?.totalCost || 0)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 mb-2">Net Profit</p>
                  <p className={`text-2xl font-bold ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(calculateProfit())}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Revenue - Expenses</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-600 mb-2">Outstanding Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(invoiceStats.openAmount + invoiceStats.overdueAmount)}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {invoiceStats.open + invoiceStats.overdue} invoices pending
                  </p>
                </div>
              </div>

              {/* Invoice Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{invoiceStats.total}</p>
                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(invoiceStats.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{invoiceStats.paid}</p>
                    <p className="text-sm text-green-600 mt-1">{formatCurrency(invoiceStats.paidAmount)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="text-xl font-bold text-yellow-600 mt-1">{invoiceStats.open}</p>
                    <p className="text-sm text-yellow-600 mt-1">{formatCurrency(invoiceStats.openAmount)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{invoiceStats.overdue}</p>
                    <p className="text-sm text-red-600 mt-1">{formatCurrency(invoiceStats.overdueAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Properties & Units</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Properties</span>
                      <span className="font-semibold text-gray-800">{properties.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Units</span>
                      <span className="font-semibold text-gray-800">
                        {properties.reduce((sum, prop) => sum + (prop.numberOfUnits || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Tenants</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tenants</span>
                      <span className="font-semibold text-gray-800">{tenants.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Leases</span>
                      <span className="font-semibold text-gray-800">
                        {tenants.filter(t => t.isActive !== false).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Requests</span>
                      <span className="font-semibold text-gray-800">{maintenanceStats?.totalRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(maintenanceStats?.totalCost || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Payment Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(paymentStats?.totalAmount || 0)}</p>
                    <p className="text-sm text-gray-600 mt-1">{paymentStats?.count || 0} transactions</p>
                  </div>
                </div>
                {paymentStats?.byMethod && Object.keys(paymentStats.byMethod).length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">By Payment Method</h3>
                    <div className="space-y-2">
                      {Object.entries(paymentStats.byMethod).map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium text-gray-800 capitalize">{method.replace('_', ' ')}</span>
                          <span className="text-gray-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expense Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(expenseStats?.totalAmount || 0)}</p>
                    <p className="text-sm text-gray-600 mt-1">{expenseStats?.count || 0} expenses</p>
                  </div>
                </div>
                {expenseStats?.byCategory && Object.keys(expenseStats.byCategory).length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">By Category</h3>
                    <div className="space-y-2">
                      {Object.entries(expenseStats.byCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium text-gray-800 capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-gray-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Utility Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Utility Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(utilityStats?.totalAmount || 0)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(utilityStats?.paidAmount || 0)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(utilityStats?.pendingAmount || 0)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(utilityStats?.overdueAmount || 0)}</p>
                  </div>
                </div>
                {utilityStats?.byType && Object.keys(utilityStats.byType).length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">By Utility Type</h3>
                    <div className="space-y-2">
                      {Object.entries(utilityStats.byType).map(([type, amount]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium text-gray-800 capitalize">{type.replace('_', ' ')}</span>
                          <span className="text-gray-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Property Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{properties.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Units</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {properties.reduce((sum, prop) => sum + (prop.numberOfUnits || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Occupied Units</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {tenants.filter(t => t.isActive !== false).length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Property Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">City</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Units</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => {
                        const propertyTenants = tenants.filter(t => 
                          (typeof t.propertyId === 'object' && t.propertyId?._id === property._id) ||
                          t.propertyId === property._id
                        );
                        return (
                          <tr key={property._id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{property.propertyName}</td>
                            <td className="py-3 px-4 text-gray-600">{property.city}</td>
                            <td className="py-3 px-4 text-gray-600">{property.numberOfUnits}</td>
                            <td className="py-3 px-4 text-gray-600">{propertyTenants.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Tenant Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Tenants</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{tenants.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Active Tenants</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {tenants.filter(t => t.isActive !== false).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Inactive Tenants</p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">
                      {tenants.filter(t => t.isActive === false).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{maintenanceStats?.totalRequests || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(maintenanceStats?.totalCost || 0)}</p>
                  </div>
                </div>

                {maintenanceStats?.byStatus && Object.keys(maintenanceStats.byStatus).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-700 mb-3">By Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(maintenanceStats.byStatus).map(([status, count]) => (
                        <div key={status} className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800">{count}</p>
                          <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {maintenanceStats?.byCategory && Object.keys(maintenanceStats.byCategory).length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">By Category</h3>
                    <div className="space-y-2">
                      {Object.entries(maintenanceStats.byCategory).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium text-gray-800 capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-gray-600">{count} requests</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
