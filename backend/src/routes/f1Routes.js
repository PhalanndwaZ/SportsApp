const express = require('express');
const router = express.Router();
const f1Collector = require('../collectors/f1collector');

// Get current/latest session
router.get('/session', async (req, res) => {
  try {
    const active = await f1Collector.getActiveSession();
    if (active) {
      res.json(active);
      return;
    }

    const upcoming = await f1Collector.getUpcomingSessions(1);
    res.json(upcoming[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions for a year
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await f1Collector.getSeasonSchedule();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming race rounds (meetings)
router.get('/rounds', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10);
    const rounds = await f1Collector.getUpcomingMeetings(Number.isNaN(limit) ? null : limit);
    res.json(rounds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get positions for a specific session
router.get('/positions/:sessionKey', async (req, res) => {
  try {
    const positions = await f1Collector.getLivePositions(req.params.sessionKey);
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drivers (optionally for a specific session)
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await f1Collector.getDrivers();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/drivers/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const [profile, stats] = await Promise.all([
      f1Collector.getDriverProfile(driverId),
      f1Collector.getDriverStats(driverId),
    ]);
    if (!profile) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    res.json({ profile, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get constructor standings (teams)
router.get('/teams', async (req, res) => {
  try {
    const teams = await f1Collector.getConstructors();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teams/:constructorId', async (req, res) => {
  try {
    const constructorId = req.params.constructorId;
    const [profile, stats] = await Promise.all([
      f1Collector.getConstructorProfile(constructorId),
      f1Collector.getConstructorStats(constructorId),
    ]);
    if (!profile) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json({ profile, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
