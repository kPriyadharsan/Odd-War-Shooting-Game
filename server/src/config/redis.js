import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let pubClient = null;
let subClient = null;
let isConnected = false;

export const initRedis = async () => {
  if (!config.isRedisConfigured) {
    logger.warn('[Redis] REDIS_URL not configured. Socket.IO will run in standalone in-memory mode.');
    return { connected: false, adapter: 'in-memory', message: 'REDIS_URL not configured' };
  }

  try {
    pubClient = createClient({ url: config.redisUrl });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => logger.error('[Redis Pub] Error:', err.message));
    subClient.on('error', (err) => logger.error('[Redis Sub] Error:', err.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    isConnected = true;
    logger.info('[Redis] Connected to Redis cluster successfully.');
    return { connected: true, adapter: 'redis', pubClient, subClient };
  } catch (error) {
    isConnected = false;
    logger.error('[Redis] Connection failed:', error.message);
    logger.warn('[Redis] Falling back to default in-memory Socket.IO adapter.');
    return { connected: false, adapter: 'in-memory', error: error.message };
  }
};

export const getRedisAdapter = () => {
  if (isConnected && pubClient && subClient) {
    return createAdapter(pubClient, subClient);
  }
  return null;
};

export const getRedisStatus = () => {
  return {
    status: isConnected ? 'active' : 'inactive',
    connected: isConnected,
    configured: config.isRedisConfigured,
    adapter: isConnected ? 'redis-adapter' : 'in-memory (standalone)',
    message: isConnected
      ? 'Connected to Redis'
      : config.isRedisConfigured
      ? 'Connection failed (fallback to in-memory)'
      : 'REDIS_URL not configured (single-instance in-memory mode)'
  };
};
