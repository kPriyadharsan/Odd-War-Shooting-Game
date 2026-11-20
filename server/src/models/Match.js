import mongoose from 'mongoose';

/**
 * Match Schema
 * Authoritative record of completed ODD WARS matches.
 */
const matchPlayerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    nickname: { type: String, required: true },
    primaryColor: { type: String, default: 'BLUE' },
    assignedShade: { type: Object, default: null },
    isWinner: { type: Boolean, default: false },
    isEliminated: { type: Boolean, default: false },
    placement: { type: Number, default: 2 },
    shotsFired: { type: Number, default: 0 },
    opponentsEliminated: { type: Number, default: 0 },
    eliminatedRowsCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    roomCode: {
      type: String,
      required: true,
      index: true
    },
    roomName: {
      type: String,
      default: 'Odd Wars Match'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    paperStyle: {
      type: String,
      default: 'classic-blue'
    },
    bookPageCount: {
      type: Number,
      default: 100
    },
    players: {
      type: [matchPlayerSchema],
      required: true
    },
    winner: {
      playerId: { type: String, default: null },
      nickname: { type: String, default: null },
      primaryColor: { type: String, default: null }
    },
    totalTurns: {
      type: Number,
      default: 1
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: 'FINISHED'
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Composite index for fast player match history lookup with sorting
matchSchema.index({ 'players.playerId': 1, completedAt: -1 });

export const Match = mongoose.model('Match', matchSchema);
