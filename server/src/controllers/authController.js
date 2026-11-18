import { config } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Auth Controller Foundation
 * To be implemented in Task 02 with Google OAuth token exchange.
 */
export const googleAuthCallback = async (req, res, next) => {
  if (!config.isGoogleAuthConfigured) {
    return sendError(
      res,
      'Google authentication is inactive. GOOGLE_CLIENT_ID is not configured.',
      501
    );
  }

  return sendSuccess(res, null, 'Google Auth foundation ready. Implementation scheduled for Task 02.');
};

export const getCurrentUser = async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Authenticated user profile retrieved');
};
