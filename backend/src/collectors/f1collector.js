const axios = require('axios');

class F1Collector {
  constructor() {
    this.baseURL = 'https://api.openf1.org/v1';
  }

  async getCurrentSession() {
    try {
      const response = await axios.get(`${this.baseURL}/sessions`, {
        params: {
          year: new Date().getFullYear(),
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching F1 session:', error.message);
      throw error;
    }
  }

  async getLivePositions(sessionKey) {
    // Add validation
    if (!sessionKey) {
      throw new Error('sessionKey is required');
    }
    
    try {
      const response = await axios.get(`${this.baseURL}/position`, {
        params: {
          session_key: sessionKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      throw error;
    }
  }

  async getDrivers(sessionKey) {
    try {
      const params = {};
      if (sessionKey) {
        params.session_key = sessionKey;
      }
      
      const response = await axios.get(`${this.baseURL}/drivers`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error.message);
      throw error;
    }
  }

  // Get latest session (most recent)
  async getLatestSession() {
    try {
      const response = await axios.get(`${this.baseURL}/sessions`, {
        params: {
          year: new Date().getFullYear()
        }
      });
      
      // Sort by date to get the most recent
      const sessions = response.data.sort((a, b) => 
        new Date(b.date_start) - new Date(a.date_start)
      );
      
      return sessions[0]; // Return most recent session
    } catch (error) {
      console.error('Error fetching latest session:', error.message);
      throw error;
    }
  }
}

module.exports = new F1Collector();