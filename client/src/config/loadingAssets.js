/**
 * ODD WAR Cinematic Loading Screen — Centralized Asset Registry
 *
 * Reserved image path: client/src/assets/loading/odd-war-cover.jpg
 * As specified in requirements:
 * - This path is reserved for the user's GTA V-inspired vertical cover artwork.
 * - Centralized reference so it can be updated or resolved from a single location.
 */

export const LOADING_ASSETS = {
  // Reserved relative asset path for user's vertical cover artwork
  coverArtworkPath: '/src/assets/loading/odd-war-cover.jpg',
  // Optional secondary fallback path if served from public directory
  publicCoverArtworkPath: '/odd-war-cover.jpg',
};

export default LOADING_ASSETS;
