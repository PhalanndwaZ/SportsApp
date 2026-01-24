const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 20000;

const RETRYABLE_CODES = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (url, options = {}, retries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await axios.get(url, {
                timeout: DEFAULT_TIMEOUT_MS,
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

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

class FootballCollector{
    constructor(){
        this.baseURL = process.env.FOOTBALL_BASE_URL || 'https://api.football-data.org/v4';
        this.apiKey = process.env.FOOTBALL_API_KEY;

    }
    async getLiveMatches(){
        try {
            if (!this.apiKey) {
                throw new Error('FOOTBALL_API_KEY is not set');
            }
            const response = await requestWithRetry(`${this.baseURL}/matches`, {
                headers: { 'X-Auth-Token': this.apiKey},
                params: {status: 'LIVE'},
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching live matches: ', error.message);
            throw error;
        }
    }
    async getCompetitionStandings(competitionId){
        try {
            if (!this.apiKey) {
                throw new Error('FOOTBALL_API_KEY is not set');
            }
            const response = await requestWithRetry(`${this.baseURL}/competitions/${competitionId}/standings`,{
                headers: {'X-Auth-Token': this.apiKey}
            });
            return response.data.standings;
        } catch (error) {
            console.error('Error fetching standings: ', error.message);
            throw error;
        }
    }

    async getUpcomingMatches(dateFrom, dateTo){
        try {
            if (!this.apiKey) {
                throw new Error('FOOTBALL_API_KEY is not set');
            }
            const params = {};
            if (dateFrom) {
                params.dateFrom = dateFrom;
            }
            if (dateTo) {
                params.dateTo = dateTo;
            }
            const response = await requestWithRetry(`${this.baseURL}/matches`,{
                headers:{'X-Auth-Token': this.apiKey},
                params
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching upcoming matches: ', error.message);
            throw error;
        }
    }

    async getTodayMatches(){
        const today = formatDate(new Date());
        return this.getUpcomingMatches(today, today);
    }
}

module.exports = new FootballCollector();
