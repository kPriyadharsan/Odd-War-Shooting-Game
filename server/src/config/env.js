import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Feature flags / Active integrations
  isMongoConfigured: Boolean(process.env.MONGO_URI && process.env.MONGO_URI.trim().length > 0),
  isRedisConfigured: Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0),
  isGoogleAuthConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim().length > 0)
};
