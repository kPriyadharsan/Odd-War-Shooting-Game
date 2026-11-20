import { Router } from 'express';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  logoutUser,
  updateProfile
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/auth/google - Initiates Google OpenID Connect Flow
router.get('/google', initiateGoogleAuth);

// GET /api/auth/google/callback - Receives Google authorization code & state
router.get('/google/callback', handleGoogleCallback);

// GET /api/auth/me - Returns current authenticated player & session
router.get('/me', requireAuth, getCurrentUser);

// PUT & PATCH /api/auth/profile - Updates player nickname & color
router.put('/profile', requireAuth, updateProfile);
router.patch('/profile', requireAuth, updateProfile);

// POST /api/auth/logout - Revokes session and clears cookie
router.post('/logout', logoutUser);

export default router;
