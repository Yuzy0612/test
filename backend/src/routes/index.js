import { Router } from 'express';
import wellRoutes from './wellRoutes.js';
import vfmRoutes from './vfmRoutes.js';
import calibrationRoutes from './calibrationRoutes.js';
import modelRoutes from './modelRoutes.js';
import allocationRoutes from './allocationRoutes.js';
import reportRoutes from './reportRoutes.js';
import integrationRoutes from './integrationRoutes.js';

const router = Router();

router.use('/wells', wellRoutes);
router.use('/vfm', vfmRoutes);
router.use('/calibration', calibrationRoutes);
router.use('/models', modelRoutes);
router.use('/allocation', allocationRoutes);
router.use('/reports', reportRoutes);
router.use('/integration', integrationRoutes);

export default router;
