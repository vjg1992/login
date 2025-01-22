// src/components/GoogleButton.tsx
import React from 'react';

const GoogleButton: React.FC = () => {
  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return;
    }

    console.log('Starting Google OAuth flow...');
    console.log('API URL:', apiUrl);
    
    // Direct link to Google auth endpoint
    const googleAuthUrl = `${apiUrl}/api/auth/google`;
    console.log('Redirecting to:', googleAuthUrl);

    // Use window.location.href for the redirect
    window.location.href = googleAuthUrl;
  };

  return (
    <button 
      type="button"
      onClick={handleGoogleLogin}
      className="google-login-button"
    >
      <img 
        src="https://developers.google.com/identity/images/g-logo.png" 
        alt="Google"
        className="google-icon"
      />
      Continue with Google
    </button>
  );
};

export default GoogleButton;