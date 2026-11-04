import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';

import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import reviewRoutes from './routes/reviews.js';
import bookmarkRoutes from './routes/bookmarks.js';
import requestRoutes from './routes/requests.js';
import statsRoutes from './routes/stats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health probes)
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Allow Render domains, Vercel domains, localhost, or FRONTEND_URL
    if (
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded study material files statically (for local disk storage fallback)
app.use('/uploads', express.static(uploadsDir));

// Root Endpoint - Display welcome & status when opened directly in a browser
app.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    message: 'StudyShare REST API is running successfully',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      connected: dbStatus === 'connected'
    },
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      resources: '/api/resources',
      requests: '/api/requests',
      stats: '/api/stats'
    }
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const isOk = dbStatus === 'connected';
  res.status(isOk ? 200 : 503).json({
    status: isOk ? 'ok' : 'degraded',
    message: isOk
      ? 'StudyShare backend is healthy and connected to MongoDB'
      : 'StudyShare backend is running, but MongoDB connection is currently unavailable',
    database: {
      status: dbStatus,
      connected: isOk
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// --- API Route Mounting ---
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api', statsRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[StudyShare] Production-ready server listening on ${HOST}:${PORT}`);
});
