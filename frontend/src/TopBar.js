import React from 'react';
import './TopBar.css';

function TopBar({ currentPath, onNavigate, variant = 'default', rightSlot }) {
  const isF1Active = currentPath.startsWith('/f1');
  const isFootballActive = currentPath === '/football';

  const handleNavigate = (nextPath) => (event) => {
    if (event) {
      event.preventDefault();
    }
    if (onNavigate) {
      onNavigate(nextPath);
    }
  };

  return (
    <header className={`topbar topbar--${variant}`}>
      <div className="topbar-inner">
        <a href="/" className="topbar-brand" onClick={handleNavigate('/')}
        >
          <span className="topbar-logo">APEX</span>
          <span className="topbar-subtitle">Sports</span>
        </a>

        <nav className="topbar-nav">
          <a
            href="/f1"
            className={`topbar-link ${isF1Active ? 'active' : ''}`}
            onClick={handleNavigate('/f1')}
          >
            F1
          </a>
          <a
            href="/football"
            className={`topbar-link ${isFootballActive ? 'active' : ''}`}
            onClick={handleNavigate('/football')}
          >
            Football
          </a>
        </nav>

        <div className="topbar-actions">
          <button className="topbar-button" onClick={handleNavigate('/dashboard')}>
            Dashboard
          </button>
          {rightSlot && <div className="topbar-slot">{rightSlot}</div>}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
