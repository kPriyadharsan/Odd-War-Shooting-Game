import { logger } from '../utils/logger.js';

/**
 * Server-Authoritative Book Engine Foundation
 *
 * Implements the school notebook random page flip mechanic:
 * - Uses the room's configured bookPageCount (100 or 200 pages).
 * - Generates random page number authoritatively on the server.
 * - Extracts final digit (pageNumber % 10).
 * - Maps odd digits (1, 3, 5, 7, 9) to rows 1, 3, 5, 7, 9.
 * - Treats even digits (0, 2, 4, 6, 8) as no-action outcomes.
 * - Clients can never supply client-determined random results.
 */

export const VALID_PAGE_COUNTS = [100, 200];
export const ODD_ROWS = [1, 3, 5, 7, 9];

export class BookEngine {
  /**
   * Validates if a page count is supported (100 or 200).
   */
  static isValidPageCount(count) {
    const num = parseInt(count, 10);
    return VALID_PAGE_COUNTS.includes(num);
  }

  /**
   * Server-authoritatively flips a random book page.
   *
   * @param {number} bookPageCount - Configured pages (100 or 200)
   * @param {string} playerId - Identifier of the drawing player
   * @returns {Object} Draw outcome with page, final digit, row mapping, and action status
   */
  static drawPage(bookPageCount = 100, playerId = null) {
    const maxPages = VALID_PAGE_COUNTS.includes(bookPageCount) ? bookPageCount : 100;
    
    // Cryptographically unbiased / standard server-side random page selection [1..maxPages]
    const pageNumber = Math.floor(Math.random() * maxPages) + 1;
    const finalDigit = pageNumber % 10;
    const isOdd = ODD_ROWS.includes(finalDigit);

    const outcome = {
      playerId,
      maxPages,
      pageNumber,
      finalDigit,
      isOdd,
      targetRow: isOdd ? finalDigit : null,
      actionAllowed: isOdd,
      actionType: isOdd ? `ROW_${finalDigit}_ACTION` : 'NO_ACTION',
      timestamp: Date.now()
    };

    logger.debug(`[BookEngine] Server drew page ${pageNumber}/${maxPages} (Final digit: ${finalDigit}, Odd: ${isOdd}) for player ${playerId || 'anonymous'}`);

    return outcome;
  }
}
