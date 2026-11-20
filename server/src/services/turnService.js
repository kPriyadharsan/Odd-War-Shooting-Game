import { GAME_RULES_CONFIG } from '../config/gameRulesConfig.js';
import { TERRITORY_ROWS, ROOM_STATUS, NOTEBOOK_PAPER_STYLES } from '../models/Room.js';
import { logger } from '../utils/logger.js';

/**
 * Authoritative Turn Order & Match Lifecycle Service (Task 11)
 *
 * Responsibilities:
 * - Deterministic turn order initialization
 * - Turn state tracking & concurrency protection (turnId, turnPhase)
 * - Authoritative action eligibility evaluation (frontend never decides)
 * - Round-robin turn rotation skipping eliminated players
 * - Turn history recording in school notebook format
 * - Match victory and lifecycle transitions
 */
export const TurnService = {
  /**
   * Initializes deterministic turn order when a match begins.
   * Sorts players by their assigned slotIndex (0, 1, 2, 3) or joining order.
   */
  initializeMatchTurns: (room) => {
    // Deterministic ordering by slotIndex
    const sortedPlayers = [...room.players].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
    const turnOrder = sortedPlayers.map((p) => p.playerId);

    const firstPlayerId = turnOrder[0];
    const firstPlayer = room.players.find((p) => p.playerId === firstPlayerId) || room.players[0];

    const turnId = `turn_1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!room.gameState) room.gameState = {};

    // Select a deterministic random paper style for this match if not yet chosen
    if (!room.gameState.paperStyle && !room.paperStyle) {
      const styles = NOTEBOOK_PAPER_STYLES && NOTEBOOK_PAPER_STYLES.length > 0
        ? NOTEBOOK_PAPER_STYLES
        : ['classic-blue', 'cream-faded', 'red-margin-vintage', 'yellowed-grey', 'narrow-ruled', 'double-margin-aged'];
      const chosen = styles[Math.floor(Math.random() * styles.length)];
      room.gameState.paperStyle = chosen;
      room.paperStyle = chosen;
    } else if (room.paperStyle && !room.gameState.paperStyle) {
      room.gameState.paperStyle = room.paperStyle;
    }

    room.gameState.turnOrder = turnOrder;
    room.gameState.turnNumber = 1;
    room.gameState.activePlayerIndex = room.players.findIndex((p) => p.playerId === firstPlayerId);
    room.gameState.activePlayerId = firstPlayerId;
    room.gameState.turnPhase = 'AWAITING_BOOK'; // 'AWAITING_BOOK' | 'AWAITING_ACTION' | 'RESOLVED'
    room.gameState.isBookFlipping = false;
    room.gameState.lastFlip = null;

    room.gameState.currentTurn = {
      turnId,
      turnNumber: 1,
      playerId: firstPlayerId,
      playerNickname: firstPlayer.nickname,
      phase: 'AWAITING_BOOK',
      bookOutcome: null,
      eligibleAction: null,
      startedAt: new Date().toISOString()
    };

    if (!Array.isArray(room.gameState.history)) {
      room.gameState.history = [];
    }
    if (!Array.isArray(room.gameState.combatLog)) {
      room.gameState.combatLog = [];
    }

    logger.info(
      `[TurnService] Match turns initialized for room ${room.code}. Order: [${turnOrder.join(
        ', '
      )}]. Active: ${firstPlayer.nickname}`
    );

    return room.gameState.currentTurn;
  },

  /**
   * Authoritatively evaluates eligible action based on book page draw and target row state.
   * Frontend never decides what action a player is allowed to take.
   */
  determineEligibleAction: (player, targetRow, isOdd) => {
    // 1. Even page draw = NO ACTION
    if (!isOdd || targetRow === null || targetRow === undefined) {
      return {
        type: 'NO_ACTION',
        reason: 'EVEN_PAGE',
        targetRow: null,
        description: 'Even page drawn: No Action permitted this turn.'
      };
    }

    const rowNum = parseInt(targetRow, 10);
    if (!TERRITORY_ROWS.includes(rowNum)) {
      return {
        type: 'NO_ACTION',
        reason: 'INVALID_ROW',
        targetRow: rowNum,
        description: `Station ${rowNum} is not a valid odd station.`
      };
    }

    const rowState = player.territory?.rowStates?.find((r) => r.rowNumber === rowNum);
    if (!rowState) {
      return {
        type: 'NO_ACTION',
        reason: 'ROW_NOT_FOUND',
        targetRow: rowNum,
        description: `Row station ${rowNum} not found on player territory.`
      };
    }

    // 2. Row already eliminated = NO ACTION
    if (rowState.isEliminated || rowState.status === 'ELIMINATED') {
      return {
        type: 'NO_ACTION',
        reason: 'ROW_ELIMINATED',
        targetRow: rowNum,
        description: `Station ${rowNum} has already been eliminated and cannot be activated.`
      };
    }

    // 3. Construction progression check: HEAD -> BODY -> GUN
    const drawings = rowState.drawings || {};
    if (!drawings.HEAD) {
      return {
        type: 'DRAW_CONSTRUCTION',
        targetRow: rowNum,
        stage: 'HEAD',
        canAttack: false,
        canDrawBullet: false,
        description: `Draw HEAD on Row ${rowNum}.`
      };
    }

    if (!drawings.BODY) {
      return {
        type: 'DRAW_CONSTRUCTION',
        targetRow: rowNum,
        stage: 'BODY',
        canAttack: false,
        canDrawBullet: false,
        description: `Draw BODY on Row ${rowNum}.`
      };
    }

    if (!drawings.GUN) {
      return {
        type: 'DRAW_CONSTRUCTION',
        targetRow: rowNum,
        stage: 'GUN',
        canAttack: false,
        canDrawBullet: false,
        description: `Draw GUN on Row ${rowNum}.`
      };
    }

    // 4. Warrior is Armed (HEAD + BODY + GUN completed).
    // Evaluate bullet slots and attack eligibility
    const bulletSlots = rowState.bullets || [];
    const emptySlotCount = bulletSlots.filter((b) => b.state === 'EMPTY').length;
    const loadedCount = rowState.bulletCount || bulletSlots.filter((b) => b.state === 'LOADED').length;
    const canAttack = GAME_RULES_CONFIG.allowAttackWithPartialAmmunition && loadedCount > 0;
    const canDrawBullet = emptySlotCount > 0;

    if (canDrawBullet && canAttack) {
      return {
        type: 'CHOICE_LOAD_OR_ATTACK',
        targetRow: rowNum,
        stage: 'BULLET',
        canDrawBullet: true,
        canAttack: true,
        bulletCount: loadedCount,
        emptySlotCount,
        description: `Row ${rowNum} warrior is armed! Load another bullet (${loadedCount}/3 loaded) or attack an opponent row.`
      };
    }

    if (canDrawBullet && !canAttack) {
      return {
        type: 'DRAW_BULLET',
        targetRow: rowNum,
        stage: 'BULLET',
        canDrawBullet: true,
        canAttack: false,
        bulletCount: 0,
        emptySlotCount,
        description: `Row ${rowNum} is out of ammo. Draw a bullet to reload.`
      };
    }

    if (!canDrawBullet && canAttack) {
      return {
        type: 'ATTACK',
        targetRow: rowNum,
        stage: null,
        canDrawBullet: false,
        canAttack: true,
        bulletCount: loadedCount,
        emptySlotCount: 0,
        description: `Row ${rowNum} is fully loaded (${loadedCount}/3). Choose an opponent row station to fire.`
      };
    }

    // Fallback if all 3 slots were FIRED and no reloads possible (or fully expended)
    return {
      type: 'NO_ACTION',
      reason: 'AMMUNITION_EXHAUSTED',
      targetRow: rowNum,
      description: `Row ${rowNum} has expended all ammunition.`
    };
  },

  /**
   * Appends an authoritative turn record to the notebook match history.
   */
  recordTurnHistory: (room, entry) => {
    if (!room.gameState) room.gameState = {};
    if (!Array.isArray(room.gameState.history)) {
      room.gameState.history = [];
    }

    const historyRecord = {
      turnNumber: entry.turnNumber || room.gameState.turnNumber || 1,
      turnId: entry.turnId || `turn_${Date.now()}`,
      playerId: entry.playerId,
      nickname: entry.nickname || 'Warrior',
      pageNumber: entry.pageNumber ?? null,
      targetRow: entry.targetRow ?? null,
      isOdd: entry.isOdd ?? false,
      actionType: entry.actionType || 'NO_ACTION', // 'NO_ACTION' | 'DRAW' | 'ATTACK' | 'PASS'
      stage: entry.stage || null,
      attackDetails: entry.attackDetails || null,
      description: entry.description || '',
      timestamp: new Date().toISOString()
    };

    room.gameState.history.unshift(historyRecord);
    if (room.gameState.history.length > 50) {
      room.gameState.history = room.gameState.history.slice(0, 50);
    }

    return historyRecord;
  },

  /**
   * Advances turn to the next eligible player in deterministic round-robin order.
   * Automatically skips eliminated players.
   * Evaluates victory if only 1 player remains.
   */
  advanceToNextTurn: (room) => {
    // 1. If match already finished, do not advance
    if (room.status === ROOM_STATUS.FINISHED || room.status === ROOM_STATUS.CANCELLED) {
      return null;
    }

    // 2. Filter remaining alive players
    const alivePlayers = room.players.filter((p) => !p.isEliminated);

    // 3. Victory check: if 1 or 0 players remain, declare match finished
    if (alivePlayers.length <= 1) {
      room.status = ROOM_STATUS.FINISHED;
      if (alivePlayers.length === 1) {
        room.gameState.winnerId = alivePlayers[0].playerId;
        room.gameState.winnerNickname = alivePlayers[0].nickname;
        logger.info(
          `[TurnService] MATCH FINISHED in room ${room.code}! Single survivor: ${alivePlayers[0].nickname}`
        );
      } else {
        room.gameState.winnerId = 'TIE';
        room.gameState.winnerNickname = 'Tie';
      }
      return null;
    }

    // 4. Deterministic Round-Robin Turn Order
    const turnOrder = room.gameState.turnOrder && room.gameState.turnOrder.length === room.players.length
      ? room.gameState.turnOrder
      : room.players.map((p) => p.playerId);

    const currentActiveId = room.gameState.activePlayerId;
    const currentOrderIdx = turnOrder.indexOf(currentActiveId);
    const startIdx = currentOrderIdx >= 0 ? currentOrderIdx : 0;

    let nextOrderIdx = (startIdx + 1) % turnOrder.length;
    let attempts = 0;

    // Skip eliminated players
    while (attempts < turnOrder.length) {
      const candidateId = turnOrder[nextOrderIdx];
      const candidatePlayer = room.players.find((p) => p.playerId === candidateId);
      if (candidatePlayer && !candidatePlayer.isEliminated) {
        break;
      }
      nextOrderIdx = (nextOrderIdx + 1) % turnOrder.length;
      attempts++;
    }

    const nextPlayerId = turnOrder[nextOrderIdx];
    const nextPlayer = room.players.find((p) => p.playerId === nextPlayerId);
    const nextTurnNumber = (room.gameState.turnNumber || 1) + 1;
    const nextTurnId = `turn_${nextTurnNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Update Room Game State
    room.gameState.activePlayerId = nextPlayerId;
    room.gameState.activePlayerIndex = room.players.findIndex((p) => p.playerId === nextPlayerId);
    room.gameState.turnNumber = nextTurnNumber;
    room.gameState.turnPhase = 'AWAITING_BOOK';
    room.gameState.isBookFlipping = false;
    room.gameState.selectedTarget = null;

    const newTurn = {
      turnId: nextTurnId,
      turnNumber: nextTurnNumber,
      playerId: nextPlayerId,
      playerNickname: nextPlayer?.nickname || 'Warrior',
      phase: 'AWAITING_BOOK',
      bookOutcome: null,
      eligibleAction: null,
      startedAt: new Date().toISOString()
    };

    room.gameState.currentTurn = newTurn;

    logger.info(
      `[TurnService] Turn advanced in room ${room.code}: Turn #${nextTurnNumber} -> ${nextPlayer?.nickname} (${nextPlayerId})`
    );

    return newTurn;
  }
};
