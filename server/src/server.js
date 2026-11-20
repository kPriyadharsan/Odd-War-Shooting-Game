import { fileURLToPath } from 'url';
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
import { cookieParser } from './middleware/cookieParser.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

// Security & Parsing Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: (origin, callback) => {
    // Permissive CORS for development, local network mobile testing, and direct tool testing
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Root & Health check routes directly accessible
app.use('/health', healthRoutes);

// Mount API routes under /api and root / for universal compatibility
app.use('/api', apiRoutes);
app.use('/auth', (req, res, next) => {
  req.url = `/auth${req.url}`;
  return apiRoutes(req, res, next);
});
app.use('/rooms', (req, res, next) => {
  req.url = `/rooms${req.url}`;
  return apiRoutes(req, res, next);
});
app.use('/matches', (req, res, next) => {
  req.url = `/matches${req.url}`;
  return apiRoutes(req, res, next);
});
app.use('/stats', (req, res, next) => {
  req.url = `/stats${req.url}`;
  return apiRoutes(req, res, next);
});
app.use('/leaderboard', (req, res, next) => {
  req.url = `/leaderboard${req.url}`;
  return apiRoutes(req, res, next);
});

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap Function
export const startServer = async (portOverride) => {
  try {
    const activePort = portOverride || parseInt(process.env.PORT || config.port, 10);

    logger.info('==========================================');
    logger.info('     ODD WARS GAME SERVER INITIALIZING    ');
    logger.info('==========================================');
    logger.info(`Environment: ${process.env.NODE_ENV || config.nodeEnv}`);
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
    server.listen(activePort, () => {
      logger.info(`[Server] Express + Socket.IO server running on port ${activePort}`);
      logger.info(`[Server] Health Check available at http://localhost:${activePort}/health or http://localhost:${activePort}/api/health`);
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

// Auto-start server unless running in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
