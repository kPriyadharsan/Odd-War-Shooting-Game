import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Room, ROOM_STATUS, ALLOWED_PAGE_COUNTS, ALLOWED_PLAYER_CAPACITIES, TERRITORY_ROWS, NOTEBOOK_PAPER_STYLES } from '../models/Room.js';
import { ShadeService } from './shadeService.js';
import { BookEngine } from '../game-engine/BookEngine.js';
import { TurnService } from './turnService.js';
import { matchService } from './matchService.js';
import { GAME_RULES_CONFIG } from '../config/gameRulesConfig.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory room store fallback for development mode when MongoDB is not running.
 * Key: roomCode -> Room Object
 */
export const inMemoryRooms = new Map();

/**
 * Checks if a room has concluded and records authoritative match results idempotently.
 */
const checkAndRecordMatchFinish = async (room) => {
  if (room && room.status === ROOM_STATUS.FINISHED && !room.gameState?.matchRecordSaved) {
    try {
      await matchService.recordCompletedMatch(room);
    } catch (err) {
      logger.error(`[RoomService] Failed to record completed match:`, err);
    }
  }
};

/**
 * Helper to fetch internal room representation (used in test harnesses)
 */
export const getInternalRoom = (code) => {
  return inMemoryRooms.get((code || '').toUpperCase().trim());
};

/**
 * Disconnection grace timers for temporary network disconnects
 * Key: playerId -> NodeJS.Timeout
 */
