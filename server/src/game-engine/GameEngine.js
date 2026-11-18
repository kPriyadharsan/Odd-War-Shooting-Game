import { logger } from '../utils/logger.js';
import { GameState } from './GameState.js';
import { TickLoop } from './TickLoop.js';

/**
 * Server-Authoritative Game Engine Manager Foundation
 * Manages active match simulations, input processing, and state broadcast loops.
 */
export class GameEngine {
  constructor(ioInstance) {
    this.io = ioInstance;
    this.activeMatches = new Map(); // matchId -> { state, loop }
    logger.info('[GameEngine] Authoritative Game Engine initialized.');
  }

  createMatch(matchId, maxPlayers = 4) {
    const state = new GameState(matchId, maxPlayers);
    const loop = new TickLoop(30, (dt) => this.onTick(matchId, dt));
    this.activeMatches.set(matchId, { state, loop });
    return { state, loop };
  }

  onTick(matchId, deltaTime) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    match.state.tick += 1;
    // Broadcast snapshot when active
    // this.io.to(matchId).emit('game:snapshot', match.state.serializeSnapshot());
  }

  terminateMatch(matchId) {
    const match = this.activeMatches.get(matchId);
    if (match) {
      match.loop.stop();
      this.activeMatches.delete(matchId);
      logger.info(`[GameEngine] Match ${matchId} simulation ended.`);
    }
  }
}
