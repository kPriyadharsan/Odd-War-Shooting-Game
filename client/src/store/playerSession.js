import { loadProfileDraft } from './gameStore.js';

const SESSION_KEY = 'odd_wars_player_session_id';

let memorySessionId = null;
let activeAuthUser = null;

/**
 * Updates the active authenticated player identity in memory and local storage.
 */
export const syncAuthenticatedPlayer = (user) => {
  activeAuthUser = user;
  if (!user || !user.playerId) return;
  try {
    localStorage.setItem(SESSION_KEY, user.playerId);
  } catch (err) {
    memorySessionId = user.playerId;
  }
};

/**
 * Clears authenticated player identity and resets to a clean guest session.
 */
export const clearAuthenticatedPlayer = () => {
  activeAuthUser = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    memorySessionId = null;
  }
};

/**
 * Returns the active player identity.
 * If authenticated with Google, returns the authenticated user credentials.
 * Otherwise returns a persistent guest session.
 */
export const getPlayerSession = () => {
  if (activeAuthUser && activeAuthUser.playerId) {
    return {
      playerId: activeAuthUser.playerId,
      nickname: activeAuthUser.nickname || activeAuthUser.displayName || 'Warrior',
      primaryColor: (activeAuthUser.primaryColor || 'BLUE').toUpperCase(),
      isAuthenticated: true,
      email: activeAuthUser.email,
      avatarUrl: activeAuthUser.avatarUrl,
      isCustomized: true
    };
  }

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
    isAuthenticated: false,
    email: null,
    avatarUrl: null,
    isCustomized: Boolean(profile.nickname?.trim())
  };
};
