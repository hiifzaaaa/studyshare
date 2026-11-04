import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: Please provide a MongoDB connection string as an argument or in .env');
  console.log('Usage: node test-atlas.js "mongodb+srv://user:pass@cluster0.ekc4bet.mongodb.net/studyshare?retryWrites=true&w=majority"');
  process.exit(1);
}

// Mask password for console display
const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
console.log(`[Test] Connecting to MongoDB: ${maskedUri}`);

async function runTest() {
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[Test] Connected successfully! Host: ${conn.connection.host}, DB: ${conn.connection.name}`);

    const userCount = await User.countDocuments();
    console.log(`[Test] Users collection contains: ${userCount} user(s).`);

    const users = await User.find({}, 'username email role fullName');
    console.log('[Test] Existing accounts:');
    users.forEach(u => console.log(`  - ${u.username} (${u.role}): ${u.email} - ${u.fullName}`));

    await mongoose.disconnect();
    console.log('[Test] Disconnected cleanly. MongoDB Atlas configuration is 100% valid!');
    process.exit(0);
  } catch (err) {
    console.error(`[Test] Connection FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();
