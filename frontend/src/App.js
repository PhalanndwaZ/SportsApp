import React, { useEffect, useState } from 'react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import F1Page from './F1Page';
import F1DriverPage from './F1DriverPage';
import F1TeamPage from './F1TeamPage';
import FootballPage from './FootballPage';
import './App.css';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (!nextPath || nextPath === path) {
      return;
    }
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  if (path === '/dashboard') {
    return <Dashboard currentPath={path} onNavigate={navigate} />;
  }

  if (path === '/f1') {
    return <F1Page currentPath={path} onNavigate={navigate} />;
  }

  if (path.startsWith('/f1/drivers/')) {
    const driverId = path.replace('/f1/drivers/', '');
    return <F1DriverPage currentPath={path} onNavigate={navigate} driverId={driverId} />;
  }

  if (path.startsWith('/f1/teams/')) {
    const teamId = path.replace('/f1/teams/', '');
    return <F1TeamPage currentPath={path} onNavigate={navigate} teamId={teamId} />;
  }

  if (path === '/football') {
    return <FootballPage currentPath={path} onNavigate={navigate} />;
  }

  return <LandingPage currentPath={path} onNavigate={navigate} />;
}

export default App;
