import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { getRedisAdapter } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { registerRoomHandlers } from './roomHandler.js';
import { registerMatchHandlers } from './matchHandler.js';
import { registerGameHandlers } from './gameHandler.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 20000
  });

  // Attach Redis adapter if configured and connected
  const redisAdapter = getRedisAdapter();
  if (redisAdapter) {
    io.adapter(redisAdapter);
    logger.info('[Socket.IO] Attached Redis adapter for multi-instance scaling.');
  } else {
    logger.info('[Socket.IO] Initialized with default in-memory adapter (single-instance).');
  }

  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // System heartbeat / ping
    socket.on('ping', (data, callback) => {
      if (typeof callback === 'function') {
        callback({ pong: true, serverTime: Date.now() });
      } else {
        socket.emit('pong', { serverTime: Date.now() });
      }
    });

    // Register modular domain event listeners
    registerRoomHandlers(io, socket);
    registerMatchHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return ioInstance;
};
