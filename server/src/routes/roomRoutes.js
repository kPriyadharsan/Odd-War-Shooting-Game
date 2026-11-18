import { Router } from 'express';
import {
  createPublicRoom,
  createPrivateRoom,
  listPublicRooms,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  kickPlayer,
  startMatch,
  openRoomBook,
  submitRowDrawing,
  selectCombatTarget,
  fireCombatShot,
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

// Waiting Room & Multiplayer Controls (Task 06)
router.post('/:code/ready', setPlayerReady);
router.post('/:code/kick', kickPlayer);
router.post('/:code/start', startMatch);

// Magical Book & Turn Engine (Task 08)
router.post('/:code/book/open', openRoomBook);

// Manual Character Drawing Engine (Task 09)
router.post('/:code/drawings', submitRowDrawing);

// Combat Engine, Shooting & Row Elimination (Task 10)
router.post('/:code/combat/target', selectCombatTarget);
router.post('/:code/combat/fire', fireCombatShot);

// Host settings & Book Engine compatibility
router.patch('/:code/settings', updateRoomSettings);
router.post('/:code/draw-page', drawRoomBookPage);

export default router;
