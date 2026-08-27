import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, seedInitialDisasterData } from '../database/index.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// CORS Configuration supporting Vercel and local origins
const clientOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : '*';

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ResQ-Command Real-Time Platform',
    architecture: 'Clean Modular Architecture (/backend, /frontend, /ai, /services, /database, /components, /utils)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api', apiRoutes);

// Setup Sockets
setupSocketHandlers(io);

// Start Server & Connect Database
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialDisasterData();

    server.listen(PORT, () => {
      console.log(`🚀 Clean Architecture Backend Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket Gateway ready on ws://localhost:${PORT}`);
      console.log(`🖼️ Static uploads available at http://localhost:${PORT}/uploads/`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
  }
};

startServer();
