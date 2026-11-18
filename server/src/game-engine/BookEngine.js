import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Server-Authoritative Book Engine (Task 08)
 *
 * Implements the signature ODD WARS school notebook random page flip mechanic:
 * - Uses the room's host-configured bookPageCount (100 or 200 pages).
 * - Generates random page numbers cryptographically on the server using crypto.randomInt.
 * - Extracts final digit (pageNumber % 10).
 * - Maps odd digits (1, 3, 5, 7, 9) to rows 1, 3, 5, 7, 9.
 * - Maps even digits (0, 2, 4, 6, 8) to NO ACTION.
 * - Protects against client manipulation: clients can never supply random outcomes.
 */

export const VALID_PAGE_COUNTS = [100, 200];
export const ODD_ROWS = [1, 3, 5, 7, 9];
export const EVEN_DIGITS = [0, 2, 4, 6, 8];

export class BookEngine {
  /**
   * Validates if a page count is supported (100 or 200).
   */
  static isValidPageCount(count) {
    const num = parseInt(count, 10);
    return VALID_PAGE_COUNTS.includes(num);
  }

  /**
   * Server-authoritatively flips a random book page using cryptographically secure RNG.
   *
   * @param {number} bookPageCount - Configured pages (100 or 200)
   * @param {string} playerId - Identifier of the active drawing player
   * @param {string} nickname - Nickname of the active drawing player
   * @param {number} turnNumber - Current game turn number
   * @returns {Object} Draw outcome with page, final digit, row mapping, and action status
   */
  static drawPage(bookPageCount = 100, playerId = null, nickname = 'Warrior', turnNumber = 1) {
    const maxPages = VALID_PAGE_COUNTS.includes(Number(bookPageCount))
      ? Number(bookPageCount)
      : 100;

    // Cryptographically secure random integer generation [1..maxPages] inclusive
    // crypto.randomInt(min, maxExclusive)
    const pageNumber = crypto.randomInt(1, maxPages + 1);

    const finalDigit = pageNumber % 10;
    const isOdd = ODD_ROWS.includes(finalDigit);

    const outcome = {
      turnNumber,
      playerId,
      nickname,
      maxPages,
      pageNumber,
      finalDigit,
      isOdd,
      targetRow: isOdd ? finalDigit : null,
      actionAllowed: isOdd,
      actionType: isOdd ? `ROW_${finalDigit}_ACTION` : 'NO_ACTION',
      actionLabel: isOdd ? `Row ${finalDigit} Action` : 'NO ACTION (Turn Passed)',
      timestamp: new Date().toISOString()
    };

    logger.info(
      `[BookEngine] Cryptographic draw: Page ${pageNumber}/${maxPages} (Final digit: ${finalDigit} -> ${outcome.actionLabel}) for ${nickname} (Turn ${turnNumber})`
    );

    return outcome;
  }
}
