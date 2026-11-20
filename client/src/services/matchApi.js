import { config } from '../config/env.js';

const API_BASE = config.apiUrl;

/**
 * API client for Match History, Player Statistics, and Global Leaderboard.
 */
export const matchApi = {
  /**
   * Fetches paginated match history for a given player.
   */
  getPlayerMatchHistory: async (playerId, page = 1, limit = 10) => {
    const res = await fetch(`${API_BASE}/matches/player/${encodeURIComponent(playerId)}?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch match history: ${res.status}`);
    }
    return data.data;
  },

  /**
   * Fetches full match details for a specific match ID.
   */
  getMatchDetails: async (matchId) => {
    const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch match details: ${res.status}`);
    }
    return data.data;
  },

  /**
   * Fetches aggregated statistics for a given player.
   */
  getPlayerStats: async (playerId) => {
    const res = await fetch(`${API_BASE}/stats/player/${encodeURIComponent(playerId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch player stats: ${res.status}`);
    }
    return data.data;
  },

  /**
   * Fetches the global player leaderboard with ranking.
   */
  getGlobalLeaderboard: async (page = 1, limit = 20) => {
    const res = await fetch(`${API_BASE}/leaderboard?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch leaderboard: ${res.status}`);
    }
    return data.data;
  }
};
