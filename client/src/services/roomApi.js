import { config } from '../config/env.js';

const API_BASE = `${config.apiUrl}/rooms`;

/**
 * REST Client for ODD WARS Room Management
 */
export const roomApi = {
  createPublicRoom: async ({ name, maxPlayers = 4, bookPageCount = 100, player }) => {
    const res = await fetch(`${API_BASE}/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, maxPlayers, bookPageCount, player })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create public room');
    return data.data.room;
  },

  createPrivateRoom: async ({ name, password, maxPlayers = 4, bookPageCount = 100, player }) => {
    const res = await fetch(`${API_BASE}/private`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, maxPlayers, bookPageCount, player })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create private room');
    return data.data.room;
  },

  listPublicRooms: async () => {
    const res = await fetch(`${API_BASE}/public`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch public rooms');
    return data.data.rooms || [];
  },

  getRoomByCode: async (code) => {
    const res = await fetch(`${API_BASE}/${code}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Room not found');
    return data.data.room;
  },

  joinRoom: async ({ code, password, player }) => {
    const res = await fetch(`${API_BASE}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, password, player })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to join room');
    return data.data.room;
  },

  leaveRoom: async ({ code, playerId }) => {
    const res = await fetch(`${API_BASE}/${code}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to leave room');
    return data.data;
  },

  updateRoomSettings: async ({ code, hostPlayerId, settings }) => {
    const res = await fetch(`${API_BASE}/${code}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostPlayerId, settings })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update room settings');
    return data.data.room;
  },

  setPlayerReady: async ({ code, playerId, isReady }) => {
    const res = await fetch(`${API_BASE}/${code}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, isReady })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update ready state');
    return data.data;
  },

  kickPlayer: async ({ code, hostPlayerId, targetPlayerId }) => {
    const res = await fetch(`${API_BASE}/${code}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostPlayerId, targetPlayerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to kick player');
    return data.data;
  },

  startMatch: async ({ code, hostPlayerId }) => {
    const res = await fetch(`${API_BASE}/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostPlayerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to start match');
    return data.data.room;
  },

  openBook: async ({ code, playerId, requestId }) => {
    const res = await fetch(`${API_BASE}/${code}/book/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, requestId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to open magical book');
    return data.data;
  },

  submitDrawing: async ({ code, playerId, rowNumber, stage, strokeData }) => {
    const res = await fetch(`${API_BASE}/${code}/drawings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, rowNumber, stage, strokeData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit drawing');
    return data.data;
  },

  selectCombatTarget: async ({ code, playerId, attackerRow, targetPlayerId, targetRow }) => {
    const res = await fetch(`${API_BASE}/${code}/combat/target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, attackerRow, targetPlayerId, targetRow })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to select target');
    return data.data;
  },

  fireCombatShot: async ({ code, playerId, attackerRow, targetPlayerId, targetRow, actionId }) => {
    const res = await fetch(`${API_BASE}/${code}/combat/fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, attackerRow, targetPlayerId, targetRow, actionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fire shot');
    return data.data;
  }
};
