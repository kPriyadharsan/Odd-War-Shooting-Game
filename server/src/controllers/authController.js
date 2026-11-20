import { config } from '../config/env.js';
import { authService } from '../services/authService.js';
import { sessionService } from '../services/sessionService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * Sanitizes user record before returning to clients.
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const raw = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete raw.__v;
  delete raw.passwordHash;
  return raw;
};

/**
 * Initiates the Google OAuth 2.0 OpenID Connect authorization code flow.
 * Generates cryptographically secure state, nonce, and PKCE challenge.
 */
export const initiateGoogleAuth = async (req, res) => {
  const frontendOrigin = authService.resolveFrontendOrigin(req);
  try {
    if (!config.isGoogleAuthConfigured) {
      if (req.accepts('html')) {
        return res.redirect(`${frontendOrigin}/login?error=google_not_configured`);
      }
      return sendError(
        res,
        'Google authentication is inactive. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured on the server.',
        501
      );
    }

    const guestPlayerId = req.query.guestPlayerId || req.cookies?.guest_player_id || null;
    const returnTo = req.query.returnTo || '/profile';

    const { authorizationUrl, transactionToken } = authService.generateOAuthTransaction({
      guestPlayerId,
      returnTo,
      req
    });

    // Store sealed transaction in temporary HttpOnly cookie (10 minute TTL)
    res.cookie('odd_wars_oauth_tx', transactionToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('[AuthController] Failed to initiate Google OAuth:', error);
    if (req.accepts('html')) {
      return res.redirect(`${frontendOrigin}/login?error=oauth_init_failed`);
    }
    return sendError(res, error.message || 'Failed to initiate Google authentication', error.statusCode || 500);
  }
};

/**
 * Handles Google OAuth callback.
 * Validates state, nonce, exchanges authorization code, verifies ID token,
 * creates or links player account, and issues an HttpOnly session cookie.
 */
export const handleGoogleCallback = async (req, res) => {
  const fallbackOrigin = authService.resolveFrontendOrigin(req);
  try {
    // 1. Check for errors returned by Google
    if (req.query.error) {
      logger.warn(`[AuthController] Google OAuth callback error: ${req.query.error}`);
      return res.redirect(`${fallbackOrigin}/login?error=${encodeURIComponent(req.query.error)}`);
    }

    const { code, state } = req.query;

    if (!code || !state) {
      logger.warn('[AuthController] Missing code or state in Google callback');
      return res.redirect(`${fallbackOrigin}/login?error=missing_code_or_state`);
    }

    // 2. Validate and consume sealed transaction cookie
    const transactionToken = req.cookies?.odd_wars_oauth_tx;
    if (!transactionToken) {
      logger.warn('[AuthController] Missing OAuth transaction cookie in callback');
      return res.redirect(`${fallbackOrigin}/login?error=session_expired`);
    }

    let txData = null;
    try {
      txData = authService.verifyAndConsumeTransaction(transactionToken, state);
    } catch (txError) {
      logger.error('[AuthController] OAuth transaction verification failed:', txError.message);
      return res.redirect(`${fallbackOrigin}/login?error=${encodeURIComponent(txError.message)}`);
    }

    const frontendOrigin = txData.frontendOrigin || fallbackOrigin;

    // 3. Exchange authorization code & verify ID token
    const googleProfile = await authService.exchangeCodeAndVerifyIdToken({
      code,
      codeVerifier: txData.codeVerifier,
      expectedNonce: txData.nonce,
      redirectUri: txData.callbackUrl || authService.resolveCallbackUrl(req)
    });

    // 4. Find or create persistent User (safe guest linking)
    const { user, isNewUser } = await authService.findOrCreateUserFromGoogle({
      googleProfile,
      guestPlayerId: txData.guestPlayerId
    });

    // 5. Create persistent session
    const { rawToken } = await sessionService.createSession({ user, req });

    // 6. Set secure HttpOnly session cookie (7 days)
    res.cookie('odd_wars_session', rawToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Clear temporary transaction cookie
    res.clearCookie('odd_wars_oauth_tx', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/'
    });

    logger.info(`[AuthController] User ${user.nickname} (${user.playerId}) authenticated successfully via Google (isNewUser: ${isNewUser})`);

    // Intelligent destination routing:
    // First-time sign-in or incomplete profile -> redirect to /profile-setup (identity creation form)
    // Existing user with completed profile -> redirect to /lobby (main game dashboard)
    let destination = '/lobby';
    if (isNewUser || !user.isProfileComplete) {
      destination = '/profile-setup';
    } else if (txData.returnTo && txData.returnTo.startsWith('/') && !['/login', '/profile', '/'].includes(txData.returnTo)) {
      destination = txData.returnTo;
    }

    return res.redirect(`${frontendOrigin}${destination}`);
  } catch (error) {
    logger.error('[AuthController] Error in Google OAuth callback:', error);
    return res.redirect(`${fallbackOrigin}/login?error=${encodeURIComponent(error.message || 'authentication_failed')}`);
  }
};

/**
 * Updates authenticated player profile (nickname and primary color)
 * and marks profile onboarding as complete.
 */
export const updateProfile = async (req, res) => {
  try {
    const { nickname, primaryColor } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 24) {
      return sendError(res, 'Nickname must be between 2 and 24 characters', 400);
    }

    const updatedUser = await authService.updateUserProfile({
      playerId: req.user.playerId,
      nickname: nickname.trim(),
      primaryColor
    });

    return sendSuccess(res, { user: sanitizeUser(updatedUser) }, 'Profile updated successfully');
  } catch (error) {
    logger.error('[AuthController] Failed to update profile:', error);
    return sendError(res, error.message || 'Failed to update profile', 500);
  }
};

/**
 * Returns authenticated player profile and active session metadata.
 */
export const getCurrentUser = async (req, res) => {
  try {
    return sendSuccess(
      res,
      {
        user: sanitizeUser(req.user),
        session: {
          expiresAt: req.session?.expiresAt || null,
          lastActivityAt: req.session?.lastActivityAt || null
        }
      },
      'Authenticated user profile retrieved'
    );
  } catch (error) {
    logger.error('[AuthController] Error retrieving current user:', error);
    return sendError(res, 'Failed to retrieve authenticated user', 500);
  }
};

/**
 * Logs out user: revokes server-side session and clears HttpOnly session cookie.
 */
export const logoutUser = async (req, res) => {
  try {
    const rawToken = req.cookies?.odd_wars_session;
    if (rawToken) {
      await sessionService.revokeSession(rawToken);
    }

    res.clearCookie('odd_wars_session', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('[AuthController] Error logging out:', error);
    return sendError(res, 'Failed to log out', 500);
  }
};
