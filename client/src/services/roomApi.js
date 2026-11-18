import { config } from '../config/env.js';

const API_BASE = `${config.apiUrl}/rooms`;

/**
 * REST Client for ODD WARS Room Management
 */
export const roomApi = {
  createPublicRoom: async ({ name, maxPlayers = 4, player }) => {
    const res = await fetch(`${API_BASE}/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, maxPlayers, player })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create public room');
    return data.data.room;
  },

  createPrivateRoom: async ({ name, password, maxPlayers = 4, player }) => {
    const res = await fetch(`${API_BASE}/private`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, maxPlayers, player })
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
  }
};
