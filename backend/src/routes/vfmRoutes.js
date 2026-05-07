import { Router } from 'express';
import { getWellRealtime, queryWellsRealtime, getWellHistory } from '../controllers/vfmController.js';

const router = Router();

router.get('/realtime/:wellId', getWellRealtime);
router.post('/realtime/batch', queryWellsRealtime);
router.get('/history/:wellId', getWellHistory);

export default router;
