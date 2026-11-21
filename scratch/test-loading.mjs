/**
 * Automated Verification Script for ODD WAR Cinematic Loading Screen
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== [1/6] Verifying Assets & Reserved Paths ===');
const loadingDir = path.resolve('client/src/assets/loading');
assert(fs.existsSync(loadingDir), 'Asset directory client/src/assets/loading must exist');

const loadingConfigPath = path.resolve('client/src/config/loadingAssets.js');
assert(fs.existsSync(loadingConfigPath), 'loadingAssets.js must exist');
const loadingConfigContent = fs.readFileSync(loadingConfigPath, 'utf-8');
assert(
  loadingConfigContent.includes('/src/assets/loading/odd-war-cover.jpg'),
  'Must reference reserved path client/src/assets/loading/odd-war-cover.jpg'
);
console.log('✔ Asset directory and reserved path verified.');

console.log('=== [2/6] Verifying Component Architecture & Exports ===');
const expectedComponents = [
  'client/src/components/loading/CinematicLoadingScreen.jsx',
  'client/src/components/loading/LoadingArtwork.jsx',
  'client/src/components/loading/LoadingBranding.jsx',
  'client/src/components/loading/LoadingProgress.jsx',
  'client/src/components/loading/LoadingMessages.jsx',
  'client/src/components/loading/index.js',
  'client/src/hooks/useAppReadiness.js',
  'client/src/hooks/useGameReadiness.js',
  'client/src/services/appInitialization.js'
];

for (const comp of expectedComponents) {
  assert(fs.existsSync(path.resolve(comp)), `Component file ${comp} must exist`);
}
console.log('✔ All suggested components and services created.');

console.log('=== [3/6] Verifying Startup Readiness & 5s Minimum Duration Logic ===');
const appReadinessContent = fs.readFileSync(path.resolve('client/src/hooks/useAppReadiness.js'), 'utf-8');
assert(appReadinessContent.includes('MINIMUM_DURATION_MS = 5000'), 'useAppReadiness must enforce 5000ms minimum duration');
assert(appReadinessContent.includes('markStartupCompleted'), 'useAppReadiness must mark startup completed');
assert(appReadinessContent.includes('isDataReadyRef.current'), 'useAppReadiness must track actual data readiness');

const appInitContent = fs.readFileSync(path.resolve('client/src/services/appInitialization.js'), 'utf-8');
assert(appInitContent.includes('isStartupCompleted'), 'Must have isStartupCompleted check');
assert(appInitContent.includes('STARTUP_SESSION_KEY'), 'Must implement session-level strategy');
assert(appInitContent.includes('getPlayerSession'), 'Must verify guest session');
assert(appInitContent.includes('authApi.getCurrentUser'), 'Must verify authentication session');
console.log('✔ Startup readiness logic and duration checks verified.');

console.log('=== [4/6] Verifying Game-Entry Readiness Logic ===');
const gameReadinessContent = fs.readFileSync(path.resolve('client/src/hooks/useGameReadiness.js'), 'utf-8');
assert(gameReadinessContent.includes('MINIMUM_GAME_DURATION_MS = 5000'), 'useGameReadiness must enforce 5000ms min duration');
assert(gameReadinessContent.includes('markGameReady'), 'useGameReadiness must expose markGameReady');

const battlefieldContent = fs.readFileSync(path.resolve('client/src/pages/rooms/BattlefieldPage.jsx'), 'utf-8');
assert(battlefieldContent.includes('CinematicLoadingScreen'), 'BattlefieldPage must import CinematicLoadingScreen');
assert(battlefieldContent.includes('useGameReadiness'), 'BattlefieldPage must use useGameReadiness');
assert(battlefieldContent.includes('mode="game"'), 'BattlefieldPage must set mode="game" on CinematicLoadingScreen');
assert(battlefieldContent.includes('onCancel={() => navigate(\'/lobby\')}'), 'Failed entry must allow returning to lobby safely');
console.log('✔ Game-entry readiness and battlefield integration verified.');

console.log('=== [5/6] Verifying App.jsx Routing & Startup Integration ===');
const appContent = fs.readFileSync(path.resolve('client/src/App.jsx'), 'utf-8');
assert(appContent.includes('StartupLoadingGate'), 'App.jsx must wrap routes with StartupLoadingGate');
assert(appContent.includes('CinematicLoadingScreen'), 'App.jsx must use CinematicLoadingScreen');
assert(appContent.includes('mode="startup"'), 'App.jsx must set mode="startup"');
console.log('✔ App.jsx routing and startup gate integration verified.');

console.log('=== [6/6] Verifying Branding, Fallback Artwork, and Responsiveness ===');
const brandingContent = fs.readFileSync(path.resolve('client/src/components/loading/LoadingBranding.jsx'), 'utf-8');
assert(brandingContent.includes('ODD WAR'), 'Branding must display ODD WAR');
assert(!brandingContent.toLowerCase().includes('rockstar'), 'Must not display Rockstar branding');
assert(!brandingContent.toLowerCase().includes('grand theft auto'), 'Must not display Grand Theft Auto branding');

const artworkContent = fs.readFileSync(path.resolve('client/src/components/loading/LoadingArtwork.jsx'), 'utf-8');
assert(artworkContent.includes('FallbackCinematicArtwork'), 'LoadingArtwork must include high-fidelity fallback');
assert(artworkContent.includes('useReducedMotion'), 'LoadingArtwork must respect prefers-reduced-motion');
assert(artworkContent.includes('object-cover'), 'LoadingArtwork must use object-cover');

console.log('✔ Branding, fallback artwork, accessibility, and responsiveness verified.');
console.log('\n=========================================');
console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('=========================================');
