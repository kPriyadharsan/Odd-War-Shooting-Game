import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { PlayerStats } from '../models/PlayerStats.js';
import { inMemoryUsers } from './sessionService.js';
import { inMemoryPlayerStats } from './matchService.js';
import { getDatabaseStatus } from '../config/database.js';
import { logger } from '../utils/logger.js';

const TRANSACTION_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Creates an HMAC signature for a transaction payload
 */
const signPayload = (payloadString) => {
  return crypto.createHmac('sha256', config.jwtSecret).update(payloadString).digest('base64url');
};

/**
 * Dynamically resolves the OAuth callback URL based on incoming request headers
 * (preserving forwarded host from Vercel / reverse proxies) or explicit env variable.
 */
export const resolveCallbackUrl = (req) => {
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim().length > 0) {
    return process.env.GOOGLE_CALLBACK_URL.trim();
  }

  if (req) {
    const forwardedProto = req.get ? req.get('x-forwarded-proto') : req.headers?.['x-forwarded-proto'];
    const forwardedHost = req.get ? req.get('x-forwarded-host') : req.headers?.['x-forwarded-host'];

    if (forwardedHost) {
      const proto = forwardedProto || 'https';
      return `${proto}://${forwardedHost}/api/auth/google/callback`;
    }

    const host = req.get ? req.get('host') : req.headers?.['host'];
    if (host && !host.includes('onrender.com')) {
      const proto = req.protocol || 'http';
      return `${proto}://${host}/api/auth/google/callback`;
    }

    if (config.clientUrl && !config.clientUrl.includes('localhost')) {
      return `${config.clientUrl.replace(/\/+$/, '')}/api/auth/google/callback`;
    }
  }

  return config.googleCallbackUrl || 'http://localhost:5173/api/auth/google/callback';
};

