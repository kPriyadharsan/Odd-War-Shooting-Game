/**
 * Game State Data Model Foundation
 * Holds the authoritative state of a running match (players, projectiles, obstacles).
 */
export class GameState {
  constructor(matchId, maxPlayers = 4) {
    this.matchId = matchId;
    this.maxPlayers = maxPlayers;
    this.tick = 0;
    this.players = new Map(); // socketId -> playerState
    this.projectiles = [];
    this.status = 'waiting'; // 'waiting', 'countdown', 'active', 'finished'
    this.createdAt = Date.now();
  }

  addPlayer(socketId, username, slotIndex) {
    this.players.set(socketId, {
      id: socketId,
      username,
      slotIndex,
      x: 0,
      y: 0,
      rotation: 0,
      health: 100,
      isAlive: true,
      score: 0
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  serializeSnapshot() {
    return {
      matchId: this.matchId,
      tick: this.tick,
      timestamp: Date.now(),
      players: Array.from(this.players.values()),
      projectiles: this.projectiles
    };
  }
}
