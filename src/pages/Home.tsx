import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const stats = [
    { label: 'Active Listings', value: '2,500+', icon: '🐾' },
    { label: 'Happy Customers', value: '10,000+', icon: '😊' },
    { label: 'Successful Trades', value: '50,000+', icon: '🤝' },
    { label: 'Average Rating', value: '4.8/5', icon: '⭐' }
  ];

  const features = [
    {
      icon: '🔒',
      title: 'Secure Trading',
      description: 'All trades are protected with our verification system and secure bots'
    },
    {
      icon: '⚡',
      title: 'Fast Delivery',
      description: 'Get your pets delivered within minutes through our automated system'
    },
    {
      icon: '💰',
      title: 'Best Prices',
      description: 'Competitive prices on all Adopt Me! pets and items'
    },
    {
      icon: '🛡️',
      title: 'Safe & Reliable',
      description: 'Thousands of successful trades with verified sellers'
    }
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Grow a Garden Trading</span>
          </h1>
          <p className="hero-subtitle">
            The #1 Marketplace for Grow a Garden Pets
          </p>
          <p className="hero-description">
            Trade safely and securely with thousands of verified sellers. 
            Get your dream pets delivered instantly!
          </p>
          <div className="hero-buttons">
            <Link to="/marketplace" className="cta-button primary">
              Browse Marketplace
            </Link>
            <Link 
              to="/auth/roblox" 
              className="cta-button secondary"
              onClick={(e) => {
                console.log('Login button clicked!');
                console.log('Navigation target:', '/auth/roblox');
              }}
            >
              Login with Roblox
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-glow"></div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Why Choose Grow a Garden Trading?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Browse & Select</h3>
            <p className="step-description">
              Browse our marketplace and find your dream pets
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">Purchase Safely</h3>
            <p className="step-description">
              Complete your purchase with our secure payment system
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Receive Instantly</h3>
            <p className="step-description">
              Meet our bot in-game and receive your pets
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Trading?</h2>
          <p className="cta-description">
            Join thousands of happy customers and get your dream pets today!
          </p>
          <Link 
            to="/auth/roblox" 
            className="cta-button large"
            onClick={(e) => {
              console.log('Login button clicked! (CTA section)');
              console.log('Navigation target:', '/auth/roblox');
            }}
          >
            Login with Roblox
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;