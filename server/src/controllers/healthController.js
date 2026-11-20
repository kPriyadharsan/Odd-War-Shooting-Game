import { getDatabaseStatus } from '../config/database.js';
import { getRedisStatus } from '../config/redis.js';
import { config } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

const startTime = Date.now();

/**
 * Health Check Controller
 * Reports system health and the live state of all integrations.
 */
export const getHealth = (req, res) => {
  const uptimeSeconds = (Date.now() - startTime) / 1000;
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();

  const healthData = {
    status: 'healthy',
    service: 'ODD WAR Game Server',
    version: '1.0.0',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(uptimeSeconds),
    timestamp: new Date().toISOString(),
    integrations: {
      mongodb: dbStatus,
      redis: redisStatus,
      googleAuth: {
        status: config.isGoogleAuthConfigured ? 'active' : 'inactive',
        configured: config.isGoogleAuthConfigured,
        message: config.isGoogleAuthConfigured
          ? 'Google OAuth credentials present'
          : 'GOOGLE_CLIENT_ID not configured (dev mode)'
      },
      socketIO: {
        status: 'active',
        adapter: redisStatus.connected ? 'redis-adapter' : 'in-memory (standalone)'
      }
    }
  };

  return sendSuccess(res, healthData, 'Server is running');
};
