import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '../store/slices/authSlice';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, user } = useSelector((state) => state.auth);

  const steps = [
    {
      title: 'Welcome to Turbine',
      content: 'Manage your properties efficiently with our comprehensive property management system.',
      icon: '🏢'
    },
    {
      title: 'Property Management',
      content: 'Add and manage multiple properties with ease. Track units, tenants, and finances all in one place.',
      icon: '🏘️'
    },
    {
      title: 'Tenant Management',
      content: 'Keep detailed records of all your tenants, including contact information, lease details, and payment history.',
      icon: '👥'
    },
    {
      title: 'Financial Tracking',
      content: 'Monitor rent payments, generate invoices, track expenses, and maintain financial records effortlessly.',
      icon: '💰'
    },
    {
      title: 'Ready to Start',
      content: 'You\'re all set! Start by adding your first property to get started with managing your real estate portfolio.',
      icon: '🚀'
    }
  ];

  const handleSkip = async () => {
    await dispatch(completeOnboarding());
    // Redirect based on user role
    if (user?.role === 'tenant') {
      navigate('/tenant-dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await dispatch(completeOnboarding());
    // Redirect based on user role
    if (user?.role === 'tenant') {
      navigate('/tenant-dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{steps[currentStep].icon}</div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-600 text-lg">
            {steps[currentStep].content}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Skip
          </button>
          
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Previous
            </button>
          )}
          
          <button
            onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
