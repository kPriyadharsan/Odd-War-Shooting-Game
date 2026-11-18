import { roomService } from '../services/roomService.js';
import { logger } from '../utils/logger.js';

/**
 * Socket.IO Room Event Handlers (Task 06)
 * Real-time synchronization for multiplayer waiting room:
 * - Room join / re-join synchronization
 * - Player readiness toggling
 * - Host game settings updates
 * - Host kick player
 * - Host start match
 * - Disconnect & reconnection preservation
 */
export const registerRoomHandlers = (io, socket) => {
  /**
   * Helper to broadcast updated room state to all clients in the room
   */
  const broadcastRoomState = (roomCode, room) => {
    if (!roomCode || !room) return;
    const cleanCode = roomCode.toUpperCase().trim();
    io.to(cleanCode).emit('room:state', room);
    io.to(cleanCode).emit('ROOM_STATE', room);
  };

  /**
   * Player joins room socket channel
   * Payload: { roomCode, player: { playerId, nickname, primaryColor }, password }
   */
  socket.on('room:join', async (payload, callback) => {
    try {
      const { roomCode, player, password } = payload || {};
      if (!roomCode || !player?.playerId) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode and player are required.' });
        }
        return;
      }

      const cleanCode = roomCode.toUpperCase().trim();

      // Join/Reconnect through roomService
      const room = await roomService.joinRoom({
        code: cleanCode,
        password,
        player,
        socketId: socket.id
      });

      // Join socket room
      socket.join(cleanCode);
      socket.data.roomCode = cleanCode;
      socket.data.playerId = player.playerId;
      socket.data.nickname = player.nickname;

      logger.info(`[Socket.IO] Socket ${socket.id} (${player.nickname}) joined room channel ${cleanCode}`);

      // Broadcast updated room state to everyone in room
      broadcastRoomState(cleanCode, room);

      // Notify others about player joined
      socket.to(cleanCode).emit('room:player_joined', { player, room });
      socket.to(cleanCode).emit('PLAYER_JOINED', { player, room });

      if (typeof callback === 'function') {
        callback({ success: true, room });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:join for ${socket.id}:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  // Alias for room:join
  socket.on('ROOM_JOIN', (payload, callback) => {
    socket.listeners('room:join')[0]?.(payload, callback);
  });

  /**
   * Player toggles readiness
   * Payload: { roomCode, playerId, isReady }
   */
  socket.on('room:ready', async (payload, callback) => {
    try {
      const { roomCode, playerId, isReady } = payload || {};
      const cleanCode = (roomCode || socket.data.roomCode)?.toUpperCase().trim();
      const targetPlayerId = playerId || socket.data.playerId;

      if (!cleanCode || !targetPlayerId) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode and playerId are required.' });
        }
        return;
      }

      const result = await roomService.setPlayerReady({
        code: cleanCode,
        playerId: targetPlayerId,
        isReady: Boolean(isReady)
      });

      broadcastRoomState(cleanCode, result.room);
      io.to(cleanCode).emit('room:player_ready_changed', {
        playerId: targetPlayerId,
        isReady: Boolean(isReady),
        room: result.room
      });

      if (typeof callback === 'function') {
        callback({ success: true, room: result.room, player: result.player });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:ready:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  socket.on('PLAYER_READY', (payload, callback) => {
    socket.listeners('room:ready')[0]?.(payload, callback);
  });

  /**
   * Host updates game settings (e.g. bookPageCount: 100 | 200)
   * Payload: { roomCode, hostPlayerId, settings: { bookPageCount, maxPlayers } }
   */
  socket.on('room:settings', async (payload, callback) => {
    try {
      const { roomCode, hostPlayerId, settings } = payload || {};
      const cleanCode = (roomCode || socket.data.roomCode)?.toUpperCase().trim();
      const hostId = hostPlayerId || socket.data.playerId;

      if (!cleanCode || !hostId) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode and hostPlayerId are required.' });
        }
        return;
      }

      const updatedRoom = await roomService.updateRoomSettings({
        code: cleanCode,
        hostPlayerId: hostId,
        settings
      });

      broadcastRoomState(cleanCode, updatedRoom);
      io.to(cleanCode).emit('room:settings_updated', { settings, room: updatedRoom });

      if (typeof callback === 'function') {
        callback({ success: true, room: updatedRoom });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:settings:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  socket.on('UPDATE_ROOM_SETTINGS', (payload, callback) => {
    socket.listeners('room:settings')[0]?.(payload, callback);
  });

  /**
   * Host kicks a player from the waiting room
   * Payload: { roomCode, hostPlayerId, targetPlayerId }
   */
  socket.on('room:kick', async (payload, callback) => {
    try {
      const { roomCode, hostPlayerId, targetPlayerId } = payload || {};
      const cleanCode = (roomCode || socket.data.roomCode)?.toUpperCase().trim();
      const hostId = hostPlayerId || socket.data.playerId;

      if (!cleanCode || !hostId || !targetPlayerId) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode, hostPlayerId, and targetPlayerId are required.' });
        }
        return;
      }

      const result = await roomService.kickPlayer({
        code: cleanCode,
        hostPlayerId: hostId,
        targetPlayerId
      });

      // Notify the specific kicked socket if online
      const sockets = await io.in(cleanCode).fetchSockets();
      for (const s of sockets) {
        if (s.data?.playerId === targetPlayerId) {
          s.emit('room:kicked', {
            message: 'You were removed from the room by the host.',
            roomCode: cleanCode
          });
          s.emit('PLAYER_KICKED', {
            message: 'You were removed from the room by the host.',
            roomCode: cleanCode
          });
          s.leave(cleanCode);
        }
      }

      broadcastRoomState(cleanCode, result.room);
      io.to(cleanCode).emit('room:player_kicked', {
        targetPlayerId,
        kickedPlayer: result.kickedPlayer,
        room: result.room
      });

      if (typeof callback === 'function') {
        callback({ success: true, room: result.room, kickedPlayer: result.kickedPlayer });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:kick:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  socket.on('KICK_PLAYER', (payload, callback) => {
    socket.listeners('room:kick')[0]?.(payload, callback);
  });

  /**
   * Host starts the match
   * Payload: { roomCode, hostPlayerId }
   */
  socket.on('room:start', async (payload, callback) => {
    try {
      const { roomCode, hostPlayerId } = payload || {};
      const cleanCode = (roomCode || socket.data.roomCode)?.toUpperCase().trim();
      const hostId = hostPlayerId || socket.data.playerId;

      if (!cleanCode || !hostId) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'roomCode and hostPlayerId are required.' });
        }
        return;
      }

      const startedRoom = await roomService.startMatch({
        code: cleanCode,
        hostPlayerId: hostId
      });

      broadcastRoomState(cleanCode, startedRoom);
      io.to(cleanCode).emit('room:match_starting', {
        room: startedRoom,
        message: 'All warriors ready! Game is starting...'
      });
      io.to(cleanCode).emit('MATCH_STARTING', {
        room: startedRoom,
        message: 'All warriors ready! Game is starting...'
      });

      if (typeof callback === 'function') {
        callback({ success: true, room: startedRoom });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:start:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  socket.on('START_MATCH', (payload, callback) => {
    socket.listeners('room:start')[0]?.(payload, callback);
  });

  /**
   * Player leaves the room voluntarily
   * Payload: { roomCode, playerId }
   */
  socket.on('room:leave', async (payload, callback) => {
    try {
      const { roomCode, playerId } = payload || {};
      const cleanCode = (roomCode || socket.data.roomCode)?.toUpperCase().trim();
      const pId = playerId || socket.data.playerId;

      if (cleanCode && pId) {
        socket.leave(cleanCode);
        const result = await roomService.leaveRoom({
          code: cleanCode,
          playerId: pId
        });

        if (result.status !== 'CANCELLED') {
          broadcastRoomState(cleanCode, result);
          io.to(cleanCode).emit('room:player_left', { playerId: pId, room: result });
          io.to(cleanCode).emit('PLAYER_LEFT', { playerId: pId, room: result });
        } else {
          io.to(cleanCode).emit('room:cancelled', { message: 'Room was closed.' });
        }
      }

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (err) {
      logger.error(`[Socket.IO] Error in room:leave:`, err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  socket.on('LEAVE_ROOM', (payload, callback) => {
    socket.listeners('room:leave')[0]?.(payload, callback);
  });

  /**
   * Temporary network disconnect: trigger grace period before evicting
   */
  socket.on('disconnect', async () => {
    await roomService.handleSocketDisconnect(socket.id, (roomCode, targetPlayer, roomResult) => {
      if (roomCode) {
        if (roomResult && roomResult.status !== 'CANCELLED') {
          broadcastRoomState(roomCode, roomResult);
        }
        io.to(roomCode).emit('room:player_left', {
          playerId: targetPlayer.playerId,
          nickname: targetPlayer.nickname,
          reason: 'disconnected'
        });
      }
    });
  });
};
