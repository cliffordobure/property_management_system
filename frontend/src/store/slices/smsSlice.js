import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchSMSConfig = createAsyncThunk(
  'sms/fetchSMSConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/sms/config`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch SMS config');
    }
  }
);

export const updateSMSConfig = createAsyncThunk(
  'sms/updateSMSConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/sms/config`, configData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update SMS config');
    }
  }
);

export const sendSMS = createAsyncThunk(
  'sms/sendSMS',
  async (smsData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/sms/send`, smsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send SMS');
    }
  }
);

export const sendBulkSMS = createAsyncThunk(
  'sms/sendBulkSMS',
  async (smsData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/sms/send-bulk`, smsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send bulk SMS');
    }
  }
);

export const sendSMSToAllTenants = createAsyncThunk(
  'sms/sendSMSToAllTenants',
  async (smsData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/sms/send-all-tenants`, smsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send SMS to all tenants');
    }
  }
);

export const fetchSMSHistory = createAsyncThunk(
  'sms/fetchSMSHistory',
  async ({ startDate, endDate, messageType, status } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/sms/history`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (messageType) params.append('messageType', messageType);
      if (status) params.append('status', status);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch SMS history');
    }
  }
);

const initialState = {
  config: null,
  history: [],
  loading: false,
  error: null,
};

const smsSlice = createSlice({
  name: 'sms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSMSConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSMSConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchSMSConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSMSConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      .addCase(sendSMS.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendSMS.fulfilled, (state, action) => {
        state.loading = false;
        state.history.unshift(action.payload.sms);
      })
      .addCase(sendSMS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendBulkSMS.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendBulkSMS.fulfilled, (state, action) => {
        state.loading = false;
        state.history.unshift(action.payload.sms);
      })
      .addCase(sendBulkSMS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendSMSToAllTenants.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendSMSToAllTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.history.unshift(action.payload.sms);
      })
      .addCase(sendSMSToAllTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSMSHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { clearError } = smsSlice.actions;
export default smsSlice.reducer;
