import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import matchRoutes from './matchRoutes.js';
import statsRoutes from './statsRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/matches', matchRoutes);
router.use('/stats', statsRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;
