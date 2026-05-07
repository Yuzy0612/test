import { Router } from 'express';
import { getModels, publishModel, rollbackModel, getModelErrorAnalysis } from '../controllers/modelController.js';

const router = Router();

router.get('/', getModels);
router.post('/:modelId/publish', publishModel);
router.post('/:modelId/rollback', rollbackModel);
router.get('/error-analysis', getModelErrorAnalysis);

export default router;
