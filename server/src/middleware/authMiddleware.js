import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication Middleware Foundation
 * Verifies Bearer JWT tokens for protected endpoints.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required: Missing Bearer token', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token', 401, error.message);
  }
};
