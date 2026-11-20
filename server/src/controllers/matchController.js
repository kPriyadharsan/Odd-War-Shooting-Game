import { matchService } from '../services/matchService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for Match History, Player Statistics, and Global Leaderboard.
 */
export const getPlayerMatchHistory = async (req, res) => {
  try {
    const { playerId } = req.params;
    if (!playerId) {
      return sendError(res, 'Player ID is required', 400);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await matchService.getPlayerMatchHistory({ playerId, page, limit });
    return sendSuccess(res, result, 'Player match history retrieved successfully');
  } catch (error) {
    logger.error('[MatchController] Error getting player match history:', error);
    return sendError(res, error.message || 'Failed to retrieve match history', error.statusCode || 500);
  }
};

export const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return sendError(res, 'Match ID is required', 400);
    }

    const match = await matchService.getMatchDetails({ matchId });
    if (!match) {
      return sendError(res, `Match "${matchId}" not found`, 404);
    }

    return sendSuccess(res, match, 'Match details retrieved successfully');
  } catch (error) {
    logger.error('[MatchController] Error getting match details:', error);
    return sendError(res, error.message || 'Failed to retrieve match details', error.statusCode || 500);
  }
};

export const getPlayerStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    if (!playerId) {
      return sendError(res, 'Player ID is required', 400);
    }

    const stats = await matchService.getPlayerStats({ playerId });
    return sendSuccess(res, stats, 'Player stats retrieved successfully');
  } catch (error) {
    logger.error('[MatchController] Error getting player stats:', error);
    return sendError(res, error.message || 'Failed to retrieve player stats', error.statusCode || 500);
  }
};

export const getGlobalLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await matchService.getGlobalLeaderboard({ page, limit });
    return sendSuccess(res, result, 'Global leaderboard retrieved successfully');
  } catch (error) {
    logger.error('[MatchController] Error getting leaderboard:', error);
    return sendError(res, error.message || 'Failed to retrieve leaderboard', error.statusCode || 500);
  }
};
