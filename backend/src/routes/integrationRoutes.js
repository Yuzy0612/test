import { Router } from 'express';
import { getIntegrationJobs, syncPIRealtimeData, syncPIHistoricalData, getSSOSyncStatus, triggerSSOSync, getIntegrationJobById, retryIntegrationJob } from '../controllers/integrationController.js';

const router = Router();

router.get('/', getIntegrationJobs);
router.get('/:jobId', getIntegrationJobById);
router.post('/pi/realtime', syncPIRealtimeData);
router.post('/pi/historical', syncPIHistoricalData);
router.get('/sso/status', getSSOSyncStatus);
router.post('/sso/sync', triggerSSOSync);
router.post('/:jobId/retry', retryIntegrationJob);

export default router;
