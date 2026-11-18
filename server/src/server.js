import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { initSocketServer } from './sockets/index.js';
import { GameEngine } from './game-engine/GameEngine.js';
import apiRoutes from './routes/index.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Root & Health check routes directly accessible
app.use('/health', healthRoutes);

// Mount API routes under /api
app.use('/api', apiRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap Function
export const startServer = async () => {
  try {
    logger.info('==========================================');
    logger.info('     ODD WARS GAME SERVER INITIALIZING    ');
    logger.info('==========================================');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Configured Client URL: ${config.clientUrl}`);

    // Initialize Database (non-blocking dev mode)
    await connectDatabase();

    // Initialize Redis (non-blocking dev mode)
    await initRedis();

    // Initialize Socket.IO Server
    const io = initSocketServer(server);

    // Initialize Game Engine
    const gameEngine = new GameEngine(io);

    // Start HTTP Server
    server.listen(config.port, () => {
      logger.info(`[Server] Express + Socket.IO server running on port ${config.port}`);
      logger.info(`[Server] Health Check available at http://localhost:${config.port}/health or http://localhost:${config.port}/api/health`);
    });

    return { server, app, io, gameEngine };
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = () => {
  logger.info('[Server] Received termination signal. Shutting down gracefully...');
  server.close(() => {
    logger.info('[Server] HTTP and Socket.IO server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
