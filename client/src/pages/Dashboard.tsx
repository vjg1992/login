// Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import './Dashboard.css';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  created_at: string;
  last_login: string | null;
  is_email_verified: boolean;
  is_mobile_verified: boolean;
  is_google_auth: boolean;
}

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
          console.log(error);
        }

        const data = await response.json();
        if (data.success) {
          setUserData(data.data);
        }
      } catch (err) {
        setError((err as Error).message);
        setError('Failed to send OTP');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
        <button onClick={handleLogout} className="logout-button">
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