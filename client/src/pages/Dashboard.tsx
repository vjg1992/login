// src/pages/Dashboard.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { userData, loading, error } = useUserData();

  useEffect(() => {
    if (error) {
      navigate('/login');
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {userData?.first_name || 'User'}!</h1>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
      
      <main className="dashboard-content">
        <div className="user-info">
          <h2>Your Profile</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{`${userData?.first_name || ''} ${userData?.last_name || ''}`}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{userData?.email || ''}</span>
              {userData?.is_email_verified && <span className="verified-badge">✓ Verified</span>}
            </div>
            <div className="info-item">
              <label>Mobile:</label>
              <span>{userData?.mobile || ''}</span>
              {userData?.is_mobile_verified && <span className="verified-badge">✓ Verified</span>}
            </div>
            <div className="info-item">
              <label>Member Since:</label>
              <span>{new Date(userData?.created_at || '').toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Last Login:</label>
              <span>{userData?.last_login ? new Date(userData.last_login).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;