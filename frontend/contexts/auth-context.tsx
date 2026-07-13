'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthTokens } from '@/lib/types';
import { mockApi } from '@/lib/mock-api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokens = localStorage.getItem('auth_tokens');
        if (!tokens) {
          setIsLoading(false);
          return;
        }

        const currentUser = await mockApi.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('[v0] Auth initialization failed:', err);
        localStorage.removeItem('auth_tokens');
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const { user: userData, tokens } = await mockApi.login(email, password);
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    mockApi.logout().catch(() => {
      // Ignore errors on logout
    });
    localStorage.removeItem('auth_tokens');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
