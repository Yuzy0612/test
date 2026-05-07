import { Router } from 'express';
import { getCalibrationRecords, importCalibrationData, qualityCheck } from '../controllers/calibrationController.js';

const router = Router();

router.get('/', getCalibrationRecords);
router.post('/import', importCalibrationData);
router.post('/quality-check', qualityCheck);

export default router;
