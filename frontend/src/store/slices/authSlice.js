import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        role
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const updateWelcomeInfo = createAsyncThunk(
  'auth/updateWelcomeInfo',
  async ({ isFirstTime, howDidYouHearAboutUs }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/auth/welcome`,
        { isFirstTime, howDidYouHearAboutUs },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      await axios.put(
        `${API_URL}/auth/onboarding/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Onboarding completion failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

const initialState = {
  token: localStorage.getItem('token') || null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        // Redirect logic will be handled in components
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update welcome info
      .addCase(updateWelcomeInfo.fulfilled, (state, action) => {
        if (state.user) {
          state.user.isFirstTimeLogin = action.payload.isFirstTimeLogin;
          state.user.howDidYouHearAboutUs = action.payload.howDidYouHearAboutUs;
        }
      })
      // Complete onboarding
      .addCase(completeOnboarding.fulfilled, (state) => {
        if (state.user) {
          state.user.onboardingCompleted = true;
        }
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
