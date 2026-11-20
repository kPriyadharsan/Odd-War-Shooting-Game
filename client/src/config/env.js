/**
 * Client Configuration & Environment Variables
 * Supports same-origin proxy architecture (Vite dev proxy and Vercel production rewrites).
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'),
  isDev: import.meta.env.DEV
};
