import { Router } from 'express';
import { listPublicRooms, getRoomByCode } from '../controllers/roomController.js';

const router = Router();

router.get('/', listPublicRooms);
router.get('/:code', getRoomByCode);

export default router;
