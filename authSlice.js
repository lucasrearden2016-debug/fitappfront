import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

function readToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) throw new Error('expired');
    return { token, user: decoded };
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

const saved = readToken();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: saved?.token ?? null,
    user: saved?.user ?? null,
    onboarded: localStorage.getItem('onboarded') === 'true',
  },
  reducers: {
    loginSuccess(state, { payload }) {
      state.token = payload.token;
      state.user = jwtDecode(payload.token);
      state.onboarded = payload.onboarded;
      localStorage.setItem('token', payload.token);
      localStorage.setItem('onboarded', String(payload.onboarded));
    },
    setOnboarded(state) {
      state.onboarded = true;
      localStorage.setItem('onboarded', 'true');
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.onboarded = false;
      localStorage.removeItem('token');
      localStorage.removeItem('onboarded');
    },
  },
});

export const { loginSuccess, setOnboarded, logout } = authSlice.actions;
export default authSlice.reducer;
