import { roomService } from '../services/roomService.js';
import { logger } from '../utils/logger.js';

/**
 * Socket.IO Gameplay & Magical Book Event Handlers (Task 08)
 * Manages:
 * - Server-authoritative book activation (REQUEST_BOOK_OPEN)
 * - Broadcasts book opening state (BOOK_OPENING)
 * - Cryptographic page generation and synchronization (BOOK_RESULT)
 * - Turn validation and error notifications (BOOK_ERROR)
 */
export const registerGameHandlers = (io, socket) => {
  /**
   * Client requests to open the magical book
   * Payload: { roomCode, playerId, requestId }
   */
  const handleOpenBook = async (payload, callback) => {
    try {
      const { roomCode, playerId, requestId } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();
      const targetPlayerId = playerId || socket.data?.playerId;

      if (!cleanCode || !targetPlayerId) {
        const errorMsg = 'roomCode and playerId are required to open the book.';
        socket.emit('BOOK_ERROR', { message: errorMsg });
        socket.emit('book:error', { message: errorMsg });
        if (typeof callback === 'function') {
          return callback({ success: false, message: errorMsg });
        }
        return;
      }

      logger.info(
        `[Socket.IO] Socket ${socket.id} (Player: ${targetPlayerId}) requested book open in room ${cleanCode}`
      );

      // 1. Immediately notify everyone in the room that the book is opening
      const openingPayload = {
        roomCode: cleanCode,
        playerId: targetPlayerId,
        requestId,
        timestamp: Date.now()
      };

      io.to(cleanCode).emit('BOOK_OPENING', openingPayload);
      io.to(cleanCode).emit('book:opening', openingPayload);

      // 2. Perform authoritative cryptographic draw and turn advancement
      const { room, outcome } = await roomService.openBook({
        code: cleanCode,
        playerId: targetPlayerId,
        requestId
      });

      // 3. Broadcast the authoritative result to all clients in the room
      const resultPayload = {
        roomCode: cleanCode,
        outcome,
        room
      };

      io.to(cleanCode).emit('BOOK_RESULT', resultPayload);
      io.to(cleanCode).emit('book:result', resultPayload);
      io.to(cleanCode).emit('room:state', room);
      io.to(cleanCode).emit('ROOM_STATE', room);

      if (typeof callback === 'function') {
        callback({ success: true, outcome, room });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error opening book for socket ${socket.id}:`, err.message);
      const errorPayload = {
        message: err.message,
        statusCode: err.statusCode || 400
      };

      socket.emit('BOOK_ERROR', errorPayload);
      socket.emit('book:error', errorPayload);

      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('REQUEST_BOOK_OPEN', handleOpenBook);
  socket.on('book:open', handleOpenBook);

  socket.on('game:ping', (timestamp, callback) => {
    if (typeof callback === 'function') {
      callback({ serverTime: Date.now(), clientTimestamp: timestamp });
    }
  });
};
