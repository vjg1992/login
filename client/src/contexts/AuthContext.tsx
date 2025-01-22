// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContextType, AuthResponse, User } from '../types/auth.types';
/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          setToken(storedToken);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch {
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const setAuth = (authData: AuthResponse | null) => {
    if (authData && authData.token) {
      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setUser(authData.user);
      setToken(authData.token);
    }
  };

  const logout = () => {
    setAuth(null);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        token,
        setAuth,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}