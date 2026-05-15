const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || browserOrigin;
export const API = `${BACKEND_URL.replace(/\/$/, '')}/api/v1`;

export const getBackendErrorMessage = (error, fallback = 'Error') => {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || item.message || JSON.stringify(item)).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return detail.message || detail.error || JSON.stringify(detail);
  }
  return detail || error.response?.data?.message || error.message || fallback;
};
