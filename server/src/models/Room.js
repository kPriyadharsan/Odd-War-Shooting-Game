import mongoose from 'mongoose';

/**
 * Room Schema Foundation
 * Supports 2-4 players, public matchmaking, and password-protected private rooms.
 */
const roomPlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    socketId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    isReady: {
      type: Boolean,
      default: false
    },
    slotIndex: {
      type: Number,
      min: 0,
      max: 3
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      default: 'Odd Wars Battle'
    },
    hostSocketId: {
      type: String,
      required: true
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    passwordHash: {
      type: String,
      default: null
    },
    maxPlayers: {
      type: Number,
      default: 4,
      min: 2,
      max: 4
    },
    players: [roomPlayerSchema],
    status: {
      type: String,
      enum: ['waiting', 'countdown', 'in-progress', 'finished'],
      default: 'waiting'
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.model('Room', roomSchema);
