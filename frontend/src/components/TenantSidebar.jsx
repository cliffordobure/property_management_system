import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const TenantSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-lg z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold text-white">Turbine</h1>
        <p className="text-blue-200 text-sm mt-1">Tenant Portal</p>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
        <Link
          to="/tenant-dashboard"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant-dashboard')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>

        <Link
          to="/tenant/invoices"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant/invoices')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          My Invoices
        </Link>

        <Link
          to="/tenant/payments"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant/payments')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payment History
        </Link>

        <Link
          to="/tenant/complaints"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant/complaints')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Complaints
        </Link>

        <Link
          to="/tenant/claims"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant/claims')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Claims
        </Link>

        <Link
          to="/tenant/maintenance"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/tenant/maintenance')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Maintenance Requests
        </Link>

        <Link
          to="/support"
          className={`flex items-center px-4 py-3 rounded-lg transition ${
            isActive('/support')
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-blue-100 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </Link>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700 bg-blue-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
      </div>
    </>
  );
};

export default TenantSidebar;
