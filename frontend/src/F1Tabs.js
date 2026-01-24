import React from 'react';
import './Pages.css';

function F1Tabs({ currentPath, onNavigate }) {
  const handleNavigate = (path) => () => onNavigate(path);

  const isF1 = currentPath.startsWith('/f1');
  const isFootball = currentPath === '/football';

  return (
    <div className="f1-tabs">
      <button
        type="button"
        className={`f1-tab ${isF1 ? 'active' : ''}`}
        onClick={handleNavigate('/f1')}
      >
        F1
      </button>
      <button
        type="button"
        className={`f1-tab ${isFootball ? 'active' : ''}`}
        onClick={handleNavigate('/football')}
      >
        Football
      </button>
    </div>
  );
}

export default F1Tabs;
