"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socketHandlers_1 = require("./socketHandlers");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.CLIENT_URL || '*'] // Use environment variable or allow any origin
        : '*',
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
}));
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
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
(0, socketHandlers_1.setupSocketHandlers)(io);
// Add a health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Root route
app.get('/', (req, res) => {
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
