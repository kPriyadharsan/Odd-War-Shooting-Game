import crypto from 'crypto';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory fallback stores for test/dev mode when MongoDB is not connected
 * Key: tokenHash -> Session Object
 */
export const inMemorySessions = new Map();
export const inMemoryUsers = new Map();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const sessionService = {
  /**
   * Hashes a raw session token using SHA-256
   */
  hashToken: (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Creates a new persistent, revocable session for an authenticated user.
   * Returns { session, rawToken }
   */
  createSession: async ({ user, req = null }) => {
    if (!user || (!user._id && !user.playerId)) {
      throw new Error('Valid user required to create session');
    }

    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = sessionService.hashToken(rawToken);
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const userAgent = req?.headers ? req.headers['user-agent'] || '' : '';
    const ipAddress = req ? (req.ip || req.connection?.remoteAddress || '') : '';

    const sessionData = {
      sessionId,
      userId: user._id || user.id || sessionId,
      playerId: user.playerId,
      tokenHash,
      expiresAt,
      lastActivityAt: new Date(),
      revokedAt: null,
      userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 255) : '',
      ipAddress: typeof ipAddress === 'string' ? ipAddress.substring(0, 64) : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      const createdSession = await Session.create(sessionData);
      logger.info(`[SessionService] Persistent session ${sessionId} created in DB for player ${user.playerId}`);
      return { session: createdSession.toJSON ? createdSession.toJSON() : createdSession, rawToken };
    } else {
      inMemorySessions.set(tokenHash, sessionData);
      logger.info(`[SessionService] Session ${sessionId} created in memory for player ${user.playerId}`);
      return { session: sessionData, rawToken };
    }
  },

  /**
   * Validates a raw session token against storage.
   * Ensures session is non-revoked and not expired, then updates lastActivityAt.
   * Returns { session, user } or null if invalid.
   */
  validateSession: async (rawToken) => {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
      return null;
    }

    const tokenHash = sessionService.hashToken(rawToken.trim());
    const isDbConnected = getDatabaseStatus().connected;
    const now = new Date();

    let session = null;
    let user = null;

    if (isDbConnected) {
      session = await Session.findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: now }
      });

      if (!session) {
        return null;
      }

      // Update activity timestamp
      session.lastActivityAt = now;
      await session.save();

      user = await User.findById(session.userId);
      if (!user) {
        // Attempt fallback lookup by playerId
        user = await User.findOne({ playerId: session.playerId });
      }
    } else {
      const stored = inMemorySessions.get(tokenHash);
      if (!stored) {
        return null;
      }

      // Check revocation and expiration
      if (stored.revokedAt !== null || stored.expiresAt <= now) {
        return null;
      }

      stored.lastActivityAt = now;
      session = stored;
      user = inMemoryUsers.get(session.playerId) || null;
    }

    if (!user) {
      return null;
    }

    return {
      session,
      user: user.toJSON ? user.toJSON() : user
    };
  },

  /**
   * Revokes a session token immediately.
   */
  revokeSession: async (rawToken) => {
    if (!rawToken || typeof rawToken !== 'string') {
      return false;
    }

    const tokenHash = sessionService.hashToken(rawToken.trim());
    const isDbConnected = getDatabaseStatus().connected;
    const now = new Date();

    if (isDbConnected) {
      const result = await Session.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: now } }
      );
      return result.modifiedCount > 0;
    } else {
      const stored = inMemorySessions.get(tokenHash);
      if (stored && !stored.revokedAt) {
        stored.revokedAt = now;
        return true;
      }
      return false;
    }
  },

  /**
   * Revokes all active sessions for a user (e.g. on account security events).
   */
  revokeAllUserSessions: async (userId) => {
    const isDbConnected = getDatabaseStatus().connected;
    const now = new Date();

    if (isDbConnected) {
      await Session.updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: now } }
      );
    } else {
      for (const [hash, session] of inMemorySessions.entries()) {
        if (session.userId === userId && !session.revokedAt) {
          session.revokedAt = now;
        }
      }
    }
  }
};
