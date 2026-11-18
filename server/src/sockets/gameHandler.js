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
      const { room, outcome, eligibleAction, turnAdvanced, nextTurn } = await roomService.openBook({
        code: cleanCode,
        playerId: targetPlayerId,
        requestId
      });

      // 3. Broadcast the authoritative result to all clients in the room
      const resultPayload = {
        roomCode: cleanCode,
        outcome,
        eligibleAction,
        room
      };

      io.to(cleanCode).emit('BOOK_RESULT', resultPayload);
      io.to(cleanCode).emit('book:result', resultPayload);

      // Task 11: Turn lifecycle events
      if (turnAdvanced) {
        io.to(cleanCode).emit('TURN_COMPLETED', {
          roomCode: cleanCode,
          turnNumber: (room.gameState?.turnNumber || 1) - 1,
          playerNickname: outcome.nickname,
          actionType: 'NO_ACTION',
          room
        });
        io.to(cleanCode).emit('TURN_STARTED', {
          roomCode: cleanCode,
          turnNumber: room.gameState?.turnNumber || 1,
          activePlayerId: room.gameState?.activePlayerId,
          currentTurn: room.gameState?.currentTurn,
          room
        });
      } else {
        io.to(cleanCode).emit('TURN_UPDATED', {
          roomCode: cleanCode,
          turnNumber: room.gameState?.turnNumber || 1,
          activePlayerId: room.gameState?.activePlayerId,
          currentTurn: room.gameState?.currentTurn,
          eligibleAction,
          room
        });
      }

      io.to(cleanCode).emit('room:state', room);
      io.to(cleanCode).emit('ROOM_STATE', room);

      if (typeof callback === 'function') {
        callback({ success: true, outcome, eligibleAction, turnAdvanced, room });
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

  /**
   * Client submits a manual character drawing (Task 09)
   * Payload: { roomCode, playerId, rowNumber, stage, strokeData }
   */
  const handleSubmitDrawing = async (payload, callback) => {
    try {
      const { roomCode, playerId, rowNumber, stage, strokeData } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();
      const targetPlayerId = playerId || socket.data?.playerId;

      if (!cleanCode || !targetPlayerId) {
        const errorMsg = 'roomCode and playerId are required to submit drawing.';
        socket.emit('DRAWING_ERROR', { message: errorMsg });
        socket.emit('drawing:error', { message: errorMsg });
        if (typeof callback === 'function') {
          return callback({ success: false, message: errorMsg });
        }
        return;
      }

      logger.info(
        `[Socket.IO] Socket ${socket.id} (Player: ${targetPlayerId}) submitting ${stage} for Row ${rowNumber} in room ${cleanCode}`
      );

      const result = await roomService.submitDrawing({
        code: cleanCode,
        playerId: targetPlayerId,
        rowNumber,
        stage,
        strokeData
      });

      // Broadcast drawing update to all players in room
      const updatePayload = {
        roomCode: cleanCode,
        playerId: targetPlayerId,
        rowNumber: result.rowNumber,
        stage: result.stage,
        nextStage: result.nextStage,
        drawing: result.drawing,
        rowState: result.rowState,
        room: result.room
      };

      io.to(cleanCode).emit('DRAWING_UPDATED', updatePayload);
      io.to(cleanCode).emit('drawing:updated', updatePayload);
      io.to(cleanCode).emit('DRAWING_STAGE_COMPLETED', updatePayload);
      io.to(cleanCode).emit('drawing:stage_completed', updatePayload);

      // Task 11: Ammunition event when bullet is drawn
      if (result.stage === 'BULLET') {
        io.to(cleanCode).emit('AMMUNITION_UPDATED', {
          roomCode: cleanCode,
          playerId: targetPlayerId,
          rowNumber: result.rowNumber,
          bulletCount: result.rowState.bulletCount,
          bullets: result.rowState.bullets,
          room: result.room
        });
      }

      // Task 11: Turn transition events
      io.to(cleanCode).emit('TURN_COMPLETED', {
        roomCode: cleanCode,
        turnNumber: (result.room.gameState?.turnNumber || 1) - 1,
        actionType: 'DRAW',
        stage: result.stage,
        rowNumber: result.rowNumber,
        room: result.room
      });

      io.to(cleanCode).emit('TURN_STARTED', {
        roomCode: cleanCode,
        turnNumber: result.room.gameState?.turnNumber || 1,
        activePlayerId: result.room.gameState?.activePlayerId,
        currentTurn: result.room.gameState?.currentTurn,
        room: result.room
      });

      io.to(cleanCode).emit('room:state', result.room);
      io.to(cleanCode).emit('ROOM_STATE', result.room);

      if (typeof callback === 'function') {
        callback({ success: true, result });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error submitting drawing for socket ${socket.id}:`, err.message);
      const errorPayload = {
        message: err.message,
        statusCode: err.statusCode || 400
      };

      socket.emit('DRAWING_ERROR', errorPayload);
      socket.emit('drawing:error', errorPayload);

      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('SUBMIT_DRAWING', handleSubmitDrawing);
  socket.on('drawing:submit', handleSubmitDrawing);

  /**
   * Client selects a combat target (Task 10)
   * Payload: { roomCode, playerId, attackerRow, targetPlayerId, targetRow }
   */
  const handleSelectCombatTarget = async (payload, callback) => {
    try {
      const { roomCode, playerId, attackerRow, targetPlayerId, targetRow } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();
      const activePlayerId = playerId || socket.data?.playerId;

      if (!cleanCode || !activePlayerId || attackerRow === undefined || !targetPlayerId || targetRow === undefined) {
        const errorMsg = 'roomCode, playerId, attackerRow, targetPlayerId, and targetRow are required.';
        socket.emit('COMBAT_ERROR', { message: errorMsg });
        socket.emit('combat:error', { message: errorMsg });
        if (typeof callback === 'function') {
          return callback({ success: false, message: errorMsg });
        }
        return;
      }

      logger.info(
        `[Socket.IO] Socket ${socket.id} (Player: ${activePlayerId}) selected target ${targetPlayerId}:Row ${targetRow} with attacker Row ${attackerRow} in room ${cleanCode}`
      );

      const result = await roomService.selectCombatTarget({
        code: cleanCode,
        playerId: activePlayerId,
        attackerRow,
        targetPlayerId,
        targetRow
      });

      const targetPayload = {
        roomCode: cleanCode,
        selectedTarget: result.selectedTarget,
        room: result.room
      };

      io.to(cleanCode).emit('TARGET_SELECTED', targetPayload);
      io.to(cleanCode).emit('combat:target_selected', targetPayload);
      io.to(cleanCode).emit('room:state', result.room);
      io.to(cleanCode).emit('ROOM_STATE', result.room);

      if (typeof callback === 'function') {
        callback({ success: true, result });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error selecting combat target for socket ${socket.id}:`, err.message);
      const errorPayload = {
        message: err.message,
        statusCode: err.statusCode || 400
      };

      socket.emit('COMBAT_ERROR', errorPayload);
      socket.emit('combat:error', errorPayload);

      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('SELECT_TARGET', handleSelectCombatTarget);
  socket.on('combat:select_target', handleSelectCombatTarget);
  socket.on('SELECT_COMBAT_TARGET', handleSelectCombatTarget);

  /**
   * Client fires a shot at an opponent row (Task 10)
   * Payload: { roomCode, playerId, attackerRow, targetPlayerId, targetRow, actionId }
   */
  const handleFireShot = async (payload, callback) => {
    try {
      const { roomCode, playerId, attackerRow, targetPlayerId, targetRow, actionId } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();
      const activePlayerId = playerId || socket.data?.playerId;

      if (!cleanCode || !activePlayerId || attackerRow === undefined || !targetPlayerId || targetRow === undefined) {
        const errorMsg = 'roomCode, playerId, attackerRow, targetPlayerId, and targetRow are required.';
        socket.emit('COMBAT_ERROR', { message: errorMsg });
        socket.emit('combat:error', { message: errorMsg });
        if (typeof callback === 'function') {
          return callback({ success: false, message: errorMsg });
        }
        return;
      }

      logger.info(
        `[Socket.IO] Socket ${socket.id} (Player: ${activePlayerId}) firing from Row ${attackerRow} at ${targetPlayerId}:Row ${targetRow} in room ${cleanCode}`
      );

      const result = await roomService.fireShot({
        code: cleanCode,
        playerId: activePlayerId,
        attackerRow,
        targetPlayerId,
        targetRow,
        actionId
      });

      const shotPayload = {
        roomCode: cleanCode,
        shotEvent: result.shotEvent,
        room: result.room
      };

      // Broadcast combat events to all clients in room
      io.to(cleanCode).emit('SHOT_FIRED', shotPayload);
      io.to(cleanCode).emit('combat:shot_fired', shotPayload);

      io.to(cleanCode).emit('ROW_ELIMINATED', {
        roomCode: cleanCode,
        targetPlayerId: result.shotEvent.targetPlayerId,
        targetRow: result.shotEvent.targetRow,
        shotEvent: result.shotEvent
      });
      io.to(cleanCode).emit('combat:row_eliminated', {
        roomCode: cleanCode,
        targetPlayerId: result.shotEvent.targetPlayerId,
        targetRow: result.shotEvent.targetRow,
        shotEvent: result.shotEvent
      });

      // Task 11: Player eliminated broadcast
      if (result.shotEvent.targetPlayerEliminated) {
        io.to(cleanCode).emit('PLAYER_ELIMINATED', {
          roomCode: cleanCode,
          targetPlayerId: result.shotEvent.targetPlayerId,
          targetNickname: result.shotEvent.targetNickname,
          room: result.room
        });
      }

      io.to(cleanCode).emit('AMMUNITION_UPDATED', {
        roomCode: cleanCode,
        playerId: activePlayerId,
        rowNumber: attackerRow,
        bulletCount: result.shotEvent.remainingBullets,
        room: result.room
      });

      io.to(cleanCode).emit('COMBAT_STATE_UPDATED', shotPayload);
      io.to(cleanCode).emit('combat:state_updated', shotPayload);

      if (result.shotEvent.matchFinished) {
        const victoryPayload = {
          roomCode: cleanCode,
          winnerId: result.shotEvent.winnerId,
          winnerNickname: result.shotEvent.winnerNickname,
          room: result.room
        };
        io.to(cleanCode).emit('MATCH_FINISHED', victoryPayload);
        io.to(cleanCode).emit('combat:match_finished', victoryPayload);
      } else {
        // Turn transition events
        io.to(cleanCode).emit('TURN_COMPLETED', {
          roomCode: cleanCode,
          turnNumber: (result.room.gameState?.turnNumber || 1) - 1,
          actionType: 'ATTACK',
          shotEvent: result.shotEvent,
          room: result.room
        });

        io.to(cleanCode).emit('TURN_STARTED', {
          roomCode: cleanCode,
          turnNumber: result.room.gameState?.turnNumber || 1,
          activePlayerId: result.room.gameState?.activePlayerId,
          currentTurn: result.room.gameState?.currentTurn,
          room: result.room
        });
      }

      io.to(cleanCode).emit('room:state', result.room);
      io.to(cleanCode).emit('ROOM_STATE', result.room);

      if (typeof callback === 'function') {
        callback({ success: true, result });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error firing shot for socket ${socket.id}:`, err.message);
      const errorPayload = {
        message: err.message,
        statusCode: err.statusCode || 400
      };

      socket.emit('COMBAT_ERROR', errorPayload);
      socket.emit('combat:error', errorPayload);

      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('FIRE_SHOT', handleFireShot);
  socket.on('combat:fire', handleFireShot);
  socket.on('FIRE_COMBAT_SHOT', handleFireShot);

  /**
   * Client voluntarily passes active turn (Task 11)
   */
  const handlePassTurn = async (payload, callback) => {
    try {
      const { roomCode, playerId } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();
      const activePlayerId = playerId || socket.data?.playerId;

      if (!cleanCode || !activePlayerId) {
        const errorMsg = 'roomCode and playerId are required to pass turn.';
        socket.emit('TURN_ERROR', { message: errorMsg });
        if (typeof callback === 'function') {
          return callback({ success: false, message: errorMsg });
        }
        return;
      }

      const result = await roomService.passTurn({
        code: cleanCode,
        playerId: activePlayerId
      });

      io.to(cleanCode).emit('TURN_COMPLETED', {
        roomCode: cleanCode,
        turnNumber: (result.room.gameState?.turnNumber || 1) - 1,
        actionType: 'PASS',
        playerId: activePlayerId,
        room: result.room
      });

      io.to(cleanCode).emit('TURN_STARTED', {
        roomCode: cleanCode,
        turnNumber: result.room.gameState?.turnNumber || 1,
        activePlayerId: result.room.gameState?.activePlayerId,
        currentTurn: result.room.gameState?.currentTurn,
        room: result.room
      });

      io.to(cleanCode).emit('room:state', result.room);
      io.to(cleanCode).emit('ROOM_STATE', result.room);

      if (typeof callback === 'function') {
        callback({ success: true, result });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error passing turn for socket ${socket.id}:`, err.message);
      socket.emit('TURN_ERROR', { message: err.message, statusCode: err.statusCode || 400 });
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('PASS_TURN', handlePassTurn);
  socket.on('turn:pass', handlePassTurn);

  /**
   * Battlefield page initialized, transition to PLAYING (Task 11)
   */
  const handleStartPlaying = async (payload, callback) => {
    try {
      const { roomCode } = payload || {};
      const cleanCode = (roomCode || socket.data?.roomCode)?.toUpperCase().trim();

      if (!cleanCode) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode is required.' });
        }
        return;
      }

      const room = await roomService.startPlaying({ code: cleanCode });

      io.to(cleanCode).emit('MATCH_PLAYING', { roomCode: cleanCode, room });
      io.to(cleanCode).emit('TURN_STARTED', {
        roomCode: cleanCode,
        turnNumber: room.gameState?.turnNumber || 1,
        activePlayerId: room.gameState?.activePlayerId,
        currentTurn: room.gameState?.currentTurn,
        room
      });

      io.to(cleanCode).emit('room:state', room);
      io.to(cleanCode).emit('ROOM_STATE', room);

      if (typeof callback === 'function') {
        callback({ success: true, room });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error starting playing for socket ${socket.id}:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  };

  socket.on('START_PLAYING', handleStartPlaying);
  socket.on('game:start_playing', handleStartPlaying);

  socket.on('game:ping', (timestamp, callback) => {
    if (typeof callback === 'function') {
      callback({ serverTime: Date.now(), clientTimestamp: timestamp });
    }
  });
};
