import { Router } from 'express';
import {
  createPublicRoom,
  createPrivateRoom,
  listPublicRooms,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  updateRoomSettings,
  drawRoomBookPage
} from '../controllers/roomController.js';

const router = Router();

// Public rooms
router.post('/public', createPublicRoom);
router.get('/public', listPublicRooms);

// Private rooms
router.post('/private', createPrivateRoom);

// Join & Leave
router.post('/join', joinRoom);
router.get('/:code', getRoomByCode);
router.post('/:code/leave', leaveRoom);

// Host settings & Book Engine compatibility
router.patch('/:code/settings', updateRoomSettings);
router.post('/:code/draw-page', drawRoomBookPage);

export default router;
