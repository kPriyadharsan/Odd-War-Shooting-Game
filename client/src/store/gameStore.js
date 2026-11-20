/**
 * Player Profile & Game State Store
 *
 * Data Architecture:
 * Stores the unauthenticated player profile draft locally for testing.
 * Designed to seamlessly attach to Google OAuth credentials (googleId, email, avatarUrl)
 * during the final integration stage.
 */

const STORAGE_KEY = 'odd_war_player_profile_draft';

export const createInitialProfile = () => ({
  nickname: '',
  primaryColor: 'BLUE', // One of: 'RED' | 'GREEN' | 'BLUE' | 'YELLOW' | 'BLACK'
  createdAt: null,
  updatedAt: null,
  isDraft: true, // Explicit flag: not yet linked to permanent Google account
  googleId: null,
  email: null,
  avatarUrl: null
});

export const loadProfileDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('odd_wars_player_profile_draft');
    if (!raw) return createInitialProfile();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialProfile(),
      ...parsed,
      isDraft: true
    };
  } catch (err) {
    console.warn('[ProfileStore] Failed to load draft from localStorage:', err);
    return createInitialProfile();
  }
};

export const saveProfileDraft = ({ nickname, primaryColor }) => {
  const now = new Date().toISOString();
  const existing = loadProfileDraft();
  
  const updatedProfile = {
    ...existing,
    nickname: nickname.trim(),
    primaryColor: (primaryColor || 'BLUE').toUpperCase(),
    createdAt: existing.createdAt || now,
    updatedAt: now,
    isDraft: true
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
  } catch (err) {
    console.warn('[ProfileStore] Failed to save draft to localStorage:', err);
  }

  return updatedProfile;
};

export const clearProfileDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[ProfileStore] Failed to clear draft:', err);
  }
};
