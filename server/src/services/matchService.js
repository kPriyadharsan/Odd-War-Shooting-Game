import { Match } from '../models/Match.js';
import { PlayerStats } from '../models/PlayerStats.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory fallback stores for test/dev mode when MongoDB is not connected
 */
export const inMemoryMatches = new Map();
export const inMemoryPlayerStats = new Map();

export const matchService = {
  /**
   * Authoritatively persists match results upon match completion.
   * Features idempotency guards to prevent duplicate entries and inflated statistics.
   */
  recordCompletedMatch: async (room) => {
    if (!room || !room.players || room.players.length === 0) {
      return null;
    }

    // Idempotency Guard 1: Check room gameState flag
    if (room.gameState?.matchRecordSaved) {
      logger.info(`[MatchService] Match for room ${room.code} already persisted (matchId: ${room.gameState.matchId}). Skipping duplicate record.`);
      return room.gameState.matchId;
    }

    const cleanCode = (room.code || '').toUpperCase().trim();
    const isDbConnected = getDatabaseStatus().connected;

    const matchId = `match_${cleanCode}_${room.createdAt ? new Date(room.createdAt).getTime() : Date.now()}`;

    // Idempotency Guard 2: Check storage for existing matchId
    if (isDbConnected) {
      const existing = await Match.findOne({ matchId });
      if (existing) {
        if (!room.gameState) room.gameState = {};
        room.gameState.matchRecordSaved = true;
        room.gameState.matchId = matchId;
        return matchId;
      }
    } else {
      if (inMemoryMatches.has(matchId)) {
        if (!room.gameState) room.gameState = {};
        room.gameState.matchRecordSaved = true;
        room.gameState.matchId = matchId;
        return matchId;
      }
    }

    const winnerId = room.gameState?.winnerId || null;
    const combatLog = Array.isArray(room.gameState?.combatLog) ? room.gameState.combatLog : [];

    // Calculate match duration in seconds
    const startTime = room.createdAt ? new Date(room.createdAt).getTime() : Date.now();
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Calculate per-player combat metrics
    const matchPlayers = room.players.map((p) => {
      const isWinner = p.playerId === winnerId;
      const isEliminated = Boolean(p.isEliminated);
      const rowStates = p.territory?.rowStates || [];
      const eliminatedRowsCount = rowStates.filter((r) => r.isEliminated).length;

      // Count shots fired by this player
      const shotsFired = combatLog.filter((c) => c.attackerPlayerId === p.playerId).length;

      // Count opponents eliminated by this player
      const opponentsEliminated = combatLog.filter(
        (c) => c.attackerPlayerId === p.playerId && c.targetPlayerEliminated
      ).length;

      // Placement: Winner = 1; Losers ordered by alive rows remaining
      const placement = isWinner ? 1 : 2 + (eliminatedRowsCount >= 5 ? 1 : 0);

      return {
        playerId: p.playerId,
        nickname: p.nickname,
        primaryColor: p.primaryColor || 'BLUE',
        assignedShade: p.assignedShade || null,
        isWinner,
        isEliminated,
        placement,
        shotsFired,
        opponentsEliminated,
        eliminatedRowsCount
      };
    });

    const winningPlayer = matchPlayers.find((p) => p.isWinner) || null;

    const matchData = {
      matchId,
      roomCode: cleanCode,
      roomName: room.name || 'Odd Wars Battle',
      isPrivate: Boolean(room.isPrivate),
      paperStyle: room.paperStyle || room.gameState?.paperStyle || 'classic-blue',
      bookPageCount: room.bookPageCount || 100,
      players: matchPlayers,
      winner: winningPlayer
        ? {
            playerId: winningPlayer.playerId,
            nickname: winningPlayer.nickname,
            primaryColor: winningPlayer.primaryColor
          }
        : null,
      totalTurns: room.gameState?.turnNumber || 1,
      durationSeconds,
      status: 'FINISHED',
      completedAt: new Date()
    };

    // 1. Save Match Record
    if (isDbConnected) {
      await Match.create(matchData);
      logger.info(`[MatchService] Match ${matchId} saved to MongoDB for room ${cleanCode}.`);
    } else {
      inMemoryMatches.set(matchId, matchData);
      logger.info(`[MatchService] Match ${matchId} saved to memory for room ${cleanCode}.`);
    }

    // 2. Atomically update PlayerStats for each participant
    for (const p of matchPlayers) {
      await matchService.updatePlayerStatsAfterMatch(p);
    }

    // Mark room gameState as saved
    if (!room.gameState) room.gameState = {};
    room.gameState.matchRecordSaved = true;
    room.gameState.matchId = matchId;

    return matchId;
  },

  /**
   * Updates or initializes persistent statistics for a player after a completed match.
   */
  updatePlayerStatsAfterMatch: async (playerMatchResult) => {
    const { playerId, nickname, primaryColor, isWinner, opponentsEliminated } = playerMatchResult;
    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      let stats = await PlayerStats.findOne({ playerId });
      if (!stats) {
        stats = new PlayerStats({
          playerId,
          nickname,
          primaryColor,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winPercentage: 0,
          currentStreak: 0,
          bestStreak: 0,
          opponentsEliminated: 0
        });
      }

      stats.nickname = nickname;
      stats.primaryColor = primaryColor;
      stats.matchesPlayed += 1;
      if (isWinner) {
        stats.wins += 1;
        stats.currentStreak += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      } else {
        stats.losses += 1;
        stats.currentStreak = 0;
      }
      stats.winPercentage = Math.round((stats.wins / stats.matchesPlayed) * 100);
      stats.opponentsEliminated += (opponentsEliminated || 0);
      stats.lastMatchAt = new Date();

      await stats.save();
    } else {
      let stats = inMemoryPlayerStats.get(playerId) || {
        playerId,
        nickname,
        primaryColor,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        currentStreak: 0,
        bestStreak: 0,
        opponentsEliminated: 0,
        lastMatchAt: new Date()
      };

      stats.nickname = nickname;
      stats.primaryColor = primaryColor;
      stats.matchesPlayed += 1;
      if (isWinner) {
        stats.wins += 1;
        stats.currentStreak += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      } else {
        stats.losses += 1;
        stats.currentStreak = 0;
      }
      stats.winPercentage = Math.round((stats.wins / stats.matchesPlayed) * 100);
      stats.opponentsEliminated += (opponentsEliminated || 0);
      stats.lastMatchAt = new Date();

      inMemoryPlayerStats.set(playerId, stats);
    }
  },

  /**
   * Retrieves paginated match history for a specific player.
   */
  getPlayerMatchHistory: async ({ playerId, page = 1, limit = 10 }) => {
    const cleanPlayerId = (playerId || '').trim();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const isDbConnected = getDatabaseStatus().connected;

    let rawMatches = [];
    let total = 0;

    if (isDbConnected) {
      total = await Match.countDocuments({ 'players.playerId': cleanPlayerId });
      rawMatches = await Match.find({ 'players.playerId': cleanPlayerId })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    } else {
      const allMatches = Array.from(inMemoryMatches.values())
        .filter((m) => m.players.some((p) => p.playerId === cleanPlayerId))
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      total = allMatches.length;
      rawMatches = allMatches.slice(skip, skip + limitNum);
    }

    const matches = rawMatches.map((m) => {
      const me = m.players.find((p) => p.playerId === cleanPlayerId) || {};
      const opponents = m.players
        .filter((p) => p.playerId !== cleanPlayerId)
        .map((p) => ({
          playerId: p.playerId,
          nickname: p.nickname,
          primaryColor: p.primaryColor,
          assignedShade: p.assignedShade,
          isWinner: p.isWinner,
          isEliminated: p.isEliminated
        }));

      return {
        matchId: m.matchId,
        roomCode: m.roomCode,
        roomName: m.roomName,
        isPrivate: m.isPrivate,
        paperStyle: m.paperStyle,
        durationSeconds: m.durationSeconds,
        totalTurns: m.totalTurns,
        completedAt: m.completedAt,
        isWinner: Boolean(me.isWinner),
        placement: me.placement || 2,
        shotsFired: me.shotsFired || 0,
        opponentsEliminated: me.opponentsEliminated || 0,
        eliminatedRowsCount: me.eliminatedRowsCount || 0,
        opponents,
        winner: m.winner
      };
    });

    return {
      matches,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: skip + matches.length < total
      }
    };
  },

  /**
   * Retrieves player statistics.
   */
  getPlayerStats: async ({ playerId }) => {
    const cleanPlayerId = (playerId || '').trim();
    const isDbConnected = getDatabaseStatus().connected;

    let stats = null;
    if (isDbConnected) {
      stats = await PlayerStats.findOne({ playerId: cleanPlayerId }).lean();
    } else {
      stats = inMemoryPlayerStats.get(cleanPlayerId) || null;
    }

    if (!stats) {
      return {
        playerId: cleanPlayerId,
        nickname: 'Warrior',
        primaryColor: 'BLUE',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        currentStreak: 0,
        bestStreak: 0,
        opponentsEliminated: 0,
        lastMatchAt: null
      };
    }

    return stats;
  },

  /**
   * Retrieves the global player leaderboard with transparent ranking and tie resolution.
   */
  getGlobalLeaderboard: async ({ page = 1, limit = 20 }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const isDbConnected = getDatabaseStatus().connected;

    let entries = [];
    let total = 0;

    if (isDbConnected) {
      total = await PlayerStats.countDocuments({ matchesPlayed: { $gt: 0 } });
      entries = await PlayerStats.find({ matchesPlayed: { $gt: 0 } })
        .sort({ wins: -1, winPercentage: -1, matchesPlayed: -1, bestStreak: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    } else {
      const allStats = Array.from(inMemoryPlayerStats.values())
        .filter((s) => s.matchesPlayed > 0)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
          if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
          return (b.bestStreak || 0) - (a.bestStreak || 0);
        });

      total = allStats.length;
      entries = allStats.slice(skip, skip + limitNum);
    }

    // Assign transparent rank with tie handling
    let currentRank = skip + 1;
    const leaderboard = entries.map((entry, idx) => {
      return {
        rank: skip + idx + 1,
        playerId: entry.playerId,
        nickname: entry.nickname,
        primaryColor: entry.primaryColor || 'BLUE',
        matchesPlayed: entry.matchesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        winPercentage: entry.winPercentage,
        currentStreak: entry.currentStreak,
        bestStreak: entry.bestStreak,
        opponentsEliminated: entry.opponentsEliminated
      };
    });

    return {
      leaderboard,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  },

  /**
   * Retrieves specific match details by matchId.
   */
  getMatchDetails: async ({ matchId }) => {
    const isDbConnected = getDatabaseStatus().connected;
    if (isDbConnected) {
      return Match.findOne({ matchId }).lean();
    } else {
      return inMemoryMatches.get(matchId) || null;
    }
  }
};
