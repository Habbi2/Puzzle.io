const { createServer } = require('http');
const express = require('express');
const { Server } = require('socket.io');
const serverless = require('serverless-http');
const { GameState, PuzzlePiece, Player } = require('../dist/types');

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins in serverless environment
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'], // Ensure both transports are available
  path: "/socket.io" // Standard path for socket.io
});

// We'll import our game logic here
const { setupSocketHandlers } = require('../dist/socketHandlers');

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Add health check endpoint
app.get('/.netlify/functions/socket-server', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle socket.io requests
app.use((req, res, next) => {
  if (req.url.startsWith('/socket.io')) {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': '2',
    });
    res.write('OK');
    res.end();
  } else {
    next();
  }
});

// Export the serverless function
exports.handler = serverless(app);

// Also export the raw HTTP server to allow direct access if needed
exports.rawServer = httpServer;