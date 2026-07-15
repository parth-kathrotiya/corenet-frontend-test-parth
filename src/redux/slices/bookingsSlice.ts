import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface BookingService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingCustomer {
  id: string;
  name: string;
  email: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  owner_id: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  customer?: BookingCustomer;
  service?: BookingService;
  owner?: { id: string; name: string; email: string };
}

export interface OwnerStats {
  todayBookings: number;
  weekBookings: number;
  weekRevenue: number;
  totalRevenue: number;
  activeServices: number;
}

interface BookingsState {
  ownerBookings: Booking[];
  ownerAllBookings: Booking[];
  ownerAllBookingsLoading: boolean;
  ownerStats: OwnerStats | null;
  customerBookings: Booking[];
  customerBookingsLoading: boolean;
  availableSlots: string[];
  slotsLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  ownerBookings: [],
  ownerAllBookings: [],
  ownerAllBookingsLoading: false,
  ownerStats: null,
  customerBookings: [],
  customerBookingsLoading: false,
  availableSlots: [],
  slotsLoading: false,
  loading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchOwnerBookings = createAsyncThunk(
  'bookings/fetchOwnerBookings',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch bookings.');
      return data as Booking[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const fetchOwnerStats = createAsyncThunk(
  'bookings/fetchOwnerStats',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/bookings/owner/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch stats.');
      return data as OwnerStats;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'bookings/fetchAvailableSlots',
  async (
    { token, serviceId, date }: { token: string; serviceId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        `${API}/api/bookings/available-slots?serviceId=${serviceId}&date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch slots.');
      return data as string[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (
    { token, serviceId, startTime }: { token: string; serviceId: string; startTime: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceId, startTime }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to create booking.');
      return data as Booking;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMyBookings',
  async (
    { token, serviceId }: { token: string; serviceId?: string },
    { rejectWithValue }
  ) => {
    try {
      const url = serviceId
        ? `${API}/api/bookings/my?serviceId=${serviceId}`
        : `${API}/api/bookings/my`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch your bookings.');
      return data as Booking[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (
    { token, bookingId }: { token: string; bookingId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to cancel booking.');
      return { id: bookingId } as { id: string };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const fetchAllOwnerBookings = createAsyncThunk(
  'bookings/fetchAllOwnerBookings',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/bookings/owner/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to fetch all bookings.');
      return data as Booking[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const cancelOwnerBooking = createAsyncThunk(
  'bookings/cancelOwnerBooking',
  async (
    { token, bookingId }: { token: string; bookingId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/owner-cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to cancel booking.');
      return { id: bookingId } as { id: string };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

export const updateOwnerBookingStatus = createAsyncThunk(
  'bookings/updateOwnerBookingStatus',
  async (
    { token, bookingId, status }: { token: string; bookingId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/owner-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Failed to update booking status.');
      return { id: bookingId, status } as { id: string; status: string };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearSlots(state) {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOwnerBookings
      .addCase(fetchOwnerBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOwnerBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.loading = false;
        state.ownerBookings = action.payload;
      })
      .addCase(fetchOwnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchOwnerStats
      .addCase(fetchOwnerStats.pending, (state) => { state.loading = true; })
      .addCase(fetchOwnerStats.fulfilled, (state, action: PayloadAction<OwnerStats>) => {
        state.loading = false;
        state.ownerStats = action.payload;
      })
      .addCase(fetchOwnerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchAvailableSlots
      .addCase(fetchAvailableSlots.pending, (state) => { state.slotsLoading = true; state.availableSlots = []; })
      .addCase(fetchAvailableSlots.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.slotsLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.slotsLoading = false;
        state.error = action.payload as string;
      })
      // createBooking
      .addCase(createBooking.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createBooking.fulfilled, (state) => { state.loading = false; })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchMyBookings
      .addCase(fetchMyBookings.pending, (state) => { state.customerBookingsLoading = true; })
      .addCase(fetchMyBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.customerBookingsLoading = false;
        state.customerBookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state) => {
        state.customerBookingsLoading = false;
      })
      // cancelBooking (customer)
      .addCase(cancelBooking.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(cancelBooking.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
        const idx = state.customerBookings.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) {
          state.customerBookings[idx].status = 'cancelled';
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchAllOwnerBookings
      .addCase(fetchAllOwnerBookings.pending, (state) => { state.ownerAllBookingsLoading = true; state.error = null; })
      .addCase(fetchAllOwnerBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.ownerAllBookingsLoading = false;
        state.ownerAllBookings = action.payload;
      })
      .addCase(fetchAllOwnerBookings.rejected, (state, action) => {
        state.ownerAllBookingsLoading = false;
        state.error = action.payload as string;
      })
      // cancelOwnerBooking
      .addCase(cancelOwnerBooking.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(cancelOwnerBooking.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
        // Update in ownerAllBookings
        const idx1 = state.ownerAllBookings.findIndex((b) => b.id === action.payload.id);
        if (idx1 !== -1) state.ownerAllBookings[idx1].status = 'cancelled';
        // Update in ownerBookings (upcoming)
        const idx2 = state.ownerBookings.findIndex((b) => b.id === action.payload.id);
        if (idx2 !== -1) state.ownerBookings[idx2].status = 'cancelled';
      })
      .addCase(cancelOwnerBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateOwnerBookingStatus
      .addCase(updateOwnerBookingStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateOwnerBookingStatus.fulfilled, (state, action: PayloadAction<{ id: string; status: string }>) => {
        state.loading = false;
        const { id, status } = action.payload;
        // Update in ownerAllBookings
        const idx1 = state.ownerAllBookings.findIndex((b) => b.id === id);
        if (idx1 !== -1) state.ownerAllBookings[idx1].status = status;
        // Update in ownerBookings
        const idx2 = state.ownerBookings.findIndex((b) => b.id === id);
        if (idx2 !== -1) state.ownerBookings[idx2].status = status;
      })
      .addCase(updateOwnerBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSlots } = bookingsSlice.actions;
export default bookingsSlice.reducer;
