import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopBar from './TopBar';
import F1Tabs from './F1Tabs';
import './Pages.css';

const heroStats = [
  { label: 'Race Weekend', value: 'Silverstone', note: 'Practice, Quali, Main Event' },
  { label: 'Fastest Lap', value: '1:29.411', note: 'Telemetry synced in real time' },
  { label: 'Pit Window', value: 'Lap 18-24', note: 'Soft to medium crossover' },
];

function F1Page({ currentPath, onNavigate }) {
  const [upcomingRounds, setUpcomingRounds] = useState([]);
  const [roundsError, setRoundsError] = useState('');
  const [driverStandings, setDriverStandings] = useState([]);
  const [driversError, setDriversError] = useState('');
  const [teamStandings, setTeamStandings] = useState([]);
  const [teamsError, setTeamsError] = useState('');
  const [latestResults, setLatestResults] = useState([]);
  const [resultsError, setResultsError] = useState('');
  const [activePanel, setActivePanel] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      const [driversResult, teamsResult, resultsResult, roundsResult] = await Promise.allSettled([
        axios.get('http://localhost:5000/api/f1/drivers'),
        axios.get('http://localhost:5000/api/f1/teams'),
        axios.get('http://localhost:5000/api/f1/positions/last'),
        axios.get('http://localhost:5000/api/f1/rounds'),
      ]);

      if (driversResult.status === 'fulfilled') {
        setDriverStandings(driversResult.value.data || []);
        setDriversError('');
      } else {
        setDriversError(driversResult.reason?.message || 'Unable to load driver standings');
      }

      if (teamsResult.status === 'fulfilled') {
        setTeamStandings(teamsResult.value.data || []);
        setTeamsError('');
      } else {
        setTeamsError(teamsResult.reason?.message || 'Unable to load team standings');
      }

      if (resultsResult.status === 'fulfilled') {
        setLatestResults(resultsResult.value.data || []);
        setResultsError('');
      } else {
        setResultsError(resultsResult.reason?.message || 'Unable to load latest results');
      }

      if (roundsResult.status === 'fulfilled') {
        setUpcomingRounds(roundsResult.value.data || []);
        setRoundsError('');
      } else {
        setRoundsError(roundsResult.reason?.message || 'Unable to load upcoming rounds');
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="page page--f1">
      <div className="f1-video-bg">
        <iframe
          title="F1 background video"
          src="https://www.youtube.com/embed/1b-qCz6glP8?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=1b-qCz6glP8"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
      <TopBar currentPath={currentPath} onNavigate={onNavigate} variant="solid" />

      <div className="page-content">
        <section className="page-section">
          <F1Tabs currentPath={currentPath} onNavigate={onNavigate} />
        </section>

        <section className="page-section page-section--tabs">
          <div className="subbar">
            <div className="subbar-inner">
              <nav className="topbar-nav topbar-nav--f1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'results', label: 'Results' },
                  { id: 'drivers', label: 'Drivers' },
                  { id: 'teams', label: 'Teams' },
                  { id: 'schedule', label: 'Schedule' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`topbar-link topbar-link--button ${activePanel === tab.id ? 'active' : ''}`}
                    onClick={() => setActivePanel(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </section>

        {activePanel === 'all' && (
        <section className="page-hero">
          <div>
            <div className="hero-kicker">Formula 1</div>
            <p className="hero-description">
              A focused space for live F1 insight. Follow standings, teams, and the calendar in one
              cockpit, with room for real-time media and race context.
            </p>
            <div className="hero-actions">
              <button className="hero-button primary" onClick={() => onNavigate('/dashboard')}>
                Live Dashboard
              </button>
              <button className="hero-button" onClick={() => onNavigate('/football')}>
                Switch to Football
              </button>
            </div>
          </div>
          <div className="hero-card-grid hero-card-grid--intro">
            {[
              { label: 'Standings', value: `${driverStandings.length || 0} drivers`, note: 'Season board' },
              { label: 'Teams', value: `${teamStandings.length || 0} teams`, note: 'Constructor grid' },
              { label: 'Schedule', value: `${upcomingRounds.length || 0} upcoming`, note: 'Next rounds' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-note">{stat.note}</div>
              </div>
            ))}
          </div>
        </section>
        )}

        {(activePanel === 'all' || activePanel === 'results') && (
        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Results</span>
            <div>
              <div className="section-tag">Latest race</div>
              <div className="section-title">Final Classification</div>
            </div>
          </div>
          {resultsError ? (
            <div className="highlight-panel">
              <p>{resultsError}</p>
            </div>
          ) : latestResults.length === 0 ? (
            <div className="highlight-panel">
              <p>No race results yet. Waiting for the season opener.</p>
            </div>
          ) : (
            <div className="data-grid">
              {latestResults.slice(0, 10).map((result) => (
                <div key={`${result.position}-${result.full_name}`} className="data-card">
                  <strong>
                    #{result.position} {result.full_name || 'Unknown Driver'}
                  </strong>
                  <span className="data-meta">{result.team_name || 'Team TBD'}</span>
                  <span>{result.points ? `${result.points} pts` : '0 pts'}</span>
                  {result.time && <span className="data-meta">{result.time}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {(activePanel === 'all' || activePanel === 'drivers') && (
        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Standings</span>
            <div>
              <div className="section-tag">Drivers</div>
              <div className="section-title">Current Pace</div>
            </div>
          </div>
          {driversError ? (
            <div className="highlight-panel">
              <p>{driversError}</p>
            </div>
          ) : driverStandings.length === 0 ? (
            <div className="highlight-panel">
              <p>No standings available yet.</p>
            </div>
          ) : (
            <div className="highlight-panel table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Driver</th>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {driverStandings.map((driver, index) => (
                    <tr
                      key={`${driver.full_name || 'driver'}-${driver.driver_number || index}`}
                      className={driver.driver_id ? 'table-row-link' : ''}
                      onClick={() => {
                        if (driver.driver_id) {
                          onNavigate(`/f1/drivers/${driver.driver_id}`);
                        }
                      }}
                    >
                      <td>{driver.position || '-'}</td>
                      <td>{driver.full_name || 'Unknown Driver'}</td>
                      <td>{driver.team_name || 'Team TBD'}</td>
                      <td>{driver.points ? `${driver.points}` : '0'}</td>
                      <td>{driver.country_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {(activePanel === 'all' || activePanel === 'teams') && (
        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Teams</span>
            <div>
              <div className="section-tag">Constructors</div>
              <div className="section-title">Team Standings</div>
            </div>
          </div>
          {teamsError ? (
            <div className="highlight-panel">
              <p>{teamsError}</p>
            </div>
          ) : (
            <div className="data-grid">
              {teamStandings.map((team, index) => (
                <div
                  key={`${team.team_name || 'team'}-${index}`}
                  className={`data-card ${team.constructor_id ? 'card-link' : ''}`}
                  onClick={() => {
                    if (team.constructor_id) {
                      onNavigate(`/f1/teams/${team.constructor_id}`);
                    }
                  }}
                >
                  <strong>{team.position ? `#${team.position} ` : ''}{team.team_name || 'Team TBD'}</strong>
                  <span>{team.points ? `${team.points} pts` : '0 pts'}</span>
                  {team.country_code && <span className="data-meta">{team.country_code}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {(activePanel === 'all' || activePanel === 'schedule') && (
        <section className="page-section">
          <div className="section-heading">
            <span className="badge">Calendar</span>
            <div>
              <div className="section-tag">Upcoming rounds</div>
              <div className="section-title">Race Schedule</div>
            </div>
          </div>
          {roundsError ? (
            <div className="highlight-panel">
              <p>{roundsError}</p>
            </div>
          ) : (
            <div className="data-grid">
              {upcomingRounds.map((round) => (
                <div key={round.meeting_key || round.round || round.meeting_name} className="data-card">
                  <strong>{round.meeting_name || round.name || 'Upcoming Round'}</strong>
                  <span className="data-meta">
                    {round.circuit_short_name || round.circuit_name || round.location || 'Circuit TBD'}
                  </span>
                  <span className="data-meta">
                    {round.date_start ? new Date(round.date_start).toLocaleDateString() : 'Date TBD'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

      </div>
    </div>
  );
}

export default F1Page;
