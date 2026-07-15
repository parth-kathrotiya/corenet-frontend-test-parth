import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  email: null,
  name: null,
  role: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; email: string; name: string; role: string }>
    ) => {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('email', action.payload.email);
        localStorage.setItem('name', action.payload.name);
        localStorage.setItem('role', action.payload.role);
      }
    },

    loadCredentials: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        const name = localStorage.getItem('name');
        const role = localStorage.getItem('role');

        if (token && email && name && role) {
          state.token = token;
          state.email = email;
          state.name = name;
          state.role = role;
          state.isAuthenticated = true;
        }
      }
    },

    clearCredentials: (state) => {
      state.token = null;
      state.email = null;
      state.name = null;
      state.role = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        localStorage.removeItem('role');
      }
    },
  },
});

export const { setCredentials, loadCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
