import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextInstance.js';
import { authService } from '../services/auth.service.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clinicflow_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('clinicflow_token'));
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('clinicflow_token');
    localStorage.removeItem('clinicflow_user');
  };

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('clinicflow_token');
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('clinicflow_user', JSON.stringify(profile));
          }
        } catch {
          if (isMounted) {
            clearAuth();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('clinicflow_token', data.token);
    localStorage.setItem('clinicflow_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    clearAuth();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