export const authService = {
  resolveCallbackUrl,

  /**
   * Generates a Google OAuth authorization URL with cryptographically secure
   * state, nonce, and PKCE code challenge.
   * Signs the OAuth transaction into a tamper-proof HttpOnly token.
   */
  generateOAuthTransaction: ({ guestPlayerId = null, returnTo = '/', req = null }) => {
    if (!config.isGoogleAuthConfigured) {
      const err = new Error('Google OAuth credentials are not configured on the server.');
      err.statusCode = 501;
      throw err;
    }

    const callbackUrl = resolveCallbackUrl(req);
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const txData = {
      state,
      nonce,
      codeVerifier,
      callbackUrl,
      guestPlayerId: typeof guestPlayerId === 'string' && guestPlayerId.startsWith('p_') ? guestPlayerId : null,
      returnTo: typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/',
      createdAt: Date.now()
    };

    const payloadString = Buffer.from(JSON.stringify(txData)).toString('base64url');
    const signature = signPayload(payloadString);
    const transactionToken = `${payloadString}.${signature}`;

    const client = new OAuth2Client({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: callbackUrl
    });

    const authorizationUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account'
    });

    return {
      authorizationUrl,
      transactionToken,
      state,
      nonce,
      callbackUrl
    };
  },

  /**
   * Verifies and unwraps the sealed OAuth transaction from the browser cookie.
   * Enforces HMAC validation, TTL checks, and state matching.
   */
  verifyAndConsumeTransaction: (transactionToken, returnedState) => {
    if (!transactionToken || typeof transactionToken !== 'string') {
      const err = new Error('Missing OAuth transaction state cookie.');
      err.statusCode = 400;
      throw err;
    }

    const parts = transactionToken.split('.');
    if (parts.length !== 2) {
      const err = new Error('Malformed OAuth transaction token.');
      err.statusCode = 400;
      throw err;
    }

    const [payloadString, signature] = parts;
    const expectedSig = signPayload(payloadString);

    if (signature !== expectedSig) {
      const err = new Error('Invalid OAuth transaction signature. State tampering detected.');
      err.statusCode = 400;
      throw err;
    }

    let txData = null;
    try {
      txData = JSON.parse(Buffer.from(payloadString, 'base64url').toString('utf8'));
    } catch {
      const err = new Error('Failed to parse OAuth transaction payload.');
      err.statusCode = 400;
      throw err;
    }

    // TTL Check (10 minutes)
    if (!txData.createdAt || Date.now() - txData.createdAt > TRANSACTION_TTL_MS) {
      const err = new Error('OAuth transaction has expired. Please try signing in again.');
      err.statusCode = 400;
      throw err;
    }

    // State Validation
    if (!returnedState || returnedState !== txData.state) {
      const err = new Error('Invalid OAuth state parameter. Possible Cross-Site Request Forgery.');
      err.statusCode = 400;
      throw err;
    }

    return txData;
  },

  /**
   * Exchanges authorization code for tokens and verifies Google ID token claims.
   * Validates audience, issuer, expiry, signature, nonce, and email_verified.
   */
  exchangeCodeAndVerifyIdToken: async ({ code, codeVerifier, expectedNonce, redirectUri = null }) => {
    if (!code || typeof code !== 'string') {
      const err = new Error('Missing authorization code from Google callback.');
      err.statusCode = 400;
      throw err;
    }

    const client = new OAuth2Client({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: redirectUri || config.googleCallbackUrl
    });

    // Code exchange on backend only
    let tokens = null;
    try {
      const response = await client.getToken({
        code,
        codeVerifier
      });
      tokens = response.tokens;
    } catch (exchangeError) {
      logger.error('[AuthService] Google code exchange failed:', exchangeError.message);
      const err = new Error('Failed to exchange authorization code with Google.');
      err.statusCode = 401;
      throw err;
    }

    if (!tokens || !tokens.id_token) {
      const err = new Error('Google did not return an ID token.');
      err.statusCode = 401;
      throw err;
    }

    // Verify ID Token with Google Auth Library
    let ticket = null;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.googleClientId
      });
    } catch (verifyError) {
      logger.error('[AuthService] Google ID token verification failed:', verifyError.message);
      const err = new Error('Google ID token verification failed or expired.');
      err.statusCode = 401;
      throw err;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      const err = new Error('Google ID token missing valid subject identifier.');
      err.statusCode = 401;
      throw err;
    }

    // Nonce Validation (OpenID Connect Replay Protection)
    if (expectedNonce && payload.nonce !== expectedNonce) {
      const err = new Error('Google ID token nonce mismatch. Authentication rejected.');
      err.statusCode = 401;
      throw err;
    }

    // Verified Email Requirement
    if (!payload.email || payload.email_verified !== true) {
      const err = new Error('Unverified Google email address. Verified Google account required.');
      err.statusCode = 403;
      throw err;
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: true,
      displayName: payload.name || '',
      avatarUrl: payload.picture || ''
    };
  },

  /**
   * Finds or creates a user account from verified Google credentials.
   * Integrates safe guest account linking:
   * - If user signs in for the first time with an active guestPlayerId,
   *   we assign user.playerId = guestPlayerId so match history & room state are preserved!
   * - Idempotent and safe against claiming existing accounts.
   */
  findOrCreateUserFromGoogle: async ({ googleProfile, guestPlayerId = null }) => {
    const { googleId, email, emailVerified, displayName, avatarUrl } = googleProfile;
    const isDbConnected = getDatabaseStatus().connected;

    if (isDbConnected) {
      // 1. Check by unique googleId
      let existingUser = await User.findOne({ googleId });
      if (existingUser) {
        if (!existingUser.avatarUrl && avatarUrl) {
          existingUser.avatarUrl = avatarUrl;
          await existingUser.save();
        }
        return existingUser;
      }

      // 2. Check by verified email
      existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.googleId = googleId;
        existingUser.emailVerified = true;
        if (!existingUser.avatarUrl && avatarUrl) {
          existingUser.avatarUrl = avatarUrl;
        }
        await existingUser.save();
        logger.info(`[AuthService] Linked Google ID to existing user account ${email}`);
        return existingUser;
      }

      // 3. Create New User with safe guest playerId linking
      let assignedPlayerId = null;
      if (guestPlayerId && typeof guestPlayerId === 'string' && guestPlayerId.startsWith('p_')) {
        const isPlayerIdClaimed = await User.findOne({ playerId: guestPlayerId });
        if (!isPlayerIdClaimed) {
          assignedPlayerId = guestPlayerId;
          logger.info(`[AuthService] Linking guest identity ${guestPlayerId} to new Google account ${email}`);
        }
      }

      if (!assignedPlayerId) {
        assignedPlayerId = `p_${crypto.randomBytes(4).toString('hex')}_${Date.now().toString(36)}`;
      }

      const nickname = displayName
        ? displayName.split(' ')[0].substring(0, 20)
        : `Warrior_${assignedPlayerId.substring(2, 6)}`;

      const newUser = await User.create({
        playerId: assignedPlayerId,
        googleId,
        email,
        emailVerified,
        displayName,
        avatarUrl,
        nickname,
        primaryColor: 'BLUE',
        assignedShade: { name: 'Blue Ink', hex: '#2563eb' }
      });

      // Ensure PlayerStats record exists for this playerId
      const existingStats = await PlayerStats.findOne({ playerId: assignedPlayerId });
      if (!existingStats) {
        await PlayerStats.create({
          playerId: assignedPlayerId,
          nickname,
          primaryColor: 'BLUE'
        });
      }

      logger.info(`[AuthService] Created new user ${newUser.nickname} (playerId: ${assignedPlayerId}) from Google account`);
      return newUser;
    } else {
      // In-memory fallback for dev / test mode
      // Check existing by googleId
      for (const u of inMemoryUsers.values()) {
        if (u.googleId === googleId) {
          return u;
        }
      }
      // Check existing by email
      for (const u of inMemoryUsers.values()) {
        if (u.email === email) {
          u.googleId = googleId;
          u.emailVerified = true;
          return u;
        }
      }

      // Create new in memory
      let assignedPlayerId = guestPlayerId && !inMemoryUsers.has(guestPlayerId)
        ? guestPlayerId
        : `p_${crypto.randomBytes(4).toString('hex')}_${Date.now().toString(36)}`;

      const nickname = displayName
        ? displayName.split(' ')[0].substring(0, 20)
        : `Warrior_${assignedPlayerId.substring(2, 6)}`;

      const newUser = {
        _id: `user_${Date.now()}`,
        playerId: assignedPlayerId,
        googleId,
        email,
        emailVerified,
        displayName,
        avatarUrl,
        nickname,
        primaryColor: 'BLUE',
        assignedShade: { name: 'Blue Ink', hex: '#2563eb' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      inMemoryUsers.set(assignedPlayerId, newUser);

      if (!inMemoryPlayerStats.has(assignedPlayerId)) {
        inMemoryPlayerStats.set(assignedPlayerId, {
          playerId: assignedPlayerId,
          nickname,
          primaryColor: 'BLUE',
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winPercentage: 0,
          currentStreak: 0,
          bestStreak: 0,
          opponentsEliminated: 0,
          lastMatchAt: null
        });
      }

      logger.info(`[AuthService] In-memory user ${nickname} created (playerId: ${assignedPlayerId})`);
      return newUser;
    }
  }
};
