const cron = require('node-cron');
const f1collector = require('../collectors/f1collector');
const footballCollector = require('../collectors/footballCollector');

let io;

// Poll F1 data every 30 seconds
const startF1LiveUpdates = () => {
    console.log(' F1 live updates scheduler started');
    cron.schedule('*/30 * * * * *', async () => {
        try {
            if (io) {
                const positions = await f1collector.getLivePositions();
                if (positions && positions.length > 0) {
                    io.emit('f1-update', positions);
                    console.log(`📡 F1 data updated - ${positions.length} results`);
                } else {
                    console.log('No recent F1 results available');
                }
            }
        } catch (error) {
            console.error('F1 update error:', error.message);
        }
    });
};

// Poll football data every minute
const startFootballLiveUpdates = () => {
    console.log('Football live updates scheduler started');
    cron.schedule('*/60 * * * * *', async () => {
        try {
            const liveMatches = await footballCollector.getLiveMatches();
            
            if (io) {
                if (liveMatches && liveMatches.length > 0) {
                    io.emit('football-update', liveMatches);
                    console.log(` Football data updated - ${liveMatches.length} live matches`);
                } else {
                    const todayMatches = await footballCollector.getTodayMatches();
                    io.emit('football-update', todayMatches);
                    console.log(` Football data updated - ${todayMatches.length} matches today`);
                }
            }
        } catch (error) {
            console.error(' Football update error:', error.message);
        }
    });
}; 

const setIo = (ioInstance) => {
    io = ioInstance;
    console.log('Socket.io instance set for scheduled jobs');
};

module.exports = { startF1LiveUpdates, startFootballLiveUpdates, setIo };
