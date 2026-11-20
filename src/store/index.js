import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import planReducer from './planSlice';

export const store = configureStore({
  reducer: { auth: authReducer, plan: planReducer },
});
