import axios from 'axios';
import { toast } from 'react-toastify';
import i18n, { lang } from '../i18n';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = lang();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errorMsg = (err) => err.response?.data?.message ?? i18n.t('Algo salió mal');
export const showError = (err) => toast.error(errorMsg(err));

export default api;
