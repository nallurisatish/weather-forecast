import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('weathersphere_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on init
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('weathersphere_token');
      try {
        const res = await authAPI.getMe();
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
          if (storedToken) {
            setToken(null);
            localStorage.removeItem('weathersphere_token');
          }
        }
      } catch (err) {
        // Not logged in or invalid token
        setUser(null);
        setToken(null);
        localStorage.removeItem('weathersphere_token');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data?.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        if (res.data.token) {
          localStorage.setItem('weathersphere_token', res.data.token);
        }
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authAPI.register(userData);
      if (res.data?.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        if (res.data.token) {
          localStorage.setItem('weathersphere_token', res.data.token);
        }
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const googleLogin = async (googlePayload) => {
    setError(null);
    try {
      const res = await authAPI.googleLogin(googlePayload);
      if (res.data?.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        if (res.data.token) {
          localStorage.setItem('weathersphere_token', res.data.token);
        }
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('weathersphere_token');
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const res = await userAPI.updatePreferences(newPreferences);
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update preferences' };
    }
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        updatePreferences,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
