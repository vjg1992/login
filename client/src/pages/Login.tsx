// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { ApiError } from '../types/auth.types';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    emailOrMobile: '',
    password: '',
    rememberMe: false
  });

  const [otpForm, setOtpForm] = useState({
    emailOrMobile: '',
    otp: '',
    otpSent: false
  });

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login({
        emailOrMobile: passwordForm.emailOrMobile,
        password: passwordForm.password
      });
      setAuth(response);
      navigate('/dashboard');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPRequest = async () => {
    setError(null);
    setLoading(true);

    try {
      const type = activeTab === 'emailOtp' ? 'email' : 'mobile';
      await authService.sendOTP(type, otpForm.emailOrMobile);
      setOtpForm(prev => ({ ...prev, otpSent: true }));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const type = activeTab === 'emailOtp' ? 'email' : 'mobile';
      const response = await authService.verifyOTP(
        type,
        otpForm.emailOrMobile,
        otpForm.otp
      );
      if (response.verified) {
        navigate('/dashboard');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome Back</h1>
        
        {error && <div className="error-message">{error}</div>}

        <div className="login-tabs">
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button 
            className={`tab-button ${activeTab === 'emailOtp' ? 'active' : ''}`}
            onClick={() => setActiveTab('emailOtp')}
          >
            Email OTP
          </button>
          <button 
            className={`tab-button ${activeTab === 'mobileOtp' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobileOtp')}
          >
            Mobile OTP
          </button>
        </div>

        <div className="login-content">
          {/* Password Login Form */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="emailOrMobile">Email or Mobile</label>
                <input
                  type="text"
                  id="emailOrMobile"
                  value={passwordForm.emailOrMobile}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    emailOrMobile: e.target.value
                  })}
                  placeholder="Enter your email or mobile"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      password: e.target.value
                    })}
                    placeholder="Enter your password"
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={passwordForm.rememberMe}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      rememberMe: e.target.checked
                    })}
                  />
                  Remember me for 30 days
                </label>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          )}

          {/* OTP Forms */}
          {(activeTab === 'emailOtp' || activeTab === 'mobileOtp') && (
            <form onSubmit={handleOTPVerify} className="login-form">
              <div className="form-group">
                <label>
                  {activeTab === 'emailOtp' ? 'Email Address' : 'Mobile Number'}
                </label>
                <input
                  type={activeTab === 'emailOtp' ? 'email' : 'tel'}
                  value={otpForm.emailOrMobile}
                  onChange={(e) => setOtpForm({
                    ...otpForm,
                    emailOrMobile: e.target.value
                  })}
                  placeholder={activeTab === 'emailOtp' 
                    ? 'Enter your email' 
                    : 'Enter your mobile number'
                  }
                  disabled={otpForm.otpSent}
                />
              </div>

              {!otpForm.otpSent ? (
                <button 
                  type="button" 
                  className="login-button"
                  onClick={handleOTPRequest}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <div className="form-group">
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    value={otpForm.otp}
                    onChange={(e) => setOtpForm({
                      ...otpForm,
                      otp: e.target.value
                    })}
                    placeholder="Enter OTP"
                  />
                  <button 
                    type="submit" 
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="divider">OR</div>

          <button 
            onClick={handleGoogleLogin}
            className="google-button"
          >
            Continue with Google
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;