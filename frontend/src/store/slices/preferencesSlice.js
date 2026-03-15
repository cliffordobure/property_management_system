import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchPreferences = createAsyncThunk(
  'preferences/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/preferences`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch preferences');
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'preferences/updatePreferences',
  async (preferencesData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/preferences`, preferencesData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update preferences');
    }
  }
);

const initialState = {
  preferences: null,
  loading: false,
  error: null,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPreferences.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload.preferences;
      });
  },
});

export const { clearError } = preferencesSlice.actions;
export default preferencesSlice.reducer;
