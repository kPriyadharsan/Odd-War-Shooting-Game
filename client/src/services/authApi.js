import { config } from '../config/env.js';

/**
 * Resolves the API base path. In browser environments, always prefers the same-origin relative '/api'
 * path which works seamlessly across Vite dev proxy and Vercel production rewrites, ensuring
 * cookies are first-party and completely eliminating cross-domain cookie dropping and timeouts.
 */
const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (!config.apiUrl || config.apiUrl.includes('onrender.com') || config.apiUrl.startsWith('http')) {
      return '/api';
    }
    return config.apiUrl;
  }
  return config.apiUrl || '/api';
};

export const authApi = {
  /**
   * Retrieves the currently authenticated user and session metadata.
   */
  getCurrentUser: async () => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) {
        return null; // Not logged in
      }
      throw new Error(`Failed to fetch current user: ${res.status}`);
    }

    const data = await res.json();
    return data.data?.user || null;
  },

  /**
   * Logs out the user on the server and clears session cookies.
   */
  logout: async () => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to log out: ${res.status}`);
    }

    return res.json();
  },

  /**
   * Updates player's profile (call-sign nickname and primary color) on the server.
   */
  updateProfile: async ({ nickname, primaryColor }) => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ nickname, primaryColor })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update profile');
    }

    const data = await res.json();
    return data.data?.user || null;
  },

  /**
   * Constructs the server-side Google OAuth initiation URL with guest linking parameters
   * and client origin to guarantee accurate production redirect URI resolution.
   */
  getGoogleLoginUrl: (guestPlayerId = null, returnTo = '/profile') => {
    const apiBase = getApiBase();
    const params = new URLSearchParams();
    if (guestPlayerId) {
      params.set('guestPlayerId', guestPlayerId);
    }
    if (returnTo) {
      params.set('returnTo', returnTo);
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      params.set('origin', window.location.origin);
    }
    const queryString = params.toString();
    return `${apiBase}/auth/google${queryString ? `?${queryString}` : ''}`;
  }
};
