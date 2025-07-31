import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useRobloxAuth } from '../hooks/useFirebaseRobloxAuth';
import './Auth.css';

const RobloxAuth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  
  const { loginWithRobloxUsername, user } = useRobloxAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleRobloxLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robloxUsername.trim()) {
      setError('Please enter your Roblox username');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await loginWithRobloxUsername(robloxUsername.trim());
      // Navigation happens automatically via useEffect when user is set
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login with Roblox. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Login with Roblox</h1>
          <p className="auth-subtitle">Connect your Roblox account to start trading</p>
        </div>

        <div className="roblox-auth-section">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="roblox-login-info">
            <div className="info-card">
              <h3>🔒 Why Roblox Login?</h3>
              <ul className="info-list">
                <li>✅ Secure authentication with your Roblox account</li>
                <li>✅ Automatic friend request system for pet delivery</li>
                <li>✅ No need to remember another password</li>
                <li>✅ Verified Roblox username for trading</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleRobloxLogin} className="roblox-login-form">
            <div className="form-group">
              <label htmlFor="robloxUsername" className="form-label">Roblox Username</label>
              <input
                type="text"
                id="robloxUsername"
                className="form-input"
                placeholder="Enter your Roblox username"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            
            <button 
              type="submit"
              className="roblox-login-btn"
              disabled={loading || !robloxUsername.trim()}
            >
              <div className="roblox-btn-content">
                <img 
                  src="https://images.rbxcdn.com/c69b74f49c6d2d0d8bf8d8c8c0b8c8c8" 
                  alt="Roblox" 
                  className="roblox-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCAxMEwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDEwTDEwLjkxIDguMjZMMTIgMloiIGZpbGw9IiMwMEQyRkYiLz4KPC9zdmc+';
                  }}
                />
                <span>{loading ? 'Connecting...' : 'Continue with Roblox'}</span>
              </div>
            </button>
          </form>

          <div className="auth-divider">
            <span>How it works</span>
          </div>

          <div className="how-it-works-steps">
            <div className="step-item">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Login with Roblox</h4>
                <p>Securely connect your Roblox account</p>
              </div>
            </div>
            
            <div className="step-item">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Browse & Purchase</h4>
                <p>Find and buy your favorite pets</p>
              </div>
            </div>
            
            <div className="step-item">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Auto Friend Request</h4>
                <p>System guides you to add the seller</p>
              </div>
            </div>
            
            <div className="step-item">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Receive Pet</h4>
                <p>Meet in-game and get your pet!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            By continuing, you agree to our{' '}
            <Link to="/terms" className="auth-link">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="auth-link">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RobloxAuth;