import { z } from 'zod';
import { roomService } from '../services/roomService.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Zod Validation Schemas
const playerSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  nickname: z.string().min(3, 'Nickname must be at least 3 characters').max(16, 'Nickname cannot exceed 16 characters'),
  primaryColor: z.enum(['RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK']).default('BLUE')
});

const createPublicSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(32, 'Room name cannot exceed 32 characters'),
  maxPlayers: z.number().int().min(2).max(4).default(4),
  player: playerSchema
});

const createPrivateSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(32, 'Room name cannot exceed 32 characters'),
  password: z.string().min(3, 'Password must be at least 3 characters').max(32, 'Password cannot exceed 32 characters'),
  maxPlayers: z.number().int().min(2).max(4).default(4),
  player: playerSchema
});

const joinRoomSchema = z.object({
  code: z.string().min(4).max(10),
  password: z.string().optional(),
  player: playerSchema
});

export const createPublicRoom = async (req, res, next) => {
  try {
    const parsed = createPublicSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { name, maxPlayers, player } = parsed.data;
    const room = await roomService.createPublicRoom({ name, hostPlayer: player, maxPlayers });
    return sendSuccess(res, { room }, 'Public room created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const createPrivateRoom = async (req, res, next) => {
  try {
    const parsed = createPrivateSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { name, password, maxPlayers, player } = parsed.data;
    const room = await roomService.createPrivateRoom({ name, password, hostPlayer: player, maxPlayers });
    return sendSuccess(res, { room }, 'Private room created successfully', 201);
  } catch (err) {
    next(err);
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
