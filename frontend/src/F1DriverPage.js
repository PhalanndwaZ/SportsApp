import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopBar from './TopBar';
import F1Tabs from './F1Tabs';
import './Pages.css';

function F1DriverPage({ currentPath, onNavigate, driverId }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [season, setSeason] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDriver = async () => {
      const [detailResult, seasonResult] = await Promise.allSettled([
        axios.get(`http://localhost:5000/api/f1/drivers/${driverId}`),
        axios.get('http://localhost:5000/api/f1/drivers'),
      ]);

      if (detailResult.status === 'fulfilled') {
        setProfile(detailResult.value.data?.profile || null);
        setStats(detailResult.value.data?.stats || null);
      } else {
        setError(detailResult.reason?.message || 'Unable to load driver details');
      }

      if (seasonResult.status === 'fulfilled') {
        const seasonList = seasonResult.value.data || [];
        setSeason(seasonList.find((driver) => driver.driver_id === driverId) || null);
      }
    };

    loadDriver();
  }, [driverId]);

  return (
    <div className="page page--f1">
      <TopBar currentPath={currentPath} onNavigate={onNavigate} variant="solid" />

      <div className="page-content">
        <section className="page-section">
          <F1Tabs currentPath={currentPath} onNavigate={onNavigate} />
        </section>

        <section className="page-hero">
          <div>
            <div className="hero-kicker">Driver</div>
            <h1 className="hero-title">{profile ? `${profile.givenName} ${profile.familyName}` : 'Driver'}</h1>
            <p className="hero-description">
              Deep dive into season momentum and career achievements.
            </p>
            <div className="hero-actions">
              <button className="hero-button primary" onClick={() => onNavigate('/f1')}>
                Back to F1
              </button>
              <button className="hero-button" onClick={() => onNavigate('/dashboard')}>
                Live Dashboard
              </button>
            </div>
          </div>
          <div className="hero-card-grid">
            <div className="stat-card">
              <div className="stat-label">Nationality</div>
              <div className="stat-value">{profile?.nationality || 'TBD'}</div>
              <div className="stat-note">Driver profile</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Number</div>
              <div className="stat-value">{profile?.permanentNumber || '—'}</div>
              <div className="stat-note">Permanent number</div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="page-section">
            <div className="highlight-panel">
              <p>{error}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="page-section">
              <div className="section-heading">
                <span className="badge">Overview</span>
                <div>
                  <div className="section-tag">About</div>
                  <div className="section-title">Driver Profile</div>
                </div>
              </div>
              <div className="split-grid">
                <div className="highlight-panel">
                  <h4>About</h4>
                  <p>{profile?.dateOfBirth ? `Born: ${profile.dateOfBirth}` : 'Birth date unavailable'}</p>
                  <p>{profile?.code ? `Code: ${profile.code}` : 'Code unavailable'}</p>
                  <p>{profile?.driverId ? `ID: ${profile.driverId}` : 'ID unavailable'}</p>
                </div>
                <div className="highlight-panel">
                  <h4>Current Season</h4>
                  <p>{season?.team_name || 'Team TBD'}</p>
                  <p>{season?.position ? `Position: ${season.position}` : 'Position: —'}</p>
                  <p>{season?.points ? `Points: ${season.points}` : 'Points: 0'}</p>
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="section-heading">
                <span className="badge">Stats</span>
                <div>
                  <div className="section-tag">Season vs Career</div>
                  <div className="section-title">Performance Snapshot</div>
                </div>
              </div>
              <div className="split-grid">
                <div className="highlight-panel">
                  <h4>Season Stats</h4>
                  <p>{season?.wins ? `Wins: ${season.wins}` : 'Wins: 0'}</p>
                  <p>{season?.points ? `Points: ${season.points}` : 'Points: 0'}</p>
                  <p>{season?.position ? `Championship Position: ${season.position}` : 'Championship Position: —'}</p>
                </div>
                <div className="highlight-panel">
                  <h4>Career Stats</h4>
                  <p>{stats ? `Wins: ${stats.wins}` : 'Wins: —'}</p>
                  <p>{stats ? `Podiums: ${stats.podiums}` : 'Podiums: —'}</p>
                  <p>{stats?.championships === null ? 'Championships: N/A' : `Championships: ${stats?.championships}`}</p>
                  {stats?.championships_note && (
                    <p className="data-meta">{stats.championships_note}</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default F1DriverPage;
