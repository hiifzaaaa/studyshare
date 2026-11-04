import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { seedDatabase } from '../seed.js';

dotenv.config();

let lastDbError = null;
let retryTimer = null;
let isConnecting = false;

export function getDbDiagnostics() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const rawUri = process.env.MONGODB_URI || '';
  const isAtlas = rawUri.includes('mongodb.net');
  const isLocalhost = rawUri.includes('127.0.0.1') || rawUri.includes('localhost');
  const hasEnv = Boolean(process.env.MONGODB_URI);

  return {
    status: states[state] || 'unknown',
    connected: state === 1,
    hasEnvConfigured: hasEnv,
    isAtlas,
    isLocalhost,
    host: state === 1 ? mongoose.connection.host : null,
    database: state === 1 ? mongoose.connection.name : null,
    lastError: lastDbError ? lastDbError.message : null
  };
}

export function getDbStatus() {
  const diag = getDbDiagnostics();
  return diag.status;
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) return null;

  isConnecting = true;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyshare';

  // Diagnostic warning for production environment
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    console.warn(
      '[MongoDB Alert] MONGODB_URI is not set in Render environment variables! Defaulting to 127.0.0.1 which will fail on Render cloud instances. Please add MONGODB_URI in Render dashboard.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    lastDbError = null;
    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed default test accounts (student01, admin01) if database is brand new
    try {
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[MongoDB] Empty database detected. Auto-seeding test accounts (student01, admin01)...');
        await seedDatabase();
        console.log('[MongoDB] Auto-seeding completed successfully.');
      }
    } catch (seedErr) {
      console.warn(`[MongoDB] Auto-seed check notice: ${seedErr.message}`);
    }

    return conn;
  } catch (err) {
    lastDbError = err;
    isConnecting = false;
    console.error(`[MongoDB] Connection failed: ${err.message}`);

    // Schedule automatic reconnection retry after 5 seconds if in production
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (mongoose.connection.readyState !== 1) {
          console.log('[MongoDB] Attempting reconnection...');
          connectDB();
        }
      }, 5000);
    }

    return null;
  }
}

// Attach connection event monitors
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Scheduling reconnect...');
  if (!retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connectDB();
    }, 5000);
  }
});

mongoose.connection.on('error', (err) => {
  lastDbError = err;
  console.error('[MongoDB] Runtime database error:', err.message);
});
