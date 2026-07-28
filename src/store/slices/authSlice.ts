import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  email: string | null;
}

const initialState: AuthState = {
  userId: null,
  email: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ userId: string; email: string | null }>) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
    },
    clearUser(state) {
      state.userId = null;
      state.email = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
