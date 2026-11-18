/**
 * ODD WARS Battlefield State & Types (Task 07)
 * Defines the structural row placeholders, row identifiers (1, 3, 5, 7, 9),
 * and territory layout helpers for the notebook battlefield.
 */

export const TERRITORY_ROWS = [1, 3, 5, 7, 9];

/**
 * Structural character state placeholders for future gameplay integration.
 */
export const ROW_STATUS = {
  EMPTY: 'EMPTY',
  HEAD_DRAWN: 'HEAD_DRAWN',
  BODY_DRAWN: 'BODY_DRAWN',
  GUN_DRAWN: 'GUN_DRAWN',
  BULLETS_LOADED: 'BULLETS_LOADED',
  ELIMINATED: 'ELIMINATED'
};

/**
 * Human-readable labels and pencil descriptions for row states
 */
export const ROW_STATUS_META = {
  [ROW_STATUS.EMPTY]: {
    label: 'Empty Station',
    shortLabel: 'Empty',
    description: 'Blank paper position ready for character sketch.',
    badgeClass: 'text-[#8C929D] bg-black/5 border-dashed border-[#8C929D]/40'
  },
  [ROW_STATUS.HEAD_DRAWN]: {
    label: 'Head Drawn',
    shortLabel: 'Head',
    description: 'Warrior head sketched on paper.',
    badgeClass: 'text-[#2B68B4] bg-[#2B68B4]/10 border-[#2B68B4]/30'
  },
  [ROW_STATUS.BODY_DRAWN]: {
    label: 'Body Drawn',
    shortLabel: 'Body',
    description: 'Warrior torso & limbs sketched.',
    badgeClass: 'text-[#2B68B4] bg-[#2B68B4]/10 border-[#2B68B4]/30'
  },
  [ROW_STATUS.GUN_DRAWN]: {
    label: 'Gun Armed',
    shortLabel: 'Gun',
    description: 'Paper gun drawn and ready to load.',
    badgeClass: 'text-[#D59926] bg-[#D59926]/10 border-[#D59926]/30'
  },
  [ROW_STATUS.BULLETS_LOADED]: {
    label: 'Ammunition Ready',
    shortLabel: 'Loaded',
    description: 'Pencil bullets loaded in magazine.',
    badgeClass: 'text-[#2E8557] bg-[#2E8557]/10 border-[#2E8557]/30'
  },
  [ROW_STATUS.ELIMINATED]: {
    label: 'Eliminated',
    shortLabel: 'Defeated',
    description: 'Station crossed out with pencil strike.',
    badgeClass: 'text-[#CE4242] bg-[#CE4242]/10 border-[#CE4242]/30 line-through'
  }
};

/**
 * Creates initial row state for a player's territory
 */
export const createInitialRowState = (rowNumber) => ({
  rowNumber,
  status: ROW_STATUS.EMPTY,
  characterParts: {
    head: false,
    body: false,
    gun: false
  },
  bulletCount: 0,
  isEliminated: false,
  customDrawing: null
});

/**
 * Creates a complete initial territory structure for a player
 */
export const createInitialPlayerTerritory = (player) => ({
  playerId: player.playerId,
  nickname: player.nickname,
  primaryColor: player.primaryColor || 'BLUE',
  assignedShade: player.assignedShade || { hex: '#2B68B4', name: 'Blue Ink' },
  slotIndex: player.slotIndex ?? 0,
  isHost: Boolean(player.isHost),
  rows: TERRITORY_ROWS.map((rowNum) => createInitialRowState(rowNum))
});

/**
 * Calculates mathematically exact column widths for the 45% / 55% battlefield layout.
 *
 * Rules:
 * - Own territory ALWAYS on the left: exactly 45% width.
 * - Remaining 55% is distributed evenly among opponents:
 *   - 1 opponent: 100% of 55% = 55% (total 45% + 55% = 100%)
 *   - 2 opponents: 50% of 55% = 27.5% each (total 45% + 27.5% + 27.5% = 100%)
 *   - 3 opponents: 33.333% of 55% = 18.333% each (total 45% + 18.333% * 3 = 100%)
 */
export const calculateBattlefieldProportions = (opponentCount) => {
  const OWN_PERCENT = 45;
  const OPPONENTS_TOTAL_PERCENT = 55;

  const validOpponentCount = Math.max(1, Math.min(opponentCount, 3));
  const opponentPercent = OPPONENTS_TOTAL_PERCENT / validOpponentCount;

  return {
    ownWidthPercent: OWN_PERCENT,
    opponentsTotalPercent: OPPONENTS_TOTAL_PERCENT,
    perOpponentPercent: opponentPercent,
    // CSS Grid column template string
    gridTemplateColumns: `${OWN_PERCENT}% ${Array(validOpponentCount).fill(`${opponentPercent}%`).join(' ')}`
  };
};
