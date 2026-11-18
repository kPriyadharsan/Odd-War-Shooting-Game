import { useState } from 'react';

/**
 * Game State Store Foundation
 * Prepares the client for user profile, room state, and game sync.
 */
export const initialGameState = {
  user: null,
  currentRoom: null,
  activeMatch: null,
  isInQueue: false
};
