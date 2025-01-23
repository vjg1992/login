// AuthCallback.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (processed.current) return;

      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');

        if (!token || !userDataStr) {
          navigate('/login');
          return;
        }

        processed.current = true;
        const googleUser = JSON.parse(userDataStr);

        const user = {
          id: googleUser.id,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName || '',
          email: googleUser.email,
          mobile: ''
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setAuth({ token, user });
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  });

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