import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const socket = io('http://localhost:5000');

function Dashboard() {
  const [f1Data, setF1Data] = useState([]);
  const [footballData, setFootballData] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('f1-update', (data) => {
      console.log('F1 update received:', data);
      setF1Data(data);
    });

    socket.on('football-update', (data) => {
      console.log('Football update received:', data);
      setFootballData(data);
    });

    fetchInitialData();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('f1-update');
      socket.off('football-update');
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const f1Response = await axios.get('http://localhost:5000/api/f1/drivers');
      console.log('F1 drivers fetched:', f1Response.data);
      setF1Data(f1Response.data);

      const footballResponse = await axios.get('http://localhost:5000/api/football/upcoming');
      console.log('Football matches fetched:', footballResponse.data);
      setFootballData(footballResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-text">APEX</span>
            <span className="logo-subtitle">Sports</span>
          </a>

          <nav className="nav">
            <a href="#live" className="nav-link">Live</a>
            <a href="#scores" className="nav-link">Scores</a>
            <a href="#schedule" className="nav-link">Schedule</a>
          </nav>

          <div className="status-badge">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* F1 Section */}
        <section className="section">
          <div className="section-header">
            <span className="section-icon">🏎️</span>
            <h2 className="section-title">Formula 1</h2>
          </div>

          {f1Data && f1Data.length > 0 ? (
            <div className="card-grid">
              {f1Data.slice(0, 12).map((driver, index) => (
                <div key={index} className="card">
                  <div className="card-title">
                    {driver.driver_number && (
                      <span className="driver-number">#{driver.driver_number}</span>
                    )}
                    {driver.full_name || driver.name_acronym || 'Unknown Driver'}
                  </div>
                  <div className="card-content">
                    {driver.team_name && <div>Team: {driver.team_name}</div>}
                    {driver.country_code && <div>Country: {driver.country_code}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏁</div>
              <p>No F1 data available. Waiting for updates...</p>
            </div>
          )}
        </section>

        {/* Football Section */}
        <section className="section">
          <div className="section-header">
            <span className="section-icon">⚽</span>
            <h2 className="section-title">Football Matches</h2>
          </div>

          {footballData && footballData.length > 0 ? (
            <div className="card-grid">
              {footballData.slice(0, 12).map((match, index) => (
                <div key={index} className="card">
                  {match.status === 'LIVE' && (
                    <div className="live-badge">
                      <span className="live-dot"></span>
                      Live
                    </div>
                  )}
                  <div className="match-card">
                    <div>
                      <div className="team-name">{match.homeTeam?.name || 'Home Team'}</div>
                      <div className="team-name">{match.awayTeam?.name || 'Away Team'}</div>
                    </div>
                    {match.score && (
                      <div className="match-score">
                        {match.score.fullTime?.home || 0} - {match.score.fullTime?.away || 0}
                      </div>
                    )}
                  </div>
                  <div className="card-content" style={{ marginTop: '0.75rem' }}>
                    {match.competition?.name && <div>⚽ {match.competition.name}</div>}
                    {match.utcDate && <div>📅 {new Date(match.utcDate).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">⚽</div>
              <p>No matches available. Waiting for updates...</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;