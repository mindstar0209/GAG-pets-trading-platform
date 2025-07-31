import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="logo-star">🌱</span>
              Grow a Garden Trading
            </h3>
            <p className="footer-description">
              The #1 marketplace for Adopt Me! pets. Trade safely and securely with our automated bot system.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <span>📱</span>
              </a>
              <a href="#" className="social-link">
                <span>🐦</span>
              </a>
              <a href="#" className="social-link">
                <span>💬</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/sell">Sell Pets</Link></li>
              <li><Link to="/how-it-works">How it Works</Link></li>
              <li><Link to="/support">Support</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Information</h4>
            <ul className="footer-links">
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/refund">Refund Policy</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Security</h4>
            <p className="security-text">
              🔒 All trades are secured with our verification system
            </p>
            <p className="security-text">
              ✅ 6,000+ successful trades
            </p>
            <p className="security-text">
              ⭐ 4.8/5 average rating
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            © 2024 Grow a Garden Trading. All rights reserved. Not affiliated with Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;