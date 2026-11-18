import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Room, ROOM_STATUS, ALLOWED_PAGE_COUNTS, ALLOWED_PLAYER_CAPACITIES, TERRITORY_ROWS } from '../models/Room.js';
import { ShadeService } from './shadeService.js';
import { BookEngine } from '../game-engine/BookEngine.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory room store fallback for development mode when MongoDB is not running.
 * Key: roomCode -> Room Object
 */
const inMemoryRooms = new Map();

/**
 * Disconnection grace timers for temporary network disconnects
 * Key: playerId -> NodeJS.Timeout
 */
const disconnectGraceTimers = new Map();
const DISCONNECT_GRACE_PERIOD_MS = 25000; // 25 seconds grace period before auto-leaving

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

/**
 * Generates an independent vertical territory model with rows 1, 3, 5, 7, 9 and drawing state.
 */
export const createTerritory = (slotIndex) => ({
  territoryId: `territory_slot_${slotIndex}`,
  slotIndex,
  rows: [...TERRITORY_ROWS],
  rowStates: TERRITORY_ROWS.map((rowNum) => ({
    rowNumber: rowNum,
    status: 'EMPTY',
    currentStage: 'HEAD',
    drawings: {
      HEAD: null,
      BODY: null,
      GUN: null,
      BULLET: null
    },
    bulletCount: 0,
    bullets: [
      { slot: 1, drawn: false, drawing: null },
      { slot: 2, drawn: false, drawing: null },
      { slot: 3, drawn: false, drawing: null }
    ],
    isEliminated: false
  }))
});

/**
 * Recalculates room readiness based on player count and individual ready states.
 */
