import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchPropertyGroups = createAsyncThunk(
  'propertyGroups/fetchPropertyGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/property-groups`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property groups');
    }
  }
);

export const fetchSinglePropertyGroup = createAsyncThunk(
  'propertyGroups/fetchSinglePropertyGroup',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/property-groups/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property group');
    }
  }
);

export const createPropertyGroup = createAsyncThunk(
  'propertyGroups/createPropertyGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/property-groups`, groupData, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create property group');
    }
  }
);

export const updatePropertyGroup = createAsyncThunk(
  'propertyGroups/updatePropertyGroup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/property-groups/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update property group');
    }
  }
);

export const addPropertiesToGroup = createAsyncThunk(
  'propertyGroups/addPropertiesToGroup',
  async ({ id, propertyIds }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/property-groups/${id}/properties`, { propertyIds }, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add properties to group');
    }
  }
);

export const removePropertiesFromGroup = createAsyncThunk(
  'propertyGroups/removePropertiesFromGroup',
  async ({ id, propertyIds }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/property-groups/${id}/properties`, {
        ...getAuthHeaders(),
        data: { propertyIds }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove properties from group');
    }
  }
);

export const deletePropertyGroup = createAsyncThunk(
  'propertyGroups/deletePropertyGroup',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/property-groups/${id}`, getAuthHeaders());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete property group');
    }
  }
);

export const fetchUngroupedProperties = createAsyncThunk(
  'propertyGroups/fetchUngroupedProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/property-groups/properties/ungrouped`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ungrouped properties');
    }
  }
);

const initialState = {
  propertyGroups: [],
  ungroupedProperties: [],
  currentPropertyGroup: null,
  loading: false,
  error: null,
};

const propertyGroupSlice = createSlice({
  name: 'propertyGroups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPropertyGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPropertyGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.propertyGroups = action.payload;
      })
      .addCase(fetchPropertyGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSinglePropertyGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSinglePropertyGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPropertyGroup = action.payload;
      })
      .addCase(fetchSinglePropertyGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPropertyGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPropertyGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.propertyGroups.unshift(action.payload);
      })
      .addCase(createPropertyGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePropertyGroup.fulfilled, (state, action) => {
        const index = state.propertyGroups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.propertyGroups[index] = action.payload;
        }
      })
      .addCase(addPropertiesToGroup.fulfilled, (state, action) => {
        const index = state.propertyGroups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.propertyGroups[index] = action.payload;
        }
        if (state.currentPropertyGroup && state.currentPropertyGroup._id === action.payload._id) {
          state.currentPropertyGroup = action.payload;
        }
      })
      .addCase(removePropertiesFromGroup.fulfilled, (state, action) => {
        const index = state.propertyGroups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.propertyGroups[index] = action.payload;
        }
        if (state.currentPropertyGroup && state.currentPropertyGroup._id === action.payload._id) {
          state.currentPropertyGroup = action.payload;
        }
      })
      .addCase(deletePropertyGroup.fulfilled, (state, action) => {
        state.propertyGroups = state.propertyGroups.filter(g => g._id !== action.payload);
      })
      .addCase(fetchUngroupedProperties.fulfilled, (state, action) => {
        state.ungroupedProperties = action.payload;
      });
  },
});

export const { clearError } = propertyGroupSlice.actions;
export default propertyGroupSlice.reducer;