const disconnectGraceTimers = new Map();
const DISCONNECT_GRACE_PERIOD_MS = GAME_RULES_CONFIG.disconnectGracePeriodMs; // 60 seconds configurable grace period

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
      { slot: 1, state: 'EMPTY', drawn: false, drawing: null },
      { slot: 2, state: 'EMPTY', drawn: false, drawing: null },
      { slot: 3, state: 'EMPTY', drawn: false, drawing: null }
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

    const randomPaperStyle = NOTEBOOK_PAPER_STYLES[Math.floor(Math.random() * NOTEBOOK_PAPER_STYLES.length)] || 'classic-blue';

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
      paperStyle: randomPaperStyle,
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry],
      gameState: {
        turnNumber: 1,
        activePlayerId: hostPlayer.playerId,
        activePlayerIndex: 0,
        paperStyle: randomPaperStyle,
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

    const randomPaperStyle = NOTEBOOK_PAPER_STYLES[Math.floor(Math.random() * NOTEBOOK_PAPER_STYLES.length)] || 'classic-blue';

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
      paperStyle: randomPaperStyle,
      status: ROOM_STATUS.WAITING,
      hostId: hostPlayer.playerId,
      hostNickname: hostPlayer.nickname.trim(),
      players: [hostEntry],
      gameState: {
        turnNumber: 1,
        activePlayerId: hostPlayer.playerId,
        activePlayerIndex: 0,
        paperStyle: randomPaperStyle,
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

    // Initialize deterministic turn order and turn management (Task 11)
    TurnService.initializeMatchTurns(room);

    if (isDbConnected) {
      room.markModified('gameState');
      await room.save();
    }

    logger.info(`[RoomService] Host ${room.hostNickname} started match for room ${cleanCode}! Transitioned to STARTING.`);
    return sanitizeRoom(room);
  },

  /**
   * Authoritatively transitions room from STARTING to PLAYING when battlefield is entered.
   */
  startPlaying: async ({ code }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = isDbConnected ? await Room.findOne({ code: cleanCode }) : inMemoryRooms.get(cleanCode);
    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error(`Match is ${room.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    if (room.status === ROOM_STATUS.STARTING || room.status === ROOM_STATUS.READY) {
      room.status = ROOM_STATUS.PLAYING;
      if (!room.gameState?.turnOrder || room.gameState.turnOrder.length === 0) {
        TurnService.initializeMatchTurns(room);
      }
      if (isDbConnected) {
        room.markModified('gameState');
        await room.save();
      }
      logger.info(`[RoomService] Room ${cleanCode} transitioned to PLAYING! Turn #1 active.`);
    }

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

    // If match was in progress and only 1 player remains, declare survivor victorious
    if (room.status === ROOM_STATUS.PLAYING && room.players.length === 1) {
      room.status = ROOM_STATUS.FINISHED;
      if (!room.gameState) room.gameState = {};
      room.gameState.winnerId = room.players[0].playerId;
      room.gameState.winnerNickname = room.players[0].nickname;
      logger.info(`[RoomService] Match won by forfeit in room ${cleanCode}. Survivor: ${room.players[0].nickname}`);
      await checkAndRecordMatchFinish(room);
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

    // Match Lifecycle Verification (Task 11)
    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error(`Match is ${room.status.toLowerCase()}. No further actions can be taken.`);
      err.statusCode = 400;
      throw err;
    }

    // Auto-transition from STARTING to PLAYING when gameplay begins
    if (room.status === ROOM_STATUS.STARTING || room.status === ROOM_STATUS.READY) {
      room.status = ROOM_STATUS.PLAYING;
    }

    // Ensure gameState and turn order exist
    if (!room.gameState || !room.gameState.turnOrder || room.gameState.turnOrder.length === 0) {
      TurnService.initializeMatchTurns(room);
    }

    const currentParticipant = room.players.find((p) => p.playerId === playerId);
    if (!currentParticipant) {
      const err = new Error('Player is not in this room.');
      err.statusCode = 404;
      throw err;
    }

    if (currentParticipant.isEliminated) {
      const err = new Error('Eliminated players cannot open the magical book.');
      err.statusCode = 403;
      throw err;
    }

    // 1. Turn Validation: Only active player can flip the book
    if (room.gameState.activePlayerId !== playerId) {
      const activePlayer = room.players.find((p) => p.playerId === room.gameState.activePlayerId);
      const activeNickname = activePlayer ? activePlayer.nickname : 'another warrior';
      const err = new Error(`It is not your turn! Currently waiting for ${activeNickname}'s turn.`);
      err.statusCode = 403;
      throw err;
    }

    // 2. Turn Phase Validation: Prevent duplicate book opening on the same turn
    if (room.gameState.turnPhase && room.gameState.turnPhase !== 'AWAITING_BOOK') {
      const err = new Error(
        'The book has already been opened for this turn. Awaiting action completion.'
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Concurrency Lock: Prevent duplicate requests while flipping
    if (room.gameState.isBookFlipping) {
      const err = new Error('The magical book is already flipping! Please wait for the current result.');
      err.statusCode = 409;
      throw err;
    }

    // Set lock
    room.gameState.isBookFlipping = true;

    try {
      const currentTurnNumber = room.gameState.turnNumber || 1;

      // 4. Cryptographic Draw using room.bookPageCount
      const outcome = BookEngine.drawPage(
        room.bookPageCount,
        playerId,
        currentParticipant.nickname,
        currentTurnNumber
      );

      if (requestId) {
        outcome.requestId = requestId;
      }

      // 5. Authoritatively determine eligible action (Task 11)
      const eligibleAction = TurnService.determineEligibleAction(
        currentParticipant,
        outcome.targetRow,
        outcome.isOdd
      );

      outcome.eligibleAction = eligibleAction;
      outcome.actionLabel = outcome.isOdd ? `ROW ${outcome.targetRow}` : 'NO ACTION';
      room.gameState.lastFlip = outcome;

      let turnAdvanced = false;
      let nextTurn = null;

      // 6. Handle NO ACTION (Even final digit or eliminated row)
      if (eligibleAction.type === 'NO_ACTION') {
        // Record in Turn History
        TurnService.recordTurnHistory(room, {
          turnNumber: currentTurnNumber,
          turnId: room.gameState.currentTurn?.turnId,
          playerId,
          nickname: currentParticipant.nickname,
          pageNumber: outcome.pageNumber,
          targetRow: outcome.targetRow,
          isOdd: outcome.isOdd,
          actionType: 'NO_ACTION',
          description: eligibleAction.description
        });

        // If policy is AUTO_ADVANCE, immediately advance to next alive player
        if (GAME_RULES_CONFIG.noActionPolicy === 'AUTO_ADVANCE') {
          nextTurn = TurnService.advanceToNextTurn(room);
          turnAdvanced = true;
          await checkAndRecordMatchFinish(room);
        } else {
          room.gameState.turnPhase = 'AWAITING_ACTION';
          if (room.gameState.currentTurn) {
            room.gameState.currentTurn.phase = 'AWAITING_ACTION';
            room.gameState.currentTurn.eligibleAction = eligibleAction;
          }
        }
      } else {
        // Odd digit with eligible construction or combat action
        room.gameState.turnPhase = 'AWAITING_ACTION';
        if (!room.gameState.currentTurn) {
          room.gameState.currentTurn = {
            turnId: `turn_${currentTurnNumber}_${Date.now()}`,
            turnNumber: currentTurnNumber,
            playerId,
            playerNickname: currentParticipant.nickname
          };
        }
        room.gameState.currentTurn.phase = 'AWAITING_ACTION';
        room.gameState.currentTurn.bookOutcome = outcome;
        room.gameState.currentTurn.eligibleAction = eligibleAction;
      }

      // Release lock
      room.gameState.isBookFlipping = false;

      if (isDbConnected) {
        room.markModified('gameState');
        await room.save();
      }

      logger.info(
        `[RoomService] Book opened in ${cleanCode}: Page ${outcome.pageNumber} (${outcome.actionLabel}) by ${currentParticipant.nickname}. Eligible: ${eligibleAction.type}. Turn advanced: ${turnAdvanced}`
      );

      return {
        room: sanitizeRoom(room),
        outcome,
        eligibleAction,
        turnAdvanced,
        nextTurn
      };
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

    // Match Lifecycle Verification (Task 11)
    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error(`Match is ${room.status.toLowerCase()}. No further actions accepted.`);
      err.statusCode = 400;
      throw err;
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      const err = new Error('Player is not in this room.');
      err.statusCode = 403;
      throw err;
    }

    if (player.isEliminated) {
      const err = new Error('Eliminated players cannot submit drawings.');
      err.statusCode = 403;
      throw err;
    }

    // Active Player Turn Check
    if (room.gameState?.activePlayerId && room.gameState.activePlayerId !== playerId) {
      const activePlayer = room.players.find((p) => p.playerId === room.gameState.activePlayerId);
      const activeNickname = activePlayer ? activePlayer.nickname : 'another warrior';
      const err = new Error(`It is not your turn! Currently waiting for ${activeNickname}'s turn.`);
      err.statusCode = 403;
      throw err;
    }

    const targetRow = parseInt(rowNumber, 10);
    if (!TERRITORY_ROWS.includes(targetRow)) {
      const err = new Error(`Invalid row station ${rowNumber}. Must be 1, 3, 5, 7, or 9.`);
      err.statusCode = 400;
      throw err;
    }

    // Target row match check against currentTurn eligible action
    const currentTurn = room.gameState?.currentTurn;
    if (currentTurn?.eligibleAction && currentTurn.eligibleAction.targetRow !== null) {
      if (currentTurn.eligibleAction.targetRow !== targetRow) {
        const err = new Error(
          `You can only draw on Row ${currentTurn.eligibleAction.targetRow} selected by the Magical Book.`
        );
        err.statusCode = 400;
        throw err;
      }
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

      if (!Array.isArray(rowState.bullets)) {
        rowState.bullets = [
          { slot: 1, state: 'EMPTY', drawn: false, drawing: null },
          { slot: 2, state: 'EMPTY', drawn: false, drawing: null },
          { slot: 3, state: 'EMPTY', drawn: false, drawing: null }
        ];
      }

      const emptySlot = rowState.bullets.find((b) => b.state === 'EMPTY') || rowState.bullets[0];
      if (emptySlot) {
        emptySlot.state = 'LOADED';
        emptySlot.drawn = true;
        emptySlot.drawing = storedDrawing;
      }

      rowState.bulletCount = rowState.bullets.filter((b) => b.state === 'LOADED').length;
      rowState.status = 'BULLETS_LOADED';

      const hasMoreEmptySlots = rowState.bullets.some((b) => b.state === 'EMPTY');
      if (hasMoreEmptySlots) {
        rowState.currentStage = 'BULLET';
        nextStage = 'BULLET';
      } else {
        rowState.currentStage = 'ARMED';
        nextStage = 'ARMED';
      }
    }

    // 4. Record Turn History & Advance Turn (Task 11)
    TurnService.recordTurnHistory(room, {
      turnNumber: room.gameState?.turnNumber || 1,
      turnId: currentTurn?.turnId,
      playerId,
      nickname: player.nickname,
      pageNumber: currentTurn?.bookOutcome?.pageNumber || null,
      targetRow,
      isOdd: true,
      actionType: 'DRAW',
      stage: cleanStage,
      description: `Completed ${cleanStage} on Row ${targetRow}.`
    });

    const nextTurn = TurnService.advanceToNextTurn(room);
    await checkAndRecordMatchFinish(room);

    if (isDbConnected) {
      room.markModified('players');
      room.markModified('gameState');
      await room.save();
    }

    logger.info(
      `[RoomService] Drawing submitted: ${player.nickname} completed ${cleanStage} on Row ${targetRow} in room ${cleanCode}. Next stage: ${nextStage}. Turn advanced: ${Boolean(nextTurn)}`
    );

    return {
      room: sanitizeRoom(room),
      player,
      rowNumber: targetRow,
      stage: cleanStage,
      nextStage,
      drawing: storedDrawing,
      rowState,
      nextTurn
    };
  },

  /**
   * Selects an attack target for the active player (Task 10).
   * Validates active player turn, attacker row eligibility, opponent ownership, and row availability.
   */
  selectCombatTarget: async ({ code, playerId, attackerRow, targetPlayerId, targetRow }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = isDbConnected ? await Room.findOne({ code: cleanCode }) : inMemoryRooms.get(cleanCode);
    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error('Match has already ended.');
      err.statusCode = 400;
      throw err;
    }

    // Active player turn check
    if (room.gameState?.activePlayerId && room.gameState.activePlayerId !== playerId) {
      const activePlayer = room.players.find((p) => p.playerId === room.gameState.activePlayerId);
      const activeNickname = activePlayer ? activePlayer.nickname : 'another player';
      const err = new Error(`Not your turn! Currently waiting for ${activeNickname}'s turn.`);
      err.statusCode = 403;
      throw err;
    }

    // Attacker player & row validation
    const attacker = room.players.find((p) => p.playerId === playerId);
    if (!attacker) {
      const err = new Error('Attacking player not found in room.');
      err.statusCode = 404;
      throw err;
    }
    if (attacker.isEliminated) {
      const err = new Error('Eliminated players cannot target or attack.');
      err.statusCode = 400;
      throw err;
    }

    const aRowNum = parseInt(attackerRow, 10);
    const attackerRowState = attacker.territory?.rowStates?.find((r) => r.rowNumber === aRowNum);
    if (!attackerRowState) {
      const err = new Error(`Attacker row ${attackerRow} not found.`);
      err.statusCode = 404;
      throw err;
    }
    if (attackerRowState.isEliminated) {
      const err = new Error(`Cannot attack from Row ${aRowNum}: row has been eliminated.`);
      err.statusCode = 400;
      throw err;
    }

    // Ammunition check
    const hasLoadedBullet =
      Array.isArray(attackerRowState.bullets) &&
      attackerRowState.bullets.some((b) => b.state === 'LOADED');
    if (!hasLoadedBullet) {
      const err = new Error(`Row ${aRowNum} has no loaded ammunition to attack.`);
      err.statusCode = 400;
      throw err;
    }

    // Target validation
    if (targetPlayerId === playerId) {
      const err = new Error('Friendly fire blocked! You cannot attack your own territory.');
      err.statusCode = 400;
      throw err;
    }

    const targetPlayer = room.players.find((p) => p.playerId === targetPlayerId);
    if (!targetPlayer) {
      const err = new Error('Target opponent not found in room.');
      err.statusCode = 404;
      throw err;
    }
    if (targetPlayer.isEliminated) {
      const err = new Error('Target opponent is already defeated.');
      err.statusCode = 400;
      throw err;
    }

    const tRowNum = parseInt(targetRow, 10);
    if (!TERRITORY_ROWS.includes(tRowNum)) {
      const err = new Error(`Invalid target row ${targetRow}. Must be 1, 3, 5, 7, or 9.`);
      err.statusCode = 400;
      throw err;
    }

    const targetRowState = targetPlayer.territory?.rowStates?.find((r) => r.rowNumber === tRowNum);
    if (!targetRowState) {
      const err = new Error(`Target row ${tRowNum} not found on opponent territory.`);
      err.statusCode = 404;
      throw err;
    }
    if (targetRowState.isEliminated) {
      const err = new Error(
        `Row ${tRowNum} of ${targetPlayer.nickname} is already eliminated! Choose an active row.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Set selection in game state
    if (!room.gameState) room.gameState = {};
    room.gameState.selectedTarget = {
      attackerPlayerId: playerId,
      attackerRow: aRowNum,
      targetPlayerId,
      targetNickname: targetPlayer.nickname,
      targetRow: tRowNum,
      timestamp: new Date().toISOString()
    };

    if (isDbConnected) {
      room.markModified('gameState');
      await room.save();
    }

    logger.info(
      `[CombatService] ${attacker.nickname} targeted ${targetPlayer.nickname}'s Row ${tRowNum} from Row ${aRowNum} in room ${cleanCode}`
    );

    return {
      room: sanitizeRoom(room),
      selectedTarget: room.gameState.selectedTarget
    };
  },

  /**
   * Fires a shot from an armed row station at an opponent row (Task 10).
   * Validates combat readiness, consumes 1 loaded bullet, eliminates the target row,
   * evaluates player elimination and victory conditions.
   */
  fireShot: async ({ code, playerId, actionId, attackerRow, targetPlayerId, targetRow }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = isDbConnected ? await Room.findOne({ code: cleanCode }) : inMemoryRooms.get(cleanCode);
    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error(`Match is ${room.status.toLowerCase()}. No further actions accepted.`);
      err.statusCode = 400;
      throw err;
    }

    // 1. Turn Validation
    if (room.gameState?.activePlayerId && room.gameState.activePlayerId !== playerId) {
      const activePlayer = room.players.find((p) => p.playerId === room.gameState.activePlayerId);
      const activeNickname = activePlayer ? activePlayer.nickname : 'another warrior';
      const err = new Error(`Not your turn! Waiting for ${activeNickname} to act.`);
      err.statusCode = 403;
      throw err;
    }

    // Target row match check against currentTurn eligible action
    const currentTurn = room.gameState?.currentTurn;
    if (currentTurn?.eligibleAction && currentTurn.eligibleAction.targetRow !== null) {
      if (currentTurn.eligibleAction.targetRow !== parseInt(attackerRow, 10)) {
        const err = new Error(
          `Attacking row must match Row ${currentTurn.eligibleAction.targetRow} selected by the Magical Book.`
        );
        err.statusCode = 400;
        throw err;
      }
      if (!currentTurn.eligibleAction.canAttack) {
        const err = new Error(`Row ${attackerRow} is not eligible to attack.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Attacker Validation
    const attacker = room.players.find((p) => p.playerId === playerId);
    if (!attacker) {
      const err = new Error('Attacking player not found in room.');
      err.statusCode = 404;
      throw err;
    }
    if (attacker.isEliminated) {
      const err = new Error('Eliminated players cannot fire.');
      err.statusCode = 400;
      throw err;
    }

    const aRowNum = parseInt(attackerRow, 10);
    const attackerRowState = attacker.territory?.rowStates?.find((r) => r.rowNumber === aRowNum);
    if (!attackerRowState) {
      const err = new Error(`Attacking row ${attackerRow} not found.`);
      err.statusCode = 404;
      throw err;
    }
    if (attackerRowState.isEliminated) {
      const err = new Error(`Row ${aRowNum} has been eliminated and cannot attack.`);
      err.statusCode = 400;
      throw err;
    }

    // Construction stage validation: HEAD, BODY, GUN must be drawn
    const hasHead = Boolean(attackerRowState.drawings?.HEAD);
    const hasBody = Boolean(attackerRowState.drawings?.BODY);
    const hasGun = Boolean(attackerRowState.drawings?.GUN);
    if (!hasHead || !hasBody || !hasGun) {
      const err = new Error(
        `Row ${aRowNum} is not combat-ready! Must complete HEAD, BODY, and GUN before firing.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Ammunition check: find first LOADED bullet
    if (!Array.isArray(attackerRowState.bullets)) {
      const err = new Error(`Row ${aRowNum} has no ammunition loaded.`);
      err.statusCode = 400;
      throw err;
    }
    const loadedBulletSlot = attackerRowState.bullets.find((b) => b.state === 'LOADED');
    if (!loadedBulletSlot) {
      const err = new Error(`Cannot fire from Row ${aRowNum}: All ammunition has been expended.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Target Validation
    if (targetPlayerId === playerId) {
      const err = new Error('Friendly fire blocked! You cannot attack your own territory.');
      err.statusCode = 400;
      throw err;
    }

    const targetPlayer = room.players.find((p) => p.playerId === targetPlayerId);
    if (!targetPlayer) {
      const err = new Error('Target opponent not found in room.');
      err.statusCode = 404;
      throw err;
    }
    if (targetPlayer.isEliminated) {
      const err = new Error(`${targetPlayer.nickname} has already been eliminated from this match.`);
      err.statusCode = 400;
      throw err;
    }

    const tRowNum = parseInt(targetRow, 10);
    if (!TERRITORY_ROWS.includes(tRowNum)) {
      const err = new Error(`Invalid target row station ${targetRow}. Must be 1, 3, 5, 7, or 9.`);
      err.statusCode = 400;
      throw err;
    }

    const targetRowState = targetPlayer.territory?.rowStates?.find((r) => r.rowNumber === tRowNum);
    if (!targetRowState) {
      const err = new Error(`Target row ${tRowNum} not found on ${targetPlayer.nickname}'s territory.`);
      err.statusCode = 404;
      throw err;
    }
    if (targetRowState.isEliminated) {
      const err = new Error(
        `Row ${tRowNum} of ${targetPlayer.nickname} is already eliminated! Target an active station.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Combat Execution & State Transitions
    // A. Consume 1 loaded bullet (LOADED -> FIRED)
    loadedBulletSlot.state = 'FIRED';
    attackerRowState.bulletCount = attackerRowState.bullets.filter((b) => b.state === 'LOADED').length;
    if (attackerRowState.bulletCount === 0) {
      attackerRowState.status = 'GUN_DRAWN'; // Needs reload
    }

    // B. Eliminate Target Row
    targetRowState.isEliminated = true;
    targetRowState.status = 'ELIMINATED';

    // C. Check if Target Player is completely eliminated (all 5 rows destroyed)
    const targetAliveRows = targetPlayer.territory.rowStates.filter((r) => !r.isEliminated);
    const targetPlayerEliminated = targetAliveRows.length === 0;
    if (targetPlayerEliminated) {
      targetPlayer.isEliminated = true;
      logger.info(
        `[CombatService] Player ${targetPlayer.nickname} has been fully eliminated from room ${cleanCode}!`
      );
    }

    // D. Victory Evaluation
    const remainingAlivePlayers = room.players.filter((p) => !p.isEliminated);
    let matchFinished = false;
    let winnerId = null;
    let winnerNickname = null;

    if (remainingAlivePlayers.length <= 1) {
      matchFinished = true;
      room.status = ROOM_STATUS.FINISHED;
      if (remainingAlivePlayers.length === 1) {
        winnerId = remainingAlivePlayers[0].playerId;
        winnerNickname = remainingAlivePlayers[0].nickname;
        room.gameState.winnerId = winnerId;
        room.gameState.winnerNickname = winnerNickname;
        logger.info(`[CombatService] VICTORY DECLARED in room ${cleanCode}! Winner: ${winnerNickname}`);
      } else {
        // Double knock-out / tie
        room.gameState.winnerId = 'TIE';
        room.gameState.winnerNickname = 'Tie';
      }
    }

    // E. Record Combat Log Event
    const shotEvent = {
      actionId: actionId || `shot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      turnNumber: room.gameState.turnNumber || 1,
      attackerPlayerId: playerId,
      attackerNickname: attacker.nickname,
      attackerRow: aRowNum,
      targetPlayerId,
      targetNickname: targetPlayer.nickname,
      targetRow: tRowNum,
      consumedBulletSlot: loadedBulletSlot.slot,
      remainingBullets: attackerRowState.bulletCount,
      targetRowEliminated: true,
      targetPlayerEliminated,
      matchFinished,
      winnerId,
      winnerNickname,
      timestamp: new Date().toISOString()
    };

    if (!Array.isArray(room.gameState.combatLog)) {
      room.gameState.combatLog = [];
    }
    room.gameState.combatLog.unshift(shotEvent);
    if (room.gameState.combatLog.length > 50) {
      room.gameState.combatLog = room.gameState.combatLog.slice(0, 50);
    }
    room.gameState.selectedTarget = null; // Clear active target

    // F. Record in Turn History & Advance Turn (Task 11)
    TurnService.recordTurnHistory(room, {
      turnNumber: room.gameState?.turnNumber || 1,
      turnId: currentTurn?.turnId,
      playerId,
      nickname: attacker.nickname,
      pageNumber: currentTurn?.bookOutcome?.pageNumber || null,
      targetRow: aRowNum,
      isOdd: true,
      actionType: 'ATTACK',
      attackDetails: shotEvent,
      description: `Fired from Row ${aRowNum} at ${targetPlayer.nickname}'s Row ${tRowNum} (${shotEvent.targetRowEliminated ? 'Eliminated' : 'Hit'}).`
    });

    const nextTurn = TurnService.advanceToNextTurn(room);
    await checkAndRecordMatchFinish(room);

    if (isDbConnected) {
      room.markModified('players');
      room.markModified('gameState');
      await room.save();
    }

    logger.info(
      `[CombatService] Shot fired: ${attacker.nickname} (Row ${aRowNum}) eliminated ${targetPlayer.nickname}'s Row ${tRowNum}. Bullets left: ${attackerRowState.bulletCount}. Match finished: ${matchFinished}`
    );

    return {
      room: sanitizeRoom(room),
      shotEvent,
      nextTurn
    };
  },

  /**
   * Passes the active player's turn (Task 11).
   */
  passTurn: async ({ code, playerId }) => {
    const cleanCode = (code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    let room = isDbConnected ? await Room.findOne({ code: cleanCode }) : inMemoryRooms.get(cleanCode);
    if (!room) {
      const err = new Error(`Room with code "${cleanCode}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      const err = new Error(`Match is ${room.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    if (room.gameState?.activePlayerId && room.gameState.activePlayerId !== playerId) {
      const err = new Error('It is not your turn to pass.');
      err.statusCode = 403;
      throw err;
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player || player.isEliminated) {
      const err = new Error('Eliminated players cannot pass turns.');
      err.statusCode = 400;
      throw err;
    }

    const currentTurn = room.gameState?.currentTurn;

    TurnService.recordTurnHistory(room, {
      turnNumber: room.gameState?.turnNumber || 1,
      turnId: currentTurn?.turnId,
      playerId,
      nickname: player.nickname,
      pageNumber: currentTurn?.bookOutcome?.pageNumber || null,
      targetRow: currentTurn?.eligibleAction?.targetRow || null,
      isOdd: currentTurn?.bookOutcome?.isOdd || false,
      actionType: 'PASS',
      description: `${player.nickname} passed their turn.`
    });

    const nextTurn = TurnService.advanceToNextTurn(room);
    await checkAndRecordMatchFinish(room);

    if (isDbConnected) {
      room.markModified('gameState');
      await room.save();
    }

    logger.info(`[RoomService] Player ${player.nickname} passed turn in room ${cleanCode}.`);

    return {
      room: sanitizeRoom(room),
      nextTurn
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
