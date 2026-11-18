import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication Business Logic Service Foundation
 */
export const authService = {
  verifyGoogleToken: async (idToken) => {
    if (!config.isGoogleAuthConfigured) {
      throw new Error('Google authentication is not configured in this environment.');
    }
    // Google OAuth verification logic will be implemented in Task 02
    return null;
  }
};
