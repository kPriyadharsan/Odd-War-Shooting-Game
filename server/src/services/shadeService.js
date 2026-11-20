/**
 * ODD WAR Territory Shade Assignment Service
 *
 * Requirements:
 * - 5 primary color families: RED, GREEN, BLUE, YELLOW, BLACK
 * - Each family has 4 distinct shades.
 * - When multiple players select the same family in a room, assign distinct shades.
 * - No duplicate exact shade within a room.
 * - Reassign safely when a player leaves.
 * - Preserve assigned shade during ordinary reconnects.
 */

export const SHADE_FAMILIES = {
  RED: [
    { id: 'medium-red', name: 'Medium Red', hex: '#CE4242', isPrimary: true },
    { id: 'dark-red', name: 'Dark Red', hex: '#8A1F1F' },
    { id: 'light-red', name: 'Light Red', hex: '#E56F6F' },
    { id: 'muted-red', name: 'Muted Red', hex: '#F4A5A5' }
  ],
  GREEN: [
    { id: 'medium-green', name: 'Chalk Green', hex: '#2E8557', isPrimary: true },
    { id: 'dark-green', name: 'Forest Green', hex: '#1C5236' },
    { id: 'light-green', name: 'Sage Green', hex: '#48A874' },
    { id: 'muted-green', name: 'Mint Green', hex: '#85CCA5' }
  ],
  BLUE: [
    { id: 'medium-blue', name: 'Blue Ink', hex: '#2B68B4', isPrimary: true },
    { id: 'dark-blue', name: 'Navy Blue', hex: '#1A4375' },
    { id: 'light-blue', name: 'Sky Blue', hex: '#558FD6' },
    { id: 'muted-blue', name: 'Pale Blue', hex: '#98BFEC' }
  ],
  YELLOW: [
    { id: 'medium-yellow', name: 'Pencil Yellow', hex: '#D59926', isPrimary: true },
    { id: 'dark-yellow', name: 'Mustard', hex: '#8C6314' },
    { id: 'light-yellow', name: 'Warm Amber', hex: '#E4B55C' },
    { id: 'muted-yellow', name: 'Pastel Yellow', hex: '#F2D396' }
  ],
  BLACK: [
    { id: 'graphite-black', name: 'Graphite', hex: '#23252A', isPrimary: true },
    { id: 'pitch-black', name: 'Ink Black', hex: '#111215' },
    { id: 'pencil-grey', name: 'Pencil Grey', hex: '#5C6069' },
    { id: 'light-pencil', name: 'Light Lead', hex: '#8E949F' }
  ]
};

export class ShadeService {
  /**
   * Assigns an available shade within a color family for a new player in a room.
   *
   * @param {Array} existingPlayers - Players already in the room
   * @param {string} colorFamily - Preferred primary color (e.g. 'BLUE', 'RED')
   * @param {string} playerId - The joining player's unique identifier
   * @returns {Object} { id, name, hex, isPrimary }
   */
  static assignShade(existingPlayers = [], colorFamily = 'BLUE', playerId = null) {
    const familyKey = (colorFamily || 'BLUE').toUpperCase();
    const familyShades = SHADE_FAMILIES[familyKey] || SHADE_FAMILIES.BLUE;

    // If player is already in the room and already has an assigned shade in this family, preserve it
    if (playerId) {
      const existing = existingPlayers.find((p) => p.playerId === playerId);
      if (existing && existing.assignedShade && existing.primaryColor === familyKey) {
        return existing.assignedShade;
      }
    }

    // Collect shades currently occupied by other players in the same color family
    const occupiedShadeIds = new Set(
      existingPlayers
        .filter((p) => p.playerId !== playerId && p.primaryColor === familyKey && p.assignedShade)
        .map((p) => p.assignedShade.id)
    );

    // Pick first available shade in order (Primary first, then dark, light, muted)
    const availableShade = familyShades.find((shade) => !occupiedShadeIds.has(shade.id));

    // Fallback if somehow all 4 occupied (should not happen since maxPlayers <= 4)
    return availableShade || familyShades[0];
  }
}
