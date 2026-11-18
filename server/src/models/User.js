import mongoose from 'mongoose';

/**
 * User / Player Profile Schema Foundation
 */
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 24
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    stats: {
      eloRating: {
        type: Number,
        default: 1000
      },
      matchesPlayed: {
        type: Number,
        default: 0
      },
      wins: {
        type: Number,
        default: 0
      },
      losses: {
        type: Number,
        default: 0
      },
      kills: {
        type: Number,
        default: 0
      },
      deaths: {
        type: Number,
        default: 0
      }
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

export const User = mongoose.model('User', userSchema);
