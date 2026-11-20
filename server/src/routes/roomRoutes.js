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
  passPlayerTurn,
  startRoomPlaying,
  updateRoomSettings,
  drawRoomBookPage
} from '../controllers/roomController.js';

const router = Router();

// Public rooms
router.post('/public', createPublicRoom);
router.get('/public', listPublicRooms);

// Private rooms
router.post('/private', createPrivateRoom);

// Collection root fallback endpoints (/api/rooms and /rooms)
router.post('/', (req, res, next) => {
  if (req.body?.isPrivate || req.body?.password) {
    return createPrivateRoom(req, res, next);
  }
  return createPublicRoom(req, res, next);
});
router.get('/', listPublicRooms);

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

// Turn Management & Match Lifecycle (Task 11)
router.post('/:code/turn/pass', passPlayerTurn);
router.post('/:code/play', startRoomPlaying);

// Host settings & Book Engine compatibility
router.patch('/:code/settings', updateRoomSettings);
router.post('/:code/draw-page', drawRoomBookPage);

export default router;
