import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { seedDatabase } from '../seed.js';

dotenv.config();

export function getDbStatus() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyshare';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed test accounts if database is fresh
    try {
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[MongoDB] Fresh database detected. Auto-seeding evaluation accounts (student01, admin01)...');
        await seedDatabase();
        console.log('[MongoDB] Default data initialized.');
      }
    } catch (seedErr) {
      console.warn(`[MongoDB] Auto-seed check notice: ${seedErr.message}`);
    }

    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // Keep server process running so health checks and informative errors are served
    return null;
  }
}
