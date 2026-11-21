import { authApi } from './authApi.js';
import { apiClient } from './api.js';
import { getPlayerSession } from '../store/playerSession.js';

const STARTUP_SESSION_KEY = 'odd_war_startup_completed_session';

// In-memory flag ensures internal React route navigation never replays the startup loading screen
let memoryStartupCompleted = false;

export const isStartupCompleted = () => {
  if (memoryStartupCompleted) return true;
  try {
    const val = sessionStorage.getItem(STARTUP_SESSION_KEY);
    if (val === 'true') {
      memoryStartupCompleted = true;
      return true;
    }
  } catch (err) {
    // SessionStorage may be restricted in some private browsing contexts
  }
  return false;
};

export const markStartupCompleted = () => {
  memoryStartupCompleted = true;
  try {
    sessionStorage.setItem(STARTUP_SESSION_KEY, 'true');
  } catch (err) {
    // Ignore storage restriction
  }
};

export const resetStartupForSession = () => {
  memoryStartupCompleted = false;
  try {
    sessionStorage.removeItem(STARTUP_SESSION_KEY);
  } catch (err) {
    // Ignore storage restriction
  }
};

/**
 * Initializes the essential application state required to safely render Home.
 * Reports milestone progress (0 to 100).
 *
 * @param {Function} onMilestone - Callback receiving { progress, statusMessage }
 * @returns {Promise<{ user: any, session: any, health: any }>}
 */
export const runStartupInitialization = async (onMilestone = () => {}) => {
  onMilestone({ progress: 15, statusMessage: 'Preparing the battlefield...' });

  // 1. Initialize guest session and profile draft
  const session = getPlayerSession();
  onMilestone({ progress: 35, statusMessage: 'Setting up your world...' });

  // 2. Concurrently check authentication and backend health
  let user = null;
  let health = null;

  try {
    const [userRes, healthRes] = await Promise.allSettled([
      authApi.getCurrentUser(),
      apiClient.getHealth()
    ]);

    if (userRes.status === 'fulfilled') {
      user = userRes.value;
    } else {
      console.warn('[Startup] User session check:', userRes.reason?.message);
    }

    if (healthRes.status === 'fulfilled') {
      health = healthRes.value;
    } else {
      console.warn('[Startup] Backend health ping:', healthRes.reason?.message);
    }

    onMilestone({ progress: 75, statusMessage: 'Getting things ready...' });
  } catch (err) {
    console.warn('[Startup] Non-blocking initialization notice:', err.message);
  }

  // 3. Complete internal asset & canvas readiness check
  onMilestone({ progress: 90, statusMessage: 'The game is almost ready...' });

  return { user, session, health };
};
