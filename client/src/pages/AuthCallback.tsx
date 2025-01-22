// src/components/AuthCallback.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthResponse, User } from '../types/auth.types';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent double processing
      if (processed.current) {
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');

        // If no params, we're probably on a subsequent mount after navigation
        if (!token || !userDataStr) {
          navigate('/login');
          return;
        }

        // Mark as processed
        processed.current = true;

        // Parse user data
        const googleUser = JSON.parse(userDataStr);

        // Transform the user data to match your User type
        const user: User = {
          firstName: googleUser.firstName,
          lastName: googleUser.lastName || '',
          id: googleUser.id,
          email: googleUser.email,
          mobile: '',
        };

        // Create auth response object
        const authResponse: AuthResponse = {
          token,
          user
        };

        // Store auth data in localStorage first
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Then update the auth context
        setAuth(authResponse);

        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, []); // Run once on mount

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;