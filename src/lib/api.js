import axios from 'axios';

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || browserOrigin;
export const API = `${BACKEND_URL.replace(/\/$/, '')}/api/v1`;
export const TOKEN_KEY = process.env.REACT_APP_TOKEN_STORAGE_KEY || 'einvoicepro_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config?._skipAuthRedirect) {
      clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((i) => i.msg || i.message || JSON.stringify(i)).join(', ');
  if (detail && typeof detail === 'object') return detail.message || detail.error || fallback;
  return detail || error?.response?.data?.message || error?.message || fallback;
};

export const formatCurrency = (amount, code = 'EUR') => {
  try {
    return new Intl.NumberFormat('en-EU', { style: 'currency', currency: code }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(2)} ${code}`;
  }
};

export const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return String(d); }
};
