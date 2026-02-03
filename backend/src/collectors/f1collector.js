const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class F1Collector {
  constructor() {
    this.baseURL = 'https://api.openf1.org/v1';
  }

  async requestWithRetry(path, params, retries = 2) {
    let attempt = 0;
    while (true) {
      try {
        const response = await axios.get(`${this.baseURL}${path}`, { params });
        return response;
      } catch (error) {
        const status = error?.response?.status;
        if (status === 429 && attempt < retries) {
          const backoffMs = 1000 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          attempt += 1;
          continue;
        }
        throw error;
      }
    }
  }

  async getCurrentSession() {
    try {
      const response = await this.requestWithRetry('/sessions', {
        year: new Date().getFullYear(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching F1 session:', error.message);
      throw error;
    }
  }

  async getLatestSession(yearOverride) {
    try {
      const year = Number.isFinite(yearOverride) ? yearOverride : new Date().getFullYear();
      const response = await this.requestWithRetry('/sessions', { year });
      
      const sessions = response.data.sort((a, b) => 
        new Date(b.date_start) - new Date(a.date_start)
      );
      
      return sessions[0];
    } catch (error) {
      console.error('Error fetching latest session:', error.message);
      throw error;
    }
  }

  async getLatestRaceSession(yearOverride) {
    try {
      const year = Number.isFinite(yearOverride) ? yearOverride : new Date().getFullYear();
      const response = await this.requestWithRetry('/sessions', {
        year,
        session_type: 'Race',
      });

      const sessions = response.data.sort(
        (a, b) => new Date(b.date_start) - new Date(a.date_start)
      );

      if (sessions.length === 0) {
        return this.getLatestSession(yearOverride);
      }

      return sessions[0];
    } catch (error) {
      console.error('Error fetching latest race session:', error.message);
      throw error;
    }
  }

  async getChampionshipDrivers(sessionKey) {
    try {
      const response = await this.requestWithRetry('/championship_drivers', {
        session_key: sessionKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching championship drivers:', error.message);
      throw error;
    }
  }

  async getChampionshipTeams(sessionKey) {
    try {
      const response = await this.requestWithRetry('/championship_teams', {
        session_key: sessionKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching championship teams:', error.message);
      throw error;
    }
  }

  async getSessionResults(sessionKey) {
    try {
      const response = await this.requestWithRetry('/session_result', {
        session_key: sessionKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching session results:', error.message);
      throw error;
    }
  }

  async getMeetings(yearOverride) {
    try {
      const year = Number.isFinite(yearOverride) ? yearOverride : new Date().getFullYear();
      const response = await this.requestWithRetry('/meetings', { year });
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error.message);
      throw error;
    }
  }

  async getDrivers(sessionKey) {
    try {
      const params = {};
      if (sessionKey) {
        params.session_key = sessionKey;
      }
      
      const response = await this.requestWithRetry('/drivers', params);

      // AUTO-SAVE: Save to database if we have a session key
      if (sessionKey && response.data.length > 0) {
        await this.saveDriversToDb(response.data, sessionKey);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error.message);
      throw error;
    }
  }

  async getLivePositions(sessionKey) {
    if (!sessionKey) {
      throw new Error('sessionKey is required');
    }
    
    try {
      const response = await this.requestWithRetry('/position', {
        session_key: sessionKey
      });
      
      // AUTO-SAVE: Save position data
      if (response.data.length > 0) {
        await this.savePositionsToDb(response.data, sessionKey);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      throw error;
    }
  }

  // Save session to database
  async saveSessionToDb(sessionData) {
    try {
      const session = await prisma.f1Session.upsert({
        where: { sessionKey: sessionData.session_key.toString() },
        update: {
          sessionName: sessionData.session_name,
          dateEnd: sessionData.date_end ? new Date(sessionData.date_end) : null,
        },
        create: {
          sessionKey: sessionData.session_key.toString(),
          sessionName: sessionData.session_name,
          dateStart: new Date(sessionData.date_start),
          dateEnd: sessionData.date_end ? new Date(sessionData.date_end) : null,
          circuitName: sessionData.circuit_short_name || 'Unknown',
          country: sessionData.country_name || 'Unknown',
          year: sessionData.year,
        },
      });
      
      console.log(`Saved F1 session: ${session.sessionName}`);
      return session;
    } catch (error) {
      console.error('Error saving F1 session:', error.message);
      return null;
    }
  }

  // Save drivers to database
  async saveDriversToDb(drivers, sessionKey) {
    try {
      // First ensure session exists
      let session = await prisma.f1Session.findUnique({
        where: { sessionKey: sessionKey.toString() }
      });

      if (!session) {
        // Create a basic session record
        session = await prisma.f1Session.create({
          data: {
            sessionKey: sessionKey.toString(),
            sessionName: 'Unknown',
            dateStart: new Date(),
            circuitName: 'Unknown',
            country: 'Unknown',
            year: new Date().getFullYear(),
          }
        });
      }

      // Save each driver
      let savedCount = 0;
      for (const driver of drivers) {
        try {
          const driverId = `${sessionKey}-${driver.driver_number}`;
          const fullName = driver.full_name || 'Unknown Driver';
          const teamName = driver.team_name || 'Unknown';
          const countryCode = driver.country_code || 'UNK';
          await prisma.f1Driver.upsert({
            where: {
              id: driverId
            },
            update: {
              fullName,
              nameAcronym: driver.name_acronym,
              teamName,
              countryCode,
            },
            create: {
              id: driverId,
              driverNumber: driver.driver_number,
              fullName,
              nameAcronym: driver.name_acronym,
              teamName,
              countryCode,
              session: {
                connect: { id: session.id }
              }
            }
          });
          savedCount++;
        } catch (err) {
          console.error(`Error saving driver ${driver.full_name}:`, err.message);
        }
      }

      console.log(`💾 Saved ${savedCount}/${drivers.length} F1 drivers to database`);
    } catch (error) {
      console.error('Error saving drivers to DB:', error.message);
    }
  }

  // Save position data (for lap times tracking)
  async savePositionsToDb(positions, sessionKey) {
    try {
      // Get session
      const session = await prisma.f1Session.findUnique({
        where: { sessionKey: sessionKey.toString() }
      });

      if (!session) {
        console.log('⚠️ Session not found, skipping position save');
        return;
      }

      // Note: Position tracking is real-time, so we only save periodically
      // This is a simplified version
      console.log(`Tracked ${positions.length} position updates`);
      
    } catch (error) {
      console.error('Error saving positions:', error.message);
    }
  }
}

module.exports = new F1Collector();
