const express = require('express');
const router = express.Router();
const footballCollector = require('../collectors/footballCollector');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// API endpoints (live data)
router.get('/live', async (req, res) => {
  try {
    const matches = await footballCollector.getLiveMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const matches = await footballCollector.getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/standings/:competitionId', async (req, res) => {
  try {
    const standings = await footballCollector.getCompetitionStandings(req.params.competitionId);
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DATABASE endpoints (saved data)
router.get('/db/matches', async (req, res) => {
  try {
    const matches = await prisma.footballMatch.findMany({
      orderBy: {
        matchDate: 'desc'
      },
      take: 50
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/db/teams', async (req, res) => {
  try {
    const teams = await prisma.footballTeam.findMany({
      orderBy: {
        points: 'desc'
      },
      take: 20
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;