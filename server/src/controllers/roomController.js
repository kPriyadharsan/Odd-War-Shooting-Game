import { sendSuccess } from '../utils/response.js';

/**
 * Room Controller Foundation
 * To be expanded in Task 02 with full room lifecycle & matchmaking.
 */
export const listPublicRooms = async (req, res) => {
  return sendSuccess(
    res,
    { rooms: [] },
    'Room management foundation ready. Live matchmaking scheduled for Task 02.'
  );
};

export const getRoomByCode = async (req, res) => {
  const { code } = req.params;
  return sendSuccess(res, { code }, `Room ${code} query foundation ready.`);
};
