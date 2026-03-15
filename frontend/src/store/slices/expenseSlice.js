import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async ({ propertyId, unitId, category, startDate, endDate, paymentMethod } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/expenses`;
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);
      if (category) params.append('category', category);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const fetchSingleExpense = createAsyncThunk(
  'expenses/fetchSingleExpense',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/expenses`, expenseData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/expenses/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/expenses/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
    }
  }
);

export const fetchExpenseStats = createAsyncThunk(
  'expenses/fetchExpenseStats',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/expenses/stats/overview`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense stats');
    }
  }
);

const initialState = {
  expenses: [],
  currentExpense: null,
  stats: null,
  loading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSingleExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSingleExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchSingleExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e._id !== action.payload);
      })
      .addCase(fetchExpenseStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;
