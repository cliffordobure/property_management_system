import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async ({ tenantId, propertyId, status, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/invoices`;
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      if (propertyId) params.append('propertyId', propertyId);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchSingleInvoice = createAsyncThunk(
  'invoices/fetchSingleInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/invoices/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch invoice');
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/invoices/create`, invoiceData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create invoice');
    }
  }
);

export const generateAllInvoices = createAsyncThunk(
  'invoices/generateAllInvoices',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/invoices/generate-all`, invoiceData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate invoices');
    }
  }
);

export const generateInvoicesByLease = createAsyncThunk(
  'invoices/generateInvoicesByLease',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/invoices/generate-by-lease`, invoiceData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate invoices');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/invoices/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update invoice');
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/deleteInvoice',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/invoices/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete invoice');
    }
  }
);

const initialState = {
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSingleInvoice.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSingleInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(fetchSingleInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        // Add new invoice to the beginning of the array (most recent first)
        state.invoices.unshift(action.payload);
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(generateAllInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateAllInvoices.fulfilled, (state, action) => {
        state.loading = false;
        // Add new invoices to the beginning of the array (most recent first)
        state.invoices = [...action.payload.invoices, ...state.invoices];
      })
      .addCase(generateAllInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(generateInvoicesByLease.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateInvoicesByLease.fulfilled, (state, action) => {
        state.loading = false;
        // Add new invoices to the beginning of the array (most recent first)
        state.invoices = [...action.payload.invoices, ...state.invoices];
      })
      .addCase(generateInvoicesByLease.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter(i => i._id !== action.payload);
      });
  },
});

export const { clearError } = invoiceSlice.actions;
export default invoiceSlice.reducer;
