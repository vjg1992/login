// client/src/services/auth.service.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  withCredentials: true,
});

export interface LoginCredentials {
  emailOrMobile: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  age?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/register', data);
    return response.data;
  },

  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await api.post('/login/google', { token });
    return response.data;
  },

  async sendOTP(type: 'email' | 'mobile', value: string): Promise<{ message: string }> {
    const response = await api.post('/send-otp', { type, value });
    return response.data;
  },

  async verifyOTP(type: 'email' | 'mobile', value: string, otp: string): Promise<{ verified: boolean }> {
    const response = await api.post('/verify-otp', { type, value, otp });
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  }
};