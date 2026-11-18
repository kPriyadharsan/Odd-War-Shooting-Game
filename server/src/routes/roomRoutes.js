import { Router } from 'express';
import {
  createPublicRoom,
  createPrivateRoom,
  listPublicRooms,
  getRoomByCode,
  joinRoom,
  leaveRoom
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

export default router;
