import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken, getToken } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get('/auth/me', { _skipAuthRedirect: true })
        .then((r) => setUser(r.data))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const r = await api.post('/auth/login', { email, password });
      setToken(r.data.access_token);
      setUser(r.data.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (data) => {
    try {
      const r = await api.post('/auth/register', data);
      setToken(r.data.access_token);
      setUser(r.data.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
