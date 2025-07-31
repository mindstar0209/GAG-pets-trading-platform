import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const buyingSteps = [
    {
      number: '1',
      title: 'Browse & Select',
      description: 'Browse our marketplace to find the perfect pet. Use filters to narrow down by type, rarity, price, and special features.',
      icon: '🔍'
    },
    {
      number: '2',
      title: 'Add to Cart',
      description: 'Click on any pet to view details and add it to your cart. Review all information before proceeding.',
      icon: '🛒'
    },
    {
      number: '3',
      title: 'Secure Payment',
      description: 'Complete your purchase using our secure payment system. We accept multiple payment methods for your convenience.',
      icon: '💳'
    },
    {
      number: '4',
      title: 'Bot Friend Request',
      description: 'After payment, add our trading bot as a friend in Roblox. You\'ll receive the bot username immediately.',
      icon: '🤖'
    },
    {
      number: '5',
      title: 'Join Game & Trade',
      description: 'Join the same Adopt Me! server as our bot. The bot will automatically initiate the trade and deliver your pet.',
      icon: '🎮'
    },
    {
      number: '6',
      title: 'Receive Your Pet',
      description: 'Accept the trade and receive your new pet instantly! The entire process takes just a few minutes.',
      icon: '🎉'
    }
  ];

  const sellingSteps = [
    {
      number: '1',
      title: 'List Your Pet',
      description: 'Click "Sell" and fill in your pet\'s details including type, rarity, age, and any special features.',
      icon: '📝'
    },
    {
      number: '2',
      title: 'Set Your Price',
      description: 'Choose a competitive price for your pet. Remember, we charge a 10% fee on successful sales.',
      icon: '💰'
    },
    {
      number: '3',
      title: 'Transfer to Bot',
      description: 'Once listed, you\'ll need to transfer your pet to our secure bot account for safekeeping.',
      icon: '🔐'
    },
    {
      number: '4',
      title: 'Wait for Buyer',
      description: 'Your pet will appear in the marketplace. We\'ll notify you when someone purchases it.',
      icon: '⏳'
    },
    {
      number: '5',
      title: 'Receive Payment',
      description: 'After a successful sale, funds are added to your account balance minus our 10% fee.',
      icon: '💵'
    },
    {
      number: '6',
      title: 'Withdraw Earnings',
      description: 'Withdraw your earnings anytime via PayPal, bank transfer, or convert to Robux.',
      icon: '🏦'
    }
  ];

  const faqs = [
    {
      question: 'Is it safe to trade through Grow a Garden Trading?',
      answer: 'Yes! All trades are handled by our secure bot system. Pets are held in escrow until the transaction is complete, protecting both buyers and sellers.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Most deliveries are completed within 5-10 minutes after payment. During peak times, it may take up to 30 minutes.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit/debit cards, PayPal, cryptocurrency, and Robux. All payments are processed securely.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled within 5 minutes of purchase if the trade hasn\'t been initiated. Contact support for assistance.'
    },
    {
      question: 'What if I don\'t receive my pet?',
      answer: 'Our system tracks all trades. If you don\'t receive your pet within 1 hour, contact support for a full refund.'
    },
    {
      question: 'Are there any hidden fees?',
      answer: 'No hidden fees! Buyers pay the listed price. Sellers pay a 10% commission only when their pet sells.'
    }
  ];

  return (
    <div className="how-it-works">
      <div className="hero-section">
        <h1 className="page-title">How It Works</h1>
        <p className="page-subtitle">
          Learn how to buy and sell Grow a Garden pets safely and securely on Grow a Garden Trading
        </p>
      </div>

      <div className="content-container">
        <section className="process-section">
          <h2 className="section-title">
            <span className="title-icon">🛍️</span>
            Buying Pets
          </h2>
          <div className="steps-grid">
            {buyingSteps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-header">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">Step {step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="process-section">
          <h2 className="section-title">
            <span className="title-icon">💸</span>
            Selling Pets
          </h2>
          <div className="steps-grid">
            {sellingSteps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-header">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">Step {step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="security-section">
          <h2 className="section-title">
            <span className="title-icon">🔒</span>
            Security & Trust
          </h2>
          <div className="security-features">
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <div>
                <h3>Escrow Protection</h3>
                <p>All pets are held securely by our bots until the transaction is complete</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">✅</span>
              <div>
                <h3>Verified Sellers</h3>
                <p>We verify all sellers to ensure legitimate trades and prevent scams</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <div>
                <h3>Automated Delivery</h3>
                <p>Our bot system ensures fast, reliable delivery without human error</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">💯</span>
              <div>
                <h3>Money-Back Guarantee</h3>
                <p>Full refund if you don't receive your pet within 1 hour of purchase</p>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-section">
          <h2 className="section-title">
            <span className="title-icon">❓</span>
            Frequently Asked Questions
          </h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Start Trading?</h2>
            <p>Join thousands of happy customers trading safely on Grow a Garden Trading</p>
            <div className="cta-buttons">
              <Link to="/marketplace" className="cta-btn primary">
                Browse Pets
              </Link>
              <Link to="/sell" className="cta-btn secondary">
                Start Selling
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HowItWorks;