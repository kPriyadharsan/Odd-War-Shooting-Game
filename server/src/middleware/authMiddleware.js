import { sessionService } from '../services/sessionService.js';
import { sendError } from '../utils/response.js';

/**
 * Extracts session token from HttpOnly cookie or Authorization Bearer header.
 */
const extractSessionToken = (req) => {
  if (req.cookies && (req.cookies.odd_war_session || req.cookies.odd_wars_session)) {
    return req.cookies.odd_war_session || req.cookies.odd_wars_session;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

/**
 * Enforces valid, active session for protected routes.
 */
export const requireAuth = async (req, res, next) => {
  const token = extractSessionToken(req);

  if (!token) {
    return sendError(res, 'Authentication required: No active session found.', 401);
  }

  try {
    const result = await sessionService.validateSession(token);

    if (!result || !result.user) {
      return sendError(res, 'Session is invalid, expired, or revoked.', 401);
    }

    req.user = result.user;
    req.session = result.session;
    return next();
  } catch (error) {
    return sendError(res, 'Authentication validation error.', 401, error.message);
  }
};

/**
 * Attaches user to request if session exists, but allows guests without error.
 */
export const optionalAuth = async (req, res, next) => {
  const token = extractSessionToken(req);

  if (!token) {
    req.user = null;
    req.session = null;
    return next();
  }

  try {
    const result = await sessionService.validateSession(token);
    if (result && result.user) {
      req.user = result.user;
      req.session = result.session;
    } else {
      req.user = null;
      req.session = null;
    }
  } catch {
    req.user = null;
    req.session = null;
  }

  return next();
};
