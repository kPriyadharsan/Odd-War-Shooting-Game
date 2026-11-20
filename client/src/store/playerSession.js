import { loadProfileDraft } from './gameStore.js';

const SESSION_KEY = 'odd_wars_player_session_id';

let memorySessionId = null;

/**
 * Returns a persistent temporary player identity for room management.
 * Safe for Incognito / Private Browsing where localStorage may be restricted.
 */
export const getPlayerSession = () => {
  let sessionId = null;
  try {
    sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `p_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (err) {
    if (!memorySessionId) {
      memorySessionId = `p_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    }
    sessionId = memorySessionId;
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
