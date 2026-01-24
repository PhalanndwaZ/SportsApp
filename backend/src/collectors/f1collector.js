const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 10000;
const RETRYABLE_CODES = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (url, options = {}, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.get(url, {
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          'User-Agent': 'SportsApp/1.0',
          'Accept': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });
      return response;
    } catch (error) {
      lastError = error;
      const code = error.code || '';
      const shouldRetry = RETRYABLE_CODES.has(code);
      if (!shouldRetry || attempt === retries) {
        throw error;
      }
      await delay(500 * (attempt + 1));
    }
  }
  throw lastError;
};

class F1Collector {
  constructor() {
    this.baseURL = process.env.OPENF1_BASE_URL || 'https://api.jolpi.ca/ergast/f1';
  }

  async getSessionsForYear(year) {
    try {
      const response = await requestWithRetry(`${this.baseURL}/${year}.json`);
      return response.data;
    } catch (error) {
      console.error('Error fetching F1 session:', error.message);
      throw error;
    }
  }

  async getCurrentSession() {
    const year = new Date().getFullYear();
    return this.getSessionsForYear(year);
  }

  async getSeasonSchedule(year = new Date().getFullYear()) {
    const response = await requestWithRetry(`${this.baseURL}/${year}.json`);
    const races = response.data?.MRData?.RaceTable?.Races || [];
    return races.map((race) => this.mapRaceToSession(race)).filter(Boolean);
  }

  async hasSeasonStarted() {
    const races = await this.getSeasonSchedule();
    const datedRaces = races
      .filter((race) => race && race.date_start)
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    if (datedRaces.length === 0) {
      return true;
    }
    return new Date() >= new Date(datedRaces[0].date_start);
  }

  async getLivePositions(sessionKey) {
    const round = sessionKey;
    try {
      const path = round
        ? `${this.baseURL}/current/${round}/results.json`
        : `${this.baseURL}/current/last/results.json`;
      const response = await requestWithRetry(path);
      const race = response.data?.MRData?.RaceTable?.Races?.[0];
      if (!race || !race.Results) {
        return [];
      }
      return race.Results.map((result) => ({
        position: result.position,
        number: result.number,
        points: result.points,
        full_name: `${result.Driver?.givenName || ''} ${result.Driver?.familyName || ''}`.trim(),
        team_name: result.Constructor?.name || '',
        status: result.status,
        time: result.Time?.time || null,
        race_name: race.raceName,
        round: race.round,
      }));
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      throw error;
    }
  }

  async getDrivers() {
    try {
      const seasonStarted = await this.hasSeasonStarted();
      if (!seasonStarted) {
        const drivers = await this.getDriverList();
        return drivers.map((driver) => ({
          driver_id: driver?.driverId || '',
          driver_number: driver?.permanentNumber || null,
          full_name: `${driver?.givenName || ''} ${driver?.familyName || ''}`.trim(),
          team_name: '',
          country_code: driver?.nationality || '',
          wins: '0',
          points: '0',
          position: null,
        }));
      }

      const response = await requestWithRetry(`${this.baseURL}/current/driverStandings.json`);
      const standings = response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
      if (standings.length === 0) {
        const drivers = await this.getDriverList();
        return drivers.map((driver) => ({
          driver_id: driver?.driverId || '',
          driver_number: driver?.permanentNumber || null,
          full_name: `${driver?.givenName || ''} ${driver?.familyName || ''}`.trim(),
          team_name: '',
          country_code: driver?.nationality || '',
          wins: '0',
          points: '0',
          position: null,
        }));
      }
        return standings.map((entry) => ({
          driver_id: entry.Driver?.driverId || '',
          driver_number: entry.Driver?.permanentNumber || null,
          full_name: `${entry.Driver?.givenName || ''} ${entry.Driver?.familyName || ''}`.trim(),
          team_name: entry.Constructors?.[0]?.name || '',
          country_code: entry.Driver?.nationality || '',
          wins: entry.wins || '0',
          points: entry.points,
          position: entry.position,
        }));
    } catch (error) {
      console.error('Error fetching drivers:', error.message);
      throw error;
    }
  }

  async getDriverList() {
    const response = await requestWithRetry(`${this.baseURL}/current/drivers.json`);
    return response.data?.MRData?.DriverTable?.Drivers || [];
  }

