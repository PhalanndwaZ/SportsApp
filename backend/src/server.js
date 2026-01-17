// Initializing the server 
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Routes 
const f1Routes = require('./routes/f1Routes');
const footballRoutes = require('./routes/footballRoutes');

app.use('/api/f1', f1Routes);
app.use('/api/football', footballRoutes);

// WebSocket connection 
io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// START SCHEDULED JOBS
const { startF1LiveUpdates, startFootballLiveUpdates, setIo } = require('./jobs/scheduledJobs');
setIo(io); // Pass io instance to scheduled jobs
startF1LiveUpdates();
startFootballLiveUpdates();
console.log(' Scheduled jobs initialized');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});