import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socketHandlers';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL || '*'] // Use environment variable or allow any origin
    : '*',
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.CLIENT_URL || '*'] // Use environment variable or allow any origin  
      : '*',
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  },
  // Ensure long-running connections work well
  pingTimeout: 30000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Setup socket handlers
setupSocketHandlers(io);

// Add a health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Puzzle Game Socket.IO server is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Export for serverless use if needed
export { app, server };