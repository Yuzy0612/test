import { Router } from 'express';
import { getWells, getWellById, createWells, updateWell, deleteWell } from '../controllers/wellController.js';

const router = Router();

router.get('/', getWells);
router.get('/:wellId', getWellById);
router.post('/', createWells);
router.put('/:wellId', updateWell);
router.delete('/:wellId', deleteWell);

export default router;
