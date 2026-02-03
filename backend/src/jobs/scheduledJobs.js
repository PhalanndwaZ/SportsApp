const cron = require('node-cron');
const f1collector = require('../collectors/f1collector');
const footballCollector = require('../collectors/footballCollector');

let io;
let lastF1NetworkError = 0;

// Poll F1 data every 30 seconds
const startF1LiveUpdates = () => {
    console.log('F1 live updates scheduler started');
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const session = await f1collector.getLatestSession();
            
            if (session && session.session_key && io) {
                // Save session to DB
                await f1collector.saveSessionToDb(session);
                
                // Get and save drivers
                const drivers = await f1collector.getDrivers(session.session_key);
                
                if (drivers && drivers.length > 0) {
                    io.emit('f1-update', drivers);
                    console.log(`📡 F1 data updated - ${drivers.length} drivers (saved to DB)`);
                }
            } else {
                console.log('No active F1 session');
            }
        } catch (error) {
            if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
                const now = Date.now();
                if (now - lastF1NetworkError > 60000) {
                    console.error('F1 update error: OpenF1 unreachable');
                    lastF1NetworkError = now;
                }
                return;
            }
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
                io.emit('football-update', liveMatches);
                console.log(`Football data updated - ${liveMatches.length} live matches (saved to DB)`);
            }
        } catch (error) {
            console.error('Football update error:', error.message);
        }
    });
}; 

const setIo = (ioInstance) => {
    io = ioInstance;
    console.log('Socket.io instance set for scheduled jobs');
};

module.exports = { startF1LiveUpdates, startFootballLiveUpdates, setIo };
