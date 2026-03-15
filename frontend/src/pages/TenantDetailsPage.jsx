import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchProperties } from '../store/slices/propertySlice';
import { fetchUnits } from '../store/slices/unitSlice';
import Sidebar from '../components/Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { tenants, loading } = useSelector((state) => state.tenants);
  const { properties } = useSelector((state) => state.properties);
  const { units } = useSelector((state) => state.units);

  const [tenant, setTenant] = useState(null);
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const { isOpen, toggle } = useMobileMenu();

  useEffect(() => {
    dispatch(fetchTenants());
    dispatch(fetchProperties());
  }, [dispatch]);

  const updateRelatedData = useCallback((tenantData) => {
    // Find property
    const propId = typeof tenantData.propertyId === 'object' 
      ? tenantData.propertyId._id 
      : tenantData.propertyId;
    const foundProperty = properties.find(p => p._id === propId);
    if (foundProperty) {
      setProperty(foundProperty);
      dispatch(fetchUnits(foundProperty._id));
    } else if (typeof tenantData.propertyId === 'object') {
      setProperty(tenantData.propertyId);
    }

    // Find unit
    const unitId = typeof tenantData.unitId === 'object' 
      ? tenantData.unitId._id 
      : tenantData.unitId;
    const foundUnit = units.find(u => u._id === unitId);
    if (foundUnit) {
      setUnit(foundUnit);
    } else if (typeof tenantData.unitId === 'object') {
      setUnit(tenantData.unitId);
    }
  }, [properties, units, dispatch]);

  const fetchTenantDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenant(response.data);
      updateRelatedData(response.data);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    }
  }, [id, updateRelatedData]);

  useEffect(() => {
    if (tenants.length > 0 || id) {
      // Try to find tenant in Redux store first
      let foundTenant = tenants.find(t => t._id === id);
      
      // If not found in store, fetch from API
      if (!foundTenant && id) {
        fetchTenantDetails();
      } else {
        setTenant(foundTenant);
        if (foundTenant) {
          updateRelatedData(foundTenant);
        }
      }
    }
  }, [tenants, id, fetchTenantDetails, updateRelatedData]);

  useEffect(() => {
    if (tenant) {
      updateRelatedData(tenant);
    }
  }, [tenant, updateRelatedData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tenant not found</p>
          <button
            onClick={() => navigate('/tenants')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isOpen} onClose={toggle} />
      <div className="flex-1 lg:ml-64 w-full">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggle}
                className="lg:hidden text-gray-600 hover:text-gray-900 mr-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/tenants')}
                className="text-blue-600 hover:text-blue-700 text-sm sm:text-base"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {getInitials(tenant.firstName, tenant.lastName)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">
                    {tenant.firstName} {tenant.lastName}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {property?.propertyName || 'Property N/A'} - {unit?.unitId || 'Unit N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                tenant.isActive !== false 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {tenant.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">First Name</p>
                <p className="font-semibold text-gray-800">{tenant.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Name</p>
                <p className="font-semibold text-gray-800">{tenant.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-800">{tenant.phoneNumber}</p>
              </div>
              {tenant.email && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{tenant.email}</p>
                </div>
              )}
              {tenant.nationalId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">National ID</p>
                  <p className="font-semibold text-gray-800">{tenant.nationalId}</p>
                </div>
              )}
              {tenant.kraTaxPin && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">KRA/Tax PIN</p>
                  <p className="font-semibold text-gray-800">{tenant.kraTaxPin}</p>
                </div>
              )}
              {tenant.accountNumber && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Account Number</p>
                  <p className="font-semibold text-gray-800">{tenant.accountNumber}</p>
                </div>
              )}
              {tenant.otherPhoneNumbers && tenant.otherPhoneNumbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Other Phone Numbers</p>
                  <p className="font-semibold text-gray-800">{tenant.otherPhoneNumbers.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Property & Unit Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Property & Unit Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Property</p>
                <p className="font-semibold text-gray-800">
                  {property?.propertyName || (typeof tenant.propertyId === 'object' ? tenant.propertyId?.propertyName : 'N/A')}
                </p>
                {property?.city && (
                  <p className="text-sm text-gray-500">{property.city}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Unit</p>
                <p className="font-semibold text-gray-800">
                  {unit?.unitId || (typeof tenant.unitId === 'object' ? tenant.unitId?.unitId : 'N/A')}
                </p>
                {unit?.rentAmount && (
                  <p className="text-sm text-gray-500">Rent: {formatCurrency(unit.rentAmount)}</p>
                )}
              </div>
              {property?.streetName && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Street Name</p>
                  <p className="font-semibold text-gray-800">{property.streetName}</p>
                </div>
              )}
              {property?.companyName && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company Name</p>
                  <p className="font-semibold text-gray-800">{property.companyName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lease Information */}
          {(tenant.leaseStartDate || tenant.leaseExpiryDate || tenant.moveInDate) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Lease Information
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {tenant.moveInDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Move-In Date</p>
                    <p className="font-semibold text-gray-800">{formatDate(tenant.moveInDate)}</p>
                  </div>
                )}
                {tenant.leaseStartDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lease Start Date</p>
                    <p className="font-semibold text-gray-800">{formatDate(tenant.leaseStartDate)}</p>
                  </div>
                )}
                {tenant.leaseExpiryDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lease Expiry Date</p>
                    <p className={`font-semibold ${
                      new Date(tenant.leaseExpiryDate) < new Date() 
                        ? 'text-red-600' 
                        : new Date(tenant.leaseExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-yellow-600'
                        : 'text-gray-800'
                    }`}>
                      {formatDate(tenant.leaseExpiryDate)}
                      {new Date(tenant.leaseExpiryDate) < new Date() && ' (Expired)'}
                      {new Date(tenant.leaseExpiryDate) >= new Date() && new Date(tenant.leaseExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && ' (Expiring Soon)'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deposit Information */}
          {tenant.deposit && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deposit Information
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deposit Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{tenant.deposit.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deposit Amount</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(tenant.deposit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(tenant.deposit.paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount Returned</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(tenant.deposit.amountReturned)}</p>
                </div>
              </div>
              {tenant.deposit.amount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                  <p className={`font-semibold text-lg ${
                    (tenant.deposit.amount - tenant.deposit.paid) > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(tenant.deposit.amount - tenant.deposit.paid)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          {(tenant.rentPaymentPenalty || tenant.notes) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Additional Information
              </h2>
              <div className="space-y-4">
                {tenant.rentPaymentPenalty && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rent Payment Penalty</p>
                    <p className="font-semibold text-gray-800">{formatCurrency(tenant.rentPaymentPenalty)}</p>
                  </div>
                )}
                {tenant.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{tenant.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Documents */}
          {tenant.uploadedFiles && tenant.uploadedFiles.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Uploaded Documents
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {tenant.uploadedFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800">{file.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`${API_URL.replace('/api', '')}/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/tenants')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Back to Tenants
            </button>
            {property && (
              <button
                onClick={() => {
                  const propId = typeof tenant.propertyId === 'object' ? tenant.propertyId._id : tenant.propertyId;
                  if (propId) {
                    navigate(`/properties/${propId}`);
                  }
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View Property
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDetailsPage;
