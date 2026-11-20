import { z } from 'zod';
import { roomService } from '../services/roomService.js';
import { BookEngine } from '../game-engine/BookEngine.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Zod Validation Schemas
const playerSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required').default(() => `player_${Math.random().toString(36).substring(2, 9)}`),
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(20, 'Nickname cannot exceed 20 characters').default('Host Warrior'),
  primaryColor: z.enum(['RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK']).default('BLUE')
}).default({
  playerId: `player_${Math.random().toString(36).substring(2, 9)}`,
  nickname: 'Host Warrior',
  primaryColor: 'BLUE'
});

const createPublicSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(32, 'Room name cannot exceed 32 characters'),
  maxPlayers: z.number().int().refine(n => [2, 3, 4].includes(n), { message: 'Player capacity must be 2, 3, or 4 players' }).default(4),
  bookPageCount: z.number().int().refine(n => [100, 200].includes(n), { message: 'Book page count must be either 100 or 200 pages' }).default(100),
  player: playerSchema.optional().default({
    playerId: `player_${Math.random().toString(36).substring(2, 9)}`,
    nickname: 'Host Warrior',
    primaryColor: 'BLUE'
  })
});

const createPrivateSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(32, 'Room name cannot exceed 32 characters'),
  password: z.string().min(3, 'Password must be at least 3 characters').max(32, 'Password cannot exceed 32 characters'),
  maxPlayers: z.number().int().refine(n => [2, 3, 4].includes(n), { message: 'Player capacity must be 2, 3, or 4 players' }).default(4),
  bookPageCount: z.number().int().refine(n => [100, 200].includes(n), { message: 'Book page count must be either 100 or 200 pages' }).default(100),
  player: playerSchema.optional().default({
    playerId: `player_${Math.random().toString(36).substring(2, 9)}`,
    nickname: 'Host Warrior',
    primaryColor: 'BLUE'
  })
});

const updateSettingsSchema = z.object({
  hostPlayerId: z.string().min(1, 'Host player ID is required to modify room settings'),
  settings: z.object({
    name: z.string().min(3).max(32).optional(),
    maxPlayers: z.number().int().refine(n => [2, 3, 4].includes(n), { message: 'Player capacity must be 2, 3, or 4 players' }).optional(),
    bookPageCount: z.number().int().refine(n => [100, 200].includes(n), { message: 'Book page count must be either 100 or 200 pages' }).optional()
  })
});

const joinRoomSchema = z.object({
  code: z.string().min(4).max(10),
  password: z.string().optional(),
  player: playerSchema
});

