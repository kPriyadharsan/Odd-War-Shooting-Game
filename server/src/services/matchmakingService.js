import { logger } from '../utils/logger.js';

/**
 * Matchmaking Service Foundation
 * Manages player queues, MMR/Elo matching, and lobby allocation (2-4 players).
 */
export const matchmakingService = {
  queue: [],

  enqueuePlayer: (playerData) => {
    logger.debug(`[Matchmaking] Enqueuing player ${playerData.username}`);
    // Queue and pairing logic will be implemented in Task 02
  },

  dequeuePlayer: (socketId) => {
    logger.debug(`[Matchmaking] Dequeuing socket ${socketId}`);
  }
};
