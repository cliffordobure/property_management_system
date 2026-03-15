import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useMobileMenu } from '../hooks/useMobileMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BankAccountsPage = () => {
  const { isOpen, toggle } = useMobileMenu();
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankId: '',
    accountName: '',
    accountNumber: '',
    paybillNumber: '',
    tillNumber: '',
    apiCredentials: {
      apiKey: '',
      secretKey: '',
      clientId: '',
      clientSecret: '',
      merchantId: '',
      merchantKey: '',
      consumerKey: '',
      consumerSecret: '',
      passKey: ''
    },
      webhookSecret: '',
    autoVerifyEnabled: true,
    verificationInterval: 5
  });

  useEffect(() => {
    fetchBanks();
    fetchBankAccounts();
  }, []);

  const fetchBanks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bank-accounts/banks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      setError('Failed to load banks');
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBankAccounts(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('apiCredentials.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        apiCredentials: {
          ...prev.apiCredentials,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = selectedBankAccount
        ? `${API_URL}/bank-accounts/${selectedBankAccount._id}`
        : `${API_URL}/bank-accounts`;
      
      const method = selectedBankAccount ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(selectedBankAccount ? 'Bank account updated successfully!' : 'Bank account added successfully!');
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBankAccount(null);
      resetForm();
      fetchBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      setError(error.response?.data?.message || 'Failed to save bank account');
    }
  };

  const handleEdit = (account) => {
    setSelectedBankAccount(account);
    setFormData({
      bankId: account.bankId._id,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      paybillNumber: account.paybillNumber || '',
      tillNumber: account.tillNumber || '',
      apiCredentials: {
        apiKey: '',
        secretKey: '',
        clientId: '',
        clientSecret: '',
        merchantId: '',
        merchantKey: '',
        consumerKey: '',
        consumerSecret: '',
        passKey: ''
      },
      webhookSecret: '',
      autoVerifyEnabled: account.autoVerifyEnabled !== false,
      verificationInterval: account.verificationInterval || 5
    });
    setShowEditModal(true);
  };

  const handleVerify = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/bank-accounts/${accountId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Bank account verified successfully!');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error verifying bank account:', error);
      alert(error.response?.data?.message || 'Failed to verify bank account');
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/bank-accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Bank account deleted successfully!');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      alert(error.response?.data?.message || 'Failed to delete bank account');
    }
  };

  const resetForm = () => {
    setFormData({
      bankId: '',
      accountName: '',
      accountNumber: '',
      paybillNumber: '',
      tillNumber: '',
      apiCredentials: {
        apiKey: '',
        secretKey: '',
        clientId: '',
        clientSecret: '',
        merchantId: '',
        merchantKey: '',
        consumerKey: '',
        consumerSecret: '',
        passKey: ''
      },
      webhookSecret: '',
      autoVerifyEnabled: true,
      verificationInterval: 5
    });
  };

  const selectedBank = banks.find(b => b._id === formData.bankId);
  const isMpesa = selectedBank?.code === 'MPESA';

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Bank Accounts
              </h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Add Bank Account
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-4 sm:py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading bank accounts...</p>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts</h3>
              <p className="text-gray-500 mb-4">Add your first bank account to enable automatic payment verification.</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Bank Account
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paybill/Till</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.bankId?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.paybillNumber || account.tillNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.isVerified && account.isActive
                              ? 'bg-green-100 text-green-800'
                              : account.isActive
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {account.isVerified && account.isActive ? 'Verified' : account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {!account.isVerified && (
                            <button
                              onClick={() => handleVerify(account._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(account)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(account._id)}
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
            </div>
          )}

          {/* Add/Edit Modal */}
          {(showAddModal || showEditModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedBankAccount ? 'Edit' : 'Add'} Bank Account
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedBankAccount(null);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="bankId"
                      value={formData.bankId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => (
                        <option key={bank._id} value={bank._id}>{bank.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {isMpesa && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paybill Number
                        </label>
                        <input
                          type="text"
                          name="paybillNumber"
                          value={formData.paybillNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Till Number
                        </label>
                        <input
                          type="text"
                          name="tillNumber"
                          value={formData.tillNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">API Credentials</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter your bank API credentials to enable automatic payment verification. These will be encrypted and stored securely.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <input
                          type="password"
                          name="apiCredentials.apiKey"
                          value={formData.apiCredentials.apiKey}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                        <input
                          type="password"
                          name="apiCredentials.secretKey"
                          value={formData.apiCredentials.secretKey}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Consumer Key</label>
                        <input
                          type="text"
                          name="apiCredentials.consumerKey"
                          value={formData.apiCredentials.consumerKey}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Consumer Secret</label>
                        <input
                          type="password"
                          name="apiCredentials.consumerSecret"
                          value={formData.apiCredentials.consumerSecret}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pass Key (M-Pesa)</label>
                        <input
                          type="password"
                          name="apiCredentials.passKey"
                          value={formData.apiCredentials.passKey}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Webhook Configuration</h4>
                    <p className="text-xs text-blue-800 mb-3">
                      All banks will send payment notifications to our common webhook endpoint. 
                      The system will automatically identify your account using your account number, paybill, or till number.
                    </p>
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs font-mono text-gray-700 break-all">
                        {API_URL.replace('/api', '')}/api/payment-verification/webhook
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${API_URL.replace('/api', '')}/api/payment-verification/webhook`);
                          alert('Webhook URL copied to clipboard!');
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Copy URL
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Secret (Optional)
                      </label>
                      <input
                        type="password"
                        name="webhookSecret"
                        value={formData.webhookSecret}
                        onChange={handleInputChange}
                        placeholder="Enter secret for webhook verification"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Secret key provided by your bank for webhook verification (if required)
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Important:</strong> When configuring webhooks with your bank, use the URL above. 
                        Make sure your account number, paybill number, or till number is correctly set so the system can identify payments for your account.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoVerifyEnabled"
                        checked={formData.autoVerifyEnabled}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Automatic Verification</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedBankAccount(null);
                        resetForm();
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {selectedBankAccount ? 'Update' : 'Add'} Bank Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BankAccountsPage;
