const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FootballCollector {
  constructor() {
    this.baseURL = 'https://api.football-data.org/v4';
    this.apiKey = process.env.FOOTBALL_API_KEY;
  }

  async getLiveMatches() {
    try {
      const response = await axios.get(`${this.baseURL}/matches`, {
        headers: { 'X-Auth-Token': this.apiKey },
        params: { status: 'LIVE' }
      });
      
      const matches = response.data.matches;
      
      // AUTO-SAVE: Save live matches to database
      if (matches.length > 0) {
        await this.saveMatchesToDb(matches);
      }
      
      return matches;
    } catch (error) {
      console.error('Error fetching live matches:', error.message);
      throw error;
    }
  }

  async getUpcomingMatches() {
    try {
      const response = await axios.get(`${this.baseURL}/matches`, {
        headers: { 'X-Auth-Token': this.apiKey },
        params: { status: 'SCHEDULED' }
      });
      
      const matches = response.data.matches;
      
      // AUTO-SAVE: Save upcoming matches to database
      if (matches.length > 0) {
        await this.saveMatchesToDb(matches);
      }
      
      return matches;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error.message);
      throw error;
    }
  }

  async getCompetitionStandings(competitionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/competitions/${competitionId}/standings`,
        { headers: { 'X-Auth-Token': this.apiKey } }
      );
      
      // AUTO-SAVE: Save standings to database
      if (response.data.standings && response.data.standings.length > 0) {
        await this.saveStandingsToDb(response.data.standings, competitionId);
      }
      
      return response.data.standings;
    } catch (error) {
      console.error('Error fetching standings:', error.message);
      throw error;
    }
  }

  // Save matches to database
  async saveMatchesToDb(matches) {
    try {
      let savedCount = 0;
      
      for (const match of matches) {
        try {
          await prisma.footballMatch.upsert({
            where: { matchId: match.id },
            update: {
              homeScore: match.score?.fullTime?.home,
              awayScore: match.score?.fullTime?.away,
              status: match.status,
              updatedAt: new Date(),
            },
            create: {
              matchId: match.id,
              homeTeam: match.homeTeam.name,
              homeTeamId: match.homeTeam.id,
              awayTeam: match.awayTeam.name,
              awayTeamId: match.awayTeam.id,
              homeScore: match.score?.fullTime?.home,
              awayScore: match.score?.fullTime?.away,
              competition: match.competition.name,
              competitionId: match.competition.id,
              matchDate: new Date(match.utcDate),
              status: match.status,
              venue: match.venue || 'Unknown',
            },
          });
          savedCount++;
        } catch (err) {
          console.error(`Error saving match ${match.id}:`, err.message);
        }
      }
      
      console.log(`💾 Saved ${savedCount}/${matches.length} football matches to database`);
    } catch (error) {
      console.error('Error saving matches to DB:', error.message);
    }
  }

  // Save standings to database
  async saveStandingsToDb(standings, competitionId) {
    try {
      let savedCount = 0;
      
      for (const standing of standings) {
        if (standing.type === 'TOTAL' && standing.table) {
          for (const team of standing.table) {
            try {
              await prisma.footballTeam.upsert({
                where: { teamId: team.team.id },
                update: {
                  position: team.position,
                  played: team.playedGames,
                  won: team.won,
                  drawn: team.draw,
                  lost: team.lost,
                  points: team.points,
                  goalsFor: team.goalsFor,
                  goalsAgainst: team.goalsAgainst,
                  goalDiff: team.goalDifference,
                  updatedAt: new Date(),
                },
                create: {
                  teamId: team.team.id,
                  teamName: team.team.name,
                  shortName: team.team.shortName,
                  tla: team.team.tla,
                  competition: standing.group || 'Main',
                  competitionId: competitionId,
                  position: team.position,
                  played: team.playedGames,
                  won: team.won,
                  drawn: team.draw,
                  lost: team.lost,
                  points: team.points,
                  goalsFor: team.goalsFor,
                  goalsAgainst: team.goalsAgainst,
                  goalDiff: team.goalDifference,
                },
              });
              savedCount++;
            } catch (err) {
              console.error(`Error saving team ${team.team.name}:`, err.message);
            }
          }
        }
      }
      
      console.log(`Saved ${savedCount} team standings to database`);
    } catch (error) {
      console.error('Error saving standings to DB:', error.message);
    }
  }
}

module.exports = new FootballCollector();