//initializing the server 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET","POST"]
    }
});

// routes 
const f1Routes = require('/routes/f1Routes');
const footballRoutes = require('./routes/footballRoutes');
const Module = require('module');
app.use('/api/f1', f1Routes);
app.use('/api/football', footballRoutes);

// websocket connection 
io.on('connection', (socket)=> {
    console.log('New client connected');

    socket.on('disconnect', ()=> {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=> {
    console.log(`server running on port ${PORT}`);
});

module.exports = {io};