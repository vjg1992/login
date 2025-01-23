import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import './Register.css';

// Simple interface for form data
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  age: number;
  location: string;
  address: {
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    age: 18,
    location: '',
    address: {
      area: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  // Verification states
  const [emailOTP, setEmailOTP] = useState('');
  const [mobileOTP, setMobileOTP] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // Handle basic input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  // Handle sending OTP
  const sendOTP = async (type: 'email' | 'mobile') => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: type === 'email' ? formData.email : formData.mobile
        })
      });
      
      if (!response.ok) throw new Error('Failed to send OTP');
      
      alert(`OTP sent to your ${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying OTP
  const verifyOTP = async (type: 'email' | 'mobile') => {
    try {
      setLoading(true);
      const otp = type === 'email' ? emailOTP : mobileOTP;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: type === 'email' ? formData.email : formData.mobile,
          otp
        })
      });

      if (!response.ok) throw new Error('Invalid OTP');

      if (type === 'email') setIsEmailVerified(true);
      else setIsMobileVerified(true);
      
      alert(`${type} verified successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEmailVerified || !isMobileVerified) {
      setError('Please verify both email and mobile');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // Set authentication and redirect
      setAuth(data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Basic Information */}
        <div className="form-group">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="First Name"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Last Name"
            required
          />
        </div>

        {/* Email Verification */}
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            required
            disabled={isEmailVerified}
          />
          {!isEmailVerified && (
            <button type="button" onClick={() => sendOTP('email')} disabled={loading}>
              Send Email OTP
            </button>
          )}
          {!isEmailVerified && (
            <div>
              <input
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                placeholder="Enter Email OTP"
              />
              <button type="button" onClick={() => verifyOTP('email')} disabled={loading}>
                Verify Email
              </button>
            </div>
          )}
        </div>

        {/* Mobile Verification */}
        <div className="form-group">
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            placeholder="Mobile Number"
            required
            disabled={isMobileVerified}
          />
          {!isMobileVerified && (
            <button type="button" onClick={() => sendOTP('mobile')} disabled={loading}>
              Send Mobile OTP
            </button>
          )}
          {!isMobileVerified && (
            <div>
              <input
                type="text"
                value={mobileOTP}
                onChange={(e) => setMobileOTP(e.target.value)}
                placeholder="Enter Mobile OTP"
              />
              <button type="button" onClick={() => verifyOTP('mobile')} disabled={loading}>
                Verify Mobile
              </button>
            </div>
          )}
        </div>

        {/* Age Selection */}
        <div className="form-group">
          <input
            type="range"
            name="age"
            min="18"
            max="100"
            value={formData.age}
            onChange={handleInputChange}
          />
          <span>Age: {formData.age}</span>
        </div>

        {/* Location and Address */}
        <div className="form-group">
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Location"
            required
          />
        </div>

        <div className="address-group">
          <input
            type="text"
            name="area"
            value={formData.address.area}
            onChange={handleAddressChange}
            placeholder="Area"
            required
          />
          <input
            type="text"
            name="city"
            value={formData.address.city}
            onChange={handleAddressChange}
            placeholder="City"
            required
          />
          <select name="state" value={formData.address.state} onChange={handleAddressChange} required>
            <option value="">Select State</option>
            {/* Add Indian states here */}
          </select>
          <input
            type="text"
            name="pincode"
            value={formData.address.pincode}
            onChange={handleAddressChange}
            placeholder="PIN Code"
            pattern="[0-9]{6}"
            required
          />
        </div>

        <button type="submit" disabled={loading || !isEmailVerified || !isMobileVerified}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default Register;