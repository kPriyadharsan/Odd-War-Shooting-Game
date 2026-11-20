import mongoose from 'mongoose';

/**
 * Session Schema
 * Stores hashed opaque session tokens for authenticated application sessions.
 * Features automated MongoDB TTL index cleanup for expired sessions.
 */
const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    playerId: {
      type: String,
      required: true,
      index: true
    },
    // SHA-256 hash of the opaque session token (never store raw token)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB automatic TTL cleanup
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Session = mongoose.model('Session', sessionSchema);
