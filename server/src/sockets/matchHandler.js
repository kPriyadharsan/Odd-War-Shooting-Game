import { logger } from '../utils/logger.js';

/**
 * Socket.IO Matchmaking Event Handlers (Foundation)
 * Manages player matchmaking queue, pairing, and cancellation.
 */
export const registerMatchHandlers = (io, socket) => {
  socket.on('matchmaking:queue', ({ gameMode }, callback) => {
    logger.debug(`Socket ${socket.id} queued for matchmaking (${gameMode})`);
    if (typeof callback === 'function') {
      callback({ queued: true, message: 'Matchmaking foundation established.' });
    }
  });

  socket.on('matchmaking:cancel', () => {
    logger.debug(`Socket ${socket.id} cancelled matchmaking`);
  });
};
