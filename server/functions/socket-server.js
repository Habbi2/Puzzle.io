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
  // Special handling for WebSocket connections
  if (event.headers && 
     (event.headers['Upgrade'] === 'websocket' || 
      event.headers['upgrade'] === 'websocket' || 
      event.headers['Sec-WebSocket-Key'])) {
    return {
      statusCode: 426,
      headers: {
        'Content-Type': 'text/plain',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Accept': 'HSmrc0sMlYUkAGmm5OPpG2HaGWk=',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: 'Upgrade Required'
    };
  }
  
  // For socket.io polling requests
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
  
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  // For all other requests, use standard serverless handler
  return handler(event, context);
};

// Also export the raw HTTP server to allow direct access if needed
exports.rawServer = httpServer;