import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';
import type { User, UserRole } from '../types/models';
import { isTokenExpired, userFromToken } from '../utils/jwt';


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = localStorage.getItem('authToken');
  const hasValidToken = initialToken && !isTokenExpired(initialToken);
  const [token, setToken] = useState<string | null>(hasValidToken ? initialToken : null);
  const [user, setUser] = useState<User | null>(hasValidToken && initialToken ? userFromToken(initialToken) : null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(username, password);
      const jwtToken = response.data;
      localStorage.setItem('authToken', jwtToken);
      setToken(jwtToken);

      const resolvedUser = userFromToken(jwtToken);
      setUser(
        resolvedUser || {
          id: username,
          username,
          email: username,
          role: 'STUDENT' as UserRole,
        }
      );
    } catch (error: unknown) {
      localStorage.removeItem('authToken');
      setToken(null);
      const message =
        typeof error === 'object' && error && 'response' in error
          ? 'Invalid username or password'
          : 'Unable to reach server';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
