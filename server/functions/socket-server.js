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
    origin: process.env.CLIENT_URL || "https://react-multiplayer-puzzle-game.netlify.app",
    methods: ["GET", "POST"]
  },
  path: "/.netlify/functions/socket-server"
});

// We'll import our game logic here
const { setupSocketHandlers } = require('../dist/socketHandlers');

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Export the serverless function
exports.handler = serverless(app);

// Also export the raw HTTP server to allow direct access if needed
exports.rawServer = httpServer;