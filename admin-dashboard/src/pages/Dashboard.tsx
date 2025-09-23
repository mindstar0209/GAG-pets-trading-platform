import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import './Dashboard.css';

interface DashboardStats {
  totalSellRequests: number;
  pendingRequests: number;
  verifiedRequests: number;
  totalTransactions: number;
  totalRevenue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sell Requests',
      value: stats?.totalSellRequests || 0,
      icon: '📦',
      color: '#3498db',
      change: '+12%'
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: '⏳',
      color: '#f39c12',
      change: '+5%'
    },
    {
      title: 'Verified Requests',
      value: stats?.verifiedRequests || 0,
      icon: '✅',
      color: '#27ae60',
      change: '+8%'
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      icon: '💳',
      color: '#9b59b6',
      change: '+15%'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: '💰',
      color: '#e74c3c',
      change: '+22%'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome to the GAG Pets Admin Dashboard</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <h3>{card.title}</h3>
              <div className="stat-value">{card.value}</div>
              <div className="stat-change positive">{card.change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn primary">
              <span className="btn-icon">📦</span>
              <span>Review Sell Requests</span>
            </button>
            <button className="action-btn secondary">
              <span className="btn-icon">💳</span>
              <span>View Transactions</span>
            </button>
            <button className="action-btn tertiary">
              <span className="btn-icon">👥</span>
              <span>Manage Users</span>
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📦</div>
              <div className="activity-content">
                <p className="activity-title">New sell request received</p>
                <p className="activity-time">2 minutes ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <p className="activity-title">Pet verified and listed</p>
                <p className="activity-time">15 minutes ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💳</div>
              <div className="activity-content">
                <p className="activity-title">Transaction completed</p>
                <p className="activity-time">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
