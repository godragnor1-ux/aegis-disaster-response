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

// CORS Configuration supporting Vercel production, preview deployments, and local development
const rawAllowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : [];

const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server)
  if (!origin) return callback(null, true);

  // If no explicit list or wildcard is set, allow all
  if (rawAllowedOrigins.length === 0 || rawAllowedOrigins.includes('*')) {
    return callback(null, true);
  }

  // Check explicit match or any *.vercel.app domain
  const isAllowed =
    rawAllowedOrigins.includes(origin) ||
    /\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin);

  if (isAllowed) {
    return callback(null, true);
  }

  // Permissive fallback in disaster coordination
  return callback(null, true);
};

// Socket.IO Setup tuned for Render Web Services & Vercel
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  },
  transports: ['polling', 'websocket'], // Polling first for reliable handshake on cloud edge, auto-upgrades to WSS
  pingTimeout: 60000,                  // Prevents Render 60s idle disconnects
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,              // 100MB buffer for voice and photo bursts
});

// Middleware
app.use(
  cors({
    origin: corsOriginHandler,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoints (supports both /health and /api/health for Render)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'ResQ-Command Real-Time Disaster Response Backend',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.MONGO_URI || process.env.MONGODB_URI ? 'MongoDB Atlas (Connected)' : 'Embedded Memory DB',
    timestamp: new Date().toISOString()
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/', (req, res) => {
  res.status(200).json({
    message: '⚡ AEGIS-PULSE (ResQ-Command) Backend API is running.',
    health: '/health',
    apiDocs: '/api'
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