export const createPublicRoom = async (req, res, next) => {
  try {
    if (req.user && !req.user.isProfileComplete) {
      return sendError(res, 'Please complete your player profile onboarding before creating or joining games.', 403);
    }
    const parsed = createPublicSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { name, maxPlayers, bookPageCount, player } = parsed.data;
    const room = await roomService.createPublicRoom({ name, hostPlayer: player, maxPlayers, bookPageCount });
    return sendSuccess(res, { room }, 'Public room created successfully', 201);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const createPrivateRoom = async (req, res, next) => {
  try {
    if (req.user && !req.user.isProfileComplete) {
      return sendError(res, 'Please complete your player profile onboarding before creating or joining games.', 403);
    }
    const parsed = createPrivateSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { name, password, maxPlayers, bookPageCount, player } = parsed.data;
    const room = await roomService.createPrivateRoom({ name, password, hostPlayer: player, maxPlayers, bookPageCount });
    return sendSuccess(res, { room }, 'Private room created successfully', 201);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const updateRoomSettings = async (req, res, next) => {
  try {
    const { code } = req.params;
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { hostPlayerId, settings } = parsed.data;
    const updated = await roomService.updateRoomSettings({ code, hostPlayerId, settings });
    return sendSuccess(res, { room: updated }, 'Room settings updated successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const listPublicRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.listPublicRooms();
    return sendSuccess(res, { rooms, count: rooms.length }, 'Available public rooms retrieved');
  } catch (err) {
    next(err);
  }
};

export const getRoomByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) {
      return sendError(res, 'Room code parameter is required', 400);
    }

    const room = await roomService.getRoomByCode(code);
    if (!room) {
      return sendError(res, `Room with code "${code.toUpperCase()}" not found`, 404);
    }

    return sendSuccess(res, { room }, 'Room details retrieved');
  } catch (err) {
    next(err);
  }
};

export const joinRoom = async (req, res, next) => {
  try {
    if (req.user && !req.user.isProfileComplete) {
      return sendError(res, 'Please complete your player profile onboarding before creating or joining games.', 403);
    }
    const parsed = joinRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { code, password, player } = parsed.data;
    const room = await roomService.joinRoom({ code, password, player });
    return sendSuccess(res, { room }, 'Joined room successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId } = req.body;

    if (!code || !playerId) {
      return sendError(res, 'Room code and playerId are required to leave room', 400);
    }

    const result = await roomService.leaveRoom({ code, playerId });
    return sendSuccess(res, { result }, 'Left room successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const setPlayerReady = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId, isReady } = req.body;

    if (!code || !playerId) {
      return sendError(res, 'Room code and playerId are required', 400);
    }

    const result = await roomService.setPlayerReady({
      code,
      playerId,
      isReady: Boolean(isReady)
    });

    return sendSuccess(res, result, 'Player ready state updated');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const kickPlayer = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { hostPlayerId, targetPlayerId } = req.body;

    if (!code || !hostPlayerId || !targetPlayerId) {
      return sendError(res, 'Room code, hostPlayerId, and targetPlayerId are required', 400);
    }

    const result = await roomService.kickPlayer({
      code,
      hostPlayerId,
      targetPlayerId
    });

    return sendSuccess(res, result, 'Player removed from room');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

export const startMatch = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { hostPlayerId } = req.body;

    if (!code || !hostPlayerId) {
      return sendError(res, 'Room code and hostPlayerId are required', 400);
    }

    const room = await roomService.startMatch({
      code,
      hostPlayerId
    });

    return sendSuccess(res, { room }, 'Match started');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Server-authoritative random book page draw endpoint (Task 08)
 * Validates active player turn, performs cryptographic draw, and rotates turn.
 */
export const openRoomBook = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId, requestId } = req.body;

    if (!code || !playerId) {
      return sendError(res, 'Room code and playerId are required to open book', 400);
    }

    const result = await roomService.openBook({
      code,
      playerId,
      requestId
    });

    return sendSuccess(res, result, 'Magical book opened successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Submit manual character drawing for a row (Task 09)
 */
export const submitRowDrawing = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId, rowNumber, stage, strokeData } = req.body;

    if (!code || !playerId || rowNumber === undefined || !stage || !strokeData) {
      return sendError(res, 'code, playerId, rowNumber, stage, and strokeData are required', 400);
    }

    const result = await roomService.submitDrawing({
      code,
      playerId,
      rowNumber,
      stage,
      strokeData
    });

    return sendSuccess(res, result, 'Drawing submitted successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Select combat target (Task 10)
 */
export const selectCombatTarget = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId, attackerRow, targetPlayerId, targetRow } = req.body;

    if (!code || !playerId || attackerRow === undefined || !targetPlayerId || targetRow === undefined) {
      return sendError(
        res,
        'code, playerId, attackerRow, targetPlayerId, and targetRow are required',
        400
      );
    }

    const result = await roomService.selectCombatTarget({
      code,
      playerId,
      attackerRow,
      targetPlayerId,
      targetRow
    });

    return sendSuccess(res, result, 'Combat target selected successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Fire authoritative combat shot (Task 10)
 */
export const fireCombatShot = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId, attackerRow, targetPlayerId, targetRow, actionId } = req.body;

    if (!code || !playerId || attackerRow === undefined || !targetPlayerId || targetRow === undefined) {
      return sendError(
        res,
        'code, playerId, attackerRow, targetPlayerId, and targetRow are required',
        400
      );
    }

    const result = await roomService.fireShot({
      code,
      playerId,
      attackerRow,
      targetPlayerId,
      targetRow,
      actionId
    });

    return sendSuccess(res, result, 'Shot fired successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Pass turn voluntarily (Task 11)
 */
export const passPlayerTurn = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId } = req.body;

    if (!code || !playerId) {
      return sendError(res, 'code and playerId are required to pass turn', 400);
    }

    const result = await roomService.passTurn({
      code,
      playerId
    });

    return sendSuccess(res, result, 'Turn passed successfully');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Transition match to PLAYING state (Task 11)
 */
export const startRoomPlaying = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code) {
      return sendError(res, 'code is required', 400);
    }

    const room = await roomService.startPlaying({ code });
    return sendSuccess(res, { room }, 'Room transitioned to playing');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
};

/**
 * Legacy server-authoritative random book page draw endpoint
 * Validates that drawing uses the room's configured bookPageCount
 */
export const drawRoomBookPage = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { playerId } = req.body;

    const room = await roomService.getRoomByCode(code);
    if (!room) {
      return sendError(res, `Room with code "${code.toUpperCase()}" not found`, 404);
    }

    const outcome = BookEngine.drawPage(room.bookPageCount, playerId);
    return sendSuccess(res, { outcome }, 'Server drew random book page');
  } catch (err) {
    next(err);
  }
};
