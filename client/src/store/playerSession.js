import { loadProfileDraft } from './gameStore.js';

const SESSION_KEY = 'odd_wars_player_session_id';

/**
 * Returns a persistent temporary player identity for room management.
 * In Task 05, this uses the local profile draft and a persistent browser session ID.
 * Replaceable by Google OAuth credentials in final integration.
 */
export const getPlayerSession = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `p_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  const profile = loadProfileDraft();
  const nickname = profile.nickname?.trim() || `Player_${sessionId.substring(2, 6)}`;
  const primaryColor = (profile.primaryColor || 'BLUE').toUpperCase();

  return {
    playerId: sessionId,
    nickname,
    primaryColor,
    isCustomized: Boolean(profile.nickname?.trim())
  };
};
