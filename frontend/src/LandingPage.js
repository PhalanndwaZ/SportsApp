import React from 'react';
import TopBar from './TopBar';
import './LandingPage.css';

function LandingPage({ onNavigate, currentPath }) {
  const handleGetStarted = () => {
    // Navigate to the main app
    onNavigate('/dashboard');
  };

  return (
    <div className="landing-page">
      <TopBar currentPath={currentPath} onNavigate={onNavigate} variant="landing" />

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="background-video"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="overlay"></div>

      {/* Content */}
      <div className="landing-content">
        {/* Hero Section */}
        <div className="hero">
          <h1 className="hero-title">
            Real-Time Sports
            <br />
            <span className="hero-highlight">Data Platform</span>
          </h1>
          <p className="hero-description">
            Track live Formula 1 races and football matches in real-time.
            Get instant updates, comprehensive statistics, and never miss a moment.
          </p>

          <div className="cta-buttons">
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started
              <span className="arrow">→</span>
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('/f1')}>
              Explore F1
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">🏎️</div>
            <h3>Formula 1</h3>
            <p>Live race tracking, driver stats, and team standings</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚽</div>
            <h3>Football</h3>
            <p>Live match scores, fixtures, and league tables</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time</h3>
            <p>Instant updates via WebSocket connections</p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
