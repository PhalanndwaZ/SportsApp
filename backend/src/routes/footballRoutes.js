const express = require('express');
const router = express.Router();
const footballCollector = require('../collectors/footballCollector');

// get live matches 
router.get('/live', async (req, res)=>{
    try {
        const matches = await footballCollector.getLiveMatches();
        res.json(matches);
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// get upcoming matches
router.get('/upcoming', async (req, res)=>{
    try {
        const matches = await footballCollector.getTodayMatches();
        res.json(matches);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// get matches for today
router.get('/today', async (req, res) => {
    try {
        const matches = await footballCollector.getTodayMatches();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get comp standings 
router.get('/standings/:competitionId',async (req, res)=>{
    try {
        const standings = await footballCollector.getCompetitionStandings(req.params.competitionId);
        res.json(standings);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

module.exports = router;
