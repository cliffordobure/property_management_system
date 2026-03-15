import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/properties`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/properties`, propertyData, getAuthHeaders());
      return response.data;
    } catch (error) {
      // If pricing agreement is required, return the calculated pricing in the error
      if (error.response?.status === 400 && error.response?.data?.calculatedPricing) {
        return rejectWithValue({
          message: error.response.data.message,
          calculatedPricing: error.response.data.calculatedPricing
        });
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/properties/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/deleteProperty',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/properties/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete property');
    }
  }
);

const initialState = {
  properties: [],
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.properties.push(action.payload);
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter(p => p._id !== action.payload);
      });
  },
});

export const { clearError } = propertySlice.actions;
export default propertySlice.reducer;
