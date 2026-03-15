import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchUtilities = createAsyncThunk(
  'utilities/fetchUtilities',
  async ({ propertyId, unitId, utilityType, status, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/utilities`;
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);
      if (utilityType) params.append('utilityType', utilityType);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch utilities');
    }
  }
);

export const fetchSingleUtility = createAsyncThunk(
  'utilities/fetchSingleUtility',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/utilities/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch utility');
    }
  }
);

export const createUtility = createAsyncThunk(
  'utilities/createUtility',
  async (utilityData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/utilities`, utilityData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create utility');
    }
  }
);

export const updateUtility = createAsyncThunk(
  'utilities/updateUtility',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/utilities/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update utility');
    }
  }
);

export const markUtilityPaid = createAsyncThunk(
  'utilities/markUtilityPaid',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/utilities/${id}/mark-paid`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark utility as paid');
    }
  }
);

export const deleteUtility = createAsyncThunk(
  'utilities/deleteUtility',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/utilities/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete utility');
    }
  }
);

export const fetchUtilityStats = createAsyncThunk(
  'utilities/fetchUtilityStats',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/utilities/stats/overview`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch utility stats');
    }
  }
);

const initialState = {
  utilities: [],
  currentUtility: null,
  stats: null,
  loading: false,
  error: null,
};

const utilitySlice = createSlice({
  name: 'utilities',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUtilities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUtilities.fulfilled, (state, action) => {
        state.loading = false;
        state.utilities = action.payload;
      })
      .addCase(fetchUtilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSingleUtility.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSingleUtility.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUtility = action.payload;
      })
      .addCase(fetchSingleUtility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUtility.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUtility.fulfilled, (state, action) => {
        state.loading = false;
        state.utilities.unshift(action.payload);
      })
      .addCase(createUtility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUtility.fulfilled, (state, action) => {
        const index = state.utilities.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.utilities[index] = action.payload;
        }
      })
      .addCase(markUtilityPaid.fulfilled, (state, action) => {
        const index = state.utilities.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.utilities[index] = action.payload;
        }
      })
      .addCase(deleteUtility.fulfilled, (state, action) => {
        state.utilities = state.utilities.filter(u => u._id !== action.payload);
      })
      .addCase(fetchUtilityStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = utilitySlice.actions;
export default utilitySlice.reducer;
