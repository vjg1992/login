// Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, authService } from '../App';
import './Login.css';
import GoogleButton from '@/components/GoogleButton';

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

  const resetOTPForm = () => {
    setOtpForm({
      emailOrMobile: '',
      otp: '',
      otpSent: false
    });
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    resetOTPForm();
  };
  

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrMobile: passwordForm.emailOrMobile,
          password: passwordForm.password
        })
      });
  
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }
  
      // Updated to use data.data to match OTP flow
      setAuth(data.data);
      
      // Store token using the same structure
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
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
    } catch {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'emailOtp' ? 'email' : 'mobile',
          value: otpForm.emailOrMobile,
          otp: otpForm.otp
        })
      });
  
      const data = await response.json();
      if (!data) {
        throw new Error('Verification failed');
      }

      setAuth(data.data);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to verify OTP');
      console.error('Failed to verify OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome Back</h1>
        
        {error && <div className="error-message">{error}</div>}

        <div className="login-tabs">
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => handleTabClick('password')}
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
          <GoogleButton />
          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;