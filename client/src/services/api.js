import { config } from '../config/env.js';

/**
 * Standard HTTP Fetch Client
 */
export const apiClient = {
  get: async (endpoint) => {
    const res = await fetch(`${config.apiUrl}${endpoint}`);
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  getHealth: async () => {
    // Health endpoint is mounted at /health and /api/health
    const url = config.apiUrl.replace(/\/api\/?$/, '') + '/health';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Health Check Failed: ${res.status}`);
    }
    return res.json();
  }
};
