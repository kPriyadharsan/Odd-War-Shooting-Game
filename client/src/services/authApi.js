import { config } from '../config/env.js';

const API_BASE = config.apiUrl;

export const authApi = {
  /**
   * Retrieves the currently authenticated user and session metadata.
   */
  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
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
    const res = await fetch(`${API_BASE}/auth/logout`, {
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
   * Constructs the server-side Google OAuth initiation URL with guest linking parameters.
   */
  getGoogleLoginUrl: (guestPlayerId = null, returnTo = '/profile') => {
    const params = new URLSearchParams();
    if (guestPlayerId) {
      params.set('guestPlayerId', guestPlayerId);
    }
    if (returnTo) {
      params.set('returnTo', returnTo);
    }
    const queryString = params.toString();
    return `${API_BASE}/auth/google${queryString ? `?${queryString}` : ''}`;
  }
};
