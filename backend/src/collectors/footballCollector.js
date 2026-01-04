const axios = require('axios');

class FootballCollector{
    constructor(){
        this.baseURL = 'https://api.football-data.org/v4';
        this.apiKey = process.env.FOOTBALL_API_KEY;

    }
    async getLiveMatches(){
        try {
            const response = await axios.get(`${this.baseURL}/matches`, {
                headers: { 'X-Auth-Token': this.apiKey},
                params: {status: 'LIVE'}
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching live matches: ', error.message);
            throw error;
        }
    }
    async getCompetitionStandings(competitionId){
        try {
            const response = await axios.get(`${this.baseURL}/competitions/${competitionId}/standings`,{
                headers: {'X-Auth-Token': this.apiKey}
            });
            return response.data.standings;
        } catch (error) {
            console.error('Error fetching standings: ', error.message);
            throw error;
        }
    }

    async getUpcomingMatches(){
        try {
            const response = await axios.get(`${this.baseURL}/matches`,{
                headers:{'X-Auth-Token': this.apiKey},
                params: {status: 'SCHEDULED'}
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching upcoming matches: ', error.message);
            throw error;
        }
    }
}

module.exports = new FootballCollector();