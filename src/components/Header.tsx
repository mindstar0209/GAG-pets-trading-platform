import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useTraditionalAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-star">🌱</span>
            <span className="logo-text">Grow a Garden Trading</span>
          </Link>
          <nav className="nav-links">
            <Link to="/marketplace" className="nav-link">Marketplace</Link>
            <Link to="/sell" className="nav-link">Sell</Link>
            <Link to="/how-it-works" className="nav-link">How it Works</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <Link to="/deposit" className="deposit-btn">
                <span className="deposit-icon">💰</span>
                Deposit
              </Link>
              <div className="balance-display">
                <span className="balance-icon">💵</span>
                <span className="balance-amount">${user.balance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="user-dropdown" onClick={() => setShowDropdown(!showDropdown)}>
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=00D2FF&color=fff`} 
                  alt="User Avatar" 
                  className="user-avatar"
                />
                <span className="user-name">{user.username}</span>
                <span className="dropdown-arrow">▼</span>
                
                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/my-dashboard" className="dropdown-item">My Dashboard</Link>
                    <Link to="/orders" className="dropdown-item">My Orders</Link>
                    <Link to="/listings" className="dropdown-item">My Listings</Link>
                    <Link to="/settings" className="dropdown-item">Settings</Link>
                    <hr className="dropdown-divider" />
                    <button onClick={logout} className="dropdown-item logout">Logout</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn">
                <span className="login-icon">👤</span>
                Sign In
              </Link>
              <Link to="/register" className="auth-btn register-btn">
                <span className="register-icon">✨</span>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;