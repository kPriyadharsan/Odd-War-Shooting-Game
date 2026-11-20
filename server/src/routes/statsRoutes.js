import { Router } from 'express';
import { getPlayerStats } from '../controllers/matchController.js';

const router = Router();

// GET /api/stats/player/:playerId - Player aggregated stats
router.get('/player/:playerId', getPlayerStats);

export default router;
