import { Router } from 'express';
import { getPlayerMatchHistory, getMatchDetails } from '../controllers/matchController.js';

const router = Router();

// GET /api/matches/player/:playerId - Paginated match history for player
router.get('/player/:playerId', getPlayerMatchHistory);

// GET /api/matches/:matchId - Specific match details
router.get('/:matchId', getMatchDetails);

export default router;
