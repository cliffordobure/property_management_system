import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchUnits = createAsyncThunk(
  'units/fetchUnits',
  async (propertyId, { rejectWithValue }) => {
    try {
      const url = propertyId 
        ? `${API_URL}/units?propertyId=${propertyId}`
        : `${API_URL}/units`;
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch units');
    }
  }
);

export const createUnit = createAsyncThunk(
  'units/createUnit',
  async (unitData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/units`, unitData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create unit');
    }
  }
);

export const updateUnit = createAsyncThunk(
  'units/updateUnit',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/units/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update unit');
    }
  }
);

export const deleteUnit = createAsyncThunk(
  'units/deleteUnit',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/units/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete unit');
    }
  }
);

const initialState = {
  units: [],
  loading: false,
  error: null,
};

const unitSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUnit.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })
      .addCase(updateUnit.fulfilled, (state, action) => {
        const index = state.units.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.units[index] = action.payload;
        }
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.units = state.units.filter(u => u._id !== action.payload);
      });
  },
});

export const { clearError } = unitSlice.actions;
export default unitSlice.reducer;
