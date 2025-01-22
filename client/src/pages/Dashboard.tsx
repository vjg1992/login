// src/pages/Dashboard.tsx
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>
      
      <main className="dashboard-content">
        <div className="user-info">
          <h2>Your Profile</h2>
          <div className="info-item">
            <label>Name:</label>
            <span>{`${user?.firstName} ${user?.lastName}`}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;