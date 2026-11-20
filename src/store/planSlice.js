import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { logout } from './authSlice';

// Estado del plan (Común / prueba / Premium), desde GET /api/billing/me
export const fetchPlan = createAsyncThunk('plan/fetch', async () => (await api.get('/billing/me')).data);

const planSlice = createSlice({
  name: 'plan',
  initialState: { data: null, promptOpen: false },
  reducers: {
    openPremiumPrompt(state) { state.promptOpen = true; },
    closePremiumPrompt(state) { state.promptOpen = false; },
  },
  extraReducers: (b) => {
    b.addCase(fetchPlan.fulfilled, (state, { payload }) => { state.data = payload; });
    b.addCase(logout, (state) => { state.data = null; state.promptOpen = false; });
  },
});

export const { openPremiumPrompt, closePremiumPrompt } = planSlice.actions;
export default planSlice.reducer;
