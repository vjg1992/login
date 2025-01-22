// src/types/auth.types.ts
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    token: string | null;
    setAuth: (auth: AuthResponse | null) => void;
    logout: () => void;
    isAuthenticated: boolean;
  }
  
  export interface ApiError {
    response?: {
      data?: {
        error?: string;
      };
    };
    message: string;
  }