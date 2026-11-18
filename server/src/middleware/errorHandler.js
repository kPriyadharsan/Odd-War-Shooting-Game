import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

/**
 * Global Express Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  return sendError(res, message, statusCode, process.env.NODE_ENV !== 'production' ? err.stack : null);
};

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};
