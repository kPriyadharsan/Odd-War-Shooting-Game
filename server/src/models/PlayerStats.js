import mongoose from 'mongoose';

/**
 * PlayerStats Schema
 * Persistent aggregated metrics for player profiles and global leaderboards.
 */
const playerStatsSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nickname: {
      type: String,
      required: true,
      trim: true
    },
    primaryColor: {
      type: String,
      default: 'BLUE'
    },
    matchesPlayed: {
      type: Number,
      default: 0,
      index: true
    },
    wins: {
      type: Number,
      default: 0,
      index: true
    },
    losses: {
      type: Number,
      default: 0
    },
    winPercentage: {
      type: Number,
      default: 0,
      index: true
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0,
      index: true
    },
    opponentsEliminated: {
      type: Number,
      default: 0
    },
    lastMatchAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// High-performance index for transparent leaderboard ranking & tie resolution
playerStatsSchema.index({ wins: -1, winPercentage: -1, matchesPlayed: -1, bestStreak: -1 });

export const PlayerStats = mongoose.model('PlayerStats', playerStatsSchema);
