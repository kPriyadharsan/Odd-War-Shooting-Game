import { Router } from 'express';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  logoutUser,
  updateProfile,
  checkNickname
} from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/auth/google - Initiates Google OpenID Connect Flow
router.get('/google', initiateGoogleAuth);

// GET /api/auth/google/callback - Receives Google authorization code & state
router.get('/google/callback', handleGoogleCallback);

// GET /api/auth/me - Returns current authenticated player & session
router.get('/me', requireAuth, getCurrentUser);

// GET /api/auth/check-nickname - Checks availability of desired game nickname
router.get('/check-nickname', optionalAuth, checkNickname);

// PUT & PATCH /api/auth/profile - Updates player nickname, color & DOB
router.put('/profile', requireAuth, updateProfile);
router.patch('/profile', requireAuth, updateProfile);

// POST /api/auth/logout - Revokes session and clears cookie
router.post('/logout', logoutUser);

export default router;
