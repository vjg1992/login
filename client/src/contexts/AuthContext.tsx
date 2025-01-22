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

  const setAuth = (auth: AuthResponse | null) => {
    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
      localStorage.setItem('auth_token', auth.token);
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
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