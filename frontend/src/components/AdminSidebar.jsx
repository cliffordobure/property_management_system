import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const AdminSidebar = ({ isOpen, onClose }) => {
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
      <div className={`fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white tracking-tight">Turbine</h1>
        <p className="text-slate-300 text-sm mt-0.5">Admin Portal</p>
      </div>

      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
        <Link
          to="/admin"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>

        <Link
          to="/admin/organizations"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/organizations')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Organizations
        </Link>

        <Link
          to="/admin/users"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/users')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Users
        </Link>

        <Link
          to="/admin/plans"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/plans')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Subscription Plans
        </Link>

        <Link
          to="/admin/subscription-invoices"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/subscription-invoices')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Invoices & Receipts
        </Link>

        <Link
          to="/admin/system-settings"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/system-settings')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Settings
        </Link>

        <Link
          to="/admin/audit-logs"
          className={`flex items-center px-4 py-3 rounded-xl transition ${
            isActive('/admin/audit-logs')
              ? 'bg-slate-800 text-white'
              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit Logs
        </Link>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium"
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

export default AdminSidebar;
