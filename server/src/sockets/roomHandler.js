import { logger } from '../utils/logger.js';

/**
 * Socket.IO Room Event Handlers (Foundation)
 * Manages player joining, leaving, and toggling ready state in rooms.
 */
export const registerRoomHandlers = (io, socket) => {
  socket.on('room:join', ({ roomCode, username }, callback) => {
    logger.debug(`Socket ${socket.id} attempting to join room ${roomCode}`);
    if (typeof callback === 'function') {
      callback({ success: true, message: 'Room join protocol foundation established.' });
    }
  });

  socket.on('room:leave', ({ roomCode }) => {
    logger.debug(`Socket ${socket.id} leaving room ${roomCode}`);
  });

  socket.on('room:ready', ({ roomCode, isReady }) => {
    logger.debug(`Socket ${socket.id} set ready=${isReady} in room ${roomCode}`);
  });
};
