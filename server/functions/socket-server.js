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

// Better handling for socket.io requests
const handler = serverless(app);

exports.handler = async (event, context) => {
  // For websocket support with Netlify functions
  if (event.httpMethod === 'GET' && event.queryStringParameters?.EIO) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: 'OK'
    };
  }
  
  // For all other requests, use standard serverless handler
  return handler(event, context);
};

// Also export the raw HTTP server to allow direct access if needed
exports.rawServer = httpServer;