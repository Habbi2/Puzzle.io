const { createServer } = require('http');
const express = require('express');
const { Server } = require('socket.io');
const serverless = require('serverless-http');
const { GameState, PuzzlePiece, Player } = require('../dist/types');

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with updated settings for Netlify Functions
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins in serverless environment
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Prioritize polling for Netlify Functions
  path: "/socket.io", // Standard path for socket.io
  connectTimeout: 10000, // Longer timeout for initial connection
  pingTimeout: 20000, // Time in ms that the client will wait before it sends a new ping packet
  pingInterval: 25000 // How many ms before server considers connection closed
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
  // Add explicit CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
  
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // For socket.io polling requests
  if (event.httpMethod === 'GET' && event.queryStringParameters?.EIO) {
    // Let serverless-http handle socket.io polling
    const response = await handler(event, context);
    
    // Ensure CORS headers are set
    Object.keys(corsHeaders).forEach(header => {
      if (!response.headers) response.headers = {};
      response.headers[header] = corsHeaders[header];
    });
    
    // Ensure headers that socket.io clients expect
    if (!response.headers) response.headers = {};
    response.headers['Content-Type'] = 'text/plain; charset=UTF-8';
    response.headers['Connection'] = 'keep-alive';
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    
    return response;
  }
  
  // For socket.io POST requests (typically during long-polling)
  if (event.httpMethod === 'POST' && event.queryStringParameters?.EIO) {
    // Let serverless-http handle socket.io polling
    const response = await handler(event, context);
    
    // Ensure CORS headers are set
    Object.keys(corsHeaders).forEach(header => {
      if (!response.headers) response.headers = {};
      response.headers[header] = corsHeaders[header];
    });
    
    return response;
  }
  
  // For all other requests, use standard serverless handler
  return handler(event, context);
};

// Also export the raw HTTP server to allow direct access if needed
exports.rawServer = httpServer;