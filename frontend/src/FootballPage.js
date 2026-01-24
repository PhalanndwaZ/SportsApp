import React from 'react';
import TopBar from './TopBar';
import './Pages.css';

const heroStats = [
  { label: 'Matchday', value: 'Saturday', note: '6 leagues in session' },
  { label: 'Live Matches', value: '14', note: 'Minute-by-minute updates' },
  { label: 'Featured Rivalry', value: 'North Derby', note: 'Kickoff 18:30' },
];

const spotlightMatches = [
  { title: 'Arsenal vs. Tottenham', meta: 'Premier League', detail: 'Kickoff 18:30 • Emirates' },
  { title: 'Barcelona vs. Sevilla', meta: 'La Liga', detail: 'Kickoff 21:00 • Camp Nou' },
  { title: 'Milan vs. Juventus', meta: 'Serie A', detail: 'Kickoff 19:45 • San Siro' },
];

const tableLeaders = [
  { club: 'Manchester City', points: 58, form: 'W W D W W' },
  { club: 'Liverpool', points: 56, form: 'W W W D W' },
  { club: 'Arsenal', points: 54, form: 'W L W W W' },
  { club: 'Aston Villa', points: 48, form: 'D W W L W' },
];

const tacticsBoard = [
  { title: 'High Press Index', meta: 'Top 5 leagues', detail: 'Press intensity up 12% this month.' },
  { title: 'Set Piece Edge', meta: 'Expected Goals', detail: '0.28 xG per match from corners.' },
  { title: 'Counter Speed', meta: 'Transition time', detail: 'Average 7.4s from regain to shot.' },
];

function FootballPage({ currentPath, onNavigate }) {
  return (
    <div className="page page--football">
      <TopBar currentPath={currentPath} onNavigate={onNavigate} variant="solid" />

      <div className="page-content">
        <section className="page-hero">
          <div>
            <div className="hero-kicker">Football</div>
            <h1 className="hero-title">Matchday Studio</h1>
            <p className="hero-description">
              Control the tempo across leagues with live scorelines, tactical cues, and schedule
              alerts. Everything you need to follow every fixture.
            </p>
            <div className="hero-actions">
              <button className="hero-button football" onClick={() => onNavigate('/dashboard')}>
                Live Dashboard
              </button>
              <button className="hero-button" onClick={() => onNavigate('/f1')}>
                Switch to F1
              </button>
            </div>
          </div>
          <div className="hero-card-grid">
            {heroStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-note">{stat.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Spotlight</span>
            <div>
              <div className="section-tag">Top fixtures</div>
              <div className="section-title">Tonight's Showcase</div>
            </div>
          </div>
          <div className="data-grid">
            {spotlightMatches.map((match) => (
              <div key={match.title} className="data-card">
                <strong>{match.title}</strong>
                <span className="data-meta">{match.meta}</span>
                <span>{match.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Table Watch</span>
            <div>
              <div className="section-tag">Premier League</div>
              <div className="section-title">Leaders</div>
            </div>
          </div>
          <div className="highlight-panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Points</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                {tableLeaders.map((row) => (
                  <tr key={row.club}>
                    <td>{row.club}</td>
                    <td>{row.points}</td>
                    <td>{row.form}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Tactical</span>
            <div>
              <div className="section-tag">Analytics</div>
              <div className="section-title">Tactics Board</div>
            </div>
          </div>
          <div className="data-grid">
            {tacticsBoard.map((item) => (
              <div key={item.title} className="data-card">
                <strong>{item.title}</strong>
                <span className="data-meta">{item.meta}</span>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default FootballPage;
