import { Router } from 'express';
import { googleAuthCallback, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/google', googleAuthCallback);
router.get('/me', requireAuth, getCurrentUser);

export default router;
