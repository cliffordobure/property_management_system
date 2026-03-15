import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchMaintenanceRequests = createAsyncThunk(
  'maintenance/fetchMaintenanceRequests',
  async ({ propertyId, unitId, tenantId, status, category, priority, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/maintenance`;
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);
      if (tenantId) params.append('tenantId', tenantId);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (priority) params.append('priority', priority);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance requests');
    }
  }
);

export const fetchSingleMaintenanceRequest = createAsyncThunk(
  'maintenance/fetchSingleMaintenanceRequest',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/maintenance/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance request');
    }
  }
);

export const createMaintenanceRequest = createAsyncThunk(
  'maintenance/createMaintenanceRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/maintenance`, requestData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create maintenance request');
    }
  }
);

export const updateMaintenanceRequest = createAsyncThunk(
  'maintenance/updateMaintenanceRequest',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/maintenance/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update maintenance request');
    }
  }
);

export const addMaintenanceUpdate = createAsyncThunk(
  'maintenance/addMaintenanceUpdate',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/maintenance/${id}/updates`, { status, notes }, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add maintenance update');
    }
  }
);

export const deleteMaintenanceRequest = createAsyncThunk(
  'maintenance/deleteMaintenanceRequest',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/maintenance/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete maintenance request');
    }
  }
);

export const fetchMaintenanceStats = createAsyncThunk(
  'maintenance/fetchMaintenanceStats',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/maintenance/stats/overview`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance stats');
    }
  }
);

const initialState = {
  maintenanceRequests: [],
  currentMaintenanceRequest: null,
  stats: null,
  loading: false,
  error: null,
};

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMaintenanceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenanceRequests = action.payload;
      })
      .addCase(fetchMaintenanceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSingleMaintenanceRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSingleMaintenanceRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMaintenanceRequest = action.payload;
      })
      .addCase(fetchSingleMaintenanceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMaintenanceRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMaintenanceRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenanceRequests.unshift(action.payload);
      })
      .addCase(createMaintenanceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMaintenanceRequest.fulfilled, (state, action) => {
        const index = state.maintenanceRequests.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.maintenanceRequests[index] = action.payload;
        }
      })
      .addCase(addMaintenanceUpdate.fulfilled, (state, action) => {
        const index = state.maintenanceRequests.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.maintenanceRequests[index] = action.payload;
        }
        if (state.currentMaintenanceRequest && state.currentMaintenanceRequest._id === action.payload._id) {
          state.currentMaintenanceRequest = action.payload;
        }
      })
      .addCase(deleteMaintenanceRequest.fulfilled, (state, action) => {
        state.maintenanceRequests = state.maintenanceRequests.filter(m => m._id !== action.payload);
      })
      .addCase(fetchMaintenanceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;
