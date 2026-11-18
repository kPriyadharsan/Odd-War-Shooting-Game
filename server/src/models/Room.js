import mongoose from 'mongoose';

/**
 * Room Schema & Lifecycle Models
 * Supports 2-4 players, public room browsing, and password-protected private rooms.
 * Lifecycle: WAITING -> READY -> STARTING -> PLAYING -> FINISHED -> CANCELLED
 *
 * Board & Book Configuration:
 * - bookPageCount: 100 or 200 pages (host configured)
 * - territory: Each player owns 1 independent vertical territory with 5 rows (1, 3, 5, 7, 9)
 * - assignedShade: Room-specific unique shade assigned within the player's primary color family
 */

export const ROOM_STATUS = {
  WAITING: 'WAITING',
  READY: 'READY',
  STARTING: 'STARTING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED'
};

export const ALLOWED_PAGE_COUNTS = [100, 200];
export const ALLOWED_PLAYER_CAPACITIES = [2, 3, 4];
export const TERRITORY_ROWS = [1, 3, 5, 7, 9];

const playerShadeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    hex: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const playerTerritorySchema = new mongoose.Schema(
  {
    territoryId: {
      type: String,
      required: true
    },
    slotIndex: {
      type: Number,
      min: 0,
      max: 3,
      required: true
    },
    rows: {
      type: [Number],
      default: TERRITORY_ROWS
    }
  },
  { _id: false }
);

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
    assignedShade: {
      type: playerShadeSchema,
      required: true
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
    socketId: {
      type: String,
      default: null
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    territory: {
      type: playerTerritorySchema,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: {
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
      enum: ALLOWED_PLAYER_CAPACITIES
    },
    bookPageCount: {
      type: Number,
      default: 100,
      enum: ALLOWED_PAGE_COUNTS
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
