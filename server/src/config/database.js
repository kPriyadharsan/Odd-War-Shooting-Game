import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async () => {
  if (!config.isMongoConfigured) {
    logger.warn('[Database] MONGO_URI is not configured. Running in in-memory dev mode without database persistence.');
    return { connected: false, message: 'MONGO_URI not configured' };
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    logger.info(`[Database] MongoDB connected: ${conn.connection.host}`);
    return { connected: true, host: conn.connection.host };
  } catch (error) {
    isConnected = false;
    logger.error('[Database] MongoDB connection failed:', error.message);
    logger.warn('[Database] Server continuing without database persistence.');
    return { connected: false, error: error.message };
  }
};

export const getDatabaseStatus = () => {
  return {
    status: isConnected ? 'active' : 'inactive',
    connected: isConnected,
    configured: config.isMongoConfigured,
    message: isConnected
      ? 'Connected to MongoDB'
      : config.isMongoConfigured
      ? 'Connection failed or pending'
      : 'MONGO_URI not configured (persistence disabled in dev mode)'
  };
};
