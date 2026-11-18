import mongoose from 'mongoose';

/**
 * Room Schema & Lifecycle Models
 * Supports 2-4 players, public room browsing, and password-protected private rooms.
 * Lifecycle: WAITING -> READY -> STARTING -> PLAYING -> FINISHED -> CANCELLED
 */

export const ROOM_STATUS = {
  WAITING: 'WAITING',
  READY: 'READY',
  STARTING: 'STARTING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED'
};

const roomPlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true
    },
    nickname: {
      type: String,
      required: true,
      trim: true
    },
    primaryColor: {
      type: String,
      default: 'BLUE',
      uppercase: true
    },
    slotIndex: {
      type: Number,
      min: 0,
      max: 3,
      required: true
    },
    isHost: {
      type: Boolean,
      default: false
    },
    isReady: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
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
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      default: 'Odd Wars Battle'
    },
    isPrivate: {
      type: Boolean,
      default: false,
      index: true
    },
    passwordHash: {
      type: String,
      default: null,
      select: false // never returned in standard queries
    },
    maxPlayers: {
      type: Number,
      default: 4,
      min: 2,
      max: 4
    },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.WAITING,
      index: true
    },
    hostId: {
      type: String,
      required: true
    },
    hostNickname: {
      type: String,
      required: true
    },
    players: {
      type: [roomPlayerSchema],
      default: [],
      validate: [
        (val) => val.length <= 4,
        'A room cannot exceed 4 players'
      ]
    }
  },
  {
    timestamps: true
  }
);

// Virtual for player count
roomSchema.virtual('playerCount').get(function () {
  return this.players ? this.players.length : 0;
});

// JSON serialization formatting
roomSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export const Room = mongoose.model('Room', roomSchema);
