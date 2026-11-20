import { Router } from 'express';
import { getGlobalLeaderboard } from '../controllers/matchController.js';

const router = Router();

// GET /api/leaderboard - Global player leaderboard
router.get('/', getGlobalLeaderboard);

export default router;
