import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async ({ tenantId, invoiceId, propertyId, startDate, endDate, status, paymentMethod } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/payments`;
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      if (invoiceId) params.append('invoiceId', invoiceId);
      if (propertyId) params.append('propertyId', propertyId);
      if (status) params.append('status', status);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const fetchSinglePayment = createAsyncThunk(
  'payments/fetchSinglePayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payments/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments`, paymentData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

export const updatePayment = createAsyncThunk(
  'payments/updatePayment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/payments/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment');
    }
  }
);

export const deletePayment = createAsyncThunk(
  'payments/deletePayment',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/payments/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payment');
    }
  }
);

export const fetchPaymentStats = createAsyncThunk(
  'payments/fetchPaymentStats',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/payments/stats/overview`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment stats');
    }
  }
);

export const approvePayment = createAsyncThunk(
  'payments/approvePayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/payments/${id}/approve`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve payment');
    }
  }
);

export const rejectPayment = createAsyncThunk(
  'payments/rejectPayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/payments/${id}/reject`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject payment');
    }
  }
);

const initialState = {
  payments: [],
  currentPayment: null,
  stats: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSinglePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSinglePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
      })
      .addCase(fetchSinglePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload.payment);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.payments = state.payments.filter(p => p._id !== action.payload);
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(approvePayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p._id === action.payload.payment._id);
        if (index !== -1) {
          state.payments[index] = action.payload.payment;
        }
      })
      .addCase(rejectPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p._id === action.payload.payment._id);
        if (index !== -1) {
          state.payments[index] = action.payload.payment;
        }
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
