import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateWelcomeInfo } from '../store/slices/authSlice';

const WelcomePage = () => {
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [howDidYouHear, setHowDidYouHear] = useState('');
  const [customSource, setCustomSource] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && !user.isFirstTimeLogin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const source = howDidYouHear === 'other' ? customSource : howDidYouHear;
    
    await dispatch(updateWelcomeInfo({
      isFirstTime: isFirstTime,
      howDidYouHearAboutUs: source
    }));

    // Redirect based on user role
    if (user?.role === 'tenant') {
      if (isFirstTime) {
        navigate('/onboarding');
      } else {
        navigate('/tenant-dashboard');
      }
    } else if (user?.role === 'admin') {
      if (isFirstTime) {
        navigate('/onboarding');
      } else {
        navigate('/admin');
      }
    } else {
      if (isFirstTime) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  };

  if (!user || !user.isFirstTimeLogin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to Turbine!</h1>
          <p className="text-gray-600">Let's get you started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">
              Is this your first time logging in?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsFirstTime(true)}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition ${
                  isFirstTime === true
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes, First Time
              </button>
              <button
                type="button"
                onClick={() => setIsFirstTime(false)}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition ${
                  isFirstTime === false
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No, Returning
              </button>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">
              How did you hear about us?
            </label>
            <select
              value={howDidYouHear}
              onChange={(e) => setHowDidYouHear(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an option</option>
              <option value="google">Google Search</option>
              <option value="social-media">Social Media</option>
              <option value="friend">Friend/Colleague</option>
              <option value="advertisement">Advertisement</option>
              <option value="other">Other</option>
            </select>

            {howDidYouHear === 'other' && (
              <input
                type="text"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Please specify"
                required
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isFirstTime === null || !howDidYouHear}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomePage;
