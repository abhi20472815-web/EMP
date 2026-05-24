import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set API Base URL - robustly handles Vercel env configs that omit the '/api' suffix
  const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const API_BASE = rawApiBase.trim().endsWith('/api') ? rawApiBase.trim() : `${rawApiBase.trim()}/api`;

  // Fetch logged in user profile when token changes
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          setUser(data.data);
        } else {
          // If token invalid/expired, log out
          logout();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Do not force log out on network disconnect, only on auth failures
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error || 'Login failed. Please verify credentials.');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errMsg = 'Cannot reach server. Ensure backend is running.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setError(null);
  };

  // Auth fetch client wrapper with bearer token automatic insertion
  const authFetch = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    // Set headers
    const headers = {
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized automatically
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      const jsonResponse = await response.json();
      return jsonResponse;
    } catch (error) {
      console.error(`authFetch Error at ${endpoint}:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        authFetch,
        API_BASE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
