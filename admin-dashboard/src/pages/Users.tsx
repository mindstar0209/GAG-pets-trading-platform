import React, { useState, useEffect } from 'react';
import './Users.css';

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in real app, fetch from Firebase
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          balance: 150.50,
          joinDate: new Date('2024-01-15'),
          status: 'active',
          totalSpent: 75.25,
          totalEarned: 200.00
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          balance: 89.75,
          joinDate: new Date('2024-02-01'),
          status: 'active',
          totalSpent: 45.50,
          totalEarned: 120.00
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          balance: 0.00,
          joinDate: new Date('2024-02-15'),
          status: 'suspended',
          totalSpent: 0.00,
          totalEarned: 0.00
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'suspended': return '#e74c3c';
      case 'pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className="users">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users">
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage user accounts and monitor activity</p>
      </div>

      <div className="users-summary">
        <div className="summary-card">
          <h3>Total Users</h3>
          <p className="summary-value">{users.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active Users</h3>
          <p className="summary-value">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Balance</h3>
          <p className="summary-value">
            ${users.reduce((sum, u) => sum + u.balance, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div className="table-cell">User</div>
          <div className="table-cell">Email</div>
          <div className="table-cell">Balance</div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Total Spent</div>
          <div className="table-cell">Total Earned</div>
          <div className="table-cell">Join Date</div>
          <div className="table-cell">Actions</div>
        </div>

        {users.map((user) => (
          <div key={user.id} className="table-row">
            <div className="table-cell">
              <div className="user-info">
                <div className="user-avatar">
                  {user.name.charAt(0)}
                </div>
                <div className="user-details">
                  <div className="user-name">{user.name}</div>
                  <div className="user-id">ID: {user.id}</div>
                </div>
              </div>
            </div>
            <div className="table-cell">{user.email}</div>
            <div className="table-cell">
              <span className="balance">${user.balance.toFixed(2)}</span>
            </div>
            <div className="table-cell">
              <span 
                className="status"
                style={{ backgroundColor: getStatusColor(user.status) }}
              >
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>
            <div className="table-cell">${user.totalSpent.toFixed(2)}</div>
            <div className="table-cell">${user.totalEarned.toFixed(2)}</div>
            <div className="table-cell">
              {user.joinDate.toLocaleDateString()}
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                <button className="btn-small primary">View</button>
                <button className="btn-small secondary">Edit</button>
                <button className="btn-small danger">Suspend</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
