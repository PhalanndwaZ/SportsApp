import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  // Check URL to determine which page to show
  React.useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      setShowDashboard(true);
    }
  }, []);

  return showDashboard ? <Dashboard /> : <LandingPage />;
}

export default App;