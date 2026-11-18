/**
 * ODD WARS Authoritative Game Rules Configuration (Task 11)
 *
 * Centralizes all configurable mechanics:
 * - Construction progression requirements
 * - Ammunition capacity and firing prerequisites
 * - Turn timing and NO ACTION policies
 * - Disconnect grace periods
 */
export const GAME_RULES_CONFIG = {
  // Required successful book results to complete each character stage
  // Default: exactly 1 successful book landing per stage
  stageRequirements: {
    HEAD: 1,
    BODY: 1,
    GUN: 1,
    BULLET: 1
  },

  // Authoritative construction sequence
  constructionSequence: ['HEAD', 'BODY', 'GUN', 'BULLET'],

  // Ammunition rules:
  // - 3 bullet slots per row station
  maxAmmunitionSlots: 3,

  // Whether a warrior with HEAD+BODY+GUN can fire before all 3 bullets are loaded
  // (e.g. true: warrior can fire as long as at least 1 bullet is loaded)
  allowAttackWithPartialAmmunition: true,

  // Number of bullets consumed per shot (standard: 1)
  bulletsConsumedPerShot: 1,

  // Action policy when the book draws an even digit (NO ACTION):
  // - 'AUTO_ADVANCE': Authoritative server immediately records NO ACTION in history and advances to next player
  // - 'MANUAL_FINISH': Player must acknowledge NO ACTION before turn advances
  noActionPolicy: 'AUTO_ADVANCE',

  // Policy when book draws an odd digit corresponding to an already-eliminated row:
  // - 'AUTO_ADVANCE': Immediately records ROW_ELIMINATED NO ACTION in history and advances turn
  eliminatedRowPolicy: 'AUTO_ADVANCE',

  // Disconnect grace period in milliseconds before offline player is penalized/removed
  disconnectGracePeriodMs: 60000, // 60 seconds

  // Optional turn action timeout in milliseconds (0 = no timeout)
  turnTimeoutMs: 0
};