const evaluateRoomReadiness = (room) => {
  if (room.status === ROOM_STATUS.STARTING || room.status === ROOM_STATUS.PLAYING || room.status === ROOM_STATUS.FINISHED) {
    return;
  }

  const nonHostPlayers = room.players.filter((p) => !p.isHost);
  const hasMinPlayers = room.players.length >= 2;
  const allNonHostsReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);

  if (hasMinPlayers && allNonHostsReady) {
    room.status = ROOM_STATUS.READY;
  } else {
    room.status = ROOM_STATUS.WAITING;
  }
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

    return `ODD${crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3)}`;
  },

  /**
   * Creates a Public Room with host-configured maxPlayers (2-4) and bookPageCount (100 or 200).
   */
  createPublicRoom: async ({ name, hostPlayer, maxPlayers = 4, bookPageCount = 100 }) => {
    const code = await roomService.getUniqueRoomCode();
    const isDbConnected = getDatabaseStatus().connected;

    const parsedCapacity = parseInt(maxPlayers, 10);
    const validCapacity = ALLOWED_PLAYER_CAPACITIES.includes(parsedCapacity) ? parsedCapacity : 4;

    const parsedPages = parseInt(bookPageCount, 10);
    if (!ALLOWED_PAGE_COUNTS.includes(parsedPages)) {
      const err = new Error('Book page count must be either 100 or 200 pages.');
      err.statusCode = 400;
      throw err;
    }

    const hostColorFamily = (hostPlayer.primaryColor || 'BLUE').toUpperCase();
    const hostShade = ShadeService.assignShade([], hostColorFamily, hostPlayer.playerId);

    const hostEntry = {
      playerId: hostPlayer.playerId,
      nickname: hostPlayer.nickname.trim(),
      primaryColor: hostColorFamily,
      assignedShade: hostShade,
      slotIndex: 0,
      isHost: true,
      isReady: true, // Host is inherently ready
      socketId: hostPlayer.socketId || null,
      isOnline: true,
      territory: createTerritory(0),
      joinedAt: new Date(),
      lastActiveAt: new Date()
    };

    const roomData = {
      code,
      name: name.trim(),
      isPrivate: false,
      passwordHash: null,
      maxPlayers: validCapacity,
      bookPageCount: parsedPages,
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry],
      gameState: {
        turnNumber: 1,
        activePlayerId: hostPlayer.playerId,
        activePlayerIndex: 0,
        isBookFlipping: false,
        lastFlip: null,
        history: []
      }
    };

    if (isDbConnected) {
      const room = await Room.create(roomData);
      logger.info(`[RoomService] Public room created in DB: ${code} (${room.name}) [Pages: ${room.bookPageCount}, Max: ${room.maxPlayers}] by ${hostPlayer.nickname}`);
      return sanitizeRoom(room);
    } else {
      inMemoryRooms.set(code, roomData);
      logger.info(`[RoomService] Public room created in memory: ${code} (${roomData.name}) [Pages: ${roomData.bookPageCount}, Max: ${roomData.maxPlayers}] by ${hostPlayer.nickname}`);
      return sanitizeRoom(roomData);
    }
  },

  /**
   * Creates a Private Room with Password and host-configured settings.
   */
  createPrivateRoom: async ({ name, password, hostPlayer, maxPlayers = 4, bookPageCount = 100 }) => {
    if (!password || password.trim().length === 0) {
      const err = new Error('A private room requires a password.');
      err.statusCode = 400;
      throw err;
    }

    const code = await roomService.getUniqueRoomCode();
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const isDbConnected = getDatabaseStatus().connected;

    const parsedCapacity = parseInt(maxPlayers, 10);
    const validCapacity = ALLOWED_PLAYER_CAPACITIES.includes(parsedCapacity) ? parsedCapacity : 4;

    const parsedPages = parseInt(bookPageCount, 10);
    if (!ALLOWED_PAGE_COUNTS.includes(parsedPages)) {
      const err = new Error('Book page count must be either 100 or 200 pages.');
      err.statusCode = 400;
      throw err;
    }

    const hostColorFamily = (hostPlayer.primaryColor || 'BLUE').toUpperCase();
    const hostShade = ShadeService.assignShade([], hostColorFamily, hostPlayer.playerId);

    const hostEntry = {
      playerId: hostPlayer.playerId,
      nickname: hostPlayer.nickname.trim(),
      primaryColor: hostColorFamily,
      assignedShade: hostShade,
      slotIndex: 0,
      isHost: true,
      isReady: true,
      socketId: hostPlayer.socketId || null,
      isOnline: true,
      territory: createTerritory(0),
      joinedAt: new Date(),
      lastActiveAt: new Date()
    };

    const roomData = {
      code,
      name: name.trim(),
      isPrivate: true,
      passwordHash,
      maxPlayers: validCapacity,
      bookPageCount: parsedPages,
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry],
      gameState: {
        turnNumber: 1,
        activePlayerId: hostPlayer.playerId,
        activePlayerIndex: 0,
        isBookFlipping: false,
        lastFlip: null,
        history: []
      }
    };

    if (isDbConnected) {
      const room = await Room.create(roomData);
      logger.info(`[RoomService] Private room created in DB: ${code} (${room.name}) [Pages: ${room.bookPageCount}, Max: ${room.maxPlayers}]`);
      return sanitizeRoom(room);
    } else {
      inMemoryRooms.set(code, roomData);
      logger.info(`[RoomService] Private room created in memory: ${code} (${roomData.name}) [Pages: ${roomData.bookPageCount}, Max: ${roomData.maxPlayers}]`);
      return sanitizeRoom(roomData);
    }
  },

  /**
   * Updates host-controlled room settings (bookPageCount, maxPlayers, name).
   */
  updateRoomSettings: async ({ code, hostPlayerId, settings = {} }) => {
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

    if (room.hostId !== hostPlayerId) {
      const err = new Error('Only the room host can configure game settings.');
      err.statusCode = 403;
      throw err;
    }

    if (room.status !== ROOM_STATUS.WAITING && room.status !== ROOM_STATUS.READY) {
      const err = new Error(`Cannot change settings while room is ${room.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    if (settings.bookPageCount !== undefined) {
      const pages = parseInt(settings.bookPageCount, 10);
      if (!ALLOWED_PAGE_COUNTS.includes(pages)) {
        const err = new Error('Book page count must be either 100 or 200 pages.');
        err.statusCode = 400;
        throw err;
      }
      room.bookPageCount = pages;
    }

    if (settings.maxPlayers !== undefined) {
      const capacity = parseInt(settings.maxPlayers, 10);
      if (!ALLOWED_PLAYER_CAPACITIES.includes(capacity)) {
        const err = new Error('Player capacity must be 2, 3, or 4 players.');
        err.statusCode = 400;
        throw err;
      }
      if (capacity < room.players.length) {
        const err = new Error(`Cannot set capacity to ${capacity}: room already has ${room.players.length} players joined.`);
        err.statusCode = 400;
        throw err;
      }
      room.maxPlayers = capacity;
    }

    if (settings.name !== undefined) {
      const cleanName = settings.name.trim();
      if (cleanName.length < 3 || cleanName.length > 32) {
        const err = new Error('Room name must be between 3 and 32 characters.');
        err.statusCode = 400;
        throw err;
      }
      room.name = cleanName;
    }

    evaluateRoomReadiness(room);

    if (isDbConnected) {
      await room.save();
    }

    logger.info(`[RoomService] Host updated settings for room ${cleanCode}: Book pages=${room.bookPageCount}, Max players=${room.maxPlayers}`);
    return sanitizeRoom(room);
  },

  /**
   * Lists available Public Rooms that are in WAITING status and not full.
   */
  listPublicRooms: async () => {
    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      const rooms = await Room.find({
        isPrivate: false,
        status: { $in: [ROOM_STATUS.WAITING, ROOM_STATUS.READY] },
        $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] }
      })
        .sort({ createdAt: -1 })
        .limit(30);

      return rooms.map(sanitizeRoom);
    } else {
      const available = [];
      for (const room of inMemoryRooms.values()) {
        if (!room.isPrivate && (room.status === ROOM_STATUS.WAITING || room.status === ROOM_STATUS.READY) && room.players.length < room.maxPlayers) {
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
   * Handles safe reconnects without creating duplicate entries or reassigning shades unnecessarily.
   */
  joinRoom: async ({ code, password, player, socketId = null }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = null;
    let rawPasswordHash = null;

    if (isDbConnected) {
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

    // Cancel any pending disconnect timer for this player
    if (disconnectGraceTimers.has(player.playerId)) {
      clearTimeout(disconnectGraceTimers.get(player.playerId));
      disconnectGraceTimers.delete(player.playerId);
      logger.info(`[RoomService] Cancelled disconnect grace timer for reconnecting player ${player.playerId}`);
    }

    // 1. RECONNECT CHECK: If player is already in this room, update connection state and return
    const existingPlayerIndex = room.players.findIndex((p) => p.playerId === player.playerId);
    if (existingPlayerIndex !== -1) {
      const existing = room.players[existingPlayerIndex];
      existing.isOnline = true;
      existing.lastActiveAt = new Date();
      if (socketId) existing.socketId = socketId;
      
      // Update nickname if changed in profile
      if (player.nickname && player.nickname.trim() !== existing.nickname) {
        existing.nickname = player.nickname.trim();
        if (existing.isHost) room.hostNickname = existing.nickname;
      }

      // If player changed primaryColor family, reassign shade; otherwise keep existing shade
      const requestedColor = (player.primaryColor || existing.primaryColor).toUpperCase();
      if (requestedColor !== existing.primaryColor || !existing.assignedShade) {
        existing.primaryColor = requestedColor;
        existing.assignedShade = ShadeService.assignShade(room.players, requestedColor, player.playerId);
        existing.isReady = existing.isHost; // reset ready if profile changed, host remains ready
      }

      evaluateRoomReadiness(room);

      if (isDbConnected) await room.save();
      logger.info(`[RoomService] Player ${player.nickname} reconnected to room ${cleanCode} (Shade: ${existing.assignedShade?.name})`);
      return sanitizeRoom(room);
    }

    // 2. Status Check for new joiners
    if (room.status !== ROOM_STATUS.WAITING && room.status !== ROOM_STATUS.READY) {
      const err = new Error(`Cannot join room: match is currently ${room.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Capacity Check
    if (room.players.length >= room.maxPlayers) {
      const err = new Error(`Room is full (${room.players.length}/${room.maxPlayers} players).`);
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

    // 5. Assign Next Available Slot (0..3) & Unique Shade
    const takenSlots = new Set(room.players.map((p) => p.slotIndex));
    let nextSlot = 0;
    while (takenSlots.has(nextSlot) && nextSlot < 4) {
      nextSlot++;
    }

    const playerColorFamily = (player.primaryColor || 'BLUE').toUpperCase();
    const assignedShade = ShadeService.assignShade(room.players, playerColorFamily, player.playerId);

    const newPlayerEntry = {
      playerId: player.playerId,
      nickname: player.nickname.trim(),
      primaryColor: playerColorFamily,
      assignedShade,
      slotIndex: nextSlot,
      isHost: false,
      isReady: false, // New joiners start NOT READY
      socketId,
      isOnline: true,
      territory: createTerritory(nextSlot),
      joinedAt: new Date(),
      lastActiveAt: new Date()
    };

    room.players.push(newPlayerEntry);
    evaluateRoomReadiness(room);

    if (isDbConnected) {
      await room.save();
      logger.info(`[RoomService] Player ${player.nickname} joined room ${cleanCode} in DB (${room.players.length}/${room.maxPlayers}) [Assigned Shade: ${assignedShade.name}]`);
      return sanitizeRoom(room);
    } else {
      logger.info(`[RoomService] Player ${player.nickname} joined room ${cleanCode} in memory (${room.players.length}/${room.maxPlayers}) [Assigned Shade: ${assignedShade.name}]`);
      return sanitizeRoom(room);
    }
  },

  /**
   * Toggles readiness for a non-host player.
   */
  setPlayerReady: async ({ code, playerId, isReady }) => {
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

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      const err = new Error('Player not found in this room.');
      err.statusCode = 404;
      throw err;
    }

    // Host readiness is always true; non-hosts can toggle
    if (!player.isHost) {
      player.isReady = Boolean(isReady);
    } else {
      player.isReady = true;
    }

    evaluateRoomReadiness(room);

    if (isDbConnected) {
      await room.save();
    }

    logger.info(`[RoomService] Player ${player.nickname} ready state in room ${cleanCode}: ${player.isReady} (Room status: ${room.status})`);
    return { room: sanitizeRoom(room), player };
  },

  /**
   * Host kicks a target player from the room.
   */
  kickPlayer: async ({ code, hostPlayerId, targetPlayerId }) => {
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

    if (room.hostId !== hostPlayerId) {
      const err = new Error('Only the room host can remove players.');
      err.statusCode = 403;
      throw err;
    }

    if (hostPlayerId === targetPlayerId) {
      const err = new Error('Host cannot kick themselves from the room.');
      err.statusCode = 400;
      throw err;
    }

    const targetIndex = room.players.findIndex((p) => p.playerId === targetPlayerId);
    if (targetIndex === -1) {
      const err = new Error('Target player is not in this room.');
      err.statusCode = 404;
      throw err;
    }

    const kickedPlayer = room.players[targetIndex];
    room.players.splice(targetIndex, 1);

    evaluateRoomReadiness(room);

    if (isDbConnected) {
      await room.save();
    }

    logger.info(`[RoomService] Host ${room.hostNickname} kicked player ${kickedPlayer.nickname} from room ${cleanCode}`);
    return { room: sanitizeRoom(room), kickedPlayer };
  },

  /**
   * Host starts the match.
   * Validates:
   * - Host authorization
   * - Min 2 players
   * - All non-host players ready
   * - Room in WAITING or READY state
   */
  startMatch: async ({ code, hostPlayerId }) => {
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

    if (room.hostId !== hostPlayerId) {
      const err = new Error('Only the room host can start the match.');
      err.statusCode = 403;
      throw err;
    }

    if (room.players.length < 2) {
      const err = new Error('Cannot start match with fewer than two players.');
      err.statusCode = 400;
      throw err;
    }

    const unreadyPlayers = room.players.filter((p) => !p.isHost && !p.isReady);
    if (unreadyPlayers.length > 0) {
      const names = unreadyPlayers.map((p) => p.nickname).join(', ');
      const err = new Error(`Cannot start match: waiting for ${names} to get ready.`);
      err.statusCode = 400;
      throw err;
    }

    if (room.status === ROOM_STATUS.STARTING || room.status === ROOM_STATUS.PLAYING) {
      const err = new Error('Match has already started.');
      err.statusCode = 400;
      throw err;
    }

    room.status = ROOM_STATUS.STARTING;

    if (!room.gameState) {
      room.gameState = {
        turnNumber: 1,
        activePlayerId: room.players[0].playerId,
        activePlayerIndex: 0,
        isBookFlipping: false,
        lastFlip: null,
        history: []
      };
    } else {
      room.gameState.turnNumber = 1;
      room.gameState.activePlayerId = room.players[0].playerId;
      room.gameState.activePlayerIndex = 0;
      room.gameState.isBookFlipping = false;
    }

    if (isDbConnected) {
      await room.save();
    }

    logger.info(`[RoomService] Host ${room.hostNickname} started match for room ${cleanCode}! Transitioned to STARTING.`);
    return sanitizeRoom(room);
  },

  /**
   * Leaves a room.
   */
  leaveRoom: async ({ code, playerId }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    // Clear any disconnect timer
    if (disconnectGraceTimers.has(playerId)) {
      clearTimeout(disconnectGraceTimers.get(playerId));
      disconnectGraceTimers.delete(playerId);
    }

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
      return { code: cleanCode, status: ROOM_STATUS.CANCELLED, message: 'Room empty and cleaned up.', leavingPlayer };
    }

    // Reassign host if previous host left
    if (wasHost) {
      room.players[0].isHost = true;
      room.players[0].isReady = true;
      room.hostId = room.players[0].playerId;
      room.hostNickname = room.players[0].nickname;
      logger.info(`[RoomService] Host left. Reassigned host of room ${cleanCode} to ${room.players[0].nickname}`);
    }

    evaluateRoomReadiness(room);

    if (isDbConnected) {
      await room.save();
    }

    return { ...sanitizeRoom(room), leavingPlayer };
  },

  /**
   * Server-authoritative book page flip (Task 08)
   * Validates:
   * - Room existence
   * - Active player turn
   * - Concurrency lock (prevents duplicate simultaneous flips)
   * Generates cryptographic random page, maps odd rows / even NO ACTION,
   * stores outcome in history, rotates active player, and returns updated room & outcome.
   */
  openBook: async ({ code, playerId, requestId = null }) => {
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

    if (!room.players || room.players.length === 0) {
      const err = new Error('No players found in this room.');
      err.statusCode = 400;
      throw err;
    }

    // Ensure gameState exists
    if (!room.gameState) {
      room.gameState = {
        turnNumber: 1,
        activePlayerId: room.players[0].playerId,
        activePlayerIndex: 0,
        isBookFlipping: false,
        lastFlip: null,
        history: []
      };
    }

    // If activePlayerId is not set, initialize to first player
    if (!room.gameState.activePlayerId) {
      room.gameState.activePlayerId = room.players[0].playerId;
      room.gameState.activePlayerIndex = 0;
    }

    // 1. Turn Validation: Only active player can flip the book
    if (room.gameState.activePlayerId !== playerId) {
      const activePlayer = room.players.find((p) => p.playerId === room.gameState.activePlayerId);
      const activeNickname = activePlayer ? activePlayer.nickname : 'another warrior';
      const err = new Error(`It is not your turn! Currently waiting for ${activeNickname}'s turn.`);
      err.statusCode = 403;
      throw err;
    }

    // 2. Concurrency Lock: Prevent duplicate requests while flipping
    if (room.gameState.isBookFlipping) {
      const err = new Error('The magical book is already flipping! Please wait for the current result.');
      err.statusCode = 409;
      throw err;
    }

    // Set lock
    room.gameState.isBookFlipping = true;

    try {
      const currentParticipant = room.players.find((p) => p.playerId === playerId) || { nickname: 'Warrior' };
      const currentTurnNumber = room.gameState.turnNumber || 1;

      // 3. Cryptographic Draw using room.bookPageCount
      const outcome = BookEngine.drawPage(
        room.bookPageCount,
        playerId,
        currentParticipant.nickname,
        currentTurnNumber
      );

      if (requestId) {
        outcome.requestId = requestId;
      }

      // 4. Update Game State & History
      room.gameState.lastFlip = outcome;
      if (!Array.isArray(room.gameState.history)) {
        room.gameState.history = [];
      }
      room.gameState.history.unshift(outcome);
      if (room.gameState.history.length > 50) {
        room.gameState.history = room.gameState.history.slice(0, 50);
      }

      // 5. Advance Turn Management (round-robin rotation)
      const currentIndex = room.players.findIndex((p) => p.playerId === playerId);
      const nextIndex = (currentIndex + 1) % room.players.length;
      room.gameState.activePlayerIndex = nextIndex;
      room.gameState.activePlayerId = room.players[nextIndex].playerId;
      room.gameState.turnNumber = currentTurnNumber + 1;

      // Release lock
      room.gameState.isBookFlipping = false;

      if (isDbConnected) {
        room.markModified('gameState');
        await room.save();
      }

      logger.info(
        `[RoomService] Book opened in ${cleanCode}: Page ${outcome.pageNumber} (${outcome.actionLabel}) by ${currentParticipant.nickname}. Next turn: ${room.players[nextIndex].nickname}`
      );

      return { room: sanitizeRoom(room), outcome };
    } catch (err) {
      room.gameState.isBookFlipping = false;
      if (isDbConnected) {
        room.markModified('gameState');
        await room.save();
      }
      throw err;
    }
  },

  /**
   * Submits a manual character construction drawing for a player's row station (Task 09).
   * Validates:
   * - Room and player existence
   * - Row ownership (players can only draw in their own territory)
   * - Row identifier (1, 3, 5, 7, 9)
   * - Stage progression sequence: HEAD -> BODY -> GUN -> BULLET
   * - Stroke data limits (max 100 strokes, max 500 points per stroke, max payload size)
   */
  submitDrawing: async ({ code, playerId, rowNumber, stage, strokeData }) => {
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

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      const err = new Error('Player is not in this room.');
      err.statusCode = 403;
      throw err;
    }

    const targetRow = parseInt(rowNumber, 10);
    if (!TERRITORY_ROWS.includes(targetRow)) {
      const err = new Error(`Invalid row station ${rowNumber}. Must be 1, 3, 5, 7, or 9.`);
      err.statusCode = 400;
      throw err;
    }

    const validStages = ['HEAD', 'BODY', 'GUN', 'BULLET'];
    const cleanStage = (stage || '').toUpperCase().trim();
    if (!validStages.includes(cleanStage)) {
      const err = new Error(`Invalid construction stage "${stage}". Must be HEAD, BODY, GUN, or BULLET.`);
      err.statusCode = 400;
      throw err;
    }

    // Ensure player has territory and rowStates
    if (!player.territory) {
      player.territory = createTerritory(player.slotIndex);
    }
    if (!Array.isArray(player.territory.rowStates) || player.territory.rowStates.length === 0) {
      player.territory = createTerritory(player.slotIndex);
    }

    let rowState = player.territory.rowStates.find((r) => r.rowNumber === targetRow);
    if (!rowState) {
      rowState = {
        rowNumber: targetRow,
        status: 'EMPTY',
        currentStage: 'HEAD',
        drawings: {},
        bulletCount: 0,
        bullets: [
          { slot: 1, drawn: false, drawing: null },
          { slot: 2, drawn: false, drawing: null },
          { slot: 3, drawn: false, drawing: null }
        ],
        isEliminated: false
      };
      player.territory.rowStates.push(rowState);
    }

    // 1. Stage Progression State Machine Validation
    if (rowState.isEliminated) {
      const err = new Error(`Cannot draw on Row ${targetRow}: station has been eliminated.`);
      err.statusCode = 400;
      throw err;
    }

    const expectedStage = rowState.currentStage || 'HEAD';
    if (cleanStage !== expectedStage && !(cleanStage === 'BULLET' && expectedStage === 'ARMED')) {
      const err = new Error(
        `Cannot draw ${cleanStage} yet! Row ${targetRow} is currently at stage: ${expectedStage}. Complete stages in sequence: HEAD → BODY → GUN → BULLET.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Stroke Data Payload Validation
    if (!strokeData || typeof strokeData !== 'object') {
      const err = new Error('Invalid stroke data payload.');
      err.statusCode = 400;
      throw err;
    }

    const strokes = Array.isArray(strokeData.strokes) ? strokeData.strokes : (Array.isArray(strokeData) ? strokeData : []);
    if (strokes.length === 0) {
      const err = new Error('Drawing cannot be empty. Please draw at least one pencil stroke.');
      err.statusCode = 400;
      throw err;
    }

    if (strokes.length > 150) {
      const err = new Error(`Too many strokes (${strokes.length}). Maximum allowed is 150 strokes per stage.`);
      err.statusCode = 400;
      throw err;
    }

    // Validate points per stroke
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      if (!Array.isArray(stroke.points) || stroke.points.length === 0) {
        continue;
      }
      if (stroke.points.length > 600) {
        const err = new Error(`Stroke #${i + 1} contains too many points (${stroke.points.length}). Maximum is 600.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Check payload size
    const payloadSize = JSON.stringify(strokeData).length;
    if (payloadSize > 250000) {
      const err = new Error(`Drawing payload too large (${Math.round(payloadSize / 1024)} KB). Maximum allowed is 250 KB.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Authoritative Storage & Stage Advancement
    if (!rowState.drawings) {
      rowState.drawings = {};
    }

    const now = new Date();
    const storedDrawing = {
      stage: cleanStage,
      strokes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    let nextStage = cleanStage;

    if (cleanStage === 'HEAD') {
      rowState.drawings.HEAD = storedDrawing;
      rowState.status = 'HEAD_DRAWN';
      rowState.currentStage = 'BODY';
      nextStage = 'BODY';
    } else if (cleanStage === 'BODY') {
      rowState.drawings.BODY = storedDrawing;
      rowState.status = 'BODY_DRAWN';
      rowState.currentStage = 'GUN';
      nextStage = 'GUN';
    } else if (cleanStage === 'GUN') {
      rowState.drawings.GUN = storedDrawing;
      rowState.status = 'GUN_DRAWN';
      rowState.currentStage = 'BULLET';
      nextStage = 'BULLET';
    } else if (cleanStage === 'BULLET') {
      rowState.drawings.BULLET = storedDrawing;
      const count = (rowState.bulletCount || 0) + 1;
      rowState.bulletCount = Math.min(3, count);
      rowState.status = 'BULLETS_LOADED';

      if (!Array.isArray(rowState.bullets)) {
        rowState.bullets = [
          { slot: 1, drawn: false, drawing: null },
          { slot: 2, drawn: false, drawing: null },
          { slot: 3, drawn: false, drawing: null }
        ];
      }

      if (rowState.bullets[count - 1]) {
        rowState.bullets[count - 1].drawn = true;
        rowState.bullets[count - 1].drawing = storedDrawing;
      }

      if (rowState.bulletCount < 3) {
        rowState.currentStage = 'BULLET';
        nextStage = 'BULLET';
      } else {
        rowState.currentStage = 'ARMED';
        nextStage = 'ARMED';
      }
    }

    if (isDbConnected) {
      room.markModified('players');
      await room.save();
    }

    logger.info(
      `[RoomService] Drawing submitted: ${player.nickname} completed ${cleanStage} on Row ${targetRow} in room ${cleanCode}. Next stage: ${nextStage}`
    );

    return {
      room: sanitizeRoom(room),
      player,
      rowNumber: targetRow,
      stage: cleanStage,
      nextStage,
      drawing: storedDrawing,
      rowState
    };
  },

  /**
   * Handles socket disconnect with a grace period timer to allow clean reconnects.
   */
  handleSocketDisconnect: async (socketId, onPlayerLeftCallback) => {
    const isDbConnected = getDatabaseStatus().connected;

    // Search room where this socketId is present
    let targetRoom = null;
    let targetPlayer = null;

    if (isDbConnected) {
      targetRoom = await Room.findOne({ 'players.socketId': socketId });
      if (targetRoom) {
        targetPlayer = targetRoom.players.find((p) => p.socketId === socketId);
      }
    } else {
      for (const room of inMemoryRooms.values()) {
        const found = room.players.find((p) => p.socketId === socketId);
        if (found) {
          targetRoom = room;
          targetPlayer = found;
          break;
        }
      }
    }

    if (!targetRoom || !targetPlayer) return;

    // Mark as offline immediately
    targetPlayer.isOnline = false;
    targetPlayer.lastActiveAt = new Date();
    if (isDbConnected) await targetRoom.save();

    logger.info(`[RoomService] Player ${targetPlayer.nickname} temporarily disconnected from room ${targetRoom.code}. Starting ${DISCONNECT_GRACE_PERIOD_MS / 1000}s grace timer...`);

    // Set grace timer
    const timer = setTimeout(async () => {
      disconnectGraceTimers.delete(targetPlayer.playerId);
      logger.info(`[RoomService] Disconnect grace timer expired for player ${targetPlayer.nickname}. Evicting from room ${targetRoom.code}...`);
      try {
        const result = await roomService.leaveRoom({
          code: targetRoom.code,
          playerId: targetPlayer.playerId
        });
        if (typeof onPlayerLeftCallback === 'function') {
          onPlayerLeftCallback(targetRoom.code, targetPlayer, result);
        }
      } catch (err) {
        logger.error(`[RoomService] Error evicting disconnected player:`, err.message);
      }
    }, DISCONNECT_GRACE_PERIOD_MS);

    disconnectGraceTimers.set(targetPlayer.playerId, timer);
  }
};
