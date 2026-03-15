import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (formData = false) => {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  if (!formData) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

export const fetchTenants = createAsyncThunk(
  'tenants/fetchTenants',
  async ({ propertyId, unitId } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/tenants`;
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenants');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenants/createTenant',
  async (tenantData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(tenantData).forEach(key => {
        if (key === 'files') {
          if (tenantData[key] && tenantData[key].length > 0) {
            tenantData[key].forEach(file => {
              formData.append('files', file);
            });
          }
        } else if (tenantData[key] !== null && tenantData[key] !== undefined) {
          if (typeof tenantData[key] === 'object') {
            formData.append(key, JSON.stringify(tenantData[key]));
          } else {
            formData.append(key, tenantData[key]);
          }
        }
      });

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tenants`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tenant');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenants/updateTenant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'files') {
          if (data[key] && data[key].length > 0) {
            data[key].forEach(file => {
              formData.append('files', file);
            });
          }
        } else if (data[key] !== null && data[key] !== undefined) {
          if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/tenants/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tenant');
    }
  }
);

export const deleteTenant = createAsyncThunk(
  'tenants/deleteTenant',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/tenants/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tenant');
    }
  }
);

const initialState = {
  tenants: [],
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = action.payload;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.tenants.push(action.payload);
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        const index = state.tenants.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.tenants = state.tenants.filter(t => t._id !== action.payload);
      });
  },
});

export const { clearError } = tenantSlice.actions;
export default tenantSlice.reducer;