  async getConstructors() {
    try {
      const seasonStarted = await this.hasSeasonStarted();
      if (!seasonStarted) {
        const constructors = await this.getConstructorList();
        return constructors.map((constructor) => ({
          constructor_id: constructor?.constructorId || '',
          team_name: constructor?.name || '',
          country_code: constructor?.nationality || '',
          points: '0',
          position: null,
        }));
      }

      const response = await requestWithRetry(`${this.baseURL}/current/constructorStandings.json`);
      const standings = response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
      if (standings.length === 0) {
        const constructors = await this.getConstructorList();
        return constructors.map((constructor) => ({
          constructor_id: constructor?.constructorId || '',
          team_name: constructor?.name || '',
          country_code: constructor?.nationality || '',
          points: '0',
          position: null,
        }));
      }
      return standings.map((entry) => ({
        constructor_id: entry.Constructor?.constructorId || '',
        team_name: entry.Constructor?.name || '',
        country_code: entry.Constructor?.nationality || '',
        points: entry.points,
        position: entry.position,
      }));
    } catch (error) {
      console.error('Error fetching constructors:', error.message);
      throw error;
    }
  }

  async getConstructorList() {
    const response = await requestWithRetry(`${this.baseURL}/current/constructors.json`);
    return response.data?.MRData?.ConstructorTable?.Constructors || [];
  }

  async getDriverProfile(driverId) {
    const response = await requestWithRetry(`${this.baseURL}/drivers/${driverId}.json`);
    return response.data?.MRData?.DriverTable?.Drivers?.[0] || null;
  }

  async getConstructorProfile(constructorId) {
    const response = await requestWithRetry(`${this.baseURL}/constructors/${constructorId}.json`);
    return response.data?.MRData?.ConstructorTable?.Constructors?.[0] || null;
  }

  async getResultsTotal(path) {
    const response = await requestWithRetry(`${this.baseURL}/${path}`);
    const total = Number.parseInt(response.data?.MRData?.total, 10);
    return Number.isNaN(total) ? 0 : total;
  }

  async getDriverStats(driverId) {
    const wins = await this.getResultsTotal(`drivers/${driverId}/results/1.json`);
    const second = await this.getResultsTotal(`drivers/${driverId}/results/2.json`);
    const third = await this.getResultsTotal(`drivers/${driverId}/results/3.json`);
    return {
      wins,
      podiums: wins + second + third,
      championships: null,
      championships_note: 'Championship totals require season-by-season standings and are not available from this API.',
    };
  }

  async getConstructorStats(constructorId) {
    const wins = await this.getResultsTotal(`constructors/${constructorId}/results/1.json`);
    const second = await this.getResultsTotal(`constructors/${constructorId}/results/2.json`);
    const third = await this.getResultsTotal(`constructors/${constructorId}/results/3.json`);
    return {
      wins,
      podiums: wins + second + third,
      championships: null,
      championships_note: 'Championship totals require season-by-season standings and are not available from this API.',
    };
  }

  async getActiveSession() {
    return null;
  }

  async getUpcomingSessions(limit = 6) {
    const races = await this.getSeasonSchedule();
    const now = new Date();
    const upcoming = races
      .filter((session) => session && session.date_start && new Date(session.date_start) > now)
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    if (!limit || Number.isNaN(limit) || limit <= 0) {
      return upcoming;
    }
    return upcoming.slice(0, limit);
  }

  async getUpcomingMeetings(limit = 6) {
    return this.getUpcomingSessions(limit);
  }

  // Get latest session (most recent)
  async getLatestSession() {
    try {
      const response = await requestWithRetry(`${this.baseURL}/current/last/results.json`);
      const race = response.data?.MRData?.RaceTable?.Races?.[0];
      if (!race) {
        return null;
      }
      return this.mapRaceToSession(race);
    } catch (error) {
      console.error('Error fetching latest session:', error.message);
      throw error;
    }
  }

  mapRaceToSession(race) {
    if (!race) {
      return null;
    }
    const dateStart = race.date && race.time ? `${race.date}T${race.time}` : race.date || null;
    let isoDate = null;
    if (dateStart) {
      const parsed = new Date(dateStart);
      isoDate = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return {
      session_key: race.round,
      meeting_name: race.raceName,
      circuit_name: race.Circuit?.circuitName || '',
      circuit_short_name: race.Circuit?.Location?.locality || '',
      location: race.Circuit?.Location?.country || '',
      date_start: isoDate,
      round: race.round,
      race_name: race.raceName,
    };
  }
}

module.exports = new F1Collector();
