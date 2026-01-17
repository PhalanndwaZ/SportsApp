const express = require('express');
const router = express.Router();
const f1Collector = require('../collectors/f1collector');

// Get current/latest session
router.get('/session', async (req, res) => {
  try {
    const session = await f1Collector.getLatestSession();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions for a year
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await f1Collector.getCurrentSession();
    res.json(sessions);
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
    const sessionKey = req.query.session_key;
    const drivers = await f1Collector.getDrivers(sessionKey);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;