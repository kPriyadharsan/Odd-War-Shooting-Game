import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Room, ROOM_STATUS } from '../models/Room.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory room store fallback for development mode when MongoDB is not running.
 * Key: roomCode -> Room Object
 */
const inMemoryRooms = new Map();

/**
 * Generates an uppercase 6-character room code (e.g. "ODD482", "WAR791", "K9P2X4")
 */
export const generateRoomCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 unambiguous
  let result = 'ODD';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Strips sensitive fields like passwordHash from room objects before sending to clients.
 */
export const sanitizeRoom = (room) => {
  if (!room) return null;
  const raw = typeof room.toJSON === 'function' ? room.toJSON() : { ...room };
  delete raw.passwordHash;
  delete raw.__v;
  raw.playerCount = raw.players ? raw.players.length : 0;
  return raw;
};

export const roomService = {
  /**
   * Generates a collision-safe room code.
   */
  getUniqueRoomCode: async () => {
    let code = generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    const isDbConnected = getDatabaseStatus().connected;

    while (attempts < maxAttempts) {
      if (isDbConnected) {
        const existing = await Room.findOne({ code, status: { $ne: ROOM_STATUS.CANCELLED } });
        if (!existing) return code;
      } else {
        const existing = inMemoryRooms.get(code);
        if (!existing || existing.status === ROOM_STATUS.CANCELLED) return code;
      }
      code = generateRoomCode();
      attempts++;
    }

    // Fallback random 6 chars
    return `ODD${crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3)}`;
  },

  /**
   * Creates a Public Room.
   */
  createPublicRoom: async ({ name, hostPlayer, maxPlayers = 4 }) => {
    const code = await roomService.getUniqueRoomCode();
    const isDbConnected = getDatabaseStatus().connected;

    const hostEntry = {
      playerId: hostPlayer.playerId,
      nickname: hostPlayer.nickname.trim(),
      primaryColor: (hostPlayer.primaryColor || 'BLUE').toUpperCase(),
      slotIndex: 0,
      isHost: true,
      isReady: false,
      joinedAt: new Date()
    };

    const roomData = {
      code,
      name: name.trim(),
      isPrivate: false,
      passwordHash: null,
      maxPlayers: Math.min(Math.max(parseInt(maxPlayers, 10) || 4, 2), 4),
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry]
    };

    if (isDbConnected) {
      const room = await Room.create(roomData);
      logger.info(`[RoomService] Public room created in DB: ${code} (${room.name}) by ${hostPlayer.nickname}`);
      return sanitizeRoom(room);
    } else {
      inMemoryRooms.set(code, roomData);
      logger.info(`[RoomService] Public room created in memory: ${code} (${roomData.name}) by ${hostPlayer.nickname}`);
      return sanitizeRoom(roomData);
    }
  },

  /**
   * Creates a Private Room with Password.
   */
  createPrivateRoom: async ({ name, password, hostPlayer, maxPlayers = 4 }) => {
    if (!password || password.trim().length === 0) {
      throw new Error('A private room requires a password.');
    }

    const code = await roomService.getUniqueRoomCode();
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const isDbConnected = getDatabaseStatus().connected;

    const hostEntry = {
      playerId: hostPlayer.playerId,
      nickname: hostPlayer.nickname.trim(),
      primaryColor: (hostPlayer.primaryColor || 'BLUE').toUpperCase(),
      slotIndex: 0,
      isHost: true,
      isReady: false,
      joinedAt: new Date()
    };

    const roomData = {
      code,
      name: name.trim(),
      isPrivate: true,
      passwordHash,
      maxPlayers: Math.min(Math.max(parseInt(maxPlayers, 10) || 4, 2), 4),
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry]
    };

    if (isDbConnected) {
      const room = await Room.create(roomData);
      logger.info(`[RoomService] Private room created in DB: ${code} (${room.name})`);
      return sanitizeRoom(room);
    } else {
      inMemoryRooms.set(code, roomData);
      logger.info(`[RoomService] Private room created in memory: ${code} (${roomData.name})`);
      return sanitizeRoom(roomData);
    }
  },

  /**
   * Lists available Public Rooms that are in WAITING status and not full.
   */
  listPublicRooms: async () => {
    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      // Find public rooms where status is WAITING and player count < maxPlayers
      const rooms = await Room.find({
        isPrivate: false,
        status: ROOM_STATUS.WAITING,
        $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] }
      })
        .sort({ createdAt: -1 })
        .limit(30);

      return rooms.map(sanitizeRoom);
    } else {
      const available = [];
      for (const room of inMemoryRooms.values()) {
        if (!room.isPrivate && room.status === ROOM_STATUS.WAITING && room.players.length < room.maxPlayers) {
          available.push(sanitizeRoom(room));
        }
      }
      return available.reverse();
    }
  },

  /**
   * Retrieves a single room by its code (sanitized).
   */
  getRoomByCode: async (code) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      const room = await Room.findOne({ code: cleanCode });
      return room ? sanitizeRoom(room) : null;
    } else {
      const room = inMemoryRooms.get(cleanCode);
      return room ? sanitizeRoom(room) : null;
    }
  },

  /**
   * Joins an existing room (public or private with password).
   */
  joinRoom: async ({ code, password, player }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = null;
    let rawPasswordHash = null;

    if (isDbConnected) {
      // Select passwordHash explicitly to verify private rooms
      room = await Room.findOne({ code: cleanCode }).select('+passwordHash');
      if (room) rawPasswordHash = room.passwordHash;
    } else {
      room = inMemoryRooms.get(cleanCode);
      if (room) rawPasswordHash = room.passwordHash;
    }

    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Status Check
    if (room.status !== ROOM_STATUS.WAITING && room.status !== ROOM_STATUS.READY) {
      const err = new Error(`Cannot join room: game is currently ${room.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Capacity Check
    if (room.players.length >= room.maxPlayers) {
      const err = new Error(`Room is full (${room.players.length}/${room.maxPlayers} players).`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Duplicate Membership Check
    const alreadyMember = room.players.some((p) => p.playerId === player.playerId);
    if (alreadyMember) {
      const err = new Error('You are already in this room.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Private Room Password Verification
    if (room.isPrivate) {
      if (!password || password.trim().length === 0) {
        const err = new Error('Password required for private room.');
        err.statusCode = 401;
        throw err;
      }

      const isMatch = await bcrypt.compare(password.trim(), rawPasswordHash);
      if (!isMatch) {
        const err = new Error('Incorrect room password.');
        err.statusCode = 401;
        throw err;
      }
    }

    // 5. Assign Next Available Slot (0..3)
    const takenSlots = new Set(room.players.map((p) => p.slotIndex));
    let nextSlot = 0;
    while (takenSlots.has(nextSlot) && nextSlot < 4) {
      nextSlot++;
    }

    const newPlayerEntry = {
      playerId: player.playerId,
      nickname: player.nickname.trim(),
      primaryColor: (player.primaryColor || 'BLUE').toUpperCase(),
      slotIndex: nextSlot,
      isHost: false,
      isReady: false,
      joinedAt: new Date()
    };

    if (isDbConnected) {
      room.players.push(newPlayerEntry);
      await room.save();
      logger.info(`[RoomService] Player ${player.nickname} joined room ${cleanCode} in DB (${room.players.length}/${room.maxPlayers})`);
      return sanitizeRoom(room);
    } else {
      room.players.push(newPlayerEntry);
      logger.info(`[RoomService] Player ${player.nickname} joined room ${cleanCode} in memory (${room.players.length}/${room.maxPlayers})`);
      return sanitizeRoom(room);
    }
  },

  /**
   * Leaves a room.
   * If host leaves, automatically reassigns host to the next player.
   * If no players remain, room is cleaned up / cancelled.
   */
  leaveRoom: async ({ code, playerId }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = null;
    if (isDbConnected) {
      room = await Room.findOne({ code: cleanCode });
    } else {
      room = inMemoryRooms.get(cleanCode);
    }

    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const playerIndex = room.players.findIndex((p) => p.playerId === playerId);
    if (playerIndex === -1) {
      const err = new Error('Player is not in this room.');
      err.statusCode = 400;
      throw err;
    }

    const leavingPlayer = room.players[playerIndex];
    const wasHost = leavingPlayer.isHost;

    // Remove player
    room.players.splice(playerIndex, 1);

    // If room is empty, cancel / clean up
    if (room.players.length === 0) {
      room.status = ROOM_STATUS.CANCELLED;
      if (isDbConnected) {
        await Room.deleteOne({ code: cleanCode });
      } else {
        inMemoryRooms.delete(cleanCode);
      }
      logger.info(`[RoomService] Room ${cleanCode} is now empty and has been cleaned up.`);
      return { code: cleanCode, status: ROOM_STATUS.CANCELLED, message: 'Room empty and cleaned up.' };
    }

    // Reassign host if previous host left
    if (wasHost) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].playerId;
      room.hostNickname = room.players[0].nickname;
      logger.info(`[RoomService] Host left. Reassigned host of room ${cleanCode} to ${room.players[0].nickname}`);
    }

    if (isDbConnected) {
      await room.save();
    }

    return sanitizeRoom(room);
  }
};
