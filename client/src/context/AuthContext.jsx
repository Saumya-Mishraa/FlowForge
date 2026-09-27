import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import { getAccessToken, setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    setTokens(res.data);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const res = await authApi.register({ name, email, password });
    setTokens(res.data);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const setSessionFromTokens = useCallback(async ({ accessToken, refreshToken }) => {
    setTokens({ accessToken, refreshToken });
    const res = await authApi.me();
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUserLocal = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUserLocal,
        setSessionFromTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
