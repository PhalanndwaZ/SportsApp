const express = require('express');
const router = express.Router();
const f1collector = require('../collectors/f1collector');

router.get('/session', async (req, res)=> {
    try {
        const session = await f1collector.getCurrentSession();
        res.json(session);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.get('/drivers', async (req, res)=> {
    try {
        const drivers = await f1collector.getLivePositions();
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message});
        
    }
    
});

module.exports = router;