import mongoose from 'mongoose';

/**
 * User / Player Profile Schema
 * Authoritative record for authenticated Google users and linked player identities.
 */
const userSchema = new mongoose.Schema(
  {
    // Unique internal ODD WAR player ID (matches playerSession format: p_...)
    playerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Google OpenID Connect Provider Subject ID (sub)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    // Verified email from identity provider
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    // Google Profile Name / Full Name
    displayName: {
      type: String,
      trim: true,
      default: ''
    },

    // Google Profile Picture URL
    avatarUrl: {
      type: String,
      default: ''
    },

    // In-game Notebook Warrior Nickname (chosen explicitly by player, never defaulted to Google name)
    nickname: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 24,
      default: null
    },

    // In-game Primary Color Family
    primaryColor: {
      type: String,
      enum: ['RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK'],
      default: 'BLUE'
    },

    // Distinct assigned color shade
    assignedShade: {
      name: { type: String, default: 'Blue Ink' },
      hex: { type: String, default: '#2B68B4' }
    },

    // Player Date of Birth (Private - strictly account security & age verification)
    dob: {
      type: Date,
      default: null
    },

    // Whether the player completed their first-time identity setup form (requires nickname, color, and dob)
    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true
    },

    // Legacy fields preserved for backward compatibility
    username: {
      type: String,
      trim: true
    },
    stats: {
      eloRating: { type: Number, default: 1000 },
      matchesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 }
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Sparse unique index on nickname
userSchema.index({ nickname: 1 }, { unique: true, sparse: true });

// Auto-populate legacy username from nickname if not explicitly provided
// and evaluate profile completeness strictly against all three required fields
userSchema.pre('save', function (next) {
  if (!this.username && this.nickname) {
    this.username = this.nickname;
  }
  // All 3 fields are required for a complete profile
  if (this.nickname && this.primaryColor && this.dob) {
    this.isProfileComplete = true;
  } else {
    this.isProfileComplete = false;
  }
  next();
});

export const User = mongoose.model('User', userSchema);
