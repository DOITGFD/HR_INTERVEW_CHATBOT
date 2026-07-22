// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('ib_user');
    const token  = localStorage.getItem('ib_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Verify token still valid
      authAPI.me()
        .then(r => { setUser(r.data.user); localStorage.setItem('ib_user', JSON.stringify(r.data.user)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('ib_token', data.token);
    localStorage.setItem('ib_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('ib_token', data.token);
    localStorage.setItem('ib_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ib_token');
    localStorage.removeItem('ib_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('ib_user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
