import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_change_me';

// Security check: Never allow insecure default secret in production
if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_insecure_jwt_secret_key_change_me')) {
  throw new Error('[Security] In production mode, JWT_SECRET must be explicitly configured with a secure random key.');
}

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId,
  googleClientSecret,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/api/auth/google/callback',

  // Feature flags / Active integrations
  isMongoConfigured: Boolean(process.env.MONGO_URI && process.env.MONGO_URI.trim().length > 0),
  isRedisConfigured: Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0),
  isGoogleAuthConfigured: Boolean(
    googleClientId && googleClientId.trim().length > 0 &&
    googleClientSecret && googleClientSecret.trim().length > 0
  )
};
