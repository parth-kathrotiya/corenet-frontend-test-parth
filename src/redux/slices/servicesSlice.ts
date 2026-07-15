import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Availability {
  id: string;
  service_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface AvailabilityException {
  id: string;
  service_id: string;
  date: string;         // ISO date string
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  owner_id: string;
  name: string;
  duration: number;
  price: number;
  availabilities: Availability[];
  exceptions?: AvailabilityException[];
  owner?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

interface ServicesState {
  items: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServicesState = {
  items: [],
  loading: false,
  error: null,
};

const API = process.env.NEXT_PUBLIC_API_URL;

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch services.');
      return data as Service[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const createService = createAsyncThunk(
  'services/createService',
  async ({ token, serviceData }: { token: string; serviceData: any }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(serviceData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to create service.');
      return data as Service;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const updateService = createAsyncThunk(
  'services/updateService',
  async (
    { token, id, serviceData }: { token: string; id: string; serviceData: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(serviceData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to update service.');
      return data as Service;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const archiveService = createAsyncThunk(
  'services/archiveService',
  async ({ token, id }: { token: string; id: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to archive service.');
      return { id } as { id: string };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchServices
      .addCase(fetchServices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchServices.fulfilled, (state, action: PayloadAction<Service[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createService
      .addCase(createService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createService.fulfilled, (state, action: PayloadAction<Service>) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateService
      .addCase(updateService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateService.fulfilled, (state, action: PayloadAction<Service>) => {
        state.loading = false;
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // archiveService
      .addCase(archiveService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(archiveService.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
        state.items = state.items.filter((s) => s.id !== action.payload.id);
      })
      .addCase(archiveService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default servicesSlice.reducer;
