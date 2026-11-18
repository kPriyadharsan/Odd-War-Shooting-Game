import mongoose from 'mongoose';

/**
 * Match Schema Foundation
 * Stores completed match results, stats, and player performances.
 */
const matchSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true
    },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        username: String,
        kills: { type: Number, default: 0 },
        deaths: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        placement: { type: Number, min: 1, max: 4 }
      }
    ],
    winner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    gameMode: {
      type: String,
      default: 'deathmatch'
    }
  },
  {
    timestamps: true
  }
);

export const Match = mongoose.model('Match', matchSchema);
