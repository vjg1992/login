// App.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';

// Enhanced User interface to support registration fields
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  age?: number;
  location?: string;
  address?: {
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  isGoogleAuth?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

// Auth context interface remains the same but supports enhanced User type
interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (data: { user: User; token: string } | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Auth Provider Component with enhanced user support
function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  const setAuth = (data: { user: User; token: string } | null) => {
    if (data?.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      setAuth,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth Service for OTP verification during registration and login
export const authService = {
  async sendOTP(type: 'email' | 'mobile', value: string) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value })
    });
    return response.json();
  },

  async verifyOTP(type: 'email' | 'mobile', value: string, otp: string) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, otp })
    });
    return response.json();
  }
};

// Initialize Query Client for data fetching
const queryClient = new QueryClient();

// Main App Component with all routes
function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/success" element={<AuthCallback />} />
            <Route path="/auth/error" element={<Navigate to="/login" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;